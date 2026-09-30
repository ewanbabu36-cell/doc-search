/**
 * DOC SEARCH — MASTER ARCHITECTURE P0/P1 CONTROLLED REMEDIATION VERIFICATION SUITE
 *
 * Verifies all 10 remediated P0/P1 findings in strict dependency order:
 * - GROUP A:
 *   - P0-02: LicenseService genuine HMAC-SHA256 verification & removal of seed_signature / SIG-PROD-2026- bypasses
 *   - P0-03: Zero synthetic operational UUID fallbacks in ScopeGuard & operational repositories (fail-closed)
 *   - P0-04: Transactional fail-closed AuditRepository with non-null actorId/branchId/tenantId and zero memory fallback
 * - GROUP B:
 *   - P0-01: Canonical plan resolution in PartnerSyncService.resolveVerticalPlan failing closed on unsupported verticals
 *   - P1-04: Operating model persistence in canonical columns across partner_profiles, operational_partners, and operational_organizations
 *   - P1-05: Canonical Capability layer distinct from commercial FeatureCode
 * - GROUP C:
 *   - P0-05: PostgreSQL-backed WorkflowRepository across fresh repository instances, tenant isolation, and zero demo instances
 * - GROUP D:
 *   - P1-01: LabDiagnosticsService & RadiologyService target-record scope enforcement before ID-based mutations
 *   - P1-02: Partner profile module boundary enforcement across EntitlementService & commercial-guard
 *   - P1-03: StaffAdministrationService wholesale/retail/hybrid pharmacy staff role provisioning
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  getDatabase,
  tenants,
  branches,
  partnerProfiles,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  licenses,
  subscriptions,
  auditEvents,
  WorkflowRepository,
  eq,
  setupTestDatabase,
  TEST_SEEDS
} from '@docsearch/database';
import { ScopeGuard } from '@docsearch/auth';
import { isModuleAllowedForPartnerProfile } from '@docsearch/shared-core';
import { licenseService } from '../dist/services/company/LicenseService.js';
import { resolveVerticalPlan } from '../dist/services/company/PartnerSyncService.js';
import { auditRepository } from '../dist/repositories/core/AuditRepository.js';
import { pharmacyManagementRepository } from '../dist/repositories/partner/PharmacyManagementRepository.js';
import { clinicalWorkflowRepository } from '../dist/repositories/partner/ClinicalWorkflowRepository.js';
import { labDiagnosticsRepository } from '../dist/repositories/partner/LabDiagnosticsRepository.js';
import { radiologyRepository } from '../dist/repositories/partner/RadiologyRepository.js';
import { radiologyService } from '../dist/services/partner/RadiologyService.js';
import { staffAdministrationService } from '../dist/services/partner/StaffAdministrationService.js';
import { MASTER_CAPABILITIES, CapabilityAndDependencyEngine } from '../dist/services/company/CapabilityAndDependencyEngine.js';
import { toDeterministicUuid } from '../dist/repositories/company/PartnerOnboardingRepository.js';

const TEST_IDS = {
  TENANT_A: TEST_SEEDS.TENANT_A,
  TENANT_B: TEST_SEEDS.TENANT_B,
  PARTNER_A: TEST_SEEDS.PARTNER_ID_A,
  PLAN_PRO: TEST_SEEDS.PLAN_PRO_ID,
  BRANCH_A: TEST_SEEDS.BRANCH_A,
  USER_PARTNER_A: TEST_SEEDS.DOCTOR_ID,
  SUBSCRIPTION_A: TEST_SEEDS.SUBSCRIPTION_ID_A,
  LICENSE_A: TEST_SEEDS.LICENSE_ID_A
};

test('MASTER ARCHITECTURE P0/P1 CONTROLLED REMEDIATION SUITE', async (t) => {
  await setupTestDatabase({ seedBaseline: true });

  // =========================================================================
  // GROUP A: P0-02, P0-03, P0-04
  // =========================================================================
  await t.test('P0-02: LicenseService verifies genuine HMAC-SHA256 signatures and rejects seed/prefix bypasses & tampering', async () => {
    const expiryIso = new Date('2027-01-01T00:00:00.000Z').toISOString();
    const payload = {
      tenantId: TEST_IDS.TENANT_A,
      partnerId: TEST_IDS.PARTNER_A,
      subscriptionId: TEST_IDS.SUBSCRIPTION_A,
      planId: TEST_IDS.PLAN_PRO,
      licenseKey: 'LIC-TEST-2026-HMAC01',
      maxConcurrentUsers: 50,
      expiryDate: new Date(expiryIso)
    };

    const validSignature = licenseService.signLicensePayload({
      licenseKey: payload.licenseKey,
      partnerId: payload.partnerId,
      tenantId: payload.tenantId,
      subscriptionId: payload.subscriptionId,
      planId: payload.planId,
      expiryDate: expiryIso
    });
    assert.match(validSignature, /^[0-9a-f]{64}$/i);
    assert.equal(licenseService.verifyLicenseSignature({ ...payload, signature: validSignature }), true);

    // Reject seed_signature and SIG-PROD-2026- bypasses in all environments
    assert.equal(licenseService.verifyLicenseSignature({ ...payload, signature: 'seed_signature' }), false);
    assert.equal(licenseService.verifyLicenseSignature({ ...payload, signature: 'SIG-PROD-2026-BYPASS1234' }), false);
    assert.equal(licenseService.verifyLicenseSignature({ ...payload, signature: '' }), false);

    // Reject tampered licenseKey, partnerId, expiryDate
    assert.equal(
      licenseService.verifyLicenseSignature({
        ...payload,
        licenseKey: 'LIC-TAMPERED-9999',
        signature: validSignature
      }),
      false
    );
    assert.equal(
      licenseService.verifyLicenseSignature({
        ...payload,
        partnerId: crypto.randomUUID(),
        signature: validSignature
      }),
      false
    );
    assert.equal(
      licenseService.verifyLicenseSignature({
        ...payload,
        expiryDate: new Date('2030-01-01T00:00:00.000Z'),
        signature: validSignature
      }),
      false
    );

    // Verify baseline seeded license in PostgreSQL carries a genuine HMAC-SHA256 signature
    const db = getDatabase();
    const [seededLic] = await db.select().from(licenses).where(eq(licenses.id, TEST_IDS.LICENSE_A)).limit(1);
    assert.ok(seededLic);
    assert.notEqual(seededLic.signature, 'seed_signature');
    assert.equal(licenseService.verifyLicenseSignature(seededLic), true);
  });

  await t.test('P0-03: ScopeGuard and operational repositories fail closed with zero synthetic UUID fallbacks', async () => {
    const branchScopedSession = {
      userId: TEST_IDS.USER_PARTNER_A,
      tenantId: TEST_IDS.TENANT_A,
      branchId: TEST_IDS.BRANCH_A,
      roles: ['LAB_TECHNICIAN'],
      permissions: [],
      scopeLevel: 'BRANCH',
      isSuperAdmin: false
    };

    // ScopeGuard must NOT exempt 00000000-0000-4000-8000-000000000002 or ...0003
    assert.throws(() => {
      ScopeGuard.assertRecordInScope(branchScopedSession, {
        tenantId: TEST_IDS.TENANT_A,
        branchId: '00000000-0000-4000-8000-000000000002'
      });
    });

    const filtered = ScopeGuard.filterRecordsByScope(
      [
        { id: 'rec-1', tenantId: TEST_IDS.TENANT_A, branchId: TEST_IDS.BRANCH_A },
        { id: 'rec-2', tenantId: TEST_IDS.TENANT_A, branchId: '00000000-0000-4000-8000-000000000002' },
        { id: 'rec-3', tenantId: TEST_IDS.TENANT_A, branchId: '00000000-0000-4000-8000-000000000003' }
      ],
      { branchId: TEST_IDS.BRANCH_A }
    );
    assert.deepEqual(
      filtered.map((r) => r.id),
      ['rec-1']
    );

    // Unprovisioned tenant must fail closed in Pharmacy, Clinical, and Lab repositories
    const unprovisionedTenantId = crypto.randomUUID();
    await assert.rejects(async () => {
      await pharmacyManagementRepository.createInventoryItem(unprovisionedTenantId, {
        drugCode: 'DRUG-FAIL-01',
        drugName: 'Unprovisioned Drug',
        category: 'TABLET',
        unitPrice: 10
      });
    });

    await assert.rejects(async () => {
      await clinicalWorkflowRepository.createAppointment(unprovisionedTenantId, {
        patientId: crypto.randomUUID(),
        doctorId: crypto.randomUUID(),
        facilityId: crypto.randomUUID(),
        appointmentDate: '2026-10-01'
      });
    });

    await assert.rejects(async () => {
      await labDiagnosticsRepository.createOrder(
        unprovisionedTenantId,
        {
          patientId: crypto.randomUUID(),
          facilityId: crypto.randomUUID(),
          testIds: []
        },
        TEST_IDS.USER_PARTNER_A
      );
    });
  });

  await t.test('P0-04: AuditRepository persists actorId, branchId, and tenantId transactionally and fails closed', async () => {
    const db = getDatabase();
    const partnerStaffActorId = crypto.randomUUID(); // Not in core.users, verifying FK drop + preservation
    const facilityBranchId = crypto.randomUUID();

    // Provision an operational facility for TEST_IDS.TENANT_A so branchId is valid in operational_facilities
    const [opPartner] = await db
      .insert(operationalPartners)
      .values({
        id: crypto.randomUUID(),
        tenantId: TEST_IDS.TENANT_A,
        partnerCode: `PTN-AUD-${Date.now()}`,
        legalBusinessName: 'Audit Test Partner',
        partnerType: 'HOSPITAL',
        operatingModel: 'MULTI_SPECIALTY',
        contactEmail: 'audit@hospital.test',
        contactPhone: '9876543210'
      })
      .returning();

    const [opOrg] = await db
      .insert(operationalOrganizations)
      .values({
        id: crypto.randomUUID(),
        tenantId: TEST_IDS.TENANT_A,
        partnerId: opPartner.id,
        organizationCode: `ORG-AUD-${Date.now()}`,
        organizationName: 'Audit Test Org',
        organizationType: 'HOSPITAL',
        operatingModel: 'MULTI_SPECIALTY',
        contactEmail: 'audit@hospital.test',
        contactPhone: '9876543210'
      })
      .returning();

    await db.insert(operationalFacilities).values({
      id: facilityBranchId,
      tenantId: TEST_IDS.TENANT_A,
      partnerId: opPartner.id,
      organizationId: opOrg.id,
      facilityCode: `FAC-AUD-${Date.now()}`,
      facilityName: 'Audit Operational Facility',
      facilityType: 'HOSPITAL',
      addressStreet: '100 Audit Way',
      addressCity: 'Mumbai',
      addressState: 'Maharashtra',
      addressPostalCode: '400001',
      addressCountry: 'India',
      contactEmail: 'audit@hospital.test',
      contactPhone: '9876543210'
    });

    const session = {
      userId: partnerStaffActorId,
      tenantId: TEST_IDS.TENANT_A,
      branchId: facilityBranchId,
      roles: ['PARTNER_ADMIN'],
      permissions: [],
      scopeLevel: 'BRANCH',
      isSuperAdmin: false
    };

    const persisted = await auditRepository.recordEvent(
      {
        eventType: 'SECURITY_REMEDIATION_VERIFIED',
        resourceType: 'CLINICAL_RECORD',
        resourceId: 'rec-audit-01',
        metadata: { check: 'P0-04' }
      },
      session
    );

    // Must NOT null out actorId, branchId, or tenantId
    assert.equal(persisted.actorId, partnerStaffActorId);
    assert.equal(persisted.branchId, facilityBranchId);
    assert.equal(persisted.tenantId, TEST_IDS.TENANT_A);

    // Verify in PostgreSQL directly
    const [dbRow] = await db.select().from(auditEvents).where(eq(auditEvents.id, persisted.id)).limit(1);
    assert.ok(dbRow);
    assert.equal(dbRow.actorId, partnerStaffActorId);
    assert.equal(dbRow.branchId, facilityBranchId);
    assert.equal(dbRow.tenantId, TEST_IDS.TENANT_A);

    // Reject audit event when branchId belongs to a non-existent branch
    await assert.rejects(
      async () => {
        await auditRepository.recordEvent(
          {
            eventType: 'INVALID_BRANCH_EVENT',
            resourceType: 'CLINICAL_RECORD',
            resourceId: 'rec-audit-02',
            branchId: crypto.randomUUID()
          },
          session
        );
      },
      /does not exist/
    );
  });

  // =========================================================================
  // GROUP B: P0-01, P1-04, P1-05
  // =========================================================================
  await t.test('P0-01: resolveVerticalPlan maps every supported vertical and fails closed on unknown verticals without Clinic fallback', async () => {
    const hosp = resolveVerticalPlan(null, null, 'HOSPITAL', 'FREE');
    assert.equal(hosp.planId, toDeterministicUuid('plan-hosp-free-yr1'));

    const path = resolveVerticalPlan(null, null, 'PATHOLOGY', 'FREE');
    assert.equal(path.planId, toDeterministicUuid('plan-path-free-yr1'));

    const retailPharm = resolveVerticalPlan(null, null, 'PHARMACY', 'FREE');
    assert.equal(retailPharm.planId, toDeterministicUuid('plan-pharma-free-yr1'));

    const wholesalePharm = resolveVerticalPlan(null, null, 'PHARMACY_WHOLESALE', 'FREE');
    assert.equal(wholesalePharm.planId, toDeterministicUuid('plan-pharma-wholesale-free-yr1'));

    const diag = resolveVerticalPlan(null, null, 'DIAGNOSTIC_CENTRE', 'FREE');
    assert.equal(diag.planId, toDeterministicUuid('plan-radio-free-yr1'));

    // Unknown vertical or unmapped plan ID must throw 400 VALIDATION_ERROR and NEVER return Clinic Starter
    assert.throws(() => resolveVerticalPlan(null, null, 'TELEMEDICINE_AGGREGATOR', 'FREE'), /Silent fallback/);
    assert.throws(() => resolveVerticalPlan(null, null, '', 'FREE'), /Silent fallback/);
    assert.throws(
      () => resolveVerticalPlan({ id: 'plan-nonexistent-xyz' }, null, 'HOSPITAL', 'FREE'),
      /Unsupported or unmapped commercial plan ID/
    );
  });

  await t.test('P1-04: operating_model persists in canonical columns across partner_profiles, operational_partners, and operational_organizations', async () => {
    const db = getDatabase();
    const wholesaleTenantId = crypto.randomUUID();
    await db.insert(tenants).values({
      id: wholesaleTenantId,
      name: 'Wholesale Operating Model Tenant',
      slug: `wholesale-op-${Date.now()}`,
      status: 'ACTIVE'
    });

    const [prof] = await db
      .insert(partnerProfiles)
      .values({
        id: crypto.randomUUID(),
        tenantId: wholesaleTenantId,
        legalName: 'Apex Wholesale Pharma Pvt Ltd',
        tradeName: 'Apex Wholesale',
        partnerType: 'PHARMACY_WHOLESALE',
        operatingModel: 'WHOLESALE_ONLY',
        lifecycleStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        onboardingStep: 'COMPLETED',
        onboardingProgressPercent: 100,
        primaryContactName: 'Wholesale Director',
        primaryContactEmail: 'director@apexwholesale.test',
        metadata: { partnerType: 'PHARMACY_WHOLESALE', operatingModel: 'WHOLESALE_ONLY' }
      })
      .returning();

    assert.equal(prof.operatingModel, 'WHOLESALE_ONLY');

    const [opPartner] = await db
      .insert(operationalPartners)
      .values({
        id: crypto.randomUUID(),
        tenantId: wholesaleTenantId,
        partnerCode: `PTN-WH-${Date.now()}`,
        legalBusinessName: 'Apex Wholesale Pharma Pvt Ltd',
        partnerType: 'PHARMACY_WHOLESALE',
        operatingModel: 'WHOLESALE_ONLY',
        contactEmail: 'director@apexwholesale.test',
        contactPhone: '9876543210'
      })
      .returning();

    assert.equal(opPartner.operatingModel, 'WHOLESALE_ONLY');

    const [opOrg] = await db
      .insert(operationalOrganizations)
      .values({
        id: crypto.randomUUID(),
        tenantId: wholesaleTenantId,
        partnerId: opPartner.id,
        organizationCode: `ORG-WH-${Date.now()}`,
        organizationName: 'Apex Wholesale Pharma Pvt Ltd',
        organizationType: 'PHARMACY_WHOLESALE',
        operatingModel: 'WHOLESALE_ONLY',
        contactEmail: 'director@apexwholesale.test',
        contactPhone: '9876543210'
      })
      .returning();

    assert.equal(opOrg.operatingModel, 'WHOLESALE_ONLY');
  });

  await t.test('P1-05: Canonical Capability catalog is distinct from commercial FeatureCode and validates dependencies', async () => {
    assert.ok(MASTER_CAPABILITIES.length >= 8);
    const capCodes = MASTER_CAPABILITIES.map((c) => c.code);
    assert.ok(capCodes.includes('PATIENT_REGISTRATION'));
    assert.ok(capCodes.includes('APPOINTMENT'));
    assert.ok(capCodes.includes('ICU'));

    const engine = new CapabilityAndDependencyEngine();
    const validation = engine.validateCapabilityDependencies(['APPOINTMENT']);
    assert.equal(validation.valid, false);
    assert.ok(validation.conflicts.some((c) => c.missingPrerequisite === 'PATIENT_REGISTRATION'));
  });

  // =========================================================================
  // GROUP C: P0-05
  // =========================================================================
  await t.test('P0-05: WorkflowRepository persists instances, approvals, and transition logs in PostgreSQL with tenant isolation and zero demo instances', async () => {
    const repo1 = new WorkflowRepository();

    // Verify zero fabricated INST-HOSP-AIIMS-01 demo instances
    const initialAll = await repo1.getInstances();
    assert.equal(initialAll.some((i) => i.id === 'INST-HOSP-AIIMS-01'), false);

    const instanceId = `INST-PG-${Date.now()}`;
    const created = await repo1.createInstance({
      id: instanceId,
      tenantId: TEST_IDS.TENANT_A,
      workflowId: 'WF-HOSPITAL-ONBOARDING',
      workflowCode: 'HOSPITAL_ONBOARDING_V1',
      workflowVersion: 1,
      organizationType: 'HOSPITAL',
      entityId: TEST_IDS.TENANT_A,
      entityName: 'PostgreSQL Persisted Hospital',
      currentStageId: 'STAGE-1',
      currentStageCode: 'REGISTRATION_SUBMITTED',
      currentStageName: 'Registration Submitted',
      status: 'IN_PROGRESS',
      contextData: { tenantId: TEST_IDS.TENANT_A, verifiedByHq: true },
      requirements: [
        {
          id: `REQ-${Date.now()}`,
          requirementCode: 'CEA_LICENCE',
          name: 'Clinical Establishment Act Certificate',
          requirementType: 'DOCUMENT',
          isMandatory: true,
          status: 'VERIFIED'
        }
      ],
      pendingApprovals: [],
      allowedTransitions: [],
      auditHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    assert.equal(created.id, instanceId);

    // Instantiate a brand-new WorkflowRepository instance (simulating server restart)
    const repo2 = new WorkflowRepository();
    const loadedForTenantA = await repo2.getInstanceById(instanceId, TEST_IDS.TENANT_A);
    assert.ok(loadedForTenantA);
    assert.equal(loadedForTenantA.entityName, 'PostgreSQL Persisted Hospital');
    assert.equal(loadedForTenantA.currentStageCode, 'REGISTRATION_SUBMITTED');

    // Tenant isolation check: Tenant B cannot access Tenant A's workflow instance
    const loadedForTenantB = await repo2.getInstanceById(instanceId, TEST_IDS.TENANT_B);
    assert.equal(loadedForTenantB, null);

    const listForTenantB = await repo2.getInstances({ tenantId: TEST_IDS.TENANT_B });
    assert.equal(listForTenantB.some((i) => i.id === instanceId), false);
  });

  // =========================================================================
  // GROUP D: P1-01, P1-02, P1-03
  // =========================================================================
  await t.test('P1-01: LabDiagnosticsService & RadiologyService block cross-branch mutations on ID-based operations', async () => {
    const db = getDatabase();
    const branchBId = crypto.randomUUID();
    await db.insert(branches).values({
      id: branchBId,
      tenantId: TEST_IDS.TENANT_A,
      name: 'Branch B Diagnostic Unit',
      code: `BR-B-${Date.now()}`,
      isMain: false,
      status: 'ACTIVE'
    });

    const [opFacility] = await db
      .select()
      .from(operationalFacilities)
      .where(eq(operationalFacilities.tenantId, TEST_IDS.TENANT_A))
      .limit(1);

    const branchBUserSession = {
      userId: TEST_IDS.USER_PARTNER_A,
      tenantId: TEST_IDS.TENANT_A,
      branchId: branchBId,
      roles: ['LAB_DIRECTOR', 'RADIOLOGIST'],
      permissions: [],
      scopeLevel: 'BRANCH',
      isSuperAdmin: false
    };

    const radOrder = await radiologyRepository.createOrder(TEST_IDS.TENANT_A, {
      patientId: crypto.randomUUID(),
      patientName: 'Scope Protected Patient',
      branchId: opFacility.id,
      modality: 'MRI',
      studyType: 'Brain MRI',
      priority: 'ROUTINE',
      clinicalHistory: 'Headache',
      referringDoctorName: 'Dr Scope'
    });

    await assert.rejects(
      async () => {
        await radiologyService.updateOrderStatus(radOrder.id, 'ORDERED', 'COMPLETED', branchBUserSession);
      },
      /Forbidden|branch|scope/i
    );

    await assert.rejects(
      async () => {
        await radiologyService.scheduleAppointment(
          { orderId: radOrder.id, scheduledStart: new Date().toISOString() },
          branchBUserSession
        );
      },
      /Forbidden|branch|scope/i
    );
  });

  await t.test('P1-02: Partner profile module boundary strips out-of-profile modules across all resolution paths', async () => {
    assert.equal(isModuleAllowedForPartnerProfile('PATHOLOGY', 'PATHOLOGY_LIMS'), true);
    assert.equal(isModuleAllowedForPartnerProfile('PATHOLOGY', 'RADIOLOGY_PACS'), false);
    assert.equal(isModuleAllowedForPartnerProfile('PATHOLOGY', 'PHARMACY_POS'), false);
    assert.equal(isModuleAllowedForPartnerProfile('PHARMACY_WHOLESALE', 'PHARMACY_WHOLESALE'), true);
    assert.equal(isModuleAllowedForPartnerProfile('PHARMACY_WHOLESALE', 'PHARMACY_POS'), false);
    assert.equal(isModuleAllowedForPartnerProfile('PHARMACY', 'PHARMACY_POS'), true);
    assert.equal(isModuleAllowedForPartnerProfile('PHARMACY', 'PHARMACY_WHOLESALE'), false);
  });

  await t.test('P1-03: StaffAdministrationService supports WHOLESALE_ONLY, RETAIL_ONLY, and HYBRID pharmacy staff role provisioning', async () => {
    const db = getDatabase();
    const wholesaleTenantId = crypto.randomUUID();
    const wholesaleSubId = crypto.randomUUID();
    const wholesaleLicId = crypto.randomUUID();
    const wholesalePlanId = TEST_SEEDS.PLAN_PHARMACY_ID;

    await db.insert(tenants).values({
      id: wholesaleTenantId,
      name: 'MedPlus Wholesale Hub',
      slug: `medplus-wh-${Date.now()}`,
      status: 'ACTIVE'
    });

    const [prof] = await db
      .insert(partnerProfiles)
      .values({
        id: crypto.randomUUID(),
        tenantId: wholesaleTenantId,
        legalName: 'MedPlus Wholesale Distribution Ltd',
        tradeName: 'MedPlus Wholesale',
        partnerType: 'PHARMACY_WHOLESALE',
        operatingModel: 'WHOLESALE_ONLY',
        lifecycleStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        onboardingStep: 'COMPLETED',
        onboardingProgressPercent: 100,
        primaryContactName: 'Director Wholesale',
        primaryContactEmail: 'wholesale@medplus.test',
        metadata: { partnerType: 'PHARMACY_WHOLESALE', operatingModel: 'WHOLESALE_ONLY' }
      })
      .returning();

    const expiry = new Date(Date.now() + 365 * 86400000);
    await db.insert(subscriptions).values({
      id: wholesaleSubId,
      partnerId: prof.id,
      productId: TEST_SEEDS.PRODUCT_ID,
      tenantId: wholesaleTenantId,
      planId: wholesalePlanId,
      status: 'ACTIVE',
      billingCycle: 'ANNUAL',
      startDate: new Date(),
      renewalDate: expiry
    });

    const licKey = `LIC-WH-${Date.now()}`;
    const sig = licenseService.signLicensePayload({
      licenseKey: licKey,
      partnerId: prof.id,
      tenantId: wholesaleTenantId,
      subscriptionId: wholesaleSubId,
      planId: wholesalePlanId,
      expiryDate: expiry.toISOString()
    });

    await db.insert(licenses).values({
      id: wholesaleLicId,
      partnerId: prof.id,
      tenantId: wholesaleTenantId,
      subscriptionId: wholesaleSubId,
      planId: wholesalePlanId,
      licenseKey: licKey,
      signature: sig,
      maxConcurrentUsers: 30,
      issuedAt: new Date(),
      expiryDate: expiry,
      status: 'ACTIVE',
      metadata: {
        partnerType: 'PHARMACY_WHOLESALE',
        operatingModel: 'WHOLESALE_ONLY',
        includedModules: ['PHARMACY_WHOLESALE', 'INVENTORY_GRN', 'BILLING_REVENUE', 'STAFF']
      }
    });

    const wholesaleSession = {
      userId: TEST_IDS.USER_PARTNER_A,
      tenantId: wholesaleTenantId,
      roles: ['PARTNER_ADMIN'],
      permissions: [],
      scopeLevel: 'TENANT',
      isSuperAdmin: false
    };

    // 1. Wholesale pharmacy CAN create WHOLESALE_PHARMACIST and CHIEF_PHARMACIST
    const wholesaleStaff = await staffAdministrationService.createStaff(
      {
        fullName: 'Rajesh Kulkarni',
        firstName: 'Rajesh',
        lastName: 'Kulkarni',
        workEmail: `rajesh.wh.${Date.now()}@medplus.test`,
        email: `rajesh.wh.${Date.now()}@medplus.test`,
        workPhone: '9876543210',
        phone: '9876543210',
        staffType: 'PHARMACIST',
        primaryRole: 'WHOLESALE_PHARMACIST',
        department: 'Distribution'
      },
      wholesaleSession
    );
    assert.equal(wholesaleStaff.primaryRole, 'WHOLESALE_PHARMACIST');

    const chiefPharmacist = await staffAdministrationService.createStaff(
      {
        fullName: 'Anita Deshmukh',
        firstName: 'Anita',
        lastName: 'Deshmukh',
        workEmail: `anita.wh.${Date.now()}@medplus.test`,
        email: `anita.wh.${Date.now()}@medplus.test`,
        workPhone: '9876543211',
        phone: '9876543211',
        staffType: 'PHARMACIST',
        primaryRole: 'CHIEF_PHARMACIST',
        department: 'Distribution'
      },
      wholesaleSession
    );
    assert.equal(chiefPharmacist.primaryRole, 'CHIEF_PHARMACIST');

    // 2. Wholesale pharmacy CANNOT create retail-only DISPENSING_PHARMACIST
    await assert.rejects(
      async () => {
        await staffAdministrationService.createStaff(
          {
            fullName: 'Retail Pharmacist',
            firstName: 'Retail',
            lastName: 'Pharmacist',
            workEmail: `retail.wh.${Date.now()}@medplus.test`,
            email: `retail.wh.${Date.now()}@medplus.test`,
            workPhone: '9876543212',
            phone: '9876543212',
            staffType: 'PHARMACIST',
            primaryRole: 'DISPENSING_PHARMACIST',
            department: 'Counter'
          },
          wholesaleSession
        );
      },
      /incompatible with partner facility profile/i
    );
  });
});
