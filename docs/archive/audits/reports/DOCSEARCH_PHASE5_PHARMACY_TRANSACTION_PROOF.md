# DOC SEARCH — PHASE 5 PHARMACY TRANSACTION INTEGRITY PROOF
## Forensic Concurrency & Stock Deduction Verification Report (PB-06)

**Audit Date:** 2026-11-05T12:25:23Z  
**Target Module:** `apps/api-gateway/src/routes/partner/pharmacy-pos-sentinel.routes.ts`  
**Database Tables:** `public.pharmacy_pos_inventory_batches`, `public.pharmacy_pos_transactions`, `public.pharmacy_schedule_h1_register`  
**Test Script:** `scripts/test-pharmacy-concurrency.mjs`

---

## 1. Forensic Inspection: Vulnerability Identified in Phase 4 Baseline

In Phase 4 inspection, line 245 of `pharmacy-pos-sentinel.routes.ts` revealed a critical concurrency vulnerability:
```typescript
// VULNERABLE BASELINE (Phase 4):
await db.execute(sql`
  UPDATE pharmacy_pos_inventory_batches
  SET stock_qty = GREATEST(0, stock_qty - ${item.quantity})
  WHERE tenant_id = ${tenantId} AND batch_number = ${item.batchNumber}
`);
```
### Defect Impact:
1. **Overselling / Race Condition:** If two cashiers concurrently submitted checkouts for the final 1 unit in stock, both requests would read `stock_qty = 1`. Both would issue the `UPDATE` clamped by `GREATEST(0, ...)`, decrementing stock to 0 while generating **two separate successful invoices** for 1 physical unit!
2. **Missing Transaction Boundaries:** Operations were not wrapped in `db.transaction()`, meaning payment/transaction record creation and stock deduction could decouple during network or DB failure.
3. **Swallowed Errors:** Errors were caught and logged as warnings, returning HTTP 201 even when stock deduction failed!

---

## 2. Hardened Remediation Implementation

The route `POST /api/v1/partner/pharmacy-pos/bill/checkout` was completely restructured with strict atomic guarantees:

1. **Transaction Boundary:** Wrapped inside `await db.transaction(async (tx) => { ... })`. Any validation failure or stock deficiency triggers automatic PostgreSQL rollback.
2. **Row Lock via `FOR UPDATE`:**
   ```sql
   SELECT id, tenant_id, item_code, batch_number, expiry_date, stock_qty, is_schedule_h1, is_narcotic
   FROM pharmacy_pos_inventory_batches
   WHERE tenant_id = ${tenantId} AND batch_number = ${item.batchNumber}
   FOR UPDATE
   ```
   Ensures sequential execution when multiple cashiers query the same batch simultaneously.
3. **Expiry Validation:** Strictly checks if batch expiry date is in the past:
   ```typescript
   if (expDate < todayStr) {
     throw new Error(`BATCH_EXPIRED: Batch ${item.batchNumber} expired on ${expDate}. Dispensing is strictly prohibited.`);
   }
   ```
4. **Non-Negative Stock Guard:**
   ```typescript
   if (currentStock < item.quantity) {
     throw new Error(`INSUFFICIENT_STOCK: Batch ${item.batchNumber} has only ${currentStock} units available, requested ${item.quantity}.`);
   }
   ```
5. **Atomic Conditional Update:**
   ```sql
   UPDATE pharmacy_pos_inventory_batches
   SET stock_qty = stock_qty - ${item.quantity}
   WHERE id = ${batchRow.id} AND stock_qty >= ${item.quantity}
   RETURNING stock_qty
   ```
6. **Statutory CDSCO Compliance:** Schedule H1 & Schedule X narcotics dual-signature audit register enforced on controlled substances.

---

## 3. Real Live Concurrency Test Execution Log

Test script `scripts/test-pharmacy-concurrency.mjs` was executed against live PostgreSQL on port 5432 and API Gateway on port 4000.

### Test Setup:
- Test Batch: `B-CONCURRENCY-FINAL-UNIT`
- Initial Stock: Exactly **1 unit**
- Cashier 1: Counter 1 - Suman Rao (Requests 1 unit)
- Cashier 2: Counter 2 - Deepak Patel (Requests 1 unit)
- Execution: Fired simultaneously via `Promise.all([cashier1, cashier2])`

### Execution Console Output:
```
--- PB-06 PHARMACY CONCURRENCY & STOCK DEDUCTION INTEGRITY TEST ---
Initial Database Batch State: {
  batch_number: 'B-CONCURRENCY-FINAL-UNIT',
  stock_qty: 1,
  expiry_date: 2028-12-30T18:30:00.000Z
}

[RACE CONDITION INITIATION] Cashier 1 & Cashier 2 simultaneously checkout 1 unit each...

Cashier 1 Result: Status HTTP 409 {
  success: false,
  error: 'INSUFFICIENT_STOCK',
  message: 'INSUFFICIENT_STOCK: Batch B-CONCURRENCY-FINAL-UNIT has only 0 units available, requested 1.'
}
Cashier 2 Result: Status HTTP 201 {
  success: true,
  message: 'Pharmacy bill settled. Perpetual inventory deducted and thermal receipt generated.',
  data: {
    invoiceNumber: 'PHARM-INV-MW3IQQ49',
    patientName: 'Sunita Sharma (Cashier 2)',
    itemCount: 1,
    grossAmount: 100,
    netAmount: 100,
    paymentMode: 'CASH_COUNTER',
    escposRasterPrinterReady: true,
    itemDeductions: [ [Object] ],
    timestamp: '2026-11-05T12:25:23.497Z'
  }
}

--- VERIFICATION OF CONCURRENCY CONTRACT ---
1. Exactly one HTTP 201 Created: PASS (Confirmed)
2. Exactly one HTTP 409 Conflict: PASS (Confirmed)
Post-Checkout Batch State in Database: {
  batch_number: 'B-CONCURRENCY-FINAL-UNIT',
  stock_qty: 0,
  expiry_date: 2028-12-30T18:30:00.000Z
}
3. Batch Stock Exactly 0 (No Negative Stock): PASS (Confirmed)
4. Transactions Recorded in Database: 1 (Expected exactly 1)
┌─────────┬──────────────────────┬─────────────────────────────┬──────────────┬────────────┬────────────────┬────────────────────────────────────┬──────────────────────────┐
│ (index) │ invoice_number       │ patient_name                │ gross_amount │ net_amount │ payment_mode   │ cashier_name                       │ created_at               │
├─────────┼──────────────────────┼─────────────────────────────┼──────────────┼────────────┼────────────────┼────────────────────────────────────┼──────────────────────────┤
│ 0       │ 'PHARM-INV-MW3IQQ49' │ 'Sunita Sharma (Cashier 2)' │ '100.00'     │ '100.00'   │ 'CASH_COUNTER' │ 'Cashier Counter 2 - Deepak Patel' │ 2026-11-05T12:25:23.448Z │
└─────────┴──────────────────────┴─────────────────────────────┴──────────────┴────────────┴────────────────┴────────────────────────────────────┴──────────────────────────┘

🏆 PB-06 PHARMACY CONCURRENCY & ZERO NEGATIVE STOCK AUDIT PASSED!
```

---

## 4. Verification Proof & Audit Invariants

1. **Deterministic Mutual Exclusion:** Exactly one cashier transaction succeeded (HTTP 201) and exactly one cashier transaction was rejected (HTTP 409).
2. **Zero Negative Stock:** Database balance after checkout was verified as exactly `0` units. Inventory never went below zero.
3. **Transaction Rollback Proof:** The rejected checkout request did not create an orphaned invoice or partial deduction in `pharmacy_pos_transactions`. Exactly 1 invoice was persisted.
4. **Authoritative Ledger:** POS cart operates purely as transient client state; perpetual database batch balance is the sole authority.
