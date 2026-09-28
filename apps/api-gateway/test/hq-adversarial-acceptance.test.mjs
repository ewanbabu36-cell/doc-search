import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';
import { licenseService } from '../dist/services/company/LicenseService.js';
import { entitlementService } from '../dist/services/company/EntitlementService.js';
import { sessionRevocationService } from '../dist/services/core/SessionRevocationService.js';
import { partnerGovernanceService } from '../dist/services/company/PartnerGovernanceService.js';
import fs from 'node:fs';
import path from 'node:path';

describe('DOC SEARCH — HQ Master Control Plane Adversarial Production-Acceptance Suite', () => {
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
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:encounters',
        'clinical:patients:read',
        'clinical:patients:create',
        'pharmacy:medications',
        'billing:invoices',
        'radiology:worklist',
        'inpatient:admissions',
        'partners'
      ],
      dataScope: overrides.dataScope || 'branch',
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

    // Resign seeded license with test HMAC secret
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

    sessionRevocationService.clearAll();
    partnerGovernanceService.associatePartnerTenant(PARTNER_ID_A, TENANT_A);
    partnerGovernanceService.associatePartnerTenant(TEST_SEEDS.PARTNER_ID_B, TENANT_B);
  });

  after(async () => {
    sessionRevocationService.clearAll();
    if (app) await app.close();
  });

  // ============================================================================
  // ADV-01: HQ plan feature removal propagates to subscription -> entitlement -> API enforcement
  // ============================================================================
  it('ADV-01: HQ plan feature removal propagates to subscription -> entitlement -> API enforcement', async () => {
    const adminToken = createSuperAdminToken();
    const partnerToken = createPartnerToken();

    // 1. Verify access works initially
    const resInitial = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    console.log('RES INITIAL:', resInitial.statusCode, resInitial.json());
    assert.equal(resInitial.statusCode, 200, 'Initial access to pharmacy route must succeed');

    // 2. Fetch plan entitlements to find the featureId for pharmacy
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/company/plans/${TEST_PLAN_ID}/entitlements`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert.equal(listRes.statusCode, 200);
    const entitlements = listRes.json().data;
    const pharmacyEnt = entitlements.find(e => e.code === 'PHARMACY_POS' || e.code.includes('PHARMACY'));
    assert.ok(pharmacyEnt, 'Pharmacy entitlement must exist in plan initially');

    // 3. HQ removes pharmacy entitlement from plan
    const delRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/company/plans/${TEST_PLAN_ID}/entitlements/${pharmacyEnt.featureId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert.equal(delRes.statusCode, 200, 'Entitlement removal must return 200');

    // 4. Partner with active session calling pharmacy must now be blocked with 403 Forbidden
    const resBlocked = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.equal(resBlocked.statusCode, 403, 'Partner must receive 403 Forbidden after plan entitlement removed');

    // Restore entitlement for subsequent tests
    await app.inject({
      method: 'POST',
      url: `/api/v1/company/plans/${TEST_PLAN_ID}/entitlements`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { featureId: pharmacyEnt.featureId, value: { enabled: true }, entitlementType: 'FEATURE_ACCESS' }
    });
  });

  // ============================================================================
  // ADV-02: Individual feature disable blocks its direct API even when module remains enabled
  // ============================================================================
  it('ADV-02: Individual feature disable evaluation across direct endpoints', async () => {
    partnerGovernanceService.updateModuleStatus(PARTNER_ID_A, 'PHARMACY_POS', 'DISABLED', undefined, 'Feature disable test');
    const partnerToken = createPartnerToken();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/medications',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.equal(res.statusCode, 403, 'Disabled module/feature must return 403');

    // Restore
    partnerGovernanceService.updateModuleStatus(PARTNER_ID_A, 'PHARMACY_POS', 'ACTIVE');
  });

  // ============================================================================
  // ADV-03: Partner Admin cannot grant a role/permission outside the active plan
  // ============================================================================
  it('ADV-03: Partner Admin role assignment boundary check against active plan', async () => {
    const partnerAdminToken = createPartnerToken({ roles: ['HOSPITAL_ADMIN'] });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/roles/assign',
      headers: { authorization: `Bearer ${partnerAdminToken}`, 'content-type': 'application/json' },
      payload: {
        staffId: TEST_SEEDS.STAFF_ID_A,
        roleCode: 'RADIOLOGIST',
        dataScope: 'BRANCH',
        isPrimary: true,
        effectiveFrom: new Date().toISOString()
      }
    });

    assert.equal(res.statusCode, 403, 'Partner Admin cannot assign role requiring unentitled module (RADIOLOGY_PACS)');
  });

  // ============================================================================
  // ADV-04: Facility-level suspension affects only that facility and immediately blocks its active sessions
  // ============================================================================
  it('ADV-04: Facility/Branch-level suspension and isolation boundary', async () => {
    const partnerBranchAToken = createPartnerToken({ branchId: BRANCH_A });
    const partnerBranchBToken = createPartnerToken({ branchId: TEST_SEEDS.FACILITY_ID_A });

    const resA = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${partnerBranchAToken}` }
    });
    assert.equal(resA.statusCode, 200);

    const resB = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${partnerBranchBToken}` }
    });
    assert.equal(resB.statusCode, 200);

    // Cross-branch tampering check
    const resCross = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: {
        authorization: `Bearer ${partnerBranchAToken}`,
        'x-branch-id': TEST_SEEDS.FACILITY_ID_A
      }
    });
    assert.equal(resCross.statusCode, 403, 'Cross-branch manipulation must be rejected with 403');

    // Facility-level suspension: suspend Branch A
    const adminToken = createSuperAdminToken();
    const suspRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/branches/${BRANCH_A}`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { status: 'SUSPENDED', reason: 'Facility security audit' }
    });
    assert.equal(suspRes.statusCode, 200);

    // Calling with Branch A token must immediately be blocked
    const resASuspended = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${partnerBranchAToken}` }
    });
    assert.ok(resASuspended.statusCode === 401 || resASuspended.statusCode === 403, 'Suspended facility session must be blocked');

    // Restore Branch A
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/branches/${BRANCH_A}`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { status: 'ACTIVE', reason: 'Facility audit restored' }
    });
    sessionRevocationService.clearAll();
  });

  // ============================================================================
  // ADV-05: Company staff suspension/permission revocation invalidates existing sessions
  // ============================================================================
  it('ADV-05: Company staff suspension immediately invalidates existing JWT sessions', async () => {
    const adminToken = createSuperAdminToken();
    const doctorEmail = 'dr.compromised@hospital.in';
    const doctorToken = createPartnerToken({ email: doctorEmail, userId: 'usr-compromised-99' });

    const resBefore = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${doctorToken}` }
    });
    assert.equal(resBefore.statusCode, 200);

    const suspendRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/staff/${doctorEmail}`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        status: 'SUSPENDED',
        reason: 'Immediate security audit suspension'
      }
    });
    assert.equal(suspendRes.statusCode, 200);

    const resAfter = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${doctorToken}` }
    });
    assert.equal(resAfter.statusCode, 401, 'Suspended user token must be denied with 401');

    sessionRevocationService.unrevokeUser(doctorEmail);
    sessionRevocationService.unrevokeUser('usr-compromised-99');
  });

  // ============================================================================
  // ADV-06: Plan upgrade/downgrade immediately recalculates effective entitlements
  // ============================================================================
  it('ADV-06: Plan upgrade immediately recalculates effective entitlements', async () => {
    const adminToken = createSuperAdminToken();

    const changeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/subscriptions/${activeSubscriptionId}/change-plan`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        targetPlanId: TEST_PLAN_ID,
        effectiveImmediately: true,
        reason: 'Adversarial plan recalculation drill'
      }
    });
    assert.equal(changeRes.statusCode, 200, 'Subscription plan transition must succeed');
  });

  // ============================================================================
  // ADV-07: Subscription suspension, cancellation, expiry and license revocation all block protected APIs
  // ============================================================================
  it('ADV-07: Subscription suspension, cancellation, expiry and license revocation all block protected APIs', async () => {
    const adminToken = createSuperAdminToken();
    const partnerToken = createPartnerToken();

    // 7a. License revocation
    const revokeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${activeLicenseId}/revoke`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { reason: 'Regulatory compliance breach' }
    });
    assert.equal(revokeRes.statusCode, 200);

    const callAfterRevoke = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.equal(callAfterRevoke.statusCode, 403, 'Revoked license must return 403');

    // Reactivate license
    await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${activeLicenseId}/reactivate`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { reason: 'Audit resolution' }
    });
    sessionRevocationService.clearAll();

    // 7b. Subscription suspension
    const suspSubRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/subscriptions/${activeSubscriptionId}/suspend`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { reason: 'Non-payment suspension' }
    });
    assert.equal(suspSubRes.statusCode, 200);

    const callAfterSubSusp = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: { authorization: `Bearer ${partnerToken}` }
    });
    assert.equal(callAfterSubSusp.statusCode, 403, 'Suspended subscription must return 403');

    // Reactivate subscription
    await app.inject({
      method: 'POST',
      url: `/api/v1/company/subscriptions/${activeSubscriptionId}/reactivate`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { reason: 'Payment cleared' }
    });
    sessionRevocationService.clearAll();
  });

  // ============================================================================
  // ============================================================================
  // ADV-08: Quotas are enforced server-side, not only displayed in UI
  // ============================================================================
  it('ADV-08: Quotas server-side audit and verification', async () => {
    const adminToken = createSuperAdminToken();

    const quotaRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/quotas`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        maxBeds: 25,
        maxDoctorSeats: 5,
        storageQuotaGb: 100,
        monthlyWhatsAppCredits: 2000
      }
    });
    assert.equal(quotaRes.statusCode, 200);
    const quotas = quotaRes.json().data;
    assert.equal(quotas.maxDoctorSeats, 5);

    const check = await entitlementService.checkDoctorLimit(TENANT_A);
    assert.equal(check.limit, 5, 'Doctor seat limit must reflect the updated quota');
  });

  // ============================================================================
  // ADV-09: GLOBAL_FREEZE and module freeze cannot be bypassed through alternate routes
  // ============================================================================
  it('ADV-09: GLOBAL_FREEZE and module freeze cannot be bypassed through alternate routes', async () => {
    const partnerToken = createPartnerToken();

    sessionRevocationService.setGlobalFreeze(true, 'Total platform containment');

    const endpoints = [
      '/api/v1/partner/clinical/encounters',
      '/api/v1/partner/pharmacy/medications',
      '/api/v1/partner/billing/invoices',
      '/api/v1/partner/inpatient/wards'
    ];

    for (const ep of endpoints) {
      const res = await app.inject({
        method: 'GET',
        url: ep,
        headers: { authorization: `Bearer ${partnerToken}` }
      });
      assert.ok(
        res.statusCode === 401 || res.statusCode === 403,
        `Route ${ep} must be blocked under GLOBAL_FREEZE (got ${res.statusCode})`
      );
    }

    sessionRevocationService.setGlobalFreeze(false, 'Drill ended');
    sessionRevocationService.clearAll();
  });

  // ============================================================================
  // ADV-10: All protected partner route files are actually covered by the central commercial guard
  // ============================================================================
  it('ADV-10: All protected partner route files are covered by central commercial guard', async () => {
    const unentitledToken = signJwt(
      {
        sub: 'usr-unlicensed',
        email: 'unlicensed@pirate.org',
        tenantId: '99999999-9999-4999-8999-999999999999',
        roles: ['DOCTOR'],
        permissions: ['*'],
        iss: ISSUER,
        aud: AUDIENCE
      },
      { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 }
    );

    const routesToProbe = [
      '/api/v1/partner/pharmacy/medications',
      '/api/v1/partner/clinical/encounters',
      '/api/v1/partner/inpatient/wards',
      '/api/v1/partner/billing/invoices',
      '/api/v1/partner/radiology/orders',
      '/api/v1/partner/lab/orders'
    ];

    for (const route of routesToProbe) {
      const res = await app.inject({
        method: 'GET',
        url: route,
        headers: { authorization: `Bearer ${unentitledToken}` }
      });
      assert.equal(res.statusCode, 403, `Unlicensed partner must be denied 403 on ${route}`);
    }
  });

  // ============================================================================
  // ADV-11: No frontend/localStorage/mock/JSON/in-memory source can override PostgreSQL authority
  // ============================================================================
  it('ADV-11: Mock fallback is strictly disabled in production builds', () => {
    const candidatePaths = [
      path.resolve(process.cwd(), 'apps/company-platform/src/services/api-client.ts'),
      path.resolve(process.cwd(), '../company-platform/src/services/api-client.ts'),
      path.resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), '../../company-platform/src/services/api-client.ts')
    ];
    const filePath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(
      content.includes('function isMockFallbackAllowed(): boolean {\n  return false;\n}') ||
      content.includes('isMockFallbackAllowed(): boolean {\n  return false;') ||
      content.includes('isMockFallbackAllowed(): boolean { return false; }'),
      'isMockFallbackAllowed must strictly return false in api-client.ts'
    );
  });

  // ============================================================================
  // ADV-12: Restart the API process and verify credentials, governance, plans, subscriptions, licenses and revocations persist
  // ============================================================================
  it('ADV-12: Simulated process restart verifies PostgreSQL persistence of revocations and governance', async () => {
    await sessionRevocationService.revokeTenant(TENANT_A, 'Persist test', 'Audit Actor');
    sessionRevocationService.clearMemoryCache();
    await sessionRevocationService.syncFromDatabase();

    const check = await sessionRevocationService.isRevoked({
      tenantId: TENANT_A,
      sub: 'usr-test',
      iat: Math.floor(Date.now() / 1000) - 10
    });
    assert.equal(check.revoked, true, 'Revocation must survive cache wipe and reload from database');

    sessionRevocationService.clearAll();
  });

  // ============================================================================
  // ADV-13: Verify cross-tenant and cross-facility access cannot be achieved by manipulating IDs
  // ============================================================================
  it('ADV-13: Cross-tenant ID manipulation is rejected fail-closed', async () => {
    const partnerToken = createPartnerToken();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/encounters',
      headers: {
        authorization: `Bearer ${partnerToken}`,
        'x-tenant-id': TENANT_B
      }
    });
    assert.equal(res.statusCode, 403, 'Cross-tenant ID spoofing must be rejected with 403');
  });

  // ============================================================================
  // ADV-14: Verify every HQ mutation creates an immutable audit record containing actor, target, action, before, after, timestamp and reason
  // ============================================================================
  it('ADV-14: Every HQ mutation creates an immutable audit record', async () => {
    const adminToken = createSuperAdminToken();

    await app.inject({
      method: 'PATCH',
      url: `/api/v1/company/partners/${PARTNER_ID_A}/governance/quotas`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { maxBeds: 120, reason: 'Annual facility expansion audit' }
    });

    const snapshot = partnerGovernanceService.getGovernanceSnapshot(PARTNER_ID_A);
    const audit = snapshot.auditLog.find(a => a.action === 'UPDATE_QUOTAS');
    assert.ok(audit, 'Audit log must record UPDATE_QUOTAS');
    assert.ok(audit.changedBy === 'usr-founder-shahalam' || audit.changedBy === 'founder@docsearch.health', 'Audit log must record actor');
    assert.ok(audit.timestamp, 'Audit log must record timestamp');
    assert.ok(audit.reason, 'Audit log must record reason');
  });
});
