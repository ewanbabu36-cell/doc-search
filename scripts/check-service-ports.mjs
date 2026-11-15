import http from 'http';

const ports = [
  { name: 'API Gateway', port: 4000, path: '/health' },
  { name: 'Hardware Agent', port: 18080, path: '/health' },
  { name: 'PACS DICOM Web', port: 8042, path: '/system' },
  { name: 'Patient App', port: 3000, path: '/' },
  { name: 'Partner Platform', port: 5173, path: '/' },
  { name: 'Company Platform', port: 5174, path: '/' },
  { name: 'Landing Page', port: 5175, path: '/' }
];

function checkPort(p) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: p.port,
      path: p.path,
      method: 'GET',
      timeout: 3000
    }, (res) => {
      resolve({ name: p.name, port: p.port, status: res.statusCode, ok: true });
    });
    req.on('error', (err) => {
      resolve({ name: p.name, port: p.port, status: null, ok: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ name: p.name, port: p.port, status: null, ok: false, error: 'TIMEOUT' });
    });
    req.end();
  });
}

async function main() {
  console.log('=== CHECKING ALL DOCSEARCH PORTS & SERVICES ===\n');
  for (const p of ports) {
    const res = await checkPort(p);
    if (res.ok) {
      console.log(`  ✓ ${res.name} (Port ${res.port}): HTTP ${res.status}`);
    } else {
      console.log(`  ✗ ${res.name} (Port ${res.port}): DOWN (${res.error})`);
    }
  }
}

main().catch(console.error);
