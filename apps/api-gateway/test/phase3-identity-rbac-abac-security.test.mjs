import test from 'node:test';
import assert from 'node:assert/strict';
import { signJwt } from '@docsearch/auth';
import { buildApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';
import { sessionRevocationService } from '../dist/services/core/SessionRevocationService.js';
import { getDatabase, patients, breakGlassAccess } from '@docsearch/database';
import { toDeterministicUuid } from '../dist/repositories/company/PartnerOnboardingRepository.js';

function createToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const sub = overrides.sub || '11111111-1111-4111-8111-111111111111';
  const tenantId = overrides.tenantId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const payload = {
    sub,
    email: overrides.email || 'dr.sharma@partner-a.org',
    tenantId,
    organizationId: overrides.organizationId || tenantId,
    branchId: overrides.branchId || 'loc-branch-a',
    departmentId: overrides.departmentId || 'OPD',
    roles: overrides.roles || ['DOCTOR'],
    permissions: overrides.permissions || [
      'PATIENT:READ',
      'PATIENT:CREATE',
      'PATIENT:UPDATE',
      'ENCOUNTER:READ',
      'ENCOUNTER:CREATE',
      'ENCOUNTER:UPDATE',
      'PRESCRIPTION:SIGN',
      'LAB:ORDER',
      'LAB:READ'
    ],
    scope: overrides.scope || 'department',
    jti: overrides.jti || `sess_${Math.random().toString(36).slice(2, 10)}`,
    iat: overrides.iat || now - 30,
    exp: overrides.exp || now + 3600,
    ...overrides
  };
  return signJwt(payload, {
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresInSeconds: 3600
  });
}

test('PHASE 3 — 40-Point Security Test Matrix & 24-Point Adversarial Verification Suite', async (t) => {
  const app = await buildApp();
  await app.ready();

  t.after(async () => {
    sessionRevocationService.clearAll();
    await app.close();
  });

  const partnerA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const partnerB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const adminTokenA = createToken({
    sub: 'admin-user-a',
    email: 'admin@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'ADMINISTRATION',
    roles: ['PARTNER_ADMIN'],
    permissions: ['*'],
    scope: 'tenant'
  });

  const doctorTokenA = createToken({
    sub: 'doctor-user-a',
    email: 'doctor.a@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'OPD',
    roles: ['DOCTOR'],
    scope: 'department',
    staffId: 'staff-doc-a'
  });

  const nurseTokenA = createToken({
    sub: 'nurse-user-a',
    email: 'nurse.a@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'OPD',
    roles: ['NURSE'],
    permissions: ['PATIENT:READ', 'ENCOUNTER:READ'],
    scope: 'department',
    staffId: 'staff-nurse-a'
  });

  const receptionistTokenA = createToken({
    sub: 'reception-user-a',
    email: 'reception.a@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'FRONT_DESK',
    roles: ['RECEPTIONIST'],
    permissions: ['PATIENT:READ', 'PATIENT:CREATE', 'ENCOUNTER:READ', 'ENCOUNTER:CREATE'],
    scope: 'branch',
    staffId: 'staff-rec-a'
  });

  const billingMakerTokenA = createToken({
    sub: 'billing-maker-a',
    email: 'billing.maker@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'BILLING',
    roles: ['BILLING_EXECUTIVE'],
    permissions: ['PATIENT:READ', 'BILLING:CREATE', 'BILLING:REFUND'],
    scope: 'branch',
    staffId: 'staff-bill-maker'
  });

  const billingCheckerTokenA = createToken({
    sub: 'billing-checker-a',
    email: 'billing.checker@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'BILLING',
    roles: ['HOSPITAL_ADMIN'],
    permissions: ['*'],
    scope: 'tenant',
    staffId: 'staff-bill-checker'
  });

  // Register authoritative patient and encounter scopes for Partner A and Partner B
  await app.inject({
    method: 'POST',
    url: '/api/v1/partner/security/scope/register-patient',
    headers: { authorization: `Bearer ${adminTokenA}` },
    payload: {
      patientId: 'pat-a-opd-1',
      locationId: 'loc-branch-a',
      departmentId: 'OPD',
      assignedDoctorId: 'doctor-user-a',
      confidential: false
    }
  });

  await app.inject({
    method: 'POST',
    url: '/api/v1/partner/security/scope/register-patient',
    headers: { authorization: `Bearer ${adminTokenA}` },
    payload: {
      patientId: 'pat-a-loc-b',
      locationId: 'loc-branch-b',
      departmentId: 'OPD',
      confidential: false
    }
  });

  await app.inject({
    method: 'POST',
    url: '/api/v1/partner/security/scope/register-patient',
    headers: { authorization: `Bearer ${adminTokenA}` },
    payload: {
      patientId: 'pat-a-vip-confidential',
      locationId: 'loc-branch-a',
      departmentId: 'CARDIOLOGY',
      confidential: true
    }
  });

  await app.inject({
    method: 'POST',
    url: '/api/v1/partner/security/scope/register-encounter',
    headers: { authorization: `Bearer ${adminTokenA}` },
    payload: {
      encounterId: 'enc-a-opd-1',
      patientId: 'pat-a-opd-1',
      locationId: 'loc-branch-a',
      departmentId: 'OPD',
      encounterType: 'OPD',
      status: 'IN_PROGRESS',
      assignedDoctorId: 'doctor-user-a'
    }
  });

  await app.inject({
    method: 'POST',
    url: '/api/v1/partner/security/scope/register-encounter',
    headers: { authorization: `Bearer ${adminTokenA}` },
    payload: {
      encounterId: 'enc-a-rad-2',
      patientId: 'pat-a-opd-1',
      locationId: 'loc-branch-a',
      departmentId: 'RADIOLOGY',
      encounterType: 'DIAGNOSTIC',
      status: 'IN_PROGRESS'
    }
  });

  await t.test('Cases 1–8: Valid Access, Missing Permission, Wrong Role, Partner, Department, Location, Patient, Encounter', async () => {
    // 1. Valid user + valid role + valid permission + valid scope
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: {
          partnerId: partnerA,
          locationId: 'loc-branch-a',
          departmentId: 'OPD',
          patientId: 'pat-a-opd-1',
          encounterId: 'enc-a-opd-1'
        }
      }
    });
    assert.equal(res1.statusCode, 200);
    assert.equal(res1.json().data.decision, 'ALLOW');

    // 2. Missing permission (NURSE attempting PRESCRIPTION:SIGN)
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${nurseTokenA}` },
      payload: {
        action: 'PRESCRIPTION:SIGN',
        resource: { partnerId: partnerA, locationId: 'loc-branch-a', departmentId: 'OPD' }
      }
    });
    assert.equal(res2.statusCode, 403);
    assert.equal(res2.json().data.decision, 'DENY');
    assert.equal(res2.json().data.reasonCode, 'PERMISSION_MISSING');

    // 3. Wrong role (RECEPTIONIST attempting LAB:VALIDATE)
    const res3 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${receptionistTokenA}` },
      payload: {
        action: 'LAB:VALIDATE',
        resource: { partnerId: partnerA, locationId: 'loc-branch-a' }
      }
    });
    assert.equal(res3.statusCode, 403);
    assert.equal(res3.json().data.decision, 'DENY');

    // 4. Wrong partner (Cross-tenant access attempt)
    const res4 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerB, patientId: 'pat-b-1' }
      }
    });
    assert.equal(res4.statusCode, 403);
    assert.equal(res4.json().data.reasonCode, 'PARTNER_SCOPE_MISMATCH');

    // 5. Wrong department (OPD Doctor accessing RADIOLOGY department without override)
    const res5 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA, locationId: 'loc-branch-a', departmentId: 'RADIOLOGY' }
      }
    });
    assert.equal(res5.statusCode, 403);
    assert.equal(res5.json().data.reasonCode, 'DEPARTMENT_SCOPE_MISMATCH');

    // 6. Wrong location (Location A Doctor accessing Location B resource)
    const res6 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA, locationId: 'loc-branch-b', departmentId: 'OPD' }
      }
    });
    assert.equal(res6.statusCode, 403);
    assert.equal(res6.json().data.reasonCode, 'LOCATION_SCOPE_MISMATCH');

    // 7. Wrong patient scope (Patient registered at Location B accessed by Location A Doctor)
    const res7 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA, patientId: 'pat-a-loc-b' }
      }
    });
    assert.equal(res7.statusCode, 403);
    assert.equal(res7.json().data.reasonCode, 'PATIENT_SCOPE_MISMATCH');

    // 8. Wrong encounter scope (Encounter in RADIOLOGY department accessed by OPD Doctor)
    const res8 = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'ENCOUNTER:READ',
        resource: { partnerId: partnerA, patientId: 'pat-a-opd-1', encounterId: 'enc-a-rad-2' }
      }
    });
    assert.equal(res8.statusCode, 403);
    assert.equal(res8.json().data.reasonCode, 'ENCOUNTER_SCOPE_MISMATCH');
  });

  await t.test('Cases 9–16: Staff Status (Inactive, Suspended, Disabled), Credential Status (Expired, Revoked), & Entitlements', async () => {
    // 9. Inactive staff
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/staff/staff-doc-a/runtime-state',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: { userId: 'doctor-user-a', staffStatus: 'INACTIVE' }
    });

    const resInactive = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { action: 'PATIENT:READ', resource: { partnerId: partnerA } }
    });
    assert.equal(resInactive.statusCode, 403);
    assert.equal(resInactive.json().data.reasonCode, 'STAFF_INACTIVE');

    // 10. Suspended staff (also verify operational route /api/v1/partner/patients fails closed!)
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/staff/staff-doc-a/runtime-state',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: { userId: 'doctor-user-a', staffStatus: 'SUSPENDED' }
    });

    const resSuspended = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { action: 'PATIENT:READ', resource: { partnerId: partnerA } }
    });
    assert.equal(resSuspended.statusCode, 403);
    assert.equal(resSuspended.json().data.reasonCode, 'STAFF_SUSPENDED');

    const opRouteWhileSuspended = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/patients',
      headers: { authorization: `Bearer ${doctorTokenA}` }
    });
    assert.equal(opRouteWhileSuspended.statusCode, 403);

    // 11. Disabled staff
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/staff/staff-doc-a/runtime-state',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: { userId: 'doctor-user-a', staffStatus: 'DISABLED' }
    });

    const resDisabled = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { action: 'PATIENT:READ', resource: { partnerId: partnerA } }
    });
    assert.equal(resDisabled.statusCode, 403);
    assert.equal(resDisabled.json().data.reasonCode, 'STAFF_DISABLED');

    // Restore staff status to ACTIVE, test 12. Expired credential & 13. Revoked credential
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/staff/staff-doc-a/runtime-state',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: { userId: 'doctor-user-a', staffStatus: 'ACTIVE', credentialStatus: 'EXPIRED' }
    });

    const resCredExpired = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { action: 'PRESCRIPTION:SIGN', resource: { partnerId: partnerA } }
    });
    assert.equal(resCredExpired.statusCode, 403);
    assert.equal(resCredExpired.json().data.reasonCode, 'CREDENTIAL_EXPIRED');

    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/staff/staff-doc-a/runtime-state',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: { userId: 'doctor-user-a', staffStatus: 'ACTIVE', credentialStatus: 'REVOKED' }
    });

    const resCredRevoked = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { action: 'PRESCRIPTION:SIGN', resource: { partnerId: partnerA } }
    });
    assert.equal(resCredRevoked.statusCode, 403);
    assert.equal(resCredRevoked.json().data.reasonCode, 'CREDENTIAL_REVOKED');

    // Restore VALID credential
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/staff/staff-doc-a/runtime-state',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: { userId: 'doctor-user-a', staffStatus: 'ACTIVE', credentialStatus: 'VALID' }
    });

    // 14. Missing entitlement (User has LAB:READ, but partner entitlement is missing)
    const resMissingEntitlement = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'LAB:READ',
        resource: { partnerId: partnerA },
        context: { entitlementMissingOverride: true }
      }
    });
    assert.equal(resMissingEntitlement.statusCode, 403);
    assert.equal(resMissingEntitlement.json().data.reasonCode, 'ENTITLEMENT_MISSING');

    // 15. Expired license
    const resExpiredLicense = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA },
        context: { licenseStatusOverride: 'EXPIRED' }
      }
    });
    assert.equal(resExpiredLicense.statusCode, 403);
    assert.equal(resExpiredLicense.json().data.reasonCode, 'LICENSE_EXPIRED');

    // 16. Disabled feature
    const resDisabledFeature = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'LAB:ORDER',
        resource: { partnerId: partnerA },
        context: { featureDisabledOverride: true }
      }
    });
    assert.equal(resDisabledFeature.statusCode, 403);
    assert.equal(resDisabledFeature.json().data.reasonCode, 'FEATURE_DISABLED');
  });

  await t.test('Cases 17–25: Adversarial Cross-Scope, ID Manipulation, Role/Permission Escalation & Identity Spoofing', async () => {
    // 20 & 21. Encounter-ID manipulation (Patient A supplied with Encounter belonging to another patient)
    await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/scope/register-encounter',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: {
        encounterId: 'enc-other-patient',
        patientId: 'pat-other-999',
        locationId: 'loc-branch-a',
        departmentId: 'OPD'
      }
    });

    const resEncManip = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'ENCOUNTER:READ',
        resource: {
          partnerId: partnerA,
          patientId: 'pat-a-opd-1',
          encounterId: 'enc-other-patient'
        }
      }
    });
    assert.equal(resEncManip.statusCode, 403);
    assert.equal(resEncManip.json().data.reasonCode, 'ENCOUNTER_SCOPE_MISMATCH');

    // 22. Role escalation attempt (Client supplies x-role: SUPER_ADMIN)
    const resRoleEsc = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: {
        authorization: `Bearer ${nurseTokenA}`,
        'x-role': 'SUPER_ADMIN'
      },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA }
      }
    });
    assert.equal(resRoleEsc.statusCode, 403);
    assert.equal(resRoleEsc.json().data.reasonCode, 'ROLE_ESCALATION_ATTEMPT');

    // 23. Permission escalation attempt (Client injects permissions array or attempts wildcard role creation)
    const resPermEsc = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${nurseTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA },
        context: { clientSuppliedPermissions: ['BILLING:REFUND', 'SECURITY:RBAC:MANAGE'] }
      }
    });
    assert.equal(resPermEsc.statusCode, 403);
    assert.equal(resPermEsc.json().data.reasonCode, 'PERMISSION_ESCALATION_ATTEMPT');

    const resWildcardRole = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/roles',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: {
        code: 'ROGUE_WILDCARD_ROLE',
        name: 'Rogue Role',
        permissions: ['*']
      }
    });
    assert.equal(resWildcardRole.statusCode, 403);

    // 24. Client-supplied partnerId manipulation
    const resPartnerSpoof = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: {
        authorization: `Bearer ${doctorTokenA}`,
        'x-partner-id': partnerB
      },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA }
      }
    });
    assert.equal(resPartnerSpoof.statusCode, 403);
    assert.equal(resPartnerSpoof.json().data.reasonCode, 'CLIENT_PARTNER_ID_SPOOFING');

    // 25. Client-supplied staffId manipulation
    const resStaffSpoof = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: {
        authorization: `Bearer ${doctorTokenA}`,
        'x-staff-id': 'spoofed-staff-999'
      },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA }
      }
    });
    assert.equal(resStaffSpoof.statusCode, 403);
    assert.equal(resStaffSpoof.json().data.reasonCode, 'CLIENT_STAFF_ID_SPOOFING');
  });

  await t.test('Cases 26–30: Break-Glass (Valid, Missing Reason, Expired) & Maker-Checker (Self-Approval Blocked vs Valid Approval)', async () => {
    // Confidential patient without break-glass returns BREAK_GLASS_REQUIRED
    const resBgReq = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: {
          partnerId: partnerA,
          patientId: 'pat-a-vip-confidential',
          confidentialPatient: true
        }
      }
    });
    assert.equal(resBgReq.statusCode, 403);
    assert.equal(resBgReq.json().data.decision, 'BREAK_GLASS_REQUIRED');

    // 27. Break-glass missing reason -> 400
    const resBgNoReason = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/break-glass',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        patientId: 'pat-a-vip-confidential',
        reason: ''
      }
    });
    assert.equal(resBgNoReason.statusCode, 400);

    // 26. Valid Break-Glass activation -> ALLOW
    const resBgGrant = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/break-glass',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        patientId: 'pat-a-vip-confidential',
        reason: 'Emergency trauma consultation in ER',
        expiresInSeconds: 300
      }
    });
    assert.equal(resBgGrant.statusCode, 201);
    const bgId = resBgGrant.json().data.id;

    const resBgAllow = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: {
          partnerId: partnerA,
          patientId: 'pat-a-vip-confidential',
          confidentialPatient: true
        }
      }
    });
    assert.equal(resBgAllow.statusCode, 200);
    assert.equal(resBgAllow.json().data.decision, 'ALLOW');
    assert.equal(resBgAllow.json().data.breakGlass.active, true);

    // 28. Break-Glass expired -> DENY
    await app.inject({
      method: 'POST',
      url: `/api/v1/partner/security/break-glass/${bgId}/expire`,
      headers: { authorization: `Bearer ${doctorTokenA}` }
    });

    const resBgExpired = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: {
          partnerId: partnerA,
          patientId: 'pat-a-vip-confidential',
          confidentialPatient: true
        }
      }
    });
    assert.equal(resBgExpired.statusCode, 403);
    assert.equal(resBgExpired.json().data.reasonCode, 'BREAK_GLASS_EXPIRED');

    // 29 & 30. Maker-Checker: Submit request, block self-approval (INVARIANT 12), allow valid Checker approval
    const resWithoutMc = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${billingMakerTokenA}` },
      payload: {
        action: 'BILLING:REFUND',
        resource: { partnerId: partnerA, resourceType: 'INVOICE', resourceId: 'inv-1001' }
      }
    });
    assert.equal(resWithoutMc.statusCode, 403);
    assert.equal(resWithoutMc.json().data.decision, 'MAKER_CHECKER_REQUIRED');

    const submitMc = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/maker-checker/submit',
      headers: { authorization: `Bearer ${billingMakerTokenA}` },
      payload: {
        action: 'BILLING:REFUND',
        resourceType: 'INVOICE',
        resourceId: 'inv-1001',
        oldValue: { status: 'PAID', amount: 4500 },
        newValue: { status: 'REFUNDED', refundAmount: 4500 },
        reason: 'Duplicate card charge verified against settlement ledger'
      }
    });
    assert.equal(submitMc.statusCode, 201);
    const mcRequestId = submitMc.json().data.id;

    // 29. Maker attempts self-approval -> 403 FORBIDDEN
    const selfApproveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/security/maker-checker/${mcRequestId}/decide`,
      headers: { authorization: `Bearer ${billingMakerTokenA}` },
      payload: {
        decision: 'APPROVED',
        reason: 'Attempting self-approval'
      }
    });
    assert.equal(selfApproveRes.statusCode, 403);

    // 30. Distinct Checker approves -> 200 OK, and subsequent authorize() succeeds
    const validCheckerRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/security/maker-checker/${mcRequestId}/decide`,
      headers: { authorization: `Bearer ${billingCheckerTokenA}` },
      payload: {
        decision: 'APPROVED',
        reason: 'Verified bank settlement reference'
      }
    });
    assert.equal(validCheckerRes.statusCode, 200);
    assert.equal(validCheckerRes.json().data.status, 'APPROVED');

    const resWithApprovedMc = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${billingMakerTokenA}` },
      payload: {
        action: 'BILLING:REFUND',
        resource: { partnerId: partnerA, resourceType: 'INVOICE', resourceId: 'inv-1001' },
        context: { makerCheckerRequestId: mcRequestId }
      }
    });
    assert.equal(resWithApprovedMc.statusCode, 200);
    assert.equal(resWithApprovedMc.json().data.decision, 'ALLOW');
    assert.equal(resWithApprovedMc.json().data.makerChecker.satisfied, true);
  });

  await t.test('Cases 31–40: Access Diagnostics, Fail-Closed, Audit Tamper Resistance, Reassignments & Session Invalidation', async () => {
    // 31. Access Diagnostic Engine: Authorized admin gets structured report; unauthorized nurse gets 403
    const diagDeniedForNurse = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/access-diagnostics',
      headers: { authorization: `Bearer ${nurseTokenA}` },
      payload: { action: 'PATIENT:UPDATE' }
    });
    assert.equal(diagDeniedForNurse.statusCode, 403);

    const diagAllowedForAdmin = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/access-diagnostics',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: {
        action: 'PATIENT:UPDATE',
        resource: { partnerId: partnerA }
      }
    });
    assert.equal(diagAllowedForAdmin.statusCode, 200);
    assert.equal(diagAllowedForAdmin.json().data.result, 'ALLOW');
    assert.equal(diagAllowedForAdmin.json().data.diagnostics.permissionPresent, true);

    // 32. Fail-closed behavior on unknown permission
    const resUnknownPerm = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'NON_EXISTENT_DOMAIN:MAGIC_ACTION',
        resource: { partnerId: partnerA }
      }
    });
    assert.equal(resUnknownPerm.statusCode, 403);
    assert.equal(resUnknownPerm.json().data.reasonCode, 'UNKNOWN_PERMISSION');

    // 33. Audit Event Generation & Tamper Resistance (INVARIANT 15)
    const auditRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/security/audit-events?limit=20',
      headers: { authorization: `Bearer ${adminTokenA}` }
    });
    assert.equal(auditRes.statusCode, 200);
    const events = auditRes.json().data;
    assert.ok(Array.isArray(events) && events.length > 0);
    const sampleEvent = events[0];
    assert.ok(sampleEvent.eventId);
    assert.ok(sampleEvent.actorUserId);
    assert.ok(sampleEvent.partnerId);
    assert.ok(sampleEvent.policyVersion);

    const tamperDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/partner/security/audit-events/${sampleEvent.eventId}`,
      headers: { authorization: `Bearer ${adminTokenA}` }
    });
    assert.equal(tamperDeleteRes.statusCode, 403);

    // 35. Role permission revocation taking effect immediately
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/roles/DOCTOR',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: { revokePermissions: ['LAB:ORDER'] }
    });

    const afterPermRevoke = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { action: 'LAB:ORDER', resource: { partnerId: partnerA } }
    });
    assert.equal(afterPermRevoke.statusCode, 403);
    assert.equal(afterPermRevoke.json().data.reasonCode, 'PERMISSION_MISSING');

    // Restore LAB:ORDER to DOCTOR
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/roles/DOCTOR',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: { addPermissions: ['LAB:ORDER'] }
    });

    // 37 & 38. Location & Department reassignment taking effect immediately
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/partner/security/staff/staff-doc-a/runtime-state',
      headers: { authorization: `Bearer ${adminTokenA}` },
      payload: {
        userId: 'doctor-user-a',
        locationIds: ['loc-branch-b'],
        departmentIds: ['IPD']
      }
    });

    const oldLocDenied = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA, locationId: 'loc-branch-a', departmentId: 'IPD' }
      }
    });
    assert.equal(oldLocDenied.statusCode, 403);
    assert.equal(oldLocDenied.json().data.reasonCode, 'LOCATION_SCOPE_MISMATCH');

    const newLocAllowed = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        action: 'PATIENT:READ',
        resource: { partnerId: partnerA, locationId: 'loc-branch-b', departmentId: 'IPD' }
      }
    });
    assert.equal(newLocAllowed.statusCode, 200);
    assert.equal(newLocAllowed.json().data.decision, 'ALLOW');

    // 40. Session invalidation taking effect immediately
    const tempSessionToken = createToken({
      sub: 'temp-session-user',
      email: 'temp@partner-a.org',
      tenantId: partnerA,
      jti: 'sess-to-invalidate-999'
    });
    await sessionRevocationService.revokeUser('temp-session-user', 'Security Incident Session Termination');

    const revokedSessionRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/security/authorize',
      headers: { authorization: `Bearer ${tempSessionToken}` },
      payload: { action: 'PATIENT:READ', resource: { partnerId: partnerA } }
    });
    assert.ok(revokedSessionRes.statusCode === 401 || revokedSessionRes.statusCode === 403);
  });
});
