import { performance } from 'node:perf_hooks';
import { buildApp } from '../../apps/api-gateway/dist/app.js';

console.log('\n======================================================================');
console.log('🚦 TEST SUITE 2 — RATE LIMITING & HOSPITAL NAT COLLISION AUDIT');
console.log('======================================================================\n');

async function runRateLimitAudit() {
  const app = await buildApp();
  await app.ready();

  const auditResults = [];

  // Scenario 1: Unauthenticated Brute Force on Single IP (Default Limit 100 req/min)
  console.log('[+] Scenario 1: Flooding /api/v1/auth/login from Single IP (150 requests)...');
  let rejectedCount = 0;
  let acceptedCount = 0;

  for (let i = 0; i < 150; i++) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `attacker_${i}@bad.org`, password: 'wrong' }
    });
    if (res.statusCode === 429) rejectedCount++;
    else acceptedCount++;
  }

  auditResults.push({
    scenario: 'Public IP Brute-Force Flooding',
    totalRequests: 150,
    accepted: acceptedCount,
    throttled429: rejectedCount,
    status: rejectedCount > 0 ? 'PASS (THROTTLED)' : 'FAIL',
    details: `Rate limiter tripped after ${acceptedCount} requests from attacker IP.`
  });

  // Scenario 2: Hospital NAT Single IP Collision (200 legitimate clinical staff sharing 1 IP)
  console.log('[+] Scenario 2: Hospital NAT Simulation (50 Doctors & Nurses sharing 1 Corporate IP)...');
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'doctor.rajesh@docsearch.health', password: 'DoctorPass123!' }
  });
  const token = JSON.parse(loginRes.payload).data?.accessToken;
  const authHeaders = { authorization: `Bearer ${token}` };

  let natAccepted = 0;
  let natBlocked429 = 0;

  for (let i = 0; i < 150; i++) {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: authHeaders
    });
    if (res.statusCode === 429) natBlocked429++;
    else natAccepted++;
  }

  const natVulnerability = natBlocked429 > 0;
  auditResults.push({
    scenario: 'Hospital NAT Shared IP Collision',
    totalRequests: 150,
    accepted: natAccepted,
    throttled429: natBlocked429,
    status: natVulnerability ? 'DEFECT (FALSE 429 ON HOSPITAL STAFF)' : 'PASS',
    details: natVulnerability
      ? 'CRITICAL DEFECT: Rate limiter is IP-bound without tenant/token keying, blocking legitimate hospital staff'
      : 'Authenticated tokens bypass or have separate quota'
  });

  console.log('\n----------------------------------------------------------------------');
  console.log('📊 RATE LIMITING AUDIT SUMMARY TABLE');
  console.log('----------------------------------------------------------------------');
  console.table(auditResults);
  console.log('======================================================================\n');

  await app.close();
}

runRateLimitAudit().catch(console.error);
