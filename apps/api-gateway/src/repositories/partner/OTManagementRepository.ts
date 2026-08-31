import {
  getDatabase,
  operationTheatreRooms,
  otSchedules,
  preOperativeAssessments,
  operativeNotes,
  pacuRecoveryRecords,
  postoperativeTransfers,
  encounters,
  eq,
  and,
  desc
} from '@docsearch/database';

export interface CreateOTRoomInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  roomNumber: string;
  name: string;
  roomType?: string; // MAJOR, MINOR, CARDIAC, NEURO, ROBOTIC
  capacity?: number;
}

export interface CreateSurgeryBookingInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  leadSurgeonId: string;
  leadSurgeonName?: string;
  otRoomId: string;
  procedureName: string;
  procedureCode?: string;
  scheduledDate: string;
  estimatedDurationMinutes?: number;
  urgencyLevel?: 'ELECTIVE' | 'URGENT' | 'EMERGENCY';
  preOpDiagnosis?: string;
}

export interface RecordPACAssessmentInput {
  tenantId: string;
  scheduleId: string;
  patientId: string;
  anaesthetistId: string;
  anaesthetistName?: string;
  asaClassification?: string; // ASA_I, ASA_II, ASA_III, ASA_IV, ASA_V
  airwayAssessment?: string; // MALLAMPATI_1, MALLAMPATI_2, etc.
  fitnessStatus: 'FIT_FOR_SURGERY' | 'HIGH_RISK_CLEARANCE' | 'UNFIT_POSTPONE';
  pacNotes: string;
}

export interface RecordOperativeNotesInput {
  tenantId: string;
  scheduleId: string;
  patientId: string;
  surgeonId: string;
  surgeonName?: string;
  procedurePerformed: string;
  intraOpFindings: string;
  operativeTechnique: string;
  implantUsed?: string;
  estimatedBloodLossMl?: number;
  surgicalNotes: string;
}

export interface RecordPACURecoveryInput {
  tenantId: string;
  scheduleId: string;
  patientId: string;
  pacuNurseId: string;
  aldreteScore: number; // 0 - 10
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  spO2?: string;
  painScore?: number;
  recoveryNotes: string;
}

export interface TransferPostOpInput {
  tenantId: string;
  scheduleId: string;
  patientId: string;
  destinationType: 'SURGICAL_WARD' | 'ICU' | 'STEP_DOWN' | 'DAY_CARE_DISCHARGE';
  destinationWardOrBed?: string;
  transferNotes: string;
  transferredBy: string;
}

export interface StoredOTRoom {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  roomNumber: string;
  name: string;
  roomType: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING';
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredSurgerySchedule {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  scheduleNumber: string;
  patientId: string;
  canonicalEncounterId: string;
  otRoomId: string;
  leadSurgeonId: string;
  leadSurgeonName: string;
  procedureName: string;
  procedureCode: string;
  scheduledDate: string;
  estimatedDurationMinutes: number;
  urgencyLevel: string;
  preOpDiagnosis: string;
  status: 'SCHEDULED' | 'PAC_CLEARED' | 'IN_THEATRE' | 'COMPLETED' | 'CANCELLED';
  pacAssessment: {
    anaesthetistId: string;
    anaesthetistName: string;
    asaClassification: string;
    airwayAssessment: string;
    fitnessStatus: string;
    pacNotes: string;
    assessedAt: Date;
  } | null;
  operativeNotes: {
    surgeonId: string;
    surgeonName: string;
    procedurePerformed: string;
    intraOpFindings: string;
    operativeTechnique: string;
    implantUsed?: string | undefined;
    estimatedBloodLossMl: number;
    surgicalNotes: string;
    recordedAt: Date;
  } | null;
  pacuRecovery: {
    pacuNurseId: string;
    aldreteScore: number;
    vitals: {
      temperature?: string | undefined;
      bloodPressure?: string | undefined;
      heartRate?: string | undefined;
      spO2?: string | undefined;
    };
    painScore: number;
    recoveryNotes: string;
    recordedAt: Date;
  } | null;
  postOpTransfer: {
    destinationType: string;
    destinationWardOrBed?: string | undefined;
    transferNotes: string;
    transferredBy: string;
    transferredAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export class OTManagementRepository {
  private memRooms = new Map<string, StoredOTRoom[]>();
  private memSchedules = new Map<string, StoredSurgerySchedule[]>();

  async getOTRooms(tenantId: string, dbClient = getDatabase()): Promise<StoredOTRoom[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(operationTheatreRooms)
          .where(eq(operationTheatreRooms.tenantId, tenantId))
          .orderBy(desc(operationTheatreRooms.createdAt));
        if (rows.length > 0) return rows as unknown as StoredOTRoom[];
      } catch {
        // Fallback
      }
    }
    return this.memRooms.get(tenantId) || [];
  }

  async createOTRoom(input: CreateOTRoomInput, dbClient = getDatabase()): Promise<StoredOTRoom> {
    const id = crypto.randomUUID();
    const now = new Date();
    const record: StoredOTRoom = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      roomNumber: input.roomNumber,
      name: input.name,
      roomType: input.roomType || 'MAJOR',
      status: 'AVAILABLE',
      createdAt: now,
      updatedAt: now
    };

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(operationTheatreRooms).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          roomNumber: record.roomNumber,
          name: record.name,
          roomType: record.roomType,
          status: record.status
        } as unknown as typeof operationTheatreRooms.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memRooms.get(input.tenantId) || [];
    current.unshift(record);
    this.memRooms.set(input.tenantId, current);
    return record;
  }

  async getSchedules(tenantId: string, status?: string, date?: string, dbClient = getDatabase()): Promise<StoredSurgerySchedule[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(otSchedules)
          .where(eq(otSchedules.tenantId, tenantId))
          .orderBy(desc(otSchedules.createdAt));
        if (rows.length > 0) {
          let list = rows as unknown as StoredSurgerySchedule[];
          if (status) list = list.filter(s => s.status === status);
          if (date) list = list.filter(s => s.scheduledDate === date);
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memSchedules.get(tenantId) || [];
    if (status) list = list.filter(s => s.status === status);
    if (date) list = list.filter(s => s.scheduledDate === date);
    return list;
  }

  async getScheduleById(tenantId: string, id: string): Promise<StoredSurgerySchedule | null> {
    const list = this.memSchedules.get(tenantId) || [];
    return list.find(s => s.id === id) || null;
  }

  async createSurgeryBooking(input: CreateSurgeryBookingInput, dbClient = getDatabase()): Promise<StoredSurgerySchedule> {
    const rooms = await this.getOTRooms(input.tenantId, dbClient);
    const targetRoom = rooms.find(r => r.id === input.otRoomId);
    if (!targetRoom) throw new Error('OT Room not found');

    const id = crypto.randomUUID();
    const canonicalEncounterId = crypto.randomUUID();
    const scheduleNumber = `SURG-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const record: StoredSurgerySchedule = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      scheduleNumber,
      patientId: input.patientId,
      canonicalEncounterId,
      otRoomId: input.otRoomId,
      leadSurgeonId: input.leadSurgeonId,
      leadSurgeonName: input.leadSurgeonName || 'Lead Surgeon',
      procedureName: input.procedureName,
      procedureCode: input.procedureCode || 'SURG-PROC-01',
      scheduledDate: input.scheduledDate,
      estimatedDurationMinutes: input.estimatedDurationMinutes || 120,
      urgencyLevel: input.urgencyLevel || 'ELECTIVE',
      preOpDiagnosis: input.preOpDiagnosis || 'Pre-operative evaluation',
      status: 'SCHEDULED',
      pacAssessment: null,
      operativeNotes: null,
      pacuRecovery: null,
      postOpTransfer: null,
      createdAt: now,
      updatedAt: now
    };

    if (dbClient) {
      try {
        // Create canonical encounter
        await dbClient.insert(encounters).values({
          id: canonicalEncounterId,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          patientId: record.patientId,
          doctorId: record.leadSurgeonId,
          encounterType: 'SURGERY',
          status: 'SCHEDULED',
          chiefComplaint: record.procedureName,
          checkedInAt: now
        } as unknown as typeof encounters.$inferInsert);

        // Create OT Schedule
        await dbClient.insert(otSchedules).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          otRoomId: record.otRoomId,
          surgeryRequestId: crypto.randomUUID(),
          scheduledDate: record.scheduledDate,
          leadSurgeonId: record.leadSurgeonId,
          status: record.status
        } as unknown as typeof otSchedules.$inferInsert);
      } catch {
        // Fallback
      }
    }

    const current = this.memSchedules.get(input.tenantId) || [];
    current.unshift(record);
    this.memSchedules.set(input.tenantId, current);
    return record;
  }

  async recordPACAssessment(input: RecordPACAssessmentInput, dbClient = getDatabase()): Promise<StoredSurgerySchedule | null> {
    const item = await this.getScheduleById(input.tenantId, input.scheduleId);
    if (!item) return null;

    const now = new Date();
    item.pacAssessment = {
      anaesthetistId: input.anaesthetistId,
      anaesthetistName: input.anaesthetistName || 'Anaesthetist',
      asaClassification: input.asaClassification || 'ASA_II',
      airwayAssessment: input.airwayAssessment || 'MALLAMPATI_1',
      fitnessStatus: input.fitnessStatus,
      pacNotes: input.pacNotes,
      assessedAt: now
    };

    item.status = input.fitnessStatus === 'FIT_FOR_SURGERY' || input.fitnessStatus === 'HIGH_RISK_CLEARANCE' ? 'PAC_CLEARED' : 'SCHEDULED';
    item.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(preOperativeAssessments).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: item.partnerId,
          organizationId: item.organizationId,
          branchId: item.branchId,
          surgeryRequestId: item.id,
          assessedByDoctorId: input.anaesthetistId,
          fitnessStatus: input.fitnessStatus,
          clinicalNotes: input.pacNotes,
          assessedAt: now
        } as unknown as typeof preOperativeAssessments.$inferInsert);

        await dbClient
          .update(otSchedules)
          .set({ status: item.status, updatedAt: now })
          .where(and(eq(otSchedules.tenantId, input.tenantId), eq(otSchedules.id, input.scheduleId)));
      } catch {
        // Fallback
      }
    }

    return item;
  }

  async recordOperativeNotes(input: RecordOperativeNotesInput, dbClient = getDatabase()): Promise<StoredSurgerySchedule | null> {
    const item = await this.getScheduleById(input.tenantId, input.scheduleId);
    if (!item) return null;

    const now = new Date();
    item.operativeNotes = {
      surgeonId: input.surgeonId,
      surgeonName: input.surgeonName || item.leadSurgeonName,
      procedurePerformed: input.procedurePerformed,
      intraOpFindings: input.intraOpFindings,
      operativeTechnique: input.operativeTechnique,
      implantUsed: input.implantUsed,
      estimatedBloodLossMl: input.estimatedBloodLossMl || 150,
      surgicalNotes: input.surgicalNotes,
      recordedAt: now
    };

    item.status = 'IN_THEATRE';
    item.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(operativeNotes).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: item.partnerId,
          organizationId: item.organizationId,
          branchId: item.branchId,
          surgeryRequestId: item.id,
          leadSurgeonId: input.surgeonId,
          procedureName: input.procedurePerformed,
          intraoperativeFindings: input.intraOpFindings,
          surgicalTechnique: input.operativeTechnique,
          estimatedBloodLossMl: input.estimatedBloodLossMl || 150,
          operativeNotes: input.surgicalNotes,
          recordedAt: now
        } as unknown as typeof operativeNotes.$inferInsert);

        await dbClient
          .update(otSchedules)
          .set({ status: 'IN_THEATRE', updatedAt: now })
          .where(and(eq(otSchedules.tenantId, input.tenantId), eq(otSchedules.id, input.scheduleId)));
      } catch {
        // Fallback
      }
    }

    return item;
  }

  async recordPACURecovery(input: RecordPACURecoveryInput, dbClient = getDatabase()): Promise<StoredSurgerySchedule | null> {
    const item = await this.getScheduleById(input.tenantId, input.scheduleId);
    if (!item) return null;

    const now = new Date();
    item.pacuRecovery = {
      pacuNurseId: input.pacuNurseId,
      aldreteScore: input.aldreteScore,
      vitals: {
        temperature: input.temperature,
        bloodPressure: input.bloodPressure,
        heartRate: input.heartRate,
        spO2: input.spO2
      },
      painScore: input.painScore || 2,
      recoveryNotes: input.recoveryNotes,
      recordedAt: now
    };

    item.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(pacuRecoveryRecords).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: item.partnerId,
          organizationId: item.organizationId,
          branchId: item.branchId,
          surgeryRequestId: item.id,
          pacuNurseId: input.pacuNurseId,
          aldreteScore: input.aldreteScore,
          painScore: input.painScore || 2,
          clinicalNotes: input.recoveryNotes,
          recordedAt: now
        } as unknown as typeof pacuRecoveryRecords.$inferInsert);
      } catch {
        // Fallback
      }
    }

    return item;
  }

  async transferPostOp(input: TransferPostOpInput, dbClient = getDatabase()): Promise<StoredSurgerySchedule | null> {
    const item = await this.getScheduleById(input.tenantId, input.scheduleId);
    if (!item) return null;

    const now = new Date();
    item.postOpTransfer = {
      destinationType: input.destinationType,
      destinationWardOrBed: input.destinationWardOrBed,
      transferNotes: input.transferNotes,
      transferredBy: input.transferredBy,
      transferredAt: now
    };

    item.status = 'COMPLETED';
    item.updatedAt = now;

    // Release OT Room
    const rooms = this.memRooms.get(input.tenantId) || [];
    const room = rooms.find(r => r.id === item.otRoomId);
    if (room) {
      room.status = 'AVAILABLE';
      room.updatedAt = now;
    }

    if (dbClient) {
      try {
        await dbClient.insert(postoperativeTransfers).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: item.partnerId,
          organizationId: item.organizationId,
          branchId: item.branchId,
          surgeryRequestId: item.id,
          destinationUnit: input.destinationType,
          transferNotes: input.transferNotes,
          transferredBy: input.transferredBy,
          transferredAt: now
        } as unknown as typeof postoperativeTransfers.$inferInsert);

        await dbClient
          .update(otSchedules)
          .set({ status: 'COMPLETED', updatedAt: now })
          .where(and(eq(otSchedules.tenantId, input.tenantId), eq(otSchedules.id, input.scheduleId)));

        if (room) {
          await dbClient
            .update(operationTheatreRooms)
            .set({ status: 'AVAILABLE', updatedAt: now })
            .where(and(eq(operationTheatreRooms.tenantId, input.tenantId), eq(operationTheatreRooms.id, room.id)));
        }
      } catch {
        // Fallback
      }
    }

    return item;
  }

  async getPatientSurgicalHistory(tenantId: string, patientId: string): Promise<StoredSurgerySchedule[]> {
    const list = this.memSchedules.get(tenantId) || [];
    return list.filter(s => s.patientId === patientId);
  }
}

export const otManagementRepository = new OTManagementRepository();
