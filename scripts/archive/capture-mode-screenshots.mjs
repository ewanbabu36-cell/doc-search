import fs from 'node:fs';
import path from 'node:path';
import { runBrowserScenario, VIEWPORTS, createRoleAuth } from './category-5-cdp-helpers.mjs';

const ARTIFACTS_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\fcd6ba37-889d-4988-923b-e1071330fbf4';

async function main() {
  console.log('[*] Capturing visual screenshots of Daily Express vs Advance Pro Mode...');
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  // 1. Pharmacy in Daily Express Mode
  console.log('[*] Scenario 1: Pharmacy Daily Express Mode...');
  const res1 = await runBrowserScenario({
    url: 'http://localhost:5173/pharmacy',
    viewport: VIEWPORTS.desktop_laptop,
    setupStorage: `
      ${createRoleAuth('PHARMACIST', 'PHARMACY', 'pharmacy-medication')}
      localStorage.setItem('docsearch_platform_mode', 'EXPRESS');
    `,
    scenarioName: 'pharmacy_daily_express_mode'
  });

  const p1Src = path.resolve('audit-results/screenshots/pharmacy_daily_express_mode.png');
  const p1Dst = path.join(ARTIFACTS_DIR, 'pharmacy_daily_express_mode.png');
  if (fs.existsSync(p1Src)) {
    fs.copyFileSync(p1Src, p1Dst);
    console.log('[✔] Saved Pharmacy Express screenshot to:', p1Dst);
  }

  // 2. Pharmacy in Advance Pro Mode
  console.log('[*] Scenario 2: Pharmacy Advance Pro Mode...');
  const res2 = await runBrowserScenario({
    url: 'http://localhost:5173/pharmacy',
    viewport: VIEWPORTS.desktop_laptop,
    setupStorage: `
      ${createRoleAuth('PHARMACIST', 'PHARMACY', 'pharmacy-medication')}
      localStorage.setItem('docsearch_platform_mode', 'ADVANCED');
    `,
    scenarioName: 'pharmacy_advance_pro_mode'
  });

  const p2Src = path.resolve('audit-results/screenshots/pharmacy_advance_pro_mode.png');
  const p2Dst = path.join(ARTIFACTS_DIR, 'pharmacy_advance_pro_mode.png');
  if (fs.existsSync(p2Src)) {
    fs.copyFileSync(p2Src, p2Dst);
    console.log('[✔] Saved Pharmacy Advance Pro screenshot to:', p2Dst);
  }

  // 3. Solo Doctor Clinic in Daily Express Mode
  console.log('[*] Scenario 3: Solo Doctor Daily Express Mode...');
  const res3 = await runBrowserScenario({
    url: 'http://localhost:5173/clinic',
    viewport: VIEWPORTS.desktop_laptop,
    setupStorage: `
      ${createRoleAuth('DOCTOR', 'CLINIC', 'clinical-consultation')}
      localStorage.setItem('docsearch_platform_mode', 'EXPRESS');
    `,
    scenarioName: 'doctor_daily_express_mode'
  });

  const p3Src = path.resolve('audit-results/screenshots/doctor_daily_express_mode.png');
  const p3Dst = path.join(ARTIFACTS_DIR, 'doctor_daily_express_mode.png');
  if (fs.existsSync(p3Src)) {
    fs.copyFileSync(p3Src, p3Dst);
    console.log('[✔] Saved Doctor Express screenshot to:', p3Dst);
  }

  // 4. Solo Doctor Clinic in Advance Pro Mode
  console.log('[*] Scenario 4: Solo Doctor Advance Pro Mode...');
  const res4 = await runBrowserScenario({
    url: 'http://localhost:5173/clinic',
    viewport: VIEWPORTS.desktop_laptop,
    setupStorage: `
      ${createRoleAuth('DOCTOR', 'CLINIC', 'clinical-consultation')}
      localStorage.setItem('docsearch_platform_mode', 'ADVANCED');
    `,
    scenarioName: 'doctor_advance_pro_mode'
  });

  const p4Src = path.resolve('audit-results/screenshots/doctor_advance_pro_mode.png');
  const p4Dst = path.join(ARTIFACTS_DIR, 'doctor_advance_pro_mode.png');
  if (fs.existsSync(p4Src)) {
    fs.copyFileSync(p4Src, p4Dst);
    console.log('[✔] Saved Doctor Advance Pro screenshot to:', p4Dst);
  }

  console.log('[*] ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
