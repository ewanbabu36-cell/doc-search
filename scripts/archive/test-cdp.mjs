import { spawn } from 'node:child_process';
import http from 'node:http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function getDebuggerUrl(port, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/json/version`, (r) => {
          let body = '';
          r.on('data', (c) => body += c);
          r.on('end', () => {
            try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
          });
        });
        req.on('error', reject);
      });
      if (res && res.webSocketDebuggerUrl) {
        return res;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Could not connect to Chrome debugging port');
}

async function main() {
  console.log('[*] Launching Chrome in headless mode with remote debugging...');
  const child = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alamr\\AppData\\Local\\Temp\\chrome_test_profile',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    const versionInfo = await getDebuggerUrl(9222);
    console.log('[✔] Successfully connected to Chrome CDP:', versionInfo.Browser);
    console.log('[*] WebSocket Debugger URL:', versionInfo.webSocketDebuggerUrl);

    // Test WebSocket connection
    const ws = new WebSocket(versionInfo.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.onopen = resolve);
    console.log('[✔] WebSocket handshake succeeded!');
    ws.close();
  } finally {
    child.kill('SIGKILL');
  }
}

main().catch(console.error);
