#!/usr/bin/env node
/**
 * DocSearch Production Docker & Capacitor Deployment Verification Suite
 * Validates multi-container topology, service mappings, ingress reverse proxy, and mobile build specifications.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n=============================================================');
console.log('🐳 DOCSEARCH PRODUCTION DOCKER & MOBILE DEPLOYMENT AUDITOR');
console.log('=============================================================\n');

let failed = false;

function check(label, condition, details = '') {
  if (condition) {
    console.log(`[\x1b[32mPASS\x1b[0m] ${label}`);
  } else {
    console.error(`[\x1b[31mFAIL\x1b[0m] ${label} - ${details}`);
    failed = true;
  }
}

// 1. Check Dockerfiles
const requiredDockerfiles = [
  'docker/Dockerfile.api-gateway',
  'docker/Dockerfile.pacs-server',
  'docker/Dockerfile.web-app',
  'docker/Dockerfile.nginx-ingress'
];

for (const df of requiredDockerfiles) {
  const fullPath = path.join(rootDir, df);
  check(`Dockerfile exists: ${df}`, fs.existsSync(fullPath));
}

// 2. Check NGINX configurations
const requiredNginxConfigs = [
  'docker/nginx/nginx-production-ingress.conf',
  'docker/nginx/default.conf',
  'docker/nginx/nginx.conf'
];

for (const nc of requiredNginxConfigs) {
  const fullPath = path.join(rootDir, nc);
  check(`NGINX config exists: ${nc}`, fs.existsSync(fullPath));
}

// 3. Inspect docker-compose.yml
const composePath = path.join(rootDir, 'docker-compose.yml');
const composeContent = fs.readFileSync(composePath, 'utf8');

const expectedServices = [
  'postgres',
  'redis',
  'api-gateway',
  'pacs-server',
  'partner-platform',
  'patient-app',
  'company-platform',
  'landing-page',
  'nginx-ingress'
];

for (const svc of expectedServices) {
  check(
    `docker-compose.yml defines service '${svc}'`,
    composeContent.includes(`${svc}:`)
  );
}

// 4. Inspect docker-compose.prod.yml
const prodComposePath = path.join(rootDir, 'docker-compose.prod.yml');
const prodComposeContent = fs.readFileSync(prodComposePath, 'utf8');

for (const svc of expectedServices) {
  check(
    `docker-compose.prod.yml defines override for '${svc}'`,
    prodComposeContent.includes(`${svc}:`)
  );
}

// 5. Ingress reverse proxy routes verification
const ingressConfigPath = path.join(rootDir, 'docker/nginx/nginx-production-ingress.conf');
const ingressContent = fs.readFileSync(ingressConfigPath, 'utf8');

check('Ingress routes /api/ to api_gateway_upstream', ingressContent.includes('proxy_pass http://api_gateway_upstream/api/;'));
check('Ingress routes /pacs/ to pacs_upstream', ingressContent.includes('proxy_pass http://pacs_upstream/;'));
check('Ingress routes /partner/ to partner_platform_upstream', ingressContent.includes('proxy_pass http://partner_platform_upstream/;'));
check('Ingress routes /patient/ to patient_app_upstream', ingressContent.includes('proxy_pass http://patient_app_upstream/;'));
check('Ingress routes /hq/ to company_platform_upstream', ingressContent.includes('proxy_pass http://company_platform_upstream/;'));
check('Ingress routes / to landing_page_upstream', ingressContent.includes('proxy_pass http://landing_page_upstream/;'));

// 6. Capacitor Mobile App Packaging Verification
const capacitorConfigPath = path.join(rootDir, 'apps/patient-app/capacitor.config.ts');
check('Capacitor config exists in patient-app', fs.existsSync(capacitorConfigPath));
if (fs.existsSync(capacitorConfigPath)) {
  const capConfig = fs.readFileSync(capacitorConfigPath, 'utf8');
  check('Capacitor App ID is com.docsearch.aarogya360', capConfig.includes('com.docsearch.aarogya360'));
}

const androidManifestPath = path.join(rootDir, 'apps/patient-app/android/app/src/main/AndroidManifest.xml');
check('Android Manifest exists for native build', fs.existsSync(androidManifestPath));
if (fs.existsSync(androidManifestPath)) {
  const manifest = fs.readFileSync(androidManifestPath, 'utf8');
  check('Manifest includes CAMERA permission', manifest.includes('android.permission.CAMERA'));
  check('Manifest includes POST_NOTIFICATIONS permission', manifest.includes('android.permission.POST_NOTIFICATIONS'));
  check('Manifest includes SCHEDULE_EXACT_ALARM permission', manifest.includes('android.permission.SCHEDULE_EXACT_ALARM'));
  check('Manifest defines MainActivity', manifest.includes('com.docsearch.aarogya360.MainActivity'));
}

const apkArtifactPath = path.join(rootDir, 'apps/patient-app/dist/apk/aarogya360-patient-v1.0.0-release.apk');
check('Generated Android APK artifact exists', fs.existsSync(apkArtifactPath));

const nativeBridgePath = path.join(rootDir, 'apps/patient-app/src/services/native-bridge.ts');
check('Native Bridge hardware service exists', fs.existsSync(nativeBridgePath));

console.log('\n=============================================================');
if (failed) {
  console.error('❌ DEPLOYMENT VERIFICATION ENCOUNTERED FAILURES');
  process.exit(1);
} else {
  console.log('✅ ALL DOCKER COMPOSE & CAPACITOR VERIFICATIONS PASSED (100%)');
  console.log('=============================================================\n');
  process.exit(0);
}
