import { buildApp } from '../apps/api-gateway/dist/app.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runAuthoritativeAudit() {
  console.log('=== STEP 1: INITIALIZING API GATEWAY TO EXTRACT AUTHORITATIVE ROUTE TREE ===');
  const app = await buildApp();
  await app.ready();

  const registeredRoutes = [];

  // Fastify route traversal
  function traverseRoutes(routesMap) {
    // fastify does not expose a flat array directly, but app.printRoutes({ commonPrefix: false }) prints all routes
    // Or we can parse printRoutes output
  }

  const routesTree = app.printRoutes({ commonPrefix: false });
  const lines = routesTree.split('\n');
  const parsedRoutes = [];

  for (const line of lines) {
    // printRoutes format: "├── /path (GET, POST)" or "└── /path (GET)"
    const match = line.match(/[├└]──\s*(\S+)\s*\(([^)]+)\)/);
    if (match) {
      const routePath = match[1];
      const methods = match[2].split(',').map(m => m.trim().toUpperCase());
      for (const method of methods) {
        parsedRoutes.push({ method, path: routePath });
      }
    }
  }

  console.log(`Authoritative Fastify Registered Routes: ${parsedRoutes.length}`);

  // Save to file for inspection
  fs.writeFileSync(
    path.join(rootDir, 'scripts/authoritative-routes.json'),
    JSON.stringify(parsedRoutes, null, 2)
  );

  console.log('=== STEP 2: SCANNING FRONTEND API CALLS ===');
  const frontendCalls = [];
  const frontendDirs = [
    { name: 'partner-platform', dir: path.join(rootDir, 'apps/partner-platform/src') },
    { name: 'company-platform', dir: path.join(rootDir, 'apps/company-platform/src') },
    { name: 'landing-page', dir: path.join(rootDir, 'apps/landing-page/src') }
  ];

  function scanDir(dir, appName) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full, appName);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(full, 'utf8');
        // Match fetch, apiRequest, apiClient calls
        const regex = /(?:fetch|apiRequest|apiClient\.(?:get|post|put|delete|patch))\s*(?:<[^>]+>)?\(\s*[`'"]([^`'"]+)[`'"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const rawUrl = match[1];
          if (rawUrl.startsWith('/api') || rawUrl.startsWith('http') || rawUrl.startsWith('/')) {
            const lineNum = content.substring(0, match.index).split('\n').length;
            frontendCalls.push({
              rawUrl,
              app: appName,
              file: path.relative(rootDir, full),
              line: lineNum
            });
          }
        }
      }
    }
  }

  for (const f of frontendDirs) {
    scanDir(f.dir, f.name);
  }

  console.log(`Total Frontend API Calls found: ${frontendCalls.length}`);

  console.log('=== STEP 3: MATCHING FRONTEND CALLS TO AUTHORITATIVE ROUTES ===');
  const brokenCalls = [];
  const verifiedCalls = [];

  for (const call of frontendCalls) {
    let cleanUrl = call.rawUrl.split('?')[0];
    // Replace template interpolation like ${id}, ${patient.id}, ${qs}
    // If template variable is at the end and preceded by catalog/orders/etc with no slash, e.g. /catalog${qs}
    cleanUrl = cleanUrl.replace(/\$\{q[s]?\}/g, '');
    cleanUrl = cleanUrl.replace(/\$\{[^}]+\}/g, 'PARAM');

    // Remove any trailing empty query string artifacts
    cleanUrl = cleanUrl.replace(/\?$/, '');

    // Now test against registered routes
    const matched = parsedRoutes.some(r => {
      try {
        let rPattern = r.path
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex specials except :param
          .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
          .replace(/\\\*/g, '.*');
        const reg = new RegExp('^' + rPattern + '$');
        return reg.test(cleanUrl) || reg.test(call.rawUrl.split('?')[0]);
      } catch (e) {
        return false;
      }
    });

    if (matched) {
      verifiedCalls.push(call);
    } else {
      brokenCalls.push({ ...call, normalizedUrl: cleanUrl });
    }
  }

  console.log(`Verified Working Frontend Calls: ${verifiedCalls.length}`);
  console.log(`Unmatched / Potential Broken Frontend Calls: ${brokenCalls.length}`);

  // Deduplicate and group broken calls
  const groupedBroken = {};
  for (const b of brokenCalls) {
    const key = `${b.file} -> ${b.rawUrl}`;
    if (!groupedBroken[key]) {
      groupedBroken[key] = b;
    }
  }

  console.log('\n=== REAL UNMATCHED FRONTEND ENDPOINTS ===');
  for (const b of Object.values(groupedBroken)) {
    console.log(`[${b.app}] ${b.file}:${b.line} -> ${b.rawUrl} (normalized: ${b.normalizedUrl})`);
  }

  await app.close();
}

runAuthoritativeAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
