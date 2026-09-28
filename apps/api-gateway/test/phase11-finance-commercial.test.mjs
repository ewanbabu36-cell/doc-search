import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  getDatabase,
  TEST_SEEDS,
  partnerProfiles,
  subscriptions,
  licenses,
  billingInvoices,
  billingFinancialTransactions,
  billingAuditTraces,
  billingCashierSessions,
  billingEodClosings,
  billingReconciliations,
  billingPackages,
  patientPackages,
  patientCreditAccounts,
  purchaseInvoices,
  gstTaxRates,
  plans,
  eq,
  or
} from '@docsearch/database';

describe('DOC SEARCH Phase 11 — Finance + Commercial Control Layer Verification Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  // Tenant A: Primary Hospital Partner
  const TENANT_A = TEST_SEEDS.TENANT_A;
  const BRANCH_A = TEST_SEEDS.BRANCH_A;
  const FINANCE_OFFICER_A = 'ffffffff-1111-4fff-8fff-111111111111';
  const CASHIER_A = 'cccccccc-1111-4ccc-8ccc-111111111111';
  const SUPERVISOR_A = 'ssssssss-1111-4sss-8sss-111111111111';

  // Tenant B: Secondary Partner (Multi-Tenant & Zero-State tests)
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const BRANCH_B = TEST_SEEDS.FACILITY_ID_B;
  const FINANCE_OFFICER_B = 'ffffffff-2222-4fff-8fff-222222222222';

  // HQ Admin Actor
  const HQ_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

  function createFinanceToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || FINANCE_OFFICER_A,
      email: overrides.email || 'finance@apollo.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      roles: overrides.roles || ['FINANCE_OFFICER', 'BILLING_EXECUTIVE'],
      permissions: overrides.permissions || [
        'billing:invoices:create',
        'billing:invoices:read',
        'billing:invoices:update',
        'billing:payments:create',
        'billing:payments:read',
        'billing:reports:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createSupervisorToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || SUPERVISOR_A,
      email: overrides.email || 'supervisor@apollo.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      roles: ['SUPERVISOR', 'HOSPITAL_ADMIN'],
      permissions: [
        'billing:invoices:create',
        'billing:invoices:read',
        'billing:invoices:update',
        'billing:payments:create',
        'billing:payments:read',
        'billing:reports:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createHqAdminToken() {
    const claims = {
      sub: HQ_ADMIN_ID,
      email: 'finance-hq@docsearch.internal',
      tenantId: '00000000-0000-4000-8000-000000000000',
      branchId: '00000000-0000-4000-8000-000000000000',
      roles: ['HQ_FINANCE_ADMIN', 'SUPER_ADMIN'],
      permissions: ['*'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let testPatientId = '33333333-3333-4333-8333-333333333333';
  let testInvoiceId;
  let testPackageId;
  let testPatientPackageId;
  let testShiftId;
  let testEodId;
  let testPayableId;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';

    const db = getDatabase();

    // Ensure Tenant A partner profile exists
    await db
      .update(partnerProfiles)
      .set({
        partnerType: 'HOSPITAL',
        metadata: { partnerType: 'HOSPITAL', facilityType: 'HOSPITAL' }
      })
      .where(eq(partnerProfiles.tenantId, TENANT_A));

    app = await buildApp({ db: testDb });
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  // =========================================================================
  // 1. TAX ENGINE & GST COMPLIANCE
  // =========================================================================
  it('STEP 1: GET /api/v1/partner/billing/tax-rates returns configured GST rates', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/billing/tax-rates',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 4);

    const categories = body.data.map((r) => r.taxCategory);
    assert.ok(categories.includes('CONSULTATION') || categories.includes('HEALTHCARE_EXEMPT'));
    assert.ok(categories.includes('PHARMACY'));
  });

  it('STEP 2: POST /api/v1/partner/billing/tax-rates/calculate calculates intra-state and inter-state GST correctly', async () => {
    const token = createFinanceToken();

    // Intra-state (CGST + SGST split 50/50 on 5% Pharmacy item)
    const intraRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/tax-rates/calculate',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        isInterstate: false,
        items: [
          {
            serviceName: 'OPD Doctor Consultation',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
            taxCategory: 'HEALTHCARE_EXEMPT'
          },
          {
            serviceName: 'Prescription Antibiotics',
            category: 'PHARMACY',
            quantity: 2,
            unitPrice: 500,
            totalPrice: 1000,
            taxCategory: 'PHARMACY'
          }
        ]
      }
    });

    assert.strictEqual(intraRes.statusCode, 200);
    const intraBody = JSON.parse(intraRes.payload);
    assert.strictEqual(intraBody.success, true);
    assert.strictEqual(intraBody.data.subtotal, 2000);
    assert.strictEqual(intraBody.data.taxTotal, 50);
    assert.strictEqual(intraBody.data.cgstTotal, 25);
    assert.strictEqual(intraBody.data.sgstTotal, 25);
    assert.strictEqual(intraBody.data.igstTotal, 0);
    assert.strictEqual(intraBody.data.totalAmount, 2050);

    // Inter-state (100% IGST)
    const interRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/tax-rates/calculate',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        isInterstate: true,
        items: [
          {
            serviceName: 'Medical Consumables',
            category: 'PHARMACY',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
            taxCategory: 'PHARMACY'
          }
        ]
      }
    });

    assert.strictEqual(interRes.statusCode, 200);
    const interBody = JSON.parse(interRes.payload);
    assert.strictEqual(interBody.data.igstTotal, 50);
    assert.strictEqual(interBody.data.cgstTotal, 0);
    assert.strictEqual(interBody.data.sgstTotal, 0);
  });

  // =========================================================================
  // 2. AUTHORITATIVE INVOICING & APPEND-ONLY LEDGER
  // =========================================================================
  it('STEP 3: POST /api/v1/partner/billing/invoices creates invoice with server-calculated taxes & writes to GL ledger', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        patientName: 'Priya Sharma',
        patientMrn: 'MRN-2026-00101',
        billingType: 'SELF_PAY',
        isInterstate: false,
        items: [
          {
            serviceName: 'Senior Cardiologist OPD Consultation',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 1500,
            totalPrice: 1500,
            sacCode: '999312'
          },
          {
            serviceName: 'ECG 12-Lead Diagnostic',
            category: 'LAB_TEST',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
            sacCode: '999313'
          }
        ]
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.ok(body.data.invoiceNumber.startsWith('INV-'));
    assert.strictEqual(body.data.totalAmount, 2000);
    assert.strictEqual(body.data.balanceDue, 2000);
    assert.strictEqual(body.data.status, 'PENDING_PAYMENT');

    testInvoiceId = body.data.id;

    // Verify append-only GL transaction was created in PostgreSQL
    const db = getDatabase();
    const transactions = await db
      .select()
      .from(billingFinancialTransactions)
      .where(eq(billingFinancialTransactions.referenceId, testInvoiceId));

    assert.ok(transactions.length >= 1);
    assert.strictEqual(transactions[0].transactionType, 'INVOICE');
    assert.strictEqual(parseFloat(transactions[0].debit ?? transactions[0].debitAmount), 2000);

    // Verify audit trace in PostgreSQL
    const traces = await db
      .select()
      .from(billingAuditTraces)
      .where(eq(billingAuditTraces.invoiceId, testInvoiceId));

    assert.ok(traces.length >= 1);
    assert.strictEqual(traces[0].operation ?? traces[0].action, 'INVOICE_CREATED');
  });

  // =========================================================================
  // 3. CASHIER SHIFT MANAGEMENT & VARIANCE TRACKING
  // =========================================================================
  it('STEP 4: POST /api/v1/partner/billing/shifts/open opens an active cashier shift', async () => {
    const token = createFinanceToken({ userId: CASHIER_A });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/shifts/open',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        cashierName: 'Aarav Cashier',
        openingBalance: 500,
        notes: 'Morning OPD Shift Opening'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.status, 'OPEN');
    assert.strictEqual(parseFloat(body.data.openingBalance), 500);

    testShiftId = body.data.id;
  });

  it('STEP 5: POST /api/v1/partner/billing/shifts/open rejects opening duplicate concurrent shift for same cashier', async () => {
    const token = createFinanceToken({ userId: CASHIER_A });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/shifts/open',
      headers: { Authorization: `Bearer ${token}` },
      payload: { openingBalance: 1000 }
    });

    assert.strictEqual(res.statusCode, 400);
  });

  // =========================================================================
  // 4. PAYMENT COLLECTION & SHIFT MOVEMENT
  // =========================================================================
  it('STEP 6: POST /api/v1/partner/billing/invoices/:id/payments collects payment and updates shift movement', async () => {
    const token = createFinanceToken({ userId: CASHIER_A });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${testInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 2000,
        paymentMode: 'CASH',
        transactionReference: 'CASH-REC-001'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.invoice.status, 'PAID');
    assert.strictEqual(body.data.invoice.balanceDue, 0);
    assert.strictEqual(body.data.invoice.paidAmount, 2000);

    // Verify shift movement in database
    const db = getDatabase();
    const [shift] = await db
      .select()
      .from(billingCashierSessions)
      .where(eq(billingCashierSessions.id, testShiftId));

    assert.strictEqual(parseFloat(shift.cashReceived), 2000);
    assert.strictEqual(parseFloat(shift.expectedClosingBalance), 2500); // 500 opening + 2000 cash
  });

  // =========================================================================
  // 5. SUPERVISOR REFUND & LEDGER REVERSAL
  // =========================================================================
  it('STEP 7: POST /api/v1/partner/billing/invoices/:id/refund rejects without supervisor override', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${testInvoiceId}/refund`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 500,
        reason: 'Service cancellation requested by patient'
      }
    });

    // In a PAID invoice, refund requires supervisor token
    assert.ok(res.statusCode === 400 || res.statusCode === 403);
  });

  it('STEP 8: POST /api/v1/partner/billing/invoices/:id/refund processes supervisor-authorized refund with GL reversal', async () => {
    const supervisorToken = createSupervisorToken();
    const token = createFinanceToken({ userId: CASHIER_A });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${testInvoiceId}/refund`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 500,
        reason: 'ECG machine calibration check - service cancelled',
        supervisorOverrideToken: supervisorToken
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.amount, 500);

    // Verify financial transaction GL reversal
    const db = getDatabase();
    const glRefunds = await db
      .select()
      .from(billingFinancialTransactions)
      .where(or(
        eq(billingFinancialTransactions.transactionType, 'REFUND'),
        eq(billingFinancialTransactions.transactionType, 'REFUND_PROCESSED')
      ));

    assert.ok(glRefunds.length >= 1);
    assert.strictEqual(parseFloat(glRefunds[0].debit ?? glRefunds[0].debitAmount), 500);
  });

  // =========================================================================
  // 6. CASHIER SHIFT CLOSING & RECONCILIATION
  // =========================================================================
  it('STEP 9: POST /api/v1/partner/billing/shifts/:id/close closes shift with variance calculation & immutability', async () => {
    const token = createFinanceToken({ userId: CASHIER_A });

    // Expected closing: 500 opening + 2000 received - 500 refunded = 2000
    // Suppose actual counted cash is 2000 (Exact match)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/shifts/${testShiftId}/close`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        actualCash: 2000,
        notes: 'Shift balanced successfully at end of day'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.shift.status, 'RECONCILED');
    assert.strictEqual(body.data.variance, 0);
    assert.strictEqual(body.data.isBalanced, true);

    // Verify shift immutability: Cannot close again
    const recloseRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/shifts/${testShiftId}/close`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { actualCash: 2000 }
    });
    assert.strictEqual(recloseRes.statusCode, 400);
  });

  // =========================================================================
  // 7. END-OF-DAY (EOD) CLOSING
  // =========================================================================
  it('STEP 10: POST /api/v1/partner/billing/eod-closings/close creates daily multi-department financial closing snapshot', async () => {
    const token = createFinanceToken();
    const today = new Date().toISOString().split('T')[0];

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/eod-closings/close',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        closingDate: today,
        notes: 'End of Day closure for OPD and Diagnostics'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.closingDate, today);
    assert.strictEqual(body.data.status, 'CLOSED');
    assert.ok(parseFloat(body.data.grossBilling) >= 2000);

    testEodId = body.data.id;

    // Verify duplicate EOD closure is prevented for same date
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/eod-closings/close',
      headers: { Authorization: `Bearer ${token}` },
      payload: { closingDate: today }
    });
    assert.strictEqual(dupRes.statusCode, 400);
  });

  it('STEP 11: POST /api/v1/partner/billing/eod-closings/:id/reopen allows controlled supervisor reopen', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/eod-closings/${testEodId}/reopen`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        reopenReason: 'Emergency late night admission invoice entry required'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'REOPENED');
  });

  // =========================================================================
  // 8. BILLING PACKAGES & PATIENT CONSUMPTION
  // =========================================================================
  it('STEP 12: POST /api/v1/partner/billing/packages creates comprehensive care package', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/packages',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        packageName: 'Executive Health Checkup Premium',
        category: 'HEALTH_CHECKUP',
        totalPrice: 4500,
        validityDays: 180,
        items: [
          { serviceCode: 'SRV-CONS-01', serviceName: 'Physician Consultation', quantityIncluded: 2, unitPrice: 800 },
          { serviceCode: 'SRV-LAB-CBC', serviceName: 'Complete Blood Count', quantityIncluded: 1, unitPrice: 400 },
          { serviceCode: 'SRV-RAD-XRAY', serviceName: 'Chest X-Ray Digital', quantityIncluded: 1, unitPrice: 700 }
        ]
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.items.length, 3);

    testPackageId = body.data.id;
  });

  it('STEP 13: POST /api/v1/partner/billing/patient-packages/purchase records patient package purchase', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/patient-packages/purchase',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        packageId: testPackageId,
        notes: 'Purchased at Front Desk'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.status, 'ACTIVE');

    testPatientPackageId = body.data.id;
  });

  it('STEP 14: POST /api/v1/partner/billing/patient-packages/consume deducts package balance and guards against overdraft', async () => {
    const token = createFinanceToken();

    // Consume 1 consultation
    const consumeRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/patient-packages/consume',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientPackageId: testPatientPackageId,
        serviceCode: 'SRV-CONS-01',
        quantityConsumed: 1,
        notes: 'Dr. Consultation in OPD'
      }
    });

    assert.strictEqual(consumeRes.statusCode, 200);
    const consumeBody = JSON.parse(consumeRes.payload);
    assert.strictEqual(consumeBody.success, true);
    assert.strictEqual(consumeBody.data.quantityConsumed, 1);
    assert.strictEqual(consumeBody.data.remainingBalance, 1); // 2 - 1 = 1 remaining

    // Attempt to consume 2 more consultations (Available: 1, Requested: 2 -> Rejection expected)
    const overRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/patient-packages/consume',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientPackageId: testPatientPackageId,
        serviceCode: 'SRV-CONS-01',
        quantityConsumed: 2
      }
    });

    assert.strictEqual(overRes.statusCode, 400);
  });

  // =========================================================================
  // 9. PATIENT CREDIT ACCOUNTS & AR AGEING
  // =========================================================================
  it('STEP 15: POST /api/v1/partner/billing/credit-accounts authorizes patient credit limit', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/credit-accounts',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        creditLimit: 50000,
        notes: 'Corporate credit approved by HR'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(parseFloat(body.data.creditLimit), 50000);
    assert.strictEqual(body.data.status, 'ACTIVE');
  });

  it('STEP 16: GET /api/v1/partner/billing/receivables/ageing returns authoritative aged buckets', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/billing/receivables/ageing',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.totals);
    assert.ok(typeof body.data.totals.current0To30Days === 'number');
    assert.ok(typeof body.data.totals.overdue31To60Days === 'number');
    assert.ok(typeof body.data.totals.overdue61To90Days === 'number');
    assert.ok(typeof body.data.totals.overdue90PlusDays === 'number');
    assert.ok(typeof body.data.totals.totalOutstanding === 'number');
  });

  // =========================================================================
  // 10. ACCOUNTS PAYABLE (AP) SUPPLIER BILLS
  // =========================================================================
  it('STEP 17: POST /api/v1/partner/billing/payables records and approves supplier payable bill', async () => {
    const token = createFinanceToken();

    // 1. Create payable bill
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/payables',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        supplierId: '99999999-0000-4999-8999-000000000001',
        invoiceNumber: `VEND-INV-${Date.now()}`,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 10000,
        taxAmount: 1200,
        totalAmount: 11200,
        paymentTerms: 'NET_30'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(parseFloat(body.data.totalAmount), 11200);
    assert.strictEqual(parseFloat(body.data.outstandingAmount), 11200);
    assert.strictEqual(body.data.status, 'PENDING_APPROVAL');

    testPayableId = body.data.id;

    // 2. Approve payable bill
    const approveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/payables/${testPayableId}/approve`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(approveRes.statusCode, 200);
    const approveBody = JSON.parse(approveRes.payload);
    assert.strictEqual(approveBody.data.status, 'APPROVED');

    // 3. Make partial payment against bill
    const payRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/payables/${testPayableId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 5000,
        paymentMethod: 'NEFT',
        transactionReference: 'NEFT-AXIS-99218',
        notes: 'Part payment against pharmaceutical supplies'
      }
    });

    assert.strictEqual(payRes.statusCode, 201);
    const payBody = JSON.parse(payRes.payload);
    assert.strictEqual(parseFloat(payBody.data.payable.paidAmount), 5000);
    assert.strictEqual(parseFloat(payBody.data.payable.outstandingAmount), 6200);
    assert.strictEqual(payBody.data.payable.status, 'PARTIALLY_PAID');
  });

  // =========================================================================
  // 11. FINANCIAL OVERVIEW DASHBOARD & ZERO-STATE INTEGRITY
  // =========================================================================
  it('STEP 18: GET /api/v1/partner/billing/dashboard/overview computes dynamic PostgreSQL metrics', async () => {
    const token = createFinanceToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/billing/dashboard/overview',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.grossBilling >= 2000);
    assert.ok(body.data.totalCollections >= 2000);
    assert.ok(body.data.totalRefunds >= 500);
    assert.ok(body.data.netCollections >= 1500);
    assert.ok(body.data.receivables);
    assert.ok(body.data.payables);
    assert.ok(Array.isArray(body.data.recentTransactions));
  });

  it('STEP 19: GET /api/v1/partner/billing/dashboard/overview enforces clean zero-state on Tenant B', async () => {
    const tokenB = createFinanceToken({ tenantId: TENANT_B, branchId: BRANCH_B, userId: FINANCE_OFFICER_B });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/billing/dashboard/overview',
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.grossBilling, 0);
    assert.strictEqual(body.data.totalCollections, 0);
    assert.strictEqual(body.data.totalRefunds, 0);
    assert.strictEqual(body.data.netCollections, 0);
    assert.strictEqual(body.data.totalOutstanding, 0);
    assert.strictEqual(body.data.recentTransactions.length, 0);
  });

  // =========================================================================
  // 12. HQ COMMERCIAL FINANCE & LICENSING
  // =========================================================================
  it('STEP 20: HQ Pricing & Versioning via /api/v1/commercial/hq/pricing', async () => {
    const hqToken = createHqAdminToken();

    // 1. Fetch available plans
    const db = getDatabase();
    const [hospitalPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.code, 'PLAN_HOSPITAL_ANNUAL'))
      .limit(1);

    assert.ok(hospitalPlan, 'Hospital enterprise plan must be seeded');

    // 2. Create authoritative price version
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/pricing',
      headers: { Authorization: `Bearer ${hqToken}` },
      payload: {
        planId: hospitalPlan.id,
        versionNumber: '2026.Q4-REV1',
        annualBasePriceInr: 120000,
        gstRatePercent: 18,
        sacCode: '998313',
        taxInclusive: false
      }
    });

    assert.strictEqual(postRes.statusCode, 201);
    const postBody = JSON.parse(postRes.payload);
    assert.strictEqual(postBody.success, true);
    assert.strictEqual(postBody.data.versionNumber, '2026.Q4-REV1');
    assert.strictEqual(parseFloat(postBody.data.basePrice), 120000);
  });

  it('STEP 21: HQ B2B Partner Subscription Invoice Generation & License Extension', async () => {
    const hqToken = createHqAdminToken();
    const db = getDatabase();

    const [hospitalPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.code, 'PLAN_HOSPITAL_ANNUAL'))
      .limit(1);

    // 1. Generate B2B partner invoice
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/invoices/generate',
      headers: { Authorization: `Bearer ${hqToken}` },
      payload: {
        partnerId: TENANT_A,
        planId: hospitalPlan.id,
        durationYears: 1
      }
    });

    assert.strictEqual(invRes.statusCode, 201);
    const invBody = JSON.parse(invRes.payload);
    assert.strictEqual(invBody.success, true);
    assert.ok(invBody.data.id);
    assert.ok(invBody.data.invoiceNumber.startsWith('B2B-INV-'));
    assert.strictEqual(invBody.data.status, 'ISSUED');

    const b2bInvoiceId = invBody.data.id;
    const invoiceTotal = parseFloat(invBody.data.totalAmount);

    // 2. Record authoritative payment & verify atomic license extension
    const payRes = await app.inject({
      method: 'POST',
      url: `/api/v1/commercial/hq/invoices/${b2bInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${hqToken}` },
      payload: {
        amount: invoiceTotal,
        provider: 'HDFC_CMS',
        providerReference: `CMS-TXN-${Date.now()}`,
        paymentMethod: 'RTGS',
        notes: 'Annual license fee paid in full'
      }
    });

    assert.strictEqual(payRes.statusCode, 201);
    const payBody = JSON.parse(payRes.payload);
    assert.strictEqual(payBody.success, true);
    assert.strictEqual(payBody.data.invoice.status, 'PAID');
    assert.strictEqual(payBody.data.payment.paymentStatus, 'SUCCEEDED');
    assert.ok(payBody.data.license);
    assert.strictEqual(payBody.data.license.status, 'ACTIVE');
  });

  it('STEP 22: GET /api/v1/commercial/hq/dashboard/revenue computes live HQ commercial figures', async () => {
    const hqToken = createHqAdminToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/dashboard/revenue',
      headers: { Authorization: `Bearer ${hqToken}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(typeof body.data.grossCommercialRevenue === 'number');
    assert.ok(typeof body.data.totalCollectedRevenue === 'number');
    assert.ok(body.data.totalCollectedRevenue > 0);
  });

  // =========================================================================
  // 13. MULTI-TENANT ISOLATION
  // =========================================================================
  it('STEP 23: Cross-tenant access isolation guards prevent Tenant B from reading Tenant A invoices', async () => {
    const tokenB = createFinanceToken({ tenantId: TENANT_B, branchId: BRANCH_B, userId: FINANCE_OFFICER_B });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/billing/invoices/${testInvoiceId}`,
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.statusCode, 404);
  });
});
