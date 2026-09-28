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

const routeDir = 'apps/api-gateway/src/routes';
const files = getFiles(routeDir);

const findings = {
  totalRoutes: 0,
  publicRoutes: [],
  authenticatedWithRbac: [],
  authenticatedNoRbac: [],
  trulyUnguarded: [],
  tenantIdParameterChecks: []
};

// Recognized auth & guard terms
const AUTH_TERMS = ['authenticate', 'adminVerificationGuard', 'requireActiveCommercialAccess', 'withSecurityContext'];
const RBAC_TERMS = ['requirePermission', 'requireRoles', 'requireSuperAdmin', 'adminVerificationGuard', 'isSuperAdmin', 'requireCommercialFeatureEntitlement'];

for (const file of files) {
  const relPath = path.relative(routeDir, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  // Match route declarations: fastify.(get|post|put|delete|patch)(...)
  const regex = /fastify\.(get|post|put|delete|patch)\s*\(\s*(['"`])([^'"`]+)\2\s*,([\s\S]*?)(?:async|\basync\b|\(request)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    findings.totalRoutes++;
    const method = match[1].toUpperCase();
    const routeUrl = match[3];
    const optionsBlock = match[4];

    // Determine handler body by scanning forward
    const startIndex = regex.lastIndex;
    const handlerSample = content.substring(startIndex, startIndex + 1500);

    const isPublicKnown = 
      routeUrl.startsWith('/health') ||
      routeUrl.startsWith('/api/health') ||
      routeUrl.startsWith('/api/v1/health') ||
      routeUrl.includes('/login') ||
      routeUrl.includes('/register') ||
      routeUrl.includes('/refresh') ||
      routeUrl.includes('/forgot-password') ||
      routeUrl.includes('/reset-password') ||
      routeUrl.includes('/webhooks/') ||
      routeUrl === '/api/v1/auth/registration-form-config' ||
      routeUrl === '/api/v1/auth/launch-offer' ||
      routeUrl === '/api/v1/auth/quick-session' ||
      routeUrl === '/api/v1/auth/partner-status' ||
      routeUrl.includes('/verify-report/') ||
      routeUrl.includes('/machine-fingerprint');

    const hasAuth = AUTH_TERMS.some(term => optionsBlock.includes(term) || handlerSample.includes(term));
    const hasRbac = RBAC_TERMS.some(term => optionsBlock.includes(term) || handlerSample.includes(term));

    // Check if handler takes tenantId from params, query, or body
    const takesExternalTenantId = 
      handlerSample.includes('request.params') && handlerSample.includes('tenantId') ||
      handlerSample.includes('request.query') && handlerSample.includes('tenantId') ||
      handlerSample.includes('request.body') && handlerSample.includes('tenantId');

    const checksSessionTenant = 
      handlerSample.includes('session.tenantId') || 
      handlerSample.includes('session?.tenantId') ||
      handlerSample.includes('withSecurityContext');

    if (takesExternalTenantId && !checksSessionTenant && !hasRbac) {
      findings.tenantIdParameterChecks.push({
        method,
        url: routeUrl,
        file: relPath,
        detail: 'Accepts external tenantId without validating session.tenantId or requiring admin RBAC'
      });
    }

    if (isPublicKnown) {
      findings.publicRoutes.push({ method, url: routeUrl, file: relPath });
    } else if (hasAuth && hasRbac) {
      findings.authenticatedWithRbac.push({ method, url: routeUrl, file: relPath });
    } else if (hasAuth && !hasRbac) {
      findings.authenticatedNoRbac.push({ method, url: routeUrl, file: relPath });
    } else {
      findings.trulyUnguarded.push({ method, url: routeUrl, file: relPath });
    }
  }
}

fs.writeFileSync('scripts/route-security-audit.json', JSON.stringify(findings, null, 2));

console.log('============================================================');
console.log('🔒 ROUTE SECURITY & AUTHORIZATION AUDIT COMPLETE');
console.log('============================================================');
console.log(`Total Routes Scanned: ${findings.totalRoutes}`);
console.log(`Public Routes: ${findings.publicRoutes.length}`);
console.log(`Authenticated with RBAC: ${findings.authenticatedWithRbac.length}`);
console.log(`Authenticated without explicit RBAC: ${findings.authenticatedNoRbac.length}`);
console.log(`Potential Truly Unguarded Routes: ${findings.trulyUnguarded.length}`);
console.log(`Potential Tenant IDOR Risks: ${findings.tenantIdParameterChecks.length}`);
console.log('\nReport written to scripts/route-security-audit.json');
