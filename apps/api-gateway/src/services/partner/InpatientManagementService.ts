import {
  inpatientManagementRepository,
  type CreateWardInput,
  type CreateBedInput,
  type CreateAdmissionInput,
  type CreateAdmissionRequestInput,
  type TransferBedInput,
  type NursingNoteInput,
  type DischargeInput,
  type CreateDoctorRoundInput,
  type RecordVitalObservationInput
} from '../../repositories/partner/InpatientManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class InpatientManagementService {
  async getWards(
    session: SessionContext,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const wards = await inpatientManagementRepository.getWards(scope.tenantId, tx);
      return ScopeGuard.filterRecordsByScope(wards, scope);
    });
  }

  async createWard(
    input: Omit<CreateWardInput, 'tenantId'> & { tenantId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const ward = await inpatientManagementRepository.createWard({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'WARD_CREATED',
        resourceType: 'inpatient_ward',
        resourceId: ward.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { wardCode: ward.wardCode, name: ward.name }
      }, session, tx);

      return ward;
    });
  }

  async getBeds(
    session: SessionContext,
    wardId?: string,
    status?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const beds = await inpatientManagementRepository.getBeds(scope.tenantId, wardId, status, tx);
      return ScopeGuard.filterRecordsByScope(beds, scope);
    });
  }

  async createBed(
    input: Omit<CreateBedInput, 'tenantId'> & { tenantId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const bed = await inpatientManagementRepository.createBed({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'BED_CREATED',
        resourceType: 'inpatient_bed',
        resourceId: bed.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { bedNumber: bed.bedNumber, wardId: bed.wardId }
      }, session, tx);

      return bed;
    });
  }

  async getAdmissions(
    session: SessionContext,
    status?: string,
    patientId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const admissions = await inpatientManagementRepository.getAdmissions(scope.tenantId, status, patientId, tx);
      return ScopeGuard.filterRecordsByScope(admissions, scope);
    });
  }

  async createAdmission(
    input: Omit<CreateAdmissionInput, 'tenantId'> & { tenantId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const admission = await inpatientManagementRepository.createAdmission({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'ADMISSION_CREATED',
        resourceType: 'inpatient_admission',
        resourceId: admission.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { admissionNumber: admission.admissionNumber, patientId: admission.patientId, bedId: admission.bedId }
      }, session, tx);

      return admission;
    });
  }

  async transferBed(
    input: Omit<TransferBedInput, 'tenantId' | 'transferredBy'> & { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const transfer = await inpatientManagementRepository.transferBed({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId,
        transferredBy: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'BED_TRANSFERRED',
        resourceType: 'inpatient_transfer',
        resourceId: transfer.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { admissionId: transfer.admissionId, fromBed: transfer.sourceBedId, toBed: transfer.destinationBedId }
      }, session, tx);

      return transfer;
    });
  }

  async recordNursingNote(
    input: Omit<NursingNoteInput, 'tenantId' | 'nurseId'> & { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const note = await inpatientManagementRepository.recordNursingNote({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId,
        nurseId: session.userId,
        nurseName: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'NURSING_RECORD_CREATED',
        resourceType: 'inpatient_nursing_note',
        resourceId: note.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { admissionId: note.admissionId, patientId: note.patientId }
      }, session, tx);

      return note;
    });
  }

  async getNursingNotes(
    session: SessionContext,
    admissionId?: string,
    patientId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const notes = await inpatientManagementRepository.getNursingNotes(scope.tenantId, admissionId, patientId, tx);
      return ScopeGuard.filterRecordsByScope(notes, scope);
    });
  }

  async dischargePatient(
    input: Omit<DischargeInput, 'tenantId' | 'dischargingDoctorId'> & { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const admission = await inpatientManagementRepository.dischargePatient({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId,
        dischargingDoctorId: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'PATIENT_DISCHARGED',
        resourceType: 'inpatient_admission',
        resourceId: admission.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { admissionNumber: admission.admissionNumber, patientId: admission.patientId }
      }, session, tx);

      return admission;
    });
  }

  async createDoctorRound(
    input: Omit<CreateDoctorRoundInput, 'tenantId'> & { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const round = await inpatientManagementRepository.createDoctorRound({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId,
        doctorName: input.doctorName || session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'DOCTOR_ROUND_RECORDED',
        resourceType: 'inpatient_doctor_round',
        resourceId: round.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { admissionId: round.admissionId, doctorName: round.doctorName, roundType: round.roundType }
      }, session, tx);

      return round;
    });
  }

  async getDoctorRounds(
    session: SessionContext,
    admissionId?: string,
    patientId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const rounds = await inpatientManagementRepository.getDoctorRounds(scope.tenantId, admissionId, patientId, tx);
      return ScopeGuard.filterRecordsByScope(rounds, scope);
    });
  }

  async recordVitalObservation(
    input: Omit<RecordVitalObservationInput, 'tenantId' | 'recordedBy'> & { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined; recordedBy?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const observation = await inpatientManagementRepository.recordVitalObservation({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId,
        recordedBy: input.recordedBy || session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'VITALS_OBSERVATION_RECORDED',
        resourceType: 'inpatient_vital_observation',
        resourceId: observation.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { admissionId: observation.admissionId, recordedBy: observation.recordedBy, isAbnormal: observation.isAbnormal }
      }, session, tx);

      return observation;
    });
  }

  async getVitalObservations(
    session: SessionContext,
    admissionId?: string,
    patientId?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const vitals = await inpatientManagementRepository.getVitalObservations(scope.tenantId, admissionId, patientId, tx);
      return ScopeGuard.filterRecordsByScope(vitals, scope);
    });
  }

  async getDischargeSummary(
    session: SessionContext,
    admissionId: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const summary = await inpatientManagementRepository.getDischargeSummary(scope.tenantId, admissionId, tx);
      ScopeGuard.assertRecordInScope(summary, scope);
      return summary;
    });
  }

  async getIpdBillingSummary(
    session: SessionContext,
    admissionId: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return await inpatientManagementRepository.getIpdBillingSummary(scope.tenantId, admissionId, tx);
    });
  }

  async generateConsolidatedIpdBill(
    session: SessionContext,
    admissionId: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const result = await inpatientManagementRepository.generateConsolidatedIpdBill(scope.tenantId, admissionId, session.userId, tx);

      await auditRepository.recordEvent({
        eventType: 'IPD_BILL_GENERATED',
        resourceType: 'billing_invoice',
        resourceId: result.invoice.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { admissionId, invoiceNumber: result.invoice.invoiceNumber, totalAmount: result.invoice.totalAmount }
      }, session, tx);

      return result;
    });
  }

  async getAdmissionRequests(
    session: SessionContext,
    status?: string,
    requestedScope?: { tenantId?: string | undefined; branchId?: string | undefined; departmentId?: string | undefined }
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, requestedScope);
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const requests = await inpatientManagementRepository.getAdmissionRequests(
        scope.tenantId,
        scope.branchId,
        status,
        tx
      );
      return ScopeGuard.filterRecordsByScope(requests, scope);
    });
  }

  async createAdmissionRequest(
    input: Omit<CreateAdmissionRequestInput, 'tenantId'> & { tenantId?: string | undefined; departmentId?: string | undefined },
    session: SessionContext
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session, {
      tenantId: input.tenantId,
      branchId: input.branchId,
      departmentId: input.departmentId
    });
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const req = await inpatientManagementRepository.createAdmissionRequest({
        ...input,
        tenantId: scope.tenantId,
        branchId: scope.branchId || input.branchId || session.branchId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'ADMISSION_REQUESTED',
        resourceType: 'inpatient_admission_request',
        resourceId: req.id,
        tenantId: scope.tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: { requestNumber: req.requestNumber, patientId: req.patientId, patientName: req.patientName }
      }, session, tx);

      return req;
    });
  }
}

export const inpatientManagementService = new InpatientManagementService();

