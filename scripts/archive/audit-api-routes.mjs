import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const routeFiles = walk('apps/api-gateway/src/routes').filter(f => f.endsWith('.ts'));

const endpoints = [];
const routePattern = /(?:app|fastify)\.(get|post|put|patch|delete)\s*(?:<[^>]+>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;

for (const file of routeFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = routePattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const endpointPath = match[2];
    const line = content.substring(0, match.index).split('\n').length;
    
    // Check surrounding code for service, repository, db, or mock
    const snippet = content.substring(match.index, Math.min(content.length, match.index + 800));
    const usesService = /Service\./.test(snippet) || /service\./.test(snippet);
    const usesRepo = /Repository\./.test(snippet) || /repository\./.test(snippet);
    const usesDb = /db\./.test(snippet) || /client\./.test(snippet);
    const hasMock = /mock|demo|sample|fallback/i.test(snippet);
    const hasAuth = /authenticate|authGuard|withSecurityContext|requirePermission|requireFeature/.test(snippet);

    endpoints.push({
      file: file.replace(/\\/g, '/'),
      line,
      method,
      endpointPath,
      usesService,
      usesRepo,
      usesDb,
      hasMock,
      hasAuth
    });
  }
}

console.log(`Total Endpoints Discovered: ${endpoints.length}`);
const withMock = endpoints.filter(e => e.hasMock);
console.log(`Endpoints with mock/demo references in route: ${withMock.length}`);
fs.writeFileSync('scripts/audit-endpoints.json', JSON.stringify(endpoints, null, 2));
console.log('Saved to scripts/audit-endpoints.json');
