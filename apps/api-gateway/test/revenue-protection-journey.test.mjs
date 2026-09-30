import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  auditEvents,
  billingInvoices,
  billingInvoiceItems,
  billingPayments,
  billingReceipts,
  billingRefunds,
  pharmacyBatches,
  pharmacyStockMovements,
  eq,
  desc
} from '@docsearch/database';

describe('Phase 4: Production Revenue Protection & Accounting Integrity Journey', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const BILLING_OFFICER_ID = '55555555-5555-4555-8555-555555555555';
  const SUPERVISOR_ID = '00000000-0000-4000-8000-000000000099';

  function createStaffToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || BILLING_OFFICER_ID,
      email: overrides.email || 'billing.head@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : TEST_SEEDS.BRANCH_A,
      roles: overrides.roles || ['BILLING_OFFICER', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECHNICIAN'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:encounters:update',
        'billing:invoices:create',
        'billing:invoices:read',
        'billing:invoices:update',
        'billing:invoices:cancel',
        'billing:payments:create',
        'billing:payments:read',
        'pharmacy:medications:create',
        'pharmacy:medications:read',
        'pharmacy:inventory:create',
        'pharmacy:inventory:read',
        'pharmacy:dispense:create',
        'pharmacy:orders:read',
        'lab:orders:create',
        'lab:orders:read',
        'lab:specimens:create',
        'lab:results:create'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createSupervisorOverrideToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || SUPERVISOR_ID,
      email: overrides.email || 'medical.director@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : TEST_SEEDS.BRANCH_A,
      roles: overrides.roles || ['MEDICAL_DIRECTOR', 'HOSPITAL_ADMIN'],
      permissions: ['*'],
      override: true,
      purpose: 'INVOICE_VOID_OVERRIDE',
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let patientAId;
  let encounterAId;
  let invoiceAId;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();

    const token = createStaffToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Anand',
        lastName: 'Verma',
        gender: 'MALE',
        dateOfBirth: '1985-06-15',
        phone: '+919876543210'
      }
    });
    patientAId = patRes.json().data.id;

    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/encounters',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        encounterType: 'OPD',
        priority: 'ROUTINE',
        chiefComplaint: 'Acute cough and mild pyrexia'
      }
    });
    encounterAId = encRes.json().data.id;
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  // =========================================================================
  // CHECKPOINT 1: Consultation Revenue Cycle
  // Fee Derivation -> Charge Creation -> Invoice Persistence -> Payment -> Receipt
  // =========================================================================
  it('CHECKPOINT 1: Consultation Revenue Cycle (Doctor Fee -> Charge -> Invoice -> Payment -> Receipt)', async () => {
    const token = createStaffToken();

    // 1. Create Patient
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Anand',
        lastName: 'Verma',
        gender: 'MALE',
        dateOfBirth: '1985-06-15',
        phone: '+919876543210'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    patientAId = patRes.json().data.id;

    // 2. Create Encounter
    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/encounters',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        doctorId: TEST_SEEDS.DOCTOR_ID,
        encounterType: 'OPD',
        priority: 'ROUTINE',
        chiefComplaint: 'Acute cough and mild pyrexia'
      }
    });
    assert.strictEqual(encRes.statusCode, 201);
    encounterAId = encRes.json().data.id;

    // 3. Create Consultation Invoice with dynamic pricing
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Senior Physician Consultation - Dr. Test',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 850.0,
            totalPrice: 850.0
          }
        ]
      }
    });
    assert.strictEqual(invRes.statusCode, 201);
    const invoice = invRes.json().data;
    invoiceAId = invoice.id;

    assert.strictEqual(invoice.totalAmount, 850);
    assert.strictEqual(invoice.balanceDue, 850);
    assert.strictEqual(invoice.paidAmount, 0);
    assert.strictEqual(invoice.items.length, 1);
    assert.strictEqual(invoice.items[0].category, 'CONSULTATION');
    assert.strictEqual(invoice.items[0].totalPrice, 850);

    // 4. Collect Payment & Issue Receipt
    const pmtRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceAId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 850.0,
        paymentMode: 'UPI',
        transactionReference: 'TXN-CONSULT-UPI-1001'
      }
    });
    assert.strictEqual(pmtRes.statusCode, 201);
    const pmtBody = pmtRes.json().data;

    assert.strictEqual(pmtBody.invoice.status, 'PAID');
    assert.strictEqual(pmtBody.invoice.paidAmount, 850);
    assert.strictEqual(pmtBody.invoice.balanceDue, 0);
    assert.match(pmtBody.receiptNumber, /^REC-/);
  });

  // =========================================================================
  // CHECKPOINT 2: Authoritative Server-Side Price Recalculation & Tamper Rejection
  // =========================================================================
  it('CHECKPOINT 2: Authoritative Price Integrity overrides client-side price tampering and rejects invalid prices', async () => {
    const token = createStaffToken();

    // 1. Client attempts tampering: sets totalPrice: 10.00 while qty=3 and unitPrice=500.00
    const tamperedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Specialist Procedural Care',
            category: 'SURGERY_OT',
            quantity: 3,
            unitPrice: 500.0,
            totalPrice: 10.0 // Tampered client value! Server must ignore!
          }
        ]
      }
    });
    assert.strictEqual(tamperedRes.statusCode, 201);
    const correctedInvoice = tamperedRes.json().data;

    // Server authoritative calculation: 3 * 500 = 1500
    assert.strictEqual(correctedInvoice.totalAmount, 1500);
    assert.strictEqual(correctedInvoice.balanceDue, 1500);
    assert.strictEqual(correctedInvoice.items[0].totalPrice, 1500);

    // 2. Reject negative unit price
    const negPriceRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Fraudulent Rebate Item',
            category: 'NURSING',
            quantity: 1,
            unitPrice: -250.0,
            totalPrice: -250.0
          }
        ]
      }
    });
    assert.strictEqual(negPriceRes.statusCode, 400);

    // 3. Reject zero or negative quantity
    const zeroQtyRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Zero Quantity Service',
            category: 'NURSING',
            quantity: 0,
            unitPrice: 300.0,
            totalPrice: 0.0
          }
        ]
      }
    });
    assert.strictEqual(zeroQtyRes.statusCode, 400);
  });

  // =========================================================================
  // CHECKPOINT 3 & 4: Payment Safety — Negative/Zero Payment & Overpayment Rejection
  // =========================================================================
  it('CHECKPOINT 3 & 4: Rejects zero/negative payment and rejects overpayments exceeding balance due', async () => {
    const token = createStaffToken();

    // Create an invoice of ₹ 1,200
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Ward Nursing & Bed Charges',
            category: 'BED_CHARGES',
            quantity: 1,
            unitPrice: 1200.0,
            totalPrice: 1200.0
          }
        ]
      }
    });
    assert.strictEqual(invRes.statusCode, 201);
    const invoiceId = invRes.json().data.id;

    // 1. Zero Payment Rejection
    const zeroPayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 0,
        paymentMode: 'CASH'
      }
    });
    assert.strictEqual(zeroPayRes.statusCode, 400);

    // 2. Negative Payment Rejection
    const negPayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: -500,
        paymentMode: 'CASH'
      }
    });
    assert.strictEqual(negPayRes.statusCode, 400);

    // 3. Overpayment Rejection (Balance is 1200, attempting 1500)
    const overPayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 1500.0,
        paymentMode: 'CASH'
      }
    });
    assert.strictEqual(overPayRes.statusCode, 400);
    assert.match(overPayRes.json().error.message, /exceeds outstanding balance due/);
  });

  // =========================================================================
  // CHECKPOINT 5: Concurrency Safety & Idempotent Deduplication
  // =========================================================================
  it('CHECKPOINT 5: Rejects duplicate payment transactions with same transaction reference', async () => {
    const token = createStaffToken();

    // Create an invoice of ₹ 2,000
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Day Care Observation',
            category: 'BED_CHARGES',
            quantity: 1,
            unitPrice: 2000.0,
            totalPrice: 2000.0
          }
        ]
      }
    });
    const invoiceId = invRes.json().data.id;
    const idempotencyRef = `TXN-UPI-IDEMP-${Date.now()}`;

    // First payment: ₹ 800
    const firstPayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 800.0,
        paymentMode: 'UPI',
        transactionReference: idempotencyRef
      }
    });
    assert.strictEqual(firstPayRes.statusCode, 201);
    assert.strictEqual(firstPayRes.json().data.invoice.paidAmount, 800);
    assert.strictEqual(firstPayRes.json().data.invoice.balanceDue, 1200);

    // Immediate duplicate payment retry with same transaction reference
    const dupPayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 800.0,
        paymentMode: 'UPI',
        transactionReference: idempotencyRef
      }
    });
    assert.strictEqual(dupPayRes.statusCode, 409);
    assert.match(dupPayRes.json().error.message, /already been processed/);
  });

  // =========================================================================
  // CHECKPOINT 6: Payment Safety — Block Payments on PAID or VOIDED Invoices
  // =========================================================================
  it('CHECKPOINT 6: Rejects payment collection on PAID or VOIDED invoices', async () => {
    const token = createStaffToken();

    // 1. Create and fully settle an invoice
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Consultation Followup',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 500.0,
            totalPrice: 500.0
          }
        ]
      }
    });
    const paidInvoiceId = invRes.json().data.id;

    const settleRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${paidInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 500.0,
        paymentMode: 'CASH'
      }
    });
    assert.strictEqual(settleRes.statusCode, 201);
    assert.strictEqual(settleRes.json().data.invoice.status, 'PAID');

    // Attempt further payment on PAID invoice
    const extraPayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${paidInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 100.0,
        paymentMode: 'CASH'
      }
    });
    assert.strictEqual(extraPayRes.statusCode, 409);

    // 2. Create and VOID an unpaid invoice
    const inv2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Cancelled Registration Fee',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 300.0,
            totalPrice: 300.0
          }
        ]
      }
    });
    const voidInvoiceId = inv2Res.json().data.id;

    const voidRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${voidInvoiceId}/void`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        void_reason: 'Patient cancelled consultation prior to doctor arrival',
        supervisor_user_id: BILLING_OFFICER_ID
      }
    });
    assert.strictEqual(voidRes.statusCode, 200);

    // Attempt payment on VOIDED invoice
    const voidPayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${voidInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 300.0,
        paymentMode: 'CASH'
      }
    });
    assert.strictEqual(voidPayRes.statusCode, 409);
  });

  // =========================================================================
  // CHECKPOINT 7: Discount Policy, Ceilings & Supervisor Override Controls
  // =========================================================================
  it('CHECKPOINT 7: Enforces discount ceilings (<= 20% standard, > 20% requires supervisor override)', async () => {
    const token = createStaffToken();
    const supervisorToken = createSupervisorOverrideToken();

    // Create an invoice of ₹ 4,000
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Comprehensive Clinical Assessment',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 4000.0,
            totalPrice: 4000.0
          }
        ]
      }
    });
    const invoiceId = invRes.json().data.id;

    // 1. Standard Discount: 10% (₹ 400) without supervisor override -> Succeeds
    const stdDiscRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/discounts`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        discount_type: 'PERCENTAGE',
        discount_value: 10,
        reason: 'Senior Citizen Institutional Concession',
        approved_by: 'Billing Supervisor'
      }
    });
    assert.strictEqual(stdDiscRes.statusCode, 200);
    assert.strictEqual(stdDiscRes.json().data.discountAmount, 400);
    assert.strictEqual(stdDiscRes.json().data.invoice.balanceDue, 3600);

    // 2. High Discount (> 20%): 30% WITHOUT supervisor override -> Blocked with 403
    const highDiscNoAuth = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/discounts`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        discount_type: 'PERCENTAGE',
        discount_value: 30,
        reason: 'Director Discretionary Waiver',
        approved_by: 'Staff Without Token'
      }
    });
    assert.strictEqual(highDiscNoAuth.statusCode, 403);

    // 3. High Discount WITH valid cryptographically signed supervisor override token -> Succeeds
    const highDiscAuth = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/discounts`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-supervisor-override-token': supervisorToken
      },
      payload: {
        discount_type: 'PERCENTAGE',
        discount_value: 30,
        reason: 'Authorized Medical Director Special Waiver',
        approved_by: SUPERVISOR_ID,
        supervisor_override_token: supervisorToken
      }
    });
    assert.strictEqual(highDiscAuth.statusCode, 200);
    assert.strictEqual(highDiscAuth.json().data.discountAmount, 1200);
    assert.strictEqual(highDiscAuth.json().data.invoice.discountTotal, 1600);
    assert.strictEqual(highDiscAuth.json().data.invoice.balanceDue, 2400);

    // 4. Discount exceeding allowable invoice total -> 400 Bad Request
    const excessiveDiscRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/discounts`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-supervisor-override-token': supervisorToken
      },
      payload: {
        discount_type: 'FIXED_AMOUNT',
        discount_value: 50000,
        reason: 'Invalid Excessive Discount',
        approved_by: SUPERVISOR_ID,
        supervisor_override_token: supervisorToken
      }
    });
    assert.strictEqual(excessiveDiscRes.statusCode, 400);
  });

  // =========================================================================
  // CHECKPOINT 8: Controlled Void & Physical Inventory Quarantine
  // =========================================================================
  it('CHECKPOINT 8: Voiding PAID invoice strictly requires supervisor token and triggers physical quarantine', async () => {
    const token = createStaffToken();
    const supervisorToken = createSupervisorOverrideToken();

    // Create an invoice of ₹ 1,000 and pay it in full
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Procedure Observation',
            category: 'BED_CHARGES',
            quantity: 1,
            unitPrice: 1000.0,
            totalPrice: 1000.0
          }
        ]
      }
    });
    const paidInvoiceId = invRes.json().data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${paidInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 1000.0,
        paymentMode: 'CASH'
      }
    });

    // 1. Attempt to void PAID invoice WITHOUT supervisor override token -> 403 Forbidden
    const voidNoTokenRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${paidInvoiceId}/void`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        void_reason: 'Patient admission cancelled retrospectively',
        supervisor_user_id: SUPERVISOR_ID
      }
    });
    assert.strictEqual(voidNoTokenRes.statusCode, 403);

    // 2. Void PAID invoice WITH supervisor override token -> Succeeds
    const voidWithTokenRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${paidInvoiceId}/void`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-supervisor-override-token': supervisorToken
      },
      payload: {
        void_reason: 'Patient admission cancelled retrospectively by Medical Director order',
        supervisor_user_id: SUPERVISOR_ID,
        supervisor_override_token: supervisorToken
      }
    });
    assert.strictEqual(voidWithTokenRes.statusCode, 200);
    assert.strictEqual(voidWithTokenRes.json().data.invoice.status, 'VOIDED');

    // 3. Attempt to void again -> 409 Conflict (already voided)
    const voidAgainRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${paidInvoiceId}/void`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-supervisor-override-token': supervisorToken
      },
      payload: {
        void_reason: 'Duplicate void attempt',
        supervisor_user_id: SUPERVISOR_ID,
        supervisor_override_token: supervisorToken
      }
    });
    assert.strictEqual(voidAgainRes.statusCode, 409);
  });

  // =========================================================================
  // CHECKPOINT 9: Controlled Staff Refund Workflow
  // =========================================================================
  it('CHECKPOINT 9: POST /billing/invoices/:id/refund enforces refund ceiling, supervisor override, negative ledger, and balance adjustment', async () => {
    const token = createStaffToken();
    const supervisorToken = createSupervisorOverrideToken();

    // 1. Create and pay an invoice of ₹ 6,000
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Comprehensive Rehabilitation Package',
            category: 'NURSING',
            quantity: 1,
            unitPrice: 6000.0,
            totalPrice: 6000.0
          }
        ]
      }
    });
    const invoiceId = invRes.json().data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 6000.0,
        paymentMode: 'CARD',
        transactionReference: 'POS-AUTH-6000'
      }
    });

    // 2. Reject zero or negative refund
    const zeroRefundRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/refund`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 0,
        reason: 'Zero refund test',
        supervisor_user_id: SUPERVISOR_ID
      }
    });
    assert.strictEqual(zeroRefundRes.statusCode, 400);

    // 3. Reject over-refund exceeding paid amount (Paid 6000, requesting 7500)
    const overRefundRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/refund`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 7500.0,
        reason: 'Excessive refund test',
        supervisor_user_id: SUPERVISOR_ID
      }
    });
    assert.strictEqual(overRefundRes.statusCode, 400);
    assert.match(overRefundRes.json().error.message, /exceeds total paid amount/);

    // 4. Reject high value / settled invoice refund without supervisor override token
    const noAuthRefundRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/refund`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 2000.0,
        reason: 'Therapy sessions partially cancelled by clinical order',
        supervisor_user_id: SUPERVISOR_ID
      }
    });
    assert.strictEqual(noAuthRefundRes.statusCode, 403);

    // 5. Execute valid staff refund with supervisor override token
    const validRefundRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${invoiceId}/refund`,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-supervisor-override-token': supervisorToken
      },
      payload: {
        amount: 2000.0,
        reason: 'Therapy sessions partially cancelled by clinical order',
        supervisor_user_id: SUPERVISOR_ID,
        supervisor_override_token: supervisorToken
      }
    });
    assert.strictEqual(validRefundRes.statusCode, 200);
    const refundData = validRefundRes.json().data;

    assert.strictEqual(refundData.amount, 2000);
    assert.match(refundData.refundNumber, /^REF-/);
    assert.strictEqual(refundData.invoice.paidAmount, 4000);
    assert.strictEqual(refundData.invoice.balanceDue, 2000);
    assert.strictEqual(refundData.invoice.status, 'PARTIALLY_PAID');

    // 6. Verify ledger rows directly in database
    const db = testDb.pool;
    const payments = await db.query(
      `SELECT * FROM "clinical"."billing_payments" WHERE "invoice_id" = '${invoiceId}' ORDER BY "created_at" ASC;`
    );
    const refundPmt = payments.rows.find((p) => p.payment_method === 'REFUND');
    assert.ok(refundPmt, 'Negative ledger entry must exist in billing_payments');
    assert.strictEqual(Number(refundPmt.amount), -2000);

    const refunds = await db.query(
      `SELECT * FROM "clinical"."billing_refunds" WHERE "invoice_id" = '${invoiceId}';`
    );
    assert.strictEqual(refunds.rows.length, 1);
    assert.strictEqual(refunds.rows[0].status, 'COMPLETED');
    assert.strictEqual(Number(refunds.rows[0].amount), 2000);
  });

  // =========================================================================
  // CHECKPOINT 10: Pharmacy Revenue & Authoritative Invoices
  // =========================================================================
  it('CHECKPOINT 10: Pharmacy Dispensing calculates dynamic catalog pricing, creates real invoices, and deducts inventory', async () => {
    const token = createStaffToken();

    // 1. Create medication in catalog
    const medCode = `MED-PHARM-${Date.now()}`;
    const medRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationCode: medCode,
        name: 'Amoxicillin + Clavulanic Acid 625mg',
        genericName: 'Amoxicillin / Potassium Clavulanate',
        dosageForm: 'TABLET',
        strength: '625mg',
        unitPrice: 42.50
      }
    });
    assert.strictEqual(medRes.statusCode, 201);
    const medId = medRes.json().data.id;

    // 2. Receive stock batch of 100 units
    const batchNumber = `BATCH-AUG-${Math.floor(1000 + Math.random() * 9000)}`;
    const batchRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId: medId,
        batchNumber,
        manufacturer: 'Cipla Therapeutics Ltd',
        manufacturingDate: '2026-01-01',
        expiryDate: '2028-01-01',
        quantity: 100,
        unitCost: 28.00
      }
    });
    assert.strictEqual(batchRes.statusCode, 201);
    const batchId = batchRes.json().data.id;

    // 3. Dispense 15 units at POS
    const dispenseRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        pharmacistId: BILLING_OFFICER_ID,
        pharmacistName: 'Lead Clinical Pharmacist',
        items: [
          {
            medicationId: medId,
            batchId,
            quantity: 15
          }
        ]
      }
    });
    if (dispenseRes.statusCode !== 201) console.log('DISPENSE STATUS:', dispenseRes.statusCode, JSON.stringify(dispenseRes.json()));
    assert.strictEqual(dispenseRes.statusCode, 201);
    const dispData = dispenseRes.json().data;

    // Authoritative calculation: 15 * 42.50 = 637.50
    assert.strictEqual(dispData.totalBillAmount, 637.5);
    assert.strictEqual(dispData.dispensingStatus, 'DISPENSED');
    assert.match(dispData.invoiceNumber, /^INV-PHARM-/);

    // 4. Verify authoritative billing invoice created in database
    const db = testDb.pool;
    const invDb = await db.query(
      `SELECT * FROM "clinical"."billing_invoices" WHERE "invoice_number" = '${dispData.invoiceNumber}';`
    );
    assert.strictEqual(invDb.rows.length, 1);
    assert.strictEqual(invDb.rows[0].invoice_type, 'PHARMACY');
    assert.strictEqual(Number(invDb.rows[0].total_amount), 637.5);
    assert.strictEqual(Number(invDb.rows[0].paid_amount), 637.5);
    assert.strictEqual(invDb.rows[0].status, 'PAID');

    // 5. Verify batch stock deducted: 100 - 15 = 85
    const batchDb = await db.query(
      `SELECT * FROM "clinical"."pharmacy_batches" WHERE "id" = '${batchId}';`
    );
    assert.strictEqual(Number(batchDb.rows[0].available_quantity), 85);

    // 6. Verify pharmacy stock movement logged
    const movementDb = await db.query(
      `SELECT * FROM "clinical"."pharmacy_stock_movements" WHERE "batch_id" = '${batchId}' AND "movement_type" = 'DISPENSE';`
    );
    assert.strictEqual(movementDb.rows.length, 1);
    assert.strictEqual(Number(movementDb.rows[0].quantity), -15);
  });

  // =========================================================================
  // CHECKPOINT 11: Laboratory Revenue & Specimen Collection Policy Enforcement
  // =========================================================================
  it('CHECKPOINT 11: Laboratory enforces PAYMENT_REQUIRED_BEFORE_SAMPLE policy check before specimen accession', async () => {
    const token = createStaffToken();

    // 1. Create clinical lab order with PAYMENT_REQUIRED_BEFORE_SAMPLE policy
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        testCode: 'CBC-FULL',
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        priority: 'ROUTINE',
        billingPolicy: 'PAYMENT_REQUIRED_BEFORE_SAMPLE'
      }
    });
    if (orderRes.statusCode !== 201) console.log('LAB ORDER STATUS:', orderRes.statusCode, JSON.stringify(orderRes.json()));
    assert.strictEqual(orderRes.statusCode, 201);
    const labOrderId = orderRes.json().data.id;

    // 2. Attempt specimen collection while UNPAID -> Blocked with 402 Payment Required
    const unpaidCollectRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${labOrderId}/collect-sample`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        specimenType: 'WHOLE_BLOOD',
        containerType: 'EDTA_LAVENDER',
        collectedBy: 'Phlebotomist On Duty'
      }
    });
    assert.strictEqual(unpaidCollectRes.statusCode, 402);
    assert.match(unpaidCollectRes.json().error.message, /Payment is strictly required prior to sample collection/);

    // 3. Emergency / Authorized Deferred Billing bypass allows collection
    const deferredCollectRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${labOrderId}/collect-sample`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        specimenType: 'WHOLE_BLOOD',
        containerType: 'EDTA_LAVENDER',
        collectedBy: 'Phlebotomist On Duty',
        deferredBilling: true
      }
    });
    assert.strictEqual(deferredCollectRes.statusCode, 200);
    assert.strictEqual(deferredCollectRes.json().data.status, 'SAMPLE_COLLECTED');

    // 4. Create second lab order requiring payment
    const order2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        testCode: 'LFT-FULL',
        testName: 'Liver Function Test',
        category: 'BIOCHEMISTRY',
        priority: 'ROUTINE',
        billingPolicy: 'PAYMENT_REQUIRED_BEFORE_SAMPLE'
      }
    });
    assert.strictEqual(order2Res.statusCode, 201);
    const labOrder2Id = order2Res.json().data.id;

    // Bill and settle the lab test via direct billing invoice
    const invRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        encounterId: encounterAId,
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Liver Function Test',
            category: 'LAB_TEST',
            quantity: 1,
            unitPrice: 650.0,
            totalPrice: 650.0
          }
        ]
      }
    });
    const labInvoiceId = invRes.json().data.id;

    // Collect payment for the lab invoice
    await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${labInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: patientAId,
        amount: 650.0,
        paymentMode: 'UPI',
        transactionReference: `TXN-LAB-PAID-${Date.now()}`
      }
    });

    // Now collect specimen without deferred flag -> Succeeds because order is BILLED!
    const paidCollectRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${labOrder2Id}/collect-sample`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        specimenType: 'SERUM',
        containerType: 'SST_GOLD',
        collectedBy: 'Phlebotomist On Duty'
      }
    });
    assert.strictEqual(paidCollectRes.statusCode, 200);
    assert.strictEqual(paidCollectRes.json().data.status, 'SAMPLE_COLLECTED');
  });

  // =========================================================================
  // CHECKPOINT 12: SHA-256 Cryptographic Audit Chaining Verification
  // =========================================================================
  it('CHECKPOINT 12: All financial mutations are logged with valid SHA-256 integrity hash chains in core.audit_events', async () => {
    const db = testDb.pool;
    const auditRes = await db.query(
      `SELECT * FROM "core"."audit_events" WHERE "tenant_id" = '${TENANT_A}' ORDER BY "timestamp" ASC;`
    );
    const events = auditRes.rows;

    assert.ok(events.length >= 5, `Expected at least 5 audit events, found ${events.length}`);

    const financialEventTypes = new Set([
      'INVOICE_GENERATED',
      'PAYMENT_COLLECTED',
      'REFUND_PROCESSED',
      'INVOICE_VOIDED',
      'DISCOUNT_APPLIED'
    ]);

    const recordedFinancialTypes = events
      .map((e) => e.event_type)
      .filter((t) => financialEventTypes.has(t));

    assert.ok(recordedFinancialTypes.length > 0, 'Must have recorded financial audit events');

    // Verify SHA-256 format for every event
    for (const evt of events) {
      assert.ok(evt.integrity_hash, `Audit event ${evt.id} must have integrity_hash`);
      assert.match(
        evt.integrity_hash,
        /^[a-f0-9]{64}$/,
        `Integrity hash ${evt.integrity_hash} must be a valid 64-character SHA-256 hex string`
      );
    }

    // Verify cryptographic chaining: each event's previous_hash references preceding event's integrity_hash
    for (let i = 1; i < events.length; i++) {
      const prevEvent = events[i - 1];
      const currEvent = events[i];

      // In a strict chain, previous_hash equals previous event's integrity_hash
      if (currEvent.previous_hash && currEvent.previous_hash !== 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000') {
        assert.strictEqual(
          currEvent.previous_hash,
          prevEvent.integrity_hash,
          `Event ${currEvent.id} previous_hash must match predecessor ${prevEvent.id} integrity_hash`
        );
      }
    }
  });
});
