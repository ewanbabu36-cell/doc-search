# DOC SEARCH — ULTIMATE UI FUNCTIONALITY & BUTTON FORENSIC AUDIT
## PARTIAL FUNCTIONALITY & SIMULATED MOCK CONTROL REPORT
**Document:** `DOCSEARCH_PARTIAL_FUNCTIONALITY_REPORT.md`  
**Scope:** Forensic Audit of Controls with Incomplete Business Logic, Simulated APIs, or Fake Feedback  
**Execution Mode:** EVIDENCE-BASED FORENSIC AUDIT  
**Baseline Commit:** `52ab97b87834ee8b1912a76f238ad82eb5c20f16`  
**Date:** November 5, 2026  

---

## 1. Executive Summary: The Simulation Dilemma

While **Category 1** buttons have zero event listeners, **Category 2 (Partially Functional Controls)** represent a more subtle hazard: **they appear fully functional to users and QA testers**, but their execution logic terminates prematurely in:
1. `handleSimulate...()` handlers that only mutate in-memory React state.
2. `alert()` or `toast()` popups claiming an action occurred (e.g. "Prescription shared to WhatsApp", "NABL PDF Downloaded") without executing the action.
3. Fake asynchronous timers (`setTimeout(..., 2000)`) that mark bills as "PAID" without verifying actual banking transactions.
4. Random number generators simulating physical medical IoT hardware (digital weight scales, pulse oximeters, DICOM scanners).

A total of **42 controls** across the monorepo exhibit this behavior.

---

## 2. In-Depth Categorical Breakdown

### Group A: Laboratory Diagnostics & Critical Panic Alerts (4 Controls)

1. **Simulate Platelet Panic Alert**
   - **Button ID:** `BTN-00561`
   - **File:** `apps/partner-platform/src/components/ClinicalInvestigationDomainManager.tsx:903`
   - **Code:** `onClick={() => handleSimulatePanicAlert('platelets')}`
   - **Trace:** Sets `investigation.criticalPanicValue = true` in local state. Zero HTTP request sent to `/api/v1/emergency/code-blue` or SMS gateway. Attending physician receives no real alert.
   - **Classification:** `PARTIALLY_FUNCTIONAL` (Simulated logic).

2. **Simulate Potassium Panic Alert**
   - **Button ID:** `BTN-00588`
   - **File:** `apps/partner-platform/src/components/ClinicalInvestigationDomainManager.tsx:1123`
   - **Code:** `onClick={() => handleSimulatePanicAlert('potassium')}`
   - **Trace:** Local state toggle only.

3. **LIMS Analyzer Simulated Panic Value**
   - **Button ID:** `BTN-02314`
   - **File:** `apps/company-platform/src/components/executive/LimsHl7AstmIotDeviceHubView.tsx:39`
   - **Code:** `handleSimulatePanicValue = () => { ... }`
   - **Trace:** Simulates ASTM/HL7 analyzer packet without connecting to the local hardware agent daemon (`localhost:18080`).

4. **Biomedical Waste Digital Scale Simulation**
   - **Button ID:** `BTN-00722`
   - **File:** `apps/partner-platform/src/components/dialogs/RecordBmwLogDialog.tsx:36`
   - **Code:** `const handleSimulateDigitalScale = () => setWeightKg((1.2 + Math.random() * 3).toFixed(2));`
   - **Trace:** Uses `Math.random()` rather than reading the RS232 USB weight scale.

---

### Group B: Financial Settlements & Fake Payment Confirmations (6 Controls)

5. **Instant UPI Split Settlement Simulator**
   - **Button ID:** `BTN-01412`
   - **File:** `apps/partner-platform/src/components/views/InstantUPISplitSettlementStudio.tsx:79`
   - **Code:**
     ```typescript
     const handleSimulatePayment = () => {
       setIsProcessing(true);
       setTimeout(() => {
         setIsProcessing(false);
         setSettlementStatus('PAID');
       }, 2000);
     };
     ```
   - **Trace:** Unconditionally marks the settlement as `PAID` after 2000ms. Zero webhook verification with NPCI/Razorpay. No financial ledger entry created in PostgreSQL `financial_ledger`.
   - **Financial Impact:** **CRITICAL**. Creates ledger reconciliation discrepancies if used by cashier.

6. **Dynamic UPI Invoice Fake Settlement**
   - **Button ID:** `BTN-01305`
   - **File:** `apps/partner-platform/src/components/views/DynamicUpiInvoiceView.tsx:110`
   - **Trace:** Simulated payment timer without backend persistence.

7. **Sovra PWA Patient Bedside UPI Settlement**
   - **Button ID:** `BTN-04589`
   - **File:** `apps/sovra-pwa/src/components/ClinicalCards.tsx:653`
   - **Trace:** Sets local card state to "Paid" without verifying bank settlement.

8. **Multi-Gateway Payment Switch Simulation**
   - **Button ID:** `BTN-02204`
   - **File:** `apps/company-platform/src/components/billing/MultiGatewaySmartRouterView.tsx:68`
   - **Trace:** Simulated gateway latency test.

9. **AI Insurance Denial Copay Payment Simulation**
   - **Button ID:** `BTN-01280`
   - **File:** `apps/partner-platform/src/components/views/AiInsuranceDenialPredictorView.tsx:179`
   - **Trace:** Dummy copay confirmation.

10. **TPA Ayushman Bharat Cashless Pass WhatsApp Alert**
    - **Button ID:** `BTN-00755`
    - **File:** `apps/partner-platform/src/components/dialogs/TpaAyushmanCashlessDeskModal.tsx:554`
    - **Code:** `onClick={() => alert(`Pre-Auth status and cashless pass sent via WhatsApp to patient ${patientName}!`)}`
    - **Trace:** Browser alert only. Does not dispatch WhatsApp message via `/api/v1/partner/whatsapp/send`.

---

### Group C: ABDM M1-M3 Health Exchange & QR Code Simulators (5 Controls)

11. **ABDM Inbound Scan & Share Simulation**
    - **Button ID:** `BTN-00684`
    - **File:** `apps/partner-platform/src/components/common/AbdmScanAndShareModal.tsx:70`
    - **Code:** `handleSimulateInboundScan = () => { ... }`
    - **Trace:** Injects hardcoded ABHA profile `ABHA-9912-3841` instead of processing video feed from camera scanner.

12. **ABDM Milestone Sandbox Simulator**
    - **Button ID:** `BTN-01211`
    - **File:** `apps/partner-platform/src/components/views/AbdmMilestoneSandboxSimulatorView.tsx:48`
    - **Trace:** Simulates ABDM M1/M2 response without hitting the sandbox gateway.

13. **FrontDesk Mobile Workstation Scan-and-Share Simulator**
    - **Button ID:** `BTN-01362`
    - **File:** `apps/partner-platform/src/components/views/FrontDeskMobileWorkstationView.tsx:599`
    - **Trace:** Simulated token generation.

14. **Scan & Share Counter Profile Switcher**
    - **Button ID:** `BTN-01490`
    - **File:** `apps/partner-platform/src/components/views/ScanAndShareCounterView.tsx:54`
    - **Trace:** Switches mock profiles from static array.

15. **ABDM Encrypted Push Simulator**
    - **Button ID:** `BTN-01188`
    - **File:** `apps/partner-platform/src/components/views/AbdmConsentManagerView.tsx:27`
    - **Trace:** Simulates encrypted FHIR transfer without cryptographic DH key exchange.

---

### Group D: Patient App Actions with Dummy Alerts (7 Controls)

16. **Meri Parchi WhatsApp Prescription Share**
    - **Button ID:** `BTN-04102`
    - **File:** `apps/patient-app/src/components/MeriParchiScreen.tsx:310`
    - **Code:** `onClick={() => alert('Prescription link copied for WhatsApp!')}`
    - **Trace:** Only displays `alert()`. Does not copy to clipboard or launch `https://wa.me/`.

17. **Meri Parchi NABL Verified PDF Download**
    - **Button ID:** `BTN-04145`
    - **File:** `apps/patient-app/src/components/MeriParchiScreen.tsx:580`
    - **Code:** `onClick={() => alert(`Downloading NABL Verified PDF for ${lab.testName}`)}`
    - **Trace:** Only displays `alert()`. Does not initiate browser PDF download stream.

18. **Digital Receipt WhatsApp Share**
    - **Button ID:** `BTN-04018`
    - **File:** `apps/patient-app/src/components/DigitalReceiptModal.tsx:140`
    - **Code:** `onClick={() => alert(`Receipt #${'RCP-3817'} shared to WhatsApp`)}`
    - **Trace:** Browser alert only.

19. **Doctor Consultation Call Simulator**
    - **Button ID:** `BTN-04180`
    - **File:** `apps/patient-app/src/components/MyTokenQueueScreen.tsx:40`
    - **Trace:** Plays Web Audio tone; does not initiate WebRTC telemedicine session.

20. **Paperless Pre-Arrival OCR Intake Simulator**
    - **Button ID:** `BTN-04221`
    - **File:** `apps/patient-app/src/components/PaperlessPreArrivalIntakeModal.tsx:86`
    - **Trace:** Populates static patient name without running Tesseract/Vision OCR.

21. **Official ABDM ABHA Card Download**
    - **Button ID:** `BTN-04355`
    - **File:** `apps/patient-app/src/components/Tata1mgQuickOrderModal.tsx:846`
    - **Code:** `onClick={() => alert('Official ABDM ABHA Card downloaded to storage.')}`
    - **Trace:** Browser alert only.

22. **Tata 1mg Consent Permissions Update**
    - **Button ID:** `BTN-04362`
    - **File:** `apps/patient-app/src/components/Tata1mgQuickOrderModal.tsx:863`
    - **Trace:** Local toast prompt only.

---

### Group E: Hardware & Operational Simulators (10 Controls)

23. **Smart Waiting Room Vitals Capture Simulator**
    - **Button ID:** `BTN-01530`
    - **File:** `apps/partner-platform/src/components/views/SmartWaitingRoomVitalsGateway.tsx:52`
    - **Trace:** Injects static SpO2 (98%) and BP (120/80) without reading Bluetooth GATT vitals.

24. **DICOM Modality Worklist Acquisition Simulator**
    - **Button ID:** `BTN-01255`
    - **File:** `apps/partner-platform/src/components/views/DicomModalityWorklistBrokerView.tsx:210`
    - **Trace:** Injects static DICOM header without contacting `scripts/docsearch-pacs-server.mjs`.

25. **Blood Bank Cold Chain Breach Simulator**
    - **Button ID:** `BTN-01240`
    - **File:** `apps/partner-platform/src/components/views/BloodBankColdChainSentinelView.tsx:25`
    - **Trace:** Simulated temperature alarm.

26. **Smart ICU Deterioration Radar Simulator**
    - **Button ID:** `BTN-01502`
    - **File:** `apps/partner-platform/src/components/views/SmartIcuDeteriorationRadarView.tsx:69`
    - **Trace:** Local vitals graph animation only.

27. **Smart Pharmacy FEFO Expiry Breach Simulator**
    - **Button ID:** `BTN-01518`
    - **File:** `apps/partner-platform/src/components/views/SmartPharmacyPosWorkstationView.tsx:54`
    - **Trace:** Local UI warning animation.

28. **Doctor QR Standee PNG Download (Sovra PWA)**
    - **Button ID:** `BTN-04660`
    - **File:** `apps/sovra-pwa/src/components/DoctorQrStandeeModal.tsx:241`
    - **Code:** `onClick={() => alert(`Standee saved: ${doctorName.replace(/[\s\.]/g, '_')}_OPD_Standee.png`)}`
    - **Trace:** Displays alert instead of rendering HTML5 Canvas to PNG download.

29. **Radiology PACS Report Download (Sovra PWA)**
    - **Button ID:** `BTN-04720`
    - **File:** `apps/sovra-pwa/src/components/PacsDicomViewerModal.tsx:413`
    - **Trace:** Browser alert only.

30. **Opd Live Token Next Step Simulator (Sovra PWA)**
    - **Button ID:** `BTN-04690`
    - **File:** `apps/sovra-pwa/src/components/OpdTokenLiveCard.tsx:79`
    - **Trace:** Increments local token state without publishing to WebSocket topic.

31. **Interactive Clinic Sandbox Audio PBX Alert**
    - **Button ID:** `BTN-05180`
    - **File:** `apps/landing-page/src/components/InteractiveClinicSandbox.tsx:1207`
    - **Trace:** Displays alert instead of dispatching automated Twilio/PBX phone call.

32. **Live OPD Queue Step Tracker**
    - **Button ID:** `BTN-05240`
    - **File:** `apps/landing-page/src/components/LiveOpdQueueTrackerView.tsx:86`
    - **Trace:** Simulated visual queue stepper.

---

### Group F: Executive, Legal & Statutory Dispatches (10 Controls)

33. **Export Form 26Q (NSDL e-Gov Portal)**
    - **Button ID:** `BTN-02110`
    - **File:** `apps/company-platform/src/components/billing/GrossToNetRevenueWaterfallView.tsx:233`
    - **Code:** `onClick={() => alert('📄 Form 26Q Electronic Text File Exported for NSDL e-Gov Portal')}`
    - **Trace:** Shows alert; no text file is generated or saved.

34. **GodMode SuperAdmin Biometric Revocation & Cyber Police Docket**
    - **Button ID:** `BTN-02540`
    - **File:** `apps/company-platform/src/components/executive/GodModeSuperAdminStudioView.tsx:2799`
    - **Code:** `onClick={() => alert(`Staff ${decodedEvidence.decodedActorName} suspended. Forensic evidence file generated for Cyber Police.`)}`
    - **Trace:** Browser alert only; does not revoke session tokens in Redis or generate forensic audit PDF.

35. **Live Hospital Surge Protocol Standby Trigger**
    - **Button ID:** `BTN-02580`
    - **File:** `apps/company-platform/src/components/executive/LiveGeographicHospitalBedHeatmapView.tsx:589`
    - **Trace:** Displays alert instead of dispatching surge notification to hospital network.

36. **Multi-Facility Bed Transfer Discharge Simulator**
    - **Button ID:** `BTN-02595`
    - **File:** `apps/company-platform/src/components/executive/MultiFacilityBedTransferDeskView.tsx:164`
    - **Trace:** Modifies local array without updating PostgreSQL `clinical.bed_assignments`.

37. **Field Sales Visit GPS Check-In Simulator**
    - **Button ID:** `BTN-02750`
    - **File:** `apps/company-platform/src/components/sales/FieldSalesVisitTrackerView.tsx:28`
    - **Trace:** Generates synthetic latitude/longitude without accessing browser Geolocation API.

38. **RCM Anti-Leakage Encounter Simulator**
    - **Button ID:** `BTN-01440`
    - **File:** `apps/partner-platform/src/components/views/RcmAntiLeakageDeskView.tsx:341`
    - **Trace:** Local encounter generator.

39. **OT Safety Discrepancy Simulator**
    - **Button ID:** `BTN-01420`
    - **File:** `apps/partner-platform/src/components/views/OtSurgicalSafetySentinelView.tsx:64`
    - **Trace:** Simulated sponge count discrepancy.

40. **B2B Wholesale Distributor Add Simulator**
    - **Button ID:** `BTN-00710`
    - **File:** `apps/partner-platform/src/components/dialogs/B2BWholesaleInvoiceSyncModal.tsx:117`
    - **Trace:** Mock distributor addition.

41. **Bedside Smart Concierge Escalation Simulator**
    - **Button ID:** `BTN-01230`
    - **File:** `apps/partner-platform/src/components/views/BedsideSmartConciergeView.tsx:61`
    - **Trace:** Simulated nurse call escalation.

42. **Offline Mesh Rogue Node Attack Simulator**
    - **Button ID:** `BTN-01405`
    - **File:** `apps/partner-platform/src/components/views/OfflineMeshDisasterSyncView.tsx:237`
    - **Trace:** Canvas animation only.

---

## 3. Remediation Strategy for Partial Controls

| Group | Defect Pattern | Remediation Strategy |
| :--- | :--- | :--- |
| **A (Diagnostics)** | Local panic alert state | Connect to `/api/v1/emergency/code-blue` with Webhook audio chime |
| **B (Payments)** | 2s timer setting `PAID` | Require authentic UPI transaction ID and verify against PostgreSQL `financial_ledger` |
| **C (ABDM)** | Static profile injection | Use HTML5 `getUserMedia` camera feed with jsQR / zxing barcode decoder |
| **D (Patient App)** | `alert()` for WhatsApp/PDF | Implement standard `window.open('https://wa.me/?text='...)` and browser PDF blob download |
| **E (Hardware)** | `Math.random()` simulation | Connect WebSocket client to `localhost:18080` (Hardware Agent) |
| **F (Legal/HQ)** | Alert dialogs for Form 26Q | Generate genuine NSDL formatted text file and trigger browser file save |

---
**Verdict:** All 42 simulated / partially functional controls forensically traced and documented with exact line numbers and remediation paths.
