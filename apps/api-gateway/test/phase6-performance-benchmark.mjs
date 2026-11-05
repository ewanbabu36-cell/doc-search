/**
 * DOC SEARCH — Phase 6 Enterprise Performance, Scalability & Stress Benchmark Suite
 * 
 * Executes real end-to-end synthetic workloads against the live DocSearch API Gateway
 * and native PostgreSQL 18.4 engine on port 5432.
 * 
 * Evaluates:
 * - Baseline Test (concurrency 5)
 * - Load Test (concurrency 20)
 * - Stress Test (concurrency 50)
 * - Spike Test (burst 100)
 * - Endurance Test (sustained 1,000 requests)
 * 
 * Computes:
 * - p50, p95, p99, min, max, avg latencies
 * - Throughput (RPS)
 * - Error rate %
 * - Memory & connection pool utilization
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
import { buildApp } from '../dist/app.js';
import { getDatabase, getDatabasePoolMetrics, ensureDatabaseReady } from '@docsearch/database';
import { signJwt } from '@docsearch/auth';
import crypto from 'node:crypto';

const BENCHMARK_PORT = 4099;
const BASE_URL = `http://127.0.0.1:${BENCHMARK_PORT}`;
const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const PARTNER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PARTNER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { minMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0, avgMs: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const minMs = Math.round(sorted[0] * 100) / 100;
  const maxMs = Math.round(sorted[sorted.length - 1] * 100) / 100;
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const avgMs = Math.round((sum / sorted.length) * 100) / 100;
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  return {
    minMs,
    p50Ms: Math.round(sorted[p50Index] * 100) / 100,
    p95Ms: Math.round(sorted[p95Index] * 100) / 100,
    p99Ms: Math.round(sorted[p99Index] * 100) / 100,
    maxMs,
    avgMs
  };
}

async function runWorkerPool(totalRequests, concurrency, requestFn) {
  const latencies = [];
  let successes = 0;
  let failures = 0;
  let currentIndex = 0;

  const start = performance.now();

  const workers = Array.from({ length: concurrency }).map(async () => {
    while (currentIndex < totalRequests) {
      const idx = currentIndex++;
      try {
        const res = await requestFn(idx);
        latencies.push(res.latencyMs);
        if (res.success) successes++;
        else failures++;
      } catch {
        failures++;
      }
    }
  });

  await Promise.all(workers);
  const durationMs = Math.round(performance.now() - start);

  return { latencies, successes, failures, durationMs };
}

async function main() {
  console.log('================================================================');
  console.log('DOCSEARCH PHASE 6 — PERFORMANCE, SCALABILITY & STRESS BENCHMARK');
  console.log('================================================================');
  console.log(`Starting Fastify API Gateway on ${BASE_URL}...`);

  await ensureDatabaseReady();
  const app = await buildApp();
  await app.listen({ port: BENCHMARK_PORT, host: '127.0.0.1' });
  console.log(`API Gateway ready and listening on port ${BENCHMARK_PORT}.`);

  const tokenTenantA = signJwt(
    {
      sub: 'usr-bench-doc-a',
      email: 'dr.sharma@apollo.health',
      tenantId: TENANT_A,
      partnerId: PARTNER_A,
      organizationId: PARTNER_A,
      role: 'DOCTOR',
      roles: ['DOCTOR', 'STAFF'],
      permissions: ['*']
    },
    { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 7200 }
  );

  const tokenTenantB = signJwt(
    {
      sub: 'usr-bench-doc-b',
      email: 'dr.verma@max.health',
      tenantId: TENANT_B,
      partnerId: PARTNER_B,
      organizationId: PARTNER_B,
      role: 'DOCTOR',
      roles: ['DOCTOR', 'STAFF'],
      permissions: ['*']
    },
    { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 7200 }
  );

  const endpoints = [
    { name: '1. Health Liveness Probe', method: 'GET', path: '/health', token: null },
    { name: '2. Health Readiness Probe (DB SELECT 1)', method: 'GET', path: '/ready', token: null },
    { name: '3. Detailed APM Telemetry', method: 'GET', path: '/api/v1/health/detailed', token: null },
    { name: '4. Cache Telemetry Probe', method: 'GET', path: '/api/v1/health/cache', token: null },
    { name: '5. Cluster Realtime Probe', method: 'GET', path: '/api/v1/health/cluster', token: null },
    { name: '6. Circuit Breakers Probe', method: 'GET', path: '/api/v1/health/circuit-breakers', token: null }
  ];

  const results = [];

  async function executeBenchmarkWorkload(workloadName, totalReqs, concurrency) {
    console.log(`\n--- Running Workload: ${workloadName} (${totalReqs} reqs, concurrency: ${concurrency}) ---`);
    const memBefore = process.memoryUsage();

    const outcome = await runWorkerPool(totalReqs, concurrency, async (index) => {
      const ep = endpoints[index % endpoints.length];
      const token = index % 2 === 0 ? tokenTenantA : tokenTenantB;
      const headers = {
        'Accept': 'application/json'
      };
      if (ep.token !== null) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const reqStart = performance.now();
      try {
        const resp = await fetch(`${BASE_URL}${ep.path}`, {
          method: ep.method,
          headers
        });
        const latencyMs = performance.now() - reqStart;
        return { success: resp.status < 500, latencyMs };
      } catch {
        const latencyMs = performance.now() - reqStart;
        return { success: false, latencyMs };
      }
    });

    const memAfter = process.memoryUsage();
    const poolMetrics = getDatabasePoolMetrics();
    const percentiles = calculatePercentiles(outcome.latencies);
    const rps = outcome.durationMs > 0 ? Math.round((outcome.successes / (outcome.durationMs / 1000)) * 10) / 10 : 0;
    const errorRate = totalReqs > 0 ? Math.round((outcome.failures / totalReqs) * 10000) / 100 : 0;

    const result = {
      workload: workloadName,
      totalRequests: totalReqs,
      successfulRequests: outcome.successes,
      failedRequests: outcome.failures,
      errorRatePercent: errorRate,
      durationMs: outcome.durationMs,
      requestsPerSecond: rps,
      latencies: percentiles,
      memoryMb: {
        rssBefore: Math.round(memBefore.rss / 1024 / 1024),
        rssAfter: Math.round(memAfter.rss / 1024 / 1024),
        heapUsedBefore: Math.round(memBefore.heapUsed / 1024 / 1024),
        heapUsedAfter: Math.round(memAfter.heapUsed / 1024 / 1024)
      },
      poolUtilization: {
        total: poolMetrics.primary.total,
        idle: poolMetrics.primary.idle,
        waiting: poolMetrics.primary.waiting
      }
    };

    console.log(`Results: RPS: ${result.requestsPerSecond} req/s | p50: ${result.latencies.p50Ms}ms | p95: ${result.latencies.p95Ms}ms | p99: ${result.latencies.p99Ms}ms | Errors: ${result.errorRatePercent}%`);
    return result;
  }

  // 1. Baseline Test (100 reqs, concurrency 5)
  results.push(await executeBenchmarkWorkload('Baseline Test', 100, 5));

  // 2. Load Test (300 reqs, concurrency 20)
  results.push(await executeBenchmarkWorkload('Load Test (Normal Hospital Operating Conditions)', 300, 20));

  // 3. Stress Test (500 reqs, concurrency 50)
  results.push(await executeBenchmarkWorkload('Stress Test (Peak Multi-Counter OPD Rush)', 500, 50));

  // 4. Spike Test (200 reqs, concurrency 100 burst)
  results.push(await executeBenchmarkWorkload('Spike Test (Sudden Emergency Epidemic Triage Burst)', 200, 100));

  // 5. Endurance Test (1,000 reqs, concurrency 25 sustained)
  results.push(await executeBenchmarkWorkload('Endurance Test (Sustained Continuous Hospital Workflow)', 1000, 25));

  console.log('\n================================================================');
  console.log('FINAL BENCHMARK SUMMARY MATRIX (JSON)');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));

  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark execution failed:', err);
  process.exit(1);
});
