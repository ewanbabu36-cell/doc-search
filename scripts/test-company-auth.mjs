import fs from 'fs';
import path from 'path';
import { signJwt } from '../packages/auth/dist/index.js';

const DEBUG_PORT = 9222;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function testCompanyAuth() {
  const companyToken = signJwt({
    sub: 'c0000000-0000-4000-8000-000000000001',
    userId: 'c0000000-0000-4000-8000-000000000001',
    email: 'founder@docsearch.health',
    actorEmail: 'founder@docsearch.health',
    tenantId: '00000000-0000-4000-8000-000000000000',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    permissions: ['*'],
    isSuperAdmin: true
  }, { secret: JWT_SECRET, issuer: 'docsearch-api', audience: 'docsearch-platform', expiresIn: '24h' });

  const companyUser = {
    name: 'Executive Admin',
    email: 'founder@docsearch.health',
    role: 'SUPER_ADMIN',
    roleTitle: 'SUPER_ADMIN (Verified Session)',
    clearanceLevel: 'Executive Access'
  };

  const setupStorage = `
    localStorage.setItem('docsearch_company_token', ${JSON.stringify(companyToken)});
    localStorage.setItem('docsearch_company_founder_auth', ${JSON.stringify(JSON.stringify(companyUser))});
  `;

  const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://localhost:5174`, { method: 'PUT' });
  const tabData = await newTabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);

  return new Promise((resolve) => {
    let id = 1;
    const callbacks = new Map();
    const send = (method, params = {}) => new Promise(res => {
      const msgId = id++;
      callbacks.set(msgId, res);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      }
    };

    ws.onopen = async () => {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Runtime.evaluate', { expression: setupStorage });
      await send('Page.reload');
      await sleep(3000);

      const evalRes = await send('Runtime.evaluate', {
        expression: '({ title: document.title, bodyLength: document.body.innerText.length, textSnippet: document.body.innerText.slice(0, 300) })',
        returnByValue: true
      });

      console.log('Company platform authenticated render:', evalRes.result?.value);
      ws.close();
      await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${tabData.id}`);
      resolve(true);
    };
  });
}

testCompanyAuth().then(() => process.exit(0));
