const http = require('http');

const ports = [
  { name: 'API Gateway', port: 4000, path: '/health' },
  { name: 'Partner Platform', port: 5173, path: '/' },
  { name: 'Company Platform', port: 5174, path: '/' },
  { name: 'Landing Page', port: 5175, path: '/' }
];

async function checkPort(item) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: item.port,
        path: item.path,
        method: 'GET',
        headers: { 'User-Agent': 'TestClient' }
      },
      (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          console.log(`[OK] ${item.name} (Port ${item.port}${item.path}): HTTP ${res.statusCode} (${body.length} bytes)`);
          resolve(true);
        });
      }
    );

    req.on('error', (err) => {
      console.error(`[FAIL] ${item.name} (Port ${item.port}): ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.error(`[TIMEOUT] ${item.name} (Port ${item.port})`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

(async () => {
  for (const item of ports) {
    await checkPort(item);
  }
})();
