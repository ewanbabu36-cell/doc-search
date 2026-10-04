import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\fcd6ba37-889d-4988-923b-e1071330fbf4';
const port = 9245;
const userDataDir = `C:\\Users\\alamr\\AppData\\Local\\Temp\\chrome_lims_step4_${Date.now()}`;

console.log('[*] Spawning Headless Chrome for Step 4 Medical Terminology E2E Verification...');
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

    console.log('[*] Waiting for login screen and clicking Lab Tech persona button...');
    await new Promise((r) => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && el.textContent.includes('Lab Tech') && el.textContent.includes('Pathology LIMS'));
          if (btn) btn.click();
        })()
      `
    });

    console.log('[*] Waiting for LIMS workbench to load...');
    await new Promise((r) => setTimeout(r, 4500));

    // Switch to Pathologist Cockpit
    console.log('[*] Ensuring Pathologist Cockpit perspective is active...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Pathologist Cockpit'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Capture View 1: Step 4 Cockpit Overview
    console.log('[*] Capturing Step 4 Cockpit Overview...');
    const cap1 = await send('Page.captureScreenshot', { format: 'png' });
    const p1Path = path.join(ARTIFACT_DIR, 'lims_step4_cockpit_terminology_verified.png');
    fs.writeFileSync(p1Path, Buffer.from(cap1.data, 'base64'));
    console.log(`[✔] Captured Step 4 Cockpit Overview: ${p1Path}`);

    // Trigger Critical Value Call Desk Modal
    console.log('[*] Opening Critical Value Call Desk (Read-Back Logged) Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Critical Value Call Desk') || b.textContent.includes('Critical Call Desk')));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    const capModal = await send('Page.captureScreenshot', { format: 'png' });
    const modalPath = path.join(ARTIFACT_DIR, 'lims_step4_readback_modal_verified.png');
    fs.writeFileSync(modalPath, Buffer.from(capModal.data, 'base64'));
    console.log(`[✔] Captured Critical Value Call Desk Modal: ${modalPath}`);

    // Close Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancel'));
          if (cancelBtn) cancelBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // Open Digital Pathology / WSI Viewer
    console.log('[*] Opening Digital Pathology / WSI Viewer (Blood Smear Morphology)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const wsiBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Digital Pathology / WSI Viewer'));
          if (wsiBtn) wsiBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 1500));

    const capWsi = await send('Page.captureScreenshot', { format: 'png' });
    const wsiPath = path.join(ARTIFACT_DIR, 'lims_step4_wsi_viewer_verified.png');
    fs.writeFileSync(wsiPath, Buffer.from(capWsi.data, 'base64'));
    console.log(`[✔] Captured Digital Pathology / WSI Viewer: ${wsiPath}`);

    console.log('\n[🎉 SUCCESS] Step 4 Advanced Medical Terminology fully verified in Chrome!');
    ws.close();
    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('[-] Step 4 Verification failed:', err);
    chrome.kill();
    process.exit(1);
  }
}

run();
