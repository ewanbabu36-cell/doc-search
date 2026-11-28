# DOC SEARCH — DOMAIN 2.17: RADIOLOGY / PACS / MEDICAL IMAGING
# AUTHORITATIVE PRODUCTION FROZEN SCOPE CONTRACT

**Document Version:** 1.0.0 — FROZEN  
**Target Domain:** Radiology & Medical Imaging → Modality Scheduling → DICOM Accessioning → Radiologist Reporting & PACS  
**Classification:** Core Clinical & Diagnostic Subsystem  

---

## 1. EXECUTIVE SUMMARY & DOMAIN SCOPE

Domain 2.17 governs the complete lifecycle of diagnostic medical imaging within the Doc Search Healthcare Operating System, connecting ordering clinicians, imaging modality suites, patient preparation & safety screening gates, accessioning, DICOM study acquisition, PACS viewer integration, structured radiologist reporting, verification locks, controlled amendments, critical alert communication, and centralized billing/MRD ingestion.

### 1.1 In-Scope Capabilities (FROZEN)
- **Modality & Procedure Catalog:** Multi-modality master catalog supporting X-Ray, CT, MRI, Ultrasound (USG), Mammography, Fluoroscopy, and PET/CT.
- **Clinical Order Management:** Priority tiers (`ROUTINE_ELECTIVE`, `URGENT_WITHIN_4_HOURS`, `STAT_EMERGENCY_IMMEDIATE`), clinical indications, body regions, laterality, and contrast media requirements.
- **Scheduling & Resource Assignment:** Modality room assignment, technologist allocation, appointment timeslots, and prep instructions.
- **Safety Screening Gates:**
  - **MRI Safety:** Ferromagnetic implants, cardiac pacemakers, metal screening, and pregnancy screening.
  - **Contrast Clearance:** Serum Creatinine / eGFR check, IV cannula placement, and signed contrast informed consent.
- **Accessioning & DICOM Study Acquisition:** Unique accession number format (`RAD-ACC-XXXXXX`), Study Instance UID, Series count, Instances count, radiation dose DLP (`mGy*cm`), contrast volume administered (`mL`), and PACS viewer URL tokenization.
- **Structured Radiologist Reporting:** Technique, Clinical History, Comparison Study References, Detailed Findings, Impression, and Recommendations.
- **Report Lifecycle & Sign-Off Lock:** `DRAFT` → `FINALIZED` (locked by authorized radiologist sign-off) → `AMENDED` (controlled version increment requiring mandatory justification).
- **Critical Finding Alerting & Communication:** STAT notification flagging and mandatory independent clinician acknowledgement recording.
- **Audit Trails:** Immutable SHA-256 chained transaction logging across all state transitions.

---

## 2. CANONICAL DATA MODEL (PostgreSQL + Drizzle ORM)

| Table Name | Description | Key Enforcements |
| :--- | :--- | :--- |
| `radiology_departments` | Hospital imaging department details | Multi-tenant isolation |
| `radiology_modalities` | Physical imaging scanners (CT, MRI, X-Ray) | AE Title, IP, port, contrast capability |
| `radiology_procedure_catalog`| Imaging procedures with CPT codes | CPT codes, estimated durations, standard charges |
| `radiology_orders` | Doctor-initiated clinical orders | Patient ID, MRN, Encounter, Priority, Contrast flag |
| `radiology_appointments` | Scheduled exam timeslots | Modality code, room, technologist assignment |
| `radiology_preparation_records`| Patient safety screening checklist | Fasting, MRI metal screen, pacemaker, IV cannula |
| `radiology_studies` | Acquired DICOM imaging studies | Unique Accession number, StudyInstanceUID, PACS URL |
| `radiology_reports` | Radiologist interpretation reports | Structured findings, impression, version, sign-off lock |
| `radiology_critical_findings` | Emergent life-threatening alert logs | Flagged by radiologist, Clinician acknowledgement |
| `radiology_quality_events` | Scan repeat or artifact quality incidents| Corrective actions, technologist accountability |
| `radiology_audit_traces` | SHA-256 chained cryptographic audit trail | Actor, Action, Entity, Hash chaining |

---

## 3. SECURITY, RBAC & TENANT ISOLATION

### 3.1 Permission Scopes
- `clinical:radiology:read` — View worklists, modality catalogs, orders, studies, and reports.
- `clinical:radiology:create` — Order imaging, schedule slots, record preps, acquire studies, draft reports.
- `clinical:radiology:update` — Reschedule/cancel exams, finalize reports, amend reports, acknowledge critical findings.
- `clinical:radiology:delete` — Administrative data management.

### 3.2 Tenant Isolation Guarantee
Every query and mutation strictly enforces `WHERE tenant_id = session.tenantId` at the database and service layer. Cross-tenant reads or writes fail closed with `404 Not Found` or `403 Forbidden`.

---

## 4. REPORT FINALIZATION & AMENDMENT RULES

1. **Lock Invariant:** Once a report transitions to `FINALIZED`, findings and impressions cannot be directly updated or overwritten.
2. **Amendment Contract:** Any modification requires invoking `POST /api/v1/partner/radiology/reports/:id/amend` with a non-empty `amendmentReason` (minimum 5 characters).
3. **Audit Immutability:** Amending a report increments `version` and creates a permanent record in `radiology_audit_traces` with a cryptographic hash.

---

## 5. ZERO UI LEAKAGE STANDARD

All user-facing views in the Partner Platform adhere to strictly operational terminology. No internal developmental artifacts (e.g. `Phase 2`, `Wave`, `Sprint`, `Milestone`, `TODO`) are permitted in user-facing components.

---

## 6. SCOPE FREEZE CERTIFICATION

- **Status:** **FROZEN & VERIFIED**
- **Test Suite:** `apps/api-gateway/test/radiology-pacs-vertical-slice.test.mjs` (15/15 PASS)
- **Monorepo Tests:** 197/197 PASS
- **TypeScript & ESLint:** 0 errors, 0 warnings
