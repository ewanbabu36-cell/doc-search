import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Emergency & Trauma Vertical Slice: Registration -> Triage -> Encounter -> Orders -> Treatment -> Disposition -> History', () => {
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
  let testEmergencyEncounterId;

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
  it('STEP 1: Create active patient for Emergency Registration', async () => {
    const token = createTestToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Vikram',
        lastName: 'Rathore',
        gender: 'MALE',
        dateOfBirth: '1979-11-20',
        mobileNumber: '+91-9876544321',
        bloodGroup: 'O_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    testPatientId = JSON.parse(patRes.body).data.id;
  });

  // STEP 2: Emergency Registration
  it('STEP 2: POST /api/v1/partner/emergency/registrations registers trauma patient with ambulance arrival', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      arrivalMode: 'AMBULANCE',
      broughtBy: '108 EMS Paramedic Unit 4',
      chiefComplaint: 'High-speed Road Traffic Accident with blunt chest trauma, severe pain, and tachycardia',
      initialPriority: 'CRITICAL'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/emergency/registrations',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.emergencyNumber);
    assert.strictEqual(body.data.status, 'REGISTERED');
    assert.strictEqual(body.data.priority, 'CRITICAL');
    testEmergencyEncounterId = body.data.id;
  });

  // STEP 3: Emergency Triage Assessment
  it('STEP 3: POST /api/v1/partner/emergency/encounters/:id/triage performs Level 1 Red Triage with vitals', async () => {
    const token = createTestToken({ userId: NURSE_ID });
    const payload = {
      patientId: testPatientId,
      triageCategory: 'RED_RESUSCITATION',
      temperature: '98.4 F',
      bloodPressure: '88/60 mmHg',
      pulseRate: '124 bpm',
      spO2: '92%',
      respiratoryRate: '28 /min',
      painScore: 9,
      glasgowComaScale: 14,
      arrivalCondition: 'Diaphoretic, severe dyspnea and tachycardia on arrival',
      triageNotes: 'Immediate resuscitation bay activation. High-flow oxygen started.'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/emergency/encounters/${testEmergencyEncounterId}/triage`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'TRIAGED');
    assert.strictEqual(body.data.priority, 'CRITICAL');
    assert.strictEqual(body.data.triage.vitals.spO2, '92%');
  });

  // STEP 4: Live Emergency Queue
  it('STEP 4: GET /api/v1/partner/emergency/queue returns patient with CRITICAL priority in active queue', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/emergency/queue',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0);
    const item = body.data.find(e => e.id === testEmergencyEncounterId);
    assert.ok(item);
    assert.strictEqual(item.priority, 'CRITICAL');
  });

  // STEP 5: Emergency Treatment & Cross-Domain Orders
  it('STEP 5: POST /api/v1/partner/emergency/encounters/:id/treatments logs emergency IV fluids, trauma orders, and repeat vitals', async () => {
    const token = createTestToken({ userId: DOCTOR_ID });
    const payload = {
      patientId: testPatientId,
      treatmentNotes: 'FAST scan positive for free fluid in splenorenal recess. 2L Normal Saline bolus administered.',
      orders: [
        { orderType: 'LAB', description: 'STAT CBC, Blood Grouping & Crossmatch 4 units, Lactate, ABG', priority: 'STAT' },
        { orderType: 'RADIOLOGY', description: 'STAT CT Trauma Scan (Chest + Abdomen + Pelvis)', priority: 'STAT' },
        { orderType: 'MEDICATION', description: 'IV Tranexamic Acid 1g bolus + IV Fentanyl 50mcg', priority: 'STAT' }
      ],
      reassessmentVitals: {
        bloodPressure: '106/72 mmHg',
        pulseRate: '98 bpm',
        spO2: '97%'
      }
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/emergency/encounters/${testEmergencyEncounterId}/treatments`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'IN_TREATMENT');
    assert.strictEqual(body.data.treatments.length, 1);
    assert.strictEqual(body.data.treatments[0].orders.length, 3);
  });

  // STEP 6: Emergency Disposition (ADMITTED to Surgical ICU)
  it('STEP 6: POST /api/v1/partner/emergency/encounters/:id/disposition records admission disposition', async () => {
    const token = createTestToken({ userId: DOCTOR_ID });
    const payload = {
      patientId: testPatientId,
      dispositionType: 'ADMITTED',
      dispositionNotes: 'Stabilized post-resuscitation. Transferred to Surgical ICU / Emergency OT for exploratory laparotomy.',
      linkedAdmissionId: 'ADM-SICU-99001'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/emergency/encounters/${testEmergencyEncounterId}/disposition`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'DISPOSITION_COMPLETED');
    assert.strictEqual(body.data.disposition.dispositionType, 'ADMITTED');
  });

  // STEP 7: Patient Emergency History
  it('STEP 7: GET /api/v1/partner/patients/:id/emergency-history retrieves full emergency encounter record', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/emergency-history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0);
    assert.strictEqual(body.data[0].id, testEmergencyEncounterId);
    assert.strictEqual(body.data[0].disposition.dispositionType, 'ADMITTED');
  });

  // STEP 8: Cross-Tenant Isolation Gate
  it('STEP 8: Tenant B user cannot access Tenant A emergency records (0 records)', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/emergency-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.length, 0);
  });
});
