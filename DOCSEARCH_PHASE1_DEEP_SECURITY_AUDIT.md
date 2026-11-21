# DOC SEARCH — Phase 1: Deep Security Audit & Forensic Vulnerability Register
**Document Reference:** `DOCSEARCH_PHASE1_DEEP_SECURITY_AUDIT.md`  
**Audit Standard:** OWASP ASVS v4.0.3, OWASP Top 10:2021, OWASP API Security Top 10:2023, HIPAA Security Rule, DPDP Act 2023  
**Execution Branch:** `audit/master-forensic-remediation`  
**Audit Date:** November 2026  
**Auditor:** Principal Security Architect & Forensic Security Audit Team (Antigravity)  
**Status:** FORENSIC ASSESSMENT COMPLETE — FINDINGS REGISTERED — PENDING USER APPROVAL FOR REMEDIATION  

---

## 1. Executive Summary

A comprehensive, zero-trust forensic security audit was executed across the DOC SEARCH platform (API Gateway, database layer, partner platform, patient portal, and core packages). The objective was to ascertain whether the system adheres to strict fail-closed healthcare security standards before real-world deployment.

### 1.1 Empirical Test Suite Execution Summary
Four distinct forensic security test suites were executed directly against native PostgreSQL 18.4 and application route handlers:
1. **Adversarial Multi-Tenant RLS Test (`packages/database/test/adversarial-two-tenant-rls.test.mjs`):**
   - **Result:** **12/12 PASSED (100%)**.
   - Validated that when connected via the unprivileged runtime role `docsearch_app` (`NOSUPERUSER, NOBYPASSRLS`), PostgreSQL Row-Level Security policies strictly reject cross-tenant `SELECT`, `UPDATE`, `DELETE`, and `INSERT` statements even if an attacker manipulates tenant context.
2. **Adversarial API Gateway Security Audit (`tests/security/adversarial-security-audit.mjs`):**
   - **Result:** **39/39 PASSED (100%)**.
   - Verified that cryptographic tampering (HMAC mutation, `alg: none`, zero-byte payloads, expired tokens), KYC status escalation, Razorpay webhook signature forgery, and Aadhaar/PAN exposure in responses are strictly blocked.
3. **P0 Production Security Audit (`tests/security/p0-production-security-audit.mjs`):**
   - **Result:** **9/10 PASSED, 1 FAILED**.
   - **Empirical Failure:** Test 6 failed due to unauthenticated route access on `/api/v1/auth/live-partners` using `optionalAuthenticate` instead of `authenticate` (Registered as `P1-SEC-02`).
4. **Enterprise Access Control & SoD Audit (`tests/security/enterprise-access-control.test.mjs`):**
   - **Result:** **FAILED on Test 10 (Separation of Duties)**.
   - **Empirical Failure:** Test 10 threw `AssertionError: Expected 200, got 403` when a user with the `PATHOLOGIST` role attempted to verify a completed lab order. Root cause confirmed in `apps/api-gateway/src/routes/partner/lab-diagnostics.routes.ts:10` where `PATHOLOGIST_ROLES` omits `'PATHOLOGIST'` (Registered as `P1-SEC-03`).

---

## 2. Classified Security Findings (Evidence-Backed Register)

### 2.1 Critical Severity Findings (P0)

#### [P0-SEC-01] Superuser Connection String Bypasses PostgreSQL Row Level Security (RLS)
- **Vulnerability Category:** OWASP A01:2021 (Broken Access Control) / ASVS V4.1 (Access Control Architecture)
- **Affected File:** `d:\DOC SEARCH\.env` (and deployment environment templates)
- **Impact Location:** `packages/database/src/client.ts:31-70`
- **Empirical Evidence:**
  Database introspection confirms that 399 tables have `FORCE ROW LEVEL SECURITY` enabled.
  Querying `pg_roles` shows:
  ```sql
  rolname: postgres      | rolsuper: true  | rolbypassrls: true
  rolname: docsearch_app | rolsuper: false | rolbypassrls: false
  ```
  The active `.env` configuration defines:
  `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/docsearch`
- **Security Impact:**
  Because `postgres` possesses `rolsuper: true` and `rolbypassrls: true`, PostgreSQL ignores all RLS policies for queries executed through this connection. If an application service fails to explicitly append `WHERE tenant_id = ...`, PostgreSQL will NOT enforce tenant isolation at the database layer.
- **Remediation Recommendation:**
  Configure runtime application connections in `.env` to connect via `docsearch_app`:
  `DATABASE_URL=postgresql://docsearch_app:docsearch_app_secure_pw@127.0.0.1:5432/docsearch`. Reserve the `postgres` superuser exclusively for DDL database migrations.

---

### 2.2 High Severity Findings (P1)

#### [P1-SEC-02] Unauthenticated Information Disclosure & Healthcare Partner Enumeration
- **Vulnerability Category:** OWASP A01:2021 (Broken Access Control) / OWASP API1:2023 (BOLA / Broken Object Level Authorization)
- **Affected File:** `apps/api-gateway/src/routes/auth.routes.ts`
- **Line Numbers:** L1142–1156
- **Code Snippet:**
  ```typescript
  // GET /api/v1/auth/live-partners (List of newly onboarded live partners for fast login switch)
  fastify.get('/api/v1/auth/live-partners', { preHandler: [optionalAuthenticate] }, async (_request, reply) => {
    const partners = realAuthService.getAllLivePartnerUsers().map((p) => ({
      id: p.id,
      email: p.email,
      name: `${p.firstName} ${p.lastName}`.trim(),
      tenantName: p.tenantName,
      organizationType: p.organizationType,
      planTier: p.planTier,
      phone: p.phone
    }));
    return reply.status(200).send({ success: true, data: partners });
  });
  ```
- **Reproduction Steps:**
  1. Send `GET http://127.0.0.1:4000/api/v1/auth/live-partners` with NO `Authorization` header.
  2. Observe HTTP 200 response returning full list of partner administrators, hospital tenant names, doctor email addresses, and phone numbers.
- **Security Impact:**
  Direct unauthenticated PII leakage violating India DPDP Act 2023 (§ 4, § 8) and HIPAA Privacy Rule (45 CFR § 164.502). Enables targeted phishing, credential stuffing, and partner doctor reconnaissance.
- **Remediation Recommendation:**
  Change `preHandler: [optionalAuthenticate]` to `preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]` or restrict to internal administrative verification queues.

---

#### [P1-SEC-03] Separation of Duties Defect: Pathologist Role Excluded from Lab Verification Guard
- **Vulnerability Category:** OWASP A01:2021 (Broken Access Control) / Healthcare Workflow Governance (NABL / ISO 15189)
- **Affected File:** `apps/api-gateway/src/routes/partner/lab-diagnostics.routes.ts`
- **Line Numbers:** L10, L410, L418, L427, L445
- **Code Snippet:**
  ```typescript
  const PATHOLOGIST_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR'] as const;
  ```
- **Reproduction Steps:**
  1. Issue a JWT with role `PATHOLOGIST` and permission `lab:results:validate`.
  2. Send `PATCH /api/v1/partner/lab/orders/:id/verify`.
  3. API responds with HTTP 403 Forbidden (`INSUFFICIENT_PERMISSIONS` / Role violation).
- **Security Impact:**
  Clinical breakdown of Separation of Duties (SoD). In ISO 15189 and NABL accredited laboratories, lab technicians enter numerical results, and licensed Pathologists must sign off. Currently, an authentic Pathologist cannot approve results, forcing hospital staff to use high-privilege administrative accounts (`HOSPITAL_ADMIN`) or doctor accounts to bypass the blocker, violating least privilege.
- **Remediation Recommendation:**
  Update `PATHOLOGIST_ROLES` to include `'PATHOLOGIST'`:
  `const PATHOLOGIST_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR', 'PATHOLOGIST'] as const;`

---

#### [P1-SEC-04] Authentication Token Acceptance via URL Query Parameters
- **Vulnerability Category:** OWASP ASVS V3.1.1 (Token Handling) / OWASP A07:2021 (Identification and Authentication Failures)
- **Affected File:** `apps/api-gateway/src/plugins/auth-guard.ts`
- **Line Numbers:** L134–L139
- **Code Snippet:**
  ```typescript
  if (!raw && (request.query as any)?.token) {
    const qToken = String((request.query as any).token).trim();
    if (qToken) {
      raw = qToken.replace(/^Bearer\s+/i, '').trim();
    }
  }
  ```
- **Reproduction Steps:**
  1. Call any protected API passing `?token=<valid_jwt>`.
  2. Request is authenticated successfully.
- **Security Impact:**
  URLs containing query parameters are routinely logged in plaintext by reverse proxies (Nginx, Cloudflare, AWS ALB), browser history, network monitoring tap devices, and HTTP `Referer` headers when external assets are requested.
- **Remediation Recommendation:**
  Deprecate and remove query token extraction for standard REST endpoints. If SSE or WebSocket endpoints require query tokens, restrict query extraction strictly to designated paths (e.g. `/api/v1/live/stream`) with ephemeral, single-use ticket exchange tokens.

---

#### [P1-SEC-06] Rate Limiting Quota Bypass & Unverified Key Collision
- **Vulnerability Category:** OWASP API4:2023 (Unrestricted Resource Consumption) / ASVS V13.1
- **Affected File:** `apps/api-gateway/src/plugins/security.ts`
- **Line Numbers:** L113–L125, L130–L139
- **Code Snippet:**
  ```typescript
  keyGenerator: (request) => {
    const token = extractAuthTokenFromRequest(request);
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload.sub && payload.tenantId) {
            return `auth:${payload.tenantId}:${payload.sub}`;
          }
        }
      } catch {}
    }
    return `ip:${request.ip}`;
  },
  max: (request) => {
    if (request.session?.userId || Boolean(extractAuthTokenFromRequest(request))) {
      return 10000;
    }
    return env.RATE_LIMIT_MAX || 100;
  }
  ```
- **Reproduction Steps:**
  1. An attacker sends unauthenticated traffic with `Authorization: Bearer <unverified_fake_jwt>`.
  2. `Boolean(extractAuthTokenFromRequest(request))` evaluates to `true`, boosting rate limit quota from 100 req/min to 10,000 req/min.
  3. The attacker rotates `payload.sub` in the fake JWT on each request, causing the key generator to allocate unique rate limit counters, evading IP rate limiting.
- **Security Impact:**
  Denial of Service (DoS) and brute-force protection bypass. An unauthenticated attacker can launch credential stuffing attacks against auth routes without triggering IP throttle limits.
- **Remediation Recommendation:**
  In `max()` and `keyGenerator()`, key and quota assignment must ONLY be elevated if `request.session?.userId` has already been cryptographically verified by `authenticate` preHandler. Fallback to `ip:${request.ip}` for all unverified requests.

---

### 2.3 Medium Severity Findings (P2)

#### [P2-SEC-05] Insecure Development Offline Auth Bypass Generator in Core AuthGuard
- **Vulnerability Category:** OWASP A05:2021 (Security Misconfiguration) / Insecure Design
- **Affected File:** `apps/api-gateway/src/plugins/auth-guard.ts`
- **Line Numbers:** L225–L271
- **Security Impact:**
  The production `auth-guard.ts` contains code that generates full `HOSPITAL_ADMIN` and `permissions: ['*']` session claims when `token.startsWith('offline.')` and `ALLOW_DEV_AUTH_BYPASS === 'true'`. While disabled if `NODE_ENV === 'production'`, statically shipping backdoors in production artifacts introduces severe risk if an environment configuration error occurs.
- **Remediation Recommendation:**
  Segregate dev bypass mocks into isolated development fixtures or require an external mock adapter that is completely excluded from production build bundles.

#### [P2-PRIV-01] Unmasked ABHA Healthcare Identifier in ABDM Gateway Service Logs
- **Vulnerability Category:** OWASP A09:2021 (Security Logging Failures) / DPDP Act 2023 (§ 8)
- **Affected File:** `apps/api-gateway/src/services/partner/AbdmGatewayService.ts`
- **Line Numbers:** L114
- **Code Snippet:**
  ```typescript
  logger.info(`Verified Aadhaar OTP and minted ABHA via Live NHA Gateway (${abhaNumber})`);
  ```
- **Security Impact:**
  Plaintext ABHA numbers logged to application disk logs and centralized log forwarders, violating National Health Authority (NHA) data protection standards.
- **Remediation Recommendation:**
  Mask the ABHA number before logging: `${abhaNumber.slice(0, 5)}******${abhaNumber.slice(-4)}`.

---

## 3. Cryptographic & Secrets Management Audit

| Component | Standard / Requirement | Current Implementation | Verdict |
| :--- | :--- | :--- | :--- |
| **Password Hashing** | NIST SP 800-63B / OWASP | `scrypt` ($N=16384, r=8, p=1$, 16-byte salt, 64-byte key) with `timingSafeEqual` | **COMPLIANT** |
| **JWT Algorithm** | RFC 7519 / ASVS V3.5 | Strict `HS256`, explicit rejection of `alg: none` and asymmetric substitution | **COMPLIANT** |
| **JWT Expiration** | ASVS V3.3 | Access token: 900s (15 min); refresh token rotation implemented | **COMPLIANT** |
| **Database Encryption** | HIPAA Technical Safeguards | AES-256-GCM authenticated encryption for sensitive clinical notes | **COMPLIANT** |
| **Production Secrets** | Zero Hardcoded Secrets | Fail-closed validation in `env.ts` halts boot if default dev secret is detected | **COMPLIANT** |

---

## 4. Phase 1 Forensic Sign-Off & Verification Status

- **Total Security Findings Identified in Phase 1:** 7 Findings (1 P0, 4 P1, 2 P2)
- **Status:** Documented in master registers. Remediation held strictly in accordance with non-negotiable safety rules until user review and formal authorization.
