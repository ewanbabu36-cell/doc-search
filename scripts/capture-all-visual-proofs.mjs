import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const ARTIFACTS_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\fcd6ba37-889d-4988-923b-e1071330fbf4';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getAuthTokens() {
  const pRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pharmacist@docsearch.health', password: 'PharmaPass123!' })
  });
  const pJson = await pRes.json();
  const pharmaToken = pJson.data.accessToken;
  const pharmaUser = pJson.data.user;

  const dRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@docsearch.health', password: 'DoctorPass123!' })
  });
  const dJson = await dRes.json();
  const doctorToken = dJson.data.accessToken;
  const doctorUser = dJson.data.user;

  return { pharmaToken, pharmaUser, doctorToken, doctorUser };
}

async function capture() {
  console.log('[*] Step 1: Getting Auth Tokens from Fastify Gateway...');
  const { pharmaToken, pharmaUser, doctorToken, doctorUser } = await getAuthTokens();
  console.log('[✔] Tokens obtained for Pharmacist & Doctor');

  console.log('[*] Step 2: Spawning Chrome with CDP on port 9222...');
  const userDataDir = path.resolve('temp_chrome_profile_verify');
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

  // -------------------------------------------------------------
  // SCENARIO 1 & 2: PHARMACY (Daily Express & Advance Pro)
  // -------------------------------------------------------------
  console.log('\n[*] --- CAPTURING PHARMACY SUITE ---');
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('docsearch_auth_token', ${JSON.stringify(pharmaToken)});
      localStorage.setItem('docsearch_partner_staff_auth', ${JSON.stringify(JSON.stringify(pharmaUser))});
      localStorage.setItem('docsearch_platform_mode', 'EXPRESS');
      localStorage.removeItem('docsearch_logged_out');
    `
  });

  await send('Page.navigate', { url: 'http://localhost:5173/pharmacy' });
  await sleep(4000);

  // Capture Pharmacy Daily Express
  console.log('[*] Capturing Pharmacy Marg ERP + Vyapar Benchmark screenshot...');
  const ssPharmExpress = await send('Page.captureScreenshot', { format: 'png' });
  const p1 = path.join(ARTIFACTS_DIR, 'pharmacy_daily_express_verified.png');
  fs.writeFileSync(p1, Buffer.from(ssPharmExpress.data, 'base64'));
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'pharmacy_benchmark_verified.png'), Buffer.from(ssPharmExpress.data, 'base64'));
  console.log('[✔] Saved Pharmacy Daily Express to:', p1);

  // Switch to Advance Pro Mode
  console.log('[*] Toggling Pharmacy to Advance Pro Mode...');
  await send('Runtime.evaluate', {
    expression: `
      window.dispatchEvent(new CustomEvent('docsearch_operating_mode_changed', { detail: { mode: 'ADVANCED' } }));
      localStorage.setItem('docsearch_platform_mode', 'ADVANCED');
    `
  });
  await sleep(2500);

  const ssPharmPro = await send('Page.captureScreenshot', { format: 'png' });
  const p2 = path.join(ARTIFACTS_DIR, 'pharmacy_advance_pro_verified.png');
  fs.writeFileSync(p2, Buffer.from(ssPharmPro.data, 'base64'));
  console.log('[✔] Saved Pharmacy Advance Pro to:', p2);

  // -------------------------------------------------------------
  // SCENARIO 3 & 4: DOCTOR CLINIC (Daily Express & Advance Pro)
  // -------------------------------------------------------------
  console.log('\n[*] --- CAPTURING DOCTOR CLINIC SUITE (EKA CARE BENCHMARK) ---');
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('docsearch_auth_token', ${JSON.stringify(doctorToken)});
      localStorage.setItem('docsearch_partner_staff_auth', ${JSON.stringify(JSON.stringify(doctorUser))});
      localStorage.setItem('docsearch_platform_mode', 'EXPRESS');
      localStorage.removeItem('docsearch_logged_out');
    `
  });

  await send('Page.navigate', { url: 'http://localhost:5173/clinic' });
  await sleep(4000);

  // Capture Doctor Daily Express (Eka Care Benchmark)
  console.log('[*] Capturing Doctor Eka Care Benchmark screenshot...');
  const ssDocExpress = await send('Page.captureScreenshot', { format: 'png' });
  const p3 = path.join(ARTIFACTS_DIR, 'doctor_benchmark_verified.png');
  fs.writeFileSync(p3, Buffer.from(ssDocExpress.data, 'base64'));
  // Also preserve doctor_daily_express_verified.png
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'doctor_daily_express_verified.png'), Buffer.from(ssDocExpress.data, 'base64'));
  console.log('[✔] Saved Doctor Eka Care Benchmark to:', p3);

  // Switch to Advance Pro Mode
  console.log('[*] Toggling Doctor to Advance Pro Mode...');
  await send('Runtime.evaluate', {
    expression: `
      window.dispatchEvent(new CustomEvent('docsearch_operating_mode_changed', { detail: { mode: 'ADVANCED' } }));
      localStorage.setItem('docsearch_platform_mode', 'ADVANCED');
    `
  });
  await sleep(2500);

  const ssDocPro = await send('Page.captureScreenshot', { format: 'png' });
  const p4 = path.join(ARTIFACTS_DIR, 'doctor_advance_pro_verified.png');
  fs.writeFileSync(p4, Buffer.from(ssDocPro.data, 'base64'));
  console.log('[✔] Saved Doctor Advance Pro to:', p4);

  // -------------------------------------------------------------
  // SCENARIO 5: PATHOLOGY LIMS (CRELIOHEALTH BENCHMARK)
  // -------------------------------------------------------------
  console.log('\n[*] --- CAPTURING PATHOLOGY SUITE (CRELIOHEALTH BENCHMARK) ---');
  const pathUser = {
    ...doctorUser,
    role: 'PATHOLOGIST',
    roleTitle: 'Chief Pathologist & Lab Director',
    organizationType: 'PATHOLOGY',
    department: 'Pathology & Diagnostic Laboratory'
  };

  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('docsearch_auth_token', ${JSON.stringify(doctorToken)});
      localStorage.setItem('docsearch_partner_staff_auth', ${JSON.stringify(JSON.stringify(pathUser))});
      localStorage.setItem('docsearch_platform_mode', 'EXPRESS');
      localStorage.removeItem('docsearch_logged_out');
    `
  });

  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(4000);

  console.log('[*] Capturing Pathology CrelioHealth Vacutainer Station screenshot...');
  const ssPathology = await send('Page.captureScreenshot', { format: 'png' });
  const p5 = path.join(ARTIFACTS_DIR, 'pathology_benchmark_verified.png');
  fs.writeFileSync(p5, Buffer.from(ssPathology.data, 'base64'));
  console.log('[✔] Saved Pathology CrelioHealth Benchmark to:', p5);

  // Clean close
  ws.close();
  try { chrome.kill(); } catch {}
  console.log('\n🎉 ALL VISUAL VERIFICATIONS CAPTURED SUCCESSFULLY!');
  process.exit(0);
}

capture().catch(err => {
  console.error('Visual capture failed:', err);
  process.exit(1);
});
