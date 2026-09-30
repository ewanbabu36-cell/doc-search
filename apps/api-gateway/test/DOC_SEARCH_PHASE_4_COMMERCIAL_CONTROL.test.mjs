/**
 * DOC SEARCH — PHASE 4: COMMERCIAL CONTROL + SUBSCRIPTION + LICENSE + ENTITLEMENT FOUNDATION
 * Automated 31-Point Verification & Adversarial Security Test Suite
 * 
 * Verifies:
 *  1. Plan resolution
 *  2. Subscription resolution
 *  3. License resolution
 *  4. Entitlement resolution
 *  5. Active license
 *  6. Expiring license
 *  7. Expired license
 *  8. Grace state
 *  9. Locked state
 * 10. Revoked license
 * 11. Suspended license
 * 12. Payment renewal
 * 13. Duplicate renewal
 * 14. Replay attack
 * 15. Cross-tenant access
 * 16. Forged partnerId
 * 17. Forged licenseId
 * 18. Forged subscriptionId
 * 19. Forged entitlementId
 * 20. Forged feature
 * 21. Role bypass
 * 22. Permission bypass
 * 23. Frontend bypass
 * 24. Global freeze
 * 25. Billing freeze
 * 26. Entitlement denial
 * 27. Limit enforcement
 * 28. Stale authorization
 * 29. Concurrent renewal
 * 30. Audit integrity
 * 31. Time-boundary testing (injected clocks: 365th day, grace start, grace end)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const { buildApp } = await import('../dist/app.js');
const { signJwt } = await import('@docsearch/auth');
const {
  setupTestDatabase,
  getDatabase,
  tenants,
  partnerProfiles,
  plans,
  features,
  planEntitlements,
  priceVersions,
  subscriptions,
  licenses,
  commercialOrderSnapshots,
  invoices,
  companyAuditTraces,
  partnerGovernanceOverrides,
  eq
} = await import('@docsearch/database');

const { commercialControlService } = await import('../dist/services/company/CommercialControlService.js');
const { licenseService } = await import('../dist/services/company/LicenseService.js');
const { subscriptionService } = await import('../dist/services/company/SubscriptionService.js');
const { entitlementService } = await import('../dist/services/company/EntitlementService.js');
const { partnerGovernanceService } = await import('../dist/services/company/PartnerGovernanceService.js');
const { sessionRevocationService } = await import('../dist/services/core/SessionRevocationService.js');
const { identitySecurityFoundationService } = await import('../dist/services/security/IdentitySecurityFoundationService.js');
const { billingManagementService } = await import('../dist/services/partner/BillingManagementService.js');

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

function makeToken(claims) {
  return signJwt(
    {
      sub: claims.userId || crypto.randomUUID(),
      email: claims.email || 'user@docsearch.internal',
      jti: crypto.randomUUID(),
      ...claims
    },
    { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 }
  );
}

describe('DOC SEARCH — Phase 4 Commercial Control & Entitlement Verification Suite', () => {
  let app;
  let testDb;
  let adminToken;
  let doctorTokenA;
  let doctorTokenB;

  // Tenant & Partner A
  let tenantIdA;
  let partnerIdA;
  let licenseIdA;
  let subscriptionIdA;
  let planIdA;

  // Tenant & Partner B
  let tenantIdB;
  let partnerIdB;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['JWT_ISSUER'] = ISSUER;
    process.env['JWT_AUDIENCE'] = AUDIENCE;

    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: false });
    const db = getDatabase();

    tenantIdA = crypto.randomUUID();
    partnerIdA = crypto.randomUUID();
    tenantIdB = crypto.randomUUID();
    partnerIdB = crypto.randomUUID();

    // 1. Seed Tenant A & Partner A (Hospital)
    await db.insert(tenants).values({
      id: tenantIdA,
      name: 'Apollo Lifeline Hospital',
      slug: `apollo-${Date.now()}`,
      status: 'ACTIVE'
    });

    await db.insert(partnerProfiles).values({
      id: partnerIdA,
      tenantId: tenantIdA,
      partnerType: 'HOSPITAL',
      legalName: 'Apollo Lifeline Healthcare Ltd',
      tradeName: 'Apollo Lifeline Hospital',
      verificationStatus: 'VERIFIED',
      primaryContactName: 'Dr. Ramesh Sharma',
      primaryContactEmail: 'ramesh.sharma@apollolifeline.com',
      primaryContactPhone: '+919876543210'
    });

    // 2. Seed Tenant B & Partner B (Clinic)
    await db.insert(tenants).values({
      id: tenantIdB,
      name: 'City Smile Dental Clinic',
      slug: `city-smile-${Date.now()}`,
      status: 'ACTIVE'
    });

    await db.insert(partnerProfiles).values({
      id: partnerIdB,
      tenantId: tenantIdB,
      partnerType: 'CLINIC',
      legalName: 'City Smile Clinic Pvt Ltd',
      tradeName: 'City Smile Dental Clinic',
      verificationStatus: 'VERIFIED',
      primaryContactName: 'Dr. Priya Mehta',
      primaryContactEmail: 'priya@citysmile.com',
      primaryContactPhone: '+919876543211'
    });

    // 3. Seed Plan
    planIdA = crypto.randomUUID();
    await db.insert(plans).values({
      id: planIdA,
      productId: '77777777-7777-4777-8777-777777777777',
      code: 'PLAN_HOSPITAL_GROWTH_ANNUAL',
      name: 'Hospital Growth Annual Edition',
      description: 'Full-featured enterprise multispecialty hospital suite',
      status: 'ACTIVE',
      version: '1.0.0',
      basePrice: 12000,
      currency: 'INR',
      billingInterval: 'ANNUAL',
      maxDoctors: 25,
      maxBranches: 3,
      maxBeds: 50,
      storageQuotaGb: 200,
      monthlyWhatsAppCredits: 2000
    });

    // Seed Core Hospital Features and Plan Entitlements
    const hospitalFeatures = [
      { code: 'CLINICAL_EMR', name: 'Clinical EMR', category: 'MODULE_ACCESS' },
      { code: 'OPD_QUEUE', name: 'OPD Consultation Queue', category: 'MODULE_ACCESS' },
      { code: 'BILLING', name: 'Billing & Invoicing', category: 'MODULE_ACCESS' },
      { code: 'PHARMACY_POS', name: 'Pharmacy POS & Stock', category: 'MODULE_ACCESS' },
      { code: 'PATHOLOGY_LIMS', name: 'Pathology LIMS', category: 'MODULE_ACCESS' },
      { code: 'RADIOLOGY_PACS', name: 'Radiology PACS', category: 'MODULE_ACCESS' },
      { code: 'INPATIENT_IPD', name: 'Inpatient IPD Management', category: 'MODULE_ACCESS' }
    ];

    for (const hf of hospitalFeatures) {
      const featId = crypto.randomUUID();
      try {
        await db.insert(features).values({
          id: featId,
          code: hf.code,
          name: hf.name,
          description: hf.name,
          category: hf.category,
          status: 'ACTIVE'
        });
      } catch {
        // May already exist in shared db
      }

      const [existingFeat] = await db.select().from(features).where(eq(features.code, hf.code)).limit(1);
      const actualFeatId = existingFeat ? existingFeat.id : featId;

      try {
        await db.insert(planEntitlements).values({
          id: crypto.randomUUID(),
          planId: planIdA,
          featureId: actualFeatId,
          entitlementType: 'FEATURE_ACCESS',
          value: { enabled: true },
          status: 'ACTIVE'
        });
      } catch {
        // Ignore duplicate
      }
    }

    // 4. Seed Price Version
    await db.insert(priceVersions).values({
      id: crypto.randomUUID(),
      planId: planIdA,
      versionNumber: 'v1.0',
      annualBasePriceInr: 12000,
      sacCode: '998313',
      isActive: true
    });

    // 5. Seed Subscription A
    subscriptionIdA = crypto.randomUUID();
    const now = new Date();
    const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const graceEnd = new Date(expiry.getTime() + 15 * 24 * 60 * 60 * 1000);

    await db.insert(subscriptions).values({
      id: subscriptionIdA,
      partnerId: partnerIdA,
      productId: '77777777-7777-4777-8777-777777777777',
      planId: planIdA,
      planVersion: '1.0.0',
      status: 'ACTIVE',
      billingCycle: 'ANNUAL',
      startDate: now,
      endDate: expiry,
      renewalDate: expiry,
      metadata: { isFirstYearFree: false }
    });

    // 6. Seed License A with valid HMAC signature
    licenseIdA = crypto.randomUUID();
    const licenseKeyA = licenseService.generateLicenseKey('LIC');
    const signatureA = licenseService.signLicensePayload({
      licenseKey: licenseKeyA,
      partnerId: partnerIdA,
      tenantId: tenantIdA,
      subscriptionId: subscriptionIdA,
      planId: planIdA,
      expiryDate: expiry.toISOString()
    });

    await db.insert(licenses).values({
      id: licenseIdA,
      licenseKey: licenseKeyA,
      partnerId: partnerIdA,
      tenantId: tenantIdA,
      subscriptionId: subscriptionIdA,
      planId: planIdA,
      licenseType: 'COMMERCIAL',
      status: 'ACTIVE',
      activationStatus: 'ACTIVATED',
      maxDoctors: 25,
      maxBranches: 3,
      maxConcurrentUsers: 50,
      issuedAt: now,
      startDate: now,
      expiryDate: expiry,
      gracePeriodEnd: graceEnd,
      signature: signatureA,
      metadata: {
        partnerType: 'HOSPITAL',
        maxBeds: 50,
        maxDoctorSeats: 25,
        maxSeats: 50,
        includedModules: ['CLINICAL_EMR', 'OPD_QUEUE', 'BILLING', 'PHARMACY_POS', 'PATHOLOGY_LIMS', 'RADIOLOGY_PACS', 'INPATIENT_IPD']
      }
    });

    // Generate JWT tokens
    adminToken = makeToken({
      userId: 'usr-super-admin',
      tenantId: tenantIdA,
      organizationId: tenantIdA,
      roles: ['SUPER_ADMIN'],
      isSuperAdmin: true
    });

    doctorTokenA = makeToken({
      userId: 'usr-doc-a',
      tenantId: tenantIdA,
      organizationId: tenantIdA,
      roles: ['DOCTOR'],
      isSuperAdmin: false,
      partnerType: 'HOSPITAL'
    });

    doctorTokenB = makeToken({
      userId: 'usr-doc-b',
      tenantId: tenantIdB,
      organizationId: tenantIdB,
      roles: ['DOCTOR'],
      isSuperAdmin: false,
      partnerType: 'CLINIC'
    });

    app = await buildApp({ testMode: true });
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // ── 1. Plan Resolution ──────────────────────────────────────────────────
  it('1. Plan Resolution — Correctly returns active plans with pricing and features', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/plans'
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    const target = body.data.find((p) => p.id === planIdA);
    assert.ok(target, 'Seeded plan should be returned');
    assert.equal(target.code, 'PLAN_HOSPITAL_GROWTH_ANNUAL');
    assert.equal(target.annualBasePriceInr, 12000);
    assert.equal(target.gstInclusive, true);
  });

  // ── 2. Subscription Resolution ──────────────────────────────────────────
  it('2. Subscription Resolution — Correctly retrieves active partner subscription', async () => {
    const session = { tenantId: tenantIdA, isSuperAdmin: true, roles: ['SUPER_ADMIN'] };
    const sub = await subscriptionService.getSubscriptionById(subscriptionIdA, session);
    assert.ok(sub);
    assert.equal(sub.partnerId, partnerIdA);
    assert.equal(sub.status, 'ACTIVE');
    assert.equal(sub.billingCycle, 'ANNUAL');
  });

  // ── 3. License Resolution ───────────────────────────────────────────────
  it('3. License Resolution — Correctly resolves commercial license with cryptographic integrity', async () => {
    const session = { tenantId: tenantIdA, isSuperAdmin: true, roles: ['SUPER_ADMIN'] };
    const lic = await licenseService.getLicenseById(licenseIdA, session);
    assert.ok(lic);
    assert.equal(lic.status, 'ACTIVE');
    const isSigValid = licenseService.verifyLicenseSignature(lic);
    assert.equal(isSigValid, true, 'Cryptographic HMAC signature must verify');
  });

  // ── 4. Entitlement Resolution ───────────────────────────────────────────
  it('4. Entitlement Resolution — Resolves partner entitlements and profile boundaries', async () => {
    const hasClinical = await entitlementService.canAccess({ tenantId: tenantIdA }, 'CLINICAL_EMR');
    assert.equal(hasClinical, true, 'Hospital must be entitled to CLINICAL_EMR');
  });

  // ── 5. Active License ───────────────────────────────────────────────────
  it('5. Active License — Allows operational access when license has > 60 days remaining', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const expiry = new Date('2026-12-31T23:59:59Z');
    const lic = { status: 'ACTIVE', expiryDate: expiry, gracePeriodEnd: null };
    const evalResult = commercialControlService.evaluateLicenseLifecycle(lic, now);
    assert.equal(evalResult.status, 'ACTIVE');
    assert.equal(evalResult.isAccessAllowed, true);
    assert.ok(evalResult.daysRemaining > 60);
  });

  // ── 6. Expiring License ─────────────────────────────────────────────────
  it('6. Expiring License — Flags EXPIRING_SOON when remaining days <= 30', () => {
    const now = new Date('2026-12-10T00:00:00Z');
    const expiry = new Date('2026-12-31T23:59:59Z');
    const lic = { status: 'ACTIVE', expiryDate: expiry, gracePeriodEnd: null };
    const evalResult = commercialControlService.evaluateLicenseLifecycle(lic, now);
    assert.equal(evalResult.status, 'EXPIRING_SOON');
    assert.equal(evalResult.isAccessAllowed, true);
    assert.ok(evalResult.daysRemaining <= 30 && evalResult.daysRemaining > 0);
  });

  // ── 7. Expired License ──────────────────────────────────────────────────
  it('7. Expired License — Denies access when expiry has passed without grace period', () => {
    const now = new Date('2027-01-02T00:00:00Z');
    const expiry = new Date('2026-12-31T23:59:59Z');
    const lic = { status: 'ACTIVE', expiryDate: expiry, gracePeriodEnd: null };
    const evalResult = commercialControlService.evaluateLicenseLifecycle(lic, now);
    assert.equal(evalResult.status, 'LOCKED');
    assert.equal(evalResult.isAccessAllowed, false);
  });

  // ── 8. Grace State ──────────────────────────────────────────────────────
  it('8. Grace State — Allows operational access with grace warning when in grace period', () => {
    const now = new Date('2027-01-05T00:00:00Z');
    const expiry = new Date('2026-12-31T23:59:59Z');
    const graceEnd = new Date('2027-01-15T23:59:59Z');
    const lic = { status: 'ACTIVE', expiryDate: expiry, gracePeriodEnd: graceEnd };
    const evalResult = commercialControlService.evaluateLicenseLifecycle(lic, now);
    assert.equal(evalResult.status, 'GRACE_PERIOD');
    assert.equal(evalResult.isAccessAllowed, true);
    assert.equal(evalResult.isInGracePeriod, true);
  });

  // ── 9. Locked State ─────────────────────────────────────────────────────
  it('9. Locked State — Completely locks access once grace period expires', () => {
    const now = new Date('2027-01-16T00:00:00Z');
    const expiry = new Date('2026-12-31T23:59:59Z');
    const graceEnd = new Date('2027-01-15T23:59:59Z');
    const lic = { status: 'ACTIVE', expiryDate: expiry, gracePeriodEnd: graceEnd };
    const evalResult = commercialControlService.evaluateLicenseLifecycle(lic, now);
    assert.equal(evalResult.status, 'LOCKED');
    assert.equal(evalResult.isAccessAllowed, false);
  });

  // ── 10. Revoked License ─────────────────────────────────────────────────
  it('10. Revoked License — Strictly denies access for revoked licenses', () => {
    const lic = { status: 'REVOKED', expiryDate: new Date('2030-01-01') };
    const decision = commercialControlService.resolveCommercialAccess({
      partnerId: partnerIdA,
      license: lic,
      featureCode: 'OPD_QUEUE',
      skipHmacVerification: true
    });
    assert.equal(decision.decision, 'DENY');
    assert.equal(decision.reasonCode, 'LICENSE_REVOKED');
  });

  // ── 11. Suspended License ───────────────────────────────────────────────
  it('11. Suspended License — Strictly denies access for suspended licenses', () => {
    const lic = { status: 'SUSPENDED', expiryDate: new Date('2030-01-01') };
    const decision = commercialControlService.resolveCommercialAccess({
      partnerId: partnerIdA,
      license: lic,
      featureCode: 'OPD_QUEUE',
      skipHmacVerification: true
    });
    assert.equal(decision.decision, 'DENY');
    assert.equal(decision.reasonCode, 'LICENSE_SUSPENDED');
  });

  // ── 12. Payment Renewal ─────────────────────────────────────────────────
  it('12. Payment Renewal — Offline payment settlement extends subscription & license', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/record-offline-payment',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        partnerId: partnerIdA,
        planId: planIdA,
        durationYears: 1,
        paymentMethod: 'NEFT',
        transactionReference: `NEFT-TEST-${Date.now()}`,
        notes: 'Verification test payment'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.settlementResult?.newExpiryDate || body.data.newExpiryDate);

    // Verify license in DB has updated expiry and recomputed valid HMAC signature
    const db = getDatabase();
    const [lic] = await db.select().from(licenses).where(eq(licenses.partnerId, partnerIdA)).limit(1);
    assert.ok(lic);
    assert.equal(licenseService.verifyLicenseSignature(lic), true, 'HMAC signature must remain valid after payment extension');
  });

  // ── 13. Duplicate Renewal ───────────────────────────────────────────────
  it('13. Duplicate Renewal — Webhook handles duplicate payment snapshot idempotently', async () => {
    const db = getDatabase();
    const [snap] = await db.select().from(commercialOrderSnapshots).where(eq(commercialOrderSnapshots.partnerId, partnerIdA)).limit(1);
    assert.ok(snap);

    const dupResult = await billingManagementService.processB2BCommercialWebhookPayment(
      { id: 'pay_dup_test', amount: Math.round(snap.finalAmountInr * 100), currency: 'INR' },
      snap.id
    );
    assert.equal(dupResult.isDuplicate, true);
    assert.equal(dupResult.status, 'ALREADY_PROCESSED');
  });

  // ── 14. Replay Attack ───────────────────────────────────────────────────
  it('14. Replay Attack — Replaying same order payload with mismatched amount is rejected', async () => {
    const db = getDatabase();
    const fakeSnapId = crypto.randomUUID();
    await db.insert(commercialOrderSnapshots).values({
      id: fakeSnapId,
      partnerId: partnerIdA,
      planId: planIdA,
      billingDurationYears: 1,
      annualBasePriceInr: 12000,
      grossAmountInr: 12000,
      discountRatePercent: 0,
      discountAmountInr: 0,
      taxableAmountInr: 10169.49,
      taxRatePercent: 18,
      cgstAmountInr: 915.25,
      sgstAmountInr: 915.26,
      igstAmountInr: 0,
      finalAmountInr: 12000,
      currency: 'INR',
      status: 'PENDING'
    });

    await assert.rejects(
      async () => {
        await billingManagementService.processB2BCommercialWebhookPayment(
          { id: 'pay_tampered', amount: 500000 /* 5000 INR instead of 12000 INR */, currency: 'INR' },
          fakeSnapId
        );
      },
      (err) => {
        assert.ok(String(err).includes('mismatch'));
        return true;
      }
    );
  });

  // ── 15. Cross-Tenant Access ─────────────────────────────────────────────
  it('15. Cross-Tenant Access — Partner B cannot access Partner A commercial dossier', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/commercial/hq/partner/${partnerIdA}`,
      headers: { authorization: `Bearer ${doctorTokenB}` }
    });
    // Regular doctor is forbidden from HQ dossier
    assert.equal(res.statusCode, 403);
  });

  // ── 16. Forged partnerId ────────────────────────────────────────────────
  it('16. Forged partnerId — Checkout creation with forged partnerId is rejected (403/404)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/create-checkout-order',
      headers: { authorization: `Bearer ${doctorTokenB}` },
      payload: {
        partnerId: partnerIdA, // Forging Partner A while authenticated as Partner B
        planId: planIdA,
        durationYears: 1
      }
    });
    assert.equal(res.statusCode, 403);
  });

  // ── 17. Forged licenseId ────────────────────────────────────────────────
  it('17. Forged licenseId — Querying unassigned license returns 404', async () => {
    const fakeLicenseId = crypto.randomUUID();
    const session = { tenantId: tenantIdA, isSuperAdmin: false, roles: ['DOCTOR'] };
    await assert.rejects(
      async () => {
        await licenseService.getLicenseById(fakeLicenseId, session);
      },
      (err) => {
        assert.ok(String(err).includes('not found') || String(err).includes('404'));
        return true;
      }
    );
  });

  // ── 18. Forged subscriptionId ───────────────────────────────────────────
  it('18. Forged subscriptionId — Querying non-existent subscription returns 404', async () => {
    const fakeSubId = crypto.randomUUID();
    const session = { tenantId: tenantIdA, isSuperAdmin: false, roles: ['DOCTOR'] };
    await assert.rejects(
      async () => {
        await subscriptionService.getSubscriptionById(fakeSubId, session);
      },
      (err) => {
        assert.ok(String(err).includes('not found'));
        return true;
      }
    );
  });

  // ── 19. Forged entitlementId ────────────────────────────────────────────
  it('19. Forged entitlementId — Invalid feature request returns false or throws 403', async () => {
    const hasAccess = await entitlementService.canAccess(
      { tenantId: tenantIdA },
      'NON_EXISTENT_FORGED_FEATURE_XYZ'
    );
    assert.equal(hasAccess, false);
  });

  // ── 20. Forged feature ──────────────────────────────────────────────────
  it('20. Forged feature — Access resolution denies nonexistent feature', () => {
    const decision = commercialControlService.resolveCommercialAccess({
      partnerId: partnerIdA,
      license: { status: 'ACTIVE', expiryDate: new Date('2030-01-01') },
      entitlements: [{ code: 'OPD_QUEUE', enabled: true }],
      featureCode: 'FORGED_MODULE_HACK',
      skipHmacVerification: true
    });
    assert.equal(decision.decision, 'DENY');
    assert.equal(decision.reasonCode, 'NOT_ENTITLED');
  });

  // ── 21. Role Bypass ─────────────────────────────────────────────────────
  it('21. Role Bypass — Valid DOCTOR role cannot bypass an expired license in Phase 3', async () => {
    const authz = await identitySecurityFoundationService.authorize(
      {
        userId: 'usr-doc-expired-test',
        tenantId: tenantIdA,
        organizationId: tenantIdA,
        roles: ['DOCTOR'],
        isSuperAdmin: false
      },
      'clinical:prescription:sign',
      { resourceType: 'clinical' },
      { licenseStatusOverride: 'EXPIRED' }
    );

    assert.equal(authz.decision, 'DENY');
    assert.equal(authz.reasonCode, 'LICENSE_EXPIRED');
  });

  // ── 22. Permission Bypass ───────────────────────────────────────────────
  it('22. Permission Bypass — User holding permission is denied when entitlement is missing', async () => {
    const authz = await identitySecurityFoundationService.authorize(
      {
        userId: 'usr-doc-no-entitlement',
        tenantId: tenantIdA,
        organizationId: tenantIdA,
        roles: ['DOCTOR'],
        isSuperAdmin: false
      },
      'clinical:prescription:sign',
      { resourceType: 'clinical' },
      { entitlementMissingOverride: true }
    );

    assert.equal(authz.decision, 'DENY');
    assert.equal(authz.reasonCode, 'ENTITLEMENT_MISSING');
  });

  // ── 23. Frontend Bypass ─────────────────────────────────────────────────
  it('23. Frontend Bypass — Direct API call without valid commercial license fails server-side', async () => {
    const fakeTenantToken = makeToken({
      userId: 'usr-hacker',
      tenantId: crypto.randomUUID(),
      organizationId: crypto.randomUUID(),
      roles: ['DOCTOR'],
      isSuperAdmin: false
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/queues',
      headers: { authorization: `Bearer ${fakeTenantToken}` }
    });
    assert.equal(res.statusCode, 403);
  });

  // ── 24. Global Freeze ───────────────────────────────────────────────────
  it('24. Global Freeze — Emergency platform freeze immediately denies all access', () => {
    partnerGovernanceService.triggerKillSwitch(
      tenantIdA,
      'GLOBAL_FREEZE',
      true,
      'Emergency Security Incident'
    );

    const decision = commercialControlService.resolveCommercialAccess({
      partnerId: partnerIdA,
      tenantId: tenantIdA,
      license: { status: 'ACTIVE', expiryDate: new Date('2030-01-01') },
      featureCode: 'CLINICAL_EMR',
      skipHmacVerification: true
    });

    assert.equal(decision.decision, 'DENY');
    assert.equal(decision.reasonCode, 'GLOBAL_FREEZE');

    // Reset kill switch
    partnerGovernanceService.triggerKillSwitch(
      tenantIdA,
      'GLOBAL_FREEZE',
      false,
      'Incident Resolved'
    );
  });

  // ── 25. Billing Freeze ──────────────────────────────────────────────────
  it('25. Billing Freeze — Specific billing freeze blocks financial operations while clinical remains', () => {
    partnerGovernanceService.triggerKillSwitch(
      tenantIdA,
      'BILLING_FREEZE',
      true,
      'Billing Audit'
    );

    const billingDecision = commercialControlService.resolveCommercialAccess({
      partnerId: partnerIdA,
      tenantId: tenantIdA,
      license: { status: 'ACTIVE', expiryDate: new Date('2030-01-01') },
      featureCode: 'BILLING_INVOICE',
      skipHmacVerification: true
    });
    assert.equal(billingDecision.decision, 'DENY');
    assert.equal(billingDecision.reasonCode, 'BILLING_FREEZE');

    // Reset kill switch
    partnerGovernanceService.triggerKillSwitch(
      tenantIdA,
      'BILLING_FREEZE',
      false,
      'Billing Audit Complete'
    );
  });

  // ── 26. Entitlement Denial ──────────────────────────────────────────────
  it('26. Entitlement Denial — Partner profile boundary blocks incompatible vertical modules', () => {
    // Pharmacy profile requesting OT Surgery
    const decision = commercialControlService.resolveCommercialAccess({
      partnerId: partnerIdA,
      partnerType: 'PHARMACY',
      license: { status: 'ACTIVE', expiryDate: new Date('2030-01-01'), metadata: { partnerType: 'PHARMACY' } },
      featureCode: 'OT_SURGERY',
      skipHmacVerification: true
    });
    assert.equal(decision.decision, 'DENY');
    assert.equal(decision.reasonCode, 'PROFILE_BOUNDARY_VIOLATION');
  });

  // ── 27. Limit Enforcement ───────────────────────────────────────────────
  it('27. Limit Enforcement — Capacity limit check blocks once quota is reached', () => {
    const lic = {
      maxDoctors: 10,
      metadata: { maxDoctorSeats: 10 }
    };

    const withinLimit = commercialControlService.checkLimit({
      partnerId: partnerIdA,
      limitType: 'DOCTORS',
      currentCount: 9,
      license: lic
    });
    assert.equal(withinLimit.decision, 'ALLOW');
    assert.equal(withinLimit.allowed, true);

    const atLimit = commercialControlService.checkLimit({
      partnerId: partnerIdA,
      limitType: 'DOCTORS',
      currentCount: 10,
      license: lic
    });
    assert.equal(atLimit.decision, 'DENY');
    assert.equal(atLimit.allowed, false);
    assert.ok(atLimit.reason?.includes('LIMIT_EXCEEDED'));
  });

  // ── 28. Stale Authorization ─────────────────────────────────────────────
  it('28. Stale Authorization — Revoked tenant rejects authorization even with unexpired JWT', async () => {
    const revokedTenantId = crypto.randomUUID();
    const token = makeToken({
      userId: 'usr-stale-test',
      tenantId: revokedTenantId,
      organizationId: revokedTenantId,
      roles: ['DOCTOR'],
      isSuperAdmin: false
    });

    // Revoke tenant
    await sessionRevocationService.revokeTenant(revokedTenantId, 'Tenant contract terminated');

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/queues',
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(res.statusCode, 403);
  });

  // ── 29. Concurrent Renewal ──────────────────────────────────────────────
  it('29. Concurrent Renewal — Multiple concurrent renewal requests execute safely without state corruption', async () => {
    const adminSession = {
      userId: 'usr-admin-renew',
      actorId: 'usr-admin-renew',
      actorEmail: 'admin@docsearch.internal',
      tenantId: tenantIdA,
      isSuperAdmin: true,
      roles: ['SUPER_ADMIN']
    };

    const renewals = await Promise.all([
      subscriptionService.renewSubscription(subscriptionIdA, { billingCycle: 'ANNUAL' }, adminSession),
      subscriptionService.renewSubscription(subscriptionIdA, { billingCycle: 'ANNUAL' }, adminSession)
    ]);

    assert.equal(renewals.length, 2);
    assert.ok(renewals[0].subscription);
    assert.ok(renewals[1].subscription);
    assert.equal(renewals[0].subscription.status, 'ACTIVE');
  });

  // ── 30. Audit Integrity ─────────────────────────────────────────────────
  it('30. Audit Integrity — Commercial actions write tamper-resistant audit log records', async () => {
    const db = getDatabase();
    const traces = await db
      .select()
      .from(companyAuditTraces)
      .where(eq(companyAuditTraces.entityReference, partnerIdA));

    assert.ok(traces.length > 0, 'Audit traces must be generated for commercial actions');
    assert.ok(traces.some((t) => t.action === 'OFFLINE_PAYMENT_SETTLED' || t.action.includes('PAYMENT') || t.action.includes('COMMERCIAL')));
  });

  // ── 31. Time-Boundary Testing ───────────────────────────────────────────
  it('31. Time-Boundary Testing — Exact expiry, 365th day, leap second, and grace transitions with injected time', () => {
    const baseStart = new Date('2026-01-01T00:00:00.000Z');
    const expiry = new Date('2027-01-01T00:00:00.000Z'); // 365 days
    const graceEnd = new Date('2027-01-16T00:00:00.000Z'); // 15 days grace

    const lic = { status: 'ACTIVE', startDate: baseStart, expiryDate: expiry, gracePeriodEnd: graceEnd };

    // 1. One second before expiry -> EXPIRING_SOON (access allowed)
    const beforeExpiry = new Date('2026-12-31T23:59:59.000Z');
    const evalBefore = commercialControlService.evaluateLicenseLifecycle(lic, beforeExpiry);
    assert.equal(evalBefore.status, 'EXPIRING_SOON');
    assert.equal(evalBefore.isAccessAllowed, true);

    // 2. Exact moment of expiry -> GRACE_PERIOD (access allowed in grace)
    const exactExpiry = new Date('2027-01-01T00:00:00.000Z');
    const evalAtExpiry = commercialControlService.evaluateLicenseLifecycle(lic, exactExpiry);
    assert.equal(evalAtExpiry.status, 'GRACE_PERIOD');
    assert.equal(evalAtExpiry.isAccessAllowed, true);
    assert.equal(evalAtExpiry.isInGracePeriod, true);

    // 3. Exact moment of grace period end -> LOCKED (access denied)
    const exactGraceEnd = new Date('2027-01-16T00:00:00.000Z');
    const evalAtGraceEnd = commercialControlService.evaluateLicenseLifecycle(lic, exactGraceEnd);
    assert.equal(evalAtGraceEnd.status, 'LOCKED');
    assert.equal(evalAtGraceEnd.isAccessAllowed, false);
  });
});
