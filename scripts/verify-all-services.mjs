import http from 'http';

const ports = [
  { name: 'Master Gateway Hub', port: 3000 },
  { name: 'Partner Platform', port: 5173 },
  { name: 'Patient Mobile App', port: 5174 },
  { name: 'Public Landing Web', port: 5175 },
  { name: 'Company Platform', port: 5177 },
  { name: 'API Gateway Backend', port: 4000 },
  { name: 'Orthanc DICOM PACS', port: 8042 },
  { name: 'Hardware Bridge Agent', port: 18080 }
];

async function checkPort(service) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${service.port}`, { timeout: 3000 }, (res) => {
      resolve({ service: service.name, port: service.port, status: res.statusCode, ok: true });
    });
    req.on('error', (err) => {
      resolve({ service: service.name, port: service.port, error: err.message, ok: false });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ service: service.name, port: service.port, error: 'TIMEOUT', ok: false });
    });
  });
}

const results = await Promise.all(ports.map(checkPort));
console.table(results);
const allOk = results.every(r => r.ok);
console.log(`All services online: ${allOk ? 'YES' : 'NO'}`);
if (!allOk) process.exit(1);
