/**
 * Migration Service
 * Handles migration from localStorage to IndexedDB
 * Copies all existing data and manages migration status
 */

import { db, dbUtils, StoredHost, StoredGuest, StoredSettings } from '../db/floinviteDB';
import { Host, Guest, AppSettings, GuestStatus } from '../types';
import { DEFAULT_LABELS } from '../utils/labelUtils';

export interface MigrationStatus {
  completed: boolean;
  migratedAt?: string;
  hostsCount: number;
  guestsCount: number;
  settingsCount: number;
  errors: string[];
}

export class MigrationService {
  private static readonly MIGRATION_KEY = 'floinvite_migration_completed';

  /**
   * Check if migration has already been completed
   */
  static isMigrationCompleted(): boolean {
    return localStorage.getItem(this.MIGRATION_KEY) === 'true';
  }

  /**
   * Run migration from localStorage to IndexedDB
   * Only runs once - safe to call multiple times
   */
  static async runMigration(): Promise<MigrationStatus> {
    const status: MigrationStatus = {
      completed: false,
      hostsCount: 0,
      guestsCount: 0,
      settingsCount: 0,
      errors: []
    };

    // Skip if already migrated
    if (this.isMigrationCompleted()) {
      return {
        ...status,
        completed: true,
        migratedAt: localStorage.getItem('floinvite_migration_date') || undefined
      };
    }

    try {
      // Migrate hosts
      const hostsData = this.getFromLocalStorage('floinvite_hosts');
      if (hostsData && Array.isArray(hostsData)) {
        try {
          const hosts = this.normalizeHosts(hostsData);
          await dbUtils.bulkUpsertHosts(hosts);
          status.hostsCount = hosts.length;
        } catch (error) {
          const msg = `Error migrating hosts: ${error}`;
          console.error(msg);
          status.errors.push(msg);
        }
      }

      // Migrate guests
      const guestsData = this.getFromLocalStorage('floinvite_guests');
      if (guestsData && Array.isArray(guestsData)) {
        try {
          const guests = this.normalizeGuests(guestsData);
          await dbUtils.bulkUpsertGuests(guests);
          status.guestsCount = guests.length;
        } catch (error) {
          const msg = `Error migrating guests: ${error}`;
          console.error(msg);
          status.errors.push(msg);
        }
      }

      // Migrate settings
      const settingsData = this.getFromLocalStorage('floinvite_settings');
      if (settingsData && typeof settingsData === 'object') {
        try {
          const settings = this.normalizeSettings(settingsData);
          await dbUtils.updateSettings(settings);
          status.settingsCount = 1;
        } catch (error) {
          const msg = `Error migrating settings: ${error}`;
          console.error(msg);
          status.errors.push(msg);
        }
      }

      // Mark migration as completed
      const now = new Date().toISOString();
      localStorage.setItem(this.MIGRATION_KEY, 'true');
      localStorage.setItem('floinvite_migration_date', now);
      status.completed = true;
      status.migratedAt = now;

      return status;
    } catch (error) {
      const msg = `Fatal migration error: ${error}`;
      console.error(msg);
      status.errors.push(msg);
      status.completed = false;
      return status;
    }
  }

  /**
   * Get data from localStorage with error handling
   */
  private static getFromLocalStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  }

  /**
   * Normalize host data from localStorage
   * Adds any missing required fields with defaults
   */
  private static normalizeHosts(data: unknown[]): StoredHost[] {
    return data.map((raw) => {
      const host = raw as Partial<Host> & Partial<StoredHost>;
      return {
        id: host.id || crypto.randomUUID(),
        name: host.name || 'Unknown',
        email: host.email || '',
        phone: host.phone,
        department: host.department,
        notificationMethod: host.notificationMethod || 'email',
        smsNumber: host.smsNumber,
        createdAt: host.createdAt || new Date().toISOString(),
        updatedAt: host.updatedAt || new Date().toISOString()
      };
    });
  }

  /**
   * Normalize guest data from localStorage
   * Adds any missing required fields with defaults
   */
  private static normalizeGuests(data: unknown[]): StoredGuest[] {
    return data.map((raw) => {
      const guest = raw as Partial<Guest> & Partial<StoredGuest>;
      return {
        id: guest.id || crypto.randomUUID(),
        name: guest.name || 'Unknown',
        email: guest.email,
        phone: guest.phone,
        company: guest.company,
        hostId: guest.hostId || 'unknown',
        checkInTime: guest.checkInTime || new Date().toISOString(),
        estimatedDepartureTime: guest.estimatedDepartureTime,
        checkOutTime: guest.checkOutTime,
        status: guest.status || GuestStatus.CHECKED_IN,
        lastVisit: guest.lastVisit,
        visitCount: guest.visitCount,
        preRegistered: guest.preRegistered || false,
        updatedAt: guest.updatedAt || new Date().toISOString()
      };
    });
  }

  /**
   * Normalize settings data from localStorage
   * Adds any missing required fields with defaults
   */
  private static normalizeSettings(data: unknown): StoredSettings {
    const settings = data as Partial<AppSettings> & Partial<StoredSettings>;
    return {
      businessName: settings.businessName || 'My Company',
      businessAddress: settings.businessAddress,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      notificationEmail: settings.notificationEmail || 'admin@floinvite.com',
      kioskMode: settings.kioskMode || false,
      labelPreset: settings.labelPreset || 'default',
      labelSettings: settings.labelSettings || DEFAULT_LABELS,
      createdAt: settings.createdAt || new Date().toISOString(),
      updatedAt: settings.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Get migration status
   */
  static async getMigrationStatus(): Promise<MigrationStatus> {
    const stats = await dbUtils.getStats();

    return {
      completed: this.isMigrationCompleted(),
      migratedAt: localStorage.getItem('floinvite_migration_date') || undefined,
      hostsCount: stats.hostsCount,
      guestsCount: stats.guestsCount,
      settingsCount: 1, // Settings is usually single record
      errors: []
    };
  }

  /**
   * Export data for backup (before major changes)
   */
  static async backupAllData(): Promise<string> {
    const data = await dbUtils.exportAllData();
    const backup = {
      version: 1,
      timestamp: new Date().toISOString(),
      data
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Restore data from backup
   */
  static async restoreFromBackup(backupJson: string): Promise<void> {
    try {
      const backup = JSON.parse(backupJson);

      if (backup.version !== 1) {
        throw new Error(`Unsupported backup version: ${backup.version}`);
      }

      await dbUtils.importAllData(backup.data);
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  /**
   * Clear all data (use with caution!)
   */
  static async clearAllData(): Promise<void> {
    await db.delete();
    localStorage.removeItem(this.MIGRATION_KEY);
    localStorage.removeItem('floinvite_migration_date');
    console.warn('All data has been cleared');
  }
}
