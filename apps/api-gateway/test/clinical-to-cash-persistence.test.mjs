import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';

describe('Checkpoints 2.7 & 2.8: Complete Clinical-to-Cash Persistence & Restart Durability', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const DOCTOR_ID = TEST_SEEDS.DOCTOR_ID;

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_ID,
      email: overrides.email || 'doctor@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : TEST_SEEDS.BRANCH_A,
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN', 'FINANCE_HEAD'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:patients:update',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:encounters:update',
        'clinical:consultations:create',
        'clinical:consultations:read',
        'clinical:consultations:update',
        'clinical:orders:create',
        'clinical:orders:read',
        'billing:invoices:create',
        'billing:invoices:read',
        'billing:invoices:update',
        'billing:payments:create',
        'billing:payments:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let createdPatientId;
  let createdEncounterId;
  let createdConsultationId;
  let createdPrescriptionNumber;
  let createdInvoiceId;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  // Stage 1: Patient Registration
  it('STAGE 1: POST /api/v1/partner/patients persists Patient record in PostgreSQL', async () => {
    const token = createTestToken();
    const payload = {
      firstName: 'Aarav',
      lastName: 'Sharma',
      gender: 'MALE',
      dateOfBirth: '1988-04-15',
      mobileNumber: '+91-9876543210',
      bloodGroup: 'B_POSITIVE'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.firstName, 'Aarav');
    assert.ok(body.data.id);
    createdPatientId = body.data.id;
  });

  // Stage 2: Encounter Check-in
  it('STAGE 2: POST /api/v1/partner/encounters creates Encounter with status CHECKED_IN', async () => {
    const token = createTestToken();
    const payload = {
      patientId: createdPatientId,
      doctorId: DOCTOR_ID,
      encounterType: 'OPD',
      visitType: 'FIRST_VISIT',
      chiefComplaint: 'Acute headache, high fever, and fatigue for 3 days'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/encounters',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'CHECKED_IN');
    assert.strictEqual(body.data.patientId, createdPatientId);
    createdEncounterId = body.data.id;
  });

  // Stage 3: Clinical Consultation
  it('STAGE 3: POST /api/v1/partner/consultations records vitals, examination notes, and medications', async () => {
    const token = createTestToken();
    const payload = {
      encounterId: createdEncounterId,
      patientId: createdPatientId,
      doctorId: DOCTOR_ID,
      chiefComplaint: 'Acute headache and fever',
      historyOfPresentIllness: 'High grade fever with chills for 3 days',
      pastMedicalHistory: 'No chronic illnesses',
      examinationNotes: 'Febrile, temperature 102F, chest clear, throat mildly congested',
      assessmentNotes: 'Viral pyrexia / suspected dengue',
      planNotes: 'CBC test, Paracetamol, adequate oral fluids',
      vitals: {
        temperatureFahrenheit: 102.0,
        heartRateBpm: 92,
        respiratoryRateBpm: 18,
        systolicBp: 120,
        diastolicBp: 80,
        oxygenSaturationPercent: 98,
        weightKg: 72,
        heightCm: 175,
        bmi: 23.5
      },
      diagnoses: [
        {
          diagnosisCode: 'R50.9',
          diagnosisName: 'Fever, unspecified',
          isPrimary: true
        }
      ],
      medications: [
        {
          medicationName: 'Paracetamol 650mg Tablet',
          genericName: 'Acetaminophen',
          strength: '650mg',
          dosage: '1 tablet',
          route: 'ORAL',
          frequency: '1-1-1',
          duration: 5,
          durationUnit: 'DAYS',
          instructions: 'Take after food',
          beforeAfterFood: 'AFTER_FOOD'
        }
      ]
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/consultations',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.encounterId, createdEncounterId);
    assert.strictEqual(body.data.medications.length, 1);
    createdConsultationId = body.data.id;
  });

  // Stage 4: Finalize Consultation
  it('STAGE 4: PATCH /api/v1/partner/consultations/:id/finalize transitions status to FINALIZED', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/consultations/${createdConsultationId}/finalize`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'FINALIZED');
  });

  // Stage 5: Prescription Generation
  it('STAGE 5: POST /api/v1/partner/prescriptions persists digital prescription', async () => {
    const token = createTestToken();
    const payload = {
      patientId: createdPatientId,
      encounterId: createdEncounterId,
      consultationId: createdConsultationId,
      prescribingDoctorId: DOCTOR_ID,
      items: [
        {
          medicationName: 'Paracetamol 650mg Tablet',
          dosage: '1 tablet',
          frequency: '1-1-1',
          duration: '5 days'
        }
      ]
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/prescriptions',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.prescriptionNumber);
    createdPrescriptionNumber = body.data.prescriptionNumber;
  });

  // Stage 6: Lab Investigation Order Bridge
  it('STAGE 6: POST /api/v1/partner/clinical/encounters/:id/orders bridges diagnostic orders to LIMS', async () => {
    const token = createTestToken();
    const payload = {
      patientId: createdPatientId,
      doctorId: DOCTOR_ID,
      testNames: ['Complete Blood Count (CBC)', 'Dengue NS1 Antigen']
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${createdEncounterId}/orders`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);
    assert.strictEqual(body.data[0].status, 'ORDERED');
  });

  // Stage 7: Consolidated Invoice Generation
  it('STAGE 7: POST /api/v1/partner/billing/invoices creates real consolidated invoice in PostgreSQL', async () => {
    const token = createTestToken();
    const payload = {
      patientId: createdPatientId,
      encounterId: createdEncounterId,
      billingType: 'SELF_PAY',
      items: [
        {
          serviceName: 'General OPD Consultation',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500
        },
        {
          serviceName: 'Complete Blood Count (CBC)',
          category: 'LAB_TEST',
          quantity: 1,
          unitPrice: 350,
          totalPrice: 350
        },
        {
          serviceName: 'Paracetamol 650mg Strip',
          category: 'PHARMACY',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50
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
    assert.strictEqual(body.data.totalAmount, 900);
    assert.strictEqual(body.data.balanceDue, 900);
    assert.strictEqual(body.data.status, 'PENDING_PAYMENT');
    assert.strictEqual(body.data.items.length, 3);
    createdInvoiceId = body.data.id;
  });

  // Stage 8: Payment Collection & Bill Settlement
  it('STAGE 8: POST /api/v1/partner/billing/invoices/:id/payments collects full payment & transitions to PAID', async () => {
    const token = createTestToken();
    const payload = {
      amount: 900,
      paymentMode: 'UPI',
      transactionRef: 'UPI-TXN-9876543210'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/billing/invoices/${createdInvoiceId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.invoice.status, 'PAID');
    assert.strictEqual(body.data.invoice.balanceDue, 0);
    assert.ok(body.data.receiptNumber);
  });

  // Stage 9: Section 17 API Restart Durability Verification
  it('STAGE 9 (SECTION 17): API Restart Durability — Stop API, Start fresh API instance, verify all records persist in PostgreSQL', async () => {
    const token = createTestToken();

    // 1. Close the running Fastify application completely (purging any in-memory state)
    await app.close();
    app = null;

    // 2. Spin up a fresh Fastify instance from scratch
    const freshApp = await buildApp();
    await freshApp.ready();

    try {
      // 3. Verify Patient persistence
      const patientRes = await freshApp.inject({
        method: 'GET',
        url: `/api/v1/partner/patients/${createdPatientId}`,
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(patientRes.statusCode, 200);
      const patientBody = JSON.parse(patientRes.body);
      assert.strictEqual(patientBody.success, true);
      assert.strictEqual(patientBody.data.id, createdPatientId);
      assert.strictEqual(patientBody.data.firstName, 'Aarav');
      assert.strictEqual(patientBody.data.lastName, 'Sharma');

      // 4. Verify Encounter persistence
      const encounterRes = await freshApp.inject({
        method: 'GET',
        url: `/api/v1/partner/encounters/${createdEncounterId}`,
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(encounterRes.statusCode, 200);
      const encounterBody = JSON.parse(encounterRes.body);
      assert.strictEqual(encounterBody.success, true);
      assert.strictEqual(encounterBody.data.id, createdEncounterId);
      assert.strictEqual(encounterBody.data.status, 'CHECKED_IN');

      // 5. Verify Consultation & Clinical History persistence
      const historyRes = await freshApp.inject({
        method: 'GET',
        url: `/api/v1/partner/patients/${createdPatientId}/history`,
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(historyRes.statusCode, 200);
      const historyBody = JSON.parse(historyRes.body);
      assert.strictEqual(historyBody.success, true);
      assert.ok(historyBody.data.encounters.length > 0);
      assert.ok(historyBody.data.consultations.length > 0);
      assert.strictEqual(historyBody.data.consultations[0].id, createdConsultationId);
      assert.strictEqual(historyBody.data.consultations[0].status, 'FINALIZED');

      // 6. Verify Billing Invoice & Payment persistence
      const invoiceRes = await freshApp.inject({
        method: 'GET',
        url: `/api/v1/partner/billing/invoices/${createdInvoiceId}`,
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(invoiceRes.statusCode, 200);
      const invoiceBody = JSON.parse(invoiceRes.body);
      assert.strictEqual(invoiceBody.success, true);
      assert.strictEqual(invoiceBody.data.id, createdInvoiceId);
      assert.strictEqual(invoiceBody.data.status, 'PAID');
      assert.strictEqual(invoiceBody.data.totalAmount, 900);
      assert.strictEqual(invoiceBody.data.balanceDue, 0);
      assert.strictEqual(invoiceBody.data.items.length, 3);
      assert.ok(invoiceBody.data.payments.length >= 1);
      assert.strictEqual(invoiceBody.data.payments[0].amount, 900);
    } finally {
      // Reassign freshApp to app so after() hook can close it cleanly
      app = freshApp;
    }
  });

  // Stage 10: Section 18 Multi-Step Transaction Rollback Verification
  it('STAGE 10 (SECTION 18): Multi-step transaction failure and atomic rollback verification', async () => {
    let caughtExpectedError = false;

    try {
      await testDb.db.transaction(async (tx) => {
        // Step A: Write patient record inside transaction
        await tx.insert(testDb.schema.patients).values({
          tenantId: TENANT_A,
          partnerId: TEST_SEEDS.PARTNER_ID_A,
          organizationId: TEST_SEEDS.ORG_ID_A,
          branchId: TEST_SEEDS.BRANCH_A,
          mrn: 'MRN-TX-FAIL-TEST-999',
          patientCode: 'PAT-TX-FAIL-TEST-999',
          firstName: 'Uncommitted',
          lastName: 'RollbackTarget',
          gender: 'OTHER',
          dateOfBirth: '1995-05-05',
          mobileNumber: '+91-9998887770'
        });

        // Step B: Intentionally throw an unhandled error mid-transaction
        throw new Error('INTENTIONAL_STAGE_18_FAILURE');
      });
    } catch (err) {
      if (err.message === 'INTENTIONAL_STAGE_18_FAILURE') {
        caughtExpectedError = true;
      }
    }

    // Assert that the transaction failure was caught
    assert.strictEqual(caughtExpectedError, true, 'Intentional transaction error was caught');

    // Assert that Step A was completely rolled back and does NOT exist in PostgreSQL
    const checkRes = await testDb.pool.query("SELECT * FROM clinical.patients WHERE mrn = 'MRN-TX-FAIL-TEST-999';");
    assert.strictEqual(checkRes.rows.length, 0, 'No partial business state persisted after transaction rollback');
  });

  // Stage 11: Multi-Tenant Data Isolation
  it('STAGE 11: Multi-Tenant Isolation — Tenant B is forbidden from reading Tenant A patient', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${createdPatientId}`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 404);
  });
});
