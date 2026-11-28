# DOC SEARCH — PHASE 0.2: REGRESSION & HEALTHCARE WORKFLOW VALIDATION REPORT
**Execution Date:** 2026-11-06T09:35:00+05:30  
**Test Harness:** Monorepo Full Regression Harness (`scripts/run-full-regression-certified.mjs`) + TypeScript Checker (`scripts/check-all-tsc.mjs`) + Adversarial RLS Suite  
**Database Connection:** Live PostgreSQL 18.4 (`127.0.0.1:5432`) under `docsearch_app` Role  
**Status:** 100% PASSING (ZERO REGRESSIONS)  

---

## 1. Executive Summary & Test Scorecard

| Test Suite Category | Target Module / Configuration | Total Assertions | Passed | Failed | Exit Code | Execution Time |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Monorepo TypeScript** | 11/11 Project Configs | 11 Configs | **11** | 0 | **0** | 102.4s |
| **Monorepo Certified Regression** | 10 Core Functional Suites | 196 Tests | **196** | 0 | **0** | 51.60s |
| **Adversarial Multi-Tenant RLS** | 12 Zero-Trust Scenarios | 12 Scenarios | **12** | 0 | **0** | 1.84s |
| **Total Empirical Assertions** | **Monorepo Across Entire Stack** | **219** | **219** | **0** | **0** | **155.84s** |

---

## 2. Monorepo TypeScript Compilation Verification (11 / 11 PASSED)

**Command:** `node scripts/check-all-tsc.mjs`  
**Execution Timestamp:** 2026-11-06T03:55:30Z – 2026-11-06T03:57:14Z  
**Exit Code:** `0`  

```
Checking packages/shared-core/tsconfig.json... PASSED
Checking packages/database/tsconfig.json... PASSED
Checking packages/auth/tsconfig.json... PASSED
Checking packages/api-contracts/tsconfig.json... PASSED
Checking packages/ui-kit/tsconfig.json... PASSED
Checking apps/api-gateway/tsconfig.json... PASSED
Checking apps/partner-platform/tsconfig.json... PASSED
Checking apps/patient-app/tsconfig.json... PASSED
Checking apps/sovra-pwa/tsconfig.json... PASSED
Checking apps/company-platform/tsconfig.json... PASSED
Checking apps/landing-page/tsconfig.json... PASSED

✅ All 11/11 TypeScript configurations PASSED.
```

---

## 3. Full Monorepo Certified Regression Harness (196 / 196 PASSED)

**Command:** `node scripts/run-full-regression-certified.mjs`  
**Execution Timestamp:** 2026-11-06T03:59:23Z – 2026-11-06T04:00:14Z  
**Total Duration:** 51.60 seconds  
**Exit Code:** `0`  
**Machine-Readable Evidence File:** `D:\DOC SEARCH\data\regression-certification-evidence.json`  

### Detailed Suite-by-Suite Breakdown:

| Suite ID | Suite Name | Tests | Status | Duration | Key Validations |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Phase 3** | Enterprise Security Certification | 4/4 | **PASS** | 3,577 ms | Least-privilege roles, JWT verification, cryptographic audit immutability |
| **Phase 4** | Clinical Safety & Medical Workflows | 23/23 | **PASS** | 1,849 ms | Patient registration, encounters, clinical notes, prescriptions, allergy alerts |
| **Phase 5** | Financial Integrity & Regulatory | 39/39 | **PASS** | 1,847 ms | Invoices, payments, refund reconciliations, GST compliance, tax math |
| **Phase 5.1**| Financial Corrective Audit | 25/25 | **PASS** | 2,216 ms | Ledger double-entry consistency, cashier reconciliations, multi-currency |
| **Phase 6** | Infrastructure & Resilience | 21/21 | **PASS** | 16,294 ms | Database pool failover, memory leak tests, graceful shutdown, socket resilience |
| **Phase 7.1A**| Kubernetes & TLS Hardening | 16/16 | **PASS** | 321 ms | Pod security admission, network policies, TLS 1.3 certificates, secrets mount |
| **Phase 7.1B**| Kubernetes Staging Manifests | 13/13 | **PASS** | 420 ms | Deployment limits, liveness/readiness probes, HPA configurations, PVC storage |
| **Phase 7.2A**| AWS Cloud Readiness | 16/16 | **PASS** | 9,786 ms | VPC Multi-AZ topology, subnets air-gap, EKS cluster KMS envelope, IMDSv2 |
| **Phase 7.2B**| AWS Security & Compatibility | 16/16 | **PASS** | 7,562 ms | RDS PostgreSQL private security groups, ElastiCache TLS, WORM backup vault |
| **Phase 7.2C**| Production Readiness Certification| 23/23 | **PASS** | 7,722 ms | Zero hardcoded keys, Terraform conformance (128 additions, 0 destructions) |
| **TOTAL** | **10 Regression Test Suites** | **196/196** | **PASS** | **51.60s** | **100% Monorepo Healthcare & Cloud Conformance** |

---

## 4. Zero-Trust PostgreSQL Adversarial RLS Suite (12 / 12 PASSED)

**Command:** `node packages/database/test/adversarial-two-tenant-rls.test.mjs`  
**Execution Timestamp:** 2026-11-06T03:52:41Z  
**Exit Code:** `0`  

```
Runtime Identity Check: {
  current_user: 'docsearch_app',
  session_user: 'docsearch_app',
  rolsuper: false,
  rolbypassrls: false
}
[Scenario 1] Tenant A reads own records... ✅ PASS: Successfully read 2 records
[Scenario 2] Tenant A reads Tenant B records... ✅ PASS: Denied / 0 rows returned
[Scenario 3] Tenant A attempts to update Tenant B records... ✅ PASS: 0 rows affected
[Scenario 4] Tenant A attempts to delete Tenant B records... ✅ PASS: 0 rows affected
[Scenario 5] Tenant A inserts record spoofing Tenant B ID... ✅ PASS: Rejected with RLS policy violation
[Scenario 6] Missing tenant context fails closed... ✅ PASS: 0 rows returned across all tables
[Scenario 7] Manipulated browser tenant header rejected... ✅ PASS: Enforced session tenant (0 leaks)
[Scenario 8] Unauthorized request without authentication denied... ✅ PASS: Blocked at API boundary (401)
[Scenario 9] 50 Interleaved parallel queries from Tenant A & B... ✅ PASS: 100% tenant isolation (0 leaks)
[Scenario 10] Connection pool reuse isolation... ✅ PASS: Consecutive transactions on identical socket reset cleanly
[Scenario 11] Background worker boundary enforcement... ✅ PASS: Worker strictly constrained to Tenant A
[Scenario 12] SSE/WebSocket boundary isolation... ✅ PASS: Real-time channels strictly partitioned

ADVERSARIAL SUITE SUMMARY: 12/12 SCENARIOS PASSED
```

---

## 5. Domain-Specific Clinical & Healthcare Safety Verifications

1. **Pharmacy Stock & FEFO Reconciliation:**
   - Evaluated under `docsearch_app`.
   - Batch deduction during checkout executes within single atomic transaction.
   - Non-negative inventory constraint (`CHECK (stock_qty >= 0)`) prevents overselling.
   - Expired batches (`expiry_date < CURRENT_DATE`) automatically excluded from FEFO allocation.
2. **Clinical Alerts & Panic Intimation:**
   - Critical vitals outside normal physiological thresholds trigger instantaneous notification dispatch.
   - Channel keying ensures alerts broadcast only to doctors authorized within that specific hospital branch.
3. **Financial Invoices & Double-Entry Accounting:**
   - Every invoice payment mutation records balancing credits and debits in `company.payments` and `company.invoices`.
   - RLS strictly isolates billing ledgers; cashier at Hospital A cannot query billing statements of Hospital B.
4. **Append-Only Medical Audit Trails:**
   - Cryptographic immutability trigger (`core.prevent_audit_modification`) tested and verified on live database:
     Attempts to `UPDATE` or `DELETE` rows in `core.audit_events` threw fatal SQL exception `Security Policy Violation: Audit records are cryptographically immutable`.

---

## 6. Regression Conclusion

All 219 empirical assertions passed with zero defects, zero skipped tests, and zero type errors. The introduction of the `docsearch_app` least-privilege role and transaction-local RLS scoping introduces **zero regressions** across existing clinical, financial, or architectural capabilities.
