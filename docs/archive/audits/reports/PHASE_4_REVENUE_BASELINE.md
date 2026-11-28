# PHASE 4 — REVENUE PROTECTION: BASELINE ARCHITECTURAL AUDIT

**Document ID**: `DOCSEARCH-PHASE4-BASELINE-01`  
**Date**: 2026-09-04  
**Author**: Production Revenue Integrity Engineer  
**Status**: **BASELINE ESTABLISHED (PRE-IMPLEMENTATION)**  
**Base Commit**: `6dd4437` (`feat(phase-3): complete frozen production clinical workflow implementation and certification`)  
**Working Tree Status**: Clean (0 uncommitted changes)  
**TypeScript Status**: 0 Errors (`tsc -p apps/api-gateway/tsconfig.json` exit code 0)  
**Existing Test Status**: 37/37 Clinical Tests Passing (100% Green)

---

## 1. Executive Summary

Phase 3 (Clinical Workflow) has established a robust, transactional, PostgreSQL-backed clinical lifecycle from patient registration through consultation, prescription, and lab ordering.
The goal of **Phase 4 (Revenue Protection)** is to enforce absolute financial correctness, accounting integrity, authorization, persistence, concurrency safety, cryptographic auditability, and recovery across:
1. **Consultation Revenue Workflow** (Service/Plan $\rightarrow$ Fee $\rightarrow$ Charge $\rightarrow$ Invoice $\rightarrow$ Payment $\rightarrow$ Receipt)
2. **Pharmacy Revenue Workflow** (Prescription $\rightarrow$ Stock Check $\rightarrow$ Dispensing $\rightarrow$ Atomic Inventory Deduction $\rightarrow$ Bill $\rightarrow$ Payment)
3. **Laboratory Revenue Workflow** (Lab Order $\rightarrow$ Charge $\rightarrow$ Invoice/Payment Policy $\rightarrow$ Sample $\rightarrow$ Testing $\rightarrow$ Result $\rightarrow$ Report)

The system must operate under the **Financial Authority Rule**:
> The browser/UI is NEVER the financial authority. Authoritative financial state must come exclusively from backend PostgreSQL transactionally persisted records.

---

## 2. Database Schema Inventory

### 2.1 Billing & Invoice Tables (`packages/database/src/schema/clinical/index.ts`)
* **`clinical.billing_invoices`** (`billingInvoices`):
  - Primary Key: `id` (UUID)
  - Scoping: `tenant_id`, `partner_id`, `organization_id`, `branch_id`, `patient_id`, `encounter_id`
  - Attributes: `invoice_number` (Unique), `invoice_type` (OPD, IPD, EMERGENCY, PHARMACY, DIAGNOSTICS), `status` (DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, VOIDED), `subtotal`, `discount_total`, `tax_total`, `rounding_adjustment`, `total_amount`, `paid_amount`, `due_amount`, `currency`, `issued_at`, `due_at`, `finalized_at`, `finalized_by`, `metadata`
* **`clinical.billing_invoice_items`** (`billingInvoiceItems`):
  - Primary Key: `id` (UUID)
  - Scoping: `tenant_id`, `invoice_id`, `charge_id`, `charge_item_id`, `service_catalog_id`
  - Attributes: `service_code`, `description`, `quantity`, `unit_price`, `gross_amount`, `discount_amount`, `tax_amount`, `net_amount`, `metadata`
* **`clinical.billing_charges`** (`billingCharges`):
  - Primary Key: `id` (UUID)
  - Scoping: `tenant_id`, `partner_id`, `organization_id`, `branch_id`, `patient_id`, `encounter_id`, `consultation_id`
  - Attributes: `source_domain` (CLINICAL_CONSULTATION, CLINICAL_INVESTIGATION, PHARMACY, etc.), `source_entity_id`, `charge_number`, `status` (PENDING, CAPTURED, INVOICED, CANCELLED), `subtotal`, `discount_total`, `tax_total`, `grand_total`, `captured_by`, `captured_at`
* **`clinical.billing_charge_items`** (`billingChargeItems`):
  - Primary Key: `id` (UUID)
  - Attributes: `charge_id`, `service_catalog_id`, `description`, `quantity`, `unit_price`, `gross_amount`, `discount_amount`, `tax_amount`, `net_amount`

### 2.2 Payment, Receipt & Refund Tables
* **`clinical.billing_payments`** (`billingPayments`):
  - Primary Key: `id` (UUID)
  - Scoping: `tenant_id`, `partner_id`, `organization_id`, `branch_id`, `patient_id`, `invoice_id`
  - Attributes: `payment_number` (Unique), `payment_method` (CASH, CARD, UPI, BANK_TRANSFER, CHEQUE, ONLINE), `amount`, `currency`, `reference_number`, `status` (PENDING, SUCCESS, FAILED, REVERSED, REFUNDED), `received_by`, `received_at`, `notes`
* **`clinical.billing_payment_allocations`** (`billingPaymentAllocations`):
  - Maps payment ID to invoice ID with `allocated_amount`
* **`clinical.billing_receipts`** (`billingReceipts`):
  - Official numbered receipt: `receipt_number` (Unique), `payment_id`, `invoice_id`, `patient_id`, `amount`, `payment_method`, `issued_by`, `issued_at`, `status` (ISSUED, CANCELLED)
* **`clinical.billing_refunds`** (`billingRefunds`):
  - Authorized refunds: `refund_number` (Unique), `payment_id`, `invoice_id`, `patient_id`, `amount`, `reason`, `status` (REQUESTED, APPROVED, PROCESSING, COMPLETED, REJECTED), `approved_by`, `processed_by`, `processed_at`
* **`clinical.billing_discounts`** (`billingDiscounts`):
  - Authorized discounts: `invoice_id`, `invoice_item_id`, `discount_type` (PERCENTAGE, FIXED_AMOUNT), `discount_value`, `discount_amount`, `reason`, `approved_by`, `created_by`
* **`clinical.billing_credit_notes`** (`billingCreditNotes`):
  - Formal credit notes for invoice adjustments

### 2.3 Catalog, Price Lists & Tariffs
* **`clinical.billing_service_catalog`** (`billingServiceCatalog`):
  - Master catalog of chargeable hospital services: `service_code`, `name`, `category`, `base_price`, `active`
* **`clinical.billing_price_lists`** (`billingPriceLists`):
  - Branch/plan specific fee schedules: `price_list_code`, `effective_from`, `effective_to`, `status`
* **`clinical.billing_price_list_items`** (`billingPriceListItems`):
  - Specific rate overrides: `price_list_id`, `service_catalog_id`, `unit_price`, `discount_allowed`

### 2.4 Pharmacy & Inventory Tables
* **`clinical.pharmacy_prescriptions`** (`pharmacyPrescriptions`):
  - Official doctor digital prescription header linked to encounter and patient
* **`clinical.pharmacy_prescription_items`** (`pharmacyPrescriptionItems`):
  - Ordered medication line items: `prescribed_quantity`, `dispensed_quantity`, `remaining_quantity`, `fulfillment_status`
* **`clinical.pharmacy_inventory`** (`pharmacyInventory`):
  - Branch-level aggregated medication stock: `available_quantity`, `reserved_quantity`, `reorder_level`
* **`clinical.pharmacy_batches`** (`pharmacyBatches`):
  - Granular batch tracking: `batch_number`, `expiry_date`, `available_quantity`, `reserved_quantity`, `unit_cost`, `status`
* **`clinical.pharmacy_stock_movements`** (`pharmacyStockMovements`):
  - Immutable stock ledger: `movement_type` (RECEIPT, DISPENSE, RETURN, QUARANTINE, ADJUSTMENT), `quantity`, `before_quantity`, `after_quantity`, `actor_id`, `reason`, `correlation_id`
* **`clinical.pharmacy_dispensing`** (`pharmacyDispensing`):
  - Official dispensing event: `dispensing_number`, `prescription_id`, `patient_id`, `pharmacist_id`, `dispensing_status`
* **`clinical.pharmacy_dispensing_items`** (`pharmacyDispensingItems`):
  - Batch-deducted line items fulfilled in a dispensing transaction

### 2.5 Laboratory Diagnostic Tables
* **`clinical.investigation_orders`** (`investigationOrders`):
  - Diagnostic order: `order_number`, `patient_id`, `encounter_id`, `ordering_doctor_id`, `priority`, `status`, `metadata` (storing `billing_status`, test names, test codes)

### 2.6 Core Security & Audit Table
* **`core.audit_events`** (`auditEvents`):
  - SHA-256 cryptographic hash chain: `id`, `tenant_id`, `branch_id`, `actor_id`, `event_type`, `resource_type`, `resource_id`, `previous_hash`, `integrity_hash`, `timestamp`

---

## 3. Existing Financial APIs & Routes

Currently registered in `apps/api-gateway/src/routes/partner/billing-management.routes.ts`:
- `GET /api/v1/partner/billing/invoices` (`billing:invoices:read`)
- `GET /api/v1/partner/billing/invoices/:id` (`billing:invoices:read`)
- `POST /api/v1/partner/billing/invoices` (`billing:invoices:create`)
- `POST /api/v1/partner/billing/invoices/:id/pre-auth` (`billing:invoices:create`)
- `POST /api/v1/partner/billing/invoices/:id/payments` (`billing:invoices:create`)
- `POST /api/v1/partner/billing/invoices/:id/void` (`billing:invoices:update`)
- `POST /api/v1/partner/billing/invoices/:id/cancel` (`billing:invoices:update`)
- `POST /api/v1/partner/billing/invoices/:id/discounts` (`billing:invoices:update`)
- `GET /api/v1/partner/patients/:id/billing-history` (`clinical:patients:read`)

In `pharmacy-management.routes.ts`:
- `POST /api/v1/partner/pharmacy/dispense` (`pharmacy:dispense:create`)
- `POST /api/v1/partner/pharmacy/batches/receive-stock` (`pharmacy:inventory:create`)
- `GET /api/v1/partner/pharmacy/stock-movements` (`pharmacy:inventory:read`)

In `lab-diagnostics.routes.ts`:
- `POST /api/v1/partner/lab/orders` (`lab:orders:create`)
- `POST /api/v1/partner/lab/orders/:id/collect-sample` (`lab:specimens:create`)
- `POST /api/v1/partner/lab/orders/:id/results` (`lab:results:create`)

---

## 4. Existing Gaps in Revenue Protection (Phase 4 Targets)

### Gap 1: Price Integrity & Unauthorized Client Manipulation
* **Current State**: `createInvoice` accepts `unitPrice` and `totalPrice` sent directly in the request body.
* **Vulnerability**: Client can tamper with service fees, sending negative or negligible prices.
* **Remediation**: Server must recalculate authoritative prices against `billingServiceCatalog` / `billingPriceListItems` or established pricing rules. Reject unauthorized price modifications.

### Gap 2: Overpayment, Zero/Negative Payment, & Duplicate Payment Concurrency
* **Current State**: `collectPayment` does not reject `amount <= 0`, does not reject `amount > invoice.balanceDue`, lacks `FOR UPDATE` transactional row locking, and lacks duplicate transaction reference deduplication.
* **Vulnerability**: Concurrent payment requests or rapid clicks can overpay or create duplicate payment entries.
* **Remediation**:
  - Enforce `amount > 0` and `amount <= invoice.balanceDue`.
  - Enforce atomic database transaction with `FOR UPDATE` locking on `billing_invoices`.
  - Enforce idempotency key deduplication.
  - Reject payment against `CANCELLED`, `VOIDED`, or `PAID` invoices.

### Gap 3: Discount Authorization & Ceiling Controls
* **Current State**: `applyDiscount` validates percentage <= 100, but lacks RBAC permission enforcement (`billing:discounts:apply`), maximum percentage ceiling without supervisor override token, and full SHA-256 audit chaining.
* **Vulnerability**: Unauthorized staff could apply excessive discounts without audit accountability.
* **Remediation**: Enforce RBAC permission, supervisor override token requirement for discounts > 20%, and complete cryptographic audit trail.

### Gap 4: Pharmacy Inventory & Billing Integration
* **Current State**: `PharmacyManagementRepository.dispense` hardcodes `unitPrice = 25.0`, generates a fake `invoiceNumber` string without inserting a real `billing_invoices` record, and marks status as `PAID`.
* **Vulnerability**: Medication dispensing does not create genuine commercial receivables.
* **Remediation**:
  - Resolve unit price dynamically from `medicationCatalog` or batch.
  - Generate real PostgreSQL `billing_invoices` and `billing_invoice_items` records.
  - Collect payments authoritatively.
  - Enforce concurrency protection against negative stock.

### Gap 5: Laboratory Order Billing Policy
* **Current State**: Lab orders are created without a formal charge record, and sample collection does not check whether payment is required prior to sample draw.
* **Remediation**: Link lab investigation orders to billing charges/invoices and enforce configurable payment policies (`PAYMENT_REQUIRED_BEFORE_SAMPLE` vs deferred billing).

### Gap 6: Refund Workflow API
* **Current State**: Refund handling exists only as a webhook listener for payment gateways (`handleWebhookRefund`), but there is no partner API endpoint for authorized staff refunds with validation.
* **Remediation**: Implement `POST /api/v1/partner/billing/invoices/:id/refund` with supervisor authorization, amount checks (`refund <= paidAmount`), and transactional balance adjustment.

### Gap 7: Cryptographic SHA-256 Audit Trail
* **Current State**: Financial events must create immutable audit events with SHA-256 hash chaining in `core.audit_events` across all financial mutations:
  `CHARGE_CREATED`, `INVOICE_CREATED`, `INVOICE_UPDATED`, `INVOICE_VOIDED`, `INVOICE_CANCELLED`, `PAYMENT_CREATED`, `PAYMENT_FAILED`, `RECEIPT_CREATED`, `DISCOUNT_APPLIED`, `REFUND_CREATED`, `PHARMACY_DISPENSED`, `INVENTORY_DEDUCTED`, `LAB_CHARGE_CREATED`.

---

## 5. Phase 4 Implementation Plan & Strategy

1. **Step 1: Core Billing Integrity & Payment Hardening**:
   - Dynamic service catalog pricing & price integrity validation.
   - Payment validation (`amount > 0`, `amount <= balanceDue`, status validations, `FOR UPDATE` locking, idempotency deduplication).
   - Staff refund endpoint `POST /api/v1/partner/billing/invoices/:id/refund` with supervisor override.
   - Discount authorization controls with supervisor override and audit logs.
2. **Step 2: Pharmacy Inventory & Billing Orchestration**:
   - Dynamic medication pricing from `medicationCatalog`.
   - Real `billing_invoices` and `billing_invoice_items` creation on dispensing.
   - Concurrency locking with FEFO batch allocation ensuring `stock >= 0`.
3. **Step 3: Laboratory Revenue & Billing Policy**:
   - Link diagnostic orders to billing charges and invoice items.
   - Validate payment policy before specimen collection.
4. **Step 4: Cryptographic SHA-256 Audit Trail**:
   - Ensure all financial mutations write immutable hash-chained audit events to `core.audit_events`.
5. **Step 5: Automated Testing Suite**:
   - Create comprehensive `apps/api-gateway/test/revenue-protection-journey.test.mjs` covering all 11 required revenue domains.
6. **Step 6: Certification & Freeze**:
   - Generate `PHASE_4_REVENUE_PROTECTION_AUDIT.md`.
