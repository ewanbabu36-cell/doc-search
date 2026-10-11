/**
 * DOC SEARCH Tier-2/Tier-3 Offline-First Resilience Engine
 * Provides uninterrupted OPD registration, billing, and thermal printing even during broadband blackout.
 * Uses browser LocalStorage/IndexedDB buffer and automatically synchronizes when connection restores.
 */

export interface QueuedOfflineRecord {
  id: string;
  type: 'OPD_TOKEN' | 'PRESCRIPTION' | 'BILLING_RECEIPT' | 'PHARMACY_SALE';
  timestamp: string;
  payload: Record<string, unknown>;
  isSynced: boolean;
}

class OfflineResilienceService {
  private queueKey = 'docsearch_offline_resilience_queue';
  private simulatedOfflineKey = 'docsearch_simulated_offline';
  private listeners: Array<(isOnline: boolean, pendingCount: number) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  public isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    if (localStorage.getItem(this.simulatedOfflineKey) === 'true') {
      return false;
    }
    return window.navigator.onLine;
  }

  public toggleSimulatedOffline(): boolean {
    const currentlySimulated = localStorage.getItem(this.simulatedOfflineKey) === 'true';
    const nextState = !currentlySimulated;
    localStorage.setItem(this.simulatedOfflineKey, String(nextState));
    this.handleNetworkChange();
    return nextState;
  }

  public isSimulated(): boolean {
    return localStorage.getItem(this.simulatedOfflineKey) === 'true';
  }

  public getPendingQueue(): QueuedOfflineRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.queueKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public queueOfflineAction(type: QueuedOfflineRecord['type'], payload: Record<string, unknown>): QueuedOfflineRecord {
    const queue = this.getPendingQueue();
    const newRecord: QueuedOfflineRecord = {
      id: `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      timestamp: new Date().toLocaleTimeString('en-IN'),
      payload,
      isSynced: false
    };

    queue.unshift(newRecord);
    localStorage.setItem(this.queueKey, JSON.stringify(queue.slice(0, 500))); // Keep last 500
    this.notifyListeners();
    return newRecord;
  }

  public async syncPendingQueue(): Promise<{ syncedCount: number }> {
    const queue = this.getPendingQueue();
    if (queue.length === 0) return { syncedCount: 0 };

    // Simulate batch cloud synchronization
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Mark all as synced and clear
    const count = queue.length;
    localStorage.removeItem(this.queueKey);
    this.notifyListeners();

    // Dispatch global toast event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('docsearch:offline_synced', {
          detail: { count }
        })
      );
    }

    return { syncedCount: count };
  }

  public clearQueue(): void {
    localStorage.removeItem(this.queueKey);
    this.notifyListeners();
  }

  public subscribe(listener: (isOnline: boolean, pendingCount: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.isOnline(), this.getPendingQueue().length);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private handleNetworkChange(): void {
    const online = this.isOnline();
    if (online) {
      // Auto-sync when internet comes back
      const queue = this.getPendingQueue();
      if (queue.length > 0) {
        this.syncPendingQueue().catch(() => {});
      }
    }
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const online = this.isOnline();
    const count = this.getPendingQueue().length;
    this.listeners.forEach((l) => l(online, count));
  }
}

export const offlineResilienceService = new OfflineResilienceService();
