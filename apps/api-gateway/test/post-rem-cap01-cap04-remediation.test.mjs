/**
 * DOC SEARCH — POST-REM-CAP-01 → POST-REM-CAP-04 REMEDIATION & ADVERSARIAL VERIFICATION SUITE
 *
 * Verifies:
 * - POST-REM-CAP-01: EntitlementService wholesale prefix separation & wholesale plan IDs (plan-pharma-wholesale-free-yr1, plan-pharma-wholesale-annual-yr2)
 * - POST-REM-CAP-02: Branch & Department ScopeGuard propagation across LabDiagnosticsService, RadiologyService, PharmacyManagementService, and InpatientManagementService
 * - POST-REM-CAP-03: Server-side PARTNER_PROFILE_ALLOWED_MODULES[partnerType] intersection in commercial-guard.ts (requireModuleCommercialAccess) & EntitlementService
 * - POST-REM-CAP-04: Partner-platform localStorage tenant:user namespacing (docsearch:${tenantId}:${userId}:<key>) and logout purge
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import module from 'node:module';

if (typeof module.registerHooks === 'function') {
  module.registerHooks({
    resolve(specifier, context, nextResolve) {
      try {
        return nextResolve(specifier, context);
      } catch (err) {
        if (specifier.startsWith('.')) {
          if (specifier.endsWith('.js')) {
            return nextResolve(specifier.replace(/\.js$/, '.ts'), context);
          }
          if (!specifier.endsWith('.ts')) {
            return nextResolve(`${specifier}.ts`, context);
          }
        }
        throw err;
      }
    }
  });
}

import {
  PARTNER_PROFILE_ALLOWED_MODULES,
  isModuleAllowedForPartnerProfile
} from '@docsearch/shared-core';
import { ScopeGuard } from '@docsearch/auth';
import { entitlementService } from '../dist/services/company/EntitlementService.js';
import { licenseRepository } from '../dist/repositories/company/LicenseRepository.js';
import { licenseService } from '../dist/services/company/LicenseService.js';
import { productRepository } from '../dist/repositories/company/ProductRepository.js';
import { documentVerificationRepository } from '../dist/repositories/core/DocumentVerificationRepository.js';
import { toDeterministicUuid } from '../dist/repositories/company/PartnerOnboardingRepository.js';
import {
  requireModuleCommercialAccess,
  enforcePartnerProfileModuleBoundary
} from '../dist/plugins/commercial-guard.js';
import { LabDiagnosticsService } from '../dist/services/partner/LabDiagnosticsService.js';
import { RadiologyService } from '../dist/services/partner/RadiologyService.js';
import { PharmacyManagementService } from '../dist/services/partner/PharmacyManagementService.js';
import { InpatientManagementService } from '../dist/services/partner/InpatientManagementService.js';
import { ClinicalWorkflowService } from '../dist/services/partner/ClinicalWorkflowService.js';
import { BillingManagementService } from '../dist/services/partner/BillingManagementService.js';
import { labDiagnosticsRepository } from '../dist/repositories/partner/LabDiagnosticsRepository.js';
import { radiologyRepository } from '../dist/repositories/partner/RadiologyRepository.js';
import { pharmacyManagementRepository } from '../dist/repositories/partner/PharmacyManagementRepository.js';
import { inpatientManagementRepository } from '../dist/repositories/partner/InpatientManagementRepository.js';

import {
  PatientSessionTabService,
  resolveClientSessionIdentity
} from '../../partner-platform/src/services/patient-session-tab-service.ts';
import {
  PharmacyOfflineStorageService
} from '../../partner-platform/src/services/pharmacy-offline-storage-service.ts';
import {
  clearAllAuthTokens
} from '../../partner-platform/src/services/api-client.ts';

// ============================================================================
// 1. POST-REM-CAP-01: Retail vs Wholesale Pharmacy Entitlement & Plan IDs
// ============================================================================
test('POST-REM-CAP-01: Retail and Wholesale Pharmacy entitlements are strictly separated and wholesale plan IDs are recognized', async () => {
  const origFindByTenantId = licenseRepository.findByTenantId.bind(licenseRepository);
  const origVerifySig = licenseService.verifyLicenseSignature.bind(licenseService);
  const origEvalStatus = licenseService.evaluateLicenseStatus.bind(licenseService);
  const origGetPlanEntitlements = productRepository.getPlanEntitlements.bind(productRepository);

  const mockLicensesByTenant = new Map();

  licenseRepository.findByTenantId = async (tenantId) => {
    const lic = mockLicensesByTenant.get(tenantId);
    return lic ? [lic] : [];
  };
  licenseService.verifyLicenseSignature = () => true;
  licenseService.evaluateLicenseStatus = (lic) => ({
    status: lic.status,
    isAccessAllowed: lic.status === 'ACTIVE' || lic.status === 'FREE_ACTIVE',
    isInGracePeriod: false,
    daysRemaining: 300
  });
  productRepository.getPlanEntitlements = async () => [];

  try {
    // 1. Retail Pharmacy on plan-pharma-free-yr1
    mockLicensesByTenant.set('tenant-retail-yr1', {
      id: 'lic-retail-1',
      tenantId: 'tenant-retail-yr1',
      planId: toDeterministicUuid('plan-pharma-free-yr1'),
      status: 'FREE_ACTIVE',
      metadata: { partnerType: 'PHARMACY' }
    });

    assert.equal(await entitlementService.canAccess('tenant-retail-yr1', 'PHARMACY'), true, 'Retail pharmacy must access PHARMACY');
    assert.equal(await entitlementService.canAccess('tenant-retail-yr1', 'PHARMACY_POS'), true, 'Retail pharmacy must access PHARMACY_POS');
    assert.equal(
      await entitlementService.canAccess('tenant-retail-yr1', 'PHARMACY_WHOLESALE'),
      false,
      'PHARMACY_WHOLESALE must NOT match retail PHARMACY_ prefix rule on plan-pharma-free-yr1'
    );

    // 2. Retail Pharmacy on includedModules: ['PHARMACY_POS']
    mockLicensesByTenant.set('tenant-retail-meta', {
      id: 'lic-retail-meta',
      tenantId: 'tenant-retail-meta',
      planId: 'custom-retail-plan',
      status: 'ACTIVE',
      metadata: { partnerType: 'PHARMACY', includedModules: ['PHARMACY_POS', 'BILLING'] }
    });

    assert.equal(await entitlementService.canAccess('tenant-retail-meta', 'PHARMACY_POS'), true);
    assert.equal(
      await entitlementService.canAccess('tenant-retail-meta', 'PHARMACY_WHOLESALE'),
      false,
      'PHARMACY_WHOLESALE must NOT match retail includedModules PHARMACY_POS'
    );

    // 3. Wholesale Pharmacy on plan-pharma-wholesale-free-yr1
    mockLicensesByTenant.set('tenant-wholesale-yr1', {
      id: 'lic-wholesale-1',
      tenantId: 'tenant-wholesale-yr1',
      planId: toDeterministicUuid('plan-pharma-wholesale-free-yr1'),
      status: 'FREE_ACTIVE',
      metadata: { partnerType: 'PHARMACY_WHOLESALE' }
    });

    assert.equal(
      await entitlementService.canAccess('tenant-wholesale-yr1', 'PHARMACY_WHOLESALE'),
      true,
      'plan-pharma-wholesale-free-yr1 must grant PHARMACY_WHOLESALE'
    );
    assert.equal(
      await entitlementService.canAccess('tenant-wholesale-yr1', 'PHARMACY'),
      true,
      'plan-pharma-wholesale-free-yr1 must grant shared PHARMACY inventory capability'
    );
    assert.equal(
      await entitlementService.canAccess('tenant-wholesale-yr1', 'PHARMACY_POS'),
      false,
      'plan-pharma-wholesale-free-yr1 must NOT grant retail PHARMACY_POS counter dispensing'
    );

    // 4. Wholesale Pharmacy on plan-pharma-wholesale-annual-yr2
    mockLicensesByTenant.set('tenant-wholesale-yr2', {
      id: 'lic-wholesale-2',
      tenantId: 'tenant-wholesale-yr2',
      planId: toDeterministicUuid('plan-pharma-wholesale-annual-yr2'),
      status: 'ACTIVE',
      metadata: { partnerType: 'PHARMACY_WHOLESALE' }
    });

    assert.equal(
      await entitlementService.canAccess('tenant-wholesale-yr2', 'PHARMACY_WHOLESALE'),
      true,
      'plan-pharma-wholesale-annual-yr2 must grant PHARMACY_WHOLESALE'
    );
    assert.equal(
      await entitlementService.canAccess('tenant-wholesale-yr2', 'PHARMACY_POS'),
      false,
      'plan-pharma-wholesale-annual-yr2 must NOT grant retail PHARMACY_POS'
    );

    // 5. Combo Clinic + Pharmacy (plan-combo-crx-free-yr1)
    mockLicensesByTenant.set('tenant-combo-crx', {
      id: 'lic-combo-crx',
      tenantId: 'tenant-combo-crx',
      planId: toDeterministicUuid('plan-combo-crx-free-yr1'),
      status: 'FREE_ACTIVE',
      metadata: { partnerType: 'COMBO_CLINIC_PHARMACY' }
    });

    assert.equal(await entitlementService.canAccess('tenant-combo-crx', 'PHARMACY_POS'), true);
    assert.equal(await entitlementService.canAccess('tenant-combo-crx', 'CLINICAL_EMR'), true);
    assert.equal(
      await entitlementService.canAccess('tenant-combo-crx', 'PHARMACY_WHOLESALE'),
      false,
      'Combo Clinic+Pharmacy must NOT receive PHARMACY_WHOLESALE'
    );
  } finally {
    licenseRepository.findByTenantId = origFindByTenantId;
    licenseService.verifyLicenseSignature = origVerifySig;
    licenseService.evaluateLicenseStatus = origEvalStatus;
    productRepository.getPlanEntitlements = origGetPlanEntitlements;
  }
});

// ============================================================================
// 2. POST-REM-CAP-02: Branch / Department ScopeGuard Propagation
// ============================================================================
test('POST-REM-CAP-02: LabDiagnosticsService, RadiologyService, PharmacyManagementService, and InpatientManagementService enforce branch and department ScopeGuard', async () => {
  const labService = new LabDiagnosticsService();
  const radService = new RadiologyService();
  const pharmService = new PharmacyManagementService();
  const ipdService = new InpatientManagementService();
  const clinicalService = new ClinicalWorkflowService();
  const billingService = new BillingManagementService();

  // Stub repository methods to return multi-branch and multi-department records for tenant-A
  const origSearchLabOrders = labDiagnosticsRepository.searchOrders.bind(labDiagnosticsRepository);
  const origGetLabOrderById = labDiagnosticsRepository.getOrderById.bind(labDiagnosticsRepository);
  const origFindManyRadOrders = radiologyRepository.findManyOrders.bind(radiologyRepository);
  const origGetPharmRxQueue = pharmacyManagementRepository.getPrescriptionQueue.bind(pharmacyManagementRepository);
  const origGetIpdAdmissions = inpatientManagementRepository.getAdmissions.bind(inpatientManagementRepository);

  labDiagnosticsRepository.searchOrders = async (tenantId) => [
    { id: 'lab-1', tenantId, branchId: 'branch-A', departmentId: 'dept-pathology', testCode: 'CBC' },
    { id: 'lab-2', tenantId, branchId: 'branch-B', departmentId: 'dept-pathology', testCode: 'LFT' },
    { id: 'lab-3', tenantId, branchId: 'branch-A', departmentId: 'dept-micro', testCode: 'CULTURE' }
  ];
  labDiagnosticsRepository.getOrderById = async (tenantId, orderId) => {
    if (orderId === 'lab-branch-B') {
      return { id: 'lab-branch-B', tenantId, branchId: 'branch-B', departmentId: 'dept-pathology' };
    }
    return { id: orderId, tenantId, branchId: 'branch-A', departmentId: 'dept-pathology' };
  };
  radiologyRepository.findManyOrders = async ({ tenantId }) => ({
    items: [
      { id: 'rad-1', tenantId, branchId: 'branch-A', orderingDepartment: 'dept-radiology' },
      { id: 'rad-2', tenantId, branchId: 'branch-B', orderingDepartment: 'dept-radiology' }
    ],
    total: 2
  });
  pharmacyManagementRepository.getPrescriptionQueue = async (tenantId) => [
    { id: 'rx-1', tenantId, branchId: 'branch-A', departmentId: 'dept-pharmacy' },
    { id: 'rx-2', tenantId, branchId: 'branch-B', departmentId: 'dept-pharmacy' }
  ];
  inpatientManagementRepository.getAdmissions = async (tenantId) => [
    { id: 'adm-1', tenantId, branchId: 'branch-A', departmentId: 'dept-ipd-med' },
    { id: 'adm-2', tenantId, branchId: 'branch-B', departmentId: 'dept-ipd-surg' },
    { id: 'adm-3', tenantId, branchId: 'branch-A', departmentId: 'dept-ipd-surg' }
  ];

  const branchASession = {
    userId: 'user-branch-a',
    tenantId: '00000000-0000-4000-8000-000000000001',
    branchId: 'branch-A',
    dataScope: 'branch',
    roles: ['LAB_TECHNICIAN'],
    permissions: [],
    isSuperAdmin: false
  };

  const deptPathologySession = {
    userId: 'user-dept-path',
    tenantId: '00000000-0000-4000-8000-000000000001',
    branchId: 'branch-A',
    departmentId: 'dept-pathology',
    dataScope: 'department',
    roles: ['LAB_TECHNICIAN'],
    permissions: [],
    isSuperAdmin: false
  };

  try {
    // 1. Authorized branch access returns ONLY branch-A records across all 4 services
    const labOrdersBranchA = await labService.searchOrders(branchASession);
    assert.equal(labOrdersBranchA.length, 2, 'Branch A session should see only the 2 branch-A lab orders');
    assert.ok(labOrdersBranchA.every((o) => o.branchId === 'branch-A'));

    const radOrdersBranchA = await radService.getOrders({}, branchASession);
    assert.equal(radOrdersBranchA.items.length, 1, 'Branch A session should see only the 1 branch-A radiology order');
    assert.equal(radOrdersBranchA.items[0].id, 'rad-1');

    const pharmRxBranchA = await pharmService.getPrescriptionQueue(branchASession);
    assert.equal(pharmRxBranchA.length, 1, 'Branch A session should see only the 1 branch-A pharmacy prescription');
    assert.equal(pharmRxBranchA[0].id, 'rx-1');

    const ipdAdmissionsBranchA = await ipdService.getAdmissions(branchASession);
    assert.equal(ipdAdmissionsBranchA.length, 2, 'Branch A session should see only the 2 branch-A IPD admissions');

    // 2. Unauthorized branch access (tampered branchId or record in branch-B) is DENIED with 403
    await assert.rejects(
      async () => labService.searchOrders(branchASession, undefined, undefined, { branchId: 'branch-B' }),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'LabDiagnosticsService must reject tampered branchId=branch-B with 403'
    );

    await assert.rejects(
      async () => labService.getOrderById(branchASession, 'lab-branch-B'),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'LabDiagnosticsService.getOrderById must block reading an order from branch-B'
    );

    await assert.rejects(
      async () => radService.getOrders({ branchId: 'branch-B' }, branchASession),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'RadiologyService must reject tampered branchId=branch-B with 403'
    );

    await assert.rejects(
      async () => pharmService.getInventory(branchASession, 'branch-B'),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'PharmacyManagementService must reject tampered branchId=branch-B with 403'
    );

    await assert.rejects(
      async () => ipdService.getAdmissions(branchASession, undefined, undefined, { branchId: 'branch-B' }),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'InpatientManagementService must reject tampered branchId=branch-B with 403'
    );

    // 3. Authorized department access works & filters out other departments in the same branch
    const labOrdersDeptPath = await labService.searchOrders(deptPathologySession);
    assert.equal(labOrdersDeptPath.length, 1, 'Department-scoped session should see only dept-pathology orders in branch-A');
    assert.equal(labOrdersDeptPath[0].id, 'lab-1');

    // 4. Unauthorized department tampering is DENIED with 403
    await assert.rejects(
      async () => labService.searchOrders(deptPathologySession, undefined, undefined, { departmentId: 'dept-micro' }),
      (err) => err.statusCode === 403,
      'Department-scoped session tampering departmentId=dept-micro must be rejected with 403'
    );

    // 5. Cross-tenant access remains strictly BLOCKED (403 TENANT_ACCESS_DENIED)
    await assert.rejects(
      async () => labService.searchOrders(branchASession, undefined, undefined, { tenantId: '00000000-0000-4000-8000-000000000099' }),
      (err) => err.statusCode === 403 && err.code === 'TENANT_ACCESS_DENIED'
    );

    // 6. Existing Clinical & Billing ScopeGuard behavior remains intact
    await assert.rejects(
      async () => clinicalService.searchPatients(branchASession, '', { branchId: 'branch-B' }),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED'
    );
    await assert.rejects(
      async () => billingService.getInvoices(branchASession, undefined, undefined, { branchId: 'branch-B' }),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED'
    );
  } finally {
    labDiagnosticsRepository.searchOrders = origSearchLabOrders;
    labDiagnosticsRepository.getOrderById = origGetLabOrderById;
    radiologyRepository.findManyOrders = origFindManyRadOrders;
    pharmacyManagementRepository.getPrescriptionQueue = origGetPharmRxQueue;
    inpatientManagementRepository.getAdmissions = origGetIpdAdmissions;
  }
});

// ============================================================================
// 3. POST-REM-CAP-03: Server-Side Partner Profile Module Boundary in commercial-guard.ts
// ============================================================================
test('POST-REM-CAP-03: requireModuleCommercialAccess enforces PARTNER_PROFILE_ALLOWED_MODULES[partnerType] and blocks disallowed includedModules overrides', async () => {
  const origFindByTenantId = licenseRepository.findByTenantId.bind(licenseRepository);
  const origVerifySig = licenseService.verifyLicenseSignature.bind(licenseService);
  const origEvalStatus = licenseService.evaluateLicenseStatus.bind(licenseService);
  const origComplianceHold = documentVerificationRepository.hasExpiredMandatoryComplianceHold.bind(documentVerificationRepository);
  const origGetPlanEntitlements = productRepository.getPlanEntitlements.bind(productRepository);

  const mockLicenses = new Map();
  licenseRepository.findByTenantId = async (tenantId) => {
    const lic = mockLicenses.get(tenantId);
    return lic ? [lic] : [];
  };
  licenseService.verifyLicenseSignature = () => true;
  licenseService.evaluateLicenseStatus = (lic) => ({
    status: lic.status,
    isAccessAllowed: lic.status === 'ACTIVE' || lic.status === 'FREE_ACTIVE',
    isInGracePeriod: false,
    daysRemaining: 200
  });
  documentVerificationRepository.hasExpiredMandatoryComplianceHold = async () => ({ onHold: false });
  productRepository.getPlanEntitlements = async () => [];

  try {
    // Tenant 1: CLINIC with manual metadata.includedModules override attempting to unlock INPATIENT_IPD and PATHOLOGY_LIMS
    mockLicenses.set('tenant-clinic-override', {
      id: 'lic-clinic-override',
      tenantId: 'tenant-clinic-override',
      planId: 'custom-override-plan',
      status: 'ACTIVE',
      metadata: {
        partnerType: 'CLINIC',
        includedModules: ['CLINICAL_EMR', 'INPATIENT_IPD', 'PATHOLOGY_LIMS']
      }
    });

    const clinicSession = {
      userId: 'doc-clinic-1',
      tenantId: 'tenant-clinic-override',
      partnerType: 'CLINIC',
      roles: ['CLINIC_DOCTOR'],
      permissions: [{ resource: '*', action: 'manage' }],
      isSuperAdmin: false
    };

    const makeMockReq = (session, url) => ({
      url,
      headers: { authorization: 'Bearer mock-valid' },
      session
    });
    const mockReply = { header: () => {} };

    // 1. Allowed partner type (CLINIC) + allowed module (CLINICAL_EMR) + valid license -> WORKING
    const guardClinical = requireModuleCommercialAccess('CLINICAL_EMR');
    await guardClinical(makeMockReq(clinicSession, '/api/v1/partner/clinical/encounters'), mockReply);

    // 2. Allowed partner type (CLINIC) + disallowed module (INPATIENT_IPD) EVEN WITH manual includedModules override -> BLOCKED (403)
    const guardIpd = requireModuleCommercialAccess('INPATIENT_IPD');
    await assert.rejects(
      async () => guardIpd(makeMockReq(clinicSession, '/api/v1/partner/inpatient/wards'), mockReply),
      (err) =>
        err.statusCode === 403 &&
        err.code === 'COMMERCIAL_ACCESS_DENIED' &&
        err.message.includes('PARTNER_PROFILE_MODULE_BOUNDARY_VIOLATION'),
      'Manual includedModules override MUST NOT allow CLINIC to access INPATIENT_IPD'
    );

    // 3. Allowed partner type (CLINIC) + disallowed module (PATHOLOGY_LIMS) EVEN WITH manual includedModules override -> BLOCKED (403)
    const guardLab = requireModuleCommercialAccess('PATHOLOGY_LIMS');
    await assert.rejects(
      async () => guardLab(makeMockReq(clinicSession, '/api/v1/partner/lab/orders'), mockReply),
      (err) =>
        err.statusCode === 403 &&
        err.code === 'COMMERCIAL_ACCESS_DENIED' &&
        err.message.includes('PARTNER_PROFILE_MODULE_BOUNDARY_VIOLATION'),
      'Manual includedModules override MUST NOT allow CLINIC to access PATHOLOGY_LIMS'
    );

    // Also verify EntitlementService.canAccess directly blocks the disallowed override
    assert.equal(
      await entitlementService.canAccess('tenant-clinic-override', 'INPATIENT_IPD'),
      false,
      'EntitlementService.canAccess must also enforce PARTNER_PROFILE_ALLOWED_MODULES against metadata.includedModules'
    );

    // 4. Manual override containing an allowed module within HOSPITAL profile -> WORKING
    mockLicenses.set('tenant-hosp-override', {
      id: 'lic-hosp-override',
      tenantId: 'tenant-hosp-override',
      planId: 'custom-hosp-plan',
      status: 'ACTIVE',
      metadata: {
        partnerType: 'HOSPITAL',
        includedModules: ['INPATIENT_IPD', 'RADIOLOGY_PACS']
      }
    });
    const hospSession = {
      userId: 'dir-hosp-1',
      tenantId: 'tenant-hosp-override',
      partnerType: 'HOSPITAL',
      roles: ['HOSPITAL_ADMIN'],
      permissions: [{ resource: '*', action: 'manage' }],
      isSuperAdmin: false
    };
    await guardIpd(makeMockReq(hospSession, '/api/v1/partner/inpatient/wards'), mockReply);

    // 5. Expired commercial state remains blocked (403 COMMERCIAL_ACCESS_DENIED)
    mockLicenses.set('tenant-expired', {
      id: 'lic-expired',
      tenantId: 'tenant-expired',
      planId: toDeterministicUuid('plan-clinic-free-yr1'),
      status: 'EXPIRED',
      metadata: {
        partnerType: 'CLINIC',
        includedModules: ['CLINICAL_EMR']
      }
    });
    const expiredSession = {
      ...clinicSession,
      tenantId: 'tenant-expired'
    };
    await assert.rejects(
      async () => guardClinical(makeMockReq(expiredSession, '/api/v1/partner/clinical/encounters'), mockReply),
      (err) => err.statusCode === 403 && err.code === 'COMMERCIAL_ACCESS_DENIED',
      'Expired license must remain strictly blocked with 403 COMMERCIAL_ACCESS_DENIED'
    );
  } finally {
    licenseRepository.findByTenantId = origFindByTenantId;
    licenseService.verifyLicenseSignature = origVerifySig;
    licenseService.evaluateLicenseStatus = origEvalStatus;
    documentVerificationRepository.hasExpiredMandatoryComplianceHold = origComplianceHold;
    productRepository.getPlanEntitlements = origGetPlanEntitlements;
  }
});

// ============================================================================
// 4. POST-REM-CAP-04: Partner-Platform localStorage Tenant/User Namespacing & Logout Purge
// ============================================================================
test('POST-REM-CAP-04: PatientSessionTabService and PharmacyOfflineStorageService namespace localStorage keys by ${tenantId}:${userId} and purge on logout', () => {
  const store = new Map();
  const eventTarget = new EventTarget();

  const mockWindow = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear()
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    addEventListener: (type, listener) => eventTarget.addEventListener(type, listener),
    removeEventListener: (type, listener) => eventTarget.removeEventListener(type, listener),
    dispatchEvent: (event) => eventTarget.dispatchEvent(event)
  };

  const prevWindow = globalThis.window;
  const prevLocalStorage = globalThis.localStorage;
  globalThis.window = mockWindow;
  globalThis.localStorage = mockWindow.localStorage;

  try {
    // Pre-seed legacy unnamespaced keys to verify immediate invalidation (no cross-identity migration)
    mockWindow.localStorage.setItem('docsearch_session_tabs', JSON.stringify([{ id: 'legacy-tab', title: 'Legacy Leaked Patient' }]));
    mockWindow.localStorage.setItem('docsearch_simulate_offline_mode', 'true');

    const tabService = new PatientSessionTabService();
    const offlineService = new PharmacyOfflineStorageService();

    // Verify legacy global keys were immediately invalidated
    assert.equal(mockWindow.localStorage.getItem('docsearch_session_tabs'), null, 'Legacy global session tab key must be invalidated');
    assert.equal(mockWindow.localStorage.getItem('docsearch_simulate_offline_mode'), null, 'Legacy global offline sim key must be invalidated');

    // 1. Tenant A / User A logs in and writes state
    mockWindow.localStorage.setItem(
      'docsearch_auth_session',
      JSON.stringify({ tenantId: 'tenant-A', userId: 'user-A' })
    );
    tabService.setSessionContext('tenant-A', 'user-A');
    offlineService.setSessionContext('tenant-A', 'user-A');

    tabService.openTab({ id: 'tab-patient-a', title: 'Ramesh Kumar (Tenant A)', type: 'OPD', patientId: 'pat-a' });
    offlineService.setSimulatedOffline(true);

    assert.equal(tabService.getStorageKey(), 'docsearch:tenant-A:user-A:docsearch_session_tabs');
    assert.equal(offlineService.getStorageKey(), 'docsearch:tenant-A:user-A:docsearch_simulate_offline_mode');
    assert.equal(offlineService.getDbName(), 'DocSearchPharmacyLocalDB:tenant-A:user-A');
    assert.equal(tabService.getTabs().length, 1);
    assert.equal(offlineService.isSimulatedOffline(), true);

    // 2. Tenant B / User B logs in on the same browser -> CANNOT read Tenant A / User A state
    mockWindow.localStorage.setItem(
      'docsearch_auth_session',
      JSON.stringify({ tenantId: 'tenant-B', userId: 'user-B' })
    );
    assert.equal(tabService.getTabs().length, 0, 'Tenant B / User B must NOT read Tenant A / User A tabs');
    assert.equal(offlineService.isSimulatedOffline(), false, 'Tenant B / User B must NOT inherit Tenant A offline mode');

    // 3. Same Tenant (tenant-A) but DIFFERENT User (user-B) -> CANNOT read User A state
    mockWindow.localStorage.setItem(
      'docsearch_auth_session',
      JSON.stringify({ tenantId: 'tenant-A', userId: 'user-B' })
    );
    assert.equal(tabService.getTabs().length, 0, 'Same tenant but different user (user-B) must NOT read user-A tabs');
    assert.equal(offlineService.isSimulatedOffline(), false, 'Same tenant but different user (user-B) must NOT read user-A offline state');

    // 4. Existing same-user persistence works when Tenant A / User A is active before logout
    mockWindow.localStorage.setItem(
      'docsearch_auth_session',
      JSON.stringify({ tenantId: 'tenant-A', userId: 'user-A' })
    );
    assert.equal(tabService.getTabs().length, 1, 'Same user (tenant-A:user-A) restores their own persisted tabs');
    assert.equal(tabService.getTabs()[0].id, 'tab-patient-a');
    assert.equal(offlineService.isSimulatedOffline(), true);

    // 5. Logout purges relevant state (clearAllAuthTokens dispatches docsearch:auth_logout)
    clearAllAuthTokens();

    assert.equal(
      mockWindow.localStorage.getItem('docsearch:tenant-A:user-A:docsearch_session_tabs'),
      null,
      'Logout must purge tenant-A:user-A session tabs from localStorage'
    );
    assert.equal(
      mockWindow.localStorage.getItem('docsearch:tenant-A:user-A:docsearch_simulate_offline_mode'),
      null,
      'Logout must purge tenant-A:user-A simulated offline flag from localStorage'
    );
    assert.equal(tabService.getTabs().length, 0, 'In-memory tabs must be cleared on logout');
    assert.equal(offlineService.isSimulatedOffline(), false, 'In-memory simulated offline state must be reset on logout');

    // 6. Re-login does not restore purged state
    mockWindow.localStorage.setItem(
      'docsearch_auth_session',
      JSON.stringify({ tenantId: 'tenant-A', userId: 'user-A' })
    );
    assert.equal(tabService.getTabs().length, 0, 'Re-login after logout starts with a clean tab session');
  } finally {
    globalThis.window = prevWindow;
    globalThis.localStorage = prevLocalStorage;
  }
});

// ============================================================================
// 5. POST-REM-CAP-02 ADVERSARIAL: All 6 LabDiagnosticsService & 2 RadiologyService
//    ID-Based Mutations + Hardcoded Branch Alias Removal
// ============================================================================
test('POST-REM-CAP-02 Adversarial: All 6 LabDiagnosticsService and 2 RadiologyService ID-based mutation methods enforce target-record scope and reject cross-branch/dept/tenant (403) + zero hardcoded branch alias bypass', async () => {
  const labService = new LabDiagnosticsService();
  const radService = new RadiologyService();

  const origGetLabOrderById = labDiagnosticsRepository.getOrderById.bind(labDiagnosticsRepository);
  const origCollectSpec = labDiagnosticsRepository.collectSpecimen.bind(labDiagnosticsRepository);
  const origEnterResult = labDiagnosticsRepository.enterResult.bind(labDiagnosticsRepository);
  const origVerifyResult = labDiagnosticsRepository.verifyResult.bind(labDiagnosticsRepository);
  const origReviewResult = labDiagnosticsRepository.reviewResult.bind(labDiagnosticsRepository);
  const origCancelOrder = labDiagnosticsRepository.cancelOrder.bind(labDiagnosticsRepository);
  const origLogPanic = labDiagnosticsRepository.logPanicIntimation.bind(labDiagnosticsRepository);

  const origFindRadOrderById = radiologyRepository.findOrderById.bind(radiologyRepository);
  const origUpdateRadStatus = radiologyRepository.updateOrderStatus.bind(radiologyRepository);
  const origCreateRadAppt = radiologyRepository.createAppointment.bind(radiologyRepository);

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const BRANCH_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const BRANCH_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const mockLabOrders = new Map([
    ['ord-same-scope', { id: 'ord-same-scope', orderNumber: 'LAB-001', tenantId: TENANT_A, branchId: BRANCH_A, departmentId: 'dept-X' }],
    ['ord-branch-B', { id: 'ord-branch-B', orderNumber: 'LAB-002', tenantId: TENANT_A, branchId: BRANCH_B, departmentId: 'dept-X' }],
    ['ord-dept-Y', { id: 'ord-dept-Y', orderNumber: 'LAB-003', tenantId: TENANT_A, branchId: BRANCH_A, departmentId: 'dept-Y' }],
    ['ord-tenant-B', { id: 'ord-tenant-B', orderNumber: 'LAB-004', tenantId: TENANT_B, branchId: BRANCH_A, departmentId: 'dept-X' }],
    ['ord-seed-alias-2', { id: 'ord-seed-alias-2', orderNumber: 'LAB-005', tenantId: TENANT_A, branchId: '00000000-0000-4000-8000-000000000002', departmentId: 'dept-X' }],
    ['ord-seed-alias-3', { id: 'ord-seed-alias-3', orderNumber: 'LAB-006', tenantId: TENANT_A, branchId: '00000000-0000-4000-8000-000000000003', departmentId: 'dept-X' }]
  ]);

  const mockRadOrders = new Map([
    ['rad-same-scope', { id: 'rad-same-scope', orderNumber: 'RAD-001', tenantId: TENANT_A, branchId: BRANCH_A, departmentId: 'dept-X', status: 'ORDERED' }],
    ['rad-branch-B', { id: 'rad-branch-B', orderNumber: 'RAD-002', tenantId: TENANT_A, branchId: BRANCH_B, departmentId: 'dept-X', status: 'ORDERED' }],
    ['rad-dept-Y', { id: 'rad-dept-Y', orderNumber: 'RAD-003', tenantId: TENANT_A, branchId: BRANCH_A, departmentId: 'dept-Y', status: 'ORDERED' }],
    ['rad-tenant-B', { id: 'rad-tenant-B', orderNumber: 'RAD-004', tenantId: TENANT_B, branchId: BRANCH_A, departmentId: 'dept-X', status: 'ORDERED' }]
  ]);

  labDiagnosticsRepository.getOrderById = async (tenantId, orderId) => {
    const rec = mockLabOrders.get(orderId);
    if (!rec || rec.tenantId !== tenantId) return null;
    return rec;
  };
  labDiagnosticsRepository.collectSpecimen = async (input) => ({ ...mockLabOrders.get(input.orderId), status: 'SAMPLE_COLLECTED' });
  labDiagnosticsRepository.enterResult = async (input) => ({ ...mockLabOrders.get(input.orderId), status: 'RESULT_ENTERED' });
  labDiagnosticsRepository.verifyResult = async (_t, orderId) => ({ ...mockLabOrders.get(orderId), status: 'VERIFIED' });
  labDiagnosticsRepository.reviewResult = async (_t, orderId) => ({ ...mockLabOrders.get(orderId), status: 'REVIEWED' });
  labDiagnosticsRepository.cancelOrder = async (_t, orderId) => ({ ...mockLabOrders.get(orderId), status: 'CANCELLED' });
  labDiagnosticsRepository.logPanicIntimation = async (_t, orderId) => ({ ...mockLabOrders.get(orderId), status: 'CRITICAL_INTIMATED' });

  const origGetRadModalities = radiologyRepository.getModalities;
  radiologyRepository.findOrderById = async (orderId, tenantId) => {
    const rec = mockRadOrders.get(orderId);
    if (!rec || rec.tenantId !== tenantId) return null;
    return rec;
  };
  radiologyRepository.updateOrderStatus = async (orderId, _t, _from, toStatus) => ({ ...mockRadOrders.get(orderId), status: toStatus });
  radiologyRepository.createAppointment = async (data) => ({ id: 'rad-apt-1', ...data });
  radiologyRepository.getModalities = async (tenantId) => [
    { id: 'mod-ct-01', modalityCode: 'CT-01', modalityName: 'CT Scanner 01', modalityType: 'CT', tenantId, branchId: BRANCH_A }
  ];

  const sessionBranchADeptX = {
    userId: 'pathologist-a-x',
    tenantId: TENANT_A,
    branchId: BRANCH_A,
    departmentId: 'dept-X',
    dataScope: 'department',
    roles: ['PATHOLOGIST', 'LAB_DIRECTOR'],
    permissions: [{ resource: 'lab:results', action: 'validate' }],
    isSuperAdmin: false
  };

  try {
    // 9.1 LabDiagnosticsService: All 6 mutation methods reject (403) Branch B, Department Y, and Tenant B
    for (const badOrderId of ['ord-branch-B', 'ord-dept-Y', 'ord-tenant-B']) {
      await assert.rejects(
        async () => labService.collectSpecimen({ orderId: badOrderId, specimenType: 'BLOOD' }, sessionBranchADeptX),
        (err) => err.statusCode === 403,
        `collectSpecimen must reject ${badOrderId} with 403`
      );
      await assert.rejects(
        async () => labService.enterResult({ orderId: badOrderId, parameterCode: 'HGB', resultValue: '13.5' }, sessionBranchADeptX),
        (err) => err.statusCode === 403,
        `enterResult must reject ${badOrderId} with 403`
      );
      await assert.rejects(
        async () => labService.verifyResult(badOrderId, sessionBranchADeptX),
        (err) => err.statusCode === 403,
        `verifyResult must reject ${badOrderId} with 403`
      );
      await assert.rejects(
        async () => labService.reviewResult(badOrderId, 'Reviewed', sessionBranchADeptX),
        (err) => err.statusCode === 403,
        `reviewResult must reject ${badOrderId} with 403`
      );
      await assert.rejects(
        async () => labService.cancelOrder(badOrderId, 'Duplicate', sessionBranchADeptX),
        (err) => err.statusCode === 403,
        `cancelOrder must reject ${badOrderId} with 403`
      );
      await assert.rejects(
        async () => labService.logPanicIntimation(badOrderId, { notes: 'Critical' }, sessionBranchADeptX),
        (err) => err.statusCode === 403,
        `logPanicIntimation must reject ${badOrderId} with 403`
      );
    }

    // 9.2 RadiologyService: updateOrderStatus and scheduleAppointment reject (403) Branch B, Department Y, and Tenant B
    for (const badRadOrderId of ['rad-branch-B', 'rad-dept-Y', 'rad-tenant-B']) {
      await assert.rejects(
        async () => radService.updateOrderStatus(badRadOrderId, 'ORDERED', 'SCHEDULED', sessionBranchADeptX),
        (err) => err.statusCode === 403,
        `RadiologyService.updateOrderStatus must reject ${badRadOrderId} with 403`
      );
      await assert.rejects(
        async () => radService.scheduleAppointment({ orderId: badRadOrderId, modalityCode: 'CT-01' }, sessionBranchADeptX),
        (err) => err.statusCode === 403,
        `RadiologyService.scheduleAppointment must reject ${badRadOrderId} with 403`
      );
    }

    // 9.3 Hardcoded Branch Alias Removal Test:
    // Session with branchId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' or 'branch-A' CANNOT access 00000000-0000-4000-8000-000000000002 or 0003
    const legacyAliasCallerSession = {
      ...sessionBranchADeptX,
      branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      dataScope: 'branch'
    };
    const filteredLegacy = ScopeGuard.filterRecordsByScope(
      [
        mockLabOrders.get('ord-seed-alias-2'),
        mockLabOrders.get('ord-seed-alias-3')
      ],
      { branchId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
    );
    assert.equal(filteredLegacy.length, 0, 'filterRecordsByScope must NOT exempt 00000000-0000-4000-8000-000000000002 or 0003');

    await assert.rejects(
      async () => labService.verifyResult('ord-seed-alias-2', legacyAliasCallerSession),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'Session with branchId=aaaaaaaa-... must be blocked (403) from mutating 00000000-0000-4000-8000-000000000002'
    );
    await assert.rejects(
      async () => labService.verifyResult('ord-seed-alias-3', legacyAliasCallerSession),
      (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED',
      'Session with branchId=aaaaaaaa-... must be blocked (403) from mutating 00000000-0000-4000-8000-000000000003'
    );

    // 9.4 Authorized Same-Scope Success: Same Tenant + Same Branch + Same Department succeeds
    const collected = await labService.collectSpecimen({ orderId: 'ord-same-scope', specimenType: 'BLOOD' }, sessionBranchADeptX);
    assert.equal(collected.status, 'SAMPLE_COLLECTED');
    const entered = await labService.enterResult({ orderId: 'ord-same-scope', parameterCode: 'HGB', resultValue: '14.1' }, sessionBranchADeptX);
    assert.equal(entered.status, 'RESULT_ENTERED');
    const verified = await labService.verifyResult('ord-same-scope', sessionBranchADeptX);
    assert.equal(verified.status, 'VERIFIED');
    const reviewed = await labService.reviewResult('ord-same-scope', 'Normal', sessionBranchADeptX);
    assert.equal(reviewed.status, 'REVIEWED');
    const panic = await labService.logPanicIntimation('ord-same-scope', { notes: 'Confirmed' }, sessionBranchADeptX);
    assert.equal(panic.panicIntimation.status, 'VERBAL_READBACK_CONFIRMED');
    const cancelled = await labService.cancelOrder('ord-same-scope', 'Test complete', sessionBranchADeptX);
    assert.equal(cancelled.status, 'CANCELLED');

    const radUpdated = await radService.updateOrderStatus('rad-same-scope', 'ORDERED', 'SCHEDULED', sessionBranchADeptX);
    assert.equal(radUpdated.status, 'SCHEDULED');
    const radAppt = await radService.scheduleAppointment({ orderId: 'rad-same-scope', modalityCode: 'CT-01' }, sessionBranchADeptX);
    assert.equal(radAppt.orderId, 'rad-same-scope');
  } finally {
    labDiagnosticsRepository.getOrderById = origGetLabOrderById;
    labDiagnosticsRepository.collectSpecimen = origCollectSpec;
    labDiagnosticsRepository.enterResult = origEnterResult;
    labDiagnosticsRepository.verifyResult = origVerifyResult;
    labDiagnosticsRepository.reviewResult = origReviewResult;
    labDiagnosticsRepository.cancelOrder = origCancelOrder;
    labDiagnosticsRepository.logPanicIntimation = origLogPanic;

    radiologyRepository.findOrderById = origFindRadOrderById;
    radiologyRepository.updateOrderStatus = origUpdateRadStatus;
    radiologyRepository.createAppointment = origCreateRadAppt;
    radiologyRepository.getModalities = origGetRadModalities;
  }
});

// ============================================================================
// 6. POST-REM-CAP-03 ADVERSARIAL: DB plan_entitlements Out-of-Profile Rejection,
//    Pathology LIMS vs Radiology PACS Boundary, and requireFeatureEntitlement Guard
// ============================================================================
test('POST-REM-CAP-03 Adversarial: EntitlementService.canAccess and requireFeatureEntitlement block DB plan_entitlements out-of-profile modules and enforce Pathology LIMS vs Radiology PACS boundaries', async () => {
  const { requireFeatureEntitlement } = await import('../dist/plugins/commercial-guard.js');

  const origFindByTenantId = licenseRepository.findByTenantId.bind(licenseRepository);
  const origVerifySig = licenseService.verifyLicenseSignature.bind(licenseService);
  const origEvalStatus = licenseService.evaluateLicenseStatus.bind(licenseService);
  const origComplianceHold = documentVerificationRepository.hasExpiredMandatoryComplianceHold.bind(documentVerificationRepository);
  const origGetPlanEntitlements = productRepository.getPlanEntitlements.bind(productRepository);

  const mockLicenses = new Map();
  const mockPlanEntitlements = new Map();

  licenseRepository.findByTenantId = async (tenantId) => {
    const lic = mockLicenses.get(tenantId);
    return lic ? [lic] : [];
  };
  licenseService.verifyLicenseSignature = () => true;
  licenseService.evaluateLicenseStatus = (lic) => ({
    status: lic.status,
    isAccessAllowed: lic.status === 'ACTIVE' || lic.status === 'FREE_ACTIVE',
    isInGracePeriod: false,
    daysRemaining: 200
  });
  documentVerificationRepository.hasExpiredMandatoryComplianceHold = async () => ({ onHold: false });
  productRepository.getPlanEntitlements = async (planId) => mockPlanEntitlements.get(planId) || [];

  try {
    // 10.1 DB plan_entitlements Out-of-Profile Module Rejection:
    // partnerType = PHARMACY, DB plan_entitlements returns INPATIENT_IPD and RADIOLOGY_PACS
    mockLicenses.set('tenant-pharmacy-db-ent', {
      id: 'lic-pharma-db',
      tenantId: 'tenant-pharmacy-db-ent',
      planId: 'plan-misconfigured-db',
      status: 'ACTIVE',
      metadata: { partnerType: 'PHARMACY' }
    });
    mockPlanEntitlements.set('plan-misconfigured-db', [
      { code: 'PHARMACY_POS', name: 'Retail POS', category: 'MODULE', value: { enabled: true } },
      { code: 'INPATIENT_IPD', name: 'Inpatient IPD', category: 'MODULE', value: { enabled: true } },
      { code: 'RADIOLOGY_PACS', name: 'Radiology PACS', category: 'MODULE', value: { enabled: true } }
    ]);

    assert.equal(await entitlementService.canAccess('tenant-pharmacy-db-ent', 'PHARMACY_POS'), true);
    assert.equal(
      await entitlementService.canAccess('tenant-pharmacy-db-ent', 'INPATIENT_IPD'),
      false,
      'PHARMACY partner must be denied INPATIENT_IPD even when DB plan_entitlements includes INPATIENT_IPD'
    );
    assert.equal(
      await entitlementService.canAccess('tenant-pharmacy-db-ent', 'RADIOLOGY_PACS'),
      false,
      'PHARMACY partner must be denied RADIOLOGY_PACS even when DB plan_entitlements includes RADIOLOGY_PACS'
    );

    const pharmaSession = {
      userId: 'user-pharma-1',
      tenantId: 'tenant-pharmacy-db-ent',
      partnerType: 'PHARMACY',
      roles: ['PHARMACIST'],
      permissions: [{ resource: '*', action: 'manage' }],
      isSuperAdmin: false
    };
    const makeReq = (session, url) => ({ url, headers: { authorization: 'Bearer mock' }, session });
    const reply = { header: () => {} };

    const featGuardIpd = requireFeatureEntitlement('INPATIENT_IPD');
    await assert.rejects(
      async () => featGuardIpd(makeReq(pharmaSession, '/api/v1/partner/inpatient/beds'), reply),
      (err) => err.statusCode === 403 && err.code === 'COMMERCIAL_ACCESS_DENIED',
      'requireFeatureEntitlement(INPATIENT_IPD) must reject PHARMACY partner with 403'
    );

    // 10.3 Pathology LIMS vs Radiology PACS Boundary:
    // partnerType = PATHOLOGY_LAB with RADIOLOGY_PACS in DB plan_entitlements & metadata
    mockLicenses.set('tenant-path-lab', {
      id: 'lic-path-lab',
      tenantId: 'tenant-path-lab',
      planId: 'plan-path-with-rad',
      status: 'ACTIVE',
      metadata: { partnerType: 'PATHOLOGY_LAB', includedModules: ['PATHOLOGY_LIMS', 'RADIOLOGY_PACS'] }
    });
    mockPlanEntitlements.set('plan-path-with-rad', [
      { code: 'PATHOLOGY_LIMS', name: 'Pathology LIMS', category: 'MODULE', value: { enabled: true } },
      { code: 'RADIOLOGY_PACS', name: 'Radiology PACS', category: 'MODULE', value: { enabled: true } }
    ]);

    assert.equal(await entitlementService.canAccess('tenant-path-lab', 'PATHOLOGY_LIMS'), true);
    assert.equal(
      await entitlementService.canAccess('tenant-path-lab', 'RADIOLOGY_PACS'),
      false,
      'PATHOLOGY_LAB partner must be denied RADIOLOGY_PACS even when present in plan/metadata'
    );
  } finally {
    licenseRepository.findByTenantId = origFindByTenantId;
    licenseService.verifyLicenseSignature = origVerifySig;
    licenseService.evaluateLicenseStatus = origEvalStatus;
    documentVerificationRepository.hasExpiredMandatoryComplianceHold = origComplianceHold;
    productRepository.getPlanEntitlements = origGetPlanEntitlements;
  }
});

