# LIMS — FROZEN SCOPE & IMPLEMENTATION CONTROL CONTRACT
**Doc Search Hospital Platform — Laboratory Information Management System**
**Status:** `FROZEN`
**Version:** `1.0.0-PROD-CERTIFIED`
**Date:** `2026-08-30`
**Authority:** Lead Product Architect, Backend Architect, Frontend Architect, Database Architect, QA & Security Auditor

---

## 1. PRIMARY RULE — SCOPE FREEZE
The Laboratory Information Management System (LIMS) domain is officially **FROZEN**.

### Prohibitions:
* **No Unapproved Additions:** Do NOT add new LIMS features without explicit architectural approval.
* **No Unapproved Removals:** Do NOT remove an approved LIMS feature without explicit approval.
* **No Concept Renaming:** Do NOT rename approved healthcare/business concepts.
* **No Phase Exposure:** Do NOT introduce development phase numbers (`Phase 1`, `Phase 2`, `Wave 1`, `Sprint X`) into the production UI.
* **No Fake/Mock State:** Production UI and APIs must strictly use real PostgreSQL persistence through the complete gateway/repository chain.
* **No Casual Schema Changes:** Database models, RLS policies, and API contracts are locked under strict impact-analysis governance.
* **No RBAC Degradation:** All sensitive endpoints enforce server-side authentication, tenant scoping, branch scoping, and granular RBAC.

> **Change Control Directive:**
> If a requested modification falls outside this frozen contract:
> `STOP` → `REPORT THE CONFLICT` → `ASK FOR EXPLICIT APPROVAL` → `WAIT`.

---

## 2. LIMS PRODUCT IDENTITY & LIFECYCLE
LIMS manages the complete laboratory lifecycle across all clinical departments:
```text
Patient & Encounter
       ↓
Doctor Clinical Order (Test Selection, Priority, Clinical Indication)
       ↓
Lab Worklist & Accessioning
       ↓
Sample Collection (Phlebotomy / Specimen ID / Accession Number)
       ↓
Lab Processing & Analytical Measurement
       ↓
Result Entry (Quantitative & Qualitative Parameters, Ranges, Abnormal Flags)
       ↓
Technical & Pathological Validation (Verification Lock)
       ↓
Doctor Review & Clinical Action (Encounter View & Patient History)
       ↓
Cryptographic Immutable Audit Trail (SHA-256 Chaining)
```

---

## 3. CORE FUNCTIONAL DOMAINS & STATUS

| Domain Area | Description | UI View / Dialog | Backend Route | DB Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Laboratory Master Data** | Catalog of tests, panels, parameters, reference ranges, specimen containers, turnaround times | `InvestigationCatalogView` | `GET /api/v1/partner/lab/catalog` | `clinical.investigation_catalog` | `FROZEN / COMPLETE` |
| **Order Management** | Doctor orders lab tests from active encounter/consultation with priority (`ROUTINE`, `URGENT`, `STAT`) | `CreateInvestigationOrderDialog` | `POST /api/v1/partner/lab/orders` | `clinical.investigation_orders` | `FROZEN / COMPLETE` |
| **Lab Worklist & Queue** | Centralized laboratory work queue showing ordered, collected, processing, and verified tests | `InvestigationOrderDirectoryView` | `GET /api/v1/partner/lab/orders` | `clinical.investigation_orders` | `FROZEN / COMPLETE` |
| **Sample Management** | Specimen collection, tube type assignment, accession number generation, collection notes | `InvestigationProcessingView` | `POST /api/v1/partner/lab/orders/:id/collect-sample` | `clinical.investigation_specimens` | `FROZEN / COMPLETE` |
| **Result Entry** | Technicians enter numeric/text values, units, reference intervals, and abnormal flags (`LOW`, `HIGH`, `NORMAL`) | `EnterInvestigationResultDialog` | `POST /api/v1/partner/lab/orders/:id/results` | `clinical.investigation_results` | `FROZEN / COMPLETE` |
| **Result Verification** | Pathologist/Lab Supervisor verifies and locks results. Unauthorized users receive `403 Forbidden` | `VerifyInvestigationResultDialog` | `PATCH /api/v1/partner/lab/orders/:id/verify` | `clinical.investigation_results` | `FROZEN / COMPLETE` |
| **Doctor Review** | Ordering clinician reviews findings, acknowledges alerts, and documents medical action | `PhysicianInvestigationReviewView` | `PATCH /api/v1/partner/lab/orders/:id/review` | `clinical.investigation_orders` | `FROZEN / COMPLETE` |
| **Patient History** | Complete patient longitudinal record displaying past lab orders and verified reports | `PatientInvestigationHistoryView` | `GET /api/v1/partner/patients/:id/lab-history` | Multi-table Join | `FROZEN / COMPLETE` |
| **Audit Ledger** | SHA-256 hash-chained audit traces for all orders, specimen collections, results, and verifications | `InvestigationAuditVaultView` | Audit Repository | `clinical.investigation_audit_traces` | `FROZEN / COMPLETE` |

---

## 4. SECURITY, MULTI-TENANCY & RBAC
1. **Server-Side Enforcement:** Every endpoint validates JWT session context via `authenticate` and `requirePermission`.
2. **Tenant Isolation:** Queries enforce `eq(table.tenantId, session.tenantId)`. Cross-tenant data access is strictly blocked at the repository and SQL layer.
3. **Branch/Facility Scope:** Restricts specimen accessioning and processing to assigned branch operational facilities.
4. **Role Capabilities:**
   - `DOCTOR`: `lab:orders:create`, `lab:orders:read`, `lab:orders:update` (Review)
   - `LAB_TECHNICIAN`: `lab:specimens:create`, `lab:results:create`
   - `PATHOLOGIST`: `lab:results:update` (Verify & Finalize)
   - `HOSPITAL_ADMIN`: Full oversight and audit inspection

---

## 5. DATABASE ARCHITECTURE & REAL PERSISTENCE
* **Canonical Tables in PostgreSQL:**
  - `clinical.investigation_catalog` (Catalog & parameter definitions)
  - `clinical.investigation_panels` (Grouped test panels)
  - `clinical.investigation_orders` (Lab orders tied to patient, encounter, doctor, tenant)
  - `clinical.investigation_specimens` (Collected specimens & accession numbers)
  - `clinical.investigation_results` (Parameter results, units, reference intervals, flags)
  - `clinical.investigation_reports` (Finalized pathology reports & reviews)
  - `clinical.investigation_audit_traces` (Immutable SHA-256 audit ledger)
* **Zero Client Storage Dependency:** Clinical data is retrieved directly from PostgreSQL through the API Gateway. Browser `localStorage` is not a source of truth for clinical records.

---

## 6. CHANGE CONTROL PROCEDURE
Any future request that introduces new capabilities beyond this specification must follow the Frozen Scope Change Control:
1. Submit formal Change Request specifying business need, impacted tables, API routes, and security risk assessment.
2. Architecture Board Review and Security Impact Analysis.
3. Explicit Approval required before any implementation.
