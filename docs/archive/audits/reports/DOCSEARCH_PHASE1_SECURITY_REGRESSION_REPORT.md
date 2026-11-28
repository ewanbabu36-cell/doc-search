# DOC SEARCH — Phase 1: Security Regression Test Report
**Document Reference:** `DOCSEARCH_PHASE1_SECURITY_REGRESSION_REPORT.md`  
**Execution Branch:** `audit/master-forensic-remediation`  
**Test Engine:** Native Node.js Test Runner, Fastify Inject, PostgreSQL 18.4  
**Date:** November 2026  
**Auditor:** QA Automation & SDET Lead / Forensic Security Auditor (Antigravity)  

---

## 1. Master Regression Test Matrix

All six automated security test suites were executed post-remediation against native PostgreSQL 18.4 and application routes. Every test passed with zero failures.

| Test Suite File | Domain & Purpose | Total Scenarios | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`packages/database/test/adversarial-two-tenant-rls.test.mjs`** | Multi-tenant PostgreSQL RLS kernel enforcement under `docsearch_app` | 12 | 12 | 0 | **100% PASS** |
| **`tests/security/adversarial-security-audit.mjs`** | Adversarial attacks: crypto, tokens, KYC, webhooks, Aadhaar, IDOR | 39 | 39 | 0 | **100% PASS** |
| **`tests/security/p0-production-security-audit.mjs`** | Production fail-closed guards, credentials, live-partners route | 10 | 10 | 0 | **100% PASS** |
| **`tests/security/enterprise-access-control.test.mjs`** | Full 14-role RBAC hierarchy, SoD, Action Separation, Pathologist sign-off | 14 | 14 | 0 | **100% PASS** |
| **`tests/security/phase1-security-regression.test.mjs`** | Direct assertion regression harness for all 7 Phase 1 defects | 7 | 7 | 0 | **100% PASS** |
| **`tests/security/phase1-remediation-negative-tests.test.mjs`** | Live negative execution test harness for 7 remediated vulnerabilities | 7 | 7 | 0 | **100% PASS** |
| **TOTALS** | **Comprehensive Full-Stack Security Verification** | **89** | **89** | **0** | **100% PASS** |

---

## 2. Before vs After Test Delta Reconciliation

### 2.1 Test Suite 1: `p0-production-security-audit.mjs`
- **Baseline Run (Before):**
  ```
  TEST [5] /api/v1/company/partners/complete-onboarding-activation requires authentication and admin RBAC... PASS
  TEST [6] All verification queue and staged amendment routes require authentication and admin RBAC... FAIL
     -> Error: live-partners must be protected with authenticate preHandler
  AUDIT RESULTS: 9/10 TESTS PASSED (1 FAILED)
  ```
- **Post-Remediation Run (After):**
  ```
  TEST [5] /api/v1/company/partners/complete-onboarding-activation requires authentication and admin RBAC... PASS
  TEST [6] All verification queue and staged amendment routes require authentication and admin RBAC... PASS
  AUDIT RESULTS: 10/10 TESTS PASSED
  ALL P0 PRODUCTION SECURITY VERIFICATIONS SUCCEEDED!
  ```
- **Resolution:** `GET /api/v1/auth/live-partners` protected with `authenticate` preHandler.

---

### 2.2 Test Suite 2: `enterprise-access-control.test.mjs`
- **Baseline Run (Before):**
  ```
  [TEST 09] Separation of Duties: Lab Technician can enter results but cannot verify lab report ... PASSED
  [TEST 10] Separation of Duties: Pathologist can verify lab report ... FAILED (VIOLATION DETECTED)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  403 !== 200
  ```
- **Post-Remediation Run (After):**
  ```
  [TEST 09] Separation of Duties: Lab Technician can enter results but cannot verify lab report ... PASSED (VERIFIED)
  [TEST 10] Separation of Duties: Pathologist can verify lab report ... PASSED (VERIFIED)
  [TEST 11] Workflow State: Cannot re-verify or cancel an already verified lab order ... PASSED (VERIFIED)
  [TEST 12] Business History: Query longitudinal patient history returns structured domain entities ... PASSED (VERIFIED)
  [TEST 13] Business History: Export action generates immutable audit trail with actor and timestamp ... PASSED (VERIFIED)
  [TEST 14] Onboarding Baseline: Newly registered partner without commercial license row is granted 365-day access ... PASSED (VERIFIED)
  CERTIFICATION SUMMARY: 14/14 TESTS PASSED (100% SUCCESS)
  STATUS: VERIFIED — PRODUCTION ENTERPRISE ACCESS CONTROL ARCHITECTURE COMPLIANT
  ```
- **Resolution:** Added `'PATHOLOGIST'` to `PATHOLOGIST_ROLES` and `@docsearch/api-contracts`. Test 10 verified with HTTP 200 and audit trace persistence.

---

### 2.3 Test Suite 3: `phase1-security-regression.test.mjs`
- **Baseline Run (Before):**
  ```
  PHASE 1 REGRESSION TEST SUMMARY: 0 REMEDIATED, 7 OPEN DEFECTS (TOTAL: 7)
  ```
- **Post-Remediation Run (After):**
  ```
  [P0-SEC-01] Database connection string connects via least-privilege docsearch_app... PASS (REMEDIATED & VERIFIED)
  [P1-SEC-02] GET /api/v1/auth/live-partners is protected by authenticate preHandler... PASS (REMEDIATED & VERIFIED)
  [P1-SEC-03] PATHOLOGIST role included in PATHOLOGIST_ROLES array... PASS (REMEDIATED & VERIFIED)
  [P1-SEC-04] Query parameter token (?token=) extraction removed from core auth guard... PASS (REMEDIATED & VERIFIED)
  [P1-SEC-06] Rate limiter only grants elevated quota to verified sessions... PASS (REMEDIATED & VERIFIED)
  [P2-SEC-05] Core auth guard isolates offline tokens from production bundle... PASS (REMEDIATED & VERIFIED)
  [P2-PRIV-01] ABHA number masked before logging in AbdmGatewayService... PASS (REMEDIATED & VERIFIED)
  PHASE 1 REGRESSION TEST SUMMARY: 7 REMEDIATED, 0 OPEN DEFECTS (TOTAL: 7)
  ```
- **Resolution:** All 7 defects remediated and independently certified.

---

### 2.4 Test Suite 4: `phase1-remediation-negative-tests.test.mjs`
- **Post-Remediation Run (After):**
  ```
  [NEGATIVE TEST 01] P1-SEC-02: Unauthenticated GET /api/v1/auth/live-partners returns 401... PASS (VERIFIED)
  [NEGATIVE TEST 02] P1-SEC-02: Non-admin staff call to /api/v1/auth/live-partners returns 403... PASS (VERIFIED)
  [NEGATIVE TEST 03] P1-SEC-04: API rejects token passed via URL query string (?token=) with 401... PASS (VERIFIED)
  [NEGATIVE TEST 04] P2-SEC-05: Offline mock token (offline.doctor) rejected with 401... PASS (VERIFIED)
  [NEGATIVE TEST 05] P1-SEC-03: Pathologist role is accepted on /api/v1/partner/lab/orders/:id/verify... PASS (VERIFIED)
  [NEGATIVE TEST 06] P1-SEC-06: Dummy/unverified token receives unauthenticated quota... PASS (VERIFIED)
  [NEGATIVE TEST 07] P2-PRIV-01: ABHA masking utility masks middle digits properly... PASS (VERIFIED)
  ALL 7/7 NEGATIVE REMEDIATION TESTS PASSED (100% SUCCESS)
  ```

---

## 3. Regression Certification Sign-Off

All previously failing tests have been resolved without disabling or weakening any test assertions. Zero regressions were introduced into existing authentication, authorization, or database operations.
