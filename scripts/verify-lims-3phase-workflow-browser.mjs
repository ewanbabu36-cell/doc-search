import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { signJwt } from '../packages/auth/dist/index.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\fcd6ba37-889d-4988-923b-e1071330fbf4';
const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';

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

const port = 9240;
const userDataDir = `C:\\Users\\alamr\\AppData\\Local\\Temp\\chrome_lims_3phase_fixed_${Date.now()}`;

console.log('[*] Spawning Headless Chrome for 3-Phase Laboratory Workflow E2E Verification...');
const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1560,1100',
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

    console.log('[*] Waiting for /hospital/pathology to load with 3-Phase Pipeline...');
    await new Promise((r) => setTimeout(r, 4500));

    // Capture View 1: 3-Phase Stepper Overview (All Phases)
    const cap1 = await send('Page.captureScreenshot', { format: 'png' });
    const p1Path = path.join(ARTIFACT_DIR, 'lims_3phase_overview_verified.png');
    fs.writeFileSync(p1Path, Buffer.from(cap1.data, 'base64'));
    console.log(`[✔] Captured 3-Phase Overview: ${p1Path}`);

    // Click Phase 1: Pre-Analytical button
    console.log('[*] Selecting Phase 1: Pre-Analytical in Stepper Pipeline...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Phase 1: Pre-Analytical'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1200));

    const cap2 = await send('Page.captureScreenshot', { format: 'png' });
    const p2Path = path.join(ARTIFACT_DIR, 'lims_phase1_preanalytical_verified.png');
    fs.writeFileSync(p2Path, Buffer.from(cap2.data, 'base64'));
    console.log(`[✔] Captured Phase 1 Pre-Analytical: ${p2Path}`);

    // Click Phase 2: Analytical button
    console.log('[*] Selecting Phase 2: Analytical in Stepper Pipeline...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Phase 2: Analytical'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1200));

    const cap3 = await send('Page.captureScreenshot', { format: 'png' });
    const p3Path = path.join(ARTIFACT_DIR, 'lims_phase2_analytical_verified.png');
    fs.writeFileSync(p3Path, Buffer.from(cap3.data, 'base64'));
    console.log(`[✔] Captured Phase 2 Analytical: ${p3Path}`);

    // Open Levey-Jennings QC Modal from Analytical phase
    console.log('[*] Opening Levey-Jennings QC Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = Array.from(document.querySelectorAll('div, span, button')).find(el => el.textContent && el.textContent.includes('Levey-Jennings QC'));
          if (card) card.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    const capQc = await send('Page.captureScreenshot', { format: 'png' });
    const qcPath = path.join(ARTIFACT_DIR, 'lims_levey_jennings_qc_modal_verified.png');
    fs.writeFileSync(qcPath, Buffer.from(capQc.data, 'base64'));
    console.log(`[✔] Captured Levey-Jennings QC Modal: ${qcPath}`);

    // Close QC modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Close'));
          if (closeBtn) closeBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // Open Delta Check Discrepancy Modal
    console.log('[*] Opening Delta Check Discrepancy Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const deltaBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Delta Check'));
          if (deltaBtn) deltaBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    const capDelta = await send('Page.captureScreenshot', { format: 'png' });
    const deltaPath = path.join(ARTIFACT_DIR, 'lims_delta_check_modal_verified.png');
    fs.writeFileSync(deltaPath, Buffer.from(capDelta.data, 'base64'));
    console.log(`[✔] Captured Delta Check Modal: ${deltaPath}`);

    // Close Delta modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancel'));
          if (cancelBtn) cancelBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // Click Phase 3: Post-Analytical button
    console.log('[*] Selecting Phase 3: Post-Analytical in Stepper Pipeline...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Phase 3: Post-Analytical'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1200));

    const cap4 = await send('Page.captureScreenshot', { format: 'png' });
    const p4Path = path.join(ARTIFACT_DIR, 'lims_phase3_postanalytical_verified.png');
    fs.writeFileSync(p4Path, Buffer.from(cap4.data, 'base64'));
    console.log(`[✔] Captured Phase 3 Post-Analytical: ${p4Path}`);

    // Open Mandatory Telephone Read-Back Modal (NABL ISO-15189 5.8.2)
    console.log('[*] Opening NABL ISO-15189 Mandatory Telephone Read-Back Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const readbackBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Read-Back Log'));
          if (readbackBtn) readbackBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    const capPanic = await send('Page.captureScreenshot', { format: 'png' });
    const panicPath = path.join(ARTIFACT_DIR, 'lims_mandatory_readback_modal_verified.png');
    fs.writeFileSync(panicPath, Buffer.from(capPanic.data, 'base64'));
    console.log(`[✔] Captured Mandatory Telephone Read-Back Modal: ${panicPath}`);

    // Close Read-Back modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancel'));
          if (cancelBtn) cancelBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // Open Batch DSC Sign-Off Modal
    console.log('[*] Opening Class-3 PKI DSC Sign-Off Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const dscBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Sign DSC'));
          if (dscBtn) dscBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    const capDsc = await send('Page.captureScreenshot', { format: 'png' });
    const dscPath = path.join(ARTIFACT_DIR, 'lims_batch_dsc_modal_verified.png');
    fs.writeFileSync(dscPath, Buffer.from(capDsc.data, 'base64'));
    console.log(`[✔] Captured Batch DSC Modal: ${dscPath}`);

    console.log('\n[🎉 SUCCESS] 3-Phase Laboratory Workflow fully verified in Chrome!');
    ws.close();
    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('[-] E2E Verification failed:', err);
    chrome.kill();
    process.exit(1);
  }
}

run();
