import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const REPORTS_DIR = path.join(REPO_ROOT, 'reports', 'authentication');

fs.mkdirSync(REPORTS_DIR, { recursive: true });

function walk(dir, extFilter = ['.ts', '.tsx', '.js', '.mjs']) {
  const results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (item === 'node_modules' || item === '.git' || item === 'dist') continue;
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...walk(fullPath, extFilter));
      } else if (extFilter.some(ext => item.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

function scanFile(filePath, regex) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        match: match[0],
        line: content.substring(0, match.index).split('\n').length
      });
    }
    return matches;
  } catch {
    return [];
  }
}

async function main() {
  console.log('=== DOC SEARCH CATEGORY 11: AUTHENTICATION BASELINE AUDIT ===');
  console.log(`Root: ${REPO_ROOT}`);

  const allSourceFiles = [
    ...walk(path.join(REPO_ROOT, 'apps', 'api-gateway', 'src')),
    ...walk(path.join(REPO_ROOT, 'apps', 'partner-platform', 'src')),
    ...walk(path.join(REPO_ROOT, 'apps', 'company-platform', 'src')),
    ...walk(path.join(REPO_ROOT, 'apps', 'landing-page', 'src')),
    ...walk(path.join(REPO_ROOT, 'packages', 'auth', 'src')),
    ...walk(path.join(REPO_ROOT, 'packages', 'database', 'src'))
  ];

  // 1. Auth Providers & Endpoints Inventory
  const loginEndpoints = [
    { method: 'POST', path: '/api/v1/auth/login', file: 'apps/api-gateway/src/routes/auth.routes.ts', handler: 'realAuthService.authenticateUser' },
    { method: 'POST', path: '/api/v1/auth/quick-session', file: 'apps/api-gateway/src/routes/auth.routes.ts', handler: 'sessionService.createSession (requires verified JWT header, disabled in prod)' }
  ];

  const logoutEndpoints = [
    { method: 'POST', path: '/api/v1/auth/logout', file: 'apps/api-gateway/src/routes/auth.routes.ts', handler: 'EMPTY_STUB (Does not revoke session or token!)' }
  ];

  const refreshEndpoints = [
    { method: 'POST', path: '/api/v1/auth/refresh', file: 'apps/api-gateway/src/routes/auth.routes.ts', handler: 'sessionService.rotateRefreshToken' }
  ];

  const registrationEndpoints = [
    { method: 'POST', path: '/api/v1/auth/register-partner-user', file: 'apps/api-gateway/src/routes/auth.routes.ts', handler: 'realAuthService.registerPartnerUserCredential' },
    { method: 'POST', path: '/api/v1/auth/self-register', file: 'apps/api-gateway/src/routes/auth.routes.ts', handler: 'partnerOnboardingRepository.createStagedRegistration' },
    { method: 'POST', path: '/api/v1/auth/demo-request', file: 'apps/api-gateway/src/routes/auth.routes.ts', handler: 'Public demo request' }
  ];

  const passwordEndpoints = [
    { method: 'POST', path: '/api/v1/auth/change-password', file: 'apps/api-gateway/src/routes/auth.routes.ts', handler: 'realAuthService.changePassword' },
    { method: 'POST', path: '/api/v1/company/partner-access-control/:partnerId/reset-password', file: 'apps/api-gateway/src/routes/company/partner-access-control.routes.ts', handler: 'realAuthService.resetPartnerPassword' }
  ];

  // 2. Auth Database Tables
  const authDatabaseTables = [
    { table: 'core.users', file: 'packages/database/src/schema/core/users.ts', description: 'Authoritative user identities (email, name, status, metadata)' },
    { table: 'core.user_credentials', file: 'packages/database/src/schema/core/credentials.ts', description: 'Cryptographic scrypt password hashes and failed attempt locks' },
    { table: 'core.sessions', file: 'packages/database/src/schema/core/sessions.ts', description: 'Server-persisted session records with refresh token hashes and expiry' },
    { table: 'core.revocations', file: 'packages/database/src/schema/core/revocations.ts', description: 'Append-only revocation ledger for users, tenants, branches, and sessions' },
    { table: 'core.roles', file: 'packages/database/src/schema/core/roles.ts', description: 'Role definitions and permissions' },
    { table: 'core.memberships', file: 'packages/database/src/schema/core/memberships.ts', description: 'User-tenant membership mappings and roles' },
    { table: 'clinical.operational_staff', file: 'packages/database/src/schema/clinical/staff.ts', description: 'Staff credentials and role profiles' }
  ];

  // 3. Scan for Hardcoded Credentials & Test Users in Source
  console.log('[1/4] Scanning for hardcoded credentials, test accounts, and bypasses...');
  const suspiciousBypasses = [];
  const hardcodedCredentials = [];

  for (const file of allSourceFiles) {
    const relPath = path.relative(REPO_ROOT, file).replace(/\\/g, '/');

    // Hardcoded password patterns
    const passMatches = scanFile(file, /(passwordHash:\s*hashPassword\(['"][^'"]+['"]\)|defaultPassword\s*=\s*['"][^'"]+['"]|password:\s*['"](DoctorPass123!|FounderPass123!|PharmaPass123!|Hospital@2026!|123456)['"])/g);
    for (const m of passMatches) {
      hardcodedCredentials.push({
        file: relPath,
        line: m.line,
        match: m.match.slice(0, 80)
      });
    }

    // Bypass patterns
    const bypassMatches = scanFile(file, /(BYPASS_AUTH|SKIP_AUTH|DISABLE_AUTH|MOCK_AUTH|x-test-bypass|quick-session)/gi);
    for (const m of bypassMatches) {
      suspiciousBypasses.push({
        file: relPath,
        line: m.line,
        match: m.match
      });
    }
  }

  // 4. Scan for LocalStorage Auth Authority
  console.log('[2/4] Scanning for frontend localStorage as auth authority...');
  const frontendAuthStoragePatterns = [];
  const frontendFiles = [
    ...walk(path.join(REPO_ROOT, 'apps', 'partner-platform', 'src')),
    ...walk(path.join(REPO_ROOT, 'apps', 'company-platform', 'src')),
    ...walk(path.join(REPO_ROOT, 'apps', 'landing-page', 'src'))
  ];

  for (const file of frontendFiles) {
    const relPath = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
    const storageMatches = scanFile(file, /(localStorage\.getItem\(['"](docsearch_partner_staff|docsearch_custom_staff|docsearch_partner_staff_auth)['"]\))/g);
    for (const m of storageMatches) {
      frontendAuthStoragePatterns.push({
        file: relPath,
        line: m.line,
        match: m.match
      });
    }
  }

  // 5. Build Baseline Findings
  console.log('[3/4] Compiling baseline findings...');
  const knownVulnerabilities = [
    {
      id: 'AUTH-VULN-01',
      taxonomy: 'I. LOGOUT ERROR & J. SESSION REVOCATION ERROR',
      severity: 'CRITICAL',
      title: 'POST /api/v1/auth/logout does not revoke session or token',
      file: 'apps/api-gateway/src/routes/auth.routes.ts:573',
      description: 'The logout route returns a static HTTP 200 without reading the Authorization token, calling sessionRevocationService.revokeSession, or marking the session revoked in core.sessions/core.revocations.'
    },
    {
      id: 'AUTH-VULN-02',
      taxonomy: 'E. TOKEN CREATION ERROR & J. SESSION REVOCATION ERROR',
      severity: 'CRITICAL',
      title: 'JWT jti claim is overwritten with random hex, disconnecting access tokens from sessionId',
      file: 'packages/auth/src/token-service.ts:61',
      description: 'signJwt assigns jti: randomBytes(16).toString("hex") after spreading payload, overriding sessionId passed in payload.jti. Furthermore, SessionRevocationService.isRevoked checks claims.sessionId which is undefined.'
    },
    {
      id: 'AUTH-VULN-03',
      taxonomy: 'H. SESSION PERSISTENCE ERROR & 13. SESSION DATABASE VERIFICATION',
      severity: 'HIGH',
      title: 'SessionService defaults to InMemorySessionStore; core.sessions table is never populated',
      file: 'apps/api-gateway/src/routes/auth.routes.ts:133',
      description: 'When REDIS_URL is not set, SessionService uses InMemorySessionStore. Sessions do not survive server restarts, and core.sessions in PostgreSQL remains with 0 rows.'
    },
    {
      id: 'AUTH-VULN-04',
      taxonomy: 'B. CREDENTIAL VERIFICATION ERROR & N. MOCK AUTHENTICATION',
      severity: 'CRITICAL',
      title: 'HospitalStaffLogin checks localStorage for plaintext staff password before server auth',
      file: 'apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:833-877',
      description: 'HospitalStaffLogin reads docsearch_partner_staff and docsearch_custom_staff from localStorage and authenticates locally if password matches, bypassing server-side credential verification.'
    },
    {
      id: 'AUTH-VULN-05',
      taxonomy: 'G. REFRESH TOKEN ERROR',
      severity: 'HIGH',
      title: 'Frontend login does not store refreshToken in localStorage',
      file: 'apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:1030',
      description: 'HospitalStaffLogin saves accessToken to docsearch_auth_token but fails to save refreshToken to docsearch_refresh_token, preventing ensureAuthToken() from refreshing expired sessions.'
    },
    {
      id: 'AUTH-VULN-06',
      taxonomy: 'J. SESSION REVOCATION ERROR',
      severity: 'MEDIUM',
      title: 'Password change does not revoke existing user sessions',
      file: 'apps/api-gateway/src/services/core/RealAuthService.ts:1091',
      description: 'RealAuthService.changePassword updates passwordHash in memory and DB but does not call sessionRevocationService.revokeUser to invalidate existing tokens issued prior to password change.'
    }
  ];

  const baselineData = {
    timestamp: new Date().toISOString(),
    loginEndpoints,
    logoutEndpoints,
    refreshEndpoints,
    registrationEndpoints,
    passwordEndpoints,
    authDatabaseTables,
    counts: {
      hardcodedCredentialReferences: hardcodedCredentials.length,
      suspiciousBypassReferences: suspiciousBypasses.length,
      frontendAuthStorageReferences: frontendAuthStoragePatterns.length,
      knownVulnerabilities: knownVulnerabilities.length
    },
    knownVulnerabilities,
    hardcodedCredentials: hardcodedCredentials.slice(0, 30),
    suspiciousBypasses: suspiciousBypasses.slice(0, 30),
    frontendAuthStoragePatterns: frontendAuthStoragePatterns.slice(0, 30)
  };

  // Write JSON
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'baseline.json'),
    JSON.stringify(baselineData, null, 2)
  );

  // Write Markdown Report
  const md = `# DOC SEARCH — CATEGORY 11: AUTHENTICATION BASELINE REPORT

**Audit Date:** ${baselineData.timestamp}  
**Auditor:** Antigravity Authentication & Identity Auditor  
**Scope:** Full Monorepo (\`D:\\DOC SEARCH\`)  

---

## 1. Authentication Architecture Inventory

### A. Login & Session Endpoints
| Endpoint | Method | File | Backend Handler |
| :--- | :---: | :--- | :--- |
${loginEndpoints.map(e => `| \`${e.path}\` | \`${e.method}\` | \`${e.file}\` | \`${e.handler}\` |`).join('\n')}

### B. Logout Endpoints
| Endpoint | Method | File | Backend Handler |
| :--- | :---: | :--- | :--- |
${logoutEndpoints.map(e => `| \`${e.path}\` | \`${e.method}\` | \`${e.file}\` | \`${e.handler}\` |`).join('\n')}

### C. Refresh Endpoints
| Endpoint | Method | File | Backend Handler |
| :--- | :---: | :--- | :--- |
${refreshEndpoints.map(e => `| \`${e.path}\` | \`${e.method}\` | \`${e.file}\` | \`${e.handler}\` |`).join('\n')}

### D. Registration & Password Endpoints
| Endpoint | Method | File | Backend Handler |
| :--- | :---: | :--- | :--- |
${registrationEndpoints.map(e => `| \`${e.path}\` | \`${e.method}\` | \`${e.file}\` | \`${e.handler}\` |`).join('\n')}
${passwordEndpoints.map(e => `| \`${e.path}\` | \`${e.method}\` | \`${e.file}\` | \`${e.handler}\` |`).join('\n')}

---

## 2. Authoritative Database Tables
| Table | Schema File | Description |
| :--- | :--- | :--- |
${authDatabaseTables.map(t => `| \`${t.table}\` | \`${t.file}\` | ${t.description} |`).join('\n')}

---

## 3. Discovered Vulnerabilities & Defects

${knownVulnerabilities.map(v => `### ${v.id}: ${v.title}
- **Taxonomy:** ${v.taxonomy}
- **Severity:** \`${v.severity}\`
- **Location:** \`${v.file}\`
- **Description:** ${v.description}
`).join('\n')}

---

## 4. Scan Counts Summary
- **Hardcoded Credential References:** ${baselineData.counts.hardcodedCredentialReferences}
- **Suspicious Bypass References:** ${baselineData.counts.suspiciousBypassReferences}
- **Frontend LocalStorage Auth Authority References:** ${baselineData.counts.frontendAuthStorageReferences}
- **Identified Core Vulnerabilities:** ${baselineData.counts.knownVulnerabilities}
`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'baseline.md'), md);
  console.log('[4/4] Baseline reports written to:');
  console.log(`- ${path.join(REPORTS_DIR, 'baseline.json')}`);
  console.log(`- ${path.join(REPORTS_DIR, 'baseline.md')}`);
}

main().catch(err => {
  console.error('BASELINE SCANNER FAILED:', err);
  process.exit(1);
});
