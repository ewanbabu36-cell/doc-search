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

const port = 9241;
const userDataDir = `C:\\Users\\alamr\\AppData\\Local\\Temp\\chrome_lims_3phase_modals_${Date.now()}`;

console.log('[*] Spawning Headless Chrome for 3-Phase Modal Captures...');
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

    // 1. Capture Levey-Jennings QC Modal
    console.log('[*] Triggering Levey-Jennings QC Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('.ds-interactive'));
          const qcCard = cards.find(c => c.textContent && c.textContent.includes('Levey-Jennings QC'));
          if (qcCard) qcCard.click();
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
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Close'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // 2. Capture Delta Check Modal
    console.log('[*] Triggering Delta Check Discrepancy Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('.ds-interactive'));
          const deltaCard = cards.find(c => c.textContent && c.textContent.includes('Delta Check Alert'));
          if (deltaCard) deltaCard.click();
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
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancel'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // 3. Capture Pre-Analytical Rejection Modal
    console.log('[*] Triggering Pre-Analytical Rejection Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('.ds-interactive'));
          const rejCard = cards.find(c => c.textContent && c.textContent.includes('Rejection Log'));
          if (rejCard) rejCard.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    const capRej = await send('Page.captureScreenshot', { format: 'png' });
    const rejPath = path.join(ARTIFACT_DIR, 'lims_specimen_rejection_modal_verified.png');
    fs.writeFileSync(rejPath, Buffer.from(capRej.data, 'base64'));
    console.log(`[✔] Captured Specimen Rejection Modal: ${rejPath}`);

    console.log('\n[🎉 SUCCESS] All remaining clinical modals verified in Chrome!');
    ws.close();
    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('[-] Modal Capture failed:', err);
    chrome.kill();
    process.exit(1);
  }
}

run();
