/**
 * Migration Service
 * Handles migration from localStorage to IndexedDB
 * Copies all existing data and manages migration status
 */

import { db, dbUtils, StoredHost, StoredGuest, StoredSettings } from '../db/floinviteDB';
import { Host, Guest, AppSettings, GuestStatus } from '../types';

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
    console.log('Starting localStorage to IndexedDB migration...');

    const status: MigrationStatus = {
      completed: false,
      hostsCount: 0,
      guestsCount: 0,
      settingsCount: 0,
      errors: []
    };

    // Skip if already migrated
    if (this.isMigrationCompleted()) {
      console.log('Migration already completed, skipping');
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
          console.log(`✓ Migrated ${hosts.length} hosts`);
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
          console.log(`✓ Migrated ${guests.length} guests`);
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
          console.log('✓ Migrated settings');
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

      console.log('✓ Migration completed successfully');
      console.log(`Summary: ${status.hostsCount} hosts, ${status.guestsCount} guests, ${status.settingsCount} settings`);

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
  private static getFromLocalStorage(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  }

  /**
   * Normalize host data from localStorage
   * Adds any missing required fields with defaults
   */
  private static normalizeHosts(data: any[]): StoredHost[] {
    return data.map((host: any) => ({
      id: host.id || crypto.randomUUID(),
      name: host.name || 'Unknown',
      email: host.email || '',
      phone: host.phone,
      department: host.department,
      notificationMethod: host.notificationMethod || 'email',
      smsNumber: host.smsNumber,
      createdAt: host.createdAt || new Date().toISOString(),
      updatedAt: host.updatedAt || new Date().toISOString()
    }));
  }

  /**
   * Normalize guest data from localStorage
   * Adds any missing required fields with defaults
   */
  private static normalizeGuests(data: any[]): StoredGuest[] {
    return data.map((guest: any) => ({
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
    }));
  }

  /**
   * Normalize settings data from localStorage
   * Adds any missing required fields with defaults
   */
  private static normalizeSettings(data: any): StoredSettings {
    return {
      businessName: data.businessName || 'My Company',
      businessAddress: data.businessAddress,
      logoUrl: data.logoUrl,
      primaryColor: data.primaryColor,
      notificationEmail: data.notificationEmail || 'admin@floinvite.com',
      kioskMode: data.kioskMode || false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
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
      console.log('✓ Data restored from backup');
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
