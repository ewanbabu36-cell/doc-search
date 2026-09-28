/**
 * DocSearch Partner Platform - Pharmacy Background Sync & Cloud Ingestion Engine
 *
 * Orchestrates seamless background synchronization between IndexedDB local cache
 * and the Fastify backend with zero data loss, idempotency verification,
 * and automatic stock reconciliation.
 */

import {
  pharmacyOfflineStorageService,
  type OfflineInventoryMedication,
  type OfflineInventoryBatch
} from './pharmacy-offline-storage-service.js';
import { serviceWorkerCompanion } from './service-worker-companion.js';
import { apiRequest } from './api-client.js';

export interface SyncEngineResult {
  syncedCount: number;
  duplicateCount: number;
  failedCount: number;
  timestamp: string;
}

export type SyncEngineState = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

class PharmacySyncEngine {
  private isSyncing: boolean = false;
  private lastResult: SyncEngineResult | null = null;
  private state: SyncEngineState = 'IDLE';
  private listeners: Array<(state: SyncEngineState, result: SyncEngineResult | null) => void> = [];
  private _periodicTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Listen for Service Worker background sync triggers
      serviceWorkerCompanion.subscribeSyncTrigger(() => {
        void this.triggerSync();
      });

      // 2. Listen for Network recovery
      pharmacyOfflineStorageService.subscribeStatus((isOffline) => {
        if (!isOffline) {
          void this.triggerSync();
          void this.refreshInventorySnapshot();
        }
      });

      // 3. Periodic Background Sync Heartbeat (every 30 seconds if online)
      this._periodicTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (!pharmacyOfflineStorageService.isOffline()) {
          void this.triggerSyncIfPending();
        }
      }, 30000);
    }
  }

  public subscribe(listener: (state: SyncEngineState, result: SyncEngineResult | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.state, this.lastResult);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public destroy(): void {
    if (this._periodicTimer) {
      clearInterval(this._periodicTimer);
      this._periodicTimer = null;
    }
  }

  private notifyListeners(): void {
    for (const l of this.listeners) {
      try {
        l(this.state, this.lastResult);
      } catch (e) {
        console.error('Sync engine listener notice:', e);
      }
    }
  }

  public getState(): SyncEngineState {
    return this.state;
  }

  public getLastResult(): SyncEngineResult | null {
    return this.lastResult;
  }

  /**
   * Check if any pending offline bills exist, and trigger sync if so
   */
  public async triggerSyncIfPending(): Promise<void> {
    const pendingCount = await pharmacyOfflineStorageService.getPendingSyncCount();
    if (pendingCount > 0) {
      await this.triggerSync();
    }
  }

  /**
   * Primary Synchronization Routine:
   * Flushes local pending bills from IndexedDB queue to the Fastify backend.
   */
  public async triggerSync(): Promise<SyncEngineResult | null> {
    if (this.isSyncing) return null;
    if (pharmacyOfflineStorageService.isOffline()) {
      console.log('[Sync Engine] Skipped: Station is currently offline or in simulated offline mode.');
      return null;
    }

    const pendingQueue = await pharmacyOfflineStorageService.getPendingSyncQueue();
    if (pendingQueue.length === 0) {
      this.state = 'IDLE';
      this.notifyListeners();
      return null;
    }

    this.isSyncing = true;
    this.state = 'SYNCING';
    this.notifyListeners();

    let syncedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    try {
      const invoicesPayload = pendingQueue.map((item) => item.payload);

      // Ingest to Fastify backend with idempotency
      const res = await apiRequest<{
        syncedCount: number;
        duplicateCount: number;
        results: Array<{
          clientInvoiceId: string;
          invoiceNumber: string;
          status: 'SYNCED' | 'ALREADY_SYNCED' | 'FAILED';
          duplicate: boolean;
          error?: string | undefined;
        }>;
      }>('/api/v1/partner/pharmacy/sync-offline-invoices', {
        method: 'POST',
        body: JSON.stringify({ invoices: invoicesPayload })
      });

      if (res.success && res.data) {
        for (const r of res.data.results) {
          if (r.status === 'SYNCED' || r.status === 'ALREADY_SYNCED') {
            await pharmacyOfflineStorageService.markQueueItemSynced(r.clientInvoiceId);
            if (r.duplicate) {
              duplicateCount++;
            } else {
              syncedCount++;
            }
          } else {
            await pharmacyOfflineStorageService.markQueueItemFailed(r.clientInvoiceId, r.error || 'Sync rejected by backend');
            failedCount++;
          }
        }

        // Trigger Service Worker Background Sync notification
        void serviceWorkerCompanion.requestBackgroundSync();

        // Refresh inventory snapshot after committing offline deductions
        void this.refreshInventorySnapshot();

        this.lastResult = {
          syncedCount,
          duplicateCount,
          failedCount,
          timestamp: new Date().toISOString()
        };
        this.state = failedCount > 0 ? 'ERROR' : 'SUCCESS';
      } else {
        throw new Error(res.error?.message || 'Sync response was unsuccessful');
      }
    } catch (err) {
      console.warn('[Sync Engine] Offline sync transmission encountered error:', err);
      for (const item of pendingQueue) {
        await pharmacyOfflineStorageService.markQueueItemFailed(
          item.clientInvoiceId,
          err instanceof Error ? err.message : 'Network error'
        );
        failedCount++;
      }
      this.lastResult = {
        syncedCount: 0,
        duplicateCount: 0,
        failedCount,
        timestamp: new Date().toISOString()
      };
      this.state = 'ERROR';
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return this.lastResult;
  }

  /**
   * Fetch fresh inventory snapshot from backend and cache into IndexedDB
   */
  public async refreshInventorySnapshot(): Promise<boolean> {
    if (pharmacyOfflineStorageService.isOffline()) return false;

    try {
      const res = await apiRequest<{
        medications: OfflineInventoryMedication[];
        batches: OfflineInventoryBatch[];
        snapshotAt: string;
      }>('/api/v1/partner/pharmacy/inventory-snapshot');

      if (res.success && res.data) {
        await pharmacyOfflineStorageService.cacheInventorySnapshot(
          res.data.medications || [],
          res.data.batches || []
        );
        return true;
      }
    } catch (err) {
      console.warn('[Sync Engine] Could not refresh inventory snapshot:', err);
    }
    return false;
  }
}

export const pharmacySyncEngine = new PharmacySyncEngine();
