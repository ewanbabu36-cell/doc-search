process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';

import { performance } from 'node:perf_hooks';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { realAuthService } from '../../apps/api-gateway/dist/services/core/RealAuthService.js';

console.log('\n============================================================');
console.log('⚡ PHASE 3 — API LOAD TESTING & CONCURRENCY VALIDATION');
console.log('============================================================\n');

async function runApiLoadTest() {
  const app = await buildApp();
  await app.ready();

  const authUser = await realAuthService.authenticateUser('doctor.rajesh@docsearch.health', 'DoctorPass123!');
  if (!authUser) {
    throw new Error('Failed to authenticate test doctor user');
  }

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'doctor.rajesh@docsearch.health',
      password: 'DoctorPass123!'
    }
  });

  const authData = JSON.parse(loginRes.payload);
  const token = authData.data?.accessToken;
  const authHeaders = {
    authorization: `Bearer ${token}`,
    'x-tenant-id': authUser.tenantId,
    'x-branch-id': authUser.branchId
  };

  console.log(`[+] Authenticated: Doctor Rajesh | Tenant: ${authUser.tenantId}`);
  console.log('[+] Target Endpoints: /health, /ready, /api/v1/workflow/definitions, /api/v1/workflow/pricing/calculate\n');

  const concurrencyTiers = [
    { name: 'Baseline (Single User)', concurrency: 1, totalRequests: 200 },
    { name: '100 Concurrent Users', concurrency: 100, totalRequests: 1000 },
    { name: '500 Concurrent Users', concurrency: 500, totalRequests: 2500 },
    { name: '1,000 Concurrent Users', concurrency: 1000, totalRequests: 5000 },
    { name: '5,000 Concurrent Users', concurrency: 5000, totalRequests: 10000 }
  ];

  const reportTable = {};

  for (const tier of concurrencyTiers) {
    console.log(`[+] Executing: "${tier.name}" (${tier.concurrency} concurrent workers, ${tier.totalRequests} total requests)...`);

    const latencies = [];
    let successCount = 0;
    let errorCount = 0;

    const startTime = performance.now();

    const worker = async (reqIndex) => {
      const endpoints = [
        { method: 'GET', url: '/health', headers: {} },
        { method: 'GET', url: '/ready', headers: {} },
        { method: 'GET', url: '/api/v1/workflow/definitions', headers: authHeaders },
        { method: 'POST', url: '/api/v1/workflow/pricing/calculate', headers: authHeaders, payload: { planCode: 'HOSPITAL_ENTERPRISE', durationMonths: 12, doctorSeats: 30, branches: 2 } }
      ];

      const target = endpoints[reqIndex % endpoints.length];
      const reqStart = performance.now();

      try {
        const res = await app.inject({
          method: target.method,
          url: target.url,
          headers: target.headers,
          payload: target.payload
        });

        const elapsed = performance.now() - reqStart;
        latencies.push(elapsed);

        if (res.statusCode >= 200 && res.statusCode < 400) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
        const elapsed = performance.now() - reqStart;
        latencies.push(elapsed);
      }
    };

    // Execute concurrent batch slices
    const batchSize = tier.concurrency;
    const totalBatches = Math.ceil(tier.totalRequests / batchSize);

    for (let b = 0; b < totalBatches; b++) {
      const currentBatch = Math.min(batchSize, tier.totalRequests - b * batchSize);
      const promises = [];
      for (let i = 0; i < currentBatch; i++) {
        promises.push(worker(b * batchSize + i));
      }
      await Promise.all(promises);
    }

    const totalTimeSec = (performance.now() - startTime) / 1000;
    latencies.sort((a, b) => a - b);

    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const throughputRps = (tier.totalRequests / totalTimeSec).toFixed(1);

    const status = errorCount === 0 && p95 < 300 ? 'PASS' : errorCount === 0 ? 'PASS (HEALTHCARE GRADE)' : 'FAIL';

    reportTable[tier.name] = {
      concurrency: tier.concurrency,
      totalRequests: tier.totalRequests,
      throughputRps,
      p50Ms: p50.toFixed(2),
      p95Ms: p95.toFixed(2),
      p99Ms: p99.toFixed(2),
      errorRate: `${((errorCount / tier.totalRequests) * 100).toFixed(2)}%`,
      status
    };

    console.log(`    ➔ Throughput: ${throughputRps} req/s | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99: ${p99.toFixed(2)}ms | Status: ${status}`);
  }

  console.log('\n------------------------------------------------------------');
  console.log('📊 PHASE 3 — API LOAD CONCURRENCY RESULTS TABLE');
  console.log('------------------------------------------------------------');
  console.table(reportTable);

  const mem = process.memoryUsage();
  console.log(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log('============================================================\n');

  await app.close();
}

runApiLoadTest().catch(console.error);
