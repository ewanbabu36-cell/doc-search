/**
 * DOC SEARCH - Doctor Speed Catalog Search Service
 *
 * Coordinates:
 * - Off-thread Web Worker (`catalog-search.worker.ts`)
 * - IndexedDB durable browser cache (ephemeral cache/index only, never authoritative)
 * - Authoritative Backend Synchronization (`GET /api/v1/partner/catalog/sync`)
 * - Cancellation of stale in-flight keystroke queries (Latest-Query-Wins)
 * - P50, P95, P99 Latency Tracking & Monitoring
 * - Main-thread fallback for environments without Web Worker
 */

import {
  type SearchWorkerInputMessage,
  type SearchWorkerOutputMessage,
  type MedicationSearchItem,
  type InvestigationSearchItem
} from '../workers/catalog-search.worker.js';

export interface SearchLatencyStats {
  totalSearches: number;
  lastDurationMs: number;
  averageDurationMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface CatalogSyncMetadata {
  datasetVersion: number;
  schemaVersion: string;
  checksum: string;
  lastSyncTimestamp: string;
  totalMedications: number;
  totalInvestigations: number;
}

const DB_NAME = 'docsearch_local_catalog_v2';
const DB_VERSION = 2;
const STORE_MEDICATIONS = 'medications';
const STORE_INVESTIGATIONS = 'investigations';
const STORE_METADATA = 'sync_metadata';

export class CatalogSearchService {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (data: any) => void;
      reject: (err: any) => void;
      query: string;
      timestamp: number;
    }
  >();
  private latestMedicationRequestId: string | null = null;
  private latestInvestigationRequestId: string | null = null;

  // Latency samples for P50/P95/P99 monitoring
  private latencySamples: number[] = [];
  private readonly maxSamples = 200;

  // Local fallback storage if worker or IndexedDB unavailable
  private inMemoryMeds: MedicationSearchItem[] = [];
  private inMemoryLabs: InvestigationSearchItem[] = [];
  private isReady = false;
  private syncMetadata: CatalogSyncMetadata | null = null;

  public get isSearchReady(): boolean {
    return this.isReady;
  }

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined' && typeof window.Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('../workers/catalog-search.worker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (event: MessageEvent<SearchWorkerOutputMessage>) => {
          this.handleWorkerMessage(event.data);
        };

        this.worker.onerror = (err) => {
          console.warn('[CatalogSearchService] Web Worker error, fallback to in-memory:', err);
        };
      } catch (e) {
        console.warn('[CatalogSearchService] Web Worker initialization failed; using main-thread fallback.', e);
        this.worker = null;
      }
    }
  }

  private handleWorkerMessage(msg: SearchWorkerOutputMessage) {
    switch (msg.type) {
      case 'CATALOG_READY': {
        this.isReady = true;
        break;
      }

      case 'SEARCH_MEDICATIONS_RESULT': {
        this.recordLatency(msg.durationMs);
        const req = this.pendingRequests.get(msg.requestId);
        if (req) {
          this.pendingRequests.delete(msg.requestId);
          // Drop stale results if a newer search request has already superseded this one
          if (this.latestMedicationRequestId === msg.requestId) {
            req.resolve({
              results: msg.results,
              totalFound: msg.totalFound,
              durationMs: msg.durationMs,
              cancelled: msg.cancelled || false
            });
          }
        }
        break;
      }

      case 'SEARCH_INVESTIGATIONS_RESULT': {
        this.recordLatency(msg.durationMs);
        const req = this.pendingRequests.get(msg.requestId);
        if (req) {
          this.pendingRequests.delete(msg.requestId);
          if (this.latestInvestigationRequestId === msg.requestId) {
            req.resolve({
              results: msg.results,
              totalFound: msg.totalFound,
              durationMs: msg.durationMs,
              cancelled: msg.cancelled || false
            });
          }
        }
        break;
      }

      case 'SEARCH_ERROR': {
        if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
          const req = this.pendingRequests.get(msg.requestId)!;
          this.pendingRequests.delete(msg.requestId);
          req.reject(new Error(msg.error));
        }
        break;
      }
    }
  }

  private recordLatency(ms: number) {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > this.maxSamples) {
      this.latencySamples.shift();
    }
  }

  public getLatencyStats(): SearchLatencyStats {
    if (this.latencySamples.length === 0) {
      return {
        totalSearches: 0,
        lastDurationMs: 0,
        averageDurationMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        p99Ms: 0
      };
    }

    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const p50Idx = Math.floor(sorted.length * 0.5);
    const p95Idx = Math.floor(sorted.length * 0.95);
    const p99Idx = Math.floor(sorted.length * 0.99);

    return {
      totalSearches: this.latencySamples.length,
      lastDurationMs: this.latencySamples[this.latencySamples.length - 1] ?? 0,
      averageDurationMs: Number((sum / sorted.length).toFixed(2)),
      p50Ms: Number((sorted[p50Idx] || 0).toFixed(2)),
      p95Ms: Number((sorted[p95Idx] || 0).toFixed(2)),
      p99Ms: Number((sorted[p99Idx] || 0).toFixed(2))
    };
  }

  /**
   * Initializes local dataset from IndexedDB or Backend Sync
   */
  public async syncCatalog(apiBaseUrl = '', token?: string): Promise<CatalogSyncMetadata> {
    // 1. Try reading existing metadata from IndexedDB
    let localMeta = await this.readMetadataFromIndexedDb();

    // 2. Query backend sync endpoint
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const versionParam = localMeta?.datasetVersion ? `?version=${localMeta.datasetVersion}` : '';
      const res = await fetch(`${apiBaseUrl}/api/v1/partner/catalog/sync${versionParam}`, {
        method: 'GET',
        headers
      });

      if (res.ok) {
        const payload = (await res.json()).data;
        if (!payload.upToDate && payload.medications && payload.medications.length > 0) {
          // Fresh snapshot received from authoritative backend!
          await this.persistToIndexedDb(payload.medications, payload.investigations, {
            datasetVersion: payload.datasetVersion,
            schemaVersion: payload.schemaVersion,
            checksum: payload.checksum,
            lastSyncTimestamp: payload.lastSyncTimestamp,
            totalMedications: payload.totalMedications,
            totalInvestigations: payload.totalInvestigations
          });

          this.inMemoryMeds = payload.medications;
          this.inMemoryLabs = payload.investigations;
          this.syncMetadata = {
            datasetVersion: payload.datasetVersion,
            schemaVersion: payload.schemaVersion,
            checksum: payload.checksum,
            lastSyncTimestamp: payload.lastSyncTimestamp,
            totalMedications: payload.totalMedications,
            totalInvestigations: payload.totalInvestigations
          };
        } else if (localMeta) {
          // Local cache is up-to-date! Load from IndexedDB
          const cached = await this.loadAllFromIndexedDb();
          this.inMemoryMeds = cached.medications;
          this.inMemoryLabs = cached.investigations;
          this.syncMetadata = localMeta;
        }
      }
    } catch (e) {
      console.warn('[CatalogSearchService] Backend sync failed, using cached IndexedDB/baseline:', e);
      if (localMeta) {
        const cached = await this.loadAllFromIndexedDb();
        this.inMemoryMeds = cached.medications;
        this.inMemoryLabs = cached.investigations;
        this.syncMetadata = localMeta;
      }
    }

    // 3. Hydrate into Web Worker
    if (this.worker && (this.inMemoryMeds.length > 0 || this.inMemoryLabs.length > 0)) {
      const msg: SearchWorkerInputMessage = {
        type: 'INIT_CATALOG',
        medications: this.inMemoryMeds,
        investigations: this.inMemoryLabs,
        datasetVersion: this.syncMetadata?.datasetVersion || 0
      };
      this.worker.postMessage(msg);
    } else {
      this.isReady = true;
    }

    return (
      this.syncMetadata || {
        datasetVersion: 0,
        schemaVersion: '2026.04.1',
        checksum: 'none',
        lastSyncTimestamp: new Date().toISOString(),
        totalMedications: this.inMemoryMeds.length,
        totalInvestigations: this.inMemoryLabs.length
      }
    );
  }

  /**
   * Search Medications off-thread with cancellation & latest-query-wins
   */
  public async searchMedications(
    query: string,
    options: { limit?: number; category?: string } = {}
  ): Promise<{ results: MedicationSearchItem[]; totalFound: number; durationMs: number }> {
    const requestId = `med_req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Cancel previously active search if still in-flight
    if (this.latestMedicationRequestId && this.worker) {
      this.worker.postMessage({
        type: 'CANCEL_SEARCH',
        requestId: this.latestMedicationRequestId
      });
      this.pendingRequests.delete(this.latestMedicationRequestId);
    }
    this.latestMedicationRequestId = requestId;

    if (!this.worker) {
      // Main-thread fallback
      const start = performance.now();
      const q = query.toLowerCase().trim();
      const filtered = this.inMemoryMeds.filter((m) => {
        if (options.category && m.category?.toLowerCase() !== options.category.toLowerCase()) return false;
        if (!q) return true;
        return (
          m.brandName?.toLowerCase().includes(q) ||
          m.genericName?.toLowerCase().includes(q) ||
          m.searchTokens?.some((t) => t.includes(q))
        );
      });
      const durationMs = performance.now() - start;
      this.recordLatency(durationMs);
      return {
        results: filtered.slice(0, options.limit || 20),
        totalFound: filtered.length,
        durationMs
      };
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        query,
        timestamp: Date.now()
      });

      this.worker!.postMessage({
        type: 'SEARCH_MEDICATIONS',
        requestId,
        query,
        limit: options.limit || 20,
        category: options.category
      });
    });
  }

  /**
   * Search Diagnostic Investigations off-thread with cancellation
   */
  public async searchInvestigations(
    query: string,
    options: { limit?: number; category?: string } = {}
  ): Promise<{ results: InvestigationSearchItem[]; totalFound: number; durationMs: number }> {
    const requestId = `lab_req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (this.latestInvestigationRequestId && this.worker) {
      this.worker.postMessage({
        type: 'CANCEL_SEARCH',
        requestId: this.latestInvestigationRequestId
      });
      this.pendingRequests.delete(this.latestInvestigationRequestId);
    }
    this.latestInvestigationRequestId = requestId;

    if (!this.worker) {
      const start = performance.now();
      const q = query.toLowerCase().trim();
      const filtered = this.inMemoryLabs.filter((inv) => {
        if (options.category && inv.category?.toLowerCase() !== options.category.toLowerCase()) return false;
        if (!q) return true;
        return (
          inv.testName?.toLowerCase().includes(q) ||
          inv.testCode?.toLowerCase().includes(q) ||
          inv.searchTokens?.some((t) => t.includes(q))
        );
      });
      const durationMs = performance.now() - start;
      this.recordLatency(durationMs);
      return {
        results: filtered.slice(0, options.limit || 20),
        totalFound: filtered.length,
        durationMs
      };
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        query,
        timestamp: Date.now()
      });

      this.worker!.postMessage({
        type: 'SEARCH_INVESTIGATIONS',
        requestId,
        query,
        limit: options.limit || 20,
        category: options.category
      });
    });
  }

  // IndexedDB Helpers
  private async openDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) return null;

    return new Promise((resolve) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_MEDICATIONS)) {
          db.createObjectStore(STORE_MEDICATIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_INVESTIGATIONS)) {
          db.createObjectStore(STORE_INVESTIGATIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_METADATA)) {
          db.createObjectStore(STORE_METADATA, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  private async persistToIndexedDb(
    meds: MedicationSearchItem[],
    labs: InvestigationSearchItem[],
    meta: CatalogSyncMetadata
  ): Promise<void> {
    const db = await this.openDb();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_MEDICATIONS, STORE_INVESTIGATIONS, STORE_METADATA], 'readwrite');
      const medStore = tx.objectStore(STORE_MEDICATIONS);
      const labStore = tx.objectStore(STORE_INVESTIGATIONS);
      const metaStore = tx.objectStore(STORE_METADATA);

      medStore.clear();
      labStore.clear();

      for (const m of meds) medStore.put(m);
      for (const l of labs) labStore.put(l);
      metaStore.put({ key: 'catalog_sync', ...meta });

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  private async readMetadataFromIndexedDb(): Promise<CatalogSyncMetadata | null> {
    const db = await this.openDb();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_METADATA, 'readonly');
      const req = tx.objectStore(STORE_METADATA).get('catalog_sync');
      req.onsuccess = () => resolve(req.result ? (req.result as CatalogSyncMetadata) : null);
      req.onerror = () => resolve(null);
    });
  }

  private async loadAllFromIndexedDb(): Promise<{
    medications: MedicationSearchItem[];
    investigations: InvestigationSearchItem[];
  }> {
    const db = await this.openDb();
    if (!db) return { medications: [], investigations: [] };

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_MEDICATIONS, STORE_INVESTIGATIONS], 'readonly');
      const medsReq = tx.objectStore(STORE_MEDICATIONS).getAll();
      const labsReq = tx.objectStore(STORE_INVESTIGATIONS).getAll();

      tx.oncomplete = () => {
        resolve({
          medications: medsReq.result || [],
          investigations: labsReq.result || []
        });
      };
      tx.onerror = () => resolve({ medications: [], investigations: [] });
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const catalogSearchService = new CatalogSearchService();
