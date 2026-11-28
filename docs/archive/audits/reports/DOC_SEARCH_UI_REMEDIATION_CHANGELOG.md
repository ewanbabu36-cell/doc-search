# DOC SEARCH UI REMEDIATION CHANGELOG

> **DATE**: September 16, 2026  
> **SCOPE**: WHOLE-PROJECT UI REMEDIATION & HARDWARE PERIPHERALS INTEGRATION  
> **AUDIT SOURCE**: `DOC_SEARCH_WHOLE_PROJECT_UI_REAL_WORLD_MASTER_AUDIT.md`  
> **BASELINE**: `DOC_SEARCH_UI_REMEDIATION_BASELINE.md`  
> **CANONICAL RULE**: Use existing working implementation as canonical. Zero destructive refactoring. 100% monorepo build validity.

---

## 1. Summary of Changes by Category

| Category | Count / Impact | Core Files Modified / Added |
|---|---|---|
| **P0 Parallel Monolith Decoupling** | 2 files remediated | `HospitalHomeActivityHub.tsx`, `MamtaMultiSpecialtyStationView.tsx` |
| **P0 Double-Submission Guards** | 38 files / 44 buttons | 37 modal dialogs in `components/dialogs/` + `AdmissionRequestView.tsx` |
| **P1 Duplicate Pages Consolidation** | 6 primary workflows | Doctor Desk, Patient Directory, Emergency Desk, Pharmacy POS, Print Modal, Command Wall |
| **P1 Orphaned Views Accessibility** | 7 Domain Managers (60+ views) | `TabOverflowMenu.tsx` integration across Consultation, Command, Emergency, Pharmacy, Inpatient, WhatsApp, Dietary |
| **Cross-Department Patient Context** | 5 core domains | Event Bus `PATIENT_SELECTED` subscribed in Consultation, Lab, Pharmacy, Billing, Inpatient |
| **Hardware Peripherals Drivers** | 4 files (`EPIC-HW-04`) | `hardware-printer-service.ts`, `hardware-barcode-listener.ts`, `FastOpdRegistrationDrawer.tsx`, `FastPharmacyPosCounterView.tsx` |
| **Design Token Harmonization** | 3 major stations | CSS Variables in `DoctorExpressConsultationDesk.tsx`, `FastPharmacyPosCounterView.tsx`, `InpatientDomainManager.tsx` |
| **Monorepo Strict Build Verification** | 3 workspaces verified | `apps/partner-platform`, `apps/api-gateway`, `apps/company-platform` (100% exit code 0) |

---

## 2. Detailed Chronological & Categorical File Modification Log

### A. Hardware Peripherals Integration (`EPIC-HW-04`)

#### 1. `apps/partner-platform/src/services/hardware-printer-service.ts` [NEW]
- **Category**: Hardware Peripherals Driver (`DS-HW-901`)
- **Remediation & Architecture**:
  - Implemented `EscPosBuilder` generating raw ESC/POS binary command buffers: hardware reset (`0x1B, 0x40`), text alignments (`0x1B, 0x61`), font size scaling (`GS ! 0x11`), cash drawer pulse (`ESC p 0`), silent paper cut (`GS V 0` / `GS V 1`).
  - Added direct browser hardware driver support via WebUSB (`navigator.usb`) and WebSerial (`navigator.serial`).
  - Device USB vendor filtering for major clinical POS printer brands: Epson (`0x04b8`), TVS Electronics (`0x0fe6`, `0x1504`), Citizen (`0x1d90`), Star Micronics (`0x0547`), Winbond / POS-58 / POS-80 (`0x0416`, `0x0483`), CH340 Serial-USB bridge (`0x1a86`).
  - Implemented automatic receipt layout formatting for 58mm (32-character) and 80mm (48-character) thermal rolls with instant fallback to standard `window.print()`.

#### 2. `apps/partner-platform/src/services/hardware-barcode-listener.ts` [NEW]
- **Category**: Hardware Peripherals Driver (`DS-HW-902`)
- **Remediation & Architecture**:
  - Universal keyboard-wedge barcode scanner listener utilizing character burst timing (<35ms inter-key delta threshold). Distinguishes automated scanner bursts from human keyboard input.
  - Intercepts terminating `Enter` keypress and triggers `e.preventDefault()` to eliminate accidental form submissions in clinical input fields.
  - GS1 DataMatrix 2D medical barcode parser supporting Application Identifiers: GTIN `(01)`, Expiration Date `(17)` (auto-converted to ISO `YYYY-MM-DD`), Batch Number `(10)`, Serial Number `(21)`. Supports both bracketed and continuous FNC1 streams.
  - Linear 1D barcode and lab accession format support: EAN-13, UPC-A, Code 128, `ACC-...`, `SPEC-...`, `UHID-...`, `MRN-...`.
  - Embedded Web Audio API dual-tone acoustic synthesizer: 1046Hz -> 1318Hz success chime; 220Hz error buzz.
  - Extended `hospital-event-bus.ts` with `'BARCODE_SCANNED'` event broadcasting.

#### 3. `apps/partner-platform/src/components/common/FastOpdRegistrationDrawer.tsx` [MODIFY]
- **Category**: Rapid OPD Intake & Hardware Integration
- **Remediation & Architecture**:
  - Embedded direct thermal printer connection HUD displaying real-time USB/Serial status.
  - Added `Direct Thermal (Silent Cut)` instant print action alongside standard print dialog.
  - Added toggle `⚡ Auto-cut thermal slip instantly on token creation (Skip print dialog)` enabling patient intake in under 2 seconds.
  - Preserved statutory partner KYC verification guard (`checkPartnerProfileStatus`).

#### 4. `apps/partner-platform/src/components/views/FastPharmacyPosCounterView.tsx` [MODIFY]
- **Category**: Pharmacy POS & Hardware Scanner Integration
- **Remediation & Architecture**:
  - Mounted hardware barcode listener (`useHardwareBarcodeListener`) to the live POS counter.
  - Instant barcode scan auto-matches GTIN and batch or auto-selects earliest expiry FEFO batch and appends directly to cart.
  - Added live acoustic beep feedback on successful scan.
  - Rendered `⚡ Scanner Ready` HUD indicator badge.

#### 5. `apps/partner-platform/src/components/views/SpecimenCollectionView.tsx` [MODIFY]
- **Category**: Laboratory Phlebotomy & Vacutainer Tube Barcode Listener
- **Remediation & Architecture**:
  - Mounted hardware barcode listener for vacutainer tube accession labels.
  - Automatically matches scanned accession barcode against active lab collection queue, invoking `onCollectSpecimen(ord)` instantly with audio chime.

---

### B. P0 Parallel Monolith & Architecture Remediation

#### 6. `apps/partner-platform/src/components/HospitalHomeActivityHub.tsx` [MODIFY]
- **Category**: P0 Parallel Monolith Remediation
- **Remediation & Architecture**:
  - Decoupled and removed the embedded monolithic `MamtaMultiSpecialtyStationView` (2,960 lines) from the main hospital landing dashboard.
  - Restored the canonical Enterprise HIS Command Wall and Launchpad cards.
  - Formally routes staff directly to the 6 canonical modular Domain Managers:
    1. `PatientRegistrationDomainManager`
    2. `ClinicalConsultationDomainManager`
    3. `ClinicalInvestigationDomainManager`
    4. `RadiologyDomainManager`
    5. `PharmacyDomainManager`
    6. `BillingDomainManager`

#### 7. `apps/partner-platform/src/components/views/MamtaMultiSpecialtyStationView.tsx` [DECOUPLE]
- **Category**: P0 Monolith Decoupling
- **Remediation & Architecture**:
  - Decoupled from active navigation routes and hospital entry points.
  - Retained safely as a standalone reference component without active execution in production workflows.

---

### C. P0 Double-Submission Guards (38 Files / 44 Action Buttons)

#### 8. Modal Dialogs in `apps/partner-platform/src/components/dialogs/` [MODIFY]
- **Files Remediated**:
  - `CreateDoctorProfileDialog.tsx`
  - `FacilityCreateDialog.tsx`
  - `OrganizationCreateDialog.tsx`
  - `CreatePatientDialog.tsx`
  - `AllocateBedDialog.tsx`
  - `ApproveAdmissionDialog.tsx`
  - `CreateAdmissionRequestDialog.tsx`
  - `DirectAdmitBedDialog.tsx`
  - `CreateWardDialog.tsx`
  - `EditWardDialog.tsx`
  - `CreateBedDialog.tsx`
  - `EditBedDialog.tsx`
  - `BlockBedDialog.tsx`
  - `CreateBedReservationDialog.tsx`
  - `CancelBedReservationDialog.tsx`
  - `RejectAdmissionDialog.tsx`
  - `CancelAdmissionDialog.tsx`
  - `CreateTransferDialog.tsx`
  - `ApproveTransferDialog.tsx`
  - `CompleteTransferDialog.tsx`
  - `NursingAssessmentDialog.tsx`
  - `NursingNoteDialog.tsx`
  - `CarePlanDialog.tsx`
  - `RecordVitalDialog.tsx`
  - `DoctorRoundDialog.tsx`
  - `CreateDischargePlanDialog.tsx`
  - `RequestDischargeDialog.tsx`
  - `ApproveDischargeDialog.tsx`
  - `CompleteDischargeDialog.tsx`
  - `FinalizeDischargeSummaryDialog.tsx`
  - `ReleaseBedDialog.tsx`
  - `CompleteCleaningDialog.tsx`
  - `CreateOrderDialog.tsx`
  - `CreateMedicationDialog.tsx`
  - `DispensePrescriptionDialog.tsx`
  - `ReceiveStockDialog.tsx`
  - `ReserveStockDialog.tsx`
  - `VerifyPrescriptionDialog.tsx`
- **Remediation & Architecture**:
  - Added component state `const [isSubmitting, setIsSubmitting] = useState(false)`.
  - Set `isSubmitting = true` immediately upon form submission event.
  - Bound `disabled={isSubmitting}` to submission buttons with visual loading indicators.
  - Wrapped submission in `try...finally` blocks ensuring `setIsSubmitting(false)` releases the lock on API error.
  - Eliminated race condition duplicate records in database persistence.

#### 9. Inline Workflow Views [MODIFY]
- **Files Remediated**:
  - `apps/partner-platform/src/components/views/AdmissionRequestView.tsx`
  - `apps/partner-platform/src/components/views/ClaimDirectoryView.tsx`
- **Remediation & Architecture**:
  - Guarded inline workflow action buttons (Approve, Reject, Allocate Bed, Adjudicate Claim) with localized busy states and `disabled` attributes.

---

### D. P1 Duplicate Pages & Workflows Consolidation

| Workflow Area | Canonical Implementation | Deprecated / Secondary Variant | Consolidation Resolution |
|---|---|---|---|
| **Clinical OPD Consultation** | `DoctorExpressConsultationDesk.tsx` | `ClinicalConsultationView.tsx` | `DoctorExpressConsultationDesk` is canonical 3-click consultation desk; `ClinicalConsultationView` deprecated |
| **Emergency Operations** | `EmergencyCommandCenterView.tsx` | `EmergencyDashboardView.tsx` | `EmergencyCommandCenterView` canonical operational station; `EmergencyDashboardView` accessible via overflow menu |
| **Pharmacy POS** | `FastPharmacyPosCounterView.tsx` | `PharmacyPOSView.tsx` | `FastPharmacyPosCounterView` canonical primary POS counter |
| **Document Printing** | `UnifiedDocumentPrintModal.tsx` | `PrintableInvoiceBillModal.tsx`, `PharmacyInvoiceSlipModal.tsx` | Consolidated on `UnifiedDocumentPrintModal` with universal ESC/POS support |
| **Patient Directory** | `PatientDirectoryView.tsx` | `PatientSearchView.tsx` | Search box unified directly into table header of `PatientDirectoryView.tsx` |
| **Patient Registration** | `FastOpdRegistrationDrawer.tsx` | `CreatePatientDialog.tsx` | Fast Drawer canonical 2-click intake; Dialog retained for comprehensive secondary KYC |

---

### E. P1 Orphaned Views Resolution via `TabOverflowMenu`

#### 10. `apps/partner-platform/src/components/common/TabOverflowMenu.tsx` [NEW]
- **Category**: Navigation Usability & View Accessibility
- **Remediation & Architecture**:
  - Compact, accessible dropdown menu component preventing horizontal scrollbar explosion on 1366x768 / 1920x1080 hospital workstations.
  - Features badge count badges, active highlight, auto-close on escape or click-outside.

#### 11. Domain Managers Tab Strip Remediation:
- **`ClinicalConsultationDomainManager.tsx`**: Added `timeline` (Patient Longitudinal Timeline) and `audit` (Consultation Audit Vault) into active tab strip.
- **`ExecutiveCommandDomainManager.tsx`**: Structured primary operational tabs (`OVERVIEW`, `COMMAND_WALL`, `BED_FORECASTS`, `ED_NEDOCS`, `OT_EFFICIENCY`) and placed secondary analytical tabs (`CLINICAL_ACUITY`, `RCM_LEAKAGE`, `CONSUMABLES`, `WHAT_IF_SANDBOX`, `AUDIT_VAULT`) in `TabOverflowMenu`.
- **`EmergencyDomainManager.tsx`**: Primary triage stations visible; 14 secondary modules accessible in `TabOverflowMenu`.
- **`PharmacyDomainManager.tsx`**: Counter tabs in primary strip; `patientHistory`, `reports`, `movements`, `returns`, `expiry` in `TabOverflowMenu`.
- **`InpatientDomainManager.tsx`**: Primary daily shift tabs (Bed Board, Nursing Station, Census, Rounds, Admissions, Discharge); 19 specialized modules in `TabOverflowMenu`.
- **`WhatsAppPortalDomainManager.tsx`**: Primary desk tabs; Aarogya Portal, PDF Dispatch, Live Tokens in `TabOverflowMenu`.
- **`DietaryDomainManager.tsx`**: Primary kitchen tabs; Food Catalog, Meal Delivery, Waste Tracking in `TabOverflowMenu`.

---

### F. Cross-Department Patient Context Integration

#### 12. `apps/partner-platform/src/components/InpatientDomainManager.tsx` [MODIFY]
- **Category**: Cross-Department Context Continuity
- **Remediation & Architecture**:
  - Imported `hospitalEventBus` and added subscriptions for `PATIENT_SELECTED` and `PATIENT_CLEARED`.
  - Rendered Active Cross-Department Patient Context Banner displaying active patient Name, UHID/MRN, Age, Gender, with direct action `+ Create Requisition` and `Clear Patient ✕`.
  - Connects Inpatient department seamlessly to the global patient context bus established across OPD, Lab, Pharmacy, and Billing.

#### Existing Verified Subscribers:
- `ClinicalConsultationDomainManager.tsx`
- `ClinicalInvestigationDomainManager.tsx`
- `BillingDomainManager.tsx`
- `PharmacyDomainManager.tsx`

---

### G. UI Consistency & Design Token Harmonization

#### 13. Token Harmonization Across Stations [MODIFY]
- **Files Remediated**:
  - `DoctorExpressConsultationDesk.tsx`
  - `FastPharmacyPosCounterView.tsx`
  - `InpatientDomainManager.tsx`
- **Remediation & Architecture**:
  - Replaced hardcoded inline hex colors with unified CSS variables from `@docsearch/ui-kit`:
    - `var(--ds-color-primary)`
    - `var(--ds-color-surface)`
    - `var(--ds-color-border)`
    - `var(--ds-color-text-primary)`
    - `var(--ds-color-text-muted)`
    - `var(--ds-color-success)`
    - `var(--ds-color-error)`
  - Guaranteed high-contrast readability across clinical ambient light conditions and night shifts.
