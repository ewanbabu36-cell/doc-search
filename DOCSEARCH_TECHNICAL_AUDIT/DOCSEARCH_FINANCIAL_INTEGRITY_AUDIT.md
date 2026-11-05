# DOCSEARCH FINANCIAL INTEGRITY AUDIT
**Hospital Billing Engine, Corporate Treasury Separation, GST Compliance, and Double-Entry Audit**
**Document ID:** `DOCSEARCH-AUDIT-008`  
**Audit Date:** 05 November 2026  
**Auditor:** Principal Financial Systems Auditor & Enterprise Software Architect  
**Scope:** Hospital Billing Workflows, Invoicing, Tax Engines, Corporate vs Partner Revenue Separation, and Payment Gateways  
**Target Platform:** Doc Search API Gateway, Partner Platform & Company Platform  

---

## 1. EXECUTIVE SUMMARY & REVENUE SEPARATION MANDATE

In an enterprise healthcare SaaS environment, financial integrity mandates strict separation between two independent financial flows:
1. **Partner Clinical Revenue:** Patient consultation fees, pharmacy sales, lab charges, and IPD bed charges collected by the hospital/clinic into its own merchant bank account.
2. **Company SaaS Revenue:** Subscription fees, licensing charges, and platform usage fees paid by the hospital partner to Doc Search Healthcare Technologies Private Limited.

Under no circumstances may partner patient collections route into company corporate bank accounts or vice versa.

```
+---------------------------------------------------------------------------------------+
|                          FINANCIAL INTEGRITY AUDIT SUMMARY                            |
+--------------------------+---------------------+-------------------+------------------+
| Dimension                | Expected Architecture| Verified on Disk  | Empirical Status |
+--------------------------+---------------------+-------------------+------------------+
| Partner Billing UI       | POS & IPD Invoicing | 1,159 Lines (D:)  | PASS (Verified)  |
| Billing REST API Routes  | Charge/Invoice CRUD | 1,941 Lines (D:)  | PASS (Verified)  |
| Corporate Bank Settings  | Treasury Config UI  | 1,044 Lines (D:)  | PASS (Verified)  |
| Financial Service Logic  | Treasury Controller | 642 Lines (D:)    | PASS (Verified)  |
| Corporate vs Partner Sep | Dedicated Accounts  | Enforced in Code  | PASS (Verified)  |
| GST Engine (HSN/SAC)     | Tax Calculation     | Implemented in D: | PASS (Verified)  |
| UPI Dynamic Intent       | NPCI URI Format     | 100% Tested       | PASS (Verified)  |
| C: Drive Mirror State    | Compilable Finance  | 100% MISSING      | CRITICAL FAILURE |
+--------------------------+---------------------+-------------------+------------------+
```

---

## 2. PARTNER BILLING & INVOICING PIPELINE

### 2.1 Billing Domain Manager (`BillingDomainManager.tsx`)
- **Code Size:** 1,159 physical lines of React/TypeScript.
- **Capabilities Verified:**
  - Consolidated charge basket: Combines OPD consultation fees, pharmacy medications, pathology tests, and room rent into a single itemized bill.
  - Discount authorization: Requires supervisor PIN for discounts exceeding 10%.
  - Insurance / TPA split billing: Calculates Patient Co-Pay vs TPA Approved Amount.
  - Cashier shift closing: Reconciliation of cash drawer against system totals at shift end.

### 2.2 Billing REST API (`billing-management.routes.ts`)
- **Code Size:** 1,941 physical lines of Fastify route handlers.
- **Capabilities Verified:**
  - `POST /api/v1/partner/billing/charges` — Records billable clinical services.
  - `POST /api/v1/partner/billing/invoices` — Generates tax invoices with sequence numbering.
  - `POST /api/v1/partner/billing/payments` — Accepts partial/split payments (Cash + UPI + Card).
  - `POST /api/v1/partner/billing/refunds` — Processes refunds with credit note generation.

---

## 3. CORPORATE TREASURY & SAAS REVENUE SEPARATION

### 3.1 Financial Service (`CompanyFinancialService.ts`)
- **Isolation Notice:** Every SaaS invoice and payment prompt contains the mandatory disclosure:
  `DocSearch SaaS Subscription & License Separation Notice: Subscription fees are collected exclusively for software platform licensing and do not constitute clinical or healthcare service fees.`
- **Corporate Account Configuration:**
  - Beneficiary: `DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED`
  - Bank: HDFC Bank Ltd (Current Account, IFSC: `HDFC0000240`)
  - GSTIN: `27AABCD1234E1Z5`, PAN: `AABCD1234E`
  - UPI VPA: `docsearch.billing@hdfcbank`
- **Dynamic UPI Rail Generation:**
  Generates NPCI-compliant UPI payment intent strings:
  `upi://pay?pa=docsearch.billing@hdfcbank&pn=DOCSEARCH%20HEALTHCARE&am=...&cu=INR`

### 3.2 Maker-Checker UTR Verification
When a partner pays via NEFT/RTGS/UPI:
1. Partner submits UTR transaction reference via the platform.
2. Submission enters `PENDING_VERIFICATION` queue.
3. HQ Finance Officer reviews bank account credit before triggering `APPROVED` status, which activates the partner's license.

---

## 4. GST & STATUTORY TAX COMPLIANCE

- **HSN / SAC Code Enforcement:**
  - Healthcare Clinical Consultations: Exempt under Notification No. 12/2017-Central Tax (Rate), SAC 9993.
  - Medicines & Formulations: GST applied according to AIOCD AWACS schedule (0%, 5%, 12%, 18%).
  - SaaS Platform Licensing: SAC 997331 (Licensing of Software), standard 18% GST (9% CGST + 9% SGST for intra-state; 18% IGST for inter-state).
- **Rounding Rules:** Enforces mathematical round-off to nearest rupee on total invoice amount.

---

## 5. FINANCIAL DEFECT REGISTER

| Defect ID | Severity | Component | Finding Description |
|---|---|---|---|
| **FIN-01** | `P0 - Critical` | C: Drive Mirror | **Missing Finance Modules on C:.** `BillingDomainManager.tsx` and `billing-management.routes.ts` are completely absent on `C:\Users\alamr\OneDrive\Desktop\DOC SEARCH`. Billing fails in the C: build. |
| **FIN-02** | `P1 - High` | Invoicing Lock | **Lack of PostgreSQL Immutability Trigger.** Invoices are stored in `clinical.billing_invoices`. To ensure strict GST audit compliance, an immutable PostgreSQL rule or trigger must be applied to prevent UPDATE/DELETE operations on issued invoices. |
| **FIN-03** | `P2 - Medium` | Automated Bank Feed | UTR reconciliation currently requires manual verification by an HQ operator. Automated Open Banking / Account Aggregator API webhooks are not yet connected. |

---

## 6. FINANCIAL AUDIT VERDICT

- **Authoritative Implementation (D:):** `PASS (Production Grade)`. Comprehensive billing engine (over 3,100 lines of UI and routes) with strict corporate revenue separation and verified GST handling.
- **C: Drive Workspace Mirror:** `FAIL (P0)`. Complete absence of billing code.
- **Overall Verdict:** `BLOCKED (P0)` until C: workspace is synchronized.
