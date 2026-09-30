import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
      const routeRegex = /fastify\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      while ((match = routeRegex.exec(content)) !== null) {
        backendRoutes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: path.relative(rootDir, fullPath)
        });
      }
    }
  }
}
scanRoutes(routesDir);

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
      const fetchRegex = /(?:fetch|apiRequest|apiClient\.get|apiClient\.post|apiClient\.put|apiClient\.delete|apiClient\.patch)\s*(?:<[^>]+>)?\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      while ((match = fetchRegex.exec(content)) !== null) {
        const rawUrl = match[1];
        if (rawUrl.startsWith('/api/')) {
          frontendCalls.push({
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

function normalizePath(p) {
  return p
    .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
    .replace(/\$\{[^}]+\}/g, '[^/]+');
}

const mismatches = [];
for (const call of frontendCalls) {
  const cleanUrl = call.url.replace(/\$\{[^}]+\}/g, 'PLACEHOLDER');
  const matched = backendRoutes.some((br) => {
    const pattern = new RegExp('^' + normalizePath(br.path) + '$');
    return pattern.test(cleanUrl) || pattern.test(call.url);
  });
  if (!matched) {
    mismatches.push(call);
  }
}

// Group by service/file
const grouped = {};
mismatches.forEach(m => {
  const key = m.file;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(m);
});

console.log('=== GROUPED API MISMATCHES (FRONTEND CALLS TO MISSING ROUTES) ===');
for (const [file, calls] of Object.entries(grouped)) {
  console.log(`\nFile: ${file} (${calls.length} mismatches):`);
  const uniqueUrls = [...new Set(calls.map(c => c.url))];
  uniqueUrls.forEach(u => console.log(`   - ${u}`));
}
