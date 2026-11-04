import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir) {
  let res = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) res = res.concat(getFiles(full));
    else if (item.name.endsWith('.ts')) res.push(full);
  }
  return res;
}

const files = getFiles('apps/api-gateway/src/routes');
const unguardedRoutes = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Look for fastify.(get|post|put|delete|patch)
  const regex = /fastify\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]([\s\S]*?)(?:async|\basync\b|\(request)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routeUrl = match[2];
    const middle = match[3];

    // Check if routeUrl is public by design:
    const isPublic = 
      routeUrl.startsWith('/health') ||
      routeUrl.startsWith('/api/health') ||
      routeUrl.startsWith('/api/v1/health') ||
      routeUrl.includes('/login') ||
      routeUrl.includes('/register') ||
      routeUrl.includes('/refresh') ||
      routeUrl.includes('/forgot-password') ||
      routeUrl.includes('/reset-password') ||
      routeUrl.includes('/plans') && !routeUrl.includes('/company/') && !routeUrl.includes('/admin/') ||
      routeUrl.includes('/webhooks/');

    const hasAuth = middle.includes('authenticate') || middle.includes('optionalAuthenticate');
    const hasPerm = middle.includes('requirePermission');

    if (!hasAuth && !isPublic) {
      unguardedRoutes.push({
        method,
        url: routeUrl,
        file: path.relative('apps/api-gateway/src/routes', file).replace(/\\/g, '/'),
        hasPerm
      });
    }
  }
}

console.log('Total Potential Unguarded Routes:', unguardedRoutes.length);
unguardedRoutes.forEach(r => {
  console.log(`[${r.method}] ${r.url} (${r.file})`);
});
