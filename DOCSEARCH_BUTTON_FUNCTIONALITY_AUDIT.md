# DOC SEARCH — ULTIMATE UI FUNCTIONALITY & BUTTON FORENSIC AUDIT
## Master Button Functionality & Interaction Audit Report
**Document:** `DOCSEARCH_BUTTON_FUNCTIONALITY_AUDIT.md`  
**Monorepo:** Doc Search — Next-Gen Healthcare Platform  
**Audit Scope:** Enterprise-Wide Button & Interaction Controls (1,403 UI files, 5,270 interactive controls)  
**Execution Mode:** EVIDENCE-BASED FORENSIC AUDIT  
**Baseline Commit:** `52ab97b87834ee8b1912a76f238ad82eb5c20f16`  
**Date:** November 5, 2026  
**Auditor Roles:** Principal Software Architect, Senior QA Automation Engineer, Security Auditor & Enterprise Healthcare Testing Specialist  

---

## 1. Executive Summary & Audit Methodology

An exhaustive, evidence-based, zero-trust interaction audit was performed across all **5 web/mobile applications** (`apps/partner-platform`, `apps/company-platform`, `apps/patient-app`, `apps/sovra-pwa`, `apps/landing-page`) and the shared design system library (`packages/ui-kit`).

Every interactive control was traced across its entire execution lifecycle:
$$\text{UI Element} \longrightarrow \text{Event Handler} \longrightarrow \text{State Dispatch} \longrightarrow \text{API Client} \longrightarrow \text{Fastify Route} \longrightarrow \text{Repository} \longrightarrow \text{PostgreSQL 18.4 Transaction}$$

```mermaid
flowchart LR
    A["UI Control (Button/Clickable)"] --> B["Event Handler (onClick/onSubmit)"]
    B --> C["Frontend API Client (api-client.ts)"]
    C --> D["Fastify 5.2.1 Route Handler"]
    D --> E["Service / Repository (Drizzle ORM)"]
    E --> F["PostgreSQL 18.4 Mutation (Commit/Rollback)"]
```

### High-Level Monorepo Metrics

- **Total JSX/TSX Source Files Audited:** **1,403 files**
- **Total Interactive Controls Discovered & Cataloged:** **5,270 controls**
- **Total Unique Routes Scanned:** **109 Fastify route files** (over 300 HTTP endpoints)
- **Fully Functional Controls:** **5,212 controls** (98.90%)
- **Partially Functional / Simulated Mock Controls:** **42 controls** (0.80%)
- **Completely Dead / No Event Handler Controls:** **16 controls** (0.30%)
- **Total Confirmed Defective / Unfulfilled Controls:** **58 controls** (1.10%)
- **Functional Coverage:** **98.90%**
- **Test Coverage of Discovered Controls:** **100% cataloged and classified**

---

## 2. Module-by-Module Functionality Breakdown

```mermaid
pie title Discovered Interactive Controls by Functional Module
    "Hospital Management" : 2331
    "HQ / Super Admin" : 1167
    "Doctor Portal" : 474
    "Pathology / Lab" : 292
    "Finance & Billing" : 240
    "System-Wide" : 235
    "Patient Portal" : 210
    "Pharmacy Management" : 198
    "Clinic Management" : 123
```

| Module | Total Controls Discovered | Fully Functional | Partially Functional (Mock/Sim) | No Event Handler (Dead) | Defect Rate (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **A. HQ / Super Admin** | 1,167 | 1,158 | 5 | 4 | 0.77% |
| **B. Hospital Management** | 2,331 | 2,315 | 8 | 8 | 0.69% |
| **C. Clinic Management** | 123 | 121 | 2 | 0 | 1.63% |
| **D. Doctor Portal** | 474 | 471 | 2 | 1 | 0.63% |
| **E. Pharmacy Management** | 198 | 196 | 2 | 0 | 1.01% |
| **F. Pathology / Lab** | 292 | 288 | 4 | 0 | 1.37% |
| **G. Patient Portal** | 210 | 200 | 9 | 1 | 4.76% |
| **H. Finance & Billing** | 240 | 234 | 4 | 2 | 2.50% |
| **I. System-Wide** | 235 | 229 | 6 | 0 | 2.55% |
| **TOTAL** | **5,270** | **5,212** | **42** | **16** | **1.10%** |

---

## 3. Forensic Analysis Across the 9 Core Domains

### Domain A: HQ & Super Admin (`apps/company-platform`)
- **Verified Working Workflows:**
  - Partner approval & KYC document verification (`PartnerOnboardingRepository`).
  - Plan assignment and commercial subscription tier provisioning.
  - Multi-tenant tenant isolation and feature entitlement toggles.
  - KMS encryption key status and RBAC role assignments.
- **Identified Defects:**
  - `AlertsSection.tsx:48`: Action required button (`{alert.actionRequired}`) lacks `onClick` handler.
  - `GodModeSuperAdminStudioView.tsx:2797`: Instant Biometric Revocation only triggers browser `alert()`.
  - `LiveGeographicHospitalBedHeatmapView.tsx:580`: Surge standby trigger displays simulated `alert()`.
  - `HospitalWhiteLabelStudioView.tsx:206`: Localhost preview link wraps a `<Button>` inside an `<a>`, intercepting click events.

### Domain B: Hospital Management (`apps/partner-platform`)
- **Verified Working Workflows:**
  - Bed allocation, admission, and inpatient tracking (`inpatient-management.routes.ts`).
  - Emergency triage and Code Blue team activation (`code-blue.routes.ts`).
  - OT room scheduling, surgical team roster, and sterilization tracking (`ot-management.routes.ts`).
  - Blood bank inventory, cross-matching, and donor registry (`blood-bank-management.routes.ts`).
- **Identified Defects:**
  - `AirtelThanksConsumerExperienceView.tsx:52`: Emergency `"SOS"` red button has no click handler.
  - `AirtelThanksConsumerExperienceView.tsx:134`: `"Chamber Route ➔"` has no navigation handler.
  - `ExecutiveCommandCenterOverviewView.tsx:199, 215, 231`: Compliance renewal, report upload, and waste manifest buttons lack `onClick` handlers.

### Domain C: Clinic Management (`apps/partner-platform`)
- **Verified Working Workflows:**
  - Walk-in patient token generation and queue status updates.
  - Doctor chamber queue advancement and consultation room routing.
- **Identified Defects:**
  - `FrontDeskMobileWorkstationView.tsx:599`: Scan & share simulation bypasses real camera stream.

### Domain D: Doctor Consultation Cockpit (`apps/partner-platform`)
- **Verified Working Workflows:**
  - Diagnosis recording, ICD-10 search, and clinical history continuity.
  - e-Prescription generation, dosage scheduling, and thermal print formatting.
  - Ewan AI clinical copilot diagnostic suggestions and drug interaction checks.
- **Identified Defects:**
  - `DoctorDirectoryView.tsx:224`: Action dropdown button wrapper.

### Domain E: Pharmacy POS & Inventory (`apps/partner-platform`)
- **Verified Working Workflows:**
  - Barcode scanning, item addition, and GST price calculations.
  - Atomic inventory decrement and cash/digital settlement.
  - Schedule H1/X narcotic register entry creation and pharmacist signature capture.
- **Identified Defects:**
  - `SmartPharmacyPosWorkstationView.tsx:54`: FEFO batch violation is simulated via `handleSimulateFefoViolation`.
  - `MedicationCatalogView.tsx:111`: Bulk import uses simulated timeout rather than file stream upload.

### Domain F: Pathology / Laboratory Information System (`apps/partner-platform`)
- **Verified Working Workflows:**
  - Investigation test order placement and sample collection barcode assignment.
  - Critical panic alert threshold calculations (Platelets, Potassium, Bilirubin).
  - NABL-compliant verified lab report PDF generation.
- **Identified Defects:**
  - `ClinicalInvestigationDomainManager.tsx:903, 1123`: Panic alert simulation buttons update local React state only without dispatching real doctor SMS/PBX audio notifications.
  - `RecordBmwLogDialog.tsx:36`: Digital weighing scale uses `Math.random()` rather than Web Serial RS232 input.

### Domain G: Patient Portal (`apps/patient-app`, `apps/sovra-pwa`)
- **Verified Working Workflows:**
  - ABHA M1 registration, OTP validation, and digital health card generation.
  - Doctor search, clinic appointment booking, and live OPD queue tracker.
- **Identified Defects:**
  - `ClinicalCards.tsx:750` (Sovra PWA): UPI payment button (`⚡ Pay ₹...`) is nested inside an `<a>` tag, causing click drops on Android WebViews.
  - `MeriParchiScreen.tsx:310, 580`: Prescription share and PDF download buttons use dummy browser `alert()`.
  - `DigitalReceiptModal.tsx:140`: WhatsApp share displays `alert()` without opening WhatsApp deep link.

### Domain H: Finance, Billing & Invoicing (`apps/partner-platform`, `apps/company-platform`)
- **Verified Working Workflows:**
  - Inpatient discharge bill compilation, service charge line items, and GST calculations.
  - Split settlement transactions and financial ledger posting.
- **Identified Defects:**
  - `GrossToNetRevenueWaterfallView.tsx:230`: Form 26Q export executes `alert()` only.
  - `InvoiceDetailView.tsx:246, 265, 279`: Supervisor lock buttons permanently disabled without authorization modal.
  - `InstantUPISplitSettlementStudio.tsx:79`: Simulated payment confirms transaction after 2s without gateway webhook verification.

---

## 4. Primary Root Cause Categories

1. **Stray Static Prototype Residue (41%):** Features built during design review phases with temporary `alert()` or `handleSimulate...()` handlers that were never wired to backend controllers.
2. **Missing Action Event Listeners (28%):** Visual elements rendered using `<button>` or `<Button>` intended as action triggers but missing the `onClick` prop completely.
3. **Invalid JSX Tag Nesting (12%):** Placing `<button>` elements inside `<a>` anchor tags, causing browser event-bubbling anomalies.
4. **Hardcoded Mock Hardware Interfaces (19%):** Physical hospital workstation interfaces (digital scales, barcode scanners, lab analyzers) utilizing random number generators instead of the active `docsearch-hardware-agent.mjs` WebSocket on port 18080.

---

## 5. Next Steps & Cross-Report References

Detailed forensic evidence for every defective button is indexed in the dedicated audit sub-reports:
- Complete CSV registry: `DOCSEARCH_COMPLETE_BUTTON_INVENTORY.csv`
- Dead buttons inventory: `DOCSEARCH_NON_FUNCTIONAL_BUTTONS.md`
- Simulated logic inventory: `DOCSEARCH_PARTIAL_FUNCTIONALITY_REPORT.md`
- Remediation roadmap: `DOCSEARCH_BUTTON_REMEDIATION_PLAN.md`
