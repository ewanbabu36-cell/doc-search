# DOC SEARCH — PHASE 5 FINANCIAL RECONCILIATION & STATUTORY TDS REPORT
## Multi-Tier TDS Computation & Communication Webhook Delivery Proof (PB-03 / PB-04 / PB-05)

**Audit Date:** 2026-11-05T12:26:14Z  
**Target Modules:**  
- `apps/api-gateway/src/routes/partner/commercial-operations.routes.ts`  
- `apps/api-gateway/src/services/notification-dispatch.service.ts`  
**Database Tables:** `clinical.doctor_settlement_vouchers`, `clinical.patient_health_wallets`, `core.audit_events`  
**Test Script:** `scripts/test-financial-settlement.mjs`

---

## 1. Statutory TDS Engine Verification (Section 194J, 194C, 206AA, 197)

The previous Phase 4 implementation hardcoded a flat 10% TDS rate across all doctors. In Phase 5, the doctor settlement engine was refactored to compute dynamic statutory deductions based on:
1. Payee Tax Category (Professional vs Technical vs Contractor vs Certified Lower Deduction)
2. PAN Availability & Validity (Section 206AA statutory higher rate of 20%)
3. Form 13 Lower Deduction Certificates (Section 197)

### Test Execution Matrix:

| Test Case | Payee Category & Identity | Gross Billed | Facility Usage Deduction | Doctor Gross | PAN Status | Applicable Statutory Section | Applied Rate | TDS Deducted | Net Payable | Verdict |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **Case 1** | Dr. Vivek Sharma (Surgeon) | ₹20,000 | ₹6,150 (30% + ₹150) | ₹13,850 | Valid PAN | **Section 194J (Professional)** | 10.0% | ₹1,385.00 | ₹12,465.00 | **PASS** |
| **Case 2** | Dr. Neha Kapoor (Biomedical Lead) | ₹50,000 | ₹10,150 (20% + ₹150) | ₹39,850 | Valid PAN | **Section 194J (Technical)** | 2.0% | ₹797.00 | ₹39,053.00 | **PASS** |
| **Case 3** | Visiting Locum Specialist | ₹30,000 | ₹7,650 (25% + ₹150) | ₹22,350 | **PAN Absent** | **Section 206AA (Higher Rate)** | 20.0% | ₹4,470.00 | ₹17,880.00 | **PASS** |
| **Case 4** | Senior Super-Specialist | ₹100,000 | ₹15,150 (15% + ₹150) | ₹84,850 | Valid PAN | **Section 197 (Lower Deduction)** | 1.5% | ₹1,273.00 | ₹83,577.00 | **PASS** |

### Execution Console Evidence:
```
--- PB-03 / PB-04 / PB-05 FINANCIAL SETTLEMENT & STATUTORY TDS AUDIT ---

Case 1: Standard 194J (10% TDS):
- Doctor Gross: ₹13850, TDS: ₹1385.00 (10%), Net: ₹12465.00
- Statutory Section: Section 194J (10% - Professional Clinical Fees)

Case 2: Technical 194J (2% TDS):
- Doctor Gross: ₹39850, TDS: ₹797.00 (2%), Net: ₹39053.00
- Statutory Section: Section 194J (2% - Technical / Equipment Maintenance Fees)

Case 3: Missing PAN Section 206AA (20% TDS):
- Doctor Gross: ₹22350, TDS: ₹4470.00 (20%), Net: ₹17880.00
- Statutory Section: Section 206AA (20% - Higher Rate for Non-Furnishing of PAN)

Case 4: Section 197 Lower Deduction Certificate (1.5% TDS):
- Doctor Gross: ₹84850, TDS: ₹1273.00 (1.5%), Net: ₹83577.00
- Statutory Section: Section 197 (Lower Deduction Certificate: IT-CERT-197-2026-9901A @ 1.5%)
```

---

## 2. Meta WhatsApp Cloud API DLR Webhook Processing (PB-05)

The notification dispatch service `apps/api-gateway/src/services/notification-dispatch.service.ts` was audited to verify that external notification delivery callbacks (DLR) are never confused with initial API submission:

1. **Meta Cloud API Webhook Parser:**
   Handles incoming payload status transitions:
   - `status: "sent"` → `SENT`
   - `status: "delivered"` → `DELIVERED`
   - `status: "read"` → `READ`
   - `status: "failed"` → `FAILED`
   - Missing/Unrecognized → `UNKNOWN`
2. **Delivery Proof:**
   ```
   [WhatsApp Meta Cloud API Webhook DLR Processing]
   Processed Sent Status: SENT
   Processed Delivered Status: DELIVERED
   Processed Failed Status: FAILED
   ```
3. **Idempotency & Message Tracking:** Message IDs (`wamid_...`) are persisted transactionally, preventing duplicate patient notification billing.

---

## 3. Financial Integrity & Audit Invariants

- **Zero Math Errors:** Rounded statutory TDS and net payable sums strictly equal gross doctor earnings:
  $$\text{Net Payable} = \text{Doctor Gross} - \text{TDS Deducted}$$
  $13,850 = 12,465 + 1,385$ (Case 1)  
  $39,850 = 39,053 + 797$ (Case 2)  
  $22,350 = 17,880 + 4,470$ (Case 3)  
  $84,850 = 83,577 + 1,273$ (Case 4)
- **NMC Ethics Regulations 2023:** Every generated voucher includes the non-negotiable statutory declaration affirming zero referral fee-splitting or commercial kickbacks.
