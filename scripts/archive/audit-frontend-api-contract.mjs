import fs from 'fs';
import path from 'path';

function getFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file, exts));
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(file);
    }
  });
  return results;
}

// 1. Extract backend routes
const gatewayRouteFiles = getFiles('apps/api-gateway/src/routes');
const backendRoutes = [];

gatewayRouteFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Match route declarations: (fastify|app|router).(get|post|put|patch|delete)('/path'
  const regex = /(?:fastify|app|router)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    backendRoutes.push({
      method: match[1].toUpperCase(),
      path: match[2],
      file: path.relative('.', f).replace(/\\/g, '/')
    });
  }
});

console.log(`Extracted ${backendRoutes.length} backend routes from ${gatewayRouteFiles.length} files.`);

// 2. Extract frontend API calls
const frontendDirs = [
  'apps/partner-platform/src',
  'apps/company-platform/src',
  'apps/landing-page/src'
];

const frontendFiles = frontendDirs.flatMap(d => getFiles(d));
const frontendCalls = [];

frontendFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Patterns:
  // apiRequest('/api/v1/...') or apiRequest<...>(`/api/v1/...`)
  // fetch('/api/v1/...') or fetch(`/api/v1/...`)
  // axios.get/post('/api/v1/...')
  // client.get/post('/api/v1/...')
  // `${API_URL}/api/...`
  const apiCallRegex = /(?:apiRequest|fetch|client|axios|http|apiClient)(?:<[^>]+>)?\s*\(\s*[`'"](\/api\/v1\/[^`'"]+)[`'"]/g;
  let match;
  while ((match = apiCallRegex.exec(content)) !== null) {
    frontendCalls.push({
      path: match[1],
      file: path.relative('.', f).replace(/\\/g, '/'),
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Also catch template strings like `/api/v1/partner/patients/${patientId}` or `/api/v1/partner/lab/catalog${qs}`
  const templateRegex = /(?:apiRequest|fetch|client|axios|http|apiClient)(?:<[^>]+>)?\s*\(\s*`(\/api\/v1\/[^`]+)`/g;
  while ((match = templateRegex.exec(content)) !== null) {
    let rawPath = match[1];
    // Strip trailing query interpolations like ${q}, ${qs}, ${query}, ${queryString}
    rawPath = rawPath.replace(/\$\{(?:q|qs|query|queryString|params)\}/g, '');
    // Normalize path parameters ${param} to :param for matching
    const normalized = rawPath.replace(/\$\{([^}]+)\}/g, ':$1');
    frontendCalls.push({
      path: normalized,
      rawPath,
      file: path.relative('.', f).replace(/\\/g, '/'),
      line: content.substring(0, match.index).split('\n').length
    });
  }
});

console.log(`Extracted ${frontendCalls.length} frontend API calls from ${frontendFiles.length} files.`);

// 3. Match frontend calls against backend routes
function matchRoute(frontendPath, backendRoutePath) {
  // Replace params in backend route: e.g. :id or :orderId -> [^/]+
  const pattern = '^' + backendRoutePath.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
  const re = new RegExp(pattern);
  return re.test(frontendPath);
}

const mismatches = [];
const matches = [];

frontendCalls.forEach(call => {
  // Normalize frontend path by stripping query string
  const cleanPath = call.path.split('?')[0];
  // Replace any remaining template param indicators like :foo with a generic test id or wildcard
  const testPath = cleanPath.replace(/:[a-zA-Z0-9_]+/g, 'test-id');

  const matched = backendRoutes.find(r => matchRoute(testPath, r.path));
  if (matched) {
    matches.push({ call, matched });
  } else {
    mismatches.push(call);
  }
});

console.log(`Matches: ${matches.length}`);
console.log(`Potential Mismatches (Frontend calls with NO exact backend route): ${mismatches.length}`);

// Deduplicate mismatches by path
const dedupMismatches = {};
mismatches.forEach(m => {
  if (!dedupMismatches[m.path]) {
    dedupMismatches[m.path] = [];
  }
  dedupMismatches[m.path].push({ file: m.file, line: m.line });
});

fs.writeFileSync(
  'audit-results/category-6-api-contract-mismatches.json',
  JSON.stringify({
    totalCalls: frontendCalls.length,
    matchedCount: matches.length,
    mismatchesCount: Object.keys(dedupMismatches).length,
    mismatches: dedupMismatches
  }, null, 2)
);

console.log('Saved to audit-results/category-6-api-contract-mismatches.json');
