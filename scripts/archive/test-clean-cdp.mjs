import { ensureChrome, closeChrome, createDoctorAuth, VIEWPORTS } from './category-5-cdp-helpers.mjs';

const DEBUG_PORT = 9222;

async function testCleanNav() {
  await ensureChrome();

  const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await newTabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);

  return new Promise((resolve) => {
    let msgId = 1;
    const callbacks = new Map();

    const send = (method, params = {}) => new Promise((res) => {
      const id = msgId++;
      const timer = setTimeout(() => {
        callbacks.delete(id);
        res({});
      }, 8000);
      callbacks.set(id, (val) => {
        clearTimeout(timer);
        res(val);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.id && callbacks.has(msg.id)) {
          const cb = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          cb(msg.result);
        }
      } catch {}
    };

    ws.onopen = async () => {
      await send('Page.enable');
      await send('Runtime.enable');

      const storageScript = createDoctorAuth();
      await send('Page.addScriptToEvaluateOnNewDocument', { source: storageScript });

      console.log('Navigating to Partner Platform...');
      await send('Page.navigate', { url: 'http://localhost:5173/?module=clinical-consultation' });

      // Poll for hydration
      let hydrated = false;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 250));
        const check = await send('Runtime.evaluate', {
          expression: 'document.getElementById("root")?.children?.length > 0 && document.body.innerText.trim().length > 50'
        });
        if (check?.result?.value === true) {
          hydrated = true;
          break;
        }
      }

      console.log('Hydration check result:', hydrated);

      const domEval = await send('Runtime.evaluate', {
        expression: '({ bodyLength: document.body.innerText.trim().length, text: document.body.innerText.slice(0, 150) })',
        returnByValue: true
      });
      console.log('DOM Eval:', domEval.result?.value);

      ws.close();
      await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${tabData.id}`);
      resolve(hydrated);
    };
  });
}

testCleanNav().then((res) => {
  console.log('Test clean nav result:', res);
  process.exit(res ? 0 : 1);
});
