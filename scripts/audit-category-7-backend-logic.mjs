import fs from 'fs';
import path from 'path';

function walk(dir, exts = ['.ts', '.js']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(f => {
    if (f === 'node_modules' || f === 'dist' || f === '.git' || f === 'build') return;
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results.push(...walk(p, exts));
    else if (exts.some(ext => p.endsWith(ext))) results.push(p);
  });
  return results;
}

console.log('========================================================================');
console.log('DOC SEARCH — CATEGORY 7: BACKEND LOGIC DISCOVERY & BASELINE AUDIT');
console.log('========================================================================\n');

// 1. Routes Audit
const routeFiles = walk('apps/api-gateway/src/routes');
console.log(`Found ${routeFiles.length} backend route files in apps/api-gateway/src/routes.`);

const routes = [];
routeFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative('.', f).replace(/\\/g, '/');
  
  // Extract fastify route registrations
  const routeRegex = /(?:fastify|app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]([\s\S]*?)(?:async\s*)?\(/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const optionsBlock = match[3] || '';
    
    // Check middleware and guards
    const hasAuth = optionsBlock.includes('authenticate');
    const hasPermission = optionsBlock.includes('requirePermission');
    const hasCommercial = optionsBlock.includes('requireModuleCommercialAccess') || content.includes('requireModuleCommercialAccess');
    const hasIdempotency = optionsBlock.includes('enforceIdempotency');
    
    routes.push({
      method,
      path: routePath,
      file: relPath,
      hasAuth,
      hasPermission,
      hasCommercial,
      hasIdempotency
    });
  }
});
console.log(`Extracted ${routes.length} route endpoints.`);

// 2. Services Audit
const serviceFiles = walk('apps/api-gateway/src/services');
console.log(`Found ${serviceFiles.length} backend service files in apps/api-gateway/src/services.`);

const services = [];
serviceFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative('.', f).replace(/\\/g, '/');
  
  // Find class declaration or exported service
  const classMatch = content.match(/export\s+class\s+([A-Za-z0-9_]+)/);
  const serviceName = classMatch ? classMatch[1] : path.basename(f, path.extname(f));
  
  // Check transaction usage
  const hasTransactions = content.includes('.transaction(') || content.includes('withSecurityContext(');
  // Check mock/fallback patterns
  const hasMockFallback = content.includes('mock') || content.includes('fallback') || content.includes('MOCK_');
  // Check in-memory maps/sets
  const hasInMemoryState = content.includes('new Map(') || content.includes('new Set(');
  
  services.push({
    name: serviceName,
    file: relPath,
    hasTransactions,
    hasMockFallback,
    hasInMemoryState
  });
});

// 3. Repositories Audit
const repoFiles = walk('apps/api-gateway/src/repositories');
console.log(`Found ${repoFiles.length} backend repository files in apps/api-gateway/src/repositories.`);

const repositories = [];
repoFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative('.', f).replace(/\\/g, '/');
  
  const classMatch = content.match(/export\s+class\s+([A-Za-z0-9_]+)/);
  const repoName = classMatch ? classMatch[1] : path.basename(f, path.extname(f));
  
  const usesDb = content.includes('getDatabase()') || content.includes('this.db');
  const usesTransactions = content.includes('.transaction(');
  const usesTenantFilter = content.includes('eq(') && (content.includes('tenantId') || content.includes('.tenantId'));
  
  repositories.push({
    name: repoName,
    file: relPath,
    usesDb,
    usesTransactions,
    usesTenantFilter
  });
});

// 4. Database Schema Audit
const schemaFiles = walk('packages/database/src/schema');
console.log(`Found ${schemaFiles.length} database schema files in packages/database/src/schema.`);

const tables = [];
schemaFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative('.', f).replace(/\\/g, '/');
  
  const tableRegex = /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:pgTable|createTable|[A-Za-z0-9_]+Schema\.table)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = tableRegex.exec(content)) !== null) {
    tables.push({
      variable: m[1],
      tableName: m[2],
      file: relPath
    });
  }
});
console.log(`Extracted ${tables.length} database table definitions.`);

// 5. Code Scanning for Logic Smells (Taxonomy A - O)
console.log('Auditing codebase for Category 7 Backend Logic Smells...');
const logicSmells = [];

function checkSmells(filePath, content) {
  const lines = content.split('\n');
  const rel = filePath.replace(/\\/g, '/');
  
  lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    const trimmed = l.trim();
    
    // Smell 1: Silent catch blocks
    if (trimmed.match(/catch\s*\([^)]*\)\s*\{\s*\}/) || trimmed.match(/catch\s*\{\s*\}/)) {
      logicSmells.push({
        category: 'N. Incorrect error-path logic',
        smell: 'Silent catch block swallowing exceptions',
        file: rel,
        line: lineNum,
        code: trimmed
      });
    }
    
    // Smell 2: In-memory Map/Set for operational state
    if (trimmed.includes('new Map<') && !rel.includes('test') && !rel.includes('cache')) {
      logicSmells.push({
        category: 'D. Incorrect database logic',
        smell: 'In-memory Map used for operational state instead of PostgreSQL',
        file: rel,
        line: lineNum,
        code: trimmed
      });
    }

    // Smell 3: Hardcoded test/bypass IDs
    if (trimmed.includes('00000000-0000-4000-8000-00000000000') && !rel.includes('test') && !rel.includes('seed')) {
      logicSmells.push({
        category: 'H. Incorrect tenant isolation',
        smell: 'Hardcoded UUID / seed facility alias in production code',
        file: rel,
        line: lineNum,
        code: trimmed
      });
    }

    // Smell 4: Mock fallback return in services
    if ((trimmed.includes('return mock') || trimmed.includes('return [...mock') || trimmed.includes('return MOCK_')) && !rel.includes('test')) {
      logicSmells.push({
        category: 'O. Mock/fallback business logic',
        smell: 'Service returning mock data in runtime business logic',
        file: rel,
        line: lineNum,
        code: trimmed
      });
    }
  });
}

const allBackendFiles = [
  ...walk('apps/api-gateway/src'),
  ...walk('packages/database/src'),
  ...walk('packages/auth/src')
];

allBackendFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  checkSmells(f, content);
});

console.log(`Identified ${logicSmells.length} potential backend logic smell touchpoints.`);

// Prepare baseline directory
fs.mkdirSync('reports/backend-logic', { recursive: true });

const baselineData = {
  timestamp: new Date().toISOString(),
  environment: 'Native PostgreSQL 18.4 (Port 5432), Fastify API Gateway (Port 4000)',
  monorepo: {
    routeFilesCount: routeFiles.length,
    routesCount: routes.length,
    serviceFilesCount: serviceFiles.length,
    servicesCount: services.length,
    repositoryFilesCount: repoFiles.length,
    repositoriesCount: repositories.length,
    schemaFilesCount: schemaFiles.length,
    tablesCount: tables.length,
    scannedBackendFiles: allBackendFiles.length
  },
  routes,
  services,
  repositories,
  tables,
  logicSmells
};

fs.writeFileSync(
  'reports/backend-logic/baseline.json',
  JSON.stringify(baselineData, null, 2)
);

let md = `# DOC SEARCH — CATEGORY 7: BACKEND LOGIC BASELINE AUDIT REPORT

**Audit Date**: ${baselineData.timestamp}  
**Environment**: ${baselineData.environment}  
**Standard**: Zero-Trust / Production-Grade / Scope-Frozen / Native PostgreSQL 18.4

---

## 1. Monorepo Backend Inventory

| Component Layer | Scanned Files | Discovered Entities |
|---|---|---|
| **API Gateway Routes** | ${baselineData.monorepo.routeFilesCount} files | ${baselineData.monorepo.routesCount} registered endpoints |
| **Backend Services** | ${baselineData.monorepo.serviceFilesCount} files | ${baselineData.monorepo.servicesCount} service classes/instances |
| **Backend Repositories** | ${baselineData.monorepo.repositoryFilesCount} files | ${baselineData.monorepo.repositoriesCount} repository modules |
| **Database Schema** | ${baselineData.monorepo.schemaFilesCount} files | ${baselineData.monorepo.tablesCount} PostgreSQL tables |
| **Total Backend Source Files** | ${baselineData.monorepo.scannedBackendFiles} files | Full execution graph covered |

---

## 2. Route Security & Guard Summary
- Total Endpoints: ${routes.length}
- Endpoints with Explicit Authenticate Hook: ${routes.filter(r => r.hasAuth).length}
- Endpoints with Permission Authorization Guard: ${routes.filter(r => r.hasPermission).length}
- Endpoints with Commercial Module Access Guard: ${routes.filter(r => r.hasCommercial).length}
- Endpoints with Idempotency Middleware: ${routes.filter(r => r.hasIdempotency).length}

---

## 3. Discovered Logic Smells & Suspicious Patterns (Taxonomy A - O)
Total Suspicious Touchpoints: **${logicSmells.length}**

| Category | Smell Description | Location | Code Snippet |
|---|---|---|---|
${logicSmells.slice(0, 50).map(s => `| ${s.category} | ${s.smell} | \`${s.file}:${s.line}\` | \`${s.code.replace(/\|/g, '/')}\` |`).join('\n')}

*(Showing first 50 logic smells out of ${logicSmells.length}. Full list available in reports/backend-logic/baseline.json)*
`;

fs.writeFileSync('reports/backend-logic/baseline.md', md);
console.log('Saved baseline reports to reports/backend-logic/baseline.json & baseline.md');
