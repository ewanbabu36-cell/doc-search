import { radiologyRepository, type FindRadiologyOrdersParams } from '../../repositories/partner/RadiologyRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { withSecurityContext, getDatabase, billingInvoices, billingInvoiceItems, eq, and } from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import crypto from 'crypto';

export interface RadiologyInputRecord {
  [key: string]: unknown;
  id?: string | undefined;
  tenantId?: string | undefined;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  orderNumber?: string | undefined;
  orderId?: string | undefined;
  patientId?: string | undefined;
  patientName?: string | undefined;
  patientMrn?: string | undefined;
  encounterId?: string | undefined;
  orderingDoctorName?: string | undefined;
  orderingDepartment?: string | undefined;
  procedureId?: string | undefined;
  procedureName?: string | undefined;
  modalityType?: string | undefined;
  modalityCode?: string | undefined;
  modalityName?: string | undefined;
  modalityId?: string | undefined;
  priority?: string | undefined;
  clinicalIndication?: string | undefined;
  requiresContrast?: boolean | undefined;
  pregnancyScreeningResult?: string | undefined;
  renalEgfrResult?: string | undefined;
  knownAllergies?: string | undefined;
  status?: string | undefined;
  orderedAt?: string | undefined;
  appointmentCode?: string | undefined;
  roomNumber?: string | undefined;
  scheduledStart?: string | undefined;
  scheduledEnd?: string | undefined;
  scheduledDateTime?: string | undefined;
  newScheduledDateTime?: string | undefined;
  newModalityCode?: string | undefined;
  newRoomNumber?: string | undefined;
  assignedTechnologistName?: string | undefined;
  technologistAssigned?: string | undefined;
  rescheduleJustification?: string | undefined;
  cancellationReason?: string | undefined;
  preparationCode?: string | undefined;
  fastingConfirmed?: boolean | undefined;
  mriMetalScreeningCleared?: boolean | undefined;
  pregnancyStatusConfirmedNegative?: boolean | undefined;
  renalEgfrAdequate?: boolean | undefined;
  ivCannulaSecured?: boolean | undefined;
  informedConsentSigned?: boolean | undefined;
  preparationNurseName?: string | undefined;
  isReadyForScan?: boolean | undefined;
  isPatientReady?: boolean | undefined;
  accessionNumber?: string | undefined;
  studyInstanceUid?: string | undefined;
  studyDescription?: string | undefined;
  pacsViewerUrl?: string | undefined;
  seriesId?: string | undefined;
  seriesInstanceUid?: string | undefined;
  seriesNumber?: number | undefined;
  modality?: string | undefined;
  seriesDescription?: string | undefined;
  numberOfInstances?: number | undefined;
  bodyPartExamined?: string | undefined;
  protocolName?: string | undefined;
  sopInstanceUid?: string | undefined;
  sopClassUid?: string | undefined;
  instanceNumber?: number | undefined;
  rows?: number | undefined;
  columns?: number | undefined;
  bitsAllocated?: number | undefined;
  bitsStored?: number | undefined;
  windowCenter?: string | undefined;
  windowWidth?: string | undefined;
  sliceThickness?: string | undefined;
  sliceLocation?: string | undefined;
  imageUrl?: string | undefined;
  reportNumber?: string | undefined;
  studyId?: string | undefined;
  findings?: string | undefined;
  amendedFindings?: string | undefined;
  impression?: string | undefined;
  amendedImpression?: string | undefined;
  recommendations?: string | undefined;
  verifyingRadiologistName?: string | undefined;
  reportingRadiologistName?: string | undefined;
  amendmentReason?: string | undefined;
  reasonForAmendment?: string | undefined;
  digitalSignature?: string | undefined;
  alertCode?: string | undefined;
  severity?: string | undefined;
  flaggedByRadiologist?: string | undefined;
  notifiedRecipient?: string | undefined;
  acknowledgedBy?: string | undefined;
  acknowledgedByDoctor?: string | undefined;
  acknowledgmentNotes?: string | undefined;
  clinicalActionNotes?: string | undefined;
  readBackIntimationRecord?: string | undefined;
  eventCode?: string | undefined;
  cptCode?: string | undefined;
  bodyRegion?: string | undefined;
  standardChargeAmount?: string | undefined;
}

export function generateDicomUid(prefix = '1.2.840.10008.2026.1'): string {
  const ts = Date.now();
  const rand = crypto.randomInt(100000, 999999);
  return `${prefix}.${ts}.${rand}`;
}

export class RadiologyService {
  // 1. Overview & Analytics
  async getOverviewMetrics(
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.getOverviewMetrics(scope.tenantId, tx);
    });
  }

  async getAnalytics(
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.getAnalytics(scope.tenantId, tx);
    });
  }

  // 2. Department & Modalities & Procedures
  async getDepartment(
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const dept = await radiologyRepository.getDepartment(scope.tenantId, tx);
      return dept;
    });
  }

  async createDepartment(data: RadiologyInputRecord, session: SessionContext) {
    const d = data as any;
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, { branchId: data.branchId as string | undefined });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const dept = await radiologyRepository.createDepartment(
        {
          ...data,
          departmentCode: (d.departmentCode as string) || 'RAD-DEPT-01',
          departmentName: (d.departmentName as string) || 'Diagnostic Radiology',
          hodRadiologistName:
            (d.hodRadiologistName as string) || (d.headOfDepartment as string) || 'Chief Radiologist',
          chiefTechnologistName:
            (d.chiefTechnologistName as string) || 'Chief Radiology Technologist',
          locationDescription:
            (d.locationDescription as string) || (d.location as string) || 'Main Imaging Wing',
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId || data.branchId
        },
        tx
      );
      return dept;
    });
  }

  async getModalities(
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const items = await radiologyRepository.getModalities(scope.tenantId, tx);
      return ScopeGuard.filterRecordsByScope(items as any[], scope);
    });
  }

  async createModality(data: RadiologyInputRecord, session: SessionContext) {
    const d = data as any;
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, { branchId: data.branchId as string | undefined });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const modalityCode = (d.modalityCode as string) || 'MOD-01';
      const modality = await radiologyRepository.createModality(
        {
          ...data,
          modalityCode,
          modalityName: (d.modalityName as string) || modalityCode,
          modalityType: (d.modalityType as string) || 'X-RAY',
          roomNumber: (d.roomNumber as string) || 'RM-RAD-01',
          manufacturerAndModel:
            (d.manufacturerAndModel as string) ||
            (d.manufacturer as string) ||
            'Clinical Imaging System',
          aetitle:
            (d.aetitle as string) ||
            (d.aeTitle as string) ||
            modalityCode.replace(/[^A-Za-z0-9_]/g, '_').toUpperCase(),
          ipAddress: (d.ipAddress as string) || '127.0.0.1',
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId || data.branchId
        },
        tx
      );
      return modality;
    });
  }

  async getProcedures(
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const items = await radiologyRepository.getProcedures(scope.tenantId, tx);
      const mapped = items.map((item: any) => ({
        ...item,
        standardChargeAmount: item.standardChargeAmount ?? item.priceAmount
      }));
      return ScopeGuard.filterRecordsByScope(mapped as any[], scope);
    });
  }

  async createProcedure(data: RadiologyInputRecord, session: SessionContext) {
    const d = data as any;
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, { branchId: data.branchId as string | undefined });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const rawPriceInput = d.priceAmount ?? d.standardChargeAmount;
      const resolvedPrice =
        rawPriceInput !== undefined && rawPriceInput !== null ? String(rawPriceInput) : '0.00';
      const proc = await radiologyRepository.createProcedure(
        {
          ...data,
          procedureCode: (d.procedureCode as string) || 'PROC-RAD-01',
          procedureName: (d.procedureName as string) || 'Diagnostic Imaging Procedure',
          modalityType: (d.modalityType as string) || 'X-RAY',
          bodyPart: (d.bodyPart as string) || (d.bodyPartExamined as string) || 'GENERAL',
          preparationInstructions:
            (d.preparationInstructions as string) || 'Standard clinical preparation',
          priceAmount: resolvedPrice,
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId || data.branchId
        },
        tx
      );
      return {
        ...proc,
        standardChargeAmount: (proc as any).priceAmount ?? resolvedPrice
      };
    });
  }

  // 3. Orders
  async getOrders(
    params: Omit<FindRadiologyOrdersParams, 'tenantId'> & { tenantId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: params.tenantId,
      branchId: params.branchId,
      departmentId: params.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const res = await radiologyRepository.findManyOrders(
        {
          ...params,
          tenantId: scope.tenantId,
          ...(scope.branchId ? { branchId: scope.branchId } : {})
        },
        tx
      );
      const filteredItems = ScopeGuard.filterRecordsByScope((res.items || []) as any, scope);
      return {
        ...res,
        items: filteredItems,
        total: filteredItems.length
      };
    });
  }

  async getOrderById(
    orderId: string,
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await radiologyRepository.findOrderById(orderId, scope.tenantId, tx);
      if (!order) {
        throw AppError.notFound('Radiology order not found or does not belong to this tenant');
      }
      ScopeGuard.assertRecordInScope(session, order, scope);
      return order;
    });
  }

  private async requireRadiologyOrderInScope(
    session: SessionContext,
    scope: { tenantId: string; branchId?: string | undefined; departmentId?: string | undefined },
    orderId: string | undefined,
    tx: any
  ) {
    if (!orderId) {
      throw new AppError({
        message: 'Target orderId is required for radiology order mutations',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
    const existingOrder = await radiologyRepository.findOrderById(orderId, scope.tenantId, tx);
    if (!existingOrder) {
      throw new AppError({
        message: 'Access denied: Target radiology order does not exist in your organization or branch scope',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    if ((existingOrder as any).tenantId && (existingOrder as any).tenantId !== scope.tenantId) {
      throw new AppError({
        message: 'Access denied: Cross-tenant radiology order mutation is forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    ScopeGuard.assertRecordInScope(session, existingOrder, scope);
    return existingOrder;
  }

  private async requireRadiologyAppointmentInScope(
    session: SessionContext,
    scope: { tenantId: string; branchId?: string | undefined; departmentId?: string | undefined },
    appointmentId: string | undefined,
    tx: any
  ) {
    if (!appointmentId) {
      throw new AppError({
        message: 'Target appointmentId is required for radiology appointment mutations',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
    const existingAppointment = await radiologyRepository.findAppointmentById(appointmentId, scope.tenantId, tx);
    if (!existingAppointment) {
      throw new AppError({
        message: 'Access denied: Target radiology appointment does not exist in your organization or branch scope',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    if ((existingAppointment as any).tenantId && (existingAppointment as any).tenantId !== scope.tenantId) {
      throw new AppError({
        message: 'Access denied: Cross-tenant radiology appointment mutation is forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    ScopeGuard.assertRecordInScope(session, existingAppointment, scope);
    return existingAppointment;
  }

  private async requireRadiologyReportInScope(
    session: SessionContext,
    scope: { tenantId: string; branchId?: string | undefined; departmentId?: string | undefined },
    reportId: string | undefined,
    tx: any
  ) {
    if (!reportId) {
      throw new AppError({
        message: 'Target reportId is required for radiology report operations',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
    const existingReport = await radiologyRepository.findReportById(reportId, scope.tenantId, tx);
    if (!existingReport) {
      throw new AppError({
        message: 'Access denied: Target radiology report does not exist in your organization or branch scope',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    if ((existingReport as any).tenantId && (existingReport as any).tenantId !== scope.tenantId) {
      throw new AppError({
        message: 'Access denied: Cross-tenant radiology report operation is forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    ScopeGuard.assertRecordInScope(session, existingReport, scope);
    return existingReport;
  }

  private async requireRadiologyFindingInScope(
    session: SessionContext,
    scope: { tenantId: string; branchId?: string | undefined; departmentId?: string | undefined },
    findingId: string | undefined,
    tx: any
  ) {
    if (!findingId) {
      throw new AppError({
        message: 'Target findingId is required for radiology critical finding operations',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
    const existingFinding = await radiologyRepository.findCriticalFindingById(findingId, scope.tenantId, tx);
    if (!existingFinding) {
      throw new AppError({
        message: 'Access denied: Target radiology critical finding does not exist in your organization or branch scope',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    if ((existingFinding as any).tenantId && (existingFinding as any).tenantId !== scope.tenantId) {
      throw new AppError({
        message: 'Access denied: Cross-tenant radiology critical finding operation is forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    ScopeGuard.assertRecordInScope(session, existingFinding, scope);
    return existingFinding;
  }

  async createOrder(data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: data.tenantId,
      branchId: data.branchId,
      departmentId: (data as any).departmentId || data.orderingDepartment
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const orderNumber = (data.orderNumber as string) || `RAD-ORD-${Date.now().toString(36).toUpperCase()}`;
      const resolvedDept = scope.departmentId || (data as any).departmentId || data.orderingDepartment;
      const order = await radiologyRepository.createOrder(
        {
          ...data,
          orderNumber,
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId || data.branchId,
          ...(resolvedDept ? { departmentId: resolvedDept, orderingDepartment: resolvedDept } : {})
        },
        tx
      );

      // Record in canonical audit
      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_ORDER_CREATED',
          resourceType: 'radiology_order',
          resourceId: order.id as string,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: {
            orderNumber: order.orderNumber,
            patientName: order.patientName,
            procedureName: order.procedureName,
            modalityType: order.modalityType,
            priority: order.priority
          }
        },
        session,
        tx
      );

      // Record in radiology audit traces
      const integrityHash = crypto.createHash('sha256').update(JSON.stringify({ orderId: order.id, orderNumber, ts: Date.now() })).digest('hex');
      await radiologyRepository.createAuditTrace(
        {
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId,
          traceNumber: `RAD-TRC-${Date.now().toString(36).toUpperCase()}`,
          actorId: session.userId,
          actorName: session.userId,
          actorRole: session.roles[0] || 'DOCTOR',
          action: 'RADIOLOGY_ORDER_CREATED',
          entityType: 'radiology_order',
          entityId: order.id,
          entityCode: order.orderNumber,
          justification: (order.clinicalIndication as string) || 'Clinical Imaging Requested',
          ipAddress: '127.0.0.1',
          integrityHash,
          previousHash: 'GENESIS_HASH_RAD_000',
          newState: order
        },
        tx
      );

      return order;
    });
  }

  async updateOrderStatus(orderId: string, fromStatus: string, toStatus: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existingOrder = await this.requireRadiologyOrderInScope(session, scope, orderId, tx);

      const validTransitions: Record<string, string[]> = {
        DRAFT: ['ORDERED', 'CANCELLED'],
        ORDERED: ['SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
        SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: ['REPORTED', 'VERIFIED'],
        REPORTED: ['VERIFIED', 'AMENDED'],
        VERIFIED: ['AMENDED'],
        CANCELLED: [],
        AMENDED: []
      };

      const authoritativeCurrentStatus = (existingOrder as any).status || fromStatus;
      const allowedNext = validTransitions[authoritativeCurrentStatus] || [];
      if (!allowedNext.includes(toStatus)) {
        throw AppError.badRequest(`Invalid state transition from ${authoritativeCurrentStatus} to ${toStatus}`);
      }

      const updated = await radiologyRepository.updateOrderStatus(orderId, scope.tenantId, authoritativeCurrentStatus, toStatus, tx);
      if (!updated) {
        throw AppError.badRequest(`Cannot transition order from ${authoritativeCurrentStatus} to ${toStatus}`);
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_ORDER_UPDATED',
          resourceType: 'radiology_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { fromStatus: authoritativeCurrentStatus, toStatus }
        },
        session,
        tx
      );

      return updated;
    });
  }

  // 4. Appointments & Scheduling
  async getAppointments(session: SessionContext, branchId?: string) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, { branchId });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const items = await radiologyRepository.findAppointments(scope.tenantId, scope.branchId, tx);
      return ScopeGuard.filterRecordsByScope(items as any[], scope);
    });
  }

  async scheduleAppointment(data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: data.tenantId,
      branchId: data.branchId,
      departmentId: (data as any).departmentId || data.orderingDepartment
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existingOrder = await this.requireRadiologyOrderInScope(
        session,
        scope,
        data.orderId as string | undefined,
        tx
      );

      // P1-05: Modality validation against tenant catalog without hardcoded UUIDs
      let resolvedModalityId = data.modalityId as string | undefined;
      let resolvedModalityName = (data.modalityName as string) || (data.modalityCode as string);

      const modalities = await radiologyRepository.getModalities(scope.tenantId, tx);
      if (resolvedModalityId) {
        const match = modalities.find((m) => m.id === resolvedModalityId);
        if (!match) {
          throw AppError.badRequest(`Modality ${resolvedModalityId} is invalid or does not belong to this tenant`);
        }
        resolvedModalityName = resolvedModalityName || match.modalityName;
      } else {
        const orderModalityType = (existingOrder as any).modalityType || data.modalityType;
        const match =
          (data.modalityCode && modalities.find((m) => m.modalityCode === data.modalityCode)) ||
          (orderModalityType && modalities.find((m) => m.modalityType === orderModalityType)) ||
          modalities[0];
        if (!match) {
          throw AppError.badRequest('No configured modality found for this examination type in this tenant');
        }
        resolvedModalityId = match.id;
        resolvedModalityName = resolvedModalityName || match.modalityName;
      }

      const rawStart = (data.scheduledStart as string) || (data.scheduledDateTime as string);
      const scheduledStart = rawStart ? new Date(rawStart) : new Date();
      const scheduledEnd = data.scheduledEnd
        ? new Date(data.scheduledEnd as string)
        : new Date(scheduledStart.getTime() + 1800000);

      // Scheduling Conflict Prevention: Reject overlapping slot on same modality
      if (rawStart) {
        const existingAppts = await radiologyRepository.findAppointments(scope.tenantId, scope.branchId, tx);
        const conflict = existingAppts.find((a: any) => {
          if (a.status === 'CANCELLED') return false;
          if (a.modalityId !== resolvedModalityId) return false;
          const aStart = new Date(a.scheduledStart).getTime();
          const aEnd = new Date(a.scheduledEnd).getTime();
          return aStart < scheduledEnd.getTime() && aEnd > scheduledStart.getTime();
        });
        if (conflict) {
          throw new AppError({
            statusCode: 409,
            code: ErrorCode.CONFLICT,
            message: `Modality scheduling conflict: Modality ${resolvedModalityName} is already booked for ${scheduledStart.toISOString()}.`
          });
        }
      }

      const appointmentCode = (data.appointmentCode as string) || `RAD-APT-${Date.now().toString(36).toUpperCase()}`;
      const appointment = await radiologyRepository.createAppointment(
        {
          ...data,
          appointmentCode,
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || (existingOrder as any)?.branchId || session.branchId || data.branchId,
          modalityId: resolvedModalityId,
          modalityName: resolvedModalityName || 'Diagnostic Modality',
          scheduledStart,
          scheduledEnd,
          assignedTechnologistName: data.assignedTechnologistName || data.technologistAssigned || 'Senior Technologist'
        },
        tx
      );

      // Update order status to SCHEDULED
      if (data.orderId) {
        await radiologyRepository.updateOrderStatus(data.orderId as string, scope.tenantId, 'ORDERED', 'SCHEDULED', tx).catch(() => {});
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_SCHEDULED',
          resourceType: 'radiology_appointment',
          resourceId: appointment.id as string,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { appointmentCode: appointment.appointmentCode, orderId: data.orderId, scheduledDateTime: scheduledStart.toISOString() }
        },
        session,
        tx
      );

      return appointment;
    });
  }

  async rescheduleAppointment(appointmentId: string, data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: data.branchId as string | undefined,
      departmentId: (data as any).departmentId || data.orderingDepartment
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existingAppointment = await this.requireRadiologyAppointmentInScope(session, scope, appointmentId, tx);

      const rawNewStart = (data.newScheduledDateTime as string) || (data.scheduledStart as string);
      const newStart = rawNewStart ? new Date(rawNewStart) : new Date();
      const newEnd = data.scheduledEnd ? new Date(data.scheduledEnd as string) : new Date(newStart.getTime() + 1800000);

      if (rawNewStart) {
        const existingAppts = await radiologyRepository.findAppointments(scope.tenantId, scope.branchId, tx);
        const conflict = existingAppts.find((a: any) => {
          if (a.id === appointmentId || a.status === 'CANCELLED') return false;
          if (a.modalityId !== (existingAppointment as any).modalityId) return false;
          const aStart = new Date(a.scheduledStart).getTime();
          const aEnd = new Date(a.scheduledEnd).getTime();
          return aStart < newEnd.getTime() && aEnd > newStart.getTime();
        });
        if (conflict) {
          throw new AppError({
            statusCode: 409,
            code: ErrorCode.CONFLICT,
            message: `Modality scheduling conflict on reschedule: Slot ${newStart.toISOString()} is already occupied.`
          });
        }
      }

      const updated = await radiologyRepository.updateAppointment(
        appointmentId,
        scope.tenantId,
        {
          scheduledStart: newStart,
          scheduledEnd: newEnd,
          modalityName: data.newModalityCode || undefined,
          roomNumber: data.newRoomNumber || undefined,
          status: 'SCHEDULED'
        },
        tx
      );

      if (!updated) {
        throw AppError.notFound('Appointment not found');
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_RESCHEDULED',
          resourceType: 'radiology_appointment',
          resourceId: appointmentId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { newScheduledDateTime: newStart.toISOString(), justification: data.rescheduleJustification }
        },
        session,
        tx
      );

      return updated;
    });
  }

  async cancelAppointment(appointmentId: string, data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: data.branchId as string | undefined,
      departmentId: (data as any).departmentId || data.orderingDepartment
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireRadiologyAppointmentInScope(session, scope, appointmentId, tx);

      if (data.orderId) {
        await this.requireRadiologyOrderInScope(session, scope, data.orderId as string, tx);
      }

      const updated = await radiologyRepository.updateAppointment(
        appointmentId,
        scope.tenantId,
        {
          status: 'CANCELLED'
        },
        tx
      );

      if (!updated) {
        throw AppError.notFound('Appointment not found');
      }

      if (data.orderId) {
        await radiologyRepository.updateOrderStatus(data.orderId as string, scope.tenantId, 'SCHEDULED', 'CANCELLED', tx).catch(() => {});
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_CANCELLED',
          resourceType: 'radiology_appointment',
          resourceId: appointmentId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { cancellationReason: data.cancellationReason }
        },
        session,
        tx
      );

      return updated;
    });
  }

  // 5. Preparation Records & Clinical Safety Gates
  private validateClinicalSafetyGates(data: RadiologyInputRecord, existingOrder: any) {
    const modalityType = (data.modalityType as string) || existingOrder?.modalityType || '';
    const procName = ((data.procedureName as string) || existingOrder?.procedureName || '').toUpperCase();

    // Gate 1: MRI Metal Screening
    const isMri = modalityType === 'MAGNETIC_RESONANCE_IMAGING_MRI' || procName.includes('MRI');
    if (
      isMri &&
      (data.mriMetalScreeningCleared === false ||
        (data as any).metalImplantScreeningCleared === false ||
        (data as any).pacemakerScreeningCleared === false)
    ) {
      throw AppError.badRequest(
        'MRI safety gate failed: Metallic implants/foreign bodies detected. Patient cannot undergo MRI.'
      );
    }

    // Gate 2: Radiation Safety & Pregnancy Gate
    const isIonizing =
      ['COMPUTED_TOMOGRAPHY_CT', 'X_RAY_DIGITAL_RADIOGRAPHY', 'MAMMOGRAPHY'].includes(modalityType) ||
      procName.includes('CT') ||
      procName.includes('X-RAY') ||
      procName.includes('MAMMO');
    const pregResult = ((data.pregnancyScreeningResult as string) || existingOrder?.pregnancyScreeningResult || '').toUpperCase();
    if (
      isIonizing &&
      (data.pregnancyStatusConfirmedNegative === false || pregResult === 'POSITIVE' || pregResult === 'PREGNANT')
    ) {
      throw AppError.badRequest(
        'Radiation safety gate failed: Pregnancy status not confirmed negative for ionizing radiation scan.'
      );
    }

    // Gate 3: Contrast Safety & Renal eGFR Gate
    const reqContrast = data.requiresContrast === true || existingOrder?.requiresContrast === true;
    const egfrStr = (data.renalEgfrResult as string) || existingOrder?.renalEgfrResult || '';
    const egfrMatch = egfrStr.match(/(\d+(\.\d+)?)/);
    const numericEgfr = egfrMatch ? Number.parseFloat(egfrMatch[1]!) : null;
    if (reqContrast && (data.renalEgfrAdequate === false || (numericEgfr !== null && numericEgfr < 30))) {
      throw AppError.badRequest(
        'Contrast safety gate failed: Inadequate renal function (eGFR < 30 mL/min/1.73m2) for IV contrast administration.'
      );
    }
  }

  async getPreparationRecords(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findPreparationRecords(session.tenantId, tx);
    });
  }

  async recordPreparation(data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: data.branchId as string | undefined,
      departmentId: (data as any).departmentId || data.orderingDepartment
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      let existingOrder: any = null;
      if (data.orderId) {
        existingOrder = await this.requireRadiologyOrderInScope(session, scope, data.orderId as string, tx);
      }

      this.validateClinicalSafetyGates(data, existingOrder);

      const preparationCode = (data.preparationCode as string) || `RAD-PRP-${Date.now().toString(36).toUpperCase()}`;
      const isReadyForScan =
        data.isReadyForScan !== undefined
          ? Boolean(data.isReadyForScan)
          : data.isPatientReady !== undefined
            ? Boolean(data.isPatientReady)
            : true;
      const preparationNurseName =
        (data.preparationNurseName as string) ||
        ((data as any).checkedByTechnologist as string) ||
        session.userId ||
        'Radiology Preparation Nurse';

      const record = await radiologyRepository.createPreparationRecord(
        {
          ...data,
          preparationCode,
          preparationNurseName,
          isReadyForScan,
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || (existingOrder as any)?.branchId || session.branchId || data.branchId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_PREPARATION_RECORDED',
          resourceType: 'radiology_preparation',
          resourceId: record.id as string,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { preparationCode: record.preparationCode, orderId: data.orderId, isReadyForScan }
        },
        session,
        tx
      );

      return {
        ...record,
        isPatientReady: record.isReadyForScan
      };
    });
  }

  // 6. Studies & DICOM/PACS
  private buildModalitySpecificMetadata(modalityType: string, data: RadiologyInputRecord, existingOrder: any) {
    const rawMeta = (data['modalityMetadata'] as Record<string, unknown>) || {};
    if (modalityType === 'X_RAY_DIGITAL_RADIOGRAPHY') {
      return {
        modalityCategory: 'X_RAY',
        view: (data['view'] as string) || (rawMeta['view'] as string) || 'PA_AND_LATERAL',
        laterality: (data['laterality'] as string) || (rawMeta['laterality'] as string) || 'BILATERAL'
      };
    }
    if (modalityType === 'COMPUTED_TOMOGRAPHY_CT') {
      return {
        modalityCategory: 'CT',
        contrast: Boolean(data['contrast'] ?? data.requiresContrast ?? existingOrder?.requiresContrast ?? rawMeta['contrast']),
        sliceThickness: (data.sliceThickness as string) || (rawMeta['sliceThickness'] as string) || '1.25mm',
        radiationDlp: String(data['radiationDoseDlpMgyCm'] || data['radiationDlp'] || rawMeta['radiationDlp'] || '320.50')
      };
    }
    if (modalityType === 'MAGNETIC_RESONANCE_IMAGING_MRI') {
      return {
        modalityCategory: 'MRI',
        sequences: (data['sequences'] as string[]) || (rawMeta['sequences'] as string[]) || ['T1_WEIGHTED', 'T2_WEIGHTED', 'FLAIR', 'DWI'],
        fieldStrength: (data['fieldStrength'] as string) || (rawMeta['fieldStrength'] as string) || '3.0T',
        metalSafetyClearance: Boolean(data.mriMetalScreeningCleared ?? data['metalSafetyClearance'] ?? rawMeta['metalSafetyClearance'] ?? true)
      };
    }
    if (modalityType === 'ULTRASOUND_SONOGRAPHY_USG') {
      return {
        modalityCategory: 'ULTRASOUND',
        organMeasurements: (data['organMeasurements'] as Record<string, unknown>) || (rawMeta['organMeasurements'] as Record<string, unknown>) || { liverSpanCm: 13.5, cbdDiameterMm: 4.2 },
        studyMeasurements: (data['studyMeasurements'] as Record<string, unknown>) || (rawMeta['studyMeasurements'] as Record<string, unknown>) || { resistiveIndex: 0.62 }
      };
    }
    if (modalityType === 'MAMMOGRAPHY') {
      return {
        modalityCategory: 'MAMMOGRAPHY',
        laterality: (data['laterality'] as string) || (rawMeta['laterality'] as string) || 'BILATERAL',
        views: (data['views'] as string[]) || (rawMeta['views'] as string[]) || ['CC', 'MLO'],
        breastDensity: (data['breastDensity'] as string) || (rawMeta['breastDensity'] as string) || 'ACR_B_SCATTERED_FIBROGLANDULAR',
        preliminaryBiRads: (data['preliminaryBiRads'] as string) || (rawMeta['preliminaryBiRads'] as string) || 'BI_RADS_2_BENIGN'
      };
    }
    return rawMeta;
  }

  async getStudies(session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const list = await radiologyRepository.findStudies(scope.tenantId, tx);
      const traces = await radiologyRepository.findAuditTraces(scope.tenantId, tx);
      const enriched = list.map((s: any) => {
        const trace = traces.find((t: any) => t.entityType === 'radiology_study' && t.entityId === s.id);
        const state = (trace?.newState as Record<string, unknown>) || {};
        return {
          ...s,
          modalityMetadata: state['modalityMetadata'] || null
        };
      });
      return ScopeGuard.filterRecordsByScope(enriched, scope);
    });
  }

  async getStudyById(studyId: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const study = await radiologyRepository.findStudyById(studyId, scope.tenantId, tx);
      if (!study) {
        throw AppError.notFound('Study not found');
      }
      ScopeGuard.assertRecordInScope(session, study, scope);
      const traces = await radiologyRepository.findAuditTraces(scope.tenantId, tx);
      const trace = traces.find((t: any) => t.entityType === 'radiology_study' && t.entityId === study.id);
      const state = (trace?.newState as Record<string, unknown>) || {};
      return {
        ...study,
        modalityMetadata: state['modalityMetadata'] || null
      };
    });
  }

  async completeStudyAcquisition(data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: data.branchId as string | undefined,
      departmentId: (data as any).departmentId || data.orderingDepartment
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existingOrder = await this.requireRadiologyOrderInScope(
        session,
        scope,
        data.orderId as string | undefined,
        tx
      );

      // Validate clinical safety gates prior to acquisition
      this.validateClinicalSafetyGates(data, existingOrder);

      const accessionNumber = (data.accessionNumber as string) || `RAD-ACC-${Date.now().toString(36).toUpperCase()}`;
      // P2-02: Organization standard DICOM root UID generation
      const studyInstanceUid = (data.studyInstanceUid as string) || generateDicomUid('1.2.840.10008.2026.1');
      const pacsViewerUrl = (data.pacsViewerUrl as string) || `https://pacs.docsearch.internal/viewer?studyUID=${studyInstanceUid}&accession=${accessionNumber}`;
      const resolvedModalityType = (data.modalityType as string) || (existingOrder as any).modalityType || 'X_RAY_DIGITAL_RADIOGRAPHY';
      const modalityMetadata = this.buildModalitySpecificMetadata(resolvedModalityType, data, existingOrder);

      const study = await radiologyRepository.createStudy(
        {
          ...data,
          modalityType: resolvedModalityType,
          accessionNumber,
          studyInstanceUid,
          pacsViewerUrl,
          technologistName: (data['technologistName'] as string) || session.userId || 'Senior Radiology Technologist',
          studyDescription: (data.studyDescription as string) || (existingOrder as any).procedureName || 'Diagnostic Imaging Study',
          patientName: (data.patientName as string) || (existingOrder as any).patientName || 'Patient',
          patientMrn: (data.patientMrn as string) || (existingOrder as any).patientMrn || 'MRN-001',
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || (existingOrder as any)?.branchId || session.branchId || data.branchId,
          status: 'ACQUIRED'
        },
        tx
      );

      // Persist structured 5-modality metadata in PostgreSQL audit trace
      const integrityHash = crypto.createHash('sha256').update(JSON.stringify({ studyId: study.id, studyInstanceUid, modalityMetadata })).digest('hex');
      await radiologyRepository.createAuditTrace(
        {
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || (existingOrder as any)?.branchId || session.branchId || data.branchId,
          traceNumber: `RAD-STD-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(100, 999)}`,
          actorId: session.userId,
          actorName: session.userId,
          actorRole: session.roles[0] || 'RADIOLOGY_TECHNOLOGIST',
          action: 'RADIOLOGY_STUDY_ACQUIRED',
          entityType: 'radiology_study',
          entityId: study.id,
          entityCode: study.accessionNumber,
          justification: 'DICOM Study Acquisition with Modality-Specific Parameters',
          ipAddress: '127.0.0.1',
          integrityHash,
          previousHash: 'GENESIS_HASH_RAD_STD',
          newState: {
            ...study,
            modalityMetadata
          }
        },
        tx
      );

      // Update order status to COMPLETED
      if (data.orderId) {
        await radiologyRepository.updateOrderStatus(data.orderId as string, scope.tenantId, 'SCHEDULED', 'COMPLETED', tx).catch(() => {
          radiologyRepository.updateOrderStatus(data.orderId as string, scope.tenantId, 'IN_PROGRESS', 'COMPLETED', tx).catch(() => {});
        });
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_STUDY_ACQUIRED',
          resourceType: 'radiology_study',
          resourceId: study.id as string,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { accessionNumber: study.accessionNumber, studyInstanceUid: study.studyInstanceUid, modalityType: study.modalityType, modalityMetadata }
        },
        session,
        tx
      );

      return {
        ...study,
        modalityMetadata
      };
    });
  }

  // P1-01: DICOM Series
  async getSeriesByStudy(studyId: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const study = await radiologyRepository.findStudyById(studyId, scope.tenantId, tx);
      if (!study) {
        throw AppError.notFound('Study not found');
      }
      return radiologyRepository.findSeriesByStudy(studyId, scope.tenantId, tx);
    });
  }

  async createSeries(data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: data.branchId as string | undefined
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const studyId = data.studyId as string;
      if (!studyId) {
        throw AppError.badRequest('studyId is required to create an imaging series');
      }
      const study = await radiologyRepository.findStudyById(studyId, scope.tenantId, tx);
      if (!study) {
        throw AppError.notFound('Target study not found');
      }

      const seriesInstanceUid = (data.seriesInstanceUid as string) || generateDicomUid('1.2.840.10008.2026.2');
      const series = await radiologyRepository.createSeries(
        {
          ...data,
          studyId,
          seriesInstanceUid,
          modality: (data.modality as string) || study.modalityType,
          seriesDescription: (data.seriesDescription as string) || `${study.modalityType} Series 1`,
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId || data.branchId
        },
        tx
      );

      return series;
    });
  }

  // P1-02: DICOM Instances
  async getInstancesBySeries(seriesId: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const series = await radiologyRepository.findSeriesById(seriesId, scope.tenantId, tx);
      if (!series) {
        throw AppError.notFound('Series not found');
      }
      return radiologyRepository.findInstancesBySeries(seriesId, scope.tenantId, tx);
    });
  }

  async createInstance(data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: data.branchId as string | undefined
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const seriesId = data.seriesId as string;
      const studyId = data.studyId as string;
      if (!seriesId || !studyId) {
        throw AppError.badRequest('seriesId and studyId are required to create an imaging instance');
      }

      const sopInstanceUid = (data.sopInstanceUid as string) || generateDicomUid('1.2.840.10008.2026.3');
      const imageUrl = (data.imageUrl as string) || `https://pacs.docsearch.internal/instances/${sopInstanceUid}.dcm`;

      const instance = await radiologyRepository.createInstance(
        {
          ...data,
          seriesId,
          studyId,
          sopInstanceUid,
          imageUrl,
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId || data.branchId
        },
        tx
      );

      return instance;
    });
  }

  // 7. Reports & Lifecycle
  private assertRadiologistAuthority(session: SessionContext) {
    const allowedRoles = [
      'RADIOLOGIST',
      'HOD_RADIOLOGIST',
      'RADIOLOGY_SUPERVISOR',
      'HOSPITAL_ADMIN',
      'OWNER',
      'PARTNER_ADMIN',
      'CLINIC_ADMIN',
      'SUPER_ADMIN'
    ];
    const hasRole = (session.roles || []).some((r) => allowedRoles.includes(r));
    if (!hasRole && !session.isSuperAdmin) {
      throw new AppError({
        statusCode: 403,
        code: ErrorCode.FORBIDDEN,
        message: 'RBAC access denied: Only a qualified Radiologist or Supervisor may finalize or amend radiology reports.'
      });
    }
  }

  async getReports(session: SessionContext, studyId?: string) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const list = await radiologyRepository.findReports(scope.tenantId, studyId, tx);
      const traces = await radiologyRepository.findAuditTraces(scope.tenantId, tx);
      const enriched = list.map((r: any) => {
        const finTrace = traces.find(
          (t: any) => t.entityType === 'radiology_report' && t.entityId === r.id && t.action === 'RADIOLOGY_REPORT_FINALIZED'
        );
        const revTrace = traces.find(
          (t: any) => t.entityType === 'radiology_report' && t.entityId === r.id && t.action === 'RADIOLOGY_REPORT_REVIEWED'
        );
        const finState = (finTrace?.newState as Record<string, unknown>) || {};
        const revState = (revTrace?.newState as Record<string, unknown>) || {};
        return {
          ...r,
          digitalSignature: finState['digitalSignature'] || null,
          signedBy: finState['signedBy'] || r.verifyingRadiologistName || null,
          doctorReview: revState['doctorReview'] || null
        };
      });
      return ScopeGuard.filterRecordsByScope(enriched, scope);
    });
  }

  async getReportById(reportId: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const report = await radiologyRepository.findReportById(reportId, scope.tenantId, tx);
      if (!report) {
        throw AppError.notFound('Radiology report not found');
      }
      ScopeGuard.assertRecordInScope(session, report, scope);
      const traces = await radiologyRepository.findAuditTraces(scope.tenantId, tx);
      const finTrace = traces.find(
        (t: any) => t.entityType === 'radiology_report' && t.entityId === report.id && t.action === 'RADIOLOGY_REPORT_FINALIZED'
      );
      const revTrace = traces.find(
        (t: any) => t.entityType === 'radiology_report' && t.entityId === report.id && t.action === 'RADIOLOGY_REPORT_REVIEWED'
      );
      const finState = (finTrace?.newState as Record<string, unknown>) || {};
      const revState = (revTrace?.newState as Record<string, unknown>) || {};
      return {
        ...report,
        digitalSignature: finState['digitalSignature'] || null,
        signedBy: finState['signedBy'] || report.verifyingRadiologistName || null,
        doctorReview: revState['doctorReview'] || null
      };
    });
  }

  async createReportDraft(data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const reportNumber = (data.reportNumber as string) || `RAD-RPT-${Date.now().toString(36).toUpperCase()}`;
      const report = await radiologyRepository.createReport(
        {
          ...data,
          reportNumber,
          status: 'DRAFT',
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId || data.branchId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_REPORT_CREATED',
          resourceType: 'radiology_report',
          resourceId: report.id as string,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { reportNumber: report.reportNumber, studyId: data.studyId }
        },
        session,
        tx
      );

      return report;
    });
  }

  async finalizeReport(reportId: string, data: RadiologyInputRecord, session: SessionContext) {
    this.assertRadiologistAuthority(session);
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existingReport = await this.requireRadiologyReportInScope(session, scope, reportId, tx);
      if ((existingReport as any).status === 'FINALIZED' || (existingReport as any).status === 'AMENDED') {
        throw new AppError({
          statusCode: 409,
          code: ErrorCode.CONFLICT,
          message: 'Report is already finalized and immutable. Use the amendment workflow to record changes.'
        });
      }

      const verifyingRadiologistName = (data.verifyingRadiologistName as string) || session.userId || 'Dr. Verifying Radiologist, MD';
      const digitalSignature =
        (data.digitalSignature as string) ||
        `SIG_RAD_SHA256_${crypto
          .createHash('sha256')
          .update(`${reportId}:${verifyingRadiologistName}:${(existingReport as any).findings}:${(existingReport as any).impression}`)
          .digest('hex')
          .slice(0, 24)
          .toUpperCase()}`;

      const finalized = await radiologyRepository.finalizeReport(reportId, scope.tenantId, verifyingRadiologistName, tx);

      if (!finalized) {
        throw AppError.notFound('Report not found or not in valid state for finalization');
      }

      const integrityHash = crypto.createHash('sha256').update(JSON.stringify({ reportId, digitalSignature, verifyingRadiologistName })).digest('hex');
      await radiologyRepository.createAuditTrace(
        {
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId,
          traceNumber: `RAD-FIN-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(100, 999)}`,
          actorId: session.userId,
          actorName: verifyingRadiologistName,
          actorRole: session.roles[0] || 'RADIOLOGIST',
          action: 'RADIOLOGY_REPORT_FINALIZED',
          entityType: 'radiology_report',
          entityId: reportId,
          entityCode: finalized.reportNumber,
          justification: 'Radiologist Final Verification & Digital Signature',
          ipAddress: '127.0.0.1',
          integrityHash,
          previousHash: 'GENESIS_HASH_RAD_FIN',
          newState: {
            ...finalized,
            digitalSignature,
            signedBy: verifyingRadiologistName,
            signedAt: finalized.finalizedAt
          }
        },
        tx
      );

      if ((existingReport as any).orderId) {
        await radiologyRepository.updateOrderStatus((existingReport as any).orderId, scope.tenantId, 'COMPLETED', 'REPORTED', tx).catch(() => {});
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_REPORT_FINALIZED',
          resourceType: 'radiology_report',
          resourceId: reportId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { reportNumber: finalized.reportNumber, verifyingRadiologistName, digitalSignature }
        },
        session,
        tx
      );

      return {
        ...finalized,
        digitalSignature,
        signedBy: verifyingRadiologistName
      };
    });
  }

  // P2-01: Immutable Report Amendments
  async amendReport(reportId: string, data: RadiologyInputRecord, session: SessionContext) {
    this.assertRadiologistAuthority(session);
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existing = await this.requireRadiologyReportInScope(session, scope, reportId, tx);
      const reason = (data.amendmentReason as string) || (data.reasonForAmendment as string) || '';
      if (!reason || reason.trim().length < 5) {
        throw AppError.badRequest('Amendment requires a detailed justification reason');
      }

      const amended = await radiologyRepository.amendReport(
        reportId,
        scope.tenantId,
        reason,
        (data.findings as string) || (data.amendedFindings as string) || (existing as any).findings || '',
        (data.impression as string) || (data.amendedImpression as string) || (existing as any).impression || '',
        (data.recommendations as string) || (existing as any).recommendations || '',
        (data.verifyingRadiologistName as string) || (data.reportingRadiologistName as string) || session.userId || 'Dr. Amending Radiologist, MD',
        data.digitalSignature as string | undefined,
        tx
      );

      if (!amended) {
        throw AppError.notFound('Report not found for amendment');
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_REPORT_AMENDED',
          resourceType: 'radiology_report',
          resourceId: reportId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { reportNumber: amended.reportNumber, version: amended.version, amendmentReason: reason }
        },
        session,
        tx
      );

      return amended;
    });
  }

  async getReportAmendments(reportId: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireRadiologyReportInScope(session, scope, reportId, tx);
      return radiologyRepository.findReportAmendments(reportId, scope.tenantId, tx);
    });
  }

  async reviewReport(reportId: string, data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existing = await this.requireRadiologyReportInScope(session, scope, reportId, tx);
      if ((existing as any).status !== 'FINALIZED' && (existing as any).status !== 'AMENDED') {
        throw AppError.badRequest('Only FINALIZED or AMENDED radiology reports can be reviewed by the ordering clinician');
      }

      const reviewedByDoctorName = (data['reviewedByDoctorName'] as string) || (data['doctorName'] as string) || session.userId || 'Attending Doctor';
      const clinicalCorrelationNotes = (data['clinicalCorrelationNotes'] as string) || (data['notes'] as string) || 'Reviewed and correlated clinically.';
      const reviewedAt = new Date().toISOString();
      const doctorReview = {
        reviewedByDoctorName,
        clinicalCorrelationNotes,
        reviewedAt,
        deliveryStatus: 'DELIVERED_TO_CLINICIAN_AND_PATIENT_360'
      };

      const integrityHash = crypto.createHash('sha256').update(JSON.stringify({ reportId, doctorReview })).digest('hex');
      await radiologyRepository.createAuditTrace(
        {
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId,
          traceNumber: `RAD-REV-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(100, 999)}`,
          actorId: session.userId,
          actorName: reviewedByDoctorName,
          actorRole: session.roles[0] || 'DOCTOR',
          action: 'RADIOLOGY_REPORT_REVIEWED',
          entityType: 'radiology_report',
          entityId: reportId,
          entityCode: (existing as any).reportNumber,
          justification: clinicalCorrelationNotes,
          ipAddress: '127.0.0.1',
          integrityHash,
          previousHash: 'GENESIS_HASH_RAD_REV',
          newState: {
            ...existing,
            doctorReview
          }
        },
        tx
      );

      if ((existing as any).orderId) {
        await radiologyRepository.updateOrderStatus((existing as any).orderId, scope.tenantId, 'REPORTED', 'VERIFIED', tx).catch(() => {
          radiologyRepository.updateOrderStatus((existing as any).orderId, scope.tenantId, 'COMPLETED', 'VERIFIED', tx).catch(() => {});
        });
      }

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_REPORT_REVIEWED',
          resourceType: 'radiology_report',
          resourceId: reportId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { reportId, ...doctorReview }
        },
        session,
        tx
      );

      return {
        ...existing,
        doctorReview
      };
    });
  }

  // P1-03: Radiology Billing Integration using Configured Procedure Catalog Price
  async billRadiologyOrder(orderId: string, data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await this.requireRadiologyOrderInScope(session, scope, orderId, tx);
      const procedures = await radiologyRepository.getProcedures(scope.tenantId, tx);
      const matchedProc = procedures.find(
        (p: any) => p.id === (order as any).procedureId || p.procedureName === (order as any).procedureName
      );

      const rawPrice = (matchedProc as any)?.standardChargeAmount ?? matchedProc?.priceAmount;
      if (!matchedProc || !rawPrice) {
        throw AppError.badRequest(
          'No configured procedure catalog price found for this radiology order. Configure procedure price before billing.'
        );
      }

      const amountNum = Number.parseFloat(String(rawPrice));
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        throw AppError.badRequest('Configured procedure standardChargeAmount must be a positive amount.');
      }

      const amountStr = amountNum.toFixed(2);
      const invoiceId = crypto.randomUUID();
      const invoiceNumber = `INV-RAD-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date();
      const patientId = ((order as any).patientId as string) || crypto.randomUUID();

      const [invoice] = await tx
        .insert(billingInvoices)
        .values({
          id: invoiceId,
          tenantId: scope.tenantId,
          partnerId: (order as any).partnerId || scope.tenantId,
          organizationId: (order as any).organizationId || scope.tenantId,
          branchId: (order as any).branchId || scope.branchId || session.branchId || scope.tenantId,
          patientId,
          encounterId: (order as any).encounterId || null,
          invoiceNumber,
          invoiceType: 'RADIOLOGY',
          status: (data['paymentStatus'] as string) || 'ISSUED',
          subtotal: amountStr,
          discountTotal: '0.00',
          taxTotal: '0.00',
          totalAmount: amountStr,
          paidAmount: (data['paymentStatus'] as string) === 'PAID' ? amountStr : '0.00',
          dueAmount: (data['paymentStatus'] as string) === 'PAID' ? '0.00' : amountStr,
          currency: 'INR',
          issuedAt: now,
          createdAt: now,
          updatedAt: now
        } as any)
        .returning();

      const [lineItem] = await tx
        .insert(billingInvoiceItems)
        .values({
          id: crypto.randomUUID(),
          tenantId: scope.tenantId,
          invoiceId,
          serviceCode: matchedProc.procedureCode,
          description: matchedProc.procedureName,
          quantity: 1,
          unitPrice: amountStr,
          grossAmount: amountStr,
          discountAmount: '0.00',
          taxAmount: '0.00',
          netAmount: amountStr,
          metadata: {
            category: 'RADIOLOGY',
            serviceCategory: 'RADIOLOGY',
            orderId: order.id,
            procedureId: matchedProc.id,
            modalityType: matchedProc.modalityType
          },
          createdAt: now
        } as any)
        .returning();

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_ORDER_BILLED',
          resourceType: 'billing_invoice',
          resourceId: invoiceId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { invoiceNumber, orderId: order.id, procedureCode: matchedProc.procedureCode, amount: amountStr, category: 'RADIOLOGY' }
        },
        session,
        tx
      );

      const normalizedLineItem = {
        ...lineItem,
        unitPrice: amountStr,
        grossAmount: amountStr,
        netAmount: amountStr
      };

      return {
        invoice,
        lineItem: normalizedLineItem,
        category: 'RADIOLOGY',
        procedureId: matchedProc.id,
        procedureCode: matchedProc.procedureCode,
        chargedAmount: amountStr
      };
    });
  }

  async getOrderInvoice(orderId: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireRadiologyOrderInScope(session, scope, orderId, tx);
      const items = await tx
        .select()
        .from(billingInvoiceItems)
        .where(eq(billingInvoiceItems.tenantId, scope.tenantId));
      const matchedItem = items.find((i: any) => (i.metadata as any)?.orderId === orderId);
      if (!matchedItem) {
        throw AppError.notFound('No radiology invoice found for this order');
      }
      const [invoice] = await tx
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, scope.tenantId), eq(billingInvoices.id, matchedItem.invoiceId)))
        .limit(1);
      const normalizedLineItem = {
        ...matchedItem,
        unitPrice: Number((matchedItem as any).unitPrice || 0).toFixed(2),
        grossAmount: Number((matchedItem as any).grossAmount || 0).toFixed(2),
        netAmount: Number((matchedItem as any).netAmount || 0).toFixed(2)
      };
      const normalizedInvoice = invoice
        ? {
            ...invoice,
            subtotalAmount: Number((invoice as any).subtotalAmount || 0).toFixed(2),
            totalAmount: Number((invoice as any).totalAmount || 0).toFixed(2),
            paidAmount: Number((invoice as any).paidAmount || 0).toFixed(2),
            balanceAmount: Number((invoice as any).balanceAmount || 0).toFixed(2)
          }
        : null;
      return {
        invoice: normalizedInvoice,
        lineItem: normalizedLineItem,
        category: (matchedItem.metadata as any)?.category || 'RADIOLOGY'
      };
    });
  }

  // 8. Critical Findings
  async getCriticalFindings(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const list = await radiologyRepository.findCriticalFindings(session.tenantId, tx);
      const traces = await radiologyRepository.findAuditTraces(session.tenantId, tx);
      return list.map((f: any) => {
        const ackTrace = traces.find(
          (t: any) => t.entityType === 'radiology_critical_finding' && t.entityId === f.id && t.action === 'RADIOLOGY_CRITICAL_ACKNOWLEDGED'
        );
        const ackState = (ackTrace?.newState as Record<string, unknown>) || {};
        return {
          ...f,
          readBackIntimationRecord: ackState['readBackIntimationRecord'] || null,
          readBackVerified: Boolean(ackState['readBackVerified'])
        };
      });
    });
  }

  async recordCriticalFinding(data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: data.branchId as string | undefined,
      departmentId: (data as any).departmentId || data.orderingDepartment
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const reportId = (data['reportId'] || (data as any).reportId) as string | undefined;
      const existingReport = await this.requireRadiologyReportInScope(session, scope, reportId, tx);

      const alertCode = (data.alertCode as string) || `RAD-CRT-${Date.now().toString(36).toUpperCase()}`;
      const finding = await radiologyRepository.createCriticalFinding(
        {
          ...data,
          reportId: (existingReport as any).id || reportId,
          alertCode,
          status: (data.status as string) || 'FLAGGED_PENDING_NOTIFICATION',
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || (existingReport as any)?.branchId || session.branchId || data.branchId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_CRITICAL_FLAGGED',
          resourceType: 'radiology_critical_finding',
          resourceId: finding.id as string,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { alertCode: finding.alertCode, severity: finding.severity, reportId: (existingReport as any).id || reportId }
        },
        session,
        tx
      );

      return finding;
    });
  }

  async acknowledgeCriticalFinding(findingId: string, data: RadiologyInputRecord, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      branchId: data.branchId as string | undefined,
      departmentId: (data as any).departmentId || data.orderingDepartment
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireRadiologyFindingInScope(session, scope, findingId, tx);

      const acknowledgedBy = (data.acknowledgedBy as string) || (data.acknowledgedByDoctor as string) || session.userId || 'Attending Physician';
      const acknowledgedTimestamp = new Date();
      const notes =
        (data.readBackIntimationRecord as string) ||
        (data.acknowledgmentNotes as string) ||
        (data.clinicalActionNotes as string) ||
        'Verbal read-back confirmed by attending clinician';

      const updated = await radiologyRepository.acknowledgeCriticalFinding(
        findingId,
        scope.tenantId,
        acknowledgedBy,
        acknowledgedTimestamp,
        notes,
        tx
      );

      if (!updated) {
        throw AppError.notFound('Critical finding alert not found');
      }

      const integrityHash = crypto.createHash('sha256').update(JSON.stringify({ findingId, acknowledgedBy, notes })).digest('hex');
      await radiologyRepository.createAuditTrace(
        {
          tenantId: scope.tenantId,
          partnerId: data.partnerId || scope.tenantId,
          organizationId: data.organizationId || scope.tenantId,
          branchId: scope.branchId || session.branchId,
          traceNumber: `RAD-ACK-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(100, 999)}`,
          actorId: session.userId,
          actorName: acknowledgedBy,
          actorRole: session.roles[0] || 'DOCTOR',
          action: 'RADIOLOGY_CRITICAL_ACKNOWLEDGED',
          entityType: 'radiology_critical_finding',
          entityId: findingId,
          entityCode: updated.alertCode,
          justification: notes,
          ipAddress: '127.0.0.1',
          integrityHash,
          previousHash: 'GENESIS_HASH_RAD_ACK',
          newState: {
            ...updated,
            readBackIntimationRecord: notes,
            readBackVerified: true
          }
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'RADIOLOGY_CRITICAL_RESULT_ACKNOWLEDGED',
          resourceType: 'radiology_critical_finding',
          resourceId: findingId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: {
            alertCode: updated.alertCode,
            acknowledgedBy,
            notes,
            readBackIntimationRecord: notes,
            readBackVerified: true
          }
        },
        session,
        tx
      );

      return {
        ...updated,
        readBackIntimationRecord: notes,
        readBackVerified: true
      };
    });
  }

  // 9. Quality Events & Audit Traces
  async getQualityEvents(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findQualityEvents(session.tenantId, tx);
    });
  }

  async recordQualityEvent(data: RadiologyInputRecord, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const eventCode = (data.eventCode as string) || `RAD-QLT-${Date.now().toString(36).toUpperCase()}`;
      const event = await radiologyRepository.createQualityEvent(
        {
          ...data,
          eventCode,
          tenantId: session.tenantId,
          partnerId: data.partnerId || session.tenantId,
          organizationId: data.organizationId || session.tenantId,
          branchId: session.branchId || data.branchId
        },
        tx
      );

      return event;
    });
  }

  async getAuditTraces(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return radiologyRepository.findAuditTraces(session.tenantId, tx);
    });
  }
}

export const radiologyService = new RadiologyService();
