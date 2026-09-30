import { signJwt } from '../packages/auth/dist/index.js';

const secret = 'supersecret-docsearch-jwt-key-2026-production-grade';
const token = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'doctor@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  partnerId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
  organizationId: '1c14ebdd-af6d-44df-afa3-fe1e91301d15',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
  permissions: ['*'],
  isSuperAdmin: false
}, {
  secret,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

async function run() {
  const patientId = 'bdd73bf7-6f7a-45a6-8cac-8abeb1e27bc6'; // From earlier creation
  const r = await fetch(`http://127.0.0.1:4000/api/v1/partner/patient-360/${patientId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Patient 360 status:', r.status);
  const json = await r.json();
  console.log('Patient 360 json:', JSON.stringify(json, null, 2));
}

run().catch(console.error);
