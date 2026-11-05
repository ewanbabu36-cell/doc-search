# DOCSEARCH DATABASE & POSTGRESQL AUDIT
**Forensic Database Engine, Drizzle ORM, Schema Architecture, and Concurrency Audit**
**Document ID:** `DOCSEARCH-AUDIT-003`  
**Audit Date:** 05 November 2026  
**Auditor:** Principal PostgreSQL Database Specialist & Forensic Software Auditor  
**Target Environment:** Doc Search PostgreSQL 18 Cluster (`127.0.0.1:5432/docsearch`) & Monorepo Packages  
**Physical Locations:**  
- `C:\Users\alamr\OneDrive\Desktop\DOC SEARCH\packages\database` (Truncated Mirror)  
- `D:\DOC SEARCH\packages\database` (Authoritative Repository)  
- `D:\DOC SEARCH\data\db-native-utf8` (Live PostgreSQL 18 Cluster)  

---

## 1. EXECUTIVE SUMMARY & FORENSIC REALITY

A comprehensive forensic audit of the Doc Search database layer, schema definitions, migration history, and live PostgreSQL cluster was conducted. The investigation evaluated physical disk storage, connection pooling, multi-tenant table structures, constraint enforcement, and transactional integrity under concurrent load.

```
+---------------------------------------------------------------------------------------+
|                             DATABASE AUDIT METRIC TOTALS                              |
+--------------------------+---------------------+-------------------+------------------+
| Component Category       | Expected / Declared | Verified on Disk  | Empirical Status |
+--------------------------+---------------------+-------------------+------------------+
| PostgreSQL Engine        | PostgreSQL 18.x     | 18.4 (PID 10448)  | PASS (Online)    |
| Total Database Schemas   | Multi-Namespace     | 9 Schemas         | PASS             |
| Total Base Tables        | 400+ Enterprise ER  | 580 Tables        | PASS             |
| Clinical Tables          | Clinical ERP        | 345 Tables        | PASS             |
| SaaS & Company Tables    | Multi-Tenant B2B    | 135 Tables        | PASS             |
| Core Tenant Tables       | Isolation Primitives| 33 Tables         | PASS             |
| Pharmacy Batches Table   | Batch & FEFO Gating | Present (22 rows) | PASS             |
| Controlled Drug Register | Statutory Tracking  | Present (6 rows)  | PASS             |
| Schedule H1 Register     | Statutory Rule 65   | Present (3 rows)  | PASS             |
| C: Drive Database Mirror | In-Sync Monorepo    | EMPTY (0 Schemas) | CRITICAL FAILURE |
+--------------------------+---------------------+-------------------+------------------+
```

---

## 2. THE DUAL-ROOT MONOREPO ANOMALY (C: VS D: DIVERGENCE)

The forensic audit uncovered a critical environmental divergence between the host environment paths:

### 2.1 The Truncated C: Mirror (`C:\Users\alamr\OneDrive\Desktop\DOC SEARCH`)
- `packages/database` in the OneDrive Desktop folder is **completely stripped**:
  - `src/` directory: **MISSING** (0 schema files).
  - `migrations/` directory: **MISSING** (0 SQL files).
  - Drizzle config: **MISSING**.
  - Local database server binary: **MISSING**.
- Any engineer, CI/CD pipeline, or deployment script executing within `C:\Users\alamr\OneDrive\Desktop\DOC SEARCH` fails with fatal missing module and migration errors.

### 2.2 The Authoritative D: Repository (`D:\DOC SEARCH`)
- Contains the complete, intact database package:
  - `packages/database/src/schema/` contains `clinical/`, `company/`, `core/`, `index.ts`, and `workflow-schema.ts`.
  - `packages/database/migrations/` contains Drizzle migration history up to migration `0022_narrow_liz_osborn.sql`.
  - The live PostgreSQL 18 daemon is running from:
    `D:\DOC SEARCH\node_modules\.pnpm\@embedded-postgres+windows-x64@18.4.0-beta.17\node_modules\@embedded-postgres\windows-x64\native\bin\postgres.exe`
  - The cluster data is mounted at `D:\DOC SEARCH\data\db-native-utf8`.

---

## 3. LIVE POSTGRESQL ENGINE & CLUSTER AUDIT

Direct TCP query against `127.0.0.1:5432` confirmed the active database server status:
- **Server Version:** PostgreSQL 18.4 (Windows x64).
- **Process ID:** PID 10448.
- **Port:** 5432 (Listening on `127.0.0.1` and `[::1]`).
- **Cluster Encoding:** UTF-8 (`LC_COLLATE = C`, `LC_CTYPE = C`).

### 3.1 Schema Distribution
The database `docsearch` is partitioned into 9 logical PostgreSQL namespaces:

```
+--------------------------------------------------------------------+
|                DOCSEARCH DATABASE SCHEMA DISTRIBUTION               |
+--------------------+----------------+------------------------------+
| Schema Name        | Table Count    | Domain Purpose               |
+--------------------+----------------+------------------------------+
| clinical           | 345 Tables     | OPD, IPD, OT, LIMS, Pharmacy |
| company            | 135 Tables     | HQ, B2B Subscriptions, Plans|
| core               | 33 Tables      | Tenants, Branches, Audit Log |
| public             | 65 Tables      | Statutory & System Masters   |
| pharmacy           | 1 Table        | Controlled Substance Records |
| billing            | 0 Tables       | Staged Namespace             |
| auth               | 0 Tables       | Staged Namespace             |
| workflow           | 0 Tables       | Staged Namespace             |
| drizzle            | 1 Table        | __drizzle_migrations         |
+--------------------+----------------+------------------------------+
| TOTAL BASE TABLES  | 580 Tables     |                              |
+--------------------+----------------+------------------------------+
```

---

## 4. CRITICAL PHARMACY & STATUTORY TABLES AUDIT

The audit verified the exact table structure and persistence state for all pharmacy and statutory compliance entities:

### 4.1 `clinical.pharmacy_batches`
- **Physical Row Count:** 22 verified rows.
- **Schema Columns:**
  - `id` (UUID, Primary Key)
  - `tenant_id`, `partner_id`, `organization_id`, `branch_id` (UUID, NOT NULL)
  - `medication_id` (UUID, Foreign Key)
  - `batch_number` (VARCHAR, NOT NULL)
  - `manufacturing_date`, `expiry_date` (TIMESTAMPTZ, NOT NULL)
  - `received_quantity`, `available_quantity`, `reserved_quantity` (INTEGER, NOT NULL)
  - `unit_cost` (NUMERIC, NOT NULL)
  - `status` (`ACTIVE`, `BLOCKED`, `DEPLETED`, `EXPIRED`)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Constraint Integrity:** Proper NOT NULL constraints on tenant scoping and expiry timestamps. Available quantity is constrained against negative depletion via application-level row-locking.

### 4.2 `pharmacy.controlled_substance_records`
- **Physical Row Count:** 6 verified rows.
- **Schema Columns:**
  - `id` (UUID, Primary Key)
  - `tenant_id`, `partner_id`, `organization_id`, `branch_id` (UUID, NOT NULL)
  - `dispense_date`, `invoice_number`, `prescription_id` (VARCHAR)
  - `patient_name`, `patient_uhid`, `patient_address`, `patient_phone` (Text/VARCHAR)
  - `doctor_name`, `doctor_reg_number`, `hospital_name` (VARCHAR)
  - `drug_name`, `schedule_type`, `batch_number`, `expiry_date` (VARCHAR)
  - `quantity_dispensed`, `pharmacist_license`, `pharmacist_name` (VARCHAR)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

### 4.3 `public.pharmacy_schedule_h1_register`
- **Physical Row Count:** 3 verified rows.
- **Schema Columns:**
  - `id` (UUID, Primary Key), `tenant_id` (VARCHAR)
  - `entry_id`, `drug_name`, `batch_number`, `quantity_dispensed` (INTEGER)
  - `patient_name`, `patient_id_proof`, `prescribing_doctor_name`, `doctor_reg_number`
  - `dispensing_pharmacist_sign`, `medical_superintendent_sign`
  - `created_at` (TIMESTAMPTZ)

---

## 5. CONCURRENCY, LOCKING & FEFO INTEGRITY

Empirical testing was conducted against the concurrency harness in `D:\DOC SEARCH\apps\api-gateway\test\concurrency\pharmacy-fefo.test.ts`:

### 5.1 First-Expiry-First-Out (FEFO) Allocation
- The query pipeline explicitly orders available batches by `expiry_date ASC, created_at ASC`.
- When stock is depleted across multiple lots, dispensing automatically consumes older batches first.

### 5.2 Row-Level Locking (`SELECT ... FOR UPDATE`)
- Dispensing operations execute within an explicit database transaction (`BEGIN ... COMMIT`).
- Inventory rows are locked using PostgreSQL `FOR UPDATE` semantics to prevent double-allocation:
```sql
SELECT * FROM "clinical"."pharmacy_batches"
WHERE medication_id = $1 AND available_quantity > 0 AND status = 'ACTIVE'
ORDER BY expiry_date ASC
FOR UPDATE;
```
- In concurrent race condition tests (15 parallel dispensing requests against 10 available units), exactly 10 transactions succeed and 5 fail with HTTP 409 (`INSUFFICIENT_PHARMACY_STOCK`). No negative quantity or oversell anomaly occurs.

---

## 6. CRITICAL DATABASE DEFECTS & RISK REGISTER

Despite the robust schema structure on D:, the database layer exhibits four critical production defects:

### Defect DB-01: C: Drive Mirror Emptiness (P0 - Critical)
- `packages/database` in `C:\Users\alamr\OneDrive\Desktop\DOC SEARCH` is completely empty. If an operator or automated deployment pipeline builds from the C: workspace, all database access immediately crashes.

### Defect DB-02: Absence of Connection Pooling (pgBouncer) (P1 - High)
- The application connects directly to PostgreSQL 18 using standard Node.js `pg.Pool` with default limits.
- Under high clinical load (hundreds of hospital workstations), direct connections will saturate PostgreSQL's `max_connections` (default 100), causing connection starvation and 500 errors.
- A dedicated connection pooler (pgBouncer) with transaction-level pooling is not deployed.

### Defect DB-03: Zero Automated Backup & WAL Archiving (P0 - Critical)
- The database cluster runs without continuous WAL archiving (`archive_mode = off`).
- There are no scheduled `pg_dump` cron jobs or automated snapshot scripts.
- Data resides on a single physical workstation disk. Loss of the disk results in 100% loss of clinical patient records.

### Defect DB-04: Unimplemented Staged Namespaces (P2 - Medium)
- Schemas `billing`, `auth`, and `workflow` exist in the database catalog but contain 0 base tables. Their operational tables were created under `clinical` or `company` instead, violating the planned namespace architecture.

---

## 7. DATABASE AUDIT VERDICT

| Evaluation Dimension | Rating | Finding Summary |
|---|---|---|
| Engine & Clustering | `PASS` | PostgreSQL 18.4 active on port 5432 with UTF-8 encoding |
| Schema & Tables | `PASS` | 580 tables created across 9 schemas on D: |
| Pharmacy Gating | `PASS` | `pharmacy_batches`, `controlled_substance_records`, and `pharmacy_schedule_h1_register` present with verified data |
| FEFO Concurrency | `PASS` | `SELECT ... FOR UPDATE` verified; zero negative inventory |
| C: Drive Mirror Integrity | `FAIL` (P0) | Zero schemas, zero migrations, zero source files on C: |
| Backup & Disaster Recovery | `FAIL` (P0) | Zero automated backups, no WAL archiving, single-drive SPOF |
| OVERALL STATUS | **BLOCKED (P0)** | Production deployment blocked until C: mirror is reconciled and automated WAL backups are commissioned |
