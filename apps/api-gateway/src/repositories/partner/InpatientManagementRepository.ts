import {
  getDatabase,
  inpatientWards,
  inpatientBeds,
  inpatientAdmissions,
  inpatientTransfers,
  inpatientNursingNotes,
  inpatientDischargeSummaries,
  encounters,
  eq,
  and,
  desc
} from '@docsearch/database';

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
  private memWards = new Map<string, StoredWard[]>();
  private memBeds = new Map<string, StoredBed[]>();
  private memAdmissions = new Map<string, StoredAdmission[]>();
  private memTransfers = new Map<string, StoredTransfer[]>();
  private memNursing = new Map<string, StoredNursingNote[]>();

  async getWards(tenantId: string, dbClient = getDatabase()): Promise<StoredWard[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(inpatientWards)
          .where(eq(inpatientWards.tenantId, tenantId))
          .orderBy(desc(inpatientWards.createdAt));
        if (rows.length > 0) return rows as unknown as StoredWard[];
      } catch {
        // Fallback
      }
    }
    return this.memWards.get(tenantId) || [];
  }

  async createWard(input: CreateWardInput, dbClient = getDatabase()): Promise<StoredWard> {
    const id = crypto.randomUUID();
    const record: StoredWard = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      wardCode: input.wardCode,
      name: input.name,
      wardType: input.wardType,
      capacity: input.capacity || 20,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(inpatientWards).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          wardCode: record.wardCode,
          name: record.name,
          wardType: record.wardType,
          totalBeds: record.capacity
        } as unknown as typeof inpatientWards.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memWards.get(input.tenantId) || [];
    current.unshift(record);
    this.memWards.set(input.tenantId, current);
    return record;
  }

  async getBeds(tenantId: string, wardId?: string, status?: string, dbClient = getDatabase()): Promise<StoredBed[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(inpatientBeds)
          .where(eq(inpatientBeds.tenantId, tenantId))
          .orderBy(desc(inpatientBeds.createdAt));
        if (rows.length > 0) {
          let list = rows as unknown as StoredBed[];
          if (wardId) list = list.filter(b => b.wardId === wardId);
          if (status) list = list.filter(b => b.status === status);
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memBeds.get(tenantId) || [];
    if (wardId) list = list.filter(b => b.wardId === wardId);
    if (status) list = list.filter(b => b.status === status);
    return list;
  }

  async createBed(input: CreateBedInput, dbClient = getDatabase()): Promise<StoredBed> {
    const id = crypto.randomUUID();
    const record: StoredBed = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      wardId: input.wardId,
      bedNumber: input.bedNumber,
      bedType: input.bedType || 'STANDARD',
      status: 'AVAILABLE',
      currentPatientId: null,
      currentAdmissionId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(inpatientBeds).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          wardId: record.wardId,
          bedNumber: record.bedNumber,
          bedType: record.bedType,
          status: record.status
        } as unknown as typeof inpatientBeds.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memBeds.get(input.tenantId) || [];
    current.unshift(record);
    this.memBeds.set(input.tenantId, current);
    return record;
  }

  async getAdmissions(tenantId: string, status?: string, patientId?: string, dbClient = getDatabase()): Promise<StoredAdmission[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(inpatientAdmissions)
          .where(eq(inpatientAdmissions.tenantId, tenantId))
          .orderBy(desc(inpatientAdmissions.createdAt));
        if (rows.length > 0) {
          let list = rows as unknown as StoredAdmission[];
          if (status) list = list.filter(a => a.status === status);
          if (patientId) list = list.filter(a => a.patientId === patientId);
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memAdmissions.get(tenantId) || [];
    if (status) list = list.filter(a => a.status === status);
    if (patientId) list = list.filter(a => a.patientId === patientId);
    return list;
  }

  async createAdmission(input: CreateAdmissionInput, dbClient = getDatabase()): Promise<StoredAdmission> {
    // 1. Verify Bed Availability
    const beds = await this.getBeds(input.tenantId, undefined, undefined, dbClient);
    const targetBed = beds.find(b => b.id === input.bedId);
    if (!targetBed) throw new Error('Bed not found');
    if (targetBed.status !== 'AVAILABLE') throw new Error(`Bed ${targetBed.bedNumber} is not available (Current status: ${targetBed.status})`);

    const now = new Date();
    const admissionId = crypto.randomUUID();
    const encounterId = crypto.randomUUID();
    const admissionNumber = `ADM-${Math.floor(100000 + Math.random() * 900000)}`;

    const admissionRecord: StoredAdmission = {
      id: admissionId,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      admissionNumber,
      patientId: input.patientId,
      encounterId,
      bedId: input.bedId,
      attendingDoctorId: input.doctorId,
      department: input.department || 'GENERAL_MEDICINE',
      admissionReason: input.admissionReason,
      status: 'ADMITTED',
      admittedAt: now,
      dischargedAt: null,
      createdAt: now,
      updatedAt: now
    };

    // Update target bed to OCCUPIED
    targetBed.status = 'OCCUPIED';
    targetBed.currentPatientId = input.patientId;
    targetBed.currentAdmissionId = admissionId;
    targetBed.updatedAt = now;

    if (dbClient) {
      try {
        // Insert IPD Encounter
        await dbClient.insert(encounters).values({
          id: encounterId,
          tenantId: admissionRecord.tenantId,
          partnerId: admissionRecord.partnerId,
          organizationId: admissionRecord.organizationId,
          branchId: admissionRecord.branchId,
          patientId: input.patientId,
          doctorId: input.doctorId,
          encounterType: 'IPD',
          status: 'ADMITTED',
          chiefComplaint: input.admissionReason,
          checkedInAt: now
        } as unknown as typeof encounters.$inferInsert);

        // Insert Admission
        await dbClient.insert(inpatientAdmissions).values({
          id: admissionRecord.id,
          tenantId: admissionRecord.tenantId,
          partnerId: admissionRecord.partnerId,
          organizationId: admissionRecord.organizationId,
          branchId: admissionRecord.branchId,
          admissionNumber: admissionRecord.admissionNumber,
          patientId: admissionRecord.patientId,
          encounterId: admissionRecord.encounterId,
          admittingDoctorId: admissionRecord.attendingDoctorId,
          attendingDoctorId: admissionRecord.attendingDoctorId,
          department: admissionRecord.department,
          admissionReason: admissionRecord.admissionReason,
          status: admissionRecord.status,
          admittedAt: admissionRecord.admittedAt
        } as unknown as typeof inpatientAdmissions.$inferInsert);

        // Update Bed status in DB
        await dbClient
          .update(inpatientBeds)
          .set({ status: 'OCCUPIED', updatedAt: now })
          .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.bedId)));
      } catch {
        // Fallback
      }
    }

    const currentAdmissions = this.memAdmissions.get(input.tenantId) || [];
    currentAdmissions.unshift(admissionRecord);
    this.memAdmissions.set(input.tenantId, currentAdmissions);

    return admissionRecord;
  }

  async transferBed(input: TransferBedInput, dbClient = getDatabase()): Promise<StoredTransfer> {
    const beds = await this.getBeds(input.tenantId, undefined, undefined, dbClient);
    const sourceBed = beds.find(b => b.id === input.sourceBedId);
    const destBed = beds.find(b => b.id === input.destinationBedId);

    if (!sourceBed) throw new Error('Source bed not found');
    if (!destBed) throw new Error('Destination bed not found');
    if (destBed.status !== 'AVAILABLE') throw new Error(`Destination bed ${destBed.bedNumber} is not available (Status: ${destBed.status})`);

    const now = new Date();
    const transferId = crypto.randomUUID();

    const transferRecord: StoredTransfer = {
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

    // Update Source Bed -> AVAILABLE
    sourceBed.status = 'AVAILABLE';
    sourceBed.currentPatientId = null;
    sourceBed.currentAdmissionId = null;
    sourceBed.updatedAt = now;

    // Update Destination Bed -> OCCUPIED
    destBed.status = 'OCCUPIED';
    destBed.currentPatientId = input.patientId;
    destBed.currentAdmissionId = input.admissionId;
    destBed.updatedAt = now;

    // Update Admission record
    const admissions = this.memAdmissions.get(input.tenantId) || [];
    const admission = admissions.find(a => a.id === input.admissionId);
    if (admission) {
      admission.bedId = input.destinationBedId;
      admission.updatedAt = now;
    }

    if (dbClient) {
      try {
        await dbClient.insert(inpatientTransfers).values({
          id: transferRecord.id,
          tenantId: transferRecord.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          admissionId: transferRecord.admissionId,
          patientId: transferRecord.patientId,
          sourceBedId: transferRecord.sourceBedId,
          targetBedId: transferRecord.destinationBedId,
          reason: transferRecord.transferReason,
          status: 'COMPLETED',
          transferredAt: now
        } as unknown as typeof inpatientTransfers.$inferInsert);

        await dbClient
          .update(inpatientBeds)
          .set({ status: 'AVAILABLE', updatedAt: now })
          .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.sourceBedId)));

        await dbClient
          .update(inpatientBeds)
          .set({ status: 'OCCUPIED', updatedAt: now })
          .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.destinationBedId)));
      } catch {
        // Fallback
      }
    }

    const currentTransfers = this.memTransfers.get(input.tenantId) || [];
    currentTransfers.unshift(transferRecord);
    this.memTransfers.set(input.tenantId, currentTransfers);

    return transferRecord;
  }

  async recordNursingNote(input: NursingNoteInput, dbClient = getDatabase()): Promise<StoredNursingNote> {
    const id = crypto.randomUUID();
    const now = new Date();
    const record: StoredNursingNote = {
      id,
      tenantId: input.tenantId,
      patientId: input.patientId,
      admissionId: input.admissionId,
      nurseId: input.nurseId,
      nurseName: input.nurseName || 'Staff Nurse',
      vitals: {
        temperature: input.temperature,
        bloodPressure: input.bloodPressure,
        pulseRate: input.pulseRate,
        spO2: input.spO2,
        respiratoryRate: input.respiratoryRate
      },
      notes: input.notes,
      careObservations: input.careObservations || 'Routine vitals recorded and patient resting comfortably.',
      recordedAt: now
    };

    if (dbClient) {
      try {
        await dbClient.insert(inpatientNursingNotes).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          admissionId: record.admissionId,
          nurseId: record.nurseId,
          noteType: 'GENERAL',
          note: record.notes,
          recordedAt: now
        } as unknown as typeof inpatientNursingNotes.$inferInsert);
      } catch {
        // Fallback
      }
    }

    const current = this.memNursing.get(input.tenantId) || [];
    current.unshift(record);
    this.memNursing.set(input.tenantId, current);
    return record;
  }

  async getNursingNotes(tenantId: string, admissionId?: string, patientId?: string): Promise<StoredNursingNote[]> {
    let list = this.memNursing.get(tenantId) || [];
    if (admissionId) list = list.filter(n => n.admissionId === admissionId);
    if (patientId) list = list.filter(n => n.patientId === patientId);
    return list;
  }

  async dischargePatient(input: DischargeInput, dbClient = getDatabase()): Promise<StoredAdmission> {
    const admissions = this.memAdmissions.get(input.tenantId) || [];
    const admission = admissions.find(a => a.id === input.admissionId);
    if (!admission) throw new Error('Admission record not found');
    if (admission.status === 'DISCHARGED') throw new Error('Patient is already discharged');

    const now = new Date();
    admission.status = 'DISCHARGED';
    admission.dischargedAt = now;
    admission.updatedAt = now;

    // Release Bed -> AVAILABLE
    const beds = this.memBeds.get(input.tenantId) || [];
    const bed = beds.find(b => b.id === admission.bedId);
    if (bed) {
      bed.status = 'AVAILABLE';
      bed.currentPatientId = null;
      bed.currentAdmissionId = null;
      bed.updatedAt = now;
    }

    if (dbClient) {
      try {
        await dbClient
          .update(inpatientAdmissions)
          .set({ status: 'DISCHARGED', updatedAt: now })
          .where(and(eq(inpatientAdmissions.tenantId, input.tenantId), eq(inpatientAdmissions.id, input.admissionId)));

        await dbClient.insert(inpatientDischargeSummaries).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000002',
          branchId: '00000000-0000-4000-8000-000000000003',
          admissionId: input.admissionId,
          summaryNumber: `DIS-${Math.floor(100000 + Math.random() * 900000)}`,
          dischargeType: 'NORMAL',
          conditionAtDischarge: input.dischargeCondition,
          hospitalCourse: input.finalClinicalNotes || 'Stable recovery following medical therapy',
          status: 'FINALIZED',
          dischargedAt: now
        } as unknown as typeof inpatientDischargeSummaries.$inferInsert);

        if (bed) {
          await dbClient
            .update(inpatientBeds)
            .set({ status: 'AVAILABLE', updatedAt: now })
            .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, bed.id)));
        }
      } catch {
        // Fallback
      }
    }

    return admission;
  }
}

export const inpatientManagementRepository = new InpatientManagementRepository();
