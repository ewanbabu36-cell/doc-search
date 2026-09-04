/**
 * PHASE 6 — Real Executable API Load & Concurrency Benchmark Harness
 * Strictly measures p50, p95, p99, max latency, throughput, error rates, and resource usage.
 * ZERO assumed or fabricated numbers.
 */

import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import crypto from 'node:crypto';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { setupTestDatabase, TEST_SEEDS } from '../../packages/database/dist/index.js';
import { signJwt } from '../../packages/auth/dist/index.js';

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

process.env['JWT_SECRET'] = MASTER_SECRET;
process.env['LICENSE_HMAC_SECRET'] = MASTER_SECRET;
process.env['NODE_ENV'] = 'test';
process.env['RATE_LIMIT_MAX'] = '1000000'; // Raised for high-concurrency benchmarks

function createStaffToken(roles, permissions = []) {
  const claims = {
    sub: crypto.randomUUID(),
    email: 'clinical.staff@docsearch.health',
    tenantId: TEST_SEEDS.TENANT_A,
    organizationId: TEST_SEEDS.TENANT_A,
    branchId: TEST_SEEDS.BRANCH_A,
    roles,
    permissions,
    iss: ISSUER,
    aud: AUDIENCE
  };
  return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 7200 });
}

function calculatePercentiles(latencies) {
  if (!latencies.length) return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  return {
    p50: Number(p50.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    p99: Number(p99.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    avg: Number(avg.toFixed(2))
  };
}

export async function runApiLoadBenchmark() {
  console.log('============================================================');
  console.log('⚡ PHASE 6 — API LOAD & CONCURRENCY BENCHMARK');
  console.log('============================================================');

  const testDb = await setupTestDatabase({ seedBaseline: true });
  const app = await buildApp();
  await app.ready();

  const doctorToken = createStaffToken(
    ['DOCTOR', 'HOSPITAL_ADMIN'],
    [
      'clinical:patients:create',
      'clinical:patients:read',
      'clinical:patients:update',
      'clinical:encounters:create',
      'clinical:encounters:read',
      'clinical:encounters:update',
      'clinical:consultations:create',
      'clinical:consultations:read',
      'clinical:consultations:update',
      'clinical:orders:create',
      'clinical:orders:read'
    ]
  );
  const adminToken = createStaffToken(['SUPER_ADMIN', 'COMPANY_ADMIN'], ['products:read', 'partners:read', 'subscriptions:read']);
  const billingToken = createStaffToken(['BILLING_STAFF', 'HOSPITAL_ADMIN'], ['billing:invoices:read', 'billing:invoices:create']);

  const doctorHeaders = { authorization: 'Bearer ' + doctorToken };
  const adminHeaders = { authorization: 'Bearer ' + adminToken };
  const billingHeaders = { authorization: 'Bearer ' + billingToken };

  // Seed baseline patient and encounter for consultation workflows
  const seedPatientRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/clinical/patients',
    headers: doctorHeaders,
    payload: {
      firstName: 'Seeded',
      lastName: 'LoadPatient',
      gender: 'MALE',
      dateOfBirth: '1985-01-01',
      mobileNumber: '+919876543210',
      address: '100 Baseline Hospital Road'
    }
  });
  const seededPatient = JSON.parse(seedPatientRes.payload).data;
  const benchmarkPatientId = seededPatient?.id || crypto.randomUUID();

  const seedEncounterRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/clinical/encounters',
    headers: doctorHeaders,
    payload: {
      patientId: benchmarkPatientId,
      doctorId: TEST_SEEDS.DOCTOR_ID,
      encounterType: 'OPD',
      priority: 'ROUTINE',
      department: 'GENERAL_MEDICINE'
    }
  });
  const seededEncounter = JSON.parse(seedEncounterRes.payload).data;
  const benchmarkEncounterId = seededEncounter?.id || crypto.randomUUID();

  // Representative Workflows across Clinical, Billing, and Company Platforms
  const workflows = [
    { name: 'GET /health (Liveness)', method: 'GET', url: '/health', headers: {} },
    { name: 'GET /ready (Readiness & DB Check)', method: 'GET', url: '/ready', headers: doctorHeaders },
    { name: 'GET /api/v1/partner/clinical/queues (Queue Access)', method: 'GET', url: '/api/v1/partner/clinical/queues', headers: doctorHeaders },
    { name: 'GET /api/v1/partner/clinical/patients (Patient Lookup)', method: 'GET', url: '/api/v1/partner/clinical/patients', headers: doctorHeaders },
    { name: 'POST /api/v1/partner/clinical/patients (Patient Registration)', method: 'POST', url: '/api/v1/partner/clinical/patients', headers: doctorHeaders, bodyGen: () => ({
        firstName: 'Bench',
        lastName: 'Patient_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        gender: 'FEMALE',
        dateOfBirth: '1988-06-15',
        mobileNumber: '+9199' + Math.floor(10000000 + Math.random() * 90000000),
        address: '100 Resilience Blvd'
      })
    },
    { name: 'GET /api/v1/partner/billing/invoices (Invoice List)', method: 'GET', url: '/api/v1/partner/billing/invoices', headers: billingHeaders },
    { name: 'GET /api/v1/company/products (Product Catalog)', method: 'GET', url: '/api/v1/company/products', headers: adminHeaders },
    { name: 'POST /api/v1/partner/clinical/consultations (Draft Save)', method: 'POST', url: '/api/v1/partner/clinical/consultations', headers: doctorHeaders, bodyGen: () => ({
        encounterId: benchmarkEncounterId,
        patientId: benchmarkPatientId,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        chiefComplaint: 'Routine clinical consultation load benchmark check',
        historyOfPresentIllness: 'Intermittent symptoms over past week',
        examinationNotes: 'BP 120/80, regular heart rate',
        diagnoses: [
          { code: 'Z00.00', description: 'General adult examination', isPrimary: true, type: 'PRIMARY' }
        ]
      })
    }
  ];

  // Concurrency Tiers: Baseline (1), Light (10), Medium (25), High (50), Peak (100), Stress (250)
  const tiers = [
    { name: 'Baseline (C=1)', concurrency: 1, requestsPerEndpoint: 15 },
    { name: 'Ramp-up (C=10)', concurrency: 10, requestsPerEndpoint: 25 },
    { name: 'Sustained Load (C=25)', concurrency: 25, requestsPerEndpoint: 40 },
    { name: 'Multi-Department Rush (C=50)', concurrency: 50, requestsPerEndpoint: 60 },
    { name: 'Peak Hospital OPD Hours (C=100)', concurrency: 100, requestsPerEndpoint: 100 },
    { name: 'Hospital Network Load (C=250)', concurrency: 250, requestsPerEndpoint: 125 }
  ];

  const results = {
    timestamp: new Date().toISOString(),
    tiers: [],
    endpointBreakdown: []
  };

  const endpointAggregates = {};
  for (const wf of workflows) {
    endpointAggregates[wf.name] = {
      endpoint: wf.name,
      method: wf.method,
      latencies: [],
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      concurrencyObserved: []
    };
  }

  for (const tier of tiers) {
    console.log('\n[+] Running Tier: ' + tier.name + ' (Concurrency: ' + tier.concurrency + ', Total Requests Target: ' + (tier.requestsPerEndpoint * workflows.length) + ')...');
    const initialMem = process.memoryUsage();
    const tierLatencies = [];
    let tierSuccess = 0;
    let tierErrors = 0;

    const tierStart = performance.now();

    for (const wf of workflows) {
      const agg = endpointAggregates[wf.name];
      agg.concurrencyObserved.push(tier.concurrency);

      const tasks = [];
      for (let i = 0; i < tier.requestsPerEndpoint; i++) {
        tasks.push(async () => {
          const payload = wf.bodyGen ? wf.bodyGen() : undefined;
          const reqStart = performance.now();
          try {
            const res = await app.inject({
              method: wf.method,
              url: wf.url,
              headers: wf.headers,
              payload
            });
            const elapsed = performance.now() - reqStart;
            tierLatencies.push(elapsed);
            agg.latencies.push(elapsed);
            agg.totalRequests++;

            if (res.statusCode >= 200 && res.statusCode < 400) {
              tierSuccess++;
              agg.successCount++;
            } else {
              if (wf.name.includes('consultations') && agg.errorCount === 0) {
                console.log('DEBUG CONSULT ERROR:', res.statusCode, res.payload);
              }
              tierErrors++;
              agg.errorCount++;
            }
          } catch (err) {
            const elapsed = performance.now() - reqStart;
            tierLatencies.push(elapsed);
            agg.latencies.push(elapsed);
            agg.totalRequests++;
            tierErrors++;
            agg.errorCount++;
          }
        });
      }

      // Execute tasks with bounded concurrency
      for (let i = 0; i < tasks.length; i += tier.concurrency) {
        const batch = tasks.slice(i, i + tier.concurrency);
        await Promise.all(batch.map((fn) => fn()));
      }
    }

    const tierDurationSecs = (performance.now() - tierStart) / 1000;
    const finalMem = process.memoryUsage();
    const stats = calculatePercentiles(tierLatencies);
    const rps = Number((tierLatencies.length / tierDurationSecs).toFixed(1));

    const tierSummary = {
      tierName: tier.name,
      concurrency: tier.concurrency,
      totalRequests: tierLatencies.length,
      successCount: tierSuccess,
      errorCount: tierErrors,
      errorRatePercent: Number(((tierErrors / tierLatencies.length) * 100).toFixed(2)),
      durationSeconds: Number(tierDurationSecs.toFixed(2)),
      throughputRps: rps,
      ...stats,
      heapUsedMb: Number((finalMem.heapUsed / (1024 * 1024)).toFixed(2)),
      rssMb: Number((finalMem.rss / (1024 * 1024)).toFixed(2))
    };

    results.tiers.push(tierSummary);

    console.log('    ➔ Duration: ' + tierDurationSecs.toFixed(2) + 's | Throughput: ' + rps + ' RPS | Success: ' + tierSuccess + '/' + tierLatencies.length + ' (Errors: ' + tierErrors + ')');
    console.log('    ➔ Latency: p50=' + stats.p50 + 'ms, p95=' + stats.p95 + 'ms, p99=' + stats.p99 + 'ms, max=' + stats.max + 'ms | Heap: ' + tierSummary.heapUsedMb + ' MB');
  }

  // Generate Endpoint Breakdown Table
  for (const wf of workflows) {
    const agg = endpointAggregates[wf.name];
    const stats = calculatePercentiles(agg.latencies);
    const totalTimeSec = agg.latencies.reduce((s, v) => s + v, 0) / 1000;
    const rps = totalTimeSec > 0 ? Number((agg.latencies.length / totalTimeSec).toFixed(1)) : 0;

    results.endpointBreakdown.push({
      endpoint: agg.endpoint,
      method: agg.method,
      maxConcurrencyTested: Math.max(...agg.concurrencyObserved),
      totalRequests: agg.totalRequests,
      successCount: agg.successCount,
      errorCount: agg.errorCount,
      errorRatePercent: Number(((agg.errorCount / agg.totalRequests) * 100).toFixed(2)),
      ...stats,
      measuredRps: rps
    });
  }

  await app.close();
  return results;
}

runApiLoadBenchmark().then((res) => {
  fs.writeFileSync('./tests/load/phase6-api-load-results.json', JSON.stringify(res, null, 2));
  console.log('\n[+] Results saved to ./tests/load/phase6-api-load-results.json');
  console.table(res.tiers);
  console.log('\n------------------------------------------------------------');
  console.log('📊 ENDPOINT LATENCY & THROUGHPUT BREAKDOWN');
  console.log('------------------------------------------------------------');
  console.table(res.endpointBreakdown);
}).catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
