import { signJwt } from '../packages/auth/dist/index.js';

const secret = 'supersecret-docsearch-jwt-key-2026-production-grade';
const token = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'doctor@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
  permissions: ['*'],
  isSuperAdmin: false
}, { secret, issuer: 'docsearch-api', audience: 'docsearch-platform', expiresIn: '1h' });

async function run() {
  const r = await fetch('http://127.0.0.1:4000/api/v1/partner/clinical/patients/00000000-0000-4000-8000-000000000000', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Status:', r.status);
  const json = await r.json();
  console.log('JSON:', json);
}

run().catch(console.error);
