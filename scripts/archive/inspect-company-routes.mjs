import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const companyDir = path.join(rootDir, 'apps/api-gateway/src/routes/company');

const files = fs.readdirSync(companyDir).filter(f => f.endsWith('.routes.ts'));
const rows = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(companyDir, file), 'utf8');
  const routeRegex = /(fastify|app)\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`])\s*,\s*(\{[\s\S]*?\}|async|\()/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[2].toUpperCase();
    const routePath = match[3].slice(1, -1);
    const startIdx = match.index;
    const snippet = content.substring(startIdx, Math.min(startIdx + 500, content.length));
    const preMatch = snippet.match(/preHandler\s*:\s*(\[[^\]]*\]|[^,{}]+)/);
    const preHandler = preMatch ? preMatch[1].replace(/\s+/g, ' ').trim() : 'NONE';
    rows.push({
      file,
      method,
      path: routePath,
      preHandler,
      hasAuth: preHandler.includes('authenticate'),
      hasRoleOrPerm: preHandler.includes('requireRoles') || preHandler.includes('requirePermission')
    });
  }
}

console.log(`Total Company Endpoints: ${rows.length}`);
console.log('--- COMPANY ROUTES MISSING ROLE/PERMISSION GUARDS ---');
const unguarded = rows.filter(r => !r.hasRoleOrPerm);
console.log(`Count: ${unguarded.length}`);
for (const u of unguarded) {
  console.log(`${u.method} ${u.path} [${u.file}] -> preHandler: ${u.preHandler}`);
}
