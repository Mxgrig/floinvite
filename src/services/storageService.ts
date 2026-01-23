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
  static getHosts(): Host[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.hosts);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get hosts:', error);
      return [];
    }
  }

  static saveHosts(hosts: Host[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.hosts, JSON.stringify(hosts));
      // Sync to IndexedDB asynchronously (non-blocking)
      dbUtils.getAllHosts().then(existingHosts => {
        const existingIds = new Set(existingHosts.map(host => host.id));
        const newIds = new Set(hosts.map(host => host.id));
        const deletions = Array.from(existingIds).filter(id => !newIds.has(id));
        const ops = [
          dbUtils.bulkUpsertHosts(hosts),
          ...deletions.map(id => dbUtils.deleteHost(id))
        ];
        return Promise.all(ops);
      }).catch(error => {
        console.warn('Failed to sync hosts to IndexedDB:', error);
      });
    } catch (error) {
      console.error('Failed to save hosts:', error);
      throw new Error('Failed to save hosts to device storage');
    }
  }

  static addHost(host: Host): void {
    const hosts = this.getHosts();
    hosts.push(host);
    this.saveHosts(hosts);
  }

  static updateHost(id: string, updates: Partial<Host>): void {
    const hosts = this.getHosts();
    const index = hosts.findIndex(h => h.id === id);
    if (index !== -1) {
      hosts[index] = { ...hosts[index], ...updates };
      this.saveHosts(hosts);
    }
  }

  static deleteHost(id: string): void {
    const hosts = this.getHosts().filter(h => h.id !== id);
    this.saveHosts(hosts);
    dbUtils.deleteHost(id).catch(error => {
      console.warn('Failed to delete host from IndexedDB:', error);
    });
  }

  static getHost(id: string): Host | null {
    const hosts = this.getHosts();
    return hosts.find(h => h.id === id) || null;
  }

  static getHostByEmail(email: string): Host | null {
    const hosts = this.getHosts();
    return hosts.find(h => h.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static importHosts(newHosts: Host[], mergeDuplicates: boolean = false): { added: number; skipped: number } {
    const existingHosts = this.getHosts();
    let added = 0;
    let skipped = 0;

    newHosts.forEach(newHost => {
      const existing = existingHosts.find(
        h => h.email.toLowerCase() === newHost.email.toLowerCase()
      );

      if (existing) {
        if (mergeDuplicates) {
          const index = existingHosts.findIndex(
            h => h.email.toLowerCase() === newHost.email.toLowerCase()
          );
          existingHosts[index] = { ...existing, ...newHost };
          added++;
        } else {
          skipped++;
        }
      } else {
        existingHosts.push(newHost);
        added++;
      }
    });

    this.saveHosts(existingHosts);
    return { added, skipped };
  }

  /**
   * GUESTS Management
   */
  static getGuests(): Guest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.guests);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get guests:', error);
      return [];
    }
  }

  static saveGuests(guests: Guest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.guests, JSON.stringify(guests));
      // Sync to IndexedDB asynchronously (non-blocking)
      dbUtils.getAllGuests().then(existingGuests => {
        const existingIds = new Set(existingGuests.map(guest => guest.id));
        const newIds = new Set(guests.map(guest => guest.id));
        const deletions = Array.from(existingIds).filter(id => !newIds.has(id));
        const ops = [
          dbUtils.bulkUpsertGuests(guests),
          ...deletions.map(id => dbUtils.deleteGuest(id))
        ];
        return Promise.all(ops);
      }).catch(error => {
        console.warn('Failed to sync guests to IndexedDB:', error);
      });
    } catch (error) {
      console.error('Failed to save guests:', error);
      throw new Error('Failed to save guests to device storage');
    }
  }

  static addGuest(guest: Guest): void {
    const guests = this.getGuests();
    guests.push(guest);
    this.saveGuests(guests);
  }

  static updateGuest(id: string, updates: Partial<Guest>): void {
    const guests = this.getGuests();
    const index = guests.findIndex(g => g.id === id);
    if (index !== -1) {
      guests[index] = { ...guests[index], ...updates };
      this.saveGuests(guests);
    }
  }

  static getGuest(id: string): Guest | null {
    const guests = this.getGuests();
    return guests.find(g => g.id === id) || null;
  }

  static getGuestsByHost(hostId: string): Guest[] {
    const guests = this.getGuests();
    return guests.filter(g => g.hostId === hostId);
  }

  static getGuestsByStatus(status: GuestStatus): Guest[] {
    const guests = this.getGuests();
    return guests.filter(g => g.status === status);
  }

  /**
   * Guest Search & Filtering
   */
  static searchGuests(
    query: string,
    filters?: {
      hostId?: string;
      status?: GuestStatus;
      fromDate?: string; // ISO date
      toDate?: string; // ISO date
    }
  ): Guest[] {
    let guests = this.getGuests();

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
   * Returns guests who visited in the last N days (default 30)
   */
  static getReturningVisitors(hostId: string, days: number = 30): Guest[] {
    const guests = this.getGuestsByHost(hostId);
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
  static archiveOldGuests(olderThanDays: number = 90): number {
    const guests = this.getGuests();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const archived = guests.filter(g => new Date(g.checkInTime) < cutoffDate);
    const remaining = guests.filter(g => new Date(g.checkInTime) >= cutoffDate);

    // Archive to separate storage (optional)
    if (archived.length > 0) {
      try {
        const existingArchive = localStorage.getItem('floinvite_guests_archive') || '[]';
        const archivedGuests = JSON.parse(existingArchive);
        localStorage.setItem(
          'floinvite_guests_archive',
          JSON.stringify([...archivedGuests, ...archived])
        );
      } catch (error) {
        console.warn('Failed to archive guests:', error);
      }
    }

    this.saveGuests(remaining);

    // Also delete archived guests from IndexedDB
    if (archived.length > 0) {
      archived.forEach(guest => {
        dbUtils.deleteGuest(guest.id).catch(error => {
          console.warn('Failed to delete archived guest from IndexedDB:', error);
        });
      });
    }

    return archived.length;
  }

  /**
   * Get storage usage info
   */
  static getStorageInfo(): { used: number; limit: number; percentage: number } {
    if (typeof window === 'undefined') {
      return { used: 0, limit: 5242880, percentage: 0 }; // 5MB default
    }

    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage.getItem(key)!.length;
      }
    }

    // Rough estimate: ~5-10MB limit depending on browser
    const limit = 5242880; // 5MB
    const percentage = Math.round((used / limit) * 100);

    return { used, limit, percentage };
  }

  /**
   * Clear all data (destructive - use carefully!)
   */
  static clearAllData(): void {
    if (confirm('This will delete all data. Are you sure?')) {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      // Also clear IndexedDB
      Promise.all([
        dbUtils.clearHosts(),
        dbUtils.clearGuests(),
        dbUtils.clearSettings(),
        dbUtils.clearSyncLog()
      ]).catch(error => {
        console.warn('Failed to clear IndexedDB:', error);
      });
    }
  }

  /**
   * Export all data as JSON
   */
  static exportAllData(): string {
    const data = {
      hosts: this.getHosts(),
      guests: this.getGuests(),
      settings: this.getAppSettings(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON export
   */
  static importAllData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.hosts && Array.isArray(data.hosts)) {
        this.saveHosts(data.hosts);
      }

      if (data.guests && Array.isArray(data.guests)) {
        this.saveGuests(data.guests);
      }

      if (data.settings && typeof data.settings === 'object') {
        this.saveAppSettings(data.settings);
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
  static getAppSettings(): AppSettings {
    try {
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

  static saveAppSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
      // Sync to IndexedDB asynchronously (non-blocking)
      dbUtils.upsertSettings(settings).catch(error => {
        console.warn('Failed to sync settings to IndexedDB:', error);
      });
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  }

  /**
   * Stats & Analytics (client-side only)
   */
  static getStats() {
    const guests = this.getGuests();
    const hosts = this.getHosts();
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
