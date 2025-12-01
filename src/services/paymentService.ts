/**
 * Payment Service - Stripe Integration
 * Handles subscription checkout, session management, and payment processing
 */

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface SubscriptionStatus {
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export class PaymentService {
  private static STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  private static API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  /**
   * Create a Stripe Checkout Session
   * Redirects user to Stripe hosted checkout
   */
  static async createCheckoutSession(
    tierId: 'starter' | 'professional' | 'enterprise',
    billingCycle: 'month' | 'year'
  ): Promise<CheckoutSession> {
    try {
      // Determine the correct Stripe price ID based on tier and billing cycle
      const priceIdKey = this.getPriceIdKey(tierId, billingCycle);
      const priceId = this.getStripeEnvVar(priceIdKey);

      if (!priceId) {
        throw new Error(`Stripe price ID not configured for ${tierId} ${billingCycle}`);
      }

      // Call backend to create checkout session
      const response = await fetch(`${this.API_BASE_URL}/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId,
          tierId,
          billingCycle
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const session: CheckoutSession = await response.json();

      // Store checkout session ID in localStorage for recovery
      this.storeCheckoutSession(session.id);

      // Redirect to Stripe checkout
      if (session.url) {
        window.location.href = session.url;
      }

      return session;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }

  /**
   * Get subscription status for current user
   * Returns tier and subscription details
   */
  static async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscription-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No subscription found
        }
        throw new Error('Failed to fetch subscription status');
      }

      const status: SubscriptionStatus = await response.json();
      return status;
    } catch (error) {
      console.error('Subscription status error:', error);
      return null;
    }
  }

  /**
   * Cancel subscription (end of period)
   */
  static async cancelSubscription(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return true;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return false;
    }
  }

  /**
   * Reactivate canceled subscription
   */
  static async reactivateSubscription(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscription/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      return true;
    } catch (error) {
      console.error('Reactivate subscription error:', error);
      return false;
    }
  }

  /**
   * Update subscription tier (upgrade/downgrade)
   */
  static async updateSubscriptionTier(
    newTierId: 'starter' | 'professional' | 'enterprise',
    billingCycle: 'month' | 'year'
  ): Promise<boolean> {
    try {
      const priceIdKey = this.getPriceIdKey(newTierId, billingCycle);
      const priceId = this.getStripeEnvVar(priceIdKey);

      if (!priceId) {
        throw new Error(`Stripe price ID not configured for ${newTierId} ${billingCycle}`);
      }

      const response = await fetch(`${this.API_BASE_URL}/subscription/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId,
          tierId: newTierId,
          billingCycle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      return true;
    } catch (error) {
      console.error('Update subscription error:', error);
      return false;
    }
  }

  /**
   * Create a Stripe portal session for self-service management
   * Allows users to view invoices, update payment method, cancel subscription
   */
  static async createPortalSession(): Promise<string | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Portal session error:', error);
      return null;
    }
  }

  /**
   * Handle Stripe webhook for subscription updates
   * This is typically handled on the backend, but included for reference
   */
  static async handleWebhook(event: any): Promise<boolean> {
    try {
      // This should be handled by backend for security
      // Frontend should only process webhook confirmations
      console.log('Webhook received:', event.type);
      return true;
    } catch (error) {
      console.error('Webhook handling error:', error);
      return false;
    }
  }

  /**
   * Get the correct Stripe price ID environment variable key
   */
  private static getPriceIdKey(
    tierId: 'starter' | 'professional' | 'enterprise',
    billingCycle: 'month' | 'year'
  ): string {
    const cycle = billingCycle === 'month' ? 'MONTHLY' : 'YEARLY';
    const tier = tierId.toUpperCase();
    return `REACT_APP_STRIPE_${tier}_${cycle}`;
  }

  /**
   * Get environment variable safely
   */
  private static getStripeEnvVar(key: string): string | undefined {
    return import.meta.env[key] as string | undefined;
  }

  /**
   * Store checkout session ID for recovery
   */
  private static storeCheckoutSession(sessionId: string): void {
    const sessions = this.getCheckoutSessions();
    sessions.push({
      id: sessionId,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('floinvite_checkout_sessions', JSON.stringify(sessions));
  }

  /**
   * Get stored checkout sessions
   */
  private static getCheckoutSessions(): Array<{ id: string; createdAt: string }> {
    try {
      const stored = localStorage.getItem('floinvite_checkout_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get stored auth token (implement based on your auth system)
   */
  private static getAuthToken(): string {
    // This should be implemented based on your authentication system
    // For now, return a placeholder - update with actual auth implementation
    const token = localStorage.getItem('floinvite_auth_token');
    return token || '';
  }

  /**
   * Check if user has active subscription
   */
  static isSubscribed(tier: 'professional' | 'enterprise'): boolean {
    // This would typically check the subscription status
    // For MVP, you might check localStorage or session
    try {
      const subscription = localStorage.getItem('floinvite_subscription');
      if (!subscription) return false;

      const sub = JSON.parse(subscription);
      const allowedTiers = tier === 'professional'
        ? ['professional', 'enterprise']
        : ['enterprise'];

      return allowedTiers.includes(sub.tier) && sub.status === 'active';
    } catch {
      return false;
    }
  }

  /**
   * Get user's current tier
   */
  static getCurrentTier(): 'starter' | 'professional' | 'enterprise' {
    try {
      const subscription = localStorage.getItem('floinvite_subscription');
      if (!subscription) return 'starter';

      const sub = JSON.parse(subscription);
      return sub.tier || 'starter';
    } catch {
      return 'starter';
    }
  }
}

/**
 * Feature access control helper
 * Use this to conditionally show features based on subscription tier
 */
export const hasFeature = (
  tier: 'starter' | 'professional' | 'enterprise',
  feature: string
): boolean => {
  const features = {
    starter: [
      'guest_checkin',
      'host_management',
      'expected_guests',
      'returning_visitors',
      'search_export',
      'email_templates',
      'whatsapp_templates',
      'notification_tones',
      'local_database',
      'csv_export',
      'pdf_export'
    ],
    professional: [
      ...['starter'], // All starter features
      'slack_integration',
      'teams_integration',
      'quiet_hours',
      'cloud_backup',
      'multi_device_sync',
      'notification_logs',
      'email_support',
      'multiple_locations',
      'advanced_analytics'
    ],
    enterprise: [
      // All professional features plus:
      'webhooks',
      'custom_templates',
      'advanced_routing',
      'delivery_guarantees',
      'api_access',
      'dedicated_support',
      'white_label',
      'sso',
      'custom_branding',
      'unlimited_users',
      'unlimited_locations'
    ]
  };

  const tierFeatures = features[tier];
  return tierFeatures.includes(feature);
};
