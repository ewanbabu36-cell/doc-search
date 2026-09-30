import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const routesDir = path.join(rootDir, 'apps/api-gateway/src/routes');

function walk(dir) {
  const items = fs.readdirSync(dir);
  let files = [];
  for (const it of items) {
    const p = path.join(dir, it);
    if (fs.statSync(p).isDirectory()) files = files.concat(walk(p));
    else if (it.endsWith('.routes.ts')) files.push(p);
  }
  return files;
}

const files = walk(routesDir);
const deleteRoutes = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const routeRegex = /(fastify|app)\.(delete)\s*\(\s*(['"`][^'"`]+['"`])\s*,\s*(\{[\s\S]*?\}|async|\()/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const routePath = match[3].slice(1, -1);
    const startIdx = match.index;
    const snippet = content.substring(startIdx, Math.min(startIdx + 500, content.length));
    const preMatch = snippet.match(/preHandler\s*:\s*(\[[^\]]*\]|[^,{}]+)/);
    const preHandler = preMatch ? preMatch[1].replace(/\s+/g, ' ').trim() : 'NONE';
    deleteRoutes.push({
      file: path.relative(rootDir, file).replace(/\\/g, '/'),
      path: routePath,
      preHandler
    });
  }
}

console.log(`Total DELETE routes: ${deleteRoutes.length}`);
for (const d of deleteRoutes) {
  console.log(`DELETE ${d.path} [${d.file}] -> preHandler: ${d.preHandler}`);
}
