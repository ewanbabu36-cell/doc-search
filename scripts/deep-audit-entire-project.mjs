import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🔍 RUNNING COMPREHENSIVE REPOSITORY AUDIT');
console.log('====================================================\n');

// 1. EXTRACT ALL BACKEND ROUTES
const backendRoutes = [];
const routesDir = path.join(rootDir, 'apps/api-gateway/src/routes');

function scanRoutes(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanRoutes(fullPath);
    } else if (file.endsWith('.routes.ts') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const routeRegex = /(?:fastify|app|router)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      while ((match = routeRegex.exec(content)) !== null) {
        backendRoutes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: path.relative(rootDir, fullPath),
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
  }
}

scanRoutes(routesDir);
console.log(`[BACKEND ROUTES] Extracted ${backendRoutes.length} registered API routes across api-gateway.`);

// 2. EXTRACT ALL FRONTEND API CALLS
const frontendCalls = [];
const frontendDirs = [
  path.join(rootDir, 'apps/partner-platform/src'),
  path.join(rootDir, 'apps/company-platform/src'),
  path.join(rootDir, 'apps/landing-page/src')
];

function scanFrontend(dir, appName) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanFrontend(fullPath, appName);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Match fetch, apiRequest, get, post, etc. with string literal URLs
      const fetchRegex = /(?:fetch|apiRequest|apiClient\.get|apiClient\.post|apiClient\.put|apiClient\.delete|apiClient\.patch)\s*(?:<[^>]+>)?\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      while ((match = fetchRegex.exec(content)) !== null) {
        const rawUrl = match[1];
        if (rawUrl.startsWith('/api/') || rawUrl.startsWith('http')) {
          frontendCalls.push({
            call: match[0],
            url: rawUrl.split('?')[0],
            fullUrl: rawUrl,
            app: appName,
            file: path.relative(rootDir, fullPath),
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    }
  }
}

scanFrontend(frontendDirs[0], 'partner-platform');
scanFrontend(frontendDirs[1], 'company-platform');
scanFrontend(frontendDirs[2], 'landing-page');
console.log(`[FRONTEND CALLS] Extracted ${frontendCalls.length} API calls across frontend platforms.\n`);

// 3. CHECK API MISMATCHES (Frontend calls vs Backend routes)
function normalizePath(p) {
  // Replace :param with placeholder for regex matching
  return p
    .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
    .replace(/\$\{[^}]+\}/g, '[^/]+');
}

const apiMismatches = [];
for (const call of frontendCalls) {
  if (!call.url.startsWith('/api/')) continue;
  
  // Clean url (remove template placeholders like ${id} if any)
  const cleanUrl = call.url.replace(/\$\{[^}]+\}/g, 'PLACEHOLDER');
  
  const matched = backendRoutes.some((br) => {
    const pattern = new RegExp('^' + normalizePath(br.path) + '$');
    return pattern.test(cleanUrl) || pattern.test(call.url);
  });

  if (!matched) {
    apiMismatches.push(call);
  }
}

console.log('--- [1] API MISMATCHES (Frontend calls that do not match any backend route) ---');
console.log(`Found ${apiMismatches.length} potential mismatches/dead endpoints:`);
apiMismatches.slice(0, 30).forEach((m, idx) => {
  console.log(`  [${idx + 1}] ${m.app}: ${m.url} (at ${m.file}:${m.line})`);
});
if (apiMismatches.length > 30) {
  console.log(`  ... and ${apiMismatches.length - 30} more.`);
}

// 4. CHECK LOCALSTORAGE CLINICAL/BILLING DATA LEAKAGE
console.log('\n--- [2] LOCALSTORAGE STATE LEAKAGE SCAN ---');
const localStorageUsages = [];

function scanLocalStorage(dir, appName) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanLocalStorage(fullPath, appName);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lsRegex = /localStorage\.(getItem|setItem|removeItem)\(['"`]([^'"`]+)['"`]/g;
      let match;
      while ((match = lsRegex.exec(content)) !== null) {
        const key = match[2];
        // Ignore standard auth tokens / UI theme preferences
        if (!['docsearch_auth_token', 'docsearch_user', 'theme', 'docsearch_theme', 'auth_token'].includes(key)) {
          localStorageUsages.push({
            op: match[1],
            key,
            app: appName,
            file: path.relative(rootDir, fullPath),
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    }
  }
}

scanLocalStorage(frontendDirs[0], 'partner-platform');
scanLocalStorage(frontendDirs[1], 'company-platform');
scanLocalStorage(frontendDirs[2], 'landing-page');

console.log(`Found ${localStorageUsages.length} non-auth localStorage operations:`);
const uniqueKeys = {};
localStorageUsages.forEach(u => {
  uniqueKeys[u.key] = (uniqueKeys[u.key] || 0) + 1;
});
for (const [k, count] of Object.entries(uniqueKeys)) {
  console.log(`  - Key: "${k}" (${count} occurrences)`);
}

// 5. DATABASE SCHEMA vs PERSISTENCE TABLES
console.log('\n--- [3] DATABASE SCHEMA vs DISK PERSISTENCE COVERAGE ---');
const persistenceFile = path.join(rootDir, 'packages/database/src/embedded-persistence.ts');
const persistenceContent = fs.readFileSync(persistenceFile, 'utf8');
const trackedMatch = persistenceContent.match(/TRACKED_TABLES\s*=\s*\[([\s\S]*?)\];/);
const trackedTables = trackedMatch ? trackedMatch[1].split(',').map(s => s.trim().replace(/['"`]/g, '')).filter(Boolean) : [];

console.log(`Total Tracked Tables in embedded-persistence.ts: ${trackedTables.length}`);

// Scan schema files to extract all defined tables
const schemaDir = path.join(rootDir, 'packages/database/src/schema');
const definedTables = [];

function scanSchema(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanSchema(fullPath);
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const tableRegex = /(?:clinicalSchema|companySchema|coreSchema|billingSchema|pgTable)\.table\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      while ((match = tableRegex.exec(content)) !== null) {
        definedTables.push({
          name: match[1],
          file: path.relative(rootDir, fullPath)
        });
      }
    }
  }
}

scanSchema(schemaDir);
console.log(`Total Drizzle Tables defined across schema: ${definedTables.length}`);

// Check which tables are missing from trackedTables
const missingTables = definedTables.filter(dt => {
  return !trackedTables.some(tt => tt.endsWith('.' + dt.name) || tt === dt.name);
});
console.log(`Tables defined in schema but NOT in embedded-persistence.ts: ${missingTables.length}`);
missingTables.slice(0, 20).forEach(mt => {
  console.log(`  - ${mt.name} (in ${mt.file})`);
});
if (missingTables.length > 20) {
  console.log(`  ... and ${missingTables.length - 20} more.`);
}

// 6. DANGEROUS/UNGUARDED ROUTES IN BACKEND
console.log('\n--- [4] SENSITIVE BACKEND ROUTES WITHOUT STRICT AUTH GUARDS ---');
const unguardedRoutes = [];
function scanAuthGuards(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanAuthGuards(fullPath);
    } else if (file.endsWith('.routes.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if ((line.includes('fastify.') || line.includes('app.')) && (line.includes("'/api/v1/partner/") || line.includes("'/api/v1/company/"))) {
          // Check subsequent 5 lines for preHandler
          const nextLines = lines.slice(i, i + 8).join('\n');
          if (!nextLines.includes('authenticate') && !nextLines.includes('optionalAuthenticate')) {
            // Check if it's health or public route
            if (!line.includes('/health') && !line.includes('/public') && !line.includes('/login') && !line.includes('/self-register')) {
              unguardedRoutes.push({
                line: line.trim(),
                file: path.relative(rootDir, fullPath),
                lineNum: i + 1
              });
            }
          }
        }
      }
    }
  }
}

scanAuthGuards(routesDir);
console.log(`Unguarded Partner/Company Routes found: ${unguardedRoutes.length}`);
unguardedRoutes.forEach(ur => {
  console.log(`  - ${ur.file}:${ur.lineNum} -> ${ur.line}`);
});

console.log('\n====================================================');
console.log('✅ AUDIT SCAN COMPLETE');
console.log('====================================================');
