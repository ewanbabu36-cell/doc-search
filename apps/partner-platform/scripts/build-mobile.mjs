#!/usr/bin/env node
/**
 * DocSearch Partner ERP Mobile Bundle Preparer (Android & iOS Capacitor)
 * Verifies production Vite bundle and outputs mobile deployment manifest.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const distDir = path.join(appRoot, 'dist');

if (!fs.existsSync(distDir)) {
  console.log('[*] Building Partner ERP web bundle...');
  execSync('npx vite build', { cwd: appRoot, stdio: 'inherit' });
}

const manifest = {
  appId: 'com.docsearch.partner',
  appName: 'DocSearch Partner ERP',
  bundleDir: distDir,
  targets: ['Android Tablet / Phone (API 24+)', 'Apple iPad / iPhone (iOS 13+)'],
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(distDir, 'mobile-capacitor-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('[✔] DocSearch Partner ERP Capacitor mobile bundle ready:', distDir);
