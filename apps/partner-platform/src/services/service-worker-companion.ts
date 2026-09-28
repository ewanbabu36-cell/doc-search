/**
 * DocSearch Partner Platform - Service Worker Companion & Background Sync Client
 *
 * Manages service worker lifecycle, PWA installation readiness,
 * and registration of the 'sync-pharmacy-offline-bills' background sync tag.
 */

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isBackgroundSyncSupported: boolean;
  activeRegistration: ServiceWorkerRegistration | null;
}

class ServiceWorkerCompanion {
  private registration: ServiceWorkerRegistration | null = null;
  private syncListeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'DOCSEARCH_SW_SYNC_TRIGGER') {
          this.notifySyncListeners();
        }
      });
    }
  }

  public subscribeSyncTrigger(listener: () => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  private notifySyncListeners(): void {
    for (const l of this.syncListeners) {
      try {
        l();
      } catch (err) {
        console.error('Sync listener notice:', err);
      }
    }
  }

  /**
   * Register the Service Worker
   */
  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Listen for updates
      this.registration.onupdatefound = () => {
        const installing = this.registration?.installing;
        if (installing) {
          installing.onstatechange = () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker version available.');
            }
          };
        }
      };

      return this.registration;
    } catch (err) {
      console.warn('[PWA] Service worker registration notice:', err);
      return null;
    }
  }

  /**
   * Register Background Sync Tag for offline pharmacy bills
   */
  public async requestBackgroundSync(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg) {
        await (reg as any).sync.register('sync-pharmacy-offline-bills');
        return true;
      }
    } catch (err) {
      console.warn('[PWA] Background sync registration notice:', err);
    }
    return false;
  }

  /**
   * Get current Service Worker status
   */
  public async getStatus(): Promise<ServiceWorkerStatus> {
    const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
    if (!isSupported) {
      return {
        isSupported: false,
        isRegistered: false,
        isBackgroundSyncSupported: false,
        activeRegistration: null
      };
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const hasSync = typeof window !== 'undefined' && 'SyncManager' in window;
      return {
        isSupported: true,
        isRegistered: !!reg,
        isBackgroundSyncSupported: hasSync,
        activeRegistration: reg || null
      };
    } catch {
      return {
        isSupported: true,
        isRegistered: false,
        isBackgroundSyncSupported: false,
        activeRegistration: null
      };
    }
  }
}

export const serviceWorkerCompanion = new ServiceWorkerCompanion();
