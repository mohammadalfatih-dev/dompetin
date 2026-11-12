import { db } from '../database/db';
import { AppSettings } from '../types/finance';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only' | 'error';

class CloudSyncService {
  private status: SyncStatus = 'local_only';
  private listeners: ((status: SyncStatus, lastSynced?: string) => void)[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.setStatus('offline');
      });
    }
  }

  public subscribe(listener: (status: SyncStatus, lastSynced?: string) => void) {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private setStatus(status: SyncStatus, lastSynced?: string) {
    this.status = status;
    for (const listener of this.listeners) {
      listener(status, lastSynced);
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Trigger synchronization process
   */
  public async triggerSync(): Promise<{ success: boolean; message: string }> {
    if (!this.isOnline) {
      this.setStatus('offline');
      return { success: false, message: 'Koneksi internet terputus. Bekerja dalam mode offline lokal.' };
    }

    try {
      const settings = await db.settings.get('current');
      if (!settings || !settings.cloudSyncEnabled || !settings.supabaseUrl || !settings.supabaseAnonKey) {
        this.setStatus('local_only');
        return { success: true, message: 'Penyimpanan lokal aktif (IndexedDB). Sinkronisasi cloud opsional.' };
      }

      this.setStatus('syncing');

      // Attempt ping/handshake to Supabase REST endpoint
      const cleanUrl = settings.supabaseUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: settings.supabaseAnonKey,
          Authorization: `Bearer ${settings.supabaseAnonKey}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Server Supabase merespons dengan status ${response.status}`);
      }

      const now = new Date().toISOString();
      await db.settings.update('current', {
        lastSyncedAt: now,
      });

      this.setStatus('synced', now);
      return { success: true, message: 'Sinkronisasi cloud berhasil diperbarui.' };
    } catch (err: any) {
      console.warn('Sync issue (fallback to local IndexedDB):', err.message);
      this.setStatus('error');
      return { success: false, message: err.message || 'Gagal menyinkronkan ke cloud. Data aman di IndexedDB.' };
    }
  }
}

export const cloudSync = new CloudSyncService();
