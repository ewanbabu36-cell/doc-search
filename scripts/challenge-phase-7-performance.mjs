import http from 'http';
import fs from 'fs';

function timedRequest(path = '/health') {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const req = http.request({
      hostname: '127.0.0.1',
      port: 4000,
      path,
      method: 'GET',
      headers: { 'Connection': 'keep-alive' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1_000_000;
        resolve({ status: res.statusCode, latencyMs, error: null });
      });
    });

    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1_000_000;
      resolve({ status: 500, latencyMs, error: err.message });
    });

    req.end();
  });
}

function calculatePercentiles(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const len = sorted.length;
  const min = sorted[0];
  const max = sorted[len - 1];
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / len;
  const p50 = sorted[Math.floor(len * 0.50)];
  const p95 = sorted[Math.floor(len * 0.95)];
  const p99 = sorted[Math.floor(len * 0.99)];
  return { min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2), p50: p50.toFixed(2), p95: p95.toFixed(2), p99: p99.toFixed(2) };
}

async function runBurst(count, label) {
  console.log(`\n--- Running ${label}: ${count} concurrent requests ---`);
  const memBefore = process.memoryUsage();
  const startTime = Date.now();

  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(timedRequest('/health'));
  }

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;
  const memAfter = process.memoryUsage();

  const errors = results.filter(r => r.status !== 200);
  const latencies = results.map(r => r.latencyMs);
  const stats = calculatePercentiles(latencies);
  const throughputRps = ((count / totalDuration) * 1000).toFixed(1);

  console.log(`Duration: ${totalDuration}ms | Errors: ${errors.length} (${((errors.length / count) * 100).toFixed(1)}%) | Throughput: ${throughputRps} req/sec`);
  console.log(`Latency -> Min: ${stats.min}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms | Max: ${stats.max}ms | Avg: ${stats.avg}ms`);

  return {
    label,
    requestCount: count,
    durationMs: totalDuration,
    throughputRps: parseFloat(throughputRps),
    errorCount: errors.length,
    errorRatePct: (errors.length / count) * 100,
    stats,
    memoryDeltaMB: ((memAfter.heapUsed - memBefore.heapUsed) / (1024 * 1024)).toFixed(2)
  };
}

async function run() {
  console.log('====================================================');
  console.log('🔍 PHASE 7: STATISTICAL PERFORMANCE & CONCURRENCY BENCHMARK');
  console.log('====================================================');

  // Warmup burst
  await runBurst(10, 'Warmup Burst');

  // Burst 1: 50 requests
  const b50 = await runBurst(50, 'Burst 1 (50 Concurrent)');

  // Burst 2: 100 requests
  const b100 = await runBurst(100, 'Burst 2 (100 Concurrent)');

  // Burst 3: Mixed API burst (Reels feed + Health)
  console.log('\n--- Running Mixed Workload Burst (25 Health + 25 Reels) ---');
  const mixedPromises = [];
  const mixedStart = Date.now();
  for (let i = 0; i < 25; i++) {
    mixedPromises.push(timedRequest('/health'));
    mixedPromises.push(timedRequest('/api/v1/reels'));
  }
  const mixedResults = await Promise.all(mixedPromises);
  const mixedDuration = Date.now() - mixedStart;
  const mixedErrors = mixedResults.filter(r => r.status !== 200);
  const mixedStats = calculatePercentiles(mixedResults.map(r => r.latencyMs));
  console.log(`Mixed Duration: ${mixedDuration}ms | Errors: ${mixedErrors.length} | p50: ${mixedStats.p50}ms | p95: ${mixedStats.p95}ms | p99: ${mixedStats.p99}ms`);

  // Recovery Verification
  console.log('\n--- Verifying Gateway Health Recovery Post-Load ---');
  const recoveryProbe = await timedRequest('/health');
  const isRecovered = recoveryProbe.status === 200 && recoveryProbe.latencyMs < 50;
  console.log(`Post-Load Liveness Status: HTTP ${recoveryProbe.status} in ${recoveryProbe.latencyMs.toFixed(2)}ms -> ${isRecovered ? 'HEALTHY & STABLE' : 'DEGRADED'}`);

  const output = {
    burst50: b50,
    burst100: b100,
    mixedWorkload: {
      totalRequests: 50,
      durationMs: mixedDuration,
      errorCount: mixedErrors.length,
      stats: mixedStats
    },
    recoveryProbe: {
      status: recoveryProbe.status,
      latencyMs: recoveryProbe.latencyMs,
      isRecovered
    }
  };

  fs.writeFileSync('scripts/challenge-phase-7-output.json', JSON.stringify(output, null, 2), 'utf8');
  console.log('\n✅ PHASE 7 PERFORMANCE BENCHMARK COMPLETED & SAVED TO scripts/challenge-phase-7-output.json\n');
}

run();
