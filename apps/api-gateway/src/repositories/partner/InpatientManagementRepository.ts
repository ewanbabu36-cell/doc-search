import crypto from 'node:crypto';
import {
  getDatabase,
  inpatientWards,
  inpatientBeds,
  inpatientAdmissionRequests,
  inpatientAdmissions,
  inpatientTransfers,
  inpatientNursingNotes,
  inpatientDischargeSummaries,
  inpatientUnits,
  inpatientDoctorRounds,
  inpatientVitalObservations,
  billingInvoices,
  billingInvoiceItems,
  pharmacyDispensing,
  investigationOrders,
  radiologyOrders,
  encounters,
  branches,
  operationalDepartments,
  operationalPartners,
  operationalOrganizations,
  patients,
  eq,
  and,
  desc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { entitlementService } from '../../services/company/EntitlementService.js';

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

async function resolveBranchId(db: any, tenantId: string, providedBranchId?: string): Promise<string> {
  if (providedBranchId) {
    return providedBranchId;
  }
  const [b] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.tenantId, tenantId))
    .limit(1);
  if (b?.id) return b.id;
  throw new AppError({
    message: 'Branch context could not be resolved for tenant. Fail-closed multi-tenant boundary.',
    code: ErrorCode.BAD_REQUEST,
    statusCode: 400
  });
}

async function resolveDepartmentId(db: any, tenantId: string, providedDeptId?: string): Promise<string> {
  if (providedDeptId) {
    return providedDeptId;
  }
  const [d] = await db
    .select({ id: operationalDepartments.id })
    .from(operationalDepartments)
    .where(eq(operationalDepartments.tenantId, tenantId))
    .limit(1);
  if (d?.id) return d.id;
  throw new AppError({
    message: 'Department context could not be resolved for tenant. Fail-closed multi-tenant boundary.',
    code: ErrorCode.BAD_REQUEST,
    statusCode: 400
  });
}

async function resolvePartnerAndOrg(
  db: any,
  tenantId: string,
  providedPartnerId?: string,
  providedOrgId?: string
): Promise<{ partnerId: string; organizationId: string }> {
  let partnerId = providedPartnerId || null;
  let organizationId = providedOrgId || null;

  if (!partnerId) {
    const [p] = await db
      .select({ id: operationalPartners.id })
      .from(operationalPartners)
      .where(eq(operationalPartners.tenantId, tenantId))
      .limit(1);
    if (p?.id) partnerId = p.id;
  }
  if (!organizationId) {
    const [o] = await db
      .select({ id: operationalOrganizations.id })
      .from(operationalOrganizations)
      .where(eq(operationalOrganizations.tenantId, tenantId))
      .limit(1);
    if (o?.id) organizationId = o.id;
  }

  if (!partnerId || !organizationId) {
    throw new AppError({
      message: 'Partner and Organization context could not be resolved for tenant. Fail-closed multi-tenant boundary.',
      code: ErrorCode.BAD_REQUEST,
      statusCode: 400
    });
  }

  return { partnerId, organizationId };
}

export interface CreateWardInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  wardCode: string;
  name: string;
  wardType: string;
  capacity?: number | undefined;
}

export interface CreateBedInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  wardId: string;
  bedNumber: string;
  bedType?: string | undefined;
  bedClass?: string | undefined;
  dailyChargeRate?: number | string | undefined;
}

export interface CreateDoctorRoundInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  admissionId: string;
  patientId?: string | undefined;
  doctorName: string;
  doctorSpecialty?: string | undefined;
  roundType?: string | undefined;
  subjectiveAssessment: string;
  objectiveClinicalFindings: string;
  clinicalImpression: string;
  treatmentPlanUpdates: string;
  orderedInvestigationsSummary?: string | undefined;
  medicationAdjustments?: string | undefined;
  dischargeReadinessScore?: number | undefined;
}

export interface StoredDoctorRound {
  id: string;
  tenantId: string;
  admissionId: string;
  patientId: string;
  doctorName: string;
  doctorSpecialty: string;
  roundType: string;
  subjectiveAssessment: string;
  objectiveClinicalFindings: string;
  clinicalImpression: string;
  treatmentPlanUpdates: string;
  orderedInvestigationsSummary?: string | null | undefined;
  medicationAdjustments?: string | null | undefined;
  dischargeReadinessScore: number;
  roundTimestamp: Date;
}

export interface RecordVitalObservationInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  admissionId: string;
  patientId?: string | undefined;
  recordedBy: string;
  temperatureCelsius?: number | string | undefined;
  pulseBpm?: number | undefined;
  respiratoryRateBpm?: number | undefined;
  systolicBpMmHg?: number | undefined;
  diastolicBpMmHg?: number | undefined;
  spo2Percentage?: number | undefined;
  bloodGlucoseMgDl?: number | string | undefined;
  painScaleScore?: number | undefined;
  isAbnormal?: boolean | undefined;
  abnormalDetails?: string | undefined;
  notes?: string | undefined;
}

export interface StoredVitalObservation {
  id: string;
  tenantId: string;
  admissionId: string;
  patientId: string;
  recordedBy: string;
  temperatureCelsius?: string | null | undefined;
  pulseBpm?: number | null | undefined;
  respiratoryRateBpm?: number | null | undefined;
  systolicBpMmHg?: number | null | undefined;
  diastolicBpMmHg?: number | null | undefined;
  spo2Percentage?: number | null | undefined;
  bloodGlucoseMgDl?: string | null | undefined;
  painScaleScore?: number | null | undefined;
  isAbnormal: boolean;
  abnormalDetails?: string | null | undefined;
  notes?: string | null | undefined;
  recordedAt: Date;
}

export interface IpdBillingSummary {
  admissionId: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  admissionDate: Date;
  dischargeDate: Date | null;
  totalDays: number;
  bedCharges: {
    days: number;
    dailyRate: number;
    totalBedAmount: number;
    bedsOccupied: Array<{
      bedId: string;
      bedCode: string;
      wardName: string;
      rate: number;
    }>;
  };
  doctorRoundsCharges: {
    count: number;
    ratePerRound: number;
    totalRoundsAmount: number;
  };
  nursingCareCharges: {
    days: number;
    dailyRate: number;
    totalNursingAmount: number;
  };
  pharmacyCharges: {
    itemsCount: number;
    totalPharmacyAmount: number;
  };
  labCharges: {
    ordersCount: number;
    totalLabAmount: number;
  };
  radiologyCharges: {
    ordersCount: number;
    totalRadiologyAmount: number;
  };
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalPayableAmount: number;
}

export interface CreateAdmissionInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  patientId: string;
  doctorId: string;
  department?: string | undefined;
  bedId: string;
  admissionReason: string;
  encounterType?: string | undefined;
}

export interface TransferBedInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  admissionId: string;
  patientId?: string | undefined;
  sourceBedId?: string | undefined;
  destinationBedId: string;
  transferReason: string;
  transferredBy?: string | undefined;
}

export interface NursingNoteInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  patientId: string;
  admissionId: string;
  nurseId: string;
  nurseName?: string | undefined;
  temperature?: string | undefined;
  bloodPressure?: string | undefined;
  pulseRate?: string | undefined;
  spO2?: string | undefined;
  respiratoryRate?: string | undefined;
  notes: string;
  careObservations?: string | undefined;
}

export interface DischargeInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  admissionId: string;
  patientId?: string | undefined;
  dischargingDoctorId: string;
  dischargeReason: string;
  dischargeCondition: string;
  finalClinicalNotes?: string | undefined;
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
  bedClass: string;
  dailyChargeRate: number;
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
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
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
        wardName: input.name || (input as any).wardName || 'General Inpatient Ward',
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
        name: input.name || (input as any).wardName || 'General Inpatient Ward',
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
        bedType: r.bedType || 'STANDARD_ELECTRIC',
        bedClass: r.bedClass || 'GENERAL',
        dailyChargeRate: r.dailyChargeRate !== undefined && r.dailyChargeRate !== null ? Number(r.dailyChargeRate) : 150.0,
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
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const bedType = input.bedType || 'STANDARD_ELECTRIC';
    const bedClass = input.bedClass || 'GENERAL';
    const dailyChargeRate = input.dailyChargeRate !== undefined ? Number(input.dailyChargeRate) : 150.0;

    // Quota Enforcement: Enforce contracted inpatient bed limit server-side
    const limitCheck = await entitlementService.checkBedLimit(input.tenantId);
    if (!limitCheck.allowed) {
      throw new AppError({
        message: `Inpatient bed quota exceeded. Your contracted plan allows a maximum of ${limitCheck.maxAllowed} beds (currently using ${limitCheck.currentCount}). Please upgrade your plan in HQ.`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403,
        details: [
          {
            field: 'beds',
            message: `Current beds: ${limitCheck.currentCount}, Maximum allowed: ${limitCheck.maxAllowed}`
          }
        ]
      });
    }

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
        bedClass,
        dailyChargeRate: String(dailyChargeRate),
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
        bedClass,
        dailyChargeRate,
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
      const encounterNumber = `ENC-IPD-${Math.floor(100000 + Math.random() * 900000)}`;

      const { partnerId, organizationId } = await resolvePartnerAndOrg(tx, input.tenantId, input.partnerId, input.organizationId);
      const branchId = await resolveBranchId(tx, input.tenantId, input.branchId);
      const departmentId = await resolveDepartmentId(tx, input.tenantId);
      const department = input.department || 'GENERAL_MEDICINE';

      // 2. Fetch patient demographics if registered
      let patientName = 'Inpatient Record';
      let patientMrn = 'MRN-AUTO';
      let patientGender = 'M';
      let patientAge = 35;
      try {
        const [pat] = await tx
          .select()
          .from(patients)
          .where(and(eq(patients.tenantId, input.tenantId), eq(patients.id, input.patientId)))
          .limit(1);
        if (pat) {
          patientName = `${pat.firstName || ''} ${pat.lastName || ''}`.trim() || patientName;
          patientMrn = pat.patientMrn || patientMrn;
          patientGender = pat.gender ? (String(pat.gender)[0] || 'M') : 'M';
          if (pat.dateOfBirth) {
            const birthYear = new Date(pat.dateOfBirth).getFullYear();
            const currYear = new Date().getFullYear();
            patientAge = Math.max(1, currYear - birthYear);
          }
        }
      } catch {
        // Continue with defaults if patients lookup fails
      }

      // 3. Insert IPD Encounter
      await tx.insert(encounters).values({
        id: encounterId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        encounterNumber,
        encounterType: 'IPD',
        status: 'ADMITTED',
        chiefComplaint: input.admissionReason,
        registeredAt: now,
        checkedInAt: now
      } as unknown as typeof encounters.$inferInsert);

      // 4. Insert Admission
      await tx.insert(inpatientAdmissions).values({
        id: admissionId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionNumber,
        patientId: input.patientId,
        patientName,
        patientMrn,
        patientGender,
        patientAge,
        encounterId,
        admittingDoctorName: (input as any).admittingDoctorName || (input as any).admittingDoctorId || input.doctorId || 'Admitting Consultant Physician',
        attendingConsultantName: (input as any).attendingConsultantName || (input as any).admittingDoctorName || (input as any).admittingDoctorId || input.doctorId || 'Attending Consultant Physician',
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

      // 5. Update Bed status in DB
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
      // 1. Fetch Admission first
      const [adm] = await tx
        .select()
        .from(inpatientAdmissions)
        .where(and(eq(inpatientAdmissions.tenantId, input.tenantId), eq(inpatientAdmissions.id, input.admissionId)))
        .limit(1);

      if (!adm) {
        throw new AppError({ message: 'Admission record not found', code: ErrorCode.NOT_FOUND, statusCode: 404 });
      }

      const sourceBedId = input.sourceBedId || adm.bedId;
      const patientId = input.patientId || adm.patientId;

      if (!sourceBedId) {
        throw new AppError({ message: 'Source bed not found for admission', code: ErrorCode.NOT_FOUND, statusCode: 404 });
      }

      // 2. Fetch Source Bed
      const sourceBeds = await tx
        .select()
        .from(inpatientBeds)
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, sourceBedId)));
      const sourceBed = sourceBeds[0];
      if (!sourceBed) {
        throw new AppError({ message: 'Source bed not found', code: ErrorCode.NOT_FOUND, statusCode: 404 });
      }

      // 3. Fetch Destination Bed
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

      const { partnerId, organizationId } = await resolvePartnerAndOrg(tx, input.tenantId, input.partnerId, input.organizationId);
      const branchId = await resolveBranchId(tx, input.tenantId, input.branchId);

      // Fetch patient demographics
      const patientName = adm.patientName || 'Transferred Patient';
      const patientMrn = adm.patientMrn || 'MRN-AUTO';

      // 4. Insert Transfer Record
      await tx.insert(inpatientTransfers).values({
        id: transferId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        transferNumber,
        admissionId: input.admissionId,
        patientId,
        patientName,
        patientMrn,
        sourceWardId: sourceBed.wardId,
        sourceWardName: 'Origin Ward',
        sourceBedId: sourceBed.id,
        sourceBedCode: sourceBed.bedNumber || (sourceBed as any).bedCode || 'SRC-BED',
        destinationWardId: destBed.wardId,
        destinationWardName: 'Destination Ward',
        destinationBedId: input.destinationBedId,
        destinationBedCode: destBed.bedNumber || (destBed as any).bedCode || 'DEST-BED',
        transferReason: input.transferReason,
        requestingDoctorName: input.transferredBy || 'Attending Physician',
        status: 'COMPLETED',
        completedAt: now
      } as unknown as typeof inpatientTransfers.$inferInsert);

      // 5. Update Source Bed -> AVAILABLE
      await tx
        .update(inpatientBeds)
        .set({
          status: 'AVAILABLE',
          currentPatientId: null,
          currentAdmissionId: null,
          updatedAt: now
        })
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, sourceBed.id)));

      // 6. Update Destination Bed -> OCCUPIED
      await tx
        .update(inpatientBeds)
        .set({
          status: 'OCCUPIED',
          currentPatientId: patientId,
          currentAdmissionId: input.admissionId,
          updatedAt: now
        })
        .where(and(eq(inpatientBeds.tenantId, input.tenantId), eq(inpatientBeds.id, input.destinationBedId)));

      // 7. Update Admission Record
      await tx
        .update(inpatientAdmissions)
        .set({
          bedId: input.destinationBedId,
          bedCode: destBed.bedNumber || (destBed as any).bedCode || 'DEST-BED',
          wardId: destBed.wardId,
          updatedAt: now
        })
        .where(and(eq(inpatientAdmissions.tenantId, input.tenantId), eq(inpatientAdmissions.id, input.admissionId)));

      return {
        id: transferId,
        tenantId: input.tenantId,
        admissionId: input.admissionId,
        patientId,
        sourceBedId: sourceBed.id,
        destinationBedId: input.destinationBedId,
        transferReason: input.transferReason,
        transferredBy: input.transferredBy || 'Attending Physician',
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
      const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
      const branchId = await resolveBranchId(db, input.tenantId, input.branchId);

      await db.insert(inpatientNursingNotes).values({
        id,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
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
      const { partnerId, organizationId } = await resolvePartnerAndOrg(tx, input.tenantId, input.partnerId, input.organizationId);
      const branchId = await resolveBranchId(tx, input.tenantId, input.branchId);

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
        partnerId,
        organizationId,
        branchId,
        summaryNumber: `DIS-${Math.floor(100000 + Math.random() * 900000)}`,
        admissionId: input.admissionId,
        patientId: input.patientId || admission.patientId,
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

  async createDoctorRound(input: CreateDoctorRoundInput, dbClient = getDatabase()): Promise<StoredDoctorRound> {
    const db = requireDb(dbClient);
    const now = new Date();
    const roundId = crypto.randomUUID();

    const [adm] = await db
      .select()
      .from(inpatientAdmissions)
      .where(and(eq(inpatientAdmissions.tenantId, input.tenantId), eq(inpatientAdmissions.id, input.admissionId)))
      .limit(1);

    if (!adm) {
      throw new AppError({
        message: 'Inpatient admission record not found.',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);

    const roundType = input.roundType || 'MORNING_PRIMARY_ROUND';
    const doctorSpecialty = input.doctorSpecialty || adm.specialty || 'General Medicine';
    const dischargeReadinessScore = input.dischargeReadinessScore !== undefined ? Number(input.dischargeReadinessScore) : 50;

    try {
      await db.insert(inpatientDoctorRounds).values({
        id: roundId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionId: input.admissionId,
        patientId: input.patientId || adm.patientId,
        doctorName: input.doctorName,
        doctorSpecialty,
        roundType,
        subjectiveAssessment: input.subjectiveAssessment,
        objectiveClinicalFindings: input.objectiveClinicalFindings,
        clinicalImpression: input.clinicalImpression,
        treatmentPlanUpdates: input.treatmentPlanUpdates,
        orderedInvestigationsSummary: input.orderedInvestigationsSummary || null,
        medicationAdjustments: input.medicationAdjustments || null,
        dischargeReadinessScore,
        roundTimestamp: now
      } as unknown as typeof inpatientDoctorRounds.$inferInsert);

      return {
        id: roundId,
        tenantId: input.tenantId,
        admissionId: input.admissionId,
        patientId: input.patientId || adm.patientId,
        doctorName: input.doctorName,
        doctorSpecialty,
        roundType,
        subjectiveAssessment: input.subjectiveAssessment,
        objectiveClinicalFindings: input.objectiveClinicalFindings,
        clinicalImpression: input.clinicalImpression,
        treatmentPlanUpdates: input.treatmentPlanUpdates,
        orderedInvestigationsSummary: input.orderedInvestigationsSummary || null,
        medicationAdjustments: input.medicationAdjustments || null,
        dischargeReadinessScore,
        roundTimestamp: now
      };
    } catch (err) {
      logger.error('Failed to create doctor round in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Doctor round recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getDoctorRounds(
    tenantId: string,
    admissionId?: string,
    patientId?: string,
    dbClient = getDatabase()
  ): Promise<StoredDoctorRound[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(inpatientDoctorRounds)
        .where(eq(inpatientDoctorRounds.tenantId, tenantId))
        .orderBy(desc(inpatientDoctorRounds.roundTimestamp));

      let list = rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        admissionId: r.admissionId,
        patientId: r.patientId,
        doctorName: r.doctorName,
        doctorSpecialty: r.doctorSpecialty,
        roundType: r.roundType,
        subjectiveAssessment: r.subjectiveAssessment,
        objectiveClinicalFindings: r.objectiveClinicalFindings,
        clinicalImpression: r.clinicalImpression,
        treatmentPlanUpdates: r.treatmentPlanUpdates,
        orderedInvestigationsSummary: r.orderedInvestigationsSummary,
        medicationAdjustments: r.medicationAdjustments,
        dischargeReadinessScore: r.dischargeReadinessScore,
        roundTimestamp: r.roundTimestamp ? new Date(r.roundTimestamp) : new Date()
      }));

      if (admissionId) list = list.filter((r: StoredDoctorRound) => r.admissionId === admissionId);
      if (patientId) list = list.filter((r: StoredDoctorRound) => r.patientId === patientId);
      return list;
    } catch (err) {
      logger.error('Failed to query doctor rounds from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Doctor rounds lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordVitalObservation(input: RecordVitalObservationInput, dbClient = getDatabase()): Promise<StoredVitalObservation> {
    const db = requireDb(dbClient);
    const now = new Date();
    const id = crypto.randomUUID();

    const [adm] = await db
      .select()
      .from(inpatientAdmissions)
      .where(and(eq(inpatientAdmissions.tenantId, input.tenantId), eq(inpatientAdmissions.id, input.admissionId)))
      .limit(1);

    if (!adm) {
      throw new AppError({
        message: 'Inpatient admission record not found.',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);

    const isAbnormal = input.isAbnormal ?? false;

    try {
      await db.insert(inpatientVitalObservations).values({
        id,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionId: input.admissionId,
        patientId: input.patientId || adm.patientId,
        recordedBy: input.recordedBy,
        temperatureCelsius: input.temperatureCelsius !== undefined ? String(input.temperatureCelsius) : null,
        pulseBpm: input.pulseBpm !== undefined ? Number(input.pulseBpm) : null,
        respiratoryRateBpm: input.respiratoryRateBpm !== undefined ? Number(input.respiratoryRateBpm) : null,
        systolicBpMmHg: input.systolicBpMmHg !== undefined ? Number(input.systolicBpMmHg) : null,
        diastolicBpMmHg: input.diastolicBpMmHg !== undefined ? Number(input.diastolicBpMmHg) : null,
        spo2Percentage: input.spo2Percentage !== undefined ? Number(input.spo2Percentage) : null,
        bloodGlucoseMgDl: input.bloodGlucoseMgDl !== undefined ? String(input.bloodGlucoseMgDl) : null,
        painScaleScore: input.painScaleScore !== undefined ? Number(input.painScaleScore) : null,
        isAbnormal,
        abnormalDetails: input.abnormalDetails || null,
        notes: input.notes || null,
        recordedAt: now
      } as unknown as typeof inpatientVitalObservations.$inferInsert);

      return {
        id,
        tenantId: input.tenantId,
        admissionId: input.admissionId,
        patientId: input.patientId || adm.patientId,
        recordedBy: input.recordedBy,
        temperatureCelsius: input.temperatureCelsius !== undefined ? String(input.temperatureCelsius) : null,
        pulseBpm: input.pulseBpm !== undefined ? Number(input.pulseBpm) : null,
        respiratoryRateBpm: input.respiratoryRateBpm !== undefined ? Number(input.respiratoryRateBpm) : null,
        systolicBpMmHg: input.systolicBpMmHg !== undefined ? Number(input.systolicBpMmHg) : null,
        diastolicBpMmHg: input.diastolicBpMmHg !== undefined ? Number(input.diastolicBpMmHg) : null,
        spo2Percentage: input.spo2Percentage !== undefined ? Number(input.spo2Percentage) : null,
        bloodGlucoseMgDl: input.bloodGlucoseMgDl !== undefined ? String(input.bloodGlucoseMgDl) : null,
        painScaleScore: input.painScaleScore !== undefined ? Number(input.painScaleScore) : null,
        isAbnormal,
        abnormalDetails: input.abnormalDetails || null,
        notes: input.notes || null,
        recordedAt: now
      };
    } catch (err) {
      logger.error('Failed to record vital observation in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Vital observation recording aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getVitalObservations(
    tenantId: string,
    admissionId?: string,
    patientId?: string,
    dbClient = getDatabase()
  ): Promise<StoredVitalObservation[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(inpatientVitalObservations)
        .where(eq(inpatientVitalObservations.tenantId, tenantId))
        .orderBy(desc(inpatientVitalObservations.recordedAt));

      let list = rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        admissionId: r.admissionId,
        patientId: r.patientId,
        recordedBy: r.recordedBy,
        temperatureCelsius: r.temperatureCelsius ? String(r.temperatureCelsius) : null,
        pulseBpm: r.pulseBpm !== null && r.pulseBpm !== undefined ? Number(r.pulseBpm) : null,
        respiratoryRateBpm: r.respiratoryRateBpm !== null && r.respiratoryRateBpm !== undefined ? Number(r.respiratoryRateBpm) : null,
        systolicBpMmHg: r.systolicBpMmHg !== null && r.systolicBpMmHg !== undefined ? Number(r.systolicBpMmHg) : null,
        diastolicBpMmHg: r.diastolicBpMmHg !== null && r.diastolicBpMmHg !== undefined ? Number(r.diastolicBpMmHg) : null,
        spo2Percentage: r.spo2Percentage !== null && r.spo2Percentage !== undefined ? Number(r.spo2Percentage) : null,
        bloodGlucoseMgDl: r.bloodGlucoseMgDl ? String(r.bloodGlucoseMgDl) : null,
        painScaleScore: r.painScaleScore !== null && r.painScaleScore !== undefined ? Number(r.painScaleScore) : null,
        isAbnormal: Boolean(r.isAbnormal),
        abnormalDetails: r.abnormalDetails,
        notes: r.notes,
        recordedAt: r.recordedAt ? new Date(r.recordedAt) : new Date()
      }));

      if (admissionId) list = list.filter((v: StoredVitalObservation) => v.admissionId === admissionId);
      if (patientId) list = list.filter((v: StoredVitalObservation) => v.patientId === patientId);
      return list;
    } catch (err) {
      logger.error('Failed to query vital observations from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Vital observations lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getDischargeSummary(
    tenantId: string,
    admissionId: string,
    dbClient = getDatabase()
  ): Promise<any> {
    const db = requireDb(dbClient);
    try {
      const [summary] = await db
        .select()
        .from(inpatientDischargeSummaries)
        .where(and(eq(inpatientDischargeSummaries.tenantId, tenantId), eq(inpatientDischargeSummaries.admissionId, admissionId)))
        .limit(1);

      if (!summary) {
        throw new AppError({
          message: 'Discharge summary not found for this admission.',
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      return {
        id: summary.id,
        tenantId: summary.tenantId,
        summaryNumber: summary.summaryNumber,
        admissionId: summary.admissionId,
        patientId: summary.patientId,
        patientName: summary.patientName,
        patientMrn: summary.patientMrn,
        admissionDate: summary.admissionDate ? new Date(summary.admissionDate) : new Date(),
        dischargeDate: summary.dischargeDate ? new Date(summary.dischargeDate) : new Date(),
        attendingConsultantName: summary.attendingConsultantName,
        finalPrimaryDiagnosis: summary.finalPrimaryDiagnosis,
        finalSecondaryDiagnosis: summary.finalSecondaryDiagnosis,
        surgicalProceduresPerformed: summary.surgicalProceduresPerformed,
        hospitalCourseSummary: summary.hospitalCourseSummary,
        keyInvestigationFindings: summary.keyInvestigationFindings,
        treatmentGiven: summary.treatmentGiven,
        dischargeMedicationAdvice: summary.dischargeMedicationAdvice,
        dietAndActivityAdvice: summary.dietAndActivityAdvice,
        warningSignsToSeekImmediateCare: summary.warningSignsToSeekImmediateCare,
        isFinalized: Boolean(summary.isFinalized),
        createdAt: summary.createdAt ? new Date(summary.createdAt) : new Date()
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Discharge summary lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getIpdBillingSummary(
    tenantId: string,
    admissionId: string,
    dbClient = getDatabase()
  ): Promise<IpdBillingSummary> {
    const db = requireDb(dbClient);

    const [adm] = await db
      .select()
      .from(inpatientAdmissions)
      .where(and(eq(inpatientAdmissions.tenantId, tenantId), eq(inpatientAdmissions.id, admissionId)))
      .limit(1);

    if (!adm) {
      throw new AppError({
        message: 'Inpatient admission record not found.',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const admittedAt = adm.admissionDateTime ? new Date(adm.admissionDateTime) : ((adm as any).admittedAt ? new Date((adm as any).admittedAt) : new Date(adm.createdAt));
    const dischargeDate = adm.actualDischargeDateTime ? new Date(adm.actualDischargeDateTime) : null;
    const effectiveEndDate = dischargeDate || new Date();
    const durationMs = Math.max(0, effectiveEndDate.getTime() - admittedAt.getTime());
    const totalDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

    // Fetch beds occupied (including transfers)
    const transfers = await db
      .select()
      .from(inpatientTransfers)
      .where(and(eq(inpatientTransfers.tenantId, tenantId), eq(inpatientTransfers.admissionId, admissionId)))
      .orderBy(inpatientTransfers.completedAt);

    const bedsOccupied: Array<{ bedId: string; bedCode: string; wardName: string; rate: number }> = [];
    const allBedIds = new Set<string>();
    if (adm.bedId) allBedIds.add(adm.bedId);
    for (const t of transfers) {
      if (t.sourceBedId) allBedIds.add(t.sourceBedId);
      if (t.destinationBedId) allBedIds.add(t.destinationBedId);
    }

    let dailyRate = 150.0;
    for (const bid of allBedIds) {
      const [bedRow] = await db
        .select()
        .from(inpatientBeds)
        .where(and(eq(inpatientBeds.tenantId, tenantId), eq(inpatientBeds.id, bid)))
        .limit(1);
      if (bedRow) {
        const rate = bedRow.dailyChargeRate ? Number(bedRow.dailyChargeRate) : 150.0;
        dailyRate = rate;
        bedsOccupied.push({
          bedId: bedRow.id,
          bedCode: bedRow.bedNumber || bedRow.bedCode,
          wardName: 'General Inpatient Ward',
          rate
        });
      }
    }

    const totalBedAmount = totalDays * dailyRate;

    // Doctor Rounds
    const rounds = await db
      .select()
      .from(inpatientDoctorRounds)
      .where(and(eq(inpatientDoctorRounds.tenantId, tenantId), eq(inpatientDoctorRounds.admissionId, admissionId)));

    const roundsCount = rounds.length;
    const ratePerRound = 500.0;
    const totalRoundsAmount = roundsCount * ratePerRound;

    // Nursing Care
    const nursingDailyRate = 300.0;
    const totalNursingAmount = totalDays * nursingDailyRate;

    // Pharmacy charges
    let pharmacyItemsCount = 0;
    let totalPharmacyAmount = 0.0;
    try {
      const pharmRows = await db
        .select()
        .from(pharmacyDispensing)
        .where(and(eq(pharmacyDispensing.tenantId, tenantId), eq(pharmacyDispensing.patientId, adm.patientId)));
      pharmacyItemsCount = pharmRows.length;
      totalPharmacyAmount = pharmRows.reduce((acc: number, cur: any) => {
        const meta = (cur.metadata as any) || {};
        const val = cur.totalAmount || cur.netAmount || meta.totalAmount || meta.netAmount || 472.50;
        return acc + Number(val);
      }, 0);
    } catch {
      // Ignore lookup failure
    }

    // Lab charges
    let labOrdersCount = 0;
    let totalLabAmount = 0.0;
    try {
      const labRows = await db
        .select()
        .from(investigationOrders)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.patientId, adm.patientId)));
      labOrdersCount = labRows.length;
      totalLabAmount = labRows.reduce((acc: number, cur: any) => acc + Number(cur.metadata?.totalAmount || cur.metadata?.netAmount || cur.totalAmount || cur.netAmount || 350.0), 0);
    } catch {
      // Ignore lookup failure
    }

    // Radiology charges
    let radiologyOrdersCount = 0;
    let totalRadiologyAmount = 0.0;
    try {
      const radRows = await db
        .select()
        .from(radiologyOrders)
        .where(and(eq(radiologyOrders.tenantId, tenantId), eq(radiologyOrders.patientId, adm.patientId)));
      radiologyOrdersCount = radRows.length;
      totalRadiologyAmount = radRows.reduce((acc: number, cur: any) => acc + Number(cur.metadata?.totalAmount || cur.metadata?.netAmount || cur.totalAmount || cur.netAmount || 800.0), 0);
    } catch {
      // Ignore lookup failure
    }

    const subtotalAmount = totalBedAmount + totalRoundsAmount + totalNursingAmount + totalPharmacyAmount + totalLabAmount + totalRadiologyAmount;
    const taxAmount = Number((subtotalAmount * 0.05).toFixed(2));
    const discountAmount = 0.0;
    const totalPayableAmount = Number((subtotalAmount + taxAmount - discountAmount).toFixed(2));

    return {
      admissionId,
      admissionNumber: adm.admissionNumber,
      patientId: adm.patientId,
      patientName: adm.patientName || 'Inpatient Patient',
      admissionDate: admittedAt,
      dischargeDate,
      totalDays,
      bedCharges: {
        days: totalDays,
        dailyRate,
        totalBedAmount,
        bedsOccupied
      },
      doctorRoundsCharges: {
        count: roundsCount,
        ratePerRound,
        totalRoundsAmount
      },
      nursingCareCharges: {
        days: totalDays,
        dailyRate: nursingDailyRate,
        totalNursingAmount
      },
      pharmacyCharges: {
        itemsCount: pharmacyItemsCount,
        totalPharmacyAmount
      },
      labCharges: {
        ordersCount: labOrdersCount,
        totalLabAmount
      },
      radiologyCharges: {
        ordersCount: radiologyOrdersCount,
        totalRadiologyAmount
      },
      subtotalAmount,
      taxAmount,
      discountAmount,
      totalPayableAmount
    };
  }

  async generateConsolidatedIpdBill(
    tenantId: string,
    admissionId: string,
    actorUserId: string,
    dbClient = getDatabase()
  ): Promise<{ invoice: any; items: any[]; summary: IpdBillingSummary }> {
    const db = requireDb(dbClient);

    const executeInTx = async (tx: any) => {
      const summary = await this.getIpdBillingSummary(tenantId, admissionId, tx);

      const [adm] = await tx
        .select()
        .from(inpatientAdmissions)
        .where(and(eq(inpatientAdmissions.tenantId, tenantId), eq(inpatientAdmissions.id, admissionId)))
        .limit(1);

      const { partnerId, organizationId } = await resolvePartnerAndOrg(tx, tenantId, adm.partnerId, adm.organizationId);
      const branchId = await resolveBranchId(tx, tenantId, adm.branchId);

      const now = new Date();
      const invoiceId = crypto.randomUUID();
      const invoiceNumber = `INV-IPD-${Math.floor(100000 + Math.random() * 900000)}`;

      const [createdInvoice] = await tx.insert(billingInvoices).values({
        id: invoiceId,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: summary.patientId,
        encounterId: adm.encounterId,
        invoiceNumber,
        invoiceType: 'IPD',
        status: 'ISSUED',
        subtotal: String(summary.subtotalAmount),
        taxTotal: String(summary.taxAmount),
        discountTotal: String(summary.discountAmount),
        totalAmount: String(summary.totalPayableAmount),
        paidAmount: '0.00',
        dueAmount: String(summary.totalPayableAmount),
        currency: 'INR',
        issuedAt: now,
        finalizedAt: now,
        finalizedBy: actorUserId,
        createdAt: now,
        updatedAt: now
      } as unknown as typeof billingInvoices.$inferInsert).returning();

      const itemsToInsert: any[] = [
        {
          id: crypto.randomUUID(),
          tenantId,
          invoiceId,
          serviceCode: 'IPD_BED',
          description: `Bed Occupancy Charges (${summary.bedCharges.days} days @ ₹${summary.bedCharges.dailyRate}/day)`,
          quantity: String(summary.bedCharges.days),
          unitPrice: String(summary.bedCharges.dailyRate),
          grossAmount: String(summary.bedCharges.totalBedAmount),
          discountAmount: '0.00',
          taxAmount: '0.00',
          netAmount: String(summary.bedCharges.totalBedAmount),
          createdAt: now
        },
        {
          id: crypto.randomUUID(),
          tenantId,
          invoiceId,
          serviceCode: 'IPD_NURSING',
          description: `Nursing & Inpatient Care Bundle (${summary.nursingCareCharges.days} days @ ₹${summary.nursingCareCharges.dailyRate}/day)`,
          quantity: String(summary.nursingCareCharges.days),
          unitPrice: String(summary.nursingCareCharges.dailyRate),
          grossAmount: String(summary.nursingCareCharges.totalNursingAmount),
          discountAmount: '0.00',
          taxAmount: '0.00',
          netAmount: String(summary.nursingCareCharges.totalNursingAmount),
          createdAt: now
        }
      ];

      if (summary.doctorRoundsCharges.count > 0) {
        itemsToInsert.push({
          id: crypto.randomUUID(),
          tenantId,
          invoiceId,
          serviceCode: 'IPD_ROUNDS',
          description: `Daily Doctor Rounds (${summary.doctorRoundsCharges.count} rounds @ ₹${summary.doctorRoundsCharges.ratePerRound}/round)`,
          quantity: String(summary.doctorRoundsCharges.count),
          unitPrice: String(summary.doctorRoundsCharges.ratePerRound),
          grossAmount: String(summary.doctorRoundsCharges.totalRoundsAmount),
          discountAmount: '0.00',
          taxAmount: '0.00',
          netAmount: String(summary.doctorRoundsCharges.totalRoundsAmount),
          createdAt: now
        });
      }

      if (summary.pharmacyCharges.totalPharmacyAmount > 0) {
        itemsToInsert.push({
          id: crypto.randomUUID(),
          tenantId,
          invoiceId,
          serviceCode: 'IPD_PHARMACY',
          description: `Inpatient Pharmacy Medications (${summary.pharmacyCharges.itemsCount} dispensations)`,
          quantity: '1.00',
          unitPrice: String(summary.pharmacyCharges.totalPharmacyAmount),
          grossAmount: String(summary.pharmacyCharges.totalPharmacyAmount),
          discountAmount: '0.00',
          taxAmount: '0.00',
          netAmount: String(summary.pharmacyCharges.totalPharmacyAmount),
          createdAt: now
        });
      }

      if (summary.labCharges.totalLabAmount > 0) {
        itemsToInsert.push({
          id: crypto.randomUUID(),
          tenantId,
          invoiceId,
          serviceCode: 'IPD_LAB',
          description: `Inpatient Pathology & Laboratory Investigations (${summary.labCharges.ordersCount} orders)`,
          quantity: '1.00',
          unitPrice: String(summary.labCharges.totalLabAmount),
          grossAmount: String(summary.labCharges.totalLabAmount),
          discountAmount: '0.00',
          taxAmount: '0.00',
          netAmount: String(summary.labCharges.totalLabAmount),
          createdAt: now
        });
      }

      if (summary.radiologyCharges.totalRadiologyAmount > 0) {
        itemsToInsert.push({
          id: crypto.randomUUID(),
          tenantId,
          invoiceId,
          serviceCode: 'IPD_RADIOLOGY',
          description: `Inpatient Radiology & Diagnostic Imaging (${summary.radiologyCharges.ordersCount} orders)`,
          quantity: '1.00',
          unitPrice: String(summary.radiologyCharges.totalRadiologyAmount),
          grossAmount: String(summary.radiologyCharges.totalRadiologyAmount),
          discountAmount: '0.00',
          taxAmount: '0.00',
          netAmount: String(summary.radiologyCharges.totalRadiologyAmount),
          createdAt: now
        });
      }

      const createdItems: any[] = [];
      for (const item of itemsToInsert) {
        const [inserted] = await tx.insert(billingInvoiceItems).values(item as unknown as typeof billingInvoiceItems.$inferInsert).returning();
        createdItems.push(inserted || item);
      }

      return {
        invoice: createdInvoice || { id: invoiceId, invoiceNumber, status: 'ISSUED', totalAmount: summary.totalPayableAmount },
        items: createdItems,
        summary
      };
    };

    if (typeof (db as any).transaction === 'function') {
      return await (db as any).transaction(executeInTx);
    } else {
      return await executeInTx(db);
    }
  }

  async createAdmissionRequest(input: CreateAdmissionRequestInput, dbClient: any = getDatabase()) {
    const db = requireDb(dbClient);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);

    const requestNumber = input.requestNumber || `REQ-${Date.now().toString().slice(-6)}`;
    const record = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      requestNumber,
      patientId: input.patientId,
      patientName: input.patientName,
      patientMrn: input.patientMrn,
      encounterId: input.encounterId || null,
      referringDoctorName: input.referringDoctorName,
      admittingDoctorName: input.admittingDoctorName,
      department: input.department,
      specialty: input.specialty,
      requestedWardType: input.requestedWardType || 'GENERAL',
      requestedBedClass: input.requestedBedClass || 'GENERAL',
      admissionSource: input.admissionSource || 'OPD',
      priority: input.priority || 'ROUTINE',
      isEmergency: input.isEmergency ?? false,
      provisionalDiagnosis: input.provisionalDiagnosis,
      admissionReason: input.admissionReason,
      expectedLengthOfStayDays: input.expectedLengthOfStayDays || 3,
      insurancePreAuthRef: input.insurancePreAuthRef || null,
      status: input.status || 'SUBMITTED',
      decisionNotes: input.decisionNotes || null
    };

    const [created] = await db.insert(inpatientAdmissionRequests).values(record as any).returning();
    return created || record;
  }

  async getAdmissionRequests(
    tenantId: string,
    branchId?: string,
    status?: string,
    dbClient: any = getDatabase()
  ) {
    const db = requireDb(dbClient);
    let conditions = [eq(inpatientAdmissionRequests.tenantId, tenantId)];
    if (branchId) {
      conditions.push(eq(inpatientAdmissionRequests.branchId, branchId));
    }
    if (status) {
      conditions.push(eq(inpatientAdmissionRequests.status, status));
    }
    return db
      .select()
      .from(inpatientAdmissionRequests)
      .where(and(...conditions))
      .orderBy(desc(inpatientAdmissionRequests.createdAt));
  }
}

export interface CreateAdmissionRequestInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  requestNumber?: string | undefined;
  patientId: string;
  patientName: string;
  patientMrn: string;
  encounterId?: string | undefined;
  referringDoctorName: string;
  admittingDoctorName: string;
  department: string;
  specialty: string;
  requestedWardType?: string | undefined;
  requestedBedClass?: string | undefined;
  admissionSource?: string | undefined;
  priority?: string | undefined;
  isEmergency?: boolean | undefined;
  provisionalDiagnosis: string;
  admissionReason: string;
  expectedLengthOfStayDays?: number | undefined;
  insurancePreAuthRef?: string | undefined;
  status?: string | undefined;
  decisionNotes?: string | undefined;
}

export const inpatientManagementRepository = new InpatientManagementRepository();

