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

const pathologistStaff = {
  id: 'usr_persona_pathologist',
  category: 'HEALTHCARE',
  name: 'Dr. Shahab (MD Pathologist, Lab Director)',
  email: 'shahab@docsearch.health',
  role: 'PATHOLOGIST',
  roleTitle: 'MD Pathologist & Chief of Diagnostics',
  department: 'Pathology & Diagnostic Laboratory',
  tenantName: 'Apex PathLabs & Molecular Diagnostics',
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

const port = 9260;
const userDataDir = `C:\\Users\\alamr\\AppData\\Local\\Temp\\chrome_lims_target_layout_${Date.now()}`;

console.log('[*] Spawning Headless Chrome for Target Screen Final Layout E2E Verification...');
const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1600,1080',
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

    console.log('[*] Injecting Pathologist Auth & Navigating to Pathology Cockpit...');
    const setupScript = `
      localStorage.setItem('auth_token', '${shahabToken}');
      localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(${JSON.stringify(pathologistStaff)}));
      localStorage.removeItem('docsearch_logged_out');
      localStorage.setItem('activeWorkspace', 'HOSPITAL');
      window.location.href = 'http://localhost:5173/hospital/pathology';
    `;
    await send('Runtime.evaluate', { expression: setupScript });

    console.log('[*] Waiting for Target Screen Cockpit to render...');
    await new Promise((r) => setTimeout(r, 4500));

    // 1. Capture Target Screen Overview
    console.log('[*] Capturing Target Screen Cockpit Overview...');
    const cap1 = await send('Page.captureScreenshot', { format: 'png' });
    const p1Path = path.join(ARTIFACT_DIR, 'lims_target_layout_overview.png');
    fs.writeFileSync(p1Path, Buffer.from(cap1.data, 'base64'));
    console.log(`[✔] Captured Target Screen Overview: ${p1Path}`);

    // Verify key textual anchors on Target Screen
    const evalResult = await send('Runtime.evaluate', {
      expression: `document.body.innerText`
    });
    const bodyText = evalResult.result.value || '';

    const expectedAnchors = [
      'NABL ISO-15189',
      'Hematology',
      'Biochemistry',
      'Microbiology',
      'Histopath',
      'ASTM/HL7 CONNECTED',
      'DSC Token: ACTIVE',
      'Daily QC Status',
      'Sample Rejection Rate',
      'Critical Panic Calls Pending',
      'Pending Pathologist Approval',
      'Specimen Worklist',
      'Observed Test Values & Raw Machine Flags',
      'Delta Check Comparison',
      'Chain of Custody & Verification Log',
      'Reflex Test Order',
      'Request Repeat / Dilution',
      'Log Panic Call',
      'Digitally Sign & Dispatch'
    ];

    console.log('\n--- VERIFYING TARGET SCREEN SPECIFICATIONS ---');
    let allPassed = true;
    for (const anchor of expectedAnchors) {
      if (bodyText.includes(anchor)) {
        console.log(`  ✔ [PASS] Found: "${anchor}"`);
      } else {
        console.error(`  ❌ [FAIL] Missing: "${anchor}"`);
        allPassed = false;
      }
    }

    // 2. Open [Reflex Test Order] Interactive Modal
    console.log('\n[*] Testing [Reflex Test Order] interactive dialog...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Reflex Test Order'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1200));

    const capReflex = await send('Page.captureScreenshot', { format: 'png' });
    const reflexPath = path.join(ARTIFACT_DIR, 'lims_target_layout_reflex_modal.png');
    fs.writeFileSync(reflexPath, Buffer.from(capReflex.data, 'base64'));
    console.log(`[✔] Captured Reflex Modal: ${reflexPath}`);

    // Close Reflex Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Cancel');
          if (cancelBtn) cancelBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // 3. Open [Request Repeat / Dilution] Interactive Modal
    console.log('[*] Testing [Request Repeat / Dilution] interactive dialog...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Request Repeat / Dilution'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1200));

    const capRepeat = await send('Page.captureScreenshot', { format: 'png' });
    const repeatPath = path.join(ARTIFACT_DIR, 'lims_target_layout_repeat_modal.png');
    fs.writeFileSync(repeatPath, Buffer.from(capRepeat.data, 'base64'));
    console.log(`[✔] Captured Repeat Modal: ${repeatPath}`);

    // Close Repeat Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Cancel');
          if (cancelBtn) cancelBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // 4. Test Specimen Selection Switching (Click Mohammad Rizwan)
    console.log('[*] Selecting Mohammad Rizwan (Renal Delta Check Surge)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = Array.from(document.querySelectorAll('div')).find(c => c.textContent && c.textContent.includes('Mohammad Rizwan') && c.textContent.includes('LAB-2026-90413'));
          if (card) card.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1200));

    const capSelect = await send('Page.captureScreenshot', { format: 'png' });
    const selectPath = path.join(ARTIFACT_DIR, 'lims_target_layout_specimen_selection.png');
    fs.writeFileSync(selectPath, Buffer.from(capSelect.data, 'base64'));
    console.log(`[✔] Captured Specimen Switch (Mohammad Rizwan): ${selectPath}`);

    if (!allPassed) {
      throw new Error('Some expected target screen anchors were missing');
    }

    console.log('\n[🎉 SUCCESS] Target Screen Final Layout fully verified and certified in Chrome!');
    ws.close();
    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('[-] Target Screen Verification failed:', err);
    chrome.kill();
    process.exit(1);
  }
}

run();
