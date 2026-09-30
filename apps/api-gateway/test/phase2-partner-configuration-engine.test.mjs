import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  getDatabase,
  tenants,
  partnerProfiles,
  plans,
  subscriptions,
  licenses,
  eq
} from '@docsearch/database';
import { env } from '../dist/config/env.js';
import { licenseService } from '../dist/services/company/LicenseService.js';

function detUuid(seed) {
  const hex = crypto.createHash('sha256').update(seed).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function createPartnerToken({ userId, tenantId, role = 'PARTNER_ADMIN', email = 'admin@partner.local' }) {
  return signJwt(
    {
      sub: userId,
      email,
      tenantId,
      roles: [role],
      permissions: ['partners:read', 'partners:create', 'partners:update', 'partners:delete']
    },
    {
      secret: env.JWT_SECRET,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresInSeconds: 3600
    }
  );
}

async function seedTestPartner(db, { slug, legalName, partnerType, operatingMode, maxBranches = 2, maxDoctors = 2, licenseStatus = 'ACTIVE' }) {
  const tenantId = detUuid(`phase2-tenant:${slug}`);
  const partnerId = detUuid(`phase2-profile:${slug}`);
  const planId = detUuid(`phase2-plan:${slug}`);
  const subId = detUuid(`phase2-sub:${slug}`);
  const licId = detUuid(`phase2-lic:${slug}`);
  const email = `admin@${slug}.docsearch.test`;

  await db
    .insert(tenants)
    .values({
      id: tenantId,
      name: legalName,
      slug: `p2-${slug}`,
      status: 'ACTIVE'
    })
    .onConflictDoNothing();

  await db
    .insert(partnerProfiles)
    .values({
      id: partnerId,
      tenantId,
      legalName,
      tradeName: legalName,
      partnerType,
      lifecycleStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      primaryContactName: 'Dr. Admin',
      primaryContactEmail: email,
      primaryContactPhone: '+91-9876543210',
      address: {
        street: '101 Healthcare Park',
        city: 'Patna',
        state: 'Bihar',
        postalCode: '800001',
        country: 'IN'
      },
      metadata: {
        industry: partnerType,
        operatingModel: operatingMode,
        operatingMode
      }
    })
    .onConflictDoNothing();

  await db
    .insert(plans)
    .values({
      id: planId,
      productId: '77777777-7777-4777-8777-777777777777',
      code: `PLAN-${slug.toUpperCase()}`,
      name: `${legalName} Commercial Plan`,
      description: `Commercial subscription plan for ${legalName}`,
      version: '1.0.0',
      billingInterval: 'ANNUAL',
      basePrice: '12000',
      currency: 'INR',
      maxDoctors,
      maxBranches,
      maxBeds: partnerType === 'MULTI_SPECIALITY_HOSPITAL' ? 50 : 0,
      effectiveDate: new Date(),
      status: 'ACTIVE'
    })
    .onConflictDoNothing();

  const startDate = new Date(Date.now() - 86400 * 1000);
  const expiryDate =
    licenseStatus === 'EXPIRED'
      ? new Date(Date.now() - 10 * 86400 * 1000)
      : new Date(Date.now() + 365 * 86400 * 1000);
  const gracePeriodEnd =
    licenseStatus === 'EXPIRED'
      ? new Date(Date.now() - 2 * 86400 * 1000)
      : new Date(Date.now() + 380 * 86400 * 1000);

  await db
    .insert(subscriptions)
    .values({
      id: subId,
      partnerId,
      productId: '77777777-7777-4777-8777-777777777777',
      planId,
      planVersion: '1.0.0',
      status: licenseStatus === 'ACTIVE' ? 'ACTIVE' : licenseStatus,
      billingCycle: 'ANNUAL',
      startDate,
      renewalDate: expiryDate,
      endDate: expiryDate,
      metadata: { partnerType, operatingMode }
    })
    .onConflictDoNothing();

  const licenseKey = `LIC-P2-${slug.toUpperCase().slice(0, 6)}-${tenantId.slice(0, 6).toUpperCase()}`;
  const signature = licenseService.signLicensePayload({
    licenseKey,
    partnerId,
    tenantId,
    subscriptionId: subId,
    planId,
    expiryDate: expiryDate.toISOString()
  });

  await db
    .insert(licenses)
    .values({
      id: licId,
      licenseKey,
      partnerId,
      tenantId,
      subscriptionId: subId,
      planId,
      licenseType: 'COMMERCIAL',
      status: licenseStatus,
      activationStatus: 'ACTIVATED',
      maxConcurrentUsers: 25,
      maxDoctors,
      maxBranches,
      issuedAt: startDate,
      startDate,
      expiryDate,
      gracePeriodEnd,
      signature,
      metadata: { partnerType, operatingMode }
    })
    .onConflictDoNothing();

  return {
    tenantId,
    partnerId,
    email,
    token: createPartnerToken({ userId: partnerId, tenantId, role: 'PARTNER_ADMIN', email }),
    receptionistToken: createPartnerToken({
      userId: detUuid(`receptionist:${slug}`),
      tenantId,
      role: 'RECEPTIONIST',
      email: `desk@${slug}.docsearch.test`
    })
  };
}

describe('DOC SEARCH — PHASE 2: PARTNER CONFIGURATION ENGINE (STEPS 5–15)', () => {
  let app;
  let db;
  let pathologyPartner;
  let retailPharmacyPartner;
  let wholesalePharmacyPartner;
  let clinicPartner;
  let hospitalPartner;
  let suspendedPartner;

  before(async () => {
    app = await buildApp();
    await app.ready();
    db = getDatabase();

    pathologyPartner = await seedTestPartner(db, {
      slug: 'apex-pathology',
      legalName: 'Apex Reference Pathology Diagnostics Pvt Ltd',
      partnerType: 'PATHOLOGY',
      operatingMode: 'DIAGNOSTIC_CENTER',
      maxBranches: 2,
      maxDoctors: 2
    });

    retailPharmacyPartner = await seedTestPartner(db, {
      slug: 'medplus-retail',
      legalName: 'MedPlus Retail Pharmacy Counter',
      partnerType: 'PHARMACY_RETAIL',
      operatingMode: 'RETAIL_PHARMACY',
      maxBranches: 1,
      maxDoctors: 0
    });

    wholesalePharmacyPartner = await seedTestPartner(db, {
      slug: 'global-pharma-wholesale',
      legalName: 'Global B2B Pharma Distributors',
      partnerType: 'PHARMACY_WHOLESALE',
      operatingMode: 'WHOLESALE_PHARMACY',
      maxBranches: 2,
      maxDoctors: 0
    });

    clinicPartner = await seedTestPartner(db, {
      slug: 'sharma-solo-clinic',
      legalName: 'Dr Sharma Heart & OPD Clinic',
      partnerType: 'SOLO_DOCTOR_CLINIC',
      operatingMode: 'SOLO',
      maxBranches: 1,
      maxDoctors: 1
    });

    hospitalPartner = await seedTestPartner(db, {
      slug: 'sunrise-multispecialty-hosp',
      legalName: 'Sunrise Multi-Specialty Hospital & Trauma Centre',
      partnerType: 'MULTI_SPECIALITY_HOSPITAL',
      operatingMode: 'HOSPITAL',
      maxBranches: 3,
      maxDoctors: 5
    });

    suspendedPartner = await seedTestPartner(db, {
      slug: 'expired-care-clinic',
      legalName: 'Expired License Clinic Facility',
      partnerType: 'SOLO_DOCTOR_CLINIC',
      operatingMode: 'CLINIC',
      maxBranches: 1,
      maxDoctors: 2,
      licenseStatus: 'SUSPENDED'
    });
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  test('1. Idempotent Configuration Initialization (1x vs 10x consecutive runs) produces zero duplicates and zero fake staff', async () => {
    let firstSnapshot = null;
    for (let i = 0; i < 10; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/configuration/initialize',
        headers: { authorization: `Bearer ${pathologyPartner.token}` },
        payload: { reason: `Idempotency test run #${i + 1}`, source: 'PARTNER_ADMIN' }
      });
      assert.equal(res.statusCode, 200, `Expected 200 on initialization run #${i + 1}`);
      const body = res.json();
      assert.equal(body.success, true);

      if (i === 0) {
        firstSnapshot = body.data;
      } else {
        assert.equal(
          body.data.locations.length,
          firstSnapshot.locations.length,
          'Locations count must remain identical across 10 runs'
        );
        assert.equal(
          body.data.departments.configuredCount,
          firstSnapshot.departments.configuredCount,
          'Departments count must remain identical across 10 runs'
        );
        assert.equal(
          body.data.services.configuredCount,
          0,
          'Genuine zero-state: Services must remain 0 until explicitly configured'
        );
        assert.equal(
          body.data.staff.totalCount,
          0,
          'Genuine zero-state: Zero fake staff or doctors auto-created'
        );
      }
    }

    assert.equal(firstSnapshot.classification.industry, 'PATHOLOGY');
    assert.equal(firstSnapshot.classification.operatingModel, 'DIAGNOSTIC_CENTER');
    assert.equal(firstSnapshot.locations.length, 1);
    assert.ok(firstSnapshot.departments.configuredCount >= 1, 'Applicable pathology departments must be initialized');
    assert.equal(firstSnapshot.staffTemplates.autoCreatedFakeStaffCount, 0);
    assert.ok(firstSnapshot.staffTemplates.templateCount >= 1);
    assert.equal(firstSnapshot.validation.overallStatus, 'VERIFIED');
  });

  test('2. Industry-Specific Department & Workspace Derivation (Pathology vs Retail Pharmacy vs Wholesale Pharmacy vs Hospital)', async () => {
    const [retailInit, wholesaleInit, hospInit] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/api/v1/partner/configuration/initialize',
        headers: { authorization: `Bearer ${retailPharmacyPartner.token}` },
        payload: {}
      }),
      app.inject({
        method: 'POST',
        url: '/api/v1/partner/configuration/initialize',
        headers: { authorization: `Bearer ${wholesalePharmacyPartner.token}` },
        payload: {}
      }),
      app.inject({
        method: 'POST',
        url: '/api/v1/partner/configuration/initialize',
        headers: { authorization: `Bearer ${hospitalPartner.token}` },
        payload: {}
      })
    ]);

    const retailData = retailInit.json().data;
    const wholesaleData = wholesaleInit.json().data;
    const hospData = hospInit.json().data;

    // Retail Pharmacy checks
    assert.equal(retailData.classification.industry, 'PHARMACY_RETAIL');
    assert.equal(retailData.workspace.defaultLandingView, 'RETAIL_PHARMACY_POS');
    assert.ok(!retailData.workspace.allowedNavigationModules.includes('IPD_ADT_BED_BOARD'));
    assert.ok(!retailData.workspace.allowedNavigationModules.includes('WHOLESALE_B2B_DISTRIBUTION'));

    // Wholesale Pharmacy checks
    assert.equal(wholesaleData.classification.industry, 'PHARMACY_WHOLESALE');
    assert.equal(wholesaleData.workspace.defaultLandingView, 'WHOLESALE_B2B_DISTRIBUTION');
    assert.ok(!wholesaleData.workspace.allowedNavigationModules.includes('RETAIL_PHARMACY_POS'));
    assert.ok(!wholesaleData.workspace.allowedNavigationModules.includes('OPD_CONSULTATION_QUEUE'));

    // Multi-Specialty Hospital checks
    assert.equal(hospData.classification.industry, 'MULTI_SPECIALITY_HOSPITAL');
    assert.ok(hospData.workspace.allowedNavigationModules.includes('OPD_CONSULTATION_QUEUE'));
    assert.ok(hospData.workspace.allowedNavigationModules.includes('IPD_ADT_BED_BOARD'));
  });

  test('3. End-to-End Locations, Services (Zero-State -> Active), Staff Creation & Role Assignment Lifecycle', async () => {
    // 3.1 Verify Services start in genuine zero-state
    const svcZeroRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/services',
      headers: { authorization: `Bearer ${pathologyPartner.token}` }
    });
    assert.equal(svcZeroRes.statusCode, 200);
    const svcZero = svcZeroRes.json().data;
    assert.equal(svcZero.isZeroState, true);
    assert.equal(svcZero.configuredCount, 0);
    assert.ok(svcZero.applicableServiceBlueprints.length >= 1);

    // 3.2 Create a valid Pathology service bound to Pathology Partner's primary location & department
    const locRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/locations',
      headers: { authorization: `Bearer ${pathologyPartner.token}` }
    });
    const primaryLoc = locRes.json().data[0];
    assert.ok(primaryLoc?.id);

    const deptRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/departments',
      headers: { authorization: `Bearer ${pathologyPartner.token}` }
    });
    const primaryDept = deptRes.json().data.configuredDepartments[0];
    assert.ok(primaryDept?.id);

    const createSvcRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/services',
      headers: { authorization: `Bearer ${pathologyPartner.token}` },
      payload: {
        serviceCode: 'SVC-PATH-CBC-01',
        serviceName: 'Complete Blood Count (5-Part Differential)',
        category: 'PATHOLOGY',
        departmentId: primaryDept.id,
        locationId: primaryLoc.id,
        baseTariffInr: 400,
        turnaroundMinutes: 90,
        isActive: true
      }
    });
    assert.equal(createSvcRes.statusCode, 201);
    const createdSvc = createSvcRes.json().data;
    assert.equal(createdSvc.serviceCode, 'SVC-PATH-CBC-01');
    assert.equal(createdSvc.isActive, true);

    // 3.3 Update service tariff via PATCH /api/v1/partner/services/:id
    const patchSvcRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/services/${createdSvc.id}`,
      headers: { authorization: `Bearer ${pathologyPartner.token}` },
      payload: { baseTariffInr: 450 }
    });
    assert.equal(patchSvcRes.statusCode, 200);
    assert.equal(patchSvcRes.json().data.baseTariffInr, 450);

    // 3.4 Create real staff member (Pathologist Doctor #1) and assign role
    const createStaffRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff',
      headers: { authorization: `Bearer ${pathologyPartner.token}` },
      payload: {
        branchId: primaryLoc.id,
        departmentId: primaryDept.id,
        fullName: 'Dr. Vikram Sen (MD Pathology)',
        workEmail: 'vikram.sen@apex-pathology.test',
        workPhone: '+91-9811122233',
        staffType: 'DOCTOR',
        primaryRole: 'PATHOLOGIST',
        employmentType: 'FULL_TIME',
        joiningDate: new Date().toISOString()
      }
    });
    assert.equal(createStaffRes.statusCode, 201);
    const createdStaff = createStaffRes.json().data;
    assert.ok(createdStaff.id);

    // 3.5 Assign role via POST /api/v1/partner/roles/assign
    const assignRoleRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/roles/assign',
      headers: { authorization: `Bearer ${pathologyPartner.token}` },
      payload: {
        staffId: createdStaff.id,
        branchId: primaryLoc.id,
        departmentId: primaryDept.id,
        roleCode: 'PATHOLOGIST',
        dataScope: 'BRANCH',
        isPrimary: true,
        effectiveFrom: new Date().toISOString(),
        actorId: pathologyPartner.partnerId,
        actorRole: 'PARTNER_ADMIN',
        reason: 'Assign primary pathologist role'
      }
    });
    assert.equal(assignRoleRes.statusCode, 201);
  });

  test('4. Adversarial Security Tests (Cross-Tenant Isolation, Domain Restrictions, Quota Limits & Suspended License)', async () => {
    // 4.1 Cross-Tenant Read/Header Spoofing: Pathology Partner attempting to read Hospital Partner config
    const crossReadRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/configuration',
      headers: {
        authorization: `Bearer ${pathologyPartner.token}`,
        'x-tenant-id': hospitalPartner.tenantId
      }
    });
    assert.equal(crossReadRes.statusCode, 403, 'Must block cross-tenant header spoofing with 403');

    // 4.2 Cross-Tenant Department Attachment: Pathology Partner attempting to attach department to Hospital Partner location
    const hospLocRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/locations',
      headers: { authorization: `Bearer ${hospitalPartner.token}` }
    });
    const hospPrimaryLoc = hospLocRes.json().data[0];

    const crossDeptRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/departments',
      headers: { authorization: `Bearer ${pathologyPartner.token}` },
      payload: {
        departmentCode: 'DEPT-CROSS-HACK',
        departmentName: 'Cross Tenant Department',
        locationId: hospPrimaryLoc.id
      }
    });
    assert.equal(crossDeptRes.statusCode, 403, 'Must block cross-tenant locationId on department creation');

    // 4.3 Cross-Tenant Staff Assignment: Pathology Partner attempting to assign staff to Hospital Partner location
    const crossStaffRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff',
      headers: { authorization: `Bearer ${pathologyPartner.token}` },
      payload: {
        branchId: hospPrimaryLoc.id,
        fullName: 'Cross Tenant Staff',
        workEmail: 'cross@apex.test',
        staffType: 'LAB_TECHNICIAN',
        primaryRole: 'LAB_TECHNICIAN'
      }
    });
    assert.equal(crossStaffRes.statusCode, 403, 'Must block cross-tenant branchId on staff creation');

    // 4.4 Domain Capability Restriction: Pathology Partner cannot create Inpatient (IPD) service
    const pathLocs = (await app.inject({
      method: 'GET',
      url: '/api/v1/partner/locations',
      headers: { authorization: `Bearer ${pathologyPartner.token}` }
    })).json().data;
    const pathDepts = (await app.inject({
      method: 'GET',
      url: '/api/v1/partner/departments',
      headers: { authorization: `Bearer ${pathologyPartner.token}` }
    })).json().data.configuredDepartments;

    const illegalIpdSvc = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/services',
      headers: { authorization: `Bearer ${pathologyPartner.token}` },
      payload: {
        serviceCode: 'SVC-ILLEGAL-IPD',
        serviceName: 'ICU Bed Admission',
        category: 'INPATIENT_CARE',
        departmentId: pathDepts[0].id,
        locationId: pathLocs[0].id
      }
    });
    assert.equal(illegalIpdSvc.statusCode, 403, 'Pathology partner must be blocked from creating INPATIENT_CARE service');

    // 4.5 Domain Capability Restriction: Retail Pharmacy Partner cannot create OPD Doctor Consultation service
    const retailLocs = (await app.inject({
      method: 'GET',
      url: '/api/v1/partner/locations',
      headers: { authorization: `Bearer ${retailPharmacyPartner.token}` }
    })).json().data;
    const retailDepts = (await app.inject({
      method: 'GET',
      url: '/api/v1/partner/departments',
      headers: { authorization: `Bearer ${retailPharmacyPartner.token}` }
    })).json().data.configuredDepartments;

    const illegalOpdSvc = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/services',
      headers: { authorization: `Bearer ${retailPharmacyPartner.token}` },
      payload: {
        serviceCode: 'SVC-ILLEGAL-OPD',
        serviceName: 'Cardiology Consultation',
        category: 'OUTPATIENT_CONSULTATION',
        departmentId: retailDepts[0].id,
        locationId: retailLocs[0].id
      }
    });
    assert.equal(illegalOpdSvc.statusCode, 403, 'Retail Pharmacy must be blocked from creating OUTPATIENT_CONSULTATION service');

    // 4.6 Operating Model & Branch Quota Restriction: Solo Doctor Clinic (maxBranches=1, SOLO) cannot add a 2nd branch
    await app.inject({
      method: 'POST',
      url: '/api/v1/partner/configuration/initialize',
      headers: { authorization: `Bearer ${clinicPartner.token}` },
      payload: {}
    });
    const exceedBranchRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/locations',
      headers: { authorization: `Bearer ${clinicPartner.token}` },
      payload: {
        locationName: 'Unauthorized Second Clinic Branch',
        addressStreet: '22 Second Street',
        addressCity: 'Patna',
        addressState: 'Bihar',
        addressPostalCode: '800002',
        contactEmail: 'branch2@sharma-clinic.test',
        contactPhone: '+91-9800001111'
      }
    });
    assert.equal(exceedBranchRes.statusCode, 403, 'Must block creating 2nd location when maxBranches=1 / SOLO');

    // 4.7 RBAC Restriction: Receptionist role cannot mutate partner configuration
    const receptionistMutateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/configuration/initialize',
      headers: { authorization: `Bearer ${pathologyPartner.receptionistToken}` },
      payload: {}
    });
    assert.equal(receptionistMutateRes.statusCode, 403, 'Non-admin staff role must be blocked from configuration mutations');

    // 4.8 Suspended License Behavior: Blocks operational mutations while keeping Profile & Validation accessible!
    const suspendedProfileRead = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/profile',
      headers: { authorization: `Bearer ${suspendedPartner.token}` }
    });
    assert.equal(suspendedProfileRead.statusCode, 200, 'Partner Profile GET must remain accessible when license is SUSPENDED');

    const suspendedProfilePatch = await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/profile',
      headers: { authorization: `Bearer ${suspendedPartner.token}` },
      payload: { primaryContactPhone: '+91-9999988888' }
    });
    assert.equal(suspendedProfilePatch.statusCode, 200, 'Partner Profile PATCH must remain accessible when license is SUSPENDED');

    const suspendedValidationRead = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/configuration/validation',
      headers: { authorization: `Bearer ${suspendedPartner.token}` }
    });
    assert.equal(suspendedValidationRead.statusCode, 200, 'Configuration Validation GET must remain accessible when license is SUSPENDED');
    const valReport = suspendedValidationRead.json().data;
    assert.equal(valReport.domains['License'].status, 'BLOCKED');
    assert.equal(valReport.isOperationallyReady, false);

    const suspendedCreateLoc = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/locations',
      headers: { authorization: `Bearer ${suspendedPartner.token}` },
      payload: {
        locationName: 'Blocked Branch',
        addressStreet: 'Blocked Rd',
        addressCity: 'Patna',
        addressState: 'Bihar',
        addressPostalCode: '800001',
        contactEmail: 'b@expired.test',
        contactPhone: '+91-9000000000'
      }
    });
    assert.equal(suspendedCreateLoc.statusCode, 403, 'Operational location creation must be blocked when license is SUSPENDED');
  });
});
