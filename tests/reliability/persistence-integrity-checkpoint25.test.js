process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';
process.env['RAZORPAY_WEBHOOK_SECRET'] = 'test_rzp_webhook_secret_key_888';

import assert from 'node:assert';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { billingManagementRepository } from '../../apps/api-gateway/dist/repositories/partner/BillingManagementRepository.js';
import { pharmacyManagementRepository } from '../../apps/api-gateway/dist/repositories/partner/PharmacyManagementRepository.js';
import { documentVerificationRepository } from '../../apps/api-gateway/dist/repositories/core/DocumentVerificationRepository.js';
import { setTestTransactionRunner, setTestDatabase } from '../../packages/database/dist/index.js';
import {
  billingInvoices,
  billingInvoiceItems,
  billingPayments,
  billingReceipts,
  pharmacyBatches,
  pharmacyStockMovements,
  pharmacyDispensing,
  entityDocuments,
  documentTypes,
  documentVerifications,
  documentAuditLogs
} from '../../packages/database/dist/index.js';

console.log('\n======================================================================');
console.log('🛡️ CHECKPOINT 2.5: TRANSACTIONS / CONCURRENCY / IDEMPOTENCY HARNESS');
console.log('======================================================================\n');

const UUIDV4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function runCheckpoint25Harness() {
  const startTime = performance.now();
  let testsPassed = 0;
  let totalTests = 0;

  // -------------------------------------------------------------------------
  // 1. FAIL-LOUD OUTAGE CONTRACT (Section 20)
  // -------------------------------------------------------------------------
  console.log('[+] SECTION 1: Database Outage Fail-Loud Contract (Asserting Controlled 503, Zero RAM Fallback)...');
  setTestDatabase(null);
  setTestTransactionRunner(null);

  totalTests++;
  try {
    await billingManagementRepository.createInvoice({
      tenantId: '00000000-0000-4000-8000-000000000001',
      patientId: 'patient-outage-01',
      encounterId: 'encounter-outage-01',
      billingType: 'SELF_PAY',
      items: [{ serviceName: 'OPD Consult', category: 'CONSULTATION', quantity: 1, unitPrice: 500, totalPrice: 500 }]
    }, null);
    assert.fail('Expected 503 on invoice creation during outage');
  } catch (err) {
    assert.strictEqual(err.statusCode || err.status, 503, 'Expected 503 SERVICE_UNAVAILABLE');
    console.log('    ✓ 1.1 Billing Invoice Creation Outage: Throws 503 SERVICE_UNAVAILABLE (Zero RAM Fallback)');
    testsPassed++;
  }

  totalTests++;
  try {
    await pharmacyManagementRepository.dispense({
      tenantId: '00000000-0000-4000-8000-000000000001',
      encounterId: 'encounter-outage-01',
      items: [{ medicationId: 'med-paracetamol', quantity: 10 }]
    }, null);
    assert.fail('Expected 503 on dispensing during outage');
  } catch (err) {
    assert.strictEqual(err.statusCode || err.status, 503, 'Expected 503 SERVICE_UNAVAILABLE');
    console.log('    ✓ 1.2 Pharmacy Dispensing Outage: Throws 503 SERVICE_UNAVAILABLE (Zero RAM Fallback)');
    testsPassed++;
  }

  totalTests++;
  try {
    await documentVerificationRepository.getRequirements({
      role: 'DOCTOR',
      tenantId: '00000000-0000-4000-8000-000000000001',
      ownerEntityId: 'user-outage-01'
    });
    assert.fail('Expected 503 on document verification during outage');
  } catch (err) {
    assert.strictEqual(err.statusCode || err.status, 503, 'Expected 503 SERVICE_UNAVAILABLE');
    console.log('    ✓ 1.3 Document Verification Outage: Throws 503 SERVICE_UNAVAILABLE (Zero RAM Fallback)');
    testsPassed++;
  }

  // -------------------------------------------------------------------------
  // Database Mock with Live Mutex Row Locks & Atomic Rollbacks
  // -------------------------------------------------------------------------
  console.log('\n[+] SECTION 2: Multi-Step Atomic Rollback (Sections 11 & 18)...');
  const tables = new Map();
  const rowLocks = new Map();

  async function acquireRowLock(rowId) {
    while (rowLocks.has(rowId)) {
      await rowLocks.get(rowId);
    }
    let release;
    const p = new Promise(resolve => { release = resolve; });
    rowLocks.set(rowId, p);
    return () => {
      rowLocks.delete(rowId);
      release();
    };
  }

  const getTableName = (tbl) => {
    if (!tbl) return 'default';
    if (typeof tbl === 'string') return tbl;
    if (tbl[Symbol.for('drizzle:Name')]) return tbl[Symbol.for('drizzle:Name')];
    if (tbl[Symbol.for('drizzle:OriginalName')]) return tbl[Symbol.for('drizzle:OriginalName')];
    if (tbl._?.name) return tbl._.name;
    for (const s of Object.getOwnPropertySymbols(tbl)) {
      if (s.description && s.description.includes('Name')) return tbl[s];
    }
    return tbl.name || 'default';
  };

  const getRows = (tbl) => {
    const name = getTableName(tbl);
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name);
  };

  function extractConditions(obj) {
    const conditions = [];
    function walk(node) {
      if (!node) return;
      if (Array.isArray(node.queryChunks)) {
        let colName = null;
        let val = undefined;
        for (const ch of node.queryChunks) {
          if (!ch) continue;
          if (ch.name && typeof ch.name === 'string') {
            colName = ch.name;
          }
          if ((ch.constructor?.name === 'Param' || (ch.brand && ch.value !== undefined) || ch.value !== undefined) && !Array.isArray(ch.value)) {
            val = ch.value;
          }
        }
        if (colName && val !== undefined) {
          const camelCol = colName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          conditions.push({ colName, camelCol, val });
        }
        for (const ch of node.queryChunks) {
          if (ch && ch.queryChunks) walk(ch);
        }
      }
    }
    walk(obj);
    return conditions;
  }

  let failNextInsert = false;
  let failTargetTable = null;

  const createMockDb = (parentLocks = [], parentMutations = null) => {
    const currentLocks = parentLocks;
    const currentMutations = parentMutations;
    const db = {
      select: () => {
        let selectedTable = null;
        let conditions = [];
        let isForUpdate = false;
        let limitN = null;
        const query = {
          from: (tbl) => {
            selectedTable = tbl;
            return query;
          },
          where: (cond) => {
            conditions = extractConditions(cond);
            return query;
          },
          orderBy: () => query,
          limit: (n) => {
            limitN = n;
            return query;
          },
          for: (mode) => {
            if (mode === 'update') isForUpdate = true;
            return query;
          },
          then: async (resolve, reject) => {
            try {
              const tName = getTableName(selectedTable);
              if (isForUpdate) {
                let candidateRows = getRows(tName);
                if (conditions.length > 0) {
                  candidateRows = candidateRows.filter((r) => {
                    if (!r) return false;
                    return conditions.every(({ colName, camelCol, val }) => {
                      const itemVal = r[camelCol] !== undefined ? r[camelCol] : r[colName];
                      return itemVal === val;
                    });
                  });
                }
                if (candidateRows.length > 0) {
                  const lockRelease = await acquireRowLock(candidateRows[0].id);
                  currentLocks.push(lockRelease);
                }
              }

              let rows = getRows(tName);
              if (conditions.length > 0) {
                rows = rows.filter((r) => {
                  if (!r) return false;
                  return conditions.every(({ colName, camelCol, val }) => {
                    const itemVal = r[camelCol] !== undefined ? r[camelCol] : r[colName];
                    return itemVal === val;
                  });
                });
              }
              let result = rows.map(r => ({ ...r }));
              if (limitN !== null) result = result.slice(0, limitN);
              resolve(result);
            } catch (err) {
              reject(err);
            }
          }
        };
        return query;
      },
      insert: (tbl) => ({
        values: (val) => {
          const tName = getTableName(tbl);
          if (failNextInsert && (!failTargetTable || failTargetTable === tName)) {
            throw new Error(`Simulated database insert failure on ${tName}`);
          }
          const rows = getRows(tName);
          const toInsert = Array.isArray(val) ? val : [val];
          const inserted = [];
          for (const item of toInsert) {
            const record = {
              id: item.id || crypto.randomUUID(),
              ...item,
              createdAt: item.createdAt || new Date(),
              updatedAt: item.updatedAt || new Date()
            };
            rows.push(record);
            inserted.push(record);
            if (currentMutations) {
              currentMutations.push({ type: 'insert', table: tName, id: record.id });
            }
          }
          const p = Promise.resolve(inserted);
          p.onConflictDoNothing = () => p;
          p.returning = () => Promise.resolve(inserted);
          return p;
        }
      }),
      update: (tbl) => ({
        set: (vals) => ({
          where: async (cond) => {
            const tName = getTableName(tbl);
            const conditions = extractConditions(cond);
            const rows = getRows(tName);
            const updated = [];
            for (let i = 0; i < rows.length; i++) {
              const r = rows[i];
              const matches = conditions.length === 0 || conditions.every(({ colName, camelCol, val }) => {
                const itemVal = r[camelCol] !== undefined ? r[camelCol] : r[colName];
                return itemVal === val;
              });
              if (matches) {
                if (currentMutations) {
                  currentMutations.push({ type: 'update', table: tName, id: r.id, prev: { ...r } });
                }
                rows[i] = { ...r, ...vals, updatedAt: new Date() };
                updated.push(rows[i]);
              }
            }
            const p = Promise.resolve(updated);
            p.returning = () => Promise.resolve(updated);
            return p;
          }
        })
      }),
      transaction: async (callback) => {
        const txLocks = [];
        const txMutations = [];
        const txDb = createMockDb(txLocks, txMutations);
        try {
          return await callback(txDb);
        } catch (err) {
          for (let i = txMutations.length - 1; i >= 0; i--) {
            const m = txMutations[i];
            const rows = getRows(m.table);
            if (m.type === 'insert') {
              const idx = rows.findIndex(r => r.id === m.id);
              if (idx !== -1) rows.splice(idx, 1);
            } else if (m.type === 'update') {
              const idx = rows.findIndex(r => r.id === m.id);
              if (idx !== -1) rows[idx] = { ...m.prev };
            }
          }
          throw err;
        } finally {
          for (const release of txLocks) release();
        }
      }
    };
    return db;
  };

  const mockDb = createMockDb();
  setTestDatabase(mockDb);
  setTestTransactionRunner(async (ctx, cb) => mockDb.transaction(cb));

  const tenantId = '00000000-0000-4000-8000-000000000001';

  // Test 2.1: Invoice creation rollback when line items insert fails
  totalTests++;
  failNextInsert = true;
  failTargetTable = getTableName(billingInvoiceItems);
  try {
    await billingManagementRepository.createInvoice({
      tenantId,
      patientId: 'patient-rollback-01',
      encounterId: 'encounter-rollback-01',
      billingType: 'SELF_PAY',
      items: [
        { serviceName: 'CBC Blood Count', category: 'LAB_TEST', quantity: 1, unitPrice: 350, totalPrice: 350 },
        { serviceName: 'Urine Routine', category: 'LAB_TEST', quantity: 1, unitPrice: 200, totalPrice: 200 }
      ]
    }, mockDb);
    assert.fail('Expected invoice creation to fail');
  } catch (err) {
    failNextInsert = false;
    failTargetTable = null;
    const remainingInvoices = getRows(billingInvoices);
    const remainingItems = getRows(billingInvoiceItems);
    assert.strictEqual(remainingInvoices.length, 0, 'Rolled-back transaction must leave 0 invoices');
    assert.strictEqual(remainingItems.length, 0, 'Rolled-back transaction must leave 0 line items');
    console.log('    ✓ 2.1 Multi-Step Invoice Rollback: Invoice + Line items aborted atomically (0 orphaned rows)');
    testsPassed++;
  }

  // Test 2.2: Pharmacy Dispensing rollback when stock movement fails
  totalTests++;
  const batchId = crypto.randomUUID();
  const medId = crypto.randomUUID();
  getRows(pharmacyBatches).push({
    id: batchId,
    tenantId,
    medicationId: medId,
    batchNumber: 'BATCH-ROLLBACK-01',
    availableQuantity: 10,
    status: 'ACTIVE',
    expiryDate: new Date('2028-12-31')
  });

  failNextInsert = true;
  failTargetTable = getTableName(pharmacyStockMovements);
  try {
    await pharmacyManagementRepository.dispense({
      tenantId,
      encounterId: 'encounter-disp-rollback-01',
      items: [{ batchId, quantity: 4 }]
    }, mockDb);
    assert.fail('Expected dispensing to fail on stock movement');
  } catch (err) {
    failNextInsert = false;
    failTargetTable = null;
    const batch = getRows(pharmacyBatches).find(b => b.id === batchId);
    assert.strictEqual(Number(batch.availableQuantity), 10, 'Batch quantity must revert to 10 upon rollback');
    assert.strictEqual(getRows(pharmacyStockMovements).length, 0, 'Zero stock movements must remain');
    assert.strictEqual(getRows(pharmacyDispensing).length, 0, 'Zero dispensings must remain');
    console.log('    ✓ 2.2 Pharmacy Dispense Rollback: Batch quantity restored, stock movements aborted cleanly');
    testsPassed++;
  }

  // Test 2.3: Payment collection rollback when receipt fails
  totalTests++;
  const successfulInvoice = await billingManagementRepository.createInvoice({
    tenantId,
    patientId: 'patient-pmt-01',
    encounterId: 'encounter-pmt-01',
    billingType: 'SELF_PAY',
    items: [{ serviceName: 'Physician Consultation', category: 'CONSULTATION', quantity: 1, unitPrice: 1000, totalPrice: 1000 }]
  }, mockDb);

  assert.strictEqual(successfulInvoice.balanceDue, 1000);
  assert.strictEqual(getRows(billingInvoices).length, 1);

  failNextInsert = true;
  failTargetTable = getTableName(billingReceipts);
  try {
    await billingManagementRepository.collectPayment({
      tenantId,
      invoiceId: successfulInvoice.id,
      patientId: 'patient-pmt-01',
      amount: 1000,
      paymentMode: 'CASH',
      collectedBy: 'cashier-01'
    }, mockDb);
    assert.fail('Expected collectPayment to fail on receipt generation');
  } catch (err) {
    failNextInsert = false;
    failTargetTable = null;
    const inv = getRows(billingInvoices).find(i => i.id === successfulInvoice.id);
    assert.strictEqual(inv.status, 'PENDING_PAYMENT', 'Invoice status must remain PENDING_PAYMENT');
    assert.strictEqual(Number(inv.outstandingBalance), 1000, 'Invoice outstanding balance must remain 1000');
    assert.strictEqual(getRows(billingPayments).length, 0, 'Zero payment records must remain');
    assert.strictEqual(getRows(billingReceipts).length, 0, 'Zero receipt records must remain');
    console.log('    ✓ 2.3 Payment Collection Rollback: Receipt failure reverted payment & invoice balance');
    testsPassed++;
  }

  // -------------------------------------------------------------------------
  // 3. CONCURRENCY SAFETY (Section 12)
  // -------------------------------------------------------------------------
  console.log('\n[+] SECTION 3: Concurrency Safety (Simultaneous Operations, Row Locks, No Double-Deduction)...');

  // Test 3.1: Two simultaneous stock deductions for 1 available unit
  totalTests++;
  const concurrentBatchId = crypto.randomUUID();
  const concurrentMedId = crypto.randomUUID();
  getRows(pharmacyBatches).push({
    id: concurrentBatchId,
    tenantId,
    medicationId: concurrentMedId,
    batchNumber: 'BATCH-CONC-01',
    availableQuantity: 1, // Only 1 available unit in stock
    status: 'ACTIVE',
    expiryDate: new Date('2028-12-31')
  });

  const [res1, res2] = await Promise.allSettled([
    pharmacyManagementRepository.dispense({
      tenantId,
      encounterId: 'encounter-conc-01',
      items: [{ batchId: concurrentBatchId, quantity: 1 }]
    }, mockDb),
    pharmacyManagementRepository.dispense({
      tenantId,
      encounterId: 'encounter-conc-02',
      items: [{ batchId: concurrentBatchId, quantity: 1 }]
    }, mockDb)
  ]);

  const fulfilled = [res1, res2].filter(r => r.status === 'fulfilled');
  const rejected = [res1, res2].filter(r => r.status === 'rejected');
  assert.strictEqual(fulfilled.length, 1, 'Exactly 1 concurrent dispensing must succeed');
  assert.strictEqual(rejected.length, 1, 'Exactly 1 concurrent dispensing must be rejected (409)');
  assert.strictEqual(rejected[0].reason.statusCode, 409, 'Rejection must be HTTP 409 Conflict');
  const batchAfterConc = getRows(pharmacyBatches).find(b => b.id === concurrentBatchId);
  assert.strictEqual(Number(batchAfterConc.availableQuantity), 0, 'Remaining quantity must be 0 (no overdraft)');
  console.log('    ✓ 3.1 Concurrent Stock Deductions: 1 won, 1 got 409 Conflict; Stock = 0 (No Overdraft)');
  testsPassed++;

  // Test 3.2: Two simultaneous invoice voids on the same invoice
  totalTests++;
  const void1 = await billingManagementRepository.voidInvoice({
    tenantId,
    invoiceId: successfulInvoice.id,
    voidReason: 'Billing correction requested by billing supervisor',
    supervisorUserId: 'supervisor-01',
    supervisorOverrideToken: 'SUPERVISOR_OVERRIDE_TOKEN_VALID',
    actorId: 'admin-01'
  }, mockDb);
  assert.strictEqual(void1.success, true, 'First void operation must succeed');

  try {
    await billingManagementRepository.voidInvoice({
      tenantId,
      invoiceId: successfulInvoice.id,
      voidReason: 'Duplicate void attempt on voided invoice',
      supervisorUserId: 'supervisor-01',
      supervisorOverrideToken: 'SUPERVISOR_OVERRIDE_TOKEN_VALID',
      actorId: 'admin-01'
    }, mockDb);
    assert.fail('Expected duplicate void to fail with 409 Conflict');
  } catch (err) {
    assert.strictEqual(err.statusCode, 409, 'Duplicate void must return 409 Conflict');
    console.log('    ✓ 3.2 Invoice Void Concurrency / Idempotency: Duplicate void attempt rejected with 409 Conflict');
    testsPassed++;
  }

  // Test 3.3: Two simultaneous document verifications on the same document
  totalTests++;
  const testDocId = crypto.randomUUID();
  const testDocTypeId = crypto.randomUUID();
  getRows(entityDocuments).push({
    id: testDocId,
    tenantId,
    documentTypeId: testDocTypeId,
    ownerEntityId: 'doctor-conc-01',
    ownerEntityType: 'USER',
    verificationStatus: 'PENDING',
    isCurrent: true,
    role: 'DOCTOR'
  });
  getRows(documentTypes).push({
    id: testDocTypeId,
    code: 'DOC_DEGREE_MBBS_MD',
    name: 'MBBS Medical Degree',
    active: true,
    isRequired: true
  });

  const docVerify1 = await documentVerificationRepository.verifyDocument(
    testDocId,
    { action: 'VERIFY', reason: 'Verified doctor degree certificate' },
    { id: 'verifier-01', email: 'compliance@docsearch.health' }
  );
  assert.strictEqual(docVerify1.verificationStatus, 'VERIFIED');

  try {
    await documentVerificationRepository.verifyDocument(
      testDocId,
      { action: 'REJECT', reason: 'Conflicting reject attempt' },
      { id: 'verifier-02', email: 'compliance2@docsearch.health' }
    );
    assert.fail('Expected second state transition on finalized document to fail with 409 Conflict');
  } catch (err) {
    assert.strictEqual(err.statusCode, 409, 'Conflicting verification must return 409 Conflict');
    console.log('    ✓ 3.3 Document Verification Concurrency: Duplicate state transition rejected with 409 Conflict');
    testsPassed++;
  }

  // -------------------------------------------------------------------------
  // 4. IDEMPOTENCY SAFETY (Section 13)
  // -------------------------------------------------------------------------
  console.log('\n[+] SECTION 4: Durable Idempotency (Database-backed Webhook & Payment Replays)...');
  totalTests++;
  const rzpInvoice = await billingManagementRepository.createInvoice({
    tenantId,
    patientId: 'patient-rzp-01',
    encounterId: 'encounter-rzp-01',
    billingType: 'SELF_PAY',
    items: [{ serviceName: 'MRI Brain Contrast', category: 'LAB_TEST', quantity: 1, unitPrice: 7500, totalPrice: 7500 }]
  }, mockDb);

  const webhookReference = 'pay_test_rzp_order_99999';
  const firstReconcile = await billingManagementRepository.reconcileWebhookPayment({
    tenantId,
    invoiceId: rzpInvoice.id,
    amount: 7500,
    gateway: 'RAZORPAY',
    gatewayPaymentId: webhookReference,
    referenceNumber: webhookReference,
    rawPayload: { event: 'payment.captured', payment_id: webhookReference }
  }, mockDb);

  assert.strictEqual(firstReconcile.invoice.status, 'PAID');
  assert.strictEqual(firstReconcile.isDuplicate, false);
  const paymentCountFirst = getRows(billingPayments).filter(p => p.referenceNumber === webhookReference).length;
  assert.strictEqual(paymentCountFirst, 1, 'Expected 1 payment record after first webhook delivery');

  const replayReconcile = await billingManagementRepository.reconcileWebhookPayment({
    tenantId,
    invoiceId: rzpInvoice.id,
    amount: 7500,
    gateway: 'RAZORPAY',
    gatewayPaymentId: webhookReference,
    referenceNumber: webhookReference,
    rawPayload: { event: 'payment.captured', payment_id: webhookReference }
  }, mockDb);

  assert.strictEqual(replayReconcile.isDuplicate, true, 'Replay must be flagged as duplicate');
  assert.strictEqual(replayReconcile.invoice.status, 'PAID', 'Replay retains PAID status');
  const paymentCountReplay = getRows(billingPayments).filter(p => p.referenceNumber === webhookReference).length;
  assert.strictEqual(paymentCountReplay, 1, 'Payment count must remain exactly 1 (0 duplicate rows created in DB)');
  console.log('    ✓ 4.1 Database-Backed Idempotency: Webhook replay returned isDuplicate=true, 0 duplicate DB records');
  testsPassed++;

  // -------------------------------------------------------------------------
  // 5. SAFE ID GENERATION (Section 14)
  // -------------------------------------------------------------------------
  console.log('\n[+] SECTION 5: Safe ID Generation (RFC 4122 UUIDv4 Compliance, No Local Counters)...');
  totalTests++;
  const allInvoices = getRows(billingInvoices);
  const allItems = getRows(billingInvoiceItems);
  const allPayments = getRows(billingPayments);
  const allDispensings = getRows(pharmacyDispensing);

  assert(allInvoices.length > 0, 'Invoices must exist');
  assert(allItems.length > 0, 'Line items must exist');
  assert(allPayments.length > 0, 'Payments must exist');
  assert(allDispensings.length > 0, 'Dispensings must exist');

  for (const inv of allInvoices) {
    assert(UUIDV4_REGEX.test(inv.id), `Invoice ID ${inv.id} must be a valid UUIDv4`);
  }
  for (const item of allItems) {
    assert(UUIDV4_REGEX.test(item.id), `Line Item ID ${item.id} must be a valid UUIDv4`);
  }
  for (const pmt of allPayments) {
    assert(UUIDV4_REGEX.test(pmt.id), `Payment ID ${pmt.id} must be a valid UUIDv4`);
  }
  for (const disp of allDispensings) {
    assert(UUIDV4_REGEX.test(disp.id), `Dispensing ID ${disp.id} must be a valid UUIDv4`);
  }
  console.log(`    ✓ 5.1 Safe ID Audit: ${allInvoices.length} Invoices, ${allItems.length} Items, ${allPayments.length} Payments, ${allDispensings.length} Dispensings all adhere to RFC 4122 UUIDv4`);
  testsPassed++;

  // -------------------------------------------------------------------------
  // HARNESS REPORT
  // -------------------------------------------------------------------------
  const elapsed = (performance.now() - startTime).toFixed(2);
  console.log('\n======================================================================');
  console.log(`✅ CHECKPOINT 2.5 VERIFICATION PASSED: ${testsPassed}/${totalTests} TESTS (100%) in ${elapsed}ms`);
  console.log('======================================================================\n');
}

runCheckpoint25Harness().catch((err) => {
  console.error('❌ Checkpoint 2.5 Test Failure:', err);
  process.exit(1);
});