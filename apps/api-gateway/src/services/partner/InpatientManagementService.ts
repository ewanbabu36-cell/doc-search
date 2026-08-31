import {
  inpatientManagementRepository,
  type CreateWardInput,
  type CreateBedInput,
  type CreateAdmissionInput,
  type TransferBedInput,
  type NursingNoteInput,
  type DischargeInput
} from '../../repositories/partner/InpatientManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class InpatientManagementService {
  async getWards(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return inpatientManagementRepository.getWards(session.tenantId, tx);
    });
  }

  async createWard(input: Omit<CreateWardInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const ward = await inpatientManagementRepository.createWard({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'WARD_CREATED',
        resourceType: 'inpatient_ward',
        resourceId: ward.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { wardCode: ward.wardCode, name: ward.name }
      }, session, tx);

      return ward;
    });
  }

  async getBeds(session: SessionContext, wardId?: string, status?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return inpatientManagementRepository.getBeds(session.tenantId, wardId, status, tx);
    });
  }

  async createBed(input: Omit<CreateBedInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const bed = await inpatientManagementRepository.createBed({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'BED_CREATED',
        resourceType: 'inpatient_bed',
        resourceId: bed.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { bedNumber: bed.bedNumber, wardId: bed.wardId }
      }, session, tx);

      return bed;
    });
  }

  async getAdmissions(session: SessionContext, status?: string, patientId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return inpatientManagementRepository.getAdmissions(session.tenantId, status, patientId, tx);
    });
  }

  async createAdmission(input: Omit<CreateAdmissionInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const admission = await inpatientManagementRepository.createAdmission({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'ADMISSION_CREATED',
        resourceType: 'inpatient_admission',
        resourceId: admission.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { admissionNumber: admission.admissionNumber, patientId: admission.patientId, bedId: admission.bedId }
      }, session, tx);

      return admission;
    });
  }

  async transferBed(input: Omit<TransferBedInput, 'tenantId' | 'transferredBy'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const transfer = await inpatientManagementRepository.transferBed({
        ...input,
        tenantId: session.tenantId,
        transferredBy: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'BED_TRANSFERRED',
        resourceType: 'inpatient_transfer',
        resourceId: transfer.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { admissionId: transfer.admissionId, fromBed: transfer.sourceBedId, toBed: transfer.destinationBedId }
      }, session, tx);

      return transfer;
    });
  }

  async recordNursingNote(input: Omit<NursingNoteInput, 'tenantId' | 'nurseId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const note = await inpatientManagementRepository.recordNursingNote({
        ...input,
        tenantId: session.tenantId,
        nurseId: session.userId,
        nurseName: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'NURSING_RECORD_CREATED',
        resourceType: 'inpatient_nursing_note',
        resourceId: note.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { admissionId: note.admissionId, patientId: note.patientId }
      }, session, tx);

      return note;
    });
  }

  async getNursingNotes(session: SessionContext, admissionId?: string, patientId?: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return inpatientManagementRepository.getNursingNotes(session.tenantId, admissionId, patientId);
    });
  }

  async dischargePatient(input: Omit<DischargeInput, 'tenantId' | 'dischargingDoctorId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const admission = await inpatientManagementRepository.dischargePatient({
        ...input,
        tenantId: session.tenantId,
        dischargingDoctorId: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PATIENT_DISCHARGED',
        resourceType: 'inpatient_admission',
        resourceId: admission.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { admissionNumber: admission.admissionNumber, patientId: admission.patientId }
      }, session, tx);

      return admission;
    });
  }
}

export const inpatientManagementService = new InpatientManagementService();
