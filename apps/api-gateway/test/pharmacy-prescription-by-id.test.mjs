import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS
} from '@docsearch/database';

describe('BUG-0002 Verification: GET /api/v1/partner/pharmacy/prescriptions/:id', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const BRANCH_A = TEST_SEEDS.BRANCH_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const BRANCH_B = TEST_SEEDS.BRANCH_B;
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
        '*',
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:consultations:create',
        'clinical:consultations:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, {
      secret: MASTER_SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresInSeconds: 3600
    });
  }

  function createPharmacistToken(tenantId = TENANT_A, branchId = BRANCH_A) {
    const claims = {
      sub: PHARMACIST_ID,
      email: 'pharmacist@docsearch.health',
      tenantId,
      branchId,
      roles: ['PHARMACIST', 'HOSPITAL_ADMIN'],
      permissions: [
        '*',
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
    return signJwt(claims, {
      secret: MASTER_SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresInSeconds: 3600
    });
  }

  let createdPrescriptionId;
  let createdPrescriptionNumber;

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

  it('TEST 1: Returns 404 for non-existent prescription ID', async () => {
    const token = createPharmacistToken();
    const fakeId = crypto.randomUUID();

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/pharmacy/prescriptions/${fakeId}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 404);
    const body = res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'NOT_FOUND');
  });

  it('TEST 2: Retrieves existing prescription with medication items and patient metadata', async () => {
    const docToken = createDoctorToken();
    const pharmaToken = createPharmacistToken();

    // 1. Register Patient via API
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${docToken}` },
      payload: {
        firstName: 'Ananya',
        lastName: 'Verma',
        gender: 'FEMALE',
        dateOfBirth: '1992-07-20',
        primaryMobile: '+91-9876500123'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    const patientId = patRes.json().data.id;

    // 2. Create Encounter via API
    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/encounters',
      headers: { Authorization: `Bearer ${docToken}` },
      payload: {
        patientId,
        doctorId: DOCTOR_ID,
        encounterType: 'OPD_CONSULTATION',
        chiefComplaint: 'Bacterial Pharyngitis'
      }
    });
    assert.strictEqual(encRes.statusCode, 201);
    const encounterId = encRes.json().data.id;

    // 3. Create Consultation with digital prescription via API
    const consultRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { Authorization: `Bearer ${docToken}` },
      payload: {
        encounterId,
        patientId,
        doctorId: DOCTOR_ID,
        subjective: 'Fever and throat pain for 3 days',
        objective: 'Hyperemic tonsils with exudates',
        assessment: 'Acute bacterial tonsillitis',
        plan: 'Oral amoxicillin course',
        medications: [
          {
            medicationId: '00000000-0000-4000-8000-000000000060',
            drugCode: 'MED-AMOX-500',
            dosage: '500mg',
            frequency: '1-0-1',
            duration: 7,
            quantity: 14,
            instructions: 'Take after meals with warm water'
          }
        ]
      }
    });
    assert.strictEqual(consultRes.statusCode, 201);
    const consultationId = consultRes.json().data.id;

    // 4. Complete Consultation to generate digital prescription
    const completeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/consultations/${consultationId}/complete`,
      headers: { Authorization: `Bearer ${docToken}` },
      payload: { doctorId: DOCTOR_ID }
    });
    assert.strictEqual(completeRes.statusCode, 200);
    const completeData = completeRes.json().data;
    assert.ok(completeData.prescription);
    createdPrescriptionId = completeData.prescription.id;
    createdPrescriptionNumber = completeData.prescription.prescriptionNumber;

    // 5. Query single prescription via newly implemented GET /prescriptions/:id
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/pharmacy/prescriptions/${createdPrescriptionId}`,
      headers: { Authorization: `Bearer ${pharmaToken}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, createdPrescriptionId);
    assert.strictEqual(body.data.prescriptionNumber, createdPrescriptionNumber);
    assert.strictEqual(body.data.patientName, 'Ananya Verma');
    assert.strictEqual(body.data.status, 'PENDING');
    assert.strictEqual(body.data.items.length, 1);
    assert.strictEqual(body.data.items[0].prescribedQuantity, 14);
    assert.strictEqual(body.data.items[0].instructions, 'Take after meals with warm water');
  });

  it('TEST 3: Enforces Tenant Isolation - Tenant B cannot retrieve Tenant A prescription', async () => {
    const tokenB = createPharmacistToken(TENANT_B, BRANCH_B);
    assert.ok(createdPrescriptionId, 'Expected Tenant A prescription to be created in TEST 2');

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/pharmacy/prescriptions/${createdPrescriptionId}`,
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.statusCode, 404);
  });
});
