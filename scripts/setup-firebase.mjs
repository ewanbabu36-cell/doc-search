#!/usr/bin/env node
/**
 * DocSearch Universal Firebase FCM HTTP v1 Setup & Verification CLI
 * -------------------------------------------------------------------
 * Authenticates via Google Service Account JSON (Modern FCM HTTP v1 OAuth2 RS256),
 * optionally stages google-services.json for Android APK notifications,
 * tests real OAuth2 token exchange with Google, and saves credentials to .env.
 *
 * Usage:
 *   1. Inspect current .env Firebase status:
 *      node scripts/setup-firebase.mjs
 *
 *   2. Setup & Verify with downloaded Firebase Service Account JSON:
 *      node scripts/setup-firebase.mjs "C:\Downloads\docsearch-firebase-adminsdk.json" --save
 *
 *   3. Also install Android google-services.json for APK push notifications:
 *      node scripts/setup-firebase.mjs "C:\Downloads\adminsdk.json" --google-services "C:\Downloads\google-services.json" --save
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const ANDROID_GOOGLE_SERVICES_DEST = path.join(ROOT_DIR, 'apps', 'patient-app', 'android', 'app', 'google-services.json');

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${BOLD}${CYAN}`);
console.log('===============================================================');
console.log('       DOC SEARCH — FIREBASE FCM v1 SETUP & VERIFIER CLI       ');
console.log('===============================================================' + RESET);

const args = process.argv.slice(2);
let serviceAccountPath = '';
let googleServicesPath = '';
let shouldSave = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--save') shouldSave = true;
  else if (a === '--google-services' && args[i + 1]) {
    googleServicesPath = args[i + 1];
    i++;
  } else if (!a.startsWith('--') && !serviceAccountPath) {
    serviceAccountPath = a;
  }
}

let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';

let saJsonText = '';
if (serviceAccountPath) {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`\n${RED}❌ File not found: ${serviceAccountPath}${RESET}\n`);
    process.exit(1);
  }
  saJsonText = fs.readFileSync(serviceAccountPath, 'utf8');
} else {
  const m = envContent.match(/^FIREBASE_SERVICE_ACCOUNT_KEY=(.+)$/m);
  if (m) {
    let raw = m[1].trim().replace(/^['"]|['"]$/g, '');
    if (!raw.startsWith('{') && fs.existsSync(raw)) {
      saJsonText = fs.readFileSync(raw, 'utf8');
    } else {
      saJsonText = raw;
    }
  }
}

if (!saJsonText) {
  console.log(`\n${YELLOW}⚠️  Firebase Service Account JSON not found in .env or CLI arguments!${RESET}\n`);
  console.log(`${BOLD}How to get Firebase Service Account JSON (Free Spark Plan):${RESET}`);
  console.log('  1. Open Firebase Console: https://console.firebase.google.com/');
  console.log('  2. Click "Add Project" (e.g. docsearch-healthcare) -> Create Project.');
  console.log('  3. Click Gear Icon (⚙️) -> Project Settings -> "Service accounts" tab.');
  console.log('  4. Click "Generate new private key" -> Downloads a .json file.');
  console.log(`\n${BOLD}Run setup command with that .json file:${RESET}`);
  console.log(`  node scripts/setup-firebase.mjs "C:\\path\\to\\service-account.json" --save\n`);
  process.exit(1);
}

let sa;
try {
  sa = JSON.parse(saJsonText);
  if (!sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error('JSON missing project_id, client_email, or private_key');
  }
} catch (err) {
  console.error(`\n${RED}❌ Invalid Firebase Service Account JSON: ${err.message}${RESET}\n`);
  process.exit(1);
}

console.log(`\n🔍 ${BOLD}Testing Firebase Project Credentials:${RESET}`);
console.log(`  • Project ID   : ${CYAN}${sa.project_id}${RESET}`);
console.log(`  • Client Email : ${CYAN}${sa.client_email}${RESET}`);

async function run() {
  console.log(`\n⏳ ${CYAN}Exchanging RS256 JWT with Google OAuth2 (https://oauth2.googleapis.com/token)...${RESET}`);
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claims = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: nowSec,
        exp: nowSec + 3600
      })
    ).toString('base64url');
    const unsigned = `${header}.${claims}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsigned);
    const sig = signer.sign(sa.private_key.replace(/\\n/g, '\n'), 'base64url');

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${unsigned}.${sig}`
      }).toString(),
      signal: AbortSignal.timeout(8000)
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description || data.error || res.statusText);
    }

    console.log(`\n${GREEN}✅ SUCCESS: Firebase FCM HTTP v1 OAuth2 Authenticated!${RESET}`);
    console.log(`   Google OAuth2 Access Token minted cleanly (expires in ${data.expires_in}s).`);

    if (googleServicesPath) {
      if (fs.existsSync(googleServicesPath)) {
        fs.copyFileSync(googleServicesPath, ANDROID_GOOGLE_SERVICES_DEST);
        console.log(`${GREEN}📱 Android App Staged: Copied google-services.json -> apps/patient-app/android/app/google-services.json${RESET}`);
      } else {
        console.log(`${YELLOW}⚠️  Could not find google-services.json at: ${googleServicesPath}${RESET}`);
      }
    }

    if (shouldSave) {
      const minified = JSON.stringify(sa);
      const pairs = {
        FIREBASE_PROJECT_ID: sa.project_id,
        FIREBASE_SERVICE_ACCOUNT_KEY: `'${minified}'`
      };
      for (const [k, v] of Object.entries(pairs)) {
        const re = new RegExp(`^${k}=.*$`, 'm');
        if (re.test(envContent)) envContent = envContent.replace(re, `${k}=${v}`);
        else envContent = `${envContent.trimEnd()}\n${k}=${v}`;
      }
      fs.writeFileSync(ENV_PATH, envContent.trimEnd() + '\n', 'utf8');
      console.log(`${GREEN}💾 SAVED: Firebase HTTP v1 credentials persisted to .env!${RESET}\n`);
    }
  } catch (err) {
    console.error(`\n${RED}❌ ERROR: Firebase OAuth2 authentication failed: ${err.message}${RESET}\n`);
    process.exit(1);
  }
}

run();
