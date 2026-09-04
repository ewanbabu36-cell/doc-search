import {
  getDatabase,
  patients,
  encounters,
  encounterQueues,
  consultations,
  consultationVitals,
  consultationDiagnoses,
  consultationMedications,
  consultationFollowups,
  pharmacyPrescriptions,
  pharmacyPrescriptionItems,
  pharmacyDispensing,
  eq,
  and,
  desc,
  asc,
  type Patient,
  type Encounter
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { labDiagnosticsRepository } from './LabDiagnosticsRepository.js';

const logger = createLogger('clinical-workflow-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for clinical transaction');
    throw new AppError({
      message: 'Database service is unavailable. Clinical transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

export interface CreatePatientInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  mrn?: string;
  patientCode?: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth?: string;
  mobileNumber?: string;
  bloodGroup?: string;
}

export interface CreateEncounterInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  departmentId?: string;
  patientId: string;
  doctorId?: string;
  encounterNumber?: string;
  encounterType?: string; // 'OPD' | 'WALK_IN' | 'APPOINTMENT' | 'FOLLOW_UP' | 'EMERGENCY'
  status?: string; // 'REGISTERED' | 'CHECKED_IN' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'
  chiefComplaint?: string;
  visitType?: string;
  metadata?: any;
}

export interface CreateQueueTokenInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  departmentId?: string;
  doctorId?: string;
  encounterId: string;
  queueDate?: string;
  estimatedWaitMinutes?: number;
  metadata?: any;
}

export interface StoredQueueToken {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  departmentId: string;
  doctorId: string | null;
  encounterId: string;
  tokenNumber: string;
  queueDate: string;
  queueStatus: string;
  estimatedWaitMinutes: number;
  calledAt: Date | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveConsultationInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  status?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  examinationNotes?: string;
  assessmentNotes?: string;
  planNotes?: string;
  vitals?: {
    temperatureCelsius?: string | number;
    temperatureFahrenheit?: number;
    systolicBp?: number;
    diastolicBp?: number;
    pulseBpm?: number;
    heartRateBpm?: number;
    respiratoryRateBpm?: number;
    spO2Percentage?: number;
    oxygenSaturationPercent?: number;
    weightKg?: number | string;
    heightCm?: number | string;
    bmi?: number | string;
  };
  diagnoses?: Array<{
    code?: string;
    description?: string;
    diagnosisCode?: string;
    diagnosisName?: string;
    isPrimary?: boolean;
    type?: 'PRIMARY' | 'SECONDARY' | 'PROVISIONAL' | 'FINAL';
  }>;
  medications?: Array<{
    drugName?: string;
    genericName?: string;
    medicationName?: string;
    strength?: string;
    dosage?: string;
    route?: string;
    frequency?: string;
    duration?: string | number;
    durationUnit?: string;
    durationDays?: number;
    quantity?: number;
    instructions?: string;
    beforeAfterFood?: string;
  }>;
  labInvestigations?: Array<{
    testName?: string;
    testCode?: string;
    category?: string;
    priority?: string;
  }> | any;
  followUpAdvice?: string;
  followUpDate?: string;
  followUpWindow?: string;
}

export interface StoredConsultation {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  consultationNumber: string;
  status: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  examinationNotes: string;
  assessmentNotes: string;
  planNotes: string;
  vitals?: any;
  diagnoses?: any[];
  medications?: any[];
  labInvestigations?: any;
  followups?: any[];
  followUpAdvice?: string;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrescriptionInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  encounterId?: string;
  consultationId?: string;
  prescribingDoctorId?: string;
  priority?: string;
  notes?: string;
  items?: Array<{
    medicationId?: string;
    medicationName?: string;
    dosage?: string;
    frequency?: string;
    route?: string;
    duration?: number | string;
    durationUnit?: string;
    prescribedQuantity?: number | string;
    quantity?: number | string;
    instructions?: string;
  }>;
}

export interface StoredPrescription {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  prescriptionNumber: string;
  patientId: string;
  encounterId: string | null;
  consultationId: string | null;
  prescribingDoctorId: string;
  priority: string;
  status: string;
  notes?: string | null;
  items: any[];
  createdAt: Date;
}

export interface ConsultationWorkflowResult {
  consultation: StoredConsultation;
  encounter: Encounter | null;
  queueToken: StoredQueueToken | null;
  prescription: StoredPrescription | null;
  pharmacyOrder: any | null;
  labOrders: any[];
  followUp: any | null;
}

const ICD10_CATALOGUE = [
  { code: 'I10', name: 'Essential (primary) hypertension', category: 'Circulatory System' },
  { code: 'I20.9', name: 'Angina pectoris, unspecified', category: 'Circulatory System' },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', category: 'Endocrine, Nutritional and Metabolic' },
  { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified', category: 'Respiratory System' },
  { code: 'K29.70', name: 'Gastritis, unspecified, without bleeding', category: 'Digestive System' },
  { code: 'M54.5', name: 'Low back pain', category: 'Musculoskeletal System' },
  { code: 'R50.9', name: 'Fever, unspecified', category: 'General Symptoms' },
  { code: 'A09', name: 'Infectious gastroenteritis and colitis, unspecified', category: 'Infectious Diseases' },
  { code: 'B34.9', name: 'Viral infection, unspecified', category: 'Infectious Diseases' },
  { code: 'J45.909', name: 'Unspecified asthma, uncomplicated', category: 'Respiratory System' }
];

const GENERIC_DRUG_CATALOGUE = [
  {
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Co-Amoxiclav 625',
    savingsPercentage: 65
  },
  {
    brandName: 'Pan 40',
    genericName: 'Pantoprazole (40mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Pantoprazole 40',
    savingsPercentage: 72
  },
  {
    brandName: 'Calpol 650',
    genericName: 'Paracetamol (650mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Paracetamol 650',
    savingsPercentage: 50
  },
  {
    brandName: 'Lipitor 10',
    genericName: 'Atorvastatin (10mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Atorvastatin 10',
    savingsPercentage: 78
  },
  {
    brandName: 'Telma 40',
    genericName: 'Telmisartan (40mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Telmisartan 40',
    savingsPercentage: 60
  }
];

export class ClinicalWorkflowRepository {
  // =========================================================================
  // 1. PATIENT REGISTRATION & DEDUPLICATION (IDEMPOTENT)
  // =========================================================================

  async searchPatients(tenantId: string, query?: string, dbClient = getDatabase()): Promise<Patient[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(patients)
        .where(eq(patients.tenantId, tenantId))
        .orderBy(desc(patients.createdAt));

      if (!query) return rows;
      const q = query.toLowerCase();
      return rows.filter(r => 
        (r.firstName && r.firstName.toLowerCase().includes(q)) ||
        (r.lastName && r.lastName.toLowerCase().includes(q)) ||
        (r.mrn && r.mrn.toLowerCase().includes(q)) ||
        (r.patientCode && r.patientCode.toLowerCase().includes(q))
      );
    } catch (err) {
      logger.error('Failed to query patients from database', err);
      throw new AppError({
        message: 'Database query failed. Patient data lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPatientById(tenantId: string, patientId: string, dbClient = getDatabase()): Promise<Patient | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(patients)
        .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)));
      return found || null;
    } catch (err) {
      logger.error('Failed to query patient by ID in database', err);
      throw new AppError({
        message: 'Database query failed. Patient lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createPatient(input: CreatePatientInput, dbClient = getDatabase()): Promise<Patient> {
    const db = requireDb(dbClient);

    // Idempotency / Duplicate Prevention Check:
    // Check if patient with exact MRN already exists within this tenant
    if (input.mrn) {
      const [existingByMrn] = await db
        .select()
        .from(patients)
        .where(and(eq(patients.tenantId, input.tenantId), eq(patients.mrn, input.mrn)));
      if (existingByMrn) {
        logger.info('Duplicate patient registration prevented by MRN. Returning existing record.', { mrn: input.mrn, id: existingByMrn.id });
        return existingByMrn;
      }
    }

    // Check if patient with same name and mobile already exists in tenant
    if (input.mobileNumber && input.firstName && input.lastName) {
      const existingList = await db
        .select()
        .from(patients)
        .where(and(
          eq(patients.tenantId, input.tenantId),
          eq(patients.firstName, input.firstName),
          eq(patients.lastName, input.lastName)
        ));
      
      const matched = existingList.find(p => (p as any).mobileNumber === input.mobileNumber);
      if (matched) {
        logger.info('Duplicate patient registration prevented by mobile/name. Returning existing record.', { id: matched.id });
        return matched;
      }
    }

    const id = crypto.randomUUID();
    const mrn = input.mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const record = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      patientCode: input.patientCode || `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
      mrn,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth || '2000-01-01',
      gender: input.gender || 'OTHER',
      bloodGroup: input.bloodGroup || null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const [created] = await db.insert(patients).values(record as unknown as typeof patients.$inferInsert).returning();
      if (!created) {
        throw new Error('Insert returned empty result');
      }
      return created;
    } catch (err) {
      logger.error('Failed to create patient in database', err);
      throw new AppError({
        message: 'Database persistence failed. Patient registration aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async updatePatient(
    tenantId: string,
    patientId: string,
    patch: Partial<CreatePatientInput>,
    dbClient = getDatabase()
  ): Promise<Patient | null> {
    const db = requireDb(dbClient);
    try {
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (patch.firstName !== undefined) updateData['firstName'] = patch.firstName;
      if (patch.lastName !== undefined) updateData['lastName'] = patch.lastName;
      if (patch.gender !== undefined) updateData['gender'] = patch.gender;
      if (patch.dateOfBirth !== undefined) updateData['dateOfBirth'] = patch.dateOfBirth;
      if (patch.bloodGroup !== undefined) updateData['bloodGroup'] = patch.bloodGroup;

      const [updated] = await db
        .update(patients)
        .set(updateData as any)
        .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)))
        .returning();

      return updated || null;
    } catch (err) {
      logger.error('Failed to update patient in database', err);
      throw new AppError({
        message: 'Database update failed. Patient modification aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 2. APPOINTMENT / WALK-IN ENCOUNTERS
  // =========================================================================

  async getEncounters(tenantId: string, status?: string, dbClient = getDatabase()): Promise<Encounter[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(encounters)
        .where(eq(encounters.tenantId, tenantId))
        .orderBy(desc(encounters.createdAt));

      if (!status) return rows;
      return rows.filter(e => e.status === status);
    } catch (err) {
      logger.error('Failed to query encounters from database', err);
      throw new AppError({
        message: 'Database query failed. Encounter lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getEncounterById(tenantId: string, encounterId: string, dbClient = getDatabase()): Promise<Encounter | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)));
      return found || null;
    } catch (err) {
      logger.error('Failed to query encounter by ID in database', err);
      throw new AppError({
        message: 'Database query failed. Encounter lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createEncounter(input: CreateEncounterInput, dbClient = getDatabase()): Promise<Encounter> {
    const db = requireDb(dbClient);

    // Idempotency: If encounterNumber is provided and already exists in tenant, return it
    if (input.encounterNumber) {
      const [existingByNumber] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.encounterNumber, input.encounterNumber)));
      if (existingByNumber) {
        logger.info('Duplicate encounter prevented by encounterNumber. Returning existing record.', { encounterNumber: input.encounterNumber });
        return existingByNumber;
      }
    }

    // Check if active encounter for same patient, doctor, and type was created very recently (prevent double click)
    const existingList = await db
      .select()
      .from(encounters)
      .where(and(
        eq(encounters.tenantId, input.tenantId),
        eq(encounters.patientId, input.patientId)
      ))
      .orderBy(desc(encounters.createdAt));

    const activeEncounter = existingList.find(e => 
      ['REGISTERED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'].includes(e.status) &&
      (!input.doctorId || e.doctorId === input.doctorId) &&
      (!input.encounterType || e.encounterType === input.encounterType)
    );

    if (activeEncounter && !input.encounterNumber) {
      logger.info('Active encounter already exists for patient. Returning existing record.', { encounterId: activeEncounter.id });
      return activeEncounter;
    }

    const id = crypto.randomUUID();
    const encNumber = input.encounterNumber || `ENC-${Math.floor(100000 + Math.random() * 900000)}`;
    const record = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      departmentId: input.departmentId || '00000000-0000-4000-8000-000000000004',
      patientId: input.patientId,
      doctorId: input.doctorId || '99999999-9999-4999-8999-999999999999',
      encounterNumber: encNumber,
      encounterType: input.encounterType || 'OPD', // OPD, WALK_IN, APPOINTMENT
      status: input.status || 'CHECKED_IN',
      chiefComplaint: input.chiefComplaint || 'Routine OPD visit',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const [created] = await db.insert(encounters).values(record as unknown as typeof encounters.$inferInsert).returning();
      if (!created) {
        throw new Error('Insert returned empty result');
      }
      return created;
    } catch (err) {
      logger.error('Failed to create encounter in database', err);
      throw new AppError({
        message: 'Database persistence failed. Encounter creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async updateEncounterStatus(
    tenantId: string,
    encounterId: string,
    targetStatus: string,
    dbClient = getDatabase()
  ): Promise<Encounter | null> {
    const db = requireDb(dbClient);
    
    // Validate current status before transition
    const existing = await this.getEncounterById(tenantId, encounterId, db);
    if (!existing) {
      throw new AppError({
        message: `Encounter not found: ${encounterId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (existing.status === 'COMPLETED' && targetStatus !== 'COMPLETED') {
      throw new AppError({
        message: `Cannot transition completed encounter: ${encounterId}`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    if (existing.status === 'CANCELLED') {
      throw new AppError({
        message: `Cannot transition cancelled encounter: ${encounterId}`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    try {
      const [updated] = await db
        .update(encounters)
        .set({ status: targetStatus, updatedAt: new Date() })
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)))
        .returning();
      return updated || null;
    } catch (err) {
      logger.error('Failed to update encounter status in database', err);
      throw new AppError({
        message: 'Database update failed. Encounter status transition aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 3. OPERATIONAL QUEUE & TOKEN MANAGEMENT (POSTGRESQL-BACKED)
  // =========================================================================

  async createQueueToken(input: CreateQueueTokenInput, dbClient = getDatabase()): Promise<StoredQueueToken> {
    const db = requireDb(dbClient);
    const today: string = input.queueDate ?? (new Date().toISOString().split('T')[0] ?? '2026-09-03');

    // Idempotency: If token already exists for this encounter, return existing record
    const [existing] = await db
      .select()
      .from(encounterQueues)
      .where(and(eq(encounterQueues.tenantId, input.tenantId), eq(encounterQueues.encounterId, input.encounterId)));

    if (existing) {
      const tokenRec = existing as unknown as StoredQueueToken;
      logger.info('Queue token already exists for encounter. Returning existing record.', { tokenId: tokenRec.id, tokenNumber: tokenRec.tokenNumber });
      return tokenRec;
    }

    // Deterministic sequential token number for this tenant, branch, and date
    const branchId = input.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const existingTokens = await db
      .select()
      .from(encounterQueues)
      .where(and(
        eq(encounterQueues.tenantId, input.tenantId),
        eq(encounterQueues.branchId, branchId),
        eq(encounterQueues.queueDate, today)
      ));

    const nextNumber = existingTokens.length + 1;
    const tokenNumber = `TKN-${String(nextNumber).padStart(3, '0')}`;

    const id = crypto.randomUUID();
    const newRecord = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId,
      departmentId: input.departmentId || '00000000-0000-4000-8000-000000000004',
      doctorId: input.doctorId || '99999999-9999-4999-8999-999999999999',
      encounterId: input.encounterId,
      tokenNumber,
      queueDate: today,
      queueStatus: 'WAITING',
      estimatedWaitMinutes: input.estimatedWaitMinutes || 15,
      metadata: input.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const [created] = await db.insert(encounterQueues).values(newRecord as unknown as typeof encounterQueues.$inferInsert).returning();
      if (!created) {
        throw new Error('Insert returned empty result');
      }

      // Also ensure linked encounter is in WAITING status
      await db
        .update(encounters)
        .set({ status: 'WAITING', updatedAt: new Date() })
        .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.id, input.encounterId)));

      return created as unknown as StoredQueueToken;
    } catch (err) {
      logger.error('Failed to create queue token in database', err);
      throw new AppError({
        message: 'Database persistence failed. Queue token generation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getQueue(
    tenantId: string,
    filters?: { branchId?: string; doctorId?: string; queueDate?: string; queueStatus?: string },
    dbClient = getDatabase()
  ): Promise<StoredQueueToken[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(encounterQueues)
        .where(eq(encounterQueues.tenantId, tenantId))
        .orderBy(asc(encounterQueues.createdAt));

      let list = rows as unknown as StoredQueueToken[];
      if (filters?.branchId) list = list.filter(q => q.branchId === filters.branchId);
      if (filters?.doctorId) list = list.filter(q => q.doctorId === filters.doctorId);
      if (filters?.queueDate) list = list.filter(q => q.queueDate === filters.queueDate);
      if (filters?.queueStatus) list = list.filter(q => q.queueStatus === filters.queueStatus);

      return list;
    } catch (err) {
      logger.error('Failed to query queue from database', err);
      throw new AppError({
        message: 'Database query failed. Operational queue lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getQueueTokenById(tenantId: string, queueId: string, dbClient = getDatabase()): Promise<StoredQueueToken | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(encounterQueues)
        .where(and(eq(encounterQueues.tenantId, tenantId), eq(encounterQueues.id, queueId)));
      return (found as unknown as StoredQueueToken) || null;
    } catch (err) {
      logger.error('Failed to query queue token by ID in database', err);
      throw new AppError({
        message: 'Database query failed. Queue token lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async callQueueToken(tenantId: string, queueId: string, dbClient = getDatabase()): Promise<StoredQueueToken> {
    const db = requireDb(dbClient);
    const token = await this.getQueueTokenById(tenantId, queueId, db);
    if (!token) {
      throw new AppError({
        message: `Queue token not found: ${queueId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (token.queueStatus !== 'WAITING') {
      throw new AppError({
        message: `Cannot call token in '${token.queueStatus}' status. Expected 'WAITING'.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const now = new Date();
    try {
      const [updated] = await db
        .update(encounterQueues)
        .set({ queueStatus: 'CALLED', calledAt: now, updatedAt: now })
        .where(and(eq(encounterQueues.tenantId, tenantId), eq(encounterQueues.id, queueId)))
        .returning();

      return updated as unknown as StoredQueueToken;
    } catch (err) {
      logger.error('Failed to call queue token in database', err);
      throw new AppError({
        message: 'Database update failed. Token call aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async startQueueToken(tenantId: string, queueId: string, dbClient = getDatabase()): Promise<StoredQueueToken> {
    const db = requireDb(dbClient);
    const token = await this.getQueueTokenById(tenantId, queueId, db);
    if (!token) {
      throw new AppError({
        message: `Queue token not found: ${queueId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (!['WAITING', 'CALLED'].includes(token.queueStatus)) {
      throw new AppError({
        message: `Cannot start consultation for token in '${token.queueStatus}' status. Expected 'CALLED' or 'WAITING'.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const now = new Date();
    try {
      const [updated] = await db
        .update(encounterQueues)
        .set({ queueStatus: 'IN_PROGRESS', updatedAt: now })
        .where(and(eq(encounterQueues.tenantId, tenantId), eq(encounterQueues.id, queueId)))
        .returning();

      // Also update linked encounter to IN_CONSULTATION
      await db
        .update(encounters)
        .set({ status: 'IN_CONSULTATION', updatedAt: now })
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, token.encounterId)));

      return updated as unknown as StoredQueueToken;
    } catch (err) {
      logger.error('Failed to start queue token in database', err);
      throw new AppError({
        message: 'Database update failed. Consultation start aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async completeQueueToken(tenantId: string, queueId: string, dbClient = getDatabase()): Promise<StoredQueueToken> {
    const db = requireDb(dbClient);
    const token = await this.getQueueTokenById(tenantId, queueId, db);
    if (!token) {
      throw new AppError({
        message: `Queue token not found: ${queueId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const now = new Date();
    try {
      const [updated] = await db
        .update(encounterQueues)
        .set({ queueStatus: 'COMPLETED', updatedAt: now })
        .where(and(eq(encounterQueues.tenantId, tenantId), eq(encounterQueues.id, queueId)))
        .returning();

      return updated as unknown as StoredQueueToken;
    } catch (err) {
      logger.error('Failed to complete queue token in database', err);
      throw new AppError({
        message: 'Database update failed. Token completion aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 4. DOCTOR CONSULTATION & CHILD DOMAIN ENTITIES
  // =========================================================================

  async getConsultationByEncounter(tenantId: string, encounterId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(consultations)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.encounterId, encounterId)));
      if (!found) return null;
      const meta = ((found as any).metadata as any) || {};

      const vitals = await db
        .select()
        .from(consultationVitals)
        .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.consultationId, found.id)));
      const diagnoses = await db
        .select()
        .from(consultationDiagnoses)
        .where(and(eq(consultationDiagnoses.tenantId, tenantId), eq(consultationDiagnoses.consultationId, found.id)));
      const medications = await db
        .select()
        .from(consultationMedications)
        .where(and(eq(consultationMedications.tenantId, tenantId), eq(consultationMedications.consultationId, found.id)));
      const followups = await db
        .select()
        .from(consultationFollowups)
        .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, found.id)));

      return {
        ...(found as unknown as StoredConsultation),
        status: (found as any).consultationStatus || 'IN_PROGRESS',
        labInvestigations: meta.labInvestigations || [],
        vitals,
        diagnoses,
        medications,
        followups
      };
    } catch (err) {
      logger.error('Failed to query consultation by encounter in database', err);
      throw new AppError({
        message: 'Database query failed. Consultation lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getConsultationById(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(consultations)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.id, consultationId)));
      if (!found) return null;
      const meta = ((found as any).metadata as any) || {};

      const vitals = await db
        .select()
        .from(consultationVitals)
        .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.consultationId, consultationId)));
      const diagnoses = await db
        .select()
        .from(consultationDiagnoses)
        .where(and(eq(consultationDiagnoses.tenantId, tenantId), eq(consultationDiagnoses.consultationId, consultationId)));
      const medications = await db
        .select()
        .from(consultationMedications)
        .where(and(eq(consultationMedications.tenantId, tenantId), eq(consultationMedications.consultationId, consultationId)));
      const followups = await db
        .select()
        .from(consultationFollowups)
        .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, consultationId)));

      return {
        ...(found as unknown as StoredConsultation),
        status: (found as any).consultationStatus || 'IN_PROGRESS',
        labInvestigations: meta.labInvestigations || [],
        vitals,
        diagnoses,
        medications,
        followups
      };
    } catch (err) {
      logger.error('Failed to query consultation by ID in database', err);
      throw new AppError({
        message: 'Database query failed. Consultation lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async saveConsultation(input: SaveConsultationInput, dbClient = getDatabase()): Promise<StoredConsultation> {
    const db = requireDb(dbClient);

    const partnerId = input.partnerId || '00000000-0000-4000-8000-000000000001';
    const organizationId = input.organizationId || '00000000-0000-4000-8000-000000000002';
    const branchId = input.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const doctorId = input.doctorId || '99999999-9999-4999-8999-999999999999';

    // Check if consultation already exists for this encounter
    const existing = await this.getConsultationByEncounter(input.tenantId, input.encounterId, db);

    let consultationId = existing?.id;
    const consNumber = existing?.consultationNumber || `CON-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    if (!existing) {
      consultationId = crypto.randomUUID();
      try {
        await db.insert(consultations).values({
          id: consultationId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          encounterId: input.encounterId,
          patientId: input.patientId,
          doctorId,
          consultationNumber: consNumber,
          consultationStatus: input.status || 'IN_PROGRESS',
          chiefComplaint: input.chiefComplaint || '',
          historyOfPresentIllness: input.historyOfPresentIllness || '',
          pastMedicalHistory: input.pastMedicalHistory || '',
          examinationNotes: input.examinationNotes || '',
          assessmentNotes: input.assessmentNotes || '',
          planNotes: input.planNotes || '',
          createdBy: doctorId,
          updatedBy: doctorId,
          metadata: {
            labInvestigations: input.labInvestigations || (input as any).investigations || []
          },
          createdAt: now,
          updatedAt: now
        } as unknown as typeof consultations.$inferInsert);
      } catch (err) {
        logger.error('Failed to insert consultation in database', err);
        throw new AppError({
          message: 'Database persistence failed. Clinical consultation draft aborted.',
          code: ErrorCode.SERVICE_UNAVAILABLE,
          statusCode: 503
        });
      }
    } else {
      try {
        await db
          .update(consultations)
          .set({
            consultationStatus: input.status || existing.status,
            chiefComplaint: input.chiefComplaint ?? existing.chiefComplaint,
            historyOfPresentIllness: input.historyOfPresentIllness ?? existing.historyOfPresentIllness,
            pastMedicalHistory: input.pastMedicalHistory ?? existing.pastMedicalHistory,
            examinationNotes: input.examinationNotes ?? existing.examinationNotes,
            assessmentNotes: input.assessmentNotes ?? existing.assessmentNotes,
            planNotes: input.planNotes ?? existing.planNotes,
            metadata: {
              labInvestigations: input.labInvestigations ?? (input as any).investigations ?? (existing as any).metadata?.labInvestigations ?? []
            },
            updatedBy: doctorId,
            updatedAt: now
          } as unknown as typeof consultations.$inferInsert)
          .where(and(eq(consultations.tenantId, input.tenantId), eq(consultations.id, consultationId!)));
      } catch (err) {
        logger.error('Failed to update consultation in database', err);
        throw new AppError({
          message: 'Database update failed. Clinical consultation draft aborted.',
          code: ErrorCode.SERVICE_UNAVAILABLE,
          statusCode: 503
        });
      }
    }

    // Persist child vitals
    if (input.vitals) {
      try {
        const v = input.vitals;
        await db.insert(consultationVitals).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          consultationId: consultationId!,
          patientId: input.patientId,
          temperatureCelsius: v.temperatureCelsius ? String(v.temperatureCelsius) : (v.temperatureFahrenheit ? String(((v.temperatureFahrenheit - 32) * 5 / 9).toFixed(1)) : '37.0'),
          pulseBpm: v.pulseBpm || v.heartRateBpm || 72,
          respiratoryRateBpm: v.respiratoryRateBpm || 16,
          systolicBp: v.systolicBp || 120,
          diastolicBp: v.diastolicBp || 80,
          oxygenSaturationPercent: v.oxygenSaturationPercent || v.spO2Percentage || 99,
          weightKg: v.weightKg ? String(v.weightKg) : null,
          heightCm: v.heightCm ? String(v.heightCm) : null,
          bmi: v.bmi ? String(v.bmi) : null,
          recordedBy: doctorId,
          recordedAt: now
        } as any);
      } catch (err) {
        logger.warn('Failed to insert vitals', { error: String(err) });
      }
    }

    // Persist child diagnoses
    if (Array.isArray(input.diagnoses) && input.diagnoses.length > 0) {
      for (const d of input.diagnoses) {
        try {
          await db.insert(consultationDiagnoses).values({
            id: crypto.randomUUID(),
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            consultationId: consultationId!,
            patientId: input.patientId,
            diagnosisCode: d.diagnosisCode || d.code || 'R69',
            diagnosisName: d.diagnosisName || d.description || 'Illness, unspecified',
            diagnosisType: d.type || (d.isPrimary ? 'PRIMARY' : 'SECONDARY'),
            clinicalStatus: 'ACTIVE',
            recordedBy: doctorId,
            recordedAt: now
          } as any);
        } catch (err) {
          logger.warn('Failed to insert diagnosis', { error: String(err) });
        }
      }
    }

    // Persist child medications
    const medList = input.medications || (input as any).prescriptions;
    if (Array.isArray(medList) && medList.length > 0) {
      for (const m of medList) {
        try {
          const medName = m.medicationName || m.drugName || 'Generic Drug';
          const duration = typeof m.duration === 'number' ? m.duration : (Number.parseInt(String(m.duration || m.durationDays || '5'), 10) || 5);
          await db.insert(consultationMedications).values({
            id: crypto.randomUUID(),
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            consultationId: consultationId!,
            patientId: input.patientId,
            medicationName: medName,
            genericName: m.genericName || medName,
            strength: m.strength || '500mg',
            dosage: m.dosage || '1 unit',
            route: m.route || 'ORAL',
            frequency: m.frequency || 'BID',
            duration,
            durationUnit: m.durationUnit || 'DAYS',
            quantity: m.quantity || 10,
            instructions: m.instructions || 'As advised',
            beforeAfterFood: m.beforeAfterFood || 'AFTER_FOOD',
            status: 'ACTIVE',
            prescribedBy: doctorId,
            prescribedAt: now
          } as any);
        } catch (err) {
          logger.warn('Failed to insert consultation medication', { error: String(err) });
        }
      }
    }

    // Persist follow-up advice
    if (input.followUpAdvice || input.followUpDate || input.followUpWindow) {
      try {
        await db.insert(consultationFollowups).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          consultationId: consultationId!,
          patientId: input.patientId,
          followUpRequired: true,
          recommendedDate: input.followUpDate || '2026-09-10',
          recommendedWindow: input.followUpWindow || 'AFTER_1_WEEK',
          reason: input.followUpAdvice || 'Follow-up consultation',
          status: 'PENDING',
          recordedBy: doctorId,
          recordedAt: now
        } as any);
      } catch (err) {
        logger.warn('Failed to insert consultation follow-up', { error: String(err) });
      }
    }

    return {
      id: consultationId!,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      encounterId: input.encounterId,
      patientId: input.patientId,
      doctorId,
      consultationNumber: consNumber,
      status: input.status || 'IN_PROGRESS',
      chiefComplaint: input.chiefComplaint || '',
      historyOfPresentIllness: input.historyOfPresentIllness || '',
      pastMedicalHistory: input.pastMedicalHistory || '',
      examinationNotes: input.examinationNotes || '',
      assessmentNotes: input.assessmentNotes || '',
      planNotes: input.planNotes || '',
      vitals: input.vitals || null,
      diagnoses: input.diagnoses || [],
      medications: medList || [],
      labInvestigations: input.labInvestigations || (input as any).investigations || [],
      followUpAdvice: input.followUpAdvice || '',
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
  }

  async finalizeConsultation(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    const db = requireDb(dbClient);
    try {
      const [updated] = await db
        .update(consultations)
        .set({ consultationStatus: 'FINALIZED', completedAt: new Date(), updatedAt: new Date() } as unknown as typeof consultations.$inferInsert)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.id, consultationId)))
        .returning();
      if (!updated) return null;
      return {
        ...(updated as unknown as StoredConsultation),
        status: 'FINALIZED'
      };
    } catch (err) {
      logger.error('Failed to finalize consultation in database', err);
      throw new AppError({
        message: 'Database update failed. Consultation finalization aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 5. DIGITAL PRESCRIPTION PERSISTENCE (POSTGRESQL-BACKED)
  // =========================================================================

  async getPrescriptionsByConsultation(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredPrescription[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.consultationId, consultationId)));

      const results: StoredPrescription[] = [];
      for (const r of rows) {
        const items = await db
          .select()
          .from(pharmacyPrescriptionItems)
          .where(and(eq(pharmacyPrescriptionItems.tenantId, tenantId), eq(pharmacyPrescriptionItems.prescriptionId, r.id)));
        results.push({
          ...(r as any),
          items
        });
      }
      return results;
    } catch (err) {
      logger.error('Failed to query prescriptions from database', err);
      throw new AppError({
        message: 'Database query failed. Prescription lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPrescriptionById(tenantId: string, prescriptionId: string, dbClient = getDatabase()): Promise<StoredPrescription | null> {
    const db = requireDb(dbClient);
    try {
      const [r] = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.id, prescriptionId)));

      if (!r) return null;

      const items = await db
        .select()
        .from(pharmacyPrescriptionItems)
        .where(and(eq(pharmacyPrescriptionItems.tenantId, tenantId), eq(pharmacyPrescriptionItems.prescriptionId, r.id)));

      const formattedItems = items.map((it: any) => {
        const meta: any = it.metadata || {};
        return {
          ...it,
          medicationName: meta['medicationName'] || it['medicationName'] || meta['drugName'] || 'Medication',
          genericName: meta['genericName'] || it['genericName'],
          strength: meta['strength'] || it['strength'] || ''
        };
      });

      return {
        ...(r as any),
        items: formattedItems
      };
    } catch (err) {
      logger.error('Failed to query prescription by ID from database', err);
      throw new AppError({
        message: 'Database query failed. Prescription lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createPrescription(input: CreatePrescriptionInput, dbClient = getDatabase()): Promise<StoredPrescription> {
    const db = requireDb(dbClient);

    // Idempotency: If prescription already exists for consultation, return existing
    if (input.consultationId) {
      const existing = await this.getPrescriptionsByConsultation(input.tenantId, input.consultationId, db);
      if (existing.length > 0 && existing[0]) {
        logger.info('Prescription already exists for consultation. Returning existing record.', { id: existing[0].id });
        return existing[0];
      }
    }

    const prescriptionId = crypto.randomUUID();
    const prescriptionNumber = `RX-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const partnerId = input.partnerId || '00000000-0000-4000-8000-000000000001';
    const organizationId = input.organizationId || '00000000-0000-4000-8000-000000000002';
    const branchId = input.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const doctorId = input.prescribingDoctorId || '99999999-9999-4999-8999-999999999999';

    let encounterId = input.encounterId;
    if (!encounterId) {
      try {
        const [enc] = await db
          .select()
          .from(encounters)
          .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.patientId, input.patientId)))
          .orderBy(desc(encounters.createdAt))
          .limit(1);
        if (enc) encounterId = enc.id;
      } catch {
        // ignore
      }
    }
    if (!encounterId) {
      encounterId = crypto.randomUUID();
      try {
        await db.insert(encounters).values({
          id: encounterId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          departmentId: '00000000-0000-4000-8000-000000000004',
          patientId: input.patientId,
          encounterNumber: `ENC-RX-${Math.floor(100000 + Math.random() * 900000)}`,
          encounterType: 'OPD',
          status: 'COMPLETED',
          chiefComplaint: 'OPD Prescription Order',
          createdAt: now,
          updatedAt: now
        } as any);
      } catch (encErr) {
        logger.warn('Failed to insert fallback encounter for prescription', { error: String(encErr) });
      }
    }

    try {
      const [rx] = await db.insert(pharmacyPrescriptions).values({
        id: prescriptionId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        prescriptionNumber,
        patientId: input.patientId,
        encounterId,
        consultationId: input.consultationId || null,
        prescribingDoctorId: doctorId,
        priority: input.priority || 'ROUTINE',
        status: 'CREATED',
        notes: input.notes || 'OPD Digital Prescription',
        prescribedAt: now,
        createdAt: now,
        updatedAt: now
      } as any).returning();

      if (!rx) {
        throw new Error('Insert returned empty prescription record');
      }

      const insertedItems: any[] = [];
      const items = input.items || [];
      for (const item of items) {
        let qty = 10;
        if (typeof item.prescribedQuantity === 'number') qty = item.prescribedQuantity;
        else if (typeof item.quantity === 'number') qty = item.quantity;
        else if (typeof item.prescribedQuantity === 'string') qty = parseInt(item.prescribedQuantity, 10) || 10;
        else if (typeof item.quantity === 'string') qty = parseInt(item.quantity, 10) || 10;

        let durationNum = 5;
        if (typeof item.duration === 'number') durationNum = item.duration;
        else if (typeof item.duration === 'string') durationNum = parseInt(item.duration, 10) || 5;

        const [insertedItem] = await db.insert(pharmacyPrescriptionItems).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          prescriptionId: rx.id,
          medicationId: item.medicationId || '00000000-0000-4000-8000-000000000060',
          prescribedQuantity: qty,
          remainingQuantity: qty,
          unit: 'TABLET',
          dosage: item.dosage || '1 tablet',
          frequency: item.frequency || 'BID',
          route: item.route || 'ORAL',
          duration: durationNum,
          durationUnit: item.durationUnit || 'DAYS',
          fulfillmentStatus: 'PENDING',
          instructions: item.instructions || 'Take after meals',
          metadata: {
            medicationName: item.medicationName || (item as any)['drugName'],
            genericName: (item as any)['genericName'],
            strength: (item as any)['strength'],
            ...(((item as any)['metadata'] as Record<string, any>) || {})
          },
          createdAt: now,
          updatedAt: now
        } as any).returning();
        insertedItems.push({
          ...insertedItem,
          medicationName: item.medicationName || (item as any)['drugName'],
          genericName: (item as any)['genericName'],
          strength: (item as any)['strength']
        });
      }

      return {
        id: rx.id,
        tenantId: rx.tenantId,
        partnerId: rx.partnerId,
        organizationId: rx.organizationId,
        branchId: rx.branchId,
        prescriptionNumber: rx.prescriptionNumber,
        patientId: rx.patientId,
        encounterId: rx.encounterId,
        consultationId: rx.consultationId,
        prescribingDoctorId: rx.prescribingDoctorId,
        priority: rx.priority,
        status: rx.status,
        notes: rx.notes,
        items: insertedItems,
        createdAt: rx.createdAt
      };
    } catch (err) {
      logger.error('Failed to create prescription in database', err);
      throw new AppError({
        message: 'Database persistence failed. Digital prescription creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 6. CONSULTATION COMPLETION & FULL DOWNSTREAM ORCHESTRATION
  // =========================================================================

  async completeConsultationWorkflow(
    tenantId: string,
    consultationId: string,
    doctorId?: string,
    dbClient = getDatabase()
  ): Promise<ConsultationWorkflowResult> {
    const db = requireDb(dbClient);

    const consultation = await this.getConsultationById(tenantId, consultationId, db);
    if (!consultation) {
      throw new AppError({
        message: `Consultation not found: ${consultationId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const effectiveDoctorId = doctorId || consultation.doctorId || '99999999-9999-4999-8999-999999999999';

    // Idempotency: If already finalized, retrieve and return all existing connected entities
    if (consultation.status === 'FINALIZED') {
      logger.info('Consultation already finalized. Returning existing downstream records.', { consultationId });
      const encounter = await this.getEncounterById(tenantId, consultation.encounterId, db);
      const queueList = await this.getQueue(tenantId, undefined, db);
      const queueToken = queueList.find(q => q.encounterId === consultation.encounterId) || null;
      const prescriptions = await this.getPrescriptionsByConsultation(tenantId, consultationId, db);
      const prescription = prescriptions[0] || null;

      // Look up pharmacy order in dispensing queue
      const pharmOrders = await db
        .select()
        .from(pharmacyDispensing)
        .where(and(eq(pharmacyDispensing.tenantId, tenantId), eq(pharmacyDispensing.patientId, consultation.patientId)));
      const pharmacyOrder = prescription ? pharmOrders.find(p => p.prescriptionId === prescription.id) : null;

      // Look up lab orders
      const labOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, consultation.patientId, db);
      const relatedLabOrders = labOrders.filter(l => l.encounterId === consultation.encounterId);

      // Look up follow-up
      const followUps = await db
        .select()
        .from(consultationFollowups)
        .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, consultationId)));

      return {
        consultation,
        encounter,
        queueToken,
        prescription,
        pharmacyOrder: pharmacyOrder || null,
        labOrders: relatedLabOrders,
        followUp: followUps[0] || null
      };
    }

    // 1. Finalize Consultation
    const finalizedCons = await this.finalizeConsultation(tenantId, consultationId, db);

    // 2. Complete Encounter
    const encounter = await this.updateEncounterStatus(tenantId, consultation.encounterId, 'COMPLETED', db);

    // 3. Complete Queue Token
    let queueToken: StoredQueueToken | null = null;
    const queueList = await this.getQueue(tenantId, undefined, db);
    const linkedToken = queueList.find(q => q.encounterId === consultation.encounterId);
    if (linkedToken) {
      queueToken = await this.completeQueueToken(tenantId, linkedToken.id, db);
    }

    // 4. Downstream: Digital Prescription & Pharmacy Order
    let prescription: StoredPrescription | null = null;
    let pharmacyOrder: any = null;

    // Check if consultation has medications
    const dbMeds = await db
      .select()
      .from(consultationMedications)
      .where(and(eq(consultationMedications.tenantId, tenantId), eq(consultationMedications.consultationId, consultationId)));

    const medItems = (consultation.medications && consultation.medications.length > 0)
      ? consultation.medications
      : dbMeds;

    if (medItems && medItems.length > 0) {
      // Create digital prescription
      prescription = await this.createPrescription({
        tenantId,
        partnerId: consultation.partnerId,
        organizationId: consultation.organizationId,
        branchId: consultation.branchId,
        patientId: consultation.patientId,
        encounterId: consultation.encounterId,
        consultationId,
        prescribingDoctorId: effectiveDoctorId,
        items: medItems.map((m: any) => ({
          medicationId: '00000000-0000-4000-8000-000000000060',
          dosage: m.dosage || '1 unit',
          frequency: m.frequency || 'BID',
          route: m.route || 'ORAL',
          duration: typeof m.duration === 'number' ? m.duration : 5,
          durationUnit: m.durationUnit || 'DAYS',
          prescribedQuantity: m.quantity || 10,
          instructions: m.instructions || 'As advised'
        }))
      }, db);

      // Create Pharmacy Order in Pharmacy Dispensing Queue (status: PENDING)
      const dispensingNumber = `DISP-${Math.floor(100000 + Math.random() * 900000)}`;
      const [newDispensing] = await db.insert(pharmacyDispensing).values({
        id: crypto.randomUUID(),
        tenantId,
        partnerId: consultation.partnerId,
        organizationId: consultation.organizationId,
        branchId: consultation.branchId,
        dispensingNumber,
        prescriptionId: prescription.id,
        patientId: consultation.patientId,
        pharmacistId: '00000000-0000-4000-8000-000000000000',
        pharmacistName: 'Unassigned Pharmacy Queue',
        dispensingStatus: 'PENDING',
        dispensingMode: 'OUTPATIENT_COUNTER',
        counselingProvided: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any).returning();
      pharmacyOrder = newDispensing;
    }

    // 5. Downstream: Lab Investigation Orders (Pathology Queue)
    const labOrders: any[] = [];
    const labInvestigations = consultation.labInvestigations;
    if (labInvestigations && (Array.isArray(labInvestigations) ? labInvestigations.length > 0 : Object.keys(labInvestigations).length > 0)) {
      const testNames: string[] = Array.isArray(labInvestigations)
        ? labInvestigations.map((t: any) => typeof t === 'string' ? t : (t.testName || t.name || 'Diagnostic Test'))
        : (labInvestigations.testNames || ['Complete Blood Count']);

      const createdLabs = await this.bridgeDiagnosticOrders(
        tenantId,
        consultation.patientId,
        consultation.encounterId,
        effectiveDoctorId,
        testNames,
        db
      );
      labOrders.push(...createdLabs);
    }

    // 6. Downstream: Follow-up Scheduling
    let followUp: any = null;
    const followUps = await db
      .select()
      .from(consultationFollowups)
      .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, consultationId)));

    if (followUps.length > 0) {
      followUp = followUps[0];
    } else if (consultation.followUpAdvice) {
      const [createdFol] = await db.insert(consultationFollowups).values({
        id: crypto.randomUUID(),
        tenantId,
        partnerId: consultation.partnerId,
        organizationId: consultation.organizationId,
        consultationId,
        patientId: consultation.patientId,
        followUpRequired: true,
        recommendedDate: '2026-09-10',
        recommendedWindow: 'AFTER_1_WEEK',
        reason: consultation.followUpAdvice,
        status: 'PENDING',
        recordedBy: effectiveDoctorId,
        recordedAt: new Date()
      } as any).returning();
      followUp = createdFol;
    }

    return {
      consultation: finalizedCons || consultation,
      encounter,
      queueToken,
      prescription,
      pharmacyOrder,
      labOrders,
      followUp
    };
  }

  // =========================================================================
  // 7. DOWNSTREAM FAILURE RECOVERY & RETRY
  // =========================================================================

  async retryDownstreamOrders(
    tenantId: string,
    consultationId: string,
    dbClient = getDatabase()
  ): Promise<ConsultationWorkflowResult> {
    const db = requireDb(dbClient);
    const consultation = await this.getConsultationById(tenantId, consultationId, db);
    if (!consultation) {
      throw new AppError({
        message: `Consultation not found: ${consultationId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    logger.info('Executing idempotent retry for downstream orders', { consultationId });
    return this.completeConsultationWorkflow(tenantId, consultationId, consultation.doctorId, db);
  }

  // =========================================================================
  // 8. DIAGNOSTIC BRIDGE & CLINICAL HISTORY
  // =========================================================================

  async bridgeDiagnosticOrders(
    tenantId: string,
    patientId: string,
    encounterId: string,
    doctorId: string,
    testNames: string[],
    dbClient = getDatabase()
  ) {
    const db = requireDb(dbClient);
    let partnerId = '00000000-0000-4000-8000-000000000001';
    let organizationId = '00000000-0000-4000-8000-000000000002';
    let branchId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    try {
      const [enc] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)));
      if (enc) {
        partnerId = enc.partnerId || partnerId;
        organizationId = enc.organizationId || organizationId;
        branchId = enc.branchId || branchId;
      }
    } catch {
      // Use defaults if lookup fails
    }

    // Check existing lab orders for this encounter to prevent duplicates on retry
    const existingOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, patientId, db);
    const existingEncounterOrders = existingOrders.filter(o => o.encounterId === encounterId);

    const createdOrders = [];
    for (const testName of testNames) {
      const alreadyCreated = existingEncounterOrders.find(o => o.testName === testName);
      if (alreadyCreated) {
        logger.info('Duplicate lab order prevented. Returning existing order.', { orderId: alreadyCreated.id, testName });
        createdOrders.push(alreadyCreated);
        continue;
      }

      const order = await labDiagnosticsRepository.createOrder({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId,
        encounterId,
        orderingDoctorId: doctorId,
        testName,
        category: testName.includes('CBC') || testName.includes('Blood Count') ? 'HEMATOLOGY' : 'BIOCHEMISTRY',
        priority: 'ROUTINE',
        clinicalNotes: `Ordered during OPD Consultation (Enc: ${encounterId}, Doctor: ${doctorId})`
      }, db);
      createdOrders.push(order);
    }
    return createdOrders;
  }

  async getPatientClinicalHistory(tenantId: string, patientId: string, dbClient = getDatabase()) {
    const db = requireDb(dbClient);
    try {
      const patientEncounters = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.patientId, patientId)));
      const patientConsultations = await db
        .select()
        .from(consultations)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.patientId, patientId)));
      const labOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, patientId, db);
      const prescriptions = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.patientId, patientId)));

      const populatedConsultations = await Promise.all(
        patientConsultations.map(async (c) => {
          const vitals = await db
            .select()
            .from(consultationVitals)
            .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.consultationId, c.id)));
          const diagnoses = await db
            .select()
            .from(consultationDiagnoses)
            .where(and(eq(consultationDiagnoses.tenantId, tenantId), eq(consultationDiagnoses.consultationId, c.id)));
          const medications = await db
            .select()
            .from(consultationMedications)
            .where(and(eq(consultationMedications.tenantId, tenantId), eq(consultationMedications.consultationId, c.id)));
          const followups = await db
            .select()
            .from(consultationFollowups)
            .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, c.id)));

          return {
            ...c,
            status: (c as any).consultationStatus || 'FINALIZED',
            vitals,
            diagnoses,
            medications,
            followups
          };
        })
      );

      return {
        patientId,
        encounters: patientEncounters,
        consultations: populatedConsultations,
        labOrders,
        prescriptions,
        totalEncounters: patientEncounters.length,
        totalLabOrders: labOrders.length,
        totalPrescriptions: prescriptions.length
      };
    } catch (err) {
      logger.error('Failed to query patient clinical history from database', err);
      throw new AppError({
        message: 'Database query failed. Clinical history lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async searchIcd10(query?: string) {
    if (!query) return ICD10_CATALOGUE;
    const q = query.toLowerCase();
    return ICD10_CATALOGUE.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }

  async getGenericAlternatives(drugQuery?: string) {
    if (!drugQuery) return GENERIC_DRUG_CATALOGUE;
    const q = drugQuery.toLowerCase();
    return GENERIC_DRUG_CATALOGUE.filter(d => 
      d.brandName.toLowerCase().includes(q) || 
      d.genericName.toLowerCase().includes(q)
    );
  }
}

export const clinicalWorkflowRepository = new ClinicalWorkflowRepository();
