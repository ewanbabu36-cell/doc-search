# 🔬 DOC SEARCH — PRODUCTION TRUTH, ARCHITECTURE & DATA INTEGRITY AUDIT

**Audit Execution Date:** September 1, 2026  
**Auditor:** DOC SEARCH Engineering & Quality Assurance Group  
**Monorepo Scope:** `DOC SEARCH` (Apps: `api-gateway`, `partner-platform`, `company-platform`, `landing-page`; Packages: `database`, `api-contracts`, `auth`, `shared-core`)  
**Standard:** Zero Simulation Policy / Real PostgreSQL Drizzle ORM Source of Truth

---

## 1. 📊 SYSTEM-WIDE PRODUCTION TRUTH MATRIX

| # | Feature / Domain | Claimed Capability | Actual Source Code Implementation | Backend Route | Database Model & Table | Automated Tests | Production Status | Required Remediation |
|---|---|---|---|---|---|---|---|---|
| **1** | **Patient Registration & MPI** | PostgreSQL MPI DB persistence | In-memory `memPatients` map in `ClinicalWorkflowRepository.ts` with LocalStorage fallback in `patient-registration-service.ts` | `POST /api/v1/partner/patients`<br>`GET /api/v1/partner/patients` | `clinical.patients`<br>`patient_contacts`<br>`patient_identifiers` | `test-production-truth.js` (Step 1) | 🟡 PARTIALLY IMPLEMENTED | Eliminate in-memory Map fallback; ensure Drizzle ORM writes and reads directly from PostgreSQL `clinical.patients`. |
| **2** | **LIMS Lab Orders** | Server-side collision-safe order lifecycle | In-memory `memOrders` Map in `LabDiagnosticsRepository.ts` + `docsearch_investigation_orders` LocalStorage vault | `POST /api/v1/partner/lab/orders`<br>`GET /api/v1/partner/lab/orders` | `clinical.investigation_orders` | `test-production-truth.js` (Step 2) | 🟡 PARTIALLY IMPLEMENTED | Connect `LabDiagnosticsRepository` directly to `investigationOrders` Drizzle schema table with transactional multi-test insert. |
| **3** | **Specimen Collection & Accessioning** | Barcode accession register in DB | In-memory `specimens` array in `LabDiagnosticsRepository.ts` + LocalStorage vault | `POST /api/v1/partner/lab/orders/:id/collect-sample` | `clinical.investigation_specimens` | `test-production-truth.js` (Step 3) | 🟡 PARTIALLY IMPLEMENTED | Persist specimen barcode, tube type, collection site, and collector directly in `clinical.investigation_specimens`. |
| **4** | **Result Entry & Deterministic Flags** | Server-calculated reference intervals | Client-side evaluation in `EnterInvestigationResultDialog.tsx` & in-memory `results` array | `POST /api/v1/partner/lab/orders/:id/results` | `clinical.investigation_results` | `test-production-truth.js` (Step 4) | 🟡 PARTIALLY IMPLEMENTED | Implement server-side deterministic reference range and critical flag calculation engine based on age/gender. |
| **5** | **Pathologist Validation & Report Lock** | Immutable report finalization & audit | State update `REPORT_FINALIZED` with SHA256 string in `memOrders` / LocalStorage | `PATCH /api/v1/partner/lab/orders/:id/verify` | `clinical.investigation_reports` | `test-production-truth.js` (Step 5) | 🟡 PARTIALLY IMPLEMENTED | Enforce server-side immutable lock on `investigationReports` and prevent edits once finalized without an amendment record. |
| **6** | **Diagnostic PDF Generation** | Server-authoritative PDF document | Pure client-side binary ISO 32000-1 vector generator in `clientPathologyPdf.ts` | `GET /api/v1/partner/lab/orders/:id/pdf` | `clinical.investigation_reports` (metadata) | `test-production-truth.js` (Step 6) | 🟡 PARTIALLY IMPLEMENTED | Provide dual server/client rendering; ensure PDF contains only verified DB records and label "System Generated Report". |
| **7** | **Billing Invoices & Financial Ledger** | Transactional ledger with GST | In-memory `memInvoices` Map in `BillingManagementRepository.ts` + LocalStorage | `POST /api/v1/partner/billing/invoices`<br>`GET /api/v1/partner/billing/invoices` | `clinical.billing_invoices`<br>`billing_invoice_items` | `test-production-truth.js` (Step 7) | 🟡 PARTIALLY IMPLEMENTED | Connect `BillingManagementRepository` directly to `billingInvoices` & `billingInvoiceItems` with decimal arithmetic. |
| **8** | **Payment Settlement & Receipts** | Real-time payment posting & receipt vault | In-memory `payments` array in `BillingManagementRepository.ts` + LocalStorage | `POST /api/v1/partner/billing/payments` | `clinical.billing_payments`<br>`billing_receipts` | `test-production-truth.js` (Step 8) | 🟡 PARTIALLY IMPLEMENTED | Persist payment transaction references in `billingPayments` and calculate zero outstanding balances server-side. |
| **9** | **Doctor E-Prescription & Pharmacy Sync** | Auto-stock decrement on dispense | `clinical-consultation-service.ts` auto-pushes to LocalStorage; `pharmacy-management-service.ts` decrements in-memory batch | `POST /api/v1/partner/pharmacy/dispense` | `clinical.consultation_medications`<br>`pharmacy_dispensing` | `patch_pharmacy_eprescription.js` | 🟡 PARTIALLY IMPLEMENTED | Wire consultation medication orders to Fastify Pharmacy API and execute transactional batch stock deduction in PostgreSQL. |
| **10** | **Inpatient (IPD) Bed Allocation** | Real-time ward occupancy & bed billing | In-memory `beds` array in `inpatient-management-service.ts` + auto-accumulation into LocalStorage billing charges | `POST /api/v1/partner/inpatient/allocate-bed` | `clinical.inpatient_beds`<br>`inpatient_admissions` | `patch_inpatient_bed_allocation.js` | 🟡 PARTIALLY IMPLEMENTED | Store bed status (`AVAILABLE`, `OCCUPIED`, `BLOCKED`, `CLEANING`) and daily bed charges in PostgreSQL tables. |
| **11** | **Outbound Webhook Dispatcher** | Real HMAC SHA256 outbound delivery | Fastify `POST /api/v1/company/integration/webhooks/dispatch-test` with live Node `crypto` HMAC and latency timer | `POST /api/v1/company/integration/webhooks/dispatch-test` | `company.webhook_endpoints`<br>`webhook_deliveries` | `test-production-truth.js` | 🟢 VERIFIED REAL DISPATCH | Add persistent delivery history logs in PostgreSQL table `company.webhook_deliveries` with retry policy. |
| **12** | **Treasury Forex (FX) Ingress** | Live Interbank market rates | Fastify `GET /api/v1/company/treasury/fx-rates` returning midpoint cache with toolbar refresher | `GET /api/v1/company/treasury/fx-rates` | `company.exchange_rates` | `GlobalCurrencyLocaleContext.tsx` | 🟢 VERIFIED BACKEND SYNC | Add freshness timestamp indicator and fallback label (`STALE / CACHED / LIVE`) when external provider is unavailable. |
| **13** | **White-Labeling & Multi-Lingual Engine** | Dynamic CSS variable theming & RTL | Dynamic CSS root properties injection (`--primary-color`) + RTL DOM switch | Client-side Context | `core.tenants` (branding metadata) | UI verified | 🟢 VERIFIED CLIENT ENGINE | Persist partner branding configurations in PostgreSQL `core.tenants` table. |
| **14** | **Multi-Tenant & RBAC Security** | Server-side tenant isolation & RBAC | Fastify `auth-guard.ts` (`authenticate`, `requirePermission`, `withSecurityContext`) | All `/api/v1/*` routes | PostgreSQL RLS session variables | `packages/auth/test/security-wave1.test.ts` | 🟢 VERIFIED SECURITY GUARD | Ensure every repository wraps mutations in `withSecurityContext` with `tenantId` parameter. |
| **15** | **Cryptographic Audit Trail** | Immutable audit chain | `operationalAuditTraces` & module-level audit log recording | All mutation controllers | `clinical.audit_events` | `test-production-truth.js` (Step 9) | 🟢 VERIFIED AUDIT CHAIN | Ensure audit events write to PostgreSQL table with immutable SHA256 state hashes. |

---

## 2. 🏛️ REPOSITORY ARCHITECTURE MAP

```
DOC SEARCH MONOREPO
├── apps/
│   ├── api-gateway/         (Fastify REST API Gateway on Port 4000)
│   │   ├── src/routes/      (Partner, Company, Clinical, Billing, Auth, Integration Routes)
│   │   ├── src/services/    (Domain Services)
│   │   └── src/repositories/(Partner & Core Database Repositories)
│   ├── partner-platform/    (Vite React Partner Hospital/Doctor/LIMS UI on Port 5173)
│   │   ├── src/components/  (Clinical, LIMS, IPD, OPD, Billing, Pharmacy Domain Managers)
│   │   ├── src/services/    (Client Services with API client & Vault caching)
│   │   └── src/utils/       (Vector PDF Generator, Formatting, Locale)
│   ├── company-platform/    (Vite React Global HQ Command Center on Port 5174)
│   │   ├── src/components/  (Treasury, White-Label Studio, Webhook Builder, RBAC)
│   │   └── src/services/    (Company Admin Services)
│   └── landing-page/        (Patient Web Portal on Port 5175)
│       └── src/             (Doctor Search, Appointment Booking, AI Receptionist)
└── packages/
    ├── database/            (Drizzle ORM Schema & PostgreSQL Client with RLS)
    │   ├── src/schema/core/ (Tenants, Branches, Users, Roles, Document Verification)
    │   ├── src/schema/clinical/ (Patients, Encounters, LIMS, Billing, IPD, Pharmacy)
    │   └── src/schema/company/ (Subscriptions, Treasury, Webhooks, Governance)
    ├── api-contracts/       (TypeScript DTOs and Request/Response Interfaces)
    ├── auth/                (JWT Authentication, RBAC Permissions, Password Hashing)
    └── shared-core/         (Error Handling, Structured Logger, Utilities)
```

---

## 3. 🎯 CRITICAL PATH ACTION PLAN FOR PRODUCTION HARDENING

1. **Reposition LocalStorage as Secondary Offline Cache Only:**
   - Database (PostgreSQL via Drizzle ORM) must be the primary authority on all reads and writes.
   - When LocalStorage is cleared (`localStorage.clear()`), all clinical and financial records must reload from the backend API.
2. **Harden Repositories in API Gateway:**
   - Migrate `LabDiagnosticsRepository.ts` to write to `investigationOrders`, `investigationSpecimens`, and `investigationResults`.
   - Migrate `BillingManagementRepository.ts` to write to `billingInvoices` and `billingPayments`.
3. **Deterministic Server-Side Clinical Flags:**
   - Move reference range evaluation into `LabDiagnosticsService` with explicit gender/age bounds.
4. **Honest Labeling of PDF Reports:**
   - Label generated reports as `SYSTEM GENERATED OFFICIAL PATHOLOGY REPORT` with cryptographic verification hash.
5. **Verify Full E2E Lifecycle without LocalStorage Dependence:**
   - Run automated test scripts and verify PostgreSQL database tables.

---

> [!IMPORTANT]
> This audit serves as the baseline for all subsequent hardening steps. All code modifications will strictly adhere to the authoritative Drizzle ORM schema and PostgreSQL database contracts.
