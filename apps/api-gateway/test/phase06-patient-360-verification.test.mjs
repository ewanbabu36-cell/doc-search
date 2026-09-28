import test from 'node:test';
import assert from 'node:assert/strict';
import { signJwt } from '@docsearch/auth';
import { buildApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';

function makeToken({
  userId,
  tenantId,
  partnerId,
  branchId = 'loc-branch-a',
  departmentId = 'OPD',
  roles = ['PARTNER_ADMIN', 'ATTENDING_DOCTOR'],
  permissions = ['*'],
  dataScope = 'tenant'
}) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt(
    {
      sub: userId,
      email: `${userId}@docsearch.health`,
      tenantId,
      organizationId: partnerId || tenantId,
      branchId,
      departmentId,
      roles,
      permissions,
      scope: dataScope,
      jti: `sess_${userId}_${Math.random().toString(36).slice(2, 10)}`,
      iat: now - 30,
      exp: now + 3600
    },
    {
      secret: env.JWT_SECRET,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresInSeconds: 3600
    }
  );
}

test('DOC SEARCH — PHASE 06: PATIENT 360 ENGINE VERIFICATION SUITE (GROUPS A–I)', async (t) => {
  const app = await buildApp();
  await app.ready();

  t.after(async () => {
    await app.close();
  });

  const tenantA = '11111111-1111-4111-8111-111111111601';
  const tenantB = '22222222-2222-4222-8222-222222222602';
  const tenantZero = '00000000-0000-4000-8000-000000000600';

  const tokenTenantAAdmin = makeToken({
    userId: 'doc-p06-tenant-a',
    tenantId: tenantA,
    partnerId: 'partner-alpha',
    branchId: 'loc-branch-a',
    departmentId: 'OPD',
    roles: ['PARTNER_ADMIN', 'ATTENDING_DOCTOR', 'PATHOLOGIST', 'RADIOLOGIST', 'PHARMACIST', 'BILLING_EXECUTIVE'],
    permissions: ['*'],
    dataScope: 'tenant'
  });

  const tokenTenantBAdmin = makeToken({
    userId: 'doc-p06-tenant-b',
    tenantId: tenantB,
    partnerId: 'partner-beta',
    branchId: 'loc-branch-b',
    departmentId: 'OPD',
    roles: ['PARTNER_ADMIN', 'ATTENDING_DOCTOR'],
    permissions: ['*'],
    dataScope: 'tenant'
  });

  const tokenBranchAScoped = makeToken({
    userId: 'doc-p06-branch-a',
    tenantId: tenantA,
    partnerId: 'partner-alpha',
    branchId: 'loc-branch-a',
    departmentId: 'OPD',
    roles: ['ATTENDING_DOCTOR'],
    permissions: ['PATIENT:READ', 'PATIENT:CREATE', 'PATIENT:UPDATE', 'ENCOUNTER:READ', 'ENCOUNTER:CREATE'],
    dataScope: 'branch'
  });

  const tokenBranchBScoped = makeToken({
    userId: 'doc-p06-branch-b',
    tenantId: tenantA,
    partnerId: 'partner-alpha',
    branchId: 'loc-branch-b',
    departmentId: 'OPD',
    roles: ['ATTENDING_DOCTOR'],
    permissions: ['PATIENT:READ', 'PATIENT:CREATE', 'PATIENT:UPDATE', 'ENCOUNTER:READ', 'ENCOUNTER:CREATE'],
    dataScope: 'branch'
  });

  const tokenDeniedRoleNurse = makeToken({
    userId: 'nurse-p06-readonly',
    tenantId: tenantA,
    partnerId: 'partner-alpha',
    branchId: 'loc-branch-a',
    departmentId: 'OPD',
    roles: ['NURSE'],
    permissions: ['PATIENT:READ', 'ENCOUNTER:READ'],
    dataScope: 'branch'
  });

  const tokenZeroStateTenant = makeToken({
    userId: 'admin-p06-zerostate',
    tenantId: tenantZero,
    partnerId: 'partner-zero',
    branchId: 'loc-zero-a',
    departmentId: 'OPD',
    roles: ['PARTNER_ADMIN', 'ATTENDING_DOCTOR'],
    permissions: ['*'],
    dataScope: 'tenant'
  });

  let canonicalPatientId = '';
  let canonicalMrn = '';

  // =========================================================================
  // GROUP F — ZERO-STATE VERIFICATION (NEW PARTNER / TENANT)
  // =========================================================================
  await t.test('Group F: Zero-State — New partner opens with 0 patients, 0 encounters, 0 appointments, 0 results, 0 fabricated records', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenZeroStateTenant}`,
        'x-partner-id': 'partner-zero'
      }
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.zeroState, true);
    assert.equal(body.total, 0);
    assert.deepEqual(body.data, []);
    assert.deepEqual(body.counts, {
      patients: 0,
      encounters: 0,
      appointments: 0,
      labResults: 0,
      radiologyReports: 0,
      prescriptions: 0,
      pharmacyEvents: 0
    });
  });

  // =========================================================================
  // GROUP A — PATIENT IDENTITY (CREATE, RETRIEVE, UPDATE, DUPLICATE, INVALID ID)
  // =========================================================================
  await t.test('Group A: Patient Identity — Create, Retrieve, Update, Duplicate Handling, and Invalid Patient ID', async () => {
    // 1. Create Patient
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        firstName: 'Vikram',
        lastName: 'Sarabhai',
        dateOfBirth: '1982-08-12',
        sex: 'MALE',
        mobileNumber: '+919820012345',
        email: 'vikram.sarabhai@example.com',
        address: 'Ahmedabad, Gujarat',
        branchId: 'loc-branch-a'
      }
    });
    assert.equal(createRes.statusCode, 201);
    const created = createRes.json().data;
    assert.ok(created.patientId);
    assert.ok(created.mrn.startsWith('MRN-'));
    assert.equal(created.partnerId, 'partner-alpha');
    assert.equal(created.branchId, 'loc-branch-a');

    canonicalPatientId = created.patientId;
    canonicalMrn = created.mrn;

    // 2. Retrieve Patient
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(getRes.statusCode, 200);
    assert.equal(getRes.json().data.patientId, canonicalPatientId);
    assert.equal(getRes.json().data.mrn, canonicalMrn);

    // 3. Update Patient
    const updateRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        address: 'ISRO Campus, Ahmedabad, Gujarat',
        emergencyContact: {
          name: 'Mrinalini Sarabhai',
          phone: '+919820099999',
          relation: 'SPOUSE'
        }
      }
    });
    assert.equal(updateRes.statusCode, 200);
    assert.equal(updateRes.json().data.address, 'ISRO Campus, Ahmedabad, Gujarat');
    assert.equal(updateRes.json().data.emergencyContact.name, 'Mrinalini Sarabhai');

    // 4. Duplicate Handling: Idempotent replay on same demographics + MRN vs 409 Conflict on different person with same MRN
    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        firstName: 'Vikram',
        lastName: 'Sarabhai',
        dateOfBirth: '1982-08-12',
        sex: 'MALE',
        mrn: canonicalMrn
      }
    });
    assert.equal(replayRes.statusCode, 200);
    assert.equal(replayRes.json().idempotentReplay, true);
    assert.equal(replayRes.json().data.patientId, canonicalPatientId);

    const conflictMrnRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        firstName: 'Homi',
        lastName: 'Bhabha',
        dateOfBirth: '1979-10-30',
        sex: 'MALE',
        mrn: canonicalMrn
      }
    });
    assert.equal(conflictMrnRes.statusCode, 409);

    // 5. Invalid Patient ID (MRN passed as patientId -> 400; Non-existent UUID -> 404)
    const badIdRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${canonicalMrn}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(badIdRes.statusCode, 400);

    const notFoundRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/patient-360/patients/99999999-9999-4999-8999-999999999991',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(notFoundRes.statusCode, 404);
  });

  // =========================================================================
  // GROUP B — TENANT ISOLATION (CROSS-TENANT READ & MUTATION BLOCKED)
  // =========================================================================
  await t.test('Group B: Tenant Isolation — Same patient ID attack, Cross-tenant read, and Cross-tenant mutation fail closed (403)', async () => {
    const crossTenantRead = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantBAdmin}`
      }
    });
    assert.equal(crossTenantRead.statusCode, 403);

    const crossTenantMutation = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantBAdmin}`
      },
      payload: {
        firstName: 'TamperedByTenantB'
      }
    });
    assert.equal(crossTenantMutation.statusCode, 403);
  });

  // =========================================================================
  // GROUP C — PARTNER ISOLATION (CROSS-PARTNER ACCESS & MUTATION BLOCKED)
  // =========================================================================
  await t.test('Group C: Partner Isolation — Cross-partner access and cross-partner mutation fail closed (403)', async () => {
    const crossPartnerRead = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-rival-beta'
      }
    });
    assert.equal(crossPartnerRead.statusCode, 403);

    const crossPartnerPatch = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-rival-beta'
      },
      payload: {
        address: 'Unauthorized Partner Mutation'
      }
    });
    assert.equal(crossPartnerPatch.statusCode, 403);
  });

  // =========================================================================
  // GROUP D — LOCATION SCOPE (AUTHORIZED LOCATION vs UNAUTHORIZED LOCATION)
  // =========================================================================
  await t.test('Group D: Location Scope — Authorized branch succeeds (200) while unauthorized branch fails closed (403)', async () => {
    const authBranchRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenBranchAScoped}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(authBranchRes.statusCode, 200);

    const unauthBranchRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenBranchBScoped}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(unauthBranchRes.statusCode, 403);

    const unauthBranchPatch = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenBranchBScoped}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        address: 'Cross-Branch Tamper'
      }
    });
    assert.equal(unauthBranchPatch.statusCode, 403);
  });

  // =========================================================================
  // GROUP E — LONGITUDINAL CONTINUITY (REGISTRATION → ENCOUNTER → LAB → RADIOLOGY → PRESCRIPTION → PHARMACY → TIMELINE)
  // =========================================================================
  await t.test('Group E: Longitudinal Continuity — Full end-to-end journey across Encounter, Lab, Radiology, Prescription, Pharmacy, Billing, and Timeline', async () => {
    // 1. Check-in Encounter
    const encRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/encounters/check-in',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        departmentId: 'OPD',
        encounterType: 'OPD',
        chiefComplaint: 'Chest discomfort and elevated blood pressure'
      }
    });
    assert.equal(encRes.statusCode, 201);
    const encounterId = encRes.json().data.encounterId;

    // 2. Record Vitals & Clinical Consultation
    const consRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/consultations',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        encounterId,
        vitals: { bp: '148/92', pulse: 84, tempF: 98.4, spo2: 99 },
        consultationNotes: 'Suspected hypertension; order Troponin/CBC, Chest X-Ray, and start Amlodipine 5mg.',
        diagnoses: [{ code: 'I10', description: 'Essential (primary) hypertension' }]
      }
    });
    assert.equal(consRes.statusCode, 200);

    // 3. Encounter → Lab Order & Result
    const labOrderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/orders',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        encounterId,
        targetDepartmentId: 'LIMS',
        orderType: 'LAB',
        itemCode: 'LAB-TROP-CBC',
        itemName: 'Troponin-I & Complete Blood Count'
      }
    });
    assert.equal(labOrderRes.statusCode, 201);
    const labOrderId = labOrderRes.json().data.orderId;

    const labResultRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/results',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        encounterId,
        orderId: labOrderId,
        resultType: 'LAB_RESULT',
        summary: 'Troponin-I negative (<0.01 ng/mL); CBC normal',
        structuredValues: { troponinI: 0.005, hemoglobin: 14.4 },
        verifyImmediately: true
      }
    });
    assert.equal(labResultRes.statusCode, 201);

    // 4. Encounter → Radiology Order & Report
    const radOrderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/orders',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        encounterId,
        targetDepartmentId: 'RADIOLOGY',
        orderType: 'RADIOLOGY',
        itemCode: 'RAD-CXR-PA',
        itemName: 'Digital Chest X-Ray PA View'
      }
    });
    assert.equal(radOrderRes.statusCode, 201);
    const radOrderId = radOrderRes.json().data.orderId;

    const radReportRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/results',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        encounterId,
        orderId: radOrderId,
        resultType: 'RADIOLOGY_REPORT',
        summary: 'Normal cardiothoracic ratio; lung fields clear.',
        structuredValues: { impression: 'Normal Chest X-Ray' },
        verifyImmediately: true
      }
    });
    assert.equal(radReportRes.statusCode, 201);

    // 5. Encounter → Prescription → Pharmacy Dispensing
    const rxOrderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/orders',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        encounterId,
        targetDepartmentId: 'PHARMACY',
        orderType: 'PHARMACY',
        itemCode: 'RX-AMLO-5',
        itemName: 'Tab Amlodipine 5mg OD x 30 Days'
      }
    });
    assert.equal(rxOrderRes.statusCode, 201);
    const rxOrderId = rxOrderRes.json().data.orderId;

    const rxSignRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/results',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        encounterId,
        orderId: rxOrderId,
        resultType: 'PRESCRIPTION',
        summary: 'Signed e-Prescription for Tab Amlodipine 5mg OD',
        structuredValues: { drug: 'Amlodipine 5mg', qty: 30 },
        verifyImmediately: true
      }
    });
    assert.equal(rxSignRes.statusCode, 201);

    const dispRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/results',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        patientId: canonicalPatientId,
        encounterId,
        orderId: rxOrderId,
        resultType: 'PHARMACY_DISPENSING',
        summary: 'Dispensed 30 tablets of Amlodipine 5mg (Batch AML-2026)',
        structuredValues: { batchNo: 'AML-2026', dispensedQty: 30 },
        verifyImmediately: true
      }
    });
    assert.equal(dispRes.statusCode, 201);

    // 6. Verify Canonical Patient 360 Read Model & Longitudinal Timeline
    const p360Res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(p360Res.statusCode, 200);
    const p360 = p360Res.json().data;
    assert.equal(p360.demographics.patientId, canonicalPatientId);
    assert.equal(p360.partnerLocation.partnerId, 'partner-alpha');
    assert.equal(p360.partnerLocation.locationId, 'loc-branch-a');
    assert.equal(p360.vitals.length, 1);
    assert.equal(p360.clinicalNotes.length, 1);
    assert.equal(p360.labOrdersResults.orders.length, 1);
    assert.equal(p360.labOrdersResults.results.length, 1);
    assert.equal(p360.radiologyStudiesReports.orders.length, 1);
    assert.equal(p360.radiologyStudiesReports.reports.length, 1);
    assert.equal(p360.prescriptions.length, 1);
    assert.equal(p360.pharmacyEvents.length, 1);
    assert.equal(p360.workflowTasks.length, 3);

    const tlRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${canonicalPatientId}/timeline`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(tlRes.statusCode, 200);
    const timeline = tlRes.json().data;
    assert.ok(timeline.length >= 9);
    for (const ev of timeline) {
      assert.equal(ev.patientId, canonicalPatientId);
      assert.equal(ev.tenantId, tenantA);
      assert.equal(ev.partnerId, 'partner-alpha');
      assert.equal(ev.locationId, 'loc-branch-a');
      assert.ok(ev.occurredAt);
      assert.ok(ev.recordedAt);
      assert.ok(ev.actor);
      assert.ok(ev.department);
      assert.ok(ev.source);
      assert.ok(ev.entityId);
    }
  });

  // =========================================================================
  // GROUP G — AUTHORIZATION & COMMERCIAL ENTITLEMENT CONTROL
  // =========================================================================
  await t.test('Group G: Authorization & Commercial Entitlement — Denied role, inactive staff, suspended license, and missing entitlement fail closed (403)', async () => {
    // 1. Denied role (NURSE lacks PATIENT:CREATE)
    const deniedRoleRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenDeniedRoleNurse}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        firstName: 'Unauthorized',
        lastName: 'Patient',
        dateOfBirth: '1995-01-01',
        sex: 'FEMALE'
      }
    });
    assert.equal(deniedRoleRes.statusCode, 403);

    // 2. Inactive / Suspended staff blocked
    const inactiveStaffRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        firstName: 'InactiveStaff',
        lastName: 'Patient',
        dateOfBirth: '1995-01-01',
        sex: 'FEMALE',
        staffStatusOverride: 'SUSPENDED'
      }
    });
    assert.equal(inactiveStaffRes.statusCode, 403);

    // 3. Commercial License Suspended blocked (403 COMMERCIAL_ACCESS_DENIED)
    const suspendedLicenseRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha',
        'x-license-status': 'SUSPENDED'
      }
    });
    assert.equal(suspendedLicenseRes.statusCode, 403);

    // 4. Entitlement Restriction blocked (403 COMMERCIAL_ACCESS_DENIED)
    const missingEntitlementRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha',
        'x-entitlement-missing': 'true'
      }
    });
    assert.equal(missingEntitlementRes.statusCode, 403);
  });

  // =========================================================================
  // GROUP H — PERSISTENCE & TRANSACTION ROLLBACK
  // =========================================================================
  await t.test('Group H: Persistence — Read-after-write projection consistency and simulated audit failure rollback', async () => {
    const before360 = (
      await app.inject({
        method: 'GET',
        url: `/api/v1/partner/patient-360/${canonicalPatientId}`,
        headers: {
          authorization: `Bearer ${tokenTenantAAdmin}`,
          'x-partner-id': 'partner-alpha'
        }
      })
    ).json().data;

    // Perform write update and verify immediate read-after-write consistency
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        email: 'vikram.updated@isro.gov.in'
      }
    });

    const after360 = (
      await app.inject({
        method: 'GET',
        url: `/api/v1/partner/patient-360/${canonicalPatientId}`,
        headers: {
          authorization: `Bearer ${tokenTenantAAdmin}`,
          'x-partner-id': 'partner-alpha'
        }
      })
    ).json().data;

    assert.equal(after360.contact.email, 'vikram.updated@isro.gov.in');
    assert.ok(after360.projectionVersion > before360.projectionVersion);

    // Transaction Rollback on Audit Failure
    const rollbackMrn = 'MRN-2026-999888';
    const failAuditRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        firstName: 'Rollback',
        lastName: 'Candidate',
        dateOfBirth: '1991-03-15',
        sex: 'MALE',
        mrn: rollbackMrn,
        simulateAuditFailure: true
      }
    });
    assert.equal(failAuditRes.statusCode, 500);

    // Verify rollbackMrn was never persisted
    const searchRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients?q=${rollbackMrn}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(searchRes.statusCode, 200);
    assert.equal(searchRes.json().total, 0);
  });

  // =========================================================================
  // GROUP I — ADVERSARIAL SCOPE & ID SUBSTITUTION ATTACKS
  // =========================================================================
  await t.test('Group I: Adversarial — tenantId, partnerId, locationId, and query/body scope override attempts fail closed (403/400/409)', async () => {
    // 1. Query tenantId override attempt
    const queryTenantOverride = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${canonicalPatientId}?tenantId=${tenantB}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(queryTenantOverride.statusCode, 403);

    // 2. Query partnerId override attempt
    const queryPartnerOverride = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${canonicalPatientId}?partnerId=partner-external-spoof`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(queryPartnerOverride.statusCode, 403);

    // 3. Query locationId override attempt by branch-scoped user
    const queryLocationOverride = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients?locationId=loc-branch-b`,
      headers: {
        authorization: `Bearer ${tokenBranchAScoped}`,
        'x-partner-id': 'partner-alpha'
      }
    });
    assert.equal(queryLocationOverride.statusCode, 403);

    // 4. Body tenantId override attempt during patient mutation
    const bodyTenantOverride = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/patients/${canonicalPatientId}`,
      headers: {
        authorization: `Bearer ${tokenTenantAAdmin}`,
        'x-partner-id': 'partner-alpha'
      },
      payload: {
        tenantId: tenantB,
        address: 'Spoofed Tenant Mutation'
      }
    });
    assert.equal(bodyTenantOverride.statusCode, 403);
  });
});
