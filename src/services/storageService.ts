/**
 * Storage Service
 * Higher-level data management for hosts, guests, and app state
 * Handles localStorage persistence with async IndexedDB sync
 */

import { Host, Guest, GuestStatus, AppSettings } from '../types';
import { DEFAULT_LABELS } from '../utils/labelUtils';
import { STORAGE_KEYS } from '../utils/constants';
import { dbUtils } from '../db/floinviteDB';

export class StorageService {
  /**
   * HOSTS Management
   */
  static async getHosts(): Promise<Host[]> {
    try {
      return await dbUtils.getAllHosts();
    } catch (error) {
      console.error('Failed to get hosts from IDB:', error);
      // Fallback to localStorage if IDB fails
      const data = localStorage.getItem(STORAGE_KEYS.hosts);
      return data ? JSON.parse(data) : [];
    }
  }

  static async saveHosts(hosts: Host[]): Promise<void> {
    try {
      // Prioritize IndexedDB
      await dbUtils.bulkUpsertHosts(hosts);

      // Clean up deletions in IDB
      const existingHosts = await dbUtils.getAllHosts();
      const newIds = new Set(hosts.map(host => host.id));
      const deletions = existingHosts.filter(h => !newIds.has(h.id));
      if (deletions.length > 0) {
        await Promise.all(deletions.map(d => dbUtils.deleteHost(d.id)));
      }

      // Keep localStorage in sync for now as a warm backup
      localStorage.setItem(STORAGE_KEYS.hosts, JSON.stringify(hosts));
    } catch (error) {
      console.error('Failed to save hosts:', error);
      throw new Error('Failed to save hosts to device storage');
    }
  }

  static async addHost(host: Host): Promise<void> {
    await dbUtils.upsertHost(host);
    // Sync localStorage
    const hosts = await this.getHosts();
    localStorage.setItem(STORAGE_KEYS.hosts, JSON.stringify(hosts));
  }

  static async updateHost(id: string, updates: Partial<Host>): Promise<void> {
    const hosts = await this.getHosts();
    const index = hosts.findIndex(h => h.id === id);
    if (index !== -1) {
      hosts[index] = { ...hosts[index], ...updates };
      await this.saveHosts(hosts);
    }
  }

  static async deleteHost(id: string): Promise<void> {
    await dbUtils.deleteHost(id);
    // Sync localStorage
    const hosts = await this.getHosts();
    localStorage.setItem(STORAGE_KEYS.hosts, JSON.stringify(hosts));
  }

  static async getHost(id: string): Promise<Host | null> {
    const hosts = await this.getHosts();
    return hosts.find(h => h.id === id) || null;
  }

  static async getHostByEmail(email: string): Promise<Host | null> {
    const hosts = await this.getHosts();
    return hosts.find(h => h.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async importHosts(newHosts: Host[], mergeDuplicates: boolean = false): Promise<{ added: number; skipped: number }> {
    const existingHosts = await this.getHosts();
    let added = 0;
    let skipped = 0;
    const finalHosts = [...existingHosts];

    newHosts.forEach(newHost => {
      const existing = finalHosts.find(
        h => h.email.toLowerCase() === newHost.email.toLowerCase()
      );

      if (existing) {
        if (mergeDuplicates) {
          const index = finalHosts.findIndex(
            h => h.email.toLowerCase() === newHost.email.toLowerCase()
          );
          finalHosts[index] = { ...existing, ...newHost };
          added++;
        } else {
          skipped++;
        }
      } else {
        finalHosts.push(newHost);
        added++;
      }
    });

    await this.saveHosts(finalHosts);
    return { added, skipped };
  }

  /**
   * GUESTS Management
   */
  static async getGuests(): Promise<Guest[]> {
    try {
      return await dbUtils.getAllGuests();
    } catch (error) {
      console.error('Failed to get guests from IDB:', error);
      const data = localStorage.getItem(STORAGE_KEYS.guests);
      return data ? JSON.parse(data) : [];
    }
  }

  static async saveGuests(guests: Guest[]): Promise<void> {
    try {
      await dbUtils.bulkUpsertGuests(guests);

      // Clean up deletions
      const existingGuests = await dbUtils.getAllGuests();
      const newIds = new Set(guests.map(g => g.id));
      const deletions = existingGuests.filter(g => !newIds.has(g.id));
      if (deletions.length > 0) {
        await Promise.all(deletions.map(d => dbUtils.deleteGuest(d.id)));
      }

      localStorage.setItem(STORAGE_KEYS.guests, JSON.stringify(guests));
    } catch (error) {
      console.error('Failed to save guests:', error);
      throw new Error('Failed to save guests to device storage');
    }
  }

  static async addGuest(guest: Guest): Promise<void> {
    await dbUtils.upsertGuest(guest);
    const guests = await this.getGuests();
    localStorage.setItem(STORAGE_KEYS.guests, JSON.stringify(guests));
  }

  static async updateGuest(id: string, updates: Partial<Guest>): Promise<void> {
    const guests = await this.getGuests();
    const index = guests.findIndex(g => g.id === id);
    if (index !== -1) {
      guests[index] = { ...guests[index], ...updates };
      await this.saveGuests(guests);
    }
  }

  static async getGuest(id: string): Promise<Guest | null> {
    const guests = await this.getGuests();
    return guests.find(g => g.id === id) || null;
  }

  static async getGuestsByHost(hostId: string): Promise<Guest[]> {
    const guests = await this.getGuests();
    return guests.filter(g => g.hostId === hostId);
  }

  static async getGuestsByStatus(status: GuestStatus): Promise<Guest[]> {
    const guests = await this.getGuests();
    return guests.filter(g => g.status === status);
  }

  /**
   * Guest Search & Filtering
   */
  static async searchGuests(
    query: string,
    filters?: {
      hostId?: string;
      status?: GuestStatus;
      fromDate?: string; // ISO date
      toDate?: string; // ISO date
    }
  ): Promise<Guest[]> {
    let guests = await this.getGuests();

    // Filter by host
    if (filters?.hostId) {
      guests = guests.filter(g => g.hostId === filters.hostId);
    }

    // Filter by status
    if (filters?.status) {
      guests = guests.filter(g => g.status === filters.status);
    }

    // Filter by date range
    if (filters?.fromDate) {
      guests = guests.filter(g => g.checkInTime >= filters.fromDate!);
    }
    if (filters?.toDate) {
      guests = guests.filter(g => g.checkInTime <= filters.toDate!);
    }

    // Search by name, email, phone, company
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      guests = guests.filter(g =>
        g.name.toLowerCase().includes(lowerQuery) ||
        g.email?.toLowerCase().includes(lowerQuery) ||
        g.phone?.includes(lowerQuery) ||
        g.company?.toLowerCase().includes(lowerQuery)
      );
    }

    return guests;
  }

  /**
   * Returning Visitor Detection
   */
  static async getReturningVisitors(hostId: string, days: number = 30): Promise<Guest[]> {
    const guests = await this.getGuestsByHost(hostId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return guests.filter(g => {
      const visitDate = new Date(g.checkInTime);
      return (
        visitDate >= cutoffDate &&
        visitDate < new Date() &&
        g.status === 'Checked In'
      );
    });
  }

  /**
   * Cleanup & Archival
   */
  static async archiveOldGuests(olderThanDays: number = 90): Promise<number> {
    const guests = await this.getGuests();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const archivedCount = guests.filter(g => new Date(g.checkInTime) < cutoffDate).length;
    const remaining = guests.filter(g => new Date(g.checkInTime) >= cutoffDate);

    // [SIMPLIFIED] In this migration, we'll just keep them in primary store if capacity allows
    // but follow the spirit of archival by syncing state
    await this.saveGuests(remaining);
    return archivedCount;
  }

  /**
   * Get storage usage info
   */
  static async getStorageInfo(): Promise<{ used: number; limit: number; percentage: number }> {
    const stats = await dbUtils.getStats();
    // Rough estimate for IndexedDB usage vs arbitrary 50MB "limit" (or browser quota)
    // For simplicity, we'll use a virtual limit of 50MB
    const estimatedSize = (stats.hostsCount + stats.guestsCount) * 500; // ~500 bytes per record
    const limit = 52428800; // 50MB
    const percentage = Math.round((estimatedSize / limit) * 100);

    return { used: estimatedSize, limit, percentage };
  }

  /**
   * Clear all data
   */
  static async clearAllData(): Promise<void> {
    if (confirm('This will delete all data. Are you sure?')) {
      await Promise.all([
        dbUtils.clearHosts(),
        dbUtils.clearGuests(),
        dbUtils.clearSettings(),
        dbUtils.clearSyncLog()
      ]);
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }

  /**
   * Export all data as JSON
   */
  static async exportAllData(): Promise<string> {
    const [hosts, guests, settings] = await Promise.all([
      this.getHosts(),
      this.getGuests(),
      this.getAppSettings()
    ]);

    const data = {
      hosts,
      guests,
      settings,
      exportDate: new Date().toISOString(),
      version: '2.0.0' // Incremented version for IDB cut-over
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON export
   */
  static async importAllData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);

      if (data.hosts && Array.isArray(data.hosts)) {
        await this.saveHosts(data.hosts);
      }

      if (data.guests && Array.isArray(data.guests)) {
        await this.saveGuests(data.guests);
      }

      if (data.settings && typeof data.settings === 'object') {
        await this.saveAppSettings(data.settings);
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * APP SETTINGS Management
   */
  static async getAppSettings(): Promise<AppSettings> {
    try {
      const settings = await dbUtils.getSettings();
      if (settings) return settings;

      // Fallback
      const data = localStorage.getItem(STORAGE_KEYS.settings);
      return data
        ? JSON.parse(data)
        : {
          businessName: 'My Company',
          notificationEmail: 'admin@floinvite.com',
          labelPreset: 'default',
          labelSettings: DEFAULT_LABELS
        };
    } catch (error) {
      console.error('Failed to get app settings:', error);
      return {
        businessName: 'My Company',
        notificationEmail: 'admin@floinvite.com',
        labelPreset: 'default',
        labelSettings: DEFAULT_LABELS
      };
    }
  }

  static async saveAppSettings(settings: AppSettings): Promise<void> {
    try {
      await dbUtils.upsertSettings(settings);
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  }

  /**
   * Stats & Analytics (Async)
   */
  static async getStats() {
    const [guests, hosts] = await Promise.all([
      this.getGuests(),
      this.getHosts()
    ]);
    const today = new Date().toDateString();

    const todayGuests = guests.filter(
      g => new Date(g.checkInTime).toDateString() === today
    );

    const checkedInToday = todayGuests.filter(g => g.status === 'Checked In').length;
    const checkedOutToday = todayGuests.filter(g => g.status === 'Checked Out').length;
    const noShowToday = todayGuests.filter(g => g.status === 'No Show').length;

    return {
      totalHosts: hosts.length,
      totalGuests: guests.length,
      todayCheckIns: todayGuests.length,
      checkedInToday,
      checkedOutToday,
      noShowToday,
      guestsByHost: hosts.map(host => ({
        hostId: host.id,
        hostName: host.name,
        count: guests.filter(g => g.hostId === host.id).length
      }))
    };
  }
}
