/**
 * DOC SEARCH — CAP-01 → CAP-07 REMEDIATION & ADVERSARIAL VERIFICATION TEST SUITE
 *
 * Covers:
 * - CAP-01: Partner Profile + Staff Role capability intersection & UI/route workspace switch prevention
 * - CAP-02: Operational staff privilege escalation prevention (no auto-injected HOSPITAL_ADMIN / staff:write)
 * - CAP-03: Unknown/missing facility profile fail-closed to RESTRICTED (never defaults to HOSPITAL)
 * - CAP-04: Wholesale Pharmacy B2B distribution profile + commercial entitlement + Form 20B/21B Drug License governance
 * - CAP-05: Branch + Department server-side data scope enforcement & query tampering rejection
 * - CAP-06: Atomic partner profile transition staff revalidation + mutex lock & immediate session/login restriction
 * - CAP-07: RegistrationFormPolicyService canonical allowedFacilityTypes & plan resolution alignment
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

// Allow Node v24 native TS loader to resolve .js relative specifiers inside .ts files
if (typeof module.registerHooks === 'function') {
  module.registerHooks({
    resolve(specifier, context, nextResolve) {
      try {
        return nextResolve(specifier, context);
      } catch (err) {
        if (specifier.startsWith('.') && specifier.endsWith('.js')) {
          return nextResolve(specifier.replace(/\.js$/, '.ts'), context);
        }
        throw err;
      }
    }
  });
}

import {
  normalizeFacilityProfile
} from '@docsearch/shared-core';
import { ScopeGuard } from '@docsearch/auth';
import {
  resolveStrictPermissionsForRoles,
  realAuthService
} from '../dist/services/core/RealAuthService.js';
import {
  WholesaleInvoiceIngestionService
} from '../dist/services/partner/WholesaleInvoiceIngestionService.js';
import {
  StaffAdministrationService,
  PROFILE_ALLOWED_ROLES_MAP
} from '../dist/services/partner/StaffAdministrationService.js';
import {
  CANONICAL_ALLOWED_FACILITY_TYPES,
  DEFAULT_REGISTRATION_FORM_POLICY,
  registrationFormPolicyService,
  resolveCanonicalRequestedPlan
} from '../dist/services/core/RegistrationFormPolicyService.js';

const {
  isModuleAllowedForPartnerProfile,
  isWorkspaceAllowedForPartnerProfile,
  resolveCanonicalProfileKey
} = await import('../../partner-platform/src/utils/partnerRolePermissions.ts');

// ============================================================================
// CAP-03: Unknown Facility Type Fails Closed to RESTRICTED (Never HOSPITAL)
// ============================================================================
test('CAP-03: normalizeFacilityProfile fails closed to RESTRICTED on null, undefined, empty, or unknown types', () => {
  const invalidInputs = [
    null,
    undefined,
    '',
    '   ',
    'UNKNOWN',
    'INVALID_FACILITY',
    'SUPER_HOSPITAL_HACK',
    'SQL_INJECTION; DROP TABLE tenants;--'
  ];

  for (const badInput of invalidInputs) {
    const profile = normalizeFacilityProfile(badInput);
    assert.equal(
      profile.workspace,
      'RESTRICTED',
      `Expected workspace RESTRICTED for input ${JSON.stringify(badInput)}, got ${profile.workspace}`
    );
    assert.equal(profile.primaryRole, 'RESTRICTED');
    assert.equal(profile.crmType, 'RESTRICTED');
    assert.equal(profile.isRestricted, true);
    assert.deepEqual(profile.allowedWorkspaces, []);
    assert.deepEqual(profile.accessibleFeatures, []);
    assert.notEqual(profile.workspace, 'HOSPITAL', 'Must NEVER silently fall back to HOSPITAL');
  }

  // Verify valid profiles still normalize accurately
  assert.equal(normalizeFacilityProfile('HOSPITAL').workspace, 'HOSPITAL');
  assert.equal(normalizeFacilityProfile('HOSPITAL').isRestricted, false);
  assert.equal(normalizeFacilityProfile('CLINIC').workspace, 'CLINIC');
  assert.equal(normalizeFacilityProfile('PATHOLOGY').workspace, 'PATHOLOGY');
  assert.equal(normalizeFacilityProfile('PHARMACY').workspace, 'PHARMACY');
  assert.equal(normalizeFacilityProfile('PHARMACY_WHOLESALE').workspace, 'PHARMACY');
  assert.equal(normalizeFacilityProfile('DIAGNOSTIC_CENTRE').workspace, 'DIAGNOSTIC_CENTRE');
  assert.equal(normalizeFacilityProfile('ENTERPRISE_COMMAND').workspace, 'ENTERPRISE_COMMAND');
});

// ============================================================================
// CAP-01: Partner Profile + Staff Role Capability Intersection & Workspace Guard
// ============================================================================
test('CAP-01: Wildcard roles (OWNER / HOSPITAL_ADMIN) NEVER bypass Partner Profile module boundaries', () => {
  // Signature: isModuleAllowedForPartnerProfile(moduleKey, facilityType, role)
  // 1. PATHOLOGY partner + OWNER (wildcard ['*'])
  assert.equal(
    isModuleAllowedForPartnerProfile('clinical-investigation', 'PATHOLOGY', 'OWNER'),
    true,
    'PATHOLOGY OWNER should access clinical-investigation'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('pharmacy-medication', 'PATHOLOGY', 'OWNER'),
    false,
    'PATHOLOGY OWNER must NOT access pharmacy-medication'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('clinical-consultation', 'PATHOLOGY', 'OWNER'),
    false,
    'PATHOLOGY OWNER must NOT access clinical-consultation'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('inpatient-management', 'PATHOLOGY', 'OWNER'),
    false,
    'PATHOLOGY OWNER must NOT access inpatient-management'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('radiology-imaging', 'PATHOLOGY', 'OWNER'),
    false,
    'PATHOLOGY OWNER must NOT access radiology-imaging'
  );

  // 2. PHARMACY partner + OWNER (wildcard ['*'])
  assert.equal(
    isModuleAllowedForPartnerProfile('pharmacy-medication', 'PHARMACY', 'OWNER'),
    true,
    'PHARMACY OWNER should access pharmacy-medication'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('clinical-investigation', 'PHARMACY', 'OWNER'),
    false,
    'PHARMACY OWNER must NOT access clinical-investigation'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('clinical-consultation', 'PHARMACY', 'HOSPITAL_ADMIN'),
    false,
    'PHARMACY HOSPITAL_ADMIN must NOT access clinical-consultation'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('inpatient-management', 'PHARMACY', 'OWNER'),
    false,
    'PHARMACY OWNER must NOT access inpatient-management'
  );

  // 3. CLINIC partner + HOSPITAL_ADMIN (wildcard ['*'])
  assert.equal(
    isModuleAllowedForPartnerProfile('clinical-consultation', 'CLINIC', 'HOSPITAL_ADMIN'),
    true,
    'CLINIC HOSPITAL_ADMIN should access clinical-consultation'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('inpatient-management', 'CLINIC', 'HOSPITAL_ADMIN'),
    false,
    'CLINIC HOSPITAL_ADMIN must NOT access inpatient-management'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('operation-theatre-management', 'CLINIC', 'OWNER'),
    false,
    'CLINIC OWNER must NOT access operation-theatre-management'
  );

  // 4. DIAGNOSTIC_CENTRE partner + CENTRE_MANAGER (wildcard ['*'])
  assert.equal(
    isModuleAllowedForPartnerProfile('radiology-imaging', 'DIAGNOSTIC_CENTRE', 'CENTRE_MANAGER'),
    true,
    'DIAGNOSTIC_CENTRE CENTRE_MANAGER should access radiology-imaging'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('pharmacy-medication', 'DIAGNOSTIC_CENTRE', 'CENTRE_MANAGER'),
    false,
    'DIAGNOSTIC_CENTRE CENTRE_MANAGER must NOT access pharmacy-medication'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('inpatient-management', 'DIAGNOSTIC_CENTRE', 'CENTRE_MANAGER'),
    false,
    'DIAGNOSTIC_CENTRE CENTRE_MANAGER must NOT access inpatient-management'
  );

  // 5. Unknown/missing partner profile fails closed to RESTRICTED
  assert.equal(resolveCanonicalProfileKey(null), 'RESTRICTED');
  assert.equal(resolveCanonicalProfileKey('INVALID_PROFILE'), 'RESTRICTED');
  assert.equal(
    isModuleAllowedForPartnerProfile('clinical-consultation', 'INVALID_PROFILE', 'OWNER'),
    false,
    'Unknown profile must block clinical/operational modules even for OWNER'
  );
  assert.equal(
    isModuleAllowedForPartnerProfile('account-plan-features', 'INVALID_PROFILE', 'OWNER'),
    true,
    'RESTRICTED profile still allows account-plan-features so partner can view/edit account'
  );
});

test('CAP-01 Adversarial: Workspace switch & PartnerPlatformShell route guard verification', () => {
  // Signature: isWorkspaceAllowedForPartnerProfile(targetWorkspace, facilityType)
  assert.equal(isWorkspaceAllowedForPartnerProfile('PATHOLOGY', 'PATHOLOGY'), true);
  assert.equal(isWorkspaceAllowedForPartnerProfile('HOSPITAL', 'PATHOLOGY'), false);
  assert.equal(isWorkspaceAllowedForPartnerProfile('PHARMACY', 'PATHOLOGY'), false);
  assert.equal(isWorkspaceAllowedForPartnerProfile('HOSPITAL', 'PHARMACY'), false);
  assert.equal(isWorkspaceAllowedForPartnerProfile('HOSPITAL', 'CLINIC'), false);
  assert.equal(isWorkspaceAllowedForPartnerProfile('HOSPITAL', 'UNKNOWN'), false);

  const shellPath = path.join(REPO_ROOT, 'apps/partner-platform/src/components/PartnerPlatformShell.tsx');
  const shellSource = fs.readFileSync(shellPath, 'utf8');
  assert.ok(
    shellSource.includes('isModuleAllowedForPartnerProfile'),
    'PartnerPlatformShell.tsx must enforce isModuleAllowedForPartnerProfile'
  );
  assert.ok(
    shellSource.includes('isWorkspaceAllowedForPartnerProfile'),
    'PartnerPlatformShell.tsx must enforce isWorkspaceAllowedForPartnerProfile on workspace switches'
  );
});

// ============================================================================
// CAP-02: Operational Staff Privilege Escalation Prevention
// ============================================================================
test('CAP-02: Operational staff roles never receive auto-injected HOSPITAL_ADMIN or staff:write/partners:write', () => {
  const nonAdminStaffRoles = [
    'PHLEBOTOMIST',
    'RECEPTIONIST',
    'DISPENSING_PHARMACIST',
    'STAFF_NURSE',
    'LAB_TECHNICIAN',
    'PATHOLOGIST',
    'RADIOLOGIST',
    'DOCTOR',
    'CASHIER_BILLING_OFFICER'
  ];

  for (const role of nonAdminStaffRoles) {
    const perms = resolveStrictPermissionsForRoles([role]);
    assert.equal(
      perms.includes('staff:write'),
      false,
      `Operational role ${role} must NEVER receive staff:write`
    );
    assert.equal(
      perms.includes('partners:write'),
      false,
      `Operational role ${role} must NEVER receive partners:write`
    );
    assert.equal(
      perms.includes('billing:manage'),
      false,
      `Operational role ${role} must NEVER receive billing:manage`
    );
  }

  // Verify HOSPITAL_ADMIN and OWNER still retain administrative permissions
  const adminPerms = resolveStrictPermissionsForRoles(['HOSPITAL_ADMIN']);
  assert.equal(adminPerms.includes('staff:write'), true);
  assert.equal(adminPerms.includes('partners:write'), true);
  assert.equal(adminPerms.includes('billing:manage'), true);

  // Verify RealAuthService source no longer injects [role, 'HOSPITAL_ADMIN']
  const authSource = fs.readFileSync(
    path.join(REPO_ROOT, 'apps/api-gateway/src/services/core/RealAuthService.ts'),
    'utf8'
  );
  assert.equal(
    authSource.includes("roles: [role, 'HOSPITAL_ADMIN']"),
    false,
    'RealAuthService.ts must NOT inject secondary HOSPITAL_ADMIN role into operational staff'
  );
});

// ============================================================================
// CAP-04: Wholesale Pharmacy B2B Distribution Governance
// ============================================================================
test('CAP-04: Wholesale B2B distribution enforces profile, commercial entitlement, Drug License (Form 20B/21B), and tenant scope', async () => {
  const service = new WholesaleInvoiceIngestionService();

  const baseInput = {
    buyerName: 'Apollo Chemist Retail Pvt Ltd',
    buyerDlNo: 'DL-20B-MH-2026-99881',
    buyerGstin: '27AABCA1234F1Z5',
    wholesaleLicenseNumber: '20B/21B-MH-1001',
    wholesaleLicenseExpiry: '2028-12-31',
    challanNumber: 'WH-INV-2026-001',
    items: [
      {
        itemDescription: 'Amoxicillin 500mg Cap',
        batchNumber: 'BATCH-991',
        quantity: 100,
        unitPricePtr: 45
      }
    ]
  };

  // 1. Adversarial: Cross-tenant buyer/transaction attempt -> 403 TENANT_ACCESS_DENIED
  await assert.rejects(
    async () => {
      await service.executeWholesaleB2bDispatch(
        {
          userId: 'user-1',
          tenantId: 'tenant-wholesale-1',
          organizationType: 'PHARMACY_WHOLESALE',
          roles: ['PHARMACY_DIRECTOR'],
          permissions: ['pharmacy:write'],
          dataScope: 'tenant'
        },
        { ...baseInput, buyerTenantId: 'tenant-other-999' }
      );
    },
    (err) => err.statusCode === 403 && err.code === 'TENANT_ACCESS_DENIED'
  );

  // 2. Adversarial: PATHOLOGY partner attempting Wholesale B2B dispatch -> 403 FORBIDDEN
  await assert.rejects(
    async () => {
      await service.executeWholesaleB2bDispatch(
        {
          userId: 'user-1',
          tenantId: 'tenant-path-1',
          organizationType: 'PATHOLOGY',
          roles: ['OWNER'],
          permissions: ['pharmacy:write'],
          dataScope: 'tenant'
        },
        baseInput
      );
    },
    (err) => err.statusCode === 403 && String(err.message).includes('WHOLESALE_PROFILE_DENIED')
  );

  // 3. Adversarial: Retail-only PHARMACY without wholesale commercial entitlement -> 403 COMMERCIAL_ACCESS_DENIED
  await assert.rejects(
    async () => {
      await service.executeWholesaleB2bDispatch(
        {
          userId: 'user-1',
          tenantId: 'tenant-retail-pharma',
          organizationType: 'RETAIL_PHARMACY',
          operatingModel: 'RETAIL',
          entitledFeatures: ['PHARMACY_POS'],
          roles: ['OWNER'],
          permissions: ['pharmacy:write'],
          dataScope: 'tenant'
        },
        baseInput
      );
    },
    (err) => err.statusCode === 403 && err.code === 'COMMERCIAL_ACCESS_DENIED'
  );

  // 4. Adversarial: Missing Wholesale Drug License (Form 20B/21B) -> 403 WHOLESALE_DRUG_LICENSE_REQUIRED
  await assert.rejects(
    async () => {
      await service.executeWholesaleB2bDispatch(
        {
          userId: 'user-1',
          tenantId: 'tenant-wholesale-1',
          organizationType: 'PHARMACY_WHOLESALE',
          roles: ['PHARMACY_DIRECTOR'],
          permissions: ['pharmacy:write'],
          dataScope: 'tenant'
        },
        { ...baseInput, wholesaleLicenseNumber: '' }
      );
    },
    (err) => err.statusCode === 403 && String(err.message).includes('WHOLESALE_DRUG_LICENSE_REQUIRED')
  );

  // 5. Adversarial: Expired Wholesale Drug License -> 403 WHOLESALE_DRUG_LICENSE_EXPIRED
  await assert.rejects(
    async () => {
      await service.executeWholesaleB2bDispatch(
        {
          userId: 'user-1',
          tenantId: 'tenant-wholesale-1',
          organizationType: 'PHARMACY_WHOLESALE',
          roles: ['PHARMACY_DIRECTOR'],
          permissions: ['pharmacy:write'],
          dataScope: 'tenant'
        },
        { ...baseInput, wholesaleLicenseExpiry: '2020-01-01' }
      );
    },
    (err) => err.statusCode === 403 && String(err.message).includes('WHOLESALE_DRUG_LICENSE_EXPIRED')
  );

  // 6. Adversarial: Missing B2B Buyer Drug License -> 400 WHOLESALE_BUYER_DL_REQUIRED
  await assert.rejects(
    async () => {
      await service.executeWholesaleB2bDispatch(
        {
          userId: 'user-1',
          tenantId: 'tenant-wholesale-1',
          organizationType: 'PHARMACY_WHOLESALE',
          roles: ['PHARMACY_DIRECTOR'],
          permissions: ['pharmacy:write'],
          dataScope: 'tenant'
        },
        { ...baseInput, buyerDlNo: '   ' }
      );
    },
    (err) => err.statusCode === 400 && String(err.message).includes('WHOLESALE_BUYER_DL_REQUIRED')
  );

  // 7. Authorized: Valid PHARMACY_WHOLESALE + active entitlement + valid Form 20B/21B + valid buyer DL -> Succeeds
  const result = await service.executeWholesaleB2bDispatch(
    {
      userId: 'user-1',
      tenantId: 'tenant-wholesale-1',
      organizationType: 'PHARMACY_WHOLESALE',
      entitledFeatures: ['PHARMACY_WHOLESALE'],
      roles: ['PHARMACY_DIRECTOR'],
      permissions: ['pharmacy:write'],
      dataScope: 'tenant'
    },
    baseInput
  );

  assert.equal(result.success, true);
  assert.equal(result.tenantId, 'tenant-wholesale-1');
  assert.equal(result.buyerDlNo, 'DL-20B-MH-2026-99881');
  assert.equal(result.totalAmount, 4500);
});

// ============================================================================
// CAP-05: Branch + Department Server-Side Data Scope Enforcement
// ============================================================================
test('CAP-05: ScopeGuard.resolveEffectiveQueryScope enforces branch and department scope and blocks query tampering', () => {
  // 1. Branch-scoped staff session
  const branchScopedSession = {
    userId: 'staff-branch-a',
    tenantId: 'tenant-hosp-1',
    branchId: 'branch-main-a',
    roles: ['RECEPTIONIST'],
    permissions: ['clinical:read'],
    dataScope: 'branch'
  };

  // Automatic branch constraint when no branchId is specified in query
  const defaultBranchScope = ScopeGuard.resolveEffectiveQueryScope(branchScopedSession, {});
  assert.equal(defaultBranchScope.tenantId, 'tenant-hosp-1');
  assert.equal(defaultBranchScope.branchId, 'branch-main-a');

  // Adversarial: Branch-scoped staff tampering with branchId=branch-b -> 403 BRANCH_ACCESS_DENIED
  assert.throws(
    () => {
      ScopeGuard.resolveEffectiveQueryScope(branchScopedSession, { branchId: 'branch-other-b' });
    },
    (err) => err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED'
  );

  // 2. Department-scoped staff session
  const deptScopedSession = {
    userId: 'nurse-cardio-1',
    tenantId: 'tenant-hosp-1',
    branchId: 'branch-main-a',
    departmentId: 'dept-cardiology',
    roles: ['STAFF_NURSE'],
    permissions: ['clinical:read'],
    dataScope: 'department'
  };

  // Automatic branch + department constraint when omitted in query
  const defaultDeptScope = ScopeGuard.resolveEffectiveQueryScope(deptScopedSession, {});
  assert.equal(defaultDeptScope.tenantId, 'tenant-hosp-1');
  assert.equal(defaultDeptScope.branchId, 'branch-main-a');
  assert.equal(defaultDeptScope.departmentId, 'dept-cardiology');

  // Adversarial: Department-scoped staff tampering with departmentId=dept-oncology -> 403 FORBIDDEN
  assert.throws(
    () => {
      ScopeGuard.resolveEffectiveQueryScope(deptScopedSession, { departmentId: 'dept-oncology' });
    },
    (err) => err.statusCode === 403
  );

  // Adversarial: Cross-tenant tampering -> 403 TENANT_ACCESS_DENIED
  assert.throws(
    () => {
      ScopeGuard.resolveEffectiveQueryScope(deptScopedSession, { tenantId: 'tenant-hosp-2' });
    },
    (err) => err.statusCode === 403 && err.code === 'TENANT_ACCESS_DENIED'
  );

  // 3. Tenant-wide admin session can filter by any branch/department within their own tenant
  const tenantAdminSession = {
    userId: 'admin-1',
    tenantId: 'tenant-hosp-1',
    roles: ['HOSPITAL_ADMIN'],
    permissions: ['*'],
    dataScope: 'tenant'
  };
  const adminScope = ScopeGuard.resolveEffectiveQueryScope(tenantAdminSession, {
    branchId: 'branch-other-b',
    departmentId: 'dept-oncology'
  });
  assert.equal(adminScope.tenantId, 'tenant-hosp-1');
  assert.equal(adminScope.branchId, 'branch-other-b');
  assert.equal(adminScope.departmentId, 'dept-oncology');
});

// ============================================================================
// CAP-06: Partner Profile Transition Staff Revalidation & Immediate Restriction
// ============================================================================
test('CAP-06: Partner profile transition revalidates existing staff, restricts incompatible roles, and blocks login', async () => {
  const staffService = new StaffAdministrationService();

  // 1. Verify PROFILE_ALLOWED_ROLES_MAP matrix
  assert.equal(PROFILE_ALLOWED_ROLES_MAP.PATHOLOGY.has('PATHOLOGIST'), true);
  assert.equal(PROFILE_ALLOWED_ROLES_MAP.PATHOLOGY.has('PHLEBOTOMIST'), true);
  assert.equal(PROFILE_ALLOWED_ROLES_MAP.PATHOLOGY.has('DISPENSING_PHARMACIST'), false);
  assert.equal(PROFILE_ALLOWED_ROLES_MAP.PATHOLOGY.has('STAFF_NURSE'), false);
  assert.equal(PROFILE_ALLOWED_ROLES_MAP.RESTRICTED.size, 0);

  // 2. Register an operational staff credential (e.g., DISPENSING_PHARMACIST in a HOSPITAL)
  const testEmail = `pharmacist.cap06.${Date.now()}@docsearch.test`;
  realAuthService.registerPartnerUserCredential({
    email: testEmail,
    plainPassword: 'Password123!',
    firstName: 'Ramesh',
    lastName: 'Pharmacist',
    tenantId: 'tenant-cap06-test',
    tenantName: 'City Hospital',
    organizationType: 'HOSPITAL',
    roles: ['DISPENSING_PHARMACIST'],
    status: 'ACTIVE'
  });

  // Before restriction: user can authenticate
  const beforeAuth = await realAuthService.authenticateUser(testEmail, 'Password123!');
  assert.ok(beforeAuth, 'Active pharmacist should authenticate before profile transition');
  assert.deepEqual(beforeAuth.roles, ['DISPENSING_PHARMACIST']);
  assert.equal(beforeAuth.permissions.includes('staff:write'), false);

  // Simulate profile transition HOSPITAL -> PATHOLOGY restricting the incompatible DISPENSING_PHARMACIST
  await realAuthService.setPartnerUserStatus(testEmail, 'RESTRICTED');

  // After restriction: user authentication is immediately blocked (throws account not active/suspended error)
  await assert.rejects(
    async () => {
      await realAuthService.authenticateUser(testEmail, 'Password123!');
    },
    /not active or has been suspended/i,
    'RESTRICTED staff member must be immediately blocked from authenticating after profile transition'
  );

  // Verify StaffAdministrationService.revalidateStaffOnProfileChange rejects RESTRICTED target profile
  await assert.rejects(
    async () => {
      await staffService.revalidateStaffOnProfileChange('tenant-cap06-test', 'UNKNOWN_INVALID_TYPE', {
        userId: 'admin-1',
        tenantId: 'tenant-cap06-test',
        roles: ['OWNER'],
        permissions: ['*'],
        dataScope: 'tenant'
      });
    },
    (err) => err.statusCode === 400
  );
});

// ============================================================================
// CAP-07: RegistrationFormPolicyService Canonical Facility Types & Plans
// ============================================================================
test('CAP-07: RegistrationFormPolicyService supports all 6 canonical facility types including DIAGNOSTIC_CENTRE and PHARMACY_WHOLESALE', () => {
  const expectedTypes = [
    'HOSPITAL',
    'CLINIC',
    'PATHOLOGY',
    'PHARMACY',
    'DIAGNOSTIC_CENTRE',
    'PHARMACY_WHOLESALE'
  ];

  for (const ft of expectedTypes) {
    assert.equal(
      CANONICAL_ALLOWED_FACILITY_TYPES.includes(ft),
      true,
      `CANONICAL_ALLOWED_FACILITY_TYPES must include ${ft}`
    );
    assert.equal(
      DEFAULT_REGISTRATION_FORM_POLICY.allowedFacilityTypes.includes(ft),
      true,
      `DEFAULT_REGISTRATION_FORM_POLICY.allowedFacilityTypes must include ${ft}`
    );
    assert.equal(
      registrationFormPolicyService.getPolicy().allowedFacilityTypes.includes(ft),
      true,
      `registrationFormPolicyService.getPolicy().allowedFacilityTypes must include ${ft}`
    );
  }

  // Verify resolveCanonicalRequestedPlan resolves dedicated plans for DIAGNOSTIC_CENTRE and PHARMACY_WHOLESALE
  const diagPlan = resolveCanonicalRequestedPlan('DIAGNOSTIC_CENTRE');
  assert.equal(diagPlan.code, 'PLAN_RADIO_FREE_YR1');
  assert.equal(diagPlan.isFree, true);

  const wholesalePlan = resolveCanonicalRequestedPlan('PHARMACY_WHOLESALE');
  assert.equal(wholesalePlan.code, 'PLAN_PHARMA_WHOLESALE_FREE_YR1');
  assert.equal(wholesalePlan.isFree, true);
});

// ============================================================================
// END-TO-END HTTP ROUTE ADVERSARIAL VERIFICATION (Fastify buildApp().inject)
// ============================================================================
test('CAP-02, CAP-04, CAP-05 End-to-End Fastify HTTP Route Adversarial Verification', async () => {
  const { buildApp } = await import('../dist/app.js');
  const { signJwt } = await import('@docsearch/auth');
  const app = await buildApp();
  await app.ready();

  const JWT_SECRET = process.env.JWT_SECRET || 'docsearch_master_jwt_secret_dev_32char_key_only';
  const makeToken = (payload) =>
    signJwt(
      {
        sub: payload.userId || '11111111-1111-4111-8111-111111111111',
        userId: payload.userId || '11111111-1111-4111-8111-111111111111',
        email: payload.email || 'staff@docsearch.test',
        actorEmail: payload.email || 'staff@docsearch.test',
        tenantId: payload.tenantId || '22222222-2222-4222-8222-222222222222',
        branchId: payload.branchId,
        departmentId: payload.departmentId,
        roles: payload.roles || ['PHLEBOTOMIST'],
        permissions: payload.permissions || resolveStrictPermissionsForRoles(payload.roles || ['PHLEBOTOMIST']),
        dataScope: payload.dataScope || 'tenant',
        isSuperAdmin: false,
        iss: 'docsearch-api',
        aud: 'docsearch-platform'
      },
      { secret: JWT_SECRET, expiresInSeconds: 3600, issuer: 'docsearch-api', audience: 'docsearch-platform' }
    );

  try {
    // 1. CAP-02 HTTP Route: PHLEBOTOMIST attempting POST /api/v1/partner/staff/members -> 403 Forbidden
    const phlebToken = makeToken({
      roles: ['PHLEBOTOMIST'],
      permissions: resolveStrictPermissionsForRoles(['PHLEBOTOMIST'])
    });

    const staffCreateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/staff/members',
      headers: { authorization: `Bearer ${phlebToken}` },
      payload: {
        firstName: 'Unauthorized',
        lastName: 'Admin',
        workEmail: 'unauth@docsearch.test',
        phone: '9876543210',
        primaryRole: 'HOSPITAL_ADMIN'
      }
    });
    assert.equal(
      staffCreateRes.statusCode,
      403,
      `Expected 403 for PHLEBOTOMIST calling POST /api/v1/partner/staff/members, got ${staffCreateRes.statusCode}`
    );

    // 2. CAP-05 HTTP Route: Branch-scoped staff tampering with ?branchId=other-branch on GET /api/v1/partner/clinical/patients -> 403
    const branchStaffToken = makeToken({
      roles: ['RECEPTIONIST'],
      permissions: ['clinical:read', 'patients:read'],
      dataScope: 'branch',
      branchId: '33333333-3333-4333-8333-333333333333'
    });

    const tamperedBranchClinicalRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients?branchId=99999999-9999-4999-8999-999999999999',
      headers: { authorization: `Bearer ${branchStaffToken}` }
    });
    assert.equal(
      tamperedBranchClinicalRes.statusCode,
      403,
      `Expected 403 for branch-scoped staff tampering with ?branchId on clinical patients route, got ${tamperedBranchClinicalRes.statusCode}`
    );

    // 3. CAP-05 HTTP Route: Department-scoped staff tampering with ?departmentId=other-dept on GET /api/v1/partner/billing/invoices -> 403
    const deptStaffToken = makeToken({
      roles: ['STAFF_NURSE'],
      permissions: ['billing:read', 'clinical:read'],
      dataScope: 'department',
      branchId: '33333333-3333-4333-8333-333333333333',
      departmentId: 'dept-cardiology'
    });

    const tamperedDeptBillingRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/billing/invoices?departmentId=dept-oncology',
      headers: { authorization: `Bearer ${deptStaffToken}` }
    });
    assert.equal(
      tamperedDeptBillingRes.statusCode,
      403,
      `Expected 403 for department-scoped staff tampering with ?departmentId on billing invoices route, got ${tamperedDeptBillingRes.statusCode}`
    );

    // 4. CAP-04 HTTP Route: POST /api/v1/partner/pharmacy/wholesale/b2b-dispatch rejects missing Wholesale Drug License -> 403
    const pharmaAdminToken = makeToken({
      roles: ['PHARMACY_DIRECTOR'],
      permissions: ['pharmacy:write', 'pharmacy:read'],
      dataScope: 'tenant'
    });

    const b2bMissingDlRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/wholesale/b2b-dispatch',
      headers: { authorization: `Bearer ${pharmaAdminToken}` },
      payload: {
        buyerName: 'City Medicos',
        buyerDlNo: 'DL-20B-MH-88219',
        wholesaleLicenseNumber: '',
        items: [{ itemDescription: 'Paracetamol 650mg', batchNumber: 'B1', quantity: 50, unitPricePtr: 18 }]
      }
    });
    assert.equal(
      b2bMissingDlRes.statusCode,
      403,
      `Expected 403 for wholesale B2B dispatch without seller Wholesale Drug License, got ${b2bMissingDlRes.statusCode}`
    );
  } finally {
    await app.close();
  }
});

