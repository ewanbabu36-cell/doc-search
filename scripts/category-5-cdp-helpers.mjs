import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { signJwt } from '../packages/auth/dist/index.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';

export const VIEWPORTS = {
  desktop_1080: { width: 1920, height: 1080, name: 'Desktop 1920x1080' },
  desktop_laptop: { width: 1440, height: 900, name: 'Desktop 1440x900' },
  tablet: { width: 1024, height: 768, name: 'Tablet 1024x768' },
  mobile: { width: 390, height: 844, name: 'Mobile 390x844' }
};

export async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let chromeProcess = null;

export async function ensureChrome() {
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    if (res.ok) {
      return null;
    }
  } catch (e) {}

  const userDataDir = path.resolve('temp_chrome_profile');
  fs.mkdirSync(userDataDir, { recursive: true });

  chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    'about:blank'
  ], { detached: true, stdio: 'ignore' });
  chromeProcess.unref();

  for (let i = 0; i < 25; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) return chromeProcess;
    } catch {}
  }
  throw new Error('Failed to start Chrome on port ' + DEBUG_PORT);
}

export function closeChrome() {
  if (chromeProcess) {
    try {
      chromeProcess.kill();
    } catch {}
    chromeProcess = null;
  }
}

export function createDoctorAuth() {
  const token = signJwt({
    sub: 'e0000000-0000-4000-8000-000000000001',
    userId: 'e0000000-0000-4000-8000-000000000001',
    email: 'doctor@docsearch.health',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
    organizationId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
    branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
    permissions: ['*'],
    isSuperAdmin: false
  }, { secret: JWT_SECRET, issuer: 'docsearch-api', audience: 'docsearch-platform', expiresIn: '24h' });

  const profile = {
    id: 'e0000000-0000-4000-8000-000000000001',
    email: 'doctor@docsearch.health',
    firstName: 'Dr. Alok',
    lastName: 'Sharma',
    roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
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

  return `
    localStorage.setItem('docsearch_auth_token', ${JSON.stringify(token)});
    localStorage.setItem('docsearch_partner_staff_auth', ${JSON.stringify(JSON.stringify(profile))});
    localStorage.removeItem('docsearch_logged_out');
  `;
}

export function createRoleAuth(role, orgType = 'HOSPITAL', defaultModule = null) {
  const token = signJwt({
    sub: `e0000000-0000-4000-8000-00000000000${role.length % 9 + 1}`,
    userId: `e0000000-0000-4000-8000-00000000000${role.length % 9 + 1}`,
    email: `${role.toLowerCase()}@docsearch.health`,
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
    organizationId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
    branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    roles: [role],
    permissions: ['*'],
    isSuperAdmin: false
  }, { secret: JWT_SECRET, issuer: 'docsearch-api', audience: 'docsearch-platform', expiresIn: '24h' });

  const profile = {
    id: `e0000000-0000-4000-8000-00000000000${role.length % 9 + 1}`,
    email: `${role.toLowerCase()}@docsearch.health`,
    firstName: role,
    lastName: 'Specialist',
    roles: [role],
    permissions: ['*'],
    tenantId: '11111111-1111-4111-8111-111111111111',
    organizationId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
    branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    tenantName: 'City Central Multispeciality Hospital',
    organizationType: orgType,
    planTier: 'Enterprise Hospital OS Pro',
    status: 'ACTIVE',
    kycStatus: 'KYC_VERIFIED',
    defaultModule: defaultModule
  };

  return `
    localStorage.setItem('docsearch_auth_token', ${JSON.stringify(token)});
    localStorage.setItem('docsearch_partner_staff_auth', ${JSON.stringify(JSON.stringify(profile))});
    localStorage.removeItem('docsearch_logged_out');
  `;
}

export function createCompanyAdminAuth() {
  const token = signJwt({
    sub: 'c0000000-0000-4000-8000-000000000001',
    userId: 'c0000000-0000-4000-8000-000000000001',
    email: 'founder@docsearch.health',
    actorEmail: 'founder@docsearch.health',
    tenantId: '00000000-0000-4000-8000-000000000000',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    permissions: ['*'],
    isSuperAdmin: true
  }, { secret: JWT_SECRET, issuer: 'docsearch-api', audience: 'docsearch-platform', expiresIn: '24h' });

  const profile = {
    name: 'Executive Admin',
    email: 'founder@docsearch.health',
    role: 'SUPER_ADMIN',
    roleTitle: 'SUPER_ADMIN (Verified Session)',
    clearanceLevel: 'Executive Access'
  };

  return `
    localStorage.setItem('docsearch_company_token', ${JSON.stringify(token)});
    localStorage.setItem('docsearch_company_founder_auth', ${JSON.stringify(JSON.stringify(profile))});
  `;
}

export async function runBrowserScenario({
  url,
  viewport = VIEWPORTS.desktop_1080,
  setupStorage = null,
  preEvalAction = null,
  scenarioName = 'scenario',
  timeoutMs = 20000
}) {
  await ensureChrome();

  const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await newTabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);

  const consoleErrors = [];
  const uncaughtExceptions = [];

  return new Promise((resolve) => {
    let resolved = false;
    let msgId = 1;
    const callbacks = new Map();

    const cleanupAndResolve = async (data) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(scenarioTimer);
      try { ws.close(); } catch {}
      try { await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${tabData.id}`); } catch {}
      resolve(data);
    };

    const scenarioTimer = setTimeout(() => {
      cleanupAndResolve({
        scenarioName,
        success: false,
        error: `Scenario timed out after ${timeoutMs}ms`,
        consoleErrors,
        uncaughtExceptions
      });
    }, timeoutMs);

    const send = (method, params = {}) => {
      return new Promise((res) => {
        const id = msgId++;
        const timer = setTimeout(() => {
          callbacks.delete(id);
          res({});
        }, 8000);
        callbacks.set(id, (result) => {
          clearTimeout(timer);
          res(result);
        });
        try {
          ws.send(JSON.stringify({ id, method, params }));
        } catch (e) {
          clearTimeout(timer);
          res({});
        }
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
          const cb = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          cb(msg.result);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          if (msg.params.type === 'error') {
            const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
            consoleErrors.push(text);
          }
        } else if (msg.method === 'Runtime.exceptionThrown') {
          uncaughtExceptions.push(msg.params.exceptionDetails?.text || 'Uncaught Exception');
        }
      } catch (e) {}
    };

    ws.onopen = async () => {
      try {
        await send('Page.enable');
        await send('Runtime.enable');

        if (viewport) {
          await send('Emulation.setDeviceMetricsOverride', {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.width < 600
          });
        }

        // Add script to evaluate on new document BEFORE loading
        if (setupStorage) {
          await send('Page.addScriptToEvaluateOnNewDocument', { source: setupStorage });
        }

        // Navigate cleanly
        await send('Page.navigate', { url });

        // Active polling for React hydration (up to 7000ms)
        for (let i = 0; i < 28; i++) {
          const check = await send('Runtime.evaluate', {
            expression: '!!(document.getElementById("root")?.children?.length > 0 && document.body.innerText.trim().length > 30)'
          });
          if (check?.result?.value === true) {
            break;
          }
          await sleep(250);
        }

        if (preEvalAction) {
          await send('Runtime.evaluate', { expression: preEvalAction, awaitPromise: true });
          await sleep(1500);
        }

        // Comprehensive DOM inspection
        const domEval = await send('Runtime.evaluate', {
          expression: `
            (function() {
              const bodyText = document.body.innerText.trim();
              const root = document.getElementById('root');
              const hasWhiteScreen = !root || root.children.length === 0 || bodyText.length < 15;
              const scrollWidth = document.documentElement.scrollWidth;
              const innerWidth = window.innerWidth;
              const hasHorizontalOverflow = scrollWidth > innerWidth + 5;

              // Check for invisible text (matching background or zero contrast)
              let invisibleTextCount = 0;
              const textNodes = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, a, button, label, td, th'));
              for (const el of textNodes.slice(0, 150)) {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.innerText.trim().length > 0) {
                  if (style.color === style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    invisibleTextCount++;
                  }
                }
              }

              // Check for modals / overlays
              const modalElements = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], [class*="dialog"], [class*="drawer"]');
              const hasActiveModal = Array.from(modalElements).some(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
              });

              // Check for tables
              const tables = document.querySelectorAll('table');
              const hasTables = tables.length > 0;

              // Check for forms
              const inputs = document.querySelectorAll('input, select, textarea');
              const buttons = document.querySelectorAll('button');

              // Detect crash boundary text
              const lowerText = bodyText.toLowerCase();
              const hasCrashBoundary = lowerText.includes('something went wrong') ||
                                       lowerText.includes('rendered fewer hooks than expected') ||
                                       lowerText.includes('minified react error');

              return {
                title: document.title,
                bodyLength: bodyText.length,
                rootChildren: root ? root.children.length : 0,
                hasWhiteScreen,
                hasCrashBoundary,
                scrollWidth,
                innerWidth,
                hasHorizontalOverflow,
                invisibleTextCount,
                hasActiveModal,
                tableCount: tables.length,
                inputCount: inputs.length,
                buttonCount: buttons.length,
                textSnippet: bodyText.slice(0, 200)
              };
            })()
          `,
          returnByValue: true
        });

        const domResult = domEval?.result?.value || {};

        // Capture screenshot
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        const shotDir = path.resolve('audit-results/screenshots');
        fs.mkdirSync(shotDir, { recursive: true });
        const shotPath = path.join(shotDir, `${scenarioName}.png`);
        if (shot?.data) {
          fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
        }

        await cleanupAndResolve({
          scenarioName,
          success: !domResult.hasWhiteScreen && !domResult.hasCrashBoundary && !domResult.hasHorizontalOverflow && (domResult.invisibleTextCount === 0) && uncaughtExceptions.length === 0,
          dom: domResult,
          consoleErrors,
          uncaughtExceptions,
          screenshot: `audit-results/screenshots/${scenarioName}.png`
        });
      } catch (err) {
        await cleanupAndResolve({
          scenarioName,
          success: false,
          error: err.message,
          consoleErrors,
          uncaughtExceptions
        });
      }
    };

    ws.onerror = (err) => {
      cleanupAndResolve({ scenarioName, success: false, error: err.message });
    };
  });
}
