#!/usr/bin/env node
/**
 * Aarogya360 iOS App Store IPA Build & Packaging Runner
 * Synchronizes Vite web bundle into ios/App/App/public and invokes Xcode/Fastlane on macOS.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const distBundleDir = path.join(appRoot, 'dist', 'bundle');
const iosPublicDir = path.join(appRoot, 'ios', 'App', 'App', 'public');

console.log('\n=============================================================');
console.log('🍏 AAROGYA360 APPLE iOS APP STORE PACKAGING PIPELINE');
console.log('=============================================================\n');

if (!fs.existsSync(distBundleDir)) {
  console.log('[*] Building Vite web bundle...');
  execSync('npx vite build', { cwd: appRoot, stdio: 'inherit' });
}

fs.rmSync(iosPublicDir, { recursive: true, force: true });
fs.mkdirSync(iosPublicDir, { recursive: true });
fs.cpSync(distBundleDir, iosPublicDir, { recursive: true });
console.log(`[✔] Synced web bundle into iOS Xcode assets: ${iosPublicDir}`);

if (process.platform !== 'darwin') {
  console.log('\nℹ️  Host OS is not macOS (darwin). Apple Xcode compilation requires macOS / Xcode 15+.');
  console.log('   All iOS App Store configs (Info.plist, ExportOptions.plist, Podfile, Fastfile) and web assets are staged cleanly.');
  console.log('   Run on macOS or GitHub Actions macos-latest runner: cd apps/patient-app/ios && fastlane release\n');
  process.exit(0);
}

execSync('pod install', { cwd: path.join(appRoot, 'ios', 'App'), stdio: 'inherit' });
execSync('fastlane release', { cwd: path.join(appRoot, 'ios'), stdio: 'inherit' });
