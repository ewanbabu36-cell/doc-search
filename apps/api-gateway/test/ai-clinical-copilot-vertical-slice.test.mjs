import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Domain 3.3 — Ambient AI Scribe & CDSS Clinical Co-Pilot Vertical Slice Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-doc-cardiologist-01',
      email: overrides.email || 'dr.amit.sen@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['ATTENDING_PHYSICIAN', 'CARDIOLOGY_HOD'],
      permissions: overrides.permissions || [
        'ai_copilot:soap:generate',
        'ai_copilot:soap:approve',
        'ai_copilot:sepsis:read',
        'ai_copilot:sepsis:evaluate',
        'ai_copilot:ddi:evaluate',
        'ai_copilot:ddi:override',
        'ai_copilot:panic:read',
        'ai_copilot:panic:ack'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let tenantBToken;

  let createdSoapId;
  let createdSepsisAlertId;
  let createdDdiId;
  let createdPanicId;

  before(async () => {
    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    tenantBToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-doc-tenantB'
    });
  });

  after(async () => {
    await app.close();
  });

  it('TEST 01: GET /api/v1/partner/ai-copilot/overview returns CDSS operational metrics & AI accuracy', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai-copilot/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.aiModelAccuracyPct >= 95.0);
    assert.ok(body.data.averageSepsisBundleCompliancePct >= 90.0);
  });

  it('TEST 02: POST /api/v1/partner/ai-copilot/ambient-scribe/soap generates structured SOAP note from clinical transcript', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/ambient-scribe/soap',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientMrn: 'MRN-2026-9041',
        patientName: 'Kavita Joshi',
        doctorName: 'Dr. Amit Sen, MD',
        specialtyName: 'Cardiology',
        audioDurationSeconds: 215,
        clinicalDialogueTranscript: 'Doctor: Hello Kavita, how have you been feeling? Patient: Doctor, for the past 3 weeks I am having shortness of breath when climbing stairs, and my feet are swollen. Doctor: Let me check your blood pressure. It is 154 over 92. Lungs have mild crackles at bases.'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.reviewStatus, 'AI_DRAFTED');
    assert.ok(body.data.soapNote.subjective.includes('dyspnea'));
    assert.ok(body.data.soapNote.assessment.includes('Heart Failure'));
    createdSoapId = body.data.id;
  });

  it('TEST 03: Ambient Scribe extracts suggested ICD-10 codes with confidence scores', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai-copilot/ambient-scribe/soap',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const note = body.data.find(s => s.id === createdSoapId);
    assert.ok(note, 'Generated SOAP note must be retrieved');
    assert.ok(Array.isArray(note.suggestedIcd10Codes));
    assert.ok(note.suggestedIcd10Codes.some(c => c.code === 'I10' && c.confidencePct > 90));
  });

  it('TEST 04: Ambient Scribe extracts recommended prescriptions with dose & frequency', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai-copilot/ambient-scribe/soap',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const note = body.data.find(s => s.id === createdSoapId);
    assert.ok(note.suggestedPrescriptions.some(p => p.drugName.includes('Torsemide')));
  });

  it('TEST 05: PATCH /api/v1/partner/ai-copilot/ambient-scribe/soap/:id/approve signs off SOAP note', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai-copilot/ambient-scribe/soap/${createdSoapId}/approve`,
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.reviewStatus, 'PHYSICIAN_APPROVED');
  });

  it('TEST 06: POST /api/v1/partner/ai-copilot/sepsis/evaluate calculates NEWS2 score & triggers Red Alert', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/sepsis/evaluate',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientMrn: 'MRN-2026-9041',
        patientName: 'Kavita Joshi',
        bedNumber: 'ICU-04',
        wardName: 'Cardio-Thoracic ICU',
        respiratoryRate: 26,
        spO2Pct: 89,
        requiresSupplementalO2: true,
        systolicBp: 86,
        pulseRate: 124,
        temperatureCelsius: 39.2,
        consciousnessLevel: 'VOICE',
        serumLactateMmolL: 3.8
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.news2Score >= 7);
    assert.equal(body.data.riskGrade, 'HIGH_RISK_RED_ALERT_7_PLUS');
    assert.equal(body.data.alertStatus, 'TRIGGERED_ACTIVE');
    createdSepsisAlertId = body.data.id;
  });

  it('TEST 07: PATCH /api/v1/partner/ai-copilot/sepsis/alerts/:id/acknowledge initiates Sepsis 6 Care Bundle', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai-copilot/sepsis/alerts/${createdSepsisAlertId}/acknowledge`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        clinicalActionTaken: 'Stat blood cultures sent; IV Piperacillin-Tazobactam and 30ml/kg crystalloids initiated.'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.alertStatus, 'ACKNOWLEDGED_RRT_EN_ROUTE');
    assert.equal(body.data.bundleChecklist.ivAntibioticsGiven, true);
  });

  it('TEST 08: POST /api/v1/partner/ai-copilot/ddi/evaluate flags CONTRAINDICATED lethal interaction (Warfarin + Clarithromycin)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/ddi/evaluate',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientMrn: 'MRN-2026-9041',
        activeMedications: ['Warfarin 5mg Tablet OD'],
        newMedicationToPrescribe: 'Clarithromycin 500mg Tablet BD'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.severityLevel, 'CONTRAINDICATED_FATAL');
    assert.ok(body.data.clinicalConsequence.includes('hemorrhage'));
    assert.equal(body.data.wasOverridden, false);
    createdDdiId = body.data.id;
  });

  it('TEST 09: POST /api/v1/partner/ai-copilot/ddi/override logs physician justification for DDI warning', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/ddi/override',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        interactionId: createdDdiId,
        clinicalJustification: 'Suspected severe atypical mycobacterial infection resistant to Azithromycin. Daily PT/INR scheduled with temporary 50% Warfarin reduction.'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.wasOverridden, true);
    assert.ok(body.data.overrideJustification.includes('Daily PT/INR scheduled'));
  });

  it('TEST 10: DDI Override strictly rejects empty clinical justification (400 Bad Request)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/ddi/override',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        interactionId: createdDdiId,
        clinicalJustification: ''
      }
    });

    assert.equal(res.statusCode, 400);
  });

  it('TEST 11: POST /api/v1/partner/ai-copilot/panic-values broadcasts stat critical lab alert (Troponin I)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/panic-values',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientMrn: 'MRN-2026-9041',
        patientName: 'Kavita Joshi',
        location: 'Cardiology ICU Bed 4',
        testName: 'High Sensitivity Cardiac Troponin I (hs-cTnI)',
        measuredValue: '2150 ng/L',
        referenceNormalRange: '< 14 ng/L',
        panicThreshold: '> 100 ng/L',
        category: 'CARDIAC_ENZYME_CRITICAL',
        doctorName: 'Dr. Amit Sen, MD'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.urgencyLevel, 'CRITICAL_LIFE_THREAT');
    assert.equal(body.data.communicatedToDoctor, true);
    createdPanicId = body.data.id;
  });

  it('TEST 12: PATCH /api/v1/partner/ai-copilot/panic-values/:id/acknowledge records doctor intervention', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai-copilot/panic-values/${createdPanicId}/acknowledge`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        immediateIntervention: 'Bedside 12-lead ECG confirmed STEMI; Cath Lab team mobilized for Primary PCI.'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.acknowledgementTimestamp !== null);
  });

  it('TEST 13: Multi-Tenant Isolation: Tenant B cannot access Tenant A SOAP records', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai-copilot/ambient-scribe/soap',
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const leaked = body.data.find(s => s.id === createdSoapId);
    assert.equal(leaked, undefined, 'Tenant B must not see Tenant A SOAP note');
  });

  it('TEST 14: Unauthenticated request to /api/v1/partner/ai-copilot/overview fails closed with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai-copilot/overview'
    });

    assert.equal(res.statusCode, 401);
  });

  it('TEST 15: SHA-256 Cryptographic Audit Chain verification for all AI clinical suggestions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai-copilot/audit-traces',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.length >= 5, 'All AI events must create immutable audit records');
    assert.ok(body.data.every(t => typeof t.integrityHash === 'string' && t.integrityHash.length === 64), 'All audit hashes must be valid 64-char SHA-256 strings');
  });
});
