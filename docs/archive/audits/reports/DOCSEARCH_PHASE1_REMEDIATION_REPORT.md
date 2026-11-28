# DOC SEARCH — Phase 1: Controlled Security Remediation Report
**Document Reference:** `DOCSEARCH_PHASE1_REMEDIATION_REPORT.md`  
**Execution Branch:** `audit/master-forensic-remediation`  
**Standards:** OWASP ASVS 4.0.3, OWASP Top 10, OWASP API Security Top 10, HIPAA Security Rule, India DPDP Act 2023, ABDM  
**Auditor:** Principal Software & Application Security Architecture Team (Antigravity)  
**Date:** November 2026  

---

## 1. Executive Summary

This report documents the forensic remediation and empirical verification of all seven confirmed security defects identified in `DOCSEARCH_PHASE1_DEEP_SECURITY_AUDIT.md`. Every remediation was executed under the non-negotiable safety rules:
1. Business logic was strictly preserved.
2. No destructive SQL was executed.
3. No real patient data was used.
4. RLS policies were maintained and verified under the non-superuser application role.
5. All 7 fixes are validated by automated positive and negative regression test suites.

---

## 2. Granular Defect Remediation Register (All 7 Closed)

### [P0-SEC-01] Superuser Connection String Bypassing PostgreSQL RLS

- **Original Location:** `d:/DOC SEARCH/.env` (`DATABASE_URL`)
- **Root Cause:**
  `DATABASE_URL` connected as the `postgres` superuser (`rolsuper = true`, `rolbypassrls = true`). PostgreSQL explicitly skips RLS evaluation for superusers, negating kernel-level multi-tenant isolation across all 399 RLS-enabled tables.
- **Actual Code Change:**
  - Configured role `docsearch_app` with `NOSUPERUSER, NOBYPASSRLS` and granted table/sequence privileges across all 9 schemas.
  - Updated `d:/DOC SEARCH/.env`:
    ```ini
    # BEFORE:
    DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/docsearch

    # AFTER:
    DATABASE_URL=postgresql://docsearch_app:docsearch_app_secure_pass@127.0.0.1:5432/docsearch
    MIGRATION_DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/docsearch
    ```
- **Security Rationale:**
  Enforces the Principle of Least Privilege (PoLP) and defense-in-depth. Application runtime queries now execute under `docsearch_app` where PostgreSQL kernel enforces RLS policies fail-closed. Privileged DDL migration credentials are isolated to `MIGRATION_DATABASE_URL`.
- **Regression Test:** `packages/database/test/adversarial-two-tenant-rls.test.mjs` & `tests/security/phase1-security-regression.test.mjs`
- **Before/After Test Results:**
  - *Before:* Connects as `postgres`; superuser skips RLS evaluation.
  - *After:* Runtime check returns `{ current_user: 'docsearch_app', rolsuper: false, rolbypassrls: false }`. All 12/12 RLS scenarios passed (100%).
- **Remaining Limitations:** Schema migrations must be invoked using `MIGRATION_DATABASE_URL`.

---

### [P1-SEC-02] Unauthenticated Live Partners Route & Contact PII Disclosure

- **Original Location:** `apps/api-gateway/src/routes/auth.routes.ts:1143-1156`
- **Root Cause:**
  `fastify.get('/api/v1/auth/live-partners', { preHandler: [optionalAuthenticate] })` permitted anonymous access, exposing partner contact names, emails, and phone numbers.
- **Actual Code Change:**
  ```typescript
  // BEFORE:
  fastify.get('/api/v1/auth/live-partners', { preHandler: [optionalAuthenticate] }, async (_request, reply) => {
    const partners = realAuthService.getAllLivePartnerUsers().map((p) => ({
      // ...
      phone: p.phone
    }));
  });

  // AFTER:
  fastify.get('/api/v1/auth/live-partners', { preHandler: [authenticate] }, async (request, reply) => {
    const session = request.session;
    const isCompanyOrSuper = session?.isSuperAdmin || session?.roles?.some(r => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN'].includes(r));
    if (!isCompanyOrSuper) {
      throw new AppError({
        message: 'Access denied: Administrative privileges required to inspect live partners',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const partners = realAuthService.getAllLivePartnerUsers().map((p) => ({
      id: p.id,
      email: p.email,
      name: `${p.firstName} ${p.lastName}`.trim(),
      tenantName: p.tenantName,
      organizationType: p.organizationType,
      planTier: p.planTier,
      planExpiryDate: p.planExpiryDate || '30 days from activation',
      accessibleFeatures: p.accessibleFeatures
    }));
    return reply.status(200).send({ success: true, data: partners });
  });
  ```
- **Security Rationale:**
  Complies with DPDP Act 2023 (§ 4, § 8) and HIPAA Privacy Rule (45 CFR § 164.502). Unauthenticated callers receive `401 Unauthorized`; non-admin staff receive `403 Forbidden`; personal phone numbers are stripped from payload.
- **Regression Test:** `tests/security/p0-production-security-audit.mjs` (Test 6) & `tests/security/phase1-remediation-negative-tests.test.mjs` (Tests 1 & 2).
- **Before/After Test Results:**
  - *Before:* Test 6 failed: `live-partners must be protected with authenticate preHandler`.
  - *After:* Test 6 PASSED; unauthenticated calls return 401; non-admin calls return 403.
- **Remaining Limitations:** None.

---

### [P1-SEC-03] Separation of Duties: Pathologist Role Omission

- **Original Location:** `apps/api-gateway/src/routes/partner/lab-diagnostics.routes.ts:10` and `packages/api-contracts/src/auth/rbac.schema.ts:11-23`
- **Root Cause:**
  `PATHOLOGIST_ROLES` array omitted `'PATHOLOGIST'`, and `RoleTypeSchema` in `@docsearch/api-contracts` lacked `'PATHOLOGIST'`, blocking authentic pathologists from verifying lab orders with `403 Forbidden`.
- **Actual Code Change:**
  - Updated `apps/api-gateway/src/routes/partner/lab-diagnostics.routes.ts:10`:
    ```typescript
    const PATHOLOGIST_ROLES = [
      'SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 
      'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR', 'PATHOLOGIST'
    ] as const;
    ```
  - Added `'PATHOLOGIST'` and `'RADIOLOGIST'` to `RoleTypeSchema` in `packages/api-contracts/src/auth/rbac.schema.ts`.
- **Security Rationale:**
  Restores clinical Separation of Duties (SoD) under ISO 15189 and NABL standards. Pathologists can sign off on entered lab results without requiring administrative role escalation.
- **Regression Test:** `tests/security/enterprise-access-control.test.mjs` (Test 10) & `tests/security/phase1-remediation-negative-tests.test.mjs` (Test 5).
- **Before/After Test Results:**
  - *Before:* Test 10 failed: `AssertionError: Expected 200, got 403`.
  - *After:* Test 10 PASSED (VERIFIED); 14/14 tests pass in `enterprise-access-control.test.mjs`.
- **Remaining Limitations:** None.

---

### [P1-SEC-04] Query Parameter Auth Token Acceptance

- **Original Location:** `apps/api-gateway/src/plugins/auth-guard.ts:134-139`
- **Root Cause:**
  `extractAuthTokenFromRequest` extracted JWT tokens from `request.query.token`.
- **Actual Code Change:**
  Removed query string extraction completely from `extractAuthTokenFromRequest`. Only `Authorization: Bearer <token>`, `x-auth-token` headers, and secure HTTP cookies are accepted.
- **Security Rationale:**
  Satisfies OWASP ASVS V3.1.1. Prevents credential leakage into server access logs, reverse proxy access logs, browser history, and HTTP `Referer` headers.
- **Regression Test:** `tests/security/phase1-security-regression.test.mjs` (Check 4) & `tests/security/phase1-remediation-negative-tests.test.mjs` (Test 3).
- **Before/After Test Results:**
  - *Before:* `GET /protected?token=...` succeeded.
  - *After:* `GET /protected?token=...` is rejected with `401 Unauthorized` (`Missing or invalid Authorization header`).
- **Remaining Limitations:** Clients must transmit JWT tokens in the `Authorization` header or secure cookies.

---

### [P1-SEC-06] Rate Limiting Quota Bypass via Unverified JWT Claims

- **Original Location:** `apps/api-gateway/src/plugins/security.ts:106-142`
- **Root Cause:**
  `keyGenerator` parsed unverified base64 `sub` and `tenantId` without signature verification, and `max()` granted 10,000 req/min quota if `Boolean(extractAuthTokenFromRequest(request))` was true.
- **Actual Code Change:**
  ```typescript
  // AFTER:
  keyGenerator: (request) => {
    // 1. Only cryptographically verified sessions receive user/tenant rate limit keys
    if (request.session?.userId && request.session?.tenantId) {
      return `auth:${request.session.tenantId}:${request.session.userId}`;
    }
    // 2. Strict fallback to client IP for all unauthenticated or unverified traffic
    return `ip:${request.ip}`;
  },
  max: (request) => {
    // 🛡️ High throughput quota strictly reserved for cryptographically authenticated users
    if (request.session?.userId) {
      return 10000;
    }
    // Strict anti-abuse / anti-spray quota for unauthenticated public traffic
    return env.RATE_LIMIT_MAX || 100;
  }
  ```
- **Security Rationale:**
  Prevents Denial-of-Service and rate limit evasion (OWASP API4:2023). Unverified tokens can never spoof user keys or claim elevated quotas.
- **Regression Test:** `tests/security/phase1-security-regression.test.mjs` (Check 5) & `tests/security/phase1-remediation-negative-tests.test.mjs` (Test 6).
- **Before/After Test Results:**
  - *Before:* Dummy tokens received 10,000 req/min and bypassed IP throttle.
  - *After:* Dummy tokens fall back to IP throttle and are rejected with 401 on protected routes.
- **Remaining Limitations:** None.

---

### [P2-SEC-05] Core AuthGuard Offline Bypass Generator Isolation

- **Original Location:** `apps/api-gateway/src/plugins/auth-guard.ts:218-271`
- **Root Cause:**
  `auth-guard.ts` statically contained an offline token generator that minted full `HOSPITAL_ADMIN` and `permissions: ['*']` claims when `token.startsWith('offline.')`.
- **Actual Code Change:**
  Completely removed the offline token handler from `apps/api-gateway/src/plugins/auth-guard.ts`. All tokens must be valid signed JWTs verifiable by `verifyJwt`.
- **Security Rationale:**
  Eliminates potential privilege escalation backdoor in production artifacts (OWASP A05:2021).
- **Regression Test:** `tests/security/phase1-security-regression.test.mjs` (Check 6) & `tests/security/phase1-remediation-negative-tests.test.mjs` (Test 4).
- **Before/After Test Results:**
  - *Before:* `Authorization: Bearer offline.doctor` generated active claims if dev flag was active.
  - *After:* `offline.doctor` is rejected immediately with 401 (`Invalid token format: Must have 3 parts`).
- **Remaining Limitations:** None.

---

### [P2-PRIV-01] ABHA Identifier Masking in Logs

- **Original Location:** `apps/api-gateway/src/services/partner/AbdmGatewayService.ts:114`
- **Root Cause:**
  `logger.info` logged plaintext 14-digit ABHA numbers directly to application logs.
- **Actual Code Change:**
  Added `maskAbha` utility:
  ```typescript
  function maskAbha(abha: string): string {
    if (!abha || abha.length < 8) return '****';
    const parts = abha.split('-');
    if (parts.length === 4) {
      return `${parts[0]}-****-****-${parts[3]}`;
    }
    return `${abha.slice(0, 3)}******${abha.slice(-4)}`;
  }
  ```
  Updated log statement:
  ```typescript
  logger.info(`Verified Aadhaar OTP and minted ABHA via Live NHA Gateway (${maskAbha(abhaNumber)})`);
  ```
- **Security Rationale:**
  Adheres to India DPDP Act 2023 (§ 8) and ABDM Data Security specifications. ABHA identifiers are never exposed in log aggregators or monitoring dashboards.
- **Regression Test:** `tests/security/phase1-security-regression.test.mjs` (Check 7) & `tests/security/phase1-remediation-negative-tests.test.mjs` (Test 7).
- **Before/After Test Results:**
  - *Before:* Emitted `(91-1234-5678-7714)` in plaintext.
  - *After:* Emits `(91-****-****-7714)` with middle digits masked.
- **Remaining Limitations:** None.

---

## 3. Summary of Additional Security Hardening (Step 3)

1. **Strict CORS Validation (`security.ts:66`):**
   Updated origin regex from permissive `.endsWith('.docsearch.health')` to strict HTTPS apex and subdomain matching:
   `origin === 'https://docsearch.health' || /^https:\/\/[a-zA-Z0-9-]+\.docsearch\.health$/.test(origin)`
2. **Clean Dead Code Removal:**
   Removed unused `optionalAuthenticate` and `extractAuthTokenFromRequest` imports from `auth.routes.ts` and `security.ts`.
3. **Workspace Type Definitions Updated:**
   `packages/api-contracts` rebuilt with `'PATHOLOGIST'` and `'RADIOLOGIST'` in `RoleTypeSchema`, and `packages/auth` recompiled cleanly.
