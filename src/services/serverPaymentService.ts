/**
 * Server-Side Payment Enforcement Service
 * Validates all payment checks against backend database
 * Cannot be bypassed by client-side manipulation
 *
 * This replaces client-side UsageTracker and PaymentService checks
 * ALL payment enforcement logic now runs on server
 */

export interface ServerSubscriptionStatus {
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
}

export interface CheckInAllowedResponse {
  allowed: boolean;
  reason: 'ok' | 'limit_reached' | 'payment_required';
  tier: 'starter' | 'professional' | 'enterprise';
  subscriptionActive: boolean;
  usage: {
    hosts: number;
    guests: number;
    total: number;
  };
  limits: {
    hosts: number;
    guests: number;
    total: number;
  };
}

export interface OperationCheckResponse {
  allowed: boolean;
  reason: 'ok' | 'limit_reached' | 'payment_required';
  operation: string;
  tier: 'starter' | 'professional' | 'enterprise';
  message: string;
}

export class ServerPaymentService {
  private static API_URL = import.meta.env.VITE_API_URL || '/api';

  /**
   * Check if user can perform an operation (check-in, add host, etc.)
   * BLOCKS operations if user has breached free limit
   *
   * Operations that are BLOCKED if over limit:
   * - 'checkin' - Cannot check in new guest
   * - 'add_host' - Cannot add new host
   * - 'edit_host' - Cannot edit host
   * - 'import_hosts' - Cannot import hosts
   *
   * Operations always ALLOWED (help reduce usage):
   * - 'checkout' - Can check out guests
   * - 'delete_host' - Can delete hosts
   * - 'delete_guest' - Can delete guests
   * - 'logout' - Can always logout
   */
  static async checkIfOperationAllowed(
    email: string,
    operation: 'checkin' | 'checkout' | 'add_host' | 'edit_host' | 'delete_host' | 'delete_guest' | 'view_logbook' | 'view_settings' | 'logout' | 'import_hosts',
    currentHostCount: number,
    currentGuestCount: number
  ): Promise<OperationCheckResponse> {
    try {
      const response = await fetch(`${this.API_URL}/check-operation-allowed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          operation,
          currentHostCount,
          currentGuestCount
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Operation check failed:', response.status);
        // Default to deny access if validation fails (safe)
        return {
          allowed: false,
          reason: 'payment_required',
          operation,
          tier: 'starter',
          message: 'Unable to verify if operation is allowed'
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Operation check error:', error);
      // Default to deny access on network error (safe)
      return {
        allowed: false,
        reason: 'payment_required',
        operation,
        tier: 'starter',
        message: 'Network error checking operation'
      };
    }
  }

  /**
   * Get user's subscription status from server
   * Cannot be bypassed by localStorage manipulation
   */
  static async getSubscriptionStatus(email: string): Promise<ServerSubscriptionStatus | null> {
    try {
      const url = new URL(`${this.API_URL}/subscription-status`, window.location.origin);
      url.searchParams.append('email', email);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to get subscription status:', response.status);
        // Default to starter tier if fetch fails (safe default)
        return {
          tier: 'starter',
          status: 'active',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          isActive: false
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription status error:', error);
      // Default to starter tier if network error (safe default)
      return {
        tier: 'starter',
        status: 'active',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        isActive: false
      };
    }
  }

  /**
   * Check if user can perform a check-in
   * Enforces limits on server side - no client bypass possible
   */
  static async checkIfCheckinAllowed(
    email: string,
    currentHostCount: number,
    currentGuestCount: number
  ): Promise<CheckInAllowedResponse> {
    try {
      const response = await fetch(`${this.API_URL}/check-checkin-allowed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          currentHostCount,
          currentGuestCount
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Check-in validation failed:', response.status);
        // Default to deny access if validation fails (safe default)
        return {
          allowed: false,
          reason: 'payment_required',
          tier: 'starter',
          subscriptionActive: false,
          usage: {
            hosts: currentHostCount,
            guests: currentGuestCount,
            total: currentHostCount + currentGuestCount
          },
          limits: {
            hosts: 20,
            guests: 20,
            total: 20
          }
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Check-in validation error:', error);
      // Default to deny access if network error (safe default)
      return {
        allowed: false,
        reason: 'payment_required',
        tier: 'starter',
        subscriptionActive: false,
        usage: {
          hosts: currentHostCount,
          guests: currentGuestCount,
          total: currentHostCount + currentGuestCount
        },
        limits: {
          hosts: 20,
          guests: 20,
          total: 20
        }
      };
    }
  }

  /**
   * Check if user is subscribed to a tier
   * Returns true only if server confirms active subscription
   */
  static async isSubscribedTo(email: string, tier: 'professional' | 'enterprise'): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus(email);
      if (!status) return false;

      // Check if user's tier is equal or higher than requested tier
      const tierHierarchy = ['starter', 'professional', 'enterprise'];
      const userTierIndex = tierHierarchy.indexOf(status.tier);
      const requiredTierIndex = tierHierarchy.indexOf(tier);

      return status.isActive && userTierIndex >= requiredTierIndex;
    } catch {
      return false;
    }
  }

  /**
   * Get current tier from server
   * Cannot be spoofed via localStorage
   */
  static async getCurrentTier(email: string): Promise<'starter' | 'professional' | 'enterprise'> {
    try {
      const status = await this.getSubscriptionStatus(email);
      return status?.tier ?? 'starter';
    } catch {
      return 'starter';
    }
  }

  /**
   * Log usage event on server for audit trail
   * Optional: called after successful check-in
   */
  static async logUsageEvent(
    email: string,
    eventType: 'host_added' | 'host_deleted' | 'guest_checkin' | 'guest_checkout',
    countAfter: number
  ): Promise<void> {
    try {
      await fetch(`${this.API_URL}/log-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          eventType,
          countAfter
        }),
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Usage logging failed (non-critical):', error);
      // Fail silently - logging is not blocking
    }
  }
}
