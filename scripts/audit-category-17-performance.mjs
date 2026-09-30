import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { performance } from 'node:perf_hooks';
import { signJwt } from '../packages/auth/dist/index.js';

const ROOT_DIR = 'D:/DOC SEARCH';
const REPORT_DIR = path.join(ROOT_DIR, 'reports', 'performance');

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const API_BASE = 'http://127.0.0.1:4000';
const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';
const JWT_ISSUER = 'docsearch-api';
const JWT_AUDIENCE = 'docsearch-platform';

const pool = new pg.Pool({ connectionString: PG_CONN });

const TENANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BRANCH_ID = '00000000-0000-4000-8000-000000000001';
const DOCTOR_ID = '00000000-0000-4000-8000-000000000031';
const ADMIN_ID = '00000000-0000-4000-8000-000000000099';

function createToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt(
    {
      sub: overrides.sub || DOCTOR_ID,
      email: overrides.email || 'doctor@apollo.org',
      tenantId: overrides.tenantId || TENANT_ID,
      organizationId: overrides.organizationId || TENANT_ID,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || ['*'],
      isSuperAdmin: overrides.isSuperAdmin || false,
      dataScope: overrides.dataScope || (overrides.isSuperAdmin ? 'global' : 'tenant'),
      iat: now,
      exp: now + 3600,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      ...overrides
    },
    { secret: JWT_SECRET }
  );
}

const BRANCH_A = BRANCH_ID;

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, p50: 0, p75: 0, p95: 0, p99: 0, max: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const getP = (p) => {
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return Number(sorted[idx].toFixed(2));
  };
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: Number(sorted[0].toFixed(2)),
    p50: getP(50),
    p75: getP(75),
    p95: getP(95),
    p99: getP(99),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
    avg: Number((sum / sorted.length).toFixed(2))
  };
}

async function measureEndpoint(name, url, options, iterations = 20) {
  process.stdout.write(`  Benchmarking ${name} (${iterations} requests) ... `);
  const latencies = [];
  let payloadBytes = 0;
  let status = 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url, options);
      status = res.status;
      const text = await res.text();
      payloadBytes = Buffer.byteLength(text, 'utf8');
      const elapsed = performance.now() - start;
      latencies.push(elapsed);
    } catch (err) {
      // Record failure as timeout
      latencies.push(5000);
    }
  }

  const p = calculatePercentiles(latencies);
  console.log(`P50: ${p.p50}ms | P95: ${p.p95}ms | Avg: ${p.avg}ms [size: ${payloadBytes}B, status: ${status}]`);

  return {
    name,
    url,
    method: options.method || 'GET',
    iterations,
    status,
    payloadBytes,
    ...p
  };
}

async function runAudit() {
  console.log('=== STARTING CATEGORY 17 PERFORMANCE BASELINE AUDIT ===\n');

  const doctorToken = createToken({ sub: DOCTOR_ID, tenantId: TENANT_ID, roles: ['DOCTOR'] });
  const adminToken = createToken({ sub: ADMIN_ID, isSuperAdmin: true, roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] });

  // -------------------------------------------------------------------------
  // 1. Database Index & Query Profiling (PostgreSQL 18.4)
  // -------------------------------------------------------------------------
  console.log('[1/7] Profiling PostgreSQL Database Indexes & Query Execution Plans...');
  let dbStats = { totalIndexes: 0, missingIndexCandidates: [] };

  try {
    const idxRes = await pool.query(`
      SELECT count(*)::int as count FROM pg_indexes WHERE schemaname IN ('clinical', 'company', 'core', 'public');
    `);
    dbStats.totalIndexes = idxRes.rows[0].count;

    // Check query execution plans on core business queries
    const client = await pool.connect();
    try {
      // 1. Patients query plan
      const planRes = await client.query(`
        EXPLAIN (FORMAT JSON) 
        SELECT id, first_name, last_name, uhid, tenant_id, created_at 
        FROM clinical.patients 
        WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' 
        ORDER BY created_at DESC 
        LIMIT 50;
      `);
      dbStats.patientQueryPlan = planRes.rows[0]['QUERY PLAN'][0];

      // 2. Encounters query plan
      const encPlanRes = await client.query(`
        EXPLAIN (FORMAT JSON) 
        SELECT id, patient_id, status, tenant_id, created_at 
        FROM clinical.encounters 
        WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' 
        ORDER BY created_at DESC 
        LIMIT 50;
      `);
      dbStats.encounterQueryPlan = encPlanRes.rows[0]['QUERY PLAN'][0];

      // 3. Audit events query plan
      const auditPlanRes = await client.query(`
        EXPLAIN (FORMAT JSON) 
        SELECT id, event_type, tenant_id, created_at 
        FROM core.audit_events 
        WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' 
        ORDER BY created_at DESC 
        LIMIT 50;
      `);
      dbStats.auditPlan = auditPlanRes.rows[0]['QUERY PLAN'][0];

    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('  DB Explain warning:', err.message);
  }
  console.log(`  Discovered ${dbStats.totalIndexes} active indexes across clinical, company, core schemas.`);

  // -------------------------------------------------------------------------
  // 2. N+1 Query & Inefficient Loop Code Audit
  // -------------------------------------------------------------------------
  console.log('[2/7] Auditing Repositories for N+1 Query & Inefficient Loops...');
  const repoDir = path.join(ROOT_DIR, 'apps/api-gateway/src/repositories');
  const repoFiles = [];
  function collectRepoFiles(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collectRepoFiles(full);
      else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        repoFiles.push(full);
      }
    }
  }
  collectRepoFiles(repoDir);

  const nPlusOneFindings = [];
  const loopRegex = /(?:for\s*\([^)]+\)|for\s+await\s*\([^)]+\)|\.map\s*\(\s*async|\.forEach\s*\(\s*async)[\s\S]*?(?:db\.select|await\s+db\.|await\s+this\.)/g;

  for (const fpath of repoFiles) {
    const content = fs.readFileSync(fpath, 'utf8');
    const rel = path.relative(ROOT_DIR, fpath).replace(/\\/g, '/');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for Promise.all map with db query
      if (line.includes('.map(async') || line.includes('for (') || line.includes('for await (')) {
        // check next 10 lines for db query
        const chunk = lines.slice(i, i + 12).join('\n');
        if (chunk.includes('db.select') || chunk.includes('tx.select') || chunk.includes('await this.get') || chunk.includes('await this.find')) {
          nPlusOneFindings.push({
            file: rel,
            line: i + 1,
            snippet: line.trim()
          });
        }
      }
    }
  }
  console.log(`  Identified ${nPlusOneFindings.length} potential N+1 query patterns in repositories.`);

  // -------------------------------------------------------------------------
  // 3. Frontend Bundle & Asset Size Audit
  // -------------------------------------------------------------------------
  console.log('[3/7] Auditing Frontend Application Bundle Sizes...');
  const bundleStats = [];
  const apps = [
    { name: 'partner-platform', dir: path.join(ROOT_DIR, 'apps/partner-platform/dist') },
    { name: 'company-platform', dir: path.join(ROOT_DIR, 'apps/company-platform/dist') },
    { name: 'landing-page', dir: path.join(ROOT_DIR, 'apps/landing-page/dist') }
  ];

  for (const app of apps) {
    if (fs.existsSync(app.dir)) {
      let totalBytes = 0;
      let jsBytes = 0;
      let cssBytes = 0;
      let fileCount = 0;
      let largestFile = { name: '', size: 0 };

      function walkDist(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walkDist(full);
          else if (entry.isFile()) {
            const sz = fs.statSync(full).size;
            totalBytes += sz;
            fileCount++;
            if (entry.name.endsWith('.js')) jsBytes += sz;
            if (entry.name.endsWith('.css')) cssBytes += sz;
            if (sz > largestFile.size) {
              largestFile = { name: entry.name, size: sz };
            }
          }
        }
      }
      walkDist(app.dir);

      bundleStats.push({
        app: app.name,
        totalKb: Number((totalBytes / 1024).toFixed(1)),
        jsKb: Number((jsBytes / 1024).toFixed(1)),
        cssKb: Number((cssBytes / 1024).toFixed(1)),
        fileCount,
        largestFile: { name: largestFile.name, sizeKb: Number((largestFile.size / 1024).toFixed(1)) }
      });
    } else {
      bundleStats.push({ app: app.name, status: 'NOT_BUILT' });
    }
  }
  console.log(`  Bundle audit: ${bundleStats.map(b => `${b.app} (${b.totalKb || 0} KB)`).join(', ')}`);

  // -------------------------------------------------------------------------
  // 4. Live API Latency Benchmarking (Core Endpoints)
  // -------------------------------------------------------------------------
  console.log('[4/7] Benchmarking Live API Endpoint Latencies (P50, P75, P95, P99)...');
  const apiBenchmarks = [];

  const endpointsToBenchmark = [
    { name: 'Health Check', url: `${API_BASE}/api/v1/health`, opts: {} },
    { name: 'Auth Session (/me)', url: `${API_BASE}/api/v1/auth/me`, opts: { headers: { 'Authorization': `Bearer ${doctorToken}` } } },
    { name: 'Patients List', url: `${API_BASE}/api/v1/partner/clinical/patients`, opts: { headers: { 'Authorization': `Bearer ${doctorToken}` } } },
    { name: 'Patient Search', url: `${API_BASE}/api/v1/partner/clinical/patients?q=Sharma`, opts: { headers: { 'Authorization': `Bearer ${doctorToken}` } } },
    { name: 'Encounters List', url: `${API_BASE}/api/v1/partner/clinical/encounters`, opts: { headers: { 'Authorization': `Bearer ${doctorToken}` } } },
    { name: 'Lab Orders List', url: `${API_BASE}/api/v1/partner/lab/orders`, opts: { headers: { 'Authorization': `Bearer ${doctorToken}` } } },
    { name: 'Radiology Orders List', url: `${API_BASE}/api/v1/partner/radiology/orders`, opts: { headers: { 'Authorization': `Bearer ${doctorToken}` } } },
    { name: 'Billing Invoices List', url: `${API_BASE}/api/v1/partner/billing/invoices`, opts: { headers: { 'Authorization': `Bearer ${doctorToken}` } } },
    { name: 'Pharmacy Inventory List', url: `${API_BASE}/api/v1/partner/pharmacy/inventory`, opts: { headers: { 'Authorization': `Bearer ${doctorToken}` } } },
    { name: 'HQ Command Center Overview', url: `${API_BASE}/api/v1/hq/command-center/overview`, opts: { headers: { 'Authorization': `Bearer ${adminToken}` } } }
  ];

  for (const ep of endpointsToBenchmark) {
    const res = await measureEndpoint(ep.name, ep.url, ep.opts, 25);
    apiBenchmarks.push(res);
  }

  // -------------------------------------------------------------------------
  // 5. Concurrency & Throughput Benchmark
  // -------------------------------------------------------------------------
  console.log('[5/7] Executing Concurrency & Throughput Test (2, 5, 10 concurrent clients)...');
  const concurrencyLevels = [2, 5, 10];
  const concurrencyResults = [];

  for (const concurrency of concurrencyLevels) {
    const totalRequests = concurrency * 10; // e.g. 20, 50, 100
    process.stdout.write(`  Concurrency level ${concurrency} (${totalRequests} total requests) ... `);

    const start = performance.now();
    const latencies = [];
    let errors = 0;

    async function worker(count) {
      for (let i = 0; i < count; i++) {
        const reqStart = performance.now();
        try {
          const res = await fetch(`${API_BASE}/api/v1/partner/clinical/patients`, {
            headers: { 'Authorization': `Bearer ${doctorToken}` }
          });
          if (res.status !== 200) errors++;
          latencies.push(performance.now() - reqStart);
        } catch {
          errors++;
          latencies.push(5000);
        }
      }
    }

    const workers = [];
    for (let c = 0; c < concurrency; c++) {
      workers.push(worker(10));
    }
    await Promise.all(workers);

    const totalDurationMs = performance.now() - start;
    const rps = Number(((totalRequests / totalDurationMs) * 1000).toFixed(1));
    const p = calculatePercentiles(latencies);

    console.log(`Throughput: ${rps} RPS | P50: ${p.p50}ms | P95: ${p.p95}ms | Errors: ${errors}`);
    concurrencyResults.push({
      concurrency,
      totalRequests,
      totalDurationMs: Number(totalDurationMs.toFixed(1)),
      rps,
      errors,
      ...p
    });
  }

  // -------------------------------------------------------------------------
  // 6. Memory & Resource Measurement
  // -------------------------------------------------------------------------
  console.log('[6/7] Profiling Node.js Memory & Resource Utilization...');
  const mem = process.memoryUsage();
  const resourceStats = {
    rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
    heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
    heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
    externalMb: Number((mem.external / 1024 / 1024).toFixed(2)),
    activeConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingConnections: pool.waitingCount
  };
  console.log(`  Memory: RSS=${resourceStats.rssMb}MB, HeapUsed=${resourceStats.heapUsedMb}MB | Pool: total=${pool.totalCount}, idle=${pool.idleCount}`);

  // -------------------------------------------------------------------------
  // 7. Write Baseline Reports
  // -------------------------------------------------------------------------
  console.log('\n[7/7] Compiling Baseline Performance Reports...');
  const baseline = {
    timestamp: new Date().toISOString(),
    runtime: {
      apiGatewayPort: 4000,
      database: 'PostgreSQL 18.4',
      databasePort: 5432
    },
    resourceStats,
    dbStats: {
      totalIndexes: dbStats.totalIndexes,
      patientQueryCost: dbStats.patientQueryPlan?.Plan?.['Total Cost'] || 'N/A',
      patientNodeType: dbStats.patientQueryPlan?.Plan?.['Node Type'] || 'N/A',
      encounterQueryCost: dbStats.encounterQueryPlan?.Plan?.['Total Cost'] || 'N/A',
      encounterNodeType: dbStats.encounterQueryPlan?.Plan?.['Node Type'] || 'N/A'
    },
    nPlusOneCount: nPlusOneFindings.length,
    nPlusOneFindings: nPlusOneFindings.slice(0, 15),
    bundleStats,
    apiBenchmarks,
    concurrencyResults
  };

  fs.writeFileSync(path.join(REPORT_DIR, 'baseline.json'), JSON.stringify(baseline, null, 2), 'utf8');

  const baselineMd = `# Category 17: Performance Baseline Audit Report
Generated: ${new Date().toISOString()}

## 1. Executive Summary
- **API Gateway Target**: \`http://127.0.0.1:4000\`
- **Database Engine**: PostgreSQL 18.4 on \`127.0.0.1:5432\`
- **Database Indexes Active**: ${dbStats.totalIndexes}
- **N+1 Query Suspects in Repositories**: ${nPlusOneFindings.length}
- **Peak API Throughput Measured**: ${Math.max(...concurrencyResults.map(c => c.rps))} RPS (at concurrency = 10)
- **Node.js Memory Utilization**: RSS = ${resourceStats.rssMb} MB, Heap Used = ${resourceStats.heapUsedMb} MB

## 2. Core API Endpoint Latency Baseline (25 iterations each)
| Endpoint | Method | Status | Payload (Bytes) | P50 (ms) | P75 (ms) | P95 (ms) | P99 (ms) | Avg (ms) |
|---|---|---|---|---|---|---|---|---|
${apiBenchmarks.map(b => `| ${b.name} | \`${b.method}\` | ${b.status} | ${b.payloadBytes} | ${b.p50} | ${b.p75} | ${b.p95} | ${b.p99} | ${b.avg} |`).join('\n')}

## 3. Concurrency & Throughput Scaling Matrix
| Concurrent Users | Total Requests | Total Time (ms) | Throughput (RPS) | P50 (ms) | P95 (ms) | Error Count |
|---|---|---|---|---|---|---|
${concurrencyResults.map(c => `| ${c.concurrency} | ${c.totalRequests} | ${c.totalDurationMs} | **${c.rps}** | ${c.p50} | ${c.p95} | ${c.errors} |`).join('\n')}

## 4. Frontend Production Bundle Sizes
| Application | Total (KB) | JS (KB) | CSS (KB) | Files | Largest Chunk |
|---|---|---|---|---|---|
${bundleStats.map(b => `| ${b.app} | ${b.totalKb || 'N/A'} | ${b.jsKb || 'N/A'} | ${b.cssKb || 'N/A'} | ${b.fileCount || 0} | ${b.largestFile ? `${b.largestFile.name} (${b.largestFile.sizeKb} KB)` : 'N/A'} |`).join('\n')}

## 5. Potential N+1 Code Patterns in Repositories (Sample)
${nPlusOneFindings.slice(0, 10).map(f => `- \`${f.file}:${f.line}\`: \`${f.snippet}\``).join('\n')}
`;

  fs.writeFileSync(path.join(REPORT_DIR, 'baseline.md'), baselineMd, 'utf8');

  console.log(`=== PERFORMANCE BASELINE COMPLETE ===`);
  console.log(`Saved baseline to:`);
  console.log(`  - ${path.join(REPORT_DIR, 'baseline.json')}`);
  console.log(`  - ${path.join(REPORT_DIR, 'baseline.md')}`);

  await pool.end();
}

runAudit().catch(err => {
  console.error('Performance audit failed:', err);
  process.exit(1);
});
