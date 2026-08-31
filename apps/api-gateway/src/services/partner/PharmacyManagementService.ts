import {
  pharmacyManagementRepository,
  type CreateMedicationInput,
  type ReceiveStockInput,
  type DispenseInput
} from '../../repositories/partner/PharmacyManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class PharmacyManagementService {
  async getPrescriptionQueue(session: SessionContext, status?: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return pharmacyManagementRepository.getPrescriptionQueue(session.tenantId, status);
    });
  }
  async getMedications(session: SessionContext, query?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return pharmacyManagementRepository.getMedications(session.tenantId, query, tx);
    });
  }

  async createMedication(input: Omit<CreateMedicationInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const med = await pharmacyManagementRepository.createMedication({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'MEDICATION_MASTER_CREATED',
        resourceType: 'medication_catalog',
        resourceId: med.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { code: med.medicationCode, name: med.name }
      }, session, tx);

      return med;
    });
  }

  async getBatches(session: SessionContext, medicationId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return pharmacyManagementRepository.getBatches(session.tenantId, medicationId, tx);
    });
  }

  async receiveStock(input: Omit<ReceiveStockInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const batch = await pharmacyManagementRepository.receiveStock({
        ...input,
        tenantId: session.tenantId
      }, session.userId, tx);

      await auditRepository.recordEvent({
        eventType: 'STOCK_RECEIVED',
        resourceType: 'pharmacy_batch',
        resourceId: batch.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { batchNumber: batch.batchNumber, qty: batch.receivedQuantity }
      }, session, tx);

      return batch;
    });
  }

  async dispense(input: Omit<DispenseInput, 'tenantId' | 'pharmacistId' | 'pharmacistName'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const dispensing = await pharmacyManagementRepository.dispense({
        ...input,
        tenantId: session.tenantId,
        pharmacistId: session.userId,
        pharmacistName: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'MEDICATION_DISPENSED',
        resourceType: 'pharmacy_dispensing',
        resourceId: dispensing.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { dispensingNumber: dispensing.dispensingNumber, invoiceNumber: dispensing.invoiceNumber, total: dispensing.totalBillAmount }
      }, session, tx);

      return dispensing;
    });
  }

  async getStockMovements(session: SessionContext, medicationId?: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return pharmacyManagementRepository.getStockMovements(session.tenantId, medicationId);
    });
  }

  async getPatientMedicationHistory(session: SessionContext, patientId: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return pharmacyManagementRepository.getPatientMedicationHistory(session.tenantId, patientId);
    });
  }
}

export const pharmacyManagementService = new PharmacyManagementService();
