# DOC SEARCH — PHASE 6 SCOPE SPECIFICATION

**Document ID**: `DOC_SEARCH_PHASE6_SCOPE.md`  
**Phase**: Phase 6 — Canonical Patient 360 Engine, Longitudinal Care Timeline, and Multi-Tenant Clinical Continuity  
**Classification**: Controlled Production Engineering Scope  
**Status**: APPROVED & SCOPED  
**Date**: 2026-09-26  

---

## 1. Phase 6 Objective

Phase 6 provides the **authoritative, real-time, zero-mock Canonical Patient 360 Engine** for the DocSearch Enterprise HealthTech Platform. It establishes:
1. **Canonical Patient Master Record (MPI)**: Single source of truth for patient identity, deterministic medical record numbers (`MRN-YYYY-NNNNNN`), unique patient codes (`PAT-YYYY-NNNNNN`), and demographic deduplication.
2. **Unified Patient 360 Read Model**: High-performance, consolidated, 11-domain clinical projection (`demographics`, `activeEncounters`, `historicalEncounters`, `vitals`, `clinicalNotes`, `labOrdersResults`, `radiologyStudiesReports`, `prescriptions`, `pharmacyEvents`, `billingPaymentReferences`, `workflowTasks`).
3. **Longitudinal Care Timeline**: Chronological, immutable, append-only history of every encounter, triage assessment, doctor consultation, diagnostic order, laboratory result, pharmacy dispensing, billing transaction, and clinical document.
4. **Multi-Tenant & Location Security Guard**: Zero-trust server-side validation enforcing that client-supplied `tenantId`, `partnerId`, `branchId`, or `locationId` headers and query parameters can never bypass authenticated session boundaries.
5. **Zero-State & Zero-Mock Guarantee**: Strict adherence to genuine empty states across all UI and API interfaces when a new partner, branch, or tenant is provisioned (zero synthetic patients, zero demo timelines, zero mock prescriptions).

---

## 2. Domains Included in Phase 6

| # | Domain | Scope Description | Authority / Boundaries |
|---|---|---|---|
| **1** | **Canonical Patient Master** | Registration, demographic updates (`PATCH`/`PUT`), status transitions (`ACTIVE`/`INACTIVE`), and duplicate candidate resolution (`MERGE`). | Server-authoritative; blocks downstream departments (LIMS, Radiology, Pharmacy, Billing) from creating parallel patient identities. |
| **2** | **Patient 360 Aggregator & Read Model** | Multi-table read projection aggregating patient demographics, active/historical encounters, vitals, clinical notes, lab results, radiology reports, prescriptions, pharmacy dispensing, billing transactions, and workflow tasks. | Read-model projection with atomic invalidation on mutation. |
| **3** | **Longitudinal Care Timeline** | Chronological ordering `(timestamp ASC, sequence ASC)` across all clinical, diagnostic, pharmaceutical, financial, and operational touchpoints. | Append-only projection; immutable audit history. |
| **4** | **Encounter & Triage Backbone** | Clinical encounter lifecycle (`REGISTERED` &rarr; `TRIAGED` &rarr; `IN_CONSULTATION` &rarr; `UNDER_INVESTIGATION` &rarr; `COMPLETED` &rarr; `DISCHARGED`), check-in linkage, queue token issuance, and exit safety gates. | Enforces pending lab/radiology result and unpaid invoice exit guards before encounter completion. |
| **5** | **Zero-State API & UI Experience** | Deterministic empty-state responses (`total: 0`, `patients: []`, `zeroState: true`) for newly onboarded partners and branches. | UI renders genuine zero-state notice; zero static or synthetic cards. |
| **6** | **Security & Multi-Tenant Isolation** | Adversarial scope override defense, cross-tenant isolation, cross-partner isolation, and role-based clearance enforcement (`PATIENT:READ`, `PATIENT:CREATE`, `PATIENT:UPDATE`). | Fail-closed server guards (`ScopeGuard`, `withSecurityContext`, `assertNoAdversarialScopeOverride`). |

---

## 3. Domains Explicitly Excluded (Out of Scope)

The following areas are **OUT OF SCOPE** for Phase 6 and must not be modified:
* **Phase 7 Inpatient Bed Management & Ward Floorplans** (`OUT OF SCOPE — DO NOT IMPLEMENT`).
* **Phase 8 LIMS Analyzer Machine RS-232 / HL7 Driver Bridges** (`OUT OF SCOPE — DO NOT IMPLEMENT`).
* **DICOM PACS Node Tele-Radiology Store-and-Forward Daemon** (`OUT OF SCOPE — DO NOT IMPLEMENT`).
* **Statutory Accounting Ledger Double-Entry Balance Engine** (`OUT OF SCOPE — DO NOT IMPLEMENT`).
* **LLM Ambient Voice Model Fine-Tuning** (`OUT OF SCOPE — DO NOT IMPLEMENT`).
* **Unrelated UI Redesign or Theme Alteration** (`OUT OF SCOPE — DO NOT IMPLEMENT`).

---

## 4. Upstream Dependencies on Frozen Foundations

Phase 6 strictly depends upon the immutable contracts of Phases 1–5:
* **Phase 1 (Master Foundation)**: Fastify REST API Gateway, PostgreSQL connection pooling, Drizzle ORM schema definitions, shared error model (`AppError`, `ErrorCode`).
* **Phase 2 (Partner Configuration Engine)**: Multi-branch facility registry, department configurations (`OPD`, `EMR`, `LIMS`, `RIS`, `PHARMACY`, `BILLING`), facility normalizers.
* **Phase 3 (Identity & RBAC/ABAC Security)**: JWT session context (`userId`, `tenantId`, `organizationId`, `branchId`, `roles`, `permissions`, `dataScope`), `ScopeGuard.assertRecordInScope()`.
* **Phase 4 (Commercial Control & Universal Workflow Engine)**: License & subscription status enforcement (`ACTIVE`, `GRACE_PERIOD`, `SUSPENDED`, `EXPIRED`), capability entitlement enforcement (`CAP_PATIENT_MASTER`), universal task lifecycle.
* **Phase 5 (Patient 360 Foundation & Universal IDs)**: Deterministic sequence generators for Universal IDs (`MRN`, `ENC`, `APT`, `TKN`, `ORD`, `ACC`, `RES`, `RX`, `DISP`, `INV`, `TXN`, `DOC`, `AUD`).

---

## 5. Expected User Journeys

1. **Front Desk Patient Registration**:
   * Receptionist registers walk-in patient &rarr; `POST /api/v1/partner/patient-360/patients` &rarr; Deterministic `MRN` & `PAT` generated in PostgreSQL `clinical.patients` &rarr; Replay is idempotent.
2. **Consultation Check-In & Token Issuance**:
   * Patient arrives for appointment &rarr; `POST /api/v1/partner/patient-360/encounters/check-in` &rarr; Encounter created &rarr; `POST /api/v1/partner/patient-360/tokens` &rarr; Contextual token `TKN-OPD-YYYYMMDD-001` assigned to live doctor queue.
3. **Doctor Consultation & Longitudinal Review**:
   * Doctor opens Patient 360 in `Patient360ExperienceModal` &rarr; Modal fetches live `/api/v1/partner/patient-360/:patientId` and `/api/v1/partner/patient-360/:patientId/timeline` &rarr; Doctor inspects real past encounters, vitals, labs, prescriptions &rarr; Zero mock fallback.
4. **Diagnostic & Pharmacy Order Propagation**:
   * Doctor orders lab test (`CBC`) and writes prescription (`Aspirin`) &rarr; Universal Tasks spawned &rarr; LIMS technicians and pharmacists fulfill order &rarr; Timeline updates chronologically.
5. **Patient Exit with Safety Guard**:
   * Receptionist or Nurse initiates encounter discharge &rarr; Exit guard checks for in-flight pending diagnostic reports or unpaid pharmacy bills &rarr; Blocks exit unless explicit clinical override reason is recorded.

---

## 6. Expected API Contracts

| Method | Route | Description | Auth / Scope |
|---|---|---|---|
| `GET` | `/api/v1/partner/patient-360/patients` | List/search canonical patients with zero-state telemetry | `PATIENT:READ` + Branch Scope |
| `GET` | `/api/v1/partner/patient-360/patients/:patientId` | Retrieve canonical patient demographics & master identity | `PATIENT:READ` + Branch Scope |
| `PATCH` | `/api/v1/partner/patient-360/patients/:patientId` | Update canonical patient demographics & emergency contacts | `PATIENT:UPDATE` + Branch Scope |
| `PUT` | `/api/v1/partner/patient-360/patients/:patientId` | Optimistic concurrency update of patient master record | `PATIENT:UPDATE` + Branch Scope |
| `POST` | `/api/v1/partner/patient-360/patients` | Register new canonical patient in Patient Master | `PATIENT:CREATE` + Branch Scope |
| `POST` | `/api/v1/partner/patient-360/appointments` | Book appointment linked to canonical patient | `APPOINTMENT:CREATE` |
| `POST` | `/api/v1/partner/patient-360/encounters/check-in` | Check in appointment or create direct encounter | `ENCOUNTER:CREATE` |
| `POST` | `/api/v1/partner/patient-360/tokens` | Issue department queue token | `TOKEN:CREATE` |
| `PATCH` | `/api/v1/partner/patient-360/tokens/:tokenId/status` | Transition token queue status | `TOKEN:UPDATE` |
| `POST` | `/api/v1/partner/patient-360/consultations` | Record consultation notes, vitals, diagnoses | `CONSULTATION:CREATE` |
| `POST` | `/api/v1/partner/patient-360/orders` | Create diagnostic/pharmacy clinical order | `ORDER:CREATE` |
| `POST` | `/api/v1/partner/patient-360/results` | Record verified lab result or pharmacy action | `RESULT:CREATE` |
| `POST` | `/api/v1/partner/patient-360/transactions` | Record billing invoice & payment receipt | `BILLING:CREATE` |
| `POST` | `/api/v1/partner/patient-360/documents` | Link clinical PDF/document to patient & encounter | `DOCUMENT:CREATE` |
| `GET` | `/api/v1/partner/patient-360/:patientId` | Consolidated 11-domain Patient 360 Read Model | `PATIENT:READ` + Branch Scope |
| `GET` | `/api/v1/partner/patient-360/:patientId/timeline` | Complete chronological longitudinal care timeline | `PATIENT:READ` + Branch Scope |

---

## 7. Acceptance Criteria

1. **100% Test Pass Rate**: `phase06-patient-360-verification.test.mjs` executes with 10/10 PASS across Groups A–I.
2. **Zero Regressions**: All 12 regression test suites across Phases 1–5 pass with 100% success.
3. **Clean Workspace Build**: `npm.cmd run build` exits with code 0 across all 12 monorepo packages.
4. **Zero-Mock UI Integration**: `Patient360ExperienceModal.tsx` in `@docsearch/partner-platform` connects to live REST endpoints with genuine zero-state rendering and zero synthetic mock fixtures.
5. **Multi-Tenant Security**: Zero cross-tenant or cross-branch data leakage; adversarial parameter spoofing fails closed (`403 FORBIDDEN`).
6. **Immutable Audit Lineage**: Every clinical, financial, or demographic mutation records an append-only audit entry.
