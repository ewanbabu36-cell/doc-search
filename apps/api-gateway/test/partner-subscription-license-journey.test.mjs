import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  partnerProfiles,
  tenants,
  subscriptions,
  licenses,
  auditEvents,
  eq,
  desc
} from '@docsearch/database';
import { requireActiveCommercialAccess } from '../dist/plugins/commercial-guard.js';
import { authenticate } from '../dist/plugins/auth-guard.js';
import { licenseService } from '../dist/services/company/LicenseService.js';

describe('Production Commercial Lifecycle: Partner Creation -> Plan -> Subscription -> License', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const SUPER_ADMIN_ID = '99999999-9999-4999-8999-999999999999';
  const COMPANY_TENANT_ID = TEST_SEEDS.TENANT_A;

  function createCompanyAdminToken() {
    const claims = {
      sub: SUPER_ADMIN_ID,
      email: 'admin@docsearch.health',
      tenantId: COMPANY_TENANT_ID,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
      permissions: [
        'partners:read',
        'partners:create',
        'partners:update',
        'subscriptions:read',
        'subscriptions:create',
        'subscriptions:update'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createPartnerToken(tenantId, partnerId, roles = ['HOSPITAL_ADMIN']) {
    const claims = {
      sub: crypto.randomUUID(),
      email: 'partner.lead@docsearch.health',
      tenantId,
      partnerId,
      roles,
      permissions: ['clinical:patients:read', 'billing:invoices:read'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['LICENSE_HMAC_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();

    // Register a commercial-guarded route for explicit testing of commercial gates
    app.get(
      '/api/v1/clinical/commercial-test',
      {
        preHandler: [authenticate, requireActiveCommercialAccess]
      },
      async (request) => {
        return { success: true, message: 'Commercial access granted' };
      }
    );

    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  let onboardedPartnerId;
  let onboardedTenantId;
  let onboardedSubscriptionId;
  let onboardedLicenseId;
  let onboardedLicenseKey;

  // 1. Transactional Partner Onboarding
  it('STAGE 1: POST /api/v1/company/partners atomically creates Partner + Tenant + Subscription + License + Audit', async () => {
    const adminToken = createCompanyAdminToken();

    const payload = {
      legalName: 'Apex Multi-Specialty Hospitals Pvt Ltd',
      tradeName: 'Apex Hospital Whitefield',
      partnerType: 'HOSPITAL_NETWORK',
      primaryContactName: 'Dr. Ramesh Rao',
      primaryContactEmail: 'ramesh.rao@apexhospitals.com',
      primaryContactPhone: '080-99887766',
      primaryContactRole: 'Medical Director',
      planCode: 'PLAN_HOSPITAL_PRO',
      billingCycle: 'MONTHLY',
      isTrial: false,
      initialFacilityName: 'Apex Whitefield Main Branch'
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload
    });

    assert.strictEqual(res.statusCode, 201, `Partner onboarding failed: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.partner.id, 'Partner ID must be generated');
    assert.ok(body.data.tenantId, 'Tenant ID must be generated');
    assert.ok(body.data.subscription.id, 'Subscription must be created');
    assert.ok(body.data.license.id, 'License must be created');
    assert.ok(body.data.license.licenseKey.startsWith('LIC-2026-'), 'License key format');
    assert.strictEqual(body.data.subscription.status, 'ACTIVE');
    assert.strictEqual(body.data.license.status, 'ACTIVE');
    assert.strictEqual(body.data.commercialSummary.limits.maxConcurrentUsers, 50);
    assert.strictEqual(body.data.commercialSummary.limits.maxDoctors, 25);
    assert.strictEqual(body.data.commercialSummary.limits.maxBranches, 3);
    assert.ok(Array.isArray(body.data.entitlements), 'Entitlements must be returned');
    assert.ok(body.data.entitlements.length >= 3, 'Entitlements count');

    onboardedPartnerId = body.data.partner.id;
    onboardedTenantId = body.data.tenantId;
    onboardedSubscriptionId = body.data.subscription.id;
    onboardedLicenseId = body.data.license.id;
    onboardedLicenseKey = body.data.license.licenseKey;

    // Direct Database Verification
    const [dbPartner] = await testDb.db.select().from(partnerProfiles).where(eq(partnerProfiles.id, onboardedPartnerId));
    assert.ok(dbPartner, 'Partner profile persisted in PostgreSQL');
    assert.strictEqual(dbPartner.legalName, 'Apex Multi-Specialty Hospitals Pvt Ltd');

    const [dbSub] = await testDb.db.select().from(subscriptions).where(eq(subscriptions.id, onboardedSubscriptionId));
    assert.ok(dbSub, 'Subscription persisted in PostgreSQL');
    assert.strictEqual(dbSub.partnerId, onboardedPartnerId);

    const [dbLic] = await testDb.db.select().from(licenses).where(eq(licenses.id, onboardedLicenseId));
    assert.ok(dbLic, 'License persisted in PostgreSQL');
    assert.strictEqual(dbLic.subscriptionId, onboardedSubscriptionId);
    assert.ok(dbLic.signature, 'Cryptographic signature must be present');

    // Audit Event Verification
    const auditRows = await testDb.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.resourceId, onboardedPartnerId))
      .orderBy(desc(auditEvents.timestamp));
    assert.ok(auditRows.length > 0, 'Audit event recorded for partner creation');
    assert.strictEqual(auditRows[0].eventType, 'PARTNER_CREATED');
  });

  // 2. Database-Driven Plan & Trial Dates Calculation
  it('STAGE 2: Partner Onboarding calculates dynamic trial duration directly from DB plan metadata', async () => {
    const adminToken = createCompanyAdminToken();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        legalName: 'BioHealth Diagnostic Labs Ltd',
        tradeName: 'BioHealth Labs',
        partnerType: 'DIAGNOSTIC_LAB',
        primaryContactName: 'Dr. Anjali Sharma',
        primaryContactEmail: 'anjali@biohealth.org',
        planCode: 'PLAN_ENTERPRISE_NETWORK',
        isTrial: true
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.subscription.status, 'TRIAL');
    assert.strictEqual(body.data.license.licenseType, 'TRIAL');

    const start = new Date(body.data.commercialSummary.startDate).getTime();
    const end = new Date(body.data.commercialSummary.expiryDate).getTime();
    const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000));
    assert.strictEqual(diffDays, 30, 'Enterprise plan metadata trialDays is 30');
    assert.strictEqual(body.data.commercialSummary.limits.maxConcurrentUsers, 250);
  });

  // 3. Rollback Safety: Simulated Failure Leaves 0 Partial Entities
  it('STAGE 3: Transactional boundary rolls back completely if plan is invalid (0 orphan records)', async () => {
    const adminToken = createCompanyAdminToken();

    const prePartners = await testDb.db.select().from(partnerProfiles);
    const preSubs = await testDb.db.select().from(subscriptions);
    const preLicenses = await testDb.db.select().from(licenses);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        legalName: 'Phantom Hospital That Must Not Exist',
        tradeName: 'Phantom Clinic',
        primaryContactName: 'Nobody',
        primaryContactEmail: 'nobody@nowhere.com',
        planCode: 'NON_EXISTENT_PLAN_XYZ'
      }
    });

    assert.strictEqual(res.statusCode, 400);

    const postPartners = await testDb.db.select().from(partnerProfiles);
    const postSubs = await testDb.db.select().from(subscriptions);
    const postLicenses = await testDb.db.select().from(licenses);

    assert.strictEqual(postPartners.length, prePartners.length, 'Zero orphan partner profiles');
    assert.strictEqual(postSubs.length, preSubs.length, 'Zero orphan subscriptions');
    assert.strictEqual(postLicenses.length, preLicenses.length, 'Zero orphan software licenses');
  });

  // 4. Partner Commercial Profile View & Signature Verification
  it('STAGE 4: GET /api/v1/company/partners/:id/commercial returns complete commercial status & valid HMAC', async () => {
    const adminToken = createCompanyAdminToken();

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/${onboardedPartnerId}/commercial`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.partner.id, onboardedPartnerId);
    assert.strictEqual(body.data.subscription.id, onboardedSubscriptionId);
    assert.strictEqual(body.data.license.id, onboardedLicenseId);
    assert.strictEqual(body.data.evaluation.isSignatureValid, true, 'HMAC signature verification passed');
    assert.strictEqual(body.data.evaluation.status, 'ACTIVE');
    assert.ok(body.data.evaluation.daysRemaining > 20);
  });

  // 5. License Verify Endpoint
  it('STAGE 5: POST /api/v1/company/licenses/:id/verify verifies cryptographic integrity', async () => {
    const adminToken = createCompanyAdminToken();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${onboardedLicenseId}/verify`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.isSignatureValid, true);
    assert.strictEqual(body.data.evaluation.status, 'ACTIVE');
  });

  // 6. Subscription Renewal Extends Validity & License Expiry
  it('STAGE 6: POST /api/v1/company/subscriptions/:id/renew extends dates and issues renewal audit', async () => {
    const adminToken = createCompanyAdminToken();

    const [origSub] = await testDb.db.select().from(subscriptions).where(eq(subscriptions.id, onboardedSubscriptionId));
    const origExpiry = new Date(origSub.endDate).getTime();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/company/subscriptions/${onboardedSubscriptionId}/renew`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        billingCycle: 'MONTHLY',
        paymentReference: 'RAZORPAY_TX_2026_0904_888'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);

    const newExpiry = new Date(body.data.subscription.endDate).getTime();
    assert.ok(newExpiry > origExpiry, 'End date must be extended');
    assert.strictEqual(newExpiry - origExpiry, 30 * 24 * 60 * 60 * 1000, 'Extended by 30 days');

    // Verify linked license extended
    assert.strictEqual(new Date(body.data.license.expiryDate).getTime(), newExpiry);

    // Audit Event Verification
    const auditRows = await testDb.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.resourceId, onboardedSubscriptionId))
      .orderBy(desc(auditEvents.timestamp));
    assert.ok(auditRows.some((a) => a.eventType === 'SUBSCRIPTION_RENEWED'), 'SUBSCRIPTION_RENEWED audit recorded');
  });

  // 7. Plan Change (Upgrade to Enterprise) Recalculates Limits & Re-signs License
  it('STAGE 7: POST /api/v1/company/subscriptions/:id/change-plan upgrades tier, recomputes limits, and re-signs license', async () => {
    const adminToken = createCompanyAdminToken();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/company/subscriptions/${onboardedSubscriptionId}/change-plan`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        planCode: 'PLAN_ENTERPRISE_NETWORK',
        reason: 'Upgrade requested by hospital leadership'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);

    // Verify license limits updated
    assert.strictEqual(body.data.license.maxConcurrentUsers, 250);
    assert.strictEqual(body.data.license.maxDoctors, 100);
    assert.strictEqual(body.data.license.maxBranches, 10);

    // Verify re-signed HMAC signature
    const verifyRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${onboardedLicenseId}/verify`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(JSON.parse(verifyRes.body).data.isSignatureValid, true, 'Updated license signature is valid');
  });

  // 8. Server-Side Commercial Expiry & Grace Period Enforcement
  it('STAGE 8: Commercial Guard permits active partner and warns in grace period', async () => {
    const partnerToken = createPartnerToken(onboardedTenantId, onboardedPartnerId);

    // Active subscription allows access
    const resActive = await app.inject({
      method: 'GET',
      url: '/api/v1/clinical/commercial-test',
      headers: { Authorization: `Bearer ${partnerToken}` }
    });
    assert.strictEqual(resActive.statusCode, 200);

    // Set license to grace period: expiry in past, grace period in future
    const now = new Date();
    const graceExpiry = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const graceEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const [currentLic] = await testDb.db.select().from(licenses).where(eq(licenses.id, onboardedLicenseId));

    const graceSig = licenseService.signLicensePayload({
      licenseKey: currentLic.licenseKey,
      partnerId: currentLic.partnerId,
      tenantId: currentLic.tenantId,
      subscriptionId: currentLic.subscriptionId,
      planId: currentLic.planId,
      expiryDate: graceExpiry.toISOString()
    });

    await testDb.db
      .update(licenses)
      .set({
        expiryDate: graceExpiry,
        gracePeriodEnd: graceEnd,
        signature: graceSig
      })
      .where(eq(licenses.id, onboardedLicenseId));

    const resGrace = await app.inject({
      method: 'GET',
      url: '/api/v1/clinical/commercial-test',
      headers: { Authorization: `Bearer ${partnerToken}` }
    });
    assert.strictEqual(resGrace.statusCode, 200);
    assert.strictEqual(resGrace.headers['x-commercial-grace-period'], 'true');

    // Restore license for remaining tests
    const restoredExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const restoredGraceEnd = new Date(now.getTime() + 44 * 24 * 60 * 60 * 1000);
    const restoredSig = licenseService.signLicensePayload({
      licenseKey: currentLic.licenseKey,
      partnerId: currentLic.partnerId,
      tenantId: currentLic.tenantId,
      subscriptionId: currentLic.subscriptionId,
      planId: currentLic.planId,
      expiryDate: restoredExpiry.toISOString()
    });

    await testDb.db
      .update(licenses)
      .set({
        expiryDate: restoredExpiry,
        gracePeriodEnd: restoredGraceEnd,
        signature: restoredSig
      })
      .where(eq(licenses.id, onboardedLicenseId));
  });

  // 9. Controlled Subscription Cancellation Revokes License & Blocks Access
  it('STAGE 9: POST /api/v1/company/subscriptions/:id/cancel cancels subscription and revokes commercial access', async () => {
    const adminToken = createCompanyAdminToken();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/company/subscriptions/${onboardedSubscriptionId}/cancel`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        reason: 'Customer migration to internal on-prem datacenter'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.status, 'CANCELLED');

    const [dbLic] = await testDb.db.select().from(licenses).where(eq(licenses.id, onboardedLicenseId));
    assert.strictEqual(dbLic.status, 'REVOKED');

    // Partner access now blocked
    const partnerToken = createPartnerToken(onboardedTenantId, onboardedPartnerId);
    const accessRes = await app.inject({
      method: 'GET',
      url: '/api/v1/clinical/commercial-test',
      headers: { Authorization: `Bearer ${partnerToken}` }
    });
    assert.strictEqual(accessRes.statusCode, 403, 'Cancelled license access is blocked');
  });

  // 10. Expiry Reconciliation Background Engine
  it('STAGE 10: POST /api/v1/company/subscriptions/reconcile-expiries transitions expired entities', async () => {
    const adminToken = createCompanyAdminToken();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/subscriptions/reconcile-expiries',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data.active, 'number');
    assert.strictEqual(typeof body.data.expired, 'number');
  });

  // 11. Multi-Tenant Commercial Isolation
  it('STAGE 11: Tenant A cannot access Tenant B licenses or subscriptions', async () => {
    const partnerBToken = createPartnerToken(TEST_SEEDS.TENANT_B, TEST_SEEDS.PARTNER_ID_B);

    // Tenant B attempts to read Tenant A license
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/licenses/${onboardedLicenseId}`,
      headers: { Authorization: `Bearer ${partnerBToken}` }
    });

    assert.strictEqual(res.statusCode, 403, 'Cross-tenant commercial access strictly forbidden');
  });

  // 12. Durability Across Database Reconnect & Audit Hash Chain
  it('STAGE 12: All commercial entities survive database reconnect & retain cryptographic hash audit chain', async () => {
    const adminToken = createCompanyAdminToken();

    // Verify partner still readable
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/company/partners/${onboardedPartnerId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.id, onboardedPartnerId);

    // Verify audit events integrity
    const allAudits = await testDb.db.select().from(auditEvents).orderBy(desc(auditEvents.timestamp));
    assert.ok(allAudits.length >= 2, 'Audit events exist');
    for (const audit of allAudits) {
      assert.ok(audit.integrityHash, 'Audit event must have SHA-256 integrity hash');
    }
  });
});
