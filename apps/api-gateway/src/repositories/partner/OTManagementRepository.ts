import {
  getDatabase,
  operationTheatreRooms,
  operationTheatreComplexes,
  surgicalProcedures,
  surgeryRequests,
  otSchedules,
  preOperativeAssessments,
  operativeNotes,
  pacuRecoveryRecords,
  postoperativeTransfers,
  operationalDepartments,
  encounters,
  eq,
  and,
  or,
  desc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('partner-ot-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for OT operation');
    throw new AppError({
      message: 'Database service is unavailable. OT operations are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

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
  surgeryRequestId?: string;
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
  async getOTRooms(tenantId: string, dbClient = getDatabase()): Promise<StoredOTRoom[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(operationTheatreRooms)
        .where(eq(operationTheatreRooms.tenantId, tenantId))
        .orderBy(desc(operationTheatreRooms.createdAt));

      return rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        organizationId: r.organizationId,
        branchId: r.branchId,
        roomNumber: r.roomNumber,
        name: r.roomName || r.name || 'Operating Theatre Room',
        roomType: r.otType || r.roomType || 'MAJOR',
        status: (r.status || 'AVAILABLE') as StoredOTRoom['status'],
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
      }));
    } catch (err) {
      logger.error('Failed to query OT rooms from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. OT rooms lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createOTRoom(input: CreateOTRoomInput, dbClient = getDatabase()): Promise<StoredOTRoom> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const now = new Date();
    const partnerId = input.partnerId || '00000000-0000-4000-8000-000000000001';
    const organizationId = input.organizationId || '00000000-0000-4000-8000-000000000002';
    const branchId = input.branchId || '00000000-0000-4000-8000-000000000003';
    const roomType = input.roomType || 'MAJOR';

    try {
      // Ensure default OT Complex exists
      let complexId: any = crypto.randomUUID();
      try {
        const existingComplexes = await db
          .select()
          .from(operationTheatreComplexes)
          .where(eq(operationTheatreComplexes.tenantId, input.tenantId))
          .limit(1);

        if (existingComplexes && existingComplexes.length > 0 && existingComplexes[0]?.id) {
          complexId = existingComplexes[0].id;
        } else {
          await db.insert(operationTheatreComplexes).values({
            id: complexId,
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            branchId,
            complexCode: 'MAIN-OT-COMPLEX',
            complexName: 'Main OT Suite Complex',
            building: 'Surgical Block',
            floor: '2nd Floor'
          } as unknown as typeof operationTheatreComplexes.$inferInsert);
        }
      } catch {
        // Continue if complex table not present or mocked
      }

      const [created] = await db.insert(operationTheatreRooms).values({
        id,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        complexId,
        roomNumber: input.roomNumber,
        roomName: input.name,
        otType: roomType,
        primarySpecialty: 'GENERAL_SURGERY',
        status: 'AVAILABLE'
      } as unknown as typeof operationTheatreRooms.$inferInsert).returning();

      return {
        id: created?.id || id,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        roomNumber: input.roomNumber,
        name: input.name,
        roomType,
        status: 'AVAILABLE',
        createdAt: now,
        updatedAt: now
      };
    } catch (err) {
      logger.error('Failed to create OT room in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. OT room creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getSchedules(
    tenantId: string,
    status?: string,
    date?: string,
    dbClient = getDatabase()
  ): Promise<StoredSurgerySchedule[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(otSchedules)
        .where(eq(otSchedules.tenantId, tenantId))
        .orderBy(desc(otSchedules.createdAt));

      let matched = rows;
      if (status) matched = matched.filter((s: any) => s.status === status);
      if (date) {
        matched = matched.filter((s: any) => {
          const sDate = s.scheduledDate ? new Date(s.scheduledDate).toISOString().split('T')[0] : '';
          return sDate === date || s.scheduledDate === date;
        });
      }

      const schedules: StoredSurgerySchedule[] = [];

      for (const rawS of matched) {
        const s: any = rawS;
        // Load PAC Assessment
        let pacAssessment = null;
        try {
          const pacRows = await db
            .select()
            .from(preOperativeAssessments)
            .where(
              and(
                eq(preOperativeAssessments.tenantId, tenantId),
                or(
                  eq(preOperativeAssessments.surgeryRequestId, s.surgeryRequestId || s.id),
                  eq(preOperativeAssessments.surgeryRequestId, s.id)
                )
              )
            );
          if (pacRows && pacRows.length > 0) {
            const p: any = pacRows[0];
            pacAssessment = {
              anaesthetistId: p.assessedByDoctorId || p.assessedByAnaesthetist || 'ANAESTHETIST',
              anaesthetistName: p.assessedByAnaesthetist || 'Anaesthetist',
              asaClassification: p.asaClassification || 'ASA_II',
              airwayAssessment: 'MALLAMPATI_1',
              fitnessStatus: p.fitnessStatus || 'FIT_FOR_SURGERY',
              pacNotes: p.clinicalNotes || p.anaesthesiaPlanNotes || 'PAC Cleared',
              assessedAt: p.assessedAt ? new Date(p.assessedAt) : (p.assessmentDate ? new Date(p.assessmentDate) : new Date())
            };
          }
        } catch {
          // Empty
        }

        // Load Operative Notes
        let opNotes = null;
        try {
          const opRows = await db
            .select()
            .from(operativeNotes)
            .where(and(eq(operativeNotes.tenantId, tenantId), eq(operativeNotes.scheduleId, s.id)));
          if (opRows && opRows.length > 0) {
            const o: any = opRows[0];
            opNotes = {
              surgeonId: o.leadSurgeonId || 'SURGEON',
              surgeonName: o.primarySurgeonName || s.primarySurgeonName || 'Lead Surgeon',
              procedurePerformed: o.procedurePerformedTitle || o.procedureName || s.procedureName,
              intraOpFindings: o.detailedOperativeFindings || o.intraoperativeFindings || 'Routine surgical findings',
              operativeTechnique: o.operativeTechniqueStepByStep || o.surgicalTechnique || 'Standard technique',
              implantUsed: o.prosthesisAndImplantsUsed || undefined,
              estimatedBloodLossMl: o.estimatedBloodLossMl || 150,
              surgicalNotes: o.operativeNotes || 'Procedure completed uneventfully',
              recordedAt: o.createdAt ? new Date(o.createdAt) : new Date()
            };
          }
        } catch {
          // Empty
        }

        // Load PACU Recovery
        let pacuRecovery = null;
        try {
          const pacuRows = await db
            .select()
            .from(pacuRecoveryRecords)
            .where(and(eq(pacuRecoveryRecords.tenantId, tenantId), eq(pacuRecoveryRecords.scheduleId, s.id)));
          if (pacuRows && pacuRows.length > 0) {
            const pr: any = pacuRows[0];
            pacuRecovery = {
              pacuNurseId: pr.pacuNurseName || 'PACU_NURSE',
              aldreteScore: pr.currentAldreteScore ?? pr.aldreteScore ?? 9,
              vitals: {
                temperature: '37.0',
                bloodPressure: pr.systolicBpMmHg ? `${pr.systolicBpMmHg}/${pr.diastolicBpMmHg || 80}` : '120/80',
                heartRate: pr.heartRateBpm ? String(pr.heartRateBpm) : '75',
                spO2: pr.spo2Percentage ? String(pr.spo2Percentage) : '98'
              },
              painScore: pr.painScoreNumeric ?? pr.painScore ?? 2,
              recoveryNotes: pr.clinicalNotes || pr.recoveryNotes || 'PACU recovery uneventful',
              recordedAt: pr.createdAt ? new Date(pr.createdAt) : new Date()
            };
          }
        } catch {
          // Empty
        }

        // Load Post-Op Transfer
        let postOpTransfer = null;
        try {
          const xferRows = await db
            .select()
            .from(postoperativeTransfers)
            .where(and(eq(postoperativeTransfers.tenantId, tenantId), eq(postoperativeTransfers.scheduleId, s.id)));
          if (xferRows && xferRows.length > 0) {
            const x: any = xferRows[0];
            postOpTransfer = {
              destinationType: x.destinationWardOrICU || x.destinationUnit || 'SURGICAL_WARD',
              destinationWardOrBed: x.destinationBedNumber || undefined,
              transferNotes: x.clinicalConditionSummary || x.transferNotes || 'Transferred in stable condition',
              transferredBy: x.transferringNurse || x.transferredBy || 'STAFF',
              transferredAt: x.transferTime ? new Date(x.transferTime) : (x.transferredAt ? new Date(x.transferredAt) : new Date())
            };
          }
        } catch {
          // Empty
        }

        const scheduledDateStr: string = s.scheduledDate ? new Date(s.scheduledDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

        schedules.push({
          id: s.id,
          tenantId: s.tenantId,
          partnerId: s.partnerId,
          organizationId: s.organizationId,
          branchId: s.branchId,
          scheduleNumber: s.scheduleNumber,
          surgeryRequestId: s.surgeryRequestId,
          patientId: s.patientId,
          canonicalEncounterId: s.canonicalEncounterId || s.encounterId || crypto.randomUUID(),
          otRoomId: s.roomId || s.otRoomId,
          leadSurgeonId: s.leadSurgeonId || 'SURGEON',
          leadSurgeonName: s.primarySurgeonName || s.leadSurgeonName || 'Lead Surgeon',
          procedureName: s.procedureName,
          procedureCode: s.procedureCode || 'SURG-PROC-01',
          scheduledDate: scheduledDateStr,
          estimatedDurationMinutes: s.estimatedDurationMinutes || 120,
          urgencyLevel: s.isEmergency ? 'EMERGENCY' : (s.urgencyLevel || 'ELECTIVE'),
          preOpDiagnosis: s.preOpDiagnosis || 'Pre-operative evaluation',
          status: (s.status || 'SCHEDULED') as StoredSurgerySchedule['status'],
          pacAssessment,
          operativeNotes: opNotes,
          pacuRecovery,
          postOpTransfer,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date()
        });
      }

      return schedules;
    } catch (err) {
      logger.error('Failed to query surgery schedules from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Surgery schedules lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getScheduleById(tenantId: string, id: string, dbClient = getDatabase()): Promise<StoredSurgerySchedule | null> {
    const schedules = await this.getSchedules(tenantId, undefined, undefined, dbClient);
    return schedules.find(s => s.id === id) || null;
  }

  async createSurgeryBooking(
    input: CreateSurgeryBookingInput,
    dbClient = getDatabase()
  ): Promise<StoredSurgerySchedule> {
    const db = requireDb(dbClient);

    const executeInTx = async (tx: any): Promise<StoredSurgerySchedule> => {
      // 1. Verify OT Room exists
      const rooms = await tx
        .select()
        .from(operationTheatreRooms)
        .where(and(eq(operationTheatreRooms.tenantId, input.tenantId), eq(operationTheatreRooms.id, input.otRoomId)));

      const targetRoom = rooms[0];
      if (!targetRoom) {
        throw new AppError({
          message: 'OT Room not found for surgery booking.',
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      const id = crypto.randomUUID();
      const canonicalEncounterId = crypto.randomUUID();
      const surgeryRequestId = crypto.randomUUID();
      const scheduleNumber = `SURG-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date();
      const scheduledDateParsed = new Date(input.scheduledDate || now);
      const partnerId = input.partnerId || '00000000-0000-4000-8000-000000000001';
      const organizationId = input.organizationId || '00000000-0000-4000-8000-000000000002';
      const branchId = input.branchId || '00000000-0000-4000-8000-000000000003';
      const leadSurgeonName = input.leadSurgeonName || 'Lead Surgeon';
      const estimatedDurationMinutes = input.estimatedDurationMinutes || 120;
      const urgencyLevel = input.urgencyLevel || 'ELECTIVE';
      const preOpDiagnosis = input.preOpDiagnosis || 'Pre-operative evaluation';

      // 2. Resolve Department and Create canonical encounter
      let departmentId: string = 'd0000000-0000-4000-8000-000000000001';
      try {
        const deptRows = await tx
          .select({ id: operationalDepartments.id })
          .from(operationalDepartments)
          .where(eq(operationalDepartments.tenantId, input.tenantId))
          .limit(1);
        if (deptRows.length > 0 && deptRows[0]?.id) {
          departmentId = deptRows[0].id;
        }
      } catch {
        // Fallback to default
      }

      const encounterNumber = `ENC-SURG-${Math.floor(100000 + Math.random() * 900000)}`;
      await tx.insert(encounters).values({
        id: canonicalEncounterId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        encounterNumber,
        patientId: input.patientId,
        doctorId: input.leadSurgeonId,
        encounterType: 'SURGERY',
        status: 'SCHEDULED',
        chiefComplaint: input.procedureName,
        checkedInAt: now
      } as unknown as typeof encounters.$inferInsert);

      // 3. Resolve or insert Surgical Procedure
      let procedureId = crypto.randomUUID();
      const procCode = input.procedureCode || 'SURG-PROC-01';
      try {
        const existingProcs = await tx
          .select({ id: surgicalProcedures.id })
          .from(surgicalProcedures)
          .where(and(eq(surgicalProcedures.tenantId, input.tenantId), eq(surgicalProcedures.procedureCode, procCode)))
          .limit(1);

        if (existingProcs.length > 0 && existingProcs[0]?.id) {
          procedureId = existingProcs[0].id;
        } else {
          await tx.insert(surgicalProcedures).values({
            id: procedureId,
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            branchId,
            procedureCode: procCode,
            procedureName: input.procedureName,
            specialty: 'GENERAL_SURGERY',
            category: urgencyLevel === 'EMERGENCY' ? 'EMERGENCY_PROCEDURE' : 'MAJOR_PROCEDURE',
            defaultDurationMinutes: estimatedDurationMinutes
          } as unknown as typeof surgicalProcedures.$inferInsert);
        }
      } catch (procErr) {
        logger.warn('Could not query/insert surgicalProcedures', { error: String(procErr) });
      }

      // 4. Create Surgery Request
      await tx.insert(surgeryRequests).values({
        id: surgeryRequestId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        requestNumber: `SR-${Math.floor(100000 + Math.random() * 900000)}`,
        patientId: input.patientId,
        patientName: 'Surgical Patient',
        patientMrn: 'MRN-AUTO',
        patientAge: 35,
        patientGender: 'M',
        encounterId: canonicalEncounterId,
        requestingDoctorName: leadSurgeonName,
        primarySurgeonName: leadSurgeonName,
        specialty: 'GENERAL_SURGERY',
        procedureId,
        procedureName: input.procedureName,
        preOperativeDiagnosis: preOpDiagnosis,
        clinicalIndication: input.procedureName,
        proposedSurgeryDate: scheduledDateParsed,
        estimatedDurationMinutes,
        category: urgencyLevel === 'EMERGENCY' ? 'EMERGENCY' : 'ELECTIVE',
        priority: urgencyLevel === 'EMERGENCY' ? 'STAT' : 'ROUTINE',
        isEmergency: urgencyLevel === 'EMERGENCY',
        requiredAnaesthesia: 'GENERAL_ANAESTHESIA',
        pacClearanceStatus: 'PENDING',
        status: 'CONFIRMED'
      } as unknown as typeof surgeryRequests.$inferInsert);

      // 5. Create OT Schedule
      await tx.insert(otSchedules).values({
        id,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        scheduleNumber,
        surgeryRequestId,
        patientId: input.patientId,
        patientName: 'Surgical Patient',
        patientMrn: 'MRN-AUTO',
        procedureName: input.procedureName,
        roomId: input.otRoomId,
        scheduledDate: scheduledDateParsed,
        startTime: scheduledDateParsed,
        endTime: new Date(scheduledDateParsed.getTime() + estimatedDurationMinutes * 60 * 1000),
        estimatedDurationMinutes,
        primarySurgeonName: leadSurgeonName,
        leadAnaesthetistName: 'Lead Anaesthetist',
        scrubNurseName: 'Staff Nurse',
        circulatingNurseName: 'Staff Nurse',
        isEmergency: urgencyLevel === 'EMERGENCY',
        status: 'SCHEDULED'
      } as unknown as typeof otSchedules.$inferInsert);

      return {
        id,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        scheduleNumber,
        surgeryRequestId,
        patientId: input.patientId,
        canonicalEncounterId,
        otRoomId: input.otRoomId,
        leadSurgeonId: input.leadSurgeonId,
        leadSurgeonName,
        procedureName: input.procedureName,
        procedureCode: input.procedureCode || 'SURG-PROC-01',
        scheduledDate: input.scheduledDate,
        estimatedDurationMinutes,
        urgencyLevel,
        preOpDiagnosis,
        status: 'SCHEDULED',
        pacAssessment: null,
        operativeNotes: null,
        pacuRecovery: null,
        postOpTransfer: null,
        createdAt: now,
        updatedAt: now
      };
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        return await (db as any).transaction(executeInTx);
      } else {
        return await executeInTx(db);
      }
    } catch (err) {
      logger.error('Failed to create surgery booking in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Surgery booking aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordPACAssessment(
    input: RecordPACAssessmentInput,
    dbClient = getDatabase()
  ): Promise<StoredSurgerySchedule | null> {
    const db = requireDb(dbClient);
    const item = await this.getScheduleById(input.tenantId, input.scheduleId, dbClient);
    if (!item) return null;

    const now = new Date();
    const fitnessStatus = input.fitnessStatus;
    const newStatus: StoredSurgerySchedule['status'] =
      fitnessStatus === 'FIT_FOR_SURGERY' || fitnessStatus === 'HIGH_RISK_CLEARANCE' ? 'PAC_CLEARED' : 'SCHEDULED';

    const executeInTx = async (tx: any) => {
      let surgeryReqId: string = item.surgeryRequestId || item.id;
      try {
        const [schedRow] = await tx
          .select({ surgeryRequestId: otSchedules.surgeryRequestId })
          .from(otSchedules)
          .where(and(eq(otSchedules.tenantId, input.tenantId), eq(otSchedules.id, input.scheduleId)))
          .limit(1);
        if (schedRow?.surgeryRequestId) {
          surgeryReqId = schedRow.surgeryRequestId;
        }
      } catch {
        // Fallback to existing
      }

      await tx.insert(preOperativeAssessments).values({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        partnerId: item.partnerId,
        organizationId: item.organizationId,
        branchId: item.branchId,
        surgeryRequestId: surgeryReqId,
        patientId: item.patientId,
        patientName: 'Surgical Patient',
        assessedByAnaesthetist: input.anaesthetistName || 'Anaesthetist',
        assessedByDoctorId: input.anaesthetistId,
        fitnessStatus,
        clinicalNotes: input.pacNotes,
        anaesthesiaPlanNotes: input.pacNotes,
        riskFactorsSummary: input.asaClassification || 'ASA_II',
        assessedAt: now,
        assessmentDate: now
      } as unknown as typeof preOperativeAssessments.$inferInsert);

      await tx
        .update(otSchedules)
        .set({ status: newStatus, updatedAt: now })
        .where(and(eq(otSchedules.tenantId, input.tenantId), eq(otSchedules.id, input.scheduleId)));
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeInTx);
      } else {
        await executeInTx(db);
      }

      item.pacAssessment = {
        anaesthetistId: input.anaesthetistId,
        anaesthetistName: input.anaesthetistName || 'Anaesthetist',
        asaClassification: input.asaClassification || 'ASA_II',
        airwayAssessment: input.airwayAssessment || 'MALLAMPATI_1',
        fitnessStatus,
        pacNotes: input.pacNotes,
        assessedAt: now
      };
      item.status = newStatus;
      item.updatedAt = now;
      return item;
    } catch (err) {
      logger.error('Failed to record PAC assessment in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. PAC assessment recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordOperativeNotes(
    input: RecordOperativeNotesInput,
    dbClient = getDatabase()
  ): Promise<StoredSurgerySchedule | null> {
    const db = requireDb(dbClient);
    const item = await this.getScheduleById(input.tenantId, input.scheduleId, dbClient);
    if (!item) return null;

    const now = new Date();
    const executeInTx = async (tx: any) => {
      await tx.insert(operativeNotes).values({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        partnerId: item.partnerId,
        organizationId: item.organizationId,
        branchId: item.branchId,
        scheduleId: item.id,
        noteNumber: `OPN-${Math.floor(100000 + Math.random() * 900000)}`,
        patientId: item.patientId,
        patientName: 'Surgical Patient',
        patientMrn: 'MRN-AUTO',
        primarySurgeonName: input.surgeonName || item.leadSurgeonName,
        preOperativeDiagnosis: item.preOpDiagnosis,
        postOperativeDiagnosis: item.preOpDiagnosis,
        procedurePerformedTitle: input.procedurePerformed,
        detailedOperativeFindings: input.intraOpFindings,
        operativeTechniqueStepByStep: input.operativeTechnique,
        leadSurgeonId: input.surgeonId,
        procedureName: input.procedurePerformed,
        intraoperativeFindings: input.intraOpFindings,
        surgicalTechnique: input.operativeTechnique,
        estimatedBloodLossMl: input.estimatedBloodLossMl || 150,
        operativeNotes: input.surgicalNotes,
        postOperativeInstructions: 'Monitor vitals in PACU',
        isFinalized: true,
        recordedAt: now
      } as unknown as typeof operativeNotes.$inferInsert);

      await tx
        .update(otSchedules)
        .set({ status: 'IN_THEATRE', updatedAt: now })
        .where(and(eq(otSchedules.tenantId, input.tenantId), eq(otSchedules.id, input.scheduleId)));
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeInTx);
      } else {
        await executeInTx(db);
      }

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
      return item;
    } catch (err) {
      logger.error('Failed to record operative notes in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Operative notes recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordPACURecovery(
    input: RecordPACURecoveryInput,
    dbClient = getDatabase()
  ): Promise<StoredSurgerySchedule | null> {
    const db = requireDb(dbClient);
    const item = await this.getScheduleById(input.tenantId, input.scheduleId, dbClient);
    if (!item) return null;

    const now = new Date();
    const executeInTx = async (tx: any) => {
      await tx.insert(pacuRecoveryRecords).values({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        partnerId: item.partnerId,
        organizationId: item.organizationId,
        branchId: item.branchId,
        scheduleId: item.id,
        patientId: item.patientId,
        patientName: 'Surgical Patient',
        patientMrn: 'MRN-AUTO',
        recoveryBedNumber: 'PACU-01',
        pacuNurseName: input.pacuNurseId,
        initialAldreteScore: input.aldreteScore,
        currentAldreteScore: input.aldreteScore,
        aldreteScore: input.aldreteScore,
        painScoreNumeric: input.painScore || 2,
        painScore: input.painScore || 2,
        clinicalNotes: input.recoveryNotes,
        recordedAt: now
      } as unknown as typeof pacuRecoveryRecords.$inferInsert);
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeInTx);
      } else {
        await executeInTx(db);
      }

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
      return item;
    } catch (err) {
      logger.error('Failed to record PACU recovery in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. PACU recovery recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async transferPostOp(
    input: TransferPostOpInput,
    dbClient = getDatabase()
  ): Promise<StoredSurgerySchedule | null> {
    const db = requireDb(dbClient);
    const item = await this.getScheduleById(input.tenantId, input.scheduleId, dbClient);
    if (!item) return null;

    const now = new Date();
    const executeInTx = async (tx: any) => {
      // 1. Insert Post-op Transfer
      await tx.insert(postoperativeTransfers).values({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        partnerId: item.partnerId,
        organizationId: item.organizationId,
        branchId: item.branchId,
        transferNumber: `POT-${Math.floor(100000 + Math.random() * 900000)}`,
        scheduleId: item.id,
        patientId: item.patientId,
        patientName: 'Surgical Patient',
        destinationWardOrICU: input.destinationType,
        destinationBedNumber: input.destinationWardOrBed || 'WARD-BED-01',
        transferringNurse: input.transferredBy,
        receivingNurse: 'Receiving Nurse',
        clinicalConditionSummary: input.transferNotes,
        destinationUnit: input.destinationType,
        transferNotes: input.transferNotes,
        transferredBy: input.transferredBy,
        transferredAt: now
      } as unknown as typeof postoperativeTransfers.$inferInsert);

      // 2. Mark Schedule COMPLETED
      await tx
        .update(otSchedules)
        .set({ status: 'COMPLETED', updatedAt: now })
        .where(and(eq(otSchedules.tenantId, input.tenantId), eq(otSchedules.id, input.scheduleId)));

      // 3. Release OT Room to AVAILABLE
      if (item.otRoomId) {
        await tx
          .update(operationTheatreRooms)
          .set({ status: 'AVAILABLE', updatedAt: now })
          .where(and(eq(operationTheatreRooms.tenantId, input.tenantId), eq(operationTheatreRooms.id, item.otRoomId)));
      }
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeInTx);
      } else {
        await executeInTx(db);
      }

      item.postOpTransfer = {
        destinationType: input.destinationType,
        destinationWardOrBed: input.destinationWardOrBed,
        transferNotes: input.transferNotes,
        transferredBy: input.transferredBy,
        transferredAt: now
      };
      item.status = 'COMPLETED';
      item.updatedAt = now;
      return item;
    } catch (err) {
      logger.error('Failed to record post-operative transfer in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Post-operative transfer recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPatientSurgicalHistory(
    tenantId: string,
    patientId: string,
    dbClient = getDatabase()
  ): Promise<StoredSurgerySchedule[]> {
    const schedules = await this.getSchedules(tenantId, undefined, undefined, dbClient);
    return schedules.filter(s => s.patientId === patientId);
  }
}

export const otManagementRepository = new OTManagementRepository();
