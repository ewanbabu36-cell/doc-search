# DOC SEARCH — PHASE 2: MIGRATION FORENSIC AUDIT & RECONCILIATION REPORT
**Document Reference:** `DOCSEARCH_PHASE2_MIGRATION_RECONCILIATION.md`  
**Working Branch:** `audit/master-forensic-remediation`  
**Baseline Commit:** `c60edb3`  
**Migration Directory:** `packages/database/migrations`  
**Journal File:** `packages/database/migrations/meta/_journal.json`  
**Database Catalog Table:** `drizzle.__drizzle_migrations`  
**Status:** FORENSIC ASSESSMENT COMPLETE — ZERO BUSINESS DATA ALTERATIONS PERFORMED  

---

## 1. Forensic Summary of Migration State

An exhaustive audit of migration files on disk, the Drizzle journal catalog, ad-hoc execution scripts, and the live PostgreSQL database was conducted. The migration subsystem exhibits acute journal drift and integrity discrepancies:

| Forensic Vector | Expected State | Actual State | Defect Classification |
|---|---|---|---|
| **SQL Files on Disk** | 74 sequential files (0000–0073) | 73 files (0000–0070, 0072–0073) | **P1-MIG-01 (Numbering Gap)** |
| **Journal Entries** | 73 registered entries | 71 registered entries (0000–0070) | **P1-MIG-01 (Journal Drift)** |
| **PostgreSQL Catalog Table** | 73 applied migration records | **0 records (`drizzle.__drizzle_migrations`)** | **P1-MIG-02 (Empty Catalog)** |
| **Data Safety in Migrations** | Zero destructive SQL (`DROP/DELETE`) | **9 unrestricted `DELETE` statements in 0072** | **P1-MIG-03 (Destructive SQL)** |
| **DML / DDL Separation** | Pure DDL schema evolution | **Hardcoded developer UUIDs updated in 0073** | **P2-MIG-04 (DML in Migration)** |
| **Applied Database State** | Synchronized with files | 0072 & 0073 indexes present in DB | **Manual Ad-hoc Application** |

---

## 2. Forensic Investigation of Individual Migration Findings

### 2.1 P1-MIG-01: Numbering Gap (Missing 0071) & Unjournaled Migrations 0072, 0073

#### Finding Evidence
1. **Migration Sequence Gap:**
   - Disk scan of `packages/database/migrations/`:
     - `0070_comprehensive_tenant_rls_hardening.sql` (Present)
     - `0071_*.sql` (MISSING COMPLETELY)
     - `0072_fix_missing_patient_fks.sql` (Present)
     - `0073_performance_indexes_and_encounter_fix.sql` (Present)
2. **Journal State in `meta/_journal.json`:**
   - Ends at `idx: 70`, `tag: "0070_comprehensive_tenant_rls_hardening"`.
   - `0072` and `0073` are **NOT** registered in `_journal.json`.
3. **Ad-Hoc Execution Scripts:**
   - Forensic analysis of `scripts/` discovered:
     - `scripts/apply-migration-0071.mjs`
     - `scripts/apply-migration-0072.mjs`
     - `scripts/apply-migration-0073.mjs`
   - In `scripts/apply-migration-0071.mjs`, line 11:
     `fs.readFileSync(path.resolve('packages/database/migrations/0071_create_least_privilege_app_role.sql'), 'utf-8')`.
   - The file `0071_create_least_privilege_app_role.sql` was authored locally to configure `docsearch_app` but was never committed or registered into Drizzle metadata.

#### Root Cause
Developers generated migration files manually or via ad-hoc scripts without running `drizzle-kit generate` or updating `_journal.json`, breaking Drizzle's migration tracking chain.

---

### 2.2 P1-MIG-02: Zero Applied Records in PostgreSQL `__drizzle_migrations`

#### Finding Evidence
Querying the live database:
```sql
SELECT count(*) FROM drizzle.__drizzle_migrations;
-- Result: 0 rows
```
Although table `drizzle.__drizzle_migrations` exists in the `drizzle` schema, its contents are empty.

#### Impact & Danger
When `drizzle-kit migrate` is executed in CI/CD or production:
1. Drizzle inspects `drizzle.__drizzle_migrations` and sees `count = 0`.
2. Drizzle attempts to execute migration `0000_...` up to `0070_...` sequentially.
3. Because the tables already exist, DDL commands (`CREATE TABLE`, `CREATE TYPE`) fail immediately with `relation "..." already exists` or, worse, attempt destructive alterations.
4. The migration runner fails closed, blocking automated deployments.

---

### 2.3 P1-MIG-03: Destructive Data Deletions in Migration 0072

#### Finding Evidence
File `packages/database/migrations/0072_fix_missing_patient_fks.sql` lines 4–69:
```sql
-- 1. Clean child records of synthetic test radiology orders
DELETE FROM clinical.radiology_appointments 
WHERE order_id IN (
  SELECT r.id FROM clinical.radiology_orders r 
  LEFT JOIN clinical.patients p ON r.patient_id = p.id 
  WHERE r.patient_id IS NOT NULL AND p.id IS NULL
);

DELETE FROM clinical.radiology_reports ...;
DELETE FROM clinical.radiology_studies ...;
DELETE FROM clinical.emergency_triage_assessments ...;
DELETE FROM clinical.emergency_ambulance_transfers ...;
DELETE FROM clinical.emergency_mlc_cases ...;
DELETE FROM clinical.radiology_orders ...;
DELETE FROM clinical.emergency_encounters ...;
DELETE FROM clinical.inpatient_admissions ...;
```

#### Risk Assessment
While intended to clean up orphaned synthetic test data prior to adding `FOREIGN KEY` constraints, bundling unrestricted `DELETE` statements inside a migration is an extreme production risk:
- If a patient record was temporarily archived, de-linked, or queued for reconciliation, running this migration deletes critical clinical records (radiology studies, ambulance transfers, emergency triage, inpatient admissions) permanently!
- Violates healthcare data retention standards (HIPAA, ABDM, Indian Medical Council Regulations).

---

### 2.4 P2-MIG-04: Hardcoded Data Patching in Migration 0073

#### Finding Evidence
File `packages/database/migrations/0073_performance_indexes_and_encounter_fix.sql` lines 6–16:
```sql
UPDATE clinical.encounters 
SET doctor_id = '6ea1ecb3-c991-4db1-bab2-55572625cbbb' 
WHERE id = 'f4a0333e-dab0-4cb7-ab16-a4a53253a627' AND doctor_id IS NULL;

UPDATE clinical.encounters 
SET doctor_id = 'f66b32c8-4304-4e8a-bdad-a2eb87532527' 
WHERE id = '97de5160-a6ec-4701-8426-d1231fe05edd' AND doctor_id IS NULL;

UPDATE clinical.encounters 
SET status = 'TRIAGE' 
WHERE status = 'TRIAGED';
```

#### Risk Assessment
Hardcoding environment-specific UUIDs (`f4a0333e-...`, `97de5160-...`) inside a general schema migration creates non-deterministic side-effects across staging and production environments where these specific encounter IDs do not exist. Data patching must be separated from DDL migrations.

---

## 3. Migration Reconciliation Roadmap (Controlled Remediation in Phase 3)

To resolve all migration defects safely without downtime or data risk, the following phased sequence is planned for execution upon user approval:

```
[Phase 2 Audit (Current)] ──> [User Plan Approval] ──> [Step 1: Baseline Drizzle Catalog]
                                                                   │
                                                                   ▼
[Step 4: Safe Migration Runner] <── [Step 3: Journal Sync] <── [Step 2: DDL/DML Separation]
```

### Step 1: Baseline Drizzle Catalog Population
Insert historical migration hashes (0000 to 0070) directly into `drizzle.__drizzle_migrations` using the calculated SHA256 checksums of existing files. This formally synchronizes PostgreSQL with Drizzle's journal without re-running past DDL.

### Step 2: DDL and Data Patch Separation
1. Retain `0072` strictly for Foreign Key constraint additions (`ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS ...`), moving data cleanup scripts to a dedicated, auditable operational maintenance utility.
2. Split `0073` into pure DDL (index creation) and move the encounter status update to an idempotent clinical state migration.

### Step 3: Journal and Numbering Alignment
1. Synthesize migration `0071_create_least_privilege_app_role.sql` containing idempotent role definition DDL (`DO $$ BEGIN CREATE ROLE docsearch_app ... END $$;`).
2. Update `packages/database/migrations/meta/_journal.json` to register entries `0071`, `0072`, and `0073` with consistent timestamps and tags.

### Step 4: Add New Migration 0074 for Phase 2 Remediations
Author migration `0074_phase2_database_integrity_remediation.sql` containing:
- Creation of missing table `clinical.pharmacy_controlled_substances`.
- Enablement of `ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on `public.company_doctor_cartel_radar`.
- High-priority indexes on the 436 unindexed foreign keys to eliminate table-lock bottlenecks.
