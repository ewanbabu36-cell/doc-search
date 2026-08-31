import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Operation Theatre & Surgery Vertical Slice: Booking -> PAC -> Intra-Op -> PACU -> Post-Op Transfer -> History', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const SURGEON_ID = '99999999-9999-4999-8999-999999999999';
  const ANAESTHETIST_ID = '88888888-8888-4888-8888-888888888888';
  const PACU_NURSE_ID = '66666666-6666-4666-8666-666666666666';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || SURGEON_ID,
      email: overrides.email || 'surgeon@docsearch.health',
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
  let testOTRoomId;
  let testScheduleId;

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
  it('STEP 1: Create active patient for surgical booking', async () => {
    const token = createTestToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Rajesh',
        lastName: 'Khanna',
        gender: 'MALE',
        dateOfBirth: '1975-03-12',
        mobileNumber: '+91-9876500112',
        bloodGroup: 'A_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    testPatientId = JSON.parse(patRes.body).data.id;
  });

  // STEP 2: Create OT Major Room
  it('STEP 2: POST /api/v1/partner/ot/rooms creates Major OT Room 1', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ot/rooms',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        roomNumber: 'OT-MAJOR-01',
        name: 'Main Modular Laparoscopic Theatre',
        roomType: 'MAJOR',
        capacity: 1
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'AVAILABLE');
    testOTRoomId = body.data.id;
  });

  // STEP 3: Surgery Booking & OT Scheduling
  it('STEP 3: POST /api/v1/partner/ot/schedules books Laparoscopic Cholecystectomy', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      leadSurgeonId: SURGEON_ID,
      leadSurgeonName: 'Dr. Amitabh Verma, MS (General Surgery)',
      otRoomId: testOTRoomId,
      procedureName: 'Laparoscopic Cholecystectomy with Intraoperative Cholangiogram',
      procedureCode: 'PROC-LAP-CHOL-01',
      scheduledDate: '2026-09-01',
      estimatedDurationMinutes: 90,
      urgencyLevel: 'ELECTIVE',
      preOpDiagnosis: 'Symptomatic Cholelithiasis with Chronic Cholecystitis'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ot/schedules',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.scheduleNumber);
    assert.strictEqual(body.data.status, 'SCHEDULED');
    testScheduleId = body.data.id;
  });

  // STEP 4: Pre-Operative PAC Clearance
  it('STEP 4: POST /api/v1/partner/ot/schedules/:id/pac records Pre-Anaesthesia clearance (FIT_FOR_SURGERY)', async () => {
    const token = createTestToken({ userId: ANAESTHETIST_ID });
    const payload = {
      patientId: testPatientId,
      anaesthetistName: 'Dr. Sunita Rao, MD (Anaesthesiology)',
      asaClassification: 'ASA_II',
      airwayAssessment: 'MALLAMPATI_1',
      fitnessStatus: 'FIT_FOR_SURGERY',
      pacNotes: 'Airway Mallampati Class 1, Neck mobility normal. Pre-op bloods & ECG within normal limits. Fit for General Anaesthesia with Endotracheal Intubation.'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/ot/schedules/${testScheduleId}/pac`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'PAC_CLEARED');
    assert.strictEqual(body.data.pacAssessment.fitnessStatus, 'FIT_FOR_SURGERY');
  });

  // STEP 5: Intra-Operative Notes
  it('STEP 5: POST /api/v1/partner/ot/schedules/:id/operative-notes records surgeon notes, findings, and titanium clips', async () => {
    const token = createTestToken({ userId: SURGEON_ID });
    const payload = {
      patientId: testPatientId,
      surgeonName: 'Dr. Amitabh Verma, MS',
      procedurePerformed: 'Laparoscopic Cholecystectomy',
      intraOpFindings: 'Distended gallbladder with multiple facet stones. Calots triangle clearly dissected.',
      operativeTechnique: 'Standard 4-port technique. Cystic duct and artery doubly clipped with Titanium Hem-o-lok clips and divided. Gallbladder dissected off liver bed and retrieved via endobag.',
      implantUsed: 'Titanium Hem-o-lok Clips (Medium-Large x 4)',
      estimatedBloodLossMl: 30,
      surgicalNotes: 'Uneventful surgery. Hemostasis achieved. Subhepatic drain placed.'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/ot/schedules/${testScheduleId}/operative-notes`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'IN_THEATRE');
    assert.strictEqual(body.data.operativeNotes.estimatedBloodLossMl, 30);
  });

  // STEP 6: PACU Post-Operative Recovery
  it('STEP 6: POST /api/v1/partner/ot/schedules/:id/pacu records Aldrete score 9/10 and vitals', async () => {
    const token = createTestToken({ userId: PACU_NURSE_ID });
    const payload = {
      patientId: testPatientId,
      aldreteScore: 9,
      temperature: '98.2 F',
      bloodPressure: '124/82 mmHg',
      heartRate: '76 bpm',
      spO2: '99%',
      painScore: 2,
      recoveryNotes: 'Patient awake, responding to verbal commands, breathing spontaneously on room air with SpO2 99%. Stable for ward transfer.'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/ot/schedules/${testScheduleId}/pacu`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.pacuRecovery.aldreteScore, 9);
  });

  // STEP 7: Post-Op Transfer to Surgical Ward
  it('STEP 7: POST /api/v1/partner/ot/schedules/:id/transfer-postop completes surgery and releases OT Room', async () => {
    const token = createTestToken({ userId: SURGEON_ID });
    const payload = {
      patientId: testPatientId,
      destinationType: 'SURGICAL_WARD',
      destinationWardOrBed: 'Surgical Ward B, Bed 204',
      transferNotes: 'Transferred to Surgical Ward under post-op standing orders. Monitor vitals Q2H.'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/ot/schedules/${testScheduleId}/transfer-postop`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'COMPLETED');

    // Verify OT Room is released back to AVAILABLE
    const roomsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ot/rooms',
      headers: { Authorization: `Bearer ${token}` }
    });
    const rooms = JSON.parse(roomsRes.body).data;
    const room = rooms.find(r => r.id === testOTRoomId);
    assert.strictEqual(room.status, 'AVAILABLE');
  });

  // STEP 8: Patient Surgical History
  it('STEP 8: GET /api/v1/partner/patients/:id/surgical-history retrieves full surgery record', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/surgical-history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0);
    assert.strictEqual(body.data[0].id, testScheduleId);
    assert.strictEqual(body.data[0].status, 'COMPLETED');
    assert.strictEqual(body.data[0].operativeNotes.procedurePerformed, 'Laparoscopic Cholecystectomy');
  });

  // STEP 9: Cross-Tenant Isolation Gate
  it('STEP 9: Tenant B user cannot access Tenant A surgery records (0 records)', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/surgical-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.length, 0);
  });
});
