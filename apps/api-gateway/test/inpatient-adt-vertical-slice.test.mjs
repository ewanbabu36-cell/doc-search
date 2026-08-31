import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('IPD / ADT Vertical Slice: Admission -> Bed -> Nursing -> Transfer -> Discharge -> History', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const DOCTOR_ID = '99999999-9999-4999-8999-999999999999';
  const NURSE_ID = '66666666-6666-4666-8666-666666666666';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_ID,
      email: overrides.email || 'doctor@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN', 'NURSE'],
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
  let testWardId;
  let testBed1Id;
  let testBed2Id;
  let testAdmissionId;

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
  it('STEP 1: Create active patient for IPD admission', async () => {
    const token = createTestToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Ananya',
        lastName: 'Sharma',
        gender: 'FEMALE',
        dateOfBirth: '1985-06-14',
        mobileNumber: '+91-9876599887',
        bloodGroup: 'B_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    testPatientId = JSON.parse(patRes.body).data.id;
  });

  // STEP 2: Create Ward & Two Beds
  it('STEP 2: POST /api/v1/partner/inpatient/wards & beds creates General Ward with Bed-101 and Bed-102', async () => {
    const token = createTestToken();

    // Create Ward
    const wardRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/wards',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        wardCode: 'WARD-GEN-A',
        name: 'General Medical Ward A',
        wardType: 'GENERAL_WARD',
        capacity: 20
      }
    });
    assert.strictEqual(wardRes.statusCode, 201);
    testWardId = JSON.parse(wardRes.body).data.id;

    // Create Bed 1
    const bed1Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        wardId: testWardId,
        bedNumber: 'BED-101',
        bedType: 'STANDARD'
      }
    });
    assert.strictEqual(bed1Res.statusCode, 201);
    testBed1Id = JSON.parse(bed1Res.body).data.id;

    // Create Bed 2
    const bed2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        wardId: testWardId,
        bedNumber: 'BED-102',
        bedType: 'STANDARD'
      }
    });
    assert.strictEqual(bed2Res.statusCode, 201);
    testBed2Id = JSON.parse(bed2Res.body).data.id;
  });

  // STEP 3: Admit Patient into Bed-101
  it('STEP 3: POST /api/v1/partner/inpatient/admissions admits patient and marks Bed-101 as OCCUPIED', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      doctorId: DOCTOR_ID,
      department: 'INTERNAL_MEDICINE',
      bedId: testBed1Id,
      admissionReason: 'Acute exacerbation of chronic bronchial asthma requiring IV nebulization & oxygen support'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/admissions',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'ADMITTED');
    assert.ok(body.data.admissionNumber);
    assert.ok(body.data.encounterId);
    testAdmissionId = body.data.id;

    // Verify Bed-101 is now OCCUPIED
    const bedsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` }
    });
    const beds = JSON.parse(bedsRes.body).data;
    const bed1 = beds.find(b => b.id === testBed1Id);
    assert.strictEqual(bed1.status, 'OCCUPIED');
  });

  // STEP 4: Double-Booking Gate
  it('STEP 4: Attempting to admit another patient into already OCCUPIED Bed-101 is rejected', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      doctorId: DOCTOR_ID,
      department: 'INTERNAL_MEDICINE',
      bedId: testBed1Id,
      admissionReason: 'Duplicate admission test'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/admissions',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 500);
  });

  // STEP 5: Nursing Care & Vitals Recording
  it('STEP 5: POST /api/v1/partner/inpatient/nursing-notes records vitals and nursing care notes', async () => {
    const token = createTestToken({ userId: NURSE_ID });
    const payload = {
      patientId: testPatientId,
      admissionId: testAdmissionId,
      temperature: '98.6 F',
      bloodPressure: '120/80 mmHg',
      pulseRate: '78 bpm',
      spO2: '98%',
      respiratoryRate: '18 /min',
      notes: 'Patient administered IV hydrocortisone & Duolin nebulization. Wheezing reduced significantly.',
      careObservations: 'Patient alert and oriented, sitting upright comfortably with 2L nasal cannula oxygen.'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/nursing-notes',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.vitals.spO2, '98%');
  });

  // STEP 6: Bed Transfer (Bed-101 -> Bed-102)
  it('STEP 6: POST /api/v1/partner/inpatient/transfers transfers patient from Bed-101 to Bed-102', async () => {
    const token = createTestToken();
    const payload = {
      admissionId: testAdmissionId,
      patientId: testPatientId,
      sourceBedId: testBed1Id,
      destinationBedId: testBed2Id,
      transferReason: 'Transferred to step-down section closer to nursing station'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/inpatient/transfers',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);

    // Verify Bed-101 is now AVAILABLE and Bed-102 is OCCUPIED
    const bedsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` }
    });
    const beds = JSON.parse(bedsRes.body).data;
    const bed1 = beds.find(b => b.id === testBed1Id);
    const bed2 = beds.find(b => b.id === testBed2Id);
    assert.strictEqual(bed1.status, 'AVAILABLE');
    assert.strictEqual(bed2.status, 'OCCUPIED');
  });

  // STEP 7: Discharge Patient & Release Bed-102
  it('STEP 7: POST /api/v1/partner/inpatient/admissions/:id/discharge finalizes discharge and releases Bed-102', async () => {
    const token = createTestToken({ userId: DOCTOR_ID });
    const payload = {
      patientId: testPatientId,
      dischargeReason: 'Clinical recovery achieved, asymptomatic on oral bronchodilators',
      dischargeCondition: 'STABLE',
      finalClinicalNotes: 'Discharged on oral inhaler Budesonide/Formoterol 200mcg and follow-up in OPD after 1 week.'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/inpatient/admissions/${testAdmissionId}/discharge`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'DISCHARGED');

    // Verify Bed-102 is now AVAILABLE
    const bedsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/inpatient/beds',
      headers: { Authorization: `Bearer ${token}` }
    });
    const beds = JSON.parse(bedsRes.body).data;
    const bed2 = beds.find(b => b.id === testBed2Id);
    assert.strictEqual(bed2.status, 'AVAILABLE');
  });

  // STEP 8: Patient Inpatient History
  it('STEP 8: GET /api/v1/partner/patients/:id/inpatient-history returns complete IPD admission history', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/inpatient-history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0);
    assert.strictEqual(body.data[0].id, testAdmissionId);
    assert.strictEqual(body.data[0].status, 'DISCHARGED');
  });

  // STEP 9: Cross-Tenant Isolation Gate
  it('STEP 9: Tenant B user cannot access Tenant A IPD admission history (0 records)', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/inpatient-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.length, 0);
  });
});
