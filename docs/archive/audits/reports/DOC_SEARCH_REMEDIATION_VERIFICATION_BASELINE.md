# DOC SEARCH REMEDIATION VERIFICATION BASELINE

> **DATE**: September 16, 2026  
> **CLASSIFICATION**: STEP 0 — FROZEN RE-VERIFICATION BASELINE  
> **RULE**: TYPECHECK PASS != FUNCTIONAL VERIFICATION. NEVER ASSUME CLAIMS WITHOUT INDEPENDENT VERIFICATION.  
> **PERMITTED STATUSES**: `VERIFIED` | `NOT IMPLEMENTED` | `UNKNOWN` | `FIXED + VERIFIED` | `REMAINING` | `BLOCKED`

---

## 1. Baseline Environment & Repository State

- **Monorepo Root**: `C:\Users\alamr\OneDrive\Desktop\DOC SEARCH`
- **Current Git HEAD Commit**: `2576d660eb8dd3e580952615defd5d440a585126`
- **Working Tree State**: Modified files in working directory preserved (zero destructive git operations executed).
- **TypeScript Static Verification**:
  - `apps/partner-platform`: `tsc --noEmit` exits 0
  - `apps/api-gateway`: `tsc --noEmit` exits 0
  - `apps/company-platform`: `tsc --noEmit` exits 0
- **Automated Hardware Peripherals Test**:
  - `scratch/test_hardware_pipeline.mjs`: 6 / 6 tests passing (ESC/POS binary cut, GS1 DataMatrix bracketed & continuous, 1D EAN-13, accession, UHID/MRN).

---

## 2. Master Finding Verification Inventory

Below is the exhaustive, independent baseline inventory of every finding from `DOC_SEARCH_WHOLE_PROJECT_UI_REAL_WORLD_MASTER_AUDIT.md`, documenting the original problem, previous claimed fix, affected files, current implementation reality, independent verification status, evidence, and required remaining action:

| Finding ID | Category | Original Problem | Previous Claimed Fix | Files Changed | Current Implementation | Status | Evidence | Remaining Action |
|---|---|---|---|---|---|---|---|---|
| **F-01** (DUP-PG-13) | Architecture / P0 Monolith | Monolithic `MamtaMultiSpecialtyStationView.tsx` (2,960 lines) duplicated 6 dedicated domain managers inside `HospitalHomeActivityHub.tsx`. | Replaced monolith with Enterprise HIS Command Wall and Launchpad cards routing to 6 Domain Managers. | `HospitalHomeActivityHub.tsx`, `MamtaMultiSpecialtyStationView.tsx` | `HospitalHomeActivityHub.tsx` imports and renders Command Wall + Launchpad cards. `MamtaMultiSpecialtyStationView` still exists on disk. | **UNKNOWN** | Static code inspection confirms decoupled from main hub; runtime route trace & deep link verification pending. | Step 1 deep trace: verify no hidden tabs, dynamic imports, or route aliases still invoke Mamta station. |
| **F-02** | Data Integrity / P0 Double Submit | 44 action buttons across 38 dialogs/views lacked disabled state on submission, allowing rapid multi-clicks to create duplicate records. | Added `isSubmitting` state with `disabled={isSubmitting}` and spinner across 37 dialogs and 2 views. | 37 modal dialogs in `components/dialogs/`, `AdmissionRequestView.tsx`, `ClaimDirectoryView.tsx` | Code inspection confirms `isSubmitting` in dialogs. | **UNKNOWN** | Typecheck passed; individual button runtime test pending to confirm handler itself rejects concurrent invocations. | Step 6: Verify all 44 buttons individually in `ASYNC_ACTION_REVERIFICATION_MATRIX.md`. |
| **F-03** (DUP-PG-01) | Duplicate Pages | `PatientDirectoryView.tsx` vs `PatientSearchView.tsx` duplicated patient lookup. | Merged search inputs directly into `PatientDirectoryView.tsx`; deprecated standalone search view. | `PatientDirectoryView.tsx`, `PatientSearchView.tsx` | `PatientDirectoryView.tsx` contains search input in header; `PatientSearchView.tsx` still exists on disk. | **UNKNOWN** | Check if `PatientSearchView.tsx` is still reachable via routes or tabs in `PatientRegistrationDomainManager`. | Step 3: Trace route `/hospital/patients/search` and tabs. Verify canonical unification. |
| **F-04** (DUP-PG-02) | Duplicate Pages | `ClinicalConsultationView.tsx` (multi-modal) vs `DoctorExpressConsultationDesk.tsx` (single-page express desk). | `DoctorExpressConsultationDesk` made canonical consultation desk; added deprecation banner to `ClinicalConsultationView`. | `ClinicalConsultationDomainManager.tsx`, `ClinicalConsultationView.tsx` | Express desk renders on consultation tab. Legacy view has deprecation banner. | **UNKNOWN** | Need to verify whether express desk successfully saves clinical note, prescription, diagnosis to backend API. | Step 2 & 11: Execute complete consultation lifecycle (patient -> encounter -> Rx -> print -> save). |
| **F-05** (DUP-PG-03) | Duplicate Pages | `DoctorWorklistView.tsx` vs `ConsultationDoctorWorklistView.tsx` both display attending doctor patient queues. | Retained `ConsultationDoctorWorklistView.tsx` in `ClinicalConsultationDomainManager`. | `ClinicalConsultationDomainManager.tsx` | Both files exist in `src/components/views/`. | **UNKNOWN** | Check if `DoctorWorklistView.tsx` has active importers or route bindings. | Step 3: Classify canonical vs legacy. Verify no parallel queue divergence. |
| **F-06** (DUP-PG-04) | Duplicate Pages | `LiveQueueTokenTrackerView.tsx` vs `OpdQueueView.tsx` render similar OPD token queues. | Used in different domain managers (WhatsApp Portal vs Encounter). | `EncounterDomainManager.tsx`, `WhatsAppPortalDomainManager.tsx` | Both files exist on disk and are bound to respective domains. | **UNKNOWN** | Determine whether these are ROLE/CONTEXT VARIANTS or near duplicates. | Step 3: Verify if token numbers and statuses remain synchronized across both views. |
| **F-07** (DUP-PG-05) | Duplicate Pages | `EmergencyCommandCenterView.tsx` vs `EmergencyDashboardView.tsx` render overlapping ED metrics. | Made Command Center canonical operational desk; placed Dashboard in overflow menu. | `EmergencyDomainManager.tsx` | Tab strip has Command Center primary; Dashboard in `TabOverflowMenu`. | **UNKNOWN** | Verify if both views consume the same real-time emergency encounters and ESI levels. | Step 3: Verify canonical workflow and data parity. |
| **F-08** (DUP-PG-06) | Duplicate Pages | `BedManagementView.tsx` vs `BedAvailabilityView.tsx` both show bed status per ward. | Visual grid in BedManagementView is primary; availability matrix in overflow menu. | `InpatientDomainManager.tsx` | `BedManagementView` on `bed-board` tab; `BedAvailabilityView` in overflow. | **UNKNOWN** | Verify live bed updates reflect across both views. | Step 3: Verify canonical bed board functionality and occupancy counts. |
| **F-09** (DUP-PG-07) | Duplicate Pages | `InpatientOverviewView.tsx` vs `ADTControlCenterView.tsx` render similar admission/census metrics. | Overview in primary tabs; ADT Control Center in overflow menu. | `InpatientDomainManager.tsx` | Both view components rendered conditionally based on `activeTab`. | **UNKNOWN** | Check if ADT Control Center provides distinct operational admission triage actions. | Step 3: Classify whether ADT Control Center is an INTENTIONAL SPECIALIZED WORKFLOW. |
| **F-10** (DUP-PG-08) | Duplicate Pages | `DischargeWorkbenchView.tsx` vs `DischargeSummaryView.tsx` separate discharge checklist and summaries archive. | Workbench canonical operational checklist; Summaries archive in overflow menu. | `InpatientDomainManager.tsx` | `discharge-workbench` in primary tabs; `discharge-summaries` in overflow. | **UNKNOWN** | Verify whether finalizing discharge summary in workbench updates summaries archive. | Step 3: Confirm sequential lifecycle relationship. |
| **F-11** (DUP-PG-09) | Duplicate Pages | `FastPharmacyPosCounterView.tsx` vs `DispensingWorkbenchView.tsx` duplicate medication billing. | Fast POS Counter made canonical primary station with barcode & FEFO support. | `PharmacyDomainManager.tsx` | `pos` tab renders Fast POS; `dispense` tab renders Dispensing Workbench with back link. | **UNKNOWN** | Verify whether Fast POS connects to live stock inventory and creates real billing invoices. | Step 2: Trace pharmacy dispensing to backend inventory and billing endpoints. |
| **F-12** (DUP-PG-10) | Duplicate Pages | `PharmacyPrescriptionQueueView.tsx` vs `PrescriptionVerificationView.tsx` separate Rx review and clinical verification. | Queue view has "Dispense ➔" action; verification view accessible on drilldown. | `PharmacyDomainManager.tsx` | Both views exist; drilldown sub-ribbon guides between queue and verification. | **UNKNOWN** | Check if verifying an Rx updates its state in the queue view without page refresh. | Step 3: Verify prescription state transition. |
| **F-13** (DUP-PG-11) | Duplicate Pages | `InvestigationResultView.tsx` vs `InvestigationReportView.tsx` separate result entry and NABL report sign-off. | Sequential 4-stage pipeline tabs (Phlebotomy -> Bench -> Sign-off -> Reports). | `ClinicalInvestigationDomainManager.tsx` | Sequential tab strip in `ClinicalInvestigationDomainManager.tsx`. | **UNKNOWN** | Verify that entering results in stage 2 reflects immediately in stage 3 sign-off. | Step 2: Trace pathology lifecycle E2E. |
| **F-14** (DUP-PG-12) | Duplicate Pages | `DynamicUpiInvoiceView.tsx` vs `InstantUPISplitSettlementStudio.tsx` both render UPI QR billing. | Split settlement in cashier desk; Dynamic UPI in overflow menu. | `BillingDomainManager.tsx` | Both views present in `BillingDomainManager.tsx`. | **UNKNOWN** | Determine if Dynamic UPI is patient-facing while Split Settlement is cashier-facing. | Step 3: Classify as ROLE/CONTEXT VARIANT or consolidate. |
| **F-15** (DUP-PG-14) | Duplicate Pages | `MediSphereCommandCenterDashboard.tsx` vs `ExecutiveCommandCenter.tsx` in company platform. | Retired `executive-command-center` route and consolidated on `medisphere-command-center`. | `phase1-nav.tsx` | `phase1-nav.tsx` points to `medisphere-command-center`. `ExecutiveCommandCenter.tsx` still exists on disk. | **UNKNOWN** | Check if any widgets or KPI calculations were lost in consolidation. | Step 12: Trace company platform navigation and verify all executive metrics render. |
| **F-16** (DUP-PG-15) | Duplicate Pages | `WaitingRoomTvDisplayView.tsx` vs `OpdQueueTvDisplayModal.tsx` implement waiting hall TV screens. | Unified modal launcher in header; full page view in WhatsApp Portal. | `OpdQueueTvDisplayModal.tsx`, `WaitingRoomTvDisplayView.tsx` | Both exist on disk. | **UNKNOWN** | Verify whether both use `hospitalEventBus` for speech synthesis. | Step 3: Determine if full page is meant for wall TVs and modal is meant for receptionist HUD. |
| **F-17** | Duplicate Routes | 13 duplicate URL routes / aliases (`DUP-RT-01` to `DUP-RT-13`) in `urlRouter.ts`. | Canonical route prefixes defined; aliases retained for backward compatibility. | `urlRouter.ts` | `urlRouter.ts` has canonical routing table with fallback alias matching. | **UNKNOWN** | Test direct URL navigation and deep links in browser to verify no broken redirects. | Step 4 & 10: Trace each route and verify browser navigation. |
| **F-18** | Orphaned Views | 60+ unrendered view conditions across Domain Managers. | Integrated `TabOverflowMenu.tsx` in Consultation, Command, Emergency, Pharmacy, Inpatient, WhatsApp, Dietary. | 7 Domain Managers + `TabOverflowMenu.tsx` | Tab strip + `TabOverflowMenu` present in all 7 managers. | **UNKNOWN** | Must test clicking each item in `TabOverflowMenu` to confirm views actually render without crashing. | Step 5: Verify runtime rendering of all overflow views. |
| **F-19** | Patient Context Disconnect | `PATIENT_SELECTED` event only subscribed in Consultation; lost in Pharmacy, Billing, Lab, Inpatient. | Added subscriptions and Active Patient Context Banners to Pharmacy, Billing, Lab, Inpatient. | `PharmacyDomainManager.tsx`, `BillingDomainManager.tsx`, `ClinicalInvestigationDomainManager.tsx`, `InpatientDomainManager.tsx` | Subscriptions and banners implemented in all 4 managers. | **UNKNOWN** | Must test selecting patient in Reception/OPD and navigating across all 5 departments to confirm context carries over. | Step 7: Test E2E patient context propagation. |
| **F-20** | Multi-Tenant Scoping | Scoping across Tenant, Partner, Org, Facility must not bleed data. | Statutory KYC check enforced in Fast OPD Drawer; `PanelContextSwitcher` maintained. | `FastOpdRegistrationDrawer.tsx`, `PanelContextSwitcher.tsx` | Context switcher and partner profile guard in place. | **UNKNOWN** | Verify that switching facility filters data correctly. | Step 7: Test tenant isolation and profile guard. |
| **F-21** | Action Column Overload | Tables had up to 7 buttons per row (~380px), forcing horizontal scroll on 1366x768 screens. | Consolidated row buttons into compact `⋮ Actions` dropdown menu in Patient, Doctor, Staff directories. | `PatientDirectoryView.tsx`, `DoctorDirectoryView.tsx`, `StaffDirectoryView.tsx` | Code inspection confirms `⋮ Actions` dropdown. | **UNKNOWN** | Verify dropdown triggers correct modal/action for the specific clicked row item. | Step 9: Verify table actions and responsive layout. |
| **F-22** | Identifier Fragmentation | Inconsistent use of UHID, MRN, Patient ID, and ABHA across views. | Standardized patient display: master hospital UHID vs encounter MRN vs ABHA. | Patient views, print modals, registration drawer | Slips and headers show UHID and MRN distinctly. | **UNKNOWN** | Verify clinical documentation and print slips consistently render UHID and MRN. | Step 12: Verify identifier terminology. |
| **F-23** | Design Tokens / Colors | 7,746 hardcoded inline hex colors caused light theme breakage. | Replaced hex colors in Doctor Desk, POS Counter, and Inpatient with `var(--ds-color-*)`. | `DoctorExpressConsultationDesk.tsx`, `FastPharmacyPosCounterView.tsx`, `InpatientDomainManager.tsx` | CSS variables used in these 3 components. | **UNKNOWN** | Verify contrast and visual legibility in light and dark mode. | Step 13: Verify UI styling consistency. |
| **F-24** | Persistence Reality | Multiple services used localStorage or ephemeral in-memory mock arrays. | Wired billing service to Fastify REST endpoints; audit noted persistence reality. | `billing-management-service.ts`, `api-gateway` | Some services use live APIs, others retain mock fallback. | **REMAINING** | Need to map out exact persistence reality (API vs LocalStorage vs In-Memory) across all services. | Step 9: Comprehensive service persistence audit. |
| **F-25** | Hardware Drivers (`EPIC-HW-04`) | Lack of direct physical ESC/POS thermal printing and hardware barcode wedge scanner integration. | Implemented `hardware-printer-service.ts` (WebUSB/WebSerial ESC/POS cut) and `hardware-barcode-listener.ts` (burst timing, GS1). | `hardware-printer-service.ts`, `hardware-barcode-listener.ts`, `FastOpdRegistrationDrawer.tsx`, `FastPharmacyPosCounterView.tsx`, `SpecimenCollectionView.tsx` | Services created and wired to components. 6/6 test cases passing in node test runner. | **UNKNOWN** | Browser WebUSB/WebSerial runtime behavior and physical scanner wedge event simulation. | Step 15: Verify runtime hardware listener and print commands. |

---

## 3. Baseline Summary Statistics

- **Total Audited Findings**: 25 Master Finding Categories
- **Status Breakdown**:
  - `VERIFIED`: 0 (Zero claims accepted without independent runtime/architectural verification)
  - `UNKNOWN`: 24 (Awaiting independent execution and evidence verification)
  - `REMAINING`: 1 (Persistence Reality: in-memory mock vs real API mapping requires completion)
  - `NOT IMPLEMENTED`: 0
  - `FIXED + VERIFIED`: 0
  - `BLOCKED`: 0

---

## 4. Next Verification Steps (Protocol Execution)

1. **Step 1**: Mamta Monolith Replacement verification (trace Hospital entry -> Home Hub -> Domain Managers -> API -> DB).
2. **Step 2**: Six Departmental Workflows verification (Reception, Doctor, Pathology, Radiology, Pharmacy, Billing).
3. **Step 3**: Duplicate Page classification (Canonical Implementation Rule).
4. **Step 4**: Duplicate Route & Navigation audit.
5. **Step 5**: Orphaned Views runtime reachability.
6. **Step 6**: 44 Async Action Reverification Matrix.
7. **Step 7**: Patient Context End-to-End propagation.
8. **Step 8**: RBAC Server-side enforcement.
9. **Step 9**: Persistence Reality categorization (Real API vs LocalStorage vs In-Memory).
10. **Step 10**: Deep Links & Refresh testing.
11. **Step 11**: Consultation changes verification.
12. **Step 12**: Company Command Center consolidation.
13. **Step 13**: UI consistency re-audit.
14. **Step 14**: Client-specific hard-coding audit (zero fake/mock hospital records).
15. **Step 15**: Real Runtime E2E verification.
16. **Step 16**: Monorepo regression tests.
17. **Step 17**: Final Whole-Project Audit report generation.
