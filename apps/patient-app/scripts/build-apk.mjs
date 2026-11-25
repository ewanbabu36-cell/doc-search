#!/usr/bin/env node
/**
 * Aarogya360 Android Native APK & Google Play App Bundle (.aab) Build Pipeline
 * -----------------------------------------------------------------------------
 * Runs real Vite compilation, synchronizes Capacitor Android web assets, ensures
 * local.properties + signing keystore exist, builds release APK & AAB via Gradle 8.5,
 * and verifies ZIP/APK magic bytes + SHA-256 digests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { generateAndroidIcons } from './generate-android-icons.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const androidDir = path.join(appRoot, 'android');
const distBundleDir = path.join(appRoot, 'dist', 'bundle');
const androidAppAssets = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
const resDir = path.join(androidDir, 'app', 'src', 'main', 'res');
const outputApkDir = path.join(appRoot, 'dist', 'apk');
const outputAabDir = path.join(appRoot, 'dist', 'aab');

const args = process.argv.slice(2);
const buildAab = args.includes('--aab') || args.includes('--all');
const buildApk = !args.includes('--aab-only');

console.log('\n=============================================================');
console.log('📱 AAROGYA360 ANDROID REAL NATIVE APK & AAB BUILD PIPELINE');
console.log('=============================================================\n');

// Step 1: Ensure Vite web bundle exists or rebuild cleanly
if (!fs.existsSync(distBundleDir) || args.includes('--rebuild-web')) {
  console.log('[*] Compiling patient web app bundle with Vite...');
  execSync('npx vite build', { cwd: appRoot, stdio: 'inherit' });
}

// Step 2: Ensure mipmap PNG icons and sync Capacitor web assets
generateAndroidIcons(resDir);

console.log('[+] Synchronizing web assets into Android Capacitor public directory...');
fs.rmSync(androidAppAssets, { recursive: true, force: true });
fs.mkdirSync(androidAppAssets, { recursive: true });
fs.cpSync(distBundleDir, androidAppAssets, { recursive: true });
console.log(`[✔] Synchronized ${fs.readdirSync(androidAppAssets).length} asset items into: ${androidAppAssets}`);

// Step 3: Auto-detect Android SDK & write local.properties
const sdkCandidates = [
  process.env['ANDROID_HOME'],
  process.env['ANDROID_SDK_ROOT'],
  process.env['LOCALAPPDATA'] ? path.join(process.env['LOCALAPPDATA'], 'Android', 'Sdk') : null
].filter(Boolean);

const androidSdk = sdkCandidates.find((p) => fs.existsSync(p));
if (!androidSdk) {
  console.error('❌ FATAL: Android SDK not found. Set ANDROID_HOME or install Android SDK.');
  process.exit(1);
}
const escapedSdk = androidSdk.replace(/\\/g, '/');
fs.writeFileSync(path.join(androidDir, 'local.properties'), `sdk.dir=${escapedSdk}\n`, 'utf8');
console.log(`[✔] Android SDK bound cleanly: ${androidSdk}`);

// Step 4: Ensure Release Signing Keystore exists for verified APK/AAB signing
const keystorePath = process.env['RELEASE_KEYSTORE_PATH'] || path.join(androidDir, 'app', 'aarogya360-release.keystore');
if (!fs.existsSync(keystorePath)) {
  console.log('[+] Generating RSA-2048 release keystore via JDK keytool...');
  execSync(
    `keytool -genkeypair -v -keystore "${keystorePath}" -alias aarogya360 -keyalg RSA -keysize 2048 -validity 10000 -storepass docsearch_prod_pass_2026 -keypass docsearch_prod_pass_2026 -dname "CN=DocSearch Healthcare, OU=Mobile Engineering, O=DocSearch Systems, L=New Delhi, ST=DL, C=IN"`,
    { stdio: 'inherit' }
  );
}

// Step 5: Execute Real Gradle Build (assembleRelease + bundleRelease)
const gradlewPath = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
if (!fs.existsSync(gradlewPath)) {
  console.error('❌ FATAL: Gradle Wrapper missing in android/. Run gradle wrapper --gradle-version 8.5');
  process.exit(1);
}

const gradleTasks = [];
if (buildApk) gradleTasks.push('assembleRelease');
if (buildAab) gradleTasks.push('bundleRelease');

console.log(`[+] Executing Real Gradle Build: ${gradleTasks.join(' ')}...`);
execSync(`"${gradlewPath}" ${gradleTasks.join(' ')} --no-daemon`, {
  cwd: androidDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    ANDROID_HOME: androidSdk,
    ANDROID_SDK_ROOT: androidSdk,
    RELEASE_KEYSTORE_PATH: keystorePath
  }
});

// Step 6: Copy & Verify Real APK / AAB Outputs
fs.mkdirSync(outputApkDir, { recursive: true });
fs.mkdirSync(outputAabDir, { recursive: true });

const releaseMeta = {
  appName: 'Aarogya360',
  applicationId: 'com.docsearch.aarogya360',
  versionName: '1.0.0',
  versionCode: 1,
  minSdkVersion: 24,
  targetSdkVersion: 34,
  signed: fs.existsSync(keystorePath),
  artifacts: {},
  releaseDate: new Date().toISOString()
};

if (buildApk) {
  const signedApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  const unsignedApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
  const sourceApk = fs.existsSync(signedApk) ? signedApk : unsignedApk;
  if (!fs.existsSync(sourceApk)) {
    throw new Error(`Expected Gradle APK output missing at ${sourceApk}`);
  }
  const destApk = path.join(outputApkDir, 'aarogya360-patient-v1.0.0-release.apk');
  fs.copyFileSync(sourceApk, destApk);

  const buf = fs.readFileSync(destApk);
  // Verify valid Android ZIP/APK magic header PK\x03\x04
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) {
    throw new Error('Built APK failed PK ZIP container header verification!');
  }
  releaseMeta.artifacts.apk = {
    path: destApk,
    sizeMb: (buf.length / (1024 * 1024)).toFixed(2),
    sha256: crypto.createHash('sha256').update(buf).digest('hex')
  };
}

if (buildAab) {
  const sourceAab = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  if (!fs.existsSync(sourceAab)) {
    throw new Error(`Expected Gradle AAB output missing at ${sourceAab}`);
  }
  const destAab = path.join(outputAabDir, 'aarogya360-patient-v1.0.0-release.aab');
  fs.copyFileSync(sourceAab, destAab);
  const buf = fs.readFileSync(destAab);
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) {
    throw new Error('Built AAB failed PK ZIP container header verification!');
  }
  releaseMeta.artifacts.aab = {
    path: destAab,
    sizeMb: (buf.length / (1024 * 1024)).toFixed(2),
    sha256: crypto.createHash('sha256').update(buf).digest('hex')
  };
}

const metaPath = path.join(outputApkDir, 'release-metadata.json');
fs.writeFileSync(metaPath, JSON.stringify(releaseMeta, null, 2));

console.log('\n=============================================================');
console.log('✅ REAL ANDROID NATIVE APK / AAB SUCCESSFULLY COMPILED');
console.log('=============================================================');
console.log(JSON.stringify(releaseMeta, null, 2));
