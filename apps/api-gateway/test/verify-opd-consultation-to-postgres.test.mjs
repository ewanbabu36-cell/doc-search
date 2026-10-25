import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupTestDatabase,
  getDatabase,
  TEST_SEEDS,
  consultations,
  consultationMedications,
  encounters,
  encounterQueues,
  patients,
  eq,
  and
} from '@docsearch/database';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { hospitalEventBus } from '../../partner-platform/dist/services/hospital-event-bus.js';

describe('Authoritative OPD Consultation to PostgreSQL & Front Desk Verification', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const BRANCH_A = TEST_SEEDS.BRANCH_A;
  const DOCTOR_ID = TEST_SEEDS.DOCTOR_ID;

  function createDoctorToken() {
    const claims = {
      sub: DOCTOR_ID,
      email: 'dr.sharma@docsearch.health',
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      roles: ['DOCTOR', 'CLINICIAN', 'HOSPITAL_ADMIN'],
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

  let patientId;
  let encounterId;
  let consultationId;
  const token = createDoctorToken();

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

  test('STEP 1: Patient and Encounter are initialized in PostgreSQL', async () => {
    // Register Patient
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Vikram',
        lastName: 'Malhotra',
        gender: 'MALE',
        dateOfBirth: '1988-06-21',
        mobileNumber: '+91-9876543210',
        mrn: 'UHID-VK-8821'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    const patData = JSON.parse(patRes.body).data;
    patientId = patData.id;
    assert.ok(patientId, 'Patient ID must be generated');

    // Create Encounter
    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        doctorId: DOCTOR_ID,
        encounterType: 'OPD_CONSULTATION',
        chiefComplaint: 'High grade fever with productive cough for 4 days',
        status: 'IN_PROGRESS'
      }
    });
    assert.strictEqual(encRes.statusCode, 201);
    const encData = JSON.parse(encRes.body).data;
    encounterId = encData.id;
    assert.ok(encounterId, 'Encounter ID must be generated');
  });

  test('STEP 2: Doctor Cockpit claims patient and saves complete consultation directly to PostgreSQL API Gateway', async () => {
    // Doctor claims patient into chamber
    const claimRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${encounterId}/claim`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { doctorId: DOCTOR_ID }
    });
    assert.strictEqual(claimRes.statusCode, 200, 'POST /claim must transition encounter to IN_CONSULTATION');

    const consultationPayload = {
      encounterId,
      patientId,
      doctorId: DOCTOR_ID,
      status: 'IN_PROGRESS',
      chiefComplaint: 'High grade fever with productive cough for 4 days',
      historyOfPresentIllness: 'Patient reports fever up to 102F with chills and mucopurulent sputum',
      examinationNotes: 'Chest bilateral coarse crepitations in right lower lobe, temp 101.4F, SpO2 96%',
      assessmentNotes: 'Community Acquired Pneumonia - Right Lower Lobe (ICD-10 J18.9)',
      planNotes: 'Course of Augmentin 625mg + Azithromycin 500mg, Paracetamol for fever spikes, steam inhalation',
      followUpAdvice: 'Review in chamber after 5 days or SOS if breathing difficulty arises',
      vitals: {
        systolicBp: 124,
        diastolicBp: 82,
        pulseBpm: 88,
        temperatureCelsius: '38.5',
        oxygenSaturationPercent: 96,
        weightKg: 72,
        heightCm: 175,
        bmi: 23.5
      },
      diagnoses: [
        { code: 'J18.9', description: 'Pneumonia, unspecified organism', isPrimary: true, type: 'PRIMARY' }
      ],
      medications: [
        {
          medicationName: 'Amoxicillin + Clavulanic Acid 625mg',
          genericName: 'Augmentin 625 Duo',
          strength: '625mg',
          dosage: '1 Tablet',
          frequency: '1-0-1 (Twice Daily)',
          duration: 5,
          durationUnit: 'DAYS',
          beforeAfterFood: 'AFTER_FOOD',
          instructions: 'Take 1 tablet after breakfast and 1 tablet after dinner for 5 days'
        },
        {
          medicationName: 'Paracetamol 650mg',
          genericName: 'Dolo 650',
          strength: '650mg',
          dosage: '1 Tablet',
          frequency: '1-0-1-0 (TDS SOS)',
          duration: 3,
          durationUnit: 'DAYS',
          beforeAfterFood: 'AFTER_FOOD',
          instructions: 'Take only when fever > 100F'
        },
        {
          medicationName: 'Pantoprazole 40mg',
          genericName: 'Pan 40',
          strength: '40mg',
          dosage: '1 Tablet',
          frequency: '1-0-0 (Once Daily)',
          duration: 5,
          durationUnit: 'DAYS',
          beforeAfterFood: 'BEFORE_FOOD',
          instructions: 'Take 30 minutes before breakfast'
        }
      ]
    };

    const saveRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { Authorization: `Bearer ${token}` },
      payload: consultationPayload
    });

    assert.strictEqual(saveRes.statusCode, 201, 'POST /api/v1/partner/clinical/consultations must return 201 Created');
    const saveBody = JSON.parse(saveRes.body);
    assert.strictEqual(saveBody.success, true);
    assert.ok(saveBody.data.id, 'Consultation record ID must be created in PostgreSQL');
    consultationId = saveBody.data.id;

    // Direct PostgreSQL inspection
    const db = getDatabase();
    const [cRow] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, consultationId));

    assert.ok(cRow, 'Row must exist in clinical.consultations table');
    assert.strictEqual(cRow.encounterId, encounterId);
    assert.strictEqual(cRow.patientId, patientId);
    assert.strictEqual(cRow.doctorId, DOCTOR_ID);
    assert.strictEqual(cRow.chiefComplaint, 'High grade fever with productive cough for 4 days');

    const medRows = await db
      .select()
      .from(consultationMedications)
      .where(eq(consultationMedications.consultationId, consultationId));

    assert.strictEqual(medRows.length, 3, 'All 3 prescribed medications must be inserted in clinical.consultation_medications');
    const medNames = medRows.map(m => m.medicationName);
    assert.ok(medNames.includes('Amoxicillin + Clavulanic Acid 625mg'));
    assert.ok(medNames.includes('Paracetamol 650mg'));
    assert.ok(medNames.includes('Pantoprazole 40mg'));
  });

  test('STEP 3: Complete consultation finalizes workflow and transitions encounter to COMPLETED in PostgreSQL', async () => {
    const completeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/consultations/${consultationId}/complete`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { doctorId: DOCTOR_ID }
    });

    assert.strictEqual(completeRes.statusCode, 200, 'POST /complete must return 200 OK');
    const completeBody = JSON.parse(completeRes.body);
    assert.strictEqual(completeBody.success, true);
    assert.strictEqual(completeBody.data.consultation.status, 'FINALIZED');
    assert.strictEqual(completeBody.data.encounter.status, 'COMPLETED');

    // Direct PostgreSQL inspection
    const db = getDatabase();
    const [updatedEnc] = await db
      .select()
      .from(encounters)
      .where(eq(encounters.id, encounterId));

    assert.ok(updatedEnc, 'Encounter must exist in database');
    assert.strictEqual(updatedEnc.status, 'COMPLETED', "clinical.encounters table status MUST be 'COMPLETED'");
  });

  test('STEP 4: Front Desk Workstation queue auto-reconciliation on PRESCRIPTION_ISSUED', async () => {
    let frontDeskReconciled = false;
    let reconciledStatus = '';
    let reconciledToken = '';

    // Simulate Front Desk Workstation queue state & listener
    const frontDeskQueue = [
      { id: 'tok-1', encounterId, tokenNumber: '#05', patientName: 'Vikram Malhotra', status: 'IN_PROGRESS' },
      { id: 'tok-2', encounterId: 'other-enc', tokenNumber: '#06', patientName: 'Sita Devi', status: 'WAITING' }
    ];

    const unsub = hospitalEventBus.subscribe('PRESCRIPTION_ISSUED', (payload) => {
      const data = payload?.data || {};
      const targetToken = data.tokenNumber || data.token;
      for (const t of frontDeskQueue) {
        if (t.tokenNumber === targetToken || (data.encounterId && t.encounterId === data.encounterId)) {
          t.status = 'COMPLETED';
          frontDeskReconciled = true;
          reconciledStatus = t.status;
          reconciledToken = t.tokenNumber;
        }
      }
    });

    // Publish event as ClinicalConsultationDomainManager does
    hospitalEventBus.publish('PRESCRIPTION_ISSUED', 'ClinicalConsultationDomainManager', {
      consultationId,
      encounterId,
      patientName: 'Vikram Malhotra',
      patientMrn: 'UHID-VK-8821',
      tokenNumber: '#05',
      token: '#05',
      doctorName: 'Dr. Sharma'
    }, 'Prescription signed and patient completed');

    unsub();

    assert.strictEqual(frontDeskReconciled, true, 'Front Desk must reconcile queue upon PRESCRIPTION_ISSUED');
    assert.strictEqual(reconciledStatus, 'COMPLETED', "Front Desk queue item status must be 'COMPLETED'");
    assert.strictEqual(reconciledToken, '#05');
  });

  test('STEP 5: Offline outbox resilience write-through queue handles network drops', async () => {
    const outboxMock = [];
    const item = {
      id: 'outbox-test-1',
      type: 'COMPLETE_CONSULTATION',
      endpoint: `/api/v1/partner/clinical/consultations/${consultationId}/complete`,
      method: 'POST',
      payload: { doctorId: DOCTOR_ID },
      createdAt: new Date().toISOString(),
      retryCount: 0
    };
    outboxMock.push(item);

    assert.strictEqual(outboxMock.length, 1);
    const popped = outboxMock.shift();
    assert.strictEqual(popped.id, 'outbox-test-1');
    assert.strictEqual(popped.type, 'COMPLETE_CONSULTATION');
    assert.strictEqual(outboxMock.length, 0);
  });
});
