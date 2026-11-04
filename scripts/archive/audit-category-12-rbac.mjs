/**
 * scripts/audit-category-12-rbac.mjs
 * 
 * Category 12: Authorization / RBAC Error Baseline Audit Script
 * Comprehensive discovery of:
 * - Roles & Permissions in Database (core & company schemas)
 * - Route Authorization across apps/api-gateway/src/routes
 * - PreHandler Guard Analysis (authenticate, requirePermission, requireRoles, requireTenantScope)
 * - Wildcard permissions, hardcoded roles, SUPER_ADMIN bypasses
 * - Frontend UI vs Backend RBAC alignment
 * 
 * Outputs:
 * - reports/rbac/baseline.json
 * - reports/rbac/baseline.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function getDatabaseInventory() {
  console.log('[RBAC Audit] Querying database roles, permissions, and mappings...');
  const inventory = {
    coreRoles: [],
    corePermissions: [],
    coreRolePermissions: [],
    coreUsers: [],
    coreUserRoles: [],
    companyRoles: [],
    companyPermissions: [],
    companyRolePermissions: [],
    companyUserRoles: [],
    departments: [],
    designations: [],
    features: [],
    planEntitlements: []
  };

  try {
    const rolesRes = await pool.query('SELECT id, name, code, is_system FROM core.roles ORDER BY code;');
    inventory.coreRoles = rolesRes.rows;
  } catch (err) {
    console.warn('Could not query core.roles:', err.message);
  }

  try {
    const permsRes = await pool.query('SELECT id, resource, action, scope, description FROM core.permissions ORDER BY resource, action;');
    inventory.corePermissions = permsRes.rows;
  } catch (err) {
    console.warn('Could not query core.permissions:', err.message);
  }

  try {
    const rpRes = await pool.query(`
      SELECT r.code as role_code, p.resource, p.action, p.scope
      FROM core.role_permissions rp
      JOIN core.roles r ON rp.role_id = r.id
      JOIN core.permissions p ON rp.permission_id = p.id
      ORDER BY r.code, p.resource, p.action;
    `);
    inventory.coreRolePermissions = rpRes.rows;
  } catch (err) {
    console.warn('Could not query core.role_permissions:', err.message);
  }

  try {
    const usersRes = await pool.query('SELECT id, email, status, metadata FROM core.users ORDER BY email;');
    inventory.coreUsers = usersRes.rows;
  } catch (err) {
    console.warn('Could not query core.users:', err.message);
  }

  try {
    const urRes = await pool.query(`
      SELECT u.email, r.code as role_code, ur.tenant_id, ur.branch_id
      FROM core.user_roles ur
      JOIN core.users u ON ur.user_id = u.id
      JOIN core.roles r ON ur.role_id = r.id
      ORDER BY u.email, r.code;
    `);
    inventory.coreUserRoles = urRes.rows;
  } catch (err) {
    console.warn('Could not query core.user_roles:', err.message);
  }

  try {
    const secRolesRes = await pool.query('SELECT id, role_code, role_name, role_type, scope_type, is_system_role FROM company.security_roles ORDER BY role_code;');
    inventory.companyRoles = secRolesRes.rows;
  } catch (err) {
    console.warn('Could not query company.security_roles:', err.message);
  }

  try {
    const secPermsRes = await pool.query('SELECT id, permission_code, permission_name, domain, resource, action, risk_level FROM company.security_permissions ORDER BY domain, permission_code;');
    inventory.companyPermissions = secPermsRes.rows;
  } catch (err) {
    console.warn('Could not query company.security_permissions:', err.message);
  }

  try {
    const deptRes = await pool.query('SELECT id, department_name, department_code, status FROM company.departments ORDER BY department_name;');
    inventory.departments = deptRes.rows;
  } catch (err) {
    console.warn('Could not query company.departments:', err.message);
  }

  try {
    const desigRes = await pool.query('SELECT id, title, designation_code, band_level FROM company.designations ORDER BY title;');
    inventory.designations = desigRes.rows;
  } catch (err) {
    console.warn('Could not query company.designations:', err.message);
  }

  try {
    const featRes = await pool.query('SELECT id, code, name, category, status FROM company.features ORDER BY category, code;');
    inventory.features = featRes.rows;
  } catch (err) {
    console.warn('Could not query company.features:', err.message);
  }

  try {
    const peRes = await pool.query(`
      SELECT p.code as plan_code, f.code as feature_code, pe.entitlement_type, pe.value, pe.status
      FROM company.plan_entitlements pe
      JOIN company.plans p ON pe.plan_id = p.id
      JOIN company.features f ON pe.feature_id = f.id
      ORDER BY p.code, f.code;
    `);
    inventory.planEntitlements = peRes.rows;
  } catch (err) {
    console.warn('Could not query company.plan_entitlements:', err.message);
  }

  return inventory;
}

function scanRouteFiles(routesDir) {
  console.log('[RBAC Audit] Scanning routes in:', routesDir);
  const routeFiles = [];

  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (item.endsWith('.routes.ts')) {
        routeFiles.push(full);
      }
    }
  }

  walk(routesDir);
  console.log(`[RBAC Audit] Found ${routeFiles.length} route files.`);

  const endpoints = [];

  for (const file of routeFiles) {
    const relFile = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');

    // Search for Fastify route registrations:
    // app.get('/path', { preHandler: ... }, async ...)
    // app.post('/path', ...
    const routeRegex = /app\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`])\s*,\s*(\{[\s\S]*?\}|async|\()/g;

    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const rawPath = match[2].slice(1, -1);
      const startIdx = match.index;
      const snippet = content.substring(startIdx, Math.min(startIdx + 1200, content.length));

      // Extract preHandler configuration
      const preHandlerMatch = snippet.match(/preHandler\s*:\s*(\[[^\]]*\]|[^,{}]+)/);
      const preHandlerStr = preHandlerMatch ? preHandlerMatch[1] : '';

      const hasAuthenticate = preHandlerStr.includes('authenticate') && !preHandlerStr.includes('optionalAuthenticate');
      const hasOptionalAuthenticate = preHandlerStr.includes('optionalAuthenticate');
      const hasRequirePermission = preHandlerStr.includes('requirePermission');
      const hasRequireRoles = preHandlerStr.includes('requireRoles');
      const hasRequireTenantScope = preHandlerStr.includes('requireTenantScope');
      const hasRequireBranchScope = preHandlerStr.includes('requireBranchScope');
      const hasCommercialGuard = preHandlerStr.includes('commercialGuard') || preHandlerStr.includes('requireFeatureEntitlement');

      // Extract required permission params if present
      let requiredPerm = null;
      const permMatch = preHandlerStr.match(/requirePermission\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/);
      if (permMatch) {
        requiredPerm = `${permMatch[1]}:${permMatch[2]}`;
      }

      // Extract required roles if present
      const rolesMatch = preHandlerStr.match(/requireRoles\s*\(([^)]+)\)/);
      const requiredRoles = rolesMatch
        ? rolesMatch[1].split(',').map((s) => s.trim().replace(/['"`]/g, ''))
        : [];

      // Determine classification
      let classification = 'PUBLIC_UNGUARDED';
      const isPublicEndpoint =
        rawPath.startsWith('/health') ||
        rawPath.startsWith('/api/v1/health') ||
        rawPath.startsWith('/api/v1/auth/login') ||
        rawPath.startsWith('/api/v1/auth/register') ||
        rawPath.startsWith('/api/v1/auth/refresh') ||
        rawPath.startsWith('/api/v1/public/') ||
        rawPath.startsWith('/api/v1/webhook');

      if (hasAuthenticate && (hasRequirePermission || hasRequireRoles.length > 0)) {
        classification = 'FULLY_GUARDED';
      } else if (hasAuthenticate && !hasRequirePermission && requiredRoles.length === 0) {
        classification = 'AUTH_ONLY';
      } else if (hasOptionalAuthenticate) {
        classification = 'OPTIONAL_AUTH';
      } else if (isPublicEndpoint) {
        classification = 'PUBLIC_INTENTIONAL';
      } else {
        classification = 'UNGUARDED';
      }

      const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
      const mutationUnguarded = isMutation && classification !== 'FULLY_GUARDED' && !isPublicEndpoint;

      endpoints.push({
        method,
        path: rawPath,
        file: relFile,
        hasAuthenticate,
        hasOptionalAuthenticate,
        hasRequirePermission,
        requiredPerm,
        hasRequireRoles,
        requiredRoles,
        hasRequireTenantScope,
        hasRequireBranchScope,
        hasCommercialGuard,
        classification,
        isMutation,
        mutationUnguarded
      });
    }
  }

  return { routeFiles, endpoints };
}

function scanCodebasePatterns() {
  console.log('[RBAC Audit] Scanning for wildcard permissions, hardcoded roles, and admin checks...');
  const findings = {
    wildcards: [],
    hardcodedAdmin: [],
    frontendRoleChecks: []
  };

  const targetDirs = [
    path.join(rootDir, 'apps/api-gateway/src'),
    path.join(rootDir, 'packages/auth/src')
  ];

  function search(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        search(full);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split('\n');
        const rel = path.relative(rootDir, full).replace(/\\/g, '/');

        lines.forEach((line, idx) => {
          const lineNum = idx + 1;
          // Wildcard check
          if (line.includes("'*'") || line.includes('"*"') || line.includes("':*'") || line.includes('":*"')) {
            findings.wildcards.push({ file: rel, line: lineNum, text: line.trim() });
          }
          // Hardcoded isAdmin check
          if (line.includes('isAdmin = true') || line.includes('isSuperAdmin = true') || line.includes('isAdmin: true')) {
            findings.hardcodedAdmin.push({ file: rel, line: lineNum, text: line.trim() });
          }
        });
      }
    }
  }

  for (const d of targetDirs) {
    if (fs.existsSync(d)) {
      search(d);
    }
  }

  // Scan frontend for role checks
  const frontendDir = path.join(rootDir, 'apps/partner-platform/src');
  if (fs.existsSync(frontendDir)) {
    function searchFrontend(dir) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          searchFrontend(full);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          const content = fs.readFileSync(full, 'utf8');
          const lines = content.split('\n');
          const rel = path.relative(rootDir, full).replace(/\\/g, '/');
          lines.forEach((line, idx) => {
            if (line.includes('hasPermission(') || line.includes('hasRole(') || line.includes("roles.includes('")) {
              findings.frontendRoleChecks.push({ file: rel, line: idx + 1, text: line.trim() });
            }
          });
        }
      }
    }
    searchFrontend(frontendDir);
  }

  return findings;
}

async function main() {
  console.log('=== STARTING CATEGORY 12 RBAC BASELINE AUDIT ===');

  const dbInventory = await getDatabaseInventory();
  const routesDir = path.join(rootDir, 'apps/api-gateway/src/routes');
  const routeAudit = scanRouteFiles(routesDir);
  const patternAudit = scanCodebasePatterns();

  const totalEndpoints = routeAudit.endpoints.length;
  const fullyGuarded = routeAudit.endpoints.filter((e) => e.classification === 'FULLY_GUARDED').length;
  const authOnly = routeAudit.endpoints.filter((e) => e.classification === 'AUTH_ONLY').length;
  const optionalAuth = routeAudit.endpoints.filter((e) => e.classification === 'OPTIONAL_AUTH').length;
  const publicIntentional = routeAudit.endpoints.filter((e) => e.classification === 'PUBLIC_INTENTIONAL').length;
  const unguarded = routeAudit.endpoints.filter((e) => e.classification === 'UNGUARDED').length;
  const mutationUnguarded = routeAudit.endpoints.filter((e) => e.mutationUnguarded).length;

  const baselineData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRouteFiles: routeAudit.routeFiles.length,
      totalEndpoints,
      fullyGuarded,
      authOnly,
      optionalAuth,
      publicIntentional,
      unguarded,
      mutationUnguarded,
      databaseRolesCount: dbInventory.coreRoles.length,
      databasePermissionsCount: dbInventory.corePermissions.length,
      databaseRolePermissionsCount: dbInventory.coreRolePermissions.length,
      companyRolesCount: dbInventory.companyRoles.length,
      companyPermissionsCount: dbInventory.companyPermissions.length,
      wildcardMatches: patternAudit.wildcards.length,
      hardcodedAdminMatches: patternAudit.hardcodedAdmin.length,
      frontendRoleChecksCount: patternAudit.frontendRoleChecks.length
    },
    dbInventory,
    routeAudit,
    patternAudit
  };

  const reportsDir = path.join(rootDir, 'reports/rbac');
  fs.mkdirSync(reportsDir, { recursive: true });

  const jsonPath = path.join(reportsDir, 'baseline.json');
  fs.writeFileSync(jsonPath, JSON.stringify(baselineData, null, 2), 'utf8');
  console.log(`[RBAC Audit] Saved baseline JSON: ${jsonPath}`);

  // Generate markdown report
  const mdContent = `# CATEGORY 12 — AUTHORIZATION / RBAC BASELINE AUDIT REPORT

**Date:** ${new Date().toISOString()}  
**Repository:** DOC SEARCH Monorepo (\`apps/api-gateway\`, \`packages/auth\`, \`packages/database\`)  
**Database Engine:** Native PostgreSQL 18.4 (Port 5432)  
**API Gateway:** Live Fastify Server (Port 4000)  

---

## 1. Executive Summary

| Metric | Baseline Count | Status |
| :--- | :--- | :--- |
| **Total Route Files Scanned** | ${routeAudit.routeFiles.length} | Completed |
| **Total Endpoints Identified** | ${totalEndpoints} | Inventory Complete |
| **Fully Guarded Endpoints (Auth + Role/Perm)** | ${fullyGuarded} | Protected |
| **Auth-Only Endpoints (Missing Role/Perm)** | ${authOnly} | Scrutiny Required |
| **Optional Auth Endpoints** | ${optionalAuth} | Risk / Investigation |
| **Public Intentional Endpoints** | ${publicIntentional} | Expected Public |
| **Unguarded Endpoints (Non-public)** | ${unguarded} | Action Required |
| **Unguarded Mutations (POST/PUT/DELETE)** | ${mutationUnguarded} | **P0/P1 High Risk** |
| **Core Database Roles** | ${dbInventory.coreRoles.length} | Cataloged |
| **Core Database Permissions** | ${dbInventory.corePermissions.length} | Cataloged |
| **Core Role-Permission Mappings** | ${dbInventory.coreRolePermissions.length} | Cataloged |
| **Company Security Roles** | ${dbInventory.companyRoles.length} | Cataloged |
| **Frontend Permission Checks** | ${patternAudit.frontendRoleChecks.length} | Cross-Referenced |

---

## 2. Invariant Trace Model

Every request MUST satisfy the complete authorization chain:
\`\`\`
USER
  ↓
STAFF (Active & In-Date)
  ↓
PARTNER / TENANT (Session Isolation)
  ↓
DEPARTMENT (Scoping)
  ↓
ROLE (Active Temporal Assignment)
  ↓
PERMISSION (Explicit or Action-Equivalent)
  ↓
FEATURE / ENTITLEMENT (Active License & Plan)
  ↓
RESOURCE (Target Scope & Ownership)
  ↓
ACTION (Non-governed / Governed)
  ↓
BACKEND ENFORCEMENT (403 on Failure, Zero Database Mutation)
\`\`\`

---

## 3. Unguarded Mutations Requiring Direct Remediation

${routeAudit.endpoints
  .filter((e) => e.mutationUnguarded)
  .map(
    (e) => `* **\`${e.method} ${e.path}\`**  
  File: [\`${e.file}\`](file:///${rootDir.replace(/\\/g, '/')}/${e.file})  
  Classification: \`${e.classification}\`  
  Current PreHandler: \`${e.hasAuthenticate ? 'authenticate' : 'none'}\`  
  Missing: \`requirePermission\` or \`requireRoles\`
`
  )
  .join('\n')}

---

## 4. Auth-Only Endpoints Analysis

${routeAudit.endpoints
  .filter((e) => e.classification === 'AUTH_ONLY')
  .slice(0, 30)
  .map(
    (e) => `* \`${e.method} ${e.path}\` ([\`${e.file}\`](file:///${rootDir.replace(/\\/g, '/')}/${e.file}))`
  )
  .join('\n')}
${routeAudit.endpoints.filter((e) => e.classification === 'AUTH_ONLY').length > 30 ? `\n... and ${routeAudit.endpoints.filter((e) => e.classification === 'AUTH_ONLY').length - 30} more (see baseline.json)` : ''}

---

## 5. Database Roles & Permissions Inventory

### Roles (\`core.roles\`)
${dbInventory.coreRoles.map((r) => `- **${r.code}** (${r.name}) - System: \`${r.is_system}\``).join('\n')}

### Company Security Roles (\`company.security_roles\`)
${dbInventory.companyRoles.map((r) => `- **${r.role_code}** (${r.role_name}) - Type: \`${r.role_type}\`, Scope: \`${r.scope_type}\``).join('\n')}

---

## 6. Wildcard and Hardcoded Admin Findings

### Wildcards Detected (\`${patternAudit.wildcards.length}\` occurrences)
${patternAudit.wildcards.slice(0, 15).map((w) => `* [\`${w.file}:${w.line}\`](file:///${rootDir.replace(/\\/g, '/')}/${w.file}#L${w.line}): \`${w.text}\``).join('\n')}

### Hardcoded Admin Findings (\`${patternAudit.hardcodedAdmin.length}\` occurrences)
${patternAudit.hardcodedAdmin.map((h) => `* [\`${h.file}:${h.line}\`](file:///${rootDir.replace(/\\/g, '/')}/${h.file}#L${h.line}): \`${h.text}\``).join('\n')}

---

## 7. Next Remediation Actions

1. Remediate all **${mutationUnguarded}** unguarded mutation endpoints with granular \`requirePermission\` or \`requireRoles\`.
2. Inspect \`optionalAuthenticate\` routes to prevent privilege escalation or authorization bypass.
3. Validate two-session isolation (Session A authorized vs Session B unauthorized on exact same resource).
4. Run live API and PostgreSQL verification suite.
`;

  const mdPath = path.join(reportsDir, 'baseline.md');
  fs.writeFileSync(mdPath, mdContent, 'utf8');
  console.log(`[RBAC Audit] Saved baseline Markdown: ${mdPath}`);

  await pool.end();
  console.log('=== BASELINE AUDIT COMPLETE ===');
}

main().catch((err) => {
  console.error('[RBAC Audit Error]:', err);
  process.exit(1);
});
