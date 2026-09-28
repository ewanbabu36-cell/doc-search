import http from 'http';
import fs from 'fs';
import path from 'path';

function checkHttp(url, options = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runAudit() {
  console.log('Testing running ports...');
  const gateway = await checkHttp('http://127.0.0.1:4000/api/v1/health');
  const partner = await checkHttp('http://127.0.0.1:5173/');
  const company = await checkHttp('http://127.0.0.1:5174/');
  const landing = await checkHttp('http://127.0.0.1:5175/');

  console.log({
    gateway: gateway.status,
    partner: partner.status,
    company: company.status,
    landing: landing.status
  });
}

runAudit();
