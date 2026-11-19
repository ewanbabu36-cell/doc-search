import fs from 'fs';
import path from 'path';

// Extract all registered routes in apps/api-gateway/src
function getBackendRoutes() {
  const routesDir = 'apps/api-gateway/src/routes';
  const routes = new Set();

  function scan(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) scan(full);
      else if (e.name.endsWith('.ts')) {
        const content = fs.readFileSync(full, 'utf8');
        // Match fastify.get('/url' or app.get('/url'
        const regex = /(?:fastify|app)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          routes.add(`${match[1].toUpperCase()} ${match[2]}`);
        }
      }
    }
  }

  scan(routesDir);
  return routes;
}

// Extract API calls from frontend services
function getFrontendApiCalls(frontendDir) {
  const calls = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) scan(full);
      else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) {
        const content = fs.readFileSync(full, 'utf8');
        // Match fetch(`...`) or apiClient.get/post('/api/v1/...')
        const regex = /(fetch|get|post|put|delete|patch)\(\s*[`'"](\/api\/v1\/[^`'"]+)[`'"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          calls.push({ file: full, method: match[1].toUpperCase(), url: match[2] });
        }
      }
    }
  }
  scan(frontendDir);
  return calls;
}

const backendRoutes = getBackendRoutes();
console.log(`Backend registered endpoints: ${backendRoutes.size}`);

const partnerCalls = getFrontendApiCalls('apps/partner-platform/src');
const patientCalls = getFrontendApiCalls('apps/patient-app/src');
const companyCalls = getFrontendApiCalls('apps/company-platform/src');

console.log(`Frontend API calls found: Partner=${partnerCalls.length}, Patient=${patientCalls.length}, Company=${companyCalls.length}`);

// Compare frontend calls against backend
function checkParity(calls, platformName) {
  const unmapped = [];
  for (const call of calls) {
    // Clean up url (strip query params or params like :id or ${id})
    let base = call.url.split('?')[0];
    base = base.replace(/\$\{[^}]+\}/g, ':param');
    // Normalize method
    let method = call.method;
    if (method === 'FETCH') method = 'GET'; // assumption or wildcard

    // check direct match or parameterized match
    let found = false;
    for (const bRoute of backendRoutes) {
      const [bMethod, bPath] = bRoute.split(' ');
      // Simple regex conversion of :param
      const regexStr = '^' + bPath.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
      const pathRegex = new RegExp(regexStr);
      if (bPath === base || pathRegex.test(base)) {
        found = true;
        break;
      }
    }
    if (!found) {
      unmapped.push({ ...call, base });
    }
  }
  return unmapped;
}

const unmappedPartner = checkParity(partnerCalls, 'Partner');
console.log(`\nUnmapped Partner API calls: ${unmappedPartner.length}`);
unmappedPartner.slice(0, 15).forEach(c => console.log(`  [${c.method}] ${c.url} in ${c.file}`));

const unmappedPatient = checkParity(patientCalls, 'Patient');
console.log(`\nUnmapped Patient API calls: ${unmappedPatient.length}`);
unmappedPatient.slice(0, 15).forEach(c => console.log(`  [${c.method}] ${c.url} in ${c.file}`));

const unmappedCompany = checkParity(companyCalls, 'Company');
console.log(`\nUnmapped Company API calls: ${unmappedCompany.length}`);
unmappedCompany.slice(0, 15).forEach(c => console.log(`  [${c.method}] ${c.url} in ${c.file}`));
