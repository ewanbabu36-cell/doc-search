# DOC SEARCH — MASTER GAP REGISTER & REMEDIATION BACKLOG
**Document ID:** `DOCSEARCH-GAP-001`  
**Audit Phase:** Phase 0 — Master Reality vs Original Goal Audit  
**Classification:** Prioritized Defect & Technical Debt Register  
**Date:** November 5, 2026  
**Status:** INDEPENDENTLY COMPILED & SIZED  

---

## 1. GAP TAXONOMY & PRIORITY DEFINITIONS

Gaps and unfulfilled requirements are categorized using standard enterprise healthcare risk criteria:

- **`P0 — Critical`**: Clinical safety, patient privacy (DPDP), tenant isolation leakage, financial fraud/loss, irrecoverable data loss, or blocked primary clinical workflows.
- **`P1 — Essential`**: Core operational workflows across Hospital ADT, OPD consultation, Pharmacy POS, LIMS, or Billing required for daily hospital functioning.
- **`P2 — Enterprise`**: Secondary administration, deep procurement automation, advanced analytics, cross-system interoperability, and third-party EDI connectors.
- **`P3 — Advanced Intelligence`**: AI clinical copilots, predictive bed allocation, drug repurposing algorithms, and robotic automation.

---

## 2. MASTER GAP INVENTORY

### 2.1 Critical Gaps (P0) — Status: ZERO OPEN IN CORE CODEBASE
> [!NOTE]
> All 9 historical Production Blockers (PB-01 through PB-09) were reconciled and resolved in Phases 3, 4, and 5. There are currently **zero open internal P0 blockers** in the application codebase or database layer.

---

### 2.2 Essential Gaps (P1) — Operational Prerequistes for General Availability

| Gap ID | Module & Component | Original Requirement | Current State | Business Impact | Technical Impact | Dependencies | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **GAP-P1-01** | `apps/api-gateway/src/routes/partner/abdm.routes.ts` | ABDM M1/M2/M3 National Health Bridge | Connected to NHA Sandbox with test mock responder | Cannot issue live Ayushman Bharat Health Accounts to real patients | Generates synthetic ABHA IDs and dummy QR codes | National Health Authority (NHA) live digital certificates | Live NHA API call successfully verifies patient Aadhaar OTP and binds official ABHA address. | **L** |
| **GAP-P1-02** | `apps/partner-platform/src/components/compliance/ComplianceDomainManager.tsx` | State Fire Department & AERB eLORA Webhook Sync | Manual inspection date entry + countdown banner | Hospital admins must manually check government portals for renewal notices | Lacks automated HTTP scraper/webhook listener | State Fire Safety portal API access | Auto-pulls approved Fire NOC PDF and renewal expiration from state portal. | **M** |
| **GAP-P1-03** | `apps/partner-platform/src/components/pharmacy/DistributorSyncModal.tsx` | Live B2B Medicine Distributor Inventory & EDI Orders | Static local CSV catalog fallback | Cashier cannot see real-time distributor warehouse stock for stockouts | Distributor sync endpoints return cached catalog | Commercial B2B EDI API contracts (Tata 1mg / Apollo) | Direct electronic purchase order dispatch and real-time distributor stock query via API. | **L** |
| **GAP-P1-04** | `apps/patient-app/src/components/PatientHealthRecordView.tsx` | Multi-Hospital Longitudinal EHR Merging | Local facility records displayed cleanly; cross-hospital merges pending M3 | Patient visiting multiple DocSearch facilities must manually link profiles | Lacks federated consent token exchange engine | National ABDM M3 Consent Manager | Valid ABDM consent artifact permits querying encounters across independent hospital tenants. | **XL** |
| **GAP-P1-05** | `scripts/docsearch-pacs-server.mjs` | Enterprise High-Volume PACS S3 Cloud Tiering | DICOM files stored on local server disk (`data/pacs_storage/`) | Multi-gigabyte CT/MRI studies will exhaust local VPS disk capacity | High local disk I/O; lacks multi-region cloud replication | AWS S3 bucket with Glacier lifecycle configuration | Background worker streams incoming DICOM C-STORE instances directly to S3 and caches locally. | **M** |

---

### 2.3 Enterprise Gaps (P2) — Secondary & Interoperability Workflows

| Gap ID | Module & Component | Original Requirement | Current State | Business Impact | Technical Impact | Dependencies | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **GAP-P2-01** | `apps/company-platform/src/components/PennyDropModal.tsx` | Automated Bank Account Penny-Drop Verification | Simulates NPCI IMPS ₹1 credit with test transaction ID | HQ admin must manually confirm partner bank passbook copy | Emulated webhook callback | RazorpayX / Cashfree Banking API credentials | Real ₹1 IMPS transfer successfully matches beneficiary account name against registered business name. | **M** |
| **GAP-P2-02** | `apps/partner-platform/src/components/insurance/TpaDeskDomainManager.tsx` | Real-time Cashless Insurance Claim Settlement (NHCX) | In-app tariff calculator + pre-authorization PDF generation | Insurance desk must manually upload claims to separate insurer web portals | Lacks direct National Health Claims Exchange (NHCX) API connector | NHCX National Claims Gateway authorization | Direct electronic claim submission with real-time pre-auth approval response code. | **XL** |
| **GAP-P2-03** | `apps/partner-platform/src/components/telemedicine/TelemedSessionRoom.tsx` | PSTN Cellular Fallback for Teleconsultation | WebRTC in-browser video/audio call functional | Rural patients with poor 4G connectivity drop off teleconsultations | Peer-to-peer WebRTC only; no PSTN audio bridge | Twilio / Exotel Voice SIP Trunk | Auto-dials patient mobile number over standard GSM network if WebRTC connection degrades below 50 kbps. | **L** |
| **GAP-P2-04** | `apps/sovra-pwa/src/services/offline-sync.service.ts` | Multi-User Concurrent Offline Write Resolution | Last-write-wins (LWW) conflict resolution in IndexedDB | Potential for overwriting nurse vitals entry if 2 nurses edit same bed offline | Relies on client timestamp timestamps rather than vector clocks | Conflict-Free Replicated Data Types (CRDT) library | Yjs or Automerge CRDT engine merges non-conflicting field updates without data loss. | **L** |

---

### 2.4 Advanced Intelligence Gaps (P3) — Clinical AI & Prediction

| Gap ID | Module & Component | Original Requirement | Current State | Business Impact | Technical Impact | Dependencies | Acceptance Criteria | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **GAP-P3-01** | `apps/partner-platform/src/components/ai/ClinicalCopilotDrawer.tsx` | Ambient Doctor-Patient Conversation Scribe & Rx Generator | Speech-to-text transcription active; SOAP note structuring pending LLM API | Doctor must manually type clinical notes and prescriptions | Client-side Web Speech API only | HIPAA/DISHA compliant Medical LLM endpoint (Gemini Health) | Audio recording of 5-minute doctor consultation auto-generates structured SOAP note with 95% accuracy. | **L** |
| **GAP-P3-02** | `apps/partner-platform/src/components/ipd/BedMatrixView.tsx` | Predictive Bed Occupancy & Discharge Forecasting | Displays real-time current occupancy only | Management cannot predict bed availability for scheduled elective surgeries | Lacks machine-learning regression on length of stay (ALOS) | Historical IPD admission data (min. 6 months) | Model predicts bed availability 48 hours in advance with mean absolute error < 4 hours. | **M** |
| **GAP-P3-03** | `apps/partner-platform/src/components/pharmacy/PharmacyDomainManager.tsx` | AI-Driven Demand Forecasting & Stockout Warning | Standard Min-Max reorder levels | Pharmacies occasionally over-order slow-moving expensive oncology drugs | Static safety stock thresholds | Historical sales transaction logs | Predicts seasonal drug demand surges (e.g. anti-malarials in monsoon) and optimizes order size. | **M** |

---

## 3. COMPLEXITY SIZING & WORK ESTIMATION

- **Small (S)**: 1-2 engineering days.
- **Medium (M)**: 3-5 engineering days.
- **Large (L)**: 1-2 engineering weeks.
- **Extra-Large (XL)**: 3-4 engineering weeks (external certification / protocol complexity).

```
+-----------------------------------------------------------------------------------+
|                           GAP EFFORT ESTIMATION SUMMARY                           |
+--------------------+------------+--------------------+----------------------------+
| Priority Level     | Gap Count  | Estimated Effort   | Primary Blockers           |
+--------------------+------------+--------------------+----------------------------+
| P0 (Critical)      | 0 gaps     | 0 days             | None (All Resolved)        |
| P1 (Essential)     | 5 gaps     | 7 engineering wks  | NHA Live Certs, S3 Storage |
| P2 (Enterprise)    | 4 gaps     | 6 engineering wks  | NHCX Gateway, Twilio SIP   |
| P3 (AI & Research) | 3 gaps     | 4 engineering wks  | Clinical LLM API, Datasets |
+--------------------+------------+--------------------+----------------------------+
| TOTAL BACKLOG      | 12 gaps    | 17 engineering wks | Zero Internal Blockers     |
+--------------------+------------+--------------------+----------------------------+
```
