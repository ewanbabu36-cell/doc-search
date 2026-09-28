import test from 'node:test';
import assert from 'node:assert/strict';
import { signJwt } from '@docsearch/auth';
import { buildApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';
import { sessionRevocationService } from '../dist/services/core/SessionRevocationService.js';
import { patient360ContinuityService } from '../dist/services/partner/Patient360ContinuityService.js';

function createToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const sub = overrides.sub || '11111111-1111-4111-8111-111111111111';
  const tenantId = overrides.tenantId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const payload = {
    sub,
    email: overrides.email || 'dr.sharma@partner-a.org',
    tenantId,
    organizationId: overrides.organizationId || tenantId,
    partnerId: overrides.partnerId || tenantId,
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
      'LAB:READ',
      'LAB:VALIDATE',
      'RADIOLOGY:ORDER',
      'RADIOLOGY:REPORT',
      'PHARMACY:DISPENSE',
      'BILLING:INVOICE_CREATE',
      'BILLING:PAYMENT_COLLECT'
    ],
    scope: overrides.scope || 'tenant',
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

test('PHASE 4 — Clinical Workflow + Patient 360 + Universal ID Backbone 27-Point Verification Suite', async (t) => {
  const app = await buildApp();
  await app.ready();

  t.after(async () => {
    sessionRevocationService.clearAll();
    await app.close();
  });

  const partnerA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const partnerB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const tokenPartnerA = createToken({
    sub: 'doc-continuity-a',
    email: 'dr.continuity@partner-a.org',
    tenantId: partnerA,
    partnerId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'OPD',
    roles: ['DOCTOR'],
    scope: 'tenant'
  });

  const tokenPartnerB = createToken({
    sub: 'doc-continuity-b',
    email: 'dr.continuity@partner-b.org',
    tenantId: partnerB,
    partnerId: partnerB,
    branchId: 'loc-branch-b',
    departmentId: 'OPD',
    roles: ['DOCTOR'],
    scope: 'tenant'
  });

  // Shared variables populated across workflow lifecycle
  let createdPatient = null;
  let createdEncounter = null;
  let createdAppointment = null;
  let createdToken = null;
  let createdOrder = null;
  let createdResult = null;

  // =========================================================================
  // 1. Patient Creation
  // =========================================================================
  await t.test('1. Patient Creation — Generates Immutable Technical ID and Universal MRN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-pat-create-01'
      },
      payload: {
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        dateOfBirth: '1992-04-15',
        sex: 'FEMALE',
        mobileNumber: '+919876543210',
        email: 'ananya.deshmukh@example.com',
        address: '42 MG Road, Pune, Maharashtra'
      }
    });

    assert.equal(res.statusCode, 201, 'Patient registration must return 201 Created');
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.patientId && body.data.patientId.length >= 32, 'Patient ID must be a valid canonical technical identifier');
    assert.match(body.data.mrn, /^MRN-\d{4}-\d{6}$/, 'MRN must follow format MRN-YYYY-XXXXXX');
    assert.equal(body.data.version, 1, 'Initial patient version must be 1');
    assert.equal(body.data.status, 'ACTIVE');
    assert.equal(body.data.tenantId, partnerA);
    assert.equal(body.data.firstName, 'Ananya');
    assert.equal(body.data.lastName, 'Deshmukh');

    createdPatient = body.data;
  });

  // =========================================================================
  // 2. Patient Persistence
  // =========================================================================
  await t.test('2. Patient Persistence — Authoritative Read Matches Written Record', async () => {
    assert.ok(createdPatient, 'Precondition: createdPatient must exist');

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.patientId, createdPatient.patientId);
    assert.equal(body.data.mrn, createdPatient.mrn);
    assert.equal(body.data.firstName, 'Ananya');
    assert.equal(body.data.lastName, 'Deshmukh');
    assert.equal(body.data.version, 1);
  });

  // =========================================================================
  // 3. Duplicate Prevention
  // =========================================================================
  await t.test('3. Duplicate Prevention — Re-registering Same Phone Replays Existing Patient', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-pat-dup-check'
      },
      payload: {
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        dateOfBirth: '1992-04-15',
        sex: 'FEMALE',
        mobileNumber: '+919876543210' // Same phone number
      }
    });

    // Deduplication returns 200 OK with idempotentReplay: true and the existing patient ID
    assert.ok(res.statusCode === 200 || res.statusCode === 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.patientId, createdPatient.patientId, 'Must not duplicate patient record');
    assert.equal(body.data.mrn, createdPatient.mrn);
  });

  // =========================================================================
  // 4. MRN Uniqueness
  // =========================================================================
  await t.test('4. MRN Uniqueness — Duplicate MRN Collision is Strictly Rejected (409 Conflict)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`
      },
      payload: {
        firstName: 'Imposter',
        lastName: 'User',
        dateOfBirth: '1985-01-01',
        sex: 'MALE',
        mobileNumber: '+919876500099',
        mrn: createdPatient.mrn // Colliding MRN
      }
    });

    assert.equal(res.statusCode, 409, 'Colliding MRN must return 409 Conflict');
  });

  // =========================================================================
  // 5. Tenant Isolation
  // =========================================================================
  await t.test('5. Tenant Isolation — Cross-Tenant Patient Access is Blocked (403/404)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerB}` // Partner B token
      }
    });

    assert.ok(
      res.statusCode === 403 || res.statusCode === 404,
      `Cross-tenant read must be forbidden or not found, got ${res.statusCode}`
    );
  });

  // =========================================================================
  // 6. Encounter Creation
  // =========================================================================
  await t.test('6. Encounter Creation — Generates Canonical encounterId, visitId and visitNumber', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/encounters/check-in',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-enc-create-01'
      },
      payload: {
        patientId: createdPatient.patientId,
        departmentId: 'OPD',
        encounterType: 'OPD',
        chiefComplaint: 'Mild headache and seasonal allergies'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.encounterId && body.data.encounterId.length >= 32, 'Encounter ID must be present');
    assert.ok(body.data.visitId.startsWith('vst-'), 'Visit ID must start with vst-');
    assert.match(body.data.visitNumber, /^VST-\d{4}-\d{6}$/, 'Visit number must follow format VST-YYYY-XXXXXX');
    assert.equal(body.data.patientId, createdPatient.patientId);
    assert.equal(body.data.mrn, createdPatient.mrn);
    assert.equal(body.data.status, 'OPEN');

    createdEncounter = body.data;
  });

  // =========================================================================
  // 7. Invalid Patient Rejection
  // =========================================================================
  await t.test('7. Invalid Patient Rejection — Missing or Non-Existent Patient Rejects Encounter', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/encounters/check-in',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`
      },
      payload: {
        patientId: 'pat-00000000-0000-0000-0000-000000000000',
        departmentId: 'OPD',
        encounterType: 'OPD'
      }
    });

    assert.equal(res.statusCode, 404, 'Non-existent patient must return 404 Not Found');
  });

  // =========================================================================
  // 8. Appointment Linkage
  // =========================================================================
  await t.test('8. Appointment Linkage — Books and Links Appointment to Encounter', async () => {
    // Step 8A: Book appointment
    const aptRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/appointments',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-apt-create-01'
      },
      payload: {
        patientId: createdPatient.patientId,
        departmentId: 'OPD',
        doctorId: 'doc-continuity-a',
        slotDate: '2026-10-01',
        slotTime: '11:00',
        reason: 'Follow-up clinical assessment'
      }
    });

    assert.equal(aptRes.statusCode, 201);
    const aptBody = JSON.parse(aptRes.payload);
    assert.ok(aptBody.data.appointmentId.startsWith('apt-'), 'Appointment ID must start with apt-');
    assert.match(aptBody.data.appointmentNumber, /^APT-\d{4}-\d{6}$/);
    assert.equal(aptBody.data.patientId, createdPatient.patientId);
    assert.equal(aptBody.data.status, 'BOOKED');
    createdAppointment = aptBody.data;

    // Step 8B: Check-in appointment to create linked encounter
    const chkRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/encounters/check-in',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-apt-checkin-01'
      },
      payload: {
        patientId: createdPatient.patientId,
        appointmentId: createdAppointment.appointmentId,
        departmentId: 'OPD',
        encounterType: 'OPD'
      }
    });

    assert.equal(chkRes.statusCode, 201);
    const chkBody = JSON.parse(chkRes.payload);
    assert.equal(chkBody.data.appointmentId, createdAppointment.appointmentId);
    assert.equal(chkBody.data.patientId, createdPatient.patientId);
  });

  // =========================================================================
  // 9. Token Persistence
  // =========================================================================
  await t.test('9. Token Persistence — Issues Token & Queue Entry and Retrieves in Queue', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/tokens',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-tok-create-01'
      },
      payload: {
        patientId: createdPatient.patientId,
        encounterId: createdEncounter.encounterId,
        departmentId: 'OPD'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.ok(body.data.tokenId.startsWith('tkn-'), 'Token ID must start with tkn-');
    assert.ok(body.data.queueEntryId.startsWith('que-'), 'Queue entry ID must start with que-');
    assert.match(body.data.tokenNumber, /^(?:TKN-)?OPD-\d+$/);
    assert.match(body.data.queueEntryNumber, /^QUE-OPD-\d{4}-\d{6}$/);
    assert.equal(body.data.status, 'WAITING');

    createdToken = body.data;

    // Verify token exists in department queue list
    const qRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/patient-360/queue?departmentId=OPD',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`
      }
    });

    assert.equal(qRes.statusCode, 200);
    const qBody = JSON.parse(qRes.payload);
    assert.ok(Array.isArray(qBody.data));
    const found = qBody.data.find((t) => t.tokenId === createdToken.tokenId);
    assert.ok(found, 'Created token must be present in department queue');
  });

  // =========================================================================
  // 10. Queue State Transition
  // =========================================================================
  await t.test('10. Queue State Transition — Enforces State Machine and Blocks Terminal Mutation', async () => {
    // Transition 1: WAITING -> CALLED
    const step1 = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/tokens/${createdToken.tokenId}/status`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: { status: 'CALLED' }
    });
    assert.equal(step1.statusCode, 200);
    assert.equal(JSON.parse(step1.payload).data.status, 'CALLED');

    // Transition 2: CALLED -> IN_SERVICE
    const step2 = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/tokens/${createdToken.tokenId}/status`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: { status: 'IN_SERVICE' }
    });
    assert.equal(step2.statusCode, 200);
    assert.equal(JSON.parse(step2.payload).data.status, 'IN_SERVICE');

    // Transition 3: IN_SERVICE -> COMPLETED
    const step3 = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/tokens/${createdToken.tokenId}/status`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: { status: 'COMPLETED' }
    });
    assert.equal(step3.statusCode, 200);
    assert.equal(JSON.parse(step3.payload).data.status, 'COMPLETED');

    // Transition 4: Terminal state mutation attempt (COMPLETED -> WAITING) must be rejected with 409
    const invalidStep = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/tokens/${createdToken.tokenId}/status`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: { status: 'WAITING' }
    });
    assert.equal(invalidStep.statusCode, 409, 'Terminal queue token state mutation must be rejected with 409 Conflict');
  });

  // =========================================================================
  // 11. Order Linkage
  // =========================================================================
  await t.test('11. Order Linkage — Links Clinical Order to Patient, Encounter and Workflow', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/orders',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-ord-create-01'
      },
      payload: {
        patientId: createdPatient.patientId,
        encounterId: createdEncounter.encounterId,
        orderType: 'LAB',
        departmentId: 'PATHOLOGY',
        itemName: 'Lipid Profile',
        priority: 'ROUTINE'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.orderId.startsWith('ord-'), 'Order ID must start with ord-');
    assert.match(body.data.orderNumber, /^ORD-(?:[A-Z0-9]+-)?\d{4}-\d{6}$/);
    assert.match(body.data.accessionNumber, /^ACC-(?:[A-Z0-9]+-)?\d{4}-\d{6}$/);
    assert.equal(body.data.patientId, createdPatient.patientId);
    assert.equal(body.data.encounterId, createdEncounter.encounterId);
    assert.equal(body.data.status, 'ORDERED');

    createdOrder = body.data;
  });

  // =========================================================================
  // 12. Task Linkage
  // =========================================================================
  await t.test('12. Task Linkage — Workflow Task is Generated and Linked to Order', async () => {
    assert.ok(createdOrder, 'Precondition: createdOrder must exist');
    assert.ok(createdOrder.taskId, 'Order must have linked taskId');
    assert.match(createdOrder.taskId, /^TSK-/i, 'Task ID must start with TSK-');
    assert.ok(createdOrder.workflowInstanceId, 'Order must have linked workflowInstanceId');
    assert.match(createdOrder.workflowInstanceId, /^WFI-/i, 'Workflow instance ID must start with WFI-');
  });

  // =========================================================================
  // 13. Result Linkage
  // =========================================================================
  await t.test('13. Result Linkage — Records Diagnostic Result Linked to Order and Encounter', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/results',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-res-create-01'
      },
      payload: {
        patientId: createdPatient.patientId,
        encounterId: createdEncounter.encounterId,
        orderId: createdOrder.orderId,
        action: 'ENTER',
        values: {
          totalCholesterol: '185 mg/dL',
          triglycerides: '140 mg/dL',
          hdl: '52 mg/dL',
          ldl: '105 mg/dL'
        },
        performedBy: 'doc-continuity-a',
        status: 'ENTERED'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.resultId.startsWith('res-'), 'Result ID must start with res-');
    assert.equal(body.data.orderId, createdOrder.orderId);
    assert.equal(body.data.encounterId, createdEncounter.encounterId);
    assert.equal(body.data.patientId, createdPatient.patientId);

    createdResult = body.data;
  });

  // =========================================================================
  // 14. Timeline Reconstruction
  // =========================================================================
  await t.test('14. Timeline Reconstruction — Authoritative Events Synthesized from Source Records', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${createdPatient.patientId}/timeline`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 4, 'Timeline must contain at least patient, encounter, token, and order events');

    // Verify chronological order
    for (let i = 1; i < body.data.length; i++) {
      const prevTime = new Date(body.data[i - 1].timestamp).getTime();
      const currTime = new Date(body.data[i].timestamp).getTime();
      assert.ok(currTime >= prevTime, 'Timeline events must be strictly chronological');
    }

    // Verify event source types
    const sourceTypes = body.data.map((e) => e.sourceType);
    assert.ok(sourceTypes.includes('PATIENT_MASTER'));
    assert.ok(sourceTypes.includes('ENCOUNTER'));
    assert.ok(sourceTypes.includes('QUEUE_TOKEN'));
    assert.ok(sourceTypes.includes('CLINICAL_ORDER'));
  });

  // =========================================================================
  // 15. Patient 360 Aggregation
  // =========================================================================
  await t.test('15. Patient 360 Aggregation — Complete Authoritative Longitudinal Read Model', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    const p360 = body.data;

    assert.equal(p360.identity.patientId, createdPatient.patientId);
    assert.equal(p360.identity.mrn, createdPatient.mrn);
    assert.equal(p360.demographics.patientId, createdPatient.patientId);
    assert.ok(Array.isArray(p360.clinicalHistory.encounters));
    assert.ok(Array.isArray(p360.operations.tokensAndQueues));
    assert.ok(Array.isArray(p360.timeline));
    assert.ok(p360.timeline.length >= 1);
    assert.ok(p360.currentState, 'Must include currentState');
  });

  // =========================================================================
  // 16. Unauthorized Access
  // =========================================================================
  await t.test('16. Unauthorized Access — Unauthenticated or Underprivileged Access is Blocked', async () => {
    // 16A: No token -> 401
    const noAuth = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`
    });
    assert.equal(noAuth.statusCode, 401, 'Unauthenticated request must return 401 Unauthorized');

    // 16B: Token without PATIENT:CREATE permission -> 403
    const restrictedToken = createToken({
      sub: 'doc-restricted',
      tenantId: partnerA,
      roles: ['PHARMACIST'], // Pharmacist cannot create patient master records
      permissions: ['PHARMACY:READ']
    });

    const forbiddenRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${restrictedToken}` },
      payload: {
        firstName: 'Unauthorized',
        lastName: 'Creation',
        dateOfBirth: '1990-01-01',
        sex: 'MALE'
      }
    });
    assert.equal(forbiddenRes.statusCode, 403, 'Missing permission must return 403 Forbidden');
  });

  // =========================================================================
  // 17. Cross-Tenant Attack
  // =========================================================================
  await t.test('17. Cross-Tenant Attack — Partner B Cannot Mutate or Exit Partner A Encounter', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/patient-360/encounters/${createdEncounter.encounterId}/exit`,
      headers: { authorization: `Bearer ${tokenPartnerB}` }, // Partner B token
      payload: {
        forceExit: true,
        overrideReason: 'Malicious cross-tenant encounter exit attempt'
      }
    });

    assert.ok(
      res.statusCode === 403 || res.statusCode === 404,
      `Cross-tenant encounter mutation must be blocked (403/404), got ${res.statusCode}`
    );
  });

  // =========================================================================
  // 18. Cross-Partner Attack
  // =========================================================================
  await t.test('18. Cross-Partner Attack — Injected Partner ID in Body/Params is Blocked', async () => {
    // 18A: Header partner spoofing
    const headerRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'x-partner-id': partnerB
      }
    });
    assert.equal(headerRes.statusCode, 403, 'Cross-partner header spoofing must be rejected with 403');

    // 18B: Payload partner injection
    const payloadRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Malicious',
        lastName: 'CrossPartner',
        dateOfBirth: '1990-01-01',
        sex: 'MALE',
        partnerId: partnerB, // Injected cross-partner scope
        tenantId: partnerB
      }
    });
    assert.equal(payloadRes.statusCode, 403, 'Cross-partner payload injection must be rejected with 403');
  });

  // =========================================================================
  // 19. Client-Supplied Identity Spoofing
  // =========================================================================
  await t.test('19. Client-Supplied Identity Spoofing — Header Injection (x-user-id, x-role) is Blocked', async () => {
    // 19A: User ID spoofing
    const userSpoof = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'x-user-id': 'malicious-injected-user-id'
      }
    });
    assert.equal(userSpoof.statusCode, 403, 'Client-supplied x-user-id spoofing must be blocked with 403');

    // 19B: Role spoofing
    const roleSpoof = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'x-role': 'SUPER_ADMIN'
      }
    });
    assert.equal(roleSpoof.statusCode, 403, 'Client-supplied x-role spoofing must be blocked with 403');
  });

  // =========================================================================
  // 20. Inactive Staff
  // =========================================================================
  await t.test('20. Inactive Staff — Requests with Non-Active Staff Status are Denied (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'x-staff-status': 'INACTIVE'
      }
    });

    assert.equal(res.statusCode, 403, 'Inactive staff status must return 403 Forbidden');
  });

  // =========================================================================
  // 21. Revoked Credential
  // =========================================================================
  await t.test('21. Revoked Credential — Requests with Revoked Credentials are Denied (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'x-credential-status': 'REVOKED'
      }
    });

    assert.equal(res.statusCode, 403, 'Revoked credential status must return 403 Forbidden');
  });

  // =========================================================================
  // 22. Entitlement Denial
  // =========================================================================
  await t.test('22. Entitlement Denial — Missing Entitlement or Disabled Feature is Denied (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'x-entitlement-missing': 'true'
      }
    });

    assert.equal(res.statusCode, 403, 'Missing entitlement must return 403 Forbidden');
  });

  // =========================================================================
  // 23. Audit Creation
  // =========================================================================
  await t.test('23. Audit Creation — Every Mutation Produces Tamper-Resistant Clinical Audit Trail', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${createdPatient.patientId}`,
      headers: {
        authorization: `Bearer ${tokenPartnerA}`
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.ok(Array.isArray(body.data.auditLineage), 'Patient 360 must include auditLineage');
    assert.ok(body.data.auditLineage.length >= 4, 'Audit trail must contain entries for all previous actions');

    // Verify audit entry integrity
    for (const audit of body.data.auditLineage) {
      assert.ok(audit.auditId, 'Audit must have auditId');
      assert.ok(audit.who, 'Audit must record actor who performed action');
      assert.ok(audit.what, 'Audit must record action name');
      assert.ok(audit.when, 'Audit must record ISO timestamp');
      assert.equal(audit.patientId, createdPatient.patientId);
    }
  });

  // =========================================================================
  // 24. Concurrent Update / Idempotency
  // =========================================================================
  await t.test('24. Concurrent Update / Idempotency — Optimistic Locking and Idempotent Replays', async () => {
    // 24A: Optimistic Locking Conflict (expectedVersion mismatch)
    const conflictRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Ananya',
        lastName: 'Deshmukh-Patil',
        expectedVersion: 99 // Conflict: actual version is 1
      }
    });

    assert.equal(conflictRes.statusCode, 409, 'Version mismatch must return 409 Conflict');

    // 24B: Successful Optimistic Concurrency Update
    const successRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Ananya',
        lastName: 'Deshmukh-Patil',
        expectedVersion: 1 // Matches current version
      }
    });

    assert.equal(successRes.statusCode, 200);
    const updatedBody = JSON.parse(successRes.payload);
    assert.equal(updatedBody.data.version, 2, 'Version must increment to 2');
    assert.equal(updatedBody.data.lastName, 'Deshmukh-Patil');

    // 24C: Idempotency Key Replay
    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-phase4-pat-create-01' // Same key as Test 1
      },
      payload: {
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        dateOfBirth: '1992-04-15',
        sex: 'FEMALE',
        mobileNumber: '+919876543210',
        email: 'ananya.deshmukh@example.com',
        address: '42 MG Road, Pune, Maharashtra'
      }
    });

    assert.ok(replayRes.statusCode === 200 || replayRes.statusCode === 201, 'Replayed idempotency key must return 200 or 201');
    const replayBody = JSON.parse(replayRes.payload);
    assert.equal(replayBody.data.patientId, createdPatient.patientId);

    // 24D: Hard deletion prohibited (405)
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}`,
      headers: { authorization: `Bearer ${tokenPartnerA}` }
    });
    assert.equal(deleteRes.statusCode, 405, 'Hard deletion of clinical patient master must return 405 Method Not Allowed');

    // 24E: Soft deactivation succeeds (200)
    const statusRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/patients/${createdPatient.patientId}/status`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: { status: 'INACTIVE', reason: 'Patient requested record dormancy' }
    });
    assert.equal(statusRes.statusCode, 200);
    assert.equal(JSON.parse(statusRes.payload).data.status, 'INACTIVE');
  });

  // =========================================================================
  // 25. Regression against Phase 1
  // =========================================================================
  await t.test('25. Regression against Phase 1 — Master Foundation and Health Endpoint Intact', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.ok(body.status === 'ok' || body.status === 'healthy');
  });

  // =========================================================================
  // 26. Regression against Phase 2
  // =========================================================================
  await t.test('26. Regression against Phase 2 — Partner Configuration Engine & Profiles Intact', async () => {
    // Partner configuration routes require PARTNER_ADMIN role
    const partnerAdminToken = createToken({
      sub: 'partner-admin-user',
      tenantId: partnerA,
      roles: ['PARTNER_ADMIN'],
      permissions: ['partners:read', 'partners:update']
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/account/profile',
      headers: {
        authorization: `Bearer ${partnerAdminToken}`
      }
    });

    // Profile endpoint must return 200 or 404 depending on whether profile is seeded, but NEVER 500
    assert.ok(res.statusCode === 200 || res.statusCode === 404);
  });

  // =========================================================================
  // 27. Regression against Phase 3
  // =========================================================================
  await t.test('27. Regression against Phase 3 — Identity & Centralized RBAC/ABAC Security Intact', async () => {
    const userToRevoke = 'usr-phase4-revocation-test';
    const tokenToRevoke = createToken({
      sub: userToRevoke,
      jti: 'sess-phase4-revocation-test',
      tenantId: partnerA
    });

    // Session is valid initially
    const beforeRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenToRevoke}` }
    });
    assert.equal(beforeRes.statusCode, 200);

    // Revoke user
    await sessionRevocationService.revokeUser(userToRevoke);

    // Subsequent call must fail with 401
    const afterRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenToRevoke}` }
    });
    assert.equal(afterRes.statusCode, 401, 'Revoked user must be denied with 401 Unauthorized');
  });
});
