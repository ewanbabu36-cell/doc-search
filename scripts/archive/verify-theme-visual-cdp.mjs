import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsDir = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\892f07c8-c0bb-480f-a73b-ee5cfc4b62ea';

async function verifyVisuals() {
  console.log('[*] Step 1: Getting Auth Token for Partner...');
  const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'labtech@metropolis.com', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  const user = loginData.data?.user;
  console.log('[✔] Got token for', user?.email);

  console.log('[*] Step 2: Spawning Chrome with CDP on port 9222...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1400,900',
    'http://localhost:5173/pathology'
  ], { stdio: 'ignore' });

  try {
    await new Promise((r) => setTimeout(r, 2500));

    const res = await fetch('http://127.0.0.1:9222/json');
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

    // Inject auth token and user state into localStorage
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('docsearch_auth_token', ${JSON.stringify(token)});
        localStorage.setItem('docsearch_user', ${JSON.stringify(JSON.stringify(user))});
        localStorage.setItem('docsearch_theme', 'theme-swiss-clinical');
      `
    });

    // Navigate to /pathology
    await send('Page.navigate', { url: 'http://localhost:5173/pathology' });
    await new Promise((r) => setTimeout(r, 3000));

    // Capture computed styles in Swiss Clinical (Light Theme)
    const swissStylesRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const root = document.documentElement;
          const rootClass = root.className;
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          const header = document.querySelector('header');
          const headerBg = header ? window.getComputedStyle(header).backgroundColor : 'none';
          const sidebar = document.querySelector('aside');
          const sidebarBg = sidebar ? window.getComputedStyle(sidebar).backgroundColor : 'none';
          const surfaceL2 = window.getComputedStyle(root).getPropertyValue('--ds-surface-l2').trim();
          const colorSurface = window.getComputedStyle(root).getPropertyValue('--ds-color-surface').trim();
          const colorTextPrimary = window.getComputedStyle(root).getPropertyValue('--ds-color-text-primary').trim();
          
          return {
            rootClass,
            bodyBg,
            headerBg,
            sidebarBg,
            surfaceL2,
            colorSurface,
            colorTextPrimary
          };
        })()
      `,
      returnByValue: true
    });

    console.log('\n--- Computed Styles in Swiss Clinical (Light) ---');
    console.log(JSON.stringify(swissStylesRes.result?.value, null, 2));

    // Screenshot in Swiss Clinical
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss1.data) {
      const p1 = path.join(artifactsDir, 'verified_theme_swiss_clinical.png');
      fs.writeFileSync(p1, Buffer.from(ss1.data, 'base64'));
      console.log('[✔] Saved Swiss Clinical screenshot to:', p1);
    }

    // Switch to Advance Pro (Dark Theme)
    console.log('\n[*] Switching theme to "theme-advance-pro"...');
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.className = 'theme-advance-pro';
        localStorage.setItem('docsearch_theme', 'theme-advance-pro');
      `
    });
    await new Promise((r) => setTimeout(r, 1000));

    const proStylesRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const root = document.documentElement;
          const rootClass = root.className;
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          const header = document.querySelector('header');
          const headerBg = header ? window.getComputedStyle(header).backgroundColor : 'none';
          const sidebar = document.querySelector('aside');
          const sidebarBg = sidebar ? window.getComputedStyle(sidebar).backgroundColor : 'none';
          const surfaceL2 = window.getComputedStyle(root).getPropertyValue('--ds-surface-l2').trim();
          const colorSurface = window.getComputedStyle(root).getPropertyValue('--ds-color-surface').trim();
          const colorTextPrimary = window.getComputedStyle(root).getPropertyValue('--ds-color-text-primary').trim();
          
          return {
            rootClass,
            bodyBg,
            headerBg,
            sidebarBg,
            surfaceL2,
            colorSurface,
            colorTextPrimary
          };
        })()
      `,
      returnByValue: true
    });

    console.log('\n--- Computed Styles in Advance Pro (Dark) ---');
    console.log(JSON.stringify(proStylesRes.result?.value, null, 2));

    // Screenshot in Advance Pro
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss2.data) {
      const p2 = path.join(artifactsDir, 'verified_theme_advance_pro.png');
      fs.writeFileSync(p2, Buffer.from(ss2.data, 'base64'));
      console.log('[✔] Saved Advance Pro screenshot to:', p2);
    }

    ws.close();
    chrome.kill();
    console.log('\n[✔] Visual Verification CDP Completed Successfully!');
  } catch (err) {
    try { chrome.kill(); } catch {}
    throw err;
  }
}

verifyVisuals().catch(console.error);
