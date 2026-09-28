import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  partnerOnboardingStagedRegistrations,
  licenses,
  subscriptions,
  eq
} from '@docsearch/database';
import {
  partnerOnboardingRepository,
  toDeterministicUuid
} from '../dist/repositories/company/PartnerOnboardingRepository.js';

describe('DOC SEARCH — Universal Partner Onboarding + Plan Selection + HQ Approval + Profile Access + License + Entitlement Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const SUPER_ADMIN_ID = '00000000-0000-4000-8000-000000000001';
  const COMPANY_ADMIN_ID = '00000000-0000-4000-8000-000000000002';

  function createToken(userId, email, roles, tenantId = TEST_SEEDS.TENANT_A, permissions = ['*']) {
    const claims = {
      sub: userId,
      email,
      tenantId,
      branchId: TEST_SEEDS.BRANCH_A,
      roles,
      permissions,
      dataScope: roles.includes('SUPER_ADMIN') || roles.includes('COMPANY_ADMIN') ? 'global' : 'tenant',
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, {
      secret: MASTER_SECRET,
      expiresInSeconds: 7200,
      issuer: ISSUER,
      audience: AUDIENCE
    });
  }

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'test';

    const dbInstance = await setupTestDatabase({ seedBaseline: true });
    testDb = dbInstance.db;

    await partnerOnboardingRepository.seedBaselinePartnersIfEmpty(testDb);

    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // ============================================================================
  // 1. MULTI-CATEGORY SELF-REGISTRATION WITH 1-YEAR FREE PLAN (₹0 / 365 DAYS)
  // ============================================================================
  const registeredPartners = {};

  describe('1. Multi-Category Self-Registration & Plan Persistence', () => {
    const categories = [
      { type: 'PATHOLOGY', name: 'Metro NABL Pathology Labs', email: 'lab.director@metronabl.com', planId: 'plan-path-free-yr1' },
      { type: 'PHARMACY', name: 'Apollo Life Care Chemist', email: 'chemist@apollolifecare.com', planId: 'plan-pharma-free-yr1' },
      { type: 'CLINIC', name: 'Sunrise Heart & Diabetes Clinic', email: 'dr.sharma@sunriseclinic.com', planId: 'plan-clinic-free-yr1' },
      { type: 'HOSPITAL', name: 'City Care Super Specialty Hospital', email: 'ceo@citycarehospital.com', planId: 'plan-hosp-free-yr1' },
      { type: 'DIAGNOSTIC_CENTRE', name: 'Precision MRI & CT Diagnostics', email: 'rad@precisionmri.com', planId: 'plan-radio-free-yr1' }
    ];

    for (const cat of categories) {
      it(`1.${cat.type}: Self-registers ${cat.type} with canonical 1-Year Free Plan (₹0, 365 days) and stages as PENDING`, async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/auth/self-register',
          payload: {
            partner: {
              facilityName: cat.name,
              organizationType: cat.type,
              email: cat.email,
              phone: '+91 98765 43210',
              name: `Director ${cat.type}`,
              city: 'Patna, Bihar',
              licenseNumber: `BR-${cat.type.slice(0, 4)}-2026-101`,
              ownerAadhaarNumber: '8877 6655 4433',
              requestedPlan: {
                id: cat.planId,
                tier: 'FOUNDING',
                price: 0,
                monthlyFee: 0,
                durationDays: 365,
                billingInterval: 'ANNUAL',
                isFree: true
              }
            },
            verificationItem: {
              partnerName: cat.name,
              partnerType: cat.type,
              documentName: `${cat.type.toLowerCase()}_license.pdf`,
              documentType: 'Clinical Establishment Certificate',
              details: {
                'Facility Name': cat.name,
                'Registered Email': cat.email,
                'Phone / Mobile': '+91 98765 43210'
              }
            }
          }
        });

        assert.equal(res.statusCode, 201, `Expected 201 for ${cat.type}`);
        const body = JSON.parse(res.body);
        assert.equal(body.success, true);
        assert.ok(body.dbId, 'Must return PostgreSQL UUID');

        registeredPartners[cat.type] = { dbId: body.dbId, email: cat.email, name: cat.name };

        const [row] = await testDb
          .select()
          .from(partnerOnboardingStagedRegistrations)
          .where(eq(partnerOnboardingStagedRegistrations.id, body.dbId));

        assert.ok(row, 'Row must exist in partner_onboarding_staged_registrations');
        assert.equal(row.status, 'PENDING', 'Must NOT auto-approve on self-registration');
        assert.equal(row.organizationType, cat.type);

        const payload = row.registrationPayload;
        assert.ok(payload.requestedPlan, 'requestedPlan must be persisted');
        assert.equal(payload.requestedPlan.price, 0, '1-Year Free Plan price must be ₹0');
        assert.equal(payload.requestedPlan.monthlyFee, 0, '1-Year Free Plan monthlyFee must be ₹0');
        assert.equal(payload.requestedPlan.durationDays, 365, 'Duration must be 365 days');
        assert.equal(payload.requestedPlan.isFree, true);
        assert.ok(Array.isArray(payload.requestedPlan.features) && payload.requestedPlan.features.length > 0, 'Features must be populated');
      });
    }
  });

  // ============================================================================
  // 2. HQ VERIFICATION QUEUE VISIBILITY & PLAN FIDELITY
  // ============================================================================
  describe('2. HQ Verification Queue Visibility & Zero Distortion', () => {
    it('2.1 HQ Verification Queue returns complete partner profile, category, and ₹0/365d requestedPlan', async () => {
      const adminToken = createToken(SUPER_ADMIN_ID, 'founder@docsearch.health', ['SUPER_ADMIN']);
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/verification-queue',
        headers: { authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));

      const pharmaItem = body.data.find((item) => item.dbId === registeredPartners['PHARMACY'].dbId);
      assert.ok(pharmaItem, 'Pharmacy registration must appear in HQ verification queue');
      assert.equal(pharmaItem.partnerName, 'Apollo Life Care Chemist');
      assert.equal(pharmaItem.partnerType, 'PHARMACY');
      assert.ok(
        pharmaItem.status === 'PENDING_APPROVAL' || pharmaItem.status === 'PENDING',
        `Expected PENDING_APPROVAL or PENDING, got ${pharmaItem.status}`
      );
      assert.ok(pharmaItem.requestedPlan, 'requestedPlan must be visible to HQ');
      assert.equal(pharmaItem.requestedPlan.price, 0, 'Must display ₹0 and never coerce to ₹4999');
      assert.equal(pharmaItem.requestedPlan.monthlyFee, 0, 'monthlyFee must be ₹0');
      assert.equal(pharmaItem.requestedPlan.durationDays, 365, 'Duration must be 365 days');
    });
  });

  // ============================================================================
  // 3. HQ APPROVAL -> SUBSCRIPTION + LICENSE + ENTITLEMENT ACTIVATION
  // ============================================================================
  describe('3. HQ Approval -> Commercial Subscription, License & Entitlement Provisioning', () => {
    it('3.1 HQ approves Pharmacy with requested 1-Year Free Plan -> provisions active subscription and 365-day license', async () => {
      const adminToken = createToken(SUPER_ADMIN_ID, 'founder@docsearch.health', ['SUPER_ADMIN']);
      const targetId = registeredPartners['PHARMACY'].dbId;

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/auth/verification-queue/${targetId}/approve`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          email: registeredPartners['PHARMACY'].email,
          partnerName: registeredPartners['PHARMACY'].name,
          organizationType: 'PHARMACY'
        }
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'APPROVED');
      assert.equal(body.data.monthlyFee, 0);
      assert.equal(body.data.paymentStatus, 'PAID');

      const tenantId = toDeterministicUuid(`tenant-${registeredPartners['PHARMACY'].email.toLowerCase().trim()}`);
      const partnerId = toDeterministicUuid(targetId);
      const allLics = await testDb.select().from(licenses);
      const lic = allLics.find((l) => l.tenantId === tenantId || l.partnerId === partnerId);
      assert.ok(lic, 'Commercial software license must be provisioned in company.licenses');
      assert.equal(lic.status, 'ACTIVE');
      assert.equal(lic.activationStatus, 'ACTIVATED');
      assert.equal(lic.planId, toDeterministicUuid('plan-pharma-free-yr1'));

      const daysDiff = Math.round((new Date(lic.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
      assert.ok(daysDiff >= 364 && daysDiff <= 366, `License expiry must be ~365 days (got ${daysDiff})`);
    });

    it('3.2 Dual-Control: HQ modifies plan terms during approval -> originalRequestedPlan is preserved in history', async () => {
      const adminToken = createToken(SUPER_ADMIN_ID, 'founder@docsearch.health', ['SUPER_ADMIN']);
      const targetId = registeredPartners['CLINIC'].dbId;

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/auth/verification-queue/${targetId}/approve`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          email: registeredPartners['CLINIC'].email,
          partnerName: registeredPartners['CLINIC'].name,
          organizationType: 'CLINIC',
          assignedPlan: {
            id: 'plan-clinic-annual-yr2',
            code: 'PLAN_CLINIC_ANNUAL_YR2',
            tier: 'ANNUAL',
            planName: 'Doctor OPD Clinic Annual Plan',
            price: 20000,
            monthlyFee: 20000,
            finalAmount: 18000,
            discountPercent: 10,
            founderNotes: 'Upgraded to Annual Paid Plan with 10% institutional discount'
          }
        }
      });

      assert.equal(res.statusCode, 200);

      const [row] = await testDb
        .select()
        .from(partnerOnboardingStagedRegistrations)
        .where(eq(partnerOnboardingStagedRegistrations.id, targetId));

      const payload = row.registrationPayload;
      assert.equal(payload.isModifiedByHq, true, 'isModifiedByHq flag must be true');
      assert.ok(payload.originalRequestedPlan, 'originalRequestedPlan must be preserved');
      assert.equal(payload.originalRequestedPlan.price, 0, 'Original requested ₹0 free plan must never be overwritten');
      assert.equal(payload.assignedPlan.price, 20000, 'Assigned plan reflects HQ modification');
      assert.equal(payload.finalAmount, 18000);
    });
  });

  // ============================================================================
  // 4. HQ REJECTION & MAKER-CHECKER SEPARATION OF DUTIES
  // ============================================================================
  describe('4. HQ Rejection & Maker-Checker Enforcement', () => {
    it('4.1 Submitter cannot approve their own registration (Maker-Checker 403 FORBIDDEN)', async () => {
      const targetId = registeredPartners['DIAGNOSTIC_CENTRE'].dbId;
      const applicantEmail = registeredPartners['DIAGNOSTIC_CENTRE'].email;
      const selfApproverToken = createToken(targetId, applicantEmail, ['COMPANY_ADMIN']);

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/auth/verification-queue/${targetId}/approve`,
        headers: { authorization: `Bearer ${selfApproverToken}` },
        payload: {}
      });

      assert.equal(res.statusCode, 403, 'Maker-Checker guard must block self-approval');
    });

    it('4.2 HQ rejects registration -> status becomes REJECTED and cannot be subsequently approved', async () => {
      const adminToken = createToken(SUPER_ADMIN_ID, 'founder@docsearch.health', ['SUPER_ADMIN']);
      const targetId = registeredPartners['DIAGNOSTIC_CENTRE'].dbId;

      const rejectRes = await app.inject({
        method: 'POST',
        url: `/api/v1/auth/verification-queue/${targetId}/reject`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          rejectionReason: 'Uploaded AERB certificate is illegible; please re-register with clear scan.'
        }
      });

      assert.equal(rejectRes.statusCode, 200);

      const approveAfterReject = await app.inject({
        method: 'POST',
        url: `/api/v1/auth/verification-queue/${targetId}/approve`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {}
      });

      assert.equal(approveAfterReject.statusCode, 409, 'Rejected registration must block subsequent approval');
    });
  });

  // ============================================================================
  // 5. PARTNER PROFILE ACCESS PROTECTION UNDER ALL LICENSE STATES
  // ============================================================================
  describe('5. Partner Profile Access Guarantee (Never Blocked by License/Plan State)', () => {
    it('5.1 Partner can view and update their profile even when license is EXPIRED or SUSPENDED', async () => {
      const pharmaEmail = registeredPartners['PHARMACY'].email;
      const tenantId = toDeterministicUuid(`tenant-${pharmaEmail.toLowerCase().trim()}`);
      const partnerToken = createToken(
        '00000000-0000-4000-8000-000000000099',
        pharmaEmail,
        ['PHARMACIST', 'HOSPITAL_ADMIN'],
        tenantId,
        ['pharmacy:view']
      );

      // Suspend the license in PostgreSQL
      await testDb
        .update(licenses)
        .set({ status: 'SUSPENDED', expiryDate: new Date(Date.now() - 86400000) })
        .where(eq(licenses.tenantId, tenantId));

      // 1. Profile read via GET /api/v1/partner/profile must SUCCEED (200 OK)
      const getProfileRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/profile',
        headers: { authorization: `Bearer ${partnerToken}` }
      });
      assert.equal(getProfileRes.statusCode, 200, 'Partner profile GET must never be blocked by suspended license');
      const profileJson = JSON.parse(getProfileRes.body);
      assert.equal(profileJson.success, true);
      assert.equal(profileJson.data.tenantId, tenantId);

      // 2. Plan & features read via GET /api/v1/partner/account/plan-and-features must SUCCEED (200 OK)
      const getPlanRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/account/plan-and-features',
        headers: { authorization: `Bearer ${partnerToken}` }
      });
      assert.equal(getPlanRes.statusCode, 200, 'Plan & features overview must remain accessible so partner can renew');

      // 3. Profile edit via PUT /api/v1/partner/profile must SUCCEED (200 OK)
      const putProfileRes = await app.inject({
        method: 'PUT',
        url: '/api/v1/partner/profile',
        headers: { authorization: `Bearer ${partnerToken}` },
        payload: {
          legalName: 'Apollo Life Care Chemist Pvt Ltd',
          phone: '+91 98765 00000',
          address: {
            line1: 'Frazer Road',
            city: 'Patna',
            state: 'Bihar',
            pincode: '800001'
          },
          statutory: {
            pharmacyCouncilRegNo: 'BR-PHARM-2026-8899'
          }
        }
      });
      assert.equal(putProfileRes.statusCode, 200, 'Partner profile PUT must never be blocked by suspended/expired license');
      const putJson = JSON.parse(putProfileRes.body);
      assert.equal(putJson.success, true);
      assert.equal(putJson.data.isProfileCompleted, true);
    });

    it('5.2 Pending partner (before HQ approval) sees requestedPlan populated, approvedPlan=null, activePlan=null, and null license dates', async () => {
      const pathEmail = registeredPartners['PATHOLOGY'].email;
      const pathTenantId = toDeterministicUuid(`tenant-${pathEmail.toLowerCase().trim()}`);
      const pendingPartnerToken = createToken(
        '00000000-0000-4000-8000-000000000088',
        pathEmail,
        ['PATHOLOGIST'],
        pathTenantId,
        ['pathology:view']
      );

      const getPlanRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/account/plan-and-features',
        headers: { authorization: `Bearer ${pendingPartnerToken}` }
      });
      assert.equal(getPlanRes.statusCode, 200);
      const planBody = JSON.parse(getPlanRes.body);
      assert.equal(planBody.success, true);
      assert.ok(planBody.data.requestedPlan, 'requestedPlan must be populated for pending partner');
      assert.equal(planBody.data.requestedPlan.monthlyFee, 0);
      assert.equal(planBody.data.approvedPlan, null, 'approvedPlan must be null before HQ approval');
      assert.equal(planBody.data.activePlan, null, 'activePlan must be null before HQ approval');
      assert.equal(planBody.data.subscription.status, 'PENDING_HQ_REVIEW');
      assert.equal(planBody.data.subscription.isAccessAllowed, false);
      assert.equal(planBody.data.subscription.startDate, null, 'startDate must be null before HQ approval');
      assert.equal(planBody.data.subscription.expiryDate, null, 'expiryDate must be null before HQ approval');
      assert.equal(planBody.data.subscription.daysRemaining, null, 'daysRemaining must be null before HQ approval');
      assert.equal(planBody.data.subscription.planTermDays, 365, 'planTermDays shows 365-day requested term without fake expiry date');
    });

    it('5.3 Field-Level Security: Partner cannot modify HQ-controlled commercial/license/approval fields via PUT /api/v1/partner/profile (403 FORBIDDEN)', async () => {
      const pharmaEmail = registeredPartners['PHARMACY'].email;
      const tenantId = toDeterministicUuid(`tenant-${pharmaEmail.toLowerCase().trim()}`);
      const partnerToken = createToken(
        '00000000-0000-4000-8000-000000000099',
        pharmaEmail,
        ['PHARMACIST', 'HOSPITAL_ADMIN'],
        tenantId,
        ['pharmacy:view']
      );

      const tamperRes = await app.inject({
        method: 'PUT',
        url: '/api/v1/partner/profile',
        headers: { authorization: `Bearer ${partnerToken}` },
        payload: {
          legalName: 'Apollo Tampered Chemist',
          licenseStatus: 'ACTIVE',
          approvalStatus: 'APPROVED',
          activePlan: { tier: 'ENTERPRISE', monthlyFee: 0 }
        }
      });
      assert.equal(tamperRes.statusCode, 403, 'Attempting to tamper with HQ-controlled commercial fields must be rejected with 403 FORBIDDEN');
    });

    it('5.4 Role-Based Profile Guard: Non-admin staff (RECEPTIONIST) can view profile (200 OK) but cannot overwrite facility profile (403 FORBIDDEN)', async () => {
      const pharmaEmail = registeredPartners['PHARMACY'].email;
      const tenantId = toDeterministicUuid(`tenant-${pharmaEmail.toLowerCase().trim()}`);
      const receptionistToken = createToken(
        '00000000-0000-4000-8000-000000000077',
        'reception@apollolifecare.com',
        ['RECEPTIONIST'],
        tenantId,
        ['patients:view']
      );

      const viewRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/profile',
        headers: { authorization: `Bearer ${receptionistToken}` }
      });
      assert.equal(viewRes.statusCode, 200, 'RECEPTIONIST must be allowed to view facility profile');

      const editRes = await app.inject({
        method: 'PUT',
        url: '/api/v1/partner/profile',
        headers: { authorization: `Bearer ${receptionistToken}` },
        payload: {
          legalName: 'Unauthorized Receptionist Edit'
        }
      });
      assert.equal(editRes.statusCode, 403, 'RECEPTIONIST must be blocked from overwriting facility profile');
    });
  });

  // ============================================================================
  // 6. P0-COM-01 OPERATIONAL COMMERCIAL LOCKOUT (PENDING / REJECTED / EXPIRED / SUSPENDED / ACTIVE)
  // ============================================================================
  describe('6. P0-COM-01 Operational API Commercial Lockout & Canonical Fail-Closed Verification', () => {
    const operationalEndpoints = [
      { name: 'Pharmacy Overview', url: '/api/v1/partner/pharmacy/overview' },
      { name: 'Clinical Patients', url: '/api/v1/partner/clinical/patients' },
      { name: 'Laboratory Orders', url: '/api/v1/partner/lab/orders' },
      { name: 'Radiology Studies', url: '/api/v1/partner/radiology/studies' },
      { name: 'Billing Invoices', url: '/api/v1/partner/billing/invoices' }
    ];

    it('6.1 PENDING partner (no license row) is denied (403 COMMERCIAL_ACCESS_DENIED) on Pharmacy, Clinical, Lab, Radiology, and Billing operational APIs while Profile/Account/Compliance remain 200 OK', async () => {
      const pendingEmail = registeredPartners['PATHOLOGY'].email;
      const pendingTenantId = toDeterministicUuid(`tenant-${pendingEmail.toLowerCase().trim()}`);
      const pendingToken = createToken(
        '00000000-0000-4000-8000-000000000088',
        pendingEmail,
        ['PARTNER_ADMIN', 'HOSPITAL_ADMIN', 'PATHOLOGIST', 'PHARMACIST'],
        pendingTenantId,
        ['*']
      );

      for (const ep of operationalEndpoints) {
        const res = await app.inject({
          method: 'GET',
          url: ep.url,
          headers: { authorization: `Bearer ${pendingToken}` }
        });
        assert.equal(res.statusCode, 403, `PENDING partner must be denied (403) on ${ep.name} (${ep.url}), got ${res.statusCode}`);
        const body = JSON.parse(res.body);
        assert.equal(body.error?.code, 'COMMERCIAL_ACCESS_DENIED', `Expected COMMERCIAL_ACCESS_DENIED on ${ep.url}`);
      }

      // Profile, Account, and Compliance Onboarding remain accessible (200 OK)
      const profRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/profile',
        headers: { authorization: `Bearer ${pendingToken}` }
      });
      assert.equal(profRes.statusCode, 200, 'PENDING partner profile must remain accessible');

      const acctRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/account/plan-and-features',
        headers: { authorization: `Bearer ${pendingToken}` }
      });
      assert.equal(acctRes.statusCode, 200, 'PENDING partner account plan view must remain accessible');

      const compQueueRes = await app.inject({
        method: 'GET',
        url: '/api/v1/compliance/documents/verification-queue?scope=tenant',
        headers: { authorization: `Bearer ${pendingToken}` }
      });
      assert.equal(compQueueRes.statusCode, 200, 'PENDING partner compliance onboarding queue (?scope=tenant) must remain accessible');
    });

    it('6.2 REJECTED partner is denied (403 COMMERCIAL_ACCESS_DENIED) across all operational APIs', async () => {
      const rejectedEmail = registeredPartners['DIAGNOSTIC_CENTRE'].email;
      const rejectedTenantId = toDeterministicUuid(`tenant-${rejectedEmail.toLowerCase().trim()}`);
      const rejectedToken = createToken(
        '00000000-0000-4000-8000-000000000089',
        rejectedEmail,
        ['PARTNER_ADMIN', 'DIAGNOSTIC_ADMIN', 'RADIOLOGIST'],
        rejectedTenantId,
        ['*']
      );

      for (const ep of operationalEndpoints) {
        const res = await app.inject({
          method: 'GET',
          url: ep.url,
          headers: { authorization: `Bearer ${rejectedToken}` }
        });
        assert.equal(res.statusCode, 403, `REJECTED partner must be denied (403) on ${ep.name} (${ep.url}), got ${res.statusCode}`);
        const body = JSON.parse(res.body);
        assert.equal(body.error?.code, 'COMMERCIAL_ACCESS_DENIED', `Expected COMMERCIAL_ACCESS_DENIED on ${ep.url}`);
      }
    });

    it('6.3 APPROVED + ACTIVE LICENSE partner is allowed (200 OK) on entitled operational APIs, and denied (403 COMMERCIAL_ACCESS_DENIED) when EXPIRED, SUSPENDED, or CANCELLED', async () => {
      const pharmaEmail = registeredPartners['PHARMACY'].email;
      const tenantId = toDeterministicUuid(`tenant-${pharmaEmail.toLowerCase().trim()}`);
      const pharmaToken = createToken(
        '00000000-0000-4000-8000-000000000099',
        pharmaEmail,
        ['PHARMACIST', 'PARTNER_ADMIN'],
        tenantId,
        ['pharmacy:inventory:read', 'pharmacy:medications:read', '*']
      );

      // 1. Restore ACTIVE license with valid HMAC signature
      const [existingLic] = await testDb.select().from(licenses).where(eq(licenses.tenantId, tenantId));
      assert.ok(existingLic, 'Approved Pharmacy license row must exist');
      const validFutureExpiry = new Date(Date.now() + 365 * 86400000);
      const { licenseService } = await import('../dist/services/company/LicenseService.js');
      const { entitlementService } = await import('../dist/services/company/EntitlementService.js');
      const validSig = licenseService.signLicensePayload({
        licenseKey: existingLic.licenseKey,
        partnerId: existingLic.partnerId,
        tenantId: existingLic.tenantId,
        subscriptionId: existingLic.subscriptionId,
        planId: existingLic.planId,
        expiryDate: validFutureExpiry.toISOString()
      });

      await testDb
        .update(licenses)
        .set({ status: 'ACTIVE', expiryDate: validFutureExpiry, signature: validSig })
        .where(eq(licenses.tenantId, tenantId));
      entitlementService.invalidateTenantCache(tenantId);

      const activeRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/pharmacy/overview',
        headers: { authorization: `Bearer ${pharmaToken}` }
      });
      assert.equal(activeRes.statusCode, 200, 'APPROVED + ACTIVE LICENSE partner must be ALLOWED (200 OK) on GET /api/v1/partner/pharmacy/overview');

      // 2. EXPIRED license -> 403 COMMERCIAL_ACCESS_DENIED
      const expiredDate = new Date(Date.now() - 10 * 86400000);
      const expiredSig = licenseService.signLicensePayload({
        licenseKey: existingLic.licenseKey,
        partnerId: existingLic.partnerId,
        tenantId: existingLic.tenantId,
        subscriptionId: existingLic.subscriptionId,
        planId: existingLic.planId,
        expiryDate: expiredDate.toISOString()
      });
      await testDb
        .update(licenses)
        .set({ status: 'EXPIRED', expiryDate: expiredDate, gracePeriodEnd: expiredDate, signature: expiredSig })
        .where(eq(licenses.tenantId, tenantId));
      entitlementService.invalidateTenantCache(tenantId);

      const expiredRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/pharmacy/overview',
        headers: { authorization: `Bearer ${pharmaToken}` }
      });
      assert.equal(expiredRes.statusCode, 403, 'EXPIRED license must be DENIED (403)');
      assert.equal(JSON.parse(expiredRes.body).error?.code, 'COMMERCIAL_ACCESS_DENIED');

      // 3. SUSPENDED license -> 403 COMMERCIAL_ACCESS_DENIED
      await testDb
        .update(licenses)
        .set({ status: 'SUSPENDED', expiryDate: validFutureExpiry, signature: validSig })
        .where(eq(licenses.tenantId, tenantId));
      entitlementService.invalidateTenantCache(tenantId);

      const suspendedRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/pharmacy/overview',
        headers: { authorization: `Bearer ${pharmaToken}` }
      });
      assert.equal(suspendedRes.statusCode, 403, 'SUSPENDED license must be DENIED (403)');
      assert.equal(JSON.parse(suspendedRes.body).error?.code, 'COMMERCIAL_ACCESS_DENIED');

      // 4. CANCELLED / TERMINATED license -> 403 COMMERCIAL_ACCESS_DENIED
      await testDb
        .update(licenses)
        .set({ status: 'CANCELLED', expiryDate: validFutureExpiry, signature: validSig })
        .where(eq(licenses.tenantId, tenantId));
      entitlementService.invalidateTenantCache(tenantId);

      const cancelledRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/pharmacy/overview',
        headers: { authorization: `Bearer ${pharmaToken}` }
      });
      assert.equal(cancelledRes.statusCode, 403, 'CANCELLED license must be DENIED (403)');
      assert.equal(JSON.parse(cancelledRes.body).error?.code, 'COMMERCIAL_ACCESS_DENIED');
    });
  });
});

