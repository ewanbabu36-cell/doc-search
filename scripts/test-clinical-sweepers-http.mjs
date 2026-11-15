import { signJwt } from '../packages/auth/dist/index.js';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CANONICAL_ORG = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';

const authToken = signJwt({
  sub: 'aaaa1111-8492-4aaa-8aaa-849208492001',
  email: 'doctor@docsearch.health',
  tenantId: CANONICAL_TENANT,
  organizationId: CANONICAL_ORG,
  branchId: CANONICAL_BRANCH,
  roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
  permissions: ['*']
}, {
  secret: process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade',
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresInSeconds: 3600
});

const headers = {
  Authorization: `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};

async function main() {
  console.log('Testing Clinical Sweepers API Endpoints...');

  // 1. Blood bank crossmatch auto-expire sweep
  const res1 = await fetch('http://127.0.0.1:4000/api/v1/partner/blood-bank/crossmatch/auto-expire-sweep', {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  const data1 = await res1.json();
  console.log('Blood bank sweep response:', res1.status, data1);

  // 2. Bed turnaround auto-escalate sweep
  const res2 = await fetch('http://127.0.0.1:4000/api/v1/partner/bed-turnaround/auto-escalate-sweep', {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  const data2 = await res2.json();
  console.log('Bed turnaround sweep response:', res2.status, data2);

  if (res1.status === 200 && res2.status === 200) {
    console.log('✅ BOTH CLINICAL SWEEPER ENDPOINTS RESPONDED WITH HTTP 200!');
  } else {
    console.error('❌ Sweeper endpoints failed');
    process.exit(1);
  }
}

main().catch(console.error);
