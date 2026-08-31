import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Blood Bank & Transfusion Vertical Slice: Donor -> Collection -> Separation -> TTI Test -> Crossmatch -> Issue -> Transfusion -> History', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const DOCTOR_ID = '99999999-9999-4999-8999-999999999999';
  const TECH_ID = '77777777-7777-4777-8777-777777777777';
  const NURSE_ID = '66666666-6666-4666-8666-666666666666';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_ID,
      email: overrides.email || 'transfusion.specialist@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN', 'NURSE', 'PATHOLOGIST'],
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
  let testDonorId;
  let testDonationId;
  let testPrbcComponentId;
  let testRequestId;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // STEP 1: Patient Baseline
  it('STEP 1: Create recipient patient for transfusion', async () => {
    const token = createTestToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Amit',
        lastName: 'Patel',
        gender: 'MALE',
        dateOfBirth: '1982-11-20',
        mobileNumber: '+91-9876500991',
        bloodGroup: 'O_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    testPatientId = JSON.parse(patRes.body).data.id;
  });

  // STEP 2: Register Blood Donor
  it('STEP 2: POST /api/v1/partner/blood-bank/donors registers voluntary donor (O+)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/blood-bank/donors',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        fullName: 'Vikram Singh',
        gender: 'MALE',
        dateOfBirth: '1990-05-15',
        mobileNumber: '+91-9811122334',
        bloodGroup: 'O_POSITIVE',
        donorType: 'VOLUNTARY',
        screeningPassed: true,
        hemoglobinGdl: 15.2
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.donorNumber);
    testDonorId = body.data.id;
  });

  // STEP 3: Blood Collection / Donation
  it('STEP 3: POST /api/v1/partner/blood-bank/donations records 450ml Whole Blood bleeding', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/blood-bank/donations',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        donorId: testDonorId,
        bagBarcode: 'BAG-O-1002',
        bloodGroup: 'O_POSITIVE',
        donationType: 'WHOLE_BLOOD',
        volumeMl: 450,
        anticoagulant: 'CPDA_1'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'COLLECTED');
    testDonationId = body.data.id;
  });

  // STEP 4: Component Separation
  it('STEP 4: POST /api/v1/partner/blood-bank/components/separate generates PRBC, FFP, and Platelets', async () => {
    const token = createTestToken({ userId: TECH_ID });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/blood-bank/components/separate',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        donationId: testDonationId,
        donorId: testDonorId,
        parentBagBarcode: 'BAG-O-1002',
        bloodGroup: 'O_POSITIVE'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 3);

    const prbc = body.data.find(c => c.componentType === 'PRBC');
    assert.ok(prbc);
    assert.strictEqual(prbc.status, 'TESTING_PENDING');
    testPrbcComponentId = prbc.id;
  });

  // STEP 5: Mandatory TTI Testing (TESTED_SAFE)
  it('STEP 5: POST /api/v1/partner/blood-bank/tests confirms negative TTI panel (Releases to AVAILABLE)', async () => {
    const token = createTestToken({ userId: TECH_ID });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/blood-bank/tests',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        donationId: testDonationId,
        hivResult: 'NON_REACTIVE',
        hbsagResult: 'NON_REACTIVE',
        hcvResult: 'NON_REACTIVE',
        syphilisResult: 'NON_REACTIVE',
        malariaResult: 'NEGATIVE',
        aboRhConfirmation: 'O_POSITIVE',
        overallStatus: 'TESTED_SAFE'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'AVAILABLE');

    // Verify inventory returns PRBC as AVAILABLE
    const invRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/blood-bank/inventory?bloodGroup=O_POSITIVE&componentType=PRBC&status=AVAILABLE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const inv = JSON.parse(invRes.body).data;
    assert.ok(inv.length > 0);
    assert.strictEqual(inv[0].status, 'AVAILABLE');
  });

  // STEP 6: Clinical Blood Request
  it('STEP 6: POST /api/v1/partner/blood-bank/requests creates doctor requisition for 1 Unit PRBC', async () => {
    const token = createTestToken({ userId: DOCTOR_ID });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/blood-bank/requests',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        doctorId: DOCTOR_ID,
        bloodGroup: 'O_POSITIVE',
        componentType: 'PRBC',
        unitsRequested: 1,
        urgency: 'URGENT',
        clinicalIndication: 'Severe Acute Anemia with Hb 6.4 g/dL secondary to Upper GI Bleed'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.requestNumber);
    assert.strictEqual(body.data.status, 'REQUESTED');
    testRequestId = body.data.id;
  });

  // STEP 7: Crossmatch & Compatibility Verification
  it('STEP 7: POST /api/v1/partner/blood-bank/crossmatch verifies major crossmatch compatibility (Reserves unit)', async () => {
    const token = createTestToken({ userId: TECH_ID });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/blood-bank/crossmatch',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        requestId: testRequestId,
        componentId: testPrbcComponentId,
        patientId: testPatientId,
        crossmatchMethod: 'Gel Card Direct Antiglobulin Test (Coombs)',
        compatibilityResult: 'COMPATIBLE',
        crossmatchNotes: 'No agglutination or hemolysis observed. Unit is 100% compatible for recipient.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'CROSSMATCHED');
    assert.strictEqual(body.data.crossmatch.compatibilityResult, 'COMPATIBLE');
  });

  // STEP 8: Safe Blood Unit Issue
  it('STEP 8: POST /api/v1/partner/blood-bank/issue dispenses blood unit to ICU staff nurse', async () => {
    const token = createTestToken({ userId: TECH_ID });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/blood-bank/issue',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        requestId: testRequestId,
        componentId: testPrbcComponentId,
        patientId: testPatientId,
        issuedToStaff: 'Staff Nurse Sunita (ICU)',
        storageTempCelsius: 3.8
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'ISSUED');
  });

  // STEP 9: Bedside Transfusion Record
  it('STEP 9: POST /api/v1/partner/blood-bank/transfusions logs pre/post vitals and 0 adverse reactions', async () => {
    const token = createTestToken({ userId: NURSE_ID });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/blood-bank/transfusions',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        requestId: testRequestId,
        componentId: testPrbcComponentId,
        patientId: testPatientId,
        preTransfusionVitals: {
          bloodPressure: '100/64 mmHg',
          heartRate: '98 bpm',
          temperature: '98.4 F'
        },
        postTransfusionVitals: {
          bloodPressure: '118/76 mmHg',
          heartRate: '78 bpm',
          temperature: '98.6 F'
        },
        transfusionReactionObserved: false
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'TRANSFUSED');
    assert.strictEqual(body.data.transfusion.transfusionReactionObserved, false);
  });

  // STEP 10: Patient Transfusion History
  it('STEP 10: GET /api/v1/partner/patients/:id/transfusion-history retrieves complete transfusion record', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/transfusion-history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0);
    assert.strictEqual(body.data[0].id, testRequestId);
    assert.strictEqual(body.data[0].status, 'TRANSFUSED');
  });

  // STEP 11: Cross-Tenant Isolation Gate
  it('STEP 11: Tenant B user cannot view Tenant A transfusion history (0 records)', async () => {
    const tokenTenantB = createTestToken({ tenantId: TENANT_B });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/transfusion-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.length, 0);
  });
});
