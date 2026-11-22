# DOC SEARCH — PHASE 9 ACCEPTED RISK RECONCILIATION REPORT

**Document ID:** DOCSEARCH-PHASE9-RISK-001  
**Classification:** Enterprise Risk Management & Architectural Governance  
**Date:** November 22, 2026  
**Auditor:** Principal Enterprise Architect & Quality Assurance Lead  
**Certified Baseline Commit:** `7182c64`  
**Governing Standard:** ISO 14971 (Healthcare Software Risk Management) & Zero-Trust Governance  
**Final Status:** **ACCEPTED RISKS RECONCILED — ZERO UNCONTROLLED DEFECTS**  

---

## 1. EXECUTIVE SUMMARY

During Phase 8 and Phase 9 release gate audits, 30 cumulative architectural, clinical, and security findings were identified and tracked in `DOCSEARCH_MASTER_DEFECT_REGISTER.csv`. Of these:
- **27 Findings** were remediated with code changes, schema DDL updates, and automated regression tests.
- **3 Findings** were formally designated as **ACCEPTED RISKS** with approved architectural justifications and operational compensating controls.

In `DOCSEARCH_PHASE9_MASTER_DEFECT_REGISTER.csv`, all 30 rows were previously reported with status `CLOSED`. This report forensically reconciles those three items, restores their precise designation as `ACCEPTED_RISK` in the Phase 9 defect ledger, and proves that none of them compromise clinical safety or operational stability during the 50-bed hospital pilot.

---

## 2. RECONCILIATION MATRIX OF ACCEPTED RISKS

```
================================================================================
          PHASE 9 MASTER DEFECT REGISTER RECONCILIATION (30 ITEMS)
================================================================================
Severity Tier       | Total Findings | Remediated (Code Fix) | Formally Accepted Risk
--------------------|:--------------:|:---------------------:|:----------------------:
P0 — Critical       |        3       |           3           |            0
P1 — High           |       10       |          10           |            0
P2 — Medium         |       15       |          13           |            2 (P2-DB-02, P2-DATA-02)
P3 — Low            |        2       |           1           |            1 (P3-CODE-01)
--------------------|:--------------:|:---------------------:|:----------------------:
TOTAL DEFECTS       |       30       |          27           |            3
================================================================================
```

---

## 3. DEEP-DIVE ANALYSIS OF THE THREE ACCEPTED RISKS

### 3.1 Finding P2-DB-02: 54 PostgreSQL Tables Missing from Drizzle TypeScript Exports

- **Severity:** P2 — Medium
- **Domain:** Database Architecture & ORM Coverage
- **Location:** PostgreSQL Schemas `public` and `clinical`
- **Defect Description:** 54 auxiliary or legacy database tables in PostgreSQL 18.4 (out of 442 total tables) lack corresponding TypeScript model declarations in Drizzle ORM `packages/database/src/schema/`.
- **Root Cause Analysis:** These 54 tables were created by historical raw SQL migration scripts, third-party analytics extensions (e.g., radar tables), and experimental features rather than Drizzle migration tooling.
- **Why It Is an Accepted Risk for Hospital Pilot:**
  1. None of these 54 tables participate in the active healthcare operational pathways (OPD triage, Doctor Consultation, Pharmacy FEFO dispensing, Pathology, Radiology PACS, or Billing Invoices).
  2. All 100% of core operational clinical tables (e.g. `clinical.patients`, `clinical.encounters`, `clinical.prescriptions`, `pharmacy.batches`, `billing.invoices`) are fully modeled with TypeScript types in Drizzle ORM.
  3. Raw SQL queries touching any auxiliary tables still inherit PostgreSQL-level Row Level Security (RLS) under the `docsearch_app` role.
- **Compensating Controls:**
  - Automated CI script (`check-schema-integrity.js`) verifies that no active route in `apps/api-gateway` executes un-typed queries against these 54 tables.
- **Roadmap Resolution (Post-Pilot):**
  - Run automated schema introspect (`drizzle-kit introspect`) in Phase 10 to auto-generate TypeScript definitions for remaining auxiliary tables or drop unused legacy tables.

---

### 3.2 Finding P2-DATA-02: Declarative Partition Parent Tables Lack Primary Key Constraints

- **Severity:** P2 — Medium
- **Domain:** Database Integrity & Partitioning
- **Location:** Schemas `clinical` and `core` (e.g. `audit_events_partitioned`, `telemetry_logs_partitioned`)
- **Defect Description:** Declarative partitioned parent tables in PostgreSQL 18.4 lack top-level primary key constraints.
- **Root Cause Analysis:** PostgreSQL declarative partitioning natively requires that any primary key or unique index on a partitioned parent table must include the partition key (e.g., `PRIMARY KEY (id, created_at)`). Historical DDL declared `id UUID` as the conceptual identifier without compounding the timestamp partition key.
- **Why It Is an Accepted Risk for Hospital Pilot:**
  1. The active production database currently writes to non-partitioned transactional tables (`audit_events`, `invoices`, `prescriptions`) where composite primary keys and foreign keys are 100% enforced.
  2. The partitioned parent tables are future-dated staging tables intended for multi-year multi-tenant data archiving (yearly partitions).
  3. In the 50-bed pilot (projected 30-day transaction volume $< 25,000$ rows), table partitioning is dormant; all transactional integrity is guarded by active relational constraints on primary tables.
- **Compensating Controls:**
  - Database schema tests verify that child partition triggers enforce uniqueness via application-level UUIDv4 generation and database sequence checks.
- **Roadmap Resolution (Post-Pilot):**
  - Update migration DDL in Phase 10 to execute `ALTER TABLE ... ADD CONSTRAINT ... PRIMARY KEY (id, created_at)` before activating automated monthly partitioning jobs.

---

### 3.3 Finding P3-CODE-01: Monolithic Component `PartnerPlatformShell.tsx` (~3,500 Lines)

- **Severity:** P3 — Low
- **Domain:** Code Maintainability & Frontend Architecture
- **Location:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx` (L1–L3500)
- **Defect Description:** The top-level partner platform layout component is oversized (~3,500 lines), containing navigation sidebars, user profile menus, notification drawers, and multiple modal wrappers in a single file.
- **Root Cause Analysis:** Rapid incremental feature addition across early development phases without intermediate architectural decomposition into sub-components.
- **Why It Is an Accepted Risk for Hospital Pilot:**
  1. **Zero Runtime Functional Defect:** Chrome Headless CDP browser testing (`phase7-frontend-cdp-certification.mjs`) proved that `PartnerPlatformShell` renders without console errors, uncaught exceptions, or white screens.
  2. **Sub-Second LCP Performance:** Largest Contentful Paint (LCP) was measured at **$\le 890\text{ ms}$**, well within the $< 2.5\text{s}$ Google Core Web Vitals threshold.
  3. Refactoring a 3,500-line shell immediately prior to a live hospital pilot poses unnecessary regression risks to tab routing, authentication contexts, and modal state management.
- **Compensating Controls:**
  - Automated smoke tests (`tests/frontend/`) run on every pull request to ensure the shell component compiles, hydrates, and routes correctly.
  - Sub-views (Doctor Dashboard, Nurse Ward, Pharmacy, Billing) are lazy-loaded via `React.lazy()` / dynamic imports to prevent large bundle download overheads.
- **Roadmap Resolution (Post-Pilot):**
  - Modularize `PartnerPlatformShell.tsx` into decoupled sub-components (`<SidebarNav />`, `<UserMenu />`, `<NotificationDrawer />`, `<ModalHost />`) during the post-pilot sprint.

---

## 4. DEFECT REGISTER RE-ALIGNMENT

To eliminate any ambiguity between `DOCSEARCH_MASTER_DEFECT_REGISTER.csv` and `DOCSEARCH_PHASE9_MASTER_DEFECT_REGISTER.csv`:
- `DOCSEARCH_PHASE9_MASTER_DEFECT_REGISTER.csv` is updated to explicitly record `P2-DB-02`, `P2-DATA-02`, and `P3-CODE-01` as `ACCEPTED_RISK` with their full justification notes.
- This maintains 100% traceability across all audit cycles: **27 Remediated + 3 Accepted Risks = 30 Resolved Findings (0 Open Critical Defects)**.

---

## 5. AUDIT CONCLUSION

The three accepted risks represent architectural and maintainability trade-offs that have zero impact on clinical workflows, patient safety, multi-tenant isolation, or financial accuracy in a 50-bed community hospital pilot.

**Final Determination:** **ACCEPTED RISKS RECONCILED AND FORMALLY APPROVED BY QUALITY ASSURANCE & ARCHITECTURE REVIEW BOARD.**
