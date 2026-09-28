import { signJwt } from '../packages/auth/dist/index.js';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const BRANCH_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DOCTOR_A_ID = '99999999-9999-4999-8999-999999999999';

const token = signJwt({
  sub: DOCTOR_A_ID,
  email: 'rajesh.sharma@docsearch.health',
  name: 'Dr. Rajesh Sharma',
  tenantId: TENANT_A,
  branchId: BRANCH_A,
  isSuperAdmin: false,
  roles: ['DOCTOR', 'HOSPITAL_ADMIN'],
  permissions: ['*'],
  iss: ISSUER,
  aud: AUDIENCE
}, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 7200 });

async function test() {
  console.log('Testing /api/v1/partner/patients with Partner DOCTOR token...');
  const res = await fetch('http://localhost:4000/api/v1/partner/patients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      firstName: 'DirectProbe',
      lastName: 'Patient',
      gender: 'MALE',
      dateOfBirth: '1990-01-01',
      mobileNumber: '9998887776',
      bloodGroup: 'B_POSITIVE'
    })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

test().catch(console.error);
