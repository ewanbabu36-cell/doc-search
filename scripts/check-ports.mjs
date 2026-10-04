import http from 'node:http';

const endpoints = [
  { name: 'API Gateway Health', url: 'http://localhost:4000/api/v1/health' },
  { name: 'Local Hardware Agent', url: 'http://localhost:18080/api/v1/hardware/health' },
  { name: 'Partner Platform', url: 'http://localhost:5173/' },
  { name: 'Landing Page', url: 'http://localhost:5175/' },
  { name: 'Company Platform', url: 'http://localhost:5177/' },
];

async function check(ep) {
  return new Promise((resolve) => {
    const req = http.get(ep.url, (res) => {
      resolve({ name: ep.name, url: ep.url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    req.on('error', (err) => resolve({ name: ep.name, url: ep.url, status: 'ERROR', error: err.message, ok: false }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ name: ep.name, url: ep.url, status: 'TIMEOUT', ok: false });
    });
  });
}

const results = await Promise.all(endpoints.map(check));
console.table(results);
