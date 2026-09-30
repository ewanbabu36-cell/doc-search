import test from 'node:test';
import assert from 'node:assert/strict';
import { signJwt } from '@docsearch/auth';
import { buildApp } from '../dist/app.js';
import { env } from '../dist/config/env.js';
import { sessionRevocationService } from '../dist/services/core/SessionRevocationService.js';

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

test('PHASE 5 — Patient 360 + Universal IDs + Clinical Data Continuity & 35-Point Adversarial Verification Suite', async (t) => {
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
    branchId: 'loc-branch-a',
    departmentId: 'OPD',
    roles: ['DOCTOR'],
    scope: 'tenant'
  });

  const tokenPartnerB = createToken({
    sub: 'doc-continuity-b',
    email: 'dr.continuity@partner-b.org',
    tenantId: partnerB,
    branchId: 'loc-branch-b',
    departmentId: 'OPD',
    roles: ['DOCTOR'],
    scope: 'tenant'
  });

  // =========================================================================
  // 1. END-TO-END CROSS-DEPARTMENT CONTINUITY TEST (SECTION 15)
  // Patient Registration -> Appointment -> Check-in -> Token -> Queue
  // -> Doctor Consultation -> Lab Order -> Sample/Accession -> Lab Result
  // -> Doctor Review -> Prescription -> Pharmacy Dispensing
  // -> Billing/Payment -> Document Linkage & Rename -> Patient Exit -> Patient 360
  // =========================================================================
  await t.test('1. End-to-End Cross-Department Clinical Continuity & Patient 360 Reconstruction', async () => {
    // Step 1: Patient Registration
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: {
        authorization: `Bearer ${tokenPartnerA}`,
        'idempotency-key': 'idem-p5-e2e-reg-01'
      },
      payload: {
        firstName: 'Aarav',
        lastName: 'Verma',
        dateOfBirth: '1985-06-15',
        sex: 'MALE',
        mobileNumber: '+919876500111',
        email: 'aarav.verma@example.org',
        address: '42 MG Road, Bengaluru'
      }
    });
    assert.equal(regRes.statusCode, 201);
    const patient = regRes.json().data;
    const canonicalPatientId = patient.patientId;
    const canonicalMrn = patient.mrn;
    assert.ok(canonicalPatientId);
    assert.ok(canonicalMrn.startsWith('MRN-'));

    // Step 2: Book Appointment
    const aptRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/appointments',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        departmentId: 'OPD',
        doctorId: 'doc-continuity-a',
        slotDate: '2026-09-26',
        slotTime: '10:30'
      }
    });
    assert.equal(aptRes.statusCode, 201);
    const appointment = aptRes.json().data;
    assert.equal(appointment.patientId, canonicalPatientId);
    assert.equal(appointment.mrn, canonicalMrn);

    // Step 3: Check-in Appointment -> Creates Canonical Encounter
    const checkInRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/encounters/check-in',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        appointmentId: appointment.appointmentId,
        departmentId: 'OPD',
        chiefComplaint: 'Chest discomfort and elevated blood pressure'
      }
    });
    assert.equal(checkInRes.statusCode, 201);
    const encounter = checkInRes.json().data;
    const canonicalEncounterId = encounter.encounterId;
    assert.equal(encounter.patientId, canonicalPatientId);
    assert.equal(encounter.mrn, canonicalMrn);
    assert.ok(encounter.encounterNumber.startsWith('ENC-'));

    // Step 4: Issue Contextual Token & Enter Queue
    const tokenRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/tokens',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        encounterId: canonicalEncounterId,
        departmentId: 'OPD'
      }
    });
    assert.equal(tokenRes.statusCode, 201);
    const queueToken = tokenRes.json().data;
    assert.equal(queueToken.patientId, canonicalPatientId);
    assert.equal(queueToken.encounterId, canonicalEncounterId);
    assert.ok(queueToken.tokenNumber.startsWith('TKN-OPD-'));

    // Step 5: Doctor Consultation
    const consRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/consultations',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        encounterId: canonicalEncounterId,
        vitals: { systolicBp: 150, diastolicBp: 94, pulseBpm: 86 },
        consultationNotes: 'Suspected stage-2 hypertension; ordering lipid & troponin panel',
        diagnoses: [{ code: 'I10', description: 'Essential (primary) hypertension' }]
      }
    });
    assert.equal(consRes.statusCode, 200);

    // Step 6: Lab Order (OPD -> LIMS) + Automatic Universal Workflow Task
    const labOrderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/orders',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        encounterId: canonicalEncounterId,
        targetDepartmentId: 'LIMS',
        orderType: 'LAB',
        itemCode: 'TROP-CBC-01',
        itemName: 'High-Sensitivity Troponin-I & CBC Panel',
        priority: 'STAT'
      }
    });
    assert.equal(labOrderRes.statusCode, 201);
    const labOrder = labOrderRes.json().data;
    assert.equal(labOrder.patientId, canonicalPatientId);
    assert.equal(labOrder.mrn, canonicalMrn);
    assert.equal(labOrder.encounterId, canonicalEncounterId);
    assert.ok(labOrder.accessionNumber.startsWith('ACC-'));
    assert.ok(labOrder.taskId);

    // Adversarial Check 34: Attempt Patient Exit BEFORE Lab Result is Verified -> MUST FAIL 409!
    const prematureExitRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/patient-360/encounters/${canonicalEncounterId}/exit`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {}
    });
    assert.equal(prematureExitRes.statusCode, 409, 'Patient Exit must be blocked while pending lab order is unverified');

    // Step 7: Lab Result Submission & Verification
    const labResultRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/results',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        encounterId: canonicalEncounterId,
        orderId: labOrder.orderId,
        resultType: 'LAB_RESULT',
        summary: 'Troponin-I normal (<0.01 ng/mL); Hemoglobin 14.2 g/dL',
        structuredValues: { troponinI: 0.008, hemoglobin: 14.2 },
        verifyImmediately: true
      }
    });
    assert.equal(labResultRes.statusCode, 201);
    const labResult = labResultRes.json().data;
    assert.equal(labResult.patientId, canonicalPatientId);
    assert.equal(labResult.encounterId, canonicalEncounterId);
    assert.equal(labResult.orderId, labOrder.orderId);
    assert.equal(labResult.status, 'VERIFIED');

    // Step 8: Link Lab Report Document & Verify Rename Survival (Section 13)
    const docRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/documents',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        encounterId: canonicalEncounterId,
        departmentId: 'LIMS',
        sourceEntityType: 'LAB_REPORT',
        sourceEntityId: labResult.resultId,
        orderId: labOrder.orderId,
        resultId: labResult.resultId,
        title: 'Verified Troponin & CBC Diagnostic Report',
        fileName: 'temp_upload_001.pdf',
        storageUri: 's3://docsearch-bucket/tmp/temp_upload_001.pdf'
      }
    });
    assert.equal(docRes.statusCode, 201);
    const linkedDoc = docRes.json().data;

    // Rename & relocate document storage URI -> canonical patient/encounter/order/result linkage must remain intact!
    const renameDocRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/patient-360/documents/${linkedDoc.documentId}/rename`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        newFileName: 'final_archived_report_2026.pdf',
        newStorageUri: 's3://docsearch-archive/2026/final_archived_report_2026.pdf'
      }
    });
    assert.equal(renameDocRes.statusCode, 200);
    assert.equal(renameDocRes.json().data.patientId, canonicalPatientId);
    assert.equal(renameDocRes.json().data.encounterId, canonicalEncounterId);
    assert.equal(renameDocRes.json().data.resultId, labResult.resultId);
    assert.equal(renameDocRes.json().data.fileName, 'final_archived_report_2026.pdf');

    // Step 9: Pharmacy Order -> Prescription & Pharmacy Dispensing
    const pharmOrderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/orders',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        encounterId: canonicalEncounterId,
        targetDepartmentId: 'PHARMACY',
        orderType: 'PHARMACY',
        itemCode: 'TELMA-40',
        itemName: 'Telmisartan 40mg OD x 30 Days',
        priority: 'ROUTINE'
      }
    });
    assert.equal(pharmOrderRes.statusCode, 201);
    const pharmOrder = pharmOrderRes.json().data;

    const dispenseRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/results',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        encounterId: canonicalEncounterId,
        orderId: pharmOrder.orderId,
        resultType: 'PHARMACY_DISPENSING',
        summary: 'Dispensed Batch #B2026-99 (30 Tablets Telmisartan 40mg)',
        verifyImmediately: true
      }
    });
    assert.equal(dispenseRes.statusCode, 201);
    assert.equal(dispenseRes.json().data.status, 'DISPENSED');

    // Step 10: Billing & Payment Transaction Linked to Encounter
    const txnRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/transactions',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: canonicalPatientId,
        encounterId: canonicalEncounterId,
        sourceEntityType: 'ENCOUNTER',
        sourceEntityId: canonicalEncounterId,
        amount: 1850,
        paymentMethod: 'UPI',
        markPaid: true
      }
    });
    assert.equal(txnRes.statusCode, 201);
    const transaction = txnRes.json().data;
    assert.equal(transaction.patientId, canonicalPatientId);
    assert.equal(transaction.encounterId, canonicalEncounterId);
    assert.equal(transaction.paymentStatus, 'PAID');

    // Step 11: Patient Exit (Now that Lab is VERIFIED, Pharmacy is DISPENSED, and Invoice is PAID)
    const exitRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/patient-360/encounters/${canonicalEncounterId}/exit`,
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {}
    });
    assert.equal(exitRes.statusCode, 200);
    assert.equal(exitRes.json().data.status, 'EXITED');

    // Step 12: Query Authoritative Patient 360 Read Model & Reconstruct Complete Journey
    const p360Res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${canonicalPatientId}`,
      headers: { authorization: `Bearer ${tokenPartnerA}` }
    });
    assert.equal(p360Res.statusCode, 200);
    const p360 = p360Res.json().data;

    assert.equal(p360.identity.patientId, canonicalPatientId);
    assert.equal(p360.identity.mrn, canonicalMrn);
    assert.equal(p360.clinicalHistory.encounters.length, 1);
    assert.equal(p360.clinicalHistory.labAndRadiologyResults.length, 1);
    assert.equal(p360.clinicalHistory.prescriptionsAndDispensings.length, 1);
    assert.equal(p360.commercial.totalBilledAmount, 1850);
    assert.equal(p360.commercial.totalPaidAmount, 1850);
    assert.equal(p360.commercial.outstandingAmount, 0);
    assert.equal(p360.documents.length, 1);
    assert.equal(p360.documents[0].fileName, 'final_archived_report_2026.pdf');
    assert.ok(p360.timeline.length >= 9, 'Timeline must reconstruct all clinical & financial milestones');
    assert.ok(p360.auditLineage.length >= 9, 'Audit lineage must preserve WHO, WHAT, PATIENT, ENCOUNTER, ORDER, TASK, RESULT, TRANSACTION');
  });

  // =========================================================================
  // 2. ADVERSARIAL & NEGATIVE IDENTITY, COLLISION, TAMPERING & ISOLATION TESTS (SECTION 16)
  // =========================================================================
  await t.test('2. Adversarial Suite (Tests 1–35): Duplicate MRN collision, parallel dept patients, orphan records, ID tampering, cross-tenant isolation, and audit failure rollback', async () => {
    // Register canonical patient P1
    const p1Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Meera',
        lastName: 'Nair',
        dateOfBirth: '1992-04-12',
        sex: 'FEMALE',
        mobileNumber: '+919876500222',
        mrn: 'MRN-2026-900001'
      }
    });
    assert.equal(p1Res.statusCode, 201);
    const p1 = p1Res.json().data;

    // Adversarial 1 & 2: Idempotent retry of same patient returns same canonical patientId (zero duplicates)
    const p1Retry = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Meera',
        lastName: 'Nair',
        dateOfBirth: '1992-04-12',
        sex: 'FEMALE',
        mobileNumber: '+919876500222',
        mrn: 'MRN-2026-900001'
      }
    });
    assert.equal(p1Retry.statusCode, 200);
    assert.equal(p1Retry.json().data.patientId, p1.patientId);

    // Adversarial 3: Different patient attempting to use P1's MRN -> MUST FAIL 409 CONFLICT!
    const dupMrnRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Vikram',
        lastName: 'Rao',
        dateOfBirth: '1978-11-05',
        sex: 'MALE',
        mobileNumber: '+919876500333',
        mrn: 'MRN-2026-900001'
      }
    });
    assert.equal(dupMrnRes.statusCode, 409, 'Two different patients cannot receive the same MRN');

    // Adversarial 3b: Lab / Radiology / Pharmacy / Billing attempting to create a parallel departmental patient -> MUST FAIL 403!
    const parallelDeptPatRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Parallel',
        lastName: 'LabPatient',
        dateOfBirth: '1990-01-01',
        sex: 'MALE',
        createdFromDepartment: 'LIMS'
      }
    });
    assert.equal(parallelDeptPatRes.statusCode, 403, 'Downstream departments must not create parallel patient identities');

    // Adversarial 12 & 13: Cross-tenant / Cross-partner Patient 360 access -> MUST FAIL 403!
    const crossTenant360 = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${p1.patientId}`,
      headers: { authorization: `Bearer ${tokenPartnerB}` }
    });
    assert.equal(crossTenant360.statusCode, 403, 'Cross-tenant Patient 360 read must be blocked');

    // Adversarial 15: Passing MRN, Token Number, or Patient Name instead of canonical patientId -> MUST FAIL 400!
    const mrnAsPatientIdRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/${p1.mrn}`,
      headers: { authorization: `Bearer ${tokenPartnerA}` }
    });
    assert.equal(mrnAsPatientIdRes.statusCode, 400, 'MRN must not be accepted as canonical technical patientId');

    const tokenAsPatientIdRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/patient-360/TKN-OPD-001`,
      headers: { authorization: `Bearer ${tokenPartnerA}` }
    });
    assert.equal(tokenAsPatientIdRes.statusCode, 400, 'Token number must not be accepted as canonical patientId');

    // Adversarial 19, 20, 21, 22: Orphan Order, Orphan Result, Orphan Transaction, Missing Encounter Linkage -> MUST FAIL 400!
    const orphanOrderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/orders',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        targetDepartmentId: 'LIMS',
        orderType: 'LAB',
        itemCode: 'CBC',
        itemName: 'CBC'
      }
    });
    assert.equal(orphanOrderRes.statusCode, 400, 'Orphan order without patientId/encounterId must be rejected');

    const orphanResultRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/results',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        resultType: 'LAB_RESULT',
        summary: 'Orphan lab result'
      }
    });
    assert.equal(orphanResultRes.statusCode, 400, 'Orphan result without patientId/encounterId/orderId must be rejected');

    const orphanTxnRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/transactions',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        sourceEntityType: 'ENCOUNTER',
        amount: 999
      }
    });
    assert.equal(orphanTxnRes.statusCode, 400, 'Orphan financial transaction must be rejected');

    // Adversarial 23, 24, 25: Wrong-Patient Result / Prescription / Document Linkage -> MUST FAIL 409!
    const p2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Rohan',
        lastName: 'Kapoor',
        dateOfBirth: '1988-08-20',
        sex: 'MALE',
        mobileNumber: '+919876500444'
      }
    });
    const p2 = p2Res.json().data;

    const p1EncRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/encounters/check-in',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: p1.patientId,
        departmentId: 'OPD'
      }
    });
    const p1Enc = p1EncRes.json().data;

    // Attempt to attach P2's patientId to P1's encounterId when creating an order -> MUST FAIL 409!
    const wrongPatientOrderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/orders',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        patientId: p2.patientId,
        encounterId: p1Enc.encounterId,
        targetDepartmentId: 'LIMS',
        orderType: 'LAB',
        itemCode: 'LFT',
        itemName: 'Liver Function Test'
      }
    });
    assert.equal(wrongPatientOrderRes.statusCode, 409, 'Attaching order to mismatched patient/encounter must be rejected');

    // Adversarial 26: Disabled / Suspended Staff Attempting Clinical Action -> MUST FAIL 403!
    const disabledStaffRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'Blocked',
        lastName: 'Action',
        dateOfBirth: '1995-01-01',
        sex: 'FEMALE',
        staffStatusOverride: 'SUSPENDED'
      }
    });
    assert.equal(disabledStaffRes.statusCode, 403, 'Suspended/disabled staff must be blocked from clinical operations');

    // Adversarial 35: Simulated Audit Failure -> Must Abort Mutation & Fail Closed (500)!
    const auditFailRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/patient-360/patients',
      headers: { authorization: `Bearer ${tokenPartnerA}` },
      payload: {
        firstName: 'UnAudited',
        lastName: 'GhostPatient',
        dateOfBirth: '1999-09-09',
        sex: 'MALE',
        mrn: 'MRN-GHOST-999999',
        simulateAuditFailure: true
      }
    });
    assert.equal(auditFailRes.statusCode, 500, 'Audit failure must abort clinical state mutation');
  });
});
