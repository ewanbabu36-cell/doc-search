# DOC SEARCH — PHASE 3: STAGE 1 PHARMACY TABLE RECOVERY REPORT
**Document Reference:** `DOCSEARCH_PHASE3_PHARMACY_TABLE_REMEDIATION.md`  
**Phase:** Phase 3 Master Database Remediation & Data Recovery  
**Stage:** Stage 1 Pharmacy Table Recovery  
**Defect Closed:** `P1-DB-03` (Missing table `clinical.pharmacy_controlled_substances`)  
**Remediation Role:** `postgres`  
**Runtime Identity Verified:** `docsearch_app` (`NOSUPERUSER, NOBYPASSRLS`)  
**Status:** REMEDIATED & INDEPENDENTLY VERIFIED  

---

## 1. Executive Summary

Defect `P1-DB-03` resulted in runtime crashes (`42P01: relation "clinical.pharmacy_controlled_substances" does not exist`) in `PharmacyManagementRepository.ts` during statutory controlled substance dispensations (Schedule H1, Schedule X, and Narcotics).

In Stage 1, `clinical.pharmacy_controlled_substances` was formally created in PostgreSQL 18.4 with full Drizzle TypeScript model parity, strict foreign key constraints, composite performance indexes, and enforced Row Level Security (`FORCE ROW LEVEL SECURITY`). Six historical records from `pharmacy.controlled_substance_records` were migrated without data loss.

---

## 2. Table Schema & Security Specification

### 2.1 Table Definition
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
  pharmacist_name VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 Indexing Architecture
- `idx_pharmacy_controlled_substances_tenant` ON `(tenant_id)`
- `idx_pharmacy_controlled_substances_schedule` ON `(tenant_id, schedule_type)`
- `idx_pharmacy_controlled_substances_created` ON `(tenant_id, created_at)`

### 2.3 Row Level Security Policy
```sql
ALTER TABLE clinical.pharmacy_controlled_substances ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical.pharmacy_controlled_substances FORCE ROW LEVEL SECURITY;

CREATE POLICY p_clinical_pharmacy_controlled_substances_tenant_isolation ON clinical.pharmacy_controlled_substances
  FOR ALL
  TO public
  USING (
    (core.is_super_admin() = true) OR 
    (tenant_id = core.get_current_tenant_id())
  )
  WITH CHECK (
    (core.is_super_admin() = true) OR 
    (tenant_id = core.get_current_tenant_id())
  );
```

---

## 3. Empirical Verification Evidence

Connecting as unprivileged runtime user `docsearch_app`:
1. **Unset Tenant Context:** `SELECT count(*) FROM clinical.pharmacy_controlled_substances` returned **0 rows (fail-closed verified)**.
2. **Tenant A Transaction:** Record for Schedule X medication was inserted successfully with `tenant_id: 11111111-1111-4111-8111-111111111111`.
3. **Cross-Tenant Isolation:** When switching context to Tenant B (`22222222-2222-4222-8222-222222222222`), querying for the inserted record returned **0 rows (zero leakage)**.
4. **Historical Data Preservation:** All 6 historical records from `pharmacy.controlled_substance_records` were preserved.

Defect `P1-DB-03` is **REMEDIATED and VERIFIED**.
