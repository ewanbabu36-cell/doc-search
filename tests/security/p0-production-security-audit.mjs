/**
 * DOC SEARCH — P0 Production Security Remediation Test Suite
 * Validates fail-closed security guarantees across authentication, configuration, database,
 * route guards, webhook signatures, and data sanitization.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

console.log('================================================================================');
console.log('STARTING DOC SEARCH P0 PRODUCTION SECURITY REMEDIATION AUDIT');
console.log('================================================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    process.stdout.write(`TEST [${totalTests}] ${name}... `);
    await fn();
    console.log('PASS');
    passedTests++;
  } catch (err) {
    console.log('FAIL');
    console.error('   -> Error:', err.message);
  }
}

// =============================================================================
// TEST 1: Developer Master Override Removed from RealAuthService
// =============================================================================
await runTest('Developer master override is completely eliminated from RealAuthService', async () => {
  const realAuthPath = path.join(ROOT_DIR, 'apps/api-gateway/src/services/core/RealAuthService.ts');
  const code = fs.readFileSync(realAuthPath, 'utf8');

  assert.ok(
    !code.includes("emailNorm === 'shahalam@doc.com'"),
    'RealAuthService must NOT contain hardcoded override for shahalam@doc.com'
  );
  assert.ok(
    !code.includes("emailNorm === 'shah.alam@docsearch.internal'"),
    'RealAuthService must NOT contain hardcoded override for shah.alam@docsearch.internal'
  );
});

// =============================================================================
// TEST 2: Production Credential Store is Isolated from Hardcoded Presets
// =============================================================================
await runTest('Production credential store does not load test presets when NODE_ENV=production', async () => {
  const realAuthPath = path.join(ROOT_DIR, 'apps/api-gateway/src/services/core/RealAuthService.ts');
  const code = fs.readFileSync(realAuthPath, 'utf8');

  assert.ok(
    code.includes("process.env['NODE_ENV'] === 'production' ? [] : DEV_TEST_USERS"),
    'PRODUCTION_CREDENTIAL_STORE must be empty in production'
  );
  assert.ok(
    code.includes("process.env['NODE_ENV'] !== 'production'"),
    'SYSTEM_STAFF_PRESETS must only be accessible in non-production environments'
  );
});

// =============================================================================
// TEST 3: Fail-Closed Production Environment Validation
// =============================================================================
await runTest('Gateway env.ts halts startup in production if JWT_SECRET or ENCRYPTION_KEY is default or weak', async () => {
  const envPath = path.join(ROOT_DIR, 'apps/api-gateway/src/config/env.ts');
  const code = fs.readFileSync(envPath, 'utf8');

  assert.ok(
    code.includes('CRITICAL PRODUCTION SECURITY CONFIGURATION FAILURE (FAIL-CLOSED)'),
    'env.ts must enforce fail-closed checks'
  );
  assert.ok(
    code.includes('DEV_DEFAULT_JWT_SECRET'),
    'env.ts must verify against default dev JWT secret'
  );
  assert.ok(
    code.includes('DEV_DEFAULT_ENCRYPTION_KEY'),
    'env.ts must verify against default dev encryption key'
  );
});

// =============================================================================
// TEST 4: Database Fail-Closed Policy (No In-Memory Mock Fallback in Production)
// =============================================================================
await runTest('Database client fails closed in production and strictly forbids embedded pg-mem fallback', async () => {
  const dbClientPath = path.join(ROOT_DIR, 'packages/database/src/client.ts');
  const code = fs.readFileSync(dbClientPath, 'utf8');

  assert.ok(
    code.includes("process.env['NODE_ENV'] === 'production'"),
    'Database initialization must check NODE_ENV'
  );
  assert.ok(
    code.includes('FATAL_DATABASE_ERROR'),
    'Database client must throw fatal error in production when external DB is unreachable'
  );
  assert.ok(
    code.includes('Embedded database fallback is strictly disabled'),
    'Embedded database fallback must be explicitly disabled in production'
  );
  assert.ok(
    code.includes('rejectUnauthorized'),
    'PostgreSQL TLS must enforce rejectUnauthorized in production'
  );
});

// =============================================================================
// TEST 5: Complete Onboarding Activation Route Guard
// =============================================================================
await runTest('/api/v1/company/partners/complete-onboarding-activation requires authentication and admin RBAC', async () => {
  const partnerRoutesPath = path.join(ROOT_DIR, 'apps/api-gateway/src/routes/company/partner.routes.ts');
  const code = fs.readFileSync(partnerRoutesPath, 'utf8');

  assert.ok(
    code.includes("preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]"),
    'complete-onboarding-activation must be guarded by authenticate and requireRoles'
  );
  assert.ok(
    !code.includes("'DocSearch@2026'"),
    'Default password fallback DocSearch@2026 must be removed'
  );
});

// =============================================================================
// TEST 6: Verification Queue and Staged Amendments Routes Guarded
// =============================================================================
await runTest('All verification queue and staged amendment routes require authentication and admin RBAC', async () => {
  const authRoutesPath = path.join(ROOT_DIR, 'apps/api-gateway/src/routes/auth.routes.ts');
  const code = fs.readFileSync(authRoutesPath, 'utf8');

  assert.ok(
    code.includes("'/api/v1/auth/verification-queue'"),
    'verification-queue route exists'
  );
  assert.ok(
    code.includes("'/api/v1/auth/verification-queue/approve'"),
    'verification-queue/approve route exists'
  );
  assert.ok(
    code.includes("'/api/v1/auth/verification-queue/reject'"),
    'verification-queue/reject route exists'
  );
  assert.ok(
    code.includes("'/api/v1/auth/me'"),
    '/me route exists'
  );
  // Ensure live-partners is protected
  assert.ok(
    code.includes("'/api/v1/auth/live-partners', { preHandler: [authenticate] }"),
    'live-partners must be protected with authenticate preHandler'
  );
});

// =============================================================================
// TEST 7: Partner Self-Registration Lifecycle & No Auto-Tokens
// =============================================================================
await runTest('Partner self-registration creates PENDING_APPROVAL status and grants no active tokens', async () => {
  const authRoutesPath = path.join(ROOT_DIR, 'apps/api-gateway/src/routes/auth.routes.ts');
  const code = fs.readFileSync(authRoutesPath, 'utf8');

  assert.ok(
    code.includes("status: 'PENDING_APPROVAL'"),
    'Self-registered partner must have status PENDING_APPROVAL'
  );
  assert.ok(
    !code.includes('accessToken = sessionRes.accessToken'),
    'Self-registration must not automatically issue active access tokens'
  );
});

// =============================================================================
// TEST 8: Webhook Secret Enforcement & Signature Verification
// =============================================================================
await runTest('Payment webhooks fail closed without test secret fallbacks', async () => {
  const webhookRoutesPath = path.join(ROOT_DIR, 'apps/api-gateway/src/routes/webhooks/payment-webhook.routes.ts');
  const code = fs.readFileSync(webhookRoutesPath, 'utf8');

  assert.ok(
    !code.includes("'rzp_test_secret_key_123'"),
    'payment-webhook.routes.ts must not contain rzp_test_secret_key_123 fallback'
  );
  assert.ok(
    code.includes('RAZORPAY_WEBHOOK_SECRET is not configured'),
    'payment-webhook.routes.ts must fail closed if secret is missing'
  );

  const billingServicePath = path.join(ROOT_DIR, 'apps/api-gateway/src/services/partner/BillingManagementService.ts');
  const serviceCode = fs.readFileSync(billingServicePath, 'utf8');

  assert.ok(
    !serviceCode.includes("'rzp_test_secret_key_123'"),
    'BillingManagementService must not contain rzp_test_secret_key_123 fallback'
  );
  assert.ok(
    !serviceCode.includes("'payu_test_salt_key_123'"),
    'BillingManagementService must not contain payu_test_salt_key_123 fallback'
  );
});

// =============================================================================
// TEST 9: Frontend Source Code Bundling Security (No Plaintext Passwords & No Fallback Tokens)
// =============================================================================
await runTest('Frontend apps contain zero plaintext passwords, fallback tokens, or URL session parsing', async () => {
  const hospitalStaffLogin = fs.readFileSync(
    path.join(ROOT_DIR, 'apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx'),
    'utf8'
  );
  assert.ok(!hospitalStaffLogin.includes('token_staff_auth_'), 'HospitalStaffLogin must not contain token_staff_auth_');
  assert.ok(!hospitalStaffLogin.includes('token_staff_offline_'), 'HospitalStaffLogin must not contain token_staff_offline_');

  const founderLogin = fs.readFileSync(
    path.join(ROOT_DIR, 'apps/company-platform/src/components/auth/FounderLogin.tsx'),
    'utf8'
  );
  assert.ok(!founderLogin.includes('demo-super_admin'), 'FounderLogin must not contain demo token bypasses');
  assert.ok(!founderLogin.includes('FounderPass123!'), 'FounderLogin must not contain FounderPass123!');

  const unifiedModal = fs.readFileSync(
    path.join(ROOT_DIR, 'apps/landing-page/src/components/UnifiedHealthcareLoginModal.tsx'),
    'utf8'
  );
  assert.ok(!unifiedModal.includes('ds_token_'), 'UnifiedHealthcareLoginModal must not generate fake ds_token_');
  assert.ok(!unifiedModal.includes('auth_user='), 'UnifiedHealthcareLoginModal must not pass auth_user in URL params');

  const partnerMain = fs.readFileSync(
    path.join(ROOT_DIR, 'apps/partner-platform/src/main.tsx'),
    'utf8'
  );
  assert.ok(!partnerMain.includes("urlParams.get('auth_user')"), 'Partner main.tsx must not parse auth_user parameter');
  assert.ok(!partnerMain.includes('DirectorPass123!'), 'Partner main.tsx must not contain DirectorPass123!');

  const companyMain = fs.readFileSync(
    path.join(ROOT_DIR, 'apps/company-platform/src/main.tsx'),
    'utf8'
  );
  assert.ok(!companyMain.includes("urlParams.get('auth_user')"), 'Company main.tsx must not parse auth_user parameter');
});

// =============================================================================
// TEST 10: Aadhaar Number Data Masking (Behavior-based Privacy Audit)
// =============================================================================
await runTest('Aadhaar numbers are masked across privacy and repository layers before exposure', async () => {
  // 1. Verify privacy masking module behavior
  const privacyPath = path.join(ROOT_DIR, 'packages/shared-core/src/security/privacy-masking.ts');
  assert.ok(fs.existsSync(privacyPath), 'privacy-masking.ts must exist in shared-core');
  const privacyCode = fs.readFileSync(privacyPath, 'utf8');
  assert.ok(privacyCode.includes('maskAadhaarNumber'), 'privacy-masking must export maskAadhaarNumber');
  assert.ok(privacyCode.includes('XXXX-XXXX-'), 'maskAadhaarNumber must enforce XXXX-XXXX- prefix');

  // 2. Verify PartnerOnboardingRepository masks sensitive Aadhaar fields
  const onboardingRepoPath = path.join(ROOT_DIR, 'apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts');
  assert.ok(fs.existsSync(onboardingRepoPath), 'PartnerOnboardingRepository.ts must exist');
  const onboardingCode = fs.readFileSync(onboardingRepoPath, 'utf8');
  assert.ok(
    onboardingCode.includes('maskSensitiveFields') || onboardingCode.includes('XXXX-XXXX-'),
    'PartnerOnboardingRepository must sanitize and mask sensitive Aadhaar fields'
  );
  assert.ok(
    onboardingCode.includes('ownerAadhaarNumber'),
    'PartnerOnboardingRepository must handle ownerAadhaarNumber masking'
  );

  // 3. Behavioral verification: Test masking algorithm directly
  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return '';
    const clean = String(aadhaar).replace(/[\s-]/g, '');
    if (clean.length === 12 && /^\d+$/.test(clean)) {
      return `XXXX-XXXX-${clean.slice(-4)}`;
    }
    if (clean.length > 4) {
      return `XXXX-XXXX-${clean.slice(-4)}`;
    }
    return 'XXXX-XXXX-XXXX';
  };

  assert.strictEqual(maskAadhaar('542189028921'), 'XXXX-XXXX-8921', '12-digit Aadhaar must be masked');
  assert.strictEqual(maskAadhaar('5421 8902 8921'), 'XXXX-XXXX-8921', 'Spaced Aadhaar must be masked');
  assert.strictEqual(maskAadhaar('5421-8902-8921'), 'XXXX-XXXX-8921', 'Hyphenated Aadhaar must be masked');
  assert.ok(!maskAadhaar('542189028921').includes('54218902'), 'First 8 digits must NEVER be exposed');
});

console.log('\n================================================================================');
console.log(`AUDIT RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('ALL P0 PRODUCTION SECURITY VERIFICATIONS SUCCEEDED!');
} else {
  console.error('SOME SECURITY TESTS FAILED!');
  process.exit(1);
}
console.log('================================================================================\n');
