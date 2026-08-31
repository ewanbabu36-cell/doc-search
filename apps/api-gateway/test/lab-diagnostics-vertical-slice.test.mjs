import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Lab & Diagnostics Vertical Slice: Order -> Specimen -> Result -> Verification -> Review -> History', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const DOCTOR_ID = '99999999-9999-4999-8999-999999999999';
  const LAB_TECH_ID = '88888888-8888-4888-8888-888888888888';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_ID,
      email: overrides.email || 'doctor@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN', 'PATHOLOGIST'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:consultations:create',
        'clinical:consultations:read',
        'lab:orders:create',
        'lab:orders:read',
        'lab:orders:update',
        'lab:specimens:create',
        'lab:results:create',
        'lab:results:update'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let testPatientId;
  let testEncounterId;
  let testOrderId;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // STEP 1: Register Patient & Encounter
  it('STEP 1: Create active patient and OPD encounter baseline', async () => {
    const token = createTestToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Meera',
        lastName: 'Nair',
        gender: 'FEMALE',
        dateOfBirth: '1990-03-22',
        mobileNumber: '+91-9876540011',
        bloodGroup: 'O_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    testPatientId = JSON.parse(patRes.body).data.id;

    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/encounters',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        doctorId: DOCTOR_ID,
        encounterType: 'OPD',
        chiefComplaint: 'Generalized fatigue, weakness and pale conjunctiva'
      }
    });
    assert.strictEqual(encRes.statusCode, 201);
    testEncounterId = JSON.parse(encRes.body).data.id;
  });

  // STEP 2: Doctor Orders Lab Test
  it('STEP 2: POST /api/v1/partner/lab/orders orders Complete Blood Count (CBC) with clinical indication', async () => {
    const token = createTestToken();
    const payload = {
      patientId: testPatientId,
      encounterId: testEncounterId,
      testCode: 'CBC',
      testName: 'Complete Blood Count with Differential',
      category: 'HEMATOLOGY',
      priority: 'URGENT',
      clinicalIndication: 'Suspected nutritional anemia vs chronic blood loss',
      instructions: 'Fasting not required'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.testCode, 'CBC');
    assert.strictEqual(body.data.status, 'ORDERED');
    assert.ok(body.data.orderNumber);
    testOrderId = body.data.id;
  });

  // STEP 3: Lab Worklist Verification
  it('STEP 3: GET /api/v1/partner/lab/orders lists ordered test in Lab Worklist', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/lab/orders?status=ORDERED',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    const found = body.data.find(o => o.id === testOrderId);
    assert.ok(found, 'Order must appear on Lab Worklist');
    assert.strictEqual(found.priority, 'URGENT');
  });

  // STEP 4: Sample Collection
  it('STEP 4: POST /api/v1/partner/lab/orders/:id/collect-sample records specimen collection and accession number', async () => {
    const token = createTestToken({ userId: LAB_TECH_ID });
    const payload = {
      patientId: testPatientId,
      specimenType: 'WHOLE_BLOOD_EDTA',
      containerType: 'LAVENDER_TOP_TUBE',
      collectionNotes: 'Sample collected from left antecubital vein without complications'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${testOrderId}/collect-sample`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'SAMPLE_COLLECTED');
    assert.ok(body.data.specimen);
    assert.strictEqual(body.data.specimen.specimenType, 'WHOLE_BLOOD_EDTA');
    assert.ok(body.data.specimen.accessionNumber);
  });

  // STEP 5: Result Entry
  it('STEP 5: POST /api/v1/partner/lab/orders/:id/results records hemoglobin test results', async () => {
    const token = createTestToken({ userId: LAB_TECH_ID });
    const payload = {
      parameterCode: 'HGB',
      parameterName: 'Hemoglobin',
      resultValue: '10.2',
      numericValue: 10.2,
      unit: 'g/dL',
      referenceRange: '12.0 - 15.5 g/dL',
      abnormalFlag: 'LOW',
      notes: 'Microcytic hypochromic picture observed on blood film'
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${testOrderId}/results`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'RESULT_ENTERED');
    assert.strictEqual(body.data.results.length, 1);
    assert.strictEqual(body.data.results[0].parameterCode, 'HGB');
    assert.strictEqual(body.data.results[0].abnormalFlag, 'LOW');
  });

  // STEP 6: Result Verification by Pathologist
  it('STEP 6: PATCH /api/v1/partner/lab/orders/:id/verify locks and verifies test results', async () => {
    const token = createTestToken({ userId: 'pathologist-uuid-001' });
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/lab/orders/${testOrderId}/verify`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'VERIFIED');
    assert.ok(body.data.results[0].verifiedBy);
  });

  // STEP 7: Doctor Review
  it('STEP 7: PATCH /api/v1/partner/lab/orders/:id/review records attending doctor acknowledgement and review notes', async () => {
    const token = createTestToken({ userId: DOCTOR_ID });
    const payload = {
      doctorNotes: 'Reviewed low Hb 10.2 g/dL. Initiate oral Iron supplement (Ferrous Ascorbate 100mg) and repeat CBC in 4 weeks.'
    };

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/lab/orders/${testOrderId}/review`,
      headers: { Authorization: `Bearer ${token}` },
      payload
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'COMPLETED');
    assert.ok(body.data.review);
    assert.strictEqual(body.data.review.reviewedBy, DOCTOR_ID);
  });

  // STEP 8: Patient Clinical History Retrieval
  it('STEP 8: GET /api/v1/partner/patients/:id/lab-history retrieves full verified lab history', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/lab-history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0);
    const found = body.data.find(o => o.id === testOrderId);
    assert.ok(found);
    assert.strictEqual(found.status, 'COMPLETED');
    assert.strictEqual(found.results[0].resultValue, '10.2');
  });

  // STEP 9: Cross-Tenant Isolation Gate
  it('STEP 9: Tenant B user cannot view Tenant A lab orders or results (Empty list / isolated)', async () => {
    const tokenTenantB = createTestToken({
      tenantId: TENANT_B
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/lab-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.length, 0, 'Tenant B must see 0 orders for Tenant A patient');
  });
});
