import fs from 'fs';
import path from 'path';

// Extract all fetch/apiRequest/axios paths from frontend
function scanFrontendRoutes(dir, results = new Set()) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist') scanFrontendRoutes(full, results);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.matchAll(/['"`](\/api\/v1\/[a-zA-Z0-9_\-\/]+)['"`]/g);
      for (const m of matches) {
        // Strip trailing IDs or param placeholders
        const route = m[1].replace(/\$\{[^}]+\}/g, ':param');
        results.add({ route, file: full });
      }
    }
  }
  return results;
}

// Extract registered routes from api-gateway
function scanBackendRoutes(dir, results = new Set()) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist') scanBackendRoutes(full, results);
    } else if (f.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      // Matches app.get('/api/v1/...' or fastify.post('/api/v1/...
      const matches = content.matchAll(/(?:app|fastify|router)\.(?:get|post|put|delete|patch)\(\s*['"`](\/api\/v1\/[a-zA-Z0-9_\-\/:]+)['"`]/g);
      for (const m of matches) {
        results.add({ route: m[1], file: full });
      }
    }
  }
  return results;
}

const frontendRoutes = Array.from(scanFrontendRoutes('apps/partner-platform/src')).concat(
  Array.from(scanFrontendRoutes('apps/patient-app/src'))
);
const backendRoutes = Array.from(scanBackendRoutes('apps/api-gateway/src/routes'));

console.log(`Frontend unique route calls: ${frontendRoutes.length}`);
console.log(`Backend declared routes: ${backendRoutes.length}`);

// Normalize helper: replace :param, :id, etc. with generic placeholder
function normalizeRoute(r) {
  return r.replace(/:[a-zA-Z0-9_]+/g, ':param').replace(/\/+$/, '');
}

const backendSet = new Set(backendRoutes.map(b => normalizeRoute(b.route)));

const missingInBackend = [];
for (const fe of frontendRoutes) {
  const norm = normalizeRoute(fe.route);
  if (!backendSet.has(norm)) {
    // Check if partial match or dynamic prefix
    const hasPrefix = backendRoutes.some(b => {
      const bNorm = normalizeRoute(b.route);
      return bNorm.startsWith(norm) || norm.startsWith(bNorm);
    });
    if (!hasPrefix) {
      missingInBackend.push({ route: fe.route, file: path.relative(process.cwd(), fe.file) });
    }
  }
}

console.log(`\nPotential Frontend calls missing in Backend (${missingInBackend.length}):`);
console.log(JSON.stringify(missingInBackend.slice(0, 30), null, 2));
