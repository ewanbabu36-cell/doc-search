/**
 * Aarogya360 Native Android Capacitor Bridge Service
 * Provides seamless hardware abstraction between Web / PWA and Native Android APK.
 */

export interface NativeDeviceInfo {
  platform: 'android' | 'ios' | 'web';
  isNative: boolean;
  appVersion: string;
}

export interface MedicineReminderNotification {
  id: number;
  medicineName: string;
  dosage: string;
  scheduledTime: Date;
  instructions: string;
}

class NativeBridgeService {
  private isNative: boolean = false;
  private platform: 'android' | 'ios' | 'web' = 'web';

  constructor() {
    this.detectEnvironment();
    this.initializeNativeFeatures();
  }

  private detectEnvironment() {
    if (typeof window !== 'undefined') {
      const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
      if (cap?.isNativePlatform && cap.isNativePlatform()) {
        this.isNative = true;
        this.platform = (cap.getPlatform?.() as 'android' | 'ios') || 'android';
      } else {
        this.isNative = false;
        this.platform = 'web';
      }
    }
  }

  private initializeNativeFeatures() {
    if (this.isNative) {
      this.configureStatusBar();
    }
  }

  /**
   * Status Bar Theming (Deep Slate #0B0F19 for dark clinical aesthetic)
   */
  public async configureStatusBar(dark: boolean = true) {
    if (typeof window === 'undefined') return;
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
      await StatusBar.setBackgroundColor({ color: '#0B0F19' });
    } catch {
      // Fallback in web/PWA
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', '#0B0F19');
      }
    }
  }

  /**
   * Hide Splash Screen when React finishes mounting
   */
  public async hideSplashScreen() {
    if (!this.isNative) return;
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    } catch {}
  }

  /**
   * Native Haptic Feedback (with Web Vibration API fallback)
   */
  public async triggerHaptic(durationMs: number = 15, style: 'light' | 'medium' | 'heavy' = 'light') {
    if (this.isNative) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        const capStyle =
          style === 'heavy' ? ImpactStyle.Heavy : style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
        await Haptics.impact({ style: capStyle });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch {}
    }
  }

  /**
   * Schedule Native Android Local Alarm Notification for Dawa Reminders
   */
  public async scheduleDawaReminder(reminder: MedicineReminderNotification): Promise<boolean> {
    if (this.isNative) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: reminder.id,
                title: `⏰ Dawa Time: ${reminder.medicineName}`,
                body: `${reminder.dosage} - ${reminder.instructions}. Click to confirm intake.`,
                schedule: { at: reminder.scheduledTime },
                sound: 'beep.wav',
                actionTypeId: 'MEDICINE_INTAKE',
                extra: {
                  medicineName: reminder.medicineName,
                  dosage: reminder.dosage
                }
              }
            ]
          });
          return true;
        }
      } catch (err) {
        console.warn('Native LocalNotifications fallback:', err);
      }
    }

    // Web Notification Fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        const msUntil = Math.max(0, reminder.scheduledTime.getTime() - Date.now());
        setTimeout(() => {
          new Notification(`⏰ Dawa Time: ${reminder.medicineName}`, {
            body: `${reminder.dosage} - ${reminder.instructions}`,
            icon: '/icon-192.png'
          });
        }, Math.min(msUntil, 10000));
        return true;
      }
    }
    return false;
  }

  /**
   * Native Document / Prescription Camera Capture
   */
  public async capturePrescriptionPhoto(): Promise<string | null> {
    if (this.isNative) {
      try {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });
        return image.dataUrl || null;
      } catch (err) {
        console.warn('Native camera capture error:', err);
      }
    }

    // Web File input fallback
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  /**
   * Hardware Back Button Listener for Android
   */
  public registerHardwareBackButton(onBack: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handlePopState = () => {
      onBack();
    };
    window.addEventListener('popstate', handlePopState);

    // If Capacitor App plugin available
    let removeListener: (() => void) | null = null;
    if (this.isNative) {
      import('@capacitor/app')
        .then(({ App }) => {
          App.addListener('backButton', () => {
            onBack();
          }).then((handle) => {
            removeListener = () => handle.remove();
          });
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (removeListener) removeListener();
    };
  }

  public getDeviceInfo(): NativeDeviceInfo {
    return {
      platform: this.platform,
      isNative: this.isNative,
      appVersion: '1.0.0-android-release'
    };
  }
}

export const nativeBridge = new NativeBridgeService();
