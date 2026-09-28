import {
  labDiagnosticsRepository,
  type CreateLabOrderInput,
  type CollectSpecimenInput,
  type EnterResultInput,
  type AccessionSpecimenInput,
  type StartProcessingInput,
  type RejectSpecimenInput,
  type RecollectSpecimenInput,
  type TechnicalValidateInput,
  type PathologistValidateInput,
  type DeliverReportInput,
  type CreateCatalogTestInput,
  type CreatePanelInput,
  type LabQcEvaluationInput
} from '../../repositories/partner/LabDiagnosticsRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext, RBACEvaluator, ScopeGuard } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export class LabDiagnosticsService {
  async searchOrders(
    session: SessionContext,
    status?: string,
    patientId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const orders = await labDiagnosticsRepository.searchOrders(scope.tenantId, status, patientId, tx);
      return ScopeGuard.filterRecordsByScope(orders, scope);
    });
  }

  async getOrderById(
    session: SessionContext,
    orderId: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await labDiagnosticsRepository.getOrderById(scope.tenantId, orderId, tx);
      if (order) {
        ScopeGuard.assertRecordInScope(session, order, scope);
      }
      return order;
    });
  }

  private async requireOrderInScope(
    session: SessionContext,
    scope: { tenantId: string; branchId?: string | undefined; departmentId?: string | undefined },
    orderId: string | undefined,
    tx: any
  ) {
    if (!orderId) {
      throw new AppError({
        message: 'Target orderId is required for lab diagnostic mutations',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
    const existingOrder = await labDiagnosticsRepository.getOrderById(scope.tenantId, orderId, tx);
    if (!existingOrder) {
      throw new AppError({
        message: 'Access denied: Target lab order does not exist in your organization or branch scope',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    if (existingOrder.tenantId && existingOrder.tenantId !== scope.tenantId) {
      throw new AppError({
        message: 'Access denied: Cross-tenant lab order mutation is forbidden',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }
    ScopeGuard.assertRecordInScope(session, existingOrder, scope);
    return existingOrder;
  }

  async createOrder(
    input: Omit<CreateLabOrderInput, 'tenantId'> & { tenantId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: (input as any).branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await labDiagnosticsRepository.createOrder({
        ...input,
        tenantId: scope.tenantId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {}),
        orderingDoctorId: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'LAB_ORDER_CREATED',
        resourceType: 'investigation_order',
        resourceId: order.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { orderNumber: order.orderNumber, testCode: order.testCode, patientId: order.patientId }
      }, session, tx);

      return order;
    });
  }

  async collectSpecimen(input: Omit<CollectSpecimenInput, 'tenantId'>, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, input.orderId, tx);
      const order = await labDiagnosticsRepository.collectSpecimen({
        ...input,
        tenantId: scope.tenantId,
        collectedBy: session.userId
      }, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'SAMPLE_COLLECTED',
          resourceType: 'investigation_specimen',
          resourceId: order.id,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, specimenType: input.specimenType }
        }, session, tx);
      }

      return order;
    });
  }

  async enterResult(input: Omit<EnterResultInput, 'tenantId'>, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, input.orderId, tx);
      const order = await labDiagnosticsRepository.enterResult({
        ...input,
        tenantId: scope.tenantId,
        enteredBy: session.userId
      }, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'RESULT_ENTERED',
          resourceType: 'investigation_result',
          resourceId: order.id,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, parameter: input.parameterCode, value: input.resultValue }
        }, session, tx);
      }

      return order;
    });
  }

  async verifyResult(orderId: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    if (!session.isSuperAdmin) {
      const isAuthorizedSignatory = (session.roles || []).some((r) =>
        ['PATHOLOGIST', 'LAB_DIRECTOR', 'CHIEF_MEDICAL_OFFICER', 'HOSPITAL_ADMIN', 'COMPANY_ADMIN'].includes(r)
      );
      const hasValidatePerm = RBACEvaluator.hasPermission(session, 'lab:results', 'validate');
      if (!isAuthorizedSignatory && !hasValidatePerm) {
        throw new AppError({
          message: 'Access denied: Lab result verification and signoff requires PATHOLOGIST or LAB_DIRECTOR role or lab:results:validate permission',
          code: ErrorCode.INSUFFICIENT_PERMISSIONS,
          statusCode: 403
        });
      }
    }

    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const order = await labDiagnosticsRepository.verifyResult(scope.tenantId, orderId, session.userId, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'RESULT_VERIFIED',
          resourceType: 'investigation_result',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, verifiedBy: session.userId }
        }, session, tx);
      }

      return order;
    });
  }

  async reviewResult(orderId: string, doctorNotes: string | undefined, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const order = await labDiagnosticsRepository.reviewResult(scope.tenantId, orderId, session.userId, doctorNotes, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'RESULT_REVIEWED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, reviewingDoctor: session.userId }
        }, session, tx);
      }

      return order;
    });
  }

  async cancelOrder(orderId: string, cancellationReason: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const order = await labDiagnosticsRepository.cancelOrder(scope.tenantId, orderId, session.userId, cancellationReason, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'LAB_ORDER_CANCELLED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, cancellationReason, cancelledBy: session.userId }
        }, session, tx);
      }

      return order;
    });
  }

  async getCatalog(
    session: SessionContext,
    categoryOrOptions?: string | { page?: number | undefined; limit?: number | undefined; category?: string | undefined; searchTerm?: string | undefined; status?: string | undefined } | undefined,
    searchTerm?: string | undefined
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return labDiagnosticsRepository.searchCatalog(scope.tenantId, categoryOrOptions as any, searchTerm, tx);
    });
  }

  async getPanels(session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return labDiagnosticsRepository.getPanels(scope.tenantId, tx);
    });
  }

  async accessionSpecimen(
    orderId: string,
    input: Omit<AccessionSpecimenInput, 'receivedBy'> & { receivedBy?: string },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const receivedBy = input.receivedBy || session.userId;
      const order = await labDiagnosticsRepository.accessionSpecimen(
        scope.tenantId,
        orderId,
        { ...input, receivedBy },
        tx
      );

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'LAB_SPECIMEN_ACCESSIONED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, receivedBy, workstationId: input.workstationId }
        }, session, tx);
      }

      return order;
    });
  }

  async startProcessing(
    orderId: string,
    input: StartProcessingInput,
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const technicianId = input.technicianId || session.userId;
      const order = await labDiagnosticsRepository.startProcessing(
        scope.tenantId,
        orderId,
        { ...input, technicianId },
        tx
      );

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'LAB_PROCESSING_STARTED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, analyzerId: input.analyzerId, technicianId }
        }, session, tx);
      }

      return order;
    });
  }

  async rejectSpecimen(
    orderId: string,
    input: Omit<RejectSpecimenInput, 'rejectedBy'> & { rejectedBy?: string },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const rejectedBy = input.rejectedBy || session.userId;
      const order = await labDiagnosticsRepository.rejectSpecimen(
        scope.tenantId,
        orderId,
        { ...input, rejectedBy },
        tx
      );

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'LAB_SPECIMEN_REJECTED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, rejectionReason: input.rejectionReason, rejectedBy }
        }, session, tx);
      }

      return order;
    });
  }

  async recollectSpecimen(
    orderId: string,
    input: Omit<RecollectSpecimenInput, 'requestedBy'> & { requestedBy?: string },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const requestedBy = input.requestedBy || session.userId;
      const order = await labDiagnosticsRepository.recollectSpecimen(
        scope.tenantId,
        orderId,
        { ...input, requestedBy },
        tx
      );

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'LAB_RECOLLECTION_REQUESTED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: {
            orderNumber: order.orderNumber,
            requestedBy,
            newBarcode: (order as any).metadata?.activeSpecimenBarcode
          }
        }, session, tx);
      }

      return order;
    });
  }

  async technicalValidateResult(
    orderId: string,
    input: Omit<TechnicalValidateInput, 'technicianId'> & { technicianId?: string },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const technicianId = input.technicianId || session.userId;
      const order = await labDiagnosticsRepository.technicalValidateResult(
        scope.tenantId,
        orderId,
        { ...input, technicianId },
        tx
      );

      if (order) {
        await auditRepository.recordEvent({
          eventType: input.isAccepted ? 'LAB_TECHNICAL_VALIDATED' : 'LAB_TECHNICAL_REJECTED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: { orderNumber: order.orderNumber, isAccepted: input.isAccepted, technicianId }
        }, session, tx);
      }

      return order;
    });
  }

  async pathologistValidateResult(
    orderId: string,
    input: Omit<PathologistValidateInput, 'pathologistId'> & { pathologistId?: string },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const pathologistId = input.pathologistId || session.userId;
      const order = await labDiagnosticsRepository.pathologistValidateResult(
        scope.tenantId,
        orderId,
        { ...input, pathologistId },
        tx
      );

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'LAB_PATHOLOGIST_VALIDATED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: {
            orderNumber: order.orderNumber,
            pathologistId,
            digitalSignature: input.digitalSignature || (order as any).metadata?.report?.metadata?.digitalSignature
          }
        }, session, tx);
      }

      return order;
    });
  }

  async deliverReport(
    orderId: string,
    input: DeliverReportInput,
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const deliveredBy = input.deliveredBy || session.userId;
      const order = await labDiagnosticsRepository.deliverReport(
        scope.tenantId,
        orderId,
        { ...input, deliveredBy },
        tx
      );

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'LAB_REPORT_DELIVERED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: {
            orderNumber: order.orderNumber,
            deliveryChannel: input.deliveryChannel,
            recipient: input.recipient,
            deliveredBy
          }
        }, session, tx);
      }

      return order;
    });
  }

  async lookupByBarcode(barcode: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const match = await labDiagnosticsRepository.lookupByBarcode(scope.tenantId, barcode, tx);
      if (match?.order) {
        ScopeGuard.assertRecordInScope(session, match.order, scope);
      }
      return match;
    });
  }

  async createCatalogTest(input: CreateCatalogTestInput, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const test = await labDiagnosticsRepository.createCatalogTest(scope.tenantId, input, tx);
      await auditRepository.recordEvent({
        eventType: 'LAB_CATALOG_TEST_CREATED',
        resourceType: 'investigation_catalog',
        resourceId: test.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { testCode: input.testCode, testName: input.testName }
      }, session, tx);
      return test;
    });
  }

  async updateCatalogTest(testId: string, input: Partial<CreateCatalogTestInput>, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const test = await labDiagnosticsRepository.updateCatalogTest(scope.tenantId, testId, input, tx);
      await auditRepository.recordEvent({
        eventType: 'LAB_CATALOG_TEST_UPDATED',
        resourceType: 'investigation_catalog',
        resourceId: testId,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { testId, updates: Object.keys(input) }
      }, session, tx);
      return test;
    });
  }

  async createPanel(input: CreatePanelInput, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const panel = await labDiagnosticsRepository.createPanel(scope.tenantId, input, tx);
      await auditRepository.recordEvent({
        eventType: 'LAB_PANEL_CREATED',
        resourceType: 'investigation_panel',
        resourceId: panel.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { panelCode: input.panelCode, panelName: input.panelName, count: input.testIds?.length }
      }, session, tx);
      return panel;
    });
  }

  async evaluateLabQc(input: LabQcEvaluationInput, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async () => {
      return labDiagnosticsRepository.evaluateLabQc(scope.tenantId, {
        ...input,
        operatorId: input.operatorId || session.userId
      });
    });
  }

  async getOrderReport(orderId: string, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await this.requireOrderInScope(session, scope, orderId, tx);
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        patient: {
          id: order.patientId,
          name: order.patientName,
          mrn: order.patientMrn,
          gender: order.patientGender,
          dob: order.patientDob
        },
        doctor: {
          id: order.orderingDoctorId,
          name: order.orderingDoctorName
        },
        test: {
          code: order.testCode || order.investigationCode,
          name: order.testName || order.investigationName,
          category: order.category || order.investigationCategory
        },
        specimens: order.specimens || (order.specimen ? [order.specimen] : []),
        results: order.results || [],
        report: order.report || null,
        validation: {
          verifiedBy: order.verifiedBy,
          verifiedAt: order.verifiedAt,
          technicalValidation: (order as any).metadata?.technicalValidation,
          pathologistValidation: (order as any).metadata?.pathologistValidation
        },
        delivery: (order as any).metadata?.delivery || null
      };
    });
  }

  async logPanicIntimation(orderId: string, payload: any, session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      await this.requireOrderInScope(session, scope, orderId, tx);
      const logRecord = {
        orderId,
        doctorName: payload.doctorName || 'Dr. Attending Physician',
        doctorPhone: payload.doctorPhone || '+91 98765 00000',
        callerStaffName: payload.callerStaffName || 'Lab Technician',
        readBackConfirmed: Boolean(payload.readBackConfirmed !== false),
        criticalParameters: payload.criticalParameters || [],
        notes: payload.notes || 'Verbal telephonic notification completed. Read-back confirmed by doctor.',
        intimatedAt: payload.intimatedAt || new Date().toISOString(),
        loggedByUserId: session.userId,
        status: 'VERBAL_READBACK_CONFIRMED'
      };

      const updatedOrder = await labDiagnosticsRepository.logPanicIntimation(
        scope.tenantId,
        orderId,
        logRecord,
        tx
      );

      if (updatedOrder) {
        await auditRepository.recordEvent({
          eventType: 'CRITICAL_PANIC_INTIMATED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: scope.tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: {
            orderNumber: updatedOrder.orderNumber,
            doctorName: logRecord.doctorName,
            readBackConfirmed: logRecord.readBackConfirmed,
            criticalParameters: logRecord.criticalParameters
          }
        }, session, tx);
      }

      return {
        orderId,
        orderNumber: updatedOrder?.orderNumber,
        panicIntimation: logRecord
      };
    });
  }

  async getOverview(session: SessionContext) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const orders = await labDiagnosticsRepository.searchOrders(scope.tenantId, undefined, undefined, tx);
      const scopedOrders = ScopeGuard.filterRecordsByScope(orders, scope);
      const panels = await labDiagnosticsRepository.getPanels(scope.tenantId, tx);
      const totalOrders = scopedOrders.length;
      const pendingOrders = scopedOrders.filter((o: any) => ['ORDERED', 'COLLECTED', 'RECEIVED', 'PROCESSING'].includes(o.status)).length;
      const completedOrders = scopedOrders.filter((o: any) => ['VERIFIED', 'DELIVERED', 'COMPLETED'].includes(o.status)).length;
      const criticalOrders = scopedOrders.filter((o: any) => o.results?.some((r: any) => r.abnormalFlag === 'CRITICAL' || r.abnormalFlag === 'PANIC')).length;
      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        criticalOrders,
        panelsCount: panels.length,
        timestamp: new Date().toISOString()
      };
    });
  }
}

export const labDiagnosticsService = new LabDiagnosticsService();
