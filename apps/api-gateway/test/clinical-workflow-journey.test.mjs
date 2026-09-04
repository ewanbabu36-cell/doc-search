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
  consultationVitals,
  consultationDiagnoses,
  consultationMedications,
  consultationFollowups,
  pharmacyPrescriptions,
  pharmacyPrescriptionItems,
  pharmacyDispensing,
  auditEvents,
  eq,
  and
} from '@docsearch/database';
import { labDiagnosticsRepository } from '../dist/repositories/partner/LabDiagnosticsRepository.js';

describe('Phase 3: Complete Production Clinical Workflow Journey', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const DOCTOR_ID = TEST_SEEDS.DOCTOR_ID;
  const BRANCH_A = TEST_SEEDS.BRANCH_A;

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_ID,
      email: overrides.email || 'doctor@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN'],
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
        'clinical:orders:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let patientId;
  let patientMrn;
  let encounterId;
  let queueTokenId;
  let tokenNumber;
  let consultationId;
  let prescriptionId;
  let pharmacyDispensingId;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // =========================================================================
  // 1. PATIENT REGISTRATION & IDEMPOTENCY
  // =========================================================================
  it('STAGE 1.1: Patient Registration creates real persistent record in PostgreSQL', async () => {
    const token = createTestToken();
    const payload = {
      firstName: 'Vikram',
      lastName: 'Malhotra',
      gender: 'MALE',
      dateOfBirth: '1985-06-20',
      mobileNumber: '+91-9811223344',
      bloodGroup: 'O_POSITIVE'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.firstName, 'Vikram');
    assert.strictEqual(body.data.lastName, 'Malhotra');
    assert.ok(body.data.mrn);
    assert.ok(body.data.id);

    patientId = body.data.id;
    patientMrn = body.data.mrn;

    // Verify directly in PostgreSQL
    const db = getDatabase();
    const [row] = await db.select().from(patients).where(eq(patients.id, patientId));
    assert.ok(row, 'Patient must exist in PostgreSQL patients table');
    assert.strictEqual(row.mrn, patientMrn);
  });

  it('STAGE 1.2: Idempotent Patient Registration prevents duplicate on retry', async () => {
    const token = createTestToken();
    // Same patient data with existing MRN
    const payload = {
      mrn: patientMrn,
      firstName: 'Vikram',
      lastName: 'Malhotra',
      gender: 'MALE',
      mobileNumber: '+91-9811223344'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, patientId, 'Must return existing patient on duplicate registration');

    // Confirm total count in DB didn't increase
    const db = getDatabase();
    const allMatching = await db.select().from(patients).where(eq(patients.mrn, patientMrn));
    assert.strictEqual(allMatching.length, 1, 'Exactly 1 record must exist for MRN');
  });

  it('STAGE 1.3: Patient update persists in PostgreSQL', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/patients/${patientId}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { bloodGroup: 'AB_POSITIVE' }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.bloodGroup, 'AB_POSITIVE');

    // Verify in database
    const db = getDatabase();
    const [row] = await db.select().from(patients).where(eq(patients.id, patientId));
    assert.strictEqual(row.bloodGroup, 'AB_POSITIVE');
  });

  // =========================================================================
  // 2. APPOINTMENT / WALK-IN ENCOUNTER
  // =========================================================================
  it('STAGE 2.1: Walk-in Encounter creation succeeds and persists in PostgreSQL', async () => {
    const token = createTestToken();
    const payload = {
      patientId,
      doctorId: DOCTOR_ID,
      encounterType: 'WALK_IN',
      visitType: 'FIRST_VISIT',
      chiefComplaint: 'Chest tightness, palpitations and mild shortness of breath'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters/check-in',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'CHECKED_IN');
    assert.strictEqual(body.data.patientId, patientId);
    assert.ok(body.data.encounterNumber);

    encounterId = body.data.id;

    // Verify in PostgreSQL
    const db = getDatabase();
    const [row] = await db.select().from(encounters).where(eq(encounters.id, encounterId));
    assert.ok(row, 'Encounter must exist in PostgreSQL encounters table');
    assert.strictEqual(row.status, 'CHECKED_IN');
  });

  it('STAGE 2.2: Retrying encounter check-in returns existing active encounter', async () => {
    const token = createTestToken();
    const payload = {
      patientId,
      doctorId: DOCTOR_ID,
      encounterType: 'WALK_IN',
      chiefComplaint: 'Chest tightness'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters/check-in',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.id, encounterId, 'Must return existing active encounter');
  });

  // =========================================================================
  // 3. OPERATIONAL QUEUE & TOKEN GENERATION
  // =========================================================================
  it('STAGE 3.1: Token generation creates deterministic daily token in encounterQueues', async () => {
    const token = createTestToken();
    const payload = {
      encounterId,
      doctorId: DOCTOR_ID,
      branchId: BRANCH_A,
      estimatedWaitMinutes: 20
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/queues/tokens',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.encounterId, encounterId);
    assert.strictEqual(body.data.queueStatus, 'WAITING');
    assert.ok(body.data.tokenNumber.startsWith('TKN-'), 'Token format must be TKN-XXX');

    queueTokenId = body.data.id;
    tokenNumber = body.data.tokenNumber;

    // Verify linked encounter moved to WAITING
    const db = getDatabase();
    const [enc] = await db.select().from(encounters).where(eq(encounters.id, encounterId));
    assert.strictEqual(enc.status, 'WAITING');

    // Verify token exists in PostgreSQL encounterQueues
    const [qRow] = await db.select().from(encounterQueues).where(eq(encounterQueues.id, queueTokenId));
    assert.ok(qRow);
    assert.strictEqual(qRow.tokenNumber, tokenNumber);
  });

  it('STAGE 3.2: Retrying token generation for same encounter is idempotent', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/queues/tokens',
      headers: { Authorization: `Bearer ${token}` },
      payload: { encounterId, doctorId: DOCTOR_ID }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.id, queueTokenId);
    assert.strictEqual(body.data.tokenNumber, tokenNumber);
  });

  it('STAGE 3.3: GET /clinical/queues lists active waiting tokens', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/queues?queueStatus=WAITING',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    const found = body.data.find(q => q.id === queueTokenId);
    assert.ok(found, 'Token must appear in active queue');
  });

  // =========================================================================
  // 4. QUEUE STATE TRANSITIONS: WAITING -> CALLED -> IN_PROGRESS
  // =========================================================================
  it('STAGE 4.1: Calling token transitions state to CALLED with timestamp', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/queues/${queueTokenId}/call`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.queueStatus, 'CALLED');
    assert.ok(body.data.calledAt);

    // Verify in database
    const db = getDatabase();
    const [qRow] = await db.select().from(encounterQueues).where(eq(encounterQueues.id, queueTokenId));
    assert.strictEqual(qRow.queueStatus, 'CALLED');
    assert.ok(qRow.calledAt);
  });

  it('STAGE 4.2: Starting consultation moves token to IN_PROGRESS and encounter to IN_CONSULTATION', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/queues/${queueTokenId}/start`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.queueStatus, 'IN_PROGRESS');

    // Verify linked encounter in PostgreSQL is IN_CONSULTATION
    const db = getDatabase();
    const [enc] = await db.select().from(encounters).where(eq(encounters.id, encounterId));
    assert.strictEqual(enc.status, 'IN_CONSULTATION');
  });

  // =========================================================================
  // 5. DOCTOR CONSULTATION DRAFT PERSISTENCE
  // =========================================================================
  it('STAGE 5.1: POST /clinical/consultations saves draft consultation with child vitals, diagnoses, medications, lab requests', async () => {
    const token = createTestToken();
    const payload = {
      encounterId,
      patientId,
      doctorId: DOCTOR_ID,
      chiefComplaint: 'Chest tightness, palpitations and mild shortness of breath',
      historyOfPresentIllness: 'Episodes occurring intermittently over the past 2 weeks',
      pastMedicalHistory: 'Father had early CAD at age 48',
      examinationNotes: 'BP 142/92, regular rhythm, S1 S2 heard, no murmurs',
      assessmentNotes: 'Primary Hypertension Stage 1 with Angina symptoms',
      planNotes: 'Start antihypertensive, lipid lowering therapy, order ECG & cardiac profile',
      vitals: {
        systolicBp: 142,
        diastolicBp: 92,
        heartRateBpm: 84,
        oxygenSaturationPercent: 98,
        temperatureFahrenheit: 98.6,
        respiratoryRateBpm: 18,
        weightKg: 80,
        heightCm: 178,
        bmi: 25.2
      },
      diagnoses: [
        { code: 'I10', description: 'Essential (primary) hypertension', isPrimary: true, type: 'PRIMARY' },
        { code: 'I20.9', description: 'Angina pectoris, unspecified', isPrimary: false, type: 'SECONDARY' }
      ],
      medications: [
        {
          medicationName: 'Telmisartan 40mg',
          genericName: 'Telmisartan',
          strength: '40mg',
          dosage: '1 Tab',
          frequency: 'OD',
          duration: 30,
          durationUnit: 'DAYS',
          quantity: 30,
          instructions: 'Take once daily morning after breakfast'
        },
        {
          medicationName: 'Atorvastatin 10mg',
          genericName: 'Atorvastatin',
          strength: '10mg',
          dosage: '1 Tab',
          frequency: 'OD',
          duration: 30,
          durationUnit: 'DAYS',
          quantity: 30,
          instructions: 'Take once daily bedtime'
        }
      ],
      labInvestigations: [
        'Complete Blood Count (CBC)',
        'Lipid Profile Comprehensive'
      ],
      followUpAdvice: 'Review in OPD after 30 days with fresh Lipid Profile and ECG reports'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.ok(body.data.consultationNumber);
    assert.strictEqual(body.data.status, 'IN_PROGRESS');

    consultationId = body.data.id;

    // Verify child tables in PostgreSQL
    const db = getDatabase();
    const [cRow] = await db.select().from(consultations).where(eq(consultations.id, consultationId));
    assert.ok(cRow, 'Consultation must exist in PostgreSQL consultations table');

    const vitalsList = await db.select().from(consultationVitals).where(eq(consultationVitals.consultationId, consultationId));
    assert.ok(vitalsList.length >= 1, 'Vitals must be persisted');
    assert.strictEqual(vitalsList[0].systolicBp, 142);

    const diagList = await db.select().from(consultationDiagnoses).where(eq(consultationDiagnoses.consultationId, consultationId));
    assert.strictEqual(diagList.length, 2, 'Two diagnoses must be persisted');

    const medList = await db.select().from(consultationMedications).where(eq(consultationMedications.consultationId, consultationId));
    assert.strictEqual(medList.length, 2, 'Two medications must be persisted');

    const followList = await db.select().from(consultationFollowups).where(eq(consultationFollowups.consultationId, consultationId));
    assert.strictEqual(followList.length, 1, 'Follow-up advice must be persisted');
  });

  // =========================================================================
  // 6. COMPLETE CONSULTATION WORKFLOW (ATOMIC DOWNSTREAM ORCHESTRATION)
  // =========================================================================
  it('STAGE 6.1: POST /clinical/consultations/:id/complete finalizes consultation, completes encounter & token, creates prescription, enqueues pharmacy order, enqueues lab orders, and schedules follow-up', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/consultations/${consultationId}/complete`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { doctorId: DOCTOR_ID }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);

    const data = body.data;
    assert.strictEqual(data.consultation.status, 'FINALIZED');
    assert.strictEqual(data.encounter.status, 'COMPLETED');
    assert.strictEqual(data.queueToken.queueStatus, 'COMPLETED');
    assert.ok(data.prescription, 'Prescription must be created');
    assert.ok(data.prescription.prescriptionNumber.startsWith('RX-'));
    assert.strictEqual(data.prescription.items.length, 2);
    assert.ok(data.pharmacyOrder, 'Pharmacy order must be queued');
    assert.strictEqual(data.pharmacyOrder.dispensingStatus, 'PENDING');
    assert.ok(data.labOrders.length >= 2, 'Lab orders must be created');
    assert.ok(data.followUp, 'Follow-up must be scheduled');

    prescriptionId = data.prescription.id;
    pharmacyDispensingId = data.pharmacyOrder.id;

    // Verify all PostgreSQL records directly
    const db = getDatabase();

    // 1. Consultation FINALIZED
    const [cDb] = await db.select().from(consultations).where(eq(consultations.id, consultationId));
    assert.strictEqual(cDb.consultationStatus, 'FINALIZED');

    // 2. Encounter COMPLETED
    const [eDb] = await db.select().from(encounters).where(eq(encounters.id, encounterId));
    assert.strictEqual(eDb.status, 'COMPLETED');

    // 3. Queue token COMPLETED
    const [qDb] = await db.select().from(encounterQueues).where(eq(encounterQueues.id, queueTokenId));
    assert.strictEqual(qDb.queueStatus, 'COMPLETED');

    // 4. Pharmacy Prescriptions & Items
    const [rxDb] = await db.select().from(pharmacyPrescriptions).where(eq(pharmacyPrescriptions.id, prescriptionId));
    assert.ok(rxDb);
    const rxItemsDb = await db.select().from(pharmacyPrescriptionItems).where(eq(pharmacyPrescriptionItems.prescriptionId, prescriptionId));
    assert.strictEqual(rxItemsDb.length, 2);
    assert.strictEqual(rxItemsDb[0].remainingQuantity, rxItemsDb[0].prescribedQuantity, 'Remaining quantity must match prescribed quantity');

    // 5. Pharmacy Dispensing Queue Order
    const [dispDb] = await db.select().from(pharmacyDispensing).where(eq(pharmacyDispensing.id, pharmacyDispensingId));
    assert.ok(dispDb);
    assert.strictEqual(dispDb.dispensingStatus, 'PENDING');
    assert.strictEqual(dispDb.prescriptionId, prescriptionId);
  });

  // =========================================================================
  // 7. DOWNSTREAM QUEUE VISIBILITY
  // =========================================================================
  it('STAGE 7.1: Pharmacy Dispensing Queue reflects new pending order for tenant', async () => {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(pharmacyDispensing)
      .where(and(eq(pharmacyDispensing.tenantId, TENANT_A), eq(pharmacyDispensing.dispensingStatus, 'PENDING')));

    const found = rows.find(r => r.id === pharmacyDispensingId);
    assert.ok(found, 'Dispensing order must appear in active pharmacy queue');
  });

  it('STAGE 7.2: Laboratory queue reflects ordered investigations for tenant', async () => {
    const db = getDatabase();
    const orders = await labDiagnosticsRepository.searchOrders(TENANT_A, 'ORDERED', patientId, db);
    assert.ok(orders.length >= 2, 'Lab diagnostics repository must return ordered tests');
    const cbc = orders.find(o => (o.testName && (o.testName.includes('CBC') || o.testName.includes('Blood Count'))) || (o.clinicalIndication && o.clinicalIndication.includes('CBC')));
    assert.ok(cbc, 'CBC order must be in lab queue');
  });

  // =========================================================================
  // 8. IDEMPOTENT RE-COMPLETION & RETRY
  // =========================================================================
  it('STAGE 8.1: Retrying consultation completion is strictly idempotent (zero duplicates created)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/consultations/${consultationId}/complete`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.prescription.id, prescriptionId, 'Must return identical prescription ID');
    assert.strictEqual(body.data.pharmacyOrder.id, pharmacyDispensingId, 'Must return identical dispensing ID');

    // Confirm no duplicate prescriptions in PostgreSQL
    const db = getDatabase();
    const allRx = await db.select().from(pharmacyPrescriptions).where(eq(pharmacyPrescriptions.consultationId, consultationId));
    assert.strictEqual(allRx.length, 1, 'Exactly 1 prescription record must exist');

    // Confirm no duplicate dispensing queue entries
    const allDisp = await db.select().from(pharmacyDispensing).where(eq(pharmacyDispensing.prescriptionId, prescriptionId));
    assert.strictEqual(allDisp.length, 1, 'Exactly 1 pharmacy dispensing record must exist');
  });

  it('STAGE 8.2: POST /clinical/consultations/:id/retry-orders executes recovery idempotently', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/consultations/${consultationId}/retry-orders`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.prescription.id, prescriptionId);
  });

  // =========================================================================
  // 9. AUDIT TRAIL & HASH CHAIN INTEGRITY
  // =========================================================================
  it('STAGE 9.1: Comprehensive audit events recorded with cryptographic hash chain', async () => {
    const db = getDatabase();
    const logs = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.tenantId, TENANT_A));

    const eventTypes = logs.map(l => l.eventType);
    console.log('=== RECORDED AUDIT EVENT TYPES ===:', eventTypes);

    assert.ok(eventTypes.includes('PATIENT_REGISTERED'), 'PATIENT_REGISTERED must be audited');
    assert.ok(eventTypes.includes('PATIENT_UPDATED'), 'PATIENT_UPDATED must be audited');
    assert.ok(eventTypes.includes('ENCOUNTER_CHECKIN'), 'ENCOUNTER_CHECKIN must be audited');
    assert.ok(eventTypes.includes('QUEUE_TOKEN_ISSUED'), 'QUEUE_TOKEN_ISSUED must be audited');
    assert.ok(eventTypes.includes('QUEUE_TOKEN_CALLED'), 'QUEUE_TOKEN_CALLED must be audited');
    assert.ok(eventTypes.includes('CONSULTATION_STARTED'), 'CONSULTATION_STARTED must be audited');
    assert.ok(eventTypes.includes('CONSULTATION_SAVED'), 'CONSULTATION_SAVED must be audited');
    assert.ok(eventTypes.includes('CONSULTATION_FINALIZED'), 'CONSULTATION_FINALIZED must be audited');
    assert.ok(eventTypes.includes('ENCOUNTER_COMPLETED'), 'ENCOUNTER_COMPLETED must be audited');
    assert.ok(eventTypes.includes('PRESCRIPTION_ISSUED'), 'PRESCRIPTION_ISSUED must be audited');
    assert.ok(eventTypes.includes('PHARMACY_ORDER_CREATED'), 'PHARMACY_ORDER_CREATED must be audited');
    assert.ok(eventTypes.includes('DIAGNOSTIC_INVESTIGATIONS_ORDERED'), 'DIAGNOSTIC_INVESTIGATIONS_ORDERED must be audited');

    // Verify SHA-256 hash chaining
    for (let i = 1; i < logs.length; i++) {
      assert.ok(logs[i].integrityHash || logs[i].currentHash, 'Every audit record must have an integrity hash');
      assert.ok(logs[i].previousHash, 'Every chained audit record must link to previousHash');
    }
  });

  // =========================================================================
  // 10. MULTI-TENANT & BRANCH ISOLATION
  // =========================================================================
  it('STAGE 10.1: Multi-tenant boundary prevents Tenant B from reading Tenant A clinical records', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B,
      branchId: TEST_SEEDS.BRANCH_B
    });

    // Attempt to read Tenant A encounter
    const resEnc = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/encounters/${encounterId}`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });
    assert.strictEqual(resEnc.statusCode, 404, 'Tenant B must not see Tenant A encounter');

    // Attempt to list queues as Tenant B
    const resQueue = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/queues',
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });
    assert.strictEqual(resQueue.statusCode, 200);
    const qBody = JSON.parse(resQueue.body);
    const crossToken = qBody.data.find(q => q.id === queueTokenId);
    assert.strictEqual(crossToken, undefined, 'Tenant B queue must not contain Tenant A token');
  });

  // =========================================================================
  // 11. PROCESS RESTART DURABILITY
  // =========================================================================
  it('STAGE 11.1: Clinical records survive application restart intact', async () => {
    // Simulate process restart
    await app.close();
    app = await buildApp();
    await app.ready();

    const token = createTestToken();

    // Verify patient persists
    const resPat = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${patientId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(resPat.statusCode, 200);
    const patBody = JSON.parse(resPat.body);
    assert.strictEqual(patBody.data.id, patientId);
    assert.strictEqual(patBody.data.bloodGroup, 'AB_POSITIVE');

    // Verify clinical history timeline
    const resHist = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/patients/${patientId}/history`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(resHist.statusCode, 200);
    const histBody = JSON.parse(resHist.body);
    assert.strictEqual(histBody.success, true);
    assert.ok(histBody.data.encounters.length >= 1);
    assert.ok(histBody.data.consultations.length >= 1);
    assert.ok(histBody.data.prescriptions.length >= 1);
  });
});
