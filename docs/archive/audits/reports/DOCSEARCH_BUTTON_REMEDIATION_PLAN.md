# DOC SEARCH — UI BUTTON & INTERACTION REMEDIATION PLAN
## Structured Engineering Roadmap: Zero Dead Buttons | 100% Business Logic Completion

**Document ID:** `DOCSEARCH-PLAN-REMEDIATION-010`  
**Execution Mode:** ENGINEERING REMEDIATION SPECIFICATION & IMPLEMENTATION ROADMAP  
**Baseline Commit:** `52ab97b87834ee8b1912a76f238ad82eb5c20f16`  
**Target Architecture:** Zero-Tolerance for Unhandled Controls, Fully Wired Endpoints, Durable DB Persistence  
**Date:** November 2026  
**Author:** Principal Software Architect & Lead Full-Stack Engineer  

---

## 1. Executive Summary

The comprehensive forensic audit revealed **5,270** total interactive controls across the Doc Search monorepo. While 5,212 controls (98.90%) operate with complete end-to-end functionality, **58 controls** (1.10%) fail production criteria:
- **16 Controls:** Completely dead with no `onClick` listener or unhandled navigation.
- **42 Controls:** Partially functional, relying on simulated delays (`setTimeout`), fake mock data (`Math.random()`), or browser `alert()` placeholders instead of real backend APIs.
- **2 Controls:** Invalid DOM nesting (`<button>` inside `<a>`) causing browser event drop on mobile touchscreens.

This remediation plan establishes a three-phase engineering roadmap to eliminate 100% of these defects prior to production rollout.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                   REMEDIATION PHASING                                     │
├───────────────────────────────┬───────────────────────────────┬───────────────────────────┤
│ PHASE 1: IMMEDIATE (P0)       │ PHASE 2: SHORT-TERM (P1)      │ PHASE 3: MEDIUM-TERM (P2) │
│ 16 Dead + 2 Nested Buttons    │ 42 Simulated / Dummy Buttons  │ 288 Touch Targets & A11y  │
│ Patient Safety & Blockers     │ DB Persistence & Integrations │ Mobile UX & Compliance    │
│ Target: Sprint 1 (Week 1)     │ Target: Sprint 2 (Week 2)     │ Target: Sprint 3 (Week 3) │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────┘
```

---

## 2. Phase 1: P0 Critical Emergency, Statutory & Broken Controls

### 2.1. Defect Fix: Emergency SOS Button
- **File:** `apps/partner-platform/src/components/AirtelThanksConsumerExperienceView.tsx:52`
- **Issue:** Red SOS button has no `onClick` listener.
- **Remediation Code:**
  ```tsx
  // AirtelThanksConsumerExperienceView.tsx
  const handleTriggerSOS = async () => {
    try {
      setIsTriggering(true);
      await apiClient.post('/api/v1/emergency/sos', {
        hospitalId: currentHospitalId,
        source: 'AIRTEL_THANKS_CONSUMER_VIEW',
        timestamp: new Date().toISOString()
      });
      toast.success('Emergency SOS dispatched to triage & ambulance units.');
    } catch (err) {
      toast.error('Emergency dispatch failed. Calling hospital helpline directly...');
      window.location.href = 'tel:108';
    } finally {
      setIsTriggering(false);
    }
  };

  // Replace line 52:
  <button 
    onClick={handleTriggerSOS} 
    disabled={isTriggering}
    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-2"
  >
    <span>🚨 SOS Emergency Assistance</span>
  </button>
  ```

---

### 2.2. Defect Fix: Statutory Compliance Renewals
- **File:** `apps/partner-platform/src/components/ExecutiveCommandCenterOverviewView.tsx:199, 215, 231`
- **Issue:** Renewal buttons lack event handlers.
- **Remediation Code:**
  ```tsx
  // ExecutiveCommandCenterOverviewView.tsx
  const handleInitiateRenewal = (type: 'FIRE_NOC' | 'AERB' | 'SPCB') => {
    navigate(`/compliance/renew?type=${type}`);
  };

  // Replace lines 199, 215, 231:
  <button 
    onClick={() => handleInitiateRenewal('FIRE_NOC')} 
    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
  >
    Renew Fire NOC
  </button>
  ```

---

### 2.3. Defect Fix: DOM Nesting in Sovra PWA UPI Payment
- **File:** `apps/sovra-pwa/src/components/ClinicalCards.tsx:750`
- **Issue:** `<Button>` nested inside `<a>` tag causes mobile Android/iOS webview to drop deep link navigation.
- **Remediation Code:**
  ```tsx
  // Remove <a> wrapper entirely. Replace line 750 with:
  <Button 
    variant="primary" 
    className="w-full flex items-center justify-center min-h-[48px]"
    onClick={() => {
      window.location.href = upiDeepLink;
    }}
  >
    ⚡ Pay ₹{amount} via UPI
  </Button>
  ```

---

### 2.4. Defect Fix: White Label Studio Live Preview
- **File:** `apps/partner-platform/src/components/HospitalWhiteLabelStudioView.tsx:206`
- **Issue:** `<Button>` nested inside `<a>`.
- **Remediation Code:**
  ```tsx
  // Replace line 206 with:
  <Button 
    size="sm" 
    variant="outline"
    onClick={() => window.open('/preview/portal', '_blank', 'noopener,noreferrer')}
  >
    Launch Live Portal Preview
  </Button>
  ```

---

### 2.5. Defect Fix: Action Required Alert Button
- **File:** `apps/partner-platform/src/components/AlertsSection.tsx:48`
- **Issue:** Dynamic button `{alert.actionRequired}` has no `onClick` binding.
- **Remediation Code:**
  ```tsx
  // Add handler dispatching alert-specific remediation action:
  <button 
    onClick={() => handleAlertAction(alert)}
    className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-600 text-white"
  >
    {alert.actionRequired}
  </button>
  ```

---

## 3. Phase 2: P1 Simulated & Unpersisted Logic Remediation

### 3.1. Remediation: Instant UPI Settlement Persistence
- **File:** `apps/partner-platform/src/components/InstantUPISplitSettlementStudio.tsx:75`
- **Issue:** Replaces real banking split with 1500ms `setTimeout` and fake UTR.
- **Remediation Code:**
  ```typescript
  const handleInitiateRealSplitSettlement = async (batchId: string) => {
    setIsProcessing(true);
    try {
      const response = await apiClient.post('/api/v1/finance/settlements/instant-split', {
        batchId,
        settlementType: 'INSTANT_UPI_SPLIT'
      });
      setSettlementStatus('SETTLED');
      setSplitResult(response.data);
      toast.success('Instant UPI Split settlement executed and committed to PostgreSQL ledger.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Settlement failed at banking gateway.');
    } finally {
      setIsProcessing(false);
    }
  };
  ```

---

### 3.2. Remediation: Bio-Medical Waste Digital Scale Telemetry
- **File:** `apps/partner-platform/src/components/RecordBmwLogDialog.tsx:36`
- **Issue:** Generates random waste weight `Math.random()`.
- **Remediation Code:**
  ```typescript
  const handleReadScale = async () => {
    setIsReading(true);
    try {
      // Stream telemetry from local DocSearch hardware daemon listening on 18080
      const response = await fetch('http://localhost:18080/api/v1/scale/read');
      const data = await response.json();
      if (data.weight) {
        setWeight(data.weight.toFixed(2));
        setScaleSerial(data.deviceSerial);
        toast.success(`Weight read from ${data.deviceModel}: ${data.weight} kg`);
      }
    } catch (err) {
      toast.error('Could not connect to RS-232 digital scale on port 18080. Enter weight manually.');
    } finally {
      setIsReading(false);
    }
  };
  ```

---

### 3.3. Remediation: Clinical Laboratory Panic Value Escalation
- **File:** `apps/partner-platform/src/components/ClinicalInvestigationDomainManager.tsx:263`
- **Issue:** Local state simulation only; zero physician alert or DB persistence.
- **Remediation Code:**
  ```typescript
  const handleDispatchPanicAlert = async (testId: string, parameter: string, value: string) => {
    try {
      await apiClient.post(`/api/v1/laboratory/tests/${testId}/panic-alert`, {
        parameter,
        criticalValue: value,
        reportedBy: currentUser.id,
        timestamp: new Date().toISOString()
      });
      toast.error(`STAT: Panic alert sent to treating physician for ${parameter}: ${value}`);
      refreshOrder();
    } catch (err) {
      toast.error('Failed to dispatch panic alert to emergency gateway.');
    }
  };
  ```

---

### 3.4. Remediation: WhatsApp Share & PDF Downloads
- **Files:** `apps/partner-platform/src/components/MeriParchiScreen.tsx:310, 580` & `DigitalReceiptModal.tsx:140`
- **Issue:** Dummy `alert('WhatsApp sent')` and `alert('PDF downloaded')`.
- **Remediation Code:**
  ```typescript
  const handleShareWhatsApp = async (receiptId: string, phoneNumber: string) => {
    try {
      await apiClient.post('/api/v1/notifications/whatsapp/receipt', {
        receiptId,
        recipient: phoneNumber
      });
      toast.success('Digital receipt sent via WhatsApp successfully.');
    } catch (err) {
      toast.error('Failed to send WhatsApp notification.');
    }
  };

  const handleDownloadPDF = async (receiptId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/billing/receipts/${receiptId}/pdf`, {
        responseType: 'blob'
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `receipt-${receiptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to generate PDF document.');
    }
  };
  ```

---

## 4. Phase 3: P2 Touch Target Scaling & Accessibility Hardening

1. **Touch Target Expansion (288 Buttons):**
   - In data tables across `BillingDashboardView.tsx`, `PharmacyInventoryTable.tsx`, and `TenantDirectoryTable.tsx`, wrap compact icons in an accessible popover dropdown menu with 48px touch targets for mobile and tablet devices.
2. **Keyboard Traps & ARIA Labels (64 Buttons):**
   - For all custom `div` or `span` elements using `onClick`, inject `role="button"`, `tabIndex={0}`, and `onKeyDown={(e) => e.key === 'Enter' && handleClick()}`.
3. **Modal Dialog Virtual Keyboard Support:**
   - In `AddPatientModal.tsx` and `PrescriptionWriterDialog.tsx`, set `max-h-[85dvh]` with `sticky bottom-0` footer controls.

---

## 5. Engineering Timeline & Verification Gates

```
Week 1: Phase 1 (P0) ──> Fix 16 dead buttons + 2 nested <a> bugs ──> CI Regression Pass
Week 2: Phase 2 (P1) ──> Wire 42 simulated buttons to Fastify/Postgres ──> E2E Verification
Week 3: Phase 3 (P2) ──> WCAG touch target compliance & responsive modals ──> Final Sign-off
```

- **Verification Gate 1:** Zero components retain `<button>` without `onClick` or `type="submit"`.
- **Verification Gate 2:** Zero handlers invoke `alert()` or `setTimeout()` simulation in place of network mutations.
- **Verification Gate 3:** Every mutating button is covered by an automated Playwright interaction test verifying HTTP 200/201 and PostgreSQL table mutation.
