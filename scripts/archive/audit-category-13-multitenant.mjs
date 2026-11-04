/**
 * scripts/audit-category-13-multitenant.mjs
 * 
 * Category 13: Multi-Tenant Architecture & Isolation Baseline Audit
 * Discovers:
 * 1. Database Tenant Schema: tables with tenant_id, partner_id, branch_id, foreign keys, indexes, unique constraints.
 * 2. Route Tenant Protection: session context vs client parameter sources (body, query, params, headers).
 * 3. Repository & Service Query Scoping: methods with/without tenant filters, IDOR risks, unsafe fallbacks.
 * 4. Multi-Tenant Model Hierarchy: Company/HQ -> Partner/Tenant -> Branch/Facility -> Department -> User -> Resources.
 * 5. Frontend Tenant State: localStorage/sessionStorage usage.
 * 
 * Outputs:
 * - reports/multitenant/baseline.json
 * - reports/multitenant/baseline.md
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

async function getDatabaseTenantInventory() {
  console.log('[Multi-Tenant Audit] Scanning database schemas for tenant boundaries...');
  const inventory = {
    schemas: [],
    tenantColumns: [],
    branchColumns: [],
    foreignKeys: [],
    indexes: [],
    uniqueConstraints: [],
    tenantsList: [],
    summary: {}
  };

  try {
    // 1. All tenant and partner columns
    const colsRes = await pool.query(`
      SELECT table_schema, table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE column_name IN ('tenant_id', 'partner_id', 'organization_id', 'branch_id', 'facility_id')
      AND table_schema IN ('core', 'company', 'clinical', 'billing', 'workflow', 'public')
      ORDER BY table_schema, table_name, column_name;
    `);
    inventory.tenantColumns = colsRes.rows.filter(r => ['tenant_id', 'partner_id', 'organization_id'].includes(r.column_name));
    inventory.branchColumns = colsRes.rows.filter(r => ['branch_id', 'facility_id'].includes(r.column_name));
  } catch (err) {
    console.warn('Could not query information_schema.columns:', err.message);
  }

  try {
    // 2. Foreign keys referencing tenants
    const fkRes = await pool.query(`
      SELECT
        tc.table_schema, tc.table_name, kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule, rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name IN ('tenant_id', 'partner_id')
      ORDER BY tc.table_schema, tc.table_name;
    `);
    inventory.foreignKeys = fkRes.rows;
  } catch (err) {
    console.warn('Could not query foreign keys:', err.message);
  }

  try {
    // 3. Indexes on tenant_id
    const idxRes = await pool.query(`
      SELECT
        schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname IN ('core', 'company', 'clinical', 'billing', 'workflow')
        AND (indexdef ILIKE '%tenant_id%' OR indexdef ILIKE '%partner_id%')
      ORDER BY schemaname, tablename, indexname;
    `);
    inventory.indexes = idxRes.rows;
  } catch (err) {
    console.warn('Could not query pg_indexes:', err.message);
  }

  try {
    // 4. Current registered tenants
    const tenantsRes = await pool.query(`
      SELECT id, name, slug, status, type, created_at
      FROM core.tenants
      ORDER BY created_at;
    `);
    inventory.tenantsList = tenantsRes.rows;
  } catch (err) {
    console.warn('Could not query core.tenants:', err.message);
  }

  return inventory;
}

function scanRouteFiles(routesDir) {
  console.log(`[Multi-Tenant Audit] Scanning route files in: ${routesDir}`);
  const findings = [];
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.routes.ts') || entry.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  }

  walk(routesDir);

  for (const file of files) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Parse route registrations
    const routeRegex = /(?:fastify|app)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const endpoint = match[2];
      const matchIndex = match.index;
      const snippet = content.substring(matchIndex, matchIndex + 1200);

      const hasAuth = snippet.includes('authenticate');
      const hasTenantScope = snippet.includes('requireTenantScope') || snippet.includes('withSecurityContext');
      const hasBranchScope = snippet.includes('requireBranchScope');
      const hasRole = snippet.includes('requireRoles') || snippet.includes('requireHqAdmin') || snippet.includes('founderAdminGuard');
      const hasPermission = snippet.includes('requirePermission');

      // Check tenant ID extraction in handler snippet
      const trustsBodyTenant = snippet.includes('body.tenantId') || snippet.includes("body['tenantId']") || snippet.includes('body.partnerId') || snippet.includes("body['partnerId']");
      const trustsQueryTenant = snippet.includes('query.tenantId') || snippet.includes("query['tenantId']") || snippet.includes('query.partnerId') || snippet.includes("query['partnerId']");
      const trustsParamsTenant = snippet.includes('params.tenantId') || snippet.includes("params['tenantId']") || snippet.includes('params.partnerId') || snippet.includes("params['partnerId']");
      const usesSessionTenant = snippet.includes('session.tenantId') || snippet.includes('request.session.tenantId') || snippet.includes('session.organizationId');

      // Check fallback to default tenant
      const hasDefaultTenantFallback = snippet.includes("'default'") || snippet.includes('"default"') || snippet.includes('11111111-1111-4111-8111-111111111111') || snippet.includes('44444444-4444-4444-8444-444444444444');

      findings.push({
        file: relPath,
        method,
        endpoint,
        hasAuth,
        hasTenantScope,
        hasBranchScope,
        hasRole,
        hasPermission,
        trustsBodyTenant,
        trustsQueryTenant,
        trustsParamsTenant,
        usesSessionTenant,
        hasDefaultTenantFallback
      });
    }
  }

  return { totalRouteFiles: files.length, endpoints: findings };
}

function scanRepositoryFiles(repoDir) {
  console.log(`[Multi-Tenant Audit] Scanning repository files in: ${repoDir}`);
  const findings = [];
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(repoDir);

  for (const file of files) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');

    // Search for methods querying by ID without tenant scope
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for getById / findById / updateById without tenantId parameter
      if (/(async\s+)?(findById|getById|findByPk|deleteById|updateById)\s*\(([^)]*)\)/.test(line)) {
        const methodMatch = line.match(/(findById|getById|findByPk|deleteById|updateById)\s*\(([^)]*)\)/);
        const methodName = methodMatch ? methodMatch[1] : 'unknown';
        const params = methodMatch ? methodMatch[2] : '';
        const hasTenantParam = params.includes('tenantId') || params.includes('partnerId') || params.includes('session');

        findings.push({
          file: relPath,
          line: i + 1,
          methodName,
          params: params.trim(),
          hasTenantParam,
          isHighRisk: !hasTenantParam
        });
      }

      // Check for hardcoded fallbacks
      if (line.includes("'default'") || line.includes('"default"') || line.includes('44444444-4444-4444-8444-444444444444') || line.includes('11111111-1111-4111-8111-111111111111')) {
        findings.push({
          file: relPath,
          line: i + 1,
          methodName: 'HARDCODED_FALLBACK',
          params: line.trim(),
          hasTenantParam: false,
          isHighRisk: true
        });
      }
    }
  }

  return { totalRepoFiles: files.length, findings };
}

function scanServiceFiles(serviceDir) {
  console.log(`[Multi-Tenant Audit] Scanning service files in: ${serviceDir}`);
  const fallbacks = [];
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(serviceDir);

  for (const file of files) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Search for silent fallback patterns: tenantId || '...', session?.tenantId || '...', etc.
      if (/(tenantId|partnerId)\s*\|\|\s*['"`][^'"`]+['"`]/.test(line) ||
          /(tenantId|partnerId)\s*\?\?\s*['"`][^'"`]+['"`]/.test(line)) {
        fallbacks.push({
          file: relPath,
          line: i + 1,
          code: line.trim()
        });
      }
    }
  }

  return { totalServiceFiles: files.length, fallbacks };
}

function scanFrontendTenantStorage(frontendDirs) {
  console.log('[Multi-Tenant Audit] Scanning frontend storage for tenant state...');
  const storageUsage = [];

  for (const dir of frontendDirs) {
    if (!fs.existsSync(dir)) continue;
    function walk(d) {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('localStorage.getItem') && (line.includes('tenant') || line.includes('partner'))) {
              storageUsage.push({
                file: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
                line: i + 1,
                type: 'localStorage.getItem',
                code: line.trim()
              });
            }
          }
        }
      }
    }
    walk(dir);
  }

  return storageUsage;
}

async function runAudit() {
  console.log('=== STARTING CATEGORY 13 MULTI-TENANT BASELINE AUDIT ===\n');

  const dbInventory = await getDatabaseTenantInventory();
  
  const routesDir = path.resolve(rootDir, 'apps/api-gateway/src/routes');
  const routeAudit = scanRouteFiles(routesDir);

  const repoDir = path.resolve(rootDir, 'apps/api-gateway/src/repositories');
  const repoAudit = scanRepositoryFiles(repoDir);

  const serviceDir = path.resolve(rootDir, 'apps/api-gateway/src/services');
  const serviceAudit = scanServiceFiles(serviceDir);

  const frontendDirs = [
    path.resolve(rootDir, 'apps/partner-platform/src'),
    path.resolve(rootDir, 'apps/company-platform/src')
  ];
  const frontendAudit = scanFrontendTenantStorage(frontendDirs);

  // Categorize Route Tenant Risks
  const clientTenantOverrides = routeAudit.endpoints.filter(e => (e.trustsBodyTenant || e.trustsQueryTenant) && !e.hasTenantScope);
  const unauthenticatedEndpoints = routeAudit.endpoints.filter(e => !e.hasAuth);
  const defaultTenantFallbacks = routeAudit.endpoints.filter(e => e.hasDefaultTenantFallback);

  const baselineReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRouteFiles: routeAudit.totalRouteFiles,
      totalEndpoints: routeAudit.endpoints.length,
      tablesWithTenantId: dbInventory.tenantColumns.length,
      tablesWithBranchId: dbInventory.branchColumns.length,
      foreignKeysOnTenant: dbInventory.foreignKeys.length,
      indexesOnTenant: dbInventory.indexes.length,
      tenantsInDatabase: dbInventory.tenantsList.length,
      repoIdorRisks: repoAudit.findings.filter(f => f.isHighRisk).length,
      serviceTenantFallbacks: serviceAudit.fallbacks.length,
      routesWithClientTenantParam: clientTenantOverrides.length,
      routesWithDefaultTenantFallback: defaultTenantFallbacks.length,
      frontendTenantStorageAccess: frontendAudit.length
    },
    dbInventory,
    routeAudit: {
      clientTenantOverrides,
      defaultTenantFallbacks,
      allEndpoints: routeAudit.endpoints
    },
    repoAudit,
    serviceAudit,
    frontendAudit
  };

  // Ensure output directory exists
  const reportsDir = path.resolve(rootDir, 'reports/multitenant');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save JSON
  const jsonPath = path.join(reportsDir, 'baseline.json');
  fs.writeFileSync(jsonPath, JSON.stringify(baselineReport, null, 2));
  console.log(`[Multi-Tenant Audit] Saved baseline JSON: ${jsonPath}`);

  // Generate Markdown
  let md = `# CATEGORY 13 — MULTI-TENANT ARCHITECTURE BASELINE AUDIT REPORT\n\n`;
  md += `**Date:** ${baselineReport.timestamp}  \n`;
  md += `**Repository:** DOC SEARCH Monorepo  \n`;
  md += `**Database Engine:** Native PostgreSQL 18.4 (Port 5432)  \n\n`;

  md += `## 1. Executive Summary\n\n`;
  md += `| Dimension | Metric | Status |\n`;
  md += `| :--- | :---: | :--- |\n`;
  md += `| **Database Tables with Tenant ID** | ${baselineReport.summary.tablesWithTenantId} | Cataloged |\n`;
  md += `| **Database Tables with Branch ID** | ${baselineReport.summary.tablesWithBranchId} | Scoped |\n`;
  md += `| **Tenant Foreign Key Constraints** | ${baselineReport.summary.foreignKeysOnTenant} | Referential Integrity |\n`;
  md += `| **Tenant Indexes** | ${baselineReport.summary.indexesOnTenant} | Query Performance & Isolation |\n`;
  md += `| **Registered Database Tenants** | ${baselineReport.summary.tenantsInDatabase} | Discovered |\n`;
  md += `| **Total API Endpoints Audited** | ${baselineReport.summary.totalEndpoints} | Inventory Complete |\n`;
  md += `| **Repository Unscoped Query Risks (IDOR)** | ${baselineReport.summary.repoIdorRisks} | Scrutiny Required |\n`;
  md += `| **Service Hardcoded Tenant Fallbacks** | ${baselineReport.summary.serviceTenantFallbacks} | Action Required |\n`;
  md += `| **Routes with Hardcoded Fallbacks** | ${baselineReport.summary.routesWithDefaultTenantFallback} | Action Required |\n`;
  md += `| **Frontend LocalStorage Tenant Access** | ${baselineReport.summary.frontendTenantStorageAccess} | Client-Side Storage |\n\n`;

  md += `## 2. Multi-Tenant Architectural Hierarchy\n\n`;
  md += `\`\`\`text\n`;
  md += `COMPANY / HQ (Global, System Admins, Cross-Tenant Analytics)\n`;
  md += `      ↓\n`;
  md += `PARTNER / TENANT (Isolated Tenant Boundary: Hospital, Clinic, Lab, Pharmacy)\n`;
  md += `      ↓\n`;
  md += `BRANCH / OPERATIONAL FACILITY (Facility Scoping, OPD vs IPD vs Diagnostic Centre)\n`;
  md += `      ↓\n`;
  md += `DEPARTMENT (Clinical, Pharmacy, Lab, Radiology, Billing, Administration)\n`;
  md += `      ↓\n`;
  md += `STAFF / ACTOR (Doctor, Nurse, Pharmacist, Lab Tech, Billing Clerk)\n`;
  md += `      ↓\n`;
  md += `TENANT-SCOPED BUSINESS ENTITIES (Patients, Appointments, Encounters, Invoices, Orders)\n`;
  md += `\`\`\`\n\n`;

  md += `## 3. Discovered Tenant Fallbacks & Potential IDOR Risks\n\n`;
  md += `### High-Risk Hardcoded Tenant Fallbacks in Services:\n`;
  for (const fb of serviceAudit.fallbacks) {
    md += `- **\`${fb.file}:${fb.line}\`**: \`${fb.code}\`\n`;
  }

  md += `\n### High-Risk Repository Methods Lacking Tenant Scope:\n`;
  const highRiskRepos = repoAudit.findings.filter(f => f.isHighRisk);
  for (const rf of highRiskRepos.slice(0, 30)) {
    md += `- **\`${rf.file}:${rf.line}\`** -> \`${rf.methodName}(${rf.params})\`\n`;
  }
  if (highRiskRepos.length > 30) {
    md += `- *...and ${highRiskRepos.length - 30} more unscoped methods.*\n`;
  }

  md += `\n## 4. Database Tenant Tables\n\n`;
  const schemaGroups = {};
  for (const col of dbInventory.tenantColumns) {
    schemaGroups[col.table_schema] = schemaGroups[col.table_schema] || [];
    schemaGroups[col.table_schema].push(col.table_name);
  }
  for (const [schema, tbls] of Object.entries(schemaGroups)) {
    md += `### Schema \`${schema}\` (${tbls.length} tables):\n`;
    md += `\`${tbls.join(', ')}\`\n\n`;
  }

  const mdPath = path.join(reportsDir, 'baseline.md');
  fs.writeFileSync(mdPath, md);
  console.log(`[Multi-Tenant Audit] Saved baseline Markdown: ${mdPath}`);

  await pool.end();
  console.log('\n=== MULTI-TENANT BASELINE AUDIT COMPLETE ===');
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
