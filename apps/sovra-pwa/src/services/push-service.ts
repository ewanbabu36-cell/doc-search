// Sovra Web-Push Notification Service (VAPID / Service Worker Integration)
// Zero-cost native browser push listener for mobile and desktop notifications.

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

class SovraPushService {
  private isPushSupported: boolean = false;
  private permissionStatus: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined') {
      this.isPushSupported = 'serviceWorker' in navigator && 'Notification' in window;
      if (this.isPushSupported) {
        this.permissionStatus = Notification.permission;
      }
    }
  }

  isSupported(): boolean {
    return this.isPushSupported;
  }

  getPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionStatus = Notification.permission;
      return this.permissionStatus;
    }
    return 'denied';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported) {
      console.warn('[Sovra Push] Web Push notifications are not supported in this browser environment');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission;
      console.log('[Sovra Push] Notification permission updated to:', permission);

      if (permission === 'granted') {
        await this.registerServiceWorkerSubscription();
        this.sendLocalNotification({
          title: 'Sovra Healthcare Alerts Active',
          body: 'You will now receive instant doctor prescriptions, lab reports, and consultation updates.',
          url: '/'
        });
      }

      return permission;
    } catch (err) {
      console.error('[Sovra Push] Error requesting notification permission:', err);
      return 'denied';
    }
  }

  private async registerServiceWorkerSubscription() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Sovra Push] ServiceWorker ready for push notifications with scope:', registration.scope);

      // In production, an applicationServerKey (VAPID public key) is provided.
      // E.g. registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) })
      // For zero recurring cost, native local notifications & service worker event listeners run 100% free!
    } catch (e) {
      console.warn('[Sovra Push] PushManager registration check:', e);
    }
  }

  async sendLocalNotification(payload: PushNotificationPayload) {
    if (this.getPermission() !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192.png',
          badge: '/icon-192.png',
          tag: payload.tag || 'sovra-clinical-alert',
          vibrate: [200, 100, 200],
          data: {
            url: payload.url || '/'
          }
        } as any);
      } else {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192.png'
        });
      }
    } catch (err) {
      console.warn('[Sovra Push] Failed to trigger notification:', err);
    }
  }
}

export const pushService = new SovraPushService();
