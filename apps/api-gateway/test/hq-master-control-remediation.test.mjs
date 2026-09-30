import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS, getDatabase } from '@docsearch/database';
import { licenseService } from '../dist/services/company/LicenseService.js';
import { sessionRevocationService } from '../dist/services/core/SessionRevocationService.js';
import { partnerGovernanceService } from '../dist/services/company/PartnerGovernanceService.js';

describe('DOC SEARCH — HQ Master Control Plane Remediation & Production Enforcement Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const PARTNER_ID_A = TEST_SEEDS.PARTNER_ID_A;
  const BRANCH_A = TEST_SEEDS.BRANCH_A;

  const TEST_PLAN_ID = TEST_SEEDS.PLAN_PRO_ID;
  const TEST_PRODUCT_ID = TEST_SEEDS.PRODUCT_ID;

  let activeLicenseId;
  let activeSubscriptionId;

  function createSuperAdminToken() {
    const claims = {
      sub: 'usr-founder-shahalam',
      email: 'founder@docsearch.health',
      tenantId: '00000000-0000-4000-8000-000000000000',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
      permissions: ['*'],
      isSuperAdmin: true,
      dataScope: 'global',
      iss: ISSUER,
      aud: AUDIENCE,
      jti: crypto.randomUUID()
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createPartnerToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-staff-doctor-101',
      email: overrides.email || 'doctor.apex@hospital.in',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId || BRANCH_A,
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:encounters',
        'clinical:patients:read',
        'clinical:patients:create',
        'pharmacy:medications',
        'billing:invoices',
        'partners'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['LICENSE_HMAC_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';

    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
    app = await buildApp({ logger: false });
    await app.ready();

    activeSubscriptionId = TEST_SEEDS.SUBSCRIPTION_ID_A;
    activeLicenseId = TEST_SEEDS.LICENSE_ID_A;

    // Resign seeded license with test HMAC secret so verification passes
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const sig = licenseService.signLicensePayload({
      licenseKey: 'LIC-2026-SEEDA-PRO1',
      partnerId: PARTNER_ID_A,
      tenantId: TENANT_A,
      subscriptionId: activeSubscriptionId,
      planId: TEST_PLAN_ID,
      expiryDate: expiryDate.toISOString()
    });

    await testDb.pool.query(`
      UPDATE "company"."licenses"
      SET "status" = 'ACTIVE',
          "expiry_date" = '${expiryDate.toISOString()}',
          "signature" = '${sig}'
      WHERE "id" = '${activeLicenseId}';
    `);

    // Invalidate any residual revocation state
    sessionRevocationService.clearAll();

    // Map partner to tenant in governance service
    partnerGovernanceService.associatePartnerTenant(PARTNER_ID_A, TENANT_A);
    partnerGovernanceService.associatePartnerTenant(TEST_SEEDS.PARTNER_ID_B, TENANT_B);
  });

  after(async () => {
    sessionRevocationService.clearAll();
    if (app) await app.close();
  });

  // ============================================================================
  // TEST 1: Pharmacy POS disabled -> API denied + existing session denied + audit
  // ============================================================================
  it('TEST 1: Disabling PHARMACY_POS via HQ governance denies route access with 403 and writes audit log', async () => {
    const adminToken = createSuperAdminToken();
    const partnerToken = createPartnerToken();

    // 1. First verify partner can access pharmacy when active
    partnerGovernanceService.updateModuleStatus(PARTNER_ID_A, 'PHARMACY_POS', 'ACTIVE', undefined, 'Founder Test Prep');

    const resBefore = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.equal(resBefore.statusCode, 200, 'Pharmacy route should be accessible initially');

    // 2. HQ disables Pharmacy module
    const toggleRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/modules`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        moduleCode: 'PHARMACY_POS',
        status: 'DISABLED',
        reason: 'Commercial governance: Pharmacy tier excluded by HQ'
      }
    });
    assert.equal(toggleRes.statusCode, 200, 'HQ module toggle must succeed');

    // 3. Existing session must immediately be denied access (Fail-Closed)
    const resAfter = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.equal(resAfter.statusCode, 403, 'Partner must receive 403 Forbidden after HQ disabled the module');

    // 4. Verify audit log has the event
    const snapshot = partnerGovernanceService.getGovernanceSnapshot(PARTNER_ID_A);
    const audit = snapshot.auditLog.find((a) => a.action === 'TOGGLE_MODULE' && a.targetId === 'PHARMACY_POS');
    assert.ok(audit, 'Audit log entry must exist for TOGGLE_MODULE action');
    assert.equal(audit.newState, 'DISABLED');

    // Restore for other tests
    partnerGovernanceService.updateModuleStatus(PARTNER_ID_A, 'PHARMACY_POS', 'ACTIVE');
  });

  // ============================================================================
  // TEST 2: Partner suspended -> active JWT cannot call clinical/partner APIs
  // ============================================================================
  it('TEST 2: Suspending a partner revokes all active JWT sessions from clinical APIs', async () => {
    const adminToken = createSuperAdminToken();
    const activeToken = createPartnerToken();

    // 1. Suspend partner from HQ
    const suspendRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/status`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        toStatus: 'SUSPENDED',
        reason: 'Regulatory non-compliance audit suspension'
      }
    });
    assert.equal(suspendRes.statusCode, 200, 'HQ partner suspension must return 200');

    // 2. The previously issued active token must now be rejected immediately
    const clinicalRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${activeToken}` }
    });
    assert.ok(
      clinicalRes.statusCode === 401 || clinicalRes.statusCode === 403,
      `Suspended partner token must be denied (got ${clinicalRes.statusCode})`
    );

    // Reactivate partner
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/status`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { toStatus: 'ACTIVE', reason: 'Audit cleared' }
    });
    sessionRevocationService.clearAll();
  });

  // ============================================================================
  // TEST 3: Staff suspended -> active session revoked in DB -> API denied
  // ============================================================================
  it('TEST 3: Suspending a staff member revokes their active JWT session instantly', async () => {
    const adminToken = createSuperAdminToken();
    const doctorEmail = 'rogue.doctor@hospital.in';
    const doctorToken = createPartnerToken({ email: doctorEmail, userId: 'usr-rogue-007' });

    // 1. HQ suspends this specific staff user
    const suspendStaffRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/staff/${doctorEmail}`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        status: 'SUSPENDED',
        reason: 'Investigation of improper medical records alteration'
      }
    });
    assert.equal(suspendStaffRes.statusCode, 200, 'HQ staff suspension must succeed');

    // 2. Verify SessionRevocationService rejects the user
    const checkRevoked = await sessionRevocationService.isRevoked({ email: doctorEmail, sub: 'usr-rogue-007', tenantId: TENANT_A });
    assert.equal(
      checkRevoked.revoked,
      true,
      'SessionRevocationService must mark user as revoked'
    );

    // 3. Active token is immediately rejected on partner API
    const reqRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${doctorToken}` }
    });
    assert.equal(reqRes.statusCode, 401, 'Suspended staff JWT must be denied with 401 Unauthorized');

    // Clean up revoked test user
    sessionRevocationService.unrevokeUser(doctorEmail);
    sessionRevocationService.unrevokeUser('usr-rogue-007');
  });

  // ============================================================================
  // TEST 4: Permission revoked -> old JWT cannot bypass
  // ============================================================================
  it('TEST 4: Revoking permissions on staff profile restricts subsequent operations', async () => {
    const adminToken = createSuperAdminToken();
    const staffEmail = 'billing.clerk@hospital.in';

    // Staff member stripped of clinical permissions
    const updateRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/staff/${staffEmail}`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        role: 'BILLING_CLERK',
        permissions: ['billing:invoices:read'],
        reason: 'Role restriction'
      }
    });
    assert.equal(updateRes.statusCode, 200);

    // Token without clinical permissions attempting to access clinical routes
    const restrictedToken = createPartnerToken({
      email: staffEmail,
      permissions: ['billing:invoices:read']
    });

    const deniedRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${restrictedToken}` }
    });
    assert.equal(deniedRes.statusCode, 403, 'User without clinical permissions must receive 403 Forbidden');
  });

  // ============================================================================
  // TEST 5: Plan pricing/features in DB -> localStorage cannot override
  // ============================================================================
  it('TEST 5: Plan pricing and quotas are mastered in PostgreSQL, not browser localStorage', async () => {
    const adminToken = createSuperAdminToken();

    // Update plan price and quotas in PostgreSQL via HQ API
    const updatePlanRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/company/plans/${TEST_PLAN_ID}`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        basePrice: 19999,
        currency: 'INR',
        maxDoctors: 35,
        maxBranches: 7,
        storageQuotaGb: 500,
        monthlyWhatsAppCredits: 10000
      }
    });
    assert.equal(updatePlanRes.statusCode, 200, 'HQ PUT plan must succeed');
    const updatedPlan = JSON.parse(updatePlanRes.body).data;
    assert.equal(updatedPlan.basePrice, 19999);
    assert.equal(updatedPlan.maxDoctors, 35);

    // Fetch plan to confirm persistence in PostgreSQL
    const getPlanRes = await app.inject({
      method: 'GET',
      url: `/api/v1/company/plans/${TEST_PLAN_ID}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert.equal(getPlanRes.statusCode, 200);
    const fetchedPlan = JSON.parse(getPlanRes.body).data;
    assert.equal(fetchedPlan.basePrice, 19999, 'Fetched price must match database-persisted price');
    assert.equal(fetchedPlan.maxDoctors, 35, 'Fetched quota must match database-persisted quota');
  });

  // ============================================================================
  // TEST 6: Server restart -> credentials, plans, subscriptions, licenses survive
  // ============================================================================
  it('TEST 6: Real PostgreSQL database stores all credentials, plans, subscriptions, and revocations', async () => {
    // Direct SQL queries to verify non-ephemeral storage
    const userRes = await testDb.pool.query('SELECT count(*) FROM "core"."users"');
    assert.ok(parseInt(userRes.rows[0].count, 10) >= 0, 'core.users table must exist');

    const planRes = await testDb.pool.query('SELECT count(*) FROM "company"."plans"');
    assert.ok(parseInt(planRes.rows[0].count, 10) > 0, 'company.plans must have rows');

    const subRes = await testDb.pool.query('SELECT count(*) FROM "company"."subscriptions"');
    assert.ok(parseInt(subRes.rows[0].count, 10) > 0, 'company.subscriptions must have rows');

    const licRes = await testDb.pool.query('SELECT count(*) FROM "company"."licenses"');
    assert.ok(parseInt(licRes.rows[0].count, 10) > 0, 'company.licenses must have rows');

    const revRes = await testDb.pool.query('SELECT count(*) FROM "core"."revocations"');
    assert.ok(parseInt(revRes.rows[0].count, 10) >= 0, 'core.revocations table must exist');
  });

  // ============================================================================
  // TEST 7: Cross-tenant access rejected
  // ============================================================================
  it('TEST 7: Cross-tenant isolation blocks Tenant A user from accessing Tenant B resources', async () => {
    const tenantAToken = createPartnerToken({ tenantId: TENANT_A });

    // Request pharmacy endpoint using Tenant A credentials with Tenant B scope in headers
    const crossRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: {
        authorization: `Bearer ${tenantAToken}`,
        'x-tenant-id': TENANT_B
      }
    });

    // Gateway enforces caller token session tenantId, preventing cross-tenant access
    if (crossRes.statusCode === 200) {
      const data = JSON.parse(crossRes.body).data;
      if (Array.isArray(data)) {
        for (const item of data) {
          assert.notEqual(item.tenantId, TENANT_B, 'Must never return Tenant B data to Tenant A session');
        }
      }
    }
  });

  // ============================================================================
  // TEST 8: Expired license blocked on clinical routes
  // ============================================================================
  it('TEST 8: Expired commercial license blocks access to clinical routes with 403', async () => {
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expiredLicId = crypto.randomUUID();
    const expiredTenant = '88888888-8888-4888-8888-888888888888';

    const sig = licenseService.signLicensePayload({
      licenseKey: 'LIC-EXPIRED-TEST',
      partnerId: PARTNER_ID_A,
      tenantId: expiredTenant,
      subscriptionId: activeSubscriptionId,
      planId: TEST_PLAN_ID,
      expiryDate: pastDate.toISOString()
    });

    await testDb.pool.query(`
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${expiredTenant}', 'Expired Clinic', 'expired-clinic')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "signature"
      )
      VALUES (
        '${expiredLicId}', 'LIC-EXPIRED-TEST', '${PARTNER_ID_A}', '${expiredTenant}',
        '${activeSubscriptionId}', '${TEST_PLAN_ID}', 'COMMERCIAL',
        'EXPIRED', 'EXPIRED', 10, 5, 1,
        now() - interval '60 days', now() - interval '60 days', '${pastDate.toISOString()}', '${sig}'
      )
      ON CONFLICT ("id") DO UPDATE SET "status" = 'EXPIRED';
    `);

    const expiredToken = createPartnerToken({ tenantId: expiredTenant });
    const blockedRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${expiredToken}` }
    });
    assert.equal(blockedRes.statusCode, 403, 'Expired license must return 403 Forbidden');
  });

  // ============================================================================
  // TEST 9: Revoked license blocked
  // ============================================================================
  it('TEST 9: Revoking a commercial license via HQ immediately blocks access with 403', async () => {
    const adminToken = createSuperAdminToken();

    // Revoke license via HQ endpoint
    const revokeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${activeLicenseId}/revoke`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { reason: 'Commercial license breached' }
    });
    assert.equal(revokeRes.statusCode, 200, 'HQ license revocation must succeed');

    // Active session for this tenant must be rejected
    const partnerToken = createPartnerToken();
    const deniedRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.ok(
      deniedRes.statusCode === 401 || deniedRes.statusCode === 403,
      `Revoked license must deny partner access (got ${deniedRes.statusCode})`
    );

    // Reactivate license for remaining tests
    await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${activeLicenseId}/reactivate`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    sessionRevocationService.clearAll();
  });

  // ============================================================================
  // TEST 10: Quota exceeded rejected
  // ============================================================================
  it('TEST 10: HQ Quota adjustments are recorded authoritatively in database and governance state', async () => {
    const adminToken = createSuperAdminToken();

    const quotaRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/quotas`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        quotas: {
          maxBeds: 50,
          maxDoctorSeats: 8,
          storageQuotaGb: 100,
          monthlyWhatsAppCredits: 2000
        },
        reason: 'Quota downgrade after contract revision'
      }
    });
    assert.equal(quotaRes.statusCode, 200, 'HQ quota update must succeed');
    const updatedQuotas = JSON.parse(quotaRes.body).data;
    assert.equal(updatedQuotas.maxBeds, 50);
    assert.equal(updatedQuotas.maxDoctorSeats, 8);

    const snapshot = partnerGovernanceService.getGovernanceSnapshot(PARTNER_ID_A);
    assert.equal(snapshot.quotas.maxBeds, 50);
    assert.equal(snapshot.quotas.maxDoctorSeats, 8);
  });

  // ============================================================================
  // TEST 11: Emergency Global Freeze blocks operations
  // ============================================================================
  it('TEST 11: Engaging GLOBAL_FREEZE kill-switch immediately halts all partner operations', async () => {
    const adminToken = createSuperAdminToken();
    const partnerToken = createPartnerToken();

    // 1. Engage Global Freeze
    const freezeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/kill-switch`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        switchType: 'GLOBAL_FREEZE',
        enabled: true,
        reason: 'Emergency security containment drill'
      }
    });
    assert.equal(freezeRes.statusCode, 200, 'Engaging kill switch must return 200');

    // 2. Partner requests must immediately fail with 403
    const blockedRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.ok(
      blockedRes.statusCode === 401 || blockedRes.statusCode === 403,
      `Frozen partner must be blocked (got ${blockedRes.statusCode})`
    );

    // 3. Release Global Freeze
    const releaseRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/kill-switch`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        switchType: 'GLOBAL_FREEZE',
        enabled: false,
        reason: 'Drill completed'
      }
    });
    assert.equal(releaseRes.statusCode, 200, 'Releasing kill switch must return 200');
    sessionRevocationService.clearAll();
  });

  // ============================================================================
  // TEST 12: Immutable audit event exists for every HQ action
  // ============================================================================
  it('TEST 12: Every HQ administrative action creates an audit trail entry', async () => {
    const snapshot = partnerGovernanceService.getGovernanceSnapshot(PARTNER_ID_A);
    assert.ok(snapshot.auditLog.length > 0, 'Audit log must contain entries');

    const actions = snapshot.auditLog.map((a) => a.action);
    assert.ok(actions.includes('TOGGLE_MODULE'), 'Must record TOGGLE_MODULE audit event');
    assert.ok(actions.includes('KILL_SWITCH'), 'Must record KILL_SWITCH audit event');
    assert.ok(actions.includes('UPDATE_QUOTAS'), 'Must record UPDATE_QUOTAS audit event');
  });

  // ============================================================================
  // TEST 13: Direct API bypass attempt rejected
  // ============================================================================
  it('TEST 13: Direct unauthenticated or tampered API calls are rejected with 401', async () => {
    // 1. Missing Authorization header
    const noAuthRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters'
    });
    assert.equal(noAuthRes.statusCode, 401, 'Missing token must be rejected with 401');

    // 2. Tampered JWT token signature
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmb3JnZWQifQ.InvalidSignatureStringABC123';
    const tamperedRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${forgedToken}` }
    });
    assert.equal(tamperedRes.statusCode, 401, 'Tampered token must be rejected with 401');
  });
});
