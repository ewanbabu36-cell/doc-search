# DOC SEARCH — PRODUCTION BLOCKER REGISTER
## Authoritative Inventory of P0 & P1 Critical Interaction, Clinical & Financial Release Blockers

**Document ID:** `DOCSEARCH-BLOCKER-REGISTER-004`  
**Execution Mode:** RELEASE GATEWAY RISK GOVERNANCE & PRODUCTION READINESS AUDIT  
**Baseline Git Commit:** [`afa749a`](https://github.com/ewanbabu36-cell/doc-search/commit/afa749a)  
**Governance Standard:** Zero-Defect Healthcare Release Gate (NABH, HIPAA, CPCB & NMC Compliance)  
**Date:** November 2026  
**Auditor:** Principal Enterprise Software Architect & Senior Clinical Safety Officer  

---

## 1. Executive Summary & Production Block Declaration

> [!CAUTION]
> **GATEWAY VERDICT: PRODUCTION RELEASE STRICTLY BLOCKED**
> 
> Deploying the Doc Search application to live clinical staging or production environments is **UNCONDITIONALLY BLOCKED** until every blocker enumerated in this register is fully remediated, committed, and independently verified against PostgreSQL 18.4 transactions and real Fastify backend endpoints.
> 
> Releasing clinical software with an unhandled Emergency SOS button or in-memory panic lab values constitutes gross negligence and creates immediate clinical safety, statutory accreditation, and financial liability.

---

## 2. Production Blocker Summary Matrix

```
┌───────────┬──────────────┬──────────────────┬────────────────────────────────────────────┬────────────────────────┐
│ Blocker   │ Priority     │ Domain           │ Defective Component & Line                 │ Business Impact        │
├───────────┼──────────────┼──────────────────┼────────────────────────────────────────────┼────────────────────────┤
│ PB-01     │ P0 Critical  │ Emergency Triage │ `AirtelThanksConsumerExperienceView:52`    │ Acute Patient Death    │
│ PB-02     │ P0 Critical  │ Revenue / UPI    │ `ClinicalCards:750` (Sovra PWA)            │ 100% Mobile Pay Failure│
│ PB-03     │ P1 High      │ Statutory Reg    │ `ExecutiveCommandCenterOverviewView:201`   │ Facility License Revoke│
│ PB-04     │ P1 High      │ Clinical Lab     │ `ClinicalInvestigationDomainManager:903`   │ Delayed STAT Diagnosis │
│ PB-05     │ P1 High      │ Banking Ledger   │ `InstantUPISplitSettlementStudio:191`      │ Financial Discrepancies│
│ PB-06     │ P1 High      │ Environmental    │ `RecordBmwLogDialog:115`                   │ CPCB Regulatory Breach │
│ PB-07     │ P1 High      │ Patient Records  │ `MeriParchiScreen:310, 580`                │ PHR Delivery Failure   │
│ PB-08     │ P1 High      │ Cashier POS      │ `DynamicUpiInvoiceView:105, 113`           │ Counter Reconciliation │
│ PB-09     │ P1 High      │ Pharmacy POS     │ `PharmacyInventoryView:239`                │ Generic Dispense Error │
└───────────┴──────────────┴──────────────────┴────────────────────────────────────────────┴────────────────────────┘
```

---

## 3. Detailed Forensic Blocker Dossiers

### 3.1. Blocker PB-01: Inoperative Emergency SOS Control
- **Severity:** **P0 CRITICAL (LIFE SAFETY BLOCKER)**
- **Component File:** `apps/partner-platform/src/components/views/AirtelThanksConsumerExperienceView.tsx` (Line 52)
- **Defective Code:**
  ```tsx
  <div className="flex items-center space-x-2">
    <Badge variant="success">Pass Active</Badge>
    <button className="h-7 w-7 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shadow-lg hover:bg-red-500">
      SOS
    </button>
  </div>
  ```
- **Hazard Analysis:** When clicked by a patient or relative during acute cardiac arrest, trauma, or respiratory distress, no action is taken.
- **Mandated Remediation:**
  - Wire `onClick` to `POST /api/v1/emergency/code-blue`.
  - Transmit patient identity, GPS coordinates/room number, and trigger hospital-wide WebSocket Code Blue alert.

---

### 3.2. Blocker PB-02: Dropped UPI Payment Intent via Invalid DOM Nesting
- **Severity:** **P0 CRITICAL (COMMERCIAL PAYMENT BLOCKER)**
- **Component File:** `apps/sovra-pwa/src/components/ClinicalCards.tsx` (Line 750)
- **Defective Code:**
  ```tsx
  <a href={upiDeepLink} className="w-full block">
    <Button variant="primary" className="w-full flex items-center justify-center">
      ⚡ Pay ₹{amount} via UPI
    </Button>
  </a>
  ```
- **Hazard Analysis:** Invalid HTML5 DOM nesting (`<button>` inside `<a>`). On modern mobile Android and iOS browsers, touch events are swallowed by the inner button and fail to bubble to the anchor tag, preventing deep-link launch into PhonePe, Google Pay, or Paytm.
- **Mandated Remediation:**
  - Eliminate outer `<a>` wrapper.
  - Implement programmatic navigation: `onClick={() => window.location.href = upiDeepLink}` with minimum 48px touch height.

---

### 3.3. Blocker PB-03: Statutory Facility Compliance Renewal Drop
- **Severity:** **P1 HIGH (INSTITUTIONAL LICENSING BLOCKER)**
- **Component File:** `apps/partner-platform/src/components/views/ExecutiveCommandCenterOverviewView.tsx` (Lines 201, 217, 233)
- **Defective Code:**
  ```tsx
  <button type="button" className="text-blue-700 font-bold hover:underline">1-Click Renewal</button>
  <button type="button" className="text-blue-700 font-bold hover:underline">Upload QA Report</button>
  <button type="button" className="text-blue-700 font-bold hover:underline">Submit Manifest</button>
  ```
- **Hazard Analysis:** Action buttons for critical facility licenses (State Fire Service NOC, AERB radiation QA certificate, and SPCB bio-medical waste return) contain no `onClick` handlers. Hospital administrators believe renewals are underway when zero background task or filing workflow is initiated.
- **Mandated Remediation:**
  - Wire each button to `navigate('/compliance/renew?type=...')` and open respective filing dialogs.

---

### 3.4. Blocker PB-04: In-Memory Clinical Panic Value Simulation
- **Severity:** **P1 HIGH (DIAGNOSTIC SAFETY BLOCKER)**
- **Component File:** `apps/partner-platform/src/components/ClinicalInvestigationDomainManager.tsx` (Lines 903, 1123)
- **Defective Code:**
  ```typescript
  const handleSimulatePanicAlert = (type: 'platelets' | 'potassium' = 'platelets') => {
    const testOrder: InvestigationOrderDto = { ... };
    setPanicAlerts(prev => [alertData, ...prev]);
  };
  ```
- **Hazard Analysis:** When lab technicians report panic diagnostic results (e.g., serum potassium > 6.5 mEq/L or platelets < 20,000 /µL), the UI updates local component state only. Zero records are inserted into `clinical_alerts` and the treating ICU doctor receives no alert.
- **Mandated Remediation:**
  - Connect to `POST /api/v1/partner/lab/orders/:id/panic-intimation` and `POST /api/v1/partner/ai-copilot/panic-values`.

---

### 3.5. Blocker PB-05: Unpersisted Instant UPI Split Settlement
- **Severity:** **P1 HIGH (FINANCIAL RECONCILIATION BLOCKER)**
- **Component File:** `apps/partner-platform/src/components/views/InstantUPISplitSettlementStudio.tsx` (Line 191)
- **Defective Code:**
  ```typescript
  const handleSimulatePayment = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newTxn = { id: 'TXN-UPI-' + Date.now(), doctorUtr: 'NPCI-2026-' + Math.random(), ... };
      setSettledHistory([newTxn, ...settledHistory]);
    }, 700);
  };
  ```
- **Hazard Analysis:** The accountant sees a green checkmark and fake NPCI UTR number, but no database records are created in PostgreSQL 18.4. On page refresh, the entire settlement vanishes from memory.
- **Mandated Remediation:**
  - Dispatch real multi-party split to `POST /api/v1/partner/billing/tpa/split-copay-invoice` within an atomic PostgreSQL transaction.

---

### 3.6. Blocker PB-06: Bio-Medical Waste Random Scale Telemetry
- **Severity:** **P1 HIGH (ENVIRONMENTAL POLLUTION BLOCKER)**
- **Component File:** `apps/partner-platform/src/components/dialogs/RecordBmwLogDialog.tsx` (Line 115)
- **Defective Code:**
  ```typescript
  const handleSimulateDigitalScale = () => {
    setIsScaleSyncing(true);
    setTimeout(() => {
      setYellowBagWeightKg(145.5);
      setRedBagWeightKg(188.2);
    }, 600);
  };
  ```
- **Hazard Analysis:** Generates hardcoded synthetic weights via timer instead of querying the authenticated local hardware agent. Violates Central Pollution Control Board (CPCB) statutory tracking rules.
- **Mandated Remediation:**
  - Query local hardware agent `GET http://localhost:18080/api/v1/scale/read` to retrieve certified RS-232 telemetry.

---

### 3.7. Blocker PB-07: Prescription WhatsApp & PDF Dummy Alerts
- **Severity:** **P1 HIGH (PATIENT PORTAL & ABDM BLOCKER)**
- **Component Files:** `apps/patient-app/src/components/MeriParchiScreen.tsx:310, 580` & `DigitalReceiptModal.tsx:137`
- **Defective Code:**
  ```tsx
  <button onClick={() => alert('Prescription link copied for WhatsApp!')}>
  <button onClick={() => alert(`Downloading NABL Verified PDF for ${lab.testName}`)}>
  ```
- **Hazard Analysis:** Mobile patients cannot download official medical records or receive WhatsApp parchi links; buttons only show annoying browser alert dialogs.
- **Mandated Remediation:**
  - Wire to `POST /api/v1/communication/whatsapp/send-parchi` and `GET /api/v1/partner/clinical/prescriptions/:id/pdf`.

---

### 3.8. Blocker PB-08: Dynamic UPI Counter Invoice Simulation
- **Severity:** **P1 HIGH (CASHIER BILLING CLEARING BLOCKER)**
- **Component File:** `apps/partner-platform/src/components/views/DynamicUpiInvoiceView.tsx` (Lines 105, 113)
- **Defective Code:**
  ```typescript
  const handleSimulatePayment = () => {
    const simUtr = `UTR-RAZORPAY-${Math.floor(10000000 + Math.random() * 90000000)}`;
    handleConfirmPayment(simUtr);
  };
  ```
- **Hazard Analysis:** Generates fictitious payment confirmation without banking webhook verification, leading to uncollected hospital bills.
- **Mandated Remediation:**
  - Enforce real gateway verification via `POST /api/v1/partner/billing/invoices/:id/payments`.

---

### 3.9. Blocker PB-09: Pharmacy PMBJP Generic Drug Swap UI-Only Toast
- **Severity:** **P1 HIGH (PHARMACY POS BLOCKER)**
- **Component File:** `apps/partner-platform/src/components/views/PharmacyInventoryView.tsx` (Line 239)
- **Defective Code:**
  ```tsx
  <button onClick={() => showToast(`Generic ${item.genericName} swapped into active POS draft`)}>
  ```
- **Hazard Analysis:** Clicking the generic swap button displays a green toast, but does not add or substitute the generic drug in the active POS dispensing cart.
- **Mandated Remediation:**
  - Dispatch drug substitution into the active pharmacy POS store via `POST /api/v1/partner/pharmacy-pos/fefo/validate-batch`.

---

## 4. Release Gateway Conditions of Satisfaction

Production deployment will be unlocked **if and only if**:
1. All 9 Production Blockers (PB-01 to PB-09) are remediated using real backend Fastify routes and verified PostgreSQL ACID persistence.
2. The certified 10-suite regression harness (`scripts/run-full-regression-certified.mjs`) continues to pass 100% (196/196).
3. The Disaster Recovery test (`packages/database/test/dr-backup-restore.test.mjs`) passes 100% (4/4).
4. All 11 TypeScript project configs continue to compile with zero errors (`tsc --noEmit`).
