import { signJwt } from '../packages/auth/dist/index.js';

const secret = 'supersecret-docsearch-jwt-key-2026-production-grade';
const doctorToken = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'doctor@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'PATHOLOGIST', 'RADIOLOGIST'],
  permissions: ['*'],
  isSuperAdmin: false
}, {
  secret,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

const hqToken = signJwt({
  sub: 'c0000000-0000-4000-8000-000000000001',
  userId: 'c0000000-0000-4000-8000-000000000001',
  email: 'hq.admin@docsearch.health',
  tenantId: '00000000-0000-4000-8000-000000000000',
  roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  permissions: ['*'],
  isSuperAdmin: true
}, {
  secret,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

const docHeaders = { 'Authorization': `Bearer ${doctorToken}` };
const hqHeaders = { 'Authorization': `Bearer ${hqToken}` };

async function checkRoute(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    console.log(`${name}: HTTP ${res.status}`);
    if (res.status >= 400) {
      const err = await res.text();
      console.log('  Error body:', err.slice(0, 200));
    }
    return res.status;
  } catch (e) {
    console.log(`${name}: Fetch error: ${e.message}`);
    return 0;
  }
}

async function main() {
  console.log('Testing domain endpoints with re-signed licenses...');
  await checkRoute('GET /clinical/patients', 'http://127.0.0.1:4000/api/v1/partner/clinical/patients', { headers: docHeaders });
  await checkRoute('GET /lab/orders', 'http://127.0.0.1:4000/api/v1/partner/lab/orders', { headers: docHeaders });
  await checkRoute('GET /radiology/orders', 'http://127.0.0.1:4000/api/v1/partner/radiology/orders', { headers: docHeaders });
  await checkRoute('GET /pharmacy/inventory', 'http://127.0.0.1:4000/api/v1/partner/pharmacy/inventory', { headers: docHeaders });
  await checkRoute('GET /pharmacy/prescriptions', 'http://127.0.0.1:4000/api/v1/partner/pharmacy/prescriptions', { headers: docHeaders });
  await checkRoute('GET /billing/invoices', 'http://127.0.0.1:4000/api/v1/partner/billing/invoices', { headers: docHeaders });
  await checkRoute('GET /company/partners', 'http://127.0.0.1:4000/api/v1/company/partners', { headers: hqHeaders });
  await checkRoute('GET /company/licenses', 'http://127.0.0.1:4000/api/v1/company/licenses', { headers: hqHeaders });
  await checkRoute('GET /auth/verification-queue', 'http://127.0.0.1:4000/api/v1/auth/verification-queue', { headers: hqHeaders });
}

main();
