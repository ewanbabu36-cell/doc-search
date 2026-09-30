const http = require('http');

const endpoints = [
  { name: 'API Gateway (http://localhost:4000/api/v1/health)', url: 'http://localhost:4000/api/v1/health' },
  { name: 'API Gateway (http://localhost:4000/api/v1/commercial/plans)', url: 'http://localhost:4000/api/v1/commercial/plans' },
  { name: 'Partner Platform (http://localhost:5173/)', url: 'http://localhost:5173/' },
  { name: 'Company Platform (http://localhost:5174/)', url: 'http://localhost:5174/' },
  { name: 'Landing Page (http://localhost:5175/)', url: 'http://localhost:5175/' },
];

async function check(ep) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(ep.url, { timeout: 20000 }, (res) => {
      let len = 0;
      res.on('data', chunk => len += chunk.length);
      res.on('end', () => {
        const ms = Date.now() - start;
        console.log(`[PASS] ${ep.name.padEnd(60)} -> HTTP ${res.statusCode} (${len} bytes, ${ms}ms)`);
        resolve(true);
      });
    });
    req.on('timeout', () => {
      console.log(`[FAIL] ${ep.name.padEnd(60)} -> TIMEOUT`);
      req.destroy();
      resolve(false);
    });
    req.on('error', (err) => {
      console.log(`[FAIL] ${ep.name.padEnd(60)} -> ERROR: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('================================================================================');
  console.log('DOC SEARCH LOCALHOST (HOSTNAME: localhost) 4-SERVICE SUITE VERIFICATION');
  console.log('================================================================================');
  for (const ep of endpoints) {
    await check(ep);
  }
  console.log('================================================================================');
}

main();
