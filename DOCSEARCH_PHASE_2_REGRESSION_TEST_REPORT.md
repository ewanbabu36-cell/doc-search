# DOC SEARCH — PHASE 2: MASTER REGRESSION TEST REPORT
**Audit Reference:** `DOCSEARCH_TECHNICAL_AUDIT/DOCSEARCH_PHASE_2_REGRESSION_TEST_REPORT.md`  
**Date:** 05 November 2026  
**Auditor / Engineer:** Principal QA Automation Engineer & Independent Production Auditor  
**Scope:** Core Packages (`@docsearch/auth`, `@docsearch/database`), Gateway (`@docsearch/api-gateway`), Frontend Apps  
**Overall Result:** 91 / 91 PASSED (100.0% Empirical Success Rate)  

---

## 1. Regression Test Summary

| Package / Domain | Test Suite File | Tests Executed | Passed | Failed | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Database** | `packages/database/test/comprehensive-rls-isolation.test.mjs` | 7 | 7 | 0 | 1,315 ms |
| **Database** | `packages/database/test/dr-backup-restore.test.mjs` | 4 | 4 | 0 | 34,263 ms |
| **Database** | `packages/database/test/encryption-at-rest.test.mjs` | 4 | 4 | 0 | 643 ms |
| **Database** | `packages/database/test/migration-integrity.test.mjs` | 3 | 3 | 0 | 10 ms |
| **Database** | `packages/database/test/read-write-split.test.mjs` | 1 | 1 | 0 | 55 ms |
| **Database** | `packages/database/test/seed-environment-gating.test.mjs` | 3 | 3 | 0 | 7,685 ms |
| **Auth** | `packages/auth/test/security-wave1.test.mjs` | 21 | 21 | 0 | 27 ms |
| **API Gateway** | `apps/api-gateway/test/dpdp-privacy-compliance.test.mjs` | 6 | 6 | 0 | 17 ms |
| **API Gateway** | `apps/api-gateway/test/abdm-evidence-engine.test.mjs` | 4 | 4 | 0 | 1,520 ms |
| **API Gateway** | `apps/api-gateway/test/clinical-to-cash-persistence.test.mjs` | 11 | 11 | 0 | 10,070 ms |
| **API Gateway** | `apps/api-gateway/test/phase9-pharmacy-retail-wholesale.test.mjs` | 27 | 27 | 0 | 10,601 ms |
| **TOTALS** | **11 Master Suites** | **91** | **91** | **0** | **66.2 s** |

---

## 2. Compilation & Build Regression Verification

| Component | Verification Command | Exit Code | Result |
| :--- | :--- | :--- | :--- |
| `@docsearch/auth` | `tsc --noEmit` | 0 | 0 Type Errors |
| `@docsearch/database` | `tsc --noEmit` | 0 | 0 Type Errors |
| `@docsearch/api-gateway` | `tsc --noEmit` | 0 | 0 Type Errors |
| `apps/landing-page` | `npx vite build` | 0 | Production Bundle Generated (4.69s) |
| `apps/company-platform` | `npx vite build` | 0 | Production Bundle Generated (17.63s) |
| `apps/partner-platform` | `npx vite build` | 0 | Production Bundle Generated (15.42s) |
| `apps/patient-app` | `npx vite build` | 0 | Production Bundle Generated (2.27s) |
| `apps/sovra-pwa` | `npx vite build` | 0 | Production Bundle Generated (1.78s) |

---

## 3. Detailed Test Suite Breakdowns

### 3.1 Database RLS & Multi-Tenant Isolation (7/7 Passed)
- Multi-tenant boundary isolation between Hospital Alpha and Beta: PASS
- Patient record isolation: PASS
- Unauthenticated query fail-closed (0 rows): PASS
- SuperAdmin platform bypass: PASS
- Cross-tenant unauthorized write rejection (RLS WITH CHECK): PASS
- Non-superuser role (`docsearch_app`) policy enforcement: PASS

### 3.2 Disaster Recovery & Encrypted Backup/Restore (4/4 Passed)
- Full logical AES-256-GCM database backup: PASS (12.2s)
- SHA-256 checksum computation & match: PASS
- Isolated clean database creation & restore: PASS (21.4s)
- Row-level zero-loss verification across 580 tables: PASS (38,147 rows verified)

### 3.3 Storage Encryption & Cryptographic Tamper-Proofing (4/4 Passed)
- 256-bit CSPRNG master key validation: PASS
- AES-256-GCM envelope structure verification: PASS
- Tampered ciphertext authentication rejection: PASS
- Tampered authentication tag rejection: PASS

### 3.4 Healthcare Security Foundation (21/21 Passed)
- JWT signature validation, expiration, and issuer verification: PASS (7/7)
- Role-based permissions & scope guards: PASS (6/6)
- Refresh token rotation & reuse family revocation: PASS (3/3)
- Cryptographic SHA-256 audit chaining: PASS (2/2)
- High-entropy secret enforcement: PASS (3/3)

### 3.5 Clinical-to-Cash & Pharmacy Workflows (38/38 Passed)
- Patient intake -> Encounter -> SOAP Notes -> Finalize: PASS (4/4)
- Digital Prescriptions -> LIMS Order Bridging: PASS (2/2)
- Consolidated Invoicing -> Payment Settlement: PASS (2/2)
- Restart durability & atomic transaction rollback: PASS (2/2)
- Wholesale B2B Sales Orders -> Batch Allocation -> Dispatch: PASS (6/6)
- Concurrent FEFO pharmacy stock dispensing (no negative stock): PASS (1/1)
