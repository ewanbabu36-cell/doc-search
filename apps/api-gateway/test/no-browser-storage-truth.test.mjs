import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Source of Truth Verification: PostgreSQL/API without Browser Storage', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_ID = '11111111-1111-4111-8111-111111111111';
  const DOCTOR_ID = '99999999-9999-4999-8999-999999999999';

  function createTestToken() {
    const claims = {
      sub: DOCTOR_ID,
      email: 'doctor@docsearch.health',
      tenantId: TENANT_ID,
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: ['DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: [
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

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  it('VERIFICATION: Create patient, encounter, consultation, prescription in PostgreSQL and retrieve with 0 client storage', async () => {
    const token = createTestToken();

    // 1. Create Patient via API
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        gender: 'FEMALE',
        dateOfBirth: '1992-07-15',
        mobileNumber: '+91-9876501234',
        bloodGroup: 'A_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    const patData = JSON.parse(patRes.body).data;
    const patientId = patData.id;
    assert.ok(patientId);

    // 2. Create Encounter via API
    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/encounters',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        doctorId: DOCTOR_ID,
        encounterType: 'OPD',
        chiefComplaint: 'Severe migraine with photophobia'
      }
    });
    assert.strictEqual(encRes.statusCode, 201);
    const encData = JSON.parse(encRes.body).data;
    const encounterId = encData.id;
    assert.ok(encounterId);

    // 3. Save & Finalize Consultation via API
    const consRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/consultations',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        encounterId,
        patientId,
        doctorId: DOCTOR_ID,
        chiefComplaint: 'Unilateral pulsating headache',
        assessmentNotes: 'Acute Migraine without aura',
        planNotes: 'Sumatriptan and hydration',
        vitals: {
          temperatureFahrenheit: 98.4,
          heartRateBpm: 80,
          systolicBp: 118,
          diastolicBp: 78
        },
        diagnoses: [
          {
            diagnosisCode: 'G43.0',
            diagnosisName: 'Migraine without aura',
            isPrimary: true
          }
        ],
        medications: [
          {
            medicationName: 'Sumatriptan 50 mg Tablet',
            strength: '50 mg',
            dosage: '1 tablet',
            frequency: 'PRN',
            duration: 5,
            instructions: 'Take at onset of migraine'
          }
        ]
      }
    });
    assert.strictEqual(consRes.statusCode, 201);
    const consData = JSON.parse(consRes.body).data;
    const consultationId = consData.id;

    // Finalize
    const finRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/consultations/${consultationId}/finalize`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(finRes.statusCode, 200);

    // 4. SIMULATE BROWSER RESTART WITH 0 LOCAL STORAGE:
    // Query directly from fresh API endpoints
    const freshPatientRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${patientId}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(freshPatientRes.statusCode, 200);
    const retrievedPatient = JSON.parse(freshPatientRes.body).data;
    assert.strictEqual(retrievedPatient.firstName, 'Ananya');
    assert.strictEqual(retrievedPatient.lastName, 'Deshmukh');

    const freshHistoryRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${patientId}/history`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(freshHistoryRes.statusCode, 200);
    const historyData = JSON.parse(freshHistoryRes.body).data;
    assert.strictEqual(historyData.encounters.length, 1);
    assert.strictEqual(historyData.consultations.length, 1);
    assert.strictEqual(historyData.consultations[0].status, 'FINALIZED');
    assert.strictEqual(historyData.consultations[0].diagnoses[0].diagnosisCode, 'G43.0');
    assert.strictEqual(historyData.consultations[0].medications[0].medicationName, 'Sumatriptan 50 mg Tablet');
  });
});
