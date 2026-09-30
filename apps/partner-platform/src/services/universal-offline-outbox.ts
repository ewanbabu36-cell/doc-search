/**
 * DOC SEARCH Partner Platform - Universal Offline Outbox Engine
 *
 * Implements resilient offline transactional queueing across:
 * - OPD Doctor Consultations & E-Prescriptions
 * - Phlebotomy Specimen Accession & Pathology Results
 * - Pharmacy Counter Billing & Drug Dispensing
 * - Front Desk Token Generation & MPI Registrations
 *
 * Integrated with:
 * - W3C Web Locks API & MultiTabSyncCoordinator (preventing duplicate tab flushing)
 * - BroadcastChannel for cross-tab state syncing
 * - Granular CRDT delta merge routing
 */

import { pwaCompanion } from './pwa-companion.js';
import { multiTabSyncCoordinator } from './multi-tab-sync-coordinator.js';

export interface OutboxItem {
  id: string; // Client UUID
  type: 'CLINICAL_CONSULTATION' | 'LAB_SAMPLE_COLLECTION' | 'LAB_RESULT_ENTRY' | 'PHARMACY_DISPENSING' | 'PATIENT_REGISTRATION' | 'TOKEN_QUEUE';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: any;
  idempotencyKey: string;
  timestamp: string;
  status: 'QUEUED' | 'SYNCING' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

export type OutboxSubscriber = (pendingCount: number, isSyncing: boolean) => void;

class UniversalOfflineOutbox {
  private dbName = 'docsearch_universal_outbox_db';
  private storeName = 'outbox_items';
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isFlushing = false;
  private subscribers: Set<OutboxSubscriber> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDb();

      // 1. Listen for network restoration to flush automatically
      pwaCompanion.subscribe((state) => {
        if (state.isOnline && !this.isFlushing) {
          void this.flushOutbox();
        }
      });

      // 2. Listen for cross-tab sync notifications
      multiTabSyncCoordinator.subscribe((msg) => {
        if (msg.type === 'SYNC_COMPLETED' || msg.type === 'OUTBOX_COUNT_UPDATED') {
          this.notifySubscribers();
        }
      });
    }
  }

  private initDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Enqueue a mutation for offline persistence & background sync
   */
  public async enqueue(
    type: OutboxItem['type'],
    endpoint: string,
    method: OutboxItem['method'],
    payload: any
  ): Promise<OutboxItem> {
    const db = await this.initDb();
    const item: OutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      endpoint,
      method,
      payload,
      idempotencyKey: `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'QUEUED',
      retryCount: 0
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    this.notifySubscribers();

    // Broadcast to sibling tabs
    multiTabSyncCoordinator.broadcast({
      type: 'OUTBOX_COUNT_UPDATED',
      tabId: multiTabSyncCoordinator.getTabId(),
      timestamp: new Date().toISOString()
    });

    // Trigger flush if currently online
    if (pwaCompanion.getState().isOnline) {
      void this.flushOutbox();
    }

    return item;
  }

  /**
   * Get all pending items
   */
  public async getPendingItems(): Promise<OutboxItem[]> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get pending count
   */
  public async getPendingCount(): Promise<number> {
    const items = await this.getPendingItems();
    return items.filter((i) => i.status !== 'SYNCING').length;
  }

  /**
   * Delete an item once successfully processed by backend
   */
  public async removeItem(id: string): Promise<void> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Flush all queued outbox items using cooperative WebLock to avoid multi-tab double-flush
   */
  public async flushOutbox(): Promise<{ processed: number; failed: number }> {
    if (this.isFlushing) return { processed: 0, failed: 0 };

    const lockExecution = await multiTabSyncCoordinator.executeWithLock(async () => {
      return await this.performFlush();
    });

    return lockExecution.result || { processed: 0, failed: 0 };
  }

  private async performFlush(): Promise<{ processed: number; failed: number }> {
    this.isFlushing = true;
    this.notifySubscribers();

    let processed = 0;
    let failed = 0;

    try {
      const items = await this.getPendingItems();
      if (items.length === 0) {
        return { processed: 0, failed: 0 };
      }

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('docsearch_auth_token') : null;

      for (const item of items) {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': item.idempotencyKey,
            'X-DocSearch-Offline-Queued-At': item.timestamp
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(item.endpoint, {
            method: item.method,
            headers,
            body: JSON.stringify(item.payload)
          });

          if (response.ok || response.status === 409 /* Already processed by idempotency */) {
            await this.removeItem(item.id);
            processed++;
          } else if (response.status >= 400 && response.status < 500) {
            // Client error - record failure and avoid tight loop
            item.status = 'FAILED';
            item.retryCount += 1;
            item.lastError = `HTTP ${response.status}: ${await response.text()}`;
            await this.updateItem(item);
            failed++;
          } else {
            // Server error / network drop - break and wait for next online event
            failed++;
            break;
          }
        } catch (netErr: any) {
          failed++;
          console.warn('[Outbox] Network error during flush:', netErr?.message);
          break;
        }
      }
    } finally {
      this.isFlushing = false;
      this.notifySubscribers();
    }

    return { processed, failed };
  }

  private async updateItem(item: OutboxItem): Promise<void> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public subscribe(sub: OutboxSubscriber): () => void {
    this.subscribers.add(sub);
    void this.getPendingCount().then((count) => sub(count, this.isFlushing));
    return () => {
      this.subscribers.delete(sub);
    };
  }

  private notifySubscribers(): void {
    void this.getPendingCount().then((count) => {
      for (const sub of this.subscribers) {
        try {
          sub(count, this.isFlushing);
        } catch (e) {
          console.error('[Outbox] Subscriber notice:', e);
        }
      }
    });
  }
}

export const universalOfflineOutbox = new UniversalOfflineOutbox();
