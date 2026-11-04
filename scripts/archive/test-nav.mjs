import { spawn } from 'node:child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,800'
], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 1500));
  
  // List existing pages or create new
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const target = targets.find(t => t.type === 'page') || targets[0];
  console.log('[*] Using target:', target.id);
  
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) {
      const { resolve, reject } = pending.get(d.id);
      pending.delete(d.id);
      if (d.error) reject(d.error); else resolve(d.result);
    }
  };
  await new Promise(r => ws.onopen = r);
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173' });
  console.log('[*] Navigating to http://localhost:5173...');
  
  await new Promise(r => setTimeout(r, 4000));

  const pageInfo = await send('Runtime.evaluate', {
    expression: '({ title: document.title, url: window.location.href, text: document.body.innerText.slice(0, 300) })',
    returnByValue: true
  });
  console.log('[✔] Page Info:', JSON.stringify(pageInfo.result?.value, null, 2));
  
  ws.close();
  chrome.kill();
}

run().catch(err => {
  console.error('[-] Error:', err);
  try { chrome.kill(); } catch {}
  process.exit(1);
});
