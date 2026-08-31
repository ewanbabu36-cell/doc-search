import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('MRD & ICD-10 Vertical Slice: Record -> ICD-10 Search -> Coding -> Review -> Finalization -> Amendment -> History', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const CODER_ID = '33333333-3333-4333-8333-333333333333';
  const AUDITOR_ID = '44444444-4444-4444-8444-444444444444';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || CODER_ID,
      email: overrides.email || 'mrd.coder@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      roles: overrides.roles || ['MEDICAL_CODER', 'MRD_OFFICER', 'HOSPITAL_ADMIN'],
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
  let testRecordId;

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
  it('STEP 1: Create active patient for MRD coding', async () => {
    const token = createTestToken();
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Kavita',
        lastName: 'Sharma',
        gender: 'FEMALE',
        dateOfBirth: '1984-06-25',
        mobileNumber: '+91-9876500777',
        bloodGroup: 'AB_POSITIVE'
      }
    });
    assert.strictEqual(patRes.statusCode, 201);
    testPatientId = JSON.parse(patRes.body).data.id;
  });

  // STEP 2: Create Medical Record Index
  it('STEP 2: POST /api/v1/partner/mrd/records initializes encounter medical record index', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/mrd/records',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId: testPatientId,
        patientName: 'Kavita Sharma',
        patientMrn: 'MRN-KAV-101',
        encounterId: '00000000-0000-4000-8000-000000000101',
        encounterNumber: 'ENC-IPD-88221',
        encounterType: 'IPD',
        admissionDate: '2026-08-25T10:00:00.000Z',
        primaryAttendingDoctor: 'Dr. Ramesh Chandra, MD'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.recordNumber);
    assert.strictEqual(body.data.completionStatus, 'DRAFT');
    assert.strictEqual(body.data.codingStatus, 'PENDING_INITIAL_CODE');
    testRecordId = body.data.id;
  });

  // STEP 3: ICD-10 Catalog Search
  it('STEP 3: GET /api/v1/partner/mrd/icd10/search?q=diabetes returns validated ICD-10 code E11.9', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/mrd/icd10/search?q=diabetes',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0);
    assert.strictEqual(body.data[0].code, 'E11.9');
  });

  // STEP 4: Assign Primary ICD-10 Diagnosis
  it('STEP 4: POST /api/v1/partner/mrd/records/:id/diagnoses assigns primary diagnosis E11.9', async () => {
    const token = createTestToken({ userId: CODER_ID });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/mrd/records/${testRecordId}/diagnoses`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        icdCode: 'E11.9',
        icdDescription: 'Type 2 diabetes mellitus without complications',
        codeType: 'PRIMARY_DIAGNOSIS',
        poaIndicator: 'YES_PRESENT_ON_ADMISSION',
        sequencingOrder: 1,
        coderNotes: 'Primary principal diagnosis supported by clinical documentation and fasting glucose logs.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.codingStatus, 'CODING_COMPLETED');
    assert.strictEqual(body.data.diagnoses.length, 1);
    assert.strictEqual(body.data.diagnoses[0].icdCode, 'E11.9');
  });

  // STEP 5: Assign Secondary ICD-10 Diagnosis (Comorbidity)
  it('STEP 5: POST /api/v1/partner/mrd/records/:id/diagnoses assigns secondary comorbidity I10', async () => {
    const token = createTestToken({ userId: CODER_ID });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/mrd/records/${testRecordId}/diagnoses`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        icdCode: 'I10',
        icdDescription: 'Essential (primary) hypertension',
        codeType: 'SECONDARY_DIAGNOSIS',
        poaIndicator: 'YES_PRESENT_ON_ADMISSION',
        sequencingOrder: 2,
        coderNotes: 'Secondary chronic comorbidity on ongoing antihypertensive medication.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.diagnoses.length, 2);
  });

  // STEP 6: Invalid ICD-10 Code Rejection Safety Gate
  it('STEP 6: Invalid unverified ICD-10 code (INVALID999) is strictly rejected', async () => {
    const token = createTestToken({ userId: CODER_ID });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/mrd/records/${testRecordId}/diagnoses`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        icdCode: 'INVALID999',
        icdDescription: 'Fabricated Diagnosis',
        codeType: 'SECONDARY_DIAGNOSIS'
      }
    });

    assert.notStrictEqual(res.statusCode, 200);
  });

  // STEP 7: Submit Coding Review & Validation
  it('STEP 7: POST /api/v1/partner/mrd/records/:id/reviews records senior coder review (CODING_VERIFIED)', async () => {
    const token = createTestToken({ userId: AUDITOR_ID });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/mrd/records/${testRecordId}/reviews`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        reviewerName: 'Dr. Shalini Gupta (Lead Medical Records Auditor)',
        reviewerRole: 'LEAD_MRD_AUDITOR',
        reviewLevel: 'AUDIT_LEVEL_3',
        status: 'CODING_VERIFIED',
        findingsAndErrorsNotes: 'All physician documentation thoroughly checked against ICD-10 coding guidelines. 100% accuracy verified.',
        codingAccuracyScorePercent: 100
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.codingStatus, 'CODING_VERIFIED');
    assert.strictEqual(body.data.completionStatus, 'REVIEWED');
  });

  // STEP 8: Finalize Medical Record
  it('STEP 8: POST /api/v1/partner/mrd/records/:id/finalize locks and marks record as FINALIZED', async () => {
    const token = createTestToken({ userId: AUDITOR_ID });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/mrd/records/${testRecordId}/finalize`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        completionNotes: 'Medical record complete with discharge summary, laboratory investigations, and certified ICD-10 coding.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.completionStatus, 'FINALIZED');
  });

  // STEP 9: Controlled Record Amendment
  it('STEP 9: POST /api/v1/partner/mrd/records/:id/amend applies controlled amendment with documented justification', async () => {
    const token = createTestToken({ userId: AUDITOR_ID });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/mrd/records/${testRecordId}/amend`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amendmentReason: 'Attending physician added post-discharge follow-up glycemic management protocol.',
        additionalNotes: 'Endocrinology follow-up scheduled for 2 weeks. HbA1c target 6.5% documented.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.completionStatus, 'AMENDED');
    assert.strictEqual(body.data.amendments.length, 1);
  });

  // STEP 10: Patient Longitudinal MRD History
  it('STEP 10: GET /api/v1/partner/patients/:id/mrd-history retrieves full longitudinal record', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/mrd-history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0);
    assert.strictEqual(body.data[0].id, testRecordId);
    assert.strictEqual(body.data[0].diagnoses[0].icdCode, 'E11.9');
  });

  // STEP 11: Cross-Tenant Isolation Gate
  it('STEP 11: Tenant B user cannot access Tenant A medical records (0 records)', async () => {
    const tokenTenantB = createTestToken({ tenantId: TENANT_B });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patients/${testPatientId}/mrd-history`,
      headers: { Authorization: `Bearer ${tokenTenantB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.length, 0);
  });
});
