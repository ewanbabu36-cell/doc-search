import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Critical Fix: Real PostgreSQL Persistence & Standard REST Routes', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const DOCTOR_ID = '99999999-9999-4999-8999-999999999999';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_ID,
      email: overrides.email || 'doctor@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
        'clinical:consultations:update'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let createdPatientId;
  let createdEncounterId;
  let createdConsultationId;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // 1. Patient Registration
  it('TEST 01: POST /api/v1/partner/patients persists new patient in database', async () => {
    const token = createTestToken();
    const payload = {
      firstName: 'Vikram',
      lastName: 'Malhotra',
      gender: 'MALE',
      dateOfBirth: '1984-11-20',
      mobileNumber: '+91-9123456780',
      bloodGroup: 'O_POSITIVE'
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
    assert.strictEqual(body.data.firstName, 'Vikram');
    assert.ok(body.data.id);
    createdPatientId = body.data.id;
  });

  it('TEST 02: GET /api/v1/partner/patients/:id retrieves persisted patient record', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${createdPatientId}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, createdPatientId);
    assert.strictEqual(body.data.firstName, 'Vikram');
  });

  // 2. Encounter
  it('TEST 03: POST /api/v1/partner/encounters creates real encounter with status CHECKED_IN', async () => {
    const token = createTestToken();
    const payload = {
      patientId: createdPatientId,
      doctorId: DOCTOR_ID,
      encounterType: 'OPD',
      visitType: 'FIRST_VISIT',
      chiefComplaint: 'Chest tightness and shortness of breath upon exertion'
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

  it('TEST 04: GET /api/v1/partner/encounters/:id retrieves persisted encounter', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/encounters/${createdEncounterId}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, createdEncounterId);
  });

  // 3. Clinical Consultation
  it('TEST 05: POST /api/v1/partner/consultations saves consultation with notes, vitals & diagnosis', async () => {
    const token = createTestToken();
    const payload = {
      encounterId: createdEncounterId,
      patientId: createdPatientId,
      doctorId: DOCTOR_ID,
      chiefComplaint: 'Chest tightness for 2 days',
      historyOfPresentIllness: 'Exertional dyspnea, non-radiating chest discomfort',
      pastMedicalHistory: 'Known mild hyperlipidemia',
      examinationNotes: 'S1/S2 heard, no murmurs, lungs clear',
      assessmentNotes: 'Atypical chest discomfort, rule out stable angina',
      planNotes: 'ECG ordered, initiate Aspirin and lifestyle modification',
      vitals: {
        temperatureFahrenheit: 98.6,
        heartRateBpm: 76,
        respiratoryRateBpm: 16,
        systolicBp: 130,
        diastolicBp: 85,
        oxygenSaturationPercent: 99,
        weightKg: 78,
        heightCm: 178,
        bmi: 24.6
      },
      diagnoses: [
        {
          diagnosisCode: 'R07.9',
          diagnosisName: 'Chest pain, unspecified',
          isPrimary: true
        }
      ],
      medications: [
        {
          medicationName: 'Aspirin 75 mg Tablet',
          genericName: 'Acetylsalicylic Acid',
          strength: '75 mg',
          dosage: '1 tablet',
          route: 'ORAL',
          frequency: '1-0-0',
          duration: 30,
          durationUnit: 'DAYS',
          instructions: 'Take after breakfast',
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

  // 4. Finalize Consultation
  it('TEST 06: PATCH /api/v1/partner/consultations/:id/finalize locks the consultation', async () => {
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

  // 5. Prescription Endpoint
  it('TEST 07: POST /api/v1/partner/prescriptions generates finalized prescription', async () => {
    const token = createTestToken();
    const payload = {
      patientId: createdPatientId,
      encounterId: createdEncounterId,
      consultationId: createdConsultationId,
      prescribingDoctorId: DOCTOR_ID,
      items: [
        {
          medicationName: 'Aspirin 75 mg Tablet',
          dosage: '1 tablet',
          frequency: '1-0-0',
          duration: '30 days'
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
  });

  // 6. Patient Clinical History Retrieval
  it('TEST 08: GET /api/v1/partner/patients/:id/history returns complete patient clinical history', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${createdPatientId}/history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.encounters.length > 0);
    assert.ok(body.data.consultations.length > 0);
    assert.strictEqual(body.data.consultations[0].status, 'FINALIZED');
  });

  // 7. Multi-Tenant Isolation
  it('TEST 09: Tenant B user cannot access Tenant A patient record (404/Empty due to tenant isolation)', async () => {
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
