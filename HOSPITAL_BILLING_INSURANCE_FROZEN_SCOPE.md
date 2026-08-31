# CENTRALIZED HOSPITAL BILLING, TPA & INSURANCE — FROZEN SCOPE & PRODUCTION CONTROL CONTRACT
**Doc Search Hospital Platform — Revenue Cycle & Ayushman Bharat (PM-JAY) Suite**
**Status:** `FROZEN`
**Version:** `1.0.0-PROD-CERTIFIED`
**Date:** `2026-08-30`
**Authority:** Lead Product Architect, Backend Architect, Frontend Architect, Database Architect, QA & Security Auditor

---

## 1. PRIMARY RULE — SCOPE FREEZE
The Centralized Hospital Billing & TPA / Insurance domain is officially **FROZEN**.

### Prohibitions:
* **No Unapproved Additions:** Do NOT add new financial or insurance billing features without explicit architectural approval.
* **No Unapproved Removals:** Do NOT remove an approved billing/insurance feature without explicit approval.
* **No Concept Renaming:** Do NOT rename approved invoice, tariff, or insurance claim classifications.
* **No Phase Exposure:** Do NOT introduce development phase numbers (`Phase 1`, `Phase 2`, `Wave 1`, `Sprint X`) into the production UI.
* **No Fake/Mock State:** Production UI and APIs must strictly use real PostgreSQL persistence through the complete gateway/repository chain.
* **No Casual Schema Changes:** Database models, RLS policies, and API contracts are locked under strict impact-analysis governance.
* **No RBAC Degradation:** All sensitive endpoints enforce server-side authentication, tenant scoping, branch scoping, and granular RBAC.

> **Change Control Directive:**
> If a requested modification falls outside this frozen contract:
> `STOP` → `REPORT SCOPE CONFLICT` → `ASK FOR EXPLICIT APPROVAL` → `WAIT`.

---

## 2. FROZEN REVENUE CYCLE & BILLING LIFECYCLE
Centralized Billing manages the complete hospital revenue cycle from charge aggregation through final discharge settlement:
```text
Clinical Orders & Stay (OPD / IPD / Emergency / OT / Lab / Pharmacy / Blood Bank)
       ↓
Automated Multi-Department Charge Aggregation
       ↓
Billing Type Selection (Self-Pay / Private Insurance TPA / Ayushman Bharat PM-JAY / Corporate)
       ↓
Insurance / TPA Pre-Authorization (Package approval, Co-Pay calculation, Coverage limits)
       ↓
Consolidated Hospital Invoice Generation (`INV-HOSP-XXXXXX`)
       ↓
Payment Collection & Multi-Mode Settle (Cash / Credit Card / UPI / TPA Credit)
       ↓
Payment Receipt Issuance (`REC-XXXXXX`) & Financial Discharge Clearance
       ↓
Patient Longitudinal Financial History & Ledger
       ↓
Cryptographic Immutable Audit Trail (SHA-256 Chaining)
```

---

## 3. CORE FUNCTIONAL DOMAINS & STATUS

| Domain Area | Description | UI View / Dialog | Backend Route | DB Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Charge Aggregation & Invoicing** | Auto-aggregation of consultation, bed rent, surgery, pharmacy, lab, and blood bank charges | `BillingOverviewView`, `BillingChargeDirectoryView` | `GET/POST /api/v1/partner/billing/invoices` | `clinical.billing_invoices`, `clinical.billing_invoice_items` | `FROZEN / COMPLETE` |
| **TPA / Ayushman Bharat Pre-Auth** | Cashless pre-auth requests, PM-JAY packages, approval ceiling, co-pay and deductible calculation | `InsuranceCenterView`, `AddInsuranceDialog` | `POST /api/v1/partner/billing/invoices/:id/pre-auth` | `clinical.insurance_authorizations`, `clinical.billing_invoices` | `FROZEN / COMPLETE` |
| **Payment Collection & Receipts** | Multi-mode payments (Cash, Card, UPI, Insurance Credit), instant receipt generation (`REC-XXXXXX`) | `BillingOverviewView`, Payment Modal | `POST /api/v1/partner/billing/invoices/:id/payments` | `clinical.billing_payments`, `clinical.billing_receipts` | `FROZEN / COMPLETE` |
| **Discharge Settlement** | Zero-balance verification, financial clearance for inpatient discharge, itemized bill print | `PatientBillingHistoryView` | `POST .../payments` (balance = 0) | `clinical.billing_invoices` | `FROZEN / COMPLETE` |
| **Patient Financial History** | Complete longitudinal financial ledger of all invoices, receipts, discounts, and payments | `PatientBillingHistoryView` | `GET /api/v1/partner/patients/:id/billing-history` | Multi-table Join | `FROZEN / COMPLETE` |
| **Audit Ledger** | SHA-256 hash-chained immutable audit ledger for invoices, pre-auths, payments, and receipts | `BillingAuditVaultView` | Audit Repository | `clinical.billing_audit_traces` | `FROZEN / COMPLETE` |

---

## 4. SECURITY, MULTI-TENANCY & RBAC
1. **Server-Side Enforcement:** Every endpoint validates JWT session context via `authenticate` and `requirePermission`.
2. **Tenant Isolation:** Queries enforce `eq(table.tenantId, session.tenantId)`. Cross-tenant billing access returns 0 records / 403.
3. **Branch/Facility Scope:** Restricts invoices, cashier sessions, and receipts to the assigned facility operational scope.
4. **Role Capabilities:**
   - `BILLING_OFFICER` / `CASHIER`: `clinical:encounters:create`, `clinical:encounters:read`, `clinical:encounters:update` (Invoicing, payments, receipts)
   - `TPA_DESK` / `INSURANCE_COORDINATOR`: Pre-auth submissions, claim tracking, PM-JAY package approval
   - `HOSPITAL_ADMIN`: Tariff management, discount policies, refund authorization

---

## 5. DATABASE ARCHITECTURE & REAL PERSISTENCE
* **Canonical Tables in PostgreSQL:**
  - `clinical.billing_service_catalog` (Master service tariff catalog)
  - `clinical.billing_charges` (Captured department charges)
  - `clinical.billing_invoices` (Consolidated invoices and discharge bills)
  - `clinical.billing_invoice_items` (Itemized line items)
  - `clinical.billing_payments` (Financial payment transactions)
  - `clinical.billing_receipts` (Official printed money receipts)
  - `clinical.insurance_payres` (TPA and insurance companies master)
  - `clinical.insurance_authorizations` (Pre-auth approvals and cashless limits)
  - `clinical.billing_audit_traces` (Immutable SHA-256 financial audit ledger)
* **Zero Client Storage Dependency:** Billing data is retrieved directly from PostgreSQL through the API Gateway. Browser `localStorage` is not a source of truth for financial records.

---

## 6. CHANGE CONTROL PROCEDURE
Any future request that introduces new capabilities beyond this specification must follow the Frozen Scope Change Control:
1. Submit formal Change Request specifying business need, impacted tables, API routes, and security risk assessment.
2. Architecture Board Review and Security Impact Analysis.
3. Explicit Approval required before any implementation.
