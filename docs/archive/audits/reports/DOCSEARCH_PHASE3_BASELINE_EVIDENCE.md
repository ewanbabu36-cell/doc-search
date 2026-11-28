# DOC SEARCH — PHASE 3: STAGE 0 BASELINE & FORENSIC REVALIDATION REPORT
**Document Reference:** `DOCSEARCH_PHASE3_BASELINE_EVIDENCE.md`  
**Phase:** Phase 3 Master Database Remediation & Data Recovery  
**Stage:** Stage 0 Baseline and Forensic Revalidation  
**Working Branch:** `audit/master-forensic-remediation`  
**Baseline Commit:** `7d4ea19`  
**Engine:** PostgreSQL 18.4 on x86_64-windows (MSVC 19.44.35226, 64-bit)  
**Cluster Location:** `D:\DOC SEARCH\data\db-native-utf8`  
**Runtime Connection Identity:** `docsearch_app` (`rolsuper: false, rolbypassrls: false`)  
**Migration Connection Identity:** `postgres` (`MIGRATION_DATABASE_URL`)  
**Execution Timestamp:** 2026-11-21T19:45:00+05:30  

---

## 1. Executive Summary

Prior to initiating any database remediation or structural modification, an independent Stage 0 forensic revalidation was executed across the DOC SEARCH repository and PostgreSQL 18.4 cluster.

All pre-remediation integrity invariants were re-verified, a complete encrypted snapshot backup of the live database was taken and verified, and baseline row counts and defect states were established.

---

## 2. Environment & System Verification

### 2.1 Git Status & Branch Discipline
- **Active Branch:** `audit/master-forensic-remediation`
- **Latest Commit SHA:** `7d4ea19` (`docs(phase2): add all Phase 2 forensic reports and defect registers to repository`)
- **Working Tree:** Completely clean (0 uncommitted changes, 0 staged changes).

### 2.2 PostgreSQL Engine & Role Configuration
Querying `pg_roles` and runtime connection settings:
```
- PostgreSQL Engine: PostgreSQL 18.4 on x86_64-windows, compiled by msvc-19.44.35226, 64-bit
- Runtime Role: docsearch_app (rolsuper: false, rolbypassrls: false, rolcanlogin: true)
- Migration Role: postgres (rolsuper: true, rolbypassrls: true, rolcanlogin: true)
- Config File: D:/DOC SEARCH/data/db-native-utf8/postgresql.conf
- HBA File: D:/DOC SEARCH/data/db-native-utf8/pg_hba.conf
- Data Directory: D:/DOC SEARCH/data/db-native-utf8
```

---

## 3. Database Catalog & Defect Baseline Revalidation

### 3.1 Catalog Statistics
- **Total Domain Schemas:** 9 (`auth`, `billing`, `clinical`, `company`, `core`, `drizzle`, `pharmacy`, `public`, `workflow`).
- **Total Base Tables:** 580 tables.
  - `clinical`: 345 tables
  - `company`: 135 tables
  - `public`: 65 tables
  - `core`: 33 tables
  - `drizzle`: 1 table
  - `pharmacy`: 1 table
- **Row-Level Security (RLS):**
  - Enabled & Forced: 444 tables
  - Disabled: 136 tables (135 global config, 1 tenant table)
- **Foreign Key Constraints:** 1,017 constraints (100% validated).
- **Unindexed Foreign Keys:** 436 constraints (42.9% unindexed).
- **Missing Foreign Keys:** 81 clinical entity columns.

### 3.2 Confirmed Defect Status
| Defect ID | Severity | Subsystem | Target Object | Baseline State | Target Remediation |
|---|---|---|---|---|---|
| **P1-DB-03** | HIGH | Schema | `clinical.pharmacy_controlled_substances` | Table does not exist (`to_regclass` is NULL) | Create table with tenant RLS & indexes |
| **P1-DB-01** | HIGH | Security | `public.company_doctor_cartel_radar` | `relrowsecurity = false` | Enable and force RLS with tenant policy |
| **P1-MIG-01** | HIGH | Migrations | `packages/database/migrations` | Gap at 0071; unjournaled 0072/0073 | Synthesize 0071; sync `_journal.json` |
| **P1-MIG-02** | HIGH | Migrations | `drizzle.__drizzle_migrations` | 0 rows in catalog table | Baseline seed historical migration records |
| **P1-MIG-03** | HIGH | Migrations | `0072_fix_missing_patient_fks.sql` | 9 unrestricted `DELETE FROM` statements | Sanitize file to pure non-destructive DDL |
| **P2-MIG-04** | MEDIUM | Migrations | `0073_performance_indexes_and_encounter_fix.sql` | Hardcoded DML updates mixed with DDL | Isolate DML from schema migration |
| **P1-PERF-01** | HIGH | Performance | `pg_constraint` | 436 unindexed foreign key constraints | Deploy non-blocking concurrent indexes |
| **P1-DATA-01** | HIGH | Integrity | 81 entity columns | 81 columns lacking foreign keys | Enforce foreign key constraints safely |
| **P0-ID-01/02** | CRITICAL | Identity | `BillingManagementRepository/Service` | Fallback UUID `000...001` in code & DB | Eliminate fallback constant; remap data |

---

## 4. Operational Table Row Counts & Fallback UUID Footprint

### 4.1 Key Table Inventory
- `clinical.patients`: **84 rows**
- `clinical.encounters`: **55 rows**
- `clinical.billing_invoices`: **50 rows**
- `clinical.billing_payments`: **40 rows**
- `clinical.pharmacy_batches`: **44 rows**
- `clinical.pharmacy_prescriptions`: **17 rows**
- `clinical.investigation_orders`: **39 rows**
- `clinical.radiology_orders`: **1 row**
- `clinical.inpatient_admissions`: **8 rows**
- `core.tenants`: **101 rows**
- `core.branches`: **59 rows**
- `core.users`: **82 rows**
- `company.partner_profiles`: **48 rows**

### 4.2 Fallback UUID Footprint (`00000000-0000-4000-8000-000000000001`)
- `clinical.billing_invoices.partner_id`: **25 rows**
- `clinical.billing_payments.partner_id`: **15 rows** (40 total payments, 15 with fallback partner)
- `clinical.encounters.partner_id`: **27 rows**
- `clinical.patients.partner_id`: **50 rows**

---

## 5. Pre-Remediation Encrypted Disaster Recovery Backup

In compliance with Stage 0 Safety Rule 10 ("Maintain a rollback strategy for every database modification"), a complete logical streaming encrypted snapshot was executed via `scripts/dr-backup-engine.mjs`:
- **Vault Archive:** `D:\DOC SEARCH\backups\encrypted_vault\backup_2026-11-21T14-15-08-707Z.enc.json`
- **Encryption:** AES-256-GCM using `backups/keys/master_dr.key`
- **SHA-256 Checksum:** `78d3154b62462cdbe0de8b4694c2e24ea226acf19cca9b83c4651af98854d566`
- **Total Tables Backed Up:** 580 tables across 9 schemas
- **Total Rows Backed Up:** 46,596 rows
- **Archive Size:** 42,055,491 bytes (42 MB)
- **Snapshot Duration:** 48,398 ms

The baseline is fully secured and verified. Stage 0 is complete.
