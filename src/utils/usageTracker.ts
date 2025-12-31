/**
 * Usage Tracker - Monitor hosts and visitors for upgrade prompts
 * Triggers upgrade modal when user exceeds free tier limits
 */

export interface UsageData {
  totalHosts: number;
  totalVisitors: number;
  hostsLimit: number;
  visitorsLimit: number;
  isOverLimit: boolean;
  remainingHosts: number;
  remainingVisitors: number;
}

export class UsageTracker {
  private static STORAGE_KEY = 'floinvite_usage_tracking';
  private static HOSTS_LIMIT = parseInt(import.meta.env.VITE_FREE_HOSTS_LIMIT || '20', 10);
  private static VISITORS_LIMIT = parseInt(import.meta.env.VITE_FREE_VISITORS_LIMIT || '20', 10);

  /**
   * Get current usage statistics
   */
  static getUsage(): UsageData {
    try {
      const hosts = this.getHostCount();
      const visitors = this.getVisitorCount();
      const totalItems = hosts + visitors;

      return {
        totalHosts: hosts,
        totalVisitors: visitors,
        hostsLimit: this.HOSTS_LIMIT,
        visitorsLimit: this.VISITORS_LIMIT,
        isOverLimit: totalItems > this.HOSTS_LIMIT || visitors > this.VISITORS_LIMIT,
        remainingHosts: Math.max(0, this.HOSTS_LIMIT - hosts),
        remainingVisitors: Math.max(0, this.VISITORS_LIMIT - visitors)
      };
    } catch {
      return {
        totalHosts: 0,
        totalVisitors: 0,
        hostsLimit: this.HOSTS_LIMIT,
        visitorsLimit: this.VISITORS_LIMIT,
        isOverLimit: false,
        remainingHosts: this.HOSTS_LIMIT,
        remainingVisitors: this.VISITORS_LIMIT
      };
    }
  }

  /**
   * Check if user should see upgrade prompt
   * Returns true if over limit (no dismissal - always show when over limit)
   */
  static shouldShowUpgradePrompt(): boolean {
    const usage = this.getUsage();
    if (!usage.isOverLimit) {
      return false;
    }

    // Always show upgrade prompt when over limit - cannot dismiss
    return true;
  }

  /**
   * Mark upgrade prompt as dismissed (for 24 hours)
   */
  static dismissUpgradePrompt(): void {
    localStorage.setItem('floinvite_upgrade_prompt_dismissed', Date.now().toString());
  }

  /**
   * Get host count from localStorage
   */
  private static getHostCount(): number {
    try {
      const hosts = localStorage.getItem('floinvite_hosts');
      if (!hosts) return 0;
      const parsed = JSON.parse(hosts);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get visitor count from localStorage
   */
  private static getVisitorCount(): number {
    try {
      const guests = localStorage.getItem('floinvite_guests');
      if (!guests) return 0;
      const parsed = JSON.parse(guests);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get usage percentage (0-100)
   */
  static getUsagePercentage(): number {
    const usage = this.getUsage();
    const limit = this.HOSTS_LIMIT;
    const total = usage.totalHosts + usage.totalVisitors;
    return Math.min(100, Math.round((total / limit) * 100));
  }

  /**
   * Get warning message based on usage
   */
  static getWarningMessage(): string | null {
    const usage = this.getUsage();

    if (usage.isOverLimit) {
      return `You've reached the free tier limit! Continue on Starter for $29/month, or upgrade to Compliance+ for $49/month with audit-ready features.`;
    }

    if (usage.totalHosts + usage.totalVisitors > this.HOSTS_LIMIT * 0.8) {
      return `You're using ${this.getUsagePercentage()}% of your free tier limit. Starter continues at $29/month after 20 items.`;
    }

    return null;
  }
}
