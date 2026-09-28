import {
  pharmacyManagementRepository,
  type CreateMedicationInput,
  type ReceiveStockInput,
  type DispenseInput,
  type CreateReturnInput,
  type CreateStockAdjustmentInput
} from '../../repositories/partner/PharmacyManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class PharmacyManagementService {
  async getPrescriptionQueue(
    session: SessionContext,
    status?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async () => {
      const items = await pharmacyManagementRepository.getPrescriptionQueue(scope.tenantId, status);
      return ScopeGuard.filterRecordsByScope(items, scope);
    });
  }

  async getPrescriptionById(
    session: SessionContext,
    prescriptionId: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async () => {
      const rx = await pharmacyManagementRepository.getPrescriptionById(scope.tenantId, prescriptionId);
      if (rx) {
        ScopeGuard.assertRecordInScope(session, rx, scope);
      }
      return rx;
    });
  }

  async getMedications(
    session: SessionContext,
    query?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const items = await pharmacyManagementRepository.getMedications(scope.tenantId, query, tx);
      return ScopeGuard.filterRecordsByScope(items, scope);
    });
  }

  async createMedication(
    input: Omit<CreateMedicationInput, 'tenantId'> & { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const med = await pharmacyManagementRepository.createMedication({
        ...input,
        tenantId: scope.tenantId,
        ...(scope.branchId || session.branchId ? { branchId: scope.branchId || session.branchId } : {})
      } as any, tx);

      await auditRepository.recordEvent({
        eventType: 'MEDICATION_MASTER_CREATED',
        resourceType: 'medication_catalog',
        resourceId: med.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { code: med.medicationCode, name: med.name }
      }, session, tx);

      return med;
    });
  }

  async getBatches(
    session: SessionContext,
    medicationId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const batches = await pharmacyManagementRepository.getBatches(scope.tenantId, medicationId, tx);
      return ScopeGuard.filterRecordsByScope(batches, scope);
    });
  }

  async receiveStock(
    input: Omit<ReceiveStockInput, 'tenantId'> & { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const batch = await pharmacyManagementRepository.receiveStock({
        ...input,
        tenantId: scope.tenantId,
        ...(scope.branchId || session.branchId ? { branchId: scope.branchId || session.branchId } : {})
      } as any, session.userId, tx);

      await auditRepository.recordEvent({
        eventType: 'STOCK_RECEIVED',
        resourceType: 'pharmacy_batch',
        resourceId: batch.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { batchNumber: batch.batchNumber, qty: batch.receivedQuantity }
      }, session, tx);

      return batch;
    });
  }

  async dispense(
    input: Omit<DispenseInput, 'tenantId' | 'pharmacistId' | 'pharmacistName'> & { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const dispensing = await pharmacyManagementRepository.dispense({
        ...input,
        tenantId: scope.tenantId,
        ...(scope.branchId || session.branchId ? { branchId: scope.branchId || session.branchId } : {}),
        pharmacistId: session.userId,
        pharmacistName: session.userId
      } as any, tx);

      await auditRepository.recordEvent({
        eventType: 'MEDICATION_DISPENSED',
        resourceType: 'pharmacy_dispensing',
        resourceId: dispensing.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { dispensingNumber: dispensing.dispensingNumber, invoiceNumber: dispensing.invoiceNumber, total: dispensing.totalBillAmount }
      }, session, tx);

      return dispensing;
    });
  }

  async getStockMovements(
    session: SessionContext,
    medicationId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async () => {
      const items = await pharmacyManagementRepository.getStockMovements(scope.tenantId, medicationId);
      return ScopeGuard.filterRecordsByScope(items, scope);
    });
  }

  async getPatientMedicationHistory(
    session: SessionContext,
    patientId: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async () => {
      const items = await pharmacyManagementRepository.getPatientMedicationHistory(scope.tenantId, patientId);
      return ScopeGuard.filterRecordsByScope(items, scope);
    });
  }

  async getInventory(
    session: SessionContext,
    branchId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      ...requestedScope,
      ...(branchId ? { branchId } : {})
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const items = await pharmacyManagementRepository.getInventory(scope.tenantId, scope.branchId || branchId, tx);
      return ScopeGuard.filterRecordsByScope(items, scope);
    });
  }

  async getInventorySnapshot(
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async () => {
      return pharmacyManagementRepository.getInventorySnapshot(scope.tenantId);
    });
  }

  async syncOfflineInvoices(
    invoices: Parameters<typeof pharmacyManagementRepository.syncOfflineInvoices>[1],
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await pharmacyManagementRepository.syncOfflineInvoices(
        session.tenantId,
        invoices,
        session.userId,
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'OFFLINE_BILLS_SYNCHRONIZED',
        resourceType: 'pharmacy_offline_sync',
        resourceId: `sync-${Date.now()}`,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          syncedCount: result.syncedCount,
          duplicateCount: result.duplicateCount,
          totalSubmitted: invoices.length
        }
      }, session, tx);

      return result;
    });
  }

  async seedDevMockStock(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await pharmacyManagementRepository.seedDevMockStock(
        session.tenantId,
        session.branchId,
        session.userId,
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'STOCK_RECEIVED',
        resourceType: 'pharmacy_dev_mock_stock',
        resourceId: `dev-seed-${Date.now()}`,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          source: 'DEVELOPMENT_TEST',
          seededCount: result.seededCount,
          medicationsCreated: result.medicationsCreated
        }
      }, session, tx);

      return result;
    });
  }

  async cleanupDevMockStock(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await pharmacyManagementRepository.cleanupDevMockStock(
        session.tenantId,
        session.branchId,
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'STOCK_ADJUSTED',
        resourceType: 'pharmacy_dev_mock_stock',
        resourceId: `dev-cleanup-${Date.now()}`,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          source: 'DEVELOPMENT_TEST',
          removedBatchesCount: result.removedBatchesCount,
          removedMovementsCount: result.removedMovementsCount,
          removedMedicationsCount: result.removedMedicationsCount
        }
      }, session, tx);

      return result;
    });
  }

  async createReturn(
    input: Omit<CreateReturnInput, 'tenantId' | 'actorId'> & { tenantId?: string | undefined; branchId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const ret = await pharmacyManagementRepository.createReturn({
        ...input,
        tenantId: scope.tenantId,
        branchId: (scope.branchId || session.branchId) as any,
        actorId: session.userId,
        actorRole: (session.roles && (session.roles as string[])[0]) || 'PHARMACIST'
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PHARMACY_MEDICATION_RETURNED',
        resourceType: 'pharmacy_return',
        resourceId: ret.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: {
          returnNumber: ret.returnNumber,
          dispensingId: ret.dispensingId,
          batchId: ret.batchId,
          quantity: ret.quantity,
          disposition: ret.disposition
        }
      }, session, tx);

      return ret;
    });
  }

  async getReturns(
    session: SessionContext,
    branchId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      ...requestedScope,
      ...(branchId ? { branchId } : {})
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const items = await pharmacyManagementRepository.getReturns(scope.tenantId, scope.branchId || branchId, tx);
      return ScopeGuard.filterRecordsByScope(items, scope);
    });
  }

  async createStockAdjustment(
    input: Omit<CreateStockAdjustmentInput, 'tenantId' | 'actorId'> & { tenantId?: string | undefined; branchId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const adj = await pharmacyManagementRepository.createStockAdjustment({
        ...input,
        tenantId: scope.tenantId,
        branchId: (scope.branchId || session.branchId) as any,
        actorId: session.userId,
        actorRole: (session.roles && (session.roles as string[])[0]) || 'PHARMACIST'
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'STOCK_ADJUSTMENT_EXECUTED',
        resourceType: 'pharmacy_stock_adjustment',
        resourceId: adj.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: {
          adjustmentNumber: adj.adjustmentNumber,
          batchId: adj.batchId,
          adjustmentQuantity: adj.adjustmentQuantity,
          reason: adj.reason
        }
      }, session, tx);

      return adj;
    });
  }

  async getAdjustments(
    session: SessionContext,
    branchId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      ...requestedScope,
      ...(branchId ? { branchId } : {})
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const items = await pharmacyManagementRepository.getAdjustments(scope.tenantId, scope.branchId || branchId, tx);
      return ScopeGuard.filterRecordsByScope(items, scope);
    });
  }

  async createBatchRecall(
    batchId: string,
    reason: string,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await pharmacyManagementRepository.createBatchRecall(
        batchId,
        reason,
        session.userId,
        session.tenantId,
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'BATCH_RECALL_INITIATED',
        resourceType: 'pharmacy_batch',
        resourceId: batchId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          batchNumber: result.batchNumber,
          quarantinedQuantity: result.quarantinedQuantity,
          affectedCount: result.affectedDispensations.length,
          recallReason: reason
        }
      }, session, tx);

      return result;
    });
  }

  async unblockBatch(
    batchId: string,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const batch = await pharmacyManagementRepository.unblockBatch(
        batchId,
        session.userId,
        session.tenantId,
        tx
      );

      await auditRepository.recordEvent({
        eventType: 'BATCH_UNBLOCKED',
        resourceType: 'pharmacy_batch',
        resourceId: batchId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          batchNumber: batch.batchNumber,
          status: batch.status
        }
      }, session, tx);

      return batch;
    });
  }
}

export const pharmacyManagementService = new PharmacyManagementService();
