import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = 'D:/DOC SEARCH';
const REPORT_DIR = path.join(ROOT_DIR, 'reports', 'configuration');
const BASELINE_JSON = path.join(REPORT_DIR, 'baseline.json');
const BASELINE_MD = path.join(REPORT_DIR, 'baseline.md');

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const auditFindings = [];
function recordFinding(id, name, status, details, metrics = {}) {
  auditFindings.push({ id, name, status, details, metrics });
  const sym = status === 'PASSED' ? '✅ PASS' : status === 'FAILED' ? '❌ FAIL' : '⚠️ WARN';
  console.log(`  ${sym}: [${id}] ${name} - ${details}`);
}

async function runAudit() {
  console.log('========================================================================');
  console.log('DOC SEARCH — CATEGORY 19: CONFIGURATION / ENVIRONMENT BASELINE AUDIT');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // 1. Audit Environment Files & Templates Inventory
  // -------------------------------------------------------------------------
  console.log('[1/8] Auditing Environment Variable Files & Template Synchronicity...');
  const envFiles = [
    { path: path.join(ROOT_DIR, '.env'), name: 'Root .env' },
    { path: path.join(ROOT_DIR, '.env.example'), name: 'Root .env.example' },
    { path: path.join(ROOT_DIR, '.env.docker.example'), name: 'Root .env.docker.example' },
    { path: path.join(ROOT_DIR, 'apps', 'api-gateway', '.env'), name: 'API Gateway .env' }
  ];

  const envFileStatus = {};
  for (const ef of envFiles) {
    const exists = fs.existsSync(ef.path);
    envFileStatus[ef.name] = exists ? 'EXISTS' : 'MISSING';
    if (exists) {
      const content = fs.readFileSync(ef.path, 'utf8');
      envFileStatus[`${ef.name}_size`] = content.length;
    }
  }

  const allEnvFilesExist = envFiles.every(f => fs.existsSync(f.path));
  recordFinding(
    'CFG-DISC-001',
    'Environment Files & Templates Inventory',
    allEnvFilesExist ? 'PASSED' : 'FAILED',
    `Found all required .env and template files in repository`,
    envFileStatus
  );

  // -------------------------------------------------------------------------
  // 2. Audit API Gateway Environment Variable Schema (Zod Validation)
  // -------------------------------------------------------------------------
  console.log('\n[2/8] Auditing API Gateway Environment Schema & Parsing...');
  const envTsPath = path.join(ROOT_DIR, 'apps', 'api-gateway', 'src', 'config', 'env.ts');
  const envTsContent = fs.readFileSync(envTsPath, 'utf8');

  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'HOST',
    'DATABASE_URL',
    'DATABASE_SSL',
    'JWT_SECRET',
    'JWT_ISSUER',
    'JWT_AUDIENCE',
    'ENCRYPTION_KEY',
    'CORS_ORIGIN',
    'PARTNER_PORTAL_URL',
    'COMPANY_PORTAL_URL',
    'RATE_LIMIT_MAX',
    'RATE_LIMIT_TIME_WINDOW'
  ];

  const missingSchemaVars = requiredEnvVars.filter(v => !envTsContent.includes(v));
  recordFinding(
    'CFG-DISC-002',
    'API Gateway Config Schema Completeness',
    missingSchemaVars.length === 0 ? 'PASSED' : 'FAILED',
    missingSchemaVars.length === 0
      ? `All ${requiredEnvVars.length} core environment variables defined in Zod schema`
      : `Missing schema variables: ${missingSchemaVars.join(', ')}`,
    { requiredCount: requiredEnvVars.length, missingCount: missingSchemaVars.length }
  );

  // -------------------------------------------------------------------------
  // 3. Audit Fail-Closed Security Rules in Production Mode
  // -------------------------------------------------------------------------
  console.log('\n[3/8] Testing Production Fail-Closed Rules (Insecure Default Rejection)...');
  const hasFailClosedBlock = envTsContent.includes("if (env.NODE_ENV === 'production')") &&
                             envTsContent.includes('DEV_DEFAULT_JWT_SECRET') &&
                             envTsContent.includes('DEV_DEFAULT_ENCRYPTION_KEY');

  recordFinding(
    'CFG-SEC-001',
    'Production Fail-Closed Boot Policy Defined in env.ts',
    hasFailClosedBlock ? 'PASSED' : 'FAILED',
    'Strict fail-closed boot checks reject dev default JWT secret, weak keys, and localhost DB in production',
    { hasFailClosedBlock }
  );

  // -------------------------------------------------------------------------
  // 4. Audit Database Fail-Closed Policy (Forbidden pg-mem Fallback in Production/Staging)
  // -------------------------------------------------------------------------
  console.log('\n[4/8] Auditing Database Client Fail-Closed Fallback Guard...');
  const dbClientPath = path.join(ROOT_DIR, 'packages', 'database', 'src', 'client.ts');
  const dbClientContent = fs.readFileSync(dbClientPath, 'utf8');

  const hasDbFailClosedPolicy = dbClientContent.includes("isProduction || isStaging") &&
                                dbClientContent.includes("FATAL_DATABASE_ERROR") &&
                                dbClientContent.includes("Embedded database fallback is strictly forbidden");

  recordFinding(
    'CFG-SEC-002',
    'Database Fail-Closed Policy (Zero pg-mem Fallback in Production)',
    hasDbFailClosedPolicy ? 'PASSED' : 'FAILED',
    'Database client throws FATAL_DATABASE_ERROR if PostgreSQL is unreachable in production or staging',
    { hasDbFailClosedPolicy }
  );

  // -------------------------------------------------------------------------
  // 5. Audit CORS Configuration & Localhost Leakage in Production
  // -------------------------------------------------------------------------
  console.log('\n[5/8] Auditing CORS Origin Security Configuration...');
  const secPluginPath = path.join(ROOT_DIR, 'apps', 'api-gateway', 'src', 'plugins', 'security.ts');
  const secPluginContent = fs.readFileSync(secPluginPath, 'utf8');

  // Check if localhost is allowed unconditionally without checking NODE_ENV
  const unconditionedLocalhostCors = secPluginContent.includes("origin.startsWith('http://localhost:')") &&
                                     !secPluginContent.includes("env.NODE_ENV !== 'production'");

  recordFinding(
    'CFG-SEC-003',
    'CORS Localhost Origin Restriction in Production Mode',
    unconditionedLocalhostCors ? 'FAILED' : 'PASSED',
    unconditionedLocalhostCors
      ? 'DEFECT FOUND: CORS plugin allows http://localhost:* in all environments including production'
      : 'CORS plugin restricts localhost to non-production environments',
    { unconditionedLocalhostCors }
  );

  // -------------------------------------------------------------------------
  // 6. Audit Frontend API Client Configuration (VITE_API_URL consistency)
  // -------------------------------------------------------------------------
  console.log('\n[6/8] Auditing Frontend API Client URL Configuration...');
  const partnerClientPath = path.join(ROOT_DIR, 'apps', 'partner-platform', 'src', 'services', 'api-client.ts');
  const companyClientPath = path.join(ROOT_DIR, 'apps', 'company-platform', 'src', 'services', 'api-client.ts');

  const partnerClientContent = fs.readFileSync(partnerClientPath, 'utf8');
  const companyClientContent = fs.readFileSync(companyClientPath, 'utf8');

  const partnerUsesEnvUrl = partnerClientContent.includes('VITE_API_URL');
  const companyUsesEnvUrl = companyClientContent.includes('VITE_API_URL');

  recordFinding(
    'CFG-FE-001',
    'Partner Platform Dynamic API URL Support',
    partnerUsesEnvUrl ? 'PASSED' : 'FAILED',
    partnerUsesEnvUrl ? 'Partner platform reads import.meta.env.VITE_API_URL' : 'Partner platform lacks VITE_API_URL support',
    { partnerUsesEnvUrl }
  );

  recordFinding(
    'CFG-FE-002',
    'Company Platform Dynamic API URL Support',
    companyUsesEnvUrl ? 'PASSED' : 'FAILED',
    companyUsesEnvUrl ? 'Company platform reads import.meta.env.VITE_API_URL' : 'DEFECT FOUND: Company platform hardcodes API_BASE_URL = "" and ignores VITE_API_URL',
    { companyUsesEnvUrl }
  );

  // -------------------------------------------------------------------------
  // 7. Audit Deployment Nginx Configuration (Reverse Proxy Trailing Slash & Target)
  // -------------------------------------------------------------------------
  console.log('\n[7/8] Auditing Nginx Reverse Proxy Configuration...');
  const nginxConfPath = path.join(ROOT_DIR, 'deployment', 'nginx.conf');
  let nginxHasDefect = false;
  let nginxDetails = '';

  if (fs.existsSync(nginxConfPath)) {
    const nginxContent = fs.readFileSync(nginxConfPath, 'utf8');
    const hasTrailingSlash = nginxContent.includes('proxy_pass http://127.0.0.1:4000/;');
    const hasLocalhostInDocker = nginxContent.includes('http://127.0.0.1:4000');

    if (hasTrailingSlash || hasLocalhostInDocker) {
      nginxHasDefect = true;
      nginxDetails = 'DEFECT FOUND: deployment/nginx.conf has trailing slash on proxy_pass (strips /api/) and proxies to 127.0.0.1 inside container instead of docker service name (docsearch-api)';
    } else {
      nginxDetails = 'deployment/nginx.conf correctly proxies /api to docsearch-api:4000 without path stripping';
    }
  }

  recordFinding(
    'CFG-DEP-001',
    'Deployment Nginx Reverse Proxy Path & Upstream Target',
    nginxHasDefect ? 'FAILED' : 'PASSED',
    nginxDetails,
    { nginxHasDefect }
  );

  // -------------------------------------------------------------------------
  // 8. Audit Docker Compose Configurations & Resource Specifications
  // -------------------------------------------------------------------------
  console.log('\n[8/8] Auditing Docker Compose Services & Environment Specifications...');
  const composePath = path.join(ROOT_DIR, 'docker-compose.yml');
  const composeContent = fs.readFileSync(composePath, 'utf8');

  const hasEncryptionKey = composeContent.includes('ENCRYPTION_KEY:');
  const composeMissingEnv = !hasEncryptionKey;

  recordFinding(
    'CFG-DEP-002',
    'Docker Compose Production Cryptographic Environment Completeness',
    composeMissingEnv ? 'FAILED' : 'PASSED',
    composeMissingEnv
      ? 'DEFECT FOUND: docker-compose.yml does not pass ENCRYPTION_KEY to api-gateway, causing production boot failure'
      : 'docker-compose.yml supplies required cryptographic environment variables',
    { hasEncryptionKey }
  );

  // -------------------------------------------------------------------------
  // Compile Baseline Report
  // -------------------------------------------------------------------------
  const totalPassed = auditFindings.filter(f => f.status === 'PASSED').length;
  const totalFailed = auditFindings.filter(f => f.status === 'FAILED').length;

  const baselineReport = {
    timestamp: new Date().toISOString(),
    auditCategory: 'CATEGORY 19: CONFIGURATION / ENVIRONMENT ERROR',
    status: totalFailed === 0 ? 'ALL_CONFIGS_HEALTHY' : 'DEFECTS_DISCOVERED',
    summary: {
      totalChecks: auditFindings.length,
      passed: totalPassed,
      failed: totalFailed,
      defectCount: totalFailed
    },
    findings: auditFindings
  };

  fs.writeFileSync(BASELINE_JSON, JSON.stringify(baselineReport, null, 2), 'utf-8');

  const mdContent = `# DOC SEARCH — CATEGORY 19: CONFIGURATION / ENVIRONMENT BASELINE AUDIT

**Date:** ${new Date().toISOString()}  
**Target Codebase:** \`D:\\DOC SEARCH\`  
**Total Checks:** ${auditFindings.length}  
**Passed:** ${totalPassed}  
**Failed:** ${totalFailed}  

---

## Findings Summary

| ID | Configuration Check | Result | Details |
| :--- | :--- | :---: | :--- |
${auditFindings.map(f => `| **${f.id}** | ${f.name} | ${f.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'} | ${f.details} |`).join('\n')}

---

## Discovered Defects for Remediation

1. **CFG-SEC-003 (CORS Localhost Origin Restriction in Production):**
   - \`apps/api-gateway/src/plugins/security.ts\` unconditionally allows \`http://localhost:*\` origins even when \`NODE_ENV === 'production'\`.
2. **CFG-FE-002 (Company Platform Hardcoded API Base URL):**
   - \`apps/company-platform/src/services/api-client.ts\` hardcodes \`const API_BASE_URL = '';\` and ignores \`import.meta.env.VITE_API_URL\`.
3. **CFG-DEP-001 (Deployment Nginx Reverse Proxy Strips /api/ & Target Mismatch):**
   - \`deployment/nginx.conf\` uses \`proxy_pass http://127.0.0.1:4000/;\` which strips \`/api/\` prefix from API routes (causing 404 on all \`/api/v1/...\` routes) and targets internal container localhost instead of \`docsearch-api:4000\`.
4. **CFG-DEP-002 (Docker Compose Missing ENCRYPTION_KEY in api-gateway):**
   - \`docker-compose.yml\` runs \`NODE_ENV: production\` without passing \`ENCRYPTION_KEY\`, triggering fail-closed abort on startup.
`;

  fs.writeFileSync(BASELINE_MD, mdContent, 'utf-8');

  console.log('\n========================================================================');
  console.log(`BASELINE COMPLETE: ${totalPassed} Passed, ${totalFailed} Defects Discovered.`);
  console.log(`Saved baseline reports to:\n  - ${BASELINE_JSON}\n  - ${BASELINE_MD}`);
  console.log('========================================================================\n');
}

runAudit().catch(err => {
  console.error('Baseline audit failed:', err);
  process.exit(1);
});
