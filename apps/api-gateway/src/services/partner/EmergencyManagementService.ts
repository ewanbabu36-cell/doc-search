import {
  emergencyManagementRepository,
  type EmergencyRegistrationInput,
  type EmergencyTriageInput,
  type EmergencyTreatmentInput,
  type EmergencyDispositionInput
} from '../../repositories/partner/EmergencyManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class EmergencyManagementService {
  async getQueue(session: SessionContext, status?: string, priority?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return emergencyManagementRepository.getQueue(session.tenantId, status, priority, tx);
    });
  }

  async getEncounterById(session: SessionContext, id: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return emergencyManagementRepository.getEncounterById(session.tenantId, id, tx);
    });
  }

  async registerEmergencyPatient(input: Omit<EmergencyRegistrationInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await emergencyManagementRepository.registerEmergencyPatient({
        ...input,
        tenantId: session.tenantId,
        doctorId: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'EMERGENCY_REGISTERED',
        resourceType: 'emergency_encounter',
        resourceId: record.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { emergencyNumber: record.emergencyNumber, patientId: record.patientId, priority: record.priority }
      }, session, tx);

      return record;
    });
  }

  async recordTriage(input: Omit<EmergencyTriageInput, 'tenantId' | 'triageNurseId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await emergencyManagementRepository.recordTriage({
        ...input,
        tenantId: session.tenantId,
        triageNurseId: session.userId
      }, tx);

      if (record) {
        await auditRepository.recordEvent({
          eventType: 'TRIAGE_COMPLETED',
          resourceType: 'emergency_triage',
          resourceId: record.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { emergencyNumber: record.emergencyNumber, category: input.triageCategory }
        }, session, tx);
      }

      return record;
    });
  }

  async recordTreatment(input: Omit<EmergencyTreatmentInput, 'tenantId' | 'clinicianId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await emergencyManagementRepository.recordTreatment({
        ...input,
        tenantId: session.tenantId,
        clinicianId: session.userId
      }, tx);

      if (record) {
        await auditRepository.recordEvent({
          eventType: 'EMERGENCY_TREATMENT_RECORDED',
          resourceType: 'emergency_encounter',
          resourceId: record.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { emergencyNumber: record.emergencyNumber, clinicianId: session.userId }
        }, session, tx);
      }

      return record;
    });
  }

  async recordDisposition(input: Omit<EmergencyDispositionInput, 'tenantId' | 'clinicianId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const record = await emergencyManagementRepository.recordDisposition({
        ...input,
        tenantId: session.tenantId,
        clinicianId: session.userId
      }, tx);

      if (record) {
        await auditRepository.recordEvent({
          eventType: 'DISPOSITION_COMPLETED',
          resourceType: 'emergency_disposition',
          resourceId: record.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { emergencyNumber: record.emergencyNumber, dispositionType: input.dispositionType }
        }, session, tx);
      }

      return record;
    });
  }

  async getPatientEmergencyHistory(session: SessionContext, patientId: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return emergencyManagementRepository.getPatientEmergencyHistory(session.tenantId, patientId);
    });
  }
}

export const emergencyManagementService = new EmergencyManagementService();
