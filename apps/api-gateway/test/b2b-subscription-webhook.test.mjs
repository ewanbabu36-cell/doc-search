import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import {
  setupTestDatabase,
  getDatabase,
  tenants,
  partnerProfiles,
  plans,
  commercialOrderSnapshots,
  subscriptions,
  licenses,
  invoices,
  eq
} from '@docsearch/database';

describe('Authoritative B2B Subscription Payment Webhook & Idempotency Pipeline Suite', () => {
  let app;
  let testDb;

  const WEBHOOK_SECRET = 'rzp_whsec_test_secret_32char_key!';
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

  const PARTNER_ID = '00000000-0000-4000-8000-000000000099';
  const TENANT_ID = '11111111-1111-4111-8111-111111111199';
  const PLAN_ID = '88888888-8888-4888-8888-888888888814'; // PLAN_HOSPITAL_ANNUAL
  const SNAPSHOT_ID = '55555555-5555-4555-8555-555555555599';
  const SUBSCRIPTION_ID = '33333333-3333-4333-8333-333333333399';
  const LICENSE_ID = '44444444-4444-4444-8444-444444444499';

  // 60 days remaining initially
  const initialExpiryDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  function signPayload(bodyString, secret = WEBHOOK_SECRET) {
    return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
  }

  before(async () => {
    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: false });
    const db = getDatabase();

    // 0. Create Tenant
    await db.insert(tenants).values({
      id: TENANT_ID,
      name: 'Apex City Hospital Tenant',
      slug: 'apex-city-hospital'
    });

    // 1. Create Partner Profile
    await db.insert(partnerProfiles).values({
      id: PARTNER_ID,
      tenantId: TENANT_ID,
      partnerType: 'HOSPITAL_NETWORK',
      lifecycleStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      legalName: 'Apex City Super-Speciality Hospital Ltd',
      tradeName: 'Apex Hospital',
      primaryContactName: 'Dr. Anita Desai',
      primaryContactEmail: 'anita.desai@apexhospital.in',
      primaryContactPhone: '+919876543210'
    });

    // 2. Create Initial Subscription with 60 days validity remaining
    await db.insert(subscriptions).values({
      id: SUBSCRIPTION_ID,
      partnerId: PARTNER_ID,
      productId: '77777777-7777-4777-8777-777777777777',
      planId: PLAN_ID,
      planVersion: '1.0.0',
      billingCycle: 'ANNUAL',
      status: 'ACTIVE',
      startDate: new Date(Date.now() - 305 * 24 * 60 * 60 * 1000),
      endDate: initialExpiryDate,
      renewalDate: initialExpiryDate
    });

    // 3. Create Initial License linked to subscription
    await db.insert(licenses).values({
      id: LICENSE_ID,
      licenseKey: 'DS-HOSP-2026-APEX-ACTIVE-KEY',
      partnerId: PARTNER_ID,
      tenantId: TENANT_ID,
      subscriptionId: SUBSCRIPTION_ID,
      planId: PLAN_ID,
      licenseType: 'COMMERCIAL',
      status: 'ACTIVE',
      activationStatus: 'ACTIVATED',
      startDate: new Date(Date.now() - 305 * 24 * 60 * 60 * 1000),
      expiryDate: initialExpiryDate,
      gracePeriodEnd: new Date(initialExpiryDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      signature: 'mock_signature_apex_hospital_valid'
    });

    // 4. Create Pending Commercial Order Snapshot for 2 Years (730 days) renewal (₹39,200)
    await db.insert(commercialOrderSnapshots).values({
      id: SNAPSHOT_ID,
      partnerId: PARTNER_ID,
      planId: PLAN_ID,
      billingDurationYears: 2,
      annualBasePriceInr: 20000,
      grossAmountInr: 40000,
      discountRatePercent: 2,
      discountAmountInr: 800,
      taxableAmountInr: 33220,
      taxRatePercent: 18,
      cgstAmountInr: 2990,
      sgstAmountInr: 2990,
      igstAmountInr: 0,
      finalAmountInr: 39200,
      currency: 'INR',
      status: 'PENDING',
      customerBillingAddress: 'Apex Hospital, Mumbai, Maharashtra'
    });

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  it('1. Rejects webhook request with missing or invalid signature (HTTP 401)', async () => {
    const rawPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_tampered_123',
            order_id: 'order_test_123',
            amount: 3920000,
            currency: 'INR',
            notes: { snapshotId: SNAPSHOT_ID }
          }
        }
      }
    });

    // Missing signature
    const resNoSig = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      payload: rawPayload,
      headers: { 'Content-Type': 'application/json' }
    });
    assert.equal(resNoSig.statusCode, 401);

    // Tampered signature
    const resBadSig = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      payload: rawPayload,
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': '0000000000000000000000000000000000000000000000000000000000000000'
      }
    });
    assert.equal(resBadSig.statusCode, 401);
  });

  it('2. Atomically processes valid B2B payment webhook, marks snapshot PAID, creates invoice, and extends license', async () => {
    const paymentId = 'pay_b2b_apex_' + Date.now();
    const orderId = 'order_b2b_apex_' + Date.now();

    const webhookPayloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount: 3920000, // ₹39,200 in paise
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            email: 'finance@apexhospital.in',
            notes: {
              snapshotId: SNAPSHOT_ID
            },
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      }
    };

    const rawPayload = JSON.stringify(webhookPayloadObj);
    const validSignature = signPayload(rawPayload);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      payload: rawPayload,
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSignature
      }
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.status, 'ok');
    assert.equal(json.isDuplicate, false);

    // Verify snapshot marked as PAID
    const db = getDatabase();
    const [snapshot] = await db
      .select()
      .from(commercialOrderSnapshots)
      .where(eq(commercialOrderSnapshots.id, SNAPSHOT_ID))
      .limit(1);

    assert.equal(snapshot.status, 'PAID', 'Commercial snapshot must be marked PAID');

    // Verify B2B tax invoice generated in company.invoices
    const partnerInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.subscriptionId, SUBSCRIPTION_ID));

    assert.ok(partnerInvoices.length >= 1, 'Invoice must be generated');
    const inv = partnerInvoices[0];
    assert.equal(inv.currency, 'INR');
    assert.equal(inv.status, 'PAID');
    assert.equal(Number(inv.totalAmount), 39200);

    // Verify Active License Extension Invariant:
    // New Expiry must equal initialExpiryDate + 2 years (730 days)
    const [lic] = await db
      .select()
      .from(licenses)
      .where(eq(licenses.id, LICENSE_ID))
      .limit(1);

    const expectedNewExpiryMs = initialExpiryDate.getTime() + 730 * 24 * 60 * 60 * 1000;
    const actualExpiryMs = new Date(lic.expiryDate).getTime();

    // Allow small 1000ms delta for DB rounding
    assert.ok(
      Math.abs(actualExpiryMs - expectedNewExpiryMs) < 2000,
      `License expiry must extend by 730 days preserving existing 60 days. Expected ~${new Date(expectedNewExpiryMs).toISOString()}, got ${lic.expiryDate}`
    );
  });

  it('3. Webhook Idempotency: Replaying duplicate payment returns 200 with isDuplicate=true and prevents double-credit', async () => {
    const rawPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_duplicate_replay_123',
            order_id: 'order_duplicate_123',
            amount: 3920000,
            currency: 'INR',
            status: 'captured',
            notes: { snapshotId: SNAPSHOT_ID }
          }
        }
      }
    });

    const validSignature = signPayload(rawPayload);

    const db = getDatabase();
    const [licBefore] = await db.select().from(licenses).where(eq(licenses.id, LICENSE_ID)).limit(1);
    const expiryBefore = new Date(licBefore.expiryDate).getTime();

    // Replay identical webhook
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      payload: rawPayload,
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSignature
      }
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.isDuplicate, true, 'Must report isDuplicate=true');

    // Verify license expiry did NOT double-extend
    const [licAfter] = await db.select().from(licenses).where(eq(licenses.id, LICENSE_ID)).limit(1);
    const expiryAfter = new Date(licAfter.expiryDate).getTime();

    assert.equal(expiryAfter, expiryBefore, 'Duplicate webhook replay must not double-credit license duration');
  });
});
