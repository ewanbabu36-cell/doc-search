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

const endpoints = [
  '/api/v1/partner/blood-bank/donors',
  '/api/v1/partner/blood-bank/donations',
  '/api/v1/partner/blood-bank/components',
  '/api/v1/partner/blood-bank/requests',
  '/api/v1/partner/blood-bank/crossmatches',
  '/api/v1/partner/blood-bank/issues',
  '/api/v1/partner/blood-bank/transfusions',
  '/api/v1/partner/blood-bank/tests',
  '/api/v1/partner/blood-bank/temperature-logs',
  '/api/v1/partner/blood-bank/screenings',
  '/api/v1/partner/blood-bank/quality-checks',
  '/api/v1/partner/blood-bank/discards',
  '/api/v1/partner/blood-bank/audit-traces',
  '/api/v1/partner/radiology-ai/critical-findings/alerts',
  '/api/v1/partner/emergency/ambulance/active-fleet',
  '/api/v1/partner/bed-turnaround/turnaround-metrics'
];

async function main() {
  let passed = 0;
  let failed = 0;
  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:4000${ep}`, { headers });
      const body = await res.json().catch(() => null);
      if (res.status === 200) {
        const count = Array.isArray(body?.data) ? body.data.length + ' items' : JSON.stringify(body?.data || body).slice(0, 50);
        console.log(`✓ [200] ${ep} - Data: ${count}`);
        passed++;
      } else {
        console.error(`✗ [${res.status}] ${ep} - Error:`, body);
        failed++;
      }
    } catch (err) {
      console.error(`✗ [ERROR] ${ep}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\n=== BLOOD BANK & LIVE ROUTES AUDIT: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

main();
