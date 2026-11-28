# OPERATION THEATRE (OT) & SURGERY — FROZEN SCOPE & PRODUCTION CONTROL CONTRACT
**Doc Search Hospital Platform — Perioperative & Surgical Suite Management**
**Status:** `FROZEN`
**Version:** `1.0.0-PROD-CERTIFIED`
**Date:** `2026-08-30`
**Authority:** Lead Product Architect, Backend Architect, Frontend Architect, Database Architect, QA & Security Auditor

---

## 1. PRIMARY RULE — SCOPE FREEZE
The Operation Theatre (OT) & Surgery domain is officially **FROZEN**.

### Prohibitions:
* **No Unapproved Additions:** Do NOT add new surgical or OT features without explicit architectural approval.
* **No Unapproved Removals:** Do NOT remove an approved surgical feature without explicit approval.
* **No Concept Renaming:** Do NOT rename approved perioperative or surgical classifications.
* **No Phase Exposure:** Do NOT introduce development phase numbers (`Phase 1`, `Phase 2`, `Wave 1`, `Sprint X`) into the production UI.
* **No Fake/Mock State:** Production UI and APIs must strictly use real PostgreSQL persistence through the complete gateway/repository chain.
* **No Casual Schema Changes:** Database models, RLS policies, and API contracts are locked under strict impact-analysis governance.
* **No RBAC Degradation:** All sensitive endpoints enforce server-side authentication, tenant scoping, branch scoping, and granular RBAC.

> **Change Control Directive:**
> If a requested modification falls outside this frozen contract:
> `STOP` → `REPORT SCOPE CONFLICT` → `ASK FOR EXPLICIT APPROVAL` → `WAIT`.

---

## 2. FROZEN PERIOPERATIVE LIFECYCLE
Operation Theatre & Surgery manages the complete surgical journey from booking through post-op recovery:
```text
Patient & Clinical Indication (OPD / IPD / Emergency)
       ↓
Surgical Booking & OT Scheduling (Surgeon, Procedure, OT Room, Table, Date/Time)
       ↓
Pre-Operative Assessment (PAC - Pre-Anaesthesia Checkup & WHO Surgical Safety Checklist)
       ↓
OT Room Allocation & Transfer to OT (Room status = OCCUPIED)
       ↓
Intra-Operative Documentation (Operative Notes, Anaesthesia Chart, Surgical Team, Implants/Consumables)
       ↓
PACU / Post-Operative Recovery (Aldrete Recovery Score, Vitals Monitoring)
       ↓
Post-Op Ward / ICU Transfer & Room Release (Room status = AVAILABLE)
       ↓
Patient Surgical Longitudinal History
       ↓
Cryptographic Immutable Audit Trail (SHA-256 Chaining)
```

---

## 3. CORE FUNCTIONAL DOMAINS & STATUS

| Domain Area | Description | UI View / Dialog | Backend Route | DB Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OT Complex & Rooms** | Management of OT complexes, modular suites, room types (Major/Minor/Cardiac/Robotic), room availability | `OTRoomDirectoryView`, `CreateOTRoomDialog` | `GET/POST /api/v1/partner/ot/rooms` | `clinical.operation_theatre_rooms` | `FROZEN / COMPLETE` |
| **Surgical Booking & Scheduling** | Surgeon booking, procedure assignment, date/time scheduling, anti-conflict table allocation | `OTScheduleView`, `CreateOTScheduleDialog` | `GET/POST /api/v1/partner/ot/schedules` | `clinical.ot_schedules`, `encounters` | `FROZEN / COMPLETE` |
| **Pre-Op PAC Clearance** | Pre-Anaesthesia Checkup, Mallampati airway score, ASA physical status classification, fitness clearance | `OTDirectoryView`, PAC workbench | `POST /api/v1/partner/ot/schedules/:id/pac` | `clinical.pre_operative_assessments` | `FROZEN / COMPLETE` |
| **Intra-Operative Notes** | Lead surgeon operative notes, intraoperative findings, technique, titanium clips/implants, blood loss | `OTRoomDetailView`, Operative form | `POST /api/v1/partner/ot/schedules/:id/operative-notes` | `clinical.operative_notes` | `FROZEN / COMPLETE` |
| **PACU / Recovery** | Post-Anaesthesia Care Unit vital monitoring, pain score, Aldrete recovery score (0-10) | `OTTransferView`, PACU station | `POST /api/v1/partner/ot/schedules/:id/pacu` | `clinical.pacu_recovery_records` | `FROZEN / COMPLETE` |
| **Post-Op Transfer & Room Release** | Patient transfer to Surgical Ward or ICU, transactional release of OT room back to AVAILABLE | `CreateOTTransferDialog` | `POST /api/v1/partner/ot/schedules/:id/transfer-postop` | `clinical.postoperative_transfers`, `operation_theatre_rooms` | `FROZEN / COMPLETE` |
| **Patient Surgical History** | Longitudinal history of all surgical interventions, operative notes, implants, and anaesthesia records | Patient Profile, Surgical Census | `GET /api/v1/partner/patients/:id/surgical-history` | Multi-table Join | `FROZEN / COMPLETE` |
| **Audit Ledger** | SHA-256 hash-chained immutable audit ledger for bookings, PAC clearances, surgery notes, and transfers | `OTAuditVaultView` | Audit Repository | `clinical.ot_audit_traces` | `FROZEN / COMPLETE` |

---

## 4. SECURITY, MULTI-TENANCY & RBAC
1. **Server-Side Enforcement:** Every endpoint validates JWT session context via `authenticate` and `requirePermission`.
2. **Tenant Isolation:** Queries enforce `eq(table.tenantId, session.tenantId)`. Cross-tenant surgical access returns 0 records / 403.
3. **Branch/Facility Scope:** Restricts OT room bookings and schedules to the assigned facility operational scope.
4. **Role Capabilities:**
   - `DOCTOR` (Surgeon): `clinical:encounters:create`, `clinical:encounters:read`, `clinical:encounters:update` (Bookings, operative notes)
   - `DOCTOR` (Anaesthetist): `clinical:encounters:create`, `clinical:encounters:read` (PAC clearance, anaesthesia records)
   - `NURSE` (PACU / OT Scrub): `clinical:encounters:create`, `clinical:encounters:read` (PACU recovery, checklist, post-op transfer)
   - `HOSPITAL_ADMIN`: OT room and complex management

---

## 5. DATABASE ARCHITECTURE & REAL PERSISTENCE
* **Canonical Tables in PostgreSQL:**
  - `clinical.operation_theatre_complexes` (Surgical complex definitions)
  - `clinical.operation_theatre_rooms` (OT suites, modular theatres, status)
  - `clinical.surgical_procedures` (Master surgical catalog)
  - `clinical.surgery_requests` (Surgical orders and requisitions)
  - `clinical.ot_schedules` (Room schedules and bookings)
  - `clinical.pre_operative_assessments` (PAC clearances, ASA classifications)
  - `clinical.operative_notes` (Surgeon notes, techniques, findings)
  - `clinical.pacu_recovery_records` (Post-op recovery logs, Aldrete scores)
  - `clinical.postoperative_transfers` (Ward/ICU transfer logs)
  - `clinical.ot_audit_traces` (Immutable SHA-256 audit ledger)
* **Zero Client Storage Dependency:** Surgical data is retrieved directly from PostgreSQL through the API Gateway. Browser `localStorage` is not a source of truth for surgical records.

---

## 6. CHANGE CONTROL PROCEDURE
Any future request that introduces new capabilities beyond this specification must follow the Frozen Scope Change Control:
1. Submit formal Change Request specifying business need, impacted tables, API routes, and security risk assessment.
2. Architecture Board Review and Security Impact Analysis.
3. Explicit Approval required before any implementation.
