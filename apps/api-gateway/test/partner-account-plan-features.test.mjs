import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  partnerProfiles,
  tenants,
  subscriptions,
  licenses,
  plans,
  features,
  planEntitlements,
  operationalStaff,
  eq
} from '@docsearch/database';

describe('Production Partner My Account: Plan & Features Authoritative Endpoint', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;

  function createPartnerToken(tenantId, partnerId, roles = ['HOSPITAL_ADMIN']) {
    const claims = {
      sub: crypto.randomUUID(),
      email: `partner.${tenantId}@docsearch.health`,
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
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  it('Test 1: Rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features'
    });

    assert.equal(res.statusCode, 401, 'Unauthenticated request must be rejected');
  });

  it('Test 2: Authenticated Partner retrieves authoritative organization identity, plan, and validity', async () => {
    const token = createPartnerToken(TENANT_A, 'partner-tenant-a');

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(res.statusCode, 200, 'Authenticated partner request must succeed');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true, 'API response must indicate success');
    assert.ok(body.data, 'API must return data payload');

    // Organization Profile
    const org = body.data.organizationProfile;
    assert.ok(org, 'Must return organization profile');
    assert.equal(org.tenantId, TENANT_A, 'Organization tenant ID must strictly match session tenant');
    assert.ok(org.legalName, 'Organization must have a legal name');
    assert.ok(org.partnerType, 'Organization must have a partner type');

    // Current Plan & Subscription
    const plan = body.data.currentPlan;
    const sub = body.data.subscription;
    assert.ok(sub, 'Subscription status object must exist');
    assert.ok(typeof sub.status === 'string', 'Subscription must have a status string');

    if (plan) {
      assert.ok(plan.name, 'Plan must have a name');
      assert.ok(plan.code, 'Plan must have a code');
    }

    // Days remaining must be a valid number or null, never an invented static string
    if (sub.daysRemaining !== null) {
      assert.equal(typeof sub.daysRemaining, 'number', 'Days remaining must be a computed number');
    }
  });

  it('Test 3: Feature matrix reflects real catalog and differentiates available vs locked features', async () => {
    const token = createPartnerToken(TENANT_A, 'partner-tenant-a');

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    const featureList = body.data.features;

    assert.ok(Array.isArray(featureList), 'Features must be an array');
    assert.ok(featureList.length > 0, 'Features must come from database catalog');

    // Each feature must have authoritative fields
    for (const feat of featureList) {
      assert.ok(feat.id, 'Feature must have an id');
      assert.ok(feat.code, 'Feature must have a code');
      assert.ok(feat.name, 'Feature must have a name');
      assert.ok(['AVAILABLE', 'LOCKED', 'EXPIRED', 'SUSPENDED', 'NOT_CONFIGURED'].includes(feat.status),
        `Feature ${feat.code} has unexpected status: ${feat.status}`
      );

      // If locked, must provide truthful reason
      if (feat.status !== 'AVAILABLE') {
        assert.ok(typeof feat.reason === 'string', `Locked feature ${feat.code} must have a truthful reason`);
      }
    }
  });

  it('Test 4: Real database limits are calculated live with untracked marked as UNKNOWN', async () => {
    const token = createPartnerToken(TENANT_A, 'partner-tenant-a');

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    const limits = body.data.limits;

    assert.ok(limits, 'Limits object must exist');
    assert.ok(limits.doctorSeats, 'Doctor seats quota must exist');
    assert.equal(typeof limits.doctorSeats.used, 'number', 'Used doctor seats must be a number from live DB');
    assert.ok(limits.inpatientBeds, 'Inpatient beds quota must exist');
    assert.equal(typeof limits.inpatientBeds.used, 'number', 'Used inpatient beds must be a number from live DB');
    assert.ok(limits.branches, 'Branches quota must exist');
    assert.equal(typeof limits.branches.used, 'number', 'Used branches must be a number from live DB');

    // Zero-fake-data policy: untracked usage fields must be strictly 'UNKNOWN'
    assert.equal(limits.concurrentUsers.used, 'UNKNOWN', 'Untracked concurrent users must be UNKNOWN');
    assert.equal(limits.whatsappCredits.used, 'UNKNOWN', 'Untracked whatsapp credits must be UNKNOWN');
    assert.equal(limits.storageQuotaGb.used, 'UNKNOWN', 'Untracked storage quota must be UNKNOWN');
  });

  it('Test 5: Cross-tenant isolation — Tenant A cannot access Tenant B data', async () => {
    const tokenA = createPartnerToken(TENANT_A, 'partner-a');
    const tokenB = createPartnerToken(TENANT_B, 'partner-b');

    const resA = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features',
      headers: { authorization: `Bearer ${tokenA}` }
    });

    const resB = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features',
      headers: { authorization: `Bearer ${tokenB}` }
    });

    assert.equal(resA.statusCode, 200);
    assert.equal(resB.statusCode, 200);

    const dataA = JSON.parse(resA.payload).data;
    const dataB = JSON.parse(resB.payload).data;

    // Strict tenant isolation verification
    assert.equal(dataA.organizationProfile.tenantId, TENANT_A);
    assert.equal(dataB.organizationProfile.tenantId, TENANT_B);
    assert.notEqual(dataA.organizationProfile.tenantId, dataB.organizationProfile.tenantId);
  });

  it('Test 6: Staff role permissions distinction from partner entitlement', async () => {
    // Receptionist role (restricted from advanced clinical modules)
    const tokenReceptionist = createPartnerToken(TENANT_A, 'partner-tenant-a', ['RECEPTIONIST']);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features',
      headers: { authorization: `Bearer ${tokenReceptionist}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    const features = body.data.features;

    // OT or Surgery features should have staffPermitted === false for RECEPTIONIST
    const otFeature = features.find((f) => f.code.includes('OT') || f.code.includes('SURGERY') || f.category.toLowerCase().includes('inpatient'));
    if (otFeature) {
      assert.equal(otFeature.staffPermitted, false, 'Receptionist must not have surgical staff permission');
    }
  });
});
