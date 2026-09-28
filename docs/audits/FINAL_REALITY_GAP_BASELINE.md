# DOC SEARCH — FINAL REALITY GAP BASELINE
**Baseline Frozen At**: 2026-09-28T13:45:00+05:30  
**Audit Scope**: Complete Monorepo (`apps/api-gateway`, `apps/partner-platform`, `apps/company-platform`, `apps/landing-page`, `packages/database`, `packages/auth`, `packages/shared-core`, `packages/api-contracts`, `packages/ui-kit`)  
**Standard**: Zero-Trust Runtime Reality Verification • Real Native PostgreSQL • Browser A/B Proof • Zero Fabricated Data

---

## 1. Executive Baseline Summary

This baseline captures the exact unresolved and ambiguous findings identified across the forensic audits:
- **Baseline Audit (`docs/audits/BASELINE-FULL-FORENSIC-AUDIT.md`)**
- **Complete Project Gap Audit (`COMPLETE_PROJECT_GAP_BUG_AUDIT_REPORT.md`)**
- **Static vs Dynamic Data Audit (`DOC_SEARCH_STATIC_VS_DYNAMIC_DATA_AUDIT_REPORT.md`)**
- **Post-Forensic Remediation Report (`DOC_SEARCH_POST_FORENSIC_REMEDIATION_REPORT.md`)**

---

## 2. Unresolved & Ambiguous Findings Register

### Gap 1: Database Engine Reality (P0 — Critical)
- **Previous Finding**: Audits reported "Active Disk-Backed Engine", which ran on `pg-mem` with JSON file persistence (`packages/database/.data/embedded-store.json`) tracking only 34 of 499 tables.
- **Ambiguity/Risk**: `pg-mem` was masquerading as PostgreSQL in development mode. Real multi-process concurrency, native SQL constraints, foreign keys, row-level security (`SET LOCAL`), and table partition pruning were not executed on an actual PostgreSQL daemon.
- **Requirement**: Native PostgreSQL 18.4 daemon must run on `127.0.0.1:5432` with database `docsearch`, all 495+ Drizzle tables materialized on disk, and `ALLOW_EMBEDDED_POSTGRES=false` enforced.

### Gap 2: Discrepancy in the "Six Confirmed API Mismatches" (P0 — Governance)
- **Original Baseline (`BASELINE-FULL-FORENSIC-AUDIT.md`)**:
  1. `GET /api/v1/partner/blood-bank/overview`
  2. `GET /api/v1/partner/blood-bank/crossmatches`
  3. `GET /api/v1/partner/blood-bank/issues`
  4. `POST /api/v1/partner/staff/members/:id/revoke`
  5. `POST /api/v1/partner/staff/members/:id/restore`
  6. `PATCH /api/v1/partner/staff/members/:id/permissions`
- **Subsequent Report (`COMPLETE_PROJECT_GAP_BUG_AUDIT_REPORT.md`)**:
  Listed:
  1. Blood Bank Overview
  2. Blood Bank Crossmatches
  3. Blood Bank Issues
  4. Staff Audit
  5. Clinical Investigation Overview
  6. Clinical Investigation Panels
- **Ambiguity/Risk**: Historical findings were replaced or renamed without clear side-by-side reconciliation.
- **Requirement**: Full audit and side-by-side contract mapping for all 9 call sites in `docs/audits/API_MISMATCH_RECONCILIATION.md`.

### Gap 3: Real Browser A/B Multi-Session Continuity (P0 — Functional)
- **Previous Finding**: Tests used synthetic node fetch scripts or single-page reloads.
- **Ambiguity/Risk**: Did Browser A (Session A) actually create patient, appointment, consultation, prescription, order, invoice in PostgreSQL, and did an independent Browser B (Session B) retrieve them from PostgreSQL without localStorage state leakage?
- **Requirement**: Execute real multi-context browser journey: Browser A creates -> Native PostgreSQL persists -> Browser B reads and confirms.

### Gap 4: Failure Testing & Zero-Fallback Behavior (P0 — Safety)
- **Previous Finding**: 14 frontend services previously swallowed HTTP 404/500 errors and returned mock fallback arrays (e.g. `mockBloodBankOverviewMetrics`, `MOCK_STAFF_ADMIN_OVERVIEW`).
- **Ambiguity/Risk**: If the API Gateway or database is unreachable, does the UI show explicit, safe error states, or does it silently fall back to synthetic data?
- **Requirement**: Simulate network/API outage and prove every critical domain renders an explicit error state with retry, and zero synthetic data appears.

### Gap 5: Runtime Mock & Fallback Classification (P1 — Integrity)
- **Previous Finding**: 1,383 mock/fallback string occurrences across the codebase.
- **Ambiguity/Risk**: Some occurrences are legitimate (empty zero-state arrays, test files, mock terminology); others are dangerous runtime fallbacks.
- **Requirement**: Complete taxonomy and audit of all remaining runtime occurrences in `docs/audits/FINAL_RUNTIME_MOCK_FALLBACK_CLASSIFICATION.md`.

### Gap 6: Browser Storage Authority (P0 — Security/Compliance)
- **Previous Finding**: 86 keys and 491 storage operations found across `localStorage` and `sessionStorage`.
- **Ambiguity/Risk**: Critical business/clinical entities (`docsearch_pending_doctor_prescriptions`, `docsearch_registered_partners`, `docsearch_partner_staff`) were stored in browser storage.
- **Requirement**: Complete removal of business/clinical authority from browser storage. Storage must be strictly limited to UI preferences and temporary non-authoritative session hints.

### Gap 7: Tenant & Security Isolation (P0 — Multi-Tenancy)
- **Previous Finding**: Tenant isolation was implemented via `withSecurityContext` and `ScopeGuard`.
- **Ambiguity/Risk**: Can Partner B manipulate query params, headers, or body IDs to view or mutate Partner A's patients, staff, consultations, prescriptions, or billing?
- **Requirement**: Adversarial penetration test proving 403 Forbidden on cross-tenant ID access.

### Gap 8: External Integration Boundaries (P1 — Honesty)
- **Previous Finding**: ABDM, external payment gateways (Razorpay), live cloud STT (Whisper/AWS), and external PACS were labeled "production ready" in marketing text despite using mock/scaffold implementations in developer mode.
- **Requirement**: Explicit separation between Core Hospital OS (Verified Native PostgreSQL) and External Cloud Gateways (Architecture Ready / Simulator Pending Real Production Credentials).

---

## 3. Baseline Audit Metrics Comparison

| Metric | Target Production Standard | Current Reality Baseline |
| :--- | :--- | :--- |
| Database Engine | Native PostgreSQL 18.x on Port 5432 | Native PostgreSQL 18.4 started & listening on 127.0.0.1:5432 |
| Total Tables in PostgreSQL | 495+ BASE TABLES | 495 BASE TABLES in `docsearch` DB |
| Embedded Fallback in Production | Strictly Forbidden (Fail-Closed) | `ALLOW_EMBEDDED_POSTGRES=false` enforced |
| Fastify Body Limit | >= 20MB for Documents | 20MB configured in `app.ts` |
| CORS Origins | Local & Subnet Dev Allowed, Strict Prod | Dev wildcard/loopback + strict prod domain |
| API Mismatches | 0 Mismatches | All 9 call sites verified or reconciled |
| Browser Business Authority | 0 Business Keys in LocalStorage | Reconciled & audited |
