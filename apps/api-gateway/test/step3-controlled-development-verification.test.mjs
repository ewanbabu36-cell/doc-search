import test from 'node:test';
import assert from 'node:assert/strict';
import { ScopeGuard } from '@docsearch/auth';
import { WorkflowRepository, workflowInstances } from '@docsearch/database';
import { resolveVerticalPlan } from '../dist/services/company/PartnerSyncService.js';
import { licenseService } from '../dist/services/company/LicenseService.js';
import { entitlementService } from '../dist/services/company/EntitlementService.js';
import { licenseRepository } from '../dist/repositories/company/LicenseRepository.js';
import { productRepository } from '../dist/repositories/company/ProductRepository.js';
import { toDeterministicUuid } from '../dist/repositories/company/PartnerOnboardingRepository.js';
import { StaffAdministrationService } from '../dist/services/partner/StaffAdministrationService.js';
import { LabDiagnosticsService } from '../dist/services/partner/LabDiagnosticsService.js';
import { RadiologyService } from '../dist/services/partner/RadiologyService.js';
import { labDiagnosticsRepository } from '../dist/repositories/partner/LabDiagnosticsRepository.js';
import { radiologyRepository } from '../dist/repositories/partner/RadiologyRepository.js';
import { auditRepository } from '../dist/repositories/core/AuditRepository.js';

// ============================================================================
// 1. P0-01: PartnerSyncService.resolveVerticalPlan Wholesale Pharmacy Resolution
// ============================================================================
test('STEP3-P0-01: resolveVerticalPlan resolves PHARMACY_WHOLESALE to plan-pharma-wholesale-* and prod-pharma-wholesale without corrupting to Clinic starter plan', () => {
  const wholesaleFounding = resolveVerticalPlan(
    { id: 'plan-pharma-wholesale-free-yr1', tier: 'FOUNDING', price: 0 },
    null,
    'PHARMACY_WHOLESALE',
    'FOUNDING'
  );
  assert.equal(wholesaleFounding.planId, toDeterministicUuid('plan-pharma-wholesale-free-yr1'));
  assert.equal(wholesaleFounding.productId, toDeterministicUuid('prod-pharma-wholesale'));
  assert.notEqual(wholesaleFounding.planId, toDeterministicUuid('plan-clinic-free-yr1'));

  const wholesaleAnnual = resolveVerticalPlan(
    { id: 'plan-pharma-wholesale-annual-yr2', tier: 'ANNUAL', price: 25000 },
    null,
    'PHARMACY_WHOLESALE',
    'ANNUAL'
  );
  assert.equal(wholesaleAnnual.planId, toDeterministicUuid('plan-pharma-wholesale-annual-yr2'));
  assert.equal(wholesaleAnnual.productId, toDeterministicUuid('prod-pharma-wholesale'));

  const wholesaleByVerticalFallback = resolveVerticalPlan(null, null, 'PHARMACY_WHOLESALE', 'FOUNDING');
  assert.equal(wholesaleByVerticalFallback.planId, toDeterministicUuid('plan-pharma-wholesale-free-yr1'));
  assert.equal(wholesaleByVerticalFallback.productId, toDeterministicUuid('prod-pharma-wholesale'));
});

// ============================================================================
// 2. P0-02: LicenseService.verifyLicenseSignature Strict HMAC Enforcement
// ============================================================================
test('STEP3-P0-02: LicenseService.verifyLicenseSignature enforces HMAC-SHA256 in production/strict mode and rejects fake SIG-PROD-2026-/seed_signature strings', () => {
  const expiryIso = new Date(Date.now() + 365 * 86400 * 1000).toISOString();
  const validHmacSig = licenseService.signLicensePayload({
    licenseKey: 'LIC-2026-WHOL-12345678',
    partnerId: '11111111-1111-4111-8111-111111111111',
    tenantId: '22222222-2222-4222-8222-222222222222',
    subscriptionId: '33333333-3333-4333-8333-333333333333',
    planId: toDeterministicUuid('plan-pharma-wholesale-free-yr1'),
    expiryDate: expiryIso
  });

  const validLicense = {
    licenseKey: 'LIC-2026-WHOL-12345678',
    partnerId: '11111111-1111-4111-8111-111111111111',
    tenantId: '22222222-2222-4222-8222-222222222222',
    subscriptionId: '33333333-3333-4333-8333-333333333333',
    planId: toDeterministicUuid('plan-pharma-wholesale-free-yr1'),
    expiryDate: new Date(expiryIso),
    signature: validHmacSig
  };

  const forgedSeedLicense = {
    ...validLicense,
    signature: 'SIG-PROD-2026-forged-bypass'
  };

  const prevStrict = process.env['STRICT_LICENSE_HMAC'];
  process.env['STRICT_LICENSE_HMAC'] = 'true';
  try {
    assert.equal(licenseService.verifyLicenseSignature(validLicense), true, 'Valid HMAC-SHA256 signature must pass in strict mode');
    assert.equal(licenseService.verifyLicenseSignature(forgedSeedLicense), false, 'Fake SIG-PROD-2026- signature must be rejected in strict/production mode');
  } finally {
    if (prevStrict === undefined) {
      delete process.env['STRICT_LICENSE_HMAC'];
    } else {
      process.env['STRICT_LICENSE_HMAC'] = prevStrict;
    }
  }
});

// ============================================================================
// 3. P0-03 & P1-01: ScopeGuard Seeded Facility Restriction & Lab/Radiology ID Mutation Scope
// ============================================================================
test('STEP3-P0-03-P1-01: ScopeGuard blocks real branch-scoped users from accessing 0002/0003 records and enforces assertRecordInScope on Lab & Radiology ID mutations', async () => {
  const branchBSession = {
    userId: 'user-branch-b',
    tenantId: '00000000-0000-4000-8000-000000000001',
    branchId: 'branch-B',
    dataScope: 'branch',
    roles: ['PATHOLOGIST', 'RADIOLOGIST'],
    permissions: ['lab:results:validate'],
    isSuperAdmin: false
  };

  // 1. ScopeGuard must NOT exempt 00000000-0000-4000-8000-000000000002 when session is scoped to 'branch-B'
  assert.throws(
    () =>
      ScopeGuard.assertRecordInScope(branchBSession, {
        id: 'rec-seeded-0002',
        tenantId: '00000000-0000-4000-8000-000000000001',
        branchId: '00000000-0000-4000-8000-000000000002'
      }),
    (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
    'Real branch-B session must NOT be allowed to mutate 0002 seeded branch record'
  );

  // 2. LabDiagnosticsService ID-based mutations must enforce ScopeGuard.assertRecordInScope
  const labService = new LabDiagnosticsService();
  const origGetOrderById = labDiagnosticsRepository.getOrderById.bind(labDiagnosticsRepository);
  labDiagnosticsRepository.getOrderById = async (tenantId, orderId) => ({
    id: orderId,
    tenantId,
    branchId: 'branch-A',
    departmentId: 'dept-pathology'
  });

  try {
    await assert.rejects(
      async () => labService.verifyResult('lab-order-branch-a', branchBSession),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'LabDiagnosticsService.verifyResult must block branch-B user from verifying branch-A lab order'
    );

    await assert.rejects(
      async () => labService.cancelOrder('lab-order-branch-a', 'Wrong branch test', branchBSession),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'LabDiagnosticsService.cancelOrder must block branch-B user from cancelling branch-A lab order'
    );
  } finally {
    labDiagnosticsRepository.getOrderById = origGetOrderById;
  }

  // 3. RadiologyService ID-based mutations must enforce ScopeGuard.assertRecordInScope
  const radService = new RadiologyService();
  const origFindRadOrderById = radiologyRepository.findOrderById.bind(radiologyRepository);
  const origFindRadReportById = radiologyRepository.findReportById.bind(radiologyRepository);
  radiologyRepository.findOrderById = async (orderId, tenantId) => ({
    id: orderId,
    tenantId,
    branchId: 'branch-A'
  });
  radiologyRepository.findReportById = async (reportId, tenantId) => ({
    id: reportId,
    tenantId,
    branchId: 'branch-A'
  });

  try {
    await assert.rejects(
      async () => radService.updateOrderStatus('rad-order-branch-a', 'ORDERED', 'IN_PROGRESS', branchBSession),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'RadiologyService.updateOrderStatus must block branch-B user from mutating branch-A imaging order'
    );

    await assert.rejects(
      async () => radService.finalizeReport('rad-report-branch-a', {}, branchBSession),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'RadiologyService.finalizeReport must block branch-B user from finalizing branch-A radiology report'
    );
  } finally {
    radiologyRepository.findOrderById = origFindRadOrderById;
    radiologyRepository.findReportById = origFindRadReportById;
  }
});

// ============================================================================
// 4. P0-04: AuditRepository Tenant & Actor Attribution Preservation
// ============================================================================
test('STEP3-P0-04: AuditRepository preserves tenantId, actorId, and branchId attribution even when offline/fallback', async () => {
  const session = {
    userId: '55555555-5555-4555-8555-555555555555',
    tenantId: '66666666-6666-4666-8666-666666666666',
    branchId: '77777777-7777-4777-8777-777777777777',
    roles: ['PARTNER_ADMIN'],
    permissions: [],
    isSuperAdmin: false
  };

  const event = await auditRepository.recordEvent(
    {
      eventType: 'STEP3_AUDIT_VERIFICATION',
      resourceType: 'verification_gate',
      resourceId: 'gate-01',
      tenantId: session.tenantId,
      branchId: session.branchId,
      metadata: { check: 'strict-attribution' }
    },
    session,
    null
  );

  assert.equal(event.tenantId, session.tenantId, 'Audit event must preserve non-null tenantId');
  assert.equal(event.metadata.preservedTenantId, session.tenantId);
  assert.equal(event.metadata.preservedActorId, session.userId);
  assert.equal(event.metadata.preservedBranchId, session.branchId);
});

// ============================================================================
// 5. P0-05: WorkflowRepository Zero-State (No Fake AIIMS Demo Instance) & Tenant Schema
// ============================================================================
test('STEP3-P0-05: WorkflowRepository starts in legitimate zero-state without fake INST-HOSP-AIIMS-01 instance and workflowInstances has tenantId column', async () => {
  const wfRepo = new WorkflowRepository();
  const initialInstances = await wfRepo.getInstances();
  assert.equal(
    initialInstances.some((inst) => inst.id === 'INST-HOSP-AIIMS-01' || inst.entityName?.includes('AIIMS')),
    false,
    'WorkflowRepository must not seed fabricated AIIMS hospital workflow instances'
  );
  assert.equal(initialInstances.length, 0, 'WorkflowRepository must start in a legitimate zero-state (0 instances)');
  assert.ok(workflowInstances.tenantId, 'workflow_instances Drizzle schema must define tenantId column');
});

// ============================================================================
// 6. P1-02 & P1-03: EntitlementService DB Match Profile Boundary & Wholesale Staff Role Provisioning
// ============================================================================
test('STEP3-P1-02-P1-03: EntitlementService blocks out-of-profile DB plan_entitlements and StaffAdministrationService allows PHARMACY_WHOLESALE staff roles', async () => {
  const origFindByTenantId = licenseRepository.findByTenantId.bind(licenseRepository);
  const origVerifySig = licenseService.verifyLicenseSignature.bind(licenseService);
  const origEvalStatus = licenseService.evaluateLicenseStatus.bind(licenseService);
  const origGetPlanEntitlements = productRepository.getPlanEntitlements.bind(productRepository);

  licenseRepository.findByTenantId = async (tenantId) => [
    {
      id: `lic-${tenantId}`,
      tenantId,
      planId: toDeterministicUuid('plan-pharma-wholesale-free-yr1'),
      status: 'FREE_ACTIVE',
      metadata: { partnerType: 'PHARMACY_WHOLESALE' }
    }
  ];
  licenseService.verifyLicenseSignature = () => true;
  licenseService.evaluateLicenseStatus = () => ({
    status: 'FREE_ACTIVE',
    isAccessAllowed: true,
    isInGracePeriod: false,
    daysRemaining: 365
  });
  // Simulate corrupted DB plan_entitlements returning RADIOLOGY_PACS and PHARMACY_POS for a PHARMACY_WHOLESALE tenant
  productRepository.getPlanEntitlements = async () => [
    { code: 'RADIOLOGY_PACS', value: { enabled: true } },
    { code: 'PHARMACY_POS', value: { enabled: true } },
    { code: 'PHARMACY_WHOLESALE', value: { enabled: true } }
  ];

  try {
    // P1-02: Even when DB plan_entitlements has RADIOLOGY_PACS and PHARMACY_POS, PHARMACY_WHOLESALE profile boundary must deny them
    assert.equal(
      await entitlementService.canAccess('tenant-wholesale-strict', 'RADIOLOGY_PACS'),
      false,
      'EntitlementService.canAccess must reject RADIOLOGY_PACS for PHARMACY_WHOLESALE even if present in DB plan_entitlements'
    );
    assert.equal(
      await entitlementService.canAccess('tenant-wholesale-strict', 'PHARMACY_POS'),
      false,
      'EntitlementService.canAccess must reject retail PHARMACY_POS for PHARMACY_WHOLESALE even if present in DB plan_entitlements'
    );
    assert.equal(
      await entitlementService.canAccess('tenant-wholesale-strict', 'PHARMACY_WHOLESALE'),
      true,
      'EntitlementService.canAccess must allow PHARMACY_WHOLESALE for PHARMACY_WHOLESALE profile'
    );

    // P1-03: StaffAdministrationService must allow PHARMACY_WHOLESALE tenant to validate CHIEF_PHARMACIST and PHARMACY_INVENTORY_CONTROLLER, while blocking DISPENSING_PHARMACIST
    const staffService = new StaffAdministrationService();
    const wholesaleSession = {
      userId: 'admin-wholesale',
      tenantId: 'tenant-wholesale-strict',
      facilityType: 'PHARMACY_WHOLESALE',
      roles: ['PARTNER_ADMIN'],
      permissions: [],
      isSuperAdmin: false
    };

    await assert.doesNotReject(
      async () => staffService.validateRoleAndEntitlementAndProfile('CHIEF_PHARMACIST', wholesaleSession),
      'PHARMACY_WHOLESALE tenant must be allowed to assign CHIEF_PHARMACIST role'
    );
    await assert.doesNotReject(
      async () => staffService.validateRoleAndEntitlementAndProfile('PHARMACY_INVENTORY_CONTROLLER', wholesaleSession),
      'PHARMACY_WHOLESALE tenant must be allowed to assign PHARMACY_INVENTORY_CONTROLLER role'
    );
    await assert.rejects(
      async () => staffService.validateRoleAndEntitlementAndProfile('DISPENSING_PHARMACIST', wholesaleSession),
      (err) => err.statusCode === 403,
      'PHARMACY_WHOLESALE tenant must be blocked from assigning retail DISPENSING_PHARMACIST role'
    );
  } finally {
    licenseRepository.findByTenantId = origFindByTenantId;
    licenseService.verifyLicenseSignature = origVerifySig;
    licenseService.evaluateLicenseStatus = origEvalStatus;
    productRepository.getPlanEntitlements = origGetPlanEntitlements;
  }
});
