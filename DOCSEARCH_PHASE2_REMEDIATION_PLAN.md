# DOC SEARCH — PHASE 2: CONTROLLED REMEDIATION PLAN (PHASE 3 BLUEPRINT)
**Document Reference:** `DOCSEARCH_PHASE2_REMEDIATION_PLAN.md`  
**Target Phase:** Phase 3 Controlled Database & Data Integrity Remediation  
**Working Branch:** `audit/master-forensic-remediation`  
**Execution Baseline Commit:** `c60edb3`  
**Target Engine:** PostgreSQL 18.4  
**Author:** Antigravity Forensic Engineering Lead  
**Status:** DRAFT PROPOSAL — PENDING USER APPROVAL PRIOR TO EXECUTION  

---

## 1. Principles of Controlled Remediation

In strict accordance with the Master Forensic Audit Charter:
1. **Zero Downtime:** Operational tables remain accessible to live users throughout remediation.
2. **Zero Data Loss:** No destructive SQL (`DROP TABLE`, `TRUNCATE`, unconstrained `DELETE`).
3. **No Blind Migrations:** Schema changes must be applied through idempotent, reversible scripts.
4. **Least-Privilege Separation:** DDL modifications use `MIGRATION_DATABASE_URL` (`postgres`), while runtime applications continue connecting via `docsearch_app`.
5. **Full Regression Verification:** Every remediated defect must pass automated testing in `tests/database/phase2-database-integrity.test.mjs`.

---

## 2. Phased Remediation Work Breakdown Structure (WBS)

```
[Phase 3A: Critical Schema & RLS] ──> [Phase 3B: Migration Toolchain Reconciliation]
                │                                            │
                ▼                                            ▼
[Phase 3C: Performance Indexing]  ──> [Phase 3D: Referential Integrity & Data Cleanup]
```

### 2.1 Phase 3A — Critical Runtime & Security Fixes

#### Fix 1: Create Missing Table `clinical.pharmacy_controlled_substances` (`P1-DB-03`)
- **Objective:** Eliminate runtime crash in `PharmacyManagementRepository.ts`.
- **Implementation:** Author and execute DDL:
  ```sql
  CREATE TABLE IF NOT EXISTS clinical.pharmacy_controlled_substances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES clinical.operational_partners(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES clinical.operational_organizations(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES clinical.operational_facilities(id) ON DELETE SET NULL,
    dispense_date VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    prescription_id VARCHAR(100),
    patient_name VARCHAR(255) NOT NULL,
    patient_uhid VARCHAR(100),
    patient_address TEXT NOT NULL DEFAULT 'Hospital OPD Patient',
    patient_phone VARCHAR(50) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    doctor_reg_number VARCHAR(100) NOT NULL,
    hospital_name VARCHAR(255),
    drug_name VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(50) NOT NULL DEFAULT 'SCHEDULE_H1',
    batch_number VARCHAR(100) NOT NULL,
    expiry_date VARCHAR(50),
    quantity_dispensed VARCHAR(100) NOT NULL,
    pharmacist_license VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE clinical.pharmacy_controlled_substances ENABLE ROW LEVEL SECURITY;
  ALTER TABLE clinical.pharmacy_controlled_substances FORCE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation_policy ON clinical.pharmacy_controlled_substances
    AS RESTRICTIVE FOR ALL TO docsearch_app
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  ```

#### Fix 2: Enable Row Level Security on `public.company_doctor_cartel_radar` (`P1-DB-01`)
- **Objective:** Eliminate cross-tenant data exposure of doctor poaching and cartel intelligence.
- **Implementation:**
  ```sql
  ALTER TABLE public.company_doctor_cartel_radar ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.company_doctor_cartel_radar FORCE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation_policy ON public.company_doctor_cartel_radar
    AS RESTRICTIVE FOR ALL TO docsearch_app
    USING (hospital_id = current_setting('app.current_tenant_id', true))
    WITH CHECK (hospital_id = current_setting('app.current_tenant_id', true));
  ```

---

### 2.2 Phase 3B — Migration Toolchain & Catalog Reconciliation

#### Fix 3: Synthesize Missing Migration `0071` (`P1-MIG-01`)
- Create `packages/database/migrations/0071_create_least_privilege_app_role.sql` containing the idempotent PostgreSQL role creation and grant statements for `docsearch_app`.

#### Fix 4: Synchronize `meta/_journal.json` (`P1-MIG-01`)
- Append metadata entries for `0071`, `0072`, and `0073` to `_journal.json` with matching SHA256 checksums and sequence indices.

#### Fix 5: Baseline `drizzle.__drizzle_migrations` Catalog (`P1-MIG-02`)
- Execute a baseline seed script inserting records for migrations `0000` through `0073` with calculated timestamps into `drizzle.__drizzle_migrations`.
- This ensures `drizzle-kit migrate` detects all existing migrations as already applied.

#### Fix 6: Sanitize Migration `0072` and `0073` (`P1-MIG-03`, `P2-MIG-04`)
- In `0072_fix_missing_patient_fks.sql`, remove unconditional `DELETE FROM` statements and retain only `ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS ...`.
- In `0073_performance_indexes_and_encounter_fix.sql`, remove hardcoded UUID updates and preserve pure index DDL.

---

### 2.3 Phase 3C — High-Performance Foreign Key Indexing (`P1-PERF-01`)

- **Objective:** Eliminate sequential table scans and `ShareRowExclusiveLock` deadlocks on 436 unindexed foreign keys.
- **Rollout Strategy:**
  - Generate a dedicated migration script creating indexes using `CREATE INDEX IF NOT EXISTS`.
  - Prioritize Tier 1 operational tables:
    - `clinical.billing_invoice_items` (`charge_id`, `charge_item_id`, `service_catalog_id`)
    - `clinical.investigation_results` (`specimen_id`, `analyzed_by_staff_id`, `verified_by_staff_id`)
    - `clinical.inpatient_nursing_notes` (`admission_id`, `nurse_id`)
    - `clinical.pharmacy_dispensing_items` (`dispense_id`, `medication_id`, `batch_id`)
  - Concurrently create indexes across remaining Tier 2 and Tier 3 foreign keys.

---

### 2.4 Phase 3D — Referential Integrity Enforcement (`P1-DATA-01`)

- **Objective:** Add formal foreign key constraints on 81 clinical entity columns.
- **Implementation:**
  - Verify that each column has 0 orphaned values before applying constraints.
  - Apply constraints with `ON DELETE RESTRICT` to prevent accidental deletion of parent records.
  - Example:
    ```sql
    ALTER TABLE clinical.inpatient_admissions
      ADD CONSTRAINT fk_inpatient_admissions_encounter
      FOREIGN KEY (encounter_id) REFERENCES clinical.encounters(id)
      ON DELETE RESTRICT;
    ```

---

### 2.5 Phase 3E — Elimination of Hardcoded Fallback UUIDs (`P0-ID-01`, `P0-ID-02`)

- **Code Removal:**
  - In `BillingManagementRepository.ts` and `BillingManagementService.ts`, delete `const DEFAULT_PARTNER_ID = '00000000-0000-4000-8000-000000000001'`.
  - Enforce strict validation: if `partnerId` is omitted, throw a typed validation error (`BAD_REQUEST: partnerId is required`).
- **Data Remapping:**
  - Author a safe data migration script that looks up the true partner ID from `core.branches` or `core.tenants` and updates legacy records currently stamped with `00000000-0000-4000-8000-000000000001`.

---

## 3. Verification & Acceptance Criteria

Remediation will be verified via:
1. `tests/database/phase2-database-integrity.test.mjs` (All tests must pass).
2. `packages/database/test/adversarial-two-tenant-rls.test.mjs` (12/12 scenarios pass).
3. `tests/security/phase1-security-regression.test.mjs` (7/7 scenarios pass).
4. `drizzle-kit check` returns zero schema drift.
5. `drizzle.__drizzle_migrations` reports fully synchronized migration status.
