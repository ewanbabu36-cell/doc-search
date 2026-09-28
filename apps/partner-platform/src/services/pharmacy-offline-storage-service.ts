/**
 * DocSearch Partner Platform - Pharmacy Offline Storage Engine (IndexedDB)
 * 
 * Ground Reality: Tier-2/3 cities face regular internet and 4G dropouts.
 * This service ensures zero-downtime counter sales by storing full catalog,
 * active batches, offline invoices, and a resilient sync queue locally in IndexedDB.
 */

export interface OfflineInventoryMedication {
  id: string;
  medicationCode: string;
  name: string;
  genericName?: string | undefined;
  brandName?: string | undefined;
  dosageForm?: string | undefined;
  strength?: string | undefined;
  category?: string | undefined;
  scheduleType?: string | undefined;
  unitPrice?: number | undefined;
  manufacturer?: string | undefined;
  updatedAt?: string | undefined;
}

export interface OfflineInventoryBatch {
  id: string;
  medicationId: string;
  batchNumber: string;
  manufacturer?: string | undefined;
  expiryDate: string;
  availableQuantity: number;
  unitCost?: number | string | undefined;
  status: string;
  daysToExpiry?: number | undefined;
  updatedAt?: string | undefined;
}

export interface OfflineInvoiceItem {
  medicationId: string;
  drugName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  rate: number;
  amount: number;
  isLoose: boolean;
  packUnits?: number | undefined;
  dosageSchedule?: string | undefined;
}

export interface OfflineInvoice {
  id: string;
  invoiceNumber: string;
  clientInvoiceId: string;
  createdAt: string;
  patientName: string;
  patientPhone?: string | undefined;
  patientUhid?: string | undefined;
  doctorName?: string | undefined;
  doctorNmcReg?: string | undefined;
  paymentMode: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  containsScheduleH: boolean;
  items: OfflineInvoiceItem[];
  isOffline: true;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  syncedAt?: string | undefined;
  syncError?: string | undefined;
}

export interface SyncQueueItem {
  id: string;
  type: 'DISPENSE_INVOICE';
  clientInvoiceId: string;
  invoiceNumber: string;
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string | undefined;
  errorMessage?: string | undefined;
}

function resolveClientSessionIdentity(
  explicit?: { tenantId?: string | undefined; userId?: string | undefined },
  fallback?: { tenantId?: string | undefined; userId?: string | undefined }
): {
  tenantId: string;
  userId: string;
  namespace: string;
} {
  let tenantId = explicit?.tenantId?.trim() || '';
  let userId = explicit?.userId?.trim() || '';

  if ((!tenantId || !userId) && typeof window !== 'undefined' && window.localStorage) {
    try {
      const rawSession =
        window.localStorage.getItem('docsearch_auth_session') ||
        window.localStorage.getItem('docsearch_partner_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        tenantId = tenantId || String(parsed?.tenantId || parsed?.organizationId || parsed?.partnerId || '').trim();
        userId = userId || String(parsed?.userId || parsed?.id || parsed?.sub || '').trim();
      }
    } catch {
      // ignore
    }

    if (!tenantId || !userId) {
      try {
        const token =
          window.localStorage.getItem('docsearch_auth_token') ||
          window.localStorage.getItem('auth_token') ||
          '';
        if (token && token.includes('.')) {
          const parts = token.split('.');
          if (parts.length === 3 && parts[1]) {
            const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64Url));
            tenantId = tenantId || String(payload?.tenantId || payload?.organizationId || '').trim();
            userId = userId || String(payload?.userId || payload?.sub || '').trim();
          }
        }
      } catch {
        // ignore
      }
    }
  }

  const safeTenant = tenantId || fallback?.tenantId?.trim() || 'anonymous-tenant';
  const safeUser = userId || fallback?.userId?.trim() || 'anonymous-user';
  return {
    tenantId: safeTenant,
    userId: safeUser,
    namespace: `${safeTenant}:${safeUser}`
  };
}

const DB_NAME = 'DocSearchPharmacyLocalDB';
const SIM_OFFLINE_STORAGE_KEY = 'docsearch_simulate_offline_mode';
const DB_VERSION = 1;
const STORE_MEDS = 'inventory_medications';
const STORE_BATCHES = 'inventory_batches';
const STORE_INVOICES = 'offline_invoices';
const STORE_QUEUE = 'sync_queue';
const STORE_META = 'offline_meta';

export class PharmacyOfflineStorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private isSimulatedOfflineMode: boolean = false;
  private statusListeners: Array<(isOffline: boolean) => void> = [];
  private currentIdentity: { tenantId?: string | undefined; userId?: string | undefined } = {};
  private lastLoadedNamespace: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.invalidateLegacyGlobalKeys();
      this.loadSimulatedOfflineFromStorage();

      window.addEventListener('online', () => {
        this.notifyStatusListeners();
      });

      window.addEventListener('offline', () => {
        this.notifyStatusListeners();
      });

      window.addEventListener('docsearch:auth_logout', () => {
        this.purgeOnLogout();
      });
    }
  }

  private invalidateLegacyGlobalKeys(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(SIM_OFFLINE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  public resolveStorageNamespace(tenantId?: string, userId?: string): string {
    const resolved = resolveClientSessionIdentity(
      tenantId || userId ? { tenantId, userId } : undefined,
      this.currentIdentity
    );
    return resolved.namespace;
  }

  public getStorageKey(logicalKey: string = SIM_OFFLINE_STORAGE_KEY): string {
    return `docsearch:${this.resolveStorageNamespace()}:${logicalKey}`;
  }

  public getDbName(): string {
    return `${DB_NAME}:${this.resolveStorageNamespace()}`;
  }

  public setSessionContext(tenantId: string, userId: string): void {
    const prevNs = this.resolveStorageNamespace();
    this.currentIdentity = { tenantId: tenantId.trim(), userId: userId.trim() };
    const nextNs = this.resolveStorageNamespace();
    if (prevNs !== nextNs) {
      this.dbPromise = null;
    }
    this.loadSimulatedOfflineFromStorage();
    this.notifyStatusListeners();
  }

  private ensureNamespaceAligned(): void {
    const activeNs = this.resolveStorageNamespace();
    if (this.lastLoadedNamespace && this.lastLoadedNamespace !== activeNs) {
      this.dbPromise = null;
      this.loadSimulatedOfflineFromStorage();
    }
  }

  private loadSimulatedOfflineFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      this.invalidateLegacyGlobalKeys();
      const ns = this.resolveStorageNamespace();
      this.lastLoadedNamespace = ns;
      const storedSim = window.localStorage.getItem(this.getStorageKey(SIM_OFFLINE_STORAGE_KEY));
      this.isSimulatedOfflineMode = storedSim === 'true';
    } catch {
      this.isSimulatedOfflineMode = false;
    }
  }

  public purgeOnLogout(tenantId?: string, userId?: string): void {
    const ns = this.resolveStorageNamespace(tenantId, userId);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(`docsearch:${ns}:${SIM_OFFLINE_STORAGE_KEY}`);
        this.invalidateLegacyGlobalKeys();
      } catch {
        // ignore
      }
    }
    this.isSimulatedOfflineMode = false;
    this.dbPromise = null;
    this.currentIdentity = {};
    this.lastLoadedNamespace = '';
    this.notifyStatusListeners();
  }

  public subscribeStatus(listener: (isOffline: boolean) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.isOffline());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatusListeners(): void {
    const offline = this.isOffline();
    for (const l of this.statusListeners) {
      try {
        l(offline);
      } catch (err) {
        console.error('Status listener error:', err);
      }
    }
  }

  public isOffline(): boolean {
    this.ensureNamespaceAligned();
    if (this.isSimulatedOfflineMode) return true;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
    return false;
  }

  public isSimulatedOffline(): boolean {
    this.ensureNamespaceAligned();
    return this.isSimulatedOfflineMode;
  }

  public setSimulatedOffline(simulated: boolean): void {
    this.ensureNamespaceAligned();
    this.isSimulatedOfflineMode = simulated;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const ns = this.resolveStorageNamespace();
        this.lastLoadedNamespace = ns;
        window.localStorage.setItem(this.getStorageKey(SIM_OFFLINE_STORAGE_KEY), simulated ? 'true' : 'false');
      }
    } catch {}
    this.notifyStatusListeners();
  }

  public async getDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return null;
    }

    this.ensureNamespaceAligned();
    if (!this.dbPromise) {
      const targetDbName = this.getDbName();
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open(targetDbName, DB_VERSION);

          req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORE_MEDS)) {
              const medStore = db.createObjectStore(STORE_MEDS, { keyPath: 'id' });
              medStore.createIndex('idx_name', 'name', { unique: false });
              medStore.createIndex('idx_category', 'category', { unique: false });
              medStore.createIndex('idx_scheduleType', 'scheduleType', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_BATCHES)) {
              const batchStore = db.createObjectStore(STORE_BATCHES, { keyPath: 'id' });
              batchStore.createIndex('idx_medicationId', 'medicationId', { unique: false });
              batchStore.createIndex('idx_batchNumber', 'batchNumber', { unique: false });
              batchStore.createIndex('idx_expiryDate', 'expiryDate', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_INVOICES)) {
              const invStore = db.createObjectStore(STORE_INVOICES, { keyPath: 'invoiceNumber' });
              invStore.createIndex('idx_clientInvoiceId', 'clientInvoiceId', { unique: true });
              invStore.createIndex('idx_createdAt', 'createdAt', { unique: false });
              invStore.createIndex('idx_syncStatus', 'syncStatus', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_QUEUE)) {
              const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
              queueStore.createIndex('idx_status', 'status', { unique: false });
              queueStore.createIndex('idx_createdAt', 'createdAt', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_META)) {
              db.createObjectStore(STORE_META, { keyPath: 'key' });
            }
          };

          req.onsuccess = () => {
            resolve(req.result);
          };

          req.onerror = () => {
            console.error('IndexedDB open error:', req.error);
            resolve(null);
          };
        } catch (err) {
          console.error('IndexedDB initialization failed:', err);
          resolve(null);
        }
      });
    }

    return this.dbPromise;
  }

  /**
   * Cache fresh inventory snapshot (medications and active batches)
   */
  public async cacheInventorySnapshot(
    medications: OfflineInventoryMedication[],
    batches: OfflineInventoryBatch[]
  ): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_MEDS, STORE_BATCHES, STORE_META], 'readwrite');
        const medStore = tx.objectStore(STORE_MEDS);
        const batchStore = tx.objectStore(STORE_BATCHES);
        const metaStore = tx.objectStore(STORE_META);

        for (const med of medications) {
          medStore.put(med);
        }

        for (const batch of batches) {
          batchStore.put(batch);
        }

        metaStore.put({
          key: 'inventory_snapshot_meta',
          lastSyncedAt: new Date().toISOString(),
          medicationCount: medications.length,
          batchCount: batches.length
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Retrieve all locally cached medications & batches
   */
  public async getLocalInventory(): Promise<{
    medications: OfflineInventoryMedication[];
    batches: OfflineInventoryBatch[];
  }> {
    const db = await this.getDb();
    if (!db) return { medications: [], batches: [] };

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_MEDS, STORE_BATCHES], 'readonly');
        const medStore = tx.objectStore(STORE_MEDS);
        const batchStore = tx.objectStore(STORE_BATCHES);

        const medReq = medStore.getAll();
        const batchReq = batchStore.getAll();

        tx.oncomplete = () => {
          resolve({
            medications: medReq.result || [],
            batches: batchReq.result || []
          });
        };

        tx.onerror = () => {
          resolve({ medications: [], batches: [] });
        };
      } catch {
        resolve({ medications: [], batches: [] });
      }
    });
  }

  /**
   * Record a locally created sale while offline.
   * Atomically decrements batch quantities in IndexedDB so subsequent sales are accurate.
   */
  public async recordOfflineSale(
    invoiceData: Omit<OfflineInvoice, 'id' | 'isOffline' | 'syncStatus'>
  ): Promise<OfflineInvoice> {
    const db = await this.getDb();
    const invoiceId = `offline-inv-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const offlineInvoice: OfflineInvoice = {
      ...invoiceData,
      id: invoiceId,
      isOffline: true,
      syncStatus: 'PENDING'
    };

    const queueItem: SyncQueueItem = {
      id: `queue-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'DISPENSE_INVOICE',
      clientInvoiceId: offlineInvoice.clientInvoiceId,
      invoiceNumber: offlineInvoice.invoiceNumber,
      payload: {
        clientInvoiceId: offlineInvoice.clientInvoiceId,
        invoiceNumber: offlineInvoice.invoiceNumber,
        patientName: offlineInvoice.patientName,
        patientPhone: offlineInvoice.patientPhone,
        patientUhid: offlineInvoice.patientUhid,
        doctorName: offlineInvoice.doctorName,
        doctorNmcReg: offlineInvoice.doctorNmcReg,
        paymentMode: offlineInvoice.paymentMode,
        createdAt: offlineInvoice.createdAt,
        items: offlineInvoice.items.map((it) => ({
          medicationId: it.medicationId,
          batchId: it.batchId,
          batchNumber: it.batchNumber,
          quantity: it.quantity,
          unitPrice: it.rate
        })),
        grandTotal: offlineInvoice.grandTotal
      },
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString()
    };

    if (!db) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('docsearch_offline_invoices_backup');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(offlineInvoice);
        localStorage.setItem('docsearch_offline_invoices_backup', JSON.stringify(list));
      } catch {}
      return offlineInvoice;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_INVOICES, STORE_QUEUE, STORE_BATCHES], 'readwrite');
        const invStore = tx.objectStore(STORE_INVOICES);
        const queueStore = tx.objectStore(STORE_QUEUE);
        const batchStore = tx.objectStore(STORE_BATCHES);

        invStore.put(offlineInvoice);
        queueStore.put(queueItem);

        // Atomic Local Stock Deduction in IndexedDB
        for (const it of offlineInvoice.items) {
          if (it.batchId) {
            const getReq = batchStore.get(it.batchId);
            getReq.onsuccess = () => {
              const batch = getReq.result as OfflineInventoryBatch | undefined;
              if (batch) {
                const packUnits = it.packUnits || 10;
                const deductQty = it.isLoose ? (it.quantity / packUnits) : it.quantity;
                batch.availableQuantity = Math.max(0, Math.round((batch.availableQuantity - deductQty) * 100) / 100);
                batch.status = batch.availableQuantity === 0 ? 'DEPLETED' : batch.status;
                batch.updatedAt = new Date().toISOString();
                batchStore.put(batch);
              }
            };
          }
        }

        tx.oncomplete = () => resolve(offlineInvoice);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get all pending items in the sync queue
   */
  public async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.getDb();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_QUEUE], 'readonly');
        const queueStore = tx.objectStore(STORE_QUEUE);
        const req = queueStore.getAll();

        tx.oncomplete = () => {
          const items = (req.result || []) as SyncQueueItem[];
          const pending = items.filter((i) => i.status === 'PENDING' || i.status === 'FAILED');
          resolve(pending);
        };

        tx.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Get count of pending unsynced offline invoices
   */
  public async getPendingSyncCount(): Promise<number> {
    const queue = await this.getPendingSyncQueue();
    return queue.length;
  }

  /**
   * Mark a queue item and its invoice as SYNCED
   */
  public async markQueueItemSynced(clientInvoiceId: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_QUEUE, STORE_INVOICES], 'readwrite');
        const queueStore = tx.objectStore(STORE_QUEUE);
        const invStore = tx.objectStore(STORE_INVOICES);

        const queueReq = queueStore.getAll();
        queueReq.onsuccess = () => {
          const items = (queueReq.result || []) as SyncQueueItem[];
          const match = items.find((i) => i.clientInvoiceId === clientInvoiceId);
          if (match) {
            match.status = 'SYNCED';
            match.lastAttemptAt = new Date().toISOString();
            queueStore.put(match);
          }
        };

        const invIdx = invStore.index('idx_clientInvoiceId');
        const invReq = invIdx.get(clientInvoiceId);
        invReq.onsuccess = () => {
          const inv = invReq.result as OfflineInvoice | undefined;
          if (inv) {
            inv.syncStatus = 'SYNCED';
            inv.syncedAt = new Date().toISOString();
            invStore.put(inv);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Mark a queue item as FAILED with error message
   */
  public async markQueueItemFailed(clientInvoiceId: string, errorMsg: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_QUEUE, STORE_INVOICES], 'readwrite');
        const queueStore = tx.objectStore(STORE_QUEUE);
        const invStore = tx.objectStore(STORE_INVOICES);

        const queueReq = queueStore.getAll();
        queueReq.onsuccess = () => {
          const items = (queueReq.result || []) as SyncQueueItem[];
          const match = items.find((i) => i.clientInvoiceId === clientInvoiceId);
          if (match) {
            match.status = 'FAILED';
            match.retryCount += 1;
            match.errorMessage = errorMsg;
            match.lastAttemptAt = new Date().toISOString();
            queueStore.put(match);
          }
        };

        const invIdx = invStore.index('idx_clientInvoiceId');
        const invReq = invIdx.get(clientInvoiceId);
        invReq.onsuccess = () => {
          const inv = invReq.result as OfflineInvoice | undefined;
          if (inv) {
            inv.syncStatus = 'FAILED';
            inv.syncError = errorMsg;
            invStore.put(inv);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Get all offline invoices
   */
  public async getAllOfflineInvoices(): Promise<OfflineInvoice[]> {
    const db = await this.getDb();
    if (!db) {
      try {
        const stored = localStorage.getItem('docsearch_offline_invoices_backup');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_INVOICES], 'readonly');
        const invStore = tx.objectStore(STORE_INVOICES);
        const req = invStore.getAll();

        tx.oncomplete = () => {
          const invoices = (req.result || []) as OfflineInvoice[];
          invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(invoices);
        };

        tx.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Get local storage metadata
   */
  public async getMetaSummary(): Promise<{
    lastSnapshotAt: string | null;
    medicationCount: number;
    batchCount: number;
    pendingQueueCount: number;
    totalOfflineInvoicesCount: number;
  }> {
    const db = await this.getDb();
    if (!db) {
      return {
        lastSnapshotAt: null,
        medicationCount: 0,
        batchCount: 0,
        pendingQueueCount: 0,
        totalOfflineInvoicesCount: 0
      };
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_META, STORE_MEDS, STORE_BATCHES, STORE_QUEUE, STORE_INVOICES], 'readonly');
        const metaStore = tx.objectStore(STORE_META);
        const medStore = tx.objectStore(STORE_MEDS);
        const batchStore = tx.objectStore(STORE_BATCHES);
        const queueStore = tx.objectStore(STORE_QUEUE);
        const invStore = tx.objectStore(STORE_INVOICES);

        const metaReq = metaStore.get('inventory_snapshot_meta');
        const medCountReq = medStore.count();
        const batchCountReq = batchStore.count();
        const queueReq = queueStore.getAll();
        const invCountReq = invStore.count();

        tx.oncomplete = () => {
          const meta = metaReq.result as { lastSyncedAt?: string } | undefined;
          const queueItems = (queueReq.result || []) as SyncQueueItem[];
          const pending = queueItems.filter((q) => q.status === 'PENDING' || q.status === 'FAILED').length;

          resolve({
            lastSnapshotAt: meta?.lastSyncedAt || null,
            medicationCount: medCountReq.result || 0,
            batchCount: batchCountReq.result || 0,
            pendingQueueCount: pending,
            totalOfflineInvoicesCount: invCountReq.result || 0
          });
        };

        tx.onerror = () => {
          resolve({
            lastSnapshotAt: null,
            medicationCount: 0,
            batchCount: 0,
            pendingQueueCount: 0,
            totalOfflineInvoicesCount: 0
          });
        };
      } catch {
        resolve({
          lastSnapshotAt: null,
          medicationCount: 0,
          batchCount: 0,
          pendingQueueCount: 0,
          totalOfflineInvoicesCount: 0
        });
      }
    });
  }

  /**
   * Complete purge of all client IndexedDB pharmacy storage for fresh slate reset
   */
  public async clearAllOfflineData(): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(
          [STORE_MEDS, STORE_BATCHES, STORE_INVOICES, STORE_QUEUE, STORE_META],
          'readwrite'
        );
        tx.objectStore(STORE_MEDS).clear();
        tx.objectStore(STORE_BATCHES).clear();
        tx.objectStore(STORE_INVOICES).clear();
        tx.objectStore(STORE_QUEUE).clear();
        tx.objectStore(STORE_META).clear();

        tx.oncomplete = () => {
          this.notifyStatusListeners();
          resolve();
        };

        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const pharmacyOfflineStorageService = new PharmacyOfflineStorageService();
