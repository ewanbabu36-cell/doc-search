import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\892f07c8-c0bb-480f-a73b-ee5cfc4b62ea';

console.log('[*] Spawning headless Chrome on port 9226 for Authenticated PWA Shell verification...');
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1600,1000',
  'http://localhost:5173'
], { stdio: 'ignore' });

chrome.on('error', (err) => {
  console.error('[-] Chrome failed to spawn:', err);
  process.exit(1);
});

async function run() {
  try {
    await new Promise((r) => setTimeout(r, 2500));

    console.log('[*] Connecting to CDP port 9226...');
    const res = await fetch('http://127.0.0.1:9226/json');
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

    await new Promise((r) => setTimeout(r, 2000));

    // Click Front Desk test persona button
    console.log('[*] Selecting Front Desk Persona & Logging In...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Look for Front Desk button
          const buttons = Array.from(document.querySelectorAll('button'));
          const fdBtn = buttons.find(b => b.innerText.includes('Front Desk'));
          if (fdBtn) {
            fdBtn.click();
            return 'Clicked persona button';
          }
          return 'No persona button found';
        })()
      `
    });

    await new Promise((r) => setTimeout(r, 1000));

    // Submit form
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign In'));
          if (submitBtn) {
            submitBtn.click();
            return 'Clicked Sign In';
          }
          return 'No submit button';
        })()
      `
    });

    // Wait for authenticated shell to mount
    console.log('[*] Waiting for Authenticated Partner Shell to render...');
    await new Promise((r) => setTimeout(r, 4000));

    // Inspect Shell Header & PWA status
    const shellEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.querySelector('header');
          const syncBadge = document.querySelector('div[title*="DOC SEARCH Resilient Architecture"], div[title*="Cloud"]');
          const pwaBtn = document.querySelector('button[title*="Install DOC SEARCH"], div[title*="PWA Installed"], div[title*="Standalone"]');

          return {
            hasHeader: !!header,
            headerTextSample: header ? header.innerText.substring(0, 150) : null,
            hasSyncBadge: !!syncBadge,
            syncBadgeText: syncBadge ? syncBadge.innerText : null,
            hasPwaBtn: !!pwaBtn,
            pwaBtnText: pwaBtn ? pwaBtn.innerText : null,
            localStorageStaffAuth: !!localStorage.getItem('docsearch_partner_staff_auth')
          };
        })()
      `,
      returnByValue: true
    });

    console.log('\n[✔] Authenticated Shell & PWA Inspection Results:');
    console.log(JSON.stringify(shellEval.result.value, null, 2));

    // Capture screenshot
    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shotRes.data, 'base64');
    const destPath = path.join(ARTIFACT_DIR, 'pwa_authenticated_shell.png');
    fs.writeFileSync(destPath, buffer);
    console.log(`\n[✔] Saved authenticated shell screenshot to: ${destPath}`);

    ws.close();
  } catch (e) {
    console.error('[-] Error during authenticated verification:', e);
  } finally {
    chrome.kill();
    console.log('[*] Headless Chrome terminated.');
    process.exit(0);
  }
}

run();
