import type { CapacitorConfig } from '@capacitor/cli';

const isDevLiveReload = process.env['CAPACITOR_LIVE_RELOAD'] === 'true';

const config: CapacitorConfig = {
  appId: 'com.docsearch.aarogya360',
  appName: 'Aarogya360 - DocSearch Patient App',
  webDir: 'dist/bundle',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: isDevLiveReload,
    hostname: 'patient.docsearch.in'
  },
  android: {
    allowMixedContent: isDevLiveReload,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0B0F19'
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0B0F19',
    scrollEnabled: true,
    preferredContentMode: 'mobile'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0B0F19',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#0284C7'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0F19',
      overlaysWebView: false
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_capsule',
      iconColor: '#0284C7',
      sound: 'beep.wav'
    }
  }
};

export default config;
