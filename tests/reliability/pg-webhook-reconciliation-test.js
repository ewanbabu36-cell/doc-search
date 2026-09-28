process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';
process.env['RAZORPAY_WEBHOOK_SECRET'] = 'test_rzp_webhook_secret_key_888';
process.env['PAYU_MERCHANT_SALT'] = 'test_payu_merchant_salt_999';

import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { setTestTransactionRunner, setTestDatabase } from '../../packages/database/dist/index.js';
import {
  generateRazorpaySignature,
  generatePayUResponseHash
} from '../../packages/auth/dist/index.js';

console.log('\n======================================================================');
console.log('💳 TEST SUITE 7 — AUTOMATED PAYMENT GATEWAY (PG) WEBHOOK RECONCILIATION');
console.log('======================================================================\n');

async function runPgWebhookTests() {
  const startTime = performance.now();
  let testsPassed = 0;
  let testsTotal = 0;

  // Mock In-Memory Store for isolated testing of transactions
  const mockStore = new Map();
  const mockTableStore = new Map();

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

  const getTableRecords = (tbl) => {
    const name = getTableName(tbl);
    if (!mockTableStore.has(name)) mockTableStore.set(name, new Map());
    return mockTableStore.get(name);
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
          if (ch.constructor?.name === 'Param' || (ch.brand && ch.value !== undefined)) {
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

  const createSelectChain = (tbl = null) => {
    let currentTable = tbl;
    let conditions = [];
    let limitN = null;

    const query = {
      from: (table) => {
        currentTable = table;
        return query;
      },
      where: (condition) => {
        conditions = extractConditions(condition);
        return query;
      },
      leftJoin: () => query,
      innerJoin: () => query,
      rightJoin: () => query,
      orderBy: () => query,
      limit: (n) => {
        limitN = n;
        return query;
      },
      for: () => query,
      then: (resolve, reject) => {
        try {
          let list = currentTable ? Array.from(getTableRecords(currentTable).values()) : Array.from(mockStore.values());
          if (conditions.length > 0) {
            list = list.filter((r) => {
              if (!r) return false;
              return conditions.every(({ colName, camelCol, val }) => {
                const itemVal = r[camelCol] !== undefined ? r[camelCol] : r[colName];
                return itemVal === val;
              });
            });
          }
          if (limitN !== null) {
            list = list.slice(0, limitN);
          }
          resolve(list);
        } catch (e) {
          reject(e);
        }
      }
    };
    return query;
  };

  const mockTx = {
    execute: async () => [],
    insert: (table) => ({
      values: (data) => {
        const id = data.id || `entity-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockStore.set(id, record);
        getTableRecords(table).set(id, record);
        const p = Promise.resolve([record]);
        p.returning = async () => [record];
        return p;
      }
    }),
    update: (table) => ({
      set: (data) => {
        const res = {
          where: (cond) => {
            const conditions = extractConditions(cond);
            const tblRecords = getTableRecords(table);
            const updatedList = [];
            for (const [id, rec] of tblRecords.entries()) {
              const matches = conditions.length === 0 || conditions.every(({ colName, camelCol, val }) => {
                const itemVal = rec[camelCol] !== undefined ? rec[camelCol] : rec[colName];
                return itemVal === val;
              });
              if (matches) {
                const updated = { ...rec, ...data, updatedAt: new Date() };
                tblRecords.set(id, updated);
                mockStore.set(id, updated);
                updatedList.push(updated);
              }
            }
            const p = Promise.resolve(updatedList);
            p.returning = async () => updatedList;
            return p;
          },
          returning: async () => [{ id: 'updated', ...data, updatedAt: new Date() }]
        };
        return res;
      }
    }),
    select: (cols) => createSelectChain()
  };

  setTestDatabase(mockTx);
  setTestTransactionRunner(async (context, cb) => {
    return await cb(mockTx);
  });

  const app = await buildApp();
  await app.ready();

  const tenantId = '00000000-0000-4000-8000-000000000001';
  const invoiceId = 'inv-test-pg-001';
  const invoiceNumber = 'INV-HOSP-123456';

  // Seed sample invoice in the mock store
  const sampleInvoice = {
    id: invoiceId,
    tenantId,
    partnerId: 'partner_01',
    organizationId: 'org_01',
    branchId: 'branch_01',
    invoiceNumber,
    patientId: 'patient_01',
    patientName: 'Aarav Mehta',
    encounterId: 'enc_01',
    totalAmount: 1500,
    patientPayableAmount: 1500,
    paidAmount: 0,
    balanceDue: 1500,
    status: 'PENDING_PAYMENT',
    items: [
      {
        id: 'item_01',
        invoiceId,
        serviceName: 'Cardiology Consultation',
        category: 'CONSULTATION',
        quantity: 1,
        unitPrice: 1500,
        totalPrice: 1500
      }
    ],
    payments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockStore.set(invoiceId, sampleInvoice);
  getTableRecords('billing_invoices').set(invoiceId, sampleInvoice);
  getTableRecords('billing_invoice_items').set('item_01', sampleInvoice.items[0]);
  getTableRecords('patients').set('patient_01', {
    id: 'patient_01',
    tenantId,
    firstName: 'Aarav',
    lastName: 'Mehta',
    mrn: 'MRN-2026-00891'
  });
  getTableRecords('encounters').set('enc_01', {
    id: 'enc_01',
    tenantId,
    facilityId: 'branch_01'
  });

  // --------------------------------------------------------------------------
  // Test Case 1: Valid Razorpay payment.captured Webhook
  // --------------------------------------------------------------------------
  testsTotal++;
  console.log('[+] Test 1: Valid Razorpay payment.captured Webhook (Auto-Settle Invoice)...');
  const rzpPaymentId = `pay_${Date.now()}`;
  const rzpPayloadObj = {
    entity: 'event',
    account_id: 'acc_rzp_test',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: rzpPaymentId,
          entity: 'payment',
          amount: 150000, // 1500.00 in paise
          currency: 'INR',
          status: 'captured',
          order_id: 'order_rzp_999',
          method: 'upi',
          email: 'patient.aarav@example.com',
          contact: '+919876543210',
          notes: {
            tenantId,
            invoiceId,
            invoiceNumber
          },
          created_at: Math.floor(Date.now() / 1000)
        }
      }
    }
  };

  const rzpRawBody = JSON.stringify(rzpPayloadObj);
  const rzpValidSig = generateRazorpaySignature(rzpRawBody, process.env['RAZORPAY_WEBHOOK_SECRET']);

  const rzpRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/billing/webhooks/razorpay',
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': rzpValidSig
    },
    payload: rzpRawBody
  });

  const rzpData = JSON.parse(rzpRes.payload);
  if (
    rzpRes.statusCode === 200 &&
    rzpData.status === 'ok' &&
    (rzpData.result?.invoice?.status === 'PAID' || rzpData.result?.invoice?.status === 'DISCHARGE_SETTLED') &&
    rzpData.result?.invoice?.paidAmount === 1500 &&
    rzpData.result?.receiptNumber
  ) {
    console.log(`    ➔ Status: HTTP ${rzpRes.statusCode} | Invoice Settled: PAID/DISCHARGE_SETTLED | Receipt: ${rzpData.result.receiptNumber} (PASS)`);
    testsPassed++;
  } else {
    console.error(`    ❌ FAIL: Unexpected Razorpay response:`, rzpRes.statusCode, rzpData);
  }

  // --------------------------------------------------------------------------
  // Test Case 2: Replay & Idempotency Deduplication (Same Webhook Received Twice)
  // --------------------------------------------------------------------------
  testsTotal++;
  console.log('\n[+] Test 2: Replay & Idempotency Deduplication (Duplicate Webhook)...');
  // Seed the already recorded payment in the store to simulate replay
  const recordedPayment = {
    id: 'pmt-001',
    tenantId,
    invoiceId,
    referenceNumber: rzpPaymentId,
    amount: 1500,
    status: 'SUCCESS'
  };
  mockStore.set('pmt-001', recordedPayment);
  getTableRecords('billing_payments').set('pmt-001', recordedPayment);

  const replayRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/billing/webhooks/razorpay',
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': rzpValidSig
    },
    payload: rzpRawBody
  });

  const replayData = JSON.parse(replayRes.payload);
  if (replayRes.statusCode === 200 && replayData.result?.isDuplicate === true) {
    console.log(`    ➔ Status: HTTP ${replayRes.statusCode} | isDuplicate: true | No Double-Credit (PASS)`);
    testsPassed++;
  } else {
    console.error(`    ❌ FAIL: Expected isDuplicate = true on replay, got:`, replayData);
  }

  // --------------------------------------------------------------------------
  // Test Case 3: Invalid / Tampered Signature Rejection (Security Defense)
  // --------------------------------------------------------------------------
  testsTotal++;
  console.log('\n[+] Test 3: Tampered Signature Security Rejection (401 Unauthorized)...');
  const fakeSigRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/billing/webhooks/razorpay',
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': 'tampered_signature_hex_00000000000000000000000000000000'
    },
    payload: rzpRawBody
  });

  if (fakeSigRes.statusCode === 401) {
    console.log(`    ➔ Status: HTTP ${fakeSigRes.statusCode} | Rejected Tampered Signature (PASS)`);
    testsPassed++;
  } else {
    console.error(`    ❌ FAIL: Expected 401 on tampered signature, got HTTP ${fakeSigRes.statusCode}`);
  }

  // --------------------------------------------------------------------------
  // Test Case 4: Valid PayU Webhook Checksum Verification & Settlement
  // --------------------------------------------------------------------------
  testsTotal++;
  console.log('\n[+] Test 4: Valid PayU Webhook Checksum Verification (Auto-Settle)...');
  const payuInvoiceId = 'inv-test-payu-002';
  const payuInvoice = {
    id: payuInvoiceId,
    tenantId,
    partnerId: 'partner_01',
    organizationId: 'org_01',
    branchId: 'branch_01',
    invoiceNumber: 'INV-PAYU-789012',
    patientId: 'patient_02',
    totalAmount: 2500,
    patientPayableAmount: 2500,
    paidAmount: 0,
    balanceDue: 2500,
    status: 'PENDING_PAYMENT',
    items: [],
    payments: []
  };
  mockStore.set(payuInvoiceId, payuInvoice);
  getTableRecords('billing_invoices').set(payuInvoiceId, payuInvoice);

  const payuTxnId = `txnid_${Date.now()}`;
  const payuParams = {
    key: 'merchant_key_123',
    txnid: payuTxnId,
    amount: '2500.00',
    productinfo: 'Diagnostics Billing',
    firstname: 'Riya',
    email: 'riya@example.com',
    status: 'success',
    udf1: payuInvoiceId,
    udf2: 'INV-PAYU-789012',
    udf3: tenantId,
    udf4: '',
    udf5: '',
    mihpayid: `mih_${Date.now()}`
  };

  const payuHash = generatePayUResponseHash(payuParams, process.env['PAYU_MERCHANT_SALT']);
  payuParams.hash = payuHash;

  const payuRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/billing/webhooks/payu',
    headers: {
      'content-type': 'application/json'
    },
    payload: JSON.stringify(payuParams)
  });

  const payuData = JSON.parse(payuRes.payload);
  if (
    payuRes.statusCode === 200 &&
    (payuData.result?.invoice?.status === 'PAID' || payuData.result?.invoice?.status === 'DISCHARGE_SETTLED') &&
    payuData.result?.invoice?.paidAmount === 2500
  ) {
    console.log(`    ➔ Status: HTTP ${payuRes.statusCode} | PayU SHA-512 Verified & Settle Success (PASS)`);
    testsPassed++;
  } else {
    console.error(`    ❌ FAIL: Unexpected PayU response:`, payuRes.statusCode, payuData);
  }

  // --------------------------------------------------------------------------
  // Test Case 5: PayU Tampered Hash Rejection (401 Unauthorized)
  // --------------------------------------------------------------------------
  testsTotal++;
  console.log('\n[+] Test 5: PayU Tampered Hash Security Rejection (401 Unauthorized)...');
  const payuTamperedParams = { ...payuParams, hash: 'bad_hash_123456789' };
  const payuBadRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/billing/webhooks/payu',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify(payuTamperedParams)
  });

  if (payuBadRes.statusCode === 401) {
    console.log(`    ➔ Status: HTTP ${payuBadRes.statusCode} | Rejected Bad PayU Hash (PASS)`);
    testsPassed++;
  } else {
    console.error(`    ❌ FAIL: Expected 401 on bad PayU hash, got HTTP ${payuBadRes.statusCode}`);
  }

  // --------------------------------------------------------------------------
  // Test Case 6: Razorpay payment.failed Event Handling
  // --------------------------------------------------------------------------
  testsTotal++;
  console.log('\n[+] Test 6: Razorpay payment.failed Event Graceful Handling...');
  const rzpFailObj = {
    entity: 'event',
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_fail_${Date.now()}`,
          amount: 50000,
          status: 'failed',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment was declined by the bank',
          notes: {
            tenantId,
            invoiceId
          }
        }
      }
    }
  };
  const rzpFailRaw = JSON.stringify(rzpFailObj);
  const rzpFailSig = generateRazorpaySignature(rzpFailRaw, process.env['RAZORPAY_WEBHOOK_SECRET']);

  const rzpFailRes = await app.inject({
    method: 'POST',
    url: '/api/v1/partner/billing/webhooks/razorpay',
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': rzpFailSig
    },
    payload: rzpFailRaw
  });

  const rzpFailData = JSON.parse(rzpFailRes.payload);
  if (rzpFailRes.statusCode === 200 && rzpFailData.result?.success === true) {
    console.log(`    ➔ Status: HTTP ${rzpFailRes.statusCode} | Failure Recorded Gracefully Without Crash (PASS)`);
    testsPassed++;
  } else {
    console.error(`    ❌ FAIL: Unexpected failed event response:`, rzpFailRes.statusCode, rzpFailData);
  }

  await app.close();

  const elapsed = (performance.now() - startTime).toFixed(2);
  console.log('\n======================================================================');
  console.log(`🏁 TEST EXECUTION COMPLETE: ${testsPassed} / ${testsTotal} TESTS PASSED in ${elapsed}ms`);
  console.log('======================================================================\n');

  if (testsPassed !== testsTotal) {
    process.exit(1);
  }
}

runPgWebhookTests().catch((err) => {
  console.error('Test suite failed with unexpected exception:', err);
  process.exit(1);
});
