/**
 * DocSearch Light-Speed Stale-While-Revalidate (SWR) Local Cache Engine
 * Backed by native IndexedDB for sub-5ms retrieval of clinical catalogs,
 * drug masters, lab directories, and doctor rosters with background revalidation.
 */

export interface CachedEnvelope<T> {
  key: string;
  data: T;
  cachedAt: number;
  ttlMs: number;
}

class OfflineCatalogCacheService {
  private dbName = 'docsearch_swr_cache_v1';
  private storeName = 'clinical_master_catalogs';
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in current environment'));
      }

      const request = window.indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(key);

        req.onsuccess = () => {
          const envelope = req.result as CachedEnvelope<T> | undefined;
          if (!envelope) return resolve(null);
          resolve(envelope.data);
        };

        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async set<T>(key: string, data: T, ttlMs = 1000 * 60 * 60 * 24 * 7): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const envelope: CachedEnvelope<T> = {
          key,
          data,
          cachedAt: Date.now(),
          ttlMs
        };

        const req = store.put(envelope);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback ignore
    }
  }

  /**
   * Stale-While-Revalidate execution pattern
   * Immediately returns stale data from local disk in 0ms,
   * then fetches fresh data in background and silently updates cache.
   */
  public async getWithSwr<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = 1000 * 60 * 60 * 24
  ): Promise<{ data: T; isFromCache: boolean }> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      // Background revalidation
      fetcher()
        .then((fresh) => {
          if (fresh) {
            this.set(key, fresh, ttlMs);
          }
        })
        .catch(() => {
          // Network silent fallback to cache
        });

      return { data: cached, isFromCache: true };
    }

    // Cold cache miss: fetch synchronously
    const fresh = await fetcher();
    if (fresh) {
      await this.set(key, fresh, ttlMs);
    }
    return { data: fresh, isFromCache: false };
  }

  public async invalidate(key: string): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // Ignore
    }
  }
}

export const offlineCatalogCacheService = new OfflineCatalogCacheService();
