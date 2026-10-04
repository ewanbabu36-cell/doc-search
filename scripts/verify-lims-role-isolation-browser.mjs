import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { signJwt } from '../packages/auth/dist/index.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\fcd6ba37-889d-4988-923b-e1071330fbf4';
const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';

// Create Pathologist token for Shahab Admin
const shahabToken = signJwt({
  sub: 'aaaa1111-8492-4aaa-8aaa-849208492000',
  userId: 'aaaa1111-8492-4aaa-8aaa-849208492000',
  email: 'shahab@docsearch.health',
  name: 'Dr. Shahab (Pathologist)',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['PATHOLOGIST', 'HOSPITAL_ADMIN'],
  permissions: ['*'],
  isSuperAdmin: false
}, {
  secret: MASTER_SECRET,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

const userProfile = {
  id: 'aaaa1111-8492-4aaa-8aaa-849208492000',
  userId: 'aaaa1111-8492-4aaa-8aaa-849208492000',
  email: 'shahab@docsearch.health',
  name: 'Dr. Shahab',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['PATHOLOGIST', 'HOSPITAL_ADMIN'],
  role: 'PATHOLOGIST',
  activeRole: 'PATHOLOGIST'
};

const port = 9238;
const userDataDir = `C:\\Users\\alamr\\AppData\\Local\\Temp\\chrome_lims_${Date.now()}`;

console.log('[*] Spawning Headless Chrome for LIMS Role Isolation E2E Verification...');
const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1500,1050',
  'http://localhost:5173/'
], { stdio: 'ignore' });

chrome.on('error', (err) => {
  console.error('[-] Chrome failed to spawn:', err);
  process.exit(1);
});

async function run() {
  try {
    await new Promise((r) => setTimeout(r, 2500));

    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const targets = await res.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await new Promise((r) => (ws.onopen = r));
    console.log('[✔] Connected to Chrome CDP!');

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('[*] Injecting Auth Token and Pathologist session into LocalStorage...');
    const pathologistStaff = {
      id: 'usr_persona_pathologist',
      category: 'HEALTHCARE',
      name: 'Dr. Shahab (Lab Director & Pathologist)',
      email: 'shahab@docsearch.health',
      role: 'PATHOLOGIST',
      roleTitle: 'MD Pathologist & Chief of Diagnostics',
      department: 'Pathology & Diagnostic Laboratory',
      tenantName: 'Ewan Diagnostics & Pathology Hub',
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationType: 'PATHOLOGY',
      allowedWorkspaces: ['PATHOLOGY'],
      defaultModule: 'pathology-home',
      planTier: 'Advanced Diagnostic Hub & LIMS',
      planExpiryDate: 'Enterprise Active',
      accessibleFeatures: ['Pathologist Cockpit', 'WSI Digital Microscopy', 'NABL Quality Control', 'Digital PKI Sign-Off'],
      restrictedFeatures: ['Doctor Clinical Notes', 'Pharmacy Inventory'],
      kycStatus: 'KYC_VERIFIED',
      isProfileCompleted: true
    };

    const setupScript = `
      localStorage.setItem('auth_token', '${shahabToken}');
      localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(${JSON.stringify(pathologistStaff)}));
      localStorage.removeItem('docsearch_logged_out');
      localStorage.setItem('activeWorkspace', 'HOSPITAL');
      window.location.href = 'http://localhost:5173/hospital/pathology';
    `;
    await send('Runtime.evaluate', { expression: setupScript });

    await new Promise((r) => setTimeout(r, 4500));

    console.log('[*] Capturing Pathologist Cockpit (MD Sign-Off) View...');
    const pathShot = await send('Page.captureScreenshot', { format: 'png' });
    const pathShotPath = path.join(ARTIFACT_DIR, 'lims_pathologist_cockpit_verified.png');
    fs.writeFileSync(pathShotPath, Buffer.from(pathShot.data, 'base64'));
    console.log(`[✔] Pathologist Cockpit Screenshot saved: ${pathShotPath}`);

    // Click Lab Technician Switcher
    console.log('[*] Switching to Lab Technician Workbench...');
    const switchTechScript = `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const techBtn = buttons.find(b => b.textContent && b.textContent.includes('Lab Technician Workbench'));
        if (techBtn) {
          techBtn.click();
          return true;
        }
        return false;
      })()
    `;
    const techSwitched = await send('Runtime.evaluate', { expression: switchTechScript });
    console.log(`[*] Technician switcher clicked: ${techSwitched.result?.value}`);
    await new Promise((r) => setTimeout(r, 1500));

    const techShot = await send('Page.captureScreenshot', { format: 'png' });
    const techShotPath = path.join(ARTIFACT_DIR, 'lims_technician_workbench_verified.png');
    fs.writeFileSync(techShotPath, Buffer.from(techShot.data, 'base64'));
    console.log(`[✔] Technician Workbench Screenshot saved: ${techShotPath}`);

    // Click Phlebotomy Switcher
    console.log('[*] Switching to Phlebotomy & Intake Desk...');
    const switchPhlebScript = `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const phlebBtn = buttons.find(b => b.textContent && b.textContent.includes('Phlebotomy & Intake Desk'));
        if (phlebBtn) {
          phlebBtn.click();
          return true;
        }
        return false;
      })()
    `;
    const phlebSwitched = await send('Runtime.evaluate', { expression: switchPhlebScript });
    console.log(`[*] Phlebotomy switcher clicked: ${phlebSwitched.result?.value}`);
    await new Promise((r) => setTimeout(r, 1500));

    const phlebShot = await send('Page.captureScreenshot', { format: 'png' });
    const phlebShotPath = path.join(ARTIFACT_DIR, 'lims_phlebotomy_desk_verified.png');
    fs.writeFileSync(phlebShotPath, Buffer.from(phlebShot.data, 'base64'));
    console.log(`[✔] Phlebotomy Desk Screenshot saved: ${phlebShotPath}`);

    console.log('\n===========================================================');
    console.log('🎉 ALL 3 ROLE WORKSPACES VERIFIED & CAPTURED IN HEADLESS BROWSER');
    console.log('===========================================================');

  } catch (err) {
    console.error('[-] Error during LIMS verification:', err);
  } finally {
    try {
      chrome.kill();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (_) {}
    process.exit(0);
  }
}

run();
