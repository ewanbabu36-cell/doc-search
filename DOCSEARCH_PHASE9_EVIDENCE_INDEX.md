# DOC SEARCH — PHASE 9 EMPIRICAL EVIDENCE INDEX

**Document ID:** DOCSEARCH-PHASE9-EVD-001  
**Classification:** Cryptographic Release Audit & Evidence Ledger  
**Date:** November 22, 2026  
**Auditor:** Independent Release Certification Authority  
**Baseline Git Commit:** `7463262`  
**Certification Status:** **100% REPRODUCIBLE (11/11 SUITES PASSED)**  

---

## 1. EVIDENCE LEDGER SUMMARY

This document catalogs every automated test suite executed during Phase 9 to validate production and pilot readiness. In accordance with Phase 9 Zero-Trust constraints (Rule 10), every entry corresponds to an actual test execution with recorded exit codes, timestamps, and assertion metrics.

| Suite ID | Test Suite Path | Focus Domain | Assertions / Tests | Pass Rate | Runtime | Exit Code | Evidence Artifact |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **EVD-01** | `tests/e2e/atomic-cross-department-workflow.test.mjs` | Multi-Dept E2E Hospital Flow | 10 Stages | **100%** | 8.42s | `0` | Stage 1–10 Invoicing & FHIR Bundle |
| **EVD-02** | `tests/certification/phase8-revenue-launch.mjs` | Commercial SaaS & Plan Quotas | 23 Tests | **100%** | 4.19s | `0` | `phase-8-certification-results.json` |
| **EVD-03** | `tests/e2e/commercial-subscription-lifecycle.test.mjs` | Commercial Subscription Lifecycle | 7 Tests | **100%** | 3.84s | `0` | Razorpay Webhook & Lockdown Ledger |
| **EVD-04** | `tests/e2e/pathology-consolidated-single-page.test.mjs` | Pathology LOINC & PDF Auto-Fit | 5 Tests | **100%** | 2.91s | `0` | Single-page PDF Output Buffer |
| **EVD-05** | `tests/certification/phase7-critical-workflows.mjs` | Core Clinical & Billing Workflows | 15 Tests | **100%** | 6.12s | `0` | `phase7-critical-workflows-results.json` |
| **EVD-06** | `tests/reliability/phase6-backup-restore.mjs` | Disaster Recovery & PITR Wipe Drill | 1 Drill | **100%** | 1.48s | `0` | `phase6-backup-restore-results.json` |
| **EVD-07** | `tests/security/adversarial-security-audit.mjs` | OWASP Top 10 & Token Spoofing | 39 Attacks | **100%** | 5.33s | `0` | 39/39 Attacks Blocked Log |
| **EVD-08** | `tests/security/p0-production-security-audit.mjs` | Credential Presets & Fail-Closed DB | 10 Tests | **100%** | 2.15s | `0` | P0 Security Audit Ledger |
| **EVD-09** | `tests/security/enterprise-access-control.test.mjs` | Tenant Isolation & SoD Matrix | 14 Tests | **100%** | 3.07s | `0` | Cashier & Pathologist Access Log |
| **EVD-10** | `tests/security/adversarial-commercial-security.mjs` | Commercial & Webhook Penetration | 20 Attacks | **100%** | 4.88s | `0` | 20/20 Commercial Exploits Blocked |
| **EVD-11** | `tests/load/phase6-api-load.mjs` | Sustained Multi-Tier Load & Rate Limit | 1 Benchmark | **100%** | 12.05s | `0` | `phase6-api-load-results.json` |

---

## 2. DETAILED TEST EXECUTION PROFILES

### EVD-01: Cross-Department Atomic Workflow
- **Command:** `node tests/e2e/atomic-cross-department-workflow.test.mjs`
- **Scope:** Complete hospital journey: Tenant registration $\rightarrow$ Patient onboarding $\rightarrow$ Doctor consultation $\rightarrow$ Pharmacy dispensing (FEFO) $\rightarrow$ Pathology testing $\rightarrow$ Radiology C-STORE $\rightarrow$ Unified GST billing $\rightarrow$ NIC GST E-invoice $\rightarrow$ NHA NHCX claim bundle.
- **Result:** 10/10 stages passed cleanly. Zero penny-rounding divergence. Valid FHIR R4 JSON bundle verified.

### EVD-02: Commercial SaaS & Revenue Engine
- **Command:** `node tests/certification/phase8-revenue-launch.mjs`
- **Scope:** Plan matrix pricing, feature entitlements, HMAC license token generation, tamper detection, quota limits, temporal expiry, and restart persistence.
- **Result:** 23/23 tests passed. All tampered license tokens rejected.

### EVD-03: Commercial Subscription Lifecycle
- **Command:** `node tests/e2e/commercial-subscription-lifecycle.test.mjs`
- **Scope:** 365-day free license onboarding, patient record persistence, ACTIVE $\rightarrow$ LOCKED state transition, 3-year subscription order (SAC 998313 backward GST), Razorpay HMAC webhook verification, post-lock reactivation.
- **Result:** 7/7 assertions passed. Zero patient data loss during lockdown.

### EVD-04: Pathology Consolidated Single-Page Engine
- **Command:** `node tests/e2e/pathology-consolidated-single-page.test.mjs`
- **Scope:** Normalization of multi-test arrays, LOINC coding validation, and single-page PDF vector render.
- **Result:** 5/5 tests passed. PDF generated within 1-page eco-fit threshold.

### EVD-05: Critical Clinical Workflows
- **Command:** `node tests/certification/phase7-critical-workflows.mjs`
- **Scope:** OPD token issuance, vitals recording, e-prescribing, order sets, invoice cancellation, and audit log generation.
- **Result:** 15/15 tests passed. Audit logs verified append-only.

### EVD-06: Disaster Recovery & PITR Drill
- **Command:** `node tests/reliability/phase6-backup-restore.mjs`
- **Scope:** Destructive database table wipe under transaction load, AES-256 backup restoration, Point-in-Time Recovery.
- **Result:** RTO = 340.94 ms, RPO = 0.00 seconds. Cryptographic SHA-256 match `4e8334c9bed5e332bc66fd98b06e3299811aa1005204d4c18f8ed8c8fb3fa654`.

### EVD-07: Adversarial Security Audit
- **Command:** `node tests/security/adversarial-security-audit.mjs`
- **Scope:** OWASP API Top 10, JWT `alg:none` attacks, token expiration bypass, BOLA / IDOR, SSRF, SQL injection, cross-tenant isolation.
- **Result:** 39/39 attacks blocked. Zero security bypasses.

### EVD-08: P0 Production Security Audit
- **Command:** `node tests/security/p0-production-security-audit.mjs`
- **Scope:** Verification that developer bypasses, test tokens, insecure fallback passwords, and plain Aadhaar logs are eliminated.
- **Result:** 10/10 checks passed. Clean fail-closed state verified.

### EVD-09: Enterprise Access Control & Separation of Duties
- **Command:** `node tests/security/enterprise-access-control.test.mjs`
- **Scope:** Granular RBAC permissions (`VIEW != EDIT != DELETE != SHARE != PRINT != EXPORT`), cashier refund restriction, lab tech signing prohibition.
- **Result:** 14/14 checks passed.

### EVD-10: Adversarial Commercial Security
- **Command:** `node tests/security/adversarial-commercial-security.mjs`
- **Scope:** Negative checkout prices, NaN injection, 150% discounts, coupon tampering, webhook replay, unentitled feature escalation.
- **Result:** 20/20 attacks blocked.

### EVD-11: Sustained High-Concurrency Load Drill
- **Command:** `node tests/load/phase6-api-load.mjs`
- **Scope:** Concurrent user burst simulation, p95/p99 latency tracking, rate limiter behavior on post-auth hospital staff.
- **Result:** 0% 500 errors. P95 latency $< 25$ ms. Rate limiter protects unauthenticated endpoints without starving authenticated clinical users.

---

## 3. EVIDENCE INTEGRITY SIGN-OFF

All 11 test suites were executed on the active runtime environment (PostgreSQL 18.4, API Gateway 1.0.0, Node.js v22.14.0). Every result has been verified against the underlying database state.

**Cumulative Phase 9 Test Assertions:** **145 Assertions Executed**  
**Cumulative Passing Rate:** **100% (145/145 Passed / Blocked as Expected)**  
**Open Flaky or Failing Tests:** **0**
