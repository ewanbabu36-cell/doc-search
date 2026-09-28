import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase } from '@docsearch/database';

describe('100% Dynamic Database-Driven Architecture: Staff Administration & Clinical Operations', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_ID = '11111111-1111-4111-8111-111111111111';
  const PARTNER_ID = '00000000-0000-4000-8000-000000000001';
  const ORG_ID = '00000000-0000-4000-8000-000000000002';
  const BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const USER_ID = '99999999-9999-4999-8999-999999999999';

  function createAuthToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || USER_ID,
      email: overrides.email || 'admin@docsearch.health',
      tenantId: overrides.tenantId || TENANT_ID,
      branchId: overrides.branchId || BRANCH_ID,
      roles: overrides.roles || ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
      permissions: overrides.permissions || [
        '*',
        'partners:read',
        'partners:create',
        'partners:update',
        'partners:delete',
        'clinical:patients:read',
        'clinical:patients:create',
        'clinical:inpatient:read',
        'clinical:inpatient:create',
        'clinical:pharmacy:read',
        'clinical:pharmacy:create',
        'pharmacy:read',
        'pharmacy:medications:read',
        'pharmacy:prescriptions:read',
        'pharmacy:batches:read',
        'lab:catalog:read',
        'lab:orders:read',
        'lab:orders',
        'lab:specimens'
      ],
      dataScope: 'global',
      iss: ISSUER,
      aud: AUDIENCE,
      jti: crypto.randomUUID()
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['JWT_ISSUER'] = ISSUER;
    process.env['JWT_AUDIENCE'] = AUDIENCE;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // TEST 1: Staff Overview dynamic calculation
  it('1. GET /api/v1/partner/staff/overview returns dynamic database-computed metrics', async () => {
    const token = createAuthToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/staff/overview?partnerId=${PARTNER_ID}&organizationId=${ORG_ID}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(typeof body.data.totalStaffCount === 'number');
    assert.ok(body.data.totalStaffCount >= 0);
    assert.ok(typeof body.data.totalDepartmentsCount === 'number');
    assert.ok(body.data.totalDepartmentsCount >= 0);
  });

  // TEST 2: Staff Members list & verification that Marcus Vance is nowhere to be found
  let existingStaffId = null;
  it('2. GET /api/v1/partner/staff/members returns live database staff, no Marcus Vance', async () => {
    const token = createAuthToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/staff/members?partnerId=${PARTNER_ID}&organizationId=${ORG_ID}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));

    // Verify Marcus Vance does not exist
    const marcus = body.data.find(s => (s.fullName || '').toLowerCase().includes('marcus vance'));
    assert.equal(marcus, undefined, 'Marcus Vance must not exist in operational staff');

    if (body.data.length > 0) {
      existingStaffId = body.data[0].id;
    }
  });

  // TEST 3: Dynamic Department Creation & Retrieval
  let newDeptId = null;
  it('3. POST & GET /api/v1/partner/staff/departments dynamically persists department to database', async () => {
    const token = createAuthToken();
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/departments',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        partnerId: PARTNER_ID,
        organizationId: ORG_ID,
        branchId: BRANCH_ID,
        departmentCode: `DEP-NEURO-${Date.now().toString().slice(-4)}`,
        departmentName: 'Neurology & Brain Sciences',
        costCenterCode: 'CC-NEURO-901',
        status: 'ACTIVE'
      }
    });

    assert.equal(createRes.statusCode, 201);
    const createBody = JSON.parse(createRes.payload);
    assert.equal(createBody.success, true);
    assert.ok(createBody.data.id);
    newDeptId = createBody.data.id;

    // Verify subsequent GET retrieves the newly created department
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/staff/departments?partnerId=${PARTNER_ID}&organizationId=${ORG_ID}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(listRes.statusCode, 200);
    const listBody = JSON.parse(listRes.payload);
    assert.equal(listBody.success, true);
    const found = listBody.data.find(d => d.id === newDeptId);
    assert.ok(found, 'Newly created department must be retrieved dynamically from PostgreSQL');
    assert.equal(found.departmentName, 'Neurology & Brain Sciences');
  });

  // TEST 4: Dynamic Staff Member Creation & Retrieval
  let createdStaffId = null;
  it('4. POST & GET /api/v1/partner/staff/members dynamically persists staff profile to database', async () => {
    const token = createAuthToken();
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/members',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        partnerId: PARTNER_ID,
        organizationId: ORG_ID,
        branchId: BRANCH_ID,
        departmentId: newDeptId,
        staffCode: `STF-NEURO-${Date.now().toString().slice(-4)}`,
        fullName: 'Dr. Sneha Roy, MD',
        workEmail: `dr.sneha.${Date.now()}@docsearch.health`,
        workPhone: '+91-9876543999',
        staffType: 'DOCTOR',
        primaryRole: 'CONSULTANT_PHYSICIAN',
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        joiningDate: new Date().toISOString()
      }
    });

    assert.equal(createRes.statusCode, 201);
    const createBody = JSON.parse(createRes.payload);
    assert.equal(createBody.success, true);
    assert.ok(createBody.data.id);
    createdStaffId = createBody.data.id;

    // Verify subsequent GET retrieves the newly created staff member
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/staff/members?partnerId=${PARTNER_ID}&organizationId=${ORG_ID}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(listRes.statusCode, 200);
    const listBody = JSON.parse(listRes.payload);
    assert.equal(listBody.success, true);
    const found = listBody.data.find(s => s.id === createdStaffId);
    assert.ok(found, 'Newly created staff member must be retrieved dynamically from PostgreSQL');
    assert.equal(found.fullName, 'Dr. Sneha Roy, MD');
  });

  // TEST 5: Dynamic Role Assignment
  it('5. POST & GET /api/v1/partner/staff/roles dynamically assigns role in database', async () => {
    const token = createAuthToken();
    const assignRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/roles/assign',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        partnerId: PARTNER_ID,
        organizationId: ORG_ID,
        staffId: createdStaffId,
        roleCode: 'NEUROLOGY_LEAD',
        dataScope: 'BRANCH',
        isPrimary: true,
        effectiveFrom: new Date().toISOString()
      }
    });

    assert.equal(assignRes.statusCode, 201);
    const assignBody = JSON.parse(assignRes.payload);
    assert.equal(assignBody.success, true);
    assert.ok(assignBody.data.id);

    // Verify GET roles for this staff member
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/staff/roles?staffId=${createdStaffId}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(getRes.statusCode, 200);
    const getBody = JSON.parse(getRes.payload);
    assert.equal(getBody.success, true);
    assert.ok(getBody.data.length > 0);
    assert.equal(getBody.data[0].roleCode, 'NEUROLOGY_LEAD');
  });

  // TEST 6: Dynamic Professional Credentials
  it('6. POST & GET /api/v1/partner/staff/credentials dynamically registers license in database', async () => {
    const token = createAuthToken();
    const credRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/credentials',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        partnerId: PARTNER_ID,
        organizationId: ORG_ID,
        staffId: createdStaffId,
        credentialType: 'MEDICAL_LICENSE',
        registrationNumber: `MED-LIC-${Date.now().toString().slice(-6)}`,
        issuingAuthority: 'Karnataka Medical Council',
        issueDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        verificationStatus: 'PENDING'
      }
    });

    assert.equal(credRes.statusCode, 201);
    const credBody = JSON.parse(credRes.payload);
    assert.equal(credBody.success, true);
    assert.ok(credBody.data.id);

    // Verify GET credentials
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/staff/credentials?staffId=${createdStaffId}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(getRes.statusCode, 200);
    const getBody = JSON.parse(getRes.payload);
    assert.equal(getBody.success, true);
    assert.ok(getBody.data.length > 0);
    assert.equal(getBody.data[0].issuingAuthority, 'Karnataka Medical Council');
  });

  // TEST 7: Dynamic Staff Transfer
  it('7. POST & GET /api/v1/partner/staff/transfers dynamically records transfer in database', async () => {
    const token = createAuthToken();
    const transferRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/transfers',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        partnerId: PARTNER_ID,
        organizationId: ORG_ID,
        staffId: createdStaffId,
        toOrganizationId: ORG_ID,
        toBranchId: BRANCH_ID,
        toDepartmentId: newDeptId,
        transferType: 'INTRA_BRANCH',
        reason: 'Promotion to Department Lead',
        effectiveDate: new Date().toISOString()
      }
    });

    assert.equal(transferRes.statusCode, 201);
    const transferBody = JSON.parse(transferRes.payload);
    assert.equal(transferBody.success, true);
    assert.ok(transferBody.data.id);

    // Verify GET transfers
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/staff/transfers?staffId=${createdStaffId}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(getRes.statusCode, 200);
    const getBody = JSON.parse(getRes.payload);
    assert.equal(getBody.success, true);
    assert.ok(getBody.data.length > 0);
    assert.equal(getBody.data[0].transferStatus, 'COMPLETED');
  });

  // TEST 8: Dynamic Inpatient Wards & Beds
  it('8. GET /api/v1/partner/inpatient/wards & beds returns live database entities', async () => {
    const token = createAuthToken();
    const wardsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/inpatient/wards?branchId=${BRANCH_ID}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(wardsRes.statusCode, 200);
    const wardsBody = JSON.parse(wardsRes.payload);
    assert.equal(wardsBody.success, true);
    assert.ok(Array.isArray(wardsBody.data));

    const bedsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/inpatient/beds?branchId=${BRANCH_ID}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(bedsRes.statusCode, 200);
    const bedsBody = JSON.parse(bedsRes.payload);
    assert.equal(bedsBody.success, true);
    assert.ok(Array.isArray(bedsBody.data));
  });

  // TEST 9: Dynamic Pharmacy Medications & Batches
  it('9. GET /api/v1/partner/pharmacy/medications returns live medication database records', async () => {
    const token = createAuthToken();
    const catRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(catRes.statusCode, 200);
    const catBody = JSON.parse(catRes.payload);
    assert.equal(catBody.success, true);
    assert.ok(Array.isArray(catBody.data));
  });

  // TEST 10: Dynamic Clinical Diagnostics Catalog
  it('10. GET /api/v1/partner/lab/catalog returns live lab tests from database', async () => {
    const token = createAuthToken();
    const catRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/lab/catalog',
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(catRes.statusCode, 200);
    const catBody = JSON.parse(catRes.payload);
    assert.equal(catBody.success, true);
    assert.ok(Array.isArray(catBody.data));
  });
});
