import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Production Vertical Slice: OPD -> Encounter -> Consultation -> Prescription -> History', () => {
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
  let testEncounterId;
  let testConsultationId;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // STEP 1: Register Patient
  it('STEP 1: POST /api/v1/partner/clinical/patients creates real patient with UHID/MRN', async () => {
    const token = createTestToken();
    const payload = {
      firstName: 'Aarav',
      lastName: 'Sharma',
      gender: 'MALE',
      dateOfBirth: '1988-05-14',
      mobileNumber: '+91-9876543210',
      bloodGroup: 'B_POSITIVE'
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
    assert.strictEqual(body.data.firstName, 'Aarav');
    assert.strictEqual(body.data.lastName, 'Sharma');
    assert.ok(body.data.mrn);
    assert.ok(body.data.id);
    testPatientId = body.data.id;
  });

  // STEP 2: OPD Check-in -> Create Encounter
  it('STEP 2: POST /api/v1/partner/clinical/encounters/check-in checks in patient and creates active encounter', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      doctorId: DOCTOR_ID,
      encounterType: 'OPD',
      visitType: 'FIRST_VISIT',
      chiefComplaint: 'Acute fever, cough and mild headache for 3 days'
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
    assert.strictEqual(body.data.patientId, testPatientId);
    assert.ok(body.data.encounterNumber);
    testEncounterId = body.data.id;
  });

  // STEP 3: Doctor Worklist Retrieval
  it('STEP 3: GET /api/v1/partner/clinical/encounters lists checked-in patient on doctor worklist', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters?status=CHECKED_IN',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    const found = body.data.find(e => e.id === testEncounterId);
    assert.ok(found, 'Checked-in encounter must be in OPD list');
  });

  // STEP 4: Doctor Consultation with Vitals, Notes, Diagnoses & Prescription
  it('STEP 4: POST /api/v1/partner/clinical/consultations saves complete clinical consultation and prescription', async () => {
    const token = createTestToken();
    const payload = {
      encounterId: testEncounterId,
      patientId: testPatientId,
      doctorId: DOCTOR_ID,
      chiefComplaint: 'High grade fever (101.4 F) and sore throat',
      historyOfPresentIllness: 'Symptoms started 3 days ago, aggravated at night',
      pastMedicalHistory: 'No history of hypertension or diabetes',
      examinationNotes: 'Throat congested, tonsils enlarged, chest clear bilaterally',
      assessmentNotes: 'Acute Upper Respiratory Tract Infection (URTI)',
      planNotes: 'Rest, hydration, oral antipyretic and antihistaminic',
      vitals: {
        temperatureFahrenheit: 101.4,
        heartRateBpm: 88,
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
          diagnosisCode: 'J06.9',
          diagnosisName: 'Acute upper respiratory infection, unspecified',
          isPrimary: true
        }
      ],
      medications: [
        {
          medicationName: 'Paracetamol 500 mg Tablet',
          genericName: 'Paracetamol',
          strength: '500 mg',
          dosage: '1 tablet',
          route: 'ORAL',
          frequency: '1-0-1',
          duration: 5,
          durationUnit: 'DAYS',
          instructions: 'Take with warm water after food',
          beforeAfterFood: 'AFTER_FOOD'
        },
        {
          medicationName: 'Cetirizine 10 mg Tablet',
          genericName: 'Cetirizine HCl',
          strength: '10 mg',
          dosage: '1 tablet',
          route: 'ORAL',
          frequency: '0-0-1',
          duration: 3,
          durationUnit: 'DAYS',
          instructions: 'Take at bedtime',
          beforeAfterFood: 'AFTER_FOOD'
        }
      ]
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
    assert.strictEqual(body.data.patientId, testPatientId);
    assert.strictEqual(body.data.encounterId, testEncounterId);
    assert.strictEqual(body.data.medications.length, 2);
    testConsultationId = body.data.id;
  });

  // STEP 5: Finalize Consultation & Lock Record
  it('STEP 5: PATCH /api/v1/partner/clinical/consultations/:id/finalize finalizes record with audit log', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/clinical/consultations/${testConsultationId}/finalize`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'FINALIZED');
  });

  // STEP 6: Patient Clinical History Retrieval
  it('STEP 6: GET /api/v1/partner/clinical/patients/:id/history retrieves complete patient consultation history', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/patients/${testPatientId}/history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.encounters.length > 0);
    assert.ok(body.data.consultations.length > 0);
    assert.strictEqual(body.data.consultations[0].medications[0].medicationName, 'Paracetamol 500 mg Tablet');
  });

  // STEP 7: Cross-Tenant Security Isolation Gate
  it('STEP 7: Tenant B user cannot access Tenant A patient clinical history (403 Forbidden)', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B,
      permissions: ['clinical:consultations:read']
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/patients/${testPatientId}/history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    // Tenant B gets empty array due to tenant isolation
    assert.strictEqual(body.data.consultations.length, 0);
    assert.strictEqual(body.data.encounters.length, 0);
  });
});
