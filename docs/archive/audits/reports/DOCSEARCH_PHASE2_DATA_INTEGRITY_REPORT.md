# DOC SEARCH — PHASE 2: DATA INTEGRITY & CORRUPTION FORENSIC AUDIT REPORT
**Document Reference:** `DOCSEARCH_PHASE2_DATA_INTEGRITY_REPORT.md`  
**Working Branch:** `audit/master-forensic-remediation`  
**Baseline Commit:** `c60edb3`  
**Target Engine:** PostgreSQL 18.4  
**Status:** FORENSIC ASSESSMENT COMPLETE — ZERO BUSINESS DATA ALTERATIONS PERFORMED  

---

## 1. Executive Summary

A forensic data integrity assessment was executed across all 580 tables in PostgreSQL 18.4 to detect data corruption, orphaned records, unconstrained relationships, and structural defects.

The audit verified that existing operational clinical data is free of orphaned child records and duplicate Medical Record Numbers (MRNs). However, significant structural omissions were uncovered in relation to missing foreign key constraints and an unmigrated table actively queried by application code.

### Core Integrity Findings Summary
| Integrity Dimension | Target Standard | Forensic Finding | Defect / Status |
|---|---|---|---|
| **Clinical Orphan Records** | 0 Orphaned Records | **0 Orphans Found** | **VERIFIED CLEAN** |
| **Duplicate Patient MRNs** | 0 Duplicates per Tenant | **0 Duplicates Found** | **VERIFIED CLEAN** |
| **Missing Foreign Key Constraints** | 0 Omissions on Key Entity IDs | **81 Entity Columns Missing FKs** | **P1-DATA-01** |
| **Missing Application Tables** | 0 Missing Tables | **1 Table Missing in PostgreSQL** | **P1-DB-03** (`pharmacy_controlled_substances`) |
| **Tables without Primary Key** | 0 Base Tables | **4 Declarative Partition Parents** | **P2-DATA-02** |
| **Foreign Key Validation** | 100% Validated | **1,017 / 1,017 Validated** | **VERIFIED CLEAN** |

---

## 2. Clinical Data Integrity & Orphan Auditing

Read-only SQL queries were executed across core clinical parent-child relationships to check for orphaned records (records whose foreign key points to a non-existent parent):

| Relationship Inspected | Query Check Description | Orphan Count | Integrity Status |
|---|---|---|---|
| `clinical.encounters` -> `clinical.patients` | Encounters without a valid patient record | **0** | **100% Intact** |
| `clinical.pharmacy_prescriptions` -> `clinical.patients` | Prescriptions without a valid patient record | **0** | **100% Intact** |
| `clinical.billing_invoices` -> `clinical.patients` | Invoices without a valid patient record | **0** | **100% Intact** |
| `clinical.billing_invoice_items` -> `clinical.billing_invoices` | Line items without a parent invoice | **0** | **100% Intact** |
| `clinical.investigation_orders` -> `clinical.patients` | Lab orders without a valid patient record | **0** | **100% Intact** |
| `clinical.radiology_orders` -> `clinical.patients` | Radiology orders without a valid patient record | **0** | **100% Intact** |
| `clinical.inpatient_admissions` -> `clinical.patients` | Admissions without a valid patient record | **0** | **100% Intact** |

### Duplicate Medical Record Number (MRN) Check
```sql
SELECT tenant_id, mrn, count(*)
FROM clinical.patients
WHERE mrn IS NOT NULL AND mrn != ''
GROUP BY tenant_id, mrn
HAVING count(*) > 1;
-- Result: 0 rows returned
```
MRN uniqueness is fully maintained across all active tenants.

---

## 3. Defect P1-DATA-01: 81 Clinical & Financial Columns Lacking Foreign Key Constraints

Forensic analysis of the PostgreSQL system catalog (`pg_attribute` joined with `pg_constraint`) identified **81 columns** named `patient_id`, `encounter_id`, `doctor_id`, or `invoice_id` that do not have formal `FOREIGN KEY` constraints.

### Vulnerability & Risk
Without explicit foreign key constraints in the database:
1. Application bugs or partial transaction failures can insert dangling records referencing non-existent patients or encounters.
2. Deleting or archiving a patient or encounter does not trigger referential integrity checks (`ON DELETE RESTRICT` or `ON DELETE CASCADE`), risking silent data corruption.
3. PostgreSQL query planner cannot perform foreign key join elimination optimizations.

### Key Omissions by Domain
- **Inpatient & Emergency:**
  - `clinical.inpatient_admissions.encounter_id` (Lacks FK to `clinical.encounters`)
  - `clinical.emergency_triage_assessments.patient_id` (Lacks FK to `clinical.patients`)
  - `clinical.inpatient_discharge_summaries.patient_id`
  - `clinical.inpatient_doctor_rounds.patient_id`
  - `clinical.inpatient_nursing_assessments.patient_id`
  - `clinical.inpatient_vital_observations.patient_id`
- **Surgery & Operation Theatre:**
  - `clinical.surgery_requests.patient_id` & `encounter_id`
  - `clinical.ot_schedules.patient_id`
  - `clinical.surgical_consents.patient_id`
  - `clinical.intraoperative_records.patient_id`
  - `clinical.surgical_implants.patient_id`
  - `clinical.transfusion_records.encounter_id`
- **LIMS & Radiology:**
  - `clinical.radiology_orders.encounter_id`
  - `clinical.consultation_audit_traces.consultation_id` & `encounter_id`
- **Identity & Financial:**
  - `clinical.patient_abha_accounts.patient_id`
  - `clinical.patient_health_wallets.patient_id`
  - `clinical.patient_packages.patient_id` & `invoice_id`

---

## 4. Defect P1-DB-03: Missing Table `clinical.pharmacy_controlled_substances`

### Forensic Discovery
- Model `pharmacyControlledSubstances` is fully defined in Drizzle TypeScript (`packages/database/src/schema/clinical/index.ts:3095`).
- Querying PostgreSQL for its existence:
  ```sql
  SELECT to_regclass('clinical.pharmacy_controlled_substances');
  -- Result: NULL
  ```
- Cross-referencing application source code:
  - `apps/api-gateway/src/repositories/partner/PharmacyManagementRepository.ts`:
    - Lines 87–93: `db.insert(pharmacyControlledSubstances).values(...)`
    - Lines 105–118: `db.select().from(pharmacyControlledSubstances).where(...)`
  - `apps/api-gateway/src/services/partner/PharmacyManagementService.ts`:
    - Directly routes controlled substance dispensation and register logs to this repository.

### Runtime Impact
In a live healthcare environment, dispensing Schedule H1, X, or narcotic medications is a statutory compliance requirement under India's Drugs and Cosmetics Act and ABDM guidelines. Any attempt by a pharmacist to log or view controlled substances immediately results in an unhandled database exception (`42P01: relation does not exist`) and 500 Internal Server Error.

---

## 5. Defect P2-DATA-02: Tables Lacking Primary Keys

Forensic query identified exactly 4 tables without primary keys:
1. `clinical.appointments_partitioned`
2. `clinical.billing_invoices_partitioned`
3. `clinical.financial_transactions_partitioned`
4. `core.audit_events_partitioned`

### Root Cause & Assessment
In PostgreSQL, these are parent tables for declarative range/list partitioning. In PostgreSQL declarative partitioning, a primary key on the partitioned parent must include all partition key columns. Because the partition keys were not included in the original primary key constraint definition during initial DDL generation, the tables were created without primary keys.
- **Risk:** Child partitions may permit duplicate rows if unique constraints are not enforced across partition keys.
- **Recommendation:** Define composite primary keys on `(id, created_at)` or the respective partition boundary column.
