/**
 * DOC SEARCH — HQ Commercial Pipeline, Plan Governance & Offline Settlement Test Suite
 * 
 * Verifies:
 * 1. GET /api/v1/commercial/hq/pipeline (Kanban metrics, Paid vs Unpaid filters, Partner Types)
 * 2. POST /api/v1/commercial/hq/plans (Plan & Price Version Creation)
 * 3. PUT /api/v1/commercial/hq/plans/:id (Plan update & Price Version bump for immutability)
 * 4. DELETE /api/v1/commercial/hq/plans/:id (Plan archival / soft delete)
 * 5. POST /api/v1/commercial/hq/extend-grace (Discretionary grace period extension)
 * 6. POST /api/v1/commercial/hq/record-offline-payment (NEFT/RTGS settlement, invoice & license extension)
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
  priceVersions,
  subscriptions,
  licenses,
  commercialOrderSnapshots,
  invoices,
  partnerClassifications,
  commercialOverrides,
  companyAuditTraces,
  eq
} = await import('@docsearch/database');

const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

describe('HQ Commercial Pipeline & Governance Controls Suite', () => {
  let app;
  let testDb;
  let adminToken;
  let partnerId;
  let tenantId;
  let clinicPlanId;
  let licenseId;
  let subId;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['JWT_ISSUER'] = ISSUER;
    process.env['JWT_AUDIENCE'] = AUDIENCE;

    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: false });
    const db = getDatabase();

    tenantId = crypto.randomUUID();
    partnerId = crypto.randomUUID();

    // Generate Company Admin Token
    adminToken = signJwt({
      sub: crypto.randomUUID(),
      email: 'founder@docsearch.health',
      tenantId: tenantId,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
      permissions: ['*'],
      isSuperAdmin: true,
      dataScope: 'global',
      iss: ISSUER,
      aud: AUDIENCE,
      jti: crypto.randomUUID()
    }, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });

    // Seed test partner (Solo Clinic)
    await db.insert(tenants).values({
      id: tenantId,
      name: 'Dr. Mehta Family Clinic',
      slug: 'mehta-clinic'
    });

    await db.insert(partnerProfiles).values({
      id: partnerId,
      tenantId,
      legalName: 'Mehta Healthcare LLP',
      tradeName: 'Dr. Mehta Family Clinic',
      partnerType: 'SOLO_CLINIC',
      primaryContactName: 'Dr. Suresh Mehta',
      primaryContactEmail: 'dr.mehta@clinic.test',
      primaryContactPhone: '+919876543210',
      verificationStatus: 'VERIFIED'
    });

    // Retrieve clinic plan
    const [foundClinicPlan] = await db.select().from(plans).where(eq(plans.code, 'PLAN_SOLO_CLINIC_ANNUAL')).limit(1);
    assert.ok(foundClinicPlan, 'Solo Clinic plan must exist in baseline database');
    clinicPlanId = foundClinicPlan.id;

    // Insert 365-day free subscription
    subId = crypto.randomUUID();
    const now = new Date();
    const expiry = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days remaining -> RENEWAL_WINDOW

    await db.insert(subscriptions).values({
      id: subId,
      partnerId,
      productId: '77777777-7777-4777-8777-777777777777',
      planId: clinicPlanId,
      planVersion: '1.0.0',
      billingCycle: 'PROMOTIONAL_FREE_1_YEAR',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 320 * 24 * 60 * 60 * 1000),
      endDate: expiry,
      renewalDate: expiry,
      metadata: { isFirstYearFree: true }
    });

    licenseId = crypto.randomUUID();
    await db.insert(licenses).values({
      id: licenseId,
      partnerId,
      tenantId,
      subscriptionId: subId,
      planId: clinicPlanId,
      licenseKey: 'DS-CLINIC-MEHTA-KEY',
      status: 'ACTIVE',
      signature: 'sig_test_mehta_clinic',
      startDate: new Date(now.getTime() - 320 * 24 * 60 * 60 * 1000),
      expiryDate: expiry
    });

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  it('1. GET /api/v1/commercial/hq/pipeline returns full pipeline with metrics and filters', async () => {
    // 1a: Fetch all
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/pipeline',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.ok(json.data.metrics);
    assert.ok(json.data.metrics.totalPartners >= 1);
    assert.ok(json.data.items.length >= 1);

    const mehtaItem = json.data.items.find((i) => i.partnerId === partnerId);
    assert.ok(mehtaItem, 'Mehta clinic must be present in pipeline');
    assert.equal(mehtaItem.partnerType, 'SOLO_CLINIC');
    assert.equal(mehtaItem.stage, 'RENEWAL_60D'); // 45 days remaining
    assert.equal(mehtaItem.paymentStatus, 'FREE_PERIOD');

    // 1b: Filter by partnerType = SOLO_CLINIC
    const resClinic = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/pipeline?partnerType=SOLO_CLINIC',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resClinic.statusCode, 200);
    const jsonClinic = JSON.parse(resClinic.body);
    assert.ok(jsonClinic.data.items.every((i) => i.partnerType === 'SOLO_CLINIC'));

    // 1c: Search filter
    const resSearch = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/pipeline?search=Mehta',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resSearch.statusCode, 200);
    const jsonSearch = JSON.parse(resSearch.body);
    assert.equal(jsonSearch.data.items.length, 1);
    assert.equal(jsonSearch.data.items[0].partnerId, partnerId);
  });

  it('2. POST /api/v1/commercial/hq/plans creates new plan and initial price version', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/plans',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        code: 'PLAN_SOLO_CLINIC_PLUS',
        name: 'Solo Doctor / OPD Clinic Plus',
        description: 'Enhanced solo clinic plan with integrated ABDM Gateway & AI Voice Rx',
        annualBasePriceInr: 8500,
        maxDoctors: 2,
        maxBranches: 1,
        sacCode: '998313'
      }
    });

    assert.equal(res.statusCode, 201);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.equal(json.data.code, 'PLAN_SOLO_CLINIC_PLUS');
    assert.equal(json.data.annualBasePriceInr, 8500);

    const db = getDatabase();
    const createdPvs = await db.select().from(priceVersions).where(eq(priceVersions.planId, json.data.planId));
    assert.equal(createdPvs.length, 1);
    assert.equal(createdPvs[0].annualBasePriceInr, 8500);
    assert.equal(createdPvs[0].isActive, true);
  });

  it('3. PUT /api/v1/commercial/hq/plans/:id updates pricing and creates immutable new price version', async () => {
    const db = getDatabase();
    const [planToUpdate] = await db.select().from(plans).where(eq(plans.code, 'PLAN_SOLO_CLINIC_PLUS')).limit(1);
    assert.ok(planToUpdate);

    // Update annualBasePriceInr to ₹9,000
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/commercial/hq/plans/${planToUpdate.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Solo Doctor / OPD Clinic Pro Edition',
        annualBasePriceInr: 9000
      }
    });

    assert.equal(res.statusCode, 200);

    // Verify database immutability: old price version is isActive=false, new price version exists with 9000
    const pvs = await db.select().from(priceVersions).where(eq(priceVersions.planId, planToUpdate.id));
    assert.equal(pvs.length, 2, 'Must retain old price version and create new price version');

    const activePv = pvs.find((v) => v.isActive === true);
    const inactivePv = pvs.find((v) => v.isActive === false);
    assert.ok(activePv);
    assert.ok(inactivePv);
    assert.equal(activePv.annualBasePriceInr, 9000);
    assert.equal(inactivePv.annualBasePriceInr, 8500);
  });

  it('4. DELETE /api/v1/commercial/hq/plans/:id archives plan preserving historical integrity', async () => {
    const db = getDatabase();
    const [planToArchive] = await db.select().from(plans).where(eq(plans.code, 'PLAN_SOLO_CLINIC_PLUS')).limit(1);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/commercial/hq/plans/${planToArchive.id}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.statusCode, 200);

    const [archivedPlan] = await db.select().from(plans).where(eq(plans.id, planToArchive.id)).limit(1);
    assert.equal(archivedPlan.status, 'ARCHIVED');
  });

  it('5. POST /api/v1/commercial/hq/extend-grace extends partner grace period', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/extend-grace',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        partnerId,
        additionalDays: 14,
        reason: 'Authorized 14-day bank clearance buffer'
      }
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.ok(json.data.gracePeriodEnd);

    const db = getDatabase();
    const [lic] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
    assert.ok(lic.gracePeriodEnd);
    assert.equal(lic.metadata?.lastGraceExtension?.additionalDays, 14);
  });

  it('6. POST /api/v1/commercial/hq/record-offline-payment settles NEFT payment, extends license & issues B2B invoice', async () => {
    const db = getDatabase();
    const [licBefore] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
    const previousExpiryMs = licBefore.expiryDate.getTime();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/record-offline-payment',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        partnerId,
        planId: clinicPlanId,
        durationYears: 2, // 2 Years tenure commitment (2% approved discount: ₹11,760)
        paymentMethod: 'NEFT',
        transactionReference: 'HDFC_NEFT_20260923_998877',
        customerBillingAddress: 'Mehta Clinic, Andheri West, Mumbai, Maharashtra',
        isInterstate: false,
        notes: 'Direct corporate NEFT received and verified with HDFC statement'
      }
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.equal(json.data.amountPaid, 11760); // ₹12,000 - 2%

    // Verify Active Extension Invariant: 2 Years (730 days) added to existing expiry
    const [licAfter] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
    const diffDays = Math.round((licAfter.expiryDate.getTime() - previousExpiryMs) / (24 * 60 * 60 * 1000));
    assert.equal(diffDays, 730, 'Must preserve remaining days and add exactly 730 days (2 years)');

    // Verify B2B tax invoice generated in company.invoices
    const partnerInvoices = await db.select().from(invoices).where(eq(invoices.subscriptionId, subId));
    assert.ok(partnerInvoices.length >= 1);
    assert.equal(Number(partnerInvoices[0].totalAmount), 11760);

    // Verify pipeline now reflects PAID status
    const pipelineRes = await app.inject({
      method: 'GET',
      url: `/api/v1/commercial/hq/pipeline?search=Mehta`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pipelineJson = JSON.parse(pipelineRes.body);
    assert.equal(pipelineJson.data.items[0].paymentStatus, 'PAID');
    assert.equal(pipelineJson.data.items[0].stage, 'RENEWED');
  });

  it('7. GET /api/v1/commercial/hq/partner/:id returns comprehensive 360 commercial dossier (7 Sections)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/commercial/hq/partner/${partnerId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    const d = json.data;

    // Verify 7 Sections
    assert.ok(d.partner, 'Section 1: Partner Identity must exist');
    assert.equal(d.partner.legalName, 'Mehta Healthcare LLP');
    assert.equal(d.partner.verificationStatus, 'VERIFIED');

    assert.ok(d.commercial, 'Section 2: Commercial & GST must exist');
    assert.equal(d.commercial.plan.code, 'PLAN_SOLO_CLINIC_ANNUAL');
    assert.ok(d.commercial.priceVersion);
    assert.equal(d.commercial.priceVersion.annualBasePriceInr, 6000);

    assert.ok(d.license, 'Section 3: License & Days Remaining must exist');
    assert.equal(d.license.status, 'ACTIVE');
    assert.ok(d.license.daysRemaining > 700);

    assert.ok(Array.isArray(d.payments), 'Section 4: Payments history must exist');
    assert.ok(d.payments.length >= 1);
    assert.equal(d.payments[0].status, 'PAID');

    assert.ok(Array.isArray(d.invoices), 'Section 5: Invoices history must exist');
    assert.ok(d.invoices.length >= 1);

    assert.ok(Array.isArray(d.entitlements), 'Section 6: Entitlements & Features must exist');

    assert.ok(Array.isArray(d.auditLogs), 'Section 7: Commercial Audit Traces must exist');
    assert.ok(d.auditLogs.length >= 1, 'Must include audit trace from offline settlement');
  });

  it('8. Partner Classifications Catalog Endpoints (GET, POST, PUT, DELETE)', async () => {
    // 8a: GET partner-types
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/partner-types',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(getRes.statusCode, 200);
    const getJson = JSON.parse(getRes.body);
    assert.ok(Array.isArray(getJson.data));

    // 8b: POST partner-types
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/partner-types',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        code: 'AYUSH_WELLNESS',
        label: 'AYUSH Integrative Wellness Center',
        description: 'Ayurveda, Yoga, Unani, Siddha, Homeopathy clinical center',
        category: 'HEALTHCARE_PROVIDER',
        icon: '🌿',
        defaultPlanCode: 'PLAN_SOLO_CLINIC_ANNUAL',
        sortOrder: 10
      }
    });
    assert.equal(postRes.statusCode, 201);
    const postJson = JSON.parse(postRes.body);
    assert.equal(postJson.data.code, 'AYUSH_WELLNESS');
    const newTypeId = postJson.data.id;

    // 8c: PUT partner-types/:id
    const putRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/commercial/hq/partner-types/${newTypeId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        label: 'AYUSH Holistic Wellness Pavilion'
      }
    });
    assert.equal(putRes.statusCode, 200);

    // 8d: DELETE partner-types/:id (Soft-deactivate)
    const delRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/commercial/hq/partner-types/${newTypeId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(delRes.statusCode, 200);

    const db = getDatabase();
    const [archivedType] = await db.select().from(partnerClassifications).where(eq(partnerClassifications.id, newTypeId)).limit(1);
    assert.equal(archivedType.status, 'INACTIVE');
  });

  it('9. Commercial Negotiated Overrides Endpoints (GET, POST, DELETE)', async () => {
    // 9a: POST override
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/hq/overrides',
      headers: { Authorization: `Bearer ${adminToken}` },
      payload: {
        partnerId,
        planId: clinicPlanId,
        overrideType: 'FIXED_PRICE',
        overrideValue: 5000,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Special institutional pilot rate approved by VP Sales',
        approvedBy: 'Director of Healthcare Partnerships'
      }
    });
    assert.equal(postRes.statusCode, 201);
    const postJson = JSON.parse(postRes.body);
    const overrideId = postJson.data.id;

    // 9b: GET overrides
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/overrides',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(getRes.statusCode, 200);
    const getJson = JSON.parse(getRes.body);
    assert.ok(getJson.data.some((o) => o.id === overrideId));

    // 9c: DELETE override (Revoke)
    const delRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/commercial/hq/overrides/${overrideId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(delRes.statusCode, 200);

    const db = getDatabase();
    const [revoked] = await db.select().from(commercialOverrides).where(eq(commercialOverrides.id, overrideId)).limit(1);
    assert.equal(revoked.status, 'REVOKED');
  });

  it('10. Compound Presets & Server-Side Filtering (Who Paid / Who Did Not Pay)', async () => {
    // 10a: Compound filter CURRENTLY_PAID
    const resPaid = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/pipeline?compoundFilter=CURRENTLY_PAID',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resPaid.statusCode, 200);
    const jsonPaid = JSON.parse(resPaid.body);
    assert.ok(jsonPaid.data.items.length >= 1);
    assert.ok(jsonPaid.data.items.every((i) => i.paymentStatus === 'PAID'));

    // 10b: 9-card summary metric integrity
    const m = jsonPaid.data.metrics;
    assert.ok(typeof m.totalPartners === 'number');
    assert.ok(typeof m.totalPaid === 'number');
    assert.ok(typeof m.totalNeverPaid === 'number');
    assert.ok(typeof m.totalRevenueInr === 'number');
    assert.ok(m.totalRevenueInr >= 11760);

    // 10c: Audit Trail Synchronization
    const db = getDatabase();
    const traces = await db.select().from(companyAuditTraces);
    assert.ok(traces.length >= 4, 'Must synchronize traces for offline payment, plan CRUD, and overrides');
    const actions = traces.map((t) => t.action);
    assert.ok(actions.includes('OFFLINE_PAYMENT_SETTLED'));
    assert.ok(actions.includes('COMMERCIAL_OVERRIDE_CREATED'));
    assert.ok(actions.includes('COMMERCIAL_OVERRIDE_REVOKED'));
  });

  it('11. Zero-State Verification: filtering for non-existent partner returns zero records without mock fallback', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/hq/pipeline?search=NonExistentEntity99999',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.data.items.length, 0, 'Must produce empty array with zero mock records');
    assert.equal(json.data.metrics.filteredCount, 0);
  });
});
