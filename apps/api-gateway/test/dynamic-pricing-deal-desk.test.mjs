import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';

describe('Authoritative Dynamic Pricing & Deal Desk Negotiation Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const PARTNER_A = TEST_SEEDS.PARTNER_ID_A;
  const PARTNER_B = TEST_SEEDS.PARTNER_ID_B;

  function createAdminToken() {
    const claims = {
      sub: crypto.randomUUID(),
      email: 'admin@docsearch.company',
      tenantId: '00000000-0000-4000-8000-000000000001',
      roles: ['SUPER_ADMIN'],
      permissions: ['subscriptions:create', 'subscriptions:read', 'subscriptions:update', 'products:create', 'products:read'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createPartnerToken(tenantId, partnerId) {
    const claims = {
      sub: crypto.randomUUID(),
      email: `partner.${tenantId}@docsearch.health`,
      tenantId,
      partnerId,
      roles: ['HOSPITAL_ADMIN'],
      permissions: ['clinical:patients:read', 'billing:invoices:read'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
    await testDb.pool.query(`
      INSERT INTO "company"."partner_profiles" ("id", "tenant_id", "partner_type", "lifecycle_status", "verification_status", "legal_name", "trade_name", "primary_contact_name", "primary_contact_email")
      VALUES 
        ('${PARTNER_A}', '${TENANT_A}', 'HOSPITAL_NETWORK', 'ACTIVE', 'VERIFIED', 'Apex Multi-Specialty Hospitals Pvt Ltd', 'Apex Hospital', 'Dr. Ramesh Rao', 'ramesh.rao@apexhospitals.com'),
        ('${PARTNER_B}', '${TEST_SEEDS.TENANT_B}', 'CLINIC', 'ACTIVE', 'VERIFIED', 'Metro Diagnostics Pvt Ltd', 'Metro Clinic', 'Dr. Suresh Kumar', 'suresh.kumar@metro.com')
      ON CONFLICT DO NOTHING;
    `);
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  it('Test 1: Returns all 5 payment tenures with authoritative default discounts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/company/subscriptions/tenure-options'
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 5);

    const codes = body.data.map((t) => t.code);
    assert.deepEqual(codes, ['HALF_YEARLY', 'YEARLY', 'TWO_YEARS', 'THREE_YEARS', 'FIVE_YEARS']);

    const half = body.data.find((t) => t.code === 'HALF_YEARLY');
    const year = body.data.find((t) => t.code === 'YEARLY');
    const five = body.data.find((t) => t.code === 'FIVE_YEARS');
    assert.equal(half.defaultDiscountPercent, 0);
    assert.equal(year.defaultDiscountPercent, 10);
    assert.equal(five.defaultDiscountPercent, 40);
  });

  it('Test 2: Authorizes negotiated contract with tenure discount and custom percent off', async () => {
    const adminToken = createAdminToken();

    const plansRes = await app.inject({
      method: 'GET',
      url: '/api/v1/company/plans',
      headers: { authorization: `Bearer ${adminToken}` }
    });
    const plansList = JSON.parse(plansRes.payload).data;
    assert.ok(plansList.length > 0);
    const targetPlan = plansList[0];

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/subscriptions/negotiate-deal',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        partnerId: PARTNER_A,
        planId: targetPlan.id,
        tenureCode: 'THREE_YEARS',
        customDiscountPercent: 10,
        paymentTerms: 'SPLIT_50_50',
        negotiationNotes: 'Authorized by Founder for 3-Year Strategic Partnership'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.dealSummary);

    const summary = body.data.dealSummary;
    assert.equal(summary.months, 36);
    assert.equal(summary.paymentTerms, 'SPLIT_50_50');
    assert.ok(summary.finalPayable <= summary.totalGross);
  });

  it('Test 3: Authorizes negotiated contract with agreed lump-sum override', async () => {
    const adminToken = createAdminToken();

    const plansRes = await app.inject({
      method: 'GET',
      url: '/api/v1/company/plans',
      headers: { authorization: `Bearer ${adminToken}` }
    });
    const targetPlan = JSON.parse(plansRes.payload).data[0];

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/subscriptions/negotiate-deal',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        partnerId: PARTNER_B,
        planId: targetPlan.id,
        tenureCode: 'FIVE_YEARS',
        agreedLumpSum: 250000,
        paymentTerms: 'FULL_UPFRONT',
        negotiationNotes: 'Fixed 5-Year enterprise lump sum deal'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.dealSummary.finalPayable, 250000);
    assert.equal(body.data.dealSummary.months, 60);
  });

  it('Test 4: Partner Account endpoint delivers 1st Year Free countdown and renewal options', async () => {
    const partnerToken = createPartnerToken(TENANT_A, PARTNER_A);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/plan-and-features',
      headers: { authorization: `Bearer ${partnerToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);

    const sub = body.data.subscription;
    assert.equal(typeof sub.isFirstYearFree, 'boolean');
    assert.ok(Array.isArray(sub.availableRenewalTenures));
    assert.equal(sub.availableRenewalTenures.length, 5);

    const tenures = sub.availableRenewalTenures;
    assert.equal(tenures[0].tenureCode, 'HALF_YEARLY');
    assert.equal(tenures[1].tenureCode, 'YEARLY');
    assert.equal(tenures[4].tenureCode, 'FIVE_YEARS');
    assert.ok(tenures[4].defaultDiscountPercent >= 40);
  });
});
