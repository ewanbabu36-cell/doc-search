# EMERGENCY & TRAUMA — FROZEN SCOPE & PRODUCTION CONTROL CONTRACT
**Doc Search Hospital Platform — Emergency Department & Acute Trauma Management**
**Status:** `FROZEN`
**Version:** `1.0.0-PROD-CERTIFIED`
**Date:** `2026-08-30`
**Authority:** Lead Product Architect, Backend Architect, Frontend Architect, Database Architect, QA & Security Auditor

---

## 1. PRIMARY RULE — SCOPE FREEZE
The Emergency & Trauma domain is officially **FROZEN**.

### Prohibitions:
* **No Unapproved Additions:** Do NOT add new emergency or trauma features without explicit architectural approval.
* **No Unapproved Removals:** Do NOT remove an approved emergency feature without explicit approval.
* **No Concept Renaming:** Do NOT rename approved healthcare or emergency triage classifications.
* **No Phase Exposure:** Do NOT introduce development phase numbers (`Phase 1`, `Phase 2`, `Wave 1`, `Sprint X`) into the production UI.
* **No Fake/Mock State:** Production UI and APIs must strictly use real PostgreSQL persistence through the complete gateway/repository chain.
* **No Casual Schema Changes:** Database models, RLS policies, and API contracts are locked under strict impact-analysis governance.
* **No RBAC Degradation:** All sensitive endpoints enforce server-side authentication, tenant scoping, branch scoping, and granular RBAC.

> **Change Control Directive:**
> If a requested modification falls outside this frozen contract:
> `STOP` → `REPORT SCOPE CONFLICT` → `ASK FOR EXPLICIT APPROVAL` → `WAIT`.

---

## 2. FROZEN EMERGENCY & TRAUMA LIFECYCLE
Emergency & Trauma manages acute clinical care from arrival through final disposition:
```text
Emergency Registration (Walk-in / Ambulance Arrival, Arrival Mode, Chief Complaint)
       ↓
Level 1-3 Triage Assessment (Category: RED/CRITICAL, YELLOW/URGENT, GREEN/NON_URGENT, Vitals, GCS, Pain)
       ↓
Emergency Work Queue (Live prioritization by clinical urgency)
       ↓
Emergency Encounter & Attending Physician Assignment
       ↓
Emergency Orders & Diagnostics (STAT Lab, Trauma CT/X-Ray, Emergency Medications)
       ↓
Acute Resuscitation & Clinical Treatment (Medication administration, fluids, procedure notes)
       ↓
Observation & Serial Vital Reassessment
       ↓
Final Emergency Disposition (DISCHARGED, ADMITTED to IPD/ICU, TRANSFERRED, REFERRED, LAMA, DECEASED)
       ↓
Patient Emergency Longitudinal History
       ↓
Cryptographic Immutable Audit Trail (SHA-256 Chaining)
```

---

## 3. CORE FUNCTIONAL DOMAINS & STATUS

| Domain Area | Description | UI View / Dialog | Backend Route | DB Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Emergency Registration** | Patient check-in, arrival mode (Ambulance/Walk-in/Police), brought-by details, chief complaint | `RegisterEmergencyPatientDialog` | `POST /api/v1/partner/emergency/registrations` | `clinical.emergency_encounters`, `encounters` | `FROZEN / COMPLETE` |
| **Triage Assessment** | Emergency triage rating (Level 1 Red, Level 2 Yellow, Level 3 Green), initial vitals, GCS, pain score | `EmergencyTriageView` | `POST /api/v1/partner/emergency/encounters/:id/triage` | `clinical.emergency_triage_assessments` | `FROZEN / COMPLETE` |
| **Emergency Work Queue** | Live department queue sorted by triage priority (Critical, Urgent, Non-Urgent) | `EmergencyQueueView`, `EmergencyCommandCenterView` | `GET /api/v1/partner/emergency/queue` | `clinical.emergency_encounters` | `FROZEN / COMPLETE` |
| **Emergency Treatment & Orders** | Physician assessment, STAT lab/radiology/pharmacy orders, and acute medication administration | `EmergencyPatientView` | `POST /api/v1/partner/emergency/encounters/:id/treatments` | `clinical.emergency_encounters` | `FROZEN / COMPLETE` |
| **Observation & Reassessment** | Patient observation, serial vital checks, treatment response tracking | `EmergencyObservationView` | `POST /api/v1/partner/emergency/encounters/:id/treatments` | `clinical.emergency_observation_cases` | `FROZEN / COMPLETE` |
| **Emergency Disposition** | Clinical disposition: `DISCHARGED`, `ADMITTED` (linked to IPD), `TRANSFERRED`, `REFERRED`, `LAMA` | `EmergencyDispositionView` | `POST /api/v1/partner/emergency/encounters/:id/disposition` | `clinical.emergency_disposition_records` | `FROZEN / COMPLETE` |
| **Patient Emergency History** | Longitudinal emergency visit history with full triage, treatment, and disposition records | Patient Profile, Census | `GET /api/v1/partner/patients/:id/emergency-history` | Multi-table Join | `FROZEN / COMPLETE` |
| **Audit Ledger** | SHA-256 hash-chained immutable audit ledger for registrations, triage, treatments, and dispositions | `EmergencyAuditVaultView` | Audit Repository | `clinical.emergency_audit_traces` | `FROZEN / COMPLETE` |

---

## 4. SECURITY, MULTI-TENANCY & RBAC
1. **Server-Side Enforcement:** Every endpoint validates JWT session context via `authenticate` and `requirePermission`.
2. **Tenant Isolation:** Queries enforce `eq(table.tenantId, session.tenantId)`. Cross-tenant emergency access returns 0 records / 403.
3. **Branch/Facility Scope:** Restricts emergency patient queue, triage assessments, and dispositions to the assigned facility operational scope.
4. **Role Capabilities:**
   - `DOCTOR`: `clinical:encounters:create`, `clinical:encounters:read`, `clinical:encounters:update` (Emergency orders, treatment, disposition)
   - `NURSE`: `clinical:encounters:create`, `clinical:encounters:read` (Triage assessment, vitals, nursing notes)
   - `HOSPITAL_ADMIN`: Department oversight and command center access

---

## 5. DATABASE ARCHITECTURE & REAL PERSISTENCE
* **Canonical Tables in PostgreSQL:**
  - `clinical.emergency_departments` (Emergency department definitions)
  - `clinical.emergency_zones` (Resuscitation bay, Trauma zone, Step-down triage)
  - `clinical.emergency_encounters` (Emergency visits, arrival mode, priority, status)
  - `clinical.emergency_triage_assessments` (Triage categories, GCS, pain scores, vitals)
  - `clinical.emergency_observation_cases` (Serial observation cases)
  - `clinical.emergency_disposition_records` (Disposition outcomes, notes, admitting links)
  - `clinical.emergency_audit_traces` (Immutable SHA-256 audit ledger)
* **Zero Client Storage Dependency:** Emergency data is retrieved directly from PostgreSQL through the API Gateway. Browser `localStorage` is not a source of truth for clinical records.

---

## 6. CHANGE CONTROL PROCEDURE
Any future request that introduces new capabilities beyond this specification must follow the Frozen Scope Change Control:
1. Submit formal Change Request specifying business need, impacted tables, API routes, and security risk assessment.
2. Architecture Board Review and Security Impact Analysis.
3. Explicit Approval required before any implementation.
