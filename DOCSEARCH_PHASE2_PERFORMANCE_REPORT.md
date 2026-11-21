# DOC SEARCH — PHASE 2: DATABASE PERFORMANCE & SCALABILITY FORENSIC REPORT
**Document Reference:** `DOCSEARCH_PHASE2_PERFORMANCE_REPORT.md`  
**Working Branch:** `audit/master-forensic-remediation`  
**Baseline Commit:** `c60edb3`  
**Target Engine:** PostgreSQL 18.4  
**Status:** FORENSIC ASSESSMENT COMPLETE — ZERO BUSINESS DATA ALTERATIONS PERFORMED  

---

## 1. Executive Summary

A forensic performance and scalability analysis was conducted on PostgreSQL 18.4 to identify query execution bottlenecks, locking risks, table bloat, and missing index coverage.

The audit identified **436 unindexed foreign key constraints (`P1-PERF-01`)** out of 1,017 total foreign keys (42.9% unindexed). In high-concurrency healthcare environments with hundreds of active clinicians and cashiers, unindexed foreign keys represent the primary cause of catastrophic table-level lock escalation (`ShareRowExclusiveLock`), transaction deadlocks, and severe latency spikes on `UPDATE` and `DELETE` queries.

### Performance Profile Summary
| Performance Metric | Measured Value | Risk Assessment |
|---|---|---|
| **Total Foreign Keys** | 1,017 | — |
| **Unindexed Foreign Keys** | **436 Constraints (42.9%)** | **HIGH (Table Lock Deadlocks & Slow Joins)** |
| **Largest Table by Total Size** | `core.audit_events` (23 MB) | Normal (Audit Log Immutability) |
| **Top Index Overhead** | `company.partner_configuration_versions` (12 MB) | High write overhead |
| **Sequential Scan Ratio Bottleneck** | `company.partner_profiles` (211,919 seq scans) | High read traffic missing index coverage |
| **Dead Tuple Bloat** | Near 0 across all active tables | Excellent (Autovacuum active and functional) |

---

## 2. Forensic Analysis of Defect P1-PERF-01: 436 Unindexed Foreign Keys

### 2.1 The PostgreSQL Foreign Key Locking Mechanism
In PostgreSQL:
1. When a row in a parent table (e.g. `clinical.patients`) is deleted or updated on primary key, PostgreSQL must verify that no referencing rows exist in child tables (e.g. `clinical.billing_invoices`, `clinical.encounters`, `clinical.inpatient_admissions`).
2. If the foreign key column on the child table has an index (e.g. `idx_billing_invoices_patient_id`), PostgreSQL performs an immediate index lookup (`IndexScan`), executing in sub-millisecond time.
3. If the foreign key column **lacks an index**, PostgreSQL must perform a **FULL TABLE SEQUENTIAL SCAN** on the child table while holding a row-share lock!
4. Under concurrent transactions, multiple updates on parent tables attempting sequential scans on unindexed child tables immediately produce deadlocks (`deadlock detected: Process waiting for ShareLock on relation...`).

### 2.2 Critical Unindexed Foreign Key Clusters
The 436 unindexed foreign keys cluster in high-throughput operational domains:

1. **Billing & Financial Transactions:**
   - `clinical.billing_invoice_items` -> `charge_id`, `charge_item_id`, `service_catalog_id`
   - `clinical.billing_credit_notes` -> `invoice_id`, `patient_id`
   - `clinical.billing_debit_adjustments` -> `invoice_id`, `patient_id`
   - `clinical.billing_discounts` -> `invoice_id`, `invoice_item_id`
2. **Laboratory (LIMS) & Diagnostics:**
   - `clinical.investigation_results` -> `specimen_id`, `analyzed_by_staff_id`, `verified_by_staff_id`
   - `clinical.investigation_audit_traces` -> `order_id`, `patient_id`
   - `clinical.investigation_specimens` -> `patient_id`
3. **Nursing & Inpatient Care:**
   - `clinical.inpatient_nursing_notes` -> `admission_id`, `nurse_id`
   - `clinical.inpatient_vital_observations` -> `admission_id`, `recorded_by_id`
   - `clinical.inpatient_care_teams` -> `admission_id`, `staff_id`
   - `clinical.inpatient_intake_output` -> `admission_id`, `staff_id`
4. **Pharmacy & Medication Supply Chain:**
   - `clinical.pharmacy_dispensing_items` -> `dispense_id`, `medication_id`, `batch_id`
   - `clinical.pharmacy_stock_movements` -> `medication_id`, `batch_id`
   - `clinical.pharmacy_rtv_debit_notes` -> `purchase_order_id`, `vendor_id`

---

## 3. Table Size, Index Distribution & Sequential Scan Bottlenecks

### 3.1 Top 15 Tables by Total Disk Footprint
Querying `pg_stat_user_tables`:
| Schema & Table Name | Total Size | Table Data Size | Index Size | Live Tuples | Seq Scans | Index Scans |
|---|---|---|---|---|---|---|
| `core.audit_events` | **23 MB** | 18 MB | 5,640 kB | 67 | 2 | 67 |
| `company.partner_configuration_versions` | **12 MB** | 10 MB | 2,176 kB | 45 | 3 | 638 |
| `core.revocations` | **2,032 kB** | 1,400 kB | 632 kB | 12 | 3 | 5 |
| `company.partner_onboarding_staged_registrations` | **1,960 kB** | 200 kB | 1,760 kB | 0 | 88 | 45 |
| `clinical.medication_catalog` | **1,176 kB** | 784 kB | 392 kB | 0 | 12 | 91 |
| `company.partner_capabilities` | **472 kB** | 176 kB | 296 kB | 0 | 3 | 3,635 |
| `clinical.operational_departments` | **456 kB** | 240 kB | 216 kB | 0 | 3 | 70,941 |
| `core.sessions` | **456 kB** | 152 kB | 304 kB | 6 | 3 | 269,355 |
| `company.partner_profiles` | **448 kB** | 80 kB | 368 kB | 0 | **211,919** | **122,631** |
| `clinical.investigation_orders` | **400 kB** | 40 kB | 360 kB | 0 | 31 | 12 |
| `clinical.inpatient_admissions` | **384 kB** | 40 kB | 344 kB | 0 | 12 | 14 |
| `clinical.billing_invoices` | **368 kB** | 40 kB | 328 kB | 25 | 14 | 16 |
| `clinical.encounters` | **360 kB** | 40 kB | 320 kB | 27 | 12 | 18 |
| `clinical.patients` | **352 kB** | 40 kB | 312 kB | 50 | 14 | 12 |
| `company.partner_subscriptions` | **320 kB** | 40 kB | 280 kB | 2 | 22 | 84 |

### 3.2 Sequential Scan Anomaly: `company.partner_profiles`
Table `company.partner_profiles` has accumulated **211,919 sequential scans** vs. 122,631 index scans.
- **Root Cause:** Application authentication and partner resolution routes query `company.partner_profiles` on columns such as `partner_code`, `slug`, or `subdomain` without matching indexes, forcing full scans on every incoming API request.
- **Remediation:** Add composite indexes on `(tenant_id, partner_code)` and `(slug)`.

---

## 4. Remediation Indexing Plan (Phase 3)

To resolve `P1-PERF-01` without service interruption:
1. **Concurrency:** In production PostgreSQL, index creation must use `CREATE INDEX CONCURRENTLY` to avoid taking write-locks on operational tables.
2. **Prioritization:** Deploy indexes in tiered batches:
   - **Tier 1 (High Traffic):** 50 indexes on billing items, payments, pharmacy dispensing, investigation results, and nursing observations.
   - **Tier 2 (Clinical Care):** 150 indexes on inpatient admissions, surgery, anesthesia, and emergency encounters.
   - **Tier 3 (Master Catalogs & Audits):** Remaining 236 indexes on configuration and trace tables.
