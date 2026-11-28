# DOC SEARCH — UI & REAL-WORLD USABILITY REMEDIATION BASELINE

**Document Creation Date:** September 16, 2026  
**Auditor / Engineering Lead:** DOC SEARCH System Architecture & Clinical Engineering  
**Primary Source of Truth:** `DOC_SEARCH_WHOLE_PROJECT_UI_REAL_WORLD_USABILITY_AUDIT.md`  
**Execution Standard:** Controlled Production Remediation (Zero Fake Data, Audit Findings Only)

---

## 1. Current Git Status & Branch

- **Active Branch:** `main`
- **Working Tree State:** Tracked modifications present from ongoing system stabilization across API Gateway and Partner Platform.
- **Service Ports Baseline:**
  - Port 4000: API Gateway (Fastify, PGlite Embedded PostgreSQL Engine, 442 schemas) — ACTIVE & LISTENING
  - Port 5173: Partner Platform (Vite + React) — ACTIVE & LISTENING
  - Port 5174: Company Platform (Vite + React) — ACTIVE & LISTENING
  - Port 5175: Landing Page (Vite + React) — ACTIVE & LISTENING

---

## 2. Audit Findings Scope & Categorization

This baseline commits to remediating exclusively documented findings from `DOC_SEARCH_WHOLE_PROJECT_UI_REAL_WORLD_USABILITY_AUDIT.md`.

### Priority P0: Critical Safety, Workflow & Destructive Protection
1. **Pharmacy Dispense to Cashier Billing Workflow (Minimum-Click Finding):**
   - Disconnect between `DispensingWorkbenchView.tsx` and `CreateInvoiceView.tsx` (14 clicks, 3 modules, re-entry of patient identity).
2. **Mock / Simulator Controls in Production Views (SIM-01 through SIM-05):**
   - `SIM-01`: `CreatePatientDialog.tsx` (L347) — `⚡ Simulate Patient Scan (Autofill)`
   - `SIM-02`: `RealTimeHospitalActivityDock.tsx` (L254-305) — Simulated Code Red, e-Rx, Bed Vacate, UPI events
   - `SIM-03`: `FounderApprovalGovernanceView.tsx` (L243-261) — Hardcoded executive impersonators
   - `SIM-04`: `DynamicUpiInvoiceView.tsx` (L335) — `⚡ Simulate Instant UPI Scan`
   - `SIM-05`: `AmbientAiScribeView.tsx` (L963-981) — Simulated clinical speech dialogs
   - `NurseVitalsTriageStationView.tsx` (L404) — `handleSimulateIotScan`
3. **Dead / Unhandled Production Buttons (DEAD-01 through DEAD-06):**
   - `DEAD-01`: `InternalAuditsView.tsx` (L12) — `+ Schedule Mock Audit`
   - `DEAD-02`: `Aarogya360PatientPortalView.tsx` (L23) — `Download Health Passport PDF`
   - `DEAD-03`: `EmergencyControlCenterView.tsx` (L27) — `View SOP Guidelines`
   - `DEAD-04`: `IPDReportsView.tsx` (L15, L20) — `Export PDF`, `Export CSV`
   - `DEAD-05`: `OTReportsView.tsx` (L28) — `Generate Export (PDF/CSV)`
   - `DEAD-06`: `QualityCommitteeView.tsx` (L12) — `+ Log Committee Meeting`
4. **Destructive Action Inline RBAC Protection:**
   - 82 destructive action points (Delete, Purge, Wipe, Drop) lacking component-level user role and permission guards.

### Priority P1: Usability Friction, Duplicate Actions, Forms & Tables
1. **Reception / Walk-in Registration Usability (FRM-04):**
   - `CreatePatientDialog.tsx`: 19 fields, mandatory 3-character `reason` audit field blocking submission, synthetic pseudo-random OPD token generation (`Math.random()`).
2. **Doctor Express Consultation Desk Action Consolidation (DB-01, DB-02, DB-03, DA-06, REM-01):**
   - Dual competing action bars (top patient header vs sticky bottom dock) duplicating Back, Save Draft, Complete & Next, Print Rx.
3. **Duplicate Buttons & Duplicate Actions (DB-04, DA-01 through DA-14):**
   - `CreateInvoiceView.tsx`: Dual submit buttons (`Settle & Create` vs `Complete & Generate`), multiple cancel/back buttons, dual add-item triggers.
   - `ClinicalConsultationView.tsx`: Phrasing divergence (`Save Draft` vs `Save Progress`, `Complete & Sign` vs `Sign & Finalize EMR`).
   - `FullPageRegistrationView.tsx`: Duplicate Back to Home.
   - `InventoryManagementView.tsx`: Duplicate export stock and physical adjustment buttons.
   - `BreakGlassEmergencyModal.tsx`: 3 separate dismiss/cancel triggers.
4. **Navigation Handoffs (NAV-01, NAV-02, NAV-03, NAV-04):**
   - OPD registration to active doctor queue transition.
   - Pharmacy dispense to cashier handoff with preserved context.
   - Consultation desk back-to-queue unsaved changes confirmation barrier.
   - CRM partner detail to invoices navigation with pre-filtered context.
5. **High-Friction Forms (FRM-01 through FRM-05):**
   - Rationalize grouping and progressive disclosure in `UniversalAccountSettingsModal.tsx`, `PartnerVerificationConsole.tsx`, `SubscriptionCustomizerModal.tsx`.
6. **Wide Tables (TBL-01 through TBL-04):**
   - Responsive column prioritizing and horizontal scroll management in `OfflineMeshDisasterSyncView.tsx`, `CommandCenterDetailModal.tsx`, `EnterpriseSecurityAuditStudio.tsx`, `FastPharmacyPosCounterView.tsx`.
7. **Accessibility & Terminology (Section K & M):**
   - Keyboard traps in clinical desk notes (`Ctrl+Enter`).
   - Add missing `aria-label` and `title` to icon-only buttons.
   - Harmonize phrasing across Save, Submit, Cancel, Back.

---

## 3. Files Expected to Change

| Component / File Path | Target Audit Finding | Expected Change Summary |
| :--- | :--- | :--- |
| `apps/partner-platform/src/components/views/DispensingWorkbenchView.tsx` | P0 Dispense Handoff, NAV-02 | Add direct handoff to POS cashier with real prescription context and batch details |
| `apps/partner-platform/src/components/PharmacyDomainManager.tsx` | P0 Dispense Handoff, NAV-02 | Wire `onProceedToPos` to navigate to POS Desk or Billing module with preserved patient context |
| `apps/partner-platform/src/components/views/CreateInvoiceView.tsx` | DA-01, DA-02, DA-03, FRM-05 | Accept preloaded pharmacy/clinical items, eliminate duplicate submit/cancel/add buttons |
| `apps/partner-platform/src/components/dialogs/CreatePatientDialog.tsx` | SIM-01, FRM-04 | Remove simulated autofill in prod, remove mandatory audit reason barrier, derive real token |
| `apps/partner-platform/src/components/common/RealTimeHospitalActivityDock.tsx` | SIM-02 | Gate/remove simulated demo events from live telemetry dock |
| `apps/company-platform/src/components/company-admin/FounderApprovalGovernanceView.tsx` | SIM-03 | Remove hardcoded mock executive submitters |
| `apps/partner-platform/src/components/views/DynamicUpiInvoiceView.tsx` | SIM-04 | Convert mock UPI scan button into legitimate cashier settlement confirmation |
| `apps/partner-platform/src/components/views/AmbientAiScribeView.tsx` | SIM-05 | Gate/remove simulated speech test cards from production view |
| `apps/partner-platform/src/components/views/NurseVitalsTriageStationView.tsx` | Section F.3 | Gate simulated IoT scan trigger behind explicit development mode |
| `apps/partner-platform/src/components/views/InternalAuditsView.tsx` | DEAD-01 | Connect `+ Schedule Mock Audit` to interactive schedule dialog / audit planner |
| `apps/partner-platform/src/components/views/Aarogya360PatientPortalView.tsx` | DEAD-02 | Connect `Download Health Passport PDF` to print / document generation handler |
| `apps/partner-platform/src/components/views/EmergencyControlCenterView.tsx` | DEAD-03 | Connect `View SOP Guidelines` to clinical directive modal |
| `apps/partner-platform/src/components/views/IPDReportsView.tsx` | DEAD-04 | Wire `Export PDF` and `Export CSV` to working print / dataset export routines |
| `apps/partner-platform/src/components/views/OTReportsView.tsx` | DEAD-05 | Wire `Generate Export (PDF/CSV)` to client CSV export handler |
| `apps/partner-platform/src/components/views/QualityCommitteeView.tsx` | DEAD-06 | Connect `+ Log Committee Meeting` to functional meeting logger modal |
| `apps/partner-platform/src/components/views/DoctorExpressConsultationDesk.tsx` | DB-01, DB-02, DB-03, DA-06, NAV-03 | Consolidate action buttons in sticky bottom bar, unsaved changes confirmation |
| `apps/partner-platform/src/components/views/ClinicalConsultationView.tsx` | DA-04, DA-05 | Harmonize terminology between top strip and bottom plan card |
| `apps/landing-page/src/components/FullPageRegistrationView.tsx` | DB-04 | Remove duplicate back button |
| `apps/partner-platform/src/components/views/InventoryManagementView.tsx` | DA-07, DA-08 | Consolidate stock export and stock adjustment entry points |
| `apps/partner-platform/src/components/security/BreakGlassEmergencyModal.tsx` | DA-13 | Unify modal dismissal into single clear close action |
| `apps/partner-platform/src/components/views/OfflineMeshDisasterSyncView.tsx` | TBL-01 | Prioritize vital columns and responsive formatting on wide table |
| `apps/partner-platform/src/components/views/FastPharmacyPosCounterView.tsx` | TBL-04 | Ensure compact action column layout on POS line items table |
| Destructive Action Component Files | Section J Destructive RBAC | Add inline role/permission checks (`HOSPITAL_ADMIN`, `SUPER_ADMIN`, or specific resource:delete) |

---

## 4. Expected Behavior: Before vs After

| Finding / Area | Before Remediation | After Remediation |
| :--- | :--- | :--- |
| **Pharmacy to Billing** | Pharmacist fulfills prescription in workbench. Transition to billing requires manual module switch, opening invoice view, and manually re-entering patient mobile and medicines (14 clicks). | Pharmacist fulfills prescription. A direct `⚡ Proceed to POS Counter & Billing ➔` action opens POS with pre-populated patient, prescription, and dispensed items (2 clicks). |
| **Dead Buttons** | Clicking `+ Schedule Mock Audit`, `Download Health Passport PDF`, `Export CSV`, etc. does nothing (dead handlers). | Every button triggers its legitimate action (print dialog, CSV dataset export, or modal). Zero dead controls. |
| **Simulators in Live UI** | Live UI displays `⚡ Simulate Patient Scan`, `Simulate: Code Red`, `Submit as Rohit Verma`, confusing hospital users and injecting fake data. | Gated strictly behind development mode or removed. Production views show only genuine operational actions. |
| **Consultation Dual Bars** | Doctors see competing Back, Save Draft, and Complete buttons at both top header and bottom footer, causing confusion. | Single consolidated action deck at bottom with keyboard shortcuts; top header strictly dedicated to patient metadata. |
| **Reception Audit Reason** | Receptionists registering walk-ins blocked if `Audit Reason` is empty or <3 chars; OPD token uses `Math.random()`. | Audit reason is optional intake note; encounter token uses real encounter/visit sequence. |
| **Destructive RBAC** | Junior staff see active `Delete` / `Purge` buttons that only fail upon backend API rejection (HTTP 403). | Inline permission/role guard hides or disables destructive buttons for unauthorized roles with clear tooltip. |

---

## 5. Risks & Dependencies

- **Risk 1: State Transmission between Modules:** Pharmacy dispense handoff must preserve data integrity without bypassing billing validation or mutating prices.
  - *Mitigation:* Pass standard DTO structure to POS desk component without altering financial calculation rules.
- **Risk 2: Unsaved Note Loss on Navigation:** Removing top back button in doctor desk must preserve unsaved changes safety.
  - *Mitigation:* Back to queue prompts user if unsaved modifications exist in chief complaints or clinical plan.
- **Risk 3: Clean Slate / No Fake Data:** Remediations must never inject hardcoded test records or Math.random IDs.
  - *Mitigation:* Use real encounter identifiers and existing database/API contracts.

---

## 6. Verification Plan

1. **Static Analysis & Type Checking:**
   - Run `tsc --project apps/partner-platform/tsconfig.json --noEmit`
   - Run `tsc --project apps/company-platform/tsconfig.json --noEmit`
   - Run `tsc --project apps/api-gateway/tsconfig.json`
2. **Runtime Service Checks:**
   - Confirm ports 4000, 5173, 5174, 5175 remain healthy and listening.
3. **Workflow Integration Tests:**
   - Execute scripted API and client action battery to verify patient registration, encounter creation, clinical notes, pharmacy dispense, and billing transitions.
4. **Git Scope Audit:**
   - Inspect `git diff` to guarantee zero extraneous modifications, zero new dependencies, and zero fake data.
