/**
 * DOC SEARCH — PHASE 17 ENTERPRISE CONTROL PLANE HARDENING ADVERSARIAL TEST SUITE
 *
 * Verifies all hardened control plane gates, anti-tamper defenses, and fail-closed security invariants:
 * - VULN-P17-01: Anonymous Account Takeover on reset-password fails closed (401/403)
 * - VULN-P17-02: Anonymous Hard Purge / Partner Deletion fails closed (401/403)
 * - VULN-P17-03: Elimination of lax optionalAuthenticate on sensitive administrative routes
 * - VULN-P17-04: Cross-Tenant IDOR on /api/v1/company/partners/:partnerId/* strictly blocked (403)
 * - VULN-P17-05: Self-Role Escalation in StaffAdministrationService strictly prohibited (403)
 * - VULN-P17-06: Cross-Partner Parameter Tampering in request body/query blocked by auth-guard (403)
 * - Authoritative HQ Governance: SUPER_ADMIN & COMPANY_ADMIN authorized control
 * - Cryptographic & Zero-Trust Invariants: Malformed/expired tokens fail closed (401)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS, operationalStaff, getDatabase } from '@docsearch/database';
import { staffAdministrationService } from '../dist/services/partner/StaffAdministrationService.js';

describe('DOC SEARCH — Phase 17 Enterprise Control Plane Hardening Test Suite', () => {
  let app;
  let testDb;
  let testStaffId;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A; // 11111111-1111-4111-8111-111111111111
  const TENANT_B = TEST_SEEDS.TENANT_B; // 22222222-2222-4222-8222-222222222222
  const BRANCH_A = TEST_SEEDS.BRANCH_A;

  function createToken(tenantId, roles = ['HOSPITAL_ADMIN'], permissions = ['partners:read', 'partners:update'], email = 'admin@tenant.health') {
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const claims = {
      sub: crypto.randomUUID(),
      email,
      tenantId,
      branchId: BRANCH_A,
      roles,
      permissions,
      isSuperAdmin,
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let tokenSuperAdmin;
  let tokenCompanyAdmin;
  let tokenTenantA;
  let tokenTenantB;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['LICENSE_HMAC_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';

    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
    app = await buildApp();
    await app.ready();

    testStaffId = TEST_SEEDS.STAFF_ID_A;

    tokenSuperAdmin = createToken(TENANT_A, ['SUPER_ADMIN'], ['*'], 'superadmin@docsearch.internal');
    tokenCompanyAdmin = createToken(TENANT_A, ['COMPANY_ADMIN'], ['*'], 'companyadmin@docsearch.internal');
    tokenTenantA = createToken(TENANT_A, ['HOSPITAL_ADMIN', 'PARTNER_ADMIN'], ['partners:read', 'partners:update'], 'admin@tenant-a.com');
    tokenTenantB = createToken(TENANT_B, ['HOSPITAL_ADMIN', 'PARTNER_ADMIN'], ['partners:read', 'partners:update'], 'admin@tenant-b.com');
  });

  after(async () => {
    if (app) await app.close();
  });

  // ===========================================================================
  // 1. VULN-P17-01: ACCOUNT TAKEOVER VIA PASSWORD RESET HARDENING
  // ===========================================================================
  it('TEST 01: VULN-P17-01 — Anonymous POST /api/v1/company/partners/reset-password fails closed with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners/reset-password',
      payload: {
        partnerId: TENANT_A,
        newPassword: 'HackedPassword123!'
      }
    });

    assert.equal(res.statusCode, 401, 'Anonymous password reset must be strictly rejected with 401');
  });

  it('TEST 02: VULN-P17-01 — Non-HQ Partner Token calling reset-password fails closed with 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners/reset-password',
      headers: { authorization: `Bearer ${tokenTenantA}` },
      payload: {
        partnerId: TENANT_B,
        newPassword: 'HackedPassword123!'
      }
    });

    assert.equal(res.statusCode, 403, 'Partner user cannot perform administrative password resets');
  });

  // ===========================================================================
  // 2. VULN-P17-02: UNRESTRICTED HARD CASCADE PURGE & PARTNER DELETION
  // ===========================================================================
  it('TEST 03: VULN-P17-02 — Anonymous DELETE /api/v1/company/partners/:partnerId fails closed with 401', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/company/partners/${TENANT_A}`
    });

    assert.equal(res.statusCode, 401, 'Anonymous hard purge of partner must be rejected with 401');
  });

  it('TEST 04: VULN-P17-02 — Non-HQ Partner Token DELETE /api/v1/company/partners/:partnerId fails closed with 403', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/company/partners/${TENANT_B}`,
      headers: { authorization: `Bearer ${tokenTenantA}` }
    });

    assert.equal(res.statusCode, 403, 'Non-HQ partner tokens cannot delete partner profiles');
  });

  it('TEST 05: VULN-P17-02 — Anonymous DELETE /api/v1/company/partners/staged/:partnerId fails closed with 401', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/company/partners/staged/${TENANT_A}`
    });

    assert.equal(res.statusCode, 401, 'Anonymous purge of staged lead must be rejected with 401');
  });

  // ===========================================================================
  // 3. VULN-P17-03: ADMINISTRATIVE CLEAR-TOMBSTONES & PURGE RESET DEFENSE
  // ===========================================================================
  it('TEST 06: VULN-P17-03 — Anonymous POST /api/v1/company/partners/clear-tombstones fails closed with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners/clear-tombstones'
    });

    assert.equal(res.statusCode, 401, 'Anonymous tombstone clearing must be rejected with 401');
  });

  it('TEST 07: VULN-P17-03 — Non-HQ Partner Token POST /api/v1/company/partners/clear-tombstones fails closed with 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners/clear-tombstones',
      headers: { authorization: `Bearer ${tokenTenantA}` }
    });

    assert.equal(res.statusCode, 403, 'Partner tokens cannot clear administrative tombstones');
  });

  // ===========================================================================
  // 4. VULN-P17-04: CROSS-TENANT IDOR ON PARTNER OPERATIONAL ROUTES
  // ===========================================================================
  it('TEST 08: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId/360 rejected with 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/${TENANT_B}/360`,
      headers: { authorization: `Bearer ${tokenTenantA}` }
    });

    assert.equal(res.statusCode, 403, 'Cross-tenant partner 360 read must fail closed with 403');
  });

  it('TEST 09: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId rejected with 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/${TENANT_B}`,
      headers: { authorization: `Bearer ${tokenTenantA}` }
    });

    assert.equal(res.statusCode, 403, 'Cross-tenant partner details read must fail closed with 403');
  });

  it('TEST 10: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId/staff rejected with 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/${TENANT_B}/staff`,
      headers: { authorization: `Bearer ${tokenTenantA}` }
    });

    assert.equal(res.statusCode, 403, 'Cross-tenant staff read must fail closed with 403');
  });

  it('TEST 11: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId/entitlements rejected with 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/${TENANT_B}/entitlements`,
      headers: { authorization: `Bearer ${tokenTenantA}` }
    });

    assert.equal(res.statusCode, 403, 'Cross-tenant entitlements read must fail closed with 403');
  });

  it('TEST 12: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId/departments rejected with 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/${TENANT_B}/departments`,
      headers: { authorization: `Bearer ${tokenTenantA}` }
    });

    assert.equal(res.statusCode, 403, 'Cross-tenant departments read must fail closed with 403');
  });

  // ===========================================================================
  // 5. VULN-P17-06: PARAMETER TAMPERING IN REQUEST BODY / QUERY
  // ===========================================================================
  it('TEST 13: VULN-P17-06 — Non-HQ caller injecting mismatched partnerId in request body rejected by auth-guard (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/company/partners/${TENANT_A}/branches`,
      headers: { authorization: `Bearer ${tokenTenantA}` },
      payload: {
        partnerId: TENANT_B, // Tampered partnerId in body
        name: 'Tampered Branch'
      }
    });

    assert.equal(res.statusCode, 403, 'Parameter tampering with partnerId in body must be blocked with 403');
  });

  // ===========================================================================
  // 6. VULN-P17-05: SELF-ROLE ESCALATION PREVENTION
  // ===========================================================================
  it('TEST 14: VULN-P17-05 — Staff user attempting self-role assignment fails closed with 403', async () => {
    const mockSession = {
      userId: testStaffId,
      actorEmail: 'doctor@docsearch.health',
      tenantId: TENANT_A,
      roles: ['CLINIC_DOCTOR'],
      permissions: ['staff:manage', 'staff:roles:assign'],
      dataScope: 'tenant',
      sessionId: crypto.randomUUID(),
      isSuperAdmin: false
    };

    // 1. Attempt to assign self an administrative role
    await assert.rejects(
      async () => {
        await staffAdministrationService.assignStaffRole(
          {
            staffId: testStaffId, // Attempting to assign role to oneself
            roleCode: 'PARTNER_ADMIN',
            dataScope: 'tenant'
          },
          mockSession
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403, 'Self-role assignment must fail closed with 403');
        assert.match(err.message, /Self-role escalation is strictly prohibited/i);
        return true;
      }
    );

    // 2. Attempt to self-modify primary role via updateStaff
    await assert.rejects(
      async () => {
        await staffAdministrationService.updateStaff(
          testStaffId,
          {
            primaryRole: 'ADMIN'
          },
          mockSession
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403, 'Self-role modification must fail closed with 403');
        assert.match(err.message, /Self-role escalation is strictly prohibited/i);
        return true;
      }
    );
  });

  // ===========================================================================
  // 7. AUTHORITATIVE HQ GOVERNANCE ACCESS
  // ===========================================================================
  it('TEST 15: Authoritative HQ — SUPER_ADMIN token successfully authorized for partner directory & operations', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners',
      headers: { authorization: `Bearer ${tokenSuperAdmin}` }
    });

    assert.equal(res.statusCode, 200, 'SUPER_ADMIN must be authorized to view all partners');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
  });

  it('TEST 16: Authoritative HQ — COMPANY_ADMIN token successfully authorized for partner directory', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners',
      headers: { authorization: `Bearer ${tokenCompanyAdmin}` }
    });

    assert.equal(res.statusCode, 200, 'COMPANY_ADMIN must be authorized to view partner directory');
  });

  // ===========================================================================
  // 8. FAIL-CLOSED CRYPTOGRAPHIC & TOKEN VERIFICATION
  // ===========================================================================
  it('TEST 17: Fail-Closed — Malformed Bearer token is rejected with 401 across protected routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners',
      headers: { authorization: 'Bearer this.is.a.forged.malformed.token' }
    });

    assert.equal(res.statusCode, 401, 'Malformed token must fail closed with 401');
  });

  it('TEST 18: Fail-Closed — Expired JWT token is rejected with 401', async () => {
    const expiredToken = signJwt(
      {
        sub: crypto.randomUUID(),
        tenantId: TENANT_A,
        roles: ['SUPER_ADMIN'],
        permissions: ['*'],
        iss: ISSUER,
        aud: AUDIENCE
      },
      { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: -100 }
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners',
      headers: { authorization: `Bearer ${expiredToken}` }
    });

    assert.equal(res.statusCode, 401, 'Expired token must fail closed with 401');
  });
});
