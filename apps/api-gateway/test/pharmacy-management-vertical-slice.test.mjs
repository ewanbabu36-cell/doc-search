import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Pharmacy & Dispensing Vertical Slice: Rx -> Queue -> FEFO -> Dispense -> Ledger -> Billing -> History', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const PHARMACIST_ID = '77777777-7777-4777-8777-777777777777';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || PHARMACIST_ID,
      email: overrides.email || 'pharmacist@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: overrides.roles || ['PHARMACIST', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:consultations:create',
        'clinical:consultations:read',
        'clinical:consultations:update'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let testPatientId;
  let testMedicationId;
  let testPrescriptionId;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // STEP 1: Create Patient Baseline
  it('STEP 1: Create active patient for pharmacy dispensing', async () => {
    const token = createTestToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Siddharth',
        lastName: 'Menon',
        gender: 'MALE',
        dateOfBirth: '1987-09-12',
        mobileNumber: '+91-9876509988',
        bloodGroup: 'AB_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    testPatientId = JSON.parse(patRes.body).data.id;
  });

  // STEP 2: Create Medicine in Medication Master (Schedule H)
  it('STEP 2: POST /api/v1/partner/pharmacy/medications creates Amoxicillin 500mg (Schedule H)', async () => {
    const token = createTestToken();
    const payload = {
      medicationCode: 'MED-AMOX-500',
      name: 'Amoxicillin 500 mg Capsule',
      genericName: 'Amoxicillin Trihydrate',
      brandName: 'Amoxil',
      dosageForm: 'CAPSULE',
      strength: '500 mg',
      category: 'ANTIBIOTIC',
      scheduleType: 'SCHEDULE_H',
      unitPrice: 15.5
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.medicationCode, 'MED-AMOX-500');
    assert.strictEqual(body.data.scheduleType, 'SCHEDULE_H');
    testMedicationId = body.data.id;
  });

  // STEP 3: Receive Two Batches for FEFO Verification and One Expired Batch
  it('STEP 3: Receive Batch A (nearer expiry), Batch B (further expiry), and Batch Expired', async () => {
    const token = createTestToken();

    // Batch A: Expiry in 30 days (2026-09-30)
    const resA = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId: testMedicationId,
        batchNumber: 'BATCH-AMOX-A01',
        manufacturer: 'Cipla Ltd',
        manufacturingDate: '2026-01-01T00:00:00Z',
        expiryDate: '2026-09-30T00:00:00Z',
        quantity: 50,
        unitCost: 10.0,
        supplierReference: 'PO-2026-001'
      }
    });
    assert.strictEqual(resA.statusCode, 201);

    // Batch B: Expiry in 180 days (2027-02-28)
    const resB = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId: testMedicationId,
        batchNumber: 'BATCH-AMOX-B02',
        manufacturer: 'Cipla Ltd',
        manufacturingDate: '2026-02-01T00:00:00Z',
        expiryDate: '2027-02-28T00:00:00Z',
        quantity: 100,
        unitCost: 9.5,
        supplierReference: 'PO-2026-002'
      }
    });
    assert.strictEqual(resB.statusCode, 201);

    // Batch C: Expired batch in past (2025-12-31)
    const resC = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId: testMedicationId,
        batchNumber: 'BATCH-AMOX-EXP01',
        manufacturer: 'Cipla Ltd',
        manufacturingDate: '2024-01-01T00:00:00Z',
        expiryDate: '2025-12-31T00:00:00Z',
        quantity: 20,
        unitCost: 5.0,
        supplierReference: 'PO-2024-099'
      }
    });
    assert.strictEqual(resC.statusCode, 201);
    assert.strictEqual(JSON.parse(resC.body).data.status, 'EXPIRED');
  });

  // STEP 4: FEFO Verification
  it('STEP 4: GET /api/v1/partner/pharmacy/batches returns batches sorted by FEFO (earliest expiry first)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/pharmacy/batches?medicationId=${testMedicationId}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 2);
    // Earliest expiry batch (BATCH-AMOX-A01) comes before BATCH-AMOX-B02
    const activeBatches = body.data.filter(b => b.status === 'ACTIVE');
    assert.strictEqual(activeBatches[0].batchNumber, 'BATCH-AMOX-A01');
    assert.strictEqual(activeBatches[1].batchNumber, 'BATCH-AMOX-B02');
  });

  // STEP 5: Create Prescription
  it('STEP 5: POST /api/v1/partner/prescriptions creates prescription for Amoxicillin', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      items: [
        {
          medicationId: testMedicationId,
          medicationName: 'Amoxicillin 500 mg Capsule',
          quantity: 10,
          dosage: '1 capsule',
          frequency: '1-0-1',
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
    testPrescriptionId = body.data.id;
  });

  // STEP 6: Partial Dispensing Verification
  it('STEP 6: POST /api/v1/partner/pharmacy/dispense supports partial dispensing (Qty: 6 of 10)', async () => {
    const token = createTestToken();
    const payload = {
      prescriptionId: testPrescriptionId,
      patientId: testPatientId,
      isPartial: true,
      items: [
        {
          medicationId: testMedicationId,
          quantity: 6,
          unit: 'CAPSULE',
          dosageInstructions: 'Take 1 capsule twice daily after meals'
        }
      ],
      payment: {
        method: 'CASH',
        amount: 150.0
      }
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.dispensingStatus, 'PARTIALLY_DISPENSED');
    assert.strictEqual(body.data.items[0].quantity, 6);
  });

  // STEP 7: Full Dispensing of Remaining Balance & Billing
  it('STEP 7: POST /api/v1/partner/pharmacy/dispense completes remaining quantity (Qty: 4) with UPI payment', async () => {
    const token = createTestToken();
    const payload = {
      prescriptionId: testPrescriptionId,
      patientId: testPatientId,
      items: [
        {
          medicationId: testMedicationId,
          quantity: 4,
          unit: 'CAPSULE',
          dosageInstructions: 'Take 1 capsule twice daily after meals'
        }
      ],
      payment: {
        method: 'UPI',
        amount: 100.0
      }
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.dispensingStatus, 'DISPENSED');
    assert.strictEqual(body.data.paymentStatus, 'PAID');
    assert.ok(body.data.dispensingNumber);
    assert.ok(body.data.invoiceNumber);
    assert.strictEqual(body.data.items[0].batchNumber, 'BATCH-AMOX-A01');
    assert.strictEqual(body.data.items[0].quantity, 4);
  });

  // STEP 8: Duplicate Dispense Protection
  it('STEP 8: Duplicate dispensing on fully dispensed prescription is rejected', async () => {
    const token = createTestToken();
    const payload = {
      prescriptionId: testPrescriptionId,
      patientId: testPatientId,
      items: [
        {
          medicationId: testMedicationId,
          quantity: 10,
          unit: 'CAPSULE',
          dosageInstructions: 'Take 1 capsule twice daily after meals'
        }
      ]
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 500);
  });

  // STEP 9: Stock Movement Ledger Verification
  it('STEP 9: Stock Movement Ledger tracks exact before, changed, and after quantities', async () => {
    const token = createTestToken();

    // Check Batch A stock decreased from 50 -> 44 (after partial 6) -> 40 (after remaining 4)
    const batchesRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/pharmacy/batches?medicationId=${testMedicationId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    const batches = JSON.parse(batchesRes.body).data;
    const batchA = batches.find(b => b.batchNumber === 'BATCH-AMOX-A01');
    assert.strictEqual(batchA.availableQuantity, 40);

    // Check Ledger Movements
    const movRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/pharmacy/stock-movements?medicationId=${testMedicationId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(movRes.statusCode, 200);
    const movements = JSON.parse(movRes.body).data;
    const dispenseMovements = movements.filter(m => m.movementType === 'DISPENSE');
    assert.strictEqual(dispenseMovements.length, 2);
    // Most recent dispense: before 44, after 40
    assert.strictEqual(dispenseMovements[0].beforeQuantity, 44);
    assert.strictEqual(dispenseMovements[0].afterQuantity, 40);
  });

  // STEP 10: Patient Medication History Retrieval
  it('STEP 10: GET /api/v1/partner/patients/:id/medication-history returns all dispensing records', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/medication-history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 2);
    assert.strictEqual(body.data[0].patientId, testPatientId);
  });

  // STEP 11: Cross-Tenant Isolation
  it('STEP 11: Tenant B user cannot view Tenant A medication history (0 records)', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/medication-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.length, 0);
  });
});
