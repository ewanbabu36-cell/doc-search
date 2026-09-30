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

test('PHASE 4 — Universal Healthcare Workflow Engine Automated & Adversarial Verification Suite', async (t) => {
  const app = await buildApp();
  await app.ready();

  t.after(async () => {
    sessionRevocationService.clearAll();
    await app.close();
  });

  const partnerA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const partnerB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const doctorTokenA = createToken({
    sub: 'doc-opd-a',
    email: 'dr.opd@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'OPD',
    roles: ['DOCTOR'],
    scope: 'tenant'
  });

  const labScientistTokenA = createToken({
    sub: 'lab-sci-a',
    email: 'pathologist@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-a',
    departmentId: 'LIMS',
    roles: ['PATHOLOGIST'],
    scope: 'tenant'
  });

  const branchBStaffTokenA = createToken({
    sub: 'staff-branch-b',
    email: 'nurse.b@partner-a.org',
    tenantId: partnerA,
    branchId: 'loc-branch-b',
    departmentId: 'OPD',
    roles: ['NURSE'],
    scope: 'branch'
  });

  const partnerBToken = createToken({
    sub: 'doc-partner-b',
    email: 'dr@partner-b.org',
    tenantId: partnerB,
    branchId: 'loc-branch-b',
    departmentId: 'OPD',
    roles: ['DOCTOR'],
    scope: 'tenant'
  });

  // -------------------------------------------------------------------------
  // 1. UNIVERSAL ENGINE ADAPTERS — ONE ENGINE FOR ALL 10 HEALTHCARE DEPARTMENTS
  // -------------------------------------------------------------------------
  await t.test('1. Universal Engine Architecture: 10 Healthcare Department Adapters powered by ONE engine', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/workflows/adapters',
      headers: { authorization: `Bearer ${doctorTokenA}` }
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.engine, 'UNIVERSAL_HEALTHCARE_WORKFLOW_ENGINE_V1');
    assert.equal(body.adapterCount, 10);
    const departments = body.data.map((d) => d.department).sort();
    assert.deepEqual(
      departments,
      [
        'BILLING',
        'BLOOD_BANK',
        'DIETARY',
        'IPD',
        'LIMS',
        'MRD',
        'OPD',
        'PHARMACY',
        'RADIOLOGY',
        'SUPPLY_CHAIN'
      ]
    );
  });

  // -------------------------------------------------------------------------
  // 2. WORKFLOW DEFINITION VERSIONING & RUNNING INSTANCE IMMUTABILITY
  // -------------------------------------------------------------------------
  await t.test('2. Definition Versioning: Running workflow instances remain bound to creation version when v2 is published', async () => {
    // Start instance on v1
    const startV1Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        workflowCodeOrDepartment: 'OPD',
        locationId: 'loc-branch-a',
        departmentId: 'OPD',
        patientId: 'PAT-V1-001',
        encounterId: 'ENC-V1-001',
        priority: 'ROUTINE'
      }
    });
    assert.equal(startV1Res.statusCode, 201);
    const instV1 = startV1Res.json().data.instance;
    assert.equal(instV1.workflowVersion, 1);

    // Publish v2 for OPD
    const pubRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/definitions/publish-version',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        codeOrDepartment: 'OPD',
        newStages: [
          'Appointment',
          'Check-In',
          'Token',
          'AI Triage',
          'Vitals',
          'Doctor Queue',
          'Consultation',
          'Closure'
        ]
      }
    });
    assert.equal(pubRes.statusCode, 201);
    assert.equal(pubRes.json().data.version, 2);

    // Start new instance -> should bind to v2
    const startV2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        workflowCodeOrDepartment: 'OPD',
        locationId: 'loc-branch-a',
        departmentId: 'OPD',
        patientId: 'PAT-V2-001',
        encounterId: 'ENC-V2-001',
        priority: 'URGENT'
      }
    });
    assert.equal(startV2Res.statusCode, 201);
    const instV2 = startV2Res.json().data.instance;
    assert.equal(instV2.workflowVersion, 2);

    // Re-fetch instV1 -> must STILL be bound to v1!
    const getV1Res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/workflows/instances/${instV1.workflowInstanceId}`,
      headers: { authorization: `Bearer ${doctorTokenA}` }
    });
    assert.equal(getV1Res.statusCode, 200);
    assert.equal(getV1Res.json().data.workflowVersion, 1);
  });

  // -------------------------------------------------------------------------
  // 3. UNIVERSAL STATE MACHINE, ILLEGAL JUMP BLOCKING, & OPTIMISTIC CONCURRENCY
  // -------------------------------------------------------------------------
  await t.test('3. Universal State Machine: Enforces valid transitions, blocks illegal state jumps (409), and blocks stale versionLock (409)', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        workflowCodeOrDepartment: 'OPD',
        locationId: 'loc-branch-a',
        departmentId: 'OPD',
        patientId: 'PAT-SM-001',
        encounterId: 'ENC-SM-001',
        priority: 'URGENT'
      }
    });
    assert.equal(createRes.statusCode, 201);
    const { instance, initialTask } = createRes.json().data;
    assert.equal(initialTask.state, 'QUEUED');

    // Attempt illegal jump: CLOSE directly from QUEUED -> must fail 409
    const illegalClose = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        transitionCode: 'CLOSE'
      }
    });
    assert.equal(illegalClose.statusCode, 409);

    // Valid transition: START (QUEUED -> IN_PROGRESS)
    const startRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        transitionCode: 'START',
        expectedVersionLock: initialTask.versionLock
      }
    });
    assert.equal(startRes.statusCode, 200);
    assert.equal(startRes.json().data.task.state, 'IN_PROGRESS');
    assert.equal(startRes.json().data.task.versionLock, 2);

    // Attempt transition with stale versionLock (1 instead of 2) -> must fail 409
    const staleRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        transitionCode: 'COMPLETE',
        expectedVersionLock: 1
      }
    });
    assert.equal(staleRes.statusCode, 409);

    // Attempt HOLD without reason -> must fail 400
    const holdNoReason = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        transitionCode: 'HOLD'
      }
    });
    assert.equal(holdNoReason.statusCode, 400);

    // Valid HOLD with reason -> ON_HOLD & SLA PAUSED
    const holdRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        transitionCode: 'HOLD',
        reason: 'Waiting for prior cardiac ECG trace'
      }
    });
    assert.equal(holdRes.statusCode, 200);
    assert.equal(holdRes.json().data.task.state, 'ON_HOLD');
    assert.equal(holdRes.json().data.task.sla.status, 'PAUSED');

    // Valid RESUME -> IN_PROGRESS & SLA ON_TRACK
    const resumeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        transitionCode: 'RESUME',
        reason: 'ECG trace received'
      }
    });
    assert.equal(resumeRes.statusCode, 200);
    assert.equal(resumeRes.json().data.task.state, 'IN_PROGRESS');
    assert.equal(resumeRes.json().data.task.sla.status, 'ON_TRACK');

    // Valid COMPLETE -> VERIFY -> CLOSE -> REOPEN -> COMPLETE -> VERIFY -> CLOSE
    const completeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { transitionCode: 'COMPLETE' }
    });
    assert.equal(completeRes.statusCode, 200);
    assert.equal(completeRes.json().data.task.state, 'COMPLETED');

    const verifyRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { transitionCode: 'VERIFY' }
    });
    assert.equal(verifyRes.statusCode, 200);
    assert.equal(verifyRes.json().data.task.state, 'VERIFIED');

    const closeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: { transitionCode: 'CLOSE' }
    });
    assert.equal(closeRes.statusCode, 200);
    assert.equal(closeRes.json().data.task.state, 'CLOSED');
    assert.equal(closeRes.json().data.instance.currentState, 'CLOSED');

    // Reopen closed workflow with reason
    const reopenRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        transitionCode: 'REOPEN',
        reason: 'Addendum clinical note required'
      }
    });
    assert.equal(reopenRes.statusCode, 200);
    assert.equal(reopenRes.json().data.task.state, 'REOPENED');
    assert.ok(instance.workflowInstanceId);
  });

  // -------------------------------------------------------------------------
  // 4. PHASE 3 RBAC/ABAC + TENANT / LOCATION / STAFF / CREDENTIAL ENFORCEMENT
  // -------------------------------------------------------------------------
  await t.test('4. Security & ABAC Enforcement: Blocks cross-tenant, cross-location, inactive staff assignment, and expired credential verification', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: { authorization: `Bearer ${labScientistTokenA}` },
      payload: {
        workflowCodeOrDepartment: 'LIMS',
        locationId: 'loc-branch-a',
        departmentId: 'LIMS',
        patientId: 'PAT-SEC-001',
        encounterId: 'ENC-SEC-001',
        priority: 'STAT'
      }
    });
    assert.equal(createRes.statusCode, 201);
    const { instance, initialTask } = createRes.json().data;

    // 4a. Cross-partner access blocked (403)
    const crossTenantGet = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/workflows/instances/${instance.workflowInstanceId}`,
      headers: { authorization: `Bearer ${partnerBToken}` }
    });
    assert.equal(crossTenantGet.statusCode, 403);

    // 4b. Cross-location access by branch-scoped user in loc-branch-b blocked (403)
    const crossLocationTransition = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/transition`,
      headers: { authorization: `Bearer ${branchBStaffTokenA}` },
      payload: { transitionCode: 'START' }
    });
    assert.equal(crossLocationTransition.statusCode, 403);

    // 4c. Assign task to SUSPENDED staff -> must be rejected (403)
    const assignSuspendedRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/assign`,
      headers: { authorization: `Bearer ${labScientistTokenA}` },
      payload: {
        newAssignee: 'staff-suspended-01',
        assigneeStaffStatus: 'SUSPENDED',
        reason: 'Attempt assignment to suspended technician'
      }
    });
    assert.equal(assignSuspendedRes.statusCode, 403);

    // 4d. Assign task to staff with EXPIRED credential -> must be rejected (403)
    const assignExpiredCredRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/assign`,
      headers: { authorization: `Bearer ${labScientistTokenA}` },
      payload: {
        newAssignee: 'pathologist-expired-01',
        assigneeStaffStatus: 'ACTIVE',
        assigneeCredentialStatus: 'EXPIRED',
        requireValidCredential: true,
        reason: 'Attempt assignment to pathologist with expired license'
      }
    });
    assert.equal(assignExpiredCredRes.statusCode, 403);

    // 4e. Assign task to eligible ACTIVE staff with VALID credential -> 200 OK
    const assignValidRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${initialTask.taskId}/assign`,
      headers: { authorization: `Bearer ${labScientistTokenA}` },
      payload: {
        newAssignee: 'lab-sci-a',
        assigneePartnerId: partnerA,
        assigneeLocationId: 'loc-branch-a',
        assigneeDepartmentId: 'LIMS',
        assigneeStaffStatus: 'ACTIVE',
        assigneeCredentialStatus: 'VALID',
        requireValidCredential: true,
        reason: 'Assign STAT sample validation to active pathologist'
      }
    });
    assert.equal(assignValidRes.statusCode, 200);
    assert.equal(assignValidRes.json().data.assignedTo, 'lab-sci-a');
    assert.equal(assignValidRes.json().data.state, 'ASSIGNED');
  });

  // -------------------------------------------------------------------------
  // 5. UNIVERSAL QUEUE ORDERING, PRIORITY OVERRIDE & SLA / ESCALATION ENGINE
  // -------------------------------------------------------------------------
  await t.test('5. Queue Engine, Priority Override & SLA Engine: Sorts CRITICAL > STAT > ROUTINE, escalates on SLA warning/breach, and blocks client clock tampering', async () => {
    // Create ROUTINE task and CRITICAL task in RADIOLOGY
    const routineWf = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        workflowCodeOrDepartment: 'RADIOLOGY',
        locationId: 'loc-branch-a',
        departmentId: 'RADIOLOGY',
        patientId: 'PAT-RAD-ROUTINE',
        encounterId: 'ENC-RAD-01',
        priority: 'ROUTINE'
      }
    });
    const routineTask = routineWf.json().data.initialTask;

    const criticalWf = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        workflowCodeOrDepartment: 'RADIOLOGY',
        locationId: 'loc-branch-a',
        departmentId: 'RADIOLOGY',
        patientId: 'PAT-RAD-CRITICAL',
        encounterId: 'ENC-RAD-02',
        priority: 'CRITICAL'
      }
    });
    const criticalTask = criticalWf.json().data.initialTask;

    // Query RADIOLOGY queue -> CRITICAL task must appear before ROUTINE task
    const queueRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/workflows/queues?departmentId=RADIOLOGY&locationId=loc-branch-a',
      headers: { authorization: `Bearer ${doctorTokenA}` }
    });
    assert.equal(queueRes.statusCode, 200);
    const queueItems = queueRes.json().data;
    const criticalIdx = queueItems.findIndex((x) => x.taskId === criticalTask.taskId);
    const routineIdx = queueItems.findIndex((x) => x.taskId === routineTask.taskId);
    assert.ok(criticalIdx !== -1 && routineIdx !== -1);
    assert.ok(criticalIdx < routineIdx, 'CRITICAL priority task must be ordered ahead of ROUTINE task');

    // Elevate ROUTINE task priority to EMERGENCY
    const prioRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/workflows/tasks/${routineTask.taskId}/priority`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        priority: 'EMERGENCY',
        reason: 'Suspected acute intracranial hemorrhage on triage'
      }
    });
    assert.equal(prioRes.statusCode, 200);
    assert.equal(prioRes.json().data.priority, 'EMERGENCY');

    // Attempt client-side SLA clock manipulation -> must fail 403
    const tamperRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${routineTask.taskId}/sla-evaluate`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        clientSuppliedTimestamp: '2099-01-01T00:00:00.000Z'
      }
    });
    assert.equal(tamperRes.statusCode, 403);

    // Simulate SLA Breach -> must mark SLA BREACHED and auto-escalate to DEPARTMENT_HEAD
    const breachRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/tasks/${routineTask.taskId}/sla-evaluate`,
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        simulatedElapsedMinutes: 120
      }
    });
    assert.equal(breachRes.statusCode, 200);
    assert.equal(breachRes.json().data.slaStatus, 'BREACHED');
    assert.equal(breachRes.json().data.escalation.toTier, 'DEPARTMENT_HEAD');
    assert.equal(breachRes.json().data.task.queueType, 'ESCALATION');
  });

  // -------------------------------------------------------------------------
  // 6. EXCEPTION ENGINE & RESOLUTION LIFECYCLE
  // -------------------------------------------------------------------------
  await t.test('6. Exception Engine: Records sample rejection exception, routes to EXCEPTION queue, and resolves back to IN_PROGRESS', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: { authorization: `Bearer ${labScientistTokenA}` },
      payload: {
        workflowCodeOrDepartment: 'LIMS',
        locationId: 'loc-branch-a',
        departmentId: 'LIMS',
        patientId: 'PAT-EXC-001',
        encounterId: 'ENC-EXC-001',
        priority: 'URGENT'
      }
    });
    const { instance, initialTask } = createRes.json().data;

    const excRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/exceptions',
      headers: { authorization: `Bearer ${labScientistTokenA}` },
      payload: {
        workflowInstanceId: instance.workflowInstanceId,
        taskId: initialTask.taskId,
        type: 'SAMPLE_REJECTED',
        severity: 'HIGH',
        reason: 'Hemolyzed vacutainer specimen — recollection required'
      }
    });
    assert.equal(excRes.statusCode, 201);
    const exceptionId = excRes.json().data.exceptionId;

    // Verify task is in EXCEPTION queue
    const excQueueRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/workflows/queues?queueType=EXCEPTION&departmentId=LIMS&locationId=loc-branch-a',
      headers: { authorization: `Bearer ${labScientistTokenA}` }
    });
    assert.equal(excQueueRes.statusCode, 200);
    assert.ok(excQueueRes.json().data.some((t) => t.taskId === initialTask.taskId));

    // Resolve exception
    const resolveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/exceptions/${exceptionId}/resolve`,
      headers: { authorization: `Bearer ${labScientistTokenA}` },
      payload: {
        resolution: 'Fresh venous sample collected and accessioned'
      }
    });
    assert.equal(resolveRes.statusCode, 200);
    assert.equal(resolveRes.json().data.status, 'RESOLVED');
  });

  // -------------------------------------------------------------------------
  // 7. CROSS-DEPARTMENT HANDOFF CONTINUITY (OPD -> LIMS -> PHARMACY -> BILLING)
  // -------------------------------------------------------------------------
  await t.test('7. Cross-Department Handoffs: Preserves Patient -> Encounter -> Order continuity across OPD -> LIMS -> PHARMACY -> BILLING', async () => {
    const patientId = 'PAT-CONTINUITY-777';
    const encounterId = 'ENC-CONTINUITY-777';
    const orderId = 'ORD-CONTINUITY-777';

    const opdStart = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        workflowCodeOrDepartment: 'OPD',
        locationId: 'loc-branch-a',
        departmentId: 'OPD',
        patientId,
        encounterId,
        orderId,
        priority: 'URGENT'
      }
    });
    assert.equal(opdStart.statusCode, 201);
    const opdWfId = opdStart.json().data.instance.workflowInstanceId;

    // Request handoff OPD -> LIMS
    const handoffReq = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/handoffs',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        sourceWorkflowId: opdWfId,
        destinationDepartment: 'LIMS',
        orderId,
        reason: 'Complete Blood Count + Troponin-I panel ordered from OPD consultation'
      }
    });
    assert.equal(handoffReq.statusCode, 201);
    const handoffId = handoffReq.json().data.handoffId;

    // Accept handoff in LIMS -> automatically spawns linked LIMS workflow + task with identical patientId, encounterId, orderId
    const acceptRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/handoffs/${handoffId}/respond`,
      headers: { authorization: `Bearer ${labScientistTokenA}` },
      payload: {
        action: 'ACCEPT',
        reason: 'Specimen received at central laboratory'
      }
    });
    assert.equal(acceptRes.statusCode, 200);
    const { handoff, destinationWorkflow, destinationTask } = acceptRes.json().data;
    assert.equal(handoff.status, 'HANDOFF_ACCEPTED');
    assert.equal(destinationWorkflow.patientId, patientId);
    assert.equal(destinationWorkflow.encounterId, encounterId);
    assert.equal(destinationWorkflow.orderId, orderId);
    assert.equal(destinationWorkflow.departmentId, 'LIMS');
    assert.ok(destinationTask.taskId);
  });

  // -------------------------------------------------------------------------
  // 8. IDEMPOTENCY DEDUPLICATION & MULTI-DEPARTMENT SAGA COMPENSATION + RECOVERY
  // -------------------------------------------------------------------------
  await t.test('8. Idempotency & Saga Orchestrator: Deduplicates replays, compensates prior steps on mid-saga failure, and recovers cleanly', async () => {
    const idemKey = 'idem-wf-phase4-001';
    const firstCall = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: {
        authorization: `Bearer ${doctorTokenA}`,
        'idempotency-key': idemKey
      },
      payload: {
        workflowCodeOrDepartment: 'PHARMACY',
        locationId: 'loc-branch-a',
        departmentId: 'PHARMACY',
        patientId: 'PAT-IDEM-01',
        encounterId: 'ENC-IDEM-01'
      }
    });
    const secondCall = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/instances',
      headers: {
        authorization: `Bearer ${doctorTokenA}`,
        'idempotency-key': idemKey
      },
      payload: {
        workflowCodeOrDepartment: 'PHARMACY',
        locationId: 'loc-branch-a',
        departmentId: 'PHARMACY',
        patientId: 'PAT-IDEM-01',
        encounterId: 'ENC-IDEM-01'
      }
    });
    assert.equal(
      firstCall.json().data.instance.workflowInstanceId,
      secondCall.json().data.instance.workflowInstanceId,
      'Idempotent replay must return identical workflowInstanceId without duplicate creation'
    );

    // Execute Cross-Department Saga where step 3 (PHARMACY) fails -> steps 1 (OPD) & 2 (LIMS) must be COMPENSATED
    const sagaRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/workflows/sagas/execute',
      headers: { authorization: `Bearer ${doctorTokenA}` },
      payload: {
        patientId: 'PAT-SAGA-001',
        encounterId: 'ENC-SAGA-001',
        orderId: 'ORD-SAGA-001',
        locationId: 'loc-branch-a',
        steps: [
          {
            stepCode: 'OPD_ORDER_CREATE',
            department: 'OPD',
            description: 'Create consultation order bundle',
            compensationAction: 'REVERT_OPD_ORDER_BUNDLE'
          },
          {
            stepCode: 'LIMS_ACCESSION_RESERVE',
            department: 'LIMS',
            description: 'Reserve lab container & barcode',
            compensationAction: 'RELEASE_LAB_CONTAINER'
          },
          {
            stepCode: 'PHARMACY_STOCK_LOCK',
            department: 'PHARMACY',
            description: 'Lock cold-chain biologic batch',
            compensationAction: 'UNLOCK_PHARMACY_BATCH',
            simulateFailure: true
          },
          {
            stepCode: 'BILLING_CHARGE_POST',
            department: 'BILLING',
            description: 'Post consolidated encounter charges',
            compensationAction: 'VOID_POSTED_CHARGES'
          }
        ]
      }
    });
    assert.equal(sagaRes.statusCode, 200);
    const saga = sagaRes.json().data;
    assert.equal(saga.status, 'COMPENSATED');
    assert.equal(saga.steps[0].status, 'COMPENSATED');
    assert.equal(saga.steps[1].status, 'COMPENSATED');
    assert.equal(saga.steps[2].status, 'FAILED');
    assert.equal(saga.steps[3].status, 'PENDING');

    // Recover and reconcile failed saga
    const recoverRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/workflows/sagas/${saga.sagaId}/recover`,
      headers: { authorization: `Bearer ${doctorTokenA}` }
    });
    assert.equal(recoverRes.statusCode, 200);
    const recoveredSaga = recoverRes.json().data;
    assert.equal(recoveredSaga.status, 'RECOVERED');
    assert.ok(
      recoveredSaga.steps.every((s) => s.status === 'RECOVERED' || s.status === 'COMPLETED')
    );

    // Verify immutable audit trail captures the full saga compensation & recovery history
    const auditRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/workflows/audit?workflowInstanceId=${saga.workflowInstanceId}`,
      headers: { authorization: `Bearer ${doctorTokenA}` }
    });
    assert.equal(auditRes.statusCode, 200);
    const actions = auditRes.json().data.map((a) => a.what);
    assert.ok(actions.includes('SAGA_FAILED_AND_COMPENSATED'));
    assert.ok(actions.includes('SAGA_RECOVERED_AND_RECONCILED'));
  });
});
