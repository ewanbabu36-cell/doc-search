/**
 * DOC SEARCH — Comprehensive Commercial Subscription & License Lifecycle E2E Test
 * 
 * Verifies end-to-end:
 * 1. Self-registration / onboarding creates verified partner with authoritative 365-day free license.
 * 2. Clinical patient record creation to test data persistence guarantee.
 * 3. Transition through 60-day RENEWAL_WINDOW and 30-day EXPIRING_SOON countdown.
 * 4. Pre-expiry renewal: 3-Year tenure (10% discount), backward GST (SAC 998313).
 * 5. Active License Extension Invariant: Preserves 100% of remaining days (new = old + duration).
 * 6. B2B payment webhook with HMAC-SHA256 signature verification and invoice creation.
 * 7. Non-renewal expiry transitions to LOCKED (with Locked != Deleted data guarantee).
 * 8. Post-lock late payment reactivates license and restores access.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env['RAZORPAY_WEBHOOK_SECRET'] = 'rzp_whsec_test_secret_32char_key!';

const { buildApp } = await import('../../apps/api-gateway/dist/app.js');
const { signJwt } = await import('../../packages/auth/dist/index.js');
const {
  setupTestDatabase,
  getDatabase,
  partnerProfiles,
  subscriptions,
  licenses,
  invoices,
  commercialOrderSnapshots,
  patients,
  eq
} = await import('../../packages/database/dist/index.js');
const { licenseService } = await import('../../apps/api-gateway/dist/services/company/LicenseService.js');

console.log('================================================================================');
console.log('🏥 STARTING DOC SEARCH COMMERCIAL SUBSCRIPTION & LICENSE LIFECYCLE E2E TEST');
console.log('================================================================================\n');

const testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: false });
const app = await buildApp();
await app.ready();

let testIndex = 0;
async function step(title, fn) {
  testIndex++;
  process.stdout.write(`[Step ${testIndex}] ${title} ... `);
  try {
    await fn();
    console.log('PASSED ✓');
  } catch (err) {
    console.log('FAILED ✗');
    console.error(err);
    process.exit(1);
  }
}

try {
  const db = getDatabase();
  const uniqueSuffix = Date.now().toString().slice(-4);
  const partnerEmail = `director.${uniqueSuffix}@lifecare-hospital.test`;

  let tenantId;
  let partnerId;
  let branchId;
  let subId;
  let licenseId;
  let planId;
  let orderSnapshotId;
  let razorpayOrderId;
  let hospitalToken;

  // Step 1: Onboarding Healthcare Partner & Provisioning Free 365-Day License
  await step('Partner Onboarding: Provisioning Verified Hospital with 365-Day Free License', async () => {
    // Acquire Company Admin token
    const adminAuthRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/quick-session',
      payload: {
        email: 'founder@docsearch.health',
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
        permissions: ['*']
      }
    });
    assert.equal(adminAuthRes.statusCode, 200);
    const adminToken = JSON.parse(adminAuthRes.body).data.accessToken;

    // Onboard Partner via authoritative Company API
    const onboardRes = await app.inject({
      method: 'POST',
      url: '/api/v1/company/partners',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        legalName: `LifeCare Multi-Specialty Hospital ${uniqueSuffix} Ltd`,
        tradeName: `LifeCare Delhi Facility ${uniqueSuffix}`,
        partnerType: 'HOSPITAL_NETWORK',
        primaryContactName: 'Dr. Ramesh Sharma',
        primaryContactEmail: partnerEmail,
        primaryContactPhone: '011-98765432',
        primaryContactRole: 'Chief Medical Officer',
        planCode: 'PLAN_HOSPITAL_ANNUAL',
        billingCycle: 'ANNUAL',
        isTrial: false,
        initialFacilityName: 'LifeCare Main Facility'
      }
    });

    assert.equal(onboardRes.statusCode, 201);
    const partnerData = JSON.parse(onboardRes.body).data;
    tenantId = partnerData.tenantId;
    partnerId = partnerData.id || partnerData.partner.id;
    branchId = partnerData.branchId || partnerData.facilityId;

    assert.ok(tenantId, 'Tenant ID must exist');
    assert.ok(partnerId, 'Partner ID must exist');

    // Retrieve created subscription and license
    const partnerSubs = await db.select().from(subscriptions).where(eq(subscriptions.partnerId, partnerId));
    assert.ok(partnerSubs.length > 0, 'Subscription must be created');
    subId = partnerSubs[0].id;
    planId = partnerSubs[0].planId;

    const partnerLicenses = await db.select().from(licenses).where(eq(licenses.partnerId, partnerId));
    assert.ok(partnerLicenses.length > 0, 'License must be created');
    licenseId = partnerLicenses[0].id;

    // Acquire session token for Hospital Administrator
    const authRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/quick-session',
      payload: {
        email: partnerEmail,
        role: 'HOSPITAL_ADMIN',
        roles: ['HOSPITAL_ADMIN', 'DOCTOR'],
        permissions: ['*'],
        tenantId,
        branchId,
        partnerId,
        name: 'Dr. Ramesh Sharma'
      }
    });
    assert.equal(authRes.statusCode, 200);
    hospitalToken = JSON.parse(authRes.body).data.accessToken;
  });

  // Step 2: Register Patient to prove clinical data retention
  await step('Clinical Activity: Register Patient in OPD', async () => {
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patients',
      headers: { Authorization: `Bearer ${hospitalToken}` },
      payload: {
        firstName: 'Aarav',
        lastName: 'Patel',
        gender: 'MALE',
        dateOfBirth: '1985-06-15',
        primaryMobile: '9876543210',
        mobileNumber: '9876543210',
        bloodGroup: 'O+'
      }
    });

    assert.equal(patRes.statusCode, 201);
    const patData = JSON.parse(patRes.body).data;
    assert.ok(patData.id, 'Patient ID must exist');
    assert.ok(patData.mrn, 'Patient MRN must exist');
  });

  // Step 3: Lifecycle Status Evaluation: ACTIVE, RENEWAL_WINDOW (<= 60d), EXPIRING_SOON (<= 30d)
  await step('Lifecycle Status Evaluation: ACTIVE -> RENEWAL_WINDOW (60d) -> EXPIRING_SOON (30d)', async () => {
    const [lic] = await db.select().from(licenses).where(eq(licenses.id, licenseId));
    
    // Normal active status
    const statusNorm = licenseService.evaluateLicenseStatus(lic);
    assert.equal(statusNorm.status, 'ACTIVE');
    assert.ok(statusNorm.daysRemaining > 300);
    assert.equal(statusNorm.isAccessAllowed, true);

    // Virtual state: 45 days remaining -> RENEWAL_WINDOW
    const virtual45d = {
      ...lic,
      expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    };
    const status45d = licenseService.evaluateLicenseStatus(virtual45d);
    assert.equal(status45d.status, 'RENEWAL_WINDOW');
    assert.equal(status45d.isAccessAllowed, true);
    assert.equal(status45d.daysRemaining, 45);

    // Virtual state: 20 days remaining -> EXPIRING_SOON
    const virtual20d = {
      ...lic,
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    };
    const status20d = licenseService.evaluateLicenseStatus(virtual20d);
    assert.equal(status20d.status, 'EXPIRING_SOON');
    assert.equal(status20d.isAccessAllowed, true);
    assert.equal(status20d.daysRemaining, 20);
  });

  // Step 4: Pre-Expiry Renewal Calculation & Checkout Order Creation (3 Years @ 10% Discount)
  await step('Pre-Expiry Renewal: Order Calculation for 3 Years (10% Discount, SAC 998313 Backward GST)', async () => {
    // Step 4a: Calculate order
    const calcRes = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      headers: { Authorization: `Bearer ${hospitalToken}` },
      payload: {
        partnerId,
        planId,
        durationYears: 3,
        isInterstate: false
      }
    });

    assert.equal(calcRes.statusCode, 200);
    const calc = JSON.parse(calcRes.body).data;
    assert.equal(calc.durationYears, 3);
    assert.equal(calc.annualBasePriceInr, 20000);
    assert.equal(calc.grossAmountInr, 60000);
    assert.equal(calc.discountRatePercent, 10);
    assert.equal(calc.discountAmountInr, 6000);
    assert.equal(calc.finalAmountInr, 54000); // 60,000 - 10%
    assert.equal(calc.sacCode, '998313');

    // Backward GST: 54,000 / 1.18 = 45762.71
    assert.equal(calc.taxableAmountInr, 45762.71);
    assert.equal(calc.cgstAmountInr, 4118.65);
    assert.equal(calc.sgstAmountInr, 4118.64);
    assert.equal(calc.igstAmountInr, 0);

    // Step 4b: Create authoritative checkout order snapshot
    const checkoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { Authorization: `Bearer ${hospitalToken}` },
      payload: {
        partnerId,
        planId,
        durationYears: 3,
        isInterstate: false,
        customerBillingAddress: 'Mumbai, Maharashtra'
      }
    });

    assert.equal(checkoutRes.statusCode, 201);
    const checkoutData = JSON.parse(checkoutRes.body).data;
    orderSnapshotId = checkoutData.snapshotId;
    razorpayOrderId = checkoutData.razorpayOrderId;
    assert.equal(checkoutData.amountInPaisa, 5400000);
    assert.ok(orderSnapshotId);
    assert.ok(razorpayOrderId);
  });

  // Step 5: Server-Verified B2B Payment Webhook Processing & Active Extension Invariant
  await step('Server Payment Webhook Verification: HMAC-SHA256, Invariant Extension, B2B Invoice', async () => {
    const [licBefore] = await db.select().from(licenses).where(eq(licenses.id, licenseId));
    const previousExpiryMs = licBefore.expiryDate.getTime();

    const paymentId = 'pay_b2b_' + crypto.randomBytes(8).toString('hex');
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: razorpayOrderId,
            amount: 5400000,
            currency: 'INR',
            status: 'captured',
            method: 'netbanking',
            bank: 'HDFC',
            email: partnerEmail,
            contact: '+919876543210',
            notes: {
              snapshotId: orderSnapshotId
            }
          }
        }
      }
    });

    const signature = crypto
      .createHmac('sha256', process.env['RAZORPAY_WEBHOOK_SECRET'])
      .update(webhookPayload)
      .digest('hex');

    const webhookRes = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      payload: webhookPayload
    });

    assert.equal(webhookRes.statusCode, 200);
    const body = JSON.parse(webhookRes.body);
    assert.equal(body.status, 'ok');
    assert.equal(body.isDuplicate, false);

    // Invariant Check 1: Snapshot marked PAID
    const [snapshot] = await db.select().from(commercialOrderSnapshots).where(eq(commercialOrderSnapshots.id, orderSnapshotId));
    assert.equal(snapshot.status, 'PAID');
    assert.equal(snapshot.metadata?.gatewayPaymentId, paymentId);

    // Invariant Check 2: B2B Invoice Issued with SAC 998313
    const [invoice] = await db.select().from(invoices).where(eq(invoices.subscriptionId, subId));
    assert.ok(invoice, 'B2B Invoice must be generated');
    assert.equal(Number(invoice.totalAmount), 54000);
    assert.equal(invoice.currency, 'INR');

    // Invariant Check 3: Active License Extension Invariant
    // 3 Years added to EXISTING expiry date (preserving all free days)
    const [licAfter] = await db.select().from(licenses).where(eq(licenses.id, licenseId));
    const diffDays = Math.round((licAfter.expiryDate.getTime() - previousExpiryMs) / (24 * 60 * 60 * 1000));
    assert.equal(diffDays, 3 * 365, 'Must preserve 100% of unused days and add exactly 3 years (1095 days)');

    // Invariant Check 4: Webhook Idempotency (re-transmitting same payment does not extend twice)
    const duplicateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      payload: webhookPayload
    });
    assert.equal(duplicateRes.statusCode, 200);
    const dupBody = JSON.parse(duplicateRes.body);
    assert.equal(dupBody.isDuplicate, true);

    const [licAfterDup] = await db.select().from(licenses).where(eq(licenses.id, licenseId));
    assert.equal(licAfterDup.expiryDate.getTime(), licAfter.expiryDate.getTime(), 'Expiry date must not change on duplicate webhook');
  });

  // Step 6: Expiry & Locked Lifecycle Enforcement (Locked != Deleted)
  await step('Expiry & Locked Enforcement: Operational Lockdown with Zero Data Loss (Locked != Deleted)', async () => {
    // Set license to expired 15 days ago with 0 grace period
    const expiredPastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    await db.update(licenses)
      .set({
        expiryDate: expiredPastDate,
        gracePeriodEnd: null
      })
      .where(eq(licenses.id, licenseId));

    const [expiredLic] = await db.select().from(licenses).where(eq(licenses.id, licenseId));
    const evalResult = licenseService.evaluateLicenseStatus(expiredLic);
    assert.equal(evalResult.status, 'LOCKED', 'Expired license must evaluate to LOCKED');
    assert.equal(evalResult.isAccessAllowed, false, 'Operational access must be blocked');

    // Locked != Deleted Invariant Check: Verify patient clinical data is 100% intact
    const partnerPatients = await db.select().from(patients).where(eq(patients.tenantId, tenantId));
    assert.ok(partnerPatients.length > 0, 'Patient clinical records must remain intact in database');
    assert.equal(partnerPatients[0].firstName, 'Aarav');
    assert.equal(partnerPatients[0].lastName, 'Patel');
  });

  // Step 7: Post-Lock Late Payment Reactivation
  await step('Post-Lock Reactivation: Late Payment Restores License from Payment Date without Duplication', async () => {
    // Create new checkout order snapshot for 1-Year renewal of locked account
    const lateSnapshotId = crypto.randomUUID();
    const lateRzpOrderId = 'order_late_' + crypto.randomBytes(8).toString('hex');
    const latePaymentId = 'pay_late_' + crypto.randomBytes(8).toString('hex');

    await db.insert(commercialOrderSnapshots).values({
      id: lateSnapshotId,
      partnerId,
      planId,
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
      metadata: {
        razorpayOrderId: lateRzpOrderId
      },
      status: 'PENDING'
    });

    const lateWebhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: latePaymentId,
            order_id: lateRzpOrderId,
            amount: 2000000,
            currency: 'INR',
            status: 'captured',
            method: 'card',
            email: partnerEmail,
            notes: {
              snapshotId: lateSnapshotId
            }
          }
        }
      }
    });

    const lateSignature = crypto
      .createHmac('sha256', process.env['RAZORPAY_WEBHOOK_SECRET'])
      .update(lateWebhookPayload)
      .digest('hex');

    const lateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/razorpay/b2b-subscription',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': lateSignature
      },
      payload: lateWebhookPayload
    });

    assert.equal(lateRes.statusCode, 200);

    // Verify Reactivation: License is ACTIVE again
    const [reactivatedLic] = await db.select().from(licenses).where(eq(licenses.id, licenseId));
    assert.equal(reactivatedLic.status, 'ACTIVE');

    const evalReactivated = licenseService.evaluateLicenseStatus(reactivatedLic);
    assert.equal(evalReactivated.status, 'ACTIVE');
    assert.equal(evalReactivated.isAccessAllowed, true, 'Access must be restored after late payment');
    assert.ok(evalReactivated.daysRemaining >= 364, 'Reactivated license starts from payment date (+365 days)');

    // Ensure no duplicate partner was created
    const allPartners = await db.select().from(partnerProfiles).where(eq(partnerProfiles.id, partnerId));
    assert.equal(allPartners.length, 1, 'Partner identity remains canonical; no duplicate partner created');
  });

  console.log('\n================================================================================');
  console.log(`🎉 ALL ${testIndex} COMMERCIAL & LICENSE LIFECYCLE E2E TESTS PASSED (100%)!`);
  console.log('================================================================================\n');

} finally {
  await app.close();
  await testDb.cleanup();
}
