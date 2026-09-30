import fs from 'node:fs';
import path from 'node:path';

const routesDir = 'D:/DOC SEARCH/apps/api-gateway/src/routes';
const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) walk(full);
    else if (f.name.endsWith('.routes.ts')) files.push(full);
  }
}
walk(routesDir);

const unguardedRoutes = [];
const publicPrefixes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/launch-offer',
  '/api/v1/auth/registration-form-config',
  '/api/v1/auth/self-registered-partners',
  '/api/v1/auth/refresh',
  '/api/v1/auth/quick-session',
  '/api/v1/health',
  '/health',
  '/healthz',
  '/webhooks/'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(routesDir, file).replace(/\\/g, '/');

  // Check file-level hooks
  const hasFileLevelAuth = /fastify\.addHook\s*\(\s*['"]preHandler['"]\s*,\s*(?:authenticate|authGuard)/.test(content);

  const routeRegex = /fastify\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const url = match[2];
    const isPublic = publicPrefixes.some(p => url.startsWith(p) || url.includes('/webhooks/'));
    if (isPublic || hasFileLevelAuth) continue;

    // Check surrounding route options block (up to 400 chars after url)
    const afterIdx = match.index + match[0].length;
    const snippet = content.slice(afterIdx, afterIdx + 400);

    const hasGuard = 
      snippet.includes('authenticate') || 
      snippet.includes('hqAdminGuard') || 
      snippet.includes('partnerAdminGuard') ||
      snippet.includes('requireRoles') ||
      snippet.includes('requirePermissions') ||
      snippet.includes('preHandler') ||
      snippet.includes('optionalAuthenticate');

    if (!hasGuard) {
      unguardedRoutes.push({ file: rel, method, url, snippet: snippet.slice(0, 100).replace(/\s+/g, ' ') });
    }
  }
}

console.log('Total genuinely unguarded routes found:', unguardedRoutes.length);
unguardedRoutes.forEach(r => console.log(` - [${r.method}] ${r.url} (${r.file}) -> ${r.snippet}`));
