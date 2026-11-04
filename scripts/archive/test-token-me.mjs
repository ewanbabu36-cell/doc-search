import { signJwt } from '../packages/auth/dist/index.js';

const MASTER_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';
const token = signJwt({
  sub: 'e0000000-0000-4000-8000-000000000001',
  userId: 'e0000000-0000-4000-8000-000000000001',
  email: 'doctor@docsearch.health',
  tenantId: '11111111-1111-4111-8111-111111111111',
  branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
  permissions: ['*'],
  isSuperAdmin: false
}, {
  secret: MASTER_SECRET,
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresIn: '24h'
});

async function run() {
  const uniqueId = Date.now();
  const res = await fetch('http://127.0.0.1:4000/api/v1/partner/clinical/patients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      firstName: 'Ananya',
      lastName: 'Deshmukh-' + uniqueId,
      gender: 'FEMALE',
      dateOfBirth: '1990-08-24',
      mobileNumber: '+9198765' + String(uniqueId).slice(-5),
      bloodGroup: 'B_POSITIVE',
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mrn: 'MRN-RT-' + uniqueId
    })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Data:', JSON.stringify(data, null, 2));
}

run().catch(console.error);
