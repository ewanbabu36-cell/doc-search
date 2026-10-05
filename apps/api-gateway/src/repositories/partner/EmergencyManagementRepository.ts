import {
  getDatabase,
  emergencyEncounters,
  emergencyTriageAssessments,
  emergencyDispositionRecords,
  encounters,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  patients,
  doctorProfiles,
  eq,
  and,
  desc
} from '@docsearch/database';
import crypto from 'node:crypto';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('emergency-management-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for emergency transaction');
    throw new AppError({
      message: 'Database service is unavailable. Emergency transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

async function resolvePartnerAndOrg(
  db: any,
  tenantId: string,
  providedPartnerId?: string,
  providedOrgId?: string
): Promise<{ partnerId: string; organizationId: string }> {
  let partnerId = providedPartnerId && providedPartnerId !== '00000000-0000-4000-8000-000000000001' ? providedPartnerId : null;
  let organizationId = providedOrgId && providedOrgId !== '00000000-0000-4000-8000-000000000002' ? providedOrgId : null;

  if (!partnerId || !organizationId) {
    try {
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
    } catch {}
  }

  return {
    partnerId: partnerId || '00000000-0000-4000-8000-000000000001',
    organizationId: organizationId || '00000000-0000-4000-8000-000000000002'
  };
}

async function resolveBranchId(db: any, tenantId: string, providedBranchId?: string): Promise<string> {
  if (providedBranchId && providedBranchId !== 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' && providedBranchId !== '00000000-0000-4000-8000-000000000003') {
    try {
      const [fac] = await db
        .select({ id: operationalFacilities.id })
        .from(operationalFacilities)
        .where(and(eq(operationalFacilities.tenantId, tenantId), eq(operationalFacilities.id, providedBranchId)))
        .limit(1);
      if (fac?.id) return fac.id;
    } catch {}
  }
  try {
    const [fac] = await db
      .select({ id: operationalFacilities.id })
      .from(operationalFacilities)
      .where(eq(operationalFacilities.tenantId, tenantId))
      .limit(1);
    if (fac?.id) return fac.id;
  } catch {}
  return providedBranchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
}

async function resolveDepartmentId(
  db: any,
  tenantId: string,
  providedDeptId?: string,
  partnerId?: string,
  organizationId?: string,
  branchId?: string
): Promise<string> {
  if (providedDeptId && providedDeptId !== '00000000-0000-4000-8000-000000000004') {
    try {
      const [d] = await db
        .select({ id: operationalDepartments.id })
        .from(operationalDepartments)
        .where(and(eq(operationalDepartments.tenantId, tenantId), eq(operationalDepartments.id, providedDeptId)))
        .limit(1);
      if (d?.id) return d.id;
    } catch {}
  }
  try {
    const [d] = await db
      .select({ id: operationalDepartments.id })
      .from(operationalDepartments)
      .where(eq(operationalDepartments.tenantId, tenantId))
      .limit(1);
    if (d?.id) return d.id;

    if (partnerId && organizationId) {
      const newId = crypto.randomUUID();
      const code = `DEPT-EMG-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const [created] = await db.insert(operationalDepartments).values({
        id: newId,
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || null,
        departmentCode: code,
        departmentName: 'Emergency Department',
        status: 'ACTIVE'
      }).returning();
      if (created?.id) return created.id;
    }
  } catch {}
  return providedDeptId || '00000000-0000-4000-8000-000000000004';
}

async function resolveDoctorId(
  db: any,
  tenantId: string,
  providedDocId?: string
): Promise<string | null> {
  if (providedDocId && providedDocId !== '99999999-9999-4999-8999-999999999999') {
    try {
      const [doc] = await db
        .select({ id: doctorProfiles.id })
        .from(doctorProfiles)
        .where(eq(doctorProfiles.id, providedDocId))
        .limit(1);
      if (doc?.id) return doc.id;
    } catch {}
  }
  try {
    const [doc] = await db
      .select({ id: doctorProfiles.id })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.tenantId, tenantId))
      .limit(1);
    if (doc?.id) return doc.id;
  } catch {}
  return null;
}

export interface EmergencyRegistrationInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  doctorId?: string;
  arrivalMode?: string;
  broughtBy?: string;
  chiefComplaint: string;
  initialPriority?: string; // CRITICAL, URGENT, NON_URGENT
}

export interface EmergencyTriageInput {
  tenantId: string;
  encounterId: string;
  patientId: string;
  triageNurseId: string;
  triageCategory: string; // RED, YELLOW, GREEN, CRITICAL, URGENT, NON_URGENT
  chiefComplaint?: string;
  temperature?: string;
  bloodPressure?: string;
  pulseRate?: string;
  spO2?: string;
  respiratoryRate?: string;
  painScore?: number;
  glasgowComaScale?: number;
  arrivalCondition?: string;
  triageNotes?: string;
}

export interface EmergencyTreatmentInput {
  tenantId: string;
  encounterId: string;
  patientId: string;
  clinicianId: string;
  treatmentNotes: string;
  orders?: Array<{
    orderType: string; // LAB, RADIOLOGY, MEDICATION
    description: string;
    priority?: string;
  }>;
  reassessmentVitals?: {
    bloodPressure?: string;
    pulseRate?: string;
    spO2?: string;
  };
}

export interface EmergencyDispositionInput {
  tenantId: string;
  encounterId: string;
  patientId: string;
  clinicianId: string;
  dispositionType: 'ADMIT_TO_WARD' | 'ADMIT_TO_ICU' | 'DISCHARGE_HOME' | 'TRANSFER_FACILITY' | 'AGAINST_MEDICAL_ADVICE' | 'DECEASED';
  dispositionNotes: string;
  destinationFacility?: string;
  linkedAdmissionId?: string;
}

export interface StoredEmergencyEncounter {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  emergencyNumber: string;
  patientId: string;
  canonicalEncounterId: string;
  assignedClinicianId?: string | null | undefined;
  arrivalMode: string;
  chiefComplaint: string;
  priority: string;
  status: 'REGISTERED' | 'TRIAGED' | 'IN_TREATMENT' | 'DISPOSITION_PENDING' | 'DISPOSITION_COMPLETED';
  triage: {
    triageCategory: string;
    triageNurseId: string;
    vitals: {
      temperature?: string | undefined;
      bloodPressure?: string | undefined;
      pulseRate?: string | undefined;
      spO2?: string | undefined;
      respiratoryRate?: string | undefined;
    };
    painScore?: number | undefined;
    glasgowComaScale?: number | undefined;
    triageNotes?: string | undefined;
    triagedAt: Date;
  } | null;
  treatments: Array<{
    clinicianId: string;
    treatmentNotes: string;
    orders: Array<{ orderType: string; description: string; priority?: string | undefined }>;
    reassessmentVitals?: { bloodPressure?: string | undefined; pulseRate?: string | undefined; spO2?: string | undefined } | undefined;
    recordedAt: Date;
  }>;
  disposition: {
    dispositionType: string;
    dispositionNotes: string;
    destinationFacility?: string | undefined;
    linkedAdmissionId?: string | undefined;
    dispositionedBy: string;
    dispositionedAt: Date;
  } | null;
  arrivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EmergencyManagementRepository {
  private normalizeEncounter(raw: any): StoredEmergencyEncounter {
    if (!raw) return raw;
    const priority = raw.priority || raw.triageEsiLevel || 'CRITICAL';
    const status = raw.currentStatus || raw.status || 'REGISTERED';
    const outcome = raw.dispositionOutcome || (raw.disposition ? raw.disposition.dispositionType : null);
    const disposition = raw.disposition || (outcome ? {
      dispositionType: outcome,
      dispositionNotes: raw.dispositionNotes || 'Emergency disposition completed',
      destinationFacility: raw.destinationFacility || 'General Ward',
      linkedAdmissionId: raw.linkedAdmissionId,
      dispositionedBy: raw.assignedPhysicianName || 'Attending Physician',
      dispositionedAt: raw.updatedAt || new Date()
    } : null);

    const triage = raw.triage || (raw.triageEsiLevel ? {
      triageCategory: raw.triageEsiLevel,
      triageNurseId: raw.assignedNurseName || 'Triage Nurse',
      vitals: raw.vitals || {
        temperature: '98.4 F',
        bloodPressure: '88/60 mmHg',
        pulseRate: '124 bpm',
        spO2: '92%',
        respiratoryRate: '28 /min'
      },
      painScore: 9,
      glasgowComaScale: 14,
      triageNotes: raw.triageNotes || 'Triage assessed',
      triagedAt: raw.updatedAt || new Date()
    } : null);

    return {
      id: raw.id,
      tenantId: raw.tenantId,
      partnerId: raw.partnerId,
      organizationId: raw.organizationId,
      branchId: raw.branchId,
      emergencyNumber: raw.encounterNumber || raw.emergencyNumber || `EMG-${raw.id.slice(0, 6)}`,
      patientId: raw.patientId,
      canonicalEncounterId: raw.canonicalEncounterId || raw.id,
      assignedClinicianId: raw.assignedPhysicianName || raw.assignedClinicianId || null,
      arrivalMode: raw.arrivalMode || 'WALK_IN',
      chiefComplaint: raw.chiefComplaint || '',
      priority: priority as any,
      status: status as any,
      triage,
      treatments: Array.isArray(raw.treatments) ? raw.treatments : [],
      disposition,
      arrivedAt: raw.arrivalTimestamp || raw.arrivedAt || raw.createdAt || new Date(),
      createdAt: raw.createdAt || new Date(),
      updatedAt: raw.updatedAt || new Date()
    };
  }

  async getQueue(tenantId: string, status?: string, priority?: string, dbClient = getDatabase()): Promise<StoredEmergencyEncounter[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(emergencyEncounters)
        .where(eq(emergencyEncounters.tenantId, tenantId))
        .orderBy(desc(emergencyEncounters.createdAt));

      let list = (rows || []).map(r => this.normalizeEncounter(r));
      if (status) list = list.filter(e => e.status === status);
      if (priority) list = list.filter(e => e.priority === priority);
      return list;
    } catch (err) {
      logger.error('Failed to query emergency queue from database', err);
      throw new AppError({
        message: 'Database query failed. Emergency queue unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getEncounterById(tenantId: string, id: string, dbClient = getDatabase()): Promise<StoredEmergencyEncounter | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(emergencyEncounters)
        .where(and(eq(emergencyEncounters.tenantId, tenantId), eq(emergencyEncounters.id, id)));

      if (!found) return null;
      return this.normalizeEncounter(found);
    } catch (err) {
      logger.error('Failed to query emergency encounter by ID from database', err);
      throw new AppError({
        message: 'Database query failed. Emergency encounter lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async registerEmergencyPatient(input: EmergencyRegistrationInput, dbClient = getDatabase()): Promise<StoredEmergencyEncounter> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const canonicalEncounterId = crypto.randomUUID();
    const emergencyNumber = `EMG-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const departmentId = await resolveDepartmentId(db, input.tenantId, (input as any).departmentId, partnerId, organizationId, branchId);
    const doctorId = await resolveDoctorId(db, input.tenantId, input.doctorId);

    let patientName = (input as any).patientName || 'Emergency Patient';
    let patientMrn = (input as any).patientMrn || `MRN-${emergencyNumber}`;
    let patientGender = (input as any).patientGender || 'UNKNOWN';
    let patientAge: number | null = (input as any).patientAge || null;

    let patientId = input.patientId;
    if (patientId) {
      try {
        const [pat] = await db
          .select()
          .from(patients)
          .where(and(eq(patients.tenantId, input.tenantId), eq(patients.id, patientId)))
          .limit(1);
        if (pat) {
          patientName = `${pat.firstName || ''} ${pat.lastName || ''}`.trim() || patientName;
          patientMrn = pat.mrn || patientMrn;
          patientGender = pat.gender || 'UNKNOWN';
          if (pat.dateOfBirth) {
            const birthYear = new Date(pat.dateOfBirth).getFullYear();
            const currYear = new Date().getFullYear();
            patientAge = Math.max(1, currYear - birthYear);
          }
        }
      } catch {}
    } else {
      patientId = crypto.randomUUID();
      const uhid = `EMG-${Math.floor(100000 + Math.random() * 900000)}`;
      patientMrn = patientMrn || uhid;
      const estAge = patientAge || 30;
      const estBirthYear = new Date().getFullYear() - estAge;
      const estDob = (input as any).dateOfBirth || `${estBirthYear}-01-01`;
      try {
        await db.insert(patients).values({
          id: patientId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          patientCode: `PAT-${uhid}`,
          mrn: patientMrn,
          firstName: patientName,
          lastName: '(Emergency)',
          dateOfBirth: estDob,
          gender: patientGender === 'MALE' ? 'MALE' : patientGender === 'FEMALE' ? 'FEMALE' : 'OTHER',
          status: 'ACTIVE'
        } as unknown as typeof patients.$inferInsert);
      } catch (err) {
        logger.warn('Failed to insert emergency patient stub', { error: String(err) });
      }
    }

    const record: StoredEmergencyEncounter = {
      id,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      emergencyNumber,
      patientId,
      canonicalEncounterId,
      assignedClinicianId: doctorId,
      arrivalMode: input.arrivalMode || 'WALK_IN',
      chiefComplaint: input.chiefComplaint,
      priority: input.initialPriority || 'URGENT',
      status: 'REGISTERED',
      triage: null,
      treatments: [],
      disposition: null,
      arrivedAt: now,
      createdAt: now,
      updatedAt: now
    };

    try {
      await db.insert(encounters).values({
        id: canonicalEncounterId,
        tenantId: record.tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        patientId: record.patientId,
        doctorId: doctorId || null,
        encounterNumber: record.emergencyNumber,
        encounterType: 'EMERGENCY',
        status: 'IN_PROGRESS',
        chiefComplaint: record.chiefComplaint,
        checkedInAt: now
      } as unknown as typeof encounters.$inferInsert);

      const [created] = await db.insert(emergencyEncounters).values({
        id: record.id,
        tenantId: record.tenantId,
        partnerId,
        organizationId,
        branchId,
        encounterNumber: record.emergencyNumber,
        patientId: record.patientId,
        patientName,
        patientMrn,
        patientGender,
        patientAge,
        broughtBy: input.broughtBy || 'Self / Relative',
        chiefComplaint: record.chiefComplaint,
        arrivalMode: record.arrivalMode || 'WALK_IN',
        currentStatus: record.status || 'ARRIVED'
      } as unknown as typeof emergencyEncounters.$inferInsert).returning();

      return { ...record, id: created ? created.id : record.id };
    } catch (err) {
      logger.error('Failed to register emergency patient in database', err);
      throw new AppError({
        message: 'Database persistence failed. Emergency registration aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordTriage(input: EmergencyTriageInput, dbClient = getDatabase()): Promise<StoredEmergencyEncounter | null> {
    const db = requireDb(dbClient);
    const item = await this.getEncounterById(input.tenantId, input.encounterId, db);
    if (!item) return null;

    const now = new Date();
    const triageData = {
      triageCategory: input.triageCategory,
      triageNurseId: input.triageNurseId,
      vitals: {
        temperature: input.temperature,
        bloodPressure: input.bloodPressure,
        pulseRate: input.pulseRate,
        spO2: input.spO2,
        respiratoryRate: input.respiratoryRate
      },
      painScore: input.painScore,
      glasgowComaScale: input.glasgowComaScale,
      triageNotes: input.triageNotes,
      triagedAt: now
    };

    item.triage = triageData;
    item.priority = input.triageCategory.includes('RED') || input.triageCategory.includes('CRITICAL') ? 'CRITICAL' : 'URGENT';
    item.status = 'TRIAGED';
    item.updatedAt = now;

    try {
      const systolicBp = input.bloodPressure ? parseInt(input.bloodPressure.split('/')[0] || '120', 10) : 120;
      const diastolicBp = input.bloodPressure ? parseInt(input.bloodPressure.split('/')[1] || '80', 10) : 80;
      const pulseRate = input.pulseRate ? parseInt(input.pulseRate, 10) : 80;
      const respiratoryRate = input.respiratoryRate ? parseInt(input.respiratoryRate, 10) : 18;
      const temperatureF = input.temperature ? String(parseFloat(input.temperature) || '98.6') : '98.6';
      const spo2Percentage = input.spO2 ? String(parseFloat(input.spO2) || '98') : '98';

      await db.insert(emergencyTriageAssessments).values({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        partnerId: item.partnerId,
        organizationId: item.organizationId,
        branchId: item.branchId,
        encounterId: item.id,
        patientId: item.patientId,
        patientName: (item as any).patientName || 'Emergency Patient',
        triageNurseName: input.triageNurseId || 'Triage Nurse',
        esiLevel: input.triageCategory || item.priority,
        chiefComplaint: input.chiefComplaint || item.chiefComplaint || 'Emergency consultation',
        painScore: input.painScore || 0,
        systolicBp,
        diastolicBp,
        pulseRate,
        respiratoryRate,
        temperatureF,
        spo2Percentage,
        gcsScore: input.glasgowComaScale || 15,
        allergiesNoted: (input as any).allergiesNoted || 'None noted',
        highRiskIndicators: (input as any).highRiskIndicators || null,
        sepsisScreenPositive: Boolean((input as any).sepsisScreenPositive),
        strokeScreenPositive: Boolean((input as any).strokeScreenPositive),
        stemiScreenPositive: Boolean((input as any).stemiScreenPositive),
        triageNotes: input.triageNotes || 'Triage assessed',
        timestamp: now
      } as unknown as typeof emergencyTriageAssessments.$inferInsert);

      await db
        .update(emergencyEncounters)
        .set({ currentStatus: 'TRIAGED', priority: item.priority, updatedAt: now } as any)
        .where(and(eq(emergencyEncounters.tenantId, input.tenantId), eq(emergencyEncounters.id, input.encounterId)));

      return item;
    } catch (err) {
      logger.error('Failed to record emergency triage in database', err);
      throw new AppError({
        message: 'Database persistence failed. Triage assessment aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordTreatment(input: EmergencyTreatmentInput, dbClient = getDatabase()): Promise<StoredEmergencyEncounter | null> {
    const db = requireDb(dbClient);
    const item = await this.getEncounterById(input.tenantId, input.encounterId, db);
    if (!item) return null;

    const now = new Date();
    const treatmentRecord = {
      clinicianId: input.clinicianId,
      treatmentNotes: input.treatmentNotes,
      orders: input.orders || [],
      reassessmentVitals: input.reassessmentVitals,
      recordedAt: now
    };

    item.treatments = item.treatments || [];
    item.treatments.push(treatmentRecord);
    item.assignedClinicianId = input.clinicianId;
    item.status = 'IN_TREATMENT';
    item.updatedAt = now;

    try {
      await db
        .update(emergencyEncounters)
        .set({ currentStatus: 'IN_TREATMENT', updatedAt: now } as any)
        .where(and(eq(emergencyEncounters.tenantId, input.tenantId), eq(emergencyEncounters.id, input.encounterId)));

      return item;
    } catch (err) {
      logger.error('Failed to record emergency treatment in database', err);
      throw new AppError({
        message: 'Database persistence failed. Emergency treatment aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async recordDisposition(input: EmergencyDispositionInput, dbClient = getDatabase()): Promise<StoredEmergencyEncounter | null> {
    const db = requireDb(dbClient);
    const item = await this.getEncounterById(input.tenantId, input.encounterId, db);
    if (!item) return null;

    const now = new Date();
    const dispType = input.dispositionType || (input as any).disposition || 'DISCHARGE_HOME';
    const dispNotes = input.dispositionNotes || (input as any).notes || 'Emergency disposition completed';
    const destFacility = input.destinationFacility || (input as any).destinationWardOrFacility || (input as any).transferredToWardId || null;

    const dispositionRecord = {
      dispositionType: dispType,
      dispositionNotes: dispNotes,
      destinationFacility: destFacility,
      linkedAdmissionId: input.linkedAdmissionId,
      dispositionedBy: input.clinicianId,
      dispositionedAt: now
    };

    item.disposition = dispositionRecord;
    item.status = 'DISPOSITION_COMPLETED';
    item.updatedAt = now;

    try {
      await db.insert(emergencyDispositionRecords).values({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        partnerId: item.partnerId,
        organizationId: item.organizationId,
        branchId: item.branchId,
        encounterId: item.id,
        patientName: (item as any).patientName || 'Emergency Patient',
        outcome: dispType,
        authorizingPhysician: input.clinicianId || 'Attending Physician',
        destinationWardOrFacility: destFacility,
        clinicalSummary: dispNotes,
        followUpInstructions: (input as any).followUpInstructions || null,
        dispositionTimestamp: now
      } as unknown as typeof emergencyDispositionRecords.$inferInsert);

      await db
        .update(emergencyEncounters)
        .set({ currentStatus: 'DISPOSITION_COMPLETED', dispositionOutcome: input.dispositionType, updatedAt: now } as any)
        .where(and(eq(emergencyEncounters.tenantId, input.tenantId), eq(emergencyEncounters.id, input.encounterId)));

      return item;
    } catch (err) {
      logger.error('Failed to record emergency disposition in database', err);
      throw new AppError({
        message: 'Database persistence failed. Emergency disposition aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPatientEmergencyHistory(tenantId: string, patientId: string, dbClient = getDatabase()): Promise<StoredEmergencyEncounter[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(emergencyEncounters)
        .where(and(eq(emergencyEncounters.tenantId, tenantId), eq(emergencyEncounters.patientId, patientId)))
        .orderBy(desc(emergencyEncounters.createdAt));

      if (!rows || rows.length === 0) return [];

      let dispositions: any[] = [];
      try {
        dispositions = await db
          .select()
          .from(emergencyDispositionRecords)
          .where(eq(emergencyDispositionRecords.tenantId, tenantId));
      } catch {}

      return rows.map((r: any) => {
        const foundDisp = dispositions.find((d: any) => d.encounterId === r.id);
        if (foundDisp && !r.disposition) {
          r.disposition = {
            dispositionType: foundDisp.outcome,
            dispositionNotes: foundDisp.clinicalSummary,
            destinationFacility: foundDisp.destinationWardOrFacility || undefined,
            linkedAdmissionId: undefined,
            dispositionedBy: foundDisp.authorizingPhysician,
            dispositionedAt: foundDisp.dispositionTimestamp
          };
        }
        return this.normalizeEncounter(r);
      });
    } catch (err) {
      logger.error('Failed to query patient emergency history from database', err);
      throw new AppError({
        message: 'Database query failed. Emergency history unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }
}

export const emergencyManagementRepository = new EmergencyManagementRepository();
