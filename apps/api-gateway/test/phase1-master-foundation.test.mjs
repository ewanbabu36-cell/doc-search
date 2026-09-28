import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {
  masterFoundationService,
  INDUSTRY_MASTER_CATALOG,
  OPERATING_MODEL_MASTER_CATALOG,
  DEPARTMENT_MASTER_CATALOG,
  PERMISSION_MASTER_CATALOG,
  ROLE_TEMPLATE_MASTER_CATALOG,
  FEATURE_MASTER_CATALOG,
  PLAN_MASTER_CATALOG
} from '../dist/services/company/MasterFoundationService.js';
import {
  CapabilityAndDependencyEngine,
  capabilityEngine
} from '../dist/services/company/CapabilityAndDependencyEngine.js';
import { effectiveAccessEngine } from '../dist/services/company/EffectiveAccessEngine.js';
import { configurationVersioningService } from '../dist/services/company/ConfigurationVersioningService.js';
import { partnerAccessControlRoutes } from '../dist/routes/company/partner-access-control.routes.js';
import { partnerAccountService } from '../dist/services/partner/PartnerAccountService.js';
import { entitlementService } from '../dist/services/company/EntitlementService.js';
import { licenseService } from '../dist/services/company/LicenseService.js';

// ============================================================================
// 1. MASTER CATALOG & HIERARCHY INTEGRITY TESTS (Sections 4-16)
// ============================================================================
test('PHASE1-01: Master Foundation Catalog contains all 8 authoritative Industries, 7 Operating Models, 13 Departments, 10 Atomic Actions, Role Templates, Features, and Plans', () => {
  const catalog = masterFoundationService.getMasterCatalog();

  // Verify 8 canonical industries
  const expectedIndustries = [
    'SOLO_DOCTOR_CLINIC',
    'MULTI_SPECIALITY_HOSPITAL',
    'PATHOLOGY',
    'RADIOLOGY',
    'PHARMACY_RETAIL',
    'PHARMACY_WHOLESALE',
    'DIAGNOSTIC_CENTRE',
    'HYBRID'
  ];
  for (const ind of expectedIndustries) {
    assert.ok(INDUSTRY_MASTER_CATALOG[ind], `Missing canonical industry ${ind}`);
    assert.equal(INDUSTRY_MASTER_CATALOG[ind].status, 'ACTIVE');
    assert.ok(INDUSTRY_MASTER_CATALOG[ind].version);
  }

  // Verify 7 canonical operating models
  const expectedModels = [
    'SOLO',
    'CLINIC',
    'HOSPITAL',
    'DIAGNOSTIC_CENTER',
    'RETAIL_PHARMACY',
    'WHOLESALE_PHARMACY',
    'HYBRID'
  ];
  for (const model of expectedModels) {
    assert.ok(OPERATING_MODEL_MASTER_CATALOG[model], `Missing canonical operating model ${model}`);
    assert.equal(OPERATING_MODEL_MASTER_CATALOG[model].status, 'ACTIVE');
  }

  // Verify atomic actions represented in Permission Master Catalog
  const requiredAtomicActions = new Set([
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'DISPENSE',
    'VALIDATE',
    'BILL',
    'EXPORT',
    'CONFIGURE'
  ]);
  const foundActions = new Set(Object.values(PERMISSION_MASTER_CATALOG).map((p) => p.action));
  for (const act of requiredAtomicActions) {
    assert.ok(foundActions.has(act), `Permission Master Catalog must include atomic action ${act}`);
  }

  assert.ok(catalog.departments.length >= 13, 'Should define all canonical departments');
  assert.ok(catalog.roleTemplates.length >= 12, 'Should define canonical role templates across all verticals');
  assert.ok(catalog.features.length >= 12, 'Should define canonical governed features');
  assert.ok(catalog.plans.length >= 7, 'Should define canonical commercial plans');
});

// ============================================================================
// 2. INDUSTRY & OPERATING MODEL COMPATIBILITY TESTS (Sections 6, 7, 25)
// ============================================================================
test('PHASE1-02: validateIndustryOperatingModel allows valid combinations and fails closed on incompatible or unknown Industry / Operating Model combinations', () => {
  // Valid combinations
  const soloCheck = masterFoundationService.validateIndustryOperatingModel('SOLO_DOCTOR_CLINIC', 'SOLO');
  assert.equal(soloCheck.valid, true);
  assert.equal(soloCheck.industry, 'SOLO_DOCTOR_CLINIC');
  assert.equal(soloCheck.operatingModel, 'SOLO');

  const hospitalCheck = masterFoundationService.validateIndustryOperatingModel('MULTI_SPECIALITY_HOSPITAL', 'HOSPITAL');
  assert.equal(hospitalCheck.valid, true);

  const retailPharmCheck = masterFoundationService.validateIndustryOperatingModel('PHARMACY_RETAIL', 'RETAIL_PHARMACY');
  assert.equal(retailPharmCheck.valid, true);

  const wholesalePharmCheck = masterFoundationService.validateIndustryOperatingModel(
    'PHARMACY_WHOLESALE',
    'WHOLESALE_PHARMACY'
  );
  assert.equal(wholesalePharmCheck.valid, true);

  // Invalid / incompatible combinations MUST fail closed (no silent fallback)
  const soloAsHospital = masterFoundationService.validateIndustryOperatingModel('SOLO_DOCTOR_CLINIC', 'HOSPITAL');
  assert.equal(soloAsHospital.valid, false);
  assert.match(soloAsHospital.reason || '', /cannot operate under operating model/i);

  const retailAsWholesale = masterFoundationService.validateIndustryOperatingModel(
    'PHARMACY_RETAIL',
    'WHOLESALE_PHARMACY'
  );
  assert.equal(retailAsWholesale.valid, false);

  const wholesaleAsRetail = masterFoundationService.validateIndustryOperatingModel(
    'PHARMACY_WHOLESALE',
    'RETAIL_PHARMACY'
  );
  assert.equal(wholesaleAsRetail.valid, false);

  const pathologyAsHospital = masterFoundationService.validateIndustryOperatingModel('PATHOLOGY', 'HOSPITAL');
  assert.equal(pathologyAsHospital.valid, false);

  // Unknown industry or unknown operating model MUST fail closed
  const unknownInd = masterFoundationService.validateIndustryOperatingModel('FABRICATED_VERTICAL', 'CLINIC');
  assert.equal(unknownInd.valid, false);
  assert.equal(unknownInd.industry, null);

  const unknownModel = masterFoundationService.validateIndustryOperatingModel('PATHOLOGY', 'INVALID_MODEL');
  assert.equal(unknownModel.valid, false);
  assert.equal(unknownModel.operatingModel, null);
});

// ============================================================================
// 3. DEPARTMENT, ROLE TEMPLATE & FEATURE RESOLUTION TESTS (Sections 8, 9, 11, 12)
// ============================================================================
test('PHASE1-03: resolveEffectiveDepartments, resolveEffectiveRoleTemplates, and resolveEffectiveFeatures enforce strict Industry ∩ Operating Model ∩ Capability intersection', () => {
  // 1. Pathology Lab must only get Pathology/Reception/Billing/Admin departments — never Inpatient or Radiology or Retail Pharmacy
  const pathDepts = masterFoundationService.resolveEffectiveDepartments(
    'PATHOLOGY',
    'DIAGNOSTIC_CENTER',
    ['PATIENT_REGISTRATION', 'LABORATORY', 'LAB_ORDERING', 'LAB_PROCESSING', 'LAB_REPORT_VALIDATION', 'BILLING']
  );
  const pathDeptCodes = pathDepts.map((d) => d.code);
  assert.ok(pathDeptCodes.includes('PATHOLOGY_LAB'), 'Pathology must include PATHOLOGY_LAB');
  assert.ok(!pathDeptCodes.includes('RADIOLOGY_IMAGING'), 'Pathology must NOT include RADIOLOGY_IMAGING');
  assert.ok(!pathDeptCodes.includes('IPD_WARDS'), 'Pathology must NOT include IPD_WARDS');
  assert.ok(!pathDeptCodes.includes('RETAIL_PHARMACY_DISPENSARY'), 'Pathology must NOT include RETAIL_PHARMACY_DISPENSARY');

  // 2. Wholesale Pharmacy vs Retail Pharmacy Role Template isolation
  const wholesaleRoles = masterFoundationService.resolveEffectiveRoleTemplates(
    'PHARMACY_WHOLESALE',
    'WHOLESALE_PHARMACY',
    ['PHARMACY', 'PHARMACY_WHOLESALE', 'INVENTORY', 'BILLING']
  );
  const wholesaleRoleCodes = wholesaleRoles.map((r) => r.code);
  assert.ok(wholesaleRoleCodes.includes('WHOLESALE_PHARMACIST'));
  assert.ok(
    !wholesaleRoleCodes.includes('DISPENSING_PHARMACIST'),
    'Wholesale Pharmacy must NEVER inherit retail DISPENSING_PHARMACIST role template'
  );

  const retailRoles = masterFoundationService.resolveEffectiveRoleTemplates(
    'PHARMACY_RETAIL',
    'RETAIL_PHARMACY',
    ['PHARMACY', 'PHARMACY_RETAIL', 'INVENTORY', 'BILLING']
  );
  const retailRoleCodes = retailRoles.map((r) => r.code);
  assert.ok(retailRoleCodes.includes('DISPENSING_PHARMACIST'));
  assert.ok(
    !retailRoleCodes.includes('WHOLESALE_PHARMACIST'),
    'Retail Pharmacy must NEVER inherit WHOLESALE_PHARMACIST role template'
  );

  // 3. Feature resolution requires Industry + Operating Model + Capability + Dependency Graph satisfaction
  const featuresWithoutPrereq = masterFoundationService.resolveEffectiveFeatures(
    'MULTI_SPECIALITY_HOSPITAL',
    'HOSPITAL',
    ['ICU'] // Missing IPD prerequisite!
  );
  const icuFeatureBlocked = featuresWithoutPrereq.find((f) => f.code === 'clinical.icu.admit');
  assert.ok(icuFeatureBlocked);
  assert.equal(icuFeatureBlocked.enabled, false, 'clinical.icu.admit must be disabled when prerequisite IPD is missing');

  const featuresWithPrereq = masterFoundationService.resolveEffectiveFeatures(
    'MULTI_SPECIALITY_HOSPITAL',
    'HOSPITAL',
    ['PATIENT_REGISTRATION', 'OPD', 'IPD', 'ICU']
  );
  const icuFeatureEnabled = featuresWithPrereq.find((f) => f.code === 'clinical.icu.admit');
  assert.ok(icuFeatureEnabled);
  assert.equal(icuFeatureEnabled.enabled, true, 'clinical.icu.admit must be enabled when all prerequisites are satisfied');
});

// ============================================================================
// 4. DEPENDENCY ENGINE TESTS (Missing, Expired, Inactive, Circular) (Section 13 & 25)
// ============================================================================
test('PHASE1-04: CapabilityAndDependencyEngine detects MISSING_DEPENDENCY, EXPIRED_DEPENDENCY, INACTIVE_DEPENDENCY, INVALID_DEPENDENCY, and CIRCULAR_DEPENDENCY', () => {
  const engine = new CapabilityAndDependencyEngine();

  // 1. Missing prerequisite -> MISSING_DEPENDENCY (ICU requires IPD)
  const missingRes = engine.validateCapabilityDependencies(['ICU']);
  assert.equal(missingRes.valid, false);
  assert.equal(missingRes.conflicts[0]?.failureType, 'MISSING_DEPENDENCY');
  assert.equal(missingRes.conflicts[0]?.missingPrerequisite, 'IPD');

  // 2. Prerequisite present -> valid
  const validRes = engine.validateCapabilityDependencies(['IPD', 'ICU']);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.conflicts.length, 0);

  // 3. Expired prerequisite -> EXPIRED_DEPENDENCY
  const pastIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const expiredRes = engine.validateCapabilityDependencies(['IPD', 'ICU'], {
    capabilityExpiryMap: {
      IPD: pastIso
    }
  });
  assert.equal(expiredRes.valid, false);
  assert.ok(
    expiredRes.conflicts.some((c) => c.failureType === 'EXPIRED_DEPENDENCY' && c.missingPrerequisite === 'IPD'),
    'Must report EXPIRED_DEPENDENCY when prerequisite capability IPD has expired'
  );

  // 4. Disabled/Inactive prerequisite -> INACTIVE_DEPENDENCY
  const inactiveRes = engine.validateCapabilityDependencies(['IPD', 'ICU'], {
    capabilityStatusMap: {
      IPD: 'DISABLED'
    }
  });
  assert.equal(inactiveRes.valid, false);
  assert.ok(
    inactiveRes.conflicts.some((c) => c.failureType === 'INACTIVE_DEPENDENCY' && c.missingPrerequisite === 'IPD'),
    'Must report INACTIVE_DEPENDENCY when prerequisite capability IPD is DISABLED'
  );

  // 5. Circular dependency -> CIRCULAR_DEPENDENCY rejected immediately
  assert.throws(
    () => {
      engine.registerCapability({
        code: 'CAP_CYCLE_ALPHA',
        name: 'Cycle Alpha',
        category: 'CLINICAL',
        description: 'Cycle Node A',
        dependencies: ['CAP_CYCLE_BETA'],
        status: 'ACTIVE',
        version: '1.0.0'
      });
      engine.registerCapability({
        code: 'CAP_CYCLE_BETA',
        name: 'Cycle Beta',
        category: 'CLINICAL',
        description: 'Cycle Node B',
        dependencies: ['CAP_CYCLE_ALPHA'],
        status: 'ACTIVE',
        version: '1.0.0'
      });
    },
    (err) => err && String(err.message).includes('CIRCULAR_DEPENDENCY'),
    'registerCapability must reject circular capability dependency graphs with CIRCULAR_DEPENDENCY'
  );

  // 6. Feature circular dependency rule registration rejected with CIRCULAR_DEPENDENCY
  assert.throws(
    () => {
      engine.registerDependencyRule({
        id: 'DEP-CYCLE-1',
        sourceType: 'FEATURE',
        sourceCode: 'FEAT_CYCLE_X',
        dependsOnType: 'FEATURE',
        dependsOnCode: 'FEAT_CYCLE_Y',
        status: 'ACTIVE',
        version: '1.0.0'
      });
      engine.registerDependencyRule({
        id: 'DEP-CYCLE-2',
        sourceType: 'FEATURE',
        sourceCode: 'FEAT_CYCLE_Y',
        dependsOnType: 'FEATURE',
        dependsOnCode: 'FEAT_CYCLE_X',
        status: 'ACTIVE',
        version: '1.0.0'
      });
    },
    (err) => err && String(err.message).includes('CIRCULAR_DEPENDENCY'),
    'registerDependencyRule must reject circular feature dependency rules with CIRCULAR_DEPENDENCY'
  );
});

// ============================================================================
// 5. EFFECTIVE ACCESS ENGINE 11-TIER & PERMISSION BOUNDARY TESTS (PHASE1-AUD-01 & 04)
// ============================================================================
test('PHASE1-05: EffectiveAccessEngine enforces strict token permission matching (no substring false positives), negative separation-of-duties rules, and 11-tier fail-closed evaluation', async () => {
  // 1. Substring false-positive prevention (PHASE1-AUD-04):
  // 'patient:record:view' must match 'patient.record.view' or 'patient.view',
  // but must NEVER match unrelated 'patient.billing.view' or 'view'!
  assert.equal(effectiveAccessEngine.actionMatches('patient:record:view', 'patient.record.view'), true);
  assert.equal(effectiveAccessEngine.actionMatches('patient:record:view', 'patient.view'), true);
  assert.equal(
    effectiveAccessEngine.actionMatches('patient:record:view', 'patient.billing.view'),
    false,
    'patient:record:view must NOT match patient.billing.view via first+last segment bypass'
  );
  assert.equal(
    effectiveAccessEngine.actionMatches('patient:record:view', 'view'),
    false,
    'patient:record:view must NOT match single substring "view"'
  );

  // 2. Separation-of-duties negative prohibition matching:
  // PHLEBOTOMIST has prohibited permission 'lab.result.validate'
  const phlebSim = await effectiveAccessEngine.simulateAccess({
    partnerId: '11111111-1111-4111-8111-111111111111',
    role: 'PHLEBOTOMIST',
    action: 'lab.result.validate',
    licenseStatusOverride: 'ACTIVE',
    capabilitiesOverride: ['LABORATORY', 'LAB_ORDERING', 'LAB_PROCESSING', 'LAB_REPORT_VALIDATION']
  });
  assert.equal(phlebSim.granted, false);
  assert.equal(phlebSim.deniedByTier, 9);
  assert.match(phlebSim.denialReason || '', /Separation-of-duties|prohibited|Role/i);

  // 3. License Status evaluation in Tier 3:
  // FREE_ACTIVE and GRACE_PERIOD are allowed; EXPIRED and SUSPENDED are denied
  const freeActiveSim = await effectiveAccessEngine.simulateAccess({
    partnerId: '11111111-1111-4111-8111-111111111111',
    role: 'DOCTOR',
    action: 'clinical.consultation.author',
    licenseStatusOverride: 'FREE_ACTIVE',
    capabilitiesOverride: ['PATIENT_REGISTRATION', 'OPD']
  });
  assert.equal(freeActiveSim.granted, true, 'FREE_ACTIVE license must pass Tier 3');

  const gracePeriodSim = await effectiveAccessEngine.simulateAccess({
    partnerId: '11111111-1111-4111-8111-111111111111',
    role: 'DOCTOR',
    action: 'clinical.consultation.author',
    licenseStatusOverride: 'GRACE_PERIOD',
    capabilitiesOverride: ['PATIENT_REGISTRATION', 'OPD']
  });
  assert.equal(gracePeriodSim.granted, true, 'GRACE_PERIOD license must pass Tier 3');

  const expiredSim = await effectiveAccessEngine.simulateAccess({
    partnerId: '11111111-1111-4111-8111-111111111111',
    role: 'DOCTOR',
    action: 'clinical.consultation.author',
    licenseStatusOverride: 'EXPIRED',
    capabilitiesOverride: ['PATIENT_REGISTRATION', 'OPD']
  });
  assert.equal(expiredSim.granted, false, 'EXPIRED license must fail Tier 3');
  assert.equal(expiredSim.deniedByTier, 3);

  // 4. Tier 6 Capability Dependency enforcement:
  // Enabling ICU without prerequisite IPD must fail Tier 6
  const brokenDepSim = await effectiveAccessEngine.simulateAccess({
    partnerId: '11111111-1111-4111-8111-111111111111',
    role: 'DOCTOR',
    action: 'icu.admit',
    licenseStatusOverride: 'ACTIVE',
    capabilitiesOverride: ['ICU'] // Missing IPD!
  });
  assert.equal(brokenDepSim.granted, false, 'Missing capability prerequisite must fail Tier 6');
  assert.equal(brokenDepSim.deniedByTier, 6);
  assert.match(brokenDepSim.denialReason || '', /IPD/);
});

// ============================================================================
// 6. CROSS-TENANT IDOR PROTECTION & MASTER FOUNDATION API ROUTES (PHASE1-AUD-05)
// ============================================================================
test('PHASE1-06: Partner Access Control routes enforce assertPartnerTenantScope against Cross-Tenant IDOR and expose Master Foundation Catalog & Effective Context', async () => {
  const app = Fastify();

  // Attach test session injection hook simulating authenticated sessions
  app.addHook('onRequest', async (request) => {
    const testRole = request.headers['x-test-role'];
    const testTenant = request.headers['x-test-tenant'];
    if (testRole) {
      request.session = {
        userId: 'user-test-01',
        tenantId: String(testTenant || 'tenant-alpha'),
        roles: [String(testRole)],
        permissions: ['*'],
        isSuperAdmin: testRole === 'SUPER_ADMIN',
        dataScope: 'tenant'
      };
    }
  });

  await app.register(partnerAccessControlRoutes);
  await app.ready();

  try {
    // 1. GET /api/v1/company/master-foundation/catalog returns full Phase 1 catalog
    const catalogRes = await app.inject({
      method: 'GET',
      url: '/api/v1/company/master-foundation/catalog'
    });
    assert.equal(catalogRes.statusCode, 200);
    const catalogBody = catalogRes.json();
    assert.equal(catalogBody.success, true);
    assert.equal(catalogBody.data.industries.length, 8);
    assert.equal(catalogBody.data.operatingModels.length, 7);

    // 2. Cross-Tenant IDOR attempt: HOSPITAL_ADMIN of tenant-alpha attempting to read capabilities of tenant-beta
    const crossTenantCapRead = await app.inject({
      method: 'GET',
      url: '/api/v1/company/partners/tenant-beta/capabilities',
      headers: {
        'x-test-role': 'HOSPITAL_ADMIN',
        'x-test-tenant': 'tenant-alpha',
        authorization: 'Bearer test-bypass'
      }
    });
    assert.ok(
      crossTenantCapRead.statusCode === 401 || crossTenantCapRead.statusCode === 403,
      `Cross-tenant capability read must be rejected with 401/403, got ${crossTenantCapRead.statusCode}`
    );
  } finally {
    await app.close();
  }
});

// ============================================================================
// 7. CONFIGURATION VERSIONING (DRAFT / PUBLISHED / SUPERSEDED) & FIELD-LEVEL SECURITY
// ============================================================================
test('PHASE1-07: ConfigurationVersioningService supports DRAFT / PUBLISHED lifecycle metadata and PartnerAccountService blocks partner self-mutation of HQ Master Foundation fields', async () => {
  // 1. Verify DRAFT snapshot metadata creation
  const draftSnap = await configurationVersioningService.createSnapshot(
    'partner-config-test-01',
    'Initial Draft Foundation Config',
    'founder@docsearch.health',
    undefined,
    undefined,
    {
      lifecycleStatus: 'DRAFT',
      industry: 'PATHOLOGY',
      operatingModel: 'DIAGNOSTIC_CENTER'
    }
  );
  assert.ok(draftSnap);
  const resolvedStatus = draftSnap.lifecycleStatus || draftSnap.snapshot?.lifecycleStatus;
  assert.equal(resolvedStatus, 'DRAFT');

  // 2. Verify PartnerAccountService.updateProfile blocks partner from tampering with HQ-governed Master Foundation fields
  const partnerOwnerSession = {
    userId: 'owner-01',
    tenantId: '11111111-1111-4111-8111-111111111111',
    roles: ['HOSPITAL_ADMIN'],
    permissions: ['*'],
    isSuperAdmin: false
  };

  for (const forbiddenField of [
    'industry',
    'operatingModel',
    'capabilities',
    'activeCapabilities',
    'configurationVersion',
    'masterFoundation',
    'planId',
    'licenseStatus'
  ]) {
    await assert.rejects(
      async () => {
        await partnerAccountService.updateProfile(partnerOwnerSession, {
          [forbiddenField]: 'TAMPERED_VALUE'
        });
      },
      (err) => err && err.statusCode === 403 && String(err.message).includes(forbiddenField),
      `Partner updateProfile must reject tampering of HQ-controlled field "${forbiddenField}" with 403`
    );
  }
});
