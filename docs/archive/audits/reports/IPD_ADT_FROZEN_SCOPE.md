# IPD / ADT — FROZEN SCOPE & PRODUCTION CONTROL CONTRACT
**Doc Search Hospital Platform — Inpatient Care & Admission/Discharge/Transfer System**
**Status:** `FROZEN`
**Version:** `1.0.0-PROD-CERTIFIED`
**Date:** `2026-08-30`
**Authority:** Lead Product Architect, Backend Architect, Frontend Architect, Database Architect, QA & Security Auditor

---

## 1. PRIMARY RULE — SCOPE FREEZE
The Inpatient Department (IPD) & Admission/Discharge/Transfer (ADT) domain is officially **FROZEN**.

### Prohibitions:
* **No Unapproved Additions:** Do NOT add new IPD/ADT features without explicit architectural approval.
* **No Unapproved Removals:** Do NOT remove an approved IPD/ADT feature without explicit approval.
* **No Concept Renaming:** Do NOT rename approved healthcare/business concepts.
* **No Phase Exposure:** Do NOT introduce development phase numbers (`Phase 1`, `Phase 2`, `Wave 1`, `Sprint X`) into the production UI.
* **No Fake/Mock State:** Production UI and APIs must strictly use real PostgreSQL persistence through the complete gateway/repository chain.
* **No Casual Schema Changes:** Database models, RLS policies, and API contracts are locked under strict impact-analysis governance.
* **No RBAC Degradation:** All sensitive endpoints enforce server-side authentication, tenant scoping, branch scoping, and granular RBAC.

> **Change Control Directive:**
> If a requested modification falls outside this frozen contract:
> `STOP` → `REPORT SCOPE CONFLICT` → `ASK FOR EXPLICIT APPROVAL` → `WAIT`.

---

## 2. FROZEN IPD / ADT LIFECYCLE
IPD / ADT manages the complete inpatient hospital stay across all operational departments:
```text
Patient & OPD / Emergency Baseline
       ↓
IPD Admission Request & Doctor Clinical Order
       ↓
Bed Allocation (Ward, Room, Bed Number, Bed Board Update)
       ↓
IPD Encounter Creation (Status = ADMITTED)
       ↓
Nursing Station Care (Vitals, Clinical Observations, Care Plans)
       ↓
Authorized Bed Transfer (Atomic Source Release & Destination Occupancy)
       ↓
Inpatient Clinical Orders & Doctor Rounds
       ↓
Discharge Workflow (Clinical Clearance, Bed Release, Summary)
       ↓
Patient IPD Longitudinal History
       ↓
Cryptographic Immutable Audit Trail (SHA-256 Chaining)
```

---

## 3. CORE FUNCTIONAL DOMAINS & STATUS

| Domain Area | Description | UI View / Dialog | Backend Route | DB Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ward & Bed Master** | Management of wards, rooms, bed types, and status (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING`, `BLOCKED`) | `WardDirectoryView`, `BedManagementView` | `GET/POST /api/v1/partner/inpatient/wards`, `beds` | `clinical.inpatient_wards`, `inpatient_beds` | `FROZEN / COMPLETE` |
| **Bed Board & Availability** | Real-time visual bed board and occupancy tracking across facilities and departments | `BedAvailabilityView`, `PatientLocationView` | `GET /api/v1/partner/inpatient/beds` | `clinical.inpatient_beds` | `FROZEN / COMPLETE` |
| **Admission & ADT Center** | Patient admission, doctor assignment, department routing, and IPD encounter generation | `ADTControlCenterView`, `AdmissionRequestView` | `POST /api/v1/partner/inpatient/admissions` | `clinical.inpatient_admissions`, `encounters` | `FROZEN / COMPLETE` |
| **Bed Allocation & Double-Booking Gate** | Automated bed allocation with strict anti-double-booking protection | `AllocateBedDialog` | `POST /api/v1/partner/inpatient/admissions` | `clinical.inpatient_beds` | `FROZEN / COMPLETE` |
| **Bed Transfer Management** | Transactional patient bed transfer with atomic release of source bed and occupancy of destination bed | `TransferManagementView`, `CreateTransferDialog` | `POST /api/v1/partner/inpatient/transfers` | `clinical.inpatient_transfers`, `inpatient_beds` | `FROZEN / COMPLETE` |
| **Nursing Care & Vitals** | Staff nurse documentation of vital signs, fluid balance, nursing notes, and care plans | `NursingStationView`, `NursingCareView` | `POST/GET /api/v1/partner/inpatient/nursing-notes` | `clinical.inpatient_nursing_notes` | `FROZEN / COMPLETE` |
| **Doctor Rounds & Clinical Context** | Attending physician review of inpatient progress, orders, and diagnostic investigations | `DoctorRoundsView` | `GET /api/v1/partner/inpatient/admissions` | `clinical.encounters`, `consultations` | `FROZEN / COMPLETE` |
| **Discharge Management** | Clinical clearance, discharge condition, discharge summary generation, and transactional bed release | `DischargeWorkbenchView`, `DischargeSummaryView` | `POST /api/v1/partner/inpatient/admissions/:id/discharge` | `clinical.inpatient_discharge_summaries`, `inpatient_admissions` | `FROZEN / COMPLETE` |
| **Patient IPD History** | Longitudinal history of all inpatient stays, bed moves, nursing notes, and discharge records | `PatientCensusView`, Patient Profile | `GET /api/v1/partner/patients/:id/inpatient-history` | Multi-table Join | `FROZEN / COMPLETE` |
| **Audit Ledger** | Cryptographic SHA-256 audit ledger tracking admissions, bed assignments, transfers, and discharges | `IPDAuditVaultView` | Audit Repository | `clinical.inpatient_audit_traces` | `FROZEN / COMPLETE` |

---

## 4. SECURITY, MULTI-TENANCY & RBAC
1. **Server-Side Enforcement:** Every endpoint validates JWT session context via `authenticate` and `requirePermission`.
2. **Tenant Isolation:** Queries enforce `eq(table.tenantId, session.tenantId)`. Cross-tenant data access is strictly blocked at the repository and SQL layer.
3. **Branch/Facility Scope:** Restricts bed allocation, nursing notes, and transfer execution to the assigned facility operational scope.
4. **Role Capabilities:**
   - `DOCTOR`: `clinical:encounters:create`, `clinical:encounters:read`, `clinical:encounters:update` (Discharge)
   - `NURSE`: `clinical:encounters:create`, `clinical:encounters:read` (Nursing notes & Vitals)
   - `HOSPITAL_ADMIN`: Full IPD administrative oversight and bed configuration

---

## 5. DATABASE ARCHITECTURE & REAL PERSISTENCE
* **Canonical Tables in PostgreSQL:**
  - `clinical.inpatient_wards` (Ward definitions, types, total beds)
  - `clinical.inpatient_rooms` (Room configurations)
  - `clinical.inpatient_beds` (Beds, status, patient/admission pointers)
  - `clinical.inpatient_admissions` (Inpatient admissions, admitting doctor, department)
  - `clinical.inpatient_transfers` (Bed transfer history with source/target beds)
  - `clinical.inpatient_nursing_notes` (Nurse documentation, observations, vitals)
  - `clinical.inpatient_discharge_summaries` (Discharge condition, hospital course)
  - `clinical.inpatient_audit_traces` (Immutable SHA-256 audit ledger)
* **Zero Client Storage Dependency:** Clinical data is retrieved directly from PostgreSQL through the API Gateway. Browser `localStorage` is not a source of truth for inpatient records.

---

## 6. CHANGE CONTROL PROCEDURE
Any future request that introduces new capabilities beyond this specification must follow the Frozen Scope Change Control:
1. Submit formal Change Request specifying business need, impacted tables, API routes, and security risk assessment.
2. Architecture Board Review and Security Impact Analysis.
3. Explicit Approval required before any implementation.
