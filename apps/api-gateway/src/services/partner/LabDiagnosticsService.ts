import {
  labDiagnosticsRepository,
  type CreateLabOrderInput,
  type CollectSpecimenInput,
  type EnterResultInput
} from '../../repositories/partner/LabDiagnosticsRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class LabDiagnosticsService {
  async searchOrders(session: SessionContext, status?: string, patientId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return labDiagnosticsRepository.searchOrders(session.tenantId, status, patientId, tx);
    });
  }

  async getOrderById(session: SessionContext, orderId: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return labDiagnosticsRepository.getOrderById(session.tenantId, orderId, tx);
    });
  }

  async createOrder(input: Omit<CreateLabOrderInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await labDiagnosticsRepository.createOrder({
        ...input,
        tenantId: session.tenantId,
        orderingDoctorId: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'LAB_ORDER_CREATED',
        resourceType: 'investigation_order',
        resourceId: order.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { orderNumber: order.orderNumber, testCode: order.testCode, patientId: order.patientId }
      }, session, tx);

      return order;
    });
  }

  async collectSpecimen(input: Omit<CollectSpecimenInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await labDiagnosticsRepository.collectSpecimen({
        ...input,
        tenantId: session.tenantId,
        collectedBy: session.userId
      }, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'SAMPLE_COLLECTED',
          resourceType: 'investigation_specimen',
          resourceId: order.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { orderNumber: order.orderNumber, specimenType: input.specimenType }
        }, session, tx);
      }

      return order;
    });
  }

  async enterResult(input: Omit<EnterResultInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await labDiagnosticsRepository.enterResult({
        ...input,
        tenantId: session.tenantId,
        enteredBy: session.userId
      }, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'RESULT_ENTERED',
          resourceType: 'investigation_result',
          resourceId: order.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { orderNumber: order.orderNumber, parameter: input.parameterCode, value: input.resultValue }
        }, session, tx);
      }

      return order;
    });
  }

  async verifyResult(orderId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await labDiagnosticsRepository.verifyResult(session.tenantId, orderId, session.userId, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'RESULT_VERIFIED',
          resourceType: 'investigation_result',
          resourceId: orderId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { orderNumber: order.orderNumber, verifiedBy: session.userId }
        }, session, tx);
      }

      return order;
    });
  }

  async reviewResult(orderId: string, doctorNotes: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await labDiagnosticsRepository.reviewResult(session.tenantId, orderId, session.userId, doctorNotes, tx);

      if (order) {
        await auditRepository.recordEvent({
          eventType: 'RESULT_REVIEWED',
          resourceType: 'investigation_order',
          resourceId: orderId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { orderNumber: order.orderNumber, reviewingDoctor: session.userId }
        }, session, tx);
      }

      return order;
    });
  }
}

export const labDiagnosticsService = new LabDiagnosticsService();
