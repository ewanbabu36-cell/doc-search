# MRD & ICD-10 — FROZEN SCOPE & PRODUCTION CONTROL CONTRACT
**Doc Search Hospital Platform — Medical Records Department & Diagnosis Coding Suite**
**Status:** `FROZEN`
**Version:** `1.0.0-PROD-CERTIFIED`
**Date:** `2026-08-30`
**Authority:** Lead Product Architect, Backend Architect, Frontend Architect, Database Architect, QA & Security Auditor

---

## 1. PRIMARY RULE — SCOPE FREEZE
The Medical Records Department (MRD) & ICD-10 Coding domain is officially **FROZEN**.

### Prohibitions:
* **No Unapproved Additions:** Do NOT add new MRD or coding features without explicit architectural approval.
* **No Unapproved Removals:** Do NOT remove an approved medical record or coding capability without explicit approval.
* **No Concept Renaming:** Do NOT rename approved medical record classifications or ICD-10 hierarchies.
* **No Phase Exposure:** Do NOT introduce development phase numbers (`Phase 1`, `Phase 2`, `Wave 1`, `Sprint X`) into the production UI.
* **No Fake/Mock State:** Production UI and APIs must strictly use real PostgreSQL persistence through the complete gateway/repository chain.
* **No Casual Schema Changes:** Database models, RLS policies, and API contracts are locked under strict impact-analysis governance.
* **No RBAC Degradation:** All sensitive endpoints enforce server-side authentication, tenant scoping, branch scoping, and granular RBAC.

> **Change Control Directive:**
> If a requested modification falls outside this frozen contract:
> `STOP` → `REPORT SCOPE CONFLICT` → `ASK FOR EXPLICIT APPROVAL` → `WAIT`.

---

## 2. FROZEN MRD & ICD-10 LIFECYCLE
MRD manages the controlled lifecycle from encounter indexing through finalization and amendment:
```text
Patient & Canonical Encounter (OPD / IPD / Emergency / OT)
       ↓
Medical Record Index Initialization (`MRD-REC-XXXXXX`, Status: DRAFT)
       ↓
Clinical Documentation Linkage (Discharge summary, Progress notes, Lab/Radiology reports)
       ↓
Clinical Diagnosis & ICD-10 Search (Authoritative ICD-10 Catalog Validation)
       ↓
Diagnosis Coding Assignment (Primary / Secondary / Comorbidity Sequencing)
       ↓
Coding Review & Validation (Senior Coder / Auditor Validation → CODING_VERIFIED)
       ↓
Medical Record Finalization (Status: FINALIZED, Normal Edits Locked)
       ↓
Controlled Record Amendment Workflow (Amendment Reason, Author, Timestamp, Versioning)
       ↓
Patient Longitudinal MRD History & Retrieval
       ↓
Cryptographic Immutable Audit Trail (SHA-256 Chaining)
```

---

## 3. CORE FUNCTIONAL DOMAINS & STATUS

| Domain Area | Description | UI View / Dialog | Backend Route | DB Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Medical Record Management** | Patient & encounter indexing, MRN linkage, digital record repository, completion status | `MRDCommandCenterView`, `MRDControlCenterView` | `GET/POST /api/v1/partner/mrd/records` | `clinical.medical_record_indexes` | `FROZEN / COMPLETE` |
| **ICD-10 Master & Search** | Authoritative ICD-10-CM catalog, code search by name/category, billable validation | `ICD10CodingWorkbenchView` | `GET /api/v1/partner/mrd/icd10/search` | `clinical.medical_diagnosis_codes` | `FROZEN / COMPLETE` |
| **Diagnosis Coding Assignment** | Assigning validated ICD-10 codes, POA (Present on Admission) indicator, sequencing | `ICD10CodingWorkbenchView` | `POST /api/v1/partner/mrd/records/:id/diagnoses` | `clinical.medical_diagnosis_codes` | `FROZEN / COMPLETE` |
| **Coding Review & Validation** | Certified Coder / Auditor peer review, accuracy score (0-100%), coding verification | `CodingReviewView`, `SubmitCodingReviewDialog` | `POST /api/v1/partner/mrd/records/:id/reviews` | `clinical.coding_reviews` | `FROZEN / COMPLETE` |
| **Record Finalization** | Locking completed medical record against unauthorized edits, status to FINALIZED | `MRDControlCenterView` | `POST /api/v1/partner/mrd/records/:id/finalize` | `clinical.medical_record_indexes` | `FROZEN / COMPLETE` |
| **Controlled Amendment** | Formal amendment workflow for finalized records with mandatory justification reason | `MRDControlCenterView` | `POST /api/v1/partner/mrd/records/:id/amend` | `clinical.medical_record_indexes` | `FROZEN / COMPLETE` |
| **Patient Longitudinal MRD History** | Complete patient history across all encounters, coded diagnoses, reviews, and amendments | Patient Profile, MRD Census | `GET /api/v1/partner/patients/:id/mrd-history` | Multi-table Join | `FROZEN / COMPLETE` |
| **Audit Ledger** | SHA-256 hash-chained immutable audit ledger for record indexing, coding, reviews, and amendments | `MRDAuditVaultView` | Audit Repository | `clinical.medical_record_audit_events` | `FROZEN / COMPLETE` |

---

## 4. SECURITY, MULTI-TENANCY & RBAC
1. **Server-Side Enforcement:** Every endpoint validates JWT session context via `authenticate` and `requirePermission`.
2. **Tenant Isolation:** Queries enforce `eq(table.tenantId, session.tenantId)`. Cross-tenant MRD access returns 0 records / 403.
3. **Branch/Facility Scope:** Restricts medical records, coding queues, and registry entries to the assigned facility operational scope.
4. **Role Capabilities:**
   - `MEDICAL_CODER`: `clinical:encounters:create`, `clinical:encounters:read` (Diagnosis coding, ICD-10 assignment)
   - `MRD_OFFICER` / `LEAD_AUDITOR`: `clinical:encounters:create`, `clinical:encounters:update` (Reviews, finalization, amendments)
   - `DOCTOR`: `clinical:patients:read`, `clinical:encounters:read` (Record retrieval, longitudinal history)

---

## 5. DATABASE ARCHITECTURE & REAL PERSISTENCE
* **Canonical Tables in PostgreSQL:**
  - `clinical.mr_departments` (MRD department master)
  - `clinical.medical_record_indexes` (Primary encounter-linked medical record repository)
  - `clinical.medical_diagnosis_codes` (Coded ICD-10 diagnoses)
  - `clinical.coding_reviews` (Coding audit reviews and accuracy tracking)
  - `clinical.clinical_documentation_queries` (Physician queries)
  - `clinical.medical_record_audit_events` (Immutable SHA-256 audit ledger)
* **Zero Client Storage Dependency:** Medical record data is retrieved directly from PostgreSQL through the API Gateway. Browser `localStorage` is not a source of truth for medical records.

---

## 6. CHANGE CONTROL PROCEDURE
Any future request that introduces new capabilities beyond this specification must follow the Frozen Scope Change Control:
1. Submit formal Change Request specifying business need, impacted tables, API routes, and security risk assessment.
2. Architecture Board Review and Security Impact Analysis.
3. Explicit Approval required before any implementation.
