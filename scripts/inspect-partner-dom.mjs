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
  
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const target = targets.find(t => t.type === 'page') || targets[0];
  
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  const consoleLogs = [];
  const networkRequests = [];

  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) {
      const { resolve, reject } = pending.get(d.id);
      pending.delete(d.id);
      if (d.error) reject(d.error); else resolve(d.result);
    }
    if (d.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push({ type: d.params.type, args: d.params.args.map(a => a.value || a.description) });
    }
    if (d.method === 'Network.requestWillBeSent') {
      networkRequests.push({ url: d.params.request.url, method: d.params.request.method });
    }
    if (d.method === 'Network.responseReceived') {
      const match = networkRequests.find(r => r.url === d.params.response.url);
      if (match) match.status = d.params.response.status;
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
  await send('Network.enable');

  await send('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 5000));

  const domSummary = await send('Runtime.evaluate', {
    expression: `({
      title: document.title,
      url: window.location.href,
      htmlPreview: document.body.innerHTML.slice(0, 500),
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder })),
      h1: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim())
    })`,
    returnByValue: true
  });

  console.log('[*] DOM Summary:');
  console.log(JSON.stringify(domSummary.result?.value, null, 2));

  console.log('\n[*] Console Logs (first 10):');
  console.log(consoleLogs.slice(0, 10));

  console.log('\n[*] Network Requests (first 10):');
  console.log(networkRequests.slice(0, 10));

  ws.close();
  chrome.kill();
}

run().catch(err => {
  console.error('[-] Error:', err);
  try { chrome.kill(); } catch {}
  process.exit(1);
});
