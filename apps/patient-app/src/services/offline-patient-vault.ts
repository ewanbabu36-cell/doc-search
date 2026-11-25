/**
 * Aarogya360 Patient App — Multi-Day IndexedDB Offline Health Vault
 * Persists encrypted patient token passes, ABHA cards, digital prescriptions,
 * and diagnostic lab reports in IndexedDB for >48h offline rural/basement reliability.
 */

const DB_NAME = 'aarogya360_patient_vault';
const STORE_NAME = 'health_records';

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const offlinePatientVault = {
  async saveRecord(key: string, value: unknown): Promise<void> {
    try {
      const db = await openVault();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        tx.objectStore(STORE_NAME).put({
          key,
          value,
          cachedAt: new Date().toISOString()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {}
  },

  async loadRecord<T = unknown>(key: string): Promise<T | null> {
    try {
      const db = await openVault();
      return await new Promise<T | null>((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve((req.result?.value as T) ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
};
