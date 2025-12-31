/**
 * Floinvite IndexedDB Database Setup
 * Replaces localStorage with Dexie for better performance and reliability
 * Supports offline-first architecture with automatic cloud sync
 */

import Dexie, { Table } from 'dexie';
import { Host, Guest, AppSettings } from '../types';

// Extended types for database storage
export interface StoredHost extends Host {
  syncedAt?: string; // When last synced to backend
}

export interface StoredGuest extends Guest {
  syncedAt?: string; // When last synced to backend
}

export interface StoredSettings extends AppSettings {
  syncedAt?: string; // When last synced to backend
}

export interface SyncLog {
  id?: number; // Auto-increment
  dataType: 'hosts' | 'guests' | 'settings';
  action: 'create' | 'update' | 'delete';
  itemId: string;
  timestamp: string;
  synced: boolean;
}

/**
 * Floinvite Database
 * Schema version: 1
 * Tables: hosts, guests, settings, syncLog
 */
export class FloinviteDB extends Dexie {
  hosts!: Table<StoredHost>;
  guests!: Table<StoredGuest>;
  settings!: Table<StoredSettings>;
  syncLog!: Table<SyncLog>;

  constructor() {
    super('FloinviteDB');
    this.version(1).stores({
      // Index format: 'primaryKey, index1, index2, ...'
      hosts: 'id, email, createdAt', // Search by id, email, or date
      guests: 'id, hostId, checkInTime, name, email', // Multi-index for flexible queries
      settings: 'businessName',
      syncLog: '++id, dataType, timestamp' // ++ means auto-increment
    });
  }
}

// Singleton instance
export const db = new FloinviteDB();

/**
 * Database utility functions
 */
export const dbUtils = {
  /**
   * Get all hosts
   */
  async getAllHosts(): Promise<StoredHost[]> {
    return db.hosts.toArray();
  },

  /**
   * Get single host
   */
  async getHost(id: string): Promise<StoredHost | undefined> {
    return db.hosts.get(id);
  },

  /**
   * Add or update host
   */
  async upsertHost(host: StoredHost): Promise<string> {
    host.updatedAt = new Date().toISOString();
    const id = await db.hosts.put(host);

    // Log the sync action
    await db.syncLog.add({
      dataType: 'hosts',
      action: 'create',
      itemId: host.id,
      timestamp: new Date().toISOString(),
      synced: false
    });

    return id as string;
  },

  /**
   * Bulk add/update hosts
   */
  async bulkUpsertHosts(hosts: StoredHost[]): Promise<void> {
    const now = new Date().toISOString();
    const updated = hosts.map(h => ({ ...h, updatedAt: now }));
    await db.hosts.bulkPut(updated);
  },

  /**
   * Delete host
   */
  async deleteHost(id: string): Promise<void> {
    await db.hosts.delete(id);

    // Log the sync action
    await db.syncLog.add({
      dataType: 'hosts',
      action: 'delete',
      itemId: id,
      timestamp: new Date().toISOString(),
      synced: false
    });
  },

  /**
   * Clear all hosts
   */
  async clearHosts(): Promise<void> {
    await db.hosts.clear();
  },

  /**
   * Get all guests
   */
  async getAllGuests(): Promise<StoredGuest[]> {
    return db.guests.toArray();
  },

  /**
   * Get guests by host
   */
  async getGuestsByHost(hostId: string): Promise<StoredGuest[]> {
    return db.guests.where('hostId').equals(hostId).toArray();
  },

  /**
   * Get guest
   */
  async getGuest(id: string): Promise<StoredGuest | undefined> {
    return db.guests.get(id);
  },

  /**
   * Search guests by name
   */
  async searchGuestsByName(query: string): Promise<StoredGuest[]> {
    const all = await db.guests.toArray();
    const lowerQuery = query.toLowerCase();
    return all.filter(g =>
      g.name.toLowerCase().includes(lowerQuery) ||
      g.email?.toLowerCase().includes(lowerQuery) ||
      g.phone?.includes(query)
    );
  },

  /**
   * Add or update guest
   */
  async upsertGuest(guest: StoredGuest): Promise<string> {
    guest.updatedAt = new Date().toISOString();
    const id = await db.guests.put(guest);

    // Log the sync action
    await db.syncLog.add({
      dataType: 'guests',
      action: 'create',
      itemId: guest.id,
      timestamp: new Date().toISOString(),
      synced: false
    });

    return id as string;
  },

  /**
   * Bulk add/update guests
   */
  async bulkUpsertGuests(guests: StoredGuest[]): Promise<void> {
    const now = new Date().toISOString();
    const updated = guests.map(g => ({ ...g, updatedAt: now }));
    await db.guests.bulkPut(updated);
  },

  /**
   * Delete guest
   */
  async deleteGuest(id: string): Promise<void> {
    await db.guests.delete(id);

    // Log the sync action
    await db.syncLog.add({
      dataType: 'guests',
      action: 'delete',
      itemId: id,
      timestamp: new Date().toISOString(),
      synced: false
    });
  },

  /**
   * Clear all guests
   */
  async clearGuests(): Promise<void> {
    await db.guests.clear();
  },

  /**
   * Clear all settings
   */
  async clearSettings(): Promise<void> {
    await db.settings.clear();
  },

  /**
   * Clear sync log
   */
  async clearSyncLog(): Promise<void> {
    await db.syncLog.clear();
  },

  /**
   * Get settings
   */
  async getSettings(): Promise<StoredSettings | undefined> {
    const all = await db.settings.toArray();
    return all[0]; // Usually only one settings record
  },

  /**
   * Update settings
   */
  async updateSettings(settings: StoredSettings): Promise<void> {
    settings.updatedAt = new Date().toISOString();
    await db.settings.put(settings);

    // Log the sync action
    await db.syncLog.add({
      dataType: 'settings',
      action: 'update',
      itemId: settings.businessName,
      timestamp: new Date().toISOString(),
      synced: false
    });
  },

  /**
   * Upsert settings (alias for updateSettings)
   */
  async upsertSettings(settings: StoredSettings): Promise<void> {
    return this.updateSettings(settings);
  },

  /**
   * Get sync log entries that haven't been synced yet
   */
  async getUnsyncedActions(): Promise<SyncLog[]> {
    return db.syncLog.where('synced').equals(false).toArray();
  },

  /**
   * Mark actions as synced
   */
  async markAsSynced(ids: number[]): Promise<void> {
    for (const id of ids) {
      await db.syncLog.update(id, { synced: true });
    }
  },

  /**
   * Get database size statistics
   */
  async getStats(): Promise<{
    hostsCount: number;
    guestsCount: number;
    unsyncedCount: number;
  }> {
    const hostsCount = await db.hosts.count();
    const guestsCount = await db.guests.count();
    const unsyncedCount = await db.syncLog.where('synced').equals(false).count();

    return {
      hostsCount,
      guestsCount,
      unsyncedCount
    };
  },

  /**
   * Export all data as JSON (for backup/migration)
   */
  async exportAllData(): Promise<{
    hosts: StoredHost[];
    guests: StoredGuest[];
    settings: StoredSettings | undefined;
  }> {
    return {
      hosts: await db.hosts.toArray(),
      guests: await db.guests.toArray(),
      settings: await dbUtils.getSettings()
    };
  },

  /**
   * Import data from JSON (for restore/migration)
   */
  async importAllData(data: {
    hosts: StoredHost[];
    guests: StoredGuest[];
    settings?: StoredSettings;
  }): Promise<void> {
    await db.transaction('rw', db.hosts, db.guests, db.settings, async () => {
      if (data.hosts?.length) await db.hosts.bulkPut(data.hosts);
      if (data.guests?.length) await db.guests.bulkPut(data.guests);
      if (data.settings) await db.settings.put(data.settings);
    });
  }
};
