/**
 * DOC SEARCH — Phase 1 Security Regression Test Suite
 * Validates fail-closed security guarantees and tracks remediation of all Phase 1 forensic findings:
 * - P0-SEC-01: Superuser RLS Bypass Risk
 * - P1-SEC-02: Unauthenticated live-partners information disclosure
 * - P1-SEC-03: Pathologist role exclusion in lab verification guard
 * - P1-SEC-04: Query parameter auth token acceptance
 * - P1-SEC-06: Rate limiting quota bypass via unverified JWT claims
 * - P2-SEC-05: Development offline auth bypass isolation
 * - P2-PRIV-01: Plaintext ABHA logging in ABDM gateway service
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

console.log('================================================================================');
console.log('STARTING PHASE 1 SECURITY REGRESSION TEST HARNESS');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function checkRegression(findingId, description, checkFn) {
  totalTests++;
  process.stdout.write(`[${findingId}] ${description}... `);
  try {
    const status = await checkFn();
    if (status === 'REMEDIATED') {
      console.log('PASS (REMEDIATED & VERIFIED)');
      passedTests++;
    } else {
      console.log('OPEN (CONFIRMED DEFECT / UNREMEDIATED)');
      failedTests++;
    }
  } catch (err) {
    console.log('ERROR IN TEST HARNESS');
    console.error(err);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// Check 1: P0-SEC-01 (Superuser RLS Bypass Risk)
// -----------------------------------------------------------------------------
await checkRegression('P0-SEC-01', 'Database connection string connects via least-privilege docsearch_app', async () => {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) return 'OPEN';
  const content = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = content.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (!dbUrlMatch) return 'OPEN';
  const dbUrl = dbUrlMatch[1];
  
  // If connecting as postgres (superuser), finding is OPEN
  if (dbUrl.includes('://postgres:') || dbUrl.includes('@postgres:')) {
    return 'OPEN';
  }
  if (dbUrl.includes('://docsearch_app:')) {
    return 'REMEDIATED';
  }
  return 'OPEN';
});

// -----------------------------------------------------------------------------
// Check 2: P1-SEC-02 (Unauthenticated live-partners Route)
// -----------------------------------------------------------------------------
await checkRegression('P1-SEC-02', 'GET /api/v1/auth/live-partners is protected by authenticate preHandler', async () => {
  const authRoutesPath = path.join(ROOT_DIR, 'apps/api-gateway/src/routes/auth.routes.ts');
  const code = fs.readFileSync(authRoutesPath, 'utf8');

  // Verify that live-partners uses [authenticate] and NOT [optionalAuthenticate]
  const isGuarded = code.includes("'/api/v1/auth/live-partners', { preHandler: [authenticate") ||
                    code.includes("'/api/v1/auth/live-partners', { preHandler: [authenticate,");
  const isOptional = code.includes("'/api/v1/auth/live-partners', { preHandler: [optionalAuthenticate]");

  if (isGuarded && !isOptional) {
    return 'REMEDIATED';
  }
  return 'OPEN';
});

// -----------------------------------------------------------------------------
// Check 3: P1-SEC-03 (Pathologist Role Exclusion)
// -----------------------------------------------------------------------------
await checkRegression('P1-SEC-03', 'PATHOLOGIST role included in PATHOLOGIST_ROLES array', async () => {
  const labRoutesPath = path.join(ROOT_DIR, 'apps/api-gateway/src/routes/partner/lab-diagnostics.routes.ts');
  const code = fs.readFileSync(labRoutesPath, 'utf8');

  const match = code.match(/const\s+PATHOLOGIST_ROLES\s*=\s*\[([^\]]+)\]/);
  if (!match) return 'OPEN';
  const roles = match[1];

  if (roles.includes("'PATHOLOGIST'") || roles.includes('"PATHOLOGIST"')) {
    return 'REMEDIATED';
  }
  return 'OPEN';
});

// -----------------------------------------------------------------------------
// Check 4: P1-SEC-04 (Query Parameter Auth Token Acceptance)
// -----------------------------------------------------------------------------
await checkRegression('P1-SEC-04', 'Query parameter token (?token=) extraction removed from core auth guard', async () => {
  const authGuardPath = path.join(ROOT_DIR, 'apps/api-gateway/src/plugins/auth-guard.ts');
  const code = fs.readFileSync(authGuardPath, 'utf8');

  const hasQueryToken = code.includes('(request.query as any)?.token') || code.includes('request.query.token');
  if (!hasQueryToken) {
    return 'REMEDIATED';
  }
  return 'OPEN';
});

// -----------------------------------------------------------------------------
// Check 5: P1-SEC-06 (Rate Limiting Quota Bypass via Unverified Token)
// -----------------------------------------------------------------------------
await checkRegression('P1-SEC-06', 'Rate limiter only grants elevated quota to verified sessions', async () => {
  const securityPath = path.join(ROOT_DIR, 'apps/api-gateway/src/plugins/security.ts');
  const code = fs.readFileSync(securityPath, 'utf8');

  // If max() checks Boolean(extractAuthTokenFromRequest(request)) without session verification, it's vulnerable
  const hasUnverifiedTokenCheck = code.includes('Boolean(extractAuthTokenFromRequest(request))');
  if (!hasUnverifiedTokenCheck) {
    return 'REMEDIATED';
  }
  return 'OPEN';
});

// -----------------------------------------------------------------------------
// Check 6: P2-SEC-05 (Development Offline Auth Bypass in AuthGuard)
// -----------------------------------------------------------------------------
await checkRegression('P2-SEC-05', 'Core auth guard isolates offline tokens from production bundle', async () => {
  const authGuardPath = path.join(ROOT_DIR, 'apps/api-gateway/src/plugins/auth-guard.ts');
  const code = fs.readFileSync(authGuardPath, 'utf8');

  const hasHardcodedOfflineMock = code.includes("token.startsWith('offline.')");
  if (!hasHardcodedOfflineMock) {
    return 'REMEDIATED';
  }
  return 'OPEN';
});

// -----------------------------------------------------------------------------
// Check 7: P2-PRIV-01 (Unmasked ABHA in Logs)
// -----------------------------------------------------------------------------
await checkRegression('P2-PRIV-01', 'ABHA number masked before logging in AbdmGatewayService', async () => {
  const abdmPath = path.join(ROOT_DIR, 'apps/api-gateway/src/services/partner/AbdmGatewayService.ts');
  const code = fs.readFileSync(abdmPath, 'utf8');

  const hasPlaintextLog = code.includes('via Live NHA Gateway (${abhaNumber})');
  if (!hasPlaintextLog) {
    return 'REMEDIATED';
  }
  return 'OPEN';
});

console.log('\n================================================================================');
console.log(`PHASE 1 REGRESSION TEST SUMMARY: ${passedTests} REMEDIATED, ${failedTests} OPEN DEFECTS (TOTAL: ${totalTests})`);
console.log('================================================================================\n');
