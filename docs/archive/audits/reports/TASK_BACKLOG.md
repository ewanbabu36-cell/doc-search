# DOC SEARCH — Master Product Backlog & Sprint Execution Plan
> **Standard**: GitHub Issues & Jira Agile-Ready Format  
> **Repository**: `doc-search` monorepo (`@docsearch/partner-platform`, `@docsearch/company-platform`, `@docsearch/api-gateway`, `@docsearch/ui-kit`, `@docsearch/api-contracts`)  
> **Last Synchronized**: September 16, 2026  
> **Baseline Audit**: `DOC_SEARCH_WHOLE_PROJECT_UI_REAL_WORLD_MASTER_AUDIT.md`

---

## 📊 Sprint Velocity & Progress Roadmap

```mermaid
gantt
    title DOC SEARCH Engineering Delivery Roadmap
    dateFormat  YYYY-MM-DD
    section Completed
    Phase 1: Quick Wins & HIS Command Wall        :done, p1, 2026-09-01, 2026-09-03
    Phase 2: Navigation Cleanup & Express EMR     :done, p2, 2026-09-04, 2026-09-06
    Phase 3: Reception Speed & Table Overhaul     :done, p3, 2026-09-07, 2026-09-09
    Phase 4: Fastify REST Backend Integration     :done, p4, 2026-09-10, 2026-09-12
    Option B: Orphaned Views & Decommissioning    :done, p5, 2026-09-13, 2026-09-16
    Sprint 6: Complete Service Persistence        :done, s6, 2026-09-17, 2026-09-24
    Sprint 7: CSS Token & Theme Harmonization     :done, s7, 2026-09-25, 2026-10-02
    Sprint 8: Duplicate Page & Print Unification  :done, s8, 2026-10-03, 2026-10-10
    section Active Backlog
    Sprint 9: Hardware Peripherals (ESC/POS, Barcode):active, s9, 2026-10-11, 2026-10-18
    Sprint 10: Scale, Concurrency & Load Stress   :s10, 2026-10-19, 2026-10-26
```

---

## ✅ Completed Sprints Summary

| Sprint | Epic | Scope Delivered | Verification Status |
|---|---|---|---|
| **Sprint 1** | Platform Quick Wins | Decommissioned monolith from Home Hub, connected cross-department patient event bus (`PATIENT_SELECTED`), added double-submission protection on 44 action buttons, role-gated statutory account settings, consolidated company command centers. | **PASSED** (Exit 0) |
| **Sprint 2** | Navigation & Express EMR | Deprecated legacy multi-modal consultation desk (`ClinicalConsultationView.tsx`), promoted single-screen keyboard desk (`DoctorExpressConsultationDesk.tsx`), reconnected pharmacy history & reports. | **PASSED** (Exit 0) |
| **Sprint 3** | Workflow Speed & Ergonomics | Promoted 2-click / 5-field Express OPD Intake (`FastOpdRegistrationDrawer.tsx`), replaced overloaded table action columns with single `⋮ Actions` dropdowns, standardized UHID & MRN across all customer touchpoints. | **PASSED** (Exit 0) |
| **Sprint 4** | Core Production APIs | Wired Fastify REST endpoints with localStorage offline persistence for Billing (`billing-management-service.ts`), Pharmacy (`pharmacy-management-service.ts`), and Patient Registration (`patient-registration-service.ts`). | **PASSED** (Exit 0) |
| **Option B** | Architecture & Orphaned Views | Reconnected 30+ unreachable views across 9 Domain Managers, eliminated all orphaned `activeTab === 'xyz'` conditions (AST count: 0), formally decommissioned parallel monolith `MamtaMultiSpecialtyStationView.tsx`. | **PASSED** (Exit 0) |
| **Sprint 6** | Complete Service Persistence | Migrated Encounter & Queue Token Service (`DS-API-601`), Staff Administration & Department Updates (`DS-API-602`), Doctor Roster & OPD Chamber Matrix (`DS-API-603`), and Blood Bank Management (`DS-API-604`) to live Fastify REST with localStorage dual-layer offline persistence. | **PASSED** (Exit 0 across all 3 apps) |
| **Sprint 7** | Design System & Responsiveness | Eliminated all hardcoded inline hex colors in high-traffic clinical & retail screens (`DoctorExpressConsultationDesk`, `InpatientDomainManager`, `FastPharmacyPosCounterView`), harmonized `@docsearch/ui-kit` CSS tokens (`var(--ds-color-*)`), audited 1366x768 & 1280x720 resolutions with `overflow-x: hidden` and enforced >=32px touch/mouse targets. | **PASSED** (Exit 0 across all 3 apps) |
| **Sprint 8** | Workflow Pruning & Print Unification | Consolidated Patient Fast Search into Patient Directory (`DS-UI-801`) with universal fuzzy lookup (UHID, Name, Mobile, Email, Aadhaar, ABHA) & CSV export; Created `UnifiedDocumentPrintModal` (`DS-UI-802`) with live toggle between 80mm Thermal Receipt and A4 Laser Invoice with full GST breakdown, Schedule H warning, and UPI QR code. | **PASSED** (Exit 0 across all 3 apps) |

---

## 🚀 Sprint 6: Complete End-to-End Service Persistence

### Epic: `EPIC-PERSISTENCE-01` — Production REST & PostgreSQL Migration
**Goal**: Migrate all remaining client-side in-memory mock services in `@docsearch/partner-platform` to live Fastify REST endpoints in `@docsearch/api-gateway` with persistent PostgreSQL storage.

---

### Ticket: `DS-API-601` — Migrate Encounter & Token Service to Fastify REST
- **Type**: Story / Feature
- **Priority**: `P0 - Blocker`
- **Labels**: `backend`, `frontend`, `clinical`, `sprint-6`
- **Estimate**: 5 Story Points
- **Target Files**:
  - `apps/partner-platform/src/services/encounter-service.ts`
  - `apps/api-gateway/src/routes/partner/clinical-encounters.routes.ts`
- **User Story**:
  > As an OPD receptionist or doctor,  
  > I want patient encounters, queue tokens, and triage assessments to persist directly into PostgreSQL via Fastify REST endpoints,  
  > So that patient queues remain synchronized across all triage desks, nursing stations, and consulting chambers even across browser restarts.
- **Acceptance Criteria**:
  - [x] `createEncounter` calls `POST /api/v1/partner/clinical/encounters` and returns PostgreSQL uuid.
  - [x] `searchEncounters` queries `GET /api/v1/partner/clinical/encounters` with pagination and status filters (`TRIAGED`, `IN_CONSULTATION`, `COMPLETED`).
  - [x] `callPatientToken` invokes `PATCH /api/v1/partner/clinical/encounters/:id/call` and broadcasts WebSockets token display chime.
  - [x] Retains local fallback cache in `localStorage` under `docsearch_encounters` with automatic resync upon connection recovery.
  - [x] Zero TypeScript errors in `@docsearch/partner-platform` and `@docsearch/api-gateway`.

---

### Ticket: `DS-API-602` — Migrate Staff Administration Service to Backend RBAC
- **Type**: Story / Feature
- **Priority**: `P1 - High`
- **Labels**: `backend`, `security`, `rbac`, `sprint-6`
- **Estimate**: 5 Story Points
- **Target Files**:
  - `apps/partner-platform/src/services/staff-administration-service.ts`
  - `apps/api-gateway/src/routes/partner/staff.routes.ts`
- **User Story**:
  > As a Hospital HR or Medical Superintendent,  
  > I want staff onboarding, department assignment, role credentialing, and status updates to persist in the central database,  
  > So that staff credentials and shift sessions are enforced across the entire hospital system.
- **Acceptance Criteria**:
  - [x] `createStaffUser` calls `POST /api/v1/partner/staff` and hashes initial credentials securely.
  - [x] `getStaffDirectory` fetches live staff from `GET /api/v1/partner/staff` with branch filtering.
  - [x] `updateStaffRole` calls `PATCH /api/v1/partner/staff/:id/role` and creates an audit entry in PostgreSQL.
  - [x] `suspendStaffUser` immediately invalidates active JWT refresh sessions in Redis / PostgreSQL.
  - [x] Unit tests pass for staff role changes.

---

### Ticket: `DS-API-603` — Migrate Doctor Roster & OPD Chamber Matrix to Database
- **Type**: Story / Feature
- **Priority**: `P1 - High`
- **Labels**: `backend`, `frontend`, `opd`, `sprint-6`
- **Estimate**: 3 Story Points
- **Target Files**:
  - `apps/partner-platform/src/services/doctor-roster-service.ts`
  - `apps/api-gateway/src/routes/partner/roster.routes.ts`
- **User Story**:
  > As an OPD Clinic Coordinator,  
  > I want doctor weekly consultation timings, leave requests, and chamber allocations to be saved on the backend,  
  > So that receptionists never issue patient tokens for doctors who are on leave or assigned to different chambers.
- **Acceptance Criteria**:
  - [x] `getDoctorRosters` fetches live weekly scheduling slots from `GET /api/v1/partner/doctors/rosters`.
  - [x] `createShiftSchedule` saves new recurring slots via `POST /api/v1/partner/doctors/rosters`.
  - [x] `recordDoctorLeave` marks doctor as `ON_LEAVE` and blocks token generation in `FastOpdRegistrationDrawer`.
  - [x] Full schema validation enforced via TypeBox / Drizzle.

---

### Ticket: `DS-API-604` — Wire Blood Bank & Emergency Cross-Match to API Gateway
- **Type**: Story / Feature
- **Priority**: `P2 - Medium`
- **Labels**: `backend`, `emergency`, `blood-bank`, `sprint-6`
- **Estimate**: 5 Story Points
- **Target Files**:
  - `apps/partner-platform/src/services/blood-bank-service.ts`
  - `apps/api-gateway/src/routes/partner/blood-bank.routes.ts`
- **User Story**:
  > As a Blood Bank Medical Technologist,  
  > I want donor registrations, blood component bags (PRBC, FFP, Platelets), and cross-match requisitions to be immutably recorded in PostgreSQL,  
  > So that expired units are quarantined and emergency massive transfusion protocol (MTP) units are tracked with 100% traceability.
- **Acceptance Criteria**:
  - [x] `registerDonor` calls `POST /api/v1/partner/blood-bank/donors`.
  - [x] `getInventory` reads batch-level bag status (`COLLECTED`, `TESTED`, `QUARANTINED`, `RESERVED`, `ISSUED`).
  - [x] `issueBloodComponent` verifies compatibility and logs staff ID and receiving OT / ICU ward.

---

## 🎨 Sprint 7: Design System Harmonization & CSS Custom Properties

### Epic: `EPIC-DESIGN-02` — Visual Consistency & WCAG 2.1 AA Compliance
**Goal**: Excise all 7,746 hardcoded inline hex colors across `@docsearch/partner-platform` and adopt `@docsearch/ui-kit` CSS design system tokens to enable reliable light, dark, and high-contrast modes.

---

### Ticket: `DS-UI-701` — Convert Hardcoded Background & Text Hex Colors to CSS Tokens [COMPLETED]
- **Type**: Task / Refactoring
- **Priority**: `P1 - High`
- **Labels**: `frontend`, `design-system`, `ui-kit`, `sprint-7`
- **Estimate**: 8 Story Points
- **Target Files**:
  - `apps/partner-platform/src/components/views/*.tsx` (380 files)
  - `packages/ui-kit/src/theme/tokens.css`
- **User Story**:
  > As a hospital clinician working in bright daylight or night-shift dimly lit ICU wards,  
  > I want all platform screens to honor system theme settings without unreadable dark-on-dark or white-on-white text,  
  > So that eye strain is minimized and clinical information remains readable in all lighting environments.
- **Acceptance Criteria**:
  - [x] Replace `#0F172A`, `#0B132B`, `#1E293B` with `var(--ds-color-surface-base)` and `var(--ds-color-surface-elevated)`.
  - [x] Replace `#F8FAFC`, `#CBD5E1`, `#94A3B8` with `var(--ds-color-text-primary)` and `var(--ds-color-text-muted)`.
  - [x] Replace `#0284C7`, `#38BDF8`, `#10B981`, `#EF4444` with semantic theme tokens (`var(--ds-color-primary)`, `var(--ds-color-success)`, `var(--ds-color-danger)`).
  - [x] Pass automated AST regex scanner with zero hardcoded inline hex colors in targeted views (`DoctorExpressConsultationDesk`, `InpatientDomainManager`, `FastPharmacyPosCounterView`).

---

### Ticket: `DS-UI-702` — Screen Resolution Responsiveness Audit (1366x768 Standard) [COMPLETED]
- **Type**: Bug / Ergonomics
- **Priority**: `P2 - Medium`
- **Labels**: `frontend`, `responsive`, `ux`, `sprint-7`
- **Estimate**: 5 Story Points
- **Target Files**:
  - `apps/partner-platform/src/components/InpatientDomainManager.tsx`
  - `apps/partner-platform/src/components/views/DoctorExpressConsultationDesk.tsx`
  - `apps/partner-platform/src/components/views/FastPharmacyPosCounterView.tsx`
- **User Story**:
  > As a pharmacy counter cashier or nurse on an older Dell 18.5" hospital monitor (1366x768 resolution),  
  > I want POS tables and clinical consultation cards to fit without horizontal scrollbars,  
  > So that I don't have to scroll left and right while processing long patient lines.
- **Acceptance Criteria**:
  - [x] Test layout at viewport width 1366px and 1280px with browser zoom at 100% and 125%.
  - [x] All forms, tables, and tab ribbons wrap cleanly without body horizontal overflow (`overflow-x: hidden`).
  - [x] Touch targets and buttons remain at least 32px height for rapid mouse targeting (enforced 32px-44px targets).

---

## 🗂️ Sprint 8: Duplicate Page & Print Layout Consolidation

### Epic: `EPIC-DEDUP-03` — Workflow Pruning & Single-Path Efficiency
**Goal**: Consolidate near-duplicate pages and standardize thermal receipt & laser printer document rendering.

---

### Ticket: `DS-UI-801` — Merge Patient Search and Patient Directory Views [COMPLETED]
- **Type**: Task / Refactoring
- **Priority**: `P2 - Medium`
- **Labels**: `frontend`, `patient-registration`, `sprint-8`
- **Estimate**: 3 Story Points
- **Target Files**:
  - `apps/partner-platform/src/components/views/PatientSearchView.tsx`
  - `apps/partner-platform/src/components/views/PatientDirectoryView.tsx`
- **User Story**:
  > As a front desk supervisor,  
  > I want a single unified Patient Master Index where live instant search and directory browsing co-exist,  
  > So that staff do not need to switch between two different search pages to find patient dossiers.
- **Acceptance Criteria**:
  - [x] Embed fuzzy search (by UHID, Mobile, National ID, ABHA) directly into `PatientDirectoryView.tsx`.
  - [x] Deprecate `PatientSearchView.tsx` and point navigation routes to `PatientDirectoryView.tsx`.
  - [x] Zero functional regression on search filters, export to CSV, or express intake launch.

---

### Ticket: `DS-UI-802` — Unify Thermal ESC/POS & Laser Invoice Slip Printing [COMPLETED]
- **Type**: Story / Feature
- **Priority**: `P2 - Medium`
- **Labels**: `frontend`, `printing`, `billing`, `pharmacy`, `sprint-8`
- **Estimate**: 5 Story Points
- **Target Files**:
  - `apps/partner-platform/src/components/dialogs/PrintableInvoiceBillModal.tsx`
  - `apps/partner-platform/src/components/dialogs/PharmacyInvoiceSlipModal.tsx`
  - `apps/partner-platform/src/components/common/UnifiedDocumentPrintModal.tsx`
- **User Story**:
  > As a hospital billing cashier and pharmacy store operator,  
  > I want a single unified print modal that formats receipts for 80mm thermal roll printers or A4 / Letter multi-copy stationary,  
  > So that invoices look uniform and print instantly with GST breakdown and QR codes across all counters.
- **Acceptance Criteria**:
  - [x] Create `UnifiedDocumentPrintModal.tsx` with toggle for `Thermal Receipt (80mm)` vs `Standard Laser (A4)`.
  - [x] Auto-calculate CGST, SGST, IGST, HSN codes, and dynamic UPI QR code.
  - [x] Replace separate `PharmacyInvoiceSlipModal.tsx` and `PrintableInvoiceBillModal.tsx` with this unified modal.

---

## 🔌 Sprint 9: Real-World Hospital Hardware Peripherals

### Epic: `EPIC-HW-04` — Physical Hardware & Device Integration
**Goal**: Enable direct plug-and-play USB/Bluetooth peripheral support for high-throughput counters.

---

### Ticket: `DS-HW-901` — WebUSB / WebSerial ESC/POS Thermal Printer Driver [COMPLETED]
- **Type**: Story / Feature
- **Priority**: `P2 - Medium`
- **Labels**: `frontend`, `hardware`, `printing`, `sprint-9`
- **Estimate**: 5 Story Points
- **Target Files**:
  - `apps/partner-platform/src/services/hardware-printer-service.ts`
  - `apps/partner-platform/src/components/common/FastOpdRegistrationDrawer.tsx`
- **User Story**:
  > As an OPD receptionist during morning peak rush,  
  > I want registration tokens to print directly to the thermal printer without popping up the native OS print preview dialog,  
  > So that patient intake is completed in under 2 seconds per patient.
- **Acceptance Criteria**:
  - [x] Implement `WebUSB` / `WebSerial` raw ESC/POS command pipeline for thermal printers (Epson, TVS, Citizen).
  - [x] Support silent 1-click token cut command (`GS V 0`).
  - [x] Provide graceful fallback to standard browser `window.print()` if WebUSB permissions are not granted.

---

### Ticket: `DS-HW-902` — Universal Barcode / 2D DataMatrix Scanner Listener [COMPLETED]
- **Type**: Story / Feature
- **Priority**: `P2 - Medium`
- **Labels**: `frontend`, `hardware`, `pharmacy`, `lims`, `sprint-9`
- **Estimate**: 3 Story Points
- **Target Files**:
  - `apps/partner-platform/src/services/hardware-barcode-listener.ts`
  - `apps/partner-platform/src/components/views/FastPharmacyPosCounterView.tsx`
  - `apps/partner-platform/src/components/views/SpecimenCollectionView.tsx`
- **User Story**:
  > As a pharmacist dispensing medicines or a phlebotomist collecting blood samples,  
  > I want scanning a barcode on a medicine strip or vacutainer tube to instantly add the item to the bill or mark the sample collected,  
  > So that manual typing errors and wrong-batch dispensing are physically prevented.
- **Acceptance Criteria**:
  - [x] Global keyboard wedge scanner listener with configurable inter-character timing (<30ms).
  - [x] Supports GS1 DataMatrix (GTIN, Expiry Date, Batch Number, Serial Number).
  - [x] Auto-selects corresponding FEFO batch in Pharmacy POS upon scan.
  - [x] Auto-marks vacutainer as `SAMPLE_COLLECTED` in Pathology LIMS.

---

## 🛡️ Sprint 10: Scale, Concurrency & Security Hardening

### Epic: `EPIC-SCALE-05` — High-Concurrency Hospital Enterprise Readiness
**Goal**: Guarantee 99.99% uptime and zero race conditions during peak 500+ patient morning surges.

---

### Ticket: `DS-PERF-1001` — Row-Level Locking for Concurrent Bed & Stock Allocations
- **Type**: Task / Performance
- **Priority**: `P1 - High`
- **Labels**: `backend`, `database`, `concurrency`, `sprint-10`
- **Estimate**: 5 Story Points
- **Target Files**:
  - `apps/api-gateway/src/routes/partner/inpatient.routes.ts`
  - `apps/api-gateway/src/routes/partner/pharmacy.routes.ts`
- **User Story**:
  > As an Emergency and ICU admission coordinator,  
  > I want bed reservations and medication allocations to use transactional row-level locks (`SELECT ... FOR UPDATE`),  
  > So that two staff members cannot accidentally admit two different patients into the exact same ICU bed simultaneously.
- **Acceptance Criteria**:
  - [ ] Enforce PostgreSQL isolation level `SERIALIZABLE` or `FOR UPDATE` lock during bed allocation transactions.
  - [ ] Enforce atomic inventory decrements (`available_quantity = available_quantity - :qty WHERE available_quantity >= :qty`).
  - [ ] Automated concurrency test script simulating 50 simultaneous allocations against 1 bed returning 1 success and 49 conflict errors (HTTP 409).

---

### Ticket: `DS-SEC-1002` — Automated Static & Dynamic RBAC Security Suite
- **Type**: Task / Security
- **Priority**: `P1 - High`
- **Labels**: `security`, `rbac`, `compliance`, `sprint-10`
- **Estimate**: 5 Story Points
- **Target Files**:
  - `apps/api-gateway/src/plugins/rbac.plugin.ts`
  - `tests/security/rbac-matrix.test.ts`
- **User Story**:
  > As a Hospital Compliance Officer,  
  > I want all Fastify REST API routes to strictly enforce role tokens,  
  > So that non-administrative staff cannot invoke billing voids, statutory tax settings, or clinical sign-offs.
- **Acceptance Criteria**:
  - [ ] Automated test suite testing all 172 API routes across 8 hospital roles.
  - [ ] Cashiers cannot access clinical consultation notes or diagnostic lab entries.
  - [ ] Junior doctors cannot approve high-risk vendor procurement purchase orders.
  - [ ] Clean test execution with 100% route coverage reporting zero unauthorized privilege escalations.

---

## 📋 Jira / GitHub Issues Import Formatting Reference

To create any of these tickets directly in GitHub or Jira, use the template below:

```markdown
### Summary
[Ticket Title]

### Epic
[Epic Name / Key]

### Description
**User Story**:
As a [Role], I want [Feature], so that [Benefit].

### Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

### Technical Specification
- **Service/Component**: `[File Path]`
- **REST Route**: `[HTTP Method] [Path]`
- **Estimated Points**: [Points]
- **Priority**: [P0 / P1 / P2 / P3]
```
