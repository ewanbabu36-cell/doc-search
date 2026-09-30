import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\alamr\\.gemini\\antigravity\\brain\\892f07c8-c0bb-480f-a73b-ee5cfc4b62ea';

console.log('[*] Spawning headless Chrome on port 9225 to verify PWA...');
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1400,900',
  'http://localhost:5173'
], { stdio: 'ignore' });

chrome.on('error', (err) => {
  console.error('[-] Chrome failed to spawn:', err);
  process.exit(1);
});

async function run() {
  try {
    await new Promise((r) => setTimeout(r, 2500));

    console.log('[*] Connecting to CDP port 9225...');
    const res = await fetch('http://127.0.0.1:9225/json');
    const targets = await res.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    if (!pageTarget) {
      throw new Error('No page target found');
    }

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

    // Wait for React app to mount
    await new Promise((r) => setTimeout(r, 3000));

    // Evaluate PWA properties in real browser DOM
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const manifestLink = document.querySelector('link[rel="manifest"]');
          const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
          const themeColor = document.querySelector('meta[name="theme-color"]');
          const swSupported = 'serviceWorker' in navigator;
          const idbSupported = 'indexedDB' in window;
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

          return {
            title: document.title,
            manifestHref: manifestLink ? manifestLink.href : null,
            appleIconHref: appleIcon ? appleIcon.href : null,
            themeColor: themeColor ? themeColor.content : null,
            swSupported,
            idbSupported,
            isStandalone,
            hasPwaBanner: !!document.querySelector('button[title*="Install"], button[title*="DOC SEARCH"]'),
            bodyTextLength: document.body.innerText.length
          };
        })()
      `,
      returnByValue: true
    });

    console.log('\n[✔] Real Browser PWA Verification Results:');
    console.log(JSON.stringify(evalRes.result.value, null, 2));

    // Capture screenshot
    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shotRes.data, 'base64');

    const destPath = path.join(ARTIFACT_DIR, 'pwa_verified_browser.png');
    fs.writeFileSync(destPath, buffer);
    console.log(`\n[✔] Saved PWA verification screenshot to: ${destPath}`);

    ws.close();
  } catch (e) {
    console.error('[-] Error during browser verification:', e);
  } finally {
    chrome.kill();
    console.log('[*] Headless Chrome terminated.');
    process.exit(0);
  }
}

run();
