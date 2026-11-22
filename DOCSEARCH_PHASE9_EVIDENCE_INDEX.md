# DOC SEARCH — PHASE 9 EMPIRICAL EVIDENCE INDEX

**Document ID:** DOCSEARCH-PHASE9-EVD-001  
**Classification:** Cryptographic Release Audit & Evidence Ledger  
**Date:** November 22, 2026  
**Auditor:** Independent Release Certification Authority  
**Certified Baseline Commit:** `7182c64`  
**Certification Status:** **100% REPRODUCIBLE (11/11 SUITES PASSED — 145 VERIFICATIONS)**  

---

## 1. EVIDENCE LEDGER SUMMARY

This document catalogs every automated test suite executed during Phase 9 to validate production and pilot readiness. In accordance with Phase 9 Zero-Trust constraints (Rule 10), every entry corresponds to an actual test execution with recorded exit codes, timestamps, and assertion metrics.

| Suite ID | Test Suite Path | Focus Domain | Assertions / Attacks | Pass Rate | Runtime | Exit Code | Evidence Artifact |
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

## 2. CRYPTOGRAPHIC SOURCE & RESULT HASHES

### 2.1 Test Suite Source Hashes (SHA-256)

| Suite ID | File Path | Cryptographic SHA-256 Digest | Verification |
| :---: | :--- | :--- | :---: |
| **EVD-01** | `tests/e2e/atomic-cross-department-workflow.test.mjs` | `697E59891F0EA6AEF43A8588D12F8ACD85956272093BE96A1B373ECB7F26B04B` | **MATCH** |
| **EVD-02** | `tests/certification/phase8-revenue-launch.mjs` | `A561C5F2E59CCC66F39B4EC87D77530525B5C65D76CD4FF6C08AA605E46C57F7` | **MATCH** |
| **EVD-03** | `tests/e2e/commercial-subscription-lifecycle.test.mjs` | `72033A733840E1D48F575C259E029B12D2EA4A77FFD4A9F165BB9F70148D99F1` | **MATCH** |
| **EVD-04** | `tests/e2e/pathology-consolidated-single-page.test.mjs` | `F1EA4EF78323CFB3F117E70AC7EB432C4F002CB9D645F26DF09FB41A976127AF` | **MATCH** |
| **EVD-05** | `tests/certification/phase7-critical-workflows.mjs` | `FC524E395D29E8984C3048E9CAD7BF8603D462AB1B64F08F5655787B86D691E3` | **MATCH** |
| **EVD-06** | `tests/reliability/phase6-backup-restore.mjs` | `B5DAA0CAF830A169125D47BED5553773013C3C8FA3B7C31FAC736DD092C5D776` | **MATCH** |
| **EVD-07** | `tests/security/adversarial-security-audit.mjs` | `C19BCCE2910A7D4A03C7EFA6D1AA1762A19B0964A6AEAEE2DB9E7E6E9DDA0730` | **MATCH** |
| **EVD-08** | `tests/security/p0-production-security-audit.mjs` | `3CFCE46BCCE9AE73D303849FD168AA8828953A17717A67873646228D72873B5A` | **MATCH** |
| **EVD-09** | `tests/security/enterprise-access-control.test.mjs` | `81E54364EF93B98B78D6FDF5A500D6453DDC8DF9247107323687DD45C0894284` | **MATCH** |
| **EVD-10** | `tests/security/adversarial-commercial-security.mjs` | `32DECBE3889E01C94B73929D78141C5C8FF3425FF11F59017B5ADCF5F139E691` | **MATCH** |
| **EVD-11** | `tests/load/phase6-api-load.mjs` | `A27E5EEAB0CB489D1BF98C7690CDC70755FDB9F450B66F8EF11284015A6C3E3F` | **MATCH** |

### 2.2 Output Result JSON Artifact Hashes (SHA-256)

| Output File Path | Cryptographic SHA-256 Digest | Size (Bytes) | Verification |
| :--- | :--- | :---: | :---: |
| `tests/certification/phase-8-certification-results.json` | `E17568E1A5214BD2642749906CAD7414E9C2FE6E993C089EC561A5720B8BAA75` | 1,845 | **MATCH** |
| `tests/certification/phase7-critical-workflows-results.json` | `F274BE580DA02493DA3E2D66BCFD31472569778EC30DB3CBA8C22B04E09A520A` | 1,220 | **MATCH** |
| `tests/reliability/phase6-backup-restore-results.json` | `FB850B6DF907DE0993357D80958FBE594AB1BC8CF5414A061128FA9CD3E11415` | 1,114 | **MATCH** |
| `tests/load/phase6-api-load-results.json` | `277022372D38A8689832B6664B500BA4127E0F85BEAB202B8E108C3EC9E3E51F` | 2,410 | **MATCH** |

---

## 3. MATHEMATICAL RECONCILIATION OF THE 145 REPORTED OUTCOMES

$$\text{145 Outcomes} = 84 \text{ (Functional/Clinical)} + 59 \text{ (Adversarial Attacks)} + 1 \text{ (DR Drill)} + 1 \text{ (Load Benchmark)}$$

1. **Functional & Clinical Test Assertions (84 Tests):**
   - Cross-Department Hospital Flow: **10** stages (`atomic-cross-department-workflow.test.mjs`)
   - Revenue Launch & Commercial Licensing: **23** assertions (`phase8-revenue-launch.mjs`)
   - Subscription Lifecycle & Payment Lockout: **7** assertions (`commercial-subscription-lifecycle.test.mjs`)
   - Pathology Single-Page Auto-fit: **5** assertions (`pathology-consolidated-single-page.test.mjs`)
   - Critical Healthcare Workflows: **15** assertions (`phase7-critical-workflows.mjs`)
   - P0 Production Security & Credential Hygiene: **10** assertions (`p0-production-security-audit.mjs`)
   - Access Control & Separation of Duties: **14** assertions (`enterprise-access-control.test.mjs`)
2. **Adversarial Security Penetration Attacks (59 Attacks):**
   - OWASP API Top 10 Security Audit: **39** attacks blocked (`adversarial-security-audit.mjs`)
   - Commercial Payment & Checkout Attacks: **20** attacks blocked (`adversarial-commercial-security.mjs`)
3. **Disaster Recovery Drill (1 Drill):**
   - Point-in-Time Recovery Catastrophic Database Wipe: **1** drill (`phase6-backup-restore.mjs`)
   - Measured RTO = 340.94 ms, RPO = 0.00 s, SHA-256 state match (`4e8334c9bed5e332bc66fd98b06e3299811aa1005204d4c18f8ed8c8fb3fa654`)
4. **Performance & Concurrency Load Benchmark (1 Benchmark):**
   - 100-user concurrent load simulation across 35,500 total requests (`phase6-api-load.mjs`)

---

## 4. PHASE 9 FORENSIC RECONCILIATION DELIVERABLES

In addition to the 12 primary Phase 9 certification documents, the following forensic reconciliation deliverables provide complete audit transparency:

- [DOCSEARCH_PHASE9_EVIDENCE_RECONCILIATION.md](file:///d:/DOC%20SEARCH/DOCSEARCH_PHASE9_EVIDENCE_RECONCILIATION.md) — Master forensic challenge of all Phase 9 claims.
- [DOCSEARCH_PHASE9_ACCEPTED_RISK_RECONCILIATION.md](file:///d:/DOC%20SEARCH/DOCSEARCH_PHASE9_ACCEPTED_RISK_RECONCILIATION.md) — Reconciliation of the three accepted risks (`P2-DB-02`, `P2-DATA-02`, `P3-CODE-01`).
- [DOCSEARCH_PHASE9_BACKUP_RETENTION_VERIFICATION.md](file:///d:/DOC%20SEARCH/DOCSEARCH_PHASE9_BACKUP_RETENTION_VERIFICATION.md) — Forensic audit of the 292 MB disk cleanup and backup retention.
- [DOCSEARCH_PHASE9_PILOT_ACTIVATION_CHECKLIST.md](file:///d:/DOC%20SEARCH/DOCSEARCH_PHASE9_PILOT_ACTIVATION_CHECKLIST.md) — Pre-flight readiness gates and responsible owners.

---

## 5. EVIDENCE INTEGRITY SIGN-OFF

All 11 test suites and 4 result JSON artifacts have been physically hashed on disk and cross-referenced with underlying PostgreSQL 18.4 tables.

**Cumulative Assertions Verified:** **145 / 145 (100% Success Rate)**  
**Cryptographic Integrity:** **100% Bit-Perfect Match**  
**Final Release Gate Status:** **CONDITIONAL GO (MAINTAINED FOR 50-BED CONTROLLED HOSPITAL PILOT)**
