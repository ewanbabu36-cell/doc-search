import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { signJwt } from '../packages/auth/dist/index.js';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsDir = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\892f07c8-c0bb-480f-a73b-ee5cfc4b62ea';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const token = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'founder@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['SUPER_ADMIN', 'DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'PATHOLOGIST', 'RADIOLOGIST'],
  permissions: ['*'],
  isSuperAdmin: true
}, {
  secret: MASTER_SECRET,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

const userProfile = {
  id: 'e0000000-0000-4000-8000-000000000001',
  tenantId: '11111111-1111-4111-8111-111111111111',
  category: 'HEALTHCARE',
  name: 'Dr. Meraj Sharif (Founder & Chief of Medicine)',
  email: 'founder@docsearch.health',
  role: 'HOSPITAL_DIRECTOR',
  roleTitle: 'Chief Medical Superintendent & Super-Admin',
  department: 'Executive Clinical Leadership',
  tenantName: 'Doc Search Healthcare Platform',
  organizationType: 'HOSPITAL',
  allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY'],
  defaultModule: 'clinical-investigation',
  planTier: 'Enterprise Hospital Suite',
  planExpiryDate: 'Enterprise Active',
  accessibleFeatures: ['*'],
  restrictedFeatures: [],
  kycStatus: 'KYC_VERIFIED',
  isProfileCompleted: true
};

async function testLivePathologyTheme() {
  console.log('[*] Step 1: Updating Cloud Theme Preference in PostgreSQL to "theme-swiss-clinical"...');
  await fetch('http://127.0.0.1:4000/api/v1/partner/account/preferences', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      themePreference: 'theme-swiss-clinical',
      theme: 'theme-swiss-clinical'
    })
  });

  console.log('[*] Step 2: Spawning Chrome with CDP on port 9224...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'http://localhost:5173'
  ], { stdio: 'ignore' });

  try {
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch('http://127.0.0.1:9224/json');
    const targets = await res.json();
    const pageTarget = targets.find(t => t.type === 'page');
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

    console.log('[*] Step 3: Injecting auth credentials and navigating to /pathology...');
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('docsearch_auth_token', ${JSON.stringify(token)});
        localStorage.setItem('docsearch_partner_staff_auth', ${JSON.stringify(JSON.stringify(userProfile))});
        localStorage.removeItem('docsearch_logged_out');
      `
    });

    await send('Page.navigate', { url: 'http://localhost:5173/pathology' });
    await new Promise((r) => setTimeout(r, 4500));

    console.log('[*] Step 4: Inspecting Shell in Swiss Clinical (Light Theme)...');
    const swissRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const root = document.documentElement;
          const body = document.body;
          const header = document.querySelector('header');
          const sidebar = document.querySelector('aside');
          const h1 = document.querySelector('h1');
          
          return {
            title: document.title,
            url: window.location.href,
            rootClass: root.className,
            bodyBg: window.getComputedStyle(body).backgroundColor,
            headerBg: header ? window.getComputedStyle(header).backgroundColor : 'none',
            sidebarBg: sidebar ? window.getComputedStyle(sidebar).backgroundColor : 'none',
            surfaceL2: window.getComputedStyle(root).getPropertyValue('--ds-surface-l2').trim(),
            colorSurface: window.getComputedStyle(root).getPropertyValue('--ds-color-surface').trim(),
            colorTextPrimary: window.getComputedStyle(root).getPropertyValue('--ds-color-text-primary').trim(),
            headingText: h1 ? h1.innerText : ''
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Swiss Clinical Computed Styles:', JSON.stringify(swissRes.result?.value, null, 2));

    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss1.data) {
      const p1 = path.join(artifactsDir, 'pathology_live_swiss_clinical.png');
      fs.writeFileSync(p1, Buffer.from(ss1.data, 'base64'));
      console.log('[✔] Saved Swiss Clinical screenshot to:', p1);
    }

    console.log('\n[*] Step 5: Updating Cloud Preference to "theme-advance-pro"...');
    await fetch('http://127.0.0.1:4000/api/v1/partner/account/preferences', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        themePreference: 'theme-advance-pro',
        theme: 'theme-advance-pro'
      })
    });

    // Simulate window focus event in browser to trigger setupCrossBrowserThemeSync
    console.log('[*] Step 6: Dispatching window "focus" event to trigger cross-browser theme sync...');
    await send('Runtime.evaluate', {
      expression: `
        window.dispatchEvent(new Event('focus'));
      `
    });
    await new Promise((r) => setTimeout(r, 2000));

    const proRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const root = document.documentElement;
          const body = document.body;
          const header = document.querySelector('header');
          const sidebar = document.querySelector('aside');
          
          return {
            rootClass: root.className,
            bodyBg: window.getComputedStyle(body).backgroundColor,
            headerBg: header ? window.getComputedStyle(header).backgroundColor : 'none',
            sidebarBg: sidebar ? window.getComputedStyle(sidebar).backgroundColor : 'none',
            surfaceL2: window.getComputedStyle(root).getPropertyValue('--ds-surface-l2').trim(),
            colorSurface: window.getComputedStyle(root).getPropertyValue('--ds-color-surface').trim(),
            colorTextPrimary: window.getComputedStyle(root).getPropertyValue('--ds-color-text-primary').trim()
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Advance Pro Synced Styles:', JSON.stringify(proRes.result?.value, null, 2));

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss2.data) {
      const p2 = path.join(artifactsDir, 'pathology_live_advance_pro.png');
      fs.writeFileSync(p2, Buffer.from(ss2.data, 'base64'));
      console.log('[✔] Saved Advance Pro screenshot to:', p2);
    }

    ws.close();
    chrome.kill();
    console.log('\n[✔] ALL LIVE VISUAL & SYNCHRONIZATION TESTS COMPLETE!');
  } catch (err) {
    try { chrome.kill(); } catch {}
    throw err;
  }
}

testLivePathologyTheme().catch(console.error);
