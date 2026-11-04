import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(f => {
    if (f === 'node_modules' || f === 'dist' || f === '.git' || f === 'build') return;
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results.push(...walk(p));
    else if (p.endsWith('.ts')) results.push(p);
  });
  return results;
}

console.log('=== Deep Inspection of Backend Services & Repositories ===\n');

const serviceFiles = walk('apps/api-gateway/src/services');
const repoFiles = walk('apps/api-gateway/src/repositories');
const routeFiles = walk('apps/api-gateway/src/routes');

const findings = [];

// 1. Check for in-memory Map/Set in services & repositories (violates Authoritative PostgreSQL rule)
[...serviceFiles, ...repoFiles].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = f.replace(/\\/g, '/');
  
  // Look for Maps/Arrays holding business entities
  const mapMatches = content.matchAll(/(private|protected|public|const)\s+([A-Za-z0-9_]+)\s*=\s*new\s+Map<([A-Za-z0-9_,\s]+)>/g);
  for (const m of mapMatches) {
    // Exclude caches with TTL or deduplication sets if purely transient
    const varName = m[2];
    findings.push({
      type: 'IN_MEMORY_STATE',
      file: rel,
      variable: varName,
      declaration: m[0],
      severity: 'HIGH'
    });
  }
});

// 2. Check for missing tenantId in WHERE clauses in repositories
repoFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = f.replace(/\\/g, '/');
  
  // Find db.update and db.delete calls
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if ((l.includes('.update(') || l.includes('.delete(')) && !l.includes('//')) {
      // Check surrounding lines (within 10 lines) for tenantId
      const surrounding = lines.slice(idx, idx + 10).join(' ');
      if (!surrounding.includes('tenantId') && !surrounding.includes('withSecurityContext')) {
        findings.push({
          type: 'POTENTIAL_TENANT_LEAK_ON_WRITE',
          file: rel,
          line: idx + 1,
          code: l.trim(),
          context: surrounding.substring(0, 120),
          severity: 'HIGH'
        });
      }
    }
  });
});

// 3. Check for fake success or HTTP 200 on error paths
routeFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = f.replace(/\\/g, '/');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('reply.status(200)') || l.includes('return { success: true')) {
      // Check if inside a catch block
      const prevLines = lines.slice(Math.max(0, idx - 5), idx).join(' ');
      if (prevLines.includes('catch') && !l.includes('fallback: false')) {
        findings.push({
          type: 'FALSE_SUCCESS_IN_CATCH',
          file: rel,
          line: idx + 1,
          code: l.trim(),
          severity: 'CRITICAL'
        });
      }
    }
  });
});

// 4. Check for hardcoded test UUIDs in production queries
[...serviceFiles, ...repoFiles, ...routeFiles].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = f.replace(/\\/g, '/');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('00000000-0000-4000-8000-00000000000') && !l.includes('//') && !l.includes('DEFAULT_SYSTEM_TENANT')) {
      findings.push({
        type: 'HARDCODED_TEST_UUID',
        file: rel,
        line: idx + 1,
        code: l.trim(),
        severity: 'MEDIUM'
      });
    }
  });
});

console.log(`Total Findings: ${findings.length}\n`);

const byType = {};
findings.forEach(f => {
  byType[f.type] = (byType[f.type] || 0) + 1;
});
for (const [t, count] of Object.entries(byType)) {
  console.log(`- ${t}: ${count}`);
}

fs.writeFileSync(
  'reports/backend-logic/deep-scan-findings.json',
  JSON.stringify(findings, null, 2)
);

console.log('\nTop 25 Findings:');
findings.slice(0, 25).forEach((f, i) => {
  console.log(`${i + 1}. [${f.type}] ${f.file}:${f.line || ''} -> ${f.variable || f.code || ''}`);
});
