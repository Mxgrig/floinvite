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

import { dbUtils } from '../db/floinviteDB';

export class UsageTracker {
  private static STORAGE_KEY = 'floinvite_usage_tracking';
  private static HOSTS_LIMIT = parseInt(import.meta.env.VITE_FREE_HOSTS_LIMIT || '20', 10);
  private static VISITORS_LIMIT = parseInt(import.meta.env.VITE_FREE_VISITORS_LIMIT || '20', 10);

  /**
   * Get current usage statistics (Async)
   */
  static async getUsage(): Promise<UsageData> {
    try {
      const [hosts, visitors] = await Promise.all([
        this.getHostCount(),
        this.getVisitorCount()
      ]);
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
   * Get current usage from IndexedDB (authoritative store)
   * Alias for getUsage()
   */
  static async getUsageAsync(): Promise<UsageData> {
    return this.getUsage();
  }

  /**
   * Check if user should see upgrade prompt (Async)
   */
  static async shouldShowUpgradePrompt(): Promise<boolean> {
    const usage = await this.getUsage();
    return usage.isOverLimit;
  }

  /**
   * Async version that checks IndexedDB
   * Alias for shouldShowUpgradePrompt()
   */
  static async shouldShowUpgradePromptAsync(): Promise<boolean> {
    return this.shouldShowUpgradePrompt();
  }

  /**
   * Mark upgrade prompt as dismissed (for 24 hours)
   */
  static dismissUpgradePrompt(): void {
    localStorage.setItem('floinvite_upgrade_prompt_dismissed', Date.now().toString());
  }

  /**
   * Get host count (Async)
   */
  private static async getHostCount(): Promise<number> {
    try {
      const hosts = await dbUtils.getAllHosts();
      return hosts.length;
    } catch {
      return this.getLocalStorageArrayCount('floinvite_hosts');
    }
  }

  /**
   * Get visitor count (Async)
   */
  private static async getVisitorCount(): Promise<number> {
    try {
      const guests = await dbUtils.getAllGuests();
      return guests.length;
    } catch {
      return this.getLocalStorageArrayCount('floinvite_guests');
    }
  }

  private static getLocalStorageArrayCount(key: string): number {
    try {
      const data = localStorage.getItem(key);
      if (!data) return 0;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get usage percentage (0-100) (Async)
   */
  static async getUsagePercentage(): Promise<number> {
    const usage = await this.getUsage();
    const limit = this.HOSTS_LIMIT;
    const total = usage.totalHosts + usage.totalVisitors;
    return Math.min(100, Math.round((total / limit) * 100));
  }

  /**
   * Get warning message based on usage (Async)
   */
  static async getWarningMessage(): Promise<string | null> {
    const usage = await this.getUsage();

    if (usage.isOverLimit) {
      return `You've reached the free tier limit! Continue on Starter for $29/month, or upgrade to Compliance+ for $49/month with audit-ready features.`;
    }

    const percentage = await this.getUsagePercentage();
    if (usage.totalHosts + usage.totalVisitors > this.HOSTS_LIMIT * 0.8) {
      return `You're using ${percentage}% of your free tier limit. Starter continues at $29/month after 20 items.`;
    }

    return null;
  }
}
