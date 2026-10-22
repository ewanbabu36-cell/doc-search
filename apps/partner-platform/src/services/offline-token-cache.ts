/**
 * DOC SEARCH — Client-Side Offline Write-Ahead Token Engine (IndexedDB)
 * 
 * Provides:
 * 1. Zero-downtime offline counter token issue when hospital/clinic Wi-Fi or 4G disconnects.
 * 2. High-speed IndexedDB WAL (Write-Ahead Log) with fallback to localStorage.
 * 3. Automatic background synchronization to /api/v1/partner/clinical-workflow/encounters upon 'online' window event.
 * 4. Observable queue status for reception status indicators.
 */

export interface OfflineRegistrationPayload {
  tenantId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number | string | undefined;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER' | string | undefined;
  providerId?: string | undefined;
  providerName?: string | undefined;
  departmentId?: string | undefined;
  paymentMode?: string | undefined;
  feePaid?: number | undefined;
  customIntake?: Record<string, unknown> | undefined;
}

export interface OfflineTokenRecord {
  id: string;
  localTokenNumber: string;
  tenantId: string;
  payload: OfflineRegistrationPayload;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';
  createdAt: string;
  syncedAt?: string;
  syncAttempts: number;
  syncError?: string;
  remoteEncounterId?: string;
  remoteTokenNumber?: string;
}

class OfflineTokenCacheService {
  private dbName = 'DocSearchOfflineVault';
  private storeName = 'offlineTokens';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private inMemoryFallback: Map<string, OfflineTokenRecord> = new Map();
  private isSyncing = false;
  private sequenceCounter = 1;

  constructor() {
    this.initDatabase();
    this.initAutoSyncListener();
  }

  private async initDatabase(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(this.dbName, this.dbVersion);

        req.onupgradeneeded = (e: any) => {
          const db = e.target.result as IDBDatabase;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('tenantId', 'tenantId', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };

        req.onsuccess = (e: any) => {
          this.db = e.target.result as IDBDatabase;
          resolve(this.db);
        };

        req.onerror = () => {
          console.warn('[OfflineTokenCache] IndexedDB open error, using memory fallback');
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  private initAutoSyncListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[OfflineTokenCache] Network restored. Auto-flushing offline token registrations...');
      this.flushOfflineTokens();
    });
  }

  /**
   * Enqueue a new token registration offline
   */
  public async queueOfflineRegistration(
    payload: OfflineRegistrationPayload
  ): Promise<OfflineTokenRecord> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `off-${Date.now()}`;
    const tokenSeq = this.sequenceCounter++;
    const localTokenNumber = `OFF-${String(tokenSeq).padStart(3, '0')}`;

    const record: OfflineTokenRecord = {
      id,
      localTokenNumber,
      tenantId: payload.tenantId,
      payload,
      status: 'QUEUED',
      createdAt: new Date().toISOString(),
      syncAttempts: 0
    };

    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          const req = store.put(record);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch {
        this.inMemoryFallback.set(id, record);
      }
    } else {
      this.inMemoryFallback.set(id, record);
      try {
        localStorage.setItem(`docsearch_offline_${id}`, JSON.stringify(record));
      } catch {}
    }

    return record;
  }

  /**
   * Get all unsynced or failed tokens
   */
  public async getPendingTokens(): Promise<OfflineTokenRecord[]> {
    if (this.db) {
      try {
        return await new Promise<OfflineTokenRecord[]>((resolve) => {
          const tx = this.db!.transaction(this.storeName, 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.getAll();
          req.onsuccess = () => {
            const all = (req.result as OfflineTokenRecord[]) || [];
            resolve(all.filter((r) => r.status === 'QUEUED' || r.status === 'FAILED'));
          };
          req.onerror = () => resolve(Array.from(this.inMemoryFallback.values()));
        });
      } catch {
        return Array.from(this.inMemoryFallback.values()).filter((r) => r.status !== 'SYNCED');
      }
    }

    return Array.from(this.inMemoryFallback.values()).filter((r) => r.status !== 'SYNCED');
  }

  /**
   * Flush pending tokens to live server API
   */
  public async flushOfflineTokens(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;

    let synced = 0;
    let failed = 0;

    try {
      const pending = await this.getPendingTokens();
      if (pending.length === 0) {
        return { synced: 0, failed: 0 };
      }

      for (const record of pending) {
        record.status = 'SYNCING';
        record.syncAttempts++;

        try {
          const res = await fetch('/api/v1/partner/clinical-workflow/encounters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientName: record.payload.patientName,
              patientPhone: record.payload.patientPhone,
              patientAge: record.payload.patientAge,
              patientGender: record.payload.patientGender || 'OTHER',
              doctorId: record.payload.providerId,
              departmentId: record.payload.departmentId,
              encounterType: 'OUTPATIENT',
              status: 'CHECKED_IN',
              metadata: {
                paymentMode: record.payload.paymentMode || 'CASH',
                feePaid: record.payload.feePaid || 0,
                customIntake: record.payload.customIntake || {},
                offlineLocalTokenNumber: record.localTokenNumber,
                offlineQueuedAt: record.createdAt,
                syncSource: 'OFFLINE_WRITE_AHEAD_BUFFER'
              }
            })
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
          }

          const result = await res.json();
          record.status = 'SYNCED';
          record.syncedAt = new Date().toISOString();
          record.remoteEncounterId = result?.data?.id || result?.id;
          record.remoteTokenNumber = result?.data?.tokenNumber || result?.tokenNumber;
          synced++;
        } catch (err: any) {
          record.status = 'FAILED';
          record.syncError = err?.message || String(err);
          failed++;
        }

        // Persist updated status
        if (this.db) {
          try {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).put(record);
          } catch {}
        } else {
          this.inMemoryFallback.set(record.id, record);
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  /**
   * Helper to check offline queue size
   */
  public async getQueueCount(): Promise<number> {
    const list = await this.getPendingTokens();
    return list.length;
  }
}

export const offlineTokenCacheService = new OfflineTokenCacheService();
