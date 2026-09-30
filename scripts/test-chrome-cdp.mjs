import { spawn } from 'node:child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('[*] Spawning headless Chrome on port 9222...');
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,800',
  'http://localhost:5173'
], { stdio: 'ignore' });

chrome.on('error', (err) => {
  console.error('[-] Chrome failed to spawn:', err);
  process.exit(1);
});

async function run() {
  await new Promise((r) => setTimeout(r, 2000));
  
  console.log('[*] Fetching CDP targets from http://127.0.0.1:9222/json...');
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  console.log('[✔] CDP targets discovered:', targets.length);
  
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    throw new Error('No page target found');
  }
  
  console.log('[*] Connecting to WebSocket:', pageTarget.webSocketDebuggerUrl);
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
  console.log('[✔] WebSocket connected!');
  
  const send = (method, params = {}) => {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };
  
  await send('Page.enable');
  await send('Runtime.enable');
  
  // Evaluate document title and URL
  const evalRes = await send('Runtime.evaluate', {
    expression: '({ title: document.title, url: window.location.href, bodyLength: document.body.innerHTML.length })',
    returnByValue: true
  });
  
  console.log('[✔] Browser evaluation result:', evalRes.result?.value);
  
  ws.close();
  chrome.kill();
  console.log('[✔] Test CDP completed successfully!');
}

run().catch((err) => {
  console.error('[-] Error in run:', err);
  try { chrome.kill(); } catch {}
  process.exit(1);
});
