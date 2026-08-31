import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Domain 2.20 — Hospital Quality, Incident & Infection Control (NABH / JCI) Vertical Slice Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-quality-001',
      email: overrides.email || 'quality.director@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['QUALITY_OFFICER', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:quality:read',
        'clinical:quality:create',
        'clinical:quality:update',
        'clinical:quality:delete'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let tenantBToken;

  let createdIncidentId;
  let createdRcaId;
  let createdCapaId;
  let createdIsolationId;

  before(async () => {
    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    tenantBToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-qual-tenantB'
    });
  });

  after(async () => {
    await app.close();
  });

  it('TEST 01: GET /api/v1/partner/quality/overview returns NABH & JCI quality metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/quality/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.overallNabhScorePct >= 90);
    assert.ok(body.data.handHygieneCompliancePct > 80);
  });

  it('TEST 02: GET /api/v1/partner/quality/standards returns NABH chapter accreditation checklist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/quality/standards',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });

  it('TEST 03: POST /api/v1/partner/quality/incidents reports high-risk sentinel adverse event', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/incidents',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        category: 'MEDICATION_ERROR',
        sacScore: 'SAC_1_EXTREME_SENTINEL',
        patientInvolved: true,
        patientMrn: 'MRN-2026-9921',
        patientName: 'Sunita Verma',
        departmentName: 'ICU',
        locationDetail: 'ICU Bed 03',
        briefSummary: 'Near-miss concentrated potassium chloride ampoule draw without double-check verification',
        detailedDescription: 'Nursing staff identified ampoule mismatch during 5-rights bedside barcode scan prior to infusion.',
        immediateActionTaken: 'Infusion halted immediately, primary physician notified, vitals monitored, correct normal saline administered.',
        patientHarmLevel: 'NO_HARM_NEAR_MISS'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.incidentNumber.startsWith('INC-Q-'));
    assert.equal(body.data.isSentinelEvent, true);
    assert.equal(body.data.rcaRequired, true);
    createdIncidentId = body.data.id;
  });

  it('TEST 04: PATCH /api/v1/partner/quality/incidents/:id/triage triages incident and triggers RCA', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/quality/incidents/${createdIncidentId}/triage`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        sacScore: 'SAC_1_EXTREME_SENTINEL',
        investigatingOfficer: 'Dr. Quality Lead',
        rcaRequired: true
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'UNDER_TRIAGE');
  });

  it('TEST 05: POST /api/v1/partner/quality/rcas conducts Root Cause Analysis with Fishbone breakdown', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/rcas',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        incidentId: createdIncidentId,
        incidentNumber: 'INC-Q-9921',
        rcaLeader: 'Dr. Quality Lead',
        rootCauseStatement: 'High-alert Look-Alike Sound-Alike (LASA) electrolytes were co-stored in the emergency crash cart without high-visibility warning labels.',
        fishboneAnalysisJson: {
          environment: 'Inadequate dedicated high-alert storage bin',
          people: 'Night shift fatigue and rush during code blue prep',
          process: 'Double-sign verification was not mandatory in bedside pyxis drawer',
          materials: 'Look-alike ampoules from same generic manufacturer'
        }
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.rcaCode.startsWith('RCA-'));
    createdRcaId = body.data.id;
  });

  it('TEST 06: POST /api/v1/partner/quality/capas formulates Corrective & Preventive Action', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/capas',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        incidentId: createdIncidentId,
        incidentNumber: 'INC-Q-9921',
        rcaId: createdRcaId,
        actionType: 'CORRECTIVE_AND_PREVENTIVE',
        actionDescription: 'Implement mandatory dual-nurse biometric sign-off for concentrated electrolytes and physically segregate LASA meds with red fluorescent bin dividers.',
        responsibleOwner: 'Head of Hospital Pharmacy',
        targetCompletionDate: '2026-09-15'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.capaCode.startsWith('CAPA-'));
    createdCapaId = body.data.id;
  });

  it('TEST 07: PATCH /api/v1/partner/quality/capas/:id/verify verifies CAPA effectiveness', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/quality/capas/${createdCapaId}/verify`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        verificationNotes: 'Random audit of 50 bedside administrations showed 100% adherence to dual-scan policy. Zero high-alert near misses in 14 days.',
        isEffective: true
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'VERIFIED_EFFECTIVE');
    assert.equal(body.data.isEffective, true);
  });

  it('TEST 08: PATCH /api/v1/partner/quality/incidents/:id/close closes incident lifecycle after verification', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/quality/incidents/${createdIncidentId}/close`,
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'CLOSED');
  });

  it('TEST 09: POST /api/v1/partner/quality/hai logs Central Line-Associated Bloodstream Infection (CLABSI)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/hai',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientMrn: 'MRN-2026-8801',
        patientName: 'Rohan Mehta',
        haiType: 'CLABSI',
        wardName: 'Medical ICU',
        deviceAssociated: true,
        organismIdentified: 'Klebsiella pneumoniae (ESBL+)',
        infectionControlNurse: 'Sister Mary Joseph'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.caseCode.startsWith('HAI-'));
  });

  it('TEST 10: POST & PATCH /api/v1/partner/quality/isolations assigns and discharges barrier isolation', async () => {
    const assignRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/isolations',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientMrn: 'MRN-2026-8801',
        patientName: 'Rohan Mehta',
        wardName: 'Isolation Block B',
        bedNumber: 'ISO-Bed-02',
        isolationCategory: 'CONTACT_AND_DROPLET',
        organismName: 'MDR Klebsiella pneumoniae'
      }
    });

    assert.equal(assignRes.statusCode, 201);
    const assignBody = JSON.parse(assignRes.body);
    createdIsolationId = assignBody.data.id;

    const dischargeRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/quality/isolations/${createdIsolationId}/discharge`,
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(dischargeRes.statusCode, 200);
    const dischargeBody = JSON.parse(dischargeRes.body);
    assert.equal(dischargeBody.data.status, 'DISCHARGED');
  });

  it('TEST 11: POST /api/v1/partner/quality/hand-hygiene logs WHO 5 Moments audit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/hand-hygiene',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        auditorName: 'Infection Control Auditor',
        departmentName: 'Surgical ICU',
        opportunityCount: 20,
        complianceCount: 19
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.compliancePercentage, 95);
  });

  it('TEST 12: POST /api/v1/partner/quality/swabs logs microbiological environmental swab', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/swabs',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        sampleLocation: 'Major OT 1 - Operating Table Light Handle',
        departmentName: 'OT Complex',
        isCompliant: true,
        colonyCount: 0,
        sampledBy: 'Microbiology Surveillance Tech'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.isCompliant, true);
  });

  it('TEST 13: POST /api/v1/partner/quality/needle-stick logs occupational sharp injury & PEP protocol', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/needle-stick',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        staffName: 'Staff Nurse Kavita',
        staffRole: 'STAFF_NURSE',
        departmentName: 'Emergency Trauma Ward',
        exposureType: 'HOLLOW_BORE_NEEDLE_PERCUTANEOUS',
        sourcePatientKnown: true,
        postExposureProphylaxisGiven: true
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'EVALUATED_PEP_INITIATED');
  });

  it('TEST 14: POST /api/v1/partner/quality/bmw logs barcoded biomedical waste dispatch manifest', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/quality/bmw',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        yellowBagKg: 18.5,
        redBagKg: 24.2,
        whitePunctureProofKg: 3.1,
        blueCardboardKg: 8.4,
        dispatchedToVendor: 'State Authorized Common Bio-medical Waste Treatment Facility (CBWTF)',
        verifiedByStaff: 'Hospital Sanitary Inspector'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.totalWeightKg, 54.2);
  });

  it('TEST 15: Cross-tenant isolation & SHA-256 audit trail integrity', async () => {
    // Tenant B cannot access Tenant A incidents
    const tenantBRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/quality/incidents',
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(tenantBRes.statusCode, 200);
    const tenantBBody = JSON.parse(tenantBRes.body);
    const leaked = tenantBBody.data.find(i => i.id === createdIncidentId);
    assert.equal(leaked, undefined, 'Tenant B must not see Tenant A incident records');

    // Unauthenticated request rejected with 401
    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/quality/incidents'
    });
    assert.equal(unauthRes.statusCode, 401);

    // Audit traces verification
    const auditRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/quality/audit-traces',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(auditRes.statusCode, 200);
    const auditBody = JSON.parse(auditRes.body);
    assert.ok(auditBody.data.length > 0, 'Audit events must be recorded');
    assert.ok(auditBody.data.every(a => typeof a.integrityHash === 'string' && a.integrityHash.length === 64), 'All audit records must have SHA-256 hash');
  });
});
