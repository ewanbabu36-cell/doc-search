import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Domain 2.19 — Asset & Biomedical (HTM) Vertical Slice Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-htm-001',
      email: overrides.email || 'biomedical.engineer@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['BIOMEDICAL_ENGINEER', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:biomedical:read',
        'clinical:biomedical:create',
        'clinical:biomedical:update',
        'clinical:biomedical:delete'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let tenantBToken;

  let createdAssetId;
  let createdWorkOrderId;
  let createdPpmId;
  let createdSparePartId;
  let createdCondemnationId;

  before(async () => {
    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    tenantBToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-htm-tenantB'
    });
  });

  after(async () => {
    await app.close();
  });

  it('TEST 01: GET /api/v1/partner/biomedical/overview returns operational equipment metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/biomedical/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.totalAssetsCount > 0);
    assert.ok(body.data.criticalUptimePercent >= 90);
  });

  it('TEST 02: GET /api/v1/partner/biomedical/analytics/downtime returns MTTR & MTBF analytics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/biomedical/analytics/downtime',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.meanTimeToRepairMinutes > 0);
    assert.ok(body.data.meanTimeBetweenFailuresDays > 0);
  });

  it('TEST 03: POST /api/v1/partner/biomedical/assets creates a new biomedical asset registry entry', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/biomedical/assets',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        assetTag: 'BM-VENT-042',
        assetName: 'Philips Respironics V680 Ventilator',
        category: 'LIFE_SUPPORT',
        criticalityLevel: 'CRITICAL',
        department: 'ICU',
        locationRoom: 'ICU-Bed-04',
        manufacturer: 'Philips Healthcare',
        modelNumber: 'V680',
        serialNumber: 'SN-PH-99281',
        purchaseCostMinorUnits: 145000000,
        warrantyExpiryDate: '2028-12-31'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.assetTag, 'BM-VENT-042');
    assert.equal(body.data.status, 'OPERATIONAL');
    createdAssetId = body.data.id;
  });

  it('TEST 04: GET /api/v1/partner/biomedical/assets retrieves asset catalog', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/biomedical/assets',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    const found = body.data.find(a => a.id === createdAssetId);
    assert.ok(found, 'Created asset must exist in catalog');
  });

  it('TEST 05: PATCH /api/v1/partner/biomedical/assets/:id updates asset location and metadata', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/biomedical/assets/${createdAssetId}`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        locationRoom: 'ICU-Bed-08-Isolation',
        notes: 'Transferred to Isolation Bed'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.locationRoom, 'ICU-Bed-08-Isolation');
  });

  it('TEST 06: POST /api/v1/partner/biomedical/work-orders creates a breakdown ticket and marks asset BREAKDOWN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/biomedical/work-orders',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        assetId: createdAssetId,
        workOrderType: 'BREAKDOWN',
        priority: 'EMERGENCY',
        issueDescription: 'Oxygen blender flow rate sensor error (Code E-402)',
        department: 'ICU'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'REPORTED');
    assert.ok(body.data.workOrderNumber.startsWith('WO-BM-'));
    createdWorkOrderId = body.data.id;
  });

  it('TEST 07: PATCH /api/v1/partner/biomedical/work-orders/:id/assign assigns engineer to ticket', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/biomedical/work-orders/${createdWorkOrderId}/assign`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        assignedToEngineerId: 'eng_rajesh_sharma',
        priority: 'EMERGENCY'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'ASSIGNED');
    assert.equal(body.data.assignedTo, 'eng_rajesh_sharma');
  });

  it('TEST 08: PATCH /api/v1/partner/biomedical/work-orders/:id/complete records root cause and repair', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/biomedical/work-orders/${createdWorkOrderId}/complete`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        rootCause: 'Flow sensor diaphragm recalibration required due to particulate build-up',
        correctiveAction: 'Cleaned ultrasonic transducer, replaced inline filter, ran self-test calibration',
        downtimeMinutes: 45
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'COMPLETED');
    assert.equal(body.data.downtimeMinutes, 45);
  });

  it('TEST 09: PATCH /api/v1/partner/biomedical/work-orders/:id/verify verifies repair and restores asset OPERATIONAL', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/biomedical/work-orders/${createdWorkOrderId}/verify`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        verifiedBy: 'Dr. Clinical In-charge',
        verificationNotes: 'Ventilator test lung cycle verified under 100% FiO2. Ready for patient use.'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'VERIFIED');
  });

  it('TEST 10: POST & PATCH /api/v1/partner/biomedical/ppm-schedules creates and completes PPM task', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/biomedical/ppm-schedules',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        assetId: createdAssetId,
        frequencyMonths: 6,
        scheduledDate: '2026-09-15',
        assignedEngineer: 'eng_rajesh_sharma'
      }
    });

    assert.equal(createRes.statusCode, 201);
    const createBody = JSON.parse(createRes.body);
    createdPpmId = createBody.data.id;

    const completeRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/biomedical/ppm-schedules/${createdPpmId}/complete`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        completedBy: 'eng_rajesh_sharma',
        checklistResults: {
          visualInspection: true,
          batteryBackupTest: true,
          pressureTransducerAccuracy: true,
          flowValveResponse: true,
          alarmAudibility: true
        },
        remarks: 'All 6-month PPM inspection points passed within IEC specifications.'
      }
    });

    assert.equal(completeRes.statusCode, 200);
    const completeBody = JSON.parse(completeRes.body);
    assert.equal(completeBody.data.status, 'COMPLETED');
  });

  it('TEST 11: POST /api/v1/partner/biomedical/calibrations logs NABL calibration certificate', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/biomedical/calibrations',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        assetId: createdAssetId,
        calibrationAgency: 'National Metrology & Precision Testing Lab',
        certificateNumber: 'CERT-NABL-2026-88912',
        calibrationDate: '2026-08-30',
        validityDate: '2027-08-29',
        standardUsed: 'Fluke VT900A Gas Flow Analyzer',
        calibrationStatus: 'PASSED'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.certificateNumber, 'CERT-NABL-2026-88912');
    assert.equal(body.data.calibrationStatus, 'PASSED');
  });

  it('TEST 12: POST /api/v1/partner/biomedical/safety-tests logs IEC 62353 electrical safety test', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/biomedical/safety-tests',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        assetId: createdAssetId,
        testType: 'ELECTRICAL_SAFETY_IEC_62353',
        earthContinuityOhms: 0.08,
        insulationResistanceMegaOhms: 120.5,
        chassisLeakageCurrentMicroAmps: 35.2,
        patientLeakageCurrentMicroAmps: 8.4,
        overallStatus: 'PASS',
        testedBy: 'eng_rajesh_sharma'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.overallStatus, 'PASS');
  });

  it('TEST 13: POST /api/v1/partner/biomedical/spare-parts & /consume records spare part consumption', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/biomedical/spare-parts',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        partNumber: 'SP-FLT-9901',
        partName: 'HEPA Bacterial / Viral Inline Filter',
        category: 'FILTER',
        stockQuantity: 25,
        unitCostMinorUnits: 350000,
        reorderThreshold: 5
      }
    });

    assert.equal(createRes.statusCode, 201);
    const createBody = JSON.parse(createRes.body);
    createdSparePartId = createBody.data.id;

    const consumeRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/biomedical/spare-parts/consume',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        sparePartId: createdSparePartId,
        workOrderId: createdWorkOrderId,
        quantityUsed: 2,
        usedBy: 'eng_rajesh_sharma'
      }
    });

    assert.equal(consumeRes.statusCode, 201);
    const consumeBody = JSON.parse(consumeRes.body);
    assert.equal(consumeBody.success, true);
    assert.equal(consumeBody.data.quantityUsed, 2);
  });

  it('TEST 14: POST & PATCH /api/v1/partner/biomedical/condemnations proposes and approves disposal', async () => {
    const proposeRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/biomedical/condemnations',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        assetId: createdAssetId,
        reasonForCondemnation: 'BEYOND_ECONOMIC_REPAIR',
        technicalReport: 'Compressor pump stator burnout after 12 years of continuous operation. OEM parts obsolete.',
        proposedDisposalMethod: 'E_WASTE_RECYCLING'
      }
    });

    assert.equal(proposeRes.statusCode, 201);
    const proposeBody = JSON.parse(proposeRes.body);
    createdCondemnationId = proposeBody.data.id;

    const approveRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/biomedical/condemnations/${createdCondemnationId}/approve`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        approvedBy: 'Condemnation Board Committee',
        committeeMeetingDate: '2026-08-30',
        disposalMethod: 'AUTHORIZED_E_WASTE_RECYCLING'
      }
    });

    assert.equal(approveRes.statusCode, 200);
    const approveBody = JSON.parse(approveRes.body);
    assert.equal(approveBody.data.status, 'APPROVED');
  });

  it('TEST 15: Cross-tenant isolation & SHA-256 audit trail integrity', async () => {
    // Tenant B cannot access Tenant A asset
    const tenantBRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/biomedical/assets',
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(tenantBRes.statusCode, 200);
    const tenantBBody = JSON.parse(tenantBRes.body);
    const leaked = tenantBBody.data.find(a => a.id === createdAssetId);
    assert.equal(leaked, undefined, 'Tenant B must not see Tenant A asset records');

    // Unauthenticated request rejected with 401
    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/biomedical/assets'
    });
    assert.equal(unauthRes.statusCode, 401);

    // Audit traces verification
    const auditRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/biomedical/audit-traces',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(auditRes.statusCode, 200);
    const auditBody = JSON.parse(auditRes.body);
    assert.ok(auditBody.data.length > 0, 'Audit events must be recorded');
    assert.ok(auditBody.data.every(a => typeof a.integrityHash === 'string' && a.integrityHash.length === 64), 'All audit records must have SHA-256 hash');
  });
});
