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

async function run() {
  const patientPayload = {
    firstName: 'Aarav',
    lastName: 'Verma',
    gender: 'MALE',
    dateOfBirth: '1985-06-15',
    mobileNumber: '9876543210',
    bloodGroup: 'B_POSITIVE',
    branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    mrn: 'MRN-P18-CHECK-' + Date.now()
  };

  const res = await fetch('http://localhost:5173/api/v1/partner/clinical/patients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(patientPayload)
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Response:', JSON.stringify(json, null, 2));
}

run().catch(console.error);
