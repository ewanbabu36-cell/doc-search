import fs from 'fs';
import path from 'path';

const REPO_ROOT = process.cwd();

console.log('=== DOC SEARCH CATEGORY 10: DATA PERSISTENCE BASELINE AUDIT ===');
console.log(`Root: ${REPO_ROOT}`);

const FRONTEND_APPS = [
  'apps/partner-platform/src',
  'apps/company-platform/src',
  'apps/landing-page/src'
];

const BACKEND_DIRS = [
  'apps/api-gateway/src/routes',
  'apps/api-gateway/src/services',
  'apps/api-gateway/src/repositories',
  'apps/api-gateway/src/plugins'
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('dist') && !fullPath.includes('.git')) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (/\.(ts|tsx|js|jsx|mjs)$/.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// 1. Audit Frontend Storage
console.log('\n[1/5] Auditing Frontend Storage (localStorage, sessionStorage, indexedDB)...');
const storageFindings = [];

for (const appDir of FRONTEND_APPS) {
  const fullAppDir = path.join(REPO_ROOT, appDir);
  const files = getAllFiles(fullAppDir);

  for (const file of files) {
    const relFile = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      if (/(localStorage|sessionStorage|indexedDB)\.(setItem|getItem|removeItem|clear)/.test(line) ||
          /(window\.)?(localStorage|sessionStorage)/.test(line)) {
        
        let classification = 'UI_PREFERENCE';
        const isAuth = /token|auth|session|jwt|refresh|user|tenant/i.test(line);
        const isBusiness = /patient|order|prescription|invoice|clinical|appointment|dispens|lab|radiology|medical|inventory|catalog|cart/i.test(line);

        if (isBusiness && !isAuth) {
          classification = 'SUSPECTED_BUSINESS_DATA_IN_STORAGE';
        } else if (isAuth) {
          classification = 'AUTH_SESSION_MANAGEMENT';
        }

        storageFindings.push({
          file: relFile,
          line: lineNum,
          code: trimmed,
          classification
        });
      }
    });
  }
}

console.log(`Found ${storageFindings.length} browser storage references.`);
const businessStorage = storageFindings.filter(f => f.classification === 'SUSPECTED_BUSINESS_DATA_IN_STORAGE');
console.log(`- Auth/Session: ${storageFindings.filter(f => f.classification === 'AUTH_SESSION_MANAGEMENT').length}`);
console.log(`- UI Preference/State: ${storageFindings.filter(f => f.classification === 'UI_PREFERENCE').length}`);
console.log(`- Suspected Business Data: ${businessStorage.length}`);

// 2. Audit Backend Repositories for In-Memory Stores or Fake Persistence
console.log('\n[2/5] Auditing Backend Repositories for In-Memory or Fake Persistence...');
const repoDir = path.join(REPO_ROOT, 'apps/api-gateway/src/repositories');
const repoFiles = getAllFiles(repoDir);
const repositoryFindings = [];

for (const file of repoFiles) {
  const relFile = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Check for Map, Set, array caches acting as stores
    if (/(private|protected|public|const|let|var)\s+\w*(Cache|Store|Memory|Storage|Map|List|Items|Records)\w*\s*=\s*new\s*(Map|Set|Array)/i.test(trimmed) ||
        /(inMemory|memoryStore|fallbackStore|mockStore|localCache)/i.test(trimmed)) {
      repositoryFindings.push({
        file: relFile,
        line: lineNum,
        code: trimmed,
        issue: 'IN_MEMORY_STORE_OR_CACHE_DETECTED'
      });
    }

    // Check for mock return or hardcoded success without DB call
    if (/return\s*\{\s*success:\s*true\s*\}\s*;?$/i.test(trimmed) && !/await|db\.|pool\./i.test(lines.slice(Math.max(0, idx - 5), idx).join(' '))) {
      repositoryFindings.push({
        file: relFile,
        line: lineNum,
        code: trimmed,
        issue: 'POTENTIAL_FAKE_SUCCESS_WITHOUT_DB_WRITE'
      });
    }
  });
}

console.log(`Found ${repositoryFindings.length} repository suspicious persistence patterns.`);

// 3. Audit Backend Services for Fake Persistence or In-Memory State
console.log('\n[3/5] Auditing Backend Services for In-Memory State & Cache Patterns...');
const serviceDir = path.join(REPO_ROOT, 'apps/api-gateway/src/services');
const serviceFiles = getAllFiles(serviceDir);
const serviceFindings = [];

for (const file of serviceFiles) {
  const relFile = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (/(private|protected|public|const|let|var)\s+\w*(Store|Memory|Map|Cache)\w*\s*=\s*new\s*Map/i.test(trimmed) &&
        !/rateLimit|tokenBlacklist|dedup|lock/i.test(trimmed)) {
      serviceFindings.push({
        file: relFile,
        line: lineNum,
        code: trimmed,
        issue: 'IN_MEMORY_SERVICE_MAP'
      });
    }
  });
}

console.log(`Found ${serviceFindings.length} service in-memory maps.`);

// 4. Audit Backend Mutation Endpoints vs Repositories
console.log('\n[4/5] Inventorying Backend Mutation Routes (POST, PUT, PATCH, DELETE)...');
const routeDir = path.join(REPO_ROOT, 'apps/api-gateway/src/routes');
const routeFiles = getAllFiles(routeDir);
const mutationRoutes = [];

for (const file of routeFiles) {
  const relFile = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    const match = /(app|fastify)\.(post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/i.exec(trimmed);
    if (match) {
      const method = match[2].toUpperCase();
      const endpoint = match[3];
      mutationRoutes.push({
        file: relFile,
        line: lineNum,
        method,
        endpoint
      });
    }
  });
}

console.log(`Found ${mutationRoutes.length} backend mutation endpoints.`);

// 5. Audit Frontend API Query / Cache Invalidation Patterns
console.log('\n[5/5] Auditing Frontend Cache Invalidation & Optimistic Update Patterns...');
const frontendFiles = FRONTEND_APPS.flatMap(app => getAllFiles(path.join(REPO_ROOT, app)));
const cacheFindings = [];

for (const file of frontendFiles) {
  const relFile = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (/onMutate|setQueryData|cancelQueries/.test(trimmed)) {
      cacheFindings.push({
        file: relFile,
        line: lineNum,
        code: trimmed,
        type: 'OPTIMISTIC_UPDATE'
      });
    }
    if (/invalidateQueries/.test(trimmed)) {
      cacheFindings.push({
        file: relFile,
        line: lineNum,
        code: trimmed,
        type: 'QUERY_INVALIDATION'
      });
    }
  });
}

console.log(`Found ${cacheFindings.length} cache invalidation / optimistic update hooks.`);

// Compile Baseline Report
const baselineReport = {
  timestamp: new Date().toISOString(),
  category: 'CATEGORY 10: DATA PERSISTENCE ERROR',
  stats: {
    totalFrontendStorageReferences: storageFindings.length,
    authSessionReferences: storageFindings.filter(f => f.classification === 'AUTH_SESSION_MANAGEMENT').length,
    uiPreferenceReferences: storageFindings.filter(f => f.classification === 'UI_PREFERENCE').length,
    suspectedBusinessDataInStorage: businessStorage.length,
    repositorySuspiciousPatterns: repositoryFindings.length,
    serviceInMemoryMaps: serviceFindings.length,
    totalMutationRoutes: mutationRoutes.length,
    frontendCacheHooks: cacheFindings.length
  },
  businessStorage,
  repositoryFindings,
  serviceFindings,
  sampleMutationRoutes: mutationRoutes.slice(0, 30),
  cacheFindings: cacheFindings.slice(0, 20)
};

fs.writeFileSync(
  path.join(REPO_ROOT, 'reports/persistence/baseline.json'),
  JSON.stringify(baselineReport, null, 2)
);

let markdown = `# DOC SEARCH — CATEGORY 10: DATA PERSISTENCE BASELINE AUDIT REPORT

**Generated:** ${baselineReport.timestamp}  
**Auditor:** Data Persistence Auditor + Remediation Engineer  
**Objective:** Independent audit of full-stack persistence integrity across Native PostgreSQL 18.4, API Gateway, and Frontend Applications.

---

## 1. Executive Summary Statistics

| Metric | Count | Assessment |
|---|---|---|
| Total Browser Storage References (\`localStorage\` / \`sessionStorage\`) | ${baselineReport.stats.totalFrontendStorageReferences} | Scanned across all 3 frontends |
| Auth / Session Management Storage | ${baselineReport.stats.authSessionReferences} | Expected for JWT / Auth tokens |
| UI Preference / Ephemeral State Storage | ${baselineReport.stats.uiPreferenceReferences} | Expected for theme / table pagination |
| **Suspected Business Data in Browser Storage** | **${baselineReport.stats.suspectedBusinessDataInStorage}** | **Requires strict zero-trust analysis** |
| Repository Suspicious In-Memory / Fake Patterns | ${baselineReport.stats.repositorySuspiciousPatterns} | Potential non-persistent or bypass paths |
| Service In-Memory Maps | ${baselineReport.stats.serviceInMemoryMaps} | Potential state lost on process restart |
| Total Backend Mutation Endpoints (\`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`) | ${baselineReport.stats.totalMutationRoutes} | Total write surface |
| Frontend Cache Hooks (Optimistic / Invalidation) | ${baselineReport.stats.frontendCacheHooks} | Query lifecycle hooks |

---

## 2. Suspected Business Data in Browser Storage

\`\`\`json
${JSON.stringify(businessStorage, null, 2)}
\`\`\`

---

## 3. Repository Suspicious Patterns

\`\`\`json
${JSON.stringify(repositoryFindings, null, 2)}
\`\`\`

---

## 4. Service In-Memory Maps

\`\`\`json
${JSON.stringify(serviceFindings, null, 2)}
\`\`\`

---

## 5. Next Actions for Remediation Loop
1. Analyze each suspected business storage site in the frontend to verify whether server PostgreSQL is the authoritative truth or if state is lost on reload / second session.
2. Inspect every repository and service in-memory store to ensure no business data is stored exclusively in process memory.
3. Test end-to-end lifecycle across the 12 core hospital workflows:
   \`CREATE -> SAVE -> DATABASE -> RE-FETCH -> UPDATE -> RE-FETCH -> RELOAD -> SECOND SESSION -> SURVIVES RESTART\`
`;

fs.writeFileSync(
  path.join(REPO_ROOT, 'reports/persistence/baseline.md'),
  markdown
);

console.log('\nBaseline audit saved to:');
console.log('- reports/persistence/baseline.json');
console.log('- reports/persistence/baseline.md');
