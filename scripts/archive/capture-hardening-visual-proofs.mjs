import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223;
const ARTIFACTS_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\fcd6ba37-889d-4988-923b-e1071330fbf4';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture() {
  console.log('[*] Step 1: Spawning Chrome with CDP on port 9223...');
  const userDataDir = path.resolve('temp_chrome_profile_hardening');
  fs.mkdirSync(userDataDir, { recursive: true });

  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,920',
    'about:blank'
  ], { detached: true, stdio: 'ignore' });
  chrome.unref();

  await sleep(3000);

  const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) throw new Error('No page target found in Chrome CDP');

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

  await new Promise((r) => ws.onopen = r);
  const send = (method, params = {}) => {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 920,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Proof 1: Patient App - Benchmark Home & Tata 1mg Dynamic Modal
  console.log('[*] 1. Capturing Patient App Live View (port 5174)...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5174' });
  await sleep(4000);
  const ssPatient = await send('Page.captureScreenshot', { format: 'png' });
  const pPatient = path.join(ARTIFACTS_DIR, 'hardened_patient_app_live_proof.png');
  fs.writeFileSync(pPatient, Buffer.from(ssPatient.data, 'base64'));
  console.log('[✔] Saved Patient App Proof:', pPatient);

  // Proof 2: Partner Platform - Inpatient Bed Management & Ward Operations
  console.log('[*] 2. Capturing Partner Platform Live View (port 5173)...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
  await sleep(4000);
  const ssPartner = await send('Page.captureScreenshot', { format: 'png' });
  const pPartner = path.join(ARTIFACTS_DIR, 'hardened_partner_platform_live_proof.png');
  fs.writeFileSync(pPartner, Buffer.from(ssPartner.data, 'base64'));
  console.log('[✔] Saved Partner Platform Proof:', pPartner);

  // Proof 3: Company Platform - Executive Command Center & Zero-Mock Views
  console.log('[*] 3. Capturing Company Platform Live View (port 5177)...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5177' });
  await sleep(4000);
  const ssCompany = await send('Page.captureScreenshot', { format: 'png' });
  const pCompany = path.join(ARTIFACTS_DIR, 'hardened_company_platform_live_proof.png');
  fs.writeFileSync(pCompany, Buffer.from(ssCompany.data, 'base64'));
  console.log('[✔] Saved Company Platform Proof:', pCompany);

  ws.close();
  console.log('\n[✔] ALL VISUAL PROOFS CAPTURED SUCCESSFULLY!');
}

capture().catch(err => {
  console.error('[!] Capture failed:', err);
  process.exit(1);
});
