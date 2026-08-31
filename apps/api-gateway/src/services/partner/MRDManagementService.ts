import {
  mrdManagementRepository,
  type CreateMedicalRecordInput,
  type AssignICD10DiagnosisInput,
  type SubmitCodingReviewInput,
  type FinalizeMedicalRecordInput,
  type AmendMedicalRecordInput
} from '../../repositories/partner/MRDManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class MRDManagementService {
  async searchICD10(query?: string, category?: string) {
    return mrdManagementRepository.searchICD10(query, category);
  }

  async getMedicalRecords(session: SessionContext, patientId?: string, status?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return mrdManagementRepository.getMedicalRecords(session.tenantId, patientId, status, tx);
    });
  }

  async createMedicalRecord(input: Omit<CreateMedicalRecordInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await mrdManagementRepository.createMedicalRecord({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'RECORD_CREATED',
        resourceType: 'medical_record_index',
        resourceId: record.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { recordNumber: record.recordNumber, patientId: record.patientId, encounterId: record.encounterId }
      }, session, tx);

      return record;
    });
  }

  async assignICD10Diagnosis(input: Omit<AssignICD10DiagnosisInput, 'tenantId' | 'assignedByCoder'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await mrdManagementRepository.assignICD10Diagnosis({
        ...input,
        tenantId: session.tenantId,
        assignedByCoder: session.userId
      }, tx);

      if (record) {
        await auditRepository.recordEvent({
          eventType: 'ICD10_ASSIGNED',
          resourceType: 'medical_diagnosis_code',
          resourceId: record.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { recordNumber: record.recordNumber, icdCode: input.icdCode, description: input.icdDescription }
        }, session, tx);
      }

      return record;
    });
  }

  async submitCodingReview(input: Omit<SubmitCodingReviewInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await mrdManagementRepository.submitCodingReview({
        ...input,
        tenantId: session.tenantId,
        reviewerName: input.reviewerName || session.userId
      }, tx);

      if (record) {
        await auditRepository.recordEvent({
          eventType: 'CODING_REVIEWED',
          resourceType: 'coding_review',
          resourceId: record.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { recordNumber: record.recordNumber, status: input.status, accuracy: input.codingAccuracyScorePercent }
        }, session, tx);
      }

      return record;
    });
  }

  async finalizeMedicalRecord(input: Omit<FinalizeMedicalRecordInput, 'tenantId' | 'finalizedBy'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await mrdManagementRepository.finalizeMedicalRecord({
        ...input,
        tenantId: session.tenantId,
        finalizedBy: session.userId
      }, tx);

      if (record) {
        await auditRepository.recordEvent({
          eventType: 'RECORD_FINALIZED',
          resourceType: 'medical_record_index',
          resourceId: record.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { recordNumber: record.recordNumber, status: 'FINALIZED' }
        }, session, tx);
      }

      return record;
    });
  }

  async amendMedicalRecord(input: Omit<AmendMedicalRecordInput, 'tenantId' | 'amendedBy'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await mrdManagementRepository.amendMedicalRecord({
        ...input,
        tenantId: session.tenantId,
        amendedBy: session.userId
      }, tx);

      if (record) {
        await auditRepository.recordEvent({
          eventType: 'RECORD_AMENDED',
          resourceType: 'medical_record_amendment',
          resourceId: record.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { recordNumber: record.recordNumber, reason: input.amendmentReason }
        }, session, tx);
      }

      return record;
    });
  }

  async getPatientMRDHistory(session: SessionContext, patientId: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return mrdManagementRepository.getPatientMRDHistory(session.tenantId, patientId);
    });
  }
}

export const mrdManagementService = new MRDManagementService();
