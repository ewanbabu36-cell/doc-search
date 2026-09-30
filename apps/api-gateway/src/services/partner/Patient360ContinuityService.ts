import crypto from 'node:crypto';
import type { SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode, normalizePhoneNumber } from '@docsearch/shared-core';
import {
  getDatabase,
  patients,
  encounters as clinicalEncounters,
  and,
  eq
} from '@docsearch/database';
import { clinicalWorkflowRepository } from '../../repositories/partner/ClinicalWorkflowRepository.js';
import { identitySecurityFoundationService } from '../security/IdentitySecurityFoundationService.js';
import { universalHealthcareWorkflowEngineService } from '../workflow/UniversalHealthcareWorkflowEngineService.js';

export type UniversalEntityNumberType =
  | 'PATIENT'
  | 'MRN'
  | 'ENCOUNTER'
  | 'VISIT'
  | 'APPOINTMENT'
  | 'TOKEN'
  | 'QUEUE_ENTRY'
  | 'ORDER'
  | 'TASK'
  | 'ACCESSION'
  | 'RESULT'
  | 'PRESCRIPTION'
  | 'DISPENSING'
  | 'INVOICE'
  | 'TRANSACTION'
  | 'DOCUMENT'
  | 'AUDIT';

export interface CanonicalPatientRecord {
  patientId: string;
  patientCode: string;
  mrn: string;
  tenantId: string;
  partnerId: string;
  branchId: string;
  legalName: string;
  displayName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  mobileNumber: string | null;
  email: string | null;
  address: string | null;
  emergencyContact: { name: string; phone: string; relation: string } | null;
  identityReferences: Array<{ type: string; referenceNumber: string }>;
  status: 'ACTIVE' | 'INACTIVE' | 'MERGED_DEPRECATED';
  version: number;
  mergedIntoPatientId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalAppointmentRecord {
  appointmentId: string;
  appointmentNumber: string;
  tenantId: string;
  partnerId: string;
  branchId: string;
  departmentId: string;
  patientId: string;
  mrn: string;
  doctorId: string;
  slotDate: string;
  slotTime: string;
  reason?: string;
  status: 'BOOKED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
  encounterId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalEncounterRecord {
  encounterId: string;
  encounterNumber: string;
  visitId: string;
  visitNumber: string;
  tenantId: string;
  partnerId: string;
  branchId: string;
  departmentId: string;
  patientId: string;
  mrn: string;
  appointmentId: string | null;
  staffId: string;
  encounterType:
    | 'OPD'
    | 'IPD'
    | 'EMERGENCY'
    | 'FOLLOW-UP'
    | 'FOLLOW_UP'
    | 'DIAGNOSTIC'
    | 'OTHER'
    | 'WALK_IN'
    | 'APPOINTMENT';
  visitType: 'FIRST_VISIT' | 'FOLLOW_UP' | 'WALK_IN' | 'EMERGENCY' | 'DIAGNOSTIC' | 'IPD';
  status:
    | 'CREATED'
    | 'OPEN'
    | 'IN_PROGRESS'
    | 'REGISTERED'
    | 'CHECKED_IN'
    | 'WAITING'
    | 'IN_CONSULTATION'
    | 'COMPLETED'
    | 'CLOSED'
    | 'EXITED'
    | 'CANCELLED';
  chiefComplaint: string;
  vitals: Record<string, unknown> | null;
  consultationNotes: string | null;
  diagnoses: Array<{ code: string; description: string }>;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface CanonicalTokenQueueRecord {
  tokenId: string;
  tokenNumber: string;
  queueEntryId: string;
  queueEntryNumber: string;
  tenantId: string;
  partnerId: string;
  branchId: string;
  departmentId: string;
  patientId: string;
  mrn: string;
  encounterId: string;
  appointmentId: string | null;
  staffId: string | null;
  queueDate: string;
  sequenceNumber: number;
  priority: 'ROUTINE' | 'URGENT' | 'STAT' | 'EMERGENCY' | 'CRITICAL';
  status: 'CREATED' | 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  history: Array<{
    fromStatus: string | null;
    toStatus: string;
    actorId: string;
    timestamp: string;
  }>;
  createdAt: string;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CanonicalOrderRecord {
  orderId: string;
  orderNumber: string;
  tenantId: string;
  partnerId: string;
  branchId: string;
  sourceDepartmentId: string;
  targetDepartmentId: string;
  patientId: string;
  mrn: string;
  encounterId: string;
  orderingStaffId: string;
  orderType: 'LAB' | 'RADIOLOGY' | 'PHARMACY' | 'PROCEDURE' | 'DIETARY' | 'BLOOD_BANK';
  itemCode: string;
  itemName: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT' | 'EMERGENCY' | 'CRITICAL';
  workflowInstanceId: string;
  taskId: string;
  accessionNumber: string | null;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'RESULTED' | 'VERIFIED' | 'DISPENSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalResultActionRecord {
  resultId: string;
  resultNumber: string;
  accessionNumber: string | null;
  tenantId: string;
  partnerId: string;
  departmentId: string;
  patientId: string;
  mrn: string;
  encounterId: string;
  orderId: string;
  taskId: string;
  performedByStaffId: string;
  verifiedByStaffId: string | null;
  resultType: 'LAB_RESULT' | 'RADIOLOGY_REPORT' | 'DOCTOR_REVIEW' | 'PRESCRIPTION' | 'PHARMACY_DISPENSING';
  status: 'PRELIMINARY' | 'VERIFIED' | 'DISPENSED' | 'AMENDED';
  summary: string;
  structuredValues: Record<string, unknown>;
  createdAt: string;
  verifiedAt: string | null;
}

export interface CanonicalTransactionRecord {
  transactionId: string;
  transactionNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  partnerId: string;
  departmentId: string;
  patientId: string;
  mrn: string;
  encounterId: string;
  sourceEntityType: 'ENCOUNTER' | 'ORDER' | 'PRESCRIPTION' | 'DISPENSING';
  sourceEntityId: string;
  amount: number;
  currency: string;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod: string;
  recordedByStaffId: string;
  createdAt: string;
  paidAt: string | null;
}

export interface CanonicalDocumentRecord {
  documentId: string;
  documentNumber: string;
  tenantId: string;
  partnerId: string;
  departmentId: string;
  patientId: string;
  mrn: string;
  encounterId: string;
  sourceEntityType: 'LAB_REPORT' | 'RADIOLOGY_REPORT' | 'PRESCRIPTION' | 'DISCHARGE_SUMMARY' | 'CLINICAL_ATTACHMENT';
  sourceEntityId: string;
  orderId: string | null;
  resultId: string | null;
  title: string;
  fileName: string;
  storageUri: string;
  mimeType: string;
  uploadedByStaffId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataLineageRecord {
  lineageId: string;
  auditId: string;
  who: string;
  what: string;
  patientId: string;
  mrn: string;
  partnerId: string;
  departmentId: string;
  when: string;
  sourceType: string;
  sourceId: string;
  state: string;
  previousState: string | null;
  newState: string;
  relatedEncounterId: string | null;
  relatedStaffId: string;
  relatedOrderId: string | null;
  relatedTaskId: string | null;
  relatedResultId: string | null;
  relatedTransactionId: string | null;
  relatedDocumentId: string | null;
  nextDepartment: string | null;
}

export interface PatientTimelineEvent {
  eventId: string;
  patientId: string;
  mrn: string;
  tenantId: string;
  partnerId: string;
  locationId: string;
  encounterId: string | null;
  sourceType: string;
  sourceId: string;
  source: string;
  entityId: string;
  departmentId: string;
  department: string;
  staffId: string;
  actor: string;
  timestamp: string;
  occurredAt: string;
  recordedAt: string;
  eventType: string;
  status: string;
  summary: string;
}

export interface Patient360ReadModel {
  projectionVersion: number;
  generatedAt: string;
  zeroState: boolean;
  identity: CanonicalPatientRecord;
  demographics: {
    patientId: string;
    mrn: string;
    patientCode: string;
    legalName: string;
    displayName: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    sex: string;
    status: CanonicalPatientRecord['status'];
  };
  contact: {
    mobileNumber: string | null;
    email: string | null;
    address: string | null;
    emergencyContact: CanonicalPatientRecord['emergencyContact'];
  };
  partnerLocation: {
    tenantId: string;
    partnerId: string;
    branchId: string;
    locationId: string;
  };
  activeEncounters: CanonicalEncounterRecord[];
  historicalEncounters: CanonicalEncounterRecord[];
  appointments: CanonicalAppointmentRecord[];
  vitals: Array<{ encounterId: string; recordedAt: string; values: Record<string, unknown> }>;
  clinicalNotes: Array<{
    encounterId: string;
    staffId: string;
    chiefComplaint: string;
    notes: string;
    diagnoses: Array<{ code: string; description: string }>;
    recordedAt: string;
  }>;
  labOrdersResults: {
    orders: CanonicalOrderRecord[];
    results: CanonicalResultActionRecord[];
  };
  radiologyStudiesReports: {
    orders: CanonicalOrderRecord[];
    reports: CanonicalResultActionRecord[];
  };
  prescriptions: CanonicalResultActionRecord[];
  pharmacyEvents: CanonicalResultActionRecord[];
  billingPaymentReferences: CanonicalTransactionRecord[];
  workflowTasks: Array<{
    taskId: string;
    workflowInstanceId: string;
    orderId: string;
    taskType: string;
    departmentId: string;
    state: string;
    priority: string;
  }>;
  currentState: {
    activeEncounter: CanonicalEncounterRecord | null;
    currentDepartment: string | null;
    activeTokenQueue: CanonicalTokenQueueRecord | null;
    currentOrders: CanonicalOrderRecord[];
    pendingTasks: Array<{ taskId: string; taskType: string; departmentId: string; state: string; priority: string }>;
    pendingResultsCount: number;
    unpaidInvoicesCount: number;
  };
  clinicalHistory: {
    encounters: CanonicalEncounterRecord[];
    diagnoses: Array<{ encounterId: string; code: string; description: string }>;
    labAndRadiologyResults: CanonicalResultActionRecord[];
    prescriptionsAndDispensings: CanonicalResultActionRecord[];
  };
  operations: {
    appointments: CanonicalAppointmentRecord[];
    tokensAndQueues: CanonicalTokenQueueRecord[];
    departmentHandoffs: Array<{
      handoffId: string;
      sourceDepartment: string;
      destinationDepartment: string;
      orderId: string | null;
      status: string;
      timestamp: string;
    }>;
  };
  commercial: {
    invoicesAndTransactions: CanonicalTransactionRecord[];
    totalBilledAmount: number;
    totalPaidAmount: number;
    outstandingAmount: number;
  };
  documents: CanonicalDocumentRecord[];
  timeline: PatientTimelineEvent[];
  auditLineage: DataLineageRecord[];
}

export class Patient360ContinuityService {
  private readonly sequenceCounters = new Map<string, number>();
  private readonly idempotencyRecords = new Map<string, unknown>();
  private readonly partnerCommercialOverrides = new Map<
    string,
    {
      licenseStatus?: string;
      subscriptionStatus?: string;
      entitlementMissing?: boolean;
      featureDisabled?: boolean;
    }
  >();

  private readonly patientsById = new Map<string, CanonicalPatientRecord>();
  private readonly patientIdByTenantMrn = new Map<string, string>();
  private readonly patientIdByTenantPhone = new Map<string, string>();

  private readonly appointmentsById = new Map<string, CanonicalAppointmentRecord>();
  private readonly encountersById = new Map<string, CanonicalEncounterRecord>();
  private readonly tokensById = new Map<string, CanonicalTokenQueueRecord>();
  private readonly ordersById = new Map<string, CanonicalOrderRecord>();
  private readonly resultsById = new Map<string, CanonicalResultActionRecord>();
  private readonly transactionsById = new Map<string, CanonicalTransactionRecord>();
  private readonly documentsById = new Map<string, CanonicalDocumentRecord>();
  private readonly lineageByPatient = new Map<string, DataLineageRecord[]>();
  private readonly timelineByPatient = new Map<string, PatientTimelineEvent[]>();

  private readonly patientProjectionVersion = new Map<string, number>();
  private readonly patient360ReadCache = new Map<string, { version: number; model: Patient360ReadModel }>();

  // =========================================================================
  // UNIVERSAL NUMBERING & CANONICAL ID VALIDATION (SECTIONS 5, 6, 24)
  // =========================================================================

  public generateUniversalNumber(
    tenantId: string,
    entityType: UniversalEntityNumberType,
    departmentCode?: string
  ): string {
    const year = new Date().getUTCFullYear();
    const dept = departmentCode ? departmentCode.toUpperCase().trim() : 'GEN';
    const counterKey = `${tenantId}:${entityType}:${dept}:${year}`;
    const nextSeq = (this.sequenceCounters.get(counterKey) || 0) + 1;
    this.sequenceCounters.set(counterKey, nextSeq);

    const seq6 = String(nextSeq).padStart(6, '0');
    const seq3 = String(nextSeq).padStart(3, '0');

    switch (entityType) {
      case 'PATIENT':
        return `PAT-${year}-${seq6}`;
      case 'MRN':
        return `MRN-${year}-${seq6}`;
      case 'ENCOUNTER':
        return `ENC-${year}-${seq6}`;
      case 'VISIT':
        return `VST-${year}-${seq6}`;
      case 'APPOINTMENT':
        return `APT-${year}-${seq6}`;
      case 'TOKEN':
        return `TKN-${dept}-${seq3}`;
      case 'QUEUE_ENTRY':
        return `QUE-${dept}-${year}-${seq6}`;
      case 'ORDER':
        return `ORD-${dept}-${year}-${seq6}`;
      case 'TASK':
        return `TSK-${dept}-${year}-${seq6}`;
      case 'ACCESSION':
        return `ACC-${year}-${seq6}`;
      case 'RESULT':
        return `RES-${dept}-${year}-${seq6}`;
      case 'PRESCRIPTION':
        return `RX-${year}-${seq6}`;
      case 'DISPENSING':
        return `DISP-${year}-${seq6}`;
      case 'INVOICE':
        return `INV-${year}-${seq6}`;
      case 'TRANSACTION':
        return `TXN-${year}-${seq6}`;
      case 'DOCUMENT':
        return `DOC-${year}-${seq6}`;
      case 'AUDIT':
        return `AUD-${year}-${seq6}`;
    }
  }

  /**
   * Enforces Section 24 (NO NAME-BASED / TOKEN-BASED / MRN-SUBSTITUTED TECHNICAL IDENTITY)
   */
  public assertCanonicalTechnicalId(
    rawValue: string | undefined | null,
    fieldName: 'patientId' | 'encounterId' | 'orderId' | 'appointmentId' | 'documentId'
  ): string {
    const val = String(rawValue || '').trim();
    if (!val) {
      throw new AppError({
        message: `Missing mandatory canonical technical identifier "${fieldName}".`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    // Explicitly block MRN, Token Number, Phone Number, or Patient Name passed where a technical ID is required
    if (
      val.startsWith('MRN-') ||
      val.startsWith('TKN-') ||
      val.startsWith('APT-') ||
      val.startsWith('VST-') ||
      val.startsWith('QUE-') ||
      /^\+?\d{10,15}$/.test(val) ||
      val.includes(' ')
    ) {
      throw new AppError({
        message: `Invalid identifier substitution on "${fieldName}": value "${val}" is a business/display identifier (MRN, Token, Phone, or Name). Canonical technical ID is required.`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    return val;
  }

  public setPartnerCommercialControl(
    tenantOrPartnerId: string,
    state: {
      licenseStatus?: string;
      subscriptionStatus?: string;
      entitlementMissing?: boolean;
      featureDisabled?: boolean;
    }
  ): void {
    this.partnerCommercialOverrides.set(tenantOrPartnerId, state);
  }

  /**
   * Enforces STEP 4, STEP 11 & STEP 12-I: Fail closed (403) on any adversarial scope or identity spoofing
   * via request body, query parameters, or client headers (tenantId, partnerId, branchId, locationId, userId, staffId, role).
   */
  public assertNoAdversarialScopeOverride(
    session: SessionContext,
    scopeInput?: {
      tenantId?: string | undefined;
      partnerId?: string | undefined;
      branchId?: string | undefined;
      locationId?: string | undefined;
      userId?: string | undefined;
      staffId?: string | undefined;
      role?: string | undefined;
    }
  ): void {
    if (!session || !session.tenantId || !session.userId) {
      throw AppError.unauthorized('Authentication required');
    }
    if (!scopeInput || session.isSuperAdmin) {
      return;
    }

    // Step 11: Reject client-supplied identity/user spoofing
    if (scopeInput.userId && scopeInput.userId.trim() !== session.userId) {
      identitySecurityFoundationService
        .recordSecurityAudit({
          actorUserId: session.userId,
          partnerId: session.tenantId,
          role: (session.roles || [])[0] || 'UNKNOWN',
          action: 'SECURITY:CLIENT_IDENTITY_SPOOFING_DETECTED',
          resourceType: 'SESSION_IDENTITY',
          resourceId: session.userId,
          decision: 'DENY',
          reasonCode: 'CLIENT_IDENTITY_SPOOFING_DETECTED',
          after: { clientSuppliedUserId: scopeInput.userId, authenticatedUserId: session.userId }
        })
        .catch(() => {});
      throw new AppError({
        message: `Client-supplied identity spoofing blocked: requested userId "${scopeInput.userId}" conflicts with authenticated userId "${session.userId}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const sessionStaffId = (session as any).staffId as string | undefined;
    if (
      scopeInput.staffId &&
      sessionStaffId &&
      scopeInput.staffId.trim() !== sessionStaffId &&
      scopeInput.staffId.trim() !== session.userId
    ) {
      identitySecurityFoundationService
        .recordSecurityAudit({
          actorUserId: session.userId,
          partnerId: session.tenantId,
          role: (session.roles || [])[0] || 'UNKNOWN',
          action: 'SECURITY:CLIENT_STAFF_SPOOFING_DETECTED',
          resourceType: 'STAFF_IDENTITY',
          resourceId: sessionStaffId,
          decision: 'DENY',
          reasonCode: 'CLIENT_STAFF_SPOOFING_DETECTED',
          after: { clientSuppliedStaffId: scopeInput.staffId, authenticatedStaffId: sessionStaffId }
        })
        .catch(() => {});
      throw new AppError({
        message: `Client-supplied staff spoofing blocked: requested staffId "${scopeInput.staffId}" conflicts with authenticated staffId "${sessionStaffId}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    if (scopeInput.role) {
      const normalizedReqRole = String(scopeInput.role).toUpperCase().trim();
      const hasRole = (session.roles || []).map((r) => String(r).toUpperCase().trim()).includes(normalizedReqRole);
      if (!hasRole) {
        identitySecurityFoundationService
          .recordSecurityAudit({
            actorUserId: session.userId,
            partnerId: session.tenantId,
            role: (session.roles || [])[0] || 'UNKNOWN',
            action: 'SECURITY:CLIENT_ROLE_SPOOFING_DETECTED',
            resourceType: 'SECURITY_ROLE',
            resourceId: normalizedReqRole,
            decision: 'DENY',
            reasonCode: 'CLIENT_ROLE_SPOOFING_DETECTED',
            after: { clientSuppliedRole: scopeInput.role, authenticatedRoles: session.roles }
          })
          .catch(() => {});
        throw new AppError({
          message: `Client-supplied role spoofing blocked: requested role "${scopeInput.role}" is not held by authenticated user.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    const effectivePartnerId =
      ((session as any).partnerId as string | undefined) ||
      session.organizationId ||
      session.tenantId;

    if (scopeInput.tenantId && scopeInput.tenantId.trim() !== session.tenantId) {
      throw new AppError({
        message: `Adversarial tenantId substitution blocked: requested "${scopeInput.tenantId}" conflicts with authenticated tenant "${session.tenantId}".`,
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    if (
      scopeInput.partnerId &&
      scopeInput.partnerId.trim() !== effectivePartnerId &&
      scopeInput.partnerId.trim() !== session.tenantId
    ) {
      throw new AppError({
        message: `Adversarial partnerId substitution blocked: requested "${scopeInput.partnerId}" conflicts with authenticated partner "${effectivePartnerId}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const requestedLoc = (scopeInput.locationId || scopeInput.branchId || '').trim();
    const isPartnerWideAdmin = (session.roles || []).some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PARTNER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'HOSPITAL_DIRECTOR'].includes(
        String(r).toUpperCase()
      )
    );

    if (
      requestedLoc &&
      !isPartnerWideAdmin &&
      session.dataScope === 'branch' &&
      session.branchId &&
      requestedLoc !== session.branchId
    ) {
      throw new AppError({
        message: `Adversarial locationId/branchId override blocked: user is scoped to "${session.branchId}" and cannot access or mutate "${requestedLoc}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  }

  private invalidatePatient360Cache(tenantId: string, patientId: string): number {
    const key = `${tenantId}:${patientId}`;
    const nextVer = (this.patientProjectionVersion.get(key) || 0) + 1;
    this.patientProjectionVersion.set(key, nextVer);
    this.patient360ReadCache.delete(key);
    return nextVer;
  }

  private async appendLineageAndTimeline(
    input: Omit<DataLineageRecord, 'lineageId' | 'auditId' | 'when'> & {
      summary: string;
      tenantId?: string;
      locationId?: string;
      simulateAuditFailure?: boolean;
    }
  ): Promise<DataLineageRecord> {
    if (input.simulateAuditFailure) {
      throw new AppError({
        message: 'Critical failure: Immutable audit & data lineage recording failed. Clinical transaction rolled back to prevent un-audited state change.',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }

    const nowIso = new Date().toISOString();
    const pat = this.patientsById.get(input.patientId);
    const effectiveTenantId = input.tenantId || pat?.tenantId || input.partnerId;
    const effectivePartnerId = pat?.partnerId || input.partnerId;
    const effectiveLocationId = input.locationId || pat?.branchId || 'loc-branch-a';

    const auditId = this.generateUniversalNumber(effectiveTenantId, 'AUDIT', input.departmentId);
    const lineageRecord: DataLineageRecord = Object.freeze({
      lineageId: `LIN-${crypto.randomUUID()}`,
      auditId,
      who: input.who,
      what: input.what,
      patientId: input.patientId,
      mrn: input.mrn,
      partnerId: effectivePartnerId,
      departmentId: input.departmentId,
      when: nowIso,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      state: input.state,
      previousState: input.previousState,
      newState: input.newState,
      relatedEncounterId: input.relatedEncounterId,
      relatedStaffId: input.relatedStaffId,
      relatedOrderId: input.relatedOrderId,
      relatedTaskId: input.relatedTaskId,
      relatedResultId: input.relatedResultId,
      relatedTransactionId: input.relatedTransactionId,
      relatedDocumentId: input.relatedDocumentId,
      nextDepartment: input.nextDepartment
    });

    const pKey = `${effectiveTenantId}:${input.patientId}`;
    const existingLineage = this.lineageByPatient.get(pKey) || [];
    existingLineage.push(lineageRecord);
    this.lineageByPatient.set(pKey, existingLineage);

    const timelineEvent: PatientTimelineEvent = Object.freeze({
      eventId: `TLE-${crypto.randomUUID()}`,
      patientId: input.patientId,
      mrn: input.mrn,
      tenantId: effectiveTenantId,
      partnerId: effectivePartnerId,
      locationId: effectiveLocationId,
      encounterId: input.relatedEncounterId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      source: input.sourceType,
      entityId: input.sourceId,
      departmentId: input.departmentId,
      department: input.departmentId,
      staffId: input.relatedStaffId,
      actor: input.who,
      timestamp: nowIso,
      occurredAt: nowIso,
      recordedAt: nowIso,
      eventType: input.what,
      status: input.newState,
      summary: input.summary
    });

    const existingTimeline = this.timelineByPatient.get(pKey) || [];
    existingTimeline.push(timelineEvent);
    this.timelineByPatient.set(pKey, existingTimeline);

    await identitySecurityFoundationService.recordSecurityAudit({
      actorUserId: input.who,
      partnerId: effectivePartnerId,
      role: 'CLINICAL_CONTINUITY_ACTOR',
      action: `PATIENT360:${input.what}`,
      resourceType: input.sourceType,
      resourceId: input.sourceId,
      patientId: input.patientId,
      departmentId: input.departmentId,
      decision: 'ALLOW',
      reasonCode: input.what,
      ...(input.previousState ? { before: { state: input.previousState } } : {}),
      after: {
        state: input.newState,
        mrn: input.mrn,
        encounterId: input.relatedEncounterId,
        orderId: input.relatedOrderId,
        taskId: input.relatedTaskId,
        resultId: input.relatedResultId,
        transactionId: input.relatedTransactionId,
        documentId: input.relatedDocumentId
      }
    });

    this.invalidatePatient360Cache(effectiveTenantId, input.patientId);
    return lineageRecord;
  }

  private async verifyActorAuthorization(
    session: SessionContext,
    permission: string,
    departmentId?: string,
    patientId?: string,
    encounterId?: string,
    staffStatusOverride?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'REVOKED',
    targetLocationId?: string,
    commercialOverride?: {
      licenseStatus?: string;
      subscriptionStatus?: string;
      entitlementMissing?: boolean;
      featureDisabled?: boolean;
      credentialStatus?: string;
    },
    credentialStatusOverride?: string
  ): Promise<void> {
    if (!session || !session.tenantId || !session.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const effectiveStaffStatus =
      staffStatusOverride ||
      ((session as any).staffStatus as string | undefined) ||
      'ACTIVE';

    if (
      effectiveStaffStatus &&
      ['INACTIVE', 'SUSPENDED', 'DISABLED', 'REVOKED'].includes(String(effectiveStaffStatus).toUpperCase())
    ) {
      identitySecurityFoundationService
        .recordSecurityAudit({
          actorUserId: session.userId,
          partnerId: session.tenantId,
          role: (session.roles || [])[0] || 'UNKNOWN',
          action: `CLINICAL_AUTHORIZATION_DENIED:${permission}`,
          resourceType: 'STAFF_STATUS',
          resourceId: session.userId,
          patientId,
          encounterId,
          decision: 'DENY',
          reasonCode: 'STAFF_STATUS_INACTIVE_OR_REVOKED',
          after: { staffStatus: effectiveStaffStatus }
        })
        .catch(() => {});
      throw new AppError({
        message: `Access denied: Staff status is ${effectiveStaffStatus}. Disabled/inactive staff cannot perform clinical actions.`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const effectiveCredentialStatus =
      credentialStatusOverride ||
      commercialOverride?.credentialStatus ||
      ((session as any).credentialStatus as string | undefined) ||
      'VALID';

    if (
      effectiveCredentialStatus &&
      ['REVOKED', 'EXPIRED', 'SUSPENDED', 'INVALID'].includes(String(effectiveCredentialStatus).toUpperCase())
    ) {
      identitySecurityFoundationService
        .recordSecurityAudit({
          actorUserId: session.userId,
          partnerId: session.tenantId,
          role: (session.roles || [])[0] || 'UNKNOWN',
          action: `CLINICAL_AUTHORIZATION_DENIED:${permission}`,
          resourceType: 'STAFF_CREDENTIAL',
          resourceId: session.userId,
          patientId,
          encounterId,
          decision: 'DENY',
          reasonCode: 'CREDENTIAL_REVOKED_OR_EXPIRED',
          after: { credentialStatus: effectiveCredentialStatus }
        })
        .catch(() => {});
      throw new AppError({
        message: `Access denied: Professional credential status is ${effectiveCredentialStatus}. Staff with revoked or expired credentials cannot perform clinical actions.`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const effectivePartnerId =
      ((session as any).partnerId as string | undefined) ||
      session.organizationId ||
      session.tenantId;

    const partnerComm =
      this.partnerCommercialOverrides.get(effectivePartnerId) ||
      this.partnerCommercialOverrides.get(session.tenantId);

    const effectiveLicenseStatus =
      commercialOverride?.licenseStatus ||
      ((session as any).licenseStatus as string | undefined) ||
      partnerComm?.licenseStatus;
    const effectiveSubscriptionStatus =
      ((session as any).subscriptionStatus as string | undefined) ||
      partnerComm?.subscriptionStatus;
    const effectiveEntitlementMissing =
      commercialOverride?.entitlementMissing ??
      Boolean((session as any).entitlementMissing) ??
      Boolean(partnerComm?.entitlementMissing);
    const effectiveFeatureDisabled =
      commercialOverride?.featureDisabled ??
      Boolean((session as any).featureDisabled) ??
      Boolean(partnerComm?.featureDisabled);

    if (
      effectiveLicenseStatus &&
      ['EXPIRED', 'SUSPENDED', 'LOCKED', 'REVOKED', 'INACTIVE'].includes(effectiveLicenseStatus.toUpperCase())
    ) {
      throw new AppError({
        message: `COMMERCIAL_ACCESS_DENIED: Partner license status is ${effectiveLicenseStatus.toUpperCase()}.`,
        code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
        statusCode: 403
      });
    }

    if (
      effectiveSubscriptionStatus &&
      ['EXPIRED', 'SUSPENDED', 'CANCELLED', 'LOCKED'].includes(effectiveSubscriptionStatus.toUpperCase())
    ) {
      throw new AppError({
        message: `COMMERCIAL_ACCESS_DENIED: Partner subscription status is ${effectiveSubscriptionStatus.toUpperCase()}.`,
        code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
        statusCode: 403
      });
    }

    if (effectiveEntitlementMissing || effectiveFeatureDisabled) {
      throw new AppError({
        message: 'COMMERCIAL_ACCESS_DENIED: Partner plan or entitlement does not permit Patient 360 / Clinical EMR capability.',
        code: ErrorCode.COMMERCIAL_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const pat = patientId ? this.patientsById.get(patientId) : undefined;
    const resolvedLocationId = targetLocationId || pat?.branchId || session.branchId;

    // Enforce strict Location/Branch isolation for branch-scoped actors
    const isPartnerWideAdmin = (session.roles || []).some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PARTNER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'HOSPITAL_DIRECTOR'].includes(
        String(r).toUpperCase()
      )
    );

    if (
      resolvedLocationId &&
      !isPartnerWideAdmin &&
      session.dataScope === 'branch' &&
      session.branchId &&
      resolvedLocationId !== session.branchId
    ) {
      throw new AppError({
        message: `Location scope mismatch: staff is assigned to branch "${session.branchId}" and is not authorized for patient/resource in branch "${resolvedLocationId}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const effectiveDept =
      session.dataScope === 'tenant' ? session.departmentId || departmentId : departmentId;

    const decision = await identitySecurityFoundationService.authorize(
      session,
      permission,
      {
        partnerId: session.tenantId,
        locationId: resolvedLocationId,
        ...(effectiveDept ? { departmentId: effectiveDept } : {}),
        ...(patientId ? { patientId } : {}),
        ...(encounterId ? { encounterId } : {})
      },
      {
        ...(effectiveLicenseStatus ? { licenseStatusOverride: effectiveLicenseStatus } : {}),
        ...(effectiveEntitlementMissing ? { entitlementMissingOverride: true } : {}),
        ...(effectiveFeatureDisabled ? { featureDisabledOverride: true } : {})
      }
    );

    if (!decision.allowed) {
      throw new AppError({
        message: decision.reason,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  }

  // =========================================================================
  // STEP 1 & STEP 2 — CANONICAL PATIENT IDENTITY & MRN INTEGRITY
  // =========================================================================

  public async registerCanonicalPatient(
    session: SessionContext,
    input: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      sex: string;
      mobileNumber?: string;
      email?: string;
      address?: string;
      emergencyContact?: { name: string; phone: string; relation: string };
      mrn?: string;
      branchId?: string;
      locationId?: string;
      partnerId?: string;
      tenantId?: string;
      createdFromDepartment?: string;
      idempotencyKey?: string;
      staffStatusOverride?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'REVOKED';
      simulateAuditFailure?: boolean;
    }
  ): Promise<{ patient: CanonicalPatientRecord; idempotentReplay: boolean }> {
    this.assertNoAdversarialScopeOverride(session, {
      tenantId: input.tenantId,
      partnerId: input.partnerId,
      branchId: input.branchId,
      locationId: input.locationId
    });

    const targetBranchId = input.locationId || input.branchId || session.branchId || 'loc-branch-a';

    await this.verifyActorAuthorization(
      session,
      'PATIENT:CREATE',
      input.createdFromDepartment || session.departmentId,
      undefined,
      undefined,
      input.staffStatusOverride,
      targetBranchId
    );

    const tenantId = session.tenantId;
    const effectivePartnerId =
      ((session as any).partnerId as string | undefined) ||
      input.partnerId ||
      session.organizationId ||
      tenantId;

    // Rule: Downstream departments (LIMS, RADIOLOGY, PHARMACY, BILLING) MUST NOT create a second/parallel patient identity!
    if (input.createdFromDepartment) {
      const deptUpper = input.createdFromDepartment.toUpperCase().trim();
      if (['LIMS', 'LAB', 'RADIOLOGY', 'PHARMACY', 'BILLING', 'DIETARY', 'BLOOD_BANK'].includes(deptUpper)) {
        throw new AppError({
          message: `Department "${deptUpper}" is forbidden from creating a parallel department-specific patient identity. Reference the canonical Patient Master.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
    }

    if (input.idempotencyKey) {
      const idemKey = `PAT:${tenantId}:${input.idempotencyKey}`;
      const cached = this.idempotencyRecords.get(idemKey) as CanonicalPatientRecord | undefined;
      if (cached) {
        return { patient: cached, idempotentReplay: true };
      }
    }

    const firstName = String(input.firstName || '').trim();
    const lastName = String(input.lastName || '').trim();
    const dob = String(input.dateOfBirth || '2000-01-01').trim();
    if (!firstName || !lastName) {
      throw AppError.badRequest('firstName and lastName are mandatory for canonical Patient Master registration');
    }

    const normalizedPhone = input.mobileNumber ? normalizePhoneNumber(input.mobileNumber) : null;

    // Check MRN Uniqueness within tenant
    if (input.mrn) {
      const mrnLookupKey = `${tenantId}:${input.mrn.trim().toUpperCase()}`;
      const existingPidByMrn = this.patientIdByTenantMrn.get(mrnLookupKey);
      if (existingPidByMrn) {
        const existingPat = this.patientsById.get(existingPidByMrn)!;
        const isSameDemographic =
          existingPat.firstName.toLowerCase() === firstName.toLowerCase() &&
          existingPat.lastName.toLowerCase() === lastName.toLowerCase() &&
          existingPat.dateOfBirth === dob;

        if (!isSameDemographic) {
          throw new AppError({
            message: `Duplicate MRN collision: MRN "${input.mrn}" is already assigned to patient "${existingPat.patientId}" in tenant "${tenantId}". Two patients cannot receive the same MRN.`,
            code: ErrorCode.CONFLICT,
            statusCode: 409
          });
        }
        return { patient: existingPat, idempotentReplay: true };
      }
    }

    // Check Phone + Demographic Deduplication within tenant
    if (normalizedPhone) {
      const phoneLookupKey = `${tenantId}:${normalizedPhone}`;
      const existingPidByPhone = this.patientIdByTenantPhone.get(phoneLookupKey);
      if (existingPidByPhone) {
        const existingPat = this.patientsById.get(existingPidByPhone)!;
        const isSamePerson =
          existingPat.firstName.toLowerCase() === firstName.toLowerCase() &&
          existingPat.lastName.toLowerCase() === lastName.toLowerCase() &&
          existingPat.dateOfBirth === dob;

        if (isSamePerson) {
          return { patient: existingPat, idempotentReplay: true };
        }
        throw new AppError({
          message: `Duplicate patient registration conflict: Mobile number "${normalizedPhone}" is already bound to canonical patient "${existingPat.patientId}" (${existingPat.mrn}).`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }
    }

    const mrn = input.mrn
      ? input.mrn.trim().toUpperCase()
      : this.generateUniversalNumber(tenantId, 'MRN');
    const patientCode = this.generateUniversalNumber(tenantId, 'PATIENT');

    // Persist to PostgreSQL Patient Master
    let dbPatientId: string = crypto.randomUUID();
    try {
      const dbCreated = await clinicalWorkflowRepository.createPatient({
        tenantId,
        partnerId: effectivePartnerId,
        branchId: targetBranchId,
        mrn,
        patientCode,
        firstName,
        lastName,
        gender: input.sex || 'OTHER',
        dateOfBirth: dob,
        ...(normalizedPhone ? { mobileNumber: normalizedPhone } : {})
      });
      if (dbCreated?.id) {
        dbPatientId = dbCreated.id;
      }
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 409) {
        throw err;
      }
    }

    const nowIso = new Date().toISOString();
    const record: CanonicalPatientRecord = {
      patientId: dbPatientId,
      patientCode,
      mrn,
      tenantId,
      partnerId: effectivePartnerId,
      branchId: targetBranchId,
      legalName: `${firstName} ${lastName}`,
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      dateOfBirth: dob,
      sex: input.sex || 'OTHER',
      mobileNumber: normalizedPhone,
      email: input.email || null,
      address: input.address || null,
      emergencyContact: input.emergencyContact || null,
      identityReferences: [],
      status: 'ACTIVE',
      version: 1,
      mergedIntoPatientId: null,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // Perform audit/lineage FIRST so if simulateAuditFailure is true, state is never committed
    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'patient.created',
      patientId: record.patientId,
      mrn: record.mrn,
      tenantId,
      partnerId: effectivePartnerId,
      locationId: targetBranchId,
      departmentId: input.createdFromDepartment || session.departmentId || 'REGISTRATION',
      sourceType: 'PATIENT_MASTER',
      sourceId: record.patientId,
      state: 'ACTIVE',
      previousState: null,
      newState: 'ACTIVE',
      relatedEncounterId: null,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: 'OPD',
      summary: `Registered canonical patient ${record.legalName} (${record.mrn})`,
      ...(input.simulateAuditFailure !== undefined ? { simulateAuditFailure: input.simulateAuditFailure } : {})
    });

    this.patientsById.set(record.patientId, record);
    this.patientIdByTenantMrn.set(`${tenantId}:${record.mrn}`, record.patientId);
    if (normalizedPhone) {
      this.patientIdByTenantPhone.set(`${tenantId}:${normalizedPhone}`, record.patientId);
    }

    identitySecurityFoundationService.registerPatientScope({
      patientId: record.patientId,
      partnerId: tenantId,
      locationId: record.branchId,
      departmentId: input.createdFromDepartment || session.departmentId || 'OPD'
    });

    if (input.idempotencyKey) {
      this.idempotencyRecords.set(`PAT:${tenantId}:${input.idempotencyKey}`, record);
    }

    return { patient: record, idempotentReplay: false };
  }

  public async hydrateCanonicalPatientFromDatabase(
    tenantId: string,
    patientId: string
  ): Promise<CanonicalPatientRecord | null> {
    try {
      const found = await clinicalWorkflowRepository.getPatientById(tenantId, patientId);
      if (!found) return null;

      const record: CanonicalPatientRecord = {
        patientId: found.id,
        patientCode: (found as any).patientCode || `PAT-${found.mrn}`,
        mrn: found.mrn,
        tenantId: found.tenantId,
        partnerId: (found as any).partnerId || found.tenantId,
        branchId: found.branchId,
        legalName: `${found.firstName} ${found.lastName}`.trim(),
        displayName: `${found.firstName} ${found.lastName}`.trim(),
        firstName: found.firstName,
        lastName: found.lastName,
        dateOfBirth: found.dateOfBirth,
        sex: found.gender || 'OTHER',
        mobileNumber: (found as any).mobileNumber || (found as any).primaryMobile || null,
        email: (found as any).email || null,
        address: (found as any).address || null,
        emergencyContact: (found as any).emergencyContact || null,
        identityReferences: (found as any).identityReferences || [],
        status: ((found as any).status as any) || 'ACTIVE',
        version: (found as any).version || 1,
        mergedIntoPatientId: (found as any).mergedIntoPatientId || null,
        createdAt: found.createdAt ? new Date(found.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: found.updatedAt ? new Date(found.updatedAt).toISOString() : new Date().toISOString()
      };
      this.patientsById.set(record.patientId, record);
      this.patientIdByTenantMrn.set(`${record.tenantId}:${record.mrn}`, record.patientId);
      if (record.mobileNumber) {
        this.patientIdByTenantPhone.set(`${record.tenantId}:${record.mobileNumber}`, record.patientId);
      }
      return record;
    } catch {
      return null;
    }
  }

  public async hydrateCanonicalEncounterFromDatabase(
    tenantId: string,
    encounterId: string
  ): Promise<CanonicalEncounterRecord | null> {
    try {
      const db = getDatabase();
      if (!db) return null;
      const [found] = await db
        .select()
        .from(clinicalEncounters)
        .where(and(eq(clinicalEncounters.tenantId, tenantId), eq(clinicalEncounters.id, encounterId)))
        .limit(1);
      if (!found) return null;

      const record: CanonicalEncounterRecord = {
        encounterId: found.id,
        encounterNumber: found.encounterNumber,
        visitId: `vst-${found.id}`,
        visitNumber: `VST-${found.encounterNumber}`,
        tenantId: found.tenantId,
        partnerId: found.partnerId || tenantId,
        branchId: found.branchId,
        departmentId: found.departmentId || 'OPD',
        patientId: found.patientId,
        mrn: (found as any).mrn || '',
        appointmentId: (found as any).appointmentId || null,
        staffId: found.doctorId || '',
        encounterType: (found.encounterType as any) || 'OPD',
        visitType: 'FIRST_VISIT',
        status: (found.status as any) || 'OPEN',
        chiefComplaint: found.chiefComplaint || '',
        vitals: (found as any).vitals || null,
        consultationNotes: (found as any).consultationNotes || null,
        diagnoses: (found as any).diagnoses || [],
        createdAt: found.createdAt ? new Date(found.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: found.updatedAt ? new Date(found.updatedAt).toISOString() : new Date().toISOString(),
        closedAt: found.completedAt ? new Date(found.completedAt).toISOString() : null
      };
      this.encountersById.set(record.encounterId, record);
      return record;
    } catch {
      return null;
    }
  }

  public async getCanonicalPatientOrThrow(
    session: SessionContext,
    rawPatientId: string,
    scopeOverrideCheck?: {
      tenantId?: string | undefined;
      partnerId?: string | undefined;
      branchId?: string | undefined;
      locationId?: string | undefined;
    }
  ): Promise<CanonicalPatientRecord> {
    this.assertNoAdversarialScopeOverride(session, scopeOverrideCheck);

    const patientId = this.assertCanonicalTechnicalId(rawPatientId, 'patientId');
    let pat = this.patientsById.get(patientId);
    if (!pat) {
      pat = (await this.hydrateCanonicalPatientFromDatabase(session.tenantId, patientId)) || undefined;
    }
    if (!pat) {
      throw AppError.notFound(`Canonical patient "${patientId}" not found`);
    }
    if (!session.isSuperAdmin && pat.tenantId !== session.tenantId) {
      throw new AppError({
        message: 'Cross-tenant access to Patient Master is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const callerPartnerId = ((session as any).partnerId as string | undefined) || session.organizationId;
    if (!session.isSuperAdmin && callerPartnerId && pat.partnerId !== callerPartnerId && pat.partnerId !== session.tenantId) {
      throw new AppError({
        message: `Cross-partner access to Patient Master is strictly forbidden (caller partner "${callerPartnerId}", patient partner "${pat.partnerId}").`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const isPartnerWideAdmin = (session.roles || []).some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PARTNER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'HOSPITAL_DIRECTOR'].includes(
        String(r).toUpperCase()
      )
    );
    if (
      !session.isSuperAdmin &&
      !isPartnerWideAdmin &&
      session.dataScope === 'branch' &&
      session.branchId &&
      pat.branchId &&
      pat.branchId !== session.branchId
    ) {
      throw new AppError({
        message: `Location scope isolation: caller in branch "${session.branchId}" is forbidden from accessing patient in branch "${pat.branchId}".`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    return pat;
  }

  public async updateCanonicalPatient(
    session: SessionContext,
    rawPatientId: string,
    patch: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      sex?: string;
      mobileNumber?: string;
      email?: string;
      address?: string;
      emergencyContact?: { name: string; phone: string; relation: string } | null;
      expectedVersion?: number;
      tenantId?: string;
      partnerId?: string;
      branchId?: string;
      locationId?: string;
    }
  ): Promise<CanonicalPatientRecord> {
    this.assertNoAdversarialScopeOverride(session, {
      tenantId: patch.tenantId,
      partnerId: patch.partnerId,
      branchId: patch.branchId,
      locationId: patch.locationId
    });

    const pat = await this.getCanonicalPatientOrThrow(session, rawPatientId);
    await this.verifyActorAuthorization(
      session,
      'PATIENT:UPDATE',
      session.departmentId || 'OPD',
      pat.patientId,
      undefined,
      undefined,
      pat.branchId
    );

    // Concurrency protection: verify expectedVersion if provided
    if (patch.expectedVersion !== undefined && patch.expectedVersion !== pat.version) {
      throw new AppError({
        message: `Concurrent modification conflict: patient "${pat.patientId}" is at version ${pat.version}, but update expected version ${patch.expectedVersion}.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const tenantId = session.tenantId;
    if (patch.mobileNumber) {
      const normalizedNewPhone = normalizePhoneNumber(patch.mobileNumber);
      if (normalizedNewPhone && normalizedNewPhone !== pat.mobileNumber) {
        const phoneKey = `${tenantId}:${normalizedNewPhone}`;
        const existingOtherId = this.patientIdByTenantPhone.get(phoneKey);
        if (existingOtherId && existingOtherId !== pat.patientId) {
          throw new AppError({
            message: `Duplicate mobile number conflict: "${normalizedNewPhone}" is already bound to patient "${existingOtherId}".`,
            code: ErrorCode.CONFLICT,
            statusCode: 409
          });
        }
        if (pat.mobileNumber) {
          this.patientIdByTenantPhone.delete(`${tenantId}:${pat.mobileNumber}`);
        }
        this.patientIdByTenantPhone.set(phoneKey, pat.patientId);
        pat.mobileNumber = normalizedNewPhone;
      }
    }

    if (patch.firstName !== undefined && patch.firstName.trim()) {
      pat.firstName = patch.firstName.trim();
    }
    if (patch.lastName !== undefined && patch.lastName.trim()) {
      pat.lastName = patch.lastName.trim();
    }
    pat.legalName = `${pat.firstName} ${pat.lastName}`;
    pat.displayName = `${pat.firstName} ${pat.lastName}`;

    if (patch.dateOfBirth !== undefined && patch.dateOfBirth.trim()) {
      pat.dateOfBirth = patch.dateOfBirth.trim();
    }
    if (patch.sex !== undefined && patch.sex.trim()) {
      pat.sex = patch.sex.trim();
    }
    if (patch.email !== undefined) {
      pat.email = patch.email ? patch.email.trim() : null;
    }
    if (patch.address !== undefined) {
      pat.address = patch.address ? patch.address.trim() : null;
    }
    if (patch.emergencyContact !== undefined) {
      pat.emergencyContact = patch.emergencyContact;
    }

    pat.version = (pat.version || 1) + 1;
    pat.updatedAt = new Date().toISOString();

    try {
      await clinicalWorkflowRepository.updatePatient(tenantId, pat.patientId, {
        firstName: pat.firstName,
        lastName: pat.lastName,
        gender: pat.sex,
        dateOfBirth: pat.dateOfBirth,
        ...(pat.mobileNumber ? { mobileNumber: pat.mobileNumber } : {})
      });
    } catch {}

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'patient.updated',
      patientId: pat.patientId,
      mrn: pat.mrn,
      tenantId,
      partnerId: pat.partnerId,
      locationId: pat.branchId,
      departmentId: session.departmentId || 'OPD',
      sourceType: 'PATIENT_MASTER',
      sourceId: pat.patientId,
      state: pat.status,
      previousState: pat.status,
      newState: pat.status,
      relatedEncounterId: null,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: null,
      summary: `Updated canonical patient demographics/contacts for ${pat.legalName} (${pat.mrn}) [v${pat.version}]`
    });

    return pat;
  }

  public async updatePatientStatus(
    session: SessionContext,
    rawPatientId: string,
    targetStatus: 'ACTIVE' | 'INACTIVE',
    reason?: string
  ): Promise<CanonicalPatientRecord> {
    const pat = await this.getCanonicalPatientOrThrow(session, rawPatientId);
    await this.verifyActorAuthorization(
      session,
      'PATIENT:UPDATE',
      session.departmentId || 'OPD',
      pat.patientId,
      undefined,
      undefined,
      pat.branchId
    );

    if (pat.status === 'MERGED_DEPRECATED') {
      throw new AppError({
        message: `Cannot change status of patient "${pat.patientId}": record is MERGED_DEPRECATED into "${pat.mergedIntoPatientId}".`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const prevStatus = pat.status;
    pat.status = targetStatus;
    pat.version = (pat.version || 1) + 1;
    pat.updatedAt = new Date().toISOString();

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: targetStatus === 'INACTIVE' ? 'patient.deactivated' : 'patient.reactivated',
      patientId: pat.patientId,
      mrn: pat.mrn,
      tenantId: pat.tenantId,
      partnerId: pat.partnerId,
      locationId: pat.branchId,
      departmentId: session.departmentId || 'OPD',
      sourceType: 'PATIENT_MASTER',
      sourceId: pat.patientId,
      state: targetStatus,
      previousState: prevStatus,
      newState: targetStatus,
      relatedEncounterId: null,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: null,
      summary: `${targetStatus === 'INACTIVE' ? 'Deactivated' : 'Reactivated'} patient ${pat.mrn}: ${reason || 'Status update'}`
    });

    return pat;
  }

  public async mergeDuplicatePatient(
    session: SessionContext,
    rawSourcePatientId: string,
    rawTargetPatientId: string,
    reason?: string
  ): Promise<{ sourcePatient: CanonicalPatientRecord; targetPatient: CanonicalPatientRecord; reLinkedCounts: { encounters: number; appointments: number; orders: number; results: number; transactions: number; documents: number } }> {
    const sourcePat = await this.getCanonicalPatientOrThrow(session, rawSourcePatientId);
    const targetPat = await this.getCanonicalPatientOrThrow(session, rawTargetPatientId);

    if (sourcePat.patientId === targetPat.patientId) {
      throw new AppError({
        message: 'Cannot merge a patient into itself.',
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    if (sourcePat.tenantId !== targetPat.tenantId) {
      throw new AppError({
        message: 'Cross-tenant patient merge is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    await this.verifyActorAuthorization(
      session,
      'PATIENT:UPDATE',
      session.departmentId || 'OPD',
      targetPat.patientId,
      undefined,
      undefined,
      targetPat.branchId
    );

    const prevSourceStatus = sourcePat.status;
    sourcePat.status = 'MERGED_DEPRECATED';
    sourcePat.mergedIntoPatientId = targetPat.patientId;
    sourcePat.version = (sourcePat.version || 1) + 1;
    sourcePat.updatedAt = new Date().toISOString();

    targetPat.version = (targetPat.version || 1) + 1;
    targetPat.updatedAt = new Date().toISOString();

    let reLinkedEncounters = 0;
    for (const enc of this.encountersById.values()) {
      if (enc.tenantId === sourcePat.tenantId && enc.patientId === sourcePat.patientId) {
        enc.patientId = targetPat.patientId;
        enc.mrn = targetPat.mrn;
        enc.updatedAt = new Date().toISOString();
        reLinkedEncounters++;
      }
    }

    let reLinkedAppointments = 0;
    for (const apt of this.appointmentsById.values()) {
      if (apt.tenantId === sourcePat.tenantId && apt.patientId === sourcePat.patientId) {
        apt.patientId = targetPat.patientId;
        apt.mrn = targetPat.mrn;
        apt.updatedAt = new Date().toISOString();
        reLinkedAppointments++;
      }
    }

    let reLinkedOrders = 0;
    for (const ord of this.ordersById.values()) {
      if (ord.tenantId === sourcePat.tenantId && ord.patientId === sourcePat.patientId) {
        ord.patientId = targetPat.patientId;
        ord.mrn = targetPat.mrn;
        ord.updatedAt = new Date().toISOString();
        reLinkedOrders++;
      }
    }

    let reLinkedResults = 0;
    for (const res of this.resultsById.values()) {
      if (res.tenantId === sourcePat.tenantId && res.patientId === sourcePat.patientId) {
        res.patientId = targetPat.patientId;
        res.mrn = targetPat.mrn;
        reLinkedResults++;
      }
    }

    let reLinkedTransactions = 0;
    for (const txn of this.transactionsById.values()) {
      if (txn.tenantId === sourcePat.tenantId && txn.patientId === sourcePat.patientId) {
        txn.patientId = targetPat.patientId;
        txn.mrn = targetPat.mrn;
        reLinkedTransactions++;
      }
    }

    let reLinkedDocuments = 0;
    for (const doc of this.documentsById.values()) {
      if (doc.tenantId === sourcePat.tenantId && doc.patientId === sourcePat.patientId) {
        doc.patientId = targetPat.patientId;
        doc.mrn = targetPat.mrn;
        doc.updatedAt = new Date().toISOString();
        reLinkedDocuments++;
      }
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'patient.merged',
      patientId: sourcePat.patientId,
      mrn: sourcePat.mrn,
      tenantId: sourcePat.tenantId,
      partnerId: sourcePat.partnerId,
      locationId: sourcePat.branchId,
      departmentId: session.departmentId || 'OPD',
      sourceType: 'PATIENT_MASTER',
      sourceId: sourcePat.patientId,
      state: 'MERGED_DEPRECATED',
      previousState: prevSourceStatus,
      newState: 'MERGED_DEPRECATED',
      relatedEncounterId: null,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: null,
      summary: `Merged patient ${sourcePat.mrn} into target ${targetPat.mrn}: ${reason || 'Duplicate resolution'}`
    });

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'patient.merge_absorbed',
      patientId: targetPat.patientId,
      mrn: targetPat.mrn,
      tenantId: targetPat.tenantId,
      partnerId: targetPat.partnerId,
      locationId: targetPat.branchId,
      departmentId: session.departmentId || 'OPD',
      sourceType: 'PATIENT_MASTER',
      sourceId: targetPat.patientId,
      state: targetPat.status,
      previousState: targetPat.status,
      newState: targetPat.status,
      relatedEncounterId: null,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: null,
      summary: `Absorbed duplicate patient ${sourcePat.mrn} into target ${targetPat.mrn}`
    });

    return {
      sourcePatient: sourcePat,
      targetPatient: targetPat,
      reLinkedCounts: {
        encounters: reLinkedEncounters,
        appointments: reLinkedAppointments,
        orders: reLinkedOrders,
        results: reLinkedResults,
        transactions: reLinkedTransactions,
        documents: reLinkedDocuments
      }
    };
  }

  public async listCanonicalPatients(
    session: SessionContext,
    query?: {
      q?: string;
      tenantId?: string;
      partnerId?: string;
      branchId?: string;
      locationId?: string;
    }
  ): Promise<{
    patients: CanonicalPatientRecord[];
    total: number;
    zeroState: boolean;
    counts: {
      patients: number;
      encounters: number;
      appointments: number;
      labResults: number;
      radiologyReports: number;
      prescriptions: number;
      pharmacyEvents: number;
    };
  }> {
    this.assertNoAdversarialScopeOverride(session, query);
    await this.verifyActorAuthorization(
      session,
      'PATIENT:READ',
      session.departmentId || 'OPD',
      undefined,
      undefined,
      undefined,
      query?.locationId || query?.branchId || session.branchId
    );

    const tenantId = session.tenantId;
    const callerPartnerId = ((session as any).partnerId as string | undefined) || session.organizationId;
    const isPartnerWideAdmin = (session.roles || []).some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PARTNER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'HOSPITAL_DIRECTOR'].includes(
        String(r).toUpperCase()
      )
    );

    // If cache is cold, hydrate canonical patients from database
    if (this.patientsById.size === 0) {
      try {
        const db = getDatabase();
        if (db) {
          const dbPatients = await db.select().from(patients).where(eq(patients.tenantId, tenantId)).limit(100);
          for (const p of dbPatients) {
            if (!this.patientsById.has(p.id)) {
              const rec: CanonicalPatientRecord = {
                patientId: p.id,
                patientCode: (p as any).patientCode || `PAT-${p.mrn}`,
                mrn: p.mrn,
                tenantId: p.tenantId,
                partnerId: p.partnerId || p.tenantId,
                branchId: p.branchId,
                legalName: `${p.firstName} ${p.lastName}`.trim(),
                displayName: `${p.firstName} ${p.lastName}`.trim(),
                firstName: p.firstName,
                lastName: p.lastName,
                dateOfBirth: p.dateOfBirth,
                sex: p.gender || 'OTHER',
                mobileNumber: (p as any).mobileNumber || null,
                email: (p as any).email || null,
                address: (p as any).address || null,
                emergencyContact: (p as any).emergencyContact || null,
                identityReferences: [],
                status: ((p as any).status as any) || 'ACTIVE',
                version: (p as any).version || 1,
                mergedIntoPatientId: (p as any).mergedIntoPatientId || null,
                createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
                updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
              };
              this.patientsById.set(rec.patientId, rec);
              this.patientIdByTenantMrn.set(`${rec.tenantId}:${rec.mrn}`, rec.patientId);
              if (rec.mobileNumber) {
                this.patientIdByTenantPhone.set(`${rec.tenantId}:${rec.mobileNumber}`, rec.patientId);
              }
            }
          }
        }
      } catch {}
    }

    let list = Array.from(this.patientsById.values()).filter((p) => {
      if (p.tenantId !== tenantId) return false;
      if (callerPartnerId && p.partnerId !== callerPartnerId && p.partnerId !== tenantId) return false;
      if (!isPartnerWideAdmin && session.dataScope === 'branch' && session.branchId && p.branchId !== session.branchId) {
        return false;
      }
      return true;
    });

    if (query?.q && query.q.trim()) {
      const qLower = query.q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.legalName.toLowerCase().includes(qLower) ||
          p.mrn.toLowerCase().includes(qLower) ||
          p.patientCode.toLowerCase().includes(qLower) ||
          (p.mobileNumber && p.mobileNumber.includes(qLower))
      );
    }

    const patientIdSet = new Set(list.map((p) => p.patientId));
    const encountersCount = Array.from(this.encountersById.values()).filter(
      (e) => e.tenantId === tenantId && patientIdSet.has(e.patientId)
    ).length;
    const appointmentsCount = Array.from(this.appointmentsById.values()).filter(
      (a) => a.tenantId === tenantId && patientIdSet.has(a.patientId)
    ).length;
    const tenantResults = Array.from(this.resultsById.values()).filter(
      (r) => r.tenantId === tenantId && patientIdSet.has(r.patientId)
    );
    const labResultsCount = tenantResults.filter((r) => r.resultType === 'LAB_RESULT').length;
    const radiologyReportsCount = tenantResults.filter((r) => r.resultType === 'RADIOLOGY_REPORT').length;
    const prescriptionsCount = tenantResults.filter((r) => r.resultType === 'PRESCRIPTION').length;
    const pharmacyEventsCount = tenantResults.filter((r) => r.resultType === 'PHARMACY_DISPENSING').length;

    const zeroState =
      list.length === 0 &&
      encountersCount === 0 &&
      appointmentsCount === 0 &&
      labResultsCount === 0 &&
      radiologyReportsCount === 0 &&
      prescriptionsCount === 0 &&
      pharmacyEventsCount === 0;

    return {
      patients: list,
      total: list.length,
      zeroState,
      counts: {
        patients: list.length,
        encounters: encountersCount,
        appointments: appointmentsCount,
        labResults: labResultsCount,
        radiologyReports: radiologyReportsCount,
        prescriptions: prescriptionsCount,
        pharmacyEvents: pharmacyEventsCount
      }
    };
  }

  // =========================================================================
  // STEP 3 & STEP 4 — APPOINTMENT & ENCOUNTER CONTINUITY
  // =========================================================================

  public async bookAppointment(
    session: SessionContext,
    input: {
      patientId: string;
      departmentId: string;
      doctorId: string;
      slotDate: string;
      slotTime: string;
      reason?: string;
      idempotencyKey?: string;
    }
  ): Promise<{ appointment: CanonicalAppointmentRecord; idempotentReplay: boolean }> {
    const pat = await this.getCanonicalPatientOrThrow(session, input.patientId);
    await this.verifyActorAuthorization(session, 'ENCOUNTER:CREATE', input.departmentId, pat.patientId);

    const tenantId = session.tenantId;
    if (input.idempotencyKey) {
      const cached = this.idempotencyRecords.get(
        `APT:${tenantId}:${input.idempotencyKey}`
      ) as CanonicalAppointmentRecord | undefined;
      if (cached) {
        return { appointment: cached, idempotentReplay: true };
      }
    }

    // Check duplicate active slot booking for same patient + doctor + slotDate + slotTime
    const existingDup = Array.from(this.appointmentsById.values()).find(
      (a) =>
        a.tenantId === tenantId &&
        a.patientId === pat.patientId &&
        a.doctorId === input.doctorId &&
        a.slotDate === input.slotDate &&
        a.slotTime === input.slotTime &&
        a.status !== 'CANCELLED'
    );
    if (existingDup) {
      return { appointment: existingDup, idempotentReplay: true };
    }

    const nowIso = new Date().toISOString();
    const appointment: CanonicalAppointmentRecord = {
      appointmentId: `apt-${crypto.randomUUID()}`,
      appointmentNumber: this.generateUniversalNumber(tenantId, 'APPOINTMENT', input.departmentId),
      tenantId,
      partnerId: tenantId,
      branchId: session.branchId || pat.branchId,
      departmentId: input.departmentId.toUpperCase().trim(),
      patientId: pat.patientId,
      mrn: pat.mrn,
      doctorId: input.doctorId,
      slotDate: input.slotDate,
      slotTime: input.slotTime,
      reason: input.reason || 'Clinical Consultation',
      status: 'BOOKED',
      encounterId: null,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.appointmentsById.set(appointment.appointmentId, appointment);
    if (input.idempotencyKey) {
      this.idempotencyRecords.set(`APT:${tenantId}:${input.idempotencyKey}`, appointment);
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'appointment.created',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: tenantId,
      departmentId: appointment.departmentId,
      sourceType: 'APPOINTMENT',
      sourceId: appointment.appointmentId,
      state: 'BOOKED',
      previousState: null,
      newState: 'BOOKED',
      relatedEncounterId: null,
      relatedStaffId: appointment.doctorId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: appointment.departmentId,
      summary: `Booked appointment ${appointment.appointmentNumber} for ${pat.mrn}`
    });

    return { appointment, idempotentReplay: false };
  }

  public async checkInAppointmentOrCreateEncounter(
    session: SessionContext,
    input: {
      patientId: string;
      appointmentId?: string;
      departmentId?: string;
      staffId?: string;
      encounterType?: CanonicalEncounterRecord['encounterType'];
      status?: CanonicalEncounterRecord['status'];
      chiefComplaint?: string;
      idempotencyKey?: string;
    }
  ): Promise<{ encounter: CanonicalEncounterRecord; idempotentReplay: boolean }> {
    const pat = await this.getCanonicalPatientOrThrow(session, input.patientId);
    const tenantId = session.tenantId;

    if (input.idempotencyKey) {
      const cached = this.idempotencyRecords.get(
        `ENC:${tenantId}:${input.idempotencyKey}`
      ) as CanonicalEncounterRecord | undefined;
      if (cached) {
        return { encounter: cached, idempotentReplay: true };
      }
    }

    let linkedAppointment: CanonicalAppointmentRecord | null = null;
    if (input.appointmentId) {
      const aptId = this.assertCanonicalTechnicalId(input.appointmentId, 'appointmentId');
      const apt = this.appointmentsById.get(aptId);
      if (!apt || apt.tenantId !== tenantId) {
        throw AppError.notFound(`Appointment "${aptId}" not found in tenant`);
      }
      if (apt.patientId !== pat.patientId) {
        throw new AppError({
          message: `Appointment "${aptId}" belongs to patient "${apt.patientId}", not "${pat.patientId}". Tampering blocked.`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }
      // Retry safety: if appointment was already checked in, return the existing linked encounter!
      if (apt.encounterId && this.encountersById.has(apt.encounterId)) {
        return {
          encounter: this.encountersById.get(apt.encounterId)!,
          idempotentReplay: true
        };
      }
      linkedAppointment = apt;
    }

    const deptId = (input.departmentId || linkedAppointment?.departmentId || session.departmentId || 'OPD')
      .toUpperCase()
      .trim();
    await this.verifyActorAuthorization(session, 'ENCOUNTER:CREATE', deptId, pat.patientId);

    const encounterNumber = this.generateUniversalNumber(tenantId, 'ENCOUNTER', deptId);
    const visitNumber = this.generateUniversalNumber(tenantId, 'VISIT');
    const visitId = `vst-${crypto.randomUUID()}`;
    let dbEncounterId: string = `enc-${crypto.randomUUID()}`;

    const initialStatus = input.status || (linkedAppointment ? 'CHECKED_IN' : 'OPEN');

    try {
      const dbEnc = await clinicalWorkflowRepository.createEncounter({
        tenantId,
        partnerId: tenantId,
        branchId: session.branchId || pat.branchId,
        departmentId: deptId,
        patientId: pat.patientId,
        doctorId: input.staffId || linkedAppointment?.doctorId || session.userId,
        encounterNumber,
        encounterType: input.encounterType || (linkedAppointment ? 'APPOINTMENT' : 'OPD'),
        status: initialStatus,
        chiefComplaint: input.chiefComplaint || 'OPD Clinical Consultation'
      });
      if (dbEnc?.id) {
        dbEncounterId = dbEnc.id;
      }
    } catch {}

    const nowIso = new Date().toISOString();
    const encounter: CanonicalEncounterRecord = {
      encounterId: dbEncounterId,
      encounterNumber,
      visitId,
      visitNumber,
      tenantId,
      partnerId: pat.partnerId || tenantId,
      branchId: session.branchId || pat.branchId,
      departmentId: deptId,
      patientId: pat.patientId,
      mrn: pat.mrn,
      appointmentId: linkedAppointment ? linkedAppointment.appointmentId : null,
      staffId: input.staffId || linkedAppointment?.doctorId || session.userId,
      encounterType: input.encounterType || (linkedAppointment ? 'APPOINTMENT' : 'OPD'),
      visitType: linkedAppointment ? 'FIRST_VISIT' : 'WALK_IN',
      status: initialStatus,
      chiefComplaint: input.chiefComplaint || 'OPD Clinical Consultation',
      vitals: null,
      consultationNotes: null,
      diagnoses: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      closedAt: null
    };

    this.encountersById.set(encounter.encounterId, encounter);
    if (linkedAppointment) {
      linkedAppointment.status = 'CHECKED_IN';
      linkedAppointment.encounterId = encounter.encounterId;
      linkedAppointment.updatedAt = nowIso;
    }

    if (input.idempotencyKey) {
      this.idempotencyRecords.set(`ENC:${tenantId}:${input.idempotencyKey}`, encounter);
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'encounter.created',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: tenantId,
      departmentId: deptId,
      sourceType: 'ENCOUNTER',
      sourceId: encounter.encounterId,
      state: encounter.status,
      previousState: linkedAppointment ? 'BOOKED' : null,
      newState: encounter.status,
      relatedEncounterId: encounter.encounterId,
      relatedStaffId: encounter.staffId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: deptId,
      summary: `Created encounter ${encounter.encounterNumber} (${encounter.visitNumber}) for ${pat.mrn}`
    });

    return { encounter, idempotentReplay: false };
  }

  public async transitionEncounterStatus(
    session: SessionContext,
    rawEncounterId: string,
    targetStatus: CanonicalEncounterRecord['status'],
    options?: {
      reason?: string;
      vitals?: Record<string, unknown>;
      consultationNotes?: string;
      diagnoses?: Array<{ code: string; description: string }>;
      forceExit?: boolean;
    }
  ): Promise<CanonicalEncounterRecord> {
    const enc = await this.getEncounterOrThrow(session, rawEncounterId);
    const pat = await this.getCanonicalPatientOrThrow(session, enc.patientId);

    await this.verifyActorAuthorization(
      session,
      'ENCOUNTER:UPDATE',
      enc.departmentId,
      pat.patientId,
      enc.encounterId
    );

    // Terminal states cannot be transitioned
    if (['CLOSED', 'EXITED', 'CANCELLED'].includes(enc.status)) {
      throw new AppError({
        message: `Invalid state transition: Encounter "${enc.encounterId}" is in terminal state "${enc.status}" and cannot transition to "${targetStatus}".`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    // Step 5 Canonical state machine rules
    const VALID_TRANSITIONS: Record<string, string[]> = {
      CREATED: ['OPEN', 'CHECKED_IN', 'WAITING', 'IN_PROGRESS', 'IN_CONSULTATION', 'CANCELLED'],
      OPEN: ['WAITING', 'IN_PROGRESS', 'IN_CONSULTATION', 'COMPLETED', 'CLOSED', 'CANCELLED'],
      REGISTERED: ['CHECKED_IN', 'WAITING', 'IN_PROGRESS', 'IN_CONSULTATION', 'CANCELLED'],
      CHECKED_IN: ['WAITING', 'IN_PROGRESS', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'],
      WAITING: ['IN_PROGRESS', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CLOSED', 'EXITED', 'CANCELLED'],
      IN_CONSULTATION: ['COMPLETED', 'CLOSED', 'EXITED', 'CANCELLED'],
      COMPLETED: ['CLOSED', 'EXITED']
    };

    const allowedNext = VALID_TRANSITIONS[enc.status] || [];
    if (!allowedNext.includes(targetStatus) && enc.status !== targetStatus) {
      throw new AppError({
        message: `Invalid encounter status transition from "${enc.status}" to "${targetStatus}". Allowed next states: ${allowedNext.join(', ')}.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    // Safety guard on closing or exiting
    if (['CLOSED', 'EXITED'].includes(targetStatus) && !options?.forceExit) {
      const pendingOrders = Array.from(this.ordersById.values()).filter(
        (o) =>
          o.encounterId === enc.encounterId &&
          !['VERIFIED', 'DISPENSED', 'CANCELLED'].includes(o.status)
      );
      const unpaidTransactions = Array.from(this.transactionsById.values()).filter(
        (t) => t.encounterId === enc.encounterId && t.paymentStatus === 'PENDING'
      );

      if (pendingOrders.length > 0 || unpaidTransactions.length > 0) {
        throw new AppError({
          message: `Cannot close encounter "${enc.encounterNumber}": ${pendingOrders.length} pending clinical order(s) and ${unpaidTransactions.length} unpaid transaction(s) remain open.`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }
    }

    const prevStatus = enc.status;
    const nowIso = new Date().toISOString();
    enc.status = targetStatus;
    if (options?.vitals) enc.vitals = options.vitals;
    if (options?.consultationNotes) enc.consultationNotes = options.consultationNotes;
    if (options?.diagnoses) enc.diagnoses = options.diagnoses;
    enc.updatedAt = nowIso;
    if (['CLOSED', 'EXITED', 'COMPLETED'].includes(targetStatus)) {
      enc.closedAt = nowIso;
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'encounter.status_transitioned',
      patientId: pat.patientId,
      mrn: pat.mrn,
      tenantId: enc.tenantId,
      partnerId: enc.partnerId,
      locationId: enc.branchId,
      departmentId: enc.departmentId,
      sourceType: 'ENCOUNTER',
      sourceId: enc.encounterId,
      state: enc.status,
      previousState: prevStatus,
      newState: enc.status,
      relatedEncounterId: enc.encounterId,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: null,
      summary: `Encounter ${enc.encounterNumber} transitioned: ${prevStatus} -> ${targetStatus}${options?.reason ? ` (${options.reason})` : ''}`
    });

    return enc;
  }

  public async getEncounterOrThrow(
    session: SessionContext,
    rawEncounterId: string,
    expectedPatientId?: string
  ): Promise<CanonicalEncounterRecord> {
    const encounterId = this.assertCanonicalTechnicalId(rawEncounterId, 'encounterId');
    let enc = this.encountersById.get(encounterId);
    if (!enc) {
      enc = (await this.hydrateCanonicalEncounterFromDatabase(session.tenantId, encounterId)) || undefined;
    }
    if (!enc) {
      throw AppError.notFound(`Encounter "${encounterId}" not found`);
    }
    if (!session.isSuperAdmin && enc.tenantId !== session.tenantId) {
      throw new AppError({
        message: 'Cross-tenant encounter access is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    if (expectedPatientId && enc.patientId !== expectedPatientId) {
      throw new AppError({
        message: `Encounter continuity violation: Encounter "${encounterId}" belongs to patient "${enc.patientId}", not "${expectedPatientId}".`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }
    return enc;
  }

  // =========================================================================
  // STEP 5 — TOKEN & QUEUE CONTINUITY (APPEND-ONLY HISTORY)
  // =========================================================================

  public async issueTokenAndEnterQueue(
    session: SessionContext,
    input: {
      patientId: string;
      encounterId: string;
      departmentId?: string;
      staffId?: string;
      priority?: CanonicalTokenQueueRecord['priority'];
      idempotencyKey?: string;
    }
  ): Promise<{ tokenRecord: CanonicalTokenQueueRecord; idempotentReplay: boolean }> {
    const pat = await this.getCanonicalPatientOrThrow(session, input.patientId);
    const enc = await this.getEncounterOrThrow(session, input.encounterId, pat.patientId);
    const deptId = (input.departmentId || enc.departmentId).toUpperCase().trim();
    await this.verifyActorAuthorization(session, 'ENCOUNTER:READ', deptId, pat.patientId, enc.encounterId);

    const tenantId = session.tenantId;
    // Prevent duplicate queue insertion for same encounter + department
    const existingToken = Array.from(this.tokensById.values()).find(
      (t) =>
        t.tenantId === tenantId &&
        t.encounterId === enc.encounterId &&
        t.departmentId === deptId &&
        t.status !== 'CANCELLED'
    );
    if (existingToken) {
      return { tokenRecord: existingToken, idempotentReplay: true };
    }

    const today = new Date().toISOString().split('T')[0]!;
    const tokenNumber = this.generateUniversalNumber(tenantId, 'TOKEN', deptId);
    const seqNum = Number(tokenNumber.split('-').pop() || '1');
    const nowIso = new Date().toISOString();
    const queueEntryNumber = this.generateUniversalNumber(tenantId, 'QUEUE_ENTRY', deptId);
    const queueEntryId = `que-${crypto.randomUUID()}`;

    const tokenRecord: CanonicalTokenQueueRecord = {
      tokenId: `tkn-${crypto.randomUUID()}`,
      tokenNumber,
      queueEntryId,
      queueEntryNumber,
      tenantId,
      partnerId: pat.partnerId || enc.partnerId || tenantId,
      branchId: enc.branchId,
      departmentId: deptId,
      patientId: pat.patientId,
      mrn: pat.mrn,
      encounterId: enc.encounterId,
      appointmentId: enc.appointmentId,
      staffId: input.staffId || enc.staffId,
      queueDate: today,
      sequenceNumber: seqNum,
      priority: input.priority || 'ROUTINE',
      status: 'WAITING',
      history: [
        {
          fromStatus: null,
          toStatus: 'WAITING',
          actorId: session.userId,
          timestamp: nowIso
        }
      ],
      createdAt: nowIso,
      assignedAt: nowIso,
      startedAt: null,
      completedAt: null
    };

    this.tokensById.set(tokenRecord.tokenId, tokenRecord);
    enc.status = 'WAITING';
    enc.updatedAt = nowIso;

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'token.issued',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: tenantId,
      departmentId: deptId,
      sourceType: 'QUEUE_TOKEN',
      sourceId: tokenRecord.tokenId,
      state: 'WAITING',
      previousState: 'CHECKED_IN',
      newState: 'WAITING',
      relatedEncounterId: enc.encounterId,
      relatedStaffId: tokenRecord.staffId || session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: deptId,
      summary: `Issued contextual token ${tokenRecord.tokenNumber} in ${deptId} queue`
    });

    return { tokenRecord, idempotentReplay: false };
  }

  public async transitionTokenQueueStatus(
    session: SessionContext,
    rawTokenOrQueueId: string,
    targetStatus: CanonicalTokenQueueRecord['status'],
    options?: {
      roomOrCounter?: string;
      staffId?: string;
      reason?: string;
    }
  ): Promise<CanonicalTokenQueueRecord> {
    const rawVal = String(rawTokenOrQueueId || '').trim();
    if (!rawVal) {
      throw new AppError({
        message: 'Missing mandatory token/queue identifier.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    let token = this.tokensById.get(rawVal);
    if (!token) {
      token = Array.from(this.tokensById.values()).find(
        (t) => t.queueEntryId === rawVal || t.tokenNumber === rawVal || t.queueEntryNumber === rawVal
      );
    }
    if (!token) {
      throw AppError.notFound(`Queue token/entry "${rawVal}" not found`);
    }

    if (!session.isSuperAdmin && token.tenantId !== session.tenantId) {
      throw new AppError({
        message: 'Cross-tenant queue token access is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    await this.verifyActorAuthorization(
      session,
      'ENCOUNTER:UPDATE',
      token.departmentId,
      token.patientId,
      token.encounterId
    );

    // Terminal states cannot be transitioned
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(token.status)) {
      throw new AppError({
        message: `Invalid queue transition: Token "${token.tokenNumber}" is in terminal state "${token.status}" and cannot transition to "${targetStatus}".`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    // Step 7 Queue state machine rules
    const VALID_QUEUE_TRANSITIONS: Record<string, string[]> = {
      CREATED: ['WAITING', 'CALLED', 'CANCELLED', 'NO_SHOW'],
      WAITING: ['CALLED', 'IN_SERVICE', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      CALLED: ['IN_SERVICE', 'IN_PROGRESS', 'WAITING', 'CANCELLED', 'NO_SHOW'],
      IN_SERVICE: ['COMPLETED', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED']
    };

    const allowedNext = VALID_QUEUE_TRANSITIONS[token.status] || [];
    if (!allowedNext.includes(targetStatus) && token.status !== targetStatus) {
      throw new AppError({
        message: `Invalid queue token status transition from "${token.status}" to "${targetStatus}". Allowed next states: ${allowedNext.join(', ')}.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const prevStatus = token.status;
    const nowIso = new Date().toISOString();
    token.status = targetStatus;
    if (options?.staffId) token.staffId = options.staffId;
    if (['IN_SERVICE', 'IN_PROGRESS'].includes(targetStatus) && !token.startedAt) {
      token.startedAt = nowIso;
    }
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(targetStatus)) {
      token.completedAt = nowIso;
    }

    token.history.push({
      fromStatus: prevStatus,
      toStatus: targetStatus,
      actorId: session.userId,
      timestamp: nowIso
    });

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'token.status_transitioned',
      patientId: token.patientId,
      mrn: token.mrn,
      tenantId: token.tenantId,
      partnerId: token.partnerId,
      locationId: token.branchId,
      departmentId: token.departmentId,
      sourceType: 'QUEUE_TOKEN',
      sourceId: token.tokenId,
      state: token.status,
      previousState: prevStatus,
      newState: token.status,
      relatedEncounterId: token.encounterId,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: null,
      summary: `Queue token ${token.tokenNumber} transitioned: ${prevStatus} -> ${targetStatus}${options?.reason ? ` (${options.reason})` : ''}`
    });

    return token;
  }

  public async listDepartmentQueue(
    session: SessionContext,
    filters?: {
      departmentId?: string;
      status?: string;
      branchId?: string;
      queueDate?: string;
    }
  ): Promise<CanonicalTokenQueueRecord[]> {
    const tenantId = session.tenantId;
    await this.verifyActorAuthorization(
      session,
      'ENCOUNTER:READ',
      filters?.departmentId || session.departmentId,
      undefined,
      undefined,
      undefined,
      filters?.branchId || session.branchId
    );

    return Array.from(this.tokensById.values())
      .filter((t) => {
        if (t.tenantId !== tenantId) return false;
        if (filters?.departmentId && t.departmentId.toUpperCase() !== filters.departmentId.toUpperCase().trim()) return false;
        if (filters?.status && t.status.toUpperCase() !== filters.status.toUpperCase().trim()) return false;
        if (filters?.branchId && t.branchId !== filters.branchId) return false;
        if (filters?.queueDate && t.queueDate !== filters.queueDate) return false;
        return true;
      })
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  public async recordDoctorConsultation(
    session: SessionContext,
    input: {
      patientId: string;
      encounterId: string;
      vitals?: Record<string, unknown>;
      consultationNotes: string;
      diagnoses: Array<{ code: string; description: string }>;
    }
  ): Promise<CanonicalEncounterRecord> {
    const pat = await this.getCanonicalPatientOrThrow(session, input.patientId);
    const enc = await this.getEncounterOrThrow(session, input.encounterId, pat.patientId);
    await this.verifyActorAuthorization(session, 'ENCOUNTER:UPDATE', enc.departmentId, pat.patientId, enc.encounterId);

    const prevStatus = enc.status;
    const nowIso = new Date().toISOString();
    enc.status = 'IN_CONSULTATION';
    enc.vitals = input.vitals || enc.vitals;
    enc.consultationNotes = input.consultationNotes;
    enc.diagnoses = input.diagnoses;
    enc.updatedAt = nowIso;

    // Advance linked queue token history without overwriting prior events
    const token = Array.from(this.tokensById.values()).find((t) => t.encounterId === enc.encounterId);
    if (token && token.status === 'WAITING') {
      token.history.push({
        fromStatus: token.status,
        toStatus: 'IN_PROGRESS',
        actorId: session.userId,
        timestamp: nowIso
      });
      token.status = 'IN_PROGRESS';
      token.startedAt = nowIso;
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'consultation.recorded',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: session.tenantId,
      departmentId: enc.departmentId,
      sourceType: 'CONSULTATION',
      sourceId: enc.encounterId,
      state: 'IN_CONSULTATION',
      previousState: prevStatus,
      newState: 'IN_CONSULTATION',
      relatedEncounterId: enc.encounterId,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: null,
      summary: `Doctor consultation recorded for ${pat.mrn} (${input.diagnoses.map((d) => d.code).join(', ')})`
    });

    return enc;
  }

  // =========================================================================
  // STEP 6 & STEP 7 — ORDER IDENTITY & UNIVERSAL WORKFLOW TASK LINKAGE
  // =========================================================================

  public async createClinicalOrder(
    session: SessionContext,
    input: {
      patientId?: string;
      encounterId?: string;
      targetDepartmentId: string;
      orderType: CanonicalOrderRecord['orderType'];
      itemCode: string;
      itemName: string;
      priority?: CanonicalOrderRecord['priority'];
      idempotencyKey?: string;
    }
  ): Promise<{ order: CanonicalOrderRecord; idempotentReplay: boolean }> {
    if (!input.patientId) {
      throw new AppError({
        message: 'Orphan order forbidden: Every clinical order must be linked to a canonical patientId.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }
    if (!input.encounterId) {
      throw new AppError({
        message: 'Missing encounter linkage: Every clinical order must be linked to a valid encounterId.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const pat = await this.getCanonicalPatientOrThrow(session, input.patientId);
    const enc = await this.getEncounterOrThrow(session, input.encounterId, pat.patientId);
    const targetDept = input.targetDepartmentId.toUpperCase().trim();
    await this.verifyActorAuthorization(session, 'ENCOUNTER:UPDATE', enc.departmentId, pat.patientId, enc.encounterId);

    const tenantId = session.tenantId;
    if (input.idempotencyKey) {
      const cached = this.idempotencyRecords.get(
        `ORD:${tenantId}:${input.idempotencyKey}`
      ) as CanonicalOrderRecord | undefined;
      if (cached) {
        return { order: cached, idempotentReplay: true };
      }
    }

    const orderId = `ord-${crypto.randomUUID()}`;
    const orderNumber = this.generateUniversalNumber(tenantId, 'ORDER', targetDept);
    const accessionNumber =
      input.orderType === 'LAB' ? this.generateUniversalNumber(tenantId, 'ACCESSION', 'LIMS') : null;

    // Spawn linked Universal Workflow Instance & Task in Phase 4 Engine!
    const wfCreated = await universalHealthcareWorkflowEngineService.createWorkflowInstance(session, {
      workflowCodeOrDepartment: targetDept === 'LAB' ? 'LIMS' : targetDept,
      locationId: enc.branchId,
      departmentId: targetDept,
      patientId: pat.patientId,
      encounterId: enc.encounterId,
      orderId,
      priority: input.priority || 'ROUTINE'
    });

    const nowIso = new Date().toISOString();
    const order: CanonicalOrderRecord = {
      orderId,
      orderNumber,
      tenantId,
      partnerId: pat.partnerId || enc.partnerId || tenantId,
      branchId: enc.branchId,
      sourceDepartmentId: enc.departmentId,
      targetDepartmentId: targetDept,
      patientId: pat.patientId,
      mrn: pat.mrn,
      encounterId: enc.encounterId,
      orderingStaffId: session.userId,
      orderType: input.orderType,
      itemCode: input.itemCode,
      itemName: input.itemName,
      priority: input.priority || 'ROUTINE',
      workflowInstanceId: wfCreated.instance.workflowInstanceId,
      taskId: wfCreated.initialTask.taskId,
      accessionNumber,
      status: 'ORDERED',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.ordersById.set(order.orderId, order);
    if (input.idempotencyKey) {
      this.idempotencyRecords.set(`ORD:${tenantId}:${input.idempotencyKey}`, order);
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'order.created',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: tenantId,
      departmentId: targetDept,
      sourceType: 'CLINICAL_ORDER',
      sourceId: order.orderId,
      state: 'ORDERED',
      previousState: null,
      newState: 'ORDERED',
      relatedEncounterId: enc.encounterId,
      relatedStaffId: session.userId,
      relatedOrderId: order.orderId,
      relatedTaskId: order.taskId,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: targetDept,
      summary: `Created ${order.orderType} order ${order.orderNumber} (${order.itemName}) -> ${targetDept}`
    });

    return { order, idempotentReplay: false };
  }

  public getOrderOrThrow(
    session: SessionContext,
    rawOrderId: string,
    expectedPatientId?: string,
    expectedEncounterId?: string
  ): CanonicalOrderRecord {
    const orderId = this.assertCanonicalTechnicalId(rawOrderId, 'orderId');
    const ord = this.ordersById.get(orderId);
    if (!ord) {
      throw AppError.notFound(`Clinical order "${orderId}" not found`);
    }
    if (!session.isSuperAdmin && ord.tenantId !== session.tenantId) {
      throw new AppError({
        message: 'Cross-tenant order access is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    if (expectedPatientId && ord.patientId !== expectedPatientId) {
      throw new AppError({
        message: `Wrong patient linkage: Order "${orderId}" belongs to patient "${ord.patientId}", not "${expectedPatientId}".`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }
    if (expectedEncounterId && ord.encounterId !== expectedEncounterId) {
      throw new AppError({
        message: `Encounter mismatch: Order "${orderId}" belongs to encounter "${ord.encounterId}", not "${expectedEncounterId}".`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }
    return ord;
  }

  // =========================================================================
  // STEP 8 — RESULT / CLINICAL ACTION / PRESCRIPTION / DISPENSING LINKAGE
  // =========================================================================

  public async recordResultOrClinicalAction(
    session: SessionContext,
    input: {
      patientId?: string;
      encounterId?: string;
      orderId?: string;
      resultType: CanonicalResultActionRecord['resultType'];
      summary: string;
      structuredValues?: Record<string, unknown>;
      verifyImmediately?: boolean;
      idempotencyKey?: string;
      staffStatusOverride?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'REVOKED';
    }
  ): Promise<{ result: CanonicalResultActionRecord; idempotentReplay: boolean }> {
    if (!input.patientId) {
      throw new AppError({
        message: 'Orphan result/action forbidden: patientId is mandatory.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }
    if (!input.encounterId || !input.orderId) {
      throw new AppError({
        message: 'Orphan result/action forbidden: encounterId and orderId are mandatory.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const pat = await this.getCanonicalPatientOrThrow(session, input.patientId);
    const enc = await this.getEncounterOrThrow(session, input.encounterId, pat.patientId);
    const ord = this.getOrderOrThrow(session, input.orderId, pat.patientId, enc.encounterId);

    await this.verifyActorAuthorization(
      session,
      'ENCOUNTER:UPDATE',
      ord.targetDepartmentId,
      pat.patientId,
      enc.encounterId,
      input.staffStatusOverride
    );

    const tenantId = session.tenantId;
    if (input.idempotencyKey) {
      const cached = this.idempotencyRecords.get(
        `RES:${tenantId}:${input.idempotencyKey}`
      ) as CanonicalResultActionRecord | undefined;
      if (cached) {
        return { result: cached, idempotentReplay: true };
      }
    }

    const nowIso = new Date().toISOString();
    const isVerified = input.verifyImmediately !== false;
    const isDispensing = input.resultType === 'PHARMACY_DISPENSING';

    const numberType: UniversalEntityNumberType =
      input.resultType === 'PRESCRIPTION'
        ? 'PRESCRIPTION'
        : isDispensing
        ? 'DISPENSING'
        : 'RESULT';

    const resultRecord: CanonicalResultActionRecord = {
      resultId: `res-${crypto.randomUUID()}`,
      resultNumber: this.generateUniversalNumber(tenantId, numberType, ord.targetDepartmentId),
      accessionNumber: ord.accessionNumber,
      tenantId,
      partnerId: pat.partnerId || ord.partnerId || tenantId,
      departmentId: ord.targetDepartmentId,
      patientId: pat.patientId,
      mrn: pat.mrn,
      encounterId: enc.encounterId,
      orderId: ord.orderId,
      taskId: ord.taskId,
      performedByStaffId: session.userId,
      verifiedByStaffId: isVerified ? session.userId : null,
      resultType: input.resultType,
      status: isDispensing ? 'DISPENSED' : isVerified ? 'VERIFIED' : 'PRELIMINARY',
      summary: input.summary,
      structuredValues: input.structuredValues || {},
      createdAt: nowIso,
      verifiedAt: isVerified ? nowIso : null
    };

    this.resultsById.set(resultRecord.resultId, resultRecord);
    ord.status = isDispensing ? 'DISPENSED' : isVerified ? 'VERIFIED' : 'RESULTED';
    ord.updatedAt = nowIso;

    // Transition Phase 4 task to COMPLETED -> VERIFIED
    try {
      await universalHealthcareWorkflowEngineService.transitionTask(session, ord.taskId, {
        transitionCode: 'START'
      });
      await universalHealthcareWorkflowEngineService.transitionTask(session, ord.taskId, {
        transitionCode: 'COMPLETE'
      });
      if (isVerified) {
        await universalHealthcareWorkflowEngineService.transitionTask(session, ord.taskId, {
          transitionCode: 'VERIFY'
        });
      }
    } catch {}

    if (input.idempotencyKey) {
      this.idempotencyRecords.set(`RES:${tenantId}:${input.idempotencyKey}`, resultRecord);
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: isDispensing
        ? 'dispensing.completed'
        : input.resultType === 'PRESCRIPTION'
        ? 'prescription.created'
        : 'result.verified',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: tenantId,
      departmentId: ord.targetDepartmentId,
      sourceType: input.resultType,
      sourceId: resultRecord.resultId,
      state: resultRecord.status,
      previousState: 'ORDERED',
      newState: resultRecord.status,
      relatedEncounterId: enc.encounterId,
      relatedStaffId: session.userId,
      relatedOrderId: ord.orderId,
      relatedTaskId: ord.taskId,
      relatedResultId: resultRecord.resultId,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: isDispensing ? 'BILLING' : 'OPD',
      summary: `${input.resultType} ${resultRecord.resultNumber}: ${input.summary}`
    });

    return { result: resultRecord, idempotentReplay: false };
  }

  // =========================================================================
  // STEP 9 — FINANCIAL TRANSACTION LINKAGE (INVOICE & PAYMENT)
  // =========================================================================

  public async recordFinancialTransaction(
    session: SessionContext,
    input: {
      patientId?: string;
      encounterId?: string;
      sourceEntityType: CanonicalTransactionRecord['sourceEntityType'];
      sourceEntityId?: string;
      amount: number;
      paymentMethod?: string;
      markPaid?: boolean;
      idempotencyKey?: string;
    }
  ): Promise<{ transaction: CanonicalTransactionRecord; idempotentReplay: boolean }> {
    if (!input.patientId || !input.encounterId || !input.sourceEntityId) {
      throw new AppError({
        message: 'Orphan financial transaction forbidden: patientId, encounterId, and sourceEntityId are mandatory.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const pat = await this.getCanonicalPatientOrThrow(session, input.patientId);
    const enc = await this.getEncounterOrThrow(session, input.encounterId, pat.patientId);
    await this.verifyActorAuthorization(session, 'BILLING:INVOICE_CREATE', 'BILLING', pat.patientId, enc.encounterId);

    // Verify source entity belongs to this exact patient & encounter
    if (input.sourceEntityType === 'ORDER') {
      this.getOrderOrThrow(session, input.sourceEntityId, pat.patientId, enc.encounterId);
    } else if (input.sourceEntityType === 'ENCOUNTER' && input.sourceEntityId !== enc.encounterId) {
      throw AppError.conflict('Transaction sourceEntityId does not match encounterId');
    }

    const tenantId = session.tenantId;
    if (input.idempotencyKey) {
      const cached = this.idempotencyRecords.get(
        `TXN:${tenantId}:${input.idempotencyKey}`
      ) as CanonicalTransactionRecord | undefined;
      if (cached) {
        return { transaction: cached, idempotentReplay: true };
      }
    }

    const nowIso = new Date().toISOString();
    const isPaid = input.markPaid !== false;
    const transaction: CanonicalTransactionRecord = {
      transactionId: `txn-${crypto.randomUUID()}`,
      transactionNumber: this.generateUniversalNumber(tenantId, 'TRANSACTION', 'BILLING'),
      invoiceId: `inv-${crypto.randomUUID()}`,
      invoiceNumber: this.generateUniversalNumber(tenantId, 'INVOICE', 'BILLING'),
      tenantId,
      partnerId: pat.partnerId || enc.partnerId || tenantId,
      departmentId: 'BILLING',
      patientId: pat.patientId,
      mrn: pat.mrn,
      encounterId: enc.encounterId,
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      amount: Number(input.amount || 0),
      currency: 'INR',
      paymentStatus: isPaid ? 'PAID' : 'PENDING',
      paymentMethod: input.paymentMethod || 'UPI',
      recordedByStaffId: session.userId,
      createdAt: nowIso,
      paidAt: isPaid ? nowIso : null
    };

    this.transactionsById.set(transaction.transactionId, transaction);
    if (input.idempotencyKey) {
      this.idempotencyRecords.set(`TXN:${tenantId}:${input.idempotencyKey}`, transaction);
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'transaction.created',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: tenantId,
      departmentId: 'BILLING',
      sourceType: 'FINANCIAL_TRANSACTION',
      sourceId: transaction.transactionId,
      state: transaction.paymentStatus,
      previousState: null,
      newState: transaction.paymentStatus,
      relatedEncounterId: enc.encounterId,
      relatedStaffId: session.userId,
      relatedOrderId: input.sourceEntityType === 'ORDER' ? input.sourceEntityId : null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: transaction.transactionId,
      relatedDocumentId: null,
      nextDepartment: 'EXIT',
      summary: `Billing invoice ${transaction.invoiceNumber} (${transaction.transactionNumber}) ${transaction.paymentStatus}`
    });

    return { transaction, idempotentReplay: false };
  }

  // =========================================================================
  // STEP 10 — CANONICAL CLINICAL DOCUMENT LINKAGE (SURVIVES RENAME/STORAGE CHANGE)
  // =========================================================================

  public async linkClinicalDocument(
    session: SessionContext,
    input: {
      patientId: string;
      encounterId: string;
      departmentId: string;
      sourceEntityType: CanonicalDocumentRecord['sourceEntityType'];
      sourceEntityId: string;
      orderId?: string;
      resultId?: string;
      title: string;
      fileName: string;
      storageUri: string;
      mimeType?: string;
    }
  ): Promise<CanonicalDocumentRecord> {
    const pat = await this.getCanonicalPatientOrThrow(session, input.patientId);
    const enc = await this.getEncounterOrThrow(session, input.encounterId, pat.patientId);
    await this.verifyActorAuthorization(session, 'PATIENT:READ', input.departmentId, pat.patientId, enc.encounterId);

    if (input.orderId) {
      this.getOrderOrThrow(session, input.orderId, pat.patientId, enc.encounterId);
    }
    if (input.resultId) {
      const resRec = this.resultsById.get(input.resultId);
      if (!resRec || resRec.patientId !== pat.patientId) {
        throw new AppError({
          message: `Wrong patient document linkage: Result "${input.resultId}" does not belong to patient "${pat.patientId}".`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }
    }

    const tenantId = session.tenantId;
    const nowIso = new Date().toISOString();
    const doc: CanonicalDocumentRecord = {
      documentId: `doc-${crypto.randomUUID()}`,
      documentNumber: this.generateUniversalNumber(tenantId, 'DOCUMENT', input.departmentId),
      tenantId,
      partnerId: pat.partnerId || enc.partnerId || tenantId,
      departmentId: input.departmentId.toUpperCase().trim(),
      patientId: pat.patientId,
      mrn: pat.mrn,
      encounterId: enc.encounterId,
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      orderId: input.orderId || null,
      resultId: input.resultId || null,
      title: input.title,
      fileName: input.fileName,
      storageUri: input.storageUri,
      mimeType: input.mimeType || 'application/pdf',
      uploadedByStaffId: session.userId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.documentsById.set(doc.documentId, doc);

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'document.linked',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: tenantId,
      departmentId: doc.departmentId,
      sourceType: 'CLINICAL_DOCUMENT',
      sourceId: doc.documentId,
      state: 'LINKED',
      previousState: null,
      newState: 'LINKED',
      relatedEncounterId: enc.encounterId,
      relatedStaffId: session.userId,
      relatedOrderId: doc.orderId,
      relatedTaskId: null,
      relatedResultId: doc.resultId,
      relatedTransactionId: null,
      relatedDocumentId: doc.documentId,
      nextDepartment: null,
      summary: `Linked clinical document ${doc.documentNumber} (${doc.title}) to ${pat.mrn}`
    });

    return doc;
  }

  public async renameOrRelocateDocument(
    session: SessionContext,
    rawDocumentId: string,
    newFileName: string,
    newStorageUri: string
  ): Promise<CanonicalDocumentRecord> {
    const documentId = this.assertCanonicalTechnicalId(rawDocumentId, 'documentId');
    const doc = this.documentsById.get(documentId);
    if (!doc) {
      throw AppError.notFound(`Document "${documentId}" not found`);
    }
    if (!session.isSuperAdmin && doc.tenantId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant document modification is strictly forbidden');
    }

    doc.fileName = newFileName;
    doc.storageUri = newStorageUri;
    doc.updatedAt = new Date().toISOString();
    this.invalidatePatient360Cache(doc.tenantId, doc.patientId);
    return doc;
  }

  // =========================================================================
  // STEP 14 — PATIENT EXIT / DISCHARGE GUARD (PENDING RESULT & BILLING CHECK)
  // =========================================================================

  public async exitPatientEncounter(
    session: SessionContext,
    rawEncounterId: string,
    options?: { forceExit?: boolean; overrideReason?: string }
  ): Promise<CanonicalEncounterRecord> {
    const enc = await this.getEncounterOrThrow(session, rawEncounterId);
    const pat = await this.getCanonicalPatientOrThrow(session, enc.patientId);
    await this.verifyActorAuthorization(session, 'ENCOUNTER:UPDATE', enc.departmentId, pat.patientId, enc.encounterId);

    const pendingOrders = Array.from(this.ordersById.values()).filter(
      (o) =>
        o.encounterId === enc.encounterId &&
        !['VERIFIED', 'DISPENSED', 'CANCELLED'].includes(o.status)
    );
    const unpaidTransactions = Array.from(this.transactionsById.values()).filter(
      (t) => t.encounterId === enc.encounterId && t.paymentStatus === 'PENDING'
    );

    if ((pendingOrders.length > 0 || unpaidTransactions.length > 0) && !options?.forceExit) {
      throw new AppError({
        message: `Cannot complete Patient Exit for encounter "${enc.encounterNumber}": ${pendingOrders.length} pending clinical order(s)/result(s) and ${unpaidTransactions.length} unpaid invoice(s) remain open.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const prevStatus = enc.status;
    const nowIso = new Date().toISOString();
    enc.status = 'EXITED';
    enc.closedAt = nowIso;
    enc.updatedAt = nowIso;

    const token = Array.from(this.tokensById.values()).find((t) => t.encounterId === enc.encounterId);
    if (token && token.status !== 'COMPLETED') {
      token.history.push({
        fromStatus: token.status,
        toStatus: 'COMPLETED',
        actorId: session.userId,
        timestamp: nowIso
      });
      token.status = 'COMPLETED';
      token.completedAt = nowIso;
    }

    await this.appendLineageAndTimeline({
      who: session.userId,
      what: 'encounter.exited',
      patientId: pat.patientId,
      mrn: pat.mrn,
      partnerId: session.tenantId,
      departmentId: enc.departmentId,
      sourceType: 'ENCOUNTER',
      sourceId: enc.encounterId,
      state: 'EXITED',
      previousState: prevStatus,
      newState: 'EXITED',
      relatedEncounterId: enc.encounterId,
      relatedStaffId: session.userId,
      relatedOrderId: null,
      relatedTaskId: null,
      relatedResultId: null,
      relatedTransactionId: null,
      relatedDocumentId: null,
      nextDepartment: null,
      summary: `Patient ${pat.mrn} exited encounter ${enc.encounterNumber}`
    });

    return enc;
  }

  // =========================================================================
  // STEP 12 & STEP 13 — AUTHORITATIVE PATIENT 360 READ MODEL & TIMELINE
  // =========================================================================

  public reconstructPatientTimelineFromSources(tenantId: string, patientId: string): PatientTimelineEvent[] {
    const pat = this.patientsById.get(patientId);
    if (!pat || pat.tenantId !== tenantId) {
      return [];
    }

    const events: PatientTimelineEvent[] = [];
    const pKey = `${tenantId}:${patientId}`;
    const recordedEvents = this.timelineByPatient.get(pKey) || [];

    for (const ev of recordedEvents) {
      events.push(ev);
    }

    // Synthesize source records to guarantee completeness
    events.push({
      eventId: `TLE-SRC-PAT-${pat.patientId}`,
      patientId: pat.patientId,
      mrn: pat.mrn,
      tenantId: pat.tenantId,
      partnerId: pat.partnerId,
      locationId: pat.branchId,
      encounterId: null,
      sourceType: 'PATIENT_MASTER',
      sourceId: pat.patientId,
      source: 'PATIENT_MASTER',
      entityId: pat.patientId,
      departmentId: 'REGISTRATION',
      department: 'REGISTRATION',
      staffId: 'system',
      actor: 'system',
      timestamp: pat.createdAt,
      occurredAt: pat.createdAt,
      recordedAt: pat.createdAt,
      eventType: 'patient.created',
      status: pat.status,
      summary: `Patient registration: ${pat.legalName} (${pat.mrn})`
    });

    for (const apt of this.appointmentsById.values()) {
      if (apt.tenantId === tenantId && apt.patientId === patientId) {
        events.push({
          eventId: `TLE-SRC-APT-${apt.appointmentId}`,
          patientId: apt.patientId,
          mrn: apt.mrn,
          tenantId: apt.tenantId,
          partnerId: apt.partnerId,
          locationId: apt.branchId,
          encounterId: apt.encounterId,
          sourceType: 'APPOINTMENT',
          sourceId: apt.appointmentId,
          source: 'APPOINTMENT',
          entityId: apt.appointmentId,
          departmentId: apt.departmentId,
          department: apt.departmentId,
          staffId: apt.doctorId,
          actor: apt.doctorId,
          timestamp: apt.createdAt,
          occurredAt: apt.createdAt,
          recordedAt: apt.createdAt,
          eventType: 'appointment.booked',
          status: apt.status,
          summary: `Appointment ${apt.appointmentNumber} with Dr. ${apt.doctorId}`
        });
      }
    }

    for (const enc of this.encountersById.values()) {
      if (enc.tenantId === tenantId && enc.patientId === patientId) {
        events.push({
          eventId: `TLE-SRC-ENC-${enc.encounterId}`,
          patientId: enc.patientId,
          mrn: enc.mrn,
          tenantId: enc.tenantId,
          partnerId: enc.partnerId,
          locationId: enc.branchId,
          encounterId: enc.encounterId,
          sourceType: 'ENCOUNTER',
          sourceId: enc.encounterId,
          source: 'ENCOUNTER',
          entityId: enc.encounterId,
          departmentId: enc.departmentId,
          department: enc.departmentId,
          staffId: enc.staffId,
          actor: enc.staffId,
          timestamp: enc.createdAt,
          occurredAt: enc.createdAt,
          recordedAt: enc.createdAt,
          eventType: 'encounter.created',
          status: enc.status,
          summary: `Encounter ${enc.encounterNumber} (${enc.encounterType})`
        });
        if (enc.consultationNotes || (enc.diagnoses && enc.diagnoses.length > 0)) {
          events.push({
            eventId: `TLE-SRC-CON-${enc.encounterId}`,
            patientId: enc.patientId,
            mrn: enc.mrn,
            tenantId: enc.tenantId,
            partnerId: enc.partnerId,
            locationId: enc.branchId,
            encounterId: enc.encounterId,
            sourceType: 'CONSULTATION',
            sourceId: enc.encounterId,
            source: 'CONSULTATION',
            entityId: enc.encounterId,
            departmentId: enc.departmentId,
            department: enc.departmentId,
            staffId: enc.staffId,
            actor: enc.staffId,
            timestamp: enc.updatedAt,
            occurredAt: enc.updatedAt,
            recordedAt: enc.updatedAt,
            eventType: 'consultation.recorded',
            status: enc.status,
            summary: `Consultation notes recorded: ${enc.diagnoses.map((d) => d.code).join(', ')}`
          });
        }
      }
    }

    for (const tkn of this.tokensById.values()) {
      if (tkn.tenantId === tenantId && tkn.patientId === patientId) {
        events.push({
          eventId: `TLE-SRC-TKN-${tkn.tokenId}`,
          patientId: tkn.patientId,
          mrn: tkn.mrn,
          tenantId: tkn.tenantId,
          partnerId: tkn.partnerId,
          locationId: tkn.branchId,
          encounterId: tkn.encounterId,
          sourceType: 'QUEUE_TOKEN',
          sourceId: tkn.tokenId,
          source: 'QUEUE_TOKEN',
          entityId: tkn.tokenId,
          departmentId: tkn.departmentId,
          department: tkn.departmentId,
          staffId: tkn.staffId || 'system',
          actor: tkn.staffId || 'system',
          timestamp: tkn.createdAt,
          occurredAt: tkn.createdAt,
          recordedAt: tkn.createdAt,
          eventType: 'token.issued',
          status: tkn.status,
          summary: `Token ${tkn.tokenNumber} in queue for ${tkn.departmentId}`
        });
      }
    }

    for (const ord of this.ordersById.values()) {
      if (ord.tenantId === tenantId && ord.patientId === patientId) {
        events.push({
          eventId: `TLE-SRC-ORD-${ord.orderId}`,
          patientId: ord.patientId,
          mrn: ord.mrn,
          tenantId: ord.tenantId,
          partnerId: ord.partnerId,
          locationId: ord.branchId,
          encounterId: ord.encounterId,
          sourceType: 'CLINICAL_ORDER',
          sourceId: ord.orderId,
          source: 'CLINICAL_ORDER',
          entityId: ord.orderId,
          departmentId: ord.targetDepartmentId,
          department: ord.targetDepartmentId,
          staffId: ord.orderingStaffId,
          actor: ord.orderingStaffId,
          timestamp: ord.createdAt,
          occurredAt: ord.createdAt,
          recordedAt: ord.createdAt,
          eventType: 'order.created',
          status: ord.status,
          summary: `Order ${ord.orderNumber} for ${ord.itemName}`
        });
      }
    }

    for (const res of this.resultsById.values()) {
      if (res.tenantId === tenantId && res.patientId === patientId) {
        events.push({
          eventId: `TLE-SRC-RES-${res.resultId}`,
          patientId: res.patientId,
          mrn: res.mrn,
          tenantId: res.tenantId,
          partnerId: res.partnerId,
          locationId: pat.branchId,
          encounterId: res.encounterId,
          sourceType: res.resultType,
          sourceId: res.resultId,
          source: res.resultType,
          entityId: res.resultId,
          departmentId: res.departmentId,
          department: res.departmentId,
          staffId: res.performedByStaffId,
          actor: res.performedByStaffId,
          timestamp: res.createdAt,
          occurredAt: res.createdAt,
          recordedAt: res.createdAt,
          eventType: 'result.verified',
          status: res.status,
          summary: `${res.resultType}: ${res.summary}`
        });
      }
    }

    for (const txn of this.transactionsById.values()) {
      if (txn.tenantId === tenantId && txn.patientId === patientId) {
        events.push({
          eventId: `TLE-SRC-TXN-${txn.transactionId}`,
          patientId: txn.patientId,
          mrn: txn.mrn,
          tenantId: txn.tenantId,
          partnerId: txn.partnerId,
          locationId: pat.branchId,
          encounterId: txn.encounterId,
          sourceType: 'FINANCIAL_TRANSACTION',
          sourceId: txn.transactionId,
          source: 'FINANCIAL_TRANSACTION',
          entityId: txn.transactionId,
          departmentId: txn.departmentId,
          department: txn.departmentId,
          staffId: txn.recordedByStaffId,
          actor: txn.recordedByStaffId,
          timestamp: txn.createdAt,
          occurredAt: txn.createdAt,
          recordedAt: txn.createdAt,
          eventType: 'transaction.created',
          status: txn.paymentStatus,
          summary: `Invoice ${txn.invoiceNumber} (${txn.amount} ${txn.currency}) - ${txn.paymentStatus}`
        });
      }
    }

    for (const doc of this.documentsById.values()) {
      if (doc.tenantId === tenantId && doc.patientId === patientId) {
        events.push({
          eventId: `TLE-SRC-DOC-${doc.documentId}`,
          patientId: doc.patientId,
          mrn: doc.mrn,
          tenantId: doc.tenantId,
          partnerId: doc.partnerId,
          locationId: pat.branchId,
          encounterId: doc.encounterId,
          sourceType: 'CLINICAL_DOCUMENT',
          sourceId: doc.documentId,
          source: 'CLINICAL_DOCUMENT',
          entityId: doc.documentId,
          departmentId: doc.departmentId,
          department: doc.departmentId,
          staffId: doc.uploadedByStaffId,
          actor: doc.uploadedByStaffId,
          timestamp: doc.createdAt,
          occurredAt: doc.createdAt,
          recordedAt: doc.createdAt,
          eventType: 'document.linked',
          status: 'LINKED',
          summary: `Document linked: ${doc.title}`
        });
      }
    }

    const seen = new Set<string>();
    const deduplicated: PatientTimelineEvent[] = [];
    for (const ev of events) {
      const key = `${ev.sourceType}:${ev.sourceId}:${ev.eventType}:${ev.status}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(ev);
      }
    }

    deduplicated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return deduplicated;
  }

  public async getPatientTimeline(
    session: SessionContext,
    rawPatientId: string,
    scopeOverrideCheck?: {
      tenantId?: string;
      partnerId?: string;
      branchId?: string;
      locationId?: string;
    },
    pagination?: { limit?: number | undefined; offset?: number | undefined }
  ): Promise<PatientTimelineEvent[]> {
    const pat = await this.getCanonicalPatientOrThrow(session, rawPatientId, scopeOverrideCheck);
    await this.verifyActorAuthorization(
      session,
      'PATIENT:READ',
      session.departmentId,
      pat.patientId,
      undefined,
      undefined,
      pat.branchId
    );

    // Ensure cold encounters are hydrated from PostgreSQL if needed
    try {
      const db = getDatabase();
      if (db) {
        const memEncounters = Array.from(this.encountersById.values()).filter(
          (e) => e.tenantId === session.tenantId && e.patientId === pat.patientId
        );
        if (memEncounters.length === 0) {
          const dbEncounters = await db
            .select()
            .from(clinicalEncounters)
            .where(and(eq(clinicalEncounters.tenantId, session.tenantId), eq(clinicalEncounters.patientId, pat.patientId)));
          for (const dbEnc of dbEncounters) {
            if (!this.encountersById.has(dbEnc.id)) {
              this.encountersById.set(dbEnc.id, {
                encounterId: dbEnc.id,
                encounterNumber: dbEnc.encounterNumber,
                visitId: `vst-${dbEnc.id}`,
                visitNumber: `VST-${dbEnc.encounterNumber}`,
                tenantId: dbEnc.tenantId,
                partnerId: dbEnc.partnerId || session.tenantId,
                branchId: dbEnc.branchId,
                departmentId: dbEnc.departmentId || 'OPD',
                patientId: dbEnc.patientId,
                mrn: pat.mrn,
                appointmentId: null,
                staffId: dbEnc.doctorId || '',
                encounterType: (dbEnc.encounterType as any) || 'OPD',
                visitType: 'FIRST_VISIT',
                status: (dbEnc.status as any) || 'OPEN',
                chiefComplaint: dbEnc.chiefComplaint || '',
                vitals: null,
                consultationNotes: null,
                diagnoses: [],
                createdAt: dbEnc.createdAt ? new Date(dbEnc.createdAt).toISOString() : new Date().toISOString(),
                updatedAt: dbEnc.updatedAt ? new Date(dbEnc.updatedAt).toISOString() : new Date().toISOString(),
                closedAt: dbEnc.completedAt ? new Date(dbEnc.completedAt).toISOString() : null
              });
            }
          }
        }
      }
    } catch {}

    const events = this.reconstructPatientTimelineFromSources(session.tenantId, pat.patientId);
    if (pagination && (pagination.limit !== undefined || pagination.offset !== undefined)) {
      const offset = Math.max(0, pagination.offset || 0);
      const limit = pagination.limit ? Math.max(1, pagination.limit) : events.length;
      return events.slice(offset, offset + limit);
    }
    return events;
  }

  public async getPatient360(
    session: SessionContext,
    rawPatientId: string,
    scopeOverrideCheck?: {
      tenantId?: string;
      partnerId?: string;
      branchId?: string;
      locationId?: string;
    }
  ): Promise<Patient360ReadModel> {
    const pat = await this.getCanonicalPatientOrThrow(session, rawPatientId, scopeOverrideCheck);
    await this.verifyActorAuthorization(
      session,
      'PATIENT:READ',
      session.departmentId,
      pat.patientId,
      undefined,
      undefined,
      pat.branchId
    );

    const tenantId = session.tenantId;

    // PostgreSQL read model hydration: If cold cache or missing encounters, populate from DB
    try {
      const db = getDatabase();
      if (db) {
        const memEncounters = Array.from(this.encountersById.values()).filter(
          (e) => e.tenantId === tenantId && e.patientId === pat.patientId
        );
        if (memEncounters.length === 0) {
          const dbEncounters = await db
            .select()
            .from(clinicalEncounters)
            .where(and(eq(clinicalEncounters.tenantId, tenantId), eq(clinicalEncounters.patientId, pat.patientId)));
          for (const dbEnc of dbEncounters) {
            if (!this.encountersById.has(dbEnc.id)) {
              this.encountersById.set(dbEnc.id, {
                encounterId: dbEnc.id,
                encounterNumber: dbEnc.encounterNumber,
                visitId: `vst-${dbEnc.id}`,
                visitNumber: `VST-${dbEnc.encounterNumber}`,
                tenantId: dbEnc.tenantId,
                partnerId: dbEnc.partnerId || tenantId,
                branchId: dbEnc.branchId,
                departmentId: dbEnc.departmentId || 'OPD',
                patientId: dbEnc.patientId,
                mrn: pat.mrn,
                appointmentId: null,
                staffId: dbEnc.doctorId || '',
                encounterType: (dbEnc.encounterType as any) || 'OPD',
                visitType: 'FIRST_VISIT',
                status: (dbEnc.status as any) || 'OPEN',
                chiefComplaint: dbEnc.chiefComplaint || '',
                vitals: null,
                consultationNotes: null,
                diagnoses: [],
                createdAt: dbEnc.createdAt ? new Date(dbEnc.createdAt).toISOString() : new Date().toISOString(),
                updatedAt: dbEnc.updatedAt ? new Date(dbEnc.updatedAt).toISOString() : new Date().toISOString(),
                closedAt: dbEnc.completedAt ? new Date(dbEnc.completedAt).toISOString() : null
              });
            }
          }
        }

        const clinicalHistory = await clinicalWorkflowRepository.getPatientClinicalHistory(tenantId, pat.patientId, db).catch(() => null);
        if (clinicalHistory) {
          for (const c of clinicalHistory.consultations || []) {
            const enc = c.encounterId ? this.encountersById.get(c.encounterId) : null;
            if (enc) {
              if (c.vitals && c.vitals.length > 0 && !enc.vitals) {
                const latestVital: any = c.vitals[0];
                enc.vitals = {
                  systolic: latestVital.systolicBp != null ? Number(latestVital.systolicBp) : undefined,
                  diastolic: latestVital.diastolicBp != null ? Number(latestVital.diastolicBp) : undefined,
                  pulse: latestVital.pulseBpm != null ? Number(latestVital.pulseBpm) : undefined,
                  temperature: latestVital.temperatureCelsius != null ? String(latestVital.temperatureCelsius) : undefined,
                  spo2: latestVital.oxygenSaturationPercent != null ? Number(latestVital.oxygenSaturationPercent) : undefined
                };
              }
              if (c.diagnoses && c.diagnoses.length > 0 && enc.diagnoses.length === 0) {
                enc.diagnoses = (c.diagnoses as any[]).map((d: any) => ({
                  code: d.icd10Code || d.diagnosisCode || 'ICD-GEN',
                  description: d.diagnosisDescription || d.diagnosisName || d.description || ''
                }));
              }
              if ((c as any).clinicalAssessment && !enc.consultationNotes) {
                enc.consultationNotes = (c as any).clinicalAssessment;
              }
            }
          }

          for (const rx of (clinicalHistory.prescriptions || []) as any[]) {
            if (!this.resultsById.has(rx.id)) {
              this.resultsById.set(rx.id, {
                resultId: rx.id,
                resultNumber: rx.prescriptionNumber || `RX-${rx.id.slice(0, 8)}`,
                accessionNumber: null,
                tenantId,
                partnerId: tenantId,
                departmentId: 'PHARMACY',
                patientId: pat.patientId,
                mrn: pat.mrn,
                encounterId: rx.encounterId || '',
                orderId: rx.id,
                taskId: `tsk-${rx.id.slice(0, 8)}`,
                performedByStaffId: rx.prescribingDoctorId || 'PHARMACIST',
                verifiedByStaffId: rx.verifiedByPharmacistId || null,
                resultType: 'PRESCRIPTION',
                status: 'VERIFIED',
                summary: `Prescription ${rx.prescriptionNumber || rx.id}`,
                structuredValues: { raw: rx },
                createdAt: rx.createdAt ? new Date(rx.createdAt).toISOString() : new Date().toISOString(),
                verifiedAt: rx.verifiedAt ? new Date(rx.verifiedAt).toISOString() : null
              });
            }
          }
        }
      }
    } catch {}

    const cacheKey = `${tenantId}:${pat.patientId}`;
    const currentVer = this.patientProjectionVersion.get(cacheKey) || 1;
    const cached = this.patient360ReadCache.get(cacheKey);
    if (cached && cached.version === currentVer) {
      return cached.model;
    }

    const encounters = Array.from(this.encountersById.values()).filter(
      (e) => e.tenantId === tenantId && e.patientId === pat.patientId
    );
    const activeEncounters = encounters.filter(
      (e) => !['COMPLETED', 'EXITED', 'CANCELLED'].includes(e.status)
    );
    const historicalEncounters = encounters.filter((e) =>
      ['COMPLETED', 'EXITED', 'CANCELLED'].includes(e.status)
    );
    const activeEncounter = activeEncounters[0] || encounters[encounters.length - 1] || null;

    const appointments = Array.from(this.appointmentsById.values()).filter(
      (a) => a.tenantId === tenantId && a.patientId === pat.patientId
    );
    const tokens = Array.from(this.tokensById.values()).filter(
      (t) => t.tenantId === tenantId && t.patientId === pat.patientId
    );
    const activeTokenQueue =
      tokens.find((t) => ['WAITING', 'CALLED', 'IN_PROGRESS'].includes(t.status)) || null;

    const orders = Array.from(this.ordersById.values()).filter(
      (o) => o.tenantId === tenantId && o.patientId === pat.patientId
    );
    const results = Array.from(this.resultsById.values()).filter(
      (r) => r.tenantId === tenantId && r.patientId === pat.patientId
    );
    const transactions = Array.from(this.transactionsById.values()).filter(
      (t) => t.tenantId === tenantId && t.patientId === pat.patientId
    );
    const documents = Array.from(this.documentsById.values()).filter(
      (d) => d.tenantId === tenantId && d.patientId === pat.patientId
    );

    const diagnoses: Array<{ encounterId: string; code: string; description: string }> = [];
    const vitalsList: Array<{ encounterId: string; recordedAt: string; values: Record<string, unknown> }> = [];
    const clinicalNotesList: Array<{
      encounterId: string;
      staffId: string;
      chiefComplaint: string;
      notes: string;
      diagnoses: Array<{ code: string; description: string }>;
      recordedAt: string;
    }> = [];

    for (const e of encounters) {
      for (const d of e.diagnoses) {
        diagnoses.push({ encounterId: e.encounterId, code: d.code, description: d.description });
      }
      if (e.vitals && Object.keys(e.vitals).length > 0) {
        vitalsList.push({
          encounterId: e.encounterId,
          recordedAt: e.updatedAt,
          values: e.vitals
        });
      }
      if (e.consultationNotes || e.chiefComplaint) {
        clinicalNotesList.push({
          encounterId: e.encounterId,
          staffId: e.staffId,
          chiefComplaint: e.chiefComplaint,
          notes: e.consultationNotes || '',
          diagnoses: e.diagnoses,
          recordedAt: e.updatedAt
        });
      }
    }

    const labOrders = orders.filter((o) => o.orderType === 'LAB');
    const radiologyOrders = orders.filter((o) => o.orderType === 'RADIOLOGY');
    const labResults = results.filter((r) => r.resultType === 'LAB_RESULT');
    const radiologyReports = results.filter((r) => r.resultType === 'RADIOLOGY_REPORT');
    const prescriptions = results.filter((r) => r.resultType === 'PRESCRIPTION');
    const pharmacyEvents = results.filter((r) => r.resultType === 'PHARMACY_DISPENSING');

    const labAndRadiologyResults = results.filter((r) =>
      ['LAB_RESULT', 'RADIOLOGY_REPORT', 'DOCTOR_REVIEW'].includes(r.resultType)
    );
    const prescriptionsAndDispensings = results.filter((r) =>
      ['PRESCRIPTION', 'PHARMACY_DISPENSING'].includes(r.resultType)
    );

    const totalBilledAmount = transactions.reduce((acc, t) => acc + t.amount, 0);
    const totalPaidAmount = transactions
      .filter((t) => t.paymentStatus === 'PAID')
      .reduce((acc, t) => acc + t.amount, 0);
    const outstandingAmount = Math.max(0, totalBilledAmount - totalPaidAmount);

    const pendingOrders = orders.filter(
      (o) => !['VERIFIED', 'DISPENSED', 'CANCELLED'].includes(o.status)
    );

    const model: Patient360ReadModel = {
      projectionVersion: currentVer,
      generatedAt: new Date().toISOString(),
      zeroState:
        encounters.length === 0 &&
        appointments.length === 0 &&
        orders.length === 0 &&
        results.length === 0 &&
        transactions.length === 0 &&
        documents.length === 0,
      identity: pat,
      demographics: {
        patientId: pat.patientId,
        mrn: pat.mrn,
        patientCode: pat.patientCode,
        legalName: pat.legalName,
        displayName: pat.displayName,
        firstName: pat.firstName,
        lastName: pat.lastName,
        dateOfBirth: pat.dateOfBirth,
        sex: pat.sex,
        status: pat.status
      },
      contact: {
        mobileNumber: pat.mobileNumber,
        email: pat.email,
        address: pat.address,
        emergencyContact: pat.emergencyContact
      },
      partnerLocation: {
        tenantId: pat.tenantId,
        partnerId: pat.partnerId,
        branchId: pat.branchId,
        locationId: pat.branchId
      },
      activeEncounters,
      historicalEncounters,
      appointments,
      vitals: vitalsList,
      clinicalNotes: clinicalNotesList,
      labOrdersResults: {
        orders: labOrders,
        results: labResults
      },
      radiologyStudiesReports: {
        orders: radiologyOrders,
        reports: radiologyReports
      },
      prescriptions,
      pharmacyEvents,
      billingPaymentReferences: transactions,
      workflowTasks: orders.map((o) => ({
        taskId: o.taskId,
        workflowInstanceId: o.workflowInstanceId,
        orderId: o.orderId,
        taskType: `${o.orderType}_${o.itemCode}`,
        departmentId: o.targetDepartmentId,
        state: o.status,
        priority: o.priority
      })),
      currentState: {
        activeEncounter,
        currentDepartment:
          pendingOrders[0]?.targetDepartmentId ||
          activeEncounter?.departmentId ||
          null,
        activeTokenQueue,
        currentOrders: orders,
        pendingTasks: pendingOrders.map((o) => ({
          taskId: o.taskId,
          taskType: `${o.orderType}_${o.itemCode}`,
          departmentId: o.targetDepartmentId,
          state: o.status,
          priority: o.priority
        })),
        pendingResultsCount: pendingOrders.length,
        unpaidInvoicesCount: transactions.filter((t) => t.paymentStatus === 'PENDING').length
      },
      clinicalHistory: {
        encounters,
        diagnoses,
        labAndRadiologyResults,
        prescriptionsAndDispensings
      },
      operations: {
        appointments,
        tokensAndQueues: tokens,
        departmentHandoffs: orders.map((o) => ({
          handoffId: `HND-${o.orderId}`,
          sourceDepartment: o.sourceDepartmentId,
          destinationDepartment: o.targetDepartmentId,
          orderId: o.orderId,
          status: o.status,
          timestamp: o.createdAt
        }))
      },
      commercial: {
        invoicesAndTransactions: transactions,
        totalBilledAmount,
        totalPaidAmount,
        outstandingAmount
      },
      documents,
      timeline: this.reconstructPatientTimelineFromSources(tenantId, pat.patientId),
      auditLineage: this.lineageByPatient.get(cacheKey) || []
    };

    this.patient360ReadCache.set(cacheKey, { version: currentVer, model });
    return model;
  }
}

export const patient360ContinuityService = new Patient360ContinuityService();
