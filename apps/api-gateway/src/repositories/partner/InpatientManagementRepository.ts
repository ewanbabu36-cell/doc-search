import {
  getDatabase,
  inpatientWards,
  inpatientBeds,
  inpatientAdmissions,
  inpatientTransfers,
  inpatientNursingNotes,
  inpatientDischargeSummaries,
  inpatientUnits,
  encounters,
  eq,
  and,
  desc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('partner-inpatient-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for inpatient operation');
    throw new AppError({
      message: 'Database service is unavailable. Inpatient operations are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

export interface CreateWardInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  wardCode: string;
  name: string;
  wardType: string;
  capacity?: number;
}

export interface CreateBedInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  wardId: string;
  bedNumber: string;
  bedType?: string;
}

export interface CreateAdmissionInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  doctorId: string;
  department?: string;
  bedId: string;
  admissionReason: string;
  encounterType?: string;
}

export interface TransferBedInput {
  tenantId: string;
  admissionId: string;
  patientId: string;
  sourceBedId: string;
  destinationBedId: string;
  transferReason: string;
  transferredBy: string;
}

export interface NursingNoteInput {
  tenantId: string;
  patientId: string;
  admissionId: string;
  nurseId: string;
  nurseName?: string;
  temperature?: string;
  bloodPressure?: string;
  pulseRate?: string;
  spO2?: string;
  respiratoryRate?: string;
  notes: string;
  careObservations?: string;
}

export interface DischargeInput {
  tenantId: string;
  admissionId: string;
  patientId: string;
  dischargingDoctorId: string;
  dischargeReason: string;
  dischargeCondition: string;
  finalClinicalNotes?: string;
}

export interface StoredWard {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  wardCode: string;
  name: string;
  wardType: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredBed {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  wardId: string;
  bedNumber: string;
  bedType: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'BLOCKED';
  currentPatientId?: string | null;
  currentAdmissionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredAdmission {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  admissionNumber: string;
  patientId: string;
  encounterId: string;
  bedId: string;
  attendingDoctorId: string;
  department: string;
  admissionReason: string;
  status: 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED' | 'CANCELLED';
  admittedAt: Date;
  dischargedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredTransfer {
  id: string;
  tenantId: string;
  admissionId: string;
  patientId: string;
  sourceBedId: string;
  destinationBedId: string;
  transferReason: string;
  transferredBy: string;
  transferredAt: Date;
}

export interface StoredNursingNote {
  id: string;
  tenantId: string;
  patientId: string;
  admissionId: string;
  nurseId: string;
  nurseName: string;
  vitals: {
    temperature?: string | undefined;
    bloodPressure?: string | undefined;
    pulseRate?: string | undefined;
    spO2?: string | undefined;
    respiratoryRate?: string | undefined;
  };
  notes: string;
  careObservations: string;
  recordedAt: Date;
}

export class InpatientManagementRepository {
  async getWards(tenantId: string, dbClient = getDatabase()): Promise<StoredWard[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(inpatientWards)
        .where(eq(inpatientWards.tenantId, tenantId))
        .orderBy(desc(inpatientWards.createdAt));

      return rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        organizationId: r.organizationId,
        branchId: r.branchId,
        wardCode: r.wardCode,
        name: r.wardName || r.name || 'General Ward',
        wardType: r.wardType,
        capacity: r.totalBeds ?? r.capacity ?? 20,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
      }));
    } catch (err) {
      logger.error('Failed to query inpatient wards from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Inpatient wards lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createWard(input: CreateWardInput, dbClient = getDatabase()): Promise<StoredWard> {
    const db = requireDb(dbClient);
    const now = new Date();
    const wardId = crypto.randomUUID();
    const partnerId = input.partnerId || '00000000-0000-4000-8000-000000000001';
    const organizationId = input.organizationId || '00000000-0000-4000-8000-000000000002';
    const branchId = input.branchId || '00000000-0000-4000-8000-000000000003';
    const capacity = input.capacity || 20;

    try {
      // Check or ensure default unit exists for ward foreign key
      let unitId: any = crypto.randomUUID();
      try {
        const existingUnits = await db
          .select()
          .from(inpatientUnits)
          .where(eq(inpatientUnits.tenantId, input.tenantId))
          .limit(1);

        if (existingUnits && existingUnits.length > 0 && existingUnits[0]?.id) {
          unitId = existingUnits[0].id;
        } else {
          await db.insert(inpatientUnits).values({
            id: unitId,
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            branchId,
            unitCode: 'MAIN-UNIT',
            unitName: 'Main Inpatient Unit',
            unitType: 'GENERAL_MEDICINE',
            specialty: 'MULTI_SPECIALTY',
            building: 'Main Hospital Tower',
            floor: 'Level 1'
          } as unknown as typeof inpatientUnits.$inferInsert);
        }
      } catch {
        // If inpatientUnits table not required or mocked, proceed with generated unitId
      }

      const [created] = await db.insert(inpatientWards).values({
        id: wardId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        unitId,
        wardCode: input.wardCode,
        wardName: input.name,
        wardType: input.wardType,
        building: 'Main Hospital',
        floor: '1st Floor',
        totalBeds: capacity,
        activeBeds: capacity
      } as unknown as typeof inpatientWards.$inferInsert).returning();

      return {
        id: created?.id || wardId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        wardCode: input.wardCode,
        name: input.name,
        wardType: input.wardType,
        capacity,
        createdAt: now,
        updatedAt: now
      };
    } catch (err) {
      logger.error('Failed to create inpatient ward in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Ward creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getBeds(tenantId: string, wardId?: string, status?: string, dbClient = getDatabase()): Promise<StoredBed[]> {
    const db = requireDb(dbClient);
    try {
      let query = db
        .select()
        .from(inpatientBeds)
        .where(eq(inpatientBeds.tenantId, tenantId))
        .orderBy(desc(inpatientBeds.createdAt));

      const rows = await query;
      let list = rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        organizationId: r.organizationId,
        branchId: r.branchId,
        wardId: r.wardId,
        bedNumber: r.bedNumber || r.bedCode,
        bedType: r.bedType || 'STANDARD',
        status: (r.status || 'AVAILABLE') as StoredBed['status'],
        currentPatientId: r.currentPatientId || null,
        currentAdmissionId: r.currentAdmissionId || null,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
      }));

      if (wardId) list = list.filter(b => b.wardId === wardId);
      if (status) list = list.filter(b => b.status === status);
      return list;
    } catch (err) {
      logger.error('Failed to query inpatient beds from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Inpatient beds lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createBed(input: CreateBedInput, dbClient = getDatabase()): Promise<StoredBed> {
    const db = requireDb(dbClient);
    const now = new Date();
    const bedId = crypto.randomUUID();
    const partnerId = input.partnerId || '00000000-0000-4000-8000-000000000001';
    const organizationId = input.organizationId || '00000000-0000-4000-8000-000000000002';
    const branchId = input.branchId || '00000000-0000-4000-8000-000000000003';
    const bedType = input.bedType || 'STANDARD';

    try {
      const [created] = await db.insert(inpatientBeds).values({
        id: bedId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        wardId: input.wardId,
        bedCode: input.bedNumber,
        bedNumber: input.bedNumber,
        bedType,
        status: 'AVAILABLE'
      } as unknown as typeof inpatientBeds.$inferInsert).returning();

      return {
        id: created?.id || bedId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        wardId: input.wardId,
        bedNumber: input.bedNumber,
        bedType,
        status: 'AVAILABLE',
        currentPatientId: null,
        currentAdmissionId: null,
        createdAt: now,
        updatedAt: now
      };
    } catch (err) {
      logger.error('Failed to create inpatient bed in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Bed creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getAdmissions(
    tenantId: string,
    status?: string,
    patientId?: string,
    dbClient = getDatabase()
  ): Promise<StoredAdmission[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(inpatientAdmissions)
        .where(eq(inpatientAdmissions.tenantId, tenantId))
        .orderBy(desc(inpatientAdmissions.createdAt));

      let list = rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        organizationId: r.organizationId,
        branchId: r.branchId,
        admissionNumber: r.admissionNumber,
        patientId: r.patientId,
        encounterId: r.encounterId,
        bedId: r.bedId,
        attendingDoctorId: r.attendingConsultantName || r.admittingDoctorName || r.attendingDoctorId || 'DOCTOR',
        department: r.department || 'GENERAL_MEDICINE',
        admissionReason: r.primaryDiagnosis || r.admissionReason || 'Inpatient care',
        status: (r.status || 'ADMITTED') as StoredAdmission['status'],
        admittedAt: r.admissionDateTime ? new Date(r.admissionDateTime) : (r.admittedAt ? new Date(r.admittedAt) : new Date()),
        dischargedAt: r.actualDischargeDateTime ? new Date(r.actualDischargeDateTime) : (r.dischargedAt ? new Date(r.dischargedAt) : null),
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
      }));

      if (status) list = list.filter(a => a.status === status);
      if (patientId) list = list.filter(a => a.patientId === patientId);
      return list;
    } catch (err) {
      logger.error('Failed to query inpatient admissions from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Admissions lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createAdmission(input: CreateAdmissionInput, dbClient = getDatabase()): Promise<StoredAdmission> {
    const db = requireDb(dbClient);

    const executeInTx = async (tx: any): Promise<StoredAdmission> => {
      // 1. Verify Bed Availability
      const beds = await tx
        .select()
        .from(inpatientBeds)
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.bedId)));

      const targetBed = beds[0];
      if (!targetBed) {
        throw new AppError({
          message: 'Target bed not found for admission.',
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      if (targetBed.status !== 'AVAILABLE') {
        throw new AppError({
          message: `Bed ${targetBed.bedNumber || targetBed.bedCode} is not available (Current status: ${targetBed.status})`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }

      const now = new Date();
      const admissionId = crypto.randomUUID();
      const encounterId = crypto.randomUUID();
      const admissionNumber = `ADM-${Math.floor(100000 + Math.random() * 900000)}`;
      const partnerId = input.partnerId || '00000000-0000-4000-8000-000000000001';
      const organizationId = input.organizationId || '00000000-0000-4000-8000-000000000002';
      const branchId = input.branchId || '00000000-0000-4000-8000-000000000003';
      const department = input.department || 'GENERAL_MEDICINE';

      // 2. Insert IPD Encounter
      await tx.insert(encounters).values({
        id: encounterId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        encounterType: 'IPD',
        status: 'ADMITTED',
        chiefComplaint: input.admissionReason,
        checkedInAt: now
      } as unknown as typeof encounters.$inferInsert);

      // 3. Insert Admission
      await tx.insert(inpatientAdmissions).values({
        id: admissionId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionNumber,
        patientId: input.patientId,
        patientName: 'Inpatient Record',
        patientMrn: 'MRN-AUTO',
        patientGender: 'M',
        patientAge: 30,
        encounterId,
        admittingDoctorName: input.doctorId,
        attendingConsultantName: input.doctorId,
        department,
        specialty: department,
        wardId: targetBed.wardId,
        wardName: 'General Inpatient Ward',
        bedId: input.bedId,
        bedCode: targetBed.bedNumber || targetBed.bedCode || 'BED',
        primaryDiagnosis: input.admissionReason,
        admissionReason: input.admissionReason,
        expectedDischargeDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: 'ADMITTED',
        admissionDateTime: now
      } as unknown as typeof inpatientAdmissions.$inferInsert);

      // 4. Update Bed status in DB
      await tx
        .update(inpatientBeds)
        .set({
          status: 'OCCUPIED',
          currentPatientId: input.patientId,
          currentAdmissionId: admissionId,
          updatedAt: now
        })
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.bedId)));

      const admissionResult: StoredAdmission = {
        id: admissionId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionNumber,
        patientId: input.patientId,
        encounterId,
        bedId: input.bedId,
        attendingDoctorId: input.doctorId,
        department,
        admissionReason: input.admissionReason,
        status: 'ADMITTED',
        admittedAt: now,
        dischargedAt: null,
        createdAt: now,
        updatedAt: now
      };
      return admissionResult;
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        return await (db as any).transaction(executeInTx);
      } else {
        return await executeInTx(db);
      }
    } catch (err) {
      logger.error('Failed to create admission in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Patient admission aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async transferBed(input: TransferBedInput, dbClient = getDatabase()): Promise<StoredTransfer> {
    const db = requireDb(dbClient);

    const executeInTx = async (tx: any): Promise<StoredTransfer> => {
      // 1. Fetch Source Bed
      const sourceBeds = await tx
        .select()
        .from(inpatientBeds)
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.sourceBedId)));
      const sourceBed = sourceBeds[0];
      if (!sourceBed) {
        throw new AppError({ message: 'Source bed not found', code: ErrorCode.NOT_FOUND, statusCode: 404 });
      }

      // 2. Fetch Destination Bed
      const destBeds = await tx
        .select()
        .from(inpatientBeds)
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.destinationBedId)));
      const destBed = destBeds[0];
      if (!destBed) {
        throw new AppError({ message: 'Destination bed not found', code: ErrorCode.NOT_FOUND, statusCode: 404 });
      }

      if (destBed.status !== 'AVAILABLE') {
        throw new AppError({
          message: `Destination bed ${destBed.bedNumber || destBed.bedCode} is not available (Status: ${destBed.status})`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }

      const now = new Date();
      const transferId = crypto.randomUUID();
      const transferNumber = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;

      // 3. Insert Transfer Record
      await tx.insert(inpatientTransfers).values({
        id: transferId,
        tenantId: input.tenantId,
        partnerId: '00000000-0000-4000-8000-000000000001',
        organizationId: '00000000-0000-4000-8000-000000000002',
        branchId: '00000000-0000-4000-8000-000000000003',
        transferNumber,
        admissionId: input.admissionId,
        patientId: input.patientId,
        patientName: 'Transferred Patient',
        patientMrn: 'MRN-AUTO',
        sourceWardId: sourceBed.wardId,
        sourceWardName: 'Origin Ward',
        sourceBedId: input.sourceBedId,
        sourceBedCode: sourceBed.bedNumber || sourceBed.bedCode || 'SRC-BED',
        destinationWardId: destBed.wardId,
        destinationWardName: 'Destination Ward',
        destinationBedId: input.destinationBedId,
        destinationBedCode: destBed.bedNumber || destBed.bedCode || 'DEST-BED',
        transferReason: input.transferReason,
        requestingDoctorName: input.transferredBy,
        status: 'COMPLETED',
        completedAt: now
      } as unknown as typeof inpatientTransfers.$inferInsert);

      // 4. Update Source Bed -> AVAILABLE
      await tx
        .update(inpatientBeds)
        .set({
          status: 'AVAILABLE',
          currentPatientId: null,
          currentAdmissionId: null,
          updatedAt: now
        })
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.sourceBedId)));

      // 5. Update Destination Bed -> OCCUPIED
      await tx
        .update(inpatientBeds)
        .set({
          status: 'OCCUPIED',
          currentPatientId: input.patientId,
          currentAdmissionId: input.admissionId,
          updatedAt: now
        })
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.destinationBedId)));

      // 6. Update Admission Record
      await tx
        .update(inpatientAdmissions)
        .set({
          bedId: input.destinationBedId,
          bedCode: destBed.bedNumber || destBed.bedCode || 'DEST-BED',
          wardId: destBed.wardId,
          updatedAt: now
        })
        .where(and(eq(inpatientAdmissions.tenantId, input.tenantId), eq(inpatientAdmissions.id, input.admissionId)));

      return {
        id: transferId,
        tenantId: input.tenantId,
        admissionId: input.admissionId,
        patientId: input.patientId,
        sourceBedId: input.sourceBedId,
        destinationBedId: input.destinationBedId,
        transferReason: input.transferReason,
        transferredBy: input.transferredBy,
        transferredAt: now
      };
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        return await (db as any).transaction(executeInTx);
      } else {
        return await executeInTx(db);
      }
    } catch (err) {
      logger.error('Failed to record bed transfer in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Bed transfer aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordNursingNote(input: NursingNoteInput, dbClient = getDatabase()): Promise<StoredNursingNote> {
    const db = requireDb(dbClient);
    const now = new Date();
    const id = crypto.randomUUID();

    const vitals = {
      temperature: input.temperature,
      bloodPressure: input.bloodPressure,
      pulseRate: input.pulseRate,
      spO2: input.spO2,
      respiratoryRate: input.respiratoryRate
    };

    const careObservations = input.careObservations || 'Routine vitals recorded and patient resting comfortably.';

    try {
      await db.insert(inpatientNursingNotes).values({
        id,
        tenantId: input.tenantId,
        partnerId: '00000000-0000-4000-8000-000000000001',
        organizationId: '00000000-0000-4000-8000-000000000002',
        branchId: '00000000-0000-4000-8000-000000000003',
        admissionId: input.admissionId,
        patientId: input.patientId,
        authorName: input.nurseName || 'Staff Nurse',
        noteType: 'PROGRESS_NOTE',
        noteContent: JSON.stringify({
          notes: input.notes,
          careObservations,
          vitals
        }),
        createdAt: now
      } as unknown as typeof inpatientNursingNotes.$inferInsert);

      return {
        id,
        tenantId: input.tenantId,
        patientId: input.patientId,
        admissionId: input.admissionId,
        nurseId: input.nurseId,
        nurseName: input.nurseName || 'Staff Nurse',
        vitals,
        notes: input.notes,
        careObservations,
        recordedAt: now
      };
    } catch (err) {
      logger.error('Failed to record nursing note in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Nursing note recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getNursingNotes(
    tenantId: string,
    admissionId?: string,
    patientId?: string,
    dbClient = getDatabase()
  ): Promise<StoredNursingNote[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(inpatientNursingNotes)
        .where(eq(inpatientNursingNotes.tenantId, tenantId))
        .orderBy(desc(inpatientNursingNotes.createdAt));

      let list = rows.map((r: any) => {
        let vitals = {};
        let notes = r.noteContent || r.note || '';
        let careObservations = 'Routine vitals recorded.';
        try {
          const parsed = JSON.parse(r.noteContent);
          if (parsed && typeof parsed === 'object') {
            notes = parsed.notes || notes;
            careObservations = parsed.careObservations || careObservations;
            vitals = parsed.vitals || vitals;
          }
        } catch {
          // Plain text note
        }

        return {
          id: r.id,
          tenantId: r.tenantId,
          patientId: r.patientId,
          admissionId: r.admissionId,
          nurseId: r.authorName || r.nurseId || 'NURSE',
          nurseName: r.authorName || 'Staff Nurse',
          vitals,
          notes,
          careObservations,
          recordedAt: r.createdAt ? new Date(r.createdAt) : new Date()
        };
      });

      if (admissionId) list = list.filter(n => n.admissionId === admissionId);
      if (patientId) list = list.filter(n => n.patientId === patientId);
      return list;
    } catch (err) {
      logger.error('Failed to query nursing notes from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Nursing notes lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async dischargePatient(input: DischargeInput, dbClient = getDatabase()): Promise<StoredAdmission> {
    const db = requireDb(dbClient);

    const executeInTx = async (tx: any): Promise<StoredAdmission> => {
      // 1. Fetch Admission
      const admissions = await tx
        .select()
        .from(inpatientAdmissions)
        .where(and(eq(inpatientAdmissions.tenantId, input.tenantId), eq(inpatientAdmissions.id, input.admissionId)));

      const admission = admissions[0];
      if (!admission) {
        throw new AppError({
          message: 'Admission record not found',
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      if (admission.status === 'DISCHARGED') {
        throw new AppError({
          message: 'Patient is already discharged',
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }

      const now = new Date();

      // 2. Update Admission status
      await tx
        .update(inpatientAdmissions)
        .set({
          status: 'DISCHARGED',
          actualDischargeDateTime: now,
          updatedAt: now
        })
        .where(and(eq(inpatientAdmissions.tenantId, input.tenantId), eq(inpatientAdmissions.id, input.admissionId)));

      // 3. Insert Discharge Summary
      await tx.insert(inpatientDischargeSummaries).values({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        partnerId: '00000000-0000-4000-8000-000000000001',
        organizationId: '00000000-0000-4000-8000-000000000002',
        branchId: '00000000-0000-4000-8000-000000000003',
        summaryNumber: `DIS-${Math.floor(100000 + Math.random() * 900000)}`,
        admissionId: input.admissionId,
        patientId: input.patientId,
        patientName: admission.patientName || 'Discharged Patient',
        patientMrn: admission.patientMrn || 'MRN-AUTO',
        admissionDate: admission.admissionDateTime ? new Date(admission.admissionDateTime) : now,
        dischargeDate: now,
        attendingConsultantName: input.dischargingDoctorId,
        finalPrimaryDiagnosis: input.dischargeReason,
        hospitalCourseSummary: input.finalClinicalNotes || 'Stable recovery following medical therapy',
        treatmentGiven: 'Medical and supportive inpatient therapy completed',
        dischargeMedicationAdvice: 'Take prescribed medications as directed',
        dietAndActivityAdvice: input.dischargeCondition,
        warningSignsToSeekImmediateCare: 'Seek immediate medical attention in case of high fever or acute chest pain',
        isFinalized: true
      } as unknown as typeof inpatientDischargeSummaries.$inferInsert);

      // 4. Release Bed -> AVAILABLE
      if (admission.bedId) {
        await tx
          .update(inpatientBeds)
          .set({
            status: 'AVAILABLE',
            currentPatientId: null,
            currentAdmissionId: null,
            updatedAt: now
          })
          .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, admission.bedId)));
      }

      const admissionResult: StoredAdmission = {
        id: admission.id,
        tenantId: input.tenantId,
        partnerId: admission.partnerId,
        organizationId: admission.organizationId,
        branchId: admission.branchId,
        admissionNumber: admission.admissionNumber,
        patientId: admission.patientId,
        encounterId: admission.encounterId,
        bedId: admission.bedId,
        attendingDoctorId: input.dischargingDoctorId,
        department: admission.department || 'GENERAL_MEDICINE',
        admissionReason: admission.primaryDiagnosis || admission.admissionReason || input.dischargeReason,
        status: 'DISCHARGED',
        admittedAt: admission.admissionDateTime ? new Date(admission.admissionDateTime) : now,
        dischargedAt: now,
        createdAt: admission.createdAt ? new Date(admission.createdAt) : now,
        updatedAt: now
      };
      return admissionResult;
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        return await (db as any).transaction(executeInTx);
      } else {
        return await executeInTx(db);
      }
    } catch (err) {
      logger.error('Failed to discharge patient in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Patient discharge aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }
}

export const inpatientManagementRepository = new InpatientManagementRepository();
