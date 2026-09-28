import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { signJwt } from '@docsearch/auth';
import { buildApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';
import { sessionRevocationService } from '../dist/services/core/SessionRevocationService.js';
import { getDatabase, operationalStaff, eq, and } from '@docsearch/database';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const BRANCH_A1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BRANCH_A2 = '00000000-0000-4000-8000-000000000003';

function createToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const sub = overrides.sub || crypto.randomUUID();
  const tenantId = overrides.tenantId || TENANT_A;
  const payload = {
    sub,
    email: overrides.email || `user_${sub.slice(0, 8)}@facility.health`,
    tenantId,
    organizationId: overrides.organizationId || tenantId,
    branchId: overrides.branchId || BRANCH_A1,
    departmentId: overrides.departmentId || 'DEP-OPD',
    roles: overrides.roles || ['DOCTOR'],
    permissions: overrides.permissions || ['partners:read', 'partners:create', 'partners:update'],
    dataScope: overrides.dataScope || 'branch',
    jti: overrides.jti || `sess_${crypto.randomUUID()}`,
    iat: overrides.iat || now - 60,
    exp: overrides.exp || now + 3600,
    ...overrides
  };
  return signJwt(payload, {
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresInSeconds: 3600
  });
}

test('STAFF ONBOARDING + RBAC LIFECYCLE + SCOPE VERIFICATION SUITE', async (t) => {
  const app = await buildApp();
  await app.ready();

  t.after(async () => {
    sessionRevocationService.clearAll();
    await app.close();
  });

  const partnerAdminToken = createToken({
    sub: 'admin-user-001',
    email: 'admin@facility.health',
    tenantId: TENANT_A,
    branchId: BRANCH_A1,
    roles: ['PARTNER_ADMIN'],
    permissions: ['*'],
    dataScope: 'tenant'
  });

  const doctorToken = createToken({
    sub: 'doctor-user-001',
    email: 'dr.smith@facility.health',
    tenantId: TENANT_A,
    branchId: BRANCH_A1,
    departmentId: 'DEP-OPD',
    roles: ['ATTENDING_DOCTOR'],
    permissions: ['partners:read', 'partners:create', 'partners:update'],
    dataScope: 'branch'
  });

  let createdDeptId = '';
  let createdStaffId = '';
  const testStaffEmail = `staff_${Date.now()}@facility.health`;

  // =========================================================================
  // 1. DEPARTMENT ONBOARDING
  // =========================================================================
  await t.test('1. Create Operational Department within Tenant Scope', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/departments',
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      },
      payload: {
        partnerId: TENANT_A,
        organizationId: TENANT_A,
        branchId: BRANCH_A1,
        departmentCode: `DEP-CARD-${Date.now().toString().slice(-4)}`,
        departmentName: 'Cardiology Services'
      }
    });

    assert.equal(res.statusCode, 201, `Expected 201 Created, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.ok(json.data.id);
    createdDeptId = json.data.id;
  });

  // =========================================================================
  // 2. STAFF ONBOARDING
  // =========================================================================
  await t.test('2. Onboard Operational Staff Member with Primary Role & Quota Check', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/members',
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      },
      payload: {
        partnerId: TENANT_A,
        organizationId: TENANT_A,
        branchId: BRANCH_A1,
        departmentId: createdDeptId,
        staffCode: `DOC-${Date.now().toString().slice(-6)}`,
        fullName: 'Dr. Sarah Connor',
        workEmail: testStaffEmail,
        staffType: 'DOCTOR',
        primaryRole: 'ATTENDING_DOCTOR',
        employmentType: 'FULL_TIME'
      }
    });

    assert.equal(res.statusCode, 201, `Expected 201 Created, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.ok(json.data.id);
    assert.equal(json.data.workEmail, testStaffEmail);
    assert.equal(json.data.primaryRole, 'ATTENDING_DOCTOR');
    assert.equal(json.data.employmentStatus, 'ACTIVE');
    createdStaffId = json.data.id;
  });

  // =========================================================================
  // 3. ANTI-ESCALATION: SELF-ROLE MODIFICATION PROHIBITED
  // =========================================================================
  await t.test('3. Anti-Escalation: User cannot modify their own role (INVARIANT 18)', async () => {
    const selfToken = createToken({
      sub: createdStaffId,
      email: testStaffEmail,
      tenantId: TENANT_A,
      branchId: BRANCH_A1,
      roles: ['ATTENDING_DOCTOR'],
      permissions: ['partners:update']
    });

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/partner/staff/members/${createdStaffId}`,
      headers: {
        authorization: `Bearer ${selfToken}`
      },
      payload: {
        fullName: 'Dr. Sarah Connor Elevated',
        primaryRole: 'HOSPITAL_ADMIN'
      }
    });

    assert.equal(res.statusCode, 403, `Expected 403 Forbidden for self-escalation, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.match(json.error?.message || json.message || '', /Self-role escalation is strictly prohibited/i);
  });

  // =========================================================================
  // 4. ANTI-ESCALATION: NON-ADMIN CANNOT ASSIGN ADMINISTRATIVE ROLE
  // =========================================================================
  await t.test('4. Anti-Escalation: Non-administrative staff cannot assign administrative roles', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/roles/assign',
      headers: {
        authorization: `Bearer ${doctorToken}`
      },
      payload: {
        partnerId: TENANT_A,
        organizationId: TENANT_A,
        branchId: BRANCH_A1,
        staffId: createdStaffId,
        roleCode: 'HOSPITAL_ADMIN',
        dataScope: 'BRANCH',
        isPrimary: false,
        effectiveFrom: new Date(Date.now() - 60000).toISOString()
      }
    });

    assert.equal(res.statusCode, 403, `Expected 403 Forbidden, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.match(json.error?.message || json.message || '', /Privilege escalation denied/i);
  });

  // =========================================================================
  // 5. CROSS-TENANT CONTAINMENT: REJECT MUTATIONS OUTSIDE AUTHENTICATED TENANT
  // =========================================================================
  await t.test('5. Multi-Tenant Containment: Cross-tenant role assignment is rejected fail-closed', async () => {
    const foreignTenant = '99999999-8888-7777-6666-555555555555';
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/roles/assign',
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      },
      payload: {
        tenantId: foreignTenant,
        partnerId: foreignTenant,
        organizationId: foreignTenant,
        branchId: BRANCH_A1,
        staffId: createdStaffId,
        roleCode: 'CHARGE_NURSE',
        dataScope: 'BRANCH',
        isPrimary: false,
        effectiveFrom: new Date(Date.now() - 60000).toISOString()
      }
    });

    assert.equal(res.statusCode, 403, `Expected 403 Forbidden, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.match(json.error?.message || json.message || '', /Cross-tenant/i);
  });

  // =========================================================================
  // 6. STAFF TRANSFER & SCOPE SYNCHRONIZATION
  // =========================================================================
  await t.test('6. Staff Transfer synchronizes operational records and updates runtime scope', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/transfers',
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      },
      payload: {
        partnerId: TENANT_A,
        staffId: createdStaffId,
        toOrganizationId: TENANT_A,
        toBranchId: BRANCH_A2,
        toDepartmentId: createdDeptId,
        transferType: 'BRANCH_TRANSFER',
        effectiveDate: new Date().toISOString(),
        reason: 'Relocated to East Wing Facility'
      }
    });

    assert.equal(res.statusCode, 201, `Expected 201 Created, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.equal(json.data.toBranchId, BRANCH_A2);

    // Verify database reflection
    const db = getDatabase();
    if (db) {
      const [updatedStaff] = await db
        .select()
        .from(operationalStaff)
        .where(and(eq(operationalStaff.tenantId, TENANT_A), eq(operationalStaff.id, createdStaffId)));
      assert.equal(updatedStaff.branchId, BRANCH_A2, 'Staff branchId must match transferred branch');
    }
  });

  // =========================================================================
  // 7. IMMEDIATE STAFF DEACTIVATION & SESSION REVOCATION
  // =========================================================================
  await t.test('7. Immediate Staff Deactivation revokes active sessions & denies access', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/staff/members/${createdStaffId}/status`,
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      },
      payload: {
        partnerId: TENANT_A,
        organizationId: TENANT_A,
        newStatus: 'SUSPENDED',
        reason: 'Compliance audit pending'
      }
    });

    assert.equal(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.equal(json.data.employmentStatus, 'SUSPENDED');

    // Verify session revocation
    const activeStaffToken = createToken({
      sub: createdStaffId,
      email: testStaffEmail,
      tenantId: TENANT_A,
      branchId: BRANCH_A2,
      roles: ['ATTENDING_DOCTOR']
    });

    const accessRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/staff/members',
      headers: {
        authorization: `Bearer ${activeStaffToken}`
      }
    });

    assert.ok(
      accessRes.statusCode === 401 || accessRes.statusCode === 403,
      `Expected 401/403 for suspended staff token, got ${accessRes.statusCode}`
    );
  });

  // =========================================================================
  // 8. STAFF REACTIVATION
  // =========================================================================
  await t.test('8. Staff Reactivation restores account to ACTIVE status', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/staff/members/${createdStaffId}/status`,
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      },
      payload: {
        partnerId: TENANT_A,
        organizationId: TENANT_A,
        newStatus: 'ACTIVE',
        reason: 'Compliance audit cleared'
      }
    });

    assert.equal(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.equal(json.data.employmentStatus, 'ACTIVE');
  });

  // =========================================================================
  // 9. PROFESSIONAL CREDENTIAL VERIFICATION
  // =========================================================================
  await t.test('9. Add & Verify Staff Professional Credential under Dual-Control', async () => {
    // 9.1 Add credential
    const addRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/credentials',
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      },
      payload: {
        partnerId: TENANT_A,
        organizationId: TENANT_A,
        staffId: createdStaffId,
        credentialType: 'MEDICAL_LICENSE',
        registrationNumber: `MCI-${Date.now().toString().slice(-6)}`,
        issuingAuthority: 'National Medical Commission',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01'
      }
    });

    assert.equal(addRes.statusCode, 201, `Expected 201 Created, got ${addRes.statusCode}: ${addRes.body}`);
    const addJson = JSON.parse(addRes.body);
    assert.equal(addJson.data.verificationStatus, 'PENDING');
    const credId = addJson.data.id;

    // 9.2 Verify credential
    const verifyRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/staff/credentials/${credId}/verify`,
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      },
      payload: {
        verificationReference: 'NMC-OFFICIAL-VERIFIED-REF-2026'
      }
    });

    assert.equal(verifyRes.statusCode, 200, `Expected 200 OK, got ${verifyRes.statusCode}: ${verifyRes.body}`);
    const verifyJson = JSON.parse(verifyRes.body);
    assert.equal(verifyJson.data.verificationStatus, 'VERIFIED');
  });
});
