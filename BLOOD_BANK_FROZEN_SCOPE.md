# BLOOD BANK & TRANSFUSION MEDICINE — FROZEN SCOPE & PRODUCTION CONTROL CONTRACT
**Doc Search Hospital Platform — Transfusion Medicine Suite**
**Status:** `FROZEN`
**Version:** `1.0.0-PROD-CERTIFIED`
**Date:** `2026-08-30`
**Authority:** Lead Product Architect, Backend Architect, Frontend Architect, Database Architect, QA & Security Auditor

---

## 1. PRIMARY RULE — SCOPE FREEZE
The Blood Bank & Transfusion Medicine domain is officially **FROZEN**.

### Prohibitions:
* **No Unapproved Additions:** Do NOT add new transfusion or blood bank features without explicit architectural approval.
* **No Unapproved Removals:** Do NOT remove an approved transfusion feature without explicit approval.
* **No Concept Renaming:** Do NOT rename approved blood components or testing categories.
* **No Phase Exposure:** Do NOT introduce development phase numbers (`Phase 1`, `Phase 2`, `Wave 1`, `Sprint X`) into the production UI.
* **No Fake/Mock State:** Production UI and APIs must strictly use real PostgreSQL persistence through the complete gateway/repository chain.
* **No Casual Schema Changes:** Database models, RLS policies, and API contracts are locked under strict impact-analysis governance.
* **No RBAC Degradation:** All sensitive endpoints enforce server-side authentication, tenant scoping, branch scoping, and granular RBAC.

> **Change Control Directive:**
> If a requested modification falls outside this frozen contract:
> `STOP` → `REPORT SCOPE CONFLICT` → `ASK FOR EXPLICIT APPROVAL` → `WAIT`.

---

## 2. FROZEN TRANSFUSION LIFECYCLE
Blood Bank & Transfusion Medicine manages the complete chain of custody from donation through bedside transfusion:
```text
Donor Registration & Screening (Eligibility, Hb >= 12.5 g/dL, Vitals, Medical History)
       ↓
Blood Donation / Bleeding (Bag Barcode, Volume: 350ml/450ml, Anticoagulant: CPDA-1/SAGM)
       ↓
Component Separation (PRBC, FFP, Platelets, Cryoprecipitate with shelf-life tracking)
       ↓
Mandatory TTIs & Serology Testing (HIV, HBV, HCV, Syphilis, Malaria, ABO/Rh Confirmation)
       ↓
Inventory Stocking (Cold Room 2-6°C for PRBC, -30°C for FFP, 20-24°C Agitator for Platelets)
       ↓
Clinical Blood Requisition (Patient, Indication, Urgency: Routine/Urgent/Emergency O-neg)
       ↓
Cross-Matching & Compatibility Testing (Major/Minor crossmatch, Coombs antiglobulin test)
       ↓
Blood Issue & Bedside Transfusion (Staff ID verification, Pre/Post vitals, Adverse reaction checks)
       ↓
Patient Longitudinal Transfusion History
       ↓
Cryptographic Immutable Audit Trail (SHA-256 Chaining)
```

---

## 3. CORE FUNCTIONAL DOMAINS & STATUS

| Domain Area | Description | UI View / Dialog | Backend Route | DB Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Donor Management** | Voluntary & replacement donor registration, screening checklist, Hb verification, donor deferrals | `BloodBankCommandCenterView`, `ScreenDonorDialog` | `POST /api/v1/partner/blood-bank/donors` | `clinical.blood_donors`, `clinical.blood_donor_screenings` | `FROZEN / COMPLETE` |
| **Blood Collection** | Whole blood bleeding, barcode bag tracking, collection volume, phlebotomy logging | `BloodBankControlCenterView` | `POST /api/v1/partner/blood-bank/donations` | `clinical.blood_donations` | `FROZEN / COMPLETE` |
| **Component Separation** | Separation into PRBC (42d), FFP (365d), Platelets (5d), unit coding | `BloodInventoryView`, `CreateBloodComponentDialog` | `POST /api/v1/partner/blood-bank/components/separate` | `clinical.blood_components` | `FROZEN / COMPLETE` |
| **TTI & Serology Testing** | Mandatory panel (HIV 1/2, HBsAg, HCV, VDRL, Malaria), auto-release of safe units, discard of reactive units | `BloodTestingView`, `RecordBloodTestDialog` | `POST /api/v1/partner/blood-bank/tests` | `clinical.blood_tests`, `clinical.blood_components` | `FROZEN / COMPLETE` |
| **Live Blood Inventory** | Real-time stock by blood group (A+, B+, AB+, O+, etc.), component type, temperature monitoring | `BloodInventoryView` | `GET /api/v1/partner/blood-bank/inventory` | `clinical.blood_components` | `FROZEN / COMPLETE` |
| **Requisition & Crossmatch** | Doctor requisition, major/minor crossmatch compatibility testing, unit reservation | `BloodRequestWorkbenchView`, `CreateCrossmatchDialog` | `POST /api/v1/partner/blood-bank/requests`, `POST .../crossmatch` | `clinical.blood_requests`, `clinical.blood_crossmatches` | `FROZEN / COMPLETE` |
| **Safe Issue & Transfusion** | Dispensing to ward/ICU/OT, bedside vitals monitoring, adverse reaction monitoring | `BloodIssueView`, `IssueBloodUnitDialog` | `POST /api/v1/partner/blood-bank/issue`, `POST .../transfusions` | `clinical.blood_issues`, `clinical.transfusion_records` | `FROZEN / COMPLETE` |
| **Patient Transfusion History** | Complete longitudinal record of all transfusions, reactions, and crossmatched units | Patient Profile, Blood Bank Census | `GET /api/v1/partner/patients/:id/transfusion-history` | Multi-table Join | `FROZEN / COMPLETE` |
| **Audit Ledger** | SHA-256 hash-chained immutable audit ledger for donations, test releases, crossmatches, and transfusions | `BloodBankAuditVaultView` | Audit Repository | `clinical.blood_bank_audit_events` | `FROZEN / COMPLETE` |

---

## 4. SECURITY, MULTI-TENANCY & RBAC
1. **Server-Side Enforcement:** Every endpoint validates JWT session context via `authenticate` and `requirePermission`.
2. **Tenant Isolation:** Queries enforce `eq(table.tenantId, session.tenantId)`. Cross-tenant transfusion access returns 0 records / 403.
3. **Branch/Facility Scope:** Restricts blood donations, component inventory, and requisitions to the assigned facility operational scope.
4. **Role Capabilities:**
   - `DOCTOR`: `clinical:encounters:create`, `clinical:encounters:read` (Blood requisitions)
   - `PATHOLOGIST` / `LAB_TECHNICIAN`: `clinical:encounters:create`, `clinical:encounters:read` (TTI testing, crossmatching, component release)
   - `NURSE`: `clinical:encounters:create`, `clinical:encounters:update` (Transfusion vitals, adverse reaction reporting)
   - `HOSPITAL_ADMIN`: Blood bank operational management

---

## 5. DATABASE ARCHITECTURE & REAL PERSISTENCE
* **Canonical Tables in PostgreSQL:**
  - `clinical.blood_banks` (Blood bank facility configuration)
  - `clinical.blood_donors` (Donor registry, eligibility status)
  - `clinical.blood_donor_screenings` (Screening checklist & medical examination)
  - `clinical.blood_donations` (Donation logs, bag barcodes)
  - `clinical.blood_tests` (TTI & serology test panel)
  - `clinical.blood_components` (Child component inventory & expiry tracking)
  - `clinical.blood_requests` (Doctor requisitions from OPD/IPD/OT/ER)
  - `clinical.blood_crossmatches` (Crossmatch compatibility verification)
  - `clinical.blood_issues` (Issue & dispatch tracking)
  - `clinical.transfusion_records` (Bedside transfusion monitoring & vitals)
  - `clinical.transfusion_reactions` (Adverse reaction incident logging)
  - `clinical.blood_bank_audit_events` (Immutable SHA-256 audit ledger)
* **Zero Client Storage Dependency:** Transfusion data is retrieved directly from PostgreSQL through the API Gateway. Browser `localStorage` is not a source of truth for blood bank records.

---

## 6. CHANGE CONTROL PROCEDURE
Any future request that introduces new capabilities beyond this specification must follow the Frozen Scope Change Control:
1. Submit formal Change Request specifying business need, impacted tables, API routes, and security risk assessment.
2. Architecture Board Review and Security Impact Analysis.
3. Explicit Approval required before any implementation.
