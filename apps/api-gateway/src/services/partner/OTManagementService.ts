import {
  otManagementRepository,
  type CreateOTRoomInput,
  type CreateSurgeryBookingInput,
  type RecordPACAssessmentInput,
  type RecordOperativeNotesInput,
  type RecordPACURecoveryInput,
  type TransferPostOpInput
} from '../../repositories/partner/OTManagementRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class OTManagementService {
  async getOTRooms(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return otManagementRepository.getOTRooms(session.tenantId, tx);
    });
  }

  async createOTRoom(input: Omit<CreateOTRoomInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const room = await otManagementRepository.createOTRoom({
        ...input,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'OT_ROOM_CREATED',
        resourceType: 'ot_room',
        resourceId: room.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { roomNumber: room.roomNumber, name: room.name }
      }, session, tx);

      return room;
    });
  }

  async getSchedules(session: SessionContext, status?: string, date?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return otManagementRepository.getSchedules(session.tenantId, status, date, tx);
    });
  }

  async createSurgeryBooking(input: Omit<CreateSurgeryBookingInput, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const schedule = await otManagementRepository.createSurgeryBooking({
        ...input,
        tenantId: session.tenantId,
        leadSurgeonId: input.leadSurgeonId || session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'SURGERY_BOOKED',
        resourceType: 'ot_schedule',
        resourceId: schedule.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { scheduleNumber: schedule.scheduleNumber, patientId: schedule.patientId, procedure: schedule.procedureName }
      }, session, tx);

      return schedule;
    });
  }

  async recordPACAssessment(input: Omit<RecordPACAssessmentInput, 'tenantId' | 'anaesthetistId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const schedule = await otManagementRepository.recordPACAssessment({
        ...input,
        tenantId: session.tenantId,
        anaesthetistId: session.userId,
        anaesthetistName: session.userId
      }, tx);

      if (schedule) {
        await auditRepository.recordEvent({
          eventType: 'PAC_CLEARED',
          resourceType: 'pre_operative_assessment',
          resourceId: schedule.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { scheduleNumber: schedule.scheduleNumber, fitnessStatus: input.fitnessStatus }
        }, session, tx);
      }

      return schedule;
    });
  }

  async recordOperativeNotes(input: Omit<RecordOperativeNotesInput, 'tenantId' | 'surgeonId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const schedule = await otManagementRepository.recordOperativeNotes({
        ...input,
        tenantId: session.tenantId,
        surgeonId: session.userId,
        surgeonName: session.userId
      }, tx);

      if (schedule) {
        await auditRepository.recordEvent({
          eventType: 'OPERATIVE_NOTES_SAVED',
          resourceType: 'operative_note',
          resourceId: schedule.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { scheduleNumber: schedule.scheduleNumber, procedure: input.procedurePerformed }
        }, session, tx);
      }

      return schedule;
    });
  }

  async recordPACURecovery(input: Omit<RecordPACURecoveryInput, 'tenantId' | 'pacuNurseId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const schedule = await otManagementRepository.recordPACURecovery({
        ...input,
        tenantId: session.tenantId,
        pacuNurseId: session.userId
      }, tx);

      if (schedule) {
        await auditRepository.recordEvent({
          eventType: 'PACU_RECOVERY_RECORDED',
          resourceType: 'pacu_recovery',
          resourceId: schedule.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { scheduleNumber: schedule.scheduleNumber, aldreteScore: input.aldreteScore }
        }, session, tx);
      }

      return schedule;
    });
  }

  async transferPostOp(input: Omit<TransferPostOpInput, 'tenantId' | 'transferredBy'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const schedule = await otManagementRepository.transferPostOp({
        ...input,
        tenantId: session.tenantId,
        transferredBy: session.userId
      }, tx);

      if (schedule) {
        await auditRepository.recordEvent({
          eventType: 'SURGERY_COMPLETED',
          resourceType: 'postoperative_transfer',
          resourceId: schedule.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { scheduleNumber: schedule.scheduleNumber, destination: input.destinationType }
        }, session, tx);
      }

      return schedule;
    });
  }

  async getPatientSurgicalHistory(session: SessionContext, patientId: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return otManagementRepository.getPatientSurgicalHistory(session.tenantId, patientId);
    });
  }
}

export const otManagementService = new OTManagementService();
