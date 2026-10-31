import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223; // Use distinct debug port
const ARTIFACTS_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\fcd6ba37-889d-4988-923b-e1071330fbf4';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture() {
  console.log('[*] Step 1: Spawning Chrome with CDP on port ' + DEBUG_PORT + '...');
  const userDataDir = path.resolve('temp_chrome_patient_verify');
  fs.mkdirSync(userDataDir, { recursive: true });

  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=430,932', // iPhone 14 Pro Max mobile viewport
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
  await send('DOM.enable');

  console.log('[*] Step 2: Navigating to Patient App and setting active demo patient profile in localStorage...');
  await send('Page.navigate', { url: 'http://localhost:5174/' });
  await sleep(2500);

  // Seed demo patient profile
  const demoPatient = {
    id: 'PAT-41029',
    uhid: 'UHID-DEL-9841',
    fullName: 'Suresh Rao',
    age: 52,
    gender: 'MALE',
    phone: '+91 98765 43210',
    bloodGroup: 'B+ Positive',
    allergies: ['Penicillin (Mild rash)'],
    activeToken: {
      tokenNumber: '#14',
      doctorName: 'Dr. Vikram Malhotra, MD (Cardiology)',
      chamberRoom: 'OPD Chamber 4',
      patientsAhead: 2,
      estimatedWaitMins: 14,
      isCalled: false
    }
  };

  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('docsearch_patient_profile', '${JSON.stringify(demoPatient)}');
      location.reload();
    `
  });
  await sleep(3500);

  // 1. Capture Patient App Home Screen with Tata 1mg & Apollo 24|7 Banners
  console.log('[*] Step 3: Capturing Patient App Home Screen...');
  const homeShot = await send('Page.captureScreenshot', { format: 'png' });
  const homeBuffer = Buffer.from(homeShot.data, 'base64');
  fs.writeFileSync('patient_app_benchmark_home.png', homeBuffer);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'patient_app_benchmark_home.png'), homeBuffer);
  console.log('[✔] Saved patient_app_benchmark_home.png');

  // 2. Click the Tata 1mg Medicine Order Banner to open Modal
  console.log('[*] Step 4: Opening Tata 1mg Medicine Order Modal...');
  await send('Runtime.evaluate', {
    expression: `
      const banners = Array.from(document.querySelectorAll('div'));
      const medBanner = banners.find(b => b.innerText && (b.innerText.includes('दवा ऑर्डर') || b.innerText.includes('Order Medicines')));
      if (medBanner) medBanner.click();
    `
  });
  await sleep(1500);

  const medShot = await send('Page.captureScreenshot', { format: 'png' });
  const medBuffer = Buffer.from(medShot.data, 'base64');
  fs.writeFileSync('patient_app_tata1mg_modal.png', medBuffer);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'patient_app_tata1mg_modal.png'), medBuffer);
  console.log('[✔] Saved patient_app_tata1mg_modal.png');

  // 3. Switch to Home Lab Tests Tab
  console.log('[*] Step 5: Switching to Home Lab Tests Tab...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const labBtn = buttons.find(b => b.innerText && (b.innerText.includes('घर पर टेस्ट') || b.innerText.includes('Home Lab Tests')));
      if (labBtn) labBtn.click();
    `
  });
  await sleep(1500);

  const labShot = await send('Page.captureScreenshot', { format: 'png' });
  const labBuffer = Buffer.from(labShot.data, 'base64');
  fs.writeFileSync('patient_app_home_lab_modal.png', labBuffer);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'patient_app_home_lab_modal.png'), labBuffer);
  console.log('[✔] Saved patient_app_home_lab_modal.png');

  // 4. Switch to Official ABDM ABHA Card Tab
  console.log('[*] Step 6: Switching to Official ABDM ABHA Card Tab...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const abhaBtn = buttons.find(b => b.innerText && (b.innerText.includes('आभा कार्ड') || b.innerText.includes('ABHA Card')));
      if (abhaBtn) abhaBtn.click();
    `
  });
  await sleep(1500);

  const abhaShot = await send('Page.captureScreenshot', { format: 'png' });
  const abhaBuffer = Buffer.from(abhaShot.data, 'base64');
  fs.writeFileSync('patient_app_abha_card_modal.png', abhaBuffer);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'patient_app_abha_card_modal.png'), abhaBuffer);
  console.log('[✔] Saved patient_app_abha_card_modal.png');

  ws.close();
  try {
    process.kill(chrome.pid);
  } catch {}
  console.log('[🎉] ALL PATIENT APP BENCHMARK SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

capture().catch(err => {
  console.error('[!] Capture failed:', err);
  process.exit(1);
});
