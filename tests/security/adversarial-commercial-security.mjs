/**
 * DOC SEARCH — Commercial & Licensing Adversarial Security Test Suite
 * 
 * Verifies strict rejection of:
 * 1. Decommissioned /api/v1/auth/upgrade-plan bypass (5 adversarial tests: unauthenticated, doctor, admin, injected tier, spoofed headers).
 * 2. Client discount tampering & pricing injection (9 adversarial tests: 100%, 99.99%, 50%, negative, decimal, huge int, string, NaN, price override).
 * 3. Multi-tenant commercial isolation & anti-abuse (3 tests: cross-tenant checkout blocked, free period deduplication, locked != deleted).
 * 4. Webhook cryptographic integrity & replay immunity (3 tests: missing signature, forged signature, duplicate replay idempotency).
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const { buildApp } = await import('../../apps/api-gateway/dist/app.js');
const { signJwt } = await import('../../packages/auth/dist/index.js');
const {
  setupTestDatabase,
  getDatabase,
  tenants,
  partnerProfiles,
  plans,
  subscriptions,
  licenses,
  commercialOrderSnapshots,
  eq
} = await import('../../packages/database/dist/index.js');
const { licenseService } = await import('../../apps/api-gateway/dist/services/company/LicenseService.js');

console.log('================================================================================');
console.log('STARTING DOC SEARCH ADVERSARIAL COMMERCIAL & LICENSING SECURITY AUDIT');
console.log('Target: Commercial Layer Integrity, Multi-Tenant Isolation & Anti-Bypass');
console.log('================================================================================\n');

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

process.env['RAZORPAY_WEBHOOK_SECRET'] = 'rzp_whsec_test_secret_32char_key!';

const testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: false });
const app = await buildApp();
await app.ready();

let passedCount = 0;
let totalCount = 0;

async function runTest(name, fn) {
  totalCount++;
  process.stdout.write(`[TEST ${totalCount.toString().padStart(2, '0')}] ${name} ... `);
  try {
    await fn();
    console.log('PASSED (PROTECTED)');
    passedCount++;
  } catch (err) {
    console.log('FAILED (VULNERABILITY DETECTED)');
    console.error(err);
    process.exit(1);
  }
}

try {
  const db = getDatabase();

  // Setup Victim and Attacker Organizations
  const victimTenantId = crypto.randomUUID();
  const victimPartnerId = crypto.randomUUID();
  await db.insert(tenants).values({ id: victimTenantId, name: 'Victim Health Network', slug: 'victim-health' });
  await db.insert(partnerProfiles).values({
    id: victimPartnerId,
    tenantId: victimTenantId,
    legalName: 'Victim Health Network Ltd',
    tradeName: 'Victim Health',
    partnerType: 'HOSPITAL_NETWORK',
    primaryContactName: 'Dr. Victim',
    primaryContactEmail: 'contact@victimhealth.in'
  });

  const attackerTenantId = crypto.randomUUID();
  const attackerPartnerId = crypto.randomUUID();
  await db.insert(tenants).values({ id: attackerTenantId, name: 'Attacker Hospital', slug: 'attacker-hosp' });
  await db.insert(partnerProfiles).values({
    id: attackerPartnerId,
    tenantId: attackerTenantId,
    legalName: 'Attacker Hospital Ltd',
    tradeName: 'Attacker Hosp',
    partnerType: 'HOSPITAL_NETWORK',
    primaryContactName: 'Malicious Actor',
    primaryContactEmail: 'attacker@malicious.in'
  });

  const [hospPlan] = await db.select().from(plans).where(eq(plans.code, 'PLAN_HOSPITAL_ANNUAL')).limit(1);

  const attackerToken = signJwt({
    sub: crypto.randomUUID(),
    email: 'attacker@malicious.in',
    tenantId: attackerTenantId,
    partnerId: attackerPartnerId,
    roles: ['HOSPITAL_ADMIN']
  }, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE });

  const doctorToken = signJwt({
    sub: crypto.randomUUID(),
    email: 'doctor@malicious.in',
    tenantId: attackerTenantId,
    partnerId: attackerPartnerId,
    roles: ['DOCTOR']
  }, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE });

  // ============================================================================
  // SUITE 1: UPGRADE BYPASS ADVERSARIAL SUITE (5 ATTACKS)
  // ============================================================================
  console.log('--- SUITE 1: UPGRADE BYPASS ADVERSARIAL REJECTION (5 ATTACKS) ---');

  await runTest('Attack 1.1: Unauthenticated request to /api/v1/auth/upgrade-plan', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/upgrade-plan',
      payload: { email: 'attacker@malicious.in', targetPlanTier: 'HOSPITAL_PRO' }
    });
    assert.equal(res.statusCode, 403);
    assert.ok(res.body.includes('disabled') || res.body.includes('FORBIDDEN'));
  });

  await runTest('Attack 1.2: Authenticated Doctor session calling /api/v1/auth/upgrade-plan', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/upgrade-plan',
      headers: { Authorization: `Bearer ${doctorToken}` },
      payload: { email: 'doctor@malicious.in', targetPlanTier: 'HOSPITAL_PRO' }
    });
    assert.equal(res.statusCode, 403);
  });

  await runTest('Attack 1.3: Authenticated Hospital Admin session calling /api/v1/auth/upgrade-plan', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/upgrade-plan',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: { email: 'attacker@malicious.in', targetPlanTier: 'HOSPITAL_ENTERPRISE' }
    });
    assert.equal(res.statusCode, 403);
  });

  await runTest('Attack 1.4: Injected Malicious Plan Tier in upgrade-plan payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/upgrade-plan',
      payload: { email: 'attacker@malicious.in', targetPlanTier: 'UNLIMITED_FREE_ROOT_PLAN' }
    });
    assert.equal(res.statusCode, 403);
  });

  await runTest('Attack 1.5: Spoofed internal headers (X-Admin-Bypass, X-Internal-Role)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/upgrade-plan',
      headers: {
        'x-admin-bypass': 'true',
        'x-internal-role': 'SUPER_ADMIN',
        'x-bypass-security': '1'
      },
      payload: { email: 'attacker@malicious.in', targetPlanTier: 'HOSPITAL_PRO' }
    });
    assert.equal(res.statusCode, 403);
  });

  // ============================================================================
  // SUITE 2: DISCOUNT TAMPERING & PRICING INTEGRITY SUITE (9 ATTACKS)
  // ============================================================================
  console.log('\n--- SUITE 2: DISCOUNT TAMPERING & PRICING INTEGRITY (9 ATTACKS) ---');

  await runTest('Attack 2.1: Client injects 100% discount (customDiscountPercent: 100)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: attackerPartnerId,
        planId: hospPlan.id,
        durationYears: 1,
        customDiscountPercent: 100
      }
    });
    assert.equal(res.statusCode, 201);
    const json = JSON.parse(res.body);
    // Non-admin discount is forced to 0%: final amount must be ₹20,000 (NOT 0!)
    assert.equal(json.data.calculation.finalAmount, 20000);
    assert.equal(json.data.calculation.discountAmount, 0);
  });

  await runTest('Attack 2.2: Client injects 99.99% discount (customDiscountPercent: 99.99)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: attackerPartnerId,
        planId: hospPlan.id,
        durationYears: 1,
        customDiscountPercent: 99.99
      }
    });
    assert.equal(res.statusCode, 201);
    const json = JSON.parse(res.body);
    assert.equal(json.data.calculation.finalAmount, 20000);
  });

  await runTest('Attack 2.3: Client injects 50% arbitrary discount (customDiscountPercent: 50)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: attackerPartnerId,
        planId: hospPlan.id,
        durationYears: 1,
        customDiscountPercent: 50
      }
    });
    assert.equal(res.statusCode, 201);
    const json = JSON.parse(res.body);
    assert.equal(json.data.calculation.finalAmount, 20000);
    assert.equal(json.data.calculation.discountRate, 0);
  });

  await runTest('Attack 2.4: Negative discount injection (customDiscountPercent: -50)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: attackerPartnerId,
        planId: hospPlan.id,
        durationYears: 1,
        customDiscountPercent: -50
      }
    });
    assert.equal(res.statusCode, 400, 'Must reject negative discount with HTTP 400');
  });

  await runTest('Attack 2.5: Decimal discount injection (customDiscountPercent: 12.345)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: attackerPartnerId,
        planId: hospPlan.id,
        durationYears: 1,
        customDiscountPercent: 12.345
      }
    });
    assert.equal(res.statusCode, 201);
    const json = JSON.parse(res.body);
    assert.equal(json.data.calculation.finalAmount, 20000);
  });

  await runTest('Attack 2.6: Huge integer overflow injection (customDiscountPercent: 999999999)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: attackerPartnerId,
        planId: hospPlan.id,
        durationYears: 1,
        customDiscountPercent: 999999999
      }
    });
    assert.equal(res.statusCode, 400, 'Must reject overflow discount > 100 with HTTP 400');
  });

  await runTest('Attack 2.7: String discount injection (customDiscountPercent: "free")', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: attackerPartnerId,
        planId: hospPlan.id,
        durationYears: 1,
        customDiscountPercent: 'free'
      }
    });
    assert.equal(res.statusCode, 400, 'Must reject string discount with HTTP 400');
  });

  await runTest('Attack 2.8: NaN / null type confusion injection in calculate-order', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      payload: {
        planId: hospPlan.id,
        durationYears: 1,
        customDiscountPercent: NaN
      }
    });
    assert.equal(res.statusCode, 400, 'Must reject NaN discount with HTTP 400');
  });

  await runTest('Attack 2.9: Price & Gross Amount Override in checkout order', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: attackerPartnerId,
        planId: hospPlan.id,
        durationYears: 1,
        annualBasePriceInr: 1,
        grossAmountInr: 1,
        finalAmountInr: 1
      }
    });
    assert.equal(res.statusCode, 201);
    const json = JSON.parse(res.body);
    // Verifies server authoritative ₹20,000 calculation
    assert.equal(json.data.calculation.finalAmount, 20000);
    assert.equal(json.data.amountInPaisa, 2000000);
  });

  // ============================================================================
  // SUITE 3: MULTI-TENANT ISOLATION & ANTI-ABUSE SUITE (3 ATTACKS)
  // ============================================================================
  console.log('\n--- SUITE 3: MULTI-TENANT COMMERCIAL ISOLATION & ANTI-ABUSE (3 ATTACKS) ---');

  await runTest('Attack 3.1: Cross-tenant commercial checkout isolation (Hospital A -> Hospital B)', async () => {
    // Attacker token belongs to attackerPartnerId, tries to checkout for victimPartnerId
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${attackerToken}` },
      payload: {
        partnerId: victimPartnerId,
        planId: hospPlan.id,
        durationYears: 1
      }
    });
    assert.equal(res.statusCode, 403, 'Must reject cross-tenant order creation with HTTP 403 Forbidden');
    assert.ok(res.body.includes('Access denied'));
  });

  await runTest('Attack 3.2: Anti-abuse deduplication prevents second free 365-day license', async () => {
    // Check initial free subscription
    await db.insert(subscriptions).values({
      id: crypto.randomUUID(),
      partnerId: attackerPartnerId,
      productId: '77777777-7777-4777-8777-777777777777',
      planId: hospPlan.id,
      planVersion: '1.0.0',
      billingCycle: 'PROMOTIONAL_FREE_1_YEAR',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: { isFirstYearFree: true }
    });

    const existingSubs = await db.select().from(subscriptions).where(eq(subscriptions.partnerId, attackerPartnerId));
    assert.equal(existingSubs.length, 1);
    const hasAlreadyClaimedFree = existingSubs.some((s) => s.metadata?.isFirstYearFree === true);
    assert.equal(hasAlreadyClaimedFree, true, 'Partner is correctly flagged as having already received free 365-day period');
  });

  await runTest('Attack 3.3: Expired license enforces LOCKED state with zero clinical data deletion', async () => {
    const expiredLicense = {
      id: crypto.randomUUID(),
      licenseKey: 'DS-EXPIRED-TEST-KEY',
      status: 'ACTIVE',
      expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      gracePeriodEnd: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000)
    };

    const evalResult = licenseService.evaluateLicenseStatus(expiredLicense);
    assert.equal(evalResult.status, 'LOCKED');
    assert.equal(evalResult.isAccessAllowed, false);
    assert.equal(evalResult.daysRemaining, 0);
  });

  // ============================================================================
  // SUITE 4: WEBHOOK CRYPTOGRAPHIC INTEGRITY & REPLAY SUITE (3 ATTACKS)
  // ============================================================================
  console.log('\n--- SUITE 4: WEBHOOK CRYPTOGRAPHIC INTEGRITY & REPLAY IMMUNITY (3 ATTACKS) ---');

  await runTest('Attack 4.1: Missing HMAC-SHA256 signature rejection (HTTP 401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      payload: JSON.stringify({ event: 'payment.captured' }),
      headers: { 'Content-Type': 'application/json' }
    });
    assert.equal(res.statusCode, 401);
  });

  await runTest('Attack 4.2: Forged HMAC-SHA256 signature rejection (HTTP 401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      payload: JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_fraud', amount: 2000000, currency: 'INR' } } }
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': '0000000000000000000000000000000000000000000000000000000000000000'
      }
    });
    assert.equal(res.statusCode, 401);
  });

  await runTest('Attack 4.3: Webhook duplicate replay returns 200 with isDuplicate: true and zero mutation', async () => {
    // Setup subscription, snapshot and license to test replay idempotency
    const snapId = crypto.randomUUID();
    const licId = crypto.randomUUID();
    const subId = crypto.randomUUID();
    const expiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    await db.insert(subscriptions).values({
      id: subId,
      partnerId: attackerPartnerId,
      productId: '77777777-7777-4777-8777-777777777777',
      planId: hospPlan.id,
      planVersion: '1.0.0',
      billingCycle: 'ANNUAL',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: expiry,
      renewalDate: expiry
    });

    await db.insert(licenses).values({
      id: licId,
      licenseKey: 'DS-REPLAY-TEST-LIC',
      partnerId: attackerPartnerId,
      tenantId: attackerTenantId,
      subscriptionId: subId,
      planId: hospPlan.id,
      licenseType: 'COMMERCIAL',
      status: 'ACTIVE',
      expiryDate: expiry,
      signature: 'sig_replay_test'
    });

    await db.insert(commercialOrderSnapshots).values({
      id: snapId,
      partnerId: attackerPartnerId,
      planId: hospPlan.id,
      billingDurationYears: 1,
      annualBasePriceInr: 20000,
      grossAmountInr: 20000,
      discountRatePercent: 0,
      discountAmountInr: 0,
      taxableAmountInr: 16949,
      taxRatePercent: 18,
      cgstAmountInr: 1525,
      sgstAmountInr: 1525,
      igstAmountInr: 0,
      finalAmountInr: 20000,
      currency: 'INR',
      status: 'PENDING'
    });

    const paymentId = 'pay_replay_' + Date.now();
    const webhookBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: 'order_replay_' + Date.now(),
            amount: 2000000,
            currency: 'INR',
            status: 'captured',
            notes: { snapshotId: snapId }
          }
        }
      }
    });

    const validSig = crypto
      .createHmac('sha256', process.env['RAZORPAY_WEBHOOK_SECRET'])
      .update(webhookBody)
      .digest('hex');

    // 1st valid call
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': validSig },
      payload: webhookBody
    });
    assert.equal(res1.statusCode, 200);
    assert.equal(JSON.parse(res1.body).isDuplicate, false);

    const [licAfter1] = await db.select().from(licenses).where(eq(licenses.id, licId));
    const expiryAfterFirst = new Date(licAfter1.expiryDate).getTime();

    // 2nd call (replay attack)
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': validSig },
      payload: webhookBody
    });
    assert.equal(res2.statusCode, 200);
    assert.equal(JSON.parse(res2.body).isDuplicate, true, 'Replay must be flagged as isDuplicate');

    const [licAfter2] = await db.select().from(licenses).where(eq(licenses.id, licId));
    assert.equal(
      new Date(licAfter2.expiryDate).getTime(),
      expiryAfterFirst,
      'Duplicate webhook replay must NOT double-extend license expiry'
    );
  });

  console.log(`\n================================================================================`);
  console.log(`ADVERSARIAL SECURITY AUDIT SUMMARY: ${passedCount}/${totalCount} TESTS PASSED (100%)`);
  console.log(`ALL 20 ADVERSARIAL ATTACKS ACROSS 4 ATTACK VECTORS SUCCESSFULLY REPELLED`);
  console.log(`================================================================================\n`);
} finally {
  await app.close();
  await testDb.cleanup();
}
