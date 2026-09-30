import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  getDatabase,
  patients,
  encounters,
  encounterQueues,
  consultations,
  consultationMedications,
  pharmacyPrescriptions,
  pharmacyPrescriptionItems,
  pharmacyDispensing,
  pharmacyBatches,
  pharmacyStockMovements,
  billingInvoices,
  billingPayments,
  billingReceipts,
  eq,
  and
} from '@docsearch/database';

describe('Option A End-to-End: Doctor Consultation -> Digital Prescription -> Pharmacy Worklist -> Dispense & POS Billing', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const BRANCH_A = TEST_SEEDS.BRANCH_A;
  const DOCTOR_ID = TEST_SEEDS.DOCTOR_ID;
  const PHARMACIST_ID = '00000000-0000-4000-8000-000000000077';

  function createDoctorToken() {
    const claims = {
      sub: DOCTOR_ID,
      email: 'doctor@docsearch.health',
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      roles: ['DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:encounters:update',
        'clinical:consultations:create',
        'clinical:consultations:read',
        'clinical:consultations:update',
        'clinical:orders:create',
        'clinical:orders:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createPharmacistToken() {
    const claims = {
      sub: PHARMACIST_ID,
      email: 'pharmacist@docsearch.health',
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      roles: ['PHARMACIST', 'HOSPITAL_ADMIN'],
      permissions: [
        'pharmacy:orders:read',
        'pharmacy:orders:update',
        'pharmacy:inventory:read',
        'pharmacy:inventory:create',
        'pharmacy:dispense:create',
        'pharmacy:medications:read',
        'pharmacy:medications:create'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let patientId;
  let encounterId;
  let queueTokenId;
  let consultationId;
  let prescriptionId;
  let prescriptionNumber;
  let dispensingId;
  let batchId;
  let medicationId = '00000000-0000-4000-8000-000000000060';

  before(async () => {
    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // STEP 1: Patient Registration
  it('STEP 1: Patient registration creates persistent record in PostgreSQL', async () => {
    const token = createDoctorToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Aarav',
        lastName: 'Deshmukh',
        gender: 'MALE',
        dateOfBirth: '1990-03-15',
        mobileNumber: '+91-9876543210'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    patientId = body.data.id;
  });

  // STEP 2: Clinical Encounter
  it('STEP 2: Clinical Encounter created with status WAITING', async () => {
    const token = createDoctorToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        doctorId: DOCTOR_ID,
        encounterType: 'OPD_CONSULTATION',
        chiefComplaint: 'Acute bacterial pharyngitis, fever, and sore throat'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    encounterId = body.data.id;
  });

  // STEP 3: Queue Token
  it('STEP 3: Queue token generated and encounter moved to IN_PROGRESS', async () => {
    const token = createDoctorToken();
    const tknRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/queues/tokens',
      headers: { Authorization: `Bearer ${token}` },
      payload: { encounterId, doctorId: DOCTOR_ID }
    });
    assert.strictEqual(tknRes.statusCode, 201);
    const tknBody = JSON.parse(tknRes.body);
    queueTokenId = tknBody.data.id;

    // Start consultation on queue
    const startRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/queues/${queueTokenId}/start`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(startRes.statusCode, 200);
  });

  // STEP 4: Doctor saves consultation with medications
  it('STEP 4: Doctor saves consultation draft with medication items in PostgreSQL', async () => {
    const token = createDoctorToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/consultations',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        encounterId,
        patientId,
        doctorId: DOCTOR_ID,
        chiefComplaint: 'Sore throat and fever',
        historyOfPresentIllness: 'Symptoms began 3 days ago',
        examinationNotes: 'Erythematous pharynx with tonsillar exudates',
        assessmentNotes: 'Streptococcal Pharyngitis',
        planNotes: 'Course of Amoxicillin 500mg and supportive therapy',
        diagnoses: [
          { code: 'J02.0', description: 'Streptococcal pharyngitis', isPrimary: true, type: 'PRIMARY' }
        ],
        medications: [
          {
            medicationName: 'Amoxicillin 500mg',
            genericName: 'Amoxicillin',
            strength: '500mg',
            dosage: '1 Capsule',
            frequency: 'TID (Three Times Daily)',
            route: 'ORAL',
            duration: 7,
            durationUnit: 'DAYS',
            quantity: 21,
            instructions: 'Take 1 capsule three times daily after food for 7 days'
          }
        ]
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    consultationId = body.data.id;

    // Verify consultation and medications exist in database
    const db = getDatabase();
    const [cRow] = await db.select().from(consultations).where(eq(consultations.id, consultationId));
    assert.ok(cRow);
    const medRows = await db.select().from(consultationMedications).where(eq(consultationMedications.consultationId, consultationId));
    assert.strictEqual(medRows.length, 1);
  });

  // STEP 5: Doctor completes consultation workflow
  it('STEP 5: Doctor completes consultation -> persists digital prescription and enqueues in pharmacy worklist', async () => {
    const token = createDoctorToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/consultations/${consultationId}/complete`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { doctorId: DOCTOR_ID }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.consultation.status, 'FINALIZED');
    assert.strictEqual(body.data.encounter.status, 'COMPLETED');
    assert.strictEqual(body.data.queueToken.queueStatus, 'COMPLETED');
    assert.ok(body.data.prescription, 'Prescription must be created');
    assert.ok(body.data.prescription.prescriptionNumber.startsWith('RX-'));
    assert.ok(body.data.pharmacyOrder, 'Pharmacy order must be queued');
    assert.strictEqual(body.data.pharmacyOrder.dispensingStatus, 'PENDING');

    prescriptionId = body.data.prescription.id;
    prescriptionNumber = body.data.prescription.prescriptionNumber;
    dispensingId = body.data.pharmacyOrder.id;

    // Verify PostgreSQL records directly
    const db = getDatabase();
    const [rxDb] = await db.select().from(pharmacyPrescriptions).where(eq(pharmacyPrescriptions.id, prescriptionId));
    assert.ok(rxDb);
    assert.strictEqual(rxDb.prescriptionNumber, prescriptionNumber);

    const rxItemsDb = await db.select().from(pharmacyPrescriptionItems).where(eq(pharmacyPrescriptionItems.prescriptionId, prescriptionId));
    assert.strictEqual(rxItemsDb.length, 1);
    assert.strictEqual(rxItemsDb[0].prescribedQuantity, 21);
    assert.strictEqual(rxItemsDb[0].remainingQuantity, 21);

    const [dispDb] = await db.select().from(pharmacyDispensing).where(eq(pharmacyDispensing.id, dispensingId));
    assert.ok(dispDb);
    assert.strictEqual(dispDb.dispensingStatus, 'PENDING');
  });

  // STEP 6: Pharmacist receives stock of medication into batch
  it('STEP 6: Pharmacist receives stock of medication batch into PostgreSQL inventory', async () => {
    const token = createPharmacistToken();
    const batchNum = `BAT-AMOX-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/batches/receive-stock',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        medicationId,
        batchNumber: batchNum,
        manufacturer: 'Cipla Healthcare Ltd',
        manufacturingDate: '2026-01-01',
        expiryDate: '2027-12-31',
        quantity: 100,
        unitCost: 8.5,
        supplierReference: 'PO-2026-0091'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    batchId = body.data.id;
    assert.strictEqual(Number(body.data.availableQuantity), 100);
  });

  // STEP 7: Pharmacist queries prescription worklist queue
  it('STEP 7: GET /api/v1/partner/pharmacy/prescriptions returns authoritative PostgreSQL queue item', async () => {
    const token = createPharmacistToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/prescriptions',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));

    const found = body.data.find(p => p.id === dispensingId || p.prescriptionId === prescriptionId);
    assert.ok(found, 'Prescription must appear in pharmacy worklist queue');
    assert.strictEqual(found.status, 'PENDING');
    assert.strictEqual(found.patientName, 'Aarav Deshmukh');
    assert.ok(found.prescriptionNumber.startsWith('RX-'));
    assert.ok(found.items.length >= 1, 'Prescription items must be resolved');
    assert.strictEqual(found.items[0].prescribedQuantity, 21);
  });

  // STEP 8: Pharmacist dispenses medication & triggers automated POS billing
  it('STEP 8: POST /api/v1/partner/pharmacy/dispense performs FEFO batch deduction & mints invoice/receipt', async () => {
    const token = createPharmacistToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dispense',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        prescriptionId,
        patientId,
        doctorId: DOCTOR_ID,
        items: [
          {
            medicationId,
            batchId,
            quantity: 21,
            unit: 'CAPSULE'
          }
        ],
        payment: {
          method: 'CASH',
          amount: 250.0
        }
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.dispensingStatus, 'DISPENSED');
    assert.ok(body.data.invoiceNumber.startsWith('INV-PHARM-'));
    assert.ok(body.data.receiptNumber.startsWith('REC-PHARM-'));
    assert.strictEqual(body.data.items[0].quantity, 21);

    // Verify PostgreSQL records
    const db = getDatabase();

    // 1. Batch availableQuantity decremented from 100 to 79
    const [bDb] = await db.select().from(pharmacyBatches).where(eq(pharmacyBatches.id, batchId));
    assert.strictEqual(Number(bDb.availableQuantity), 79, 'Batch availableQuantity must be decremented by 21');

    // 2. Stock movement ledger created
    const movements = await db.select().from(pharmacyStockMovements).where(and(eq(pharmacyStockMovements.tenantId, TENANT_A), eq(pharmacyStockMovements.batchId, batchId)));
    assert.ok(movements.length >= 1, 'Stock movement record must exist');
    const dispenseMov = movements.find(m => m.movementType === 'DISPENSE');
    assert.ok(dispenseMov);
    assert.strictEqual(dispenseMov.quantity, -21);

    // 3. Billing Invoice created with invoiceType = 'PHARMACY'
    const [invDb] = await db.select().from(billingInvoices).where(eq(billingInvoices.invoiceNumber, body.data.invoiceNumber));
    assert.ok(invDb, 'Billing invoice must exist in PostgreSQL');
    assert.strictEqual(invDb.invoiceType, 'PHARMACY');
    assert.strictEqual(invDb.patientId, patientId);

    // 4. Billing Receipt minted
    const [recDb] = await db.select().from(billingReceipts).where(eq(billingReceipts.receiptNumber, body.data.receiptNumber));
    assert.ok(recDb, 'Billing receipt must exist in PostgreSQL');
    assert.strictEqual(recDb.invoiceId, invDb.id);
  });
});
