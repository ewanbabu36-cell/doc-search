import crypto from 'node:crypto';
import {
  getDatabase,
  workflowInstances,
  outboxJobs
} from '@docsearch/database';
import type { SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import {
  identitySecurityFoundationService,
  type StaffLifecycleStatus,
  type CredentialLifecycleStatus
} from '../security/IdentitySecurityFoundationService.js';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';

export type UniversalWorkflowState =
  | 'CREATED'
  | 'ASSIGNED'
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REOPENED'
  | 'ON_HOLD'
  | 'BLOCKED'
  | 'FAILED'
  | 'EXCEPTION'
  | 'ESCALATED'
  | 'EXPIRED'
  | 'REJECTED';

export type TaskPriorityLevel =
  | 'LOW'
  | 'ROUTINE'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT'
  | 'STAT'
  | 'EMERGENCY'
  | 'CRITICAL';

export type QueueCategory =
  | 'DEPARTMENT'
  | 'LOCATION'
  | 'ROLE'
  | 'PRIORITY'
  | 'STAFF'
  | 'EXCEPTION'
  | 'ESCALATION';

export type AssignmentMode =
  | 'MANUAL'
  | 'ROLE_BASED'
  | 'DEPARTMENT'
  | 'QUEUE'
  | 'LOCATION'
  | 'RULE_BASED'
  | 'REASSIGNMENT'
  | 'UNASSIGNMENT'
  | 'ESCALATED_REASSIGNMENT';

export type EscalationTriggerType =
  | 'SLA_WARNING'
  | 'SLA_BREACH'
  | 'NO_ASSIGNMENT'
  | 'TASK_FAILURE'
  | 'CRITICAL_EXCEPTION'
  | 'QUEUE_OVERLOAD'
  | 'MANUAL_ESCALATION';

export type EscalationTier =
  | 'STAFF'
  | 'SENIOR_STAFF'
  | 'DEPARTMENT_HEAD'
  | 'PARTNER_ADMIN'
  | 'HQ_CONTROL';

export type WorkflowExceptionType =
  | 'BUSINESS_EXCEPTION'
  | 'VALIDATION_EXCEPTION'
  | 'SECURITY_EXCEPTION'
  | 'SYSTEM_EXCEPTION'
  | 'INTEGRATION_EXCEPTION'
  | 'SLA_EXCEPTION'
  | 'RESOURCE_EXCEPTION'
  | 'CLINICAL_EXCEPTION';

export type HandoffStatus =
  | 'HANDOFF_REQUESTED'
  | 'HANDOFF_ACCEPTED'
  | 'HANDOFF_REJECTED'
  | 'HANDOFF_CANCELLED'
  | 'HANDOFF_COMPLETED';

export interface WorkflowTransitionRule {
  fromStates: UniversalWorkflowState[];
  toState: UniversalWorkflowState;
  transitionCode: string;
  requiredRoles?: string[];
  requiredPermission: string;
  requiresValidCredential?: boolean;
  requiresVerification?: boolean;
  requiresReason?: boolean;
}

export interface DepartmentWorkflowAdapterConfig {
  code: string;
  name: string;
  department: string;
  requiredCapability: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  effectiveFrom: string;
  stages: string[];
  allowedStates: UniversalWorkflowState[];
  transitions: WorkflowTransitionRule[];
  defaultPriority: TaskPriorityLevel;
  slaMinutesByPriority: Record<TaskPriorityLevel, number>;
  allowedDestinationHandoffDepartments: string[];
}

export interface TaskSLARecord {
  slaMinutes: number;
  warningThresholdMinutes: number;
  startedAtMs: number;
  dueAtMs: number;
  warningAtMs: number;
  pausedAtMs: number | null;
  accumulatedPausedMs: number;
  status: 'ON_TRACK' | 'PAUSED' | 'WARNING' | 'BREACHED';
}

export interface TaskAssignmentHistoryItem {
  assignmentId: string;
  previousAssignee: string | null;
  newAssignee: string | null;
  changedBy: string;
  changedAt: string;
  mode: AssignmentMode;
  reason: string;
}

export interface UniversalWorkflowTask {
  taskId: string;
  workflowInstanceId: string;
  workflowCode: string;
  workflowVersion: number;
  taskType: string;
  stageName: string;
  partnerId: string;
  locationId: string;
  departmentId: string;
  patientId: string;
  encounterId: string;
  orderId: string | null;
  createdBy: string;
  assignedTo: string | null;
  assignedRole: string | null;
  queueType: QueueCategory;
  priority: TaskPriorityLevel;
  sla: TaskSLARecord;
  state: UniversalWorkflowState;
  versionLock: number;
  dueTime: string;
  startedTime: string | null;
  completedTime: string | null;
  verifiedTime: string | null;
  closedTime: string | null;
  failureReason: string | null;
  assignmentHistory: TaskAssignmentHistoryItem[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UniversalWorkflowInstance {
  workflowInstanceId: string;
  workflowDefinitionId: string;
  workflowCode: string;
  workflowVersionId: string;
  workflowVersion: number;
  partnerId: string;
  locationId: string;
  departmentId: string;
  patientId: string;
  encounterId: string;
  orderId: string | null;
  createdBy: string;
  assignedTo: string | null;
  currentState: UniversalWorkflowState;
  currentStage: string;
  priority: TaskPriorityLevel;
  sla: TaskSLARecord;
  versionLock: number;
  tasks: string[];
  handoffs: string[];
  exceptions: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  verifiedAt: string | null;
  closedAt: string | null;
  contextData: Record<string, unknown>;
}

export interface WorkflowExceptionRecord {
  exceptionId: string;
  workflowInstanceId: string;
  taskId: string | null;
  partnerId: string;
  type: WorkflowExceptionType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  createdBy: string;
  createdAt: string;
  status: 'OPEN' | 'RESOLVED';
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface WorkflowEscalationRecord {
  escalationId: string;
  workflowInstanceId: string;
  taskId: string | null;
  partnerId: string;
  locationId: string;
  departmentId: string;
  trigger: EscalationTriggerType;
  fromTier: EscalationTier;
  toTier: EscalationTier;
  reason: string;
  escalatedBy: string;
  escalatedAt: string;
}

export interface WorkflowHandoffRecord {
  handoffId: string;
  partnerId: string;
  locationId: string;
  patientId: string;
  encounterId: string;
  orderId: string | null;
  sourceDepartment: string;
  destinationDepartment: string;
  sourceWorkflowId: string;
  destinationWorkflowId: string | null;
  destinationTaskId: string | null;
  initiator: string;
  acceptedBy: string | null;
  timestamp: string;
  updatedAt: string;
  reason: string;
  payload: Record<string, unknown>;
  status: HandoffStatus;
}

export interface WorkflowSagaStep {
  stepIndex: number;
  stepCode: string;
  department: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'COMPENSATED' | 'RECOVERED';
  attempts: number;
  error: string | null;
  compensationAction: string;
  executedAt: string | null;
  compensatedAt: string | null;
}

export interface WorkflowSagaRecord {
  sagaId: string;
  partnerId: string;
  locationId: string;
  patientId: string;
  encounterId: string;
  orderId: string;
  workflowInstanceId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED_COMPENSATING' | 'COMPENSATED' | 'RECOVERED';
  steps: WorkflowSagaStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowAuditEntry {
  auditId: string;
  who: string;
  what: string;
  patientId: string;
  partnerId: string;
  locationId: string;
  departmentId: string;
  when: string;
  previousState: string | null;
  newState: string;
  reason: string;
  source: string;
  workflowInstanceId: string;
  taskId: string | null;
  entityType: string;
  entityId: string;
}

const PRIORITY_RANK: Record<TaskPriorityLevel, number> = {
  CRITICAL: 8,
  EMERGENCY: 7,
  STAT: 6,
  URGENT: 5,
  HIGH: 4,
  NORMAL: 3,
  ROUTINE: 2,
  LOW: 1
};

const BASE_TRANSITIONS: WorkflowTransitionRule[] = [
  {
    fromStates: ['CREATED'],
    toState: 'ASSIGNED',
    transitionCode: 'ASSIGN',
    requiredPermission: 'ENCOUNTER:READ'
  },
  {
    fromStates: ['CREATED', 'ASSIGNED'],
    toState: 'QUEUED',
    transitionCode: 'QUEUE',
    requiredPermission: 'ENCOUNTER:READ'
  },
  {
    fromStates: ['CREATED', 'ASSIGNED', 'QUEUED', 'REOPENED', 'ON_HOLD', 'BLOCKED'],
    toState: 'IN_PROGRESS',
    transitionCode: 'START',
    requiredPermission: 'ENCOUNTER:READ'
  },
  {
    fromStates: ['ON_HOLD', 'BLOCKED', 'REOPENED', 'QUEUED', 'ASSIGNED'],
    toState: 'IN_PROGRESS',
    transitionCode: 'RESUME',
    requiredPermission: 'ENCOUNTER:READ'
  },
  {
    fromStates: ['IN_PROGRESS', 'QUEUED', 'ASSIGNED'],
    toState: 'ON_HOLD',
    transitionCode: 'PAUSE',
    requiredPermission: 'ENCOUNTER:READ',
    requiresReason: true
  },
  {
    fromStates: ['IN_PROGRESS', 'QUEUED', 'ASSIGNED'],
    toState: 'ON_HOLD',
    transitionCode: 'HOLD',
    requiredPermission: 'ENCOUNTER:READ',
    requiresReason: true
  },
  {
    fromStates: ['IN_PROGRESS'],
    toState: 'BLOCKED',
    transitionCode: 'BLOCK',
    requiredPermission: 'ENCOUNTER:READ',
    requiresReason: true
  },
  {
    fromStates: ['IN_PROGRESS', 'REOPENED'],
    toState: 'COMPLETED',
    transitionCode: 'COMPLETE',
    requiredPermission: 'ENCOUNTER:READ'
  },
  {
    fromStates: ['COMPLETED'],
    toState: 'VERIFIED',
    transitionCode: 'VERIFY',
    requiredPermission: 'ENCOUNTER:READ',
    requiresValidCredential: true,
    requiresVerification: true
  },
  {
    fromStates: ['VERIFIED', 'COMPLETED'],
    toState: 'CLOSED',
    transitionCode: 'CLOSE',
    requiredPermission: 'ENCOUNTER:READ'
  },
  {
    fromStates: ['CREATED', 'ASSIGNED', 'QUEUED', 'IN_PROGRESS', 'ON_HOLD'],
    toState: 'CANCELLED',
    transitionCode: 'CANCEL',
    requiredPermission: 'ENCOUNTER:READ',
    requiresReason: true
  },
  {
    fromStates: ['COMPLETED', 'VERIFIED', 'CLOSED', 'CANCELLED', 'REJECTED'],
    toState: 'REOPENED',
    transitionCode: 'REOPEN',
    requiredPermission: 'ENCOUNTER:READ',
    requiresReason: true
  },
  {
    fromStates: ['CREATED', 'ASSIGNED', 'QUEUED', 'IN_PROGRESS'],
    toState: 'EXCEPTION',
    transitionCode: 'RAISE_EXCEPTION',
    requiredPermission: 'ENCOUNTER:READ',
    requiresReason: true
  },
  {
    fromStates: ['CREATED', 'ASSIGNED', 'QUEUED', 'IN_PROGRESS', 'EXCEPTION'],
    toState: 'ESCALATED',
    transitionCode: 'ESCALATE',
    requiredPermission: 'ENCOUNTER:READ',
    requiresReason: true
  }
];

function createAdapter(
  code: string,
  name: string,
  department: string,
  requiredCapability: string,
  stages: string[],
  allowedDestinationHandoffDepartments: string[],
  verifyPermission = 'ENCOUNTER:READ'
): DepartmentWorkflowAdapterConfig {
  const transitions = BASE_TRANSITIONS.map((t) =>
    t.transitionCode === 'VERIFY' ? { ...t, requiredPermission: verifyPermission } : { ...t }
  );
  return {
    code,
    name,
    department,
    requiredCapability,
    version: 1,
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    stages,
    allowedStates: [
      'CREATED',
      'ASSIGNED',
      'QUEUED',
      'IN_PROGRESS',
      'COMPLETED',
      'VERIFIED',
      'CLOSED',
      'CANCELLED',
      'REOPENED',
      'ON_HOLD',
      'BLOCKED',
      'FAILED',
      'EXCEPTION',
      'ESCALATED',
      'EXPIRED',
      'REJECTED'
    ],
    transitions,
    defaultPriority: 'NORMAL',
    slaMinutesByPriority: {
      CRITICAL: 10,
      EMERGENCY: 15,
      STAT: 20,
      URGENT: 30,
      HIGH: 60,
      NORMAL: 120,
      ROUTINE: 180,
      LOW: 240
    },
    allowedDestinationHandoffDepartments
  };
}

/**
 * 10 Declarative Department Workflow Adapters running on the Universal Workflow Kernel
 */
export const UNIVERSAL_DEPARTMENT_WORKFLOW_ADAPTERS: Record<string, DepartmentWorkflowAdapterConfig> = {
  OPD: createAdapter(
    'WF_DEPT_OPD',
    'OPD Clinical Consultation & Order Workflow',
    'OPD',
    'OPD',
    ['Appointment', 'Queue', 'Token', 'Doctor', 'Consultation', 'Investigation Order', 'Prescription', 'Billing/Exit'],
    ['LAB', 'LIMS', 'RADIOLOGY', 'PHARMACY', 'BILLING', 'IPD'],
    'PRESCRIPTION:SIGN'
  ),
  LIMS: createAdapter(
    'WF_DEPT_LIMS',
    'Laboratory Information Management Workflow',
    'LIMS',
    'LABORATORY',
    ['Order', 'Sample Collection', 'Accession', 'Processing', 'Result', 'Validation', 'Report', 'Doctor Review', 'Closed'],
    ['OPD', 'IPD', 'BILLING', 'CRITICAL_CARE'],
    'LAB:VALIDATE'
  ),
  RADIOLOGY: createAdapter(
    'WF_DEPT_RADIOLOGY',
    'Radiology & RIS/PACS Diagnostic Workflow',
    'RADIOLOGY',
    'RADIOLOGY',
    ['Order', 'Scheduling', 'Technician Assignment', 'Procedure', 'Reporting', 'Verification', 'Doctor Review', 'Closed'],
    ['OPD', 'IPD', 'BILLING'],
    'RADIOLOGY:VALIDATE'
  ),
  PHARMACY: createAdapter(
    'WF_DEPT_PHARMACY',
    'Pharmacy Prescription Verification & Dispensing Workflow',
    'PHARMACY',
    'PHARMACY',
    ['Prescription', 'Verification', 'Dispensing Queue', 'Pharmacist', 'Dispensing', 'Payment', 'Closed'],
    ['BILLING', 'OPD', 'IPD'],
    'PHARMACY:DISPENSE'
  ),
  IPD: createAdapter(
    'WF_DEPT_IPD',
    'Inpatient Admission, Nursing Care & Discharge Workflow',
    'IPD',
    'IPD',
    ['Admission', 'Bed Assignment', 'Care Tasks', 'Orders', 'Results', 'Treatment', 'Discharge', 'Closure'],
    ['LAB', 'LIMS', 'RADIOLOGY', 'PHARMACY', 'DIETARY', 'BLOOD_BANK', 'BILLING', 'MRD'],
    'ENCOUNTER:UPDATE'
  ),
  BILLING: createAdapter(
    'WF_DEPT_BILLING',
    'Patient Billing, Settlement & Reconciliation Workflow',
    'BILLING',
    'BILLING',
    ['Charge Capture', 'Invoice Draft', 'Verification', 'Payment Collection', 'Receipt', 'Reconciliation', 'Closed'],
    ['MRD', 'OPD', 'IPD'],
    'BILLING:CREATE'
  ),
  BLOOD_BANK: createAdapter(
    'WF_DEPT_BLOOD_BANK',
    'Blood Bank Crossmatch & Component Issue Workflow',
    'BLOOD_BANK',
    'BLOOD_BANK',
    ['Requisition', 'Grouping & Crossmatch', 'Component Issue', 'Transfusion Monitoring', 'Closure'],
    ['IPD', 'OT', 'BILLING'],
    'LAB:VALIDATE'
  ),
  DIETARY: createAdapter(
    'WF_DEPT_DIETARY',
    'Clinical Nutrition & Inpatient Dietary Workflow',
    'DIETARY',
    'DIETARY',
    ['Diet Assessment', 'Meal Plan Order', 'Kitchen Preparation', 'Ward Delivery', 'Verification', 'Closed'],
    ['IPD', 'NURSING'],
    'PATIENT:READ'
  ),
  MRD: createAdapter(
    'WF_DEPT_MRD',
    'Medical Records Department ICD Coding & Archival Workflow',
    'MRD',
    'MRD',
    ['Discharge File Receipt', 'ICD Coding', 'Completeness Audit', 'Archival Signoff', 'Closed'],
    ['ADMINISTRATION'],
    'PATIENT:READ'
  ),
  SUPPLY_CHAIN: createAdapter(
    'WF_DEPT_SUPPLY_CHAIN',
    'Healthcare Procurement, GRN & Inventory Ledger Workflow',
    'SUPPLY_CHAIN',
    'PROCUREMENT',
    ['Indent Request', 'Purchase Order', 'GRN Inspection', 'Stock Ledger Posting', 'Finance Handoff', 'Closed'],
    ['PHARMACY', 'LAB', 'BILLING'],
    'PATIENT:READ'
  )
};

export class UniversalHealthcareWorkflowEngineService {
  private definitions = new Map<string, Map<number, DepartmentWorkflowAdapterConfig>>();
  private activeDefinitionVersion = new Map<string, number>();
  private instances = new Map<string, UniversalWorkflowInstance>();
  private tasks = new Map<string, UniversalWorkflowTask>();
  private exceptions = new Map<string, WorkflowExceptionRecord>();
  private escalations = new Map<string, WorkflowEscalationRecord>();
  private handoffs = new Map<string, WorkflowHandoffRecord>();
  private sagas = new Map<string, WorkflowSagaRecord>();
  private auditTrail: WorkflowAuditEntry[] = [];
  private eventsEmitted: Array<Record<string, unknown>> = [];
  private idempotencyStore = new Map<string, { requestHash: string; result: any }>();

  constructor() {
    for (const adapter of Object.values(UNIVERSAL_DEPARTMENT_WORKFLOW_ADAPTERS)) {
      const verMap = new Map<number, DepartmentWorkflowAdapterConfig>();
      verMap.set(adapter.version, JSON.parse(JSON.stringify(adapter)));
      this.definitions.set(adapter.code, verMap);
      this.definitions.set(adapter.department, verMap);
      this.activeDefinitionVersion.set(adapter.code, adapter.version);
      this.activeDefinitionVersion.set(adapter.department, adapter.version);
    }
  }

  // =========================================================================
  // IDEMPOTENCY DEDUPLICATION (STEP 16)
  // =========================================================================

  private checkIdempotency<T>(partnerId: string, idempotencyKey: string | undefined, payload: unknown): T | null {
    if (!idempotencyKey) return null;
    const compositeKey = `${partnerId}:${idempotencyKey}`;
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
    const existing = this.idempotencyStore.get(compositeKey);
    if (!existing) return null;
    if (existing.requestHash !== hash) {
      throw new AppError({
        message: `Idempotency key "${idempotencyKey}" already used with a different request payload.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }
    return existing.result as T;
  }

  private saveIdempotency(partnerId: string, idempotencyKey: string | undefined, payload: unknown, result: unknown): void {
    if (!idempotencyKey) return;
    const compositeKey = `${partnerId}:${idempotencyKey}`;
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
    this.idempotencyStore.set(compositeKey, { requestHash: hash, result });
  }

  // =========================================================================
  // STEP 4 — WORKFLOW DEFINITION & VERSION ENGINE
  // =========================================================================

  public getDepartmentAdapters() {
    return Object.values(UNIVERSAL_DEPARTMENT_WORKFLOW_ADAPTERS);
  }

  public publishWorkflowVersion(
    session: SessionContext,
    input: {
      codeOrDepartment: string;
      newStages?: string[];
      slaMinutesByPriority?: Partial<Record<TaskPriorityLevel, number>>;
    }
  ): DepartmentWorkflowAdapterConfig {
    if (!session || !session.tenantId) {
      throw AppError.unauthorized('Authentication required');
    }
    const key = input.codeOrDepartment.toUpperCase().trim();
    const verMap = this.definitions.get(key);
    if (!verMap) {
      throw AppError.notFound(`Workflow definition "${key}" not found`);
    }
    const currentVer = this.activeDefinitionVersion.get(key) || 1;
    const baseCfg = verMap.get(currentVer)!;
    const nextVer = currentVer + 1;

    const nextCfg: DepartmentWorkflowAdapterConfig = {
      ...JSON.parse(JSON.stringify(baseCfg)),
      version: nextVer,
      effectiveFrom: new Date().toISOString(),
      stages: input.newStages && input.newStages.length > 0 ? input.newStages : baseCfg.stages,
      slaMinutesByPriority: {
        ...baseCfg.slaMinutesByPriority,
        ...(input.slaMinutesByPriority || {})
      }
    };

    verMap.set(nextVer, nextCfg);
    this.activeDefinitionVersion.set(baseCfg.code, nextVer);
    this.activeDefinitionVersion.set(baseCfg.department, nextVer);
    return nextCfg;
  }

  private resolveDefinitionVersion(codeOrDept: string, version?: number): DepartmentWorkflowAdapterConfig {
    const key = String(codeOrDept || '').toUpperCase().trim();
    const verMap =
      this.definitions.get(key) ||
      this.definitions.get(`WF_DEPT_${key}`);
    if (!verMap) {
      throw new AppError({
        message: `Unknown workflow definition or department "${codeOrDept}"`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }
    const targetVer = version ?? this.activeDefinitionVersion.get(key) ?? 1;
    const def = verMap.get(targetVer);
    if (!def) {
      throw new AppError({
        message: `Workflow version ${targetVer} for "${codeOrDept}" not found`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }
    return def;
  }

  private buildSlaRecord(slaMinutes: number, nowMs = Date.now()): TaskSLARecord {
    const durationMs = slaMinutes * 60 * 1000;
    const warningMs = Math.floor(durationMs * 0.75);
    return {
      slaMinutes,
      warningThresholdMinutes: Math.floor(slaMinutes * 0.75),
      startedAtMs: nowMs,
      dueAtMs: nowMs + durationMs,
      warningAtMs: nowMs + warningMs,
      pausedAtMs: null,
      accumulatedPausedMs: 0,
      status: 'ON_TRACK'
    };
  }

  // =========================================================================
  // STEP 5 & STEP 6 — WORKFLOW INSTANCE & TASK CREATION
  // =========================================================================

  private getScopedDepartmentForAuth(session: SessionContext, targetDept?: string): string | undefined {
    if (session.dataScope === 'tenant') {
      return session.departmentId || targetDept;
    }
    return targetDept;
  }

  public async createWorkflowInstance(
    session: SessionContext,
    input: {
      workflowCodeOrDepartment: string;
      locationId?: string;
      departmentId?: string;
      patientId: string;
      encounterId: string;
      orderId?: string;
      priority?: TaskPriorityLevel;
      initialTaskType?: string;
      assignedTo?: string;
      idempotencyKey?: string;
      contextData?: Record<string, unknown>;
      licenseStatusOverride?: string;
      entitlementMissingOverride?: boolean;
    }
  ): Promise<{ instance: UniversalWorkflowInstance; initialTask: UniversalWorkflowTask }> {
    if (!session || !session.tenantId || !session.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const partnerId = session.tenantId;
    const cached = this.checkIdempotency<{ instance: UniversalWorkflowInstance; initialTask: UniversalWorkflowTask }>(
      partnerId,
      input.idempotencyKey,
      input
    );
    if (cached) {
      return cached;
    }

    if (!input.patientId || !input.encounterId) {
      throw AppError.badRequest('patientId and encounterId are mandatory for healthcare workflow continuity');
    }

    const def = this.resolveDefinitionVersion(input.workflowCodeOrDepartment);
    const locationId = input.locationId || session.branchId || 'loc-branch-a';
    const departmentId = (input.departmentId || def.department).toUpperCase().trim();

    // Verify RBAC + ABAC + Scope + Staff Status + Credential Status + Entitlement via Phase 3 authorize()
    const authDecision = await identitySecurityFoundationService.authorize(
      session,
      'ENCOUNTER:CREATE',
      {
        partnerId,
        locationId,
        departmentId: this.getScopedDepartmentForAuth(session, departmentId),
        patientId: input.patientId,
        encounterId: input.encounterId
      },
      {
        licenseStatusOverride: input.licenseStatusOverride,
        entitlementMissingOverride: input.entitlementMissingOverride
      }
    );

    if (!authDecision.allowed) {
      throw new AppError({
        message: authDecision.reason,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const priority: TaskPriorityLevel = input.priority || def.defaultPriority;
    const slaMinutes = def.slaMinutesByPriority[priority] || 60;
    const instanceId = `WFI-${def.department}-${crypto.randomUUID()}`;

    const instance: UniversalWorkflowInstance = {
      workflowInstanceId: instanceId,
      workflowDefinitionId: def.code,
      workflowCode: def.code,
      workflowVersionId: `${def.code}_v${def.version}`,
      workflowVersion: def.version, // Bound permanently to this version!
      partnerId,
      locationId,
      departmentId,
      patientId: input.patientId,
      encounterId: input.encounterId,
      orderId: input.orderId || null,
      createdBy: session.userId,
      assignedTo: input.assignedTo || null,
      currentState: input.assignedTo ? 'ASSIGNED' : 'QUEUED',
      currentStage: def.stages[0] || 'Initiated',
      priority,
      sla: this.buildSlaRecord(slaMinutes, nowMs),
      versionLock: 1,
      tasks: [],
      handoffs: [],
      exceptions: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
      verifiedAt: null,
      closedAt: null,
      contextData: input.contextData || {}
    };

    this.instances.set(instanceId, instance);

    // Create authoritative initial task for this workflow
    const initialTask = await this.createTask(
      session,
      {
        workflowInstanceId: instanceId,
        taskType: input.initialTaskType || `${def.department}_${(def.stages[0] || 'INITIAL').toUpperCase().replace(/\s+/g, '_')}`,
        stageName: def.stages[0] || 'Initial Stage',
        priority,
        ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
        queueType: input.assignedTo ? 'STAFF' : 'DEPARTMENT'
      },
      true
    );

    await this.recordWorkflowAudit({
      who: session.userId,
      what: 'WORKFLOW_CREATED',
      patientId: instance.patientId,
      partnerId: instance.partnerId,
      locationId: instance.locationId,
      departmentId: instance.departmentId,
      previousState: null,
      newState: instance.currentState,
      reason: `Created ${def.name} (v${def.version})`,
      source: 'UniversalHealthcareWorkflowEngine',
      workflowInstanceId: instanceId,
      taskId: initialTask.taskId,
      entityType: 'WORKFLOW_INSTANCE',
      entityId: instanceId
    });

    await this.emitWorkflowEvent(partnerId, 'WORKFLOW_CREATED', {
      workflowInstanceId: instanceId,
      workflowCode: def.code,
      workflowVersion: def.version,
      patientId: instance.patientId,
      encounterId: instance.encounterId,
      departmentId: instance.departmentId,
      locationId: instance.locationId
    });

    // Persist to PostgreSQL workflow_instances when DB is connected
    const db = getDatabase();
    if (db) {
      try {
        const tenantUuid = toDeterministicUuid(partnerId);
        await db
          .insert(workflowInstances)
          .values({
            id: crypto.randomUUID(),
            tenantId: tenantUuid,
            workflowId: crypto.randomUUID(),
            workflowCode: def.code,
            workflowVersion: def.version,
            organizationType: 'HEALTHCARE_PARTNER',
            entityId: instance.patientId,
            entityName: `Patient ${instance.patientId} - Encounter ${instance.encounterId}`,
            currentStageId: crypto.randomUUID(),
            currentStageCode: instance.currentState,
            currentStageName: instance.currentStage,
            status: instance.currentState,
            contextData: instance as any
          })
          .catch(() => {});
      } catch {}
    }

    const response = { instance, initialTask };
    this.saveIdempotency(partnerId, input.idempotencyKey, input, response);
    return response;
  }

  public async createTask(
    session: SessionContext,
    input: {
      workflowInstanceId: string;
      taskType: string;
      stageName?: string;
      priority?: TaskPriorityLevel;
      assignedTo?: string;
      assignedRole?: string;
      queueType?: QueueCategory;
      idempotencyKey?: string;
      metadata?: Record<string, unknown>;
    },
    skipAuthCheck = false
  ): Promise<UniversalWorkflowTask> {
    const instance = this.instances.get(input.workflowInstanceId);
    if (!instance) {
      throw AppError.notFound(`Workflow instance "${input.workflowInstanceId}" not found`);
    }

    if (!session.isSuperAdmin && instance.partnerId !== session.tenantId) {
      throw new AppError({
        message: 'Cross-tenant workflow task creation is strictly forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const cached = this.checkIdempotency<UniversalWorkflowTask>(instance.partnerId, input.idempotencyKey, input);
    if (cached) {
      return cached;
    }

    if (!skipAuthCheck) {
      const authDecision = await identitySecurityFoundationService.authorize(session, 'ENCOUNTER:READ', {
        partnerId: instance.partnerId,
        locationId: instance.locationId,
        departmentId: instance.departmentId,
        patientId: instance.patientId,
        encounterId: instance.encounterId
      });
      if (!authDecision.allowed) {
        throw AppError.forbidden(authDecision.reason);
      }
    }

    const def = this.resolveDefinitionVersion(instance.workflowCode, instance.workflowVersion);
    const priority = input.priority || instance.priority;
    const slaMinutes = def.slaMinutesByPriority[priority] || 60;
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const taskId = `TSK-${instance.departmentId}-${crypto.randomUUID()}`;
    const sla = this.buildSlaRecord(slaMinutes, nowMs);

    const task: UniversalWorkflowTask = {
      taskId,
      workflowInstanceId: instance.workflowInstanceId,
      workflowCode: instance.workflowCode,
      workflowVersion: instance.workflowVersion,
      taskType: input.taskType,
      stageName: input.stageName || instance.currentStage,
      partnerId: instance.partnerId,
      locationId: instance.locationId,
      departmentId: instance.departmentId,
      patientId: instance.patientId,
      encounterId: instance.encounterId,
      orderId: instance.orderId,
      createdBy: session.userId,
      assignedTo: input.assignedTo || null,
      assignedRole: input.assignedRole || null,
      queueType: input.queueType || (input.assignedTo ? 'STAFF' : 'DEPARTMENT'),
      priority,
      sla,
      state: input.assignedTo ? 'ASSIGNED' : 'QUEUED',
      versionLock: 1,
      dueTime: new Date(sla.dueAtMs).toISOString(),
      startedTime: null,
      completedTime: null,
      verifiedTime: null,
      closedTime: null,
      failureReason: null,
      assignmentHistory: input.assignedTo
        ? [
            {
              assignmentId: crypto.randomUUID(),
              previousAssignee: null,
              newAssignee: input.assignedTo,
              changedBy: session.userId,
              changedAt: nowIso,
              mode: 'MANUAL',
              reason: 'Initial task assignment'
            }
          ]
        : [],
      metadata: input.metadata || {},
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.tasks.set(taskId, task);
    if (!instance.tasks.includes(taskId)) {
      instance.tasks.push(taskId);
    }

    await this.recordWorkflowAudit({
      who: session.userId,
      what: 'TASK_CREATED',
      patientId: task.patientId,
      partnerId: task.partnerId,
      locationId: task.locationId,
      departmentId: task.departmentId,
      previousState: null,
      newState: task.state,
      reason: `Created task ${task.taskType}`,
      source: 'UniversalTaskEngine',
      workflowInstanceId: instance.workflowInstanceId,
      taskId: task.taskId,
      entityType: 'WORKFLOW_TASK',
      entityId: task.taskId
    });

    await this.emitWorkflowEvent(instance.partnerId, 'TASK_CREATED', {
      taskId: task.taskId,
      workflowInstanceId: task.workflowInstanceId,
      taskType: task.taskType,
      priority: task.priority
    });

    this.saveIdempotency(instance.partnerId, input.idempotencyKey, input, task);
    return task;
  }

  // =========================================================================
  // STEP 3 — UNIVERSAL STATE MACHINE TRANSITIONS (TASK & WORKFLOW)
  // =========================================================================

  public async transitionTask(
    session: SessionContext,
    taskId: string,
    input: {
      transitionCode: string;
      expectedVersionLock?: number;
      nextStageName?: string;
      reason?: string;
      idempotencyKey?: string;
    }
  ): Promise<{ task: UniversalWorkflowTask; instance: UniversalWorkflowInstance }> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw AppError.notFound(`Task "${taskId}" not found`);
    }
    const instance = this.instances.get(task.workflowInstanceId)!;

    // Tenant Isolation
    if (!session.isSuperAdmin && task.partnerId !== session.tenantId) {
      throw new AppError({
        message: 'Cross-tenant workflow transition is strictly forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const cached = this.checkIdempotency<{ task: UniversalWorkflowTask; instance: UniversalWorkflowInstance }>(
      task.partnerId,
      input.idempotencyKey,
      { taskId, ...input }
    );
    if (cached) {
      return cached;
    }

    // Optimistic Concurrency / Stale State Protection
    if (
      input.expectedVersionLock !== undefined &&
      Number(input.expectedVersionLock) !== task.versionLock
    ) {
      throw new AppError({
        message: `Stale state / concurrent modification detected: expected versionLock ${input.expectedVersionLock}, actual is ${task.versionLock}.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    // Resolve bound workflow definition version (NOT latest version if upgraded!)
    const def = this.resolveDefinitionVersion(task.workflowCode, task.workflowVersion);
    const tCodeUpper = String(input.transitionCode || '').toUpperCase().trim();
    const rule = def.transitions.find((t) => t.transitionCode === tCodeUpper);

    if (!rule) {
      throw new AppError({
        message: `Invalid transition code "${input.transitionCode}" for workflow ${def.code} v${def.version}`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    if (!rule.fromStates.includes(task.state)) {
      throw new AppError({
        message: `Invalid state transition: cannot execute "${tCodeUpper}" (-> ${rule.toState}) from current state "${task.state}". Allowed source states: [${rule.fromStates.join(', ')}]`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    if (rule.requiresReason && (!input.reason || input.reason.trim().length < 3)) {
      throw new AppError({
        message: `Transition "${tCodeUpper}" requires an explicit reason.`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    // Verify RBAC + ABAC + Staff Status + Credential Status + Scope via Phase 3 authorize()
    const authDecision = await identitySecurityFoundationService.authorize(
      session,
      rule.requiredPermission,
      {
        partnerId: task.partnerId,
        locationId: task.locationId,
        departmentId: this.getScopedDepartmentForAuth(session, task.departmentId),
        patientId: task.patientId,
        encounterId: task.encounterId
      },
      {
        requireValidCredential: Boolean(rule.requiresValidCredential)
      }
    );

    if (!authDecision.allowed) {
      throw new AppError({
        message: authDecision.reason,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const previousState = task.state;
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    task.state = rule.toState;
    task.versionLock += 1;
    task.updatedAt = nowIso;

    if (input.nextStageName) {
      task.stageName = input.nextStageName;
      instance.currentStage = input.nextStageName;
    } else if (rule.toState === 'IN_PROGRESS') {
      const idx = def.stages.indexOf(instance.currentStage);
      if (idx >= 0 && idx + 1 < def.stages.length) {
        instance.currentStage = def.stages[idx + 1]!;
        task.stageName = instance.currentStage;
      }
    }

    // SLA Pause / Resume handling
    if (rule.toState === 'ON_HOLD' || rule.toState === 'BLOCKED') {
      if (!task.sla.pausedAtMs) {
        task.sla.pausedAtMs = nowMs;
        task.sla.status = 'PAUSED';
      }
    } else if (previousState === 'ON_HOLD' || previousState === 'BLOCKED') {
      if (task.sla.pausedAtMs) {
        const pausedDelta = Math.max(0, nowMs - task.sla.pausedAtMs);
        task.sla.accumulatedPausedMs += pausedDelta;
        task.sla.dueAtMs += pausedDelta;
        task.sla.warningAtMs += pausedDelta;
        task.sla.pausedAtMs = null;
        task.sla.status = 'ON_TRACK';
        task.dueTime = new Date(task.sla.dueAtMs).toISOString();
      }
    }

    if (rule.toState === 'IN_PROGRESS' && !task.startedTime) {
      task.startedTime = nowIso;
    } else if (rule.toState === 'COMPLETED') {
      task.completedTime = nowIso;
      instance.completedAt = nowIso;
    } else if (rule.toState === 'VERIFIED') {
      task.verifiedTime = nowIso;
      instance.verifiedAt = nowIso;
    } else if (rule.toState === 'CLOSED') {
      task.closedTime = nowIso;
      instance.closedAt = nowIso;
    }

    instance.currentState = rule.toState;
    instance.versionLock += 1;
    instance.updatedAt = nowIso;

    await this.recordWorkflowAudit({
      who: session.userId,
      what: `TASK_TRANSITION_${tCodeUpper}`,
      patientId: task.patientId,
      partnerId: task.partnerId,
      locationId: task.locationId,
      departmentId: task.departmentId,
      previousState,
      newState: rule.toState,
      reason: input.reason || `Transitioned via ${tCodeUpper}`,
      source: 'UniversalStateMachine',
      workflowInstanceId: instance.workflowInstanceId,
      taskId: task.taskId,
      entityType: 'WORKFLOW_TASK',
      entityId: task.taskId
    });

    const eventName =
      rule.toState === 'IN_PROGRESS'
        ? 'TASK_STARTED'
        : rule.toState === 'COMPLETED'
        ? 'TASK_COMPLETED'
        : rule.toState === 'VERIFIED'
        ? 'TASK_VERIFIED'
        : rule.toState === 'CLOSED'
        ? 'WORKFLOW_CLOSED'
        : `TASK_${rule.toState}`;

    await this.emitWorkflowEvent(task.partnerId, eventName, {
      taskId: task.taskId,
      workflowInstanceId: instance.workflowInstanceId,
      previousState,
      newState: rule.toState
    });

    const res = { task, instance };
    this.saveIdempotency(task.partnerId, input.idempotencyKey, { taskId, ...input }, res);
    return res;
  }

  // =========================================================================
  // STEP 7 — UNIVERSAL QUEUE ENGINE
  // =========================================================================

  public async queryQueue(
    session: SessionContext,
    query: {
      queueType?: QueueCategory;
      departmentId?: string;
      locationId?: string;
      role?: string;
      priority?: TaskPriorityLevel;
      assignedTo?: string;
    }
  ): Promise<UniversalWorkflowTask[]> {
    const targetLocation = query.locationId || session.branchId;
    const targetDept = query.departmentId || session.departmentId;

    const authDecision = await identitySecurityFoundationService.authorize(session, 'PATIENT:READ', {
      partnerId: session.tenantId,
      locationId: targetLocation,
      departmentId: this.getScopedDepartmentForAuth(session, targetDept)
    });

    if (!authDecision.allowed) {
      throw new AppError({
        message: authDecision.reason,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const allTasks = Array.from(this.tasks.values()).filter((t) => {
      // Strict Partner Isolation
      if (!session.isSuperAdmin && t.partnerId !== session.tenantId) return false;
      // Strict Location Isolation
      if (targetLocation && t.locationId !== targetLocation) return false;
      // Strict Department Isolation
      if (targetDept && t.departmentId.toUpperCase() !== targetDept.toUpperCase()) return false;
      if (query.queueType && t.queueType !== query.queueType) return false;
      if (query.priority && t.priority !== query.priority) return false;
      if (query.assignedTo && t.assignedTo !== query.assignedTo) return false;
      if (query.role && t.assignedRole && t.assignedRole.toUpperCase() !== query.role.toUpperCase()) return false;
      return !['CLOSED', 'CANCELLED'].includes(t.state);
    });

    // Sort deterministically by Priority Rank DESC, then Due Time ASC
    allTasks.sort((a, b) => {
      const rankDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (rankDiff !== 0) return rankDiff;
      return a.sla.dueAtMs - b.sla.dueAtMs;
    });

    return allTasks;
  }

  // =========================================================================
  // STEP 8 — TASK ASSIGNMENT ENGINE (ELIGIBILITY + AUDIT HISTORY)
  // =========================================================================

  public async assignTask(
    session: SessionContext,
    taskId: string,
    input: {
      newAssignee: string | null;
      assigneePartnerId?: string;
      assigneeLocationId?: string;
      assigneeDepartmentId?: string;
      assigneeRole?: string;
      assigneeStaffStatus?: StaffLifecycleStatus;
      assigneeCredentialStatus?: CredentialLifecycleStatus;
      requireValidCredential?: boolean;
      mode?: AssignmentMode;
      reason: string;
      idempotencyKey?: string;
    }
  ): Promise<UniversalWorkflowTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw AppError.notFound(`Task "${taskId}" not found`);
    }

    if (!session.isSuperAdmin && task.partnerId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant task assignment is strictly forbidden');
    }

    const cached = this.checkIdempotency<UniversalWorkflowTask>(task.partnerId, input.idempotencyKey, { taskId, ...input });
    if (cached) return cached;

    // Validate caller authorization
    const callerAuth = await identitySecurityFoundationService.authorize(session, 'ENCOUNTER:READ', {
      partnerId: task.partnerId,
      locationId: task.locationId,
      departmentId: this.getScopedDepartmentForAuth(session, task.departmentId)
    });
    if (!callerAuth.allowed) {
      throw AppError.forbidden(callerAuth.reason);
    }

    // Validate Assignee Eligibility (Do NOT assign to disabled/inactive staff, expired credentials, wrong partner/location/department)
    if (input.newAssignee) {
      if (input.assigneePartnerId && input.assigneePartnerId !== task.partnerId) {
        throw new AppError({
          message: 'Assignee eligibility failure: cannot assign task to staff belonging to another partner.',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
      if (input.assigneeLocationId && input.assigneeLocationId !== task.locationId) {
        throw new AppError({
          message: `Assignee eligibility failure: staff belongs to location "${input.assigneeLocationId}", task is at "${task.locationId}".`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
      if (
        input.assigneeDepartmentId &&
        input.assigneeDepartmentId.toUpperCase() !== task.departmentId.toUpperCase()
      ) {
        throw new AppError({
          message: `Assignee eligibility failure: staff belongs to department "${input.assigneeDepartmentId}", task requires "${task.departmentId}".`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
      if (input.assigneeStaffStatus && input.assigneeStaffStatus !== 'ACTIVE') {
        throw new AppError({
          message: `Assignee eligibility failure: target staff status is ${input.assigneeStaffStatus}.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
      if (
        (input.requireValidCredential || input.assigneeCredentialStatus) &&
        input.assigneeCredentialStatus &&
        input.assigneeCredentialStatus !== 'VALID'
      ) {
        throw new AppError({
          message: `Assignee eligibility failure: target staff credential status is ${input.assigneeCredentialStatus}.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    const previousAssignee = task.assignedTo;
    const nowIso = new Date().toISOString();
    const mode: AssignmentMode =
      input.mode || (input.newAssignee === null ? 'UNASSIGNMENT' : previousAssignee ? 'REASSIGNMENT' : 'MANUAL');

    task.assignedTo = input.newAssignee;
    if (input.assigneeRole) {
      task.assignedRole = input.assigneeRole;
    }
    task.state = input.newAssignee ? 'ASSIGNED' : 'QUEUED';
    task.queueType = input.newAssignee ? 'STAFF' : 'DEPARTMENT';
    task.versionLock += 1;
    task.updatedAt = nowIso;

    const historyEntry: TaskAssignmentHistoryItem = {
      assignmentId: crypto.randomUUID(),
      previousAssignee,
      newAssignee: input.newAssignee,
      changedBy: session.userId,
      changedAt: nowIso,
      mode,
      reason: input.reason || 'Task assignment updated'
    };
    task.assignmentHistory.push(historyEntry);

    const instance = this.instances.get(task.workflowInstanceId);
    if (instance) {
      instance.assignedTo = input.newAssignee;
      instance.updatedAt = nowIso;
    }

    await this.recordWorkflowAudit({
      who: session.userId,
      what: `TASK_${mode}`,
      patientId: task.patientId,
      partnerId: task.partnerId,
      locationId: task.locationId,
      departmentId: task.departmentId,
      previousState: previousAssignee || 'UNASSIGNED',
      newState: input.newAssignee || 'UNASSIGNED',
      reason: historyEntry.reason,
      source: 'UniversalAssignmentEngine',
      workflowInstanceId: task.workflowInstanceId,
      taskId: task.taskId,
      entityType: 'TASK_ASSIGNMENT',
      entityId: historyEntry.assignmentId
    });

    await this.emitWorkflowEvent(task.partnerId, 'TASK_ASSIGNED', {
      taskId: task.taskId,
      previousAssignee,
      newAssignee: input.newAssignee,
      mode
    });

    this.saveIdempotency(task.partnerId, input.idempotencyKey, { taskId, ...input }, task);
    return task;
  }

  // =========================================================================
  // STEP 9 — PRIORITY ENGINE
  // =========================================================================

  public async updateTaskPriority(
    session: SessionContext,
    taskId: string,
    input: {
      priority: TaskPriorityLevel;
      reason: string;
    }
  ): Promise<UniversalWorkflowTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw AppError.notFound(`Task "${taskId}" not found`);
    }
    if (!PRIORITY_RANK[input.priority]) {
      throw AppError.badRequest(`Invalid priority level "${input.priority}"`);
    }
    if (!input.reason || input.reason.trim().length < 3) {
      throw AppError.badRequest('Reason is mandatory for priority override');
    }

    const authDecision = await identitySecurityFoundationService.authorize(session, 'ENCOUNTER:UPDATE', {
      partnerId: task.partnerId,
      locationId: task.locationId,
      departmentId: this.getScopedDepartmentForAuth(session, task.departmentId),
      patientId: task.patientId,
      encounterId: task.encounterId
    });
    if (!authDecision.allowed) {
      throw AppError.forbidden('Unauthorized priority override attempt blocked');
    }

    const oldPriority = task.priority;
    const def = this.resolveDefinitionVersion(task.workflowCode, task.workflowVersion);
    const newSlaMins = def.slaMinutesByPriority[input.priority] || 60;

    task.priority = input.priority;
    task.sla = this.buildSlaRecord(newSlaMins, task.sla.startedAtMs);
    task.dueTime = new Date(task.sla.dueAtMs).toISOString();
    task.updatedAt = new Date().toISOString();

    await this.recordWorkflowAudit({
      who: session.userId,
      what: 'TASK_PRIORITY_CHANGED',
      patientId: task.patientId,
      partnerId: task.partnerId,
      locationId: task.locationId,
      departmentId: task.departmentId,
      previousState: oldPriority,
      newState: input.priority,
      reason: input.reason,
      source: 'UniversalPriorityEngine',
      workflowInstanceId: task.workflowInstanceId,
      taskId: task.taskId,
      entityType: 'TASK_PRIORITY',
      entityId: task.taskId
    });

    return task;
  }

  // =========================================================================
  // STEP 10 & STEP 11 — SLA ENGINE & ESCALATION ENGINE
  // =========================================================================

  public async evaluateTaskSLAAndEscalate(
    session: SessionContext,
    taskId: string,
    options?: {
      simulatedElapsedMinutes?: number;
      clientSuppliedTimestamp?: string;
    }
  ): Promise<{
    task: UniversalWorkflowTask;
    slaStatus: TaskSLARecord['status'];
    escalation: WorkflowEscalationRecord | null;
  }> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw AppError.notFound(`Task "${taskId}" not found`);
    }

    if (!session.isSuperAdmin && task.partnerId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant SLA evaluation is forbidden');
    }

    // Reject client-supplied clock tampering
    if (options?.clientSuppliedTimestamp) {
      throw new AppError({
        message: 'Security policy violation: Client-side SLA clock manipulation is strictly forbidden. Only server-side timestamps are authoritative.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    if (task.sla.status === 'PAUSED') {
      return { task, slaStatus: 'PAUSED', escalation: null };
    }

    const evalTimeMs =
      options?.simulatedElapsedMinutes !== undefined
        ? task.sla.startedAtMs + options.simulatedElapsedMinutes * 60 * 1000
        : Date.now();

    let escalation: WorkflowEscalationRecord | null = null;

    if (evalTimeMs >= task.sla.dueAtMs) {
      task.sla.status = 'BREACHED';
      task.queueType = 'ESCALATION';
      escalation = await this.escalateTask(session, taskId, {
        trigger: 'SLA_BREACH',
        toTier: 'DEPARTMENT_HEAD',
        reason: `Task SLA breached (${task.sla.slaMinutes} minutes exceeded)`
      });
    } else if (evalTimeMs >= task.sla.warningAtMs) {
      task.sla.status = 'WARNING';
      escalation = await this.escalateTask(session, taskId, {
        trigger: 'SLA_WARNING',
        toTier: 'SENIOR_STAFF',
        reason: `Task SLA warning threshold (${task.sla.warningThresholdMinutes} minutes) reached`
      });
    } else {
      task.sla.status = 'ON_TRACK';
    }

    return {
      task,
      slaStatus: task.sla.status,
      escalation
    };
  }

  public async escalateTask(
    session: SessionContext,
    taskId: string,
    input: {
      trigger: EscalationTriggerType;
      fromTier?: EscalationTier;
      toTier: EscalationTier;
      reason: string;
    }
  ): Promise<WorkflowEscalationRecord> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw AppError.notFound(`Task "${taskId}" not found`);
    }

    if (!session.isSuperAdmin && task.partnerId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant escalation is strictly forbidden');
    }

    const record: WorkflowEscalationRecord = {
      escalationId: `ESC-${crypto.randomUUID()}`,
      workflowInstanceId: task.workflowInstanceId,
      taskId: task.taskId,
      partnerId: task.partnerId,
      locationId: task.locationId,
      departmentId: task.departmentId,
      trigger: input.trigger,
      fromTier: input.fromTier || 'STAFF',
      toTier: input.toTier,
      reason: input.reason,
      escalatedBy: session.userId,
      escalatedAt: new Date().toISOString()
    };

    this.escalations.set(record.escalationId, record);
    task.queueType = 'ESCALATION';

    await this.recordWorkflowAudit({
      who: session.userId,
      what: `TASK_ESCALATED_${input.trigger}`,
      patientId: task.patientId,
      partnerId: task.partnerId,
      locationId: task.locationId,
      departmentId: task.departmentId,
      previousState: record.fromTier,
      newState: record.toTier,
      reason: input.reason,
      source: 'UniversalEscalationEngine',
      workflowInstanceId: task.workflowInstanceId,
      taskId: task.taskId,
      entityType: 'TASK_ESCALATION',
      entityId: record.escalationId
    });

    await this.emitWorkflowEvent(
      task.partnerId,
      input.trigger === 'SLA_BREACH' ? 'SLA_BREACHED' : input.trigger === 'SLA_WARNING' ? 'SLA_WARNING' : 'TASK_ESCALATED',
      record as unknown as Record<string, unknown>
    );

    return record;
  }

  // =========================================================================
  // STEP 12 — EXCEPTION ENGINE
  // =========================================================================

  public async recordException(
    session: SessionContext,
    input: {
      workflowInstanceId: string;
      taskId?: string;
      type: WorkflowExceptionType;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      reason: string;
    }
  ): Promise<WorkflowExceptionRecord> {
    const instance = this.instances.get(input.workflowInstanceId);
    if (!instance) {
      throw AppError.notFound(`Workflow instance "${input.workflowInstanceId}" not found`);
    }
    if (!session.isSuperAdmin && instance.partnerId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant exception creation is forbidden');
    }

    const record: WorkflowExceptionRecord = {
      exceptionId: `EXC-${crypto.randomUUID()}`,
      workflowInstanceId: instance.workflowInstanceId,
      taskId: input.taskId || null,
      partnerId: instance.partnerId,
      type: input.type,
      severity: input.severity,
      reason: input.reason,
      createdBy: session.userId,
      createdAt: new Date().toISOString(),
      status: 'OPEN',
      resolution: null,
      resolvedBy: null,
      resolvedAt: null
    };

    this.exceptions.set(record.exceptionId, record);
    instance.exceptions.push(record.exceptionId);
    instance.currentState = 'EXCEPTION';

    if (input.taskId) {
      const task = this.tasks.get(input.taskId);
      if (task) {
        task.state = 'EXCEPTION';
        task.queueType = 'EXCEPTION';
        task.failureReason = input.reason;
      }
    }

    await this.recordWorkflowAudit({
      who: session.userId,
      what: `EXCEPTION_CREATED_${input.type}`,
      patientId: instance.patientId,
      partnerId: instance.partnerId,
      locationId: instance.locationId,
      departmentId: instance.departmentId,
      previousState: 'IN_PROGRESS',
      newState: 'EXCEPTION',
      reason: input.reason,
      source: 'UniversalExceptionEngine',
      workflowInstanceId: instance.workflowInstanceId,
      taskId: input.taskId || null,
      entityType: 'WORKFLOW_EXCEPTION',
      entityId: record.exceptionId
    });

    await this.emitWorkflowEvent(instance.partnerId, 'EXCEPTION_CREATED', record as unknown as Record<string, unknown>);
    return record;
  }

  public async resolveException(
    session: SessionContext,
    exceptionId: string,
    resolution: string
  ): Promise<WorkflowExceptionRecord> {
    const rec = this.exceptions.get(exceptionId);
    if (!rec) {
      throw AppError.notFound(`Exception "${exceptionId}" not found`);
    }
    if (!session.isSuperAdmin && rec.partnerId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant exception resolution is forbidden');
    }

    rec.status = 'RESOLVED';
    rec.resolution = resolution;
    rec.resolvedBy = session.userId;
    rec.resolvedAt = new Date().toISOString();

    const instance = this.instances.get(rec.workflowInstanceId);
    if (instance) {
      instance.currentState = 'IN_PROGRESS';
      if (rec.taskId) {
        const task = this.tasks.get(rec.taskId);
        if (task) {
          task.state = 'IN_PROGRESS';
          task.queueType = 'DEPARTMENT';
        }
      }
    }

    return rec;
  }

  // =========================================================================
  // STEP 13 — DEPARTMENT HANDOFF ENGINE
  // =========================================================================

  public async requestDepartmentHandoff(
    session: SessionContext,
    input: {
      sourceWorkflowId: string;
      destinationDepartment: string;
      orderId?: string;
      reason: string;
      payload?: Record<string, unknown>;
      idempotencyKey?: string;
    }
  ): Promise<WorkflowHandoffRecord> {
    const sourceInst = this.instances.get(input.sourceWorkflowId);
    if (!sourceInst) {
      throw AppError.notFound(`Source workflow "${input.sourceWorkflowId}" not found`);
    }

    if (!session.isSuperAdmin && sourceInst.partnerId !== session.tenantId) {
      throw new AppError({
        message: 'Cross-tenant department handoff is strictly forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const cached = this.checkIdempotency<WorkflowHandoffRecord>(sourceInst.partnerId, input.idempotencyKey, input);
    if (cached) return cached;

    const authDecision = await identitySecurityFoundationService.authorize(session, 'ENCOUNTER:READ', {
      partnerId: sourceInst.partnerId,
      locationId: sourceInst.locationId,
      departmentId: sourceInst.departmentId,
      patientId: sourceInst.patientId,
      encounterId: sourceInst.encounterId
    });
    if (!authDecision.allowed) {
      throw AppError.forbidden(authDecision.reason);
    }

    const destDept = input.destinationDepartment.toUpperCase().trim();
    const nowIso = new Date().toISOString();

    const handoff: WorkflowHandoffRecord = {
      handoffId: `HND-${sourceInst.departmentId}-TO-${destDept}-${crypto.randomUUID()}`,
      partnerId: sourceInst.partnerId,
      locationId: sourceInst.locationId,
      patientId: sourceInst.patientId,
      encounterId: sourceInst.encounterId,
      orderId: input.orderId || sourceInst.orderId || `ORD-${Date.now()}`,
      sourceDepartment: sourceInst.departmentId,
      destinationDepartment: destDept,
      sourceWorkflowId: sourceInst.workflowInstanceId,
      destinationWorkflowId: null,
      destinationTaskId: null,
      initiator: session.userId,
      acceptedBy: null,
      timestamp: nowIso,
      updatedAt: nowIso,
      reason: input.reason,
      payload: input.payload || {},
      status: 'HANDOFF_REQUESTED'
    };

    this.handoffs.set(handoff.handoffId, handoff);
    sourceInst.handoffs.push(handoff.handoffId);

    await this.recordWorkflowAudit({
      who: session.userId,
      what: 'HANDOFF_REQUESTED',
      patientId: handoff.patientId,
      partnerId: handoff.partnerId,
      locationId: handoff.locationId,
      departmentId: handoff.sourceDepartment,
      previousState: null,
      newState: 'HANDOFF_REQUESTED',
      reason: `${handoff.sourceDepartment} -> ${handoff.destinationDepartment}: ${handoff.reason}`,
      source: 'UniversalHandoffEngine',
      workflowInstanceId: sourceInst.workflowInstanceId,
      taskId: null,
      entityType: 'WORKFLOW_HANDOFF',
      entityId: handoff.handoffId
    });

    await this.emitWorkflowEvent(sourceInst.partnerId, 'HANDOFF_REQUESTED', handoff as unknown as Record<string, unknown>);
    this.saveIdempotency(sourceInst.partnerId, input.idempotencyKey, input, handoff);
    return handoff;
  }

  public async respondToDepartmentHandoff(
    session: SessionContext,
    handoffId: string,
    input: {
      action: 'ACCEPT' | 'REJECT' | 'CANCEL' | 'COMPLETE';
      reason?: string;
    }
  ): Promise<{
    handoff: WorkflowHandoffRecord;
    destinationWorkflow?: UniversalWorkflowInstance;
    destinationTask?: UniversalWorkflowTask;
  }> {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) {
      throw AppError.notFound(`Handoff "${handoffId}" not found`);
    }

    if (!session.isSuperAdmin && handoff.partnerId !== session.tenantId) {
      throw new AppError({
        message: 'Cross-tenant handoff acceptance/rejection is strictly forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const previousStatus = handoff.status;
    let destinationWorkflow: UniversalWorkflowInstance | undefined;
    let destinationTask: UniversalWorkflowTask | undefined;

    if (input.action === 'ACCEPT') {
      handoff.status = 'HANDOFF_ACCEPTED';
      handoff.acceptedBy = session.userId;

      // Spawn linked destination workflow & task preserving Patient -> Encounter -> Order continuity!
      const adapterKey = handoff.destinationDepartment === 'LAB' ? 'LIMS' : handoff.destinationDepartment;
      const spawned = await this.createWorkflowInstance(session, {
        workflowCodeOrDepartment: adapterKey,
        locationId: handoff.locationId,
        departmentId: handoff.destinationDepartment,
        patientId: handoff.patientId,
        encounterId: handoff.encounterId,
        ...(handoff.orderId ? { orderId: handoff.orderId } : {}),
        contextData: {
          parentHandoffId: handoff.handoffId,
          sourceWorkflowId: handoff.sourceWorkflowId,
          sourceDepartment: handoff.sourceDepartment
        }
      });

      destinationWorkflow = spawned.instance;
      destinationTask = spawned.initialTask;
      handoff.destinationWorkflowId = spawned.instance.workflowInstanceId;
      handoff.destinationTaskId = spawned.initialTask.taskId;
    } else if (input.action === 'REJECT') {
      handoff.status = 'HANDOFF_REJECTED';
    } else if (input.action === 'CANCEL') {
      handoff.status = 'HANDOFF_CANCELLED';
    } else if (input.action === 'COMPLETE') {
      handoff.status = 'HANDOFF_COMPLETED';
    }

    handoff.updatedAt = new Date().toISOString();

    await this.recordWorkflowAudit({
      who: session.userId,
      what: handoff.status,
      patientId: handoff.patientId,
      partnerId: handoff.partnerId,
      locationId: handoff.locationId,
      departmentId: handoff.destinationDepartment,
      previousState: previousStatus,
      newState: handoff.status,
      reason: input.reason || `Handoff ${input.action}`,
      source: 'UniversalHandoffEngine',
      workflowInstanceId: handoff.destinationWorkflowId || handoff.sourceWorkflowId,
      taskId: handoff.destinationTaskId,
      entityType: 'WORKFLOW_HANDOFF',
      entityId: handoff.handoffId
    });

    if (handoff.status === 'HANDOFF_ACCEPTED') {
      await this.emitWorkflowEvent(handoff.partnerId, 'HANDOFF_ACCEPTED', handoff as unknown as Record<string, unknown>);
    }

    return {
      handoff,
      ...(destinationWorkflow ? { destinationWorkflow } : {}),
      ...(destinationTask ? { destinationTask } : {})
    };
  }

  // =========================================================================
  // STEP 17 — TRANSACTION / SAGA ORCHESTRATOR
  // =========================================================================

  public async executeCrossDepartmentSaga(
    session: SessionContext,
    input: {
      patientId: string;
      encounterId: string;
      orderId: string;
      locationId?: string;
      steps: Array<{
        stepCode: string;
        department: string;
        description: string;
        compensationAction: string;
        simulateFailure?: boolean;
      }>;
      idempotencyKey?: string;
    }
  ): Promise<WorkflowSagaRecord> {
    if (!session || !session.tenantId) {
      throw AppError.unauthorized('Authentication required');
    }

    const partnerId = session.tenantId;
    const cached = this.checkIdempotency<WorkflowSagaRecord>(partnerId, input.idempotencyKey, input);
    if (cached) return cached;

    const locationId = input.locationId || session.branchId || 'loc-branch-a';
    const createdWf = await this.createWorkflowInstance(session, {
      workflowCodeOrDepartment: 'OPD',
      locationId,
      patientId: input.patientId,
      encounterId: input.encounterId,
      orderId: input.orderId
    });

    const sagaId = `SAGA-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();

    const saga: WorkflowSagaRecord = {
      sagaId,
      partnerId,
      locationId,
      patientId: input.patientId,
      encounterId: input.encounterId,
      orderId: input.orderId,
      workflowInstanceId: createdWf.instance.workflowInstanceId,
      status: 'IN_PROGRESS',
      steps: input.steps.map((s, idx) => ({
        stepIndex: idx + 1,
        stepCode: s.stepCode,
        department: s.department,
        description: s.description,
        status: 'PENDING',
        attempts: 0,
        error: null,
        compensationAction: s.compensationAction,
        executedAt: null,
        compensatedAt: null
      })),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.sagas.set(sagaId, saga);

    // Execute saga steps sequentially; if any step fails, trigger automatic compensation for prior completed steps!
    for (let i = 0; i < saga.steps.length; i++) {
      const step = saga.steps[i]!;
      const rawStepInput = input.steps[i]!;
      step.status = 'IN_PROGRESS';
      step.attempts += 1;

      if (rawStepInput.simulateFailure) {
        step.status = 'FAILED';
        step.error = `Step "${step.stepCode}" failed during execution in department ${step.department}`;
        saga.status = 'FAILED_COMPENSATING';

        // Compensate all previously completed steps in reverse order
        for (let j = i - 1; j >= 0; j--) {
          const prevStep = saga.steps[j]!;
          if (prevStep.status === 'COMPLETED') {
            prevStep.status = 'COMPENSATED';
            prevStep.compensatedAt = new Date().toISOString();
          }
        }
        saga.status = 'COMPENSATED';
        createdWf.instance.currentState = 'EXCEPTION';
        saga.updatedAt = new Date().toISOString();

        await this.recordWorkflowAudit({
          who: session.userId,
          what: 'SAGA_FAILED_AND_COMPENSATED',
          patientId: saga.patientId,
          partnerId: saga.partnerId,
          locationId: saga.locationId,
          departmentId: step.department,
          previousState: 'IN_PROGRESS',
          newState: 'COMPENSATED',
          reason: step.error,
          source: 'UniversalSagaOrchestrator',
          workflowInstanceId: saga.workflowInstanceId,
          taskId: null,
          entityType: 'WORKFLOW_SAGA',
          entityId: saga.sagaId
        });

        this.saveIdempotency(partnerId, input.idempotencyKey, input, saga);
        return saga;
      }

      step.status = 'COMPLETED';
      step.executedAt = new Date().toISOString();
    }

    saga.status = 'COMPLETED';
    saga.updatedAt = new Date().toISOString();
    this.saveIdempotency(partnerId, input.idempotencyKey, input, saga);
    return saga;
  }

  public async retryAndRecoverSaga(
    session: SessionContext,
    sagaId: string
  ): Promise<WorkflowSagaRecord> {
    const saga = this.sagas.get(sagaId);
    if (!saga) {
      throw AppError.notFound(`Saga "${sagaId}" not found`);
    }
    if (!session.isSuperAdmin && saga.partnerId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant saga recovery is forbidden');
    }

    for (const step of saga.steps) {
      if (step.status === 'FAILED' || step.status === 'COMPENSATED') {
        step.attempts += 1;
        step.status = 'RECOVERED';
        step.error = null;
        step.executedAt = new Date().toISOString();
      } else if (step.status === 'PENDING') {
        step.attempts += 1;
        step.status = 'COMPLETED';
        step.executedAt = new Date().toISOString();
      }
    }

    saga.status = 'RECOVERED';
    saga.updatedAt = new Date().toISOString();

    const inst = this.instances.get(saga.workflowInstanceId);
    if (inst) {
      inst.currentState = 'IN_PROGRESS';
    }

    await this.recordWorkflowAudit({
      who: session.userId,
      what: 'SAGA_RECOVERED_AND_RECONCILED',
      patientId: saga.patientId,
      partnerId: saga.partnerId,
      locationId: saga.locationId,
      departmentId: 'OPD',
      previousState: 'COMPENSATED',
      newState: 'RECOVERED',
      reason: 'Saga retried and reconciled to completion',
      source: 'UniversalSagaOrchestrator',
      workflowInstanceId: saga.workflowInstanceId,
      taskId: null,
      entityType: 'WORKFLOW_SAGA',
      entityId: saga.sagaId
    });

    return saga;
  }

  // =========================================================================
  // STEP 14 & STEP 15 — NOTIFICATION / EVENT ENGINE & IMMUTABLE AUDIT ENGINE
  // =========================================================================

  private async emitWorkflowEvent(
    partnerId: string,
    eventType: string,
    payload: Record<string, unknown>,
    simulateNotificationFailure = false
  ): Promise<void> {
    // Notification failure MUST NEVER change or corrupt workflow state (Step 14)
    try {
      if (simulateNotificationFailure) {
        throw new Error('Simulated external notification transport error');
      }
      const eventRecord = {
        eventId: crypto.randomUUID(),
        partnerId,
        eventType,
        payload,
        emittedAt: new Date().toISOString()
      };
      this.eventsEmitted.push(eventRecord);

      const db = getDatabase();
      if (db) {
        const tenantUuid = toDeterministicUuid(partnerId);
        await db
          .insert(outboxJobs)
          .values({
            id: eventRecord.eventId,
            tenantId: tenantUuid,
            jobType: `WORKFLOW_EVENT_${eventType}`,
            payload: eventRecord,
            status: 'PENDING',
            priority: 1
          })
          .catch(() => {});
      }
    } catch {
      // Isolated: notification failure does not fail the authoritative workflow transaction
    }
  }

  private async recordWorkflowAudit(entry: Omit<WorkflowAuditEntry, 'auditId' | 'when'>): Promise<WorkflowAuditEntry> {
    const fullEntry: WorkflowAuditEntry = Object.freeze({
      auditId: crypto.randomUUID(),
      when: new Date().toISOString(),
      ...entry
    });
    this.auditTrail.push(fullEntry);

    await identitySecurityFoundationService.recordSecurityAudit({
      actorUserId: entry.who,
      partnerId: entry.partnerId,
      role: 'WORKFLOW_ACTOR',
      action: `WORKFLOW:${entry.what}`,
      resourceType: entry.entityType,
      resourceId: entry.entityId,
      patientId: entry.patientId,
      departmentId: entry.departmentId,
      locationId: entry.locationId,
      decision: 'ALLOW',
      reasonCode: entry.what,
      before: entry.previousState ? { state: entry.previousState } : undefined,
      after: { state: entry.newState, reason: entry.reason }
    });

    return fullEntry;
  }

  public getWorkflowAuditTrail(
    session: SessionContext,
    filters?: { workflowInstanceId?: string; patientId?: string; taskId?: string }
  ): WorkflowAuditEntry[] {
    return this.auditTrail.filter((a) => {
      if (!session.isSuperAdmin && a.partnerId !== session.tenantId) return false;
      if (filters?.workflowInstanceId && a.workflowInstanceId !== filters.workflowInstanceId) return false;
      if (filters?.patientId && a.patientId !== filters.patientId) return false;
      if (filters?.taskId && a.taskId !== filters.taskId) return false;
      return true;
    });
  }

  public getWorkflowInstance(session: SessionContext, instanceId: string): UniversalWorkflowInstance {
    const inst = this.instances.get(instanceId);
    if (!inst) {
      throw AppError.notFound(`Workflow instance "${instanceId}" not found`);
    }
    if (!session.isSuperAdmin && inst.partnerId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant workflow instance access is forbidden');
    }
    return inst;
  }
}

export const universalHealthcareWorkflowEngineService = new UniversalHealthcareWorkflowEngineService();
