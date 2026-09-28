import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AppError } from '@docsearch/shared-core';
import { authenticate } from '../../plugins/auth-guard.js';
import {
  universalHealthcareWorkflowEngineService,
  type TaskPriorityLevel,
  type QueueCategory,
  type AssignmentMode,
  type EscalationTriggerType,
  type EscalationTier,
  type WorkflowExceptionType
} from '../../services/workflow/UniversalHealthcareWorkflowEngineService.js';
import type {
  StaffLifecycleStatus,
  CredentialLifecycleStatus
} from '../../services/security/IdentitySecurityFoundationService.js';

function getSessionOrThrow(request: FastifyRequest) {
  if (!request.session) {
    throw AppError.unauthorized('Authentication required for Universal Healthcare Workflow Engine');
  }
  return request.session;
}

export async function universalWorkflowRoutes(app: FastifyInstance): Promise<void> {
  /**
   * 1. GET /api/v1/partner/workflows/adapters
   * Lists all 10 declarative Department Workflow Adapters mapped to the single Universal Engine.
   */
  app.get(
    '/api/v1/partner/workflows/adapters',
    { preHandler: [authenticate] },
    async (request, reply) => {
      getSessionOrThrow(request);
      const adapters = universalHealthcareWorkflowEngineService.getDepartmentAdapters();
      return reply.status(200).send({
        success: true,
        engine: 'UNIVERSAL_HEALTHCARE_WORKFLOW_ENGINE_V1',
        adapterCount: adapters.length,
        data: adapters
      });
    }
  );

  /**
   * 2. POST /api/v1/partner/workflows/definitions/publish-version
   * Publishes a new version of a workflow definition while preserving existing instances on their bound version.
   */
  app.post(
    '/api/v1/partner/workflows/definitions/publish-version',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const codeOrDepartment = String(
        body['codeOrDepartment'] ?? body['departmentKey'] ?? 'OPD'
      );
      const newStages = Array.isArray(body['newStages'] ?? body['customStepOrder'])
        ? ((body['newStages'] ?? body['customStepOrder']) as unknown[]).map((s) => String(s))
        : undefined;
      const slaMinutesByPriority =
        body['slaMinutesByPriority'] && typeof body['slaMinutesByPriority'] === 'object'
          ? (body['slaMinutesByPriority'] as Partial<Record<TaskPriorityLevel, number>>)
          : undefined;

      const published = universalHealthcareWorkflowEngineService.publishWorkflowVersion(session, {
        codeOrDepartment,
        ...(newStages ? { newStages } : {}),
        ...(slaMinutesByPriority ? { slaMinutesByPriority } : {})
      });

      return reply.status(201).send({
        success: true,
        data: published
      });
    }
  );

  /**
   * 3. POST /api/v1/partner/workflows/instances
   * Creates a new Workflow Instance + initial Task + Queue placement.
   */
  app.post(
    '/api/v1/partner/workflows/instances',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const workflowCodeOrDepartment = String(
        body['workflowCodeOrDepartment'] ?? body['departmentKey'] ?? 'OPD'
      );
      const patientId = String(body['patientId'] ?? '');
      const encounterId = String(body['encounterId'] ?? '');

      const result = await universalHealthcareWorkflowEngineService.createWorkflowInstance(session, {
        workflowCodeOrDepartment,
        patientId,
        encounterId,
        ...(body['locationId'] ? { locationId: String(body['locationId']) } : {}),
        ...(body['departmentId'] ? { departmentId: String(body['departmentId']) } : {}),
        ...(body['orderId'] ? { orderId: String(body['orderId']) } : {}),
        ...(body['priority'] ? { priority: String(body['priority']) as TaskPriorityLevel } : {}),
        ...(body['initialTaskType'] ? { initialTaskType: String(body['initialTaskType']) } : {}),
        ...(body['assignedTo'] ? { assignedTo: String(body['assignedTo']) } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
        ...(body['contextData'] && typeof body['contextData'] === 'object'
          ? { contextData: body['contextData'] as Record<string, unknown> }
          : {}),
        ...(body['licenseStatusOverride']
          ? { licenseStatusOverride: String(body['licenseStatusOverride']) }
          : {}),
        ...(typeof body['entitlementMissingOverride'] === 'boolean'
          ? { entitlementMissingOverride: body['entitlementMissingOverride'] }
          : {})
      });

      return reply.status(201).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 4. GET /api/v1/partner/workflows/instances/:instanceId
   * Inspects a Workflow Instance and its bound version/state/tasks.
   */
  app.get(
    '/api/v1/partner/workflows/instances/:instanceId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { instanceId: string };
      const instance = universalHealthcareWorkflowEngineService.getWorkflowInstance(
        session,
        params.instanceId
      );
      return reply.status(200).send({
        success: true,
        data: instance
      });
    }
  );

  /**
   * 5. POST /api/v1/partner/workflows/tasks
   * Creates an additional Task inside an active Workflow Instance.
   */
  app.post(
    '/api/v1/partner/workflows/tasks',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const workflowInstanceId = String(body['workflowInstanceId'] ?? '');
      const taskType = String(body['taskType'] ?? body['stepKey'] ?? 'CLINICAL_TASK');

      const task = await universalHealthcareWorkflowEngineService.createTask(session, {
        workflowInstanceId,
        taskType,
        ...(body['stageName'] ? { stageName: String(body['stageName']) } : {}),
        ...(body['priority'] ? { priority: String(body['priority']) as TaskPriorityLevel } : {}),
        ...(body['assignedTo'] ? { assignedTo: String(body['assignedTo']) } : {}),
        ...(body['assignedRole'] ? { assignedRole: String(body['assignedRole']) } : {}),
        ...(body['queueType'] ? { queueType: String(body['queueType']) as QueueCategory } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
        ...(body['metadata'] && typeof body['metadata'] === 'object'
          ? { metadata: body['metadata'] as Record<string, unknown> }
          : {})
      });

      return reply.status(201).send({
        success: true,
        data: task
      });
    }
  );

  /**
   * 6. POST /api/v1/partner/workflows/tasks/:taskId/transition
   * Transitions a Task and its parent Workflow Instance through the Universal State Machine.
   */
  app.post(
    '/api/v1/partner/workflows/tasks/:taskId/transition',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { taskId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const transitionCode = String(body['transitionCode'] ?? body['targetState'] ?? '');

      const result = await universalHealthcareWorkflowEngineService.transitionTask(
        session,
        params.taskId,
        {
          transitionCode,
          ...(typeof body['expectedVersionLock'] === 'number'
            ? { expectedVersionLock: body['expectedVersionLock'] }
            : {}),
          ...(body['nextStageName'] ? { nextStageName: String(body['nextStageName']) } : {}),
          ...(body['reason'] ? { reason: String(body['reason']) } : {}),
          ...(idempotencyKey ? { idempotencyKey } : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 7. POST /api/v1/partner/workflows/tasks/:taskId/assign
   * Assigns/claims/releases/reassigns a Task with full assignee eligibility validation.
   */
  app.post(
    '/api/v1/partner/workflows/tasks/:taskId/assign',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { taskId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const newAssignee =
        body['newAssignee'] === null
          ? null
          : body['newAssignee'] !== undefined
          ? String(body['newAssignee'])
          : body['assigneeUserId']
          ? String(body['assigneeUserId'])
          : null;

      const reason = String(body['reason'] ?? 'Task assignment update');

      const result = await universalHealthcareWorkflowEngineService.assignTask(
        session,
        params.taskId,
        {
          newAssignee,
          reason,
          ...(body['assigneePartnerId']
            ? { assigneePartnerId: String(body['assigneePartnerId']) }
            : {}),
          ...(body['assigneeLocationId']
            ? { assigneeLocationId: String(body['assigneeLocationId']) }
            : {}),
          ...(body['assigneeDepartmentId']
            ? { assigneeDepartmentId: String(body['assigneeDepartmentId']) }
            : {}),
          ...(body['assigneeRole'] ? { assigneeRole: String(body['assigneeRole']) } : {}),
          ...(body['assigneeStaffStatus']
            ? { assigneeStaffStatus: String(body['assigneeStaffStatus']) as StaffLifecycleStatus }
            : {}),
          ...(body['assigneeCredentialStatus']
            ? {
                assigneeCredentialStatus: String(
                  body['assigneeCredentialStatus']
                ) as CredentialLifecycleStatus
              }
            : {}),
          ...(typeof body['requireValidCredential'] === 'boolean'
            ? { requireValidCredential: body['requireValidCredential'] }
            : {}),
          ...(body['mode'] ? { mode: String(body['mode']) as AssignmentMode } : {}),
          ...(idempotencyKey ? { idempotencyKey } : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 8. PATCH /api/v1/partner/workflows/tasks/:taskId/priority
   * Updates Task priority (ROUTINE, URGENT, STAT, EMERGENCY, CRITICAL) and recalculates SLA.
   */
  app.patch(
    '/api/v1/partner/workflows/tasks/:taskId/priority',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { taskId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;

      const priority = String(body['priority'] ?? 'URGENT') as TaskPriorityLevel;
      const reason = String(body['reason'] ?? 'Clinical priority update');

      const result = await universalHealthcareWorkflowEngineService.updateTaskPriority(
        session,
        params.taskId,
        {
          priority,
          reason
        }
      );

      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 9. GET /api/v1/partner/workflows/queues
   * Queries Universal Work Queues (DEPARTMENT, LOCATION, ROLE, PRIORITY, STAFF, EXCEPTION, ESCALATION).
   */
  app.get(
    '/api/v1/partner/workflows/queues',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const query = (request.query ?? {}) as Record<string, unknown>;

      const tasks = await universalHealthcareWorkflowEngineService.queryQueue(session, {
        ...(query['queueType'] ? { queueType: String(query['queueType']) as QueueCategory } : {}),
        ...(query['departmentId'] ? { departmentId: String(query['departmentId']) } : {}),
        ...(query['locationId'] ? { locationId: String(query['locationId']) } : {}),
        ...(query['role'] ? { role: String(query['role']) } : {}),
        ...(query['priority']
          ? { priority: String(query['priority']) as TaskPriorityLevel }
          : {}),
        ...(query['assignedTo'] ? { assignedTo: String(query['assignedTo']) } : {})
      });

      return reply.status(200).send({
        success: true,
        count: tasks.length,
        data: tasks
      });
    }
  );

  /**
   * 10. POST /api/v1/partner/workflows/tasks/:taskId/sla-evaluate
   * Evaluates SLA timers and triggers warning/breach escalations (rejects client clock manipulation).
   */
  app.post(
    '/api/v1/partner/workflows/tasks/:taskId/sla-evaluate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { taskId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;

      const result = await universalHealthcareWorkflowEngineService.evaluateTaskSLAAndEscalate(
        session,
        params.taskId,
        {
          ...(typeof body['simulatedElapsedMinutes'] === 'number'
            ? { simulatedElapsedMinutes: body['simulatedElapsedMinutes'] }
            : {}),
          ...(body['clientSuppliedTimestamp']
            ? { clientSuppliedTimestamp: String(body['clientSuppliedTimestamp']) }
            : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 11. POST /api/v1/partner/workflows/tasks/:taskId/escalate
   * Escalates a task to a higher operational/clinical tier.
   */
  app.post(
    '/api/v1/partner/workflows/tasks/:taskId/escalate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { taskId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;

      const trigger = String(body['trigger'] ?? 'MANUAL_ESCALATION') as EscalationTriggerType;
      const toTier = String(body['toTier'] ?? 'DEPARTMENT_HEAD') as EscalationTier;
      const reason = String(body['reason'] ?? 'Supervisor escalation requested');

      const result = await universalHealthcareWorkflowEngineService.escalateTask(
        session,
        params.taskId,
        {
          trigger,
          toTier,
          reason,
          ...(body['fromTier'] ? { fromTier: String(body['fromTier']) as EscalationTier } : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 12. POST /api/v1/partner/workflows/exceptions
   * Records a workflow exception and moves the task into the EXCEPTION queue.
   */
  app.post(
    '/api/v1/partner/workflows/exceptions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;

      const workflowInstanceId = String(body['workflowInstanceId'] ?? '');
      const type = String(body['type'] ?? 'SAMPLE_REJECTED') as WorkflowExceptionType;
      const severity = String(body['severity'] ?? 'HIGH') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      const reason = String(body['reason'] ?? 'Clinical operational exception');

      const result = await universalHealthcareWorkflowEngineService.recordException(session, {
        workflowInstanceId,
        type,
        severity,
        reason,
        ...(body['taskId'] ? { taskId: String(body['taskId']) } : {})
      });

      return reply.status(201).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 13. POST /api/v1/partner/workflows/exceptions/:exceptionId/resolve
   * Resolves an open exception and restores task execution.
   */
  app.post(
    '/api/v1/partner/workflows/exceptions/:exceptionId/resolve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { exceptionId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const resolution = String(body['resolution'] ?? body['resolutionNotes'] ?? 'Exception resolved');

      const result = await universalHealthcareWorkflowEngineService.resolveException(
        session,
        params.exceptionId,
        resolution
      );

      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 14. POST /api/v1/partner/workflows/handoffs
   * Initiates a cross-department handoff preserving Patient -> Encounter -> Order continuity.
   */
  app.post(
    '/api/v1/partner/workflows/handoffs',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const sourceWorkflowId = String(
        body['sourceWorkflowId'] ?? body['sourceWorkflowInstanceId'] ?? ''
      );
      const destinationDepartment = String(
        body['destinationDepartment'] ?? body['targetDepartmentKey'] ?? ''
      );
      const reason = String(body['reason'] ?? body['clinicalSummary'] ?? 'Department handoff');

      const result = await universalHealthcareWorkflowEngineService.requestDepartmentHandoff(
        session,
        {
          sourceWorkflowId,
          destinationDepartment,
          reason,
          ...(body['orderId'] ? { orderId: String(body['orderId']) } : {}),
          ...(body['payload'] && typeof body['payload'] === 'object'
            ? { payload: body['payload'] as Record<string, unknown> }
            : {}),
          ...(idempotencyKey ? { idempotencyKey } : {})
        }
      );

      return reply.status(201).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 15. POST /api/v1/partner/workflows/handoffs/:handoffId/respond
   * Accepts, rejects, cancels, or completes a cross-department handoff.
   */
  app.post(
    '/api/v1/partner/workflows/handoffs/:handoffId/respond',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { handoffId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const action = String(body['action'] ?? body['decision'] ?? 'ACCEPT') as
        | 'ACCEPT'
        | 'REJECT'
        | 'CANCEL'
        | 'COMPLETE';

      const result = await universalHealthcareWorkflowEngineService.respondToDepartmentHandoff(
        session,
        params.handoffId,
        {
          action,
          ...(body['reason'] ? { reason: String(body['reason']) } : {})
        }
      );

      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 16. POST /api/v1/partner/workflows/sagas/execute
   * Executes a multi-department Saga with automatic reverse compensation on step failure.
   */
  app.post(
    '/api/v1/partner/workflows/sagas/execute',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const headers = request.headers as Record<string, string | undefined>;
      const idempotencyKey =
        (body['idempotencyKey'] ? String(body['idempotencyKey']) : undefined) ??
        headers['idempotency-key'] ??
        headers['x-idempotency-key'];

      const patientId = String(body['patientId'] ?? '');
      const encounterId = String(body['encounterId'] ?? '');
      const orderId = String(body['orderId'] ?? '');
      const steps = Array.isArray(body['steps'])
        ? (body['steps'] as Array<{
            stepCode: string;
            department: string;
            description: string;
            compensationAction: string;
            simulateFailure?: boolean;
          }>)
        : [];

      const saga = await universalHealthcareWorkflowEngineService.executeCrossDepartmentSaga(
        session,
        {
          patientId,
          encounterId,
          orderId,
          steps,
          ...(body['locationId'] ? { locationId: String(body['locationId']) } : {}),
          ...(idempotencyKey ? { idempotencyKey } : {})
        }
      );

      return reply.status(saga.status === 'COMPLETED' ? 201 : 200).send({
        success: true,
        data: saga
      });
    }
  );

  /**
   * 17. POST /api/v1/partner/workflows/sagas/:sagaId/recover
   * Retries and reconciles a failed/compensated Saga to RECOVERED state.
   */
  app.post(
    '/api/v1/partner/workflows/sagas/:sagaId/recover',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const params = request.params as { sagaId: string };
      const saga = await universalHealthcareWorkflowEngineService.retryAndRecoverSaga(
        session,
        params.sagaId
      );

      return reply.status(200).send({
        success: true,
        data: saga
      });
    }
  );

  /**
   * 18. GET /api/v1/partner/workflows/audit
   * Returns immutable workflow audit records filtered by tenant, instance, patient, or task.
   */
  app.get(
    '/api/v1/partner/workflows/audit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = getSessionOrThrow(request);
      const query = (request.query ?? {}) as Record<string, unknown>;

      const auditTrail = universalHealthcareWorkflowEngineService.getWorkflowAuditTrail(session, {
        ...(query['workflowInstanceId']
          ? { workflowInstanceId: String(query['workflowInstanceId']) }
          : {}),
        ...(query['patientId'] ? { patientId: String(query['patientId']) } : {}),
        ...(query['taskId'] ? { taskId: String(query['taskId']) } : {})
      });

      return reply.status(200).send({
        success: true,
        count: auditTrail.length,
        data: auditTrail
      });
    }
  );
}
