import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const partnerDir = path.join(rootDir, 'apps/api-gateway/src/routes/partner');

const files = fs.readdirSync(partnerDir).filter(f => f.endsWith('.routes.ts'));
const rows = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(partnerDir, file), 'utf8');
  const routeRegex = /(fastify|app)\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`])\s*,\s*(\{[\s\S]*?\}|async|\()/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[2].toUpperCase();
    const routePath = match[3].slice(1, -1);
    const startIdx = match.index;
    const snippet = content.substring(startIdx, Math.min(startIdx + 600, content.length));
    const preMatch = snippet.match(/preHandler\s*:\s*(\[[^\]]*\]|[^,{}]+)/);
    const preHandler = preMatch ? preMatch[1].replace(/\s+/g, ' ').trim() : 'NONE';
    rows.push({
      file,
      method,
      path: routePath,
      preHandler,
      hasAuth: preHandler.includes('authenticate'),
      hasPerm: preHandler.includes('requirePermission'),
      hasRoles: preHandler.includes('requireRoles')
    });
  }
}

console.log(`Total Partner Endpoints: ${rows.length}`);
console.log('--- PARTNER MUTATIONS (POST/PUT/PATCH/DELETE) MISSING PERMISSION/ROLE GUARDS ---');
const unguardedMutations = rows.filter(r => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method) && !r.hasPerm && !r.hasRoles);
console.log(`Count: ${unguardedMutations.length}`);
for (const u of unguardedMutations) {
  console.log(`${u.method} ${u.path} [${u.file}] -> preHandler: ${u.preHandler}`);
}
