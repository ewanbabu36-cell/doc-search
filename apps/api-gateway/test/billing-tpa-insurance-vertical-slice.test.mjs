import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Centralized Hospital Billing & TPA / Insurance (Ayushman Bharat / PM-JAY) Vertical Slice', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const BILLING_OFFICER_ID = '55555555-5555-4555-8555-555555555555';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || BILLING_OFFICER_ID,
      email: overrides.email || 'billing.head@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: overrides.roles || ['BILLING_OFFICER', 'HOSPITAL_ADMIN', 'DOCTOR'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:encounters:update'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let testPatientId;
  let testInvoiceId;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // STEP 1: Patient Baseline
  it('STEP 1: Create inpatient recipient patient for hospital billing', async () => {
    const token = createTestToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Suresh',
        lastName: 'Menon',
        gender: 'MALE',
        dateOfBirth: '1968-08-14',
        mobileNumber: '+91-9876500444',
        bloodGroup: 'B_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    testPatientId = JSON.parse(patRes.body).data.id;
  });

  // STEP 2: Consolidated IPD Invoice Generation (Auto-Aggregation)
  it('STEP 2: POST /api/v1/partner/billing/invoices creates consolidated IPD invoice with Bed, Surgery, Pharmacy, Lab & Blood Bank', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      patientName: 'Suresh Menon',
      encounterId: '00000000-0000-4000-8000-000000000099',
      encounterType: 'IPD',
      billingType: 'AYUSHMAN_BHARAT_PMJAY',
      insurancePayerName: 'National Health Authority (PM-JAY Ayushman Bharat)',
      policyNumber: 'AB-PMJAY-99887766',
      items: [
        {
          serviceName: 'Consultation - Senior Surgical Specialist',
          category: 'CONSULTATION',
          quantity: 3,
          unitPrice: 1500,
          totalPrice: 4500
        },
        {
          serviceName: 'Surgical ICU Bed Rent with Monitoring (3 Days)',
          category: 'BED_CHARGES',
          quantity: 3,
          unitPrice: 5000,
          totalPrice: 15000
        },
        {
          serviceName: 'Laparoscopic Cholecystectomy Operating Suite & Surgeon Fee',
          category: 'SURGERY_OT',
          quantity: 1,
          unitPrice: 35000,
          totalPrice: 35000
        },
        {
          serviceName: 'Packed Red Blood Cells (PRBC) - 1 Unit Crossmatched',
          category: 'BLOOD_BANK',
          quantity: 1,
          unitPrice: 2500,
          totalPrice: 2500
        },
        {
          serviceName: 'Inpatient Post-Op IV Antibiotics & Analgesics',
          category: 'PHARMACY',
          quantity: 1,
          unitPrice: 5500,
          totalPrice: 5500
        },
        {
          serviceName: 'Comprehensive Metabolic Panel & CBC Profiling',
          category: 'LAB_TEST',
          quantity: 1,
          unitPrice: 2500,
          totalPrice: 2500
        }
      ]
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.totalAmount, 65000);
    assert.strictEqual(body.data.balanceDue, 65000);
    assert.strictEqual(body.data.status, 'PENDING_PAYMENT');
    assert.strictEqual(body.data.items.length, 6);
    testInvoiceId = body.data.id;
  });

  // STEP 3: Ayushman Bharat / TPA Cashless Pre-Authorization
  it('STEP 3: POST /api/v1/partner/billing/invoices/:id/pre-auth approves PM-JAY cashless package (₹ 50,000 approved, ₹ 15,000 co-pay)', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      payerName: 'National Health Authority (PM-JAY)',
      policyNumber: 'AB-PMJAY-99887766',
      preAuthNumber: 'PA-PMJAY-554433',
      requestedAmount: 65000,
      approvedAmount: 50000,
      coPayAmount: 15000,
      status: 'PARTIALLY_APPROVED',
      remarks: 'Package SG011A Lap Cholecystectomy approved up to ceiling ₹ 50,000. Consumables co-pay ₹ 15,000 patient responsibility.'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${testInvoiceId}/pre-auth`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.insuranceCoveredAmount, 50000);
    assert.strictEqual(body.data.patientPayableAmount, 15000);
    assert.strictEqual(body.data.balanceDue, 15000);
  });

  // STEP 4: Co-Pay Payment Collection & Final Discharge Settlement
  it('STEP 4: POST /api/v1/partner/billing/invoices/:id/payments collects ₹ 15,000 via UPI and issues receipt REC-XXXXXX', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      amount: 15000,
      paymentMode: 'UPI',
      transactionReference: 'UPI/20260830/9988771122'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${testInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.invoice.balanceDue, 0);
    assert.strictEqual(body.data.invoice.status, 'DISCHARGE_SETTLED');
    assert.ok(body.data.receiptNumber);
  });

  // STEP 5: Self-Pay OPD Consultation & Diagnostics Invoice
  it('STEP 5: POST /api/v1/partner/billing/invoices creates and settles direct OPD invoice (₹ 2,200 Cash)', async () => {
    const token = createTestToken();
    const invoiceRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/billing/invoices',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        patientName: 'Suresh Menon',
        encounterId: '00000000-0000-4000-8000-000000000100',
        encounterType: 'OPD',
        billingType: 'SELF_PAY',
        items: [
          {
            serviceName: 'Cardiology Specialist Consultation',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 1200,
            totalPrice: 1200
          },
          {
            serviceName: '12-Lead Electrocardiogram (ECG)',
            category: 'LAB_TEST',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000
          }
        ]
      }
    });

    assert.strictEqual(invoiceRes.statusCode, 201);
    const opdInvoice = JSON.parse(invoiceRes.body).data;

    const payRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${opdInvoice.id}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        amount: 2200,
        paymentMode: 'CASH',
        transactionReference: 'CASH-COUNTER-01'
      }
    });

    assert.strictEqual(payRes.statusCode, 201);
    const payBody = JSON.parse(payRes.body).data;
    assert.strictEqual(payBody.invoice.status, 'DISCHARGE_SETTLED');
  });

  // STEP 6: Patient Financial History & Ledger
  it('STEP 6: GET /api/v1/partner/patients/:id/billing-history retrieves complete financial ledger', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/billing-history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);
    assert.ok(body.data.some(i => i.id === testInvoiceId && i.status === 'DISCHARGE_SETTLED'));
  });

  // STEP 7: Cross-Tenant Isolation Gate
  it('STEP 7: Tenant B user cannot access Tenant A invoices (0 records)', async () => {
    const tokenTenantB = createTestToken({ tenantId: TENANT_B });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/billing-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.length, 0);
  });
});
