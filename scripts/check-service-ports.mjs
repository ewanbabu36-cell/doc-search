import http from 'http';

const ports = [
  { name: 'Master Gateway Hub', port: 3000, path: '/' },
  { name: 'Partner Platform (Clinical ERP)', port: 5173, path: '/' },
  { name: 'Patient Mobile App', port: 5174, path: '/' },
  { name: 'Landing & Booking Page', port: 5175, path: '/' },
  { name: 'Company GodMode Platform (Admin HQ)', port: 5177, path: '/' },
  { name: 'API Gateway', port: 4000, path: '/api/v1/health' },
  { name: 'PACS Radiology DICOM Server', port: 8042, path: '/system' },
  { name: 'Hardware Agent (LHA)', port: 18080, path: '/health' }
];

function checkPort(p) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: p.port,
      path: p.path,
      method: 'GET',
      timeout: 6000
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
