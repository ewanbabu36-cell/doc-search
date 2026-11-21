/**
 * DOC SEARCH — Phase 7 Master Frontend Certification
 * Headless Google Chrome Real Browser CDP Verification across all 4 frontend applications:
 * 1. Partner Platform (:5173)
 * 2. Patient App (:5174)
 * 3. Landing Page (:5175)
 * 4. Company Platform (:5177)
 */

import { runBrowserScenario, VIEWPORTS, createDoctorAuth, createCompanyAdminAuth, closeChrome, sleep } from '../../scripts/archive/category-5-cdp-helpers.mjs';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================================');
console.log('STARTING PHASE 7 MASTER FRONTEND CDP REAL-BROWSER CERTIFICATION');
console.log('Targeting: Partner Platform (:5173), Patient App (:5174), Landing (:5175), Company (:5177)');
console.log('================================================================================\n');

const results = [];

async function testScenario(name, config) {
  process.stdout.write(`[*] Testing ${name}... `);
  try {
    const res = await runBrowserScenario({
      scenarioName: name,
      timeoutMs: 25000,
      ...config
    });

    const dom = res.dom || {};
    const isHealthy = res.success !== false && (dom.bodyLength > 100 || (res.domLength && res.domLength > 100));
    const fatalErrors = (res.uncaughtExceptions || []).filter(e => !e.includes('ResizeObserver') && !e.includes('favicon'));

    if (isHealthy && fatalErrors.length === 0) {
      console.log(`PASS (bodyLength: ${dom.bodyLength || 0}, interactive: ${dom.buttonCount || 0} buttons)`);
      results.push({
        name,
        status: 'PASS',
        details: res
      });
    } else {
      console.log(`FAIL (healthy: ${isHealthy}, fatalErrors: ${fatalErrors.length})`);
      results.push({
        name,
        status: 'FAIL',
        details: res,
        errors: fatalErrors
      });
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    results.push({
      name,
      status: 'ERROR',
      error: err.message
    });
  }
}

// 1. Landing Page (:5175)
await testScenario('Landing Page (Port 5175) Public Rendering', {
  url: 'http://localhost:5175/',
  viewport: VIEWPORTS.desktop_1080
});

// 2. Patient App (:5174)
await testScenario('Patient Mobile PWA (Port 5174) Mobile Viewport', {
  url: 'http://localhost:5174/',
  viewport: VIEWPORTS.mobile
});

// 3. Company Platform (:5177)
await testScenario('Company Executive Platform (Port 5177) Unauthenticated Shell', {
  url: 'http://localhost:5177/',
  viewport: VIEWPORTS.desktop_1080
});

// 4. Partner Platform (:5173) Unauthenticated
await testScenario('Partner Platform (Port 5173) Unauthenticated Shell', {
  url: 'http://localhost:5173/',
  viewport: VIEWPORTS.desktop_1080
});

// 5. Partner Platform (:5173) Authenticated Dashboard
await testScenario('Partner Platform (Port 5173) Authenticated Doctor Dashboard', {
  url: 'http://localhost:5173/',
  viewport: VIEWPORTS.desktop_1080,
  setupStorage: createDoctorAuth()
});

closeChrome();

const passCount = results.filter(r => r.status === 'PASS').length;
console.log('\n================================================================================');
console.log(`FRONTEND CERTIFICATION COMPLETE: ${passCount}/${results.length} PASSED`);
console.log('================================================================================\n');

fs.writeFileSync(
  path.resolve('tests/frontend/phase7-frontend-cdp-results.json'),
  JSON.stringify({ timestamp: new Date().toISOString(), passCount, total: results.length, results }, null, 2)
);

if (passCount === results.length) {
  process.exit(0);
} else {
  process.exit(1);
}
