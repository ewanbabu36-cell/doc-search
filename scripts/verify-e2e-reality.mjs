import http from 'http';
import { signJwt } from '../packages/auth/dist/index.js';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const token = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'founder@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['SUPER_ADMIN', 'DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
  permissions: ['*'],
  isSuperAdmin: true
}, {
  secret: MASTER_SECRET,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

async function api(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function verify() {
  console.log('[*] Testing live endpoints against running API Gateway (:4000)...');
  
  // 1. Health & Mode
  const health = await api('/api/v1/health');
  console.log('1. Health check:', health.status, JSON.stringify(health.body));

  // 2. Unbilled charges (Cross-desk handoff)
  const unbilled = await api('/api/v1/partner/billing/unbilled-charges?patientId=test');
  console.log('2. Unbilled charges endpoint status:', unbilled.status);

  // 3. Command center overview
  const kpis = await api('/api/v1/partner/command-center/overview');
  console.log('3. Command center overview status:', kpis.status, JSON.stringify(kpis.body).slice(0, 150));

  // 4. Lab orders endpoint
  const labOrders = await api('/api/v1/partner/lab/orders');
  console.log('4. Lab orders endpoint status:', labOrders.status);

  // 5. Radiology orders endpoint
  const radOrders = await api('/api/v1/partner/radiology/orders');
  console.log('5. Radiology orders endpoint status:', radOrders.status);

  // 6. Dietary orders endpoint
  const dietary = await api('/api/v1/partner/dietary/orders');
  console.log('6. Dietary orders endpoint status:', dietary.status);

  // 7. Quality infection incidents
  const quality = await api('/api/v1/partner/quality-infection/incidents');
  console.log('7. Quality infection incidents endpoint status:', quality.status);

  // 8. MRD records
  const mrd = await api('/api/v1/partner/mrd/records');
  console.log('8. MRD records endpoint status:', mrd.status);
}

verify();
