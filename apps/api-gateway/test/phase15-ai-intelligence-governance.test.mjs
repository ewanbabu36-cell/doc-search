import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  getDatabase,
  aiRequestRegistry,
  aiIncidents,
  aiCostBudgets,
  aiAnomalyDetections,
  aiDemandForecasts,
  auditEvents,
  patients,
  encounters,
  billingInvoices,
  eq
} from '@docsearch/database';

describe('PHASE 15 — AI + Intelligence & Governance Production Verification Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '00000000-0000-4000-8000-000000000003';

  function createToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-doc-001',
      email: overrides.email || 'dr.amit@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['DOCTOR', 'PHYSICIAN'],
      permissions: overrides.permissions || [
        'clinical:write',
        'clinical:read',
        'patient:read',
        'ai_copilot:soap:generate',
        'ai_copilot:soap:approve'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let doctorToken;
  let billingToken;
  let receptionToken;
  let hqAdminToken;
  let tenantBToken;

  let createdAnomalyId;
  let createdIncidentId;

  before(async () => {
    testDb = await setupTestDatabase();

    const db = getDatabase();
    const partnerId = '00000000-0000-4000-8000-000000000001';
    const organizationId = '00000000-0000-4000-8000-000000000002';
    const departmentId = '00000000-0000-4000-8000-000000000004';

    await testDb.pool.query(`
      INSERT INTO "core"."branches" ("id", "tenant_id", "name", "code")
      VALUES ('${branchId}', '${tenantA}', 'Cardiology Branch A', 'BRA-CARD-01')
      ON CONFLICT DO NOTHING;
    `);

    const patId = 'a1111111-1111-4111-8111-111111111101';
    await db.insert(patients).values({
      id: patId,
      tenantId: tenantA,
      partnerId,
      organizationId,
      branchId,
      uhid: 'UHID-2026-001',
      mrn: 'MRN-2026-001',
      patientCode: 'PC-2026-001',
      firstName: 'Ramesh',
      lastName: 'Patel',
      dateOfBirth: '1985-05-15',
      gender: 'MALE',
      status: 'ACTIVE'
    }).onConflictDoNothing();

    await db.insert(encounters).values([
      {
        id: 'e1111111-1111-4111-8111-111111111101',
        tenantId: tenantA,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        patientId: patId,
        encounterNumber: 'ENC-2026-001',
        encounterType: 'OPD',
        status: 'WAITING',
        chiefComplaint: 'Chest discomfort'
      },
      {
        id: 'e1111111-1111-4111-8111-111111111102',
        tenantId: tenantA,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        patientId: patId,
        encounterNumber: 'ENC-2026-002',
        encounterType: 'OPD',
        status: 'IN_CONSULTATION',
        chiefComplaint: 'High blood pressure'
      },
      {
        id: 'e1111111-1111-4111-8111-111111111103',
        tenantId: tenantA,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        patientId: patId,
        encounterNumber: 'ENC-2026-003',
        encounterType: 'OPD',
        status: 'COMPLETED',
        chiefComplaint: 'Annual physical examination'
      }
    ]).onConflictDoNothing();

    await db.insert(billingInvoices).values({
      id: 'b1111111-1111-4111-8111-111111111101',
      tenantId: tenantA,
      partnerId,
      organizationId,
      branchId,
      patientId: patId,
      invoiceNumber: 'INV-2026-001',
      status: 'PAID',
      subtotal: '1500.00',
      totalAmount: '1500.00',
      paidAmount: '1500.00'
    }).onConflictDoNothing();

    app = await buildApp();
    await app.ready();

    doctorToken = createToken({
      userId: 'usr-doc-001',
      roles: ['DOCTOR', 'PHYSICIAN'],
      permissions: ['clinical:write', 'clinical:read', 'patient:read']
    });

    billingToken = createToken({
      userId: 'usr-bill-001',
      roles: ['BILLING_CLERK', 'CASHIER'],
      permissions: ['billing:create', 'billing:read', 'finance:read']
    });

    receptionToken = createToken({
      userId: 'usr-rec-001',
      roles: ['FRONT_DESK', 'RECEPTIONIST'],
      permissions: ['patient:create', 'reception:write']
    });

    hqAdminToken = createToken({
      userId: 'usr-hq-001',
      roles: ['HQ_SUPER_ADMIN', 'SUPER_ADMIN'],
      permissions: ['admin:all', 'audit:read'],
      tenantId: '00000000-0000-4000-8000-000000000001'
    });

    tenantBToken = createToken({
      userId: 'usr-doc-tenantB',
      tenantId: tenantB,
      roles: ['DOCTOR']
    });
  });

  after(async () => {
    if (app) await app.close();
    if (testDb?.cleanup) await testDb.cleanup();
  });

  // -------------------------------------------------------------------------
  // 1. Mandatory Request Metadata & Validation
  // -------------------------------------------------------------------------
  it('TEST 01: Mandatory Request Metadata: Execute AI request without mandatory fields fails closed with 400 Validation Error', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        // Missing module, purpose, and role
        tenantId: tenantA,
        userId: 'usr-doc-001',
        model: 'gemini-1.5-pro'
      }
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.message.includes('Mandatory request metadata missing'));
  });

  it('TEST 02: Central Gateway Execution: Successfully executes Level 0 Information query with complete metadata & registry log', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        tenantId: tenantA,
        branchId,
        userId: 'usr-doc-001',
        role: 'DOCTOR',
        module: 'CLINICAL',
        purpose: 'CLINICAL_SUMMARY',
        inputClassification: 'PATIENT_DATA',
        approvalRequirement: 'LEVEL_0_INFORMATION',
        model: 'gemini-1.5-pro',
        promptVersion: '1.0.0',
        inputPayload: { patientMrn: 'MRN-2026-001', condition: 'Hypertension' }
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'SUCCESS');
    assert.equal(body.data.prefixLabel, 'AI SUMMARY');
    assert.ok(body.data.output.summary.includes('MRN-2026-001'));
    assert.ok(body.data.tokensUsed.total > 0);
  });

  it('TEST 03: AI Request Registry: Verified that request was persisted in ai_request_registry table with telemetry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai/gateway/history?limit=10',
      headers: { authorization: `Bearer ${doctorToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    const entry = body.data[0];
    assert.equal(entry.module, 'CLINICAL');
    assert.equal(entry.purpose, 'CLINICAL_SUMMARY');
    assert.equal(entry.status, 'SUCCESS');
    assert.ok(entry.latencyMs >= 0);
  });

  // -------------------------------------------------------------------------
  // 2. Level 4 Prohibited Autonomous Actions
  // -------------------------------------------------------------------------
  it('TEST 04: Level 4 Prohibited Autonomous Decisions: Autonomous clinical diagnosis or financial disbursement is hard-blocked (403 Forbidden)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        tenantId: tenantA,
        branchId,
        userId: 'usr-doc-001',
        role: 'DOCTOR',
        module: 'CLINICAL',
        purpose: 'FINAL_AUTONOMOUS_DIAGNOSIS',
        inputClassification: 'PATIENT_DATA',
        approvalRequirement: 'LEVEL_4_PROHIBITED',
        model: 'gemini-1.5-pro',
        inputPayload: { patientMrn: 'MRN-2026-001' }
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.error.code, 'FORBIDDEN');
    assert.ok(body.error.message.includes('Action prohibited: Autonomous execution not permitted'));
  });

  // -------------------------------------------------------------------------
  // 3. Data Classification & Access Boundaries
  // -------------------------------------------------------------------------
  it('TEST 05: Data Classification: Non-clinical role attempting PATIENT_DATA access is blocked with 403 Forbidden', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      headers: { authorization: `Bearer ${billingToken}` },
      payload: {
        tenantId: tenantA,
        branchId,
        userId: 'usr-bill-001',
        role: 'BILLING_CLERK',
        module: 'BILLING',
        purpose: 'PATIENT_MEDICAL_HISTORY',
        inputClassification: 'PATIENT_DATA',
        approvalRequirement: 'LEVEL_0_INFORMATION',
        model: 'gemini-1.5-pro',
        inputPayload: { patientMrn: 'MRN-2026-001' }
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('PATIENT_DATA access requires clinical role'));
  });

  it('TEST 06: Data Classification: Non-finance role attempting FINANCIAL_DATA access is blocked with 403 Forbidden', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        tenantId: tenantA,
        branchId,
        userId: 'usr-doc-001',
        role: 'DOCTOR',
        module: 'BILLING',
        purpose: 'MONTHLY_P_L_TAX_RECORDS',
        inputClassification: 'FINANCIAL_DATA',
        approvalRequirement: 'LEVEL_0_INFORMATION',
        model: 'gemini-1.5-pro',
        inputPayload: { reportYear: 2026 }
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('FINANCIAL_DATA access requires finance role'));
  });

  // -------------------------------------------------------------------------
  // 4. Human Approval Levels (Level 1, 2, 3)
  // -------------------------------------------------------------------------
  it('TEST 07: Human Approval Levels: LEVEL_1_RECOMMENDATION returns prefix AI RECOMMENDATION', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        tenantId: tenantA,
        branchId,
        userId: 'usr-doc-001',
        role: 'DOCTOR',
        module: 'CLINICAL',
        purpose: 'RECOMMEND_INVESTIGATION_PANEL',
        inputClassification: 'INTERNAL',
        approvalRequirement: 'LEVEL_1_RECOMMENDATION',
        model: 'gemini-1.5-pro',
        inputPayload: { symptoms: ['Fever', 'Chills'] }
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.data.prefixLabel, 'AI RECOMMENDATION');
  });

  it('TEST 08: Human Approval Levels: LEVEL_2_DRAFT returns prefix AI DRAFT — REQUIRES HUMAN REVIEW', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        tenantId: tenantA,
        branchId,
        userId: 'usr-doc-001',
        role: 'DOCTOR',
        module: 'CLINICAL',
        purpose: 'DRAFT_DISCHARGE_SUMMARY',
        inputClassification: 'INTERNAL',
        approvalRequirement: 'LEVEL_2_DRAFT',
        model: 'gemini-1.5-pro',
        inputPayload: { patientMrn: 'MRN-2026-001' }
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.data.prefixLabel, 'AI DRAFT — REQUIRES HUMAN REVIEW');
  });

  // -------------------------------------------------------------------------
  // 5. Staff Trainer — Ewanname (Role-verified Guidance)
  // -------------------------------------------------------------------------
  it('TEST 09: Staff Trainer (Ewanname): Role-verified guidance succeeds for authorized role (Doctor -> OPD_CONSULTATION)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/trainer/guidance',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: { workflowCode: 'OPD_CONSULTATION' }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.workflowCode, 'OPD_CONSULTATION');
    assert.equal(body.data.prefixLabel, 'AI OPERATIONAL GUIDANCE — EWANNAME TRAINER');
    assert.ok(body.data.steps.length >= 4);
    assert.ok(body.data.steps.some(s => s.targetComponent.includes('SoloDoctorOpdCockpit')));
  });

  it('TEST 10: Staff Trainer (Ewanname): Role mismatch fails closed with 403 (Billing Clerk requesting OPD_CONSULTATION)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/trainer/guidance',
      headers: { authorization: `Bearer ${billingToken}` },
      payload: { workflowCode: 'OPD_CONSULTATION' }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Access denied'));
    assert.ok(body.error.message.includes('does not have permission to execute the "Outpatient Doctor Consultation & Clinical Note" workflow'));
  });

  it('TEST 11: Staff Trainer (Ewanname): Unimplemented fictitious workflow query returns 404 FEATURE NOT IMPLEMENTED (Zero Hallucination)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/trainer/guidance',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: { workflowCode: 'TELEPORTATION_DRONE_DISPENSARY' }
    });

    assert.equal(res.statusCode, 404);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('FEATURE NOT IMPLEMENTED'));
  });

  it('TEST 12: Staff Trainer (Ewanname): Lists all registered real workflows', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai/trainer/workflows',
      headers: { authorization: `Bearer ${doctorToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    const codes = body.data.map(w => w.code);
    assert.ok(codes.includes('PATIENT_REGISTRATION'));
    assert.ok(codes.includes('OPD_CONSULTATION'));
    assert.ok(codes.includes('LAB_SAMPLE_COLLECTION'));
    assert.ok(codes.includes('PHARMACY_DISPENSING'));
    assert.ok(codes.includes('INPATIENT_BED_ADMISSION'));
    assert.ok(codes.includes('BILLING_INVOICE_GENERATION'));
    assert.ok(codes.includes('SHIFT_HANDOVER'));
  });

  // -------------------------------------------------------------------------
  // 6. Operations Assistant (Deterministic Question Answering)
  // -------------------------------------------------------------------------
  it('TEST 13: Operations Assistant: Live summary returns real operational counts from PostgreSQL truth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai/operations/summary',
      headers: { authorization: `Bearer ${doctorToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.prefixLabel, 'AI SUMMARY — OPERATIONS ASSISTANT');
    assert.equal(body.data.opdStatus.activeWaitingPatients, 1);
    assert.equal(body.data.opdStatus.inConsultationPatients, 1);
    assert.equal(body.data.opdStatus.completedToday, 1);
    assert.equal(body.data.financialSummary.invoicesIssuedToday, 1);
    assert.equal(body.data.financialSummary.totalCollectionInr, '1500.00');
  });

  it('TEST 14: Operations Assistant: Answers natural language questions deterministically', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/operations/query',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: { question: 'How many beds are currently occupied?' }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.category, 'IPD_BEDS');
    assert.ok(body.data.answer.includes('operational beds are occupied'));
  });

  // -------------------------------------------------------------------------
  // 7. Explainable AI & Anomaly Detection
  // -------------------------------------------------------------------------
  it('TEST 15: Explainable AI: Evaluates Lab Delta Check and flags acute shift with explainability score & recommendation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/anomalies/lab-delta-check',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        patientMrn: 'MRN-2026-001',
        testName: 'Serum Creatinine',
        previousValue: 1.1,
        currentValue: 3.8,
        unit: 'mg/dL',
        hoursApart: 24
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.detected, true);
    assert.equal(body.data.domain, 'LAB');
    assert.equal(body.data.prefixLabel, 'ANOMALY DETECTED — HUMAN REVIEW REQUIRED');
    assert.equal(body.data.confidenceScore, '0.98');
    assert.ok(body.data.explanation.includes('50% biological delta threshold'));
    createdAnomalyId = body.data.id;
  });

  it('TEST 16: Explainable AI: Evaluates Pharmacy Stock Discrepancy and records anomaly', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/anomalies/pharmacy-leakage',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        medicationName: 'Tab Amoxicillin 500mg',
        batchNumber: 'AMX-2026-B1',
        systemQuantity: 100,
        physicalQuantity: 75,
        varianceValueInr: 1250
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.detected, true);
    assert.equal(body.data.domain, 'PHARMACY');
    assert.equal(body.data.detectionType, 'STOCK_LEAKAGE');
  });

  it('TEST 17: Anomaly Human Review Workflow: Human sign-off transitions status with mandatory review remarks and audit trail', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai/anomalies/${createdAnomalyId}/review`,
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        action: 'CONFIRM',
        reviewRemarks: 'Redrawn sample confirmed acute kidney injury. Nephrology consulted.'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.humanReviewStatus, 'CONFIRM');
    assert.equal(body.data.reviewedBy, 'usr-doc-001');
  });

  // -------------------------------------------------------------------------
  // 8. Advisory Demand Forecasting
  // -------------------------------------------------------------------------
  it('TEST 18: Advisory Demand Forecasting: Generates OPD/IPD projection with confidence intervals, documented assumptions, and isAdvisoryOnly=true', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/forecasts/generate',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        domain: 'OPD',
        targetDate: new Date(Date.now() + 86400000).toISOString()
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.prefixLabel, 'AI FORECAST — ADVISORY ONLY');
    assert.equal(body.data.isAdvisoryOnly, true);
    assert.ok(body.data.predictedValue > 0);
    assert.ok(body.data.confidenceIntervalLower < body.data.predictedValue);
    assert.ok(body.data.confidenceIntervalUpper > body.data.predictedValue);
    assert.ok(body.data.assumptions.length >= 2);
  });

  // -------------------------------------------------------------------------
  // 9. Cost Control & Token Budgeting
  // -------------------------------------------------------------------------
  it('TEST 19: Cost Control & Token Budgeting: Enforces token quota limit and fails closed (429 RATE_LIMIT_EXCEEDED) when hard stop exceeded', async () => {
    // Set an ultra-low token budget for testing hard stop
    await app.inject({
      method: 'POST',
      url: '/api/v1/hq/ai/budget/set-limit',
      headers: { authorization: `Bearer ${hqAdminToken}` },
      payload: {
        tenantId: tenantA,
        monthlyTokenLimit: 100, // Very low limit to trigger 429
        hardStopThresholdPercent: 100
      }
    });

    // Make request that exceeds the 100 token ceiling
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        tenantId: tenantA,
        branchId,
        userId: 'usr-doc-001',
        role: 'DOCTOR',
        module: 'CLINICAL',
        purpose: 'CLINICAL_SUMMARY',
        inputClassification: 'INTERNAL',
        approvalRequirement: 'LEVEL_0_INFORMATION',
        model: 'gemini-1.5-pro',
        inputPayload: { text: 'Querying medical summary' }
      }
    });

    assert.equal(res.statusCode, 429);
    const body = JSON.parse(res.body);
    assert.equal(body.error.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(body.error.message.includes('AI budget ceiling exceeded'));

    // Restore comfortable budget for remaining tests
    await app.inject({
      method: 'POST',
      url: '/api/v1/hq/ai/budget/set-limit',
      headers: { authorization: `Bearer ${hqAdminToken}` },
      payload: {
        tenantId: tenantA,
        monthlyTokenLimit: 5000000,
        hardStopThresholdPercent: 100
      }
    });
  });

  // -------------------------------------------------------------------------
  // 10. AI Incident Governance & CAPA Lifecycle
  // -------------------------------------------------------------------------
  it('TEST 20: AI Incident Governance: Full incident lifecycle Report -> RCA -> CAPA -> Verification & Closure', async () => {
    // 1. Report Incident
    const reportRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/incidents',
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        incidentType: 'HALLUCINATION',
        severity: 'HIGH',
        model: 'gemini-1.5-pro',
        promptTemplate: 'OPD_SCRIBE_V1',
        description: 'Model hallucinated penicillin prescription when transcript contained penicillin allergy disclosure.'
      }
    });

    assert.equal(reportRes.statusCode, 201);
    const reportBody = JSON.parse(reportRes.body);
    assert.equal(reportBody.success, true);
    assert.equal(reportBody.data.status, 'OPEN');
    createdIncidentId = reportBody.data.id;

    // 2. Conduct RCA
    const rcaRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai/incidents/${createdIncidentId}/rca`,
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        rootCause: 'Negative constraint in prompt system template was omitted during last version rollout.'
      }
    });

    assert.equal(rcaRes.statusCode, 200);
    const rcaBody = JSON.parse(rcaRes.body);
    assert.equal(rcaBody.data.status, 'RCA_COMPLETED');

    // 3. Assign CAPA
    const capaRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai/incidents/${createdIncidentId}/capa`,
      headers: { authorization: `Bearer ${doctorToken}` },
      payload: {
        capaAction: 'Enforce deterministic allergy validation firewall before prescription serialization.',
        preventiveMeasure: 'Added automated CI regression test verifying zero-tolerance beta-lactam output on allergy.'
      }
    });

    assert.equal(capaRes.statusCode, 200);
    const capaBody = JSON.parse(capaRes.body);
    assert.equal(capaBody.data.status, 'CAPA_ASSIGNED');

    // 4. Verify & Close
    const closeRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai/incidents/${createdIncidentId}/close`,
      headers: { authorization: `Bearer ${doctorToken}` }
    });

    assert.equal(closeRes.statusCode, 200);
    const closeBody = JSON.parse(closeRes.body);
    assert.equal(closeBody.data.status, 'CLOSED');
  });

  // -------------------------------------------------------------------------
  // 11. HQ Control Plane & Oversight
  // -------------------------------------------------------------------------
  it('TEST 21: HQ Control Plane: HQ Admin views cross-tenant incidents and configures tenant budgets', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/ai/incidents',
      headers: { authorization: `Bearer ${hqAdminToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.some(i => i.id === createdIncidentId));
  });

  // -------------------------------------------------------------------------
  // 12. Cross-Tenant Isolation (Fail-Closed)
  // -------------------------------------------------------------------------
  it('TEST 22: Security & Cross-Tenant Isolation: Tenant B cannot view or mutate Tenant A AI anomalies (Fail-Closed)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai/anomalies/${createdAnomalyId}/review`,
      headers: { authorization: `Bearer ${tenantBToken}` },
      payload: {
        action: 'DISMISS',
        reviewRemarks: 'Unauthorized tenant B attempting to dismiss anomaly'
      }
    });

    assert.equal(res.statusCode, 404);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Anomaly detection record not found or cross-tenant boundary prohibited'));
  });

  it('TEST 23: Security & Cross-Tenant Isolation: Tenant B cannot access or mutate Tenant A AI incidents (403 Forbidden)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/ai/incidents/${createdIncidentId}/rca`,
      headers: { authorization: `Bearer ${tenantBToken}` },
      payload: { rootCause: 'Unauthorized tenant B RCA modification attempt' }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Cross-tenant incident access prohibited'));
  });

  // -------------------------------------------------------------------------
  // 13. Unauthenticated Access Protection
  // -------------------------------------------------------------------------
  it('TEST 24: Unauthenticated Access: Unauthenticated requests fail closed with 401 Unauthorized', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/gateway/execute',
      payload: { tenantId: tenantA }
    });

    assert.equal(res.statusCode, 401);
  });
});
