import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  console.log('================================================================');
  console.log('🔬 STARTING COMPLETE ZERO-TRUST MONOREPO FORENSIC AUDIT');
  console.log('================================================================\n');

  // Step 1: Capture Fastify routes at runtime
  process.env.ALLOW_EMBEDDED_POSTGRES = 'true';
  process.env.NODE_ENV = 'development';
  process.env.SEED_DEMO_FIXTURES = 'false';
  globalThis.__CAPTURED_ROUTES__ = [];
  const { buildApp } = await import('../apps/api-gateway/dist/app.js');
  const app = await buildApp();
  await app.ready();

  const routesTree = app.printRoutes({ commonPrefix: false });
  const lines = routesTree.split('\n');
  const uniqueBackendRoutes = [];
  const seenRouteKeys = new Set();

  for (const line of lines) {
    const match = line.match(/[├└]──\s*(\S+)\s*\(([^)]+)\)/);
    if (match) {
      const routePath = match[1];
      const methods = match[2].split(',').map(m => m.trim().toUpperCase());
      for (const method of methods) {
        const key = `${method} ${routePath}`;
        if (!seenRouteKeys.has(key)) {
          seenRouteKeys.add(key);
          uniqueBackendRoutes.push({ method, url: routePath });
        }
      }
    }
  }
  console.log(`[1] Fastify Registered Routes Captured: ${uniqueBackendRoutes.length}`);
  console.log(`    Unique (Method + URL) Fastify Routes: ${uniqueBackendRoutes.length}`);

  // Step 2: Scan Frontend API Calls
  const frontendCalls = [];
  const frontendDirs = [
    { name: 'partner-platform', dir: path.join(rootDir, 'apps/partner-platform/src') },
    { name: 'company-platform', dir: path.join(rootDir, 'apps/company-platform/src') },
    { name: 'landing-page', dir: path.join(rootDir, 'apps/landing-page/src') }
  ];

  function scanFrontendForApi(dir, appName) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanFrontendForApi(full, appName);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(full, 'utf8');
        const regex = /(?:fetch|apiRequest|apiClient\.(?:get|post|put|delete|patch))\s*(?:<[^>]+>)?\(\s*[`'"]([^`'"]+)[`'"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const rawUrl = match[1];
          if (rawUrl.startsWith('/api') || rawUrl.startsWith('http') || rawUrl.startsWith('/')) {
            const lineNum = content.substring(0, match.index).split('\n').length;
            frontendCalls.push({
              rawUrl,
              app: appName,
              file: path.relative(rootDir, full).replace(/\\/g, '/'),
              line: lineNum
            });
          }
        }
      }
    }
  }

  for (const f of frontendDirs) scanFrontendForApi(f.dir, f.name);
  console.log(`[2] Frontend API Call Sites Scanned: ${frontendCalls.length}`);

  // Step 3: Match Frontend Calls with Real Fastify Routes
  const verifiedCalls = [];
  const mismatchedCalls = [];

  for (const call of frontendCalls) {
    let cleanUrl = call.rawUrl.split('?')[0];
    cleanUrl = cleanUrl.replace(/\$\{q[s]?\}/g, '');
    cleanUrl = cleanUrl.replace(/\$\{[^}]+\}/g, 'PARAM');
    cleanUrl = cleanUrl.replace(/\?$/, '');

    const matched = uniqueBackendRoutes.some(br => {
      // Escape all regex characters in Fastify URL except :param and *
      const patternStr = br.url
        .replace(/[.+?^${}()|[\]\\*]/g, '\\$&')
        .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
        .replace(/\\\*/g, '.*');
      try {
        const reg = new RegExp('^' + patternStr + '$');
        return reg.test(cleanUrl) || reg.test(call.rawUrl.split('?')[0]);
      } catch {
        return false;
      }
    });

    if (matched) {
      verifiedCalls.push(call);
    } else {
      mismatchedCalls.push({
        ...call,
        normalizedUrl: cleanUrl
      });
    }
  }

  console.log(`    Verified Matching Calls: ${verifiedCalls.length}`);
  console.log(`    Unmatched / Mismatched Calls: ${mismatchedCalls.length}`);

  // Step 4: Scan for LocalStorage & SessionStorage Usage
  const storageOps = [];
  function scanStorage(dir, appName) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanStorage(full, appName);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(full, 'utf8');
        const storageRegex = /(?:localStorage|sessionStorage)\.(getItem|setItem|removeItem)\s*\(\s*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = storageRegex.exec(content)) !== null) {
          const op = match[1];
          const key = match[2];
          const lineNum = content.substring(0, match.index).split('\n').length;
          storageOps.push({
            app: appName,
            file: path.relative(rootDir, full).replace(/\\/g, '/'),
            line: lineNum,
            op,
            key
          });
        }
      }
    }
  }

  for (const f of frontendDirs) scanStorage(f.dir, f.name);
  console.log(`[3] Browser Storage Operations Scanned: ${storageOps.length}`);

  // Group storage keys
  const storageKeyCounts = {};
  for (const s of storageOps) {
    storageKeyCounts[s.key] = (storageKeyCounts[s.key] || 0) + 1;
  }

  // Step 5: Database Schema & Persistence Coverage
  const schemaDir = path.join(rootDir, 'packages/database/src/schema');
  const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
  const detectedTables = [];

  for (const sf of schemaFiles) {
    const content = fs.readFileSync(path.join(schemaDir, sf), 'utf8');
    const tableRegex = /(?:pgTable|createTable)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = tableRegex.exec(content)) !== null) {
      detectedTables.push({
        table: match[1],
        schemaFile: sf
      });
    }
  }
  console.log(`[4] Drizzle Schema Tables Defined: ${detectedTables.length}`);

  // Inspect TRACKED_TABLES in embedded-persistence.ts
  const persistenceFile = path.join(rootDir, 'packages/database/src/embedded-persistence.ts');
  let trackedTablesCount = 0;
  const trackedTableNames = [];
  if (fs.existsSync(persistenceFile)) {
    const pContent = fs.readFileSync(persistenceFile, 'utf8');
    const trackedRegex = /['"`]([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)['"`]/g;
    let match;
    while ((match = trackedRegex.exec(pContent)) !== null) {
      trackedTableNames.push(match[1]);
    }
    trackedTablesCount = trackedTableNames.length;
  }
  console.log(`    Tracked Persistence Tables: ${trackedTablesCount}`);

  // Step 6: Write out structured report JSON
  const auditReport = {
    summary: {
      backendRoutesCount: uniqueBackendRoutes.length,
      frontendCallsCount: frontendCalls.length,
      verifiedCallsCount: verifiedCalls.length,
      mismatchedCallsCount: mismatchedCalls.length,
      storageOpsCount: storageOps.length,
      drizzleTablesCount: detectedTables.length,
      trackedTablesCount
    },
    mismatchedCalls,
    storageKeyCounts,
    storageOpsSample: storageOps.slice(0, 50),
    tables: detectedTables
  };

  fs.writeFileSync(
    path.join(rootDir, 'scripts/audit-report-data.json'),
    JSON.stringify(auditReport, null, 2)
  );

  console.log('\n================================================================');
  console.log('📊 AUDIT SUMMARY REPORT SAVED TO scripts/audit-report-data.json');
  console.log('================================================================');

  await app.close();
}

main().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
