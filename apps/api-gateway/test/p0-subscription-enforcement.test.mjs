import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS
} from '@docsearch/database';
import { licenseService } from '../dist/services/company/LicenseService.js';

describe('P0 Subscription Enforcement Verification Test Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_ACTIVE = TEST_SEEDS.TENANT_A;
  const TENANT_TRIAL = '22222222-2222-4222-8222-222222222201';
  const TENANT_GRACE = '22222222-2222-4222-8222-222222222202';
  const TENANT_EXPIRED = '22222222-2222-4222-8222-222222222203';
  const TENANT_SUSPENDED = '22222222-2222-4222-8222-222222222204';
  const TENANT_WRONG = TEST_SEEDS.TENANT_B;

  function createToken(tenantId, roles = ['DOCTOR', 'HOSPITAL_ADMIN'], permissions = [
    'clinical:patients:read',
    'clinical:patients:create',
    'clinical:consultations:create'
  ]) {
    const claims = {
      sub: crypto.randomUUID(),
      email: `user.${tenantId.substring(0, 8)}@docsearch.health`,
      tenantId,
      branchId: TEST_SEEDS.BRANCH_A,
      roles,
      permissions,
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['LICENSE_HMAC_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';

    const now = new Date();

    // 1. Seed Trial Tenant (Valid 14-day trial)
    await testDb.pool.query(`
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${TENANT_TRIAL}', 'Trial Clinic', 'trial-clinic')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."subscriptions" (
        "id", "partner_id", "product_id", "plan_id", "plan_version", "status", "billing_cycle",
        "start_date", "renewal_date", "end_date"
      )
      VALUES (
        '73333333-3333-4333-8333-333333333301', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.PRODUCT_ID}', '${TEST_SEEDS.PLAN_STARTER_ID}',
        '1.0.0', 'TRIAL', 'MONTHLY', now(), now() + interval '14 days', now() + interval '14 days'
      )
      ON CONFLICT DO NOTHING;
    `);

    const trialExpiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const trialGraceEnd = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    const trialSig = licenseService.signLicensePayload({
      licenseKey: 'LIC-TRIAL-01',
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      tenantId: TENANT_TRIAL,
      subscriptionId: '73333333-3333-4333-8333-333333333301',
      planId: TEST_SEEDS.PLAN_STARTER_ID,
      expiryDate: trialExpiry.toISOString()
    });

    await testDb.pool.query(`
      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES (
        '74444444-4444-4444-8444-444444444401', 'LIC-TRIAL-01', '${TEST_SEEDS.PARTNER_ID_A}', '${TENANT_TRIAL}',
        '73333333-3333-4333-8333-333333333301', '${TEST_SEEDS.PLAN_STARTER_ID}', 'TRIAL',
        'ACTIVE', 'ACTIVATED', 10, 5, 1,
        now(), now(), '${trialExpiry.toISOString()}', '${trialGraceEnd.toISOString()}', '${trialSig}'
      )
      ON CONFLICT DO NOTHING;
    `);

    // 2. Seed Grace Period Tenant (Expired 2 days ago, grace period ends in 5 days)
    const graceExpiry = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const graceEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const graceSig = licenseService.signLicensePayload({
      licenseKey: 'LIC-GRACE-01',
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      tenantId: TENANT_GRACE,
      subscriptionId: '73333333-3333-4333-8333-333333333302',
      planId: TEST_SEEDS.PLAN_PRO_ID,
      expiryDate: graceExpiry.toISOString()
    });

    await testDb.pool.query(`
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${TENANT_GRACE}', 'Grace Period Hospital', 'grace-hospital')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."subscriptions" (
        "id", "partner_id", "product_id", "plan_id", "plan_version", "status", "billing_cycle",
        "start_date", "renewal_date", "end_date"
      )
      VALUES (
        '73333333-3333-4333-8333-333333333302', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.PRODUCT_ID}', '${TEST_SEEDS.PLAN_PRO_ID}',
        '1.0.0', 'ACTIVE', 'MONTHLY', now() - interval '32 days', now() - interval '2 days', '${graceExpiry.toISOString()}'
      )
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES (
        '74444444-4444-4444-8444-444444444402', 'LIC-GRACE-01', '${TEST_SEEDS.PARTNER_ID_A}', '${TENANT_GRACE}',
        '73333333-3333-4333-8333-333333333302', '${TEST_SEEDS.PLAN_PRO_ID}', 'COMMERCIAL',
        'ACTIVE', 'ACTIVATED', 50, 25, 3,
        now() - interval '32 days', now() - interval '32 days', '${graceExpiry.toISOString()}', '${graceEnd.toISOString()}', '${graceSig}'
      )
      ON CONFLICT DO NOTHING;
    `);

    // 3. Seed Expired Tenant (Expired 30 days ago, grace period ended 16 days ago)
    const expiredDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const expiredGraceEnd = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000);
    const expiredSig = licenseService.signLicensePayload({
      licenseKey: 'LIC-EXPIRED-01',
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      tenantId: TENANT_EXPIRED,
      subscriptionId: '73333333-3333-4333-8333-333333333303',
      planId: TEST_SEEDS.PLAN_PRO_ID,
      expiryDate: expiredDate.toISOString()
    });

    await testDb.pool.query(`
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${TENANT_EXPIRED}', 'Expired Medical Center', 'expired-medical')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES (
        '74444444-4444-4444-8444-444444444403', 'LIC-EXPIRED-01', '${TEST_SEEDS.PARTNER_ID_A}', '${TENANT_EXPIRED}',
        '73333333-3333-4333-8333-333333333303', '${TEST_SEEDS.PLAN_PRO_ID}', 'COMMERCIAL',
        'EXPIRED', 'ACTIVATED', 50, 25, 3,
        now() - interval '60 days', now() - interval '60 days', '${expiredDate.toISOString()}', '${expiredGraceEnd.toISOString()}', '${expiredSig}'
      )
      ON CONFLICT DO NOTHING;
    `);

    // 4. Seed Suspended Tenant
    const suspendedDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const suspendedSig = licenseService.signLicensePayload({
      licenseKey: 'LIC-SUSPENDED-01',
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      tenantId: TENANT_SUSPENDED,
      subscriptionId: '73333333-3333-4333-8333-333333333304',
      planId: TEST_SEEDS.PLAN_PRO_ID,
      expiryDate: suspendedDate.toISOString()
    });

    await testDb.pool.query(`
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${TENANT_SUSPENDED}', 'Suspended Nursing Home', 'suspended-nursing')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES (
        '74444444-4444-4444-8444-444444444404', 'LIC-SUSPENDED-01', '${TEST_SEEDS.PARTNER_ID_A}', '${TENANT_SUSPENDED}',
        '73333333-3333-4333-8333-333333333304', '${TEST_SEEDS.PLAN_PRO_ID}', 'COMMERCIAL',
        'SUSPENDED', 'ACTIVATED', 50, 25, 3,
        now(), now(), '${suspendedDate.toISOString()}', null, '${suspendedSig}'
      )
      ON CONFLICT DO NOTHING;
    `);

    const seededLicenses = await testDb.pool.query('SELECT tenant_id, status FROM company.licenses');
    console.log('SEEDED LICENSES IN DB:', seededLicenses.rows);

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // TEST 1: ACTIVE subscription
  it('TEST 1: ACTIVE subscription allows unrestricted access to partner business routes', async () => {
    const token = createToken(TENANT_ACTIVE);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200, 'ACTIVE tenant must have full access');
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
  });

  // TEST 2: TRIAL within valid period
  it('TEST 2: TRIAL within valid 14-day duration allows access to partner business routes', async () => {
    const token = createToken(TENANT_TRIAL);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.statusCode !== 200) {
      console.log('TEST 2 FAILED BODY:', res.statusCode, res.body);
    }
    assert.strictEqual(res.statusCode, 200, 'Valid TRIAL tenant must have full access');
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
  });

  // TEST 3: GRACE period if existing rules allow access
  it('TEST 3: GRACE period allows access with x-commercial-grace-period header', async () => {
    const token = createToken(TENANT_GRACE);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.statusCode !== 200) {
      console.log('TEST 3 FAILED BODY:', res.statusCode, res.body);
    }
    assert.strictEqual(res.statusCode, 200, 'GRACE_PERIOD tenant must be allowed access per business rule');
    assert.strictEqual(res.headers['x-commercial-grace-period'], 'true', 'Must set grace period header');
    assert.ok(res.headers['x-commercial-warning'].includes('grace period'), 'Must set grace period warning');
  });

  // TEST 4: EXPIRED
  it('TEST 4: EXPIRED subscription is BLOCKED with 403 Forbidden', async () => {
    const token = createToken(TENANT_EXPIRED);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 403, 'EXPIRED tenant must be blocked with 403');
    const body = JSON.parse(res.body);
    assert.ok(
      body.error.message.includes('Commercial access suspended: Subscription is EXPIRED'),
      `Expected commercial suspension message, got: ${body.error.message}`
    );
  });

  // TEST 5: SUSPENDED
  it('TEST 5: SUSPENDED subscription is BLOCKED with 403 Forbidden', async () => {
    const token = createToken(TENANT_SUSPENDED);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 403, 'SUSPENDED tenant must be blocked with 403');
    const body = JSON.parse(res.body);
    assert.ok(
      body.error.message.includes('Commercial access suspended: Subscription is SUSPENDED'),
      `Expected suspension message, got: ${body.error.message}`
    );
  });

  // TEST 6: Wrong tenant (Cross-tenant boundary attack)
  it('TEST 6: Wrong tenant attempt is BLOCKED by Tenant Validation with 403 TENANT_ACCESS_DENIED', async () => {
    const token = createToken(TENANT_ACTIVE);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': TENANT_WRONG // Attempting cross-tenant boundary breach
      }
    });

    assert.strictEqual(res.statusCode, 403, 'Cross-tenant breach must be blocked');
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'TENANT_ACCESS_DENIED');
    assert.ok(body.error.message.includes('Cross-tenant access is strictly forbidden'));
  });

  // TEST 7: Unauthorized role
  it('TEST 7: Unauthorized role is BLOCKED by RBAC/Permission with 403 INSUFFICIENT_PERMISSIONS', async () => {
    // User belongs to ACTIVE tenant, but lacks clinical:patients:read permission
    const token = createToken(TENANT_ACTIVE, ['PHARMACIST'], ['pharmacy:dispense']);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 403, 'Unauthorized role must be rejected by RBAC');
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error.code, 'INSUFFICIENT_PERMISSIONS');
  });

  // Verify non-partner routes (e.g. Health check & Webhook) are unaffected
  it('VERIFY: Non-partner routes (health) behave normally without commercial gate', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });
    assert.strictEqual(res.statusCode, 200);
  });
});
