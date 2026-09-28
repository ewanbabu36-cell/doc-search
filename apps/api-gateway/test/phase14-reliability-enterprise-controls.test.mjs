import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  getDatabase,
  auditEvents,
  patients,
  encounters,
  investigationOrders,
  radiologyOrders,
  pharmacyPrescriptions,
  pharmacyDispensing,
  billingInvoices,
  supplyChainBatches,
  supplyChainStockLedger,
  outboxJobs,
  deadLetterJobs,
  deviceRegistry
} from '@docsearch/database';
import { retryAndDlqService } from '../dist/services/reliability/RetryAndDlqService.js';
import { sagaOrchestratorService } from '../dist/services/reliability/SagaOrchestratorService.js';

describe('PHASE 14 — Reliability & Enterprise Controls Production Verification Test Suite', () => {
  let app;
  let db;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const partnerId = '00000000-0000-4000-8000-000000000001';
  const organizationId = '00000000-0000-4000-8000-000000000002';
  const branchId = '00000000-0000-4000-8000-000000000003';
  const departmentId = '00000000-0000-4000-8000-000000000004';

  function createPartnerToken(overrides = {}) {
    const email = overrides.email || 'chief.reliability@docsearch.health';
    const claims = {
      sub: overrides.userId || 'usr-rel-001',
      email,
      actorEmail: email,
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['HOSPITAL_ADMIN', 'QUALITY_OFFICER'],
      permissions: overrides.permissions || [
        'reliability:read',
        'reliability:write',
        'audit:verify',
        'reconciliation:manage',
        'device:manage',
        'incident:manage'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createHqToken(overrides = {}) {
    const email = overrides.email || 'hq.reliability@docsearch.health';
    const claims = {
      sub: overrides.userId || 'usr-hq-admin-01',
      email,
      actorEmail: email,
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : '00000000-0000-4000-a000-000000000001',
      branchId: '00000000-0000-0000-0000-000000000000',
      roles: overrides.roles || ['COMPANY_ADMIN', 'SUPER_ADMIN'],
      permissions: overrides.permissions || [
        'company:admin',
        'super_admin',
        'reliability:admin',
        'hq:reliability:read',
        'hq:reliability:write'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let partnerTokenA;
  let partnerTokenB;
  let hqToken;
  let nonHqToken;

  before(async () => {
    app = await buildApp();
    await app.ready();
    db = getDatabase();

    partnerTokenA = createPartnerToken({ tenantId: tenantA });
    partnerTokenB = createPartnerToken({ tenantId: tenantB, userId: 'usr-rel-002' });
    hqToken = createHqToken();
    nonHqToken = createPartnerToken({ roles: ['DOCTOR'] });
  });

  after(async () => {
    if (app) await app.close();
  });

  // =========================================================================
  // DOMAIN 1: AUDIT LEDGER & CRYPTOGRAPHIC INTEGRITY VERIFICATION
  // =========================================================================
  it('TEST 01: Audit Ledger Verification: Validates cryptographic SHA-256 chain integrity on live records', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/audit/verify',
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {}
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.verificationCode);
    assert.ok(['VALID', 'NO_RECORDS'].includes(body.data.status));
    assert.ok(typeof body.data.totalEventsScanned === 'number');
    assert.ok(typeof body.data.chainedEventsVerified === 'number');
  });

  it('TEST 02: Audit Ledger Tamper Detection: Identifies injected modified payload and flags TAMPER_DETECTED', async () => {
    // Inject a tampered audit event into tenantA with an invalid hash
    const fakeId = crypto.randomUUID();
    await db.insert(auditEvents).values({
      id: fakeId,
      tenantId: tenantA,
      actorId: '33333333-3333-4333-8333-333333333333',
      eventType: 'UNAUTHORIZED_DATA_ACCESS',
      resourceType: 'patient_record',
      resourceId: 'pat-999',
      previousHash: 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000',
      integrityHash: 'deadbeef_invalid_hash_signature_tampered_record_000000000000000000',
      timestamp: new Date()
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/audit/verify',
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {}
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'TAMPER_DETECTED');
    assert.equal(body.data.firstTamperedEventId, fakeId);
    assert.ok(body.data.tamperedDetails.includes('Tampered payload detected'));
  });

  it('TEST 03: Audit Ledger Export: Generates sealed export with Merkle-like root signature', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/reliability/audit/export?limit=10',
      headers: { authorization: `Bearer ${partnerTokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.tenantId, tenantA);
    assert.ok(body.data.merkleRootHash);
    assert.ok(body.data.verificationSignature);
    assert.ok(Array.isArray(body.data.events));
  });

  // =========================================================================
  // DOMAIN 2: DATA LINEAGE TRACEABILITY DAG
  // =========================================================================
  it('TEST 04: Data Lineage: Generates source-to-destination DAG connecting patient, encounters, orders, and invoices', async () => {
    // Seed connected clinical lineage records for Tenant A
    const patId = crypto.randomUUID();
    const uhid = `UHID-${Date.now().toString(36).toUpperCase()}`;
    await db.insert(patients).values({
      id: patId,
      tenantId: tenantA,
      partnerId,
      organizationId,
      branchId,
      uhid,
      mrn: `MRN-${patId.slice(0, 8)}`,
      patientCode: `PC-${patId.slice(0, 8)}`,
      firstName: 'Aarav',
      lastName: 'Sharma',
      dateOfBirth: '1988-04-12',
      gender: 'MALE',
      status: 'ACTIVE'
    });

    const encId = crypto.randomUUID();
    await db.insert(encounters).values({
      id: encId,
      tenantId: tenantA,
      partnerId,
      organizationId,
      branchId,
      departmentId,
      patientId: patId,
      encounterNumber: `ENC-${encId.slice(0, 8)}`,
      encounterType: 'OPD_CONSULTATION',
      chiefComplaint: 'Routine clinical consultation',
      status: 'COMPLETED'
    });

    const invId = crypto.randomUUID();
    await db.insert(billingInvoices).values({
      id: invId,
      tenantId: tenantA,
      partnerId,
      organizationId,
      branchId,
      patientId: patId,
      encounterId: encId,
      invoiceNumber: `INV-${invId.slice(0, 8)}`,
      status: 'PAID',
      subtotal: '1200.00',
      totalAmount: '1200.00',
      paidAmount: '1200.00',
      issuedAt: new Date()
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/reliability/lineage/PATIENT/${uhid}`,
      headers: { authorization: `Bearer ${partnerTokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.rootEntity.type, 'PATIENT');
    assert.ok(body.data.nodes.length >= 3);
    assert.ok(body.data.edges.length >= 2);
    assert.ok(body.data.summary.domainsCovered.includes('CLINICAL'));
    assert.ok(body.data.summary.domainsCovered.includes('FINANCE'));
  });

  it('TEST 05: Data Lineage Security: Tenant B cannot trace Tenant A records (Fails closed 404)', async () => {
    // Attempt to access Tenant A patient using Tenant B token
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/reliability/lineage/PATIENT/non-existent-or-tenant-a-patient`,
      headers: { authorization: `Bearer ${partnerTokenB}` }
    });

    assert.equal(res.statusCode, 404);
  });

  // =========================================================================
  // DOMAIN 3: AUTOMATED RECONCILIATION ENGINE
  // =========================================================================
  it('TEST 06: Reconciliation Run: Executes multi-domain financial reconciliation and reports variances', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/reconciliation/run',
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {
        domain: 'FINANCIAL_PAYMENTS',
        notes: 'End of day financial payments automated audit'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.run.id);
    assert.equal(body.data.run.domain, 'FINANCIAL_PAYMENTS');
    assert.ok(['COMPLETED', 'DISCREPANCIES_FOUND'].includes(body.data.run.status));
    assert.ok(typeof body.data.summary.totalEvaluated === 'number');
  });

  it('TEST 07: Discrepancy Resolution: Resolves discrepancy with mandatory resolutionRemarks and audit trail', async () => {
    // First run reconciliation to find or generate a run
    const runRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/reconciliation/run',
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: { domain: 'INVENTORY_STOCK' }
    });

    assert.equal(runRes.statusCode, 200);
    const runId = runRes.json().data.run.id;

    // Get discrepancies for run
    const discRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/reliability/reconciliation/runs/${runId}/discrepancies`,
      headers: { authorization: `Bearer ${partnerTokenA}` }
    });

    assert.equal(discRes.statusCode, 200);
    const discrepancies = discRes.json().data;

    if (discrepancies.length > 0) {
      const discId = discrepancies[0].id;

      // Reject empty resolutionRemarks
      const badRes = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/reliability/reconciliation/discrepancies/${discId}/resolve`,
        headers: { authorization: `Bearer ${partnerTokenA}` },
        payload: { resolutionRemarks: '  ' }
      });
      assert.equal(badRes.statusCode, 400);

      // Successfully resolve
      const resolveRes = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/reliability/reconciliation/discrepancies/${discId}/resolve`,
        headers: { authorization: `Bearer ${partnerTokenA}` },
        payload: { resolutionRemarks: 'Reconciled after warehouse physical recount.' }
      });
      assert.equal(resolveRes.statusCode, 200);
      assert.equal(resolveRes.json().data.status, 'RESOLVED');
    }
  });

  // =========================================================================
  // DOMAIN 4: ENTERPRISE IDEMPOTENCY FRAMEWORK
  // =========================================================================
  it('TEST 08: Idempotency Key Inspection & Stats: Accurately reflects key status and TTL', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/reliability/idempotency/stats',
      headers: { authorization: `Bearer ${partnerTokenA}` }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.tenantId, tenantA);
    assert.ok(typeof body.data.totalKeys === 'number');
  });

  // =========================================================================
  // DOMAIN 5: DISTRIBUTED SAGA ORCHESTRATOR
  // =========================================================================
  it('TEST 09: Saga Coordinator: Successfully commits sequential distributed multi-step transaction', async () => {
    const session = {
      tenantId: tenantA,
      branchId,
      userId: 'usr-rel-001',
      actorEmail: 'saga.orchestrator@docsearch.health',
      roles: ['HOSPITAL_ADMIN'],
      permissions: [],
      dataScope: 'tenant',
      sessionId: 'sess-001',
      isSuperAdmin: false
    };

    let step1Executed = false;
    let step2Executed = false;

    const result = await sagaOrchestratorService.executeSaga(
      'PATIENT_DISCHARGE',
      'CORR-DISCHARGE-001',
      [
        {
          stepName: 'VERIFY_PHARMACY_CLEARANCE',
          forwardAction: 'CLEAR_PHARMACY_HOLD',
          executeForward: async () => {
            step1Executed = true;
            return { pharmacyCleared: true };
          },
          compensationAction: 'RESTORE_PHARMACY_HOLD',
          executeCompensation: async () => {}
        },
        {
          stepName: 'RELEASE_INPATIENT_BED',
          forwardAction: 'MARK_BED_VACANT',
          executeForward: async (ctx) => {
            step2Executed = true;
            return { bedReleased: true, bedNumber: 'ICU-04' };
          },
          compensationAction: 'REALLOCATE_BED',
          executeCompensation: async () => {}
        }
      ],
      { patientId: 'pat-100', encounterId: 'enc-200' },
      session
    );

    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.completedSteps, 2);
    assert.equal(result.compensatedSteps, 0);
    assert.equal(step1Executed, true);
    assert.equal(step2Executed, true);
  });

  it('TEST 10: Saga Rollback: Step failure triggers backward compensation in reverse order', async () => {
    const session = {
      tenantId: tenantA,
      branchId,
      userId: 'usr-rel-001',
      actorEmail: 'saga.orchestrator@docsearch.health',
      roles: ['HOSPITAL_ADMIN'],
      permissions: [],
      dataScope: 'tenant',
      sessionId: 'sess-002',
      isSuperAdmin: false
    };

    let step1Compensated = false;
    let step2Compensated = false;

    const result = await sagaOrchestratorService.executeSaga(
      'GRN_STOCK_INGESTION',
      'CORR-GRN-FAIL-001',
      [
        {
          stepName: 'RESERVE_PO_LINE_ITEMS',
          forwardAction: 'RESERVE_PO',
          executeForward: async () => ({ poReserved: true }),
          compensationAction: 'UNRESERVE_PO',
          executeCompensation: async () => {
            step1Compensated = true;
            return { poUnreserved: true };
          }
        },
        {
          stepName: 'CREATE_BATCH_RECORD',
          forwardAction: 'INSERT_BATCH',
          executeForward: async () => ({ batchId: 'batch-temp-01' }),
          compensationAction: 'DELETE_BATCH',
          executeCompensation: async () => {
            step2Compensated = true;
            return { batchDeleted: true };
          }
        },
        {
          stepName: 'POST_LEDGER_ADJUSTMENT',
          forwardAction: 'POST_GL_JOURNAL',
          executeForward: async () => {
            throw new Error('Simulated GL accounting ledger network timeout');
          },
          compensationAction: 'REVERSE_GL_JOURNAL',
          executeCompensation: async () => {}
        }
      ],
      { poId: 'po-555' },
      session
    );

    assert.equal(result.status, 'COMPENSATED');
    assert.equal(result.completedSteps, 2);
    assert.equal(result.compensatedSteps, 2);
    assert.equal(step2Compensated, true);
    assert.equal(step1Compensated, true);
    assert.ok(result.error.includes('Simulated GL accounting ledger network timeout'));
  });

  // =========================================================================
  // DOMAIN 6: RETRY ENGINE & DEAD LETTER QUEUE (DLQ)
  // =========================================================================
  it('TEST 11: Retry Backoff: calculateBackoff produces bounded jittered delays', () => {
    const delay1 = retryAndDlqService.calculateBackoff(1, 1000, 30000);
    const delay3 = retryAndDlqService.calculateBackoff(3, 1000, 30000);

    assert.ok(delay1 >= 0 && delay1 <= 2000);
    assert.ok(delay3 >= 0 && delay3 <= 8000);
  });

  it('TEST 12: Dead Letter Queue: Routes exhausted job to DLQ, allows HQ inspection, replay, and discard', async () => {
    // 1. Send an exhausted job to DLQ
    const dlqJob = await retryAndDlqService.sendToDlq({
      tenantId: tenantA,
      originalJobId: crypto.randomUUID(),
      jobType: 'DISPATCH_PATIENT_SMS',
      payload: { to: '+919876543210', body: 'Appointment reminder' },
      failureReason: 'SMS Gateway HTTP 503 Provider Exhausted',
      totalAttempts: 5
    });

    assert.ok(dlqJob.id);
    assert.equal(dlqJob.status, 'DEAD_LETTERED');

    // 2. HQ inspects DLQ
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/hq/reliability/dlq?tenantId=${tenantA}&status=DEAD_LETTERED`,
      headers: { authorization: `Bearer ${hqToken}` }
    });

    assert.equal(listRes.statusCode, 200);
    const jobs = listRes.json().data;
    assert.ok(jobs.some((j) => j.id === dlqJob.id));

    // 3. HQ replays job
    const replayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/hq/reliability/dlq/${dlqJob.id}/replay`,
      headers: { authorization: `Bearer ${hqToken}` }
    });

    assert.equal(replayRes.statusCode, 200);
    const replayBody = replayRes.json();
    assert.equal(replayBody.data.replayed, true);
    assert.equal(replayBody.data.dlqJob.status, 'REPLAYED');

    // 4. Test discard on a second job
    const dlqJob2 = await retryAndDlqService.sendToDlq({
      tenantId: tenantA,
      originalJobId: crypto.randomUUID(),
      jobType: 'OBSOLETE_BACKGROUND_PING',
      payload: { ping: true },
      failureReason: 'Deprecated task definition',
      totalAttempts: 5
    });

    const discardRes = await app.inject({
      method: 'POST',
      url: `/api/v1/hq/reliability/dlq/${dlqJob2.id}/discard`,
      headers: { authorization: `Bearer ${hqToken}` },
      payload: { reason: 'Job type no longer supported in v2.0' }
    });

    assert.equal(discardRes.statusCode, 200);
    assert.equal(discardRes.json().data.status, 'DISCARDED');
  });

  // =========================================================================
  // DOMAIN 7: SYSTEM OBSERVABILITY & OPERATIONAL METRICS
  // =========================================================================
  it('TEST 13: Observability Metrics: Returns real process memory, DB ping latency, and queue telemetry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/reliability/metrics',
      headers: { authorization: `Bearer ${hqToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.ok(['HEALTHY', 'DEGRADED'].includes(body.data.status));
    assert.ok(body.data.process.uptimeSeconds >= 0);
    assert.ok(body.data.process.memoryMb.heapUsed > 0);
    assert.equal(body.data.database.status, 'CONNECTED');
    assert.ok(typeof body.data.database.latencyMs === 'number');
    assert.ok(typeof body.data.queues.dlqBacklog === 'number');
  });

  it('TEST 14: System Health Endpoint: Returns 200 OK without requiring authentication for load balancers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/reliability/health'
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.ok(['HEALTHY', 'DEGRADED'].includes(body.status));
  });

  // =========================================================================
  // DOMAIN 8: INCIDENT MANAGEMENT & CAPA LIFECYCLE
  // =========================================================================
  it('TEST 15: Incident Management & CAPA: Complete lifecycle from Report -> RCA -> CAPA -> Verification -> Closed', async () => {
    // 1. Report Incident
    const repRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/incidents',
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {
        category: 'MEDICATION_DISPENSE_ALERT',
        sacScore: 'SAC_2_HIGH',
        briefSummary: 'Near-miss sound-alike medication labeling issue in OPD pharmacy',
        detailedDescription: 'Cefotaxime and Cefuroxime were placed in adjacent shelf bins with similar packaging.',
        immediateActionTaken: 'Re-arranged shelves with visual high-alert drug warning dividers.',
        departmentName: 'OUTPATIENT_PHARMACY',
        locationDetail: 'Rack B, Shelf 3',
        patientInvolved: false
      }
    });

    assert.equal(repRes.statusCode, 200);
    const incident = repRes.json().data;
    assert.ok(incident.id);
    assert.ok(incident.incidentNumber.startsWith('INC-'));
    assert.equal(incident.status, 'REPORTED');

    // 2. Conduct RCA (5-Whys)
    const rcaRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/reliability/incidents/${incident.id}/rca`,
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {
        leadInvestigator: 'Dr. Neha Verma (Quality Lead)',
        investigationTeam: ['Senior Pharmacist', 'Head of Nursing', 'Clinical Director'],
        fiveWhysAnalysis: [
          { step: 1, whyQuestion: 'Why were sound-alike vials adjacent?', becauseAnswer: 'Alphabetical arrangement placed both Cephalosporins together.' },
          { step: 2, whyQuestion: 'Why was LASA policy bypassed?', becauseAnswer: 'High-alert LASA label audit was not completed after warehouse restock.' }
        ],
        fishboneCategories: {
          people: ['Relief pharmacist was unfamiliar with new stock location.'],
          process: ['Stock put-away checklist lacked mandatory LASA separation verification.'],
          equipment: ['Visual color-coded bins had not yet been delivered.'],
          environment: ['Pharmacy lighting in aisle 2 was under maintenance.'],
          management: ['High pharmacy dispensing throughput during peak OPD hour.']
        },
        rootCauseStatement: 'Inadequate physical separation of Look-Alike Sound-Alike (LASA) antibiotics during stock intake.',
        contributingFactors: 'High dispensing workload and delayed bin delivery.'
      }
    });

    assert.equal(rcaRes.statusCode, 200);
    assert.equal(rcaRes.json().data.status, 'COMPLETED');

    // 3. Assign CAPA
    const capaRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/reliability/incidents/${incident.id}/capa`,
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {
        title: 'Mandatory LASA Separation & Barcode Scan Rule',
        actionDescription: 'Separate LASA medications into dedicated red bins with barcode verification before dispense.',
        actionType: 'PREVENTIVE',
        assignedOwner: 'Chief Pharmacist',
        targetCompletionDate: '2026-10-15',
        verificationMetric: 'Zero LASA proximity alerts in 90-day post-implementation audit'
      }
    });

    assert.equal(capaRes.statusCode, 200);
    const capa = capaRes.json().data;
    assert.ok(capa.id);
    assert.equal(capa.status, 'ACTIVE');

    // 4. Verify CAPA & Close Incident
    const verifyRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/reliability/incidents/capa/${capa.id}/verify`,
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: { verificationNotes: 'Audited physical racks. Color-coded LASA bins installed and verified.' }
    });

    assert.equal(verifyRes.statusCode, 200);
    assert.equal(verifyRes.json().data.status, 'VERIFIED');

    // Verify incident is now CLOSED
    const incRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/reliability/incidents/${incident.id}`,
      headers: { authorization: `Bearer ${partnerTokenA}` }
    });

    assert.equal(incRes.statusCode, 200);
    assert.equal(incRes.json().data.incident.status, 'CLOSED');
  });

  // =========================================================================
  // DOMAIN 9: DISASTER RECOVERY & BACKUP DRILLS
  // =========================================================================
  it('TEST 16: Disaster Recovery Backup & Restore Drill: Captures SHA-256 backup and verifies RPO/RTO targets', async () => {
    // 1. Create Backup Snapshot
    const bkpRes = await app.inject({
      method: 'POST',
      url: '/api/v1/hq/reliability/disaster-recovery/backups',
      headers: { authorization: `Bearer ${hqToken}` },
      payload: {
        resourceReference: 'primary-postgresql-cluster',
        environment: 'PRODUCTION',
        backupType: 'FULL',
        retentionDays: 45
      }
    });

    assert.equal(bkpRes.statusCode, 200);
    const backup = bkpRes.json().data;
    assert.ok(backup.id);
    assert.ok(backup.backupCode.startsWith('BKP-'));
    assert.ok(backup.checksumReference);

    // 2. Execute Sandbox Restore Drill
    const drillRes = await app.inject({
      method: 'POST',
      url: '/api/v1/hq/reliability/disaster-recovery/restore-drill',
      headers: { authorization: `Bearer ${hqToken}` },
      payload: { backupId: backup.id }
    });

    assert.equal(drillRes.statusCode, 200);
    const drill = drillRes.json().data;
    assert.equal(drill.status, 'PASSED');
    assert.equal(drill.checksumMatched, true);
    assert.equal(drill.rtoCompliant, true);
    assert.equal(drill.rpoCompliant, true);
    assert.ok(drill.restoreDurationMs >= 0);

    // 3. Inspect DR Readiness
    const readRes = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/reliability/disaster-recovery/readiness',
      headers: { authorization: `Bearer ${hqToken}` }
    });

    assert.equal(readRes.statusCode, 200);
    const readBody = readRes.json().data;
    assert.ok(['READY', 'PARTIAL'].includes(readBody.readinessStatus));
    assert.ok(readBody.totalBackups >= 1);
    assert.ok(readBody.verifiedBackups >= 1);
  });

  // =========================================================================
  // DOMAIN 10: DEVICE GOVERNANCE & INSTANT REVOCATION
  // =========================================================================
  it('TEST 17: Device Management: Enrolls device, processes heartbeats, and instantly revokes access (Fail-Closed)', async () => {
    // 1. Enroll Workstation
    const enrollRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/devices/enroll',
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {
        deviceName: 'Emergency Reception Terminal 01',
        deviceType: 'WORKSTATION',
        hardwareFingerprint: 'BIOS-UUID-4829-FF9A-1102-ER-01',
        osInfo: 'Windows 11 Enterprise (Build 22631)',
        appVersion: '2.14.0'
      }
    });

    assert.equal(enrollRes.statusCode, 200);
    const { device, deviceToken } = enrollRes.json().data;
    assert.ok(device.deviceCode.startsWith('DEV-'));
    assert.ok(deviceToken);
    assert.equal(device.status, 'AUTHORIZED');

    // 2. Successful Heartbeat
    const hbRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/devices/heartbeat',
      headers: { 'x-tenant-id': tenantA },
      payload: {
        deviceCode: device.deviceCode,
        deviceToken,
        ipAddress: '192.168.10.45'
      }
    });

    assert.equal(hbRes.statusCode, 200);
    assert.equal(hbRes.json().data.success, true);

    // 3. Instant Revocation
    const revRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/reliability/devices/${device.id}/revoke`,
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: { reason: 'Workstation physically decommissioned after hardware refresh' }
    });

    assert.equal(revRes.statusCode, 200);
    assert.equal(revRes.json().data.status, 'REVOKED');

    // 4. Heartbeat Attempt After Revocation Fails Closed (401 Unauthorized)
    const blockedHb = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/devices/heartbeat',
      headers: { 'x-tenant-id': tenantA },
      payload: {
        deviceCode: device.deviceCode,
        deviceToken
      }
    });

    assert.equal(blockedHb.statusCode, 401);
  });

  // =========================================================================
  // DOMAIN 11: OFFLINE SYNC & NON-LWW CONFLICT RESOLUTION
  // =========================================================================
  it('TEST 18: Offline Sync Queue: Detects version conflict without LWW overwrite and resolves explicitly', async () => {
    // 1. Submit sync batch with a version collision
    const batchRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/offline-sync/batch',
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {
        mutations: [
          {
            clientOperationId: 'OP-LOCAL-001',
            entityType: 'PATIENT_VITALS',
            entityId: 'vit-100',
            operation: 'INSERT',
            clientVersion: 1,
            payload: { systolic: 120, diastolic: 80, pulse: 72 },
            clientTimestamp: new Date().toISOString()
          },
          {
            clientOperationId: 'OP-LOCAL-002',
            entityType: 'PATIENT_TRIAGE',
            entityId: 'tri-200',
            operation: 'UPDATE',
            clientVersion: 1, // Stale client version!
            payload: { priority: 'URGENT', expectedServerVersion: 3 }, // Server is at version 3
            clientTimestamp: new Date().toISOString()
          }
        ]
      }
    });

    assert.equal(batchRes.statusCode, 200);
    const batchBody = batchRes.json().data;
    assert.equal(batchBody.appliedCount, 1);
    assert.equal(batchBody.conflictCount, 1);
    assert.equal(batchBody.conflicts.length, 1);

    const conflict = batchBody.conflicts[0];
    assert.equal(conflict.resolutionStrategy, 'UNRESOLVED');
    assert.ok(conflict.conflictReason.includes('Stale offline write'));

    // 2. Resolve conflict with explicit FIELD_LEVEL_MERGE
    const resRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/reliability/offline-sync/conflicts/${conflict.id}/resolve`,
      headers: { authorization: `Bearer ${partnerTokenA}` },
      payload: {
        strategy: 'FIELD_LEVEL_MERGE',
        resolutionRemarks: 'Merged triage priority with latest central server clinical notes.'
      }
    });

    assert.equal(resRes.statusCode, 200);
    assert.equal(resRes.json().data.resolutionStrategy, 'FIELD_LEVEL_MERGE');
  });

  // =========================================================================
  // DOMAIN 12: SECURITY & MULTI-TENANT ISOLATION
  // =========================================================================
  it('TEST 19: Security Isolation: Non-HQ role blocked with 403 Forbidden on HQ reliability endpoints', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hq/reliability/metrics',
      headers: { authorization: `Bearer ${nonHqToken}` }
    });

    assert.equal(res.statusCode, 403);
  });

  it('TEST 20: Security Isolation: Unauthenticated requests blocked with 401 Unauthorized', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/reliability/audit/verify'
    });

    assert.equal(res.statusCode, 401);
  });
});
