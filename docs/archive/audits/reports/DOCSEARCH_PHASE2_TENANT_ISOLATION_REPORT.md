# DOC SEARCH — PHASE 2: MULTI-TENANT ISOLATION & RLS FORENSIC AUDIT REPORT
**Document Reference:** `DOCSEARCH_PHASE2_TENANT_ISOLATION_REPORT.md`  
**Working Branch:** `audit/master-forensic-remediation`  
**Baseline Commit:** `c60edb3`  
**PostgreSQL Runtime Identity:** `docsearch_app` (`NOSUPERUSER, NOBYPASSRLS`)  
**Target Engine:** PostgreSQL 18.4  
**Status:** FORENSIC ASSESSMENT COMPLETE — ZERO BUSINESS DATA ALTERATIONS PERFORMED  

---

## 1. Executive Summary

A comprehensive multi-tenant isolation forensic audit was executed to determine whether tenant data boundaries are strictly and inviolably enforced at the database level across concurrent connections, pooled sessions, and transactional queries.

The audit verified that Row Level Security (RLS) is active and enforced on 444 clinical and corporate tables. Under runtime identity `docsearch_app`, PostgreSQL strictly forbids cross-tenant data access, spoofed tenant insertions, and un-contexted queries (failing closed).

However, forensic catalog inspection revealed **one critical security gap (`P1-DB-01`)**: table `public.company_doctor_cartel_radar` contains tenant/hospital identifiers but does not have RLS enabled, allowing global data visibility across hospital boundaries.

### Multi-Tenant Isolation Posture Summary
| Dimension | Specification | Actual Audit Result | Compliance |
|---|---|---|---|
| **Runtime Role Permissions** | `NOSUPERUSER`, `NOBYPASSRLS` | `rolsuper: false, rolbypassrls: false` | **100% COMPLIANT** |
| **RLS Enabled Tables** | All tables storing tenant data | **444 Tables Enabled & Forced** | **444 / 445 Tables** |
| **Tenant Tables Lacking RLS** | 0 Tables | **1 Table (`company_doctor_cartel_radar`)** | **P1-DB-01 DEFECT** |
| **Cross-Tenant Read Leakage** | 0 Rows Returned from Tenant B | **0 Rows Returned (Adversarial Suite)** | **100% COMPLIANT** |
| **Cross-Tenant Mutation** | 0 Rows Updated/Deleted in Tenant B | **0 Rows Mutated** | **100% COMPLIANT** |
| **Spoofed Tenant Insertion** | Engine rejects insert with RLS error | **Rejected: RLS policy violation** | **100% COMPLIANT** |
| **Unset Tenant Context** | Fail-closed (0 rows returned) | **0 Rows Returned** | **100% COMPLIANT** |
| **Connection Pool State Poisoning** | Clean session state on TCP socket reuse | **Zero Residual Tenant Context** | **100% COMPLIANT** |

---

## 2. Row-Level Security Catalog Architecture

### 2.1 Enforcement Statistics
Inspecting `pg_class` and `pg_namespace`:
- **Total Tables Evaluated:** 580 tables.
- **RLS Enabled (`relrowsecurity = true`):** 444 tables.
- **RLS Forced (`relforcerowsecurity = true`):** 444 tables.
- **RLS Disabled (`relrowsecurity = false`):** 136 tables.
  - 135 tables are global configurations, master metadata, or system catalogs without tenant columns (e.g. `company.ai_models`, `clinical.vacutainer_tube_catalog`, `company.ai_prompt_templates`).
  - 1 table is tenant-bearing (`public.company_doctor_cartel_radar`).

### 2.2 Standard Tenant Isolation Policy Structure
On secured clinical and company tables, the standard RLS policy enforces:
```sql
CREATE POLICY tenant_isolation_policy ON clinical.patients
  AS RESTRICTIVE
  FOR ALL
  TO docsearch_app
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```
Furthermore, `FORCE ROW LEVEL SECURITY` guarantees that table owners cannot bypass policy evaluation during application queries.

---

## 3. Investigation of Defect P1-DB-01: `public.company_doctor_cartel_radar`

### 3.1 Forensic Evidence
Inspecting table metadata in `pg_class`:
```sql
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'company_doctor_cartel_radar';

-- relname: company_doctor_cartel_radar
-- relrowsecurity: false
-- relforcerowsecurity: false
```
Inspecting table schema (`scratch/phase2_database_forensic_results.json`):
- `id` (uuid)
- `doctor_id` (varchar)
- `doctor_name` (varchar)
- `specialty` (varchar)
- `hospital_id` (varchar) -- Tenant/Hospital Isolation Key
- `hospital_name` (varchar)
- `opd_consult_count` (int4)
- `internal_diagnostic_conversion_pct` (numeric)
- `external_leakage_risk_score` (int4)
- `suspected_destination_entity` (varchar)
- `estimated_monthly_poaching_loss_inr` (numeric)
- `status` (varchar)

### 3.2 Impact Analysis
The table records sensitive operational intelligence regarding suspected doctor patient-poaching, referral cartel activities, and estimated financial losses for specific hospitals (`hospital_id`).
Because RLS is disabled:
1. If a partner or hospital administrator connects or if an API route queries this table without explicit application-level `WHERE hospital_id = ...` clauses, data regarding doctor poaching from competing hospitals will leak across tenants.
2. In `apps/api-gateway/src/routes/company/godmode-admin.routes.ts`, line 45 queries `SELECT * FROM company_doctor_cartel_radar ORDER BY external_leakage_risk_score DESC LIMIT 50`. Without RLS, this relies purely on gateway route protection rather than defense-in-depth database security.

---

## 4. Connection Pool Reuse & State Poisoning Verification

In multi-tenant Node.js applications using connection pools (`pg.Pool`), transaction state leakage (where Tenant B inherits Tenant A's `app.current_tenant_id` on connection reuse) is a critical architectural vulnerability.

### 4.1 Transaction Boundary Discipline
The platform utilizes `SET LOCAL app.current_tenant_id = ...` within an explicit transaction (`BEGIN ... COMMIT`):
```typescript
await client.query('BEGIN');
await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
// ... execute tenant queries ...
await client.query('COMMIT');
```
Because `is_local = true` (`SET LOCAL`), PostgreSQL automatically resets the setting upon transaction conclusion (`COMMIT` or `ROLLBACK`).

### 4.2 Adversarial Pool Reuse Scenario Verification
The adversarial test suite `packages/database/test/adversarial-two-tenant-rls.test.mjs` was re-verified during Phase 2 Step 0:
- **Scenario 9 (Interleaved Parallelism):** 50 concurrent transactions from Tenant A and Tenant B executed across the shared connection pool. **0 cross-talk events; 100% isolation.**
- **Scenario 10 (State Poisoning Prevention):** A physical TCP socket executed a transaction for Tenant A. Immediately following `COMMIT`, a subsequent query without `SET LOCAL` was dispatched on the identical socket. **Result: 0 rows returned (fail-closed); 0 residual tenant context.**
