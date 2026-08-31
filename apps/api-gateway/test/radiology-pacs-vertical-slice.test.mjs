import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Domain 2.17 — Radiology / PACS / Medical Imaging Vertical Slice Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const partnerId = '11111111-1111-4111-8111-111111111111';
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-rad-001',
      email: overrides.email || 'dr.radiologist@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['HOD_RADIOLOGIST', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:radiology:read',
        'clinical:radiology:create',
        'clinical:radiology:update',
        'clinical:radiology:delete'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let unauthorizedToken;
  let tenantBToken;

  let createdOrderId;
  let createdAppointmentId;
  let createdStudyId;
  let createdReportId;
  let createdFindingId;

  before(async () => {
    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    unauthorizedToken = createTestToken({
      permissions: ['clinical:none:read'],
      roles: ['GUEST']
    });
    tenantBToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-rad-tenantB'
    });
  });

  after(async () => {
    await app.close();
  });

  it('TEST 01: GET /api/v1/partner/radiology/overview returns live metrics with valid JWT', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/radiology/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.ok(body.totalOrdersCount !== undefined);
    assert.ok(body.pendingOrdersCount !== undefined);
  });

  it('TEST 02: GET /api/v1/partner/radiology/modalities & /procedures returns catalog', async () => {
    const resMod = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/radiology/modalities',
      headers: { authorization: `Bearer ${validToken}` }
    });
    assert.equal(resMod.statusCode, 200);
    const modalities = JSON.parse(resMod.payload);
    assert.ok(Array.isArray(modalities));

    const resProc = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/radiology/procedures',
      headers: { authorization: `Bearer ${validToken}` }
    });
    assert.equal(resProc.statusCode, 200);
    const procedures = JSON.parse(resProc.payload);
    assert.ok(Array.isArray(procedures));
  });

  it('TEST 03: POST /api/v1/partner/radiology/orders creates clinical imaging order', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/orders',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        partnerId,
        organizationId,
        branchId,
        orderNumber: `RAD-ORD-${Date.now()}`,
        patientId: '33333333-3333-4333-8333-333333333333',
        patientName: 'Aarav Sharma',
        patientMrn: 'MRN-78901',
        encounterId: '44444444-4444-4444-8444-444444444444',
        orderingDoctorName: 'Dr. Ananya Roy, MD',
        orderingDepartment: 'Pulmonology',
        procedureId: 'p1111111-1111-4111-8111-111111111101',
        procedureName: 'NCCT / CECT Chest with High Resolution (HRCT)',
        modalityType: 'COMPUTED_TOMOGRAPHY_CT',
        priority: 'URGENT_WITHIN_4_HOURS',
        clinicalIndication: 'Persistent dry cough and dyspnea, suspected interstitial lung disease',
        requiresContrast: false,
        pregnancyScreeningResult: 'NOT_APPLICABLE',
        renalEgfrResult: '88 mL/min/1.73m2',
        knownAllergies: 'None',
        status: 'ORDERED'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    const order = body.data || body;
    assert.ok(order.id);
    assert.equal(order.patientName, 'Aarav Sharma');
    createdOrderId = order.id;
  });

  it('TEST 04: POST /api/v1/partner/radiology/appointments schedules examination slot', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/appointments',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        partnerId,
        organizationId,
        branchId,
        appointmentCode: `RAD-APT-${Date.now()}`,
        orderId: createdOrderId,
        patientName: 'Aarav Sharma',
        patientMrn: 'MRN-78901',
        modalityCode: 'CT-01',
        roomNumber: 'Room 102',
        scheduledDateTime: new Date(Date.now() + 3600000).toISOString(),
        technologistAssigned: 'Rajesh Kumar',
        preparationInstructions: 'Fasting 4 hours if IV contrast required.',
        status: 'CONFIRMED'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    const appointment = body.data || body;
    assert.ok(appointment.id);
    createdAppointmentId = appointment.id;
  });

  it('TEST 05: POST /api/v1/partner/radiology/preparation-records validates safety gates', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/preparation-records',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        partnerId,
        organizationId,
        branchId,
        preparationCode: `RAD-PRP-${Date.now()}`,
        orderId: createdOrderId,
        patientName: 'Aarav Sharma',
        patientMrn: 'MRN-78901',
        fastingConfirmed: true,
        metalImplantScreeningCleared: true,
        pacemakerScreeningCleared: true,
        contrastConsentSigned: true,
        ivCannulaPlaced: true,
        isPatientReady: true,
        preparationNotes: 'Patient cleared for CT scan.',
        checkedByTechnologist: 'Rajesh Kumar'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    const prep = body.data || body;
    assert.ok(prep.id);
    assert.equal(prep.isPatientReady, true);
  });

  it('TEST 06: PATCH /api/v1/partner/radiology/orders/:id/status updates order to IN_PROGRESS', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/orders/${createdOrderId}/status`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        fromStatus: 'SCHEDULED',
        toStatus: 'IN_PROGRESS'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    const updated = body.data || body;
    assert.equal(updated.status, 'IN_PROGRESS');
  });

  it('TEST 07: POST /api/v1/partner/radiology/studies creates DICOM accessioned study', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/studies',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        partnerId,
        organizationId,
        branchId,
        studyInstanceUid: `1.2.840.113619.2.${Date.now()}`,
        accessionNumber: `RAD-ACC-${Date.now()}`,
        orderId: createdOrderId,
        patientName: 'Aarav Sharma',
        patientMrn: 'MRN-78901',
        modalityType: 'COMPUTED_TOMOGRAPHY_CT',
        studyDescription: 'HRCT Chest without Contrast',
        seriesCount: 3,
        instancesCount: 420,
        radiationDoseDlpMgyCm: 240.5,
        contrastAdministeredMl: 0,
        technologistName: 'Rajesh Kumar',
        pacsViewerUrl: 'https://pacs.docsearch.internal/viewer?studyUID=1.2.840.113619.2.001',
        pacsSyncStatus: 'SYNCED',
        status: 'ACQUIRED'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    const study = body.data || body;
    assert.ok(study.id);
    assert.ok(study.accessionNumber);
    createdStudyId = study.id;
  });

  it('TEST 08: POST /api/v1/partner/radiology/reports creates structured report draft', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/reports',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        partnerId,
        organizationId,
        branchId,
        reportNumber: `RAD-RPT-${Date.now()}`,
        studyId: createdStudyId,
        orderId: createdOrderId,
        patientName: 'Aarav Sharma',
        patientMrn: 'MRN-78901',
        modalityType: 'COMPUTED_TOMOGRAPHY_CT',
        procedureName: 'HRCT Chest without Contrast',
        clinicalHistory: 'Persistent dry cough and dyspnea',
        imagingTechnique: 'Volumetric thin-slice HRCT reconstructed at 0.625mm slice thickness',
        findings: 'Bilateral subpleural ground glass opacities with reticular thickening in lower lobes.',
        impression: 'Findings consistent with Usual Interstitial Pneumonia (UIP) pattern.',
        recommendations: 'Pulmonology correlation and pulmonary function testing advised.',
        hasCriticalFinding: true,
        reportingRadiologistName: 'Dr. Vikram Malhotra, MD'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    const report = body.data || body;
    assert.ok(report.id);
    assert.equal(report.status, 'DRAFT');
    createdReportId = report.id;
  });

  it('TEST 09: POST /api/v1/partner/radiology/critical-findings flags critical alert', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/critical-findings',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        partnerId,
        organizationId,
        branchId,
        alertCode: `RAD-CRT-${Date.now()}`,
        reportId: createdReportId,
        patientName: 'Aarav Sharma',
        patientMrn: 'MRN-78901',
        orderingDoctorName: 'Dr. Ananya Roy',
        orderingDepartment: 'Pulmonology',
        findingDescription: 'Severe bilateral ground glass consolidation with impending respiratory compromise.',
        severity: 'CRITICAL_IMMEDIATE_LIFE_THREATENING',
        flaggedByRadiologist: 'Dr. Vikram Malhotra, MD',
        notifiedRecipient: 'Dr. Ananya Roy (Phone/Pager verified)'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    const finding = body.data || body;
    assert.ok(finding.id);
    assert.equal(finding.status, 'FLAGGED_PENDING_NOTIFICATION');
    createdFindingId = finding.id;
  });

  it('TEST 10: PATCH /api/v1/partner/radiology/critical-findings/:id/acknowledge records clinician acknowledgement', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/critical-findings/${createdFindingId}/acknowledge`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        acknowledgedBy: 'Dr. Ananya Roy, MD',
        acknowledgmentNotes: 'Received verbally, patient admitted to Respiratory Stepdown Unit.'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    const updated = body.data || body;
    assert.equal(updated.status, 'ACKNOWLEDGED_BY_CLINICIAN');
    assert.equal(updated.acknowledgedBy, 'Dr. Ananya Roy, MD');
  });

  it('TEST 11: POST /api/v1/partner/radiology/reports/:id/finalize locks report with verification sign-off', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/radiology/reports/${createdReportId}/finalize`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        verifyingRadiologistName: 'Dr. Vikram Malhotra, MD (Senior Radiologist)'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    const finalized = body.data || body;
    assert.equal(finalized.status, 'FINALIZED');
    assert.ok(finalized.finalizedAt);
  });

  it('TEST 12: POST /api/v1/partner/radiology/reports/:id/amend performs controlled amendment with version increment', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/radiology/reports/${createdReportId}/amend`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        amendmentReason: 'Added quantitative lung volume involvement assessment per clinical request',
        findings: 'Bilateral subpleural ground glass opacities. Total disease burden estimated at 22% of total lung volume.',
        impression: 'UIP pattern with mild-to-moderate total volume involvement.',
        recommendations: 'Follow-up HRCT in 6 months.',
        verifyingRadiologistName: 'Dr. Vikram Malhotra, MD'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    const amended = body.data || body;
    assert.equal(amended.status, 'AMENDED');
    assert.equal(amended.version, 2);
    assert.ok(amended.amendmentReason.includes('quantitative'));
  });

  it('TEST 13: Unauthenticated request fails closed with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/radiology/overview'
    });

    assert.equal(res.statusCode, 401);
  });

  it('TEST 14: User without radiology permission is rejected with 403 Forbidden', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/radiology/overview',
      headers: { authorization: `Bearer ${unauthorizedToken}` }
    });

    assert.equal(res.statusCode, 403);
  });

  it('TEST 15: IDOR Multi-Tenant Isolation: Tenant B cannot access Tenant A order', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/orders/${createdOrderId}`,
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(res.statusCode, 404);
  });
});
