import { ensureChrome, sleep, VIEWPORTS } from './category-5-cdp-helpers.mjs';

import fs from 'fs';
import path from 'path';

async function main() {
  await ensureChrome();
  const ver = await fetch('http://127.0.0.1:9222/json/list').then(r => r.json());
  const page = ver.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise(r => ws.on('open', r));
  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const curId = id++;
    const handler = (data) => {
      const parsed = JSON.parse(data);
      if (parsed.id === curId) {
        ws.off('message', handler);
        res(parsed.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5175' });
  await sleep(2000);

  // Dismiss popup
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const skip = btns.find(b => b.textContent.includes('Skip') || b.textContent.includes('No thanks'));
        if (skip) skip.click();
      })()
    `
  });
  await sleep(500);

  // Click EWAN launcher orb
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const orb = document.querySelector('[title*="EWAN Assistant"]');
        if (orb) {
          orb.click();
          return { clicked: true, title: orb.getAttribute('title') };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Orb click result:', clickRes);
  await sleep(1000);

  // Check modal contents in DOM
  const checkModal = await send('Runtime.evaluate', {
    expression: `
      (function() {
        return {
          hasAssistantTitle: document.body.innerText.includes('EWAN Assistant'),
          hasOnline: document.body.innerText.includes('Online'),
          hasHeroGreeting: document.body.innerText.includes('Main EWAN Health Assistant hoon'),
          hasFindDoctors: document.body.innerText.includes('Find Doctors'),
          hasBookToken: document.body.innerText.includes('Book OPD Token'),
          hasLabTests: document.body.innerText.includes('Lab Tests'),
          hasVoiceAssistant: document.body.innerText.includes('Voice Assistant'),
          hasDeveloperJargon: document.body.innerText.includes('Ports: 4000') || document.body.innerText.includes('Tables:'),
          placeholderText: document.querySelector('input[placeholder*="Type a message"]')?.getAttribute('placeholder')
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Modal DOM Verification:', checkModal?.result?.value);

  // Take screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.resolve('audit-results/screenshots/ewan_modal_active_proof.png');
  fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to:', shotPath);

  ws.close();
}

main().catch(console.error);
