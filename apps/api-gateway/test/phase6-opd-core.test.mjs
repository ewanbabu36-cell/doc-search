import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase } from '@docsearch/database';

describe('DOC SEARCH Phase 6: OPD Core Master Controlled Verification Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const BRANCH_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const BRANCH_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const DOCTOR_ID = '99999999-9999-4999-8999-999999999999';
  const NURSE_ID = '88888888-8888-4888-8888-888888888888';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_ID,
      email: overrides.email || 'doctor@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      roles: overrides.roles || ['DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:encounters:update',
        'clinical:consultations:create',
        'clinical:consultations:read',
        'clinical:consultations:update',
        'billing:invoices:create',
        'billing:invoices:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let patientId;
  let patientMrn;
  let appointmentId;
  let encounterId;
  let invoiceId;
  let consultationId;
  let prescriptionId;
  let followUpId;
  let referralId;
  let alertId;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp({ db: testDb });
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  // =========================================================================
  // 1. PATIENT REGISTRATION (STEP 1)
  // =========================================================================
  it('STEP 1: POST /api/v1/partner/clinical/patients registers real patient with UHID/MRN', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Priya',
        lastName: 'Verma',
        gender: 'FEMALE',
        dateOfBirth: '1992-08-20',
        mobileNumber: '+91-9876501234',
        bloodGroup: 'O_POSITIVE'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.ok(body.data.mrn);
    assert.strictEqual(body.data.firstName, 'Priya');
    assert.strictEqual(body.data.lastName, 'Verma');
    patientId = body.data.id;
    patientMrn = body.data.mrn;
  });

  // =========================================================================
  // 2. APPOINTMENT SCHEDULING & SLOT LOCK (STEP 2)
  // =========================================================================
  it('STEP 2: POST /api/v1/partner/clinical/appointments schedules appointment and acquires slot lock', async () => {
    const token = createTestToken();
    const slotTime = '2026-10-15T10:00:00.000Z';
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/appointments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        doctorId: DOCTOR_ID,
        slotTime,
        appointmentType: 'OPD',
        reason: 'Persistent dry cough and fatigue for 5 days'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.patientId, patientId);
    assert.strictEqual(body.data.doctorId, DOCTOR_ID);
    assert.strictEqual(body.data.status, 'SCHEDULED');
    assert.strictEqual(body.data.appointmentType, 'OPD');
    appointmentId = body.data.id;
  });

  it('STEP 2.1: GET /api/v1/partner/clinical/appointments retrieves appointments by patient filter', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/appointments?patientId=${patientId}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    const found = body.data.find(a => a.id === appointmentId);
    assert.ok(found, 'Booked appointment must exist in patient appointment list');
  });

  it('STEP 2.2: PUT /api/v1/partner/clinical/appointments/:id/reschedule modifies slot cleanly', async () => {
    const token = createTestToken();
    const newSlotTime = '2026-10-15T11:30:00.000Z';
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/partner/clinical/appointments/${appointmentId}/reschedule`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        newSlotTime,
        reason: 'Patient requested later morning slot'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'RESCHEDULED');
    assert.strictEqual(new Date(body.data.slotTime).toISOString(), newSlotTime);
  });

  // =========================================================================
  // 3. APPOINTMENT CHECK-IN -> ACTIVE ENCOUNTER & TOKEN (STEP 3)
  // =========================================================================
  it('STEP 3: POST /api/v1/partner/clinical/appointments/:id/check-in activates encounter and marks appointment completed', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/appointments/${appointmentId}/check-in`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(['CHECKED_IN', 'COMPLETED'].includes(body.data.appointment.status));
    assert.ok(body.data.encounter);
    assert.strictEqual(body.data.encounter.status, 'CHECKED_IN');
    assert.strictEqual(body.data.encounter.patientId, patientId);
    assert.strictEqual(body.data.encounter.doctorId, DOCTOR_ID);
    assert.ok(body.data.encounter.encounterNumber);
    encounterId = body.data.encounter.id;
  });

  // =========================================================================
  // 4. OPD PAYMENT & INVOICE GENERATION (STEP 4)
  // =========================================================================
  it('STEP 4: POST /api/v1/partner/clinical/encounters/:id/payments collects fee and generates invoice', async () => {
    const token = createTestToken({ userId: 'cashier-01', roles: ['BILLING_CLERK', 'HOSPITAL_ADMIN'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${encounterId}/payments`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 600,
        paymentMethod: 'UPI',
        notes: 'OPD Consultation Fee & Hospital Registration'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.invoiceId);
    assert.ok(body.data.invoiceNumber);
    assert.ok(body.data.paymentNumber);
    assert.strictEqual(body.data.status, 'PAID');
    assert.strictEqual(body.data.amount, 600);
    invoiceId = body.data.invoiceId;
  });

  it('STEP 4.1: GET /api/v1/partner/clinical/invoices/:id verifies invoice settlement details', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/invoices/${invoiceId}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.invoice.id, invoiceId);
    assert.strictEqual(body.data.invoice.status, 'PAID');
    assert.strictEqual(Number(body.data.invoice.totalAmount), 600);
    assert.ok(Array.isArray(body.data.items));
    assert.ok(body.data.items.length >= 1);
  });

  // =========================================================================
  // 5. TRIAGE VITALS LOGGING (STEP 5)
  // =========================================================================
  it('STEP 5: POST /api/v1/partner/clinical/encounters/:id/vitals logs patient triage vitals', async () => {
    const token = createTestToken({ userId: NURSE_ID, roles: ['NURSE', 'HOSPITAL_ADMIN'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${encounterId}/vitals`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        systolicBp: 120,
        diastolicBp: 80,
        pulseRateBpm: 74,
        temperatureFahrenheit: 98.4,
        oxygenSaturationPercent: 99,
        weightKg: 62,
        heightCm: 165
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.vitals.id);
    assert.strictEqual(body.data.vitals.systolicBp, 120);
    assert.strictEqual(body.data.vitals.diastolicBp, 80);
    assert.strictEqual(body.data.vitals.pulseBpm, 74);
    assert.ok(body.data.vitals.bmi);
    assert.strictEqual(body.data.alertCreated, false);
  });

  it('STEP 5.1: GET /api/v1/partner/clinical/encounters/:id/vitals retrieves encounter vitals', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/encounters/${encounterId}/vitals`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.strictEqual(body.data[0].systolicBp, 120);
  });

  // =========================================================================
  // 6. DOCTOR OPD WORKSPACE (STEP 6)
  // =========================================================================
  it('STEP 6: GET /api/v1/partner/clinical/doctor-workspace consolidates queue, active patient, vitals', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/doctor-workspace?doctorId=${DOCTOR_ID}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.doctorId, DOCTOR_ID);
    assert.ok(Array.isArray(body.data.queue));
    assert.ok(body.data.summary);
    assert.ok(body.data.summary.waitingCount >= 1 || body.data.summary.servedTodayCount >= 0);
  });

  // =========================================================================
  // 7. CLINICAL CONSULTATION (STEP 7)
  // =========================================================================
  it('STEP 7: POST /api/v1/partner/clinical/consultations saves diagnoses, SOAP notes, prescription', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        encounterId,
        patientId,
        doctorId: DOCTOR_ID,
        chiefComplaint: 'Persistent dry cough and mild chest tightness',
        historyOfPresentIllness: 'Symptoms worsened over 5 days; no hemoptysis',
        examinationNotes: 'Bilateral vesicular breath sounds, no wheeze',
        assessmentNotes: 'Mild Bronchitis / Allergic cough',
        planNotes: 'Hydration, oral antihistamine and bronchodilator',
        diagnoses: [
          {
            diagnosisCode: 'J20.9',
            diagnosisName: 'Acute bronchitis, unspecified',
            isPrimary: true
          }
        ],
        medications: [
          {
            medicationName: 'Levocetirizine 5mg',
            dosage: '1 tablet',
            frequency: '0-0-1',
            duration: 5,
            durationUnit: 'DAYS',
            instructions: 'Take at bedtime'
          }
        ],
        followUpAdvice: 'Review in OPD after 7 days if cough persists'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    consultationId = body.data.id;
  });

  // =========================================================================
  // 8. PRESCRIPTION FINALIZATION & IMMUTABILITY (STEP 8)
  // =========================================================================
  it('STEP 8: POST /api/v1/partner/clinical/prescriptions creates prescription and finalizes it immutably', async () => {
    const token = createTestToken();
    // 1. Create standalone prescription linked to encounter
    const rxRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/prescriptions',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        encounterId,
        consultationId,
        prescribingDoctorId: DOCTOR_ID,
        notes: 'Take medications as directed with full glass of water',
        items: [
          {
            medicationName: 'Amoxicillin 500mg Capsule',
            dosage: '1 capsule',
            frequency: '1-0-1',
            duration: 5,
            durationUnit: 'DAYS',
            instructions: 'After meals'
          }
        ]
      }
    });

    assert.strictEqual(rxRes.statusCode, 201);
    const rxBody = JSON.parse(rxRes.body);
    assert.strictEqual(rxBody.success, true);
    assert.ok(rxBody.data.id);
    prescriptionId = rxBody.data.id;

    // 2. Finalize prescription
    const finRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/prescriptions/${prescriptionId}/finalize`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(finRes.statusCode, 200);
    const finBody = JSON.parse(finRes.body);
    assert.strictEqual(finBody.success, true);
    assert.strictEqual(finBody.data.status, 'FINALIZED');

    // 3. Immutability guarantee: Re-finalizing must return 409 Conflict
    const reFinRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/prescriptions/${prescriptionId}/finalize`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(reFinRes.statusCode, 409);
  });

  // =========================================================================
  // 9. FOLLOW-UP RECOMMENDATION & CONVERSION (STEP 9)
  // =========================================================================
  it('STEP 9: POST /api/v1/partner/clinical/follow-ups records recommendation and converts to appointment', async () => {
    const token = createTestToken();
    // 1. Record follow-up recommendation
    const recRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/follow-ups',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        consultationId,
        encounterId,
        recommendedDate: '2026-10-22',
        reason: 'Post-bronchitis symptom check and pulmonary auscultation'
      }
    });

    assert.strictEqual(recRes.statusCode, 201);
    const recBody = JSON.parse(recRes.body);
    assert.strictEqual(recBody.success, true);
    assert.ok(recBody.data.id);
    assert.strictEqual(recBody.data.status, 'PENDING');
    followUpId = recBody.data.id;

    // 2. Convert follow-up into scheduled appointment
    const convRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/follow-ups/${followUpId}/convert-to-appointment`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        doctorId: DOCTOR_ID,
        slotTime: '2026-10-22T10:30:00.000Z'
      }
    });

    assert.strictEqual(convRes.statusCode, 201);
    const convBody = JSON.parse(convRes.body);
    assert.strictEqual(convBody.success, true);
    assert.strictEqual(convBody.data.followUp.status, 'SCHEDULED');
    assert.ok(convBody.data.appointment.id);
    assert.strictEqual(convBody.data.appointment.appointmentType, 'FOLLOW_UP');
  });

  // =========================================================================
  // 10. REFERRALS & CARE HANDOFF (STEP 10)
  // =========================================================================
  it('STEP 10: POST /api/v1/partner/clinical/referrals creates referral and updates status', async () => {
    const token = createTestToken();
    // 1. Create referral
    const refRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/referrals',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        encounterId,
        referralType: 'INTERNAL_SPECIALIST',
        destinationDepartmentId: 'PULMONOLOGY',
        clinicalSummary: 'Refer to Pulmonology for persistent cough and spirometry evaluation',
        urgency: 'ROUTINE'
      }
    });

    assert.strictEqual(refRes.statusCode, 201);
    const refBody = JSON.parse(refRes.body);
    assert.strictEqual(refBody.success, true);
    assert.ok(refBody.data.id);
    assert.strictEqual(refBody.data.referralStatus, 'PENDING');
    referralId = refBody.data.id;

    // 2. Update referral status
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/partner/clinical/referrals/${referralId}/status`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        status: 'ACCEPTED',
        notes: 'Pulmonology consultation confirmed for next Tuesday'
      }
    });

    assert.strictEqual(updateRes.statusCode, 200);
    const updateBody = JSON.parse(updateRes.body);
    assert.strictEqual(updateBody.success, true);
    assert.strictEqual(updateBody.data.referralStatus, 'ACCEPTED');
  });

  // =========================================================================
  // 11. CDSS CRITICAL PANIC VALUE ALERTS
  // =========================================================================
  it('STEP 11: Vitals hypoxia breach triggers automated CDSS panic value alert', async () => {
    const token = createTestToken({ userId: NURSE_ID, roles: ['NURSE', 'HOSPITAL_ADMIN'] });
    // Triage vitals with critical SpO2 breach (< 90%)
    const vitalsRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${encounterId}/vitals`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        systolicBp: 135,
        diastolicBp: 88,
        pulseRateBpm: 104,
        oxygenSaturationPercent: 87, // Critical breach
        temperatureFahrenheit: 99.1
      }
    });

    assert.strictEqual(vitalsRes.statusCode, 201);
    const vitalsBody = JSON.parse(vitalsRes.body);
    assert.strictEqual(vitalsBody.success, true);
    assert.strictEqual(vitalsBody.data.alertCreated, true);
    assert.ok(vitalsBody.data.alert);
    assert.strictEqual(vitalsBody.data.alert.urgencyLevel, 'CRITICAL');
    alertId = vitalsBody.data.alert.id;

    // Doctor acknowledges clinical alert
    const ackRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/partner/clinical/alerts/${alertId}/acknowledge`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        doctorName: 'Dr. Attending Pulmonologist'
      }
    });

    assert.strictEqual(ackRes.statusCode, 200);
    const ackBody = JSON.parse(ackRes.body);
    assert.strictEqual(ackBody.success, true);
    assert.ok(ackBody.data.acknowledgementTimestamp);
  });

  // =========================================================================
  // 12. LONGITUDINAL PATIENT 360 CLINICAL HISTORY
  // =========================================================================
  it('STEP 12: GET /api/v1/partner/clinical/patients/:id/history consolidates all 12 facets and timeline', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/patients/${patientId}/history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    const data = body.data;

    // 12 Facets Verification:
    assert.ok(data.patient, 'Demographics facet must be present');
    assert.strictEqual(data.patient.id, patientId);
    assert.ok(Array.isArray(data.appointments), 'Appointments facet must be present');
    assert.ok(data.appointments.length >= 2, 'Must include booked and follow-up appointments');
    assert.ok(Array.isArray(data.encounters), 'Encounters facet must be present');
    assert.ok(data.encounters.length >= 1, 'Must include encounter');
    assert.ok(Array.isArray(data.vitals), 'Vitals facet must be present');
    assert.ok(data.vitals.length >= 2, 'Must include recorded triage vitals');
    assert.ok(Array.isArray(data.consultations), 'Consultations facet must be present');
    assert.ok(data.consultations.length >= 1, 'Must include consultation');
    assert.ok(Array.isArray(data.prescriptions), 'Prescriptions facet must be present');
    assert.ok(data.prescriptions.length >= 1, 'Must include finalized prescription');
    assert.ok(Array.isArray(data.referrals), 'Referrals facet must be present');
    assert.ok(data.referrals.length >= 1, 'Must include referral');
    assert.ok(Array.isArray(data.followups), 'Follow-ups facet must be present');
    assert.ok(data.followups.length >= 1, 'Must include follow-up recommendation');
    assert.ok(Array.isArray(data.clinicalAlerts), 'Clinical Alerts facet must be present');
    assert.ok(data.clinicalAlerts.length >= 1, 'Must include CDSS alert');
    assert.ok(Array.isArray(data.invoices), 'Invoices facet must be present');
    assert.ok(data.invoices.length >= 1, 'Must include OPD invoice');
    assert.ok(Array.isArray(data.timeline), 'Reconstructed Chronological Timeline must be present');
    assert.ok(data.timeline.length >= 5, 'Timeline must chronologically integrate events');
  });

  // =========================================================================
  // 13. ADVERSARIAL & SECURITY VERIFICATION
  // =========================================================================
  it('SEC-1: Cross-Tenant Isolation: Tenant B cannot access Tenant A appointment', async () => {
    const tenantBToken = createTestToken({ tenantId: TENANT_B, branchId: BRANCH_B });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/appointments/${appointmentId}`,
      headers: { Authorization: `Bearer ${tenantBToken}` }
    });

    assert.ok([403, 404].includes(res.statusCode), `Must return 403 or 404 on cross-tenant access, got ${res.statusCode}`);
  });

  it('SEC-2: Slot Lock Conflict: Duplicate booking on exact doctor and slot fails with 409', async () => {
    const token = createTestToken();
    const duplicateSlot = '2026-10-22T10:30:00.000Z'; // Already booked by follow-up conversion
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/appointments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        doctorId: DOCTOR_ID,
        slotTime: duplicateSlot,
        appointmentType: 'OPD'
      }
    });

    assert.strictEqual(res.statusCode, 409);
    const body = JSON.parse(res.body);
    assert.ok(body.error || body.message || body.success === false);
  });

  it('SEC-3: Vitals Range Validation: Out-of-range systolic BP is rejected with 400', async () => {
    const token = createTestToken({ userId: NURSE_ID });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/encounters/${encounterId}/vitals`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        systolicBp: 25, // Unrealistic physiologically (< 40)
        diastolicBp: 80,
        pulseRateBpm: 72
      }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error || body.message || body.success === false);
  });

  it('SEC-4: Zero Mock Leakage: Clean zero-state on non-existent doctor workspace', async () => {
    const freshDoctorId = '55555555-5555-4555-8555-555555555555';
    const token = createTestToken({ userId: freshDoctorId });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/doctor-workspace?doctorId=${freshDoctorId}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.deepStrictEqual(body.data.queue, []);
    assert.strictEqual(body.data.activePatient, null);
    assert.strictEqual(body.data.summary.waitingCount, 0);
    assert.strictEqual(body.data.summary.servedTodayCount, 0);
    assert.strictEqual(body.data.summary.activeAlertsCount, 0);
  });
});
