import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { signJwt } from '../packages/auth/dist/index.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function ensureChrome() {
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    if (res.ok) {
      console.log('Using existing Chrome instance on port', DEBUG_PORT);
      return null;
    }
  } catch (e) {}

  console.log('Launching headless Chrome on port', DEBUG_PORT);
  const userDataDir = path.resolve('temp_chrome_profile');
  fs.mkdirSync(userDataDir, { recursive: true });

  const proc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    'about:blank'
  ], { detached: true, stdio: 'ignore' });
  proc.unref();

  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) return proc;
    } catch {}
  }
  throw new Error('Failed to start Chrome');
}

async function runBrowserScenario({ url, viewport, setupStorage, scenarioName }) {
  const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const tabData = await newTabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);

  const consoleLogs = [];
  const exceptions = [];

  return new Promise((resolve) => {
    let msgId = 1;
    const callbacks = new Map();

    const send = (method, params = {}) => {
      return new Promise((res) => {
        const id = msgId++;
        callbacks.set(id, res);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (msg.params.type === 'error') {
          consoleLogs.push({ type: 'error', text });
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(msg.params.exceptionDetails);
      }
    };

    ws.onopen = async () => {
      await send('Page.enable');
      await send('Runtime.enable');

      // Set viewport
      if (viewport) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
          mobile: viewport.width < 600
        });
      }

      // If storage setup provided, evaluate in page and reload
      if (setupStorage) {
        await send('Runtime.evaluate', { expression: setupStorage });
        await send('Page.reload');
        await sleep(3000);
      } else {
        await sleep(2000);
      }

      // Check DOM state
      const domEval = await send('Runtime.evaluate', {
        expression: `
          (function() {
            const bodyText = document.body.innerText.trim();
            const root = document.getElementById('root');
            const hasWhiteScreen = !root || root.children.length === 0 || bodyText.length < 20;
            const scrollWidth = document.documentElement.scrollWidth;
            const innerWidth = window.innerWidth;
            const hasHorizontalOverflow = scrollWidth > innerWidth + 5;

            // Check for invisible text: color === backgroundColor or alpha 0
            let invisibleTextCount = 0;
            const textNodes = Array.from(document.querySelectorAll('h1, h2, h3, p, span, a, button, label'));
            for (const el of textNodes.slice(0, 100)) {
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden' && el.innerText.trim().length > 0) {
                if (style.color === style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                  invisibleTextCount++;
                }
              }
            }

            return {
              title: document.title,
              bodyLength: bodyText.length,
              rootChildren: root ? root.children.length : 0,
              hasWhiteScreen,
              scrollWidth,
              innerWidth,
              hasHorizontalOverflow,
              invisibleTextCount,
              buttonCount: document.querySelectorAll('button').length,
              inputCount: document.querySelectorAll('input, select, textarea').length,
              textSnippet: bodyText.slice(0, 150)
            };
          })()
        `,
        returnByValue: true
      });

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const shotPath = `audit-results/screenshots/${scenarioName}.png`;
      fs.mkdirSync('audit-results/screenshots', { recursive: true });
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

      ws.close();
      await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${tabData.id}`);

      resolve({
        scenarioName,
        dom: domEval.result?.value || {},
        consoleLogs,
        exceptions,
        screenshot: shotPath
      });
    };

    ws.onerror = (err) => {
      resolve({ scenarioName, error: err.message });
    };
  });
}

async function test() {
  await ensureChrome();

  console.log('Testing Partner Platform Doctor session...');
  const doctorToken = signJwt({
    sub: 'e0000000-0000-4000-8000-000000000001',
    userId: 'e0000000-0000-4000-8000-000000000001',
    email: 'doctor@docsearch.health',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
    organizationId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
    branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    roles: ['DOCTOR', 'HOSPITAL_ADMIN'],
    permissions: ['*']
  }, { secret: JWT_SECRET, issuer: 'docsearch-api', audience: 'docsearch-platform', expiresIn: '24h' });

  const doctorProfile = {
    id: 'e0000000-0000-4000-8000-000000000001',
    email: 'doctor@docsearch.health',
    firstName: 'Dr. Alok',
    lastName: 'Sharma',
    roles: ['DOCTOR', 'HOSPITAL_ADMIN'],
    permissions: ['*'],
    tenantId: '11111111-1111-4111-8111-111111111111',
    organizationId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
    branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    tenantName: 'City Central Multispeciality Hospital',
    organizationType: 'HOSPITAL',
    planTier: 'Enterprise Hospital OS Pro',
    status: 'ACTIVE',
    kycStatus: 'KYC_VERIFIED'
  };

  const setupStorage = `
    localStorage.setItem('docsearch_auth_token', ${JSON.stringify(doctorToken)});
    localStorage.setItem('docsearch_partner_staff_auth', ${JSON.stringify(JSON.stringify(doctorProfile))});
    localStorage.removeItem('docsearch_logged_out');
  `;

  const partnerRes = await runBrowserScenario({
    url: 'http://localhost:5173',
    viewport: { width: 1920, height: 1080 },
    setupStorage,
    scenarioName: 'test_partner_doctor_desktop'
  });

  console.log('Partner result:', JSON.stringify(partnerRes, null, 2));

  console.log('\nTesting Company Platform SuperAdmin session...');
  const companyUser = {
    id: 'c0000000-0000-4000-8000-000000000001',
    email: 'founder@docsearch.health',
    name: 'Executive Admin',
    role: 'SUPER_ADMIN',
    permissions: ['*']
  };
  const companySetup = `
    localStorage.setItem('docsearch_company_token', ${JSON.stringify(doctorToken)});
    localStorage.setItem('docsearch_company_user', ${JSON.stringify(JSON.stringify(companyUser))});
  `;

  const companyRes = await runBrowserScenario({
    url: 'http://localhost:5174',
    viewport: { width: 1920, height: 1080 },
    setupStorage: companySetup,
    scenarioName: 'test_company_admin_desktop'
  });

  console.log('Company result:', JSON.stringify(companyRes, null, 2));
}

test().then(() => {
  console.log('Browser test script completed successfully.');
  process.exit(0);
}).catch(err => {
  console.error('Browser test failed:', err);
  process.exit(1);
});
