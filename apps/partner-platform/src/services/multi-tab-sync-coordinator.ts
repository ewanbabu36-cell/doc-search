/**
 * DOC SEARCH Partner Platform - Multi-Tab Synchronization & Cooperative WebLock Coordinator
 *
 * Prevents race conditions and duplicate outbox flushes when a user opens multiple
 * hospital workstation tabs (e.g., 3 pharmacy billing counters or multiple OPD tabs).
 *
 * Utilizes:
 * - W3C Web Locks API (navigator.locks) for cooperative leader election
 * - LocalStorage lease fallback with heartbeat for older environments
 * - BroadcastChannel ('docsearch_hospital_sync_bus') for real-time cross-tab state syncing
 */

export interface SyncBusMessage {
  type: 'SYNC_STARTED' | 'SYNC_COMPLETED' | 'OUTBOX_COUNT_UPDATED' | 'RECORD_MERGED';
  tabId: string;
  timestamp: string;
  payload?: any;
}

export type SyncBusListener = (msg: SyncBusMessage) => void;

class MultiTabSyncCoordinator {
  private tabId: string;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncBusListener> = new Set();
  private lockKey = 'docsearch_outbox_flush_lock';
  private fallbackLeaseKey = 'docsearch_outbox_lease_owner';

  constructor() {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('docsearch_hospital_sync_bus');
        this.channel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (err) {
        console.warn('[SyncCoordinator] BroadcastChannel unavailable:', err);
      }
    }
  }

  public getTabId(): string {
    return this.tabId;
  }

  /**
   * Acquire exclusive lock to flush the offline outbox.
   * If another tab holds the lock, returns false without running action.
   */
  public async executeWithLock<T>(action: () => Promise<T>): Promise<{ executed: boolean; result?: T | undefined }> {
    if (typeof window === 'undefined') {
      const res = await action();
      return { executed: true, result: res };
    }

    // Modern browser: Web Locks API
    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      try {
        let lockAcquired = false;
        let actionResult: T | undefined = undefined;

        await navigator.locks.request(
          this.lockKey,
          { ifAvailable: true },
          async (lock) => {
            if (!lock) {
              console.log(`[SyncCoordinator] Tab ${this.tabId}: Sibling tab holds lock. Skipping duplicate flush.`);
              return;
            }
            lockAcquired = true;
            this.broadcast({
              type: 'SYNC_STARTED',
              tabId: this.tabId,
              timestamp: new Date().toISOString()
            });

            try {
              actionResult = await action();
            } finally {
              this.broadcast({
                type: 'SYNC_COMPLETED',
                tabId: this.tabId,
                timestamp: new Date().toISOString(),
                payload: { result: actionResult }
              });
            }
          }
        );

        if (lockAcquired) {
          return { executed: true, result: actionResult };
        }
        return { executed: false };
      } catch (e) {
        console.warn('[SyncCoordinator] Web Locks failed, falling back to storage lease:', e);
      }
    }

    // Fallback: LocalStorage cooperative lease with 15s expiry
    return await this.executeWithStorageLease(action);
  }

  private async executeWithStorageLease<T>(action: () => Promise<T>): Promise<{ executed: boolean; result?: T | undefined }> {
    const now = Date.now();
    const rawLease = localStorage.getItem(this.fallbackLeaseKey);

    if (rawLease) {
      try {
        const parsed = JSON.parse(rawLease);
        if (parsed.owner !== this.tabId && parsed.expiresAt > now) {
          console.log(`[SyncCoordinator] Sibling tab ${parsed.owner} holds storage lease.`);
          return { executed: false };
        }
      } catch {}
    }

    // Claim lease for 15 seconds
    const leaseData = { owner: this.tabId, expiresAt: now + 15000 };
    localStorage.setItem(this.fallbackLeaseKey, JSON.stringify(leaseData));

    this.broadcast({
      type: 'SYNC_STARTED',
      tabId: this.tabId,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await action();
      return { executed: true, result };
    } finally {
      localStorage.removeItem(this.fallbackLeaseKey);
      this.broadcast({
        type: 'SYNC_COMPLETED',
        tabId: this.tabId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Broadcast message to all sibling tabs
   */
  public broadcast(msg: SyncBusMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {}
    }
  }

  public subscribe(listener: SyncBusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleBroadcastMessage(msg: SyncBusMessage): void {
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch (err) {
        console.error('[SyncCoordinator] Listener error:', err);
      }
    }
  }
}

export const multiTabSyncCoordinator = new MultiTabSyncCoordinator();
