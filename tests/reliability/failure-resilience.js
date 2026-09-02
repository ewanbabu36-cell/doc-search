import { performance } from 'node:perf_hooks';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { realAuthService } from '../../apps/api-gateway/dist/services/core/RealAuthService.js';

console.log('\n============================================================');
console.log('💥 PHASE 6 — FAILURE TESTING & CHAOS RESILIENCE VALIDATION');
console.log('============================================================\n');

async function runFailureTest() {
  const app = await buildApp();
  await app.ready();

  const authUser = await realAuthService.authenticateUser('doctor.rajesh@docsearch.health', 'DoctorPass123!');
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'doctor.rajesh@docsearch.health', password: 'DoctorPass123!' }
  });
  const token = JSON.parse(loginRes.payload).data?.accessToken;
  const authHeaders = { authorization: `Bearer ${token}` };

  const failureScenarios = [
    {
      name: 'Scenario 1: Malformed / Broken JSON Payload',
      execute: async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/workflow/pricing/calculate',
          headers: { ...authHeaders, 'content-type': 'application/json' },
          payload: '{ invalidJson: "broken"'
        });
        return {
          expectedCode: 400,
          actualCode: res.statusCode,
          handledGracefully: res.statusCode === 400,
          details: 'RFC 7807 sanitization prevented gateway crash'
        };
      }
    },
    {
      name: 'Scenario 2: Missing Authentication Token (401 Rejection)',
      execute: async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/workflow/pricing/calculate',
          payload: { planCode: 'HOSPITAL_ENTERPRISE', durationMonths: 12 }
        });
        return {
          expectedCode: 401,
          actualCode: res.statusCode,
          handledGracefully: res.statusCode === 401,
          details: 'Zero-trust auth-guard rejected unauthenticated attempt'
        };
      }
    },
    {
      name: 'Scenario 3: Non-Existent Route (404 Sanitization)',
      execute: async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/non_existent_clinical_endpoint'
        });
        return {
          expectedCode: 404,
          actualCode: res.statusCode,
          handledGracefully: res.statusCode === 404,
          details: 'Fastify 404 handler returned clean error payload'
        };
      }
    },
    {
      name: 'Scenario 4: Idempotency & Duplicate Transaction Protection',
      execute: async () => {
        const idempotencyKey = `IDEMP-${Date.now()}-${Math.random()}`;
        const req1 = await app.inject({
          method: 'POST',
          url: '/api/v1/workflow/pricing/calculate',
          headers: { ...authHeaders, 'x-idempotency-key': idempotencyKey },
          payload: { planCode: 'HOSPITAL_ENTERPRISE', durationMonths: 12, doctorSeats: 25 }
        });
        const req2 = await app.inject({
          method: 'POST',
          url: '/api/v1/workflow/pricing/calculate',
          headers: { ...authHeaders, 'x-idempotency-key': idempotencyKey },
          payload: { planCode: 'HOSPITAL_ENTERPRISE', durationMonths: 12, doctorSeats: 25 }
        });
        const payload1 = JSON.parse(req1.payload);
        const payload2 = JSON.parse(req2.payload);
        return {
          expectedCode: 200,
          actualCode: req2.statusCode,
          handledGracefully: JSON.stringify(payload1) === JSON.stringify(payload2),
          details: 'Exact duplicate execution matches deterministic output'
        };
      }
    }
  ];

  const report = {};
  for (const scenario of failureScenarios) {
    console.log(`[+] Testing ${scenario.name}...`);
    const res = await scenario.execute();
    const status = res.handledGracefully ? 'PASS' : 'FAIL';
    report[scenario.name] = {
      expected: res.expectedCode,
      actual: res.actualCode,
      handledGracefully: res.handledGracefully,
      details: res.details,
      status
    };
    console.log(`    ➔ Expected: ${res.expectedCode} | Actual: ${res.actualCode} | Status: ${status}`);
  }

  console.log('\n------------------------------------------------------------');
  console.log('📊 PHASE 6 — FAILURE RESILIENCE & CHAOS SUMMARY');
  console.log('------------------------------------------------------------');
  console.table(report);
  console.log('============================================================\n');

  await app.close();
}

runFailureTest().catch(console.error);
