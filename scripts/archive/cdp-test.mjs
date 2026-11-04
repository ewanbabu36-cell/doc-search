import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCDP() {
  console.log('Testing Chrome DevTools Protocol with Native WebSocket...');
  const userDataDir = path.resolve('temp_chrome_profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    'about:blank'
  ], { detached: true, stdio: 'ignore' });

  chromeProc.unref();

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {
      await sleep(300);
    }
  }

  if (!versionData) {
    console.error('Failed to connect to Chrome CDP endpoint');
    return false;
  }

  console.log('Connected to Chrome:', versionData.Browser, 'WebSocket URL:', versionData.webSocketDebuggerUrl);

  const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://localhost:5175`, { method: 'PUT' });
  const tabData = await newTabRes.json();
  console.log('Opened tab:', tabData.id, tabData.webSocketDebuggerUrl);

  const ws = new WebSocket(tabData.webSocketDebuggerUrl);

  return new Promise((resolve) => {
    let id = 1;
    const callbacks = new Map();

    ws.onopen = async () => {
      console.log('WebSocket connection opened');

      const send = (method, params = {}) => {
        return new Promise((res) => {
          const reqId = id++;
          callbacks.set(reqId, res);
          ws.send(JSON.stringify({ id: reqId, method, params }));
        });
      };

      await send('Page.enable');
      await send('Runtime.enable');
      await send('Network.enable');

      // Wait 2 seconds for landing page to render
      await sleep(2000);

      // Evaluate document title and body text length
      const evalRes = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ title: document.title, bodyLength: document.body.innerText.length, h1: document.querySelector("h1")?.innerText })'
      });

      console.log('Landing page DOM evaluation:', evalRes.result.value);

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync('audit-results/screenshots', { recursive: true });
      fs.writeFileSync('audit-results/screenshots/test_landing_page.png', Buffer.from(shot.data, 'base64'));
      console.log('Screenshot saved to audit-results/screenshots/test_landing_page.png');

      ws.close();
      await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${tabData.id}`);
      resolve(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      resolve(false);
    };
  });
}

testCDP().then(res => {
  console.log('Test completed with result:', res);
  process.exit(res ? 0 : 1);
});
