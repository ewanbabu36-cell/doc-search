import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.docsearch.partner',
  appName: 'DocSearch Partner ERP',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: true,
    hostname: 'partner.docsearch.health'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0F172A'
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0F172A',
    preferredContentMode: 'recommended'
  }
};

export default config;
