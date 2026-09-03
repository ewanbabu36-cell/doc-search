import {
  getDatabase,
  patients,
  encounters,
  consultations,
  eq,
  and,
  desc,
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
  patientId: string;
  doctorId?: string;
  encounterType?: string;
  status?: string;
  chiefComplaint?: string;
  visitType?: string;
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
    temperatureFahrenheit?: number;
    systolicBp?: number;
    diastolicBp?: number;
    heartRateBpm?: number;
    respiratoryRateBpm?: number;
    spO2Percentage?: number;
    oxygenSaturationPercent?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number | string;
  };
  diagnoses?: Array<{
    code?: string;
    description?: string;
    diagnosisCode?: string;
    diagnosisName?: string;
    isPrimary?: boolean;
    type?: 'PROVISIONAL' | 'FINAL';
  }>;
  medications?: Array<{
    drugName?: string;
    genericName?: string;
    medicationName?: string;
    strength?: string;
    dosage?: string;
    frequency?: string;
    duration?: string | number;
    durationUnit?: string;
    durationDays?: number;
    instructions?: string;
  }>;
  labInvestigations?: any;
  followUpAdvice?: string;
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
  vitals?: SaveConsultationInput['vitals'] | null;
  diagnoses?: SaveConsultationInput['diagnoses'];
  medications?: SaveConsultationInput['medications'];
  labInvestigations?: SaveConsultationInput['labInvestigations'];
  followUpAdvice?: string;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
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

  async createPatient(input: CreatePatientInput, dbClient = getDatabase()): Promise<Patient> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const mrn = input.mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const record = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      patientCode: `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
      mrn,
      firstName: input.firstName,
      lastName: input.lastName,
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

  async createEncounter(input: CreateEncounterInput, dbClient = getDatabase()): Promise<Encounter> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const encNumber = `ENC-${Math.floor(100000 + Math.random() * 900000)}`;
    const record = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      departmentId: '00000000-0000-4000-8000-000000000004',
      patientId: input.patientId,
      doctorId: input.doctorId || null,
      encounterNumber: encNumber,
      encounterType: input.encounterType || 'OPD',
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

  async updateEncounterStatus(tenantId: string, encounterId: string, status: string, dbClient = getDatabase()): Promise<Encounter | null> {
    const db = requireDb(dbClient);
    try {
      const [updated] = await db
        .update(encounters)
        .set({ status, updatedAt: new Date() })
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

  async getConsultationByEncounter(tenantId: string, encounterId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(consultations)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.encounterId, encounterId)));
      return (found as unknown as StoredConsultation) || null;
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
      return (found as unknown as StoredConsultation) || null;
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
    const id = crypto.randomUUID();
    const consNumber = `CON-${Math.floor(100000 + Math.random() * 900000)}`;
    const record: StoredConsultation = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      encounterId: input.encounterId,
      patientId: input.patientId,
      doctorId: input.doctorId,
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
      medications: input.medications || [],
      labInvestigations: input.labInvestigations || [],
      followUpAdvice: input.followUpAdvice || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const [created] = await db.insert(consultations).values({
        id: record.id,
        tenantId: record.tenantId,
        partnerId: record.partnerId,
        organizationId: record.organizationId,
        branchId: record.branchId,
        encounterId: record.encounterId,
        patientId: record.patientId,
        doctorId: record.doctorId,
        consultationNumber: record.consultationNumber,
        consultationStatus: record.status,
        chiefComplaint: record.chiefComplaint,
        historyOfPresentIllness: record.historyOfPresentIllness,
        pastMedicalHistory: record.pastMedicalHistory,
        examinationNotes: record.examinationNotes,
        assessmentNotes: record.assessmentNotes,
        planNotes: record.planNotes,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      } as unknown as typeof consultations.$inferInsert).returning();

      if (!created) {
        throw new Error('Insert returned empty result');
      }
      return record;
    } catch (err) {
      logger.error('Failed to save consultation in database', err);
      throw new AppError({
        message: 'Database persistence failed. Clinical consultation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async finalizeConsultation(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    const db = requireDb(dbClient);
    try {
      const [updated] = await db
        .update(consultations)
        .set({ consultationStatus: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() } as unknown as typeof consultations.$inferInsert)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.id, consultationId)))
        .returning();
      return (updated as unknown as StoredConsultation) || null;
    } catch (err) {
      logger.error('Failed to finalize consultation in database', err);
      throw new AppError({
        message: 'Database update failed. Consultation finalization aborted.',
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

  async bridgeDiagnosticOrders(tenantId: string, patientId: string, encounterId: string, doctorId: string, testNames: string[]) {
    const createdOrders = [];
    for (const testName of testNames) {
      const order = await labDiagnosticsRepository.createOrder({
        tenantId,
        patientId,
        testName,
        category: testName.includes('CBC') || testName.includes('Blood Count') ? 'HEMATOLOGY' : 'BIOCHEMISTRY',
        priority: 'ROUTINE',
        clinicalNotes: `Ordered during OPD Consultation (Enc: ${encounterId}, Doctor: ${doctorId})`
      });
      createdOrders.push(order);
    }
    return createdOrders;
  }

  async getPatientClinicalHistory(tenantId: string, patientId: string, dbClient = getDatabase()) {
    const db = requireDb(dbClient);
    try {
      const patientConsultations = await db
        .select()
        .from(consultations)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.patientId, patientId)));
      const labOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, patientId, dbClient);

      return {
        patientId,
        consultations: patientConsultations,
        labOrders,
        totalEncounters: patientConsultations.length,
        totalLabOrders: labOrders.length
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
}

export const clinicalWorkflowRepository = new ClinicalWorkflowRepository();
