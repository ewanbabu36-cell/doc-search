# DOCSEARCH PHASE 2 BASELINE AUDIT & DISCOVERY
**Authoritative Codebase Verification, Defect Validation, and Remediation Blueprint**
**Document ID:** `DOCSEARCH-P2-BASE-001`  
**Execution Date:** 05 November 2026  
**Primary Repository:** `D:\DOC SEARCH` (Authoritative)  
**Evaluator:** Principal Software Architect, Lead Security Engineer & PostgreSQL Specialist  

---

## 1. BASELINE VERIFICATION & DISCOVERY SUMMARY

Prior to implementing any code or database changes under Phase 2 Engineering Remediation, a thorough re-verification of the 16 Phase 1 audit findings was conducted directly on the authoritative codebase `D:\DOC SEARCH`.

```
+===================================================================================================+
|                               PHASE 2 BASELINE DEFECT STATUS SUMMARY                              |
+----+-----------------------+---------------------+-------------------+------------+---------------+
| No | Domain / Defect       | Phase 1 Finding     | Phase 2 Baseline  | Severity   | Action Plan   |
+----+-----------------------+---------------------+-------------------+------------+---------------+
| 01 | Monorepo Sync         | C: missing 3,654 f. | Confirmed on D:   | P0         | Establish D:  |
| 02 | PostgreSQL Backup/DR  | archive_mode=off    | Confirmed (0 cron)| P0         | Enable WAL+DR |
| 03 | Engine RLS Coverage   | 20 of 514 core RLS  | Confirmed (20 RLS)| P0         | Expand RLS    |
| 04 | Encryption at Rest    | Unencrypted NTFS    | Confirmed         | P0         | Backup Vault  |
| 05 | Connection Pooling    | max_conn = 100      | Confirmed         | P1         | Pooler Tuning |
| 06 | Session Revocation    | In-memory Set       | Confirmed         | P1         | Redis Layer   |
| 07 | Auxiliary App Shells  | Missing main/index  | Confirmed         | P1         | Scaffold Apps |
| 08 | Auth Test Suite       | 21 tests            | 21 passed (0.38s) | PASS       | Baseline OK   |
| 09 | Migrations & Journal  | 69 migrations       | 69 valid on D:    | PASS       | Baseline OK   |
| 10 | Route & View Census   | 109 routes, 108 view| 100% Present on D:| PASS       | Baseline OK   |
+----+-----------------------+---------------------+-------------------+------------+---------------+
```

---

## 2. DETAILED DEFECT-BY-DEFECT BASELINE ANALYSIS

### Defect 1: Dual-Root Codebase Divergence (P0.1)
- **Verified Condition:** `D:\DOC SEARCH` contains 8,894 files, clean Git history on `main` (commit `2083de0`), 69 SQL migrations, 109 routes, 108 shell views, and 186 test files. `C:\Users\alamr\OneDrive\Desktop\DOC SEARCH` is an incomplete mirror missing 3,654 files.
- **Affected Files:** Monorepo package manifests, pnpm-workspace.yaml, build configs.
- **Risk Severity:** `P0 - Critical`.
- **Proposed Implementation:** Lock `D:\DOC SEARCH` as the single authoritative engineering workspace. Mirror changes to C: only as secondary backup artifacts. Validate Turbo clean build and typecheck on D:.
- **Dependencies:** pnpm 9.15.4, Node.js 24.x.
- **Rollback Strategy:** Git branch protection / `git checkout main`.

### Defect 2: Disaster Recovery & Continuous WAL Archiving (P0.2)
- **Verified Condition:** In `D:\DOC SEARCH\data\db-native-utf8\postgresql.conf`, `archive_mode` is commented out/disabled (`off`). Zero automated backup cron jobs exist. All cluster data sits on a single physical drive with infinite RPO and RTO.
- **Affected Files:** `data/db-native-utf8/postgresql.conf`, backup automation scripts.
- **Risk Severity:** `P0 - Critical`.
- **Proposed Implementation:**
  1. Configure `archive_mode = on` and configure a dedicated local/remote `archive_command`.
  2. Implement a production-grade automated backup daemon (`scripts/dr-backup-daemon.mjs`) executing scheduled full database dumps with AES-256-GCM encryption and SHA-256 integrity checksums.
  3. Author an isolated recovery restoration test script (`scripts/test-isolated-restore.mjs`) to verify end-to-end recovery of schemas, indexes, and tables.
- **Dependencies:** PostgreSQL 18 tools, Node.js crypto.
- **Rollback Strategy:** Revert `postgresql.conf` to backup copy, restart daemon.

### Defect 3: Row-Level Security (RLS) Coverage Gap (P0.3)
- **Verified Condition:** Querying `pg_tables` in the live PostgreSQL 18 cluster shows only 20 tables have `rowsecurity = true` out of 580 tables. The remaining 560 tables (including 494 core clinical, pharmacy, and billing tables) lack database kernel RLS.
- **Affected Tables:** `clinical.patients`, `clinical.encounters`, `clinical.prescriptions`, `clinical.pharmacy_batches`, `clinical.billing_invoices`, etc.
- **Risk Severity:** `P0 - Critical`.
- **Proposed Implementation:**
  1. Classify all 580 tables into Tenant-Owned, Shared Reference, Company/HQ, and System Catalog.
  2. Map tenant keys (`tenant_id`, `partner_id`, `organization_id`).
  3. Create version-controlled Drizzle SQL migration `0070_comprehensive_tenant_rls_hardening.sql`.
  4. Enable RLS and apply restrictive tenant isolation policies:
     `core.is_super_admin() OR tenant_id = core.get_current_tenant_id()`.
  5. Author automated negative security test suite (`packages/database/test/comprehensive-rls-isolation.test.mjs`) verifying cross-tenant access is blocked.
- **Dependencies:** Live PostgreSQL 18 database, `@docsearch/database`.
- **Rollback Strategy:** Reversible SQL migration `0070_rollback_rls_hardening.sql` executing `DISABLE ROW LEVEL SECURITY`.

### Defect 4: Host Storage Encryption at Rest (P0.4)
- **Verified Condition:** The physical cluster directory `D:\DOC SEARCH\data\db-native-utf8` resides on an unencrypted NTFS partition.
- **Risk Severity:** `P0 - Critical`.
- **Proposed Implementation:**
  1. Implement client-side and backup-vault encryption using AES-256-GCM with separate key management (`security/key-vault.ts`).
  2. Verify encryption status and key rotation runbooks.
  3. Document BitLocker volume encryption runbook for deployment operators.
- **Dependencies:** Node.js crypto, AES-256-GCM.
- **Rollback Strategy:** Decryption utilities with historical key vault archive.

### Defect 5: Connection Pooling & Concurrency Limits (P1.1)
- **Verified Condition:** Direct connection from Fastify instances to PostgreSQL with `max_connections = 100`.
- **Risk Severity:** `P1 - High`.
- **Proposed Implementation:**
  1. Optimize database client connection pool configuration (`min: 5, max: 25, idleTimeoutMillis: 30000`).
  2. Implement PgBouncer configuration and connection pool health monitoring.
  3. Run load test verifying 250 parallel requests without connection drop.
- **Dependencies:** `pg` pool config, PgBouncer spec.
- **Rollback Strategy:** Revert pool configurations to defaults.

### Defect 6: Session Revocation & Redis Architecture (P1.2)
- **Verified Condition:** `SessionRevocationService.ts` currently stores revoked tokens in an in-memory `Set`.
- **Risk Severity:** `P1 - High`.
- **Proposed Implementation:**
  1. Implement a distributed Redis/cluster-capable session revocation adapter with fallback to resilient shared memory/IPC.
  2. Verify token revocation consistency across multiple workers.
- **Dependencies:** `@docsearch/auth`, Redis client adapter.
- **Rollback Strategy:** In-memory fallback mode.

### Defect 7: Auxiliary Application Shells (P1.3)
- **Verified Condition:** `apps/company-platform` and `apps/landing-page` contain views but lack root entry point scaffolding (`index.html`, `src/main.tsx`).
- **Risk Severity:** `P1 - High`.
- **Proposed Implementation:**
  1. Scaffold `index.html` and `src/main.tsx` for `apps/company-platform` integrating `CompanyCorporateBankSettingsView` and `FinanceDomainManager`.
  2. Scaffold `index.html` and `src/main.tsx` for `apps/landing-page` providing modern doctor & hospital marketing showcase.
  3. Verify production builds.
- **Dependencies:** Vite, React 18, `@docsearch/ui-kit`.
- **Rollback Strategy:** Delete scaffolded entry files.

---

## 3. PHASE 2 BASELINE SIGN-OFF

The baseline audit confirms that the Phase 1 findings are valid, reproducible, and ready for engineering remediation. Implementation will proceed strictly in accordance with Section 11 Priority Execution Rules:

**P0.1** (Repo Sync) -> **P0.2** (Backup & DR) -> **P0.3** (PostgreSQL RLS) -> **P0.4** (Encryption) -> **P1.1-P1.3** (Pools, Redis, Shells) -> **P2/P3** (Performance, Privacy, Quality).
