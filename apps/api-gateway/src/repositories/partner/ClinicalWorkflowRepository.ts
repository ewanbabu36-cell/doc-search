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
import { labDiagnosticsRepository } from './LabDiagnosticsRepository.js';

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
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  examinationNotes?: string;
  assessmentNotes?: string;
  planNotes?: string;
  status?: string;
  vitals?: {
    temperatureFahrenheit?: number;
    heartRateBpm?: number;
    respiratoryRateBpm?: number;
    systolicBp?: number;
    diastolicBp?: number;
    oxygenSaturationPercent?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
  };
  diagnoses?: Array<{
    diagnosisCode: string;
    diagnosisName: string;
    isPrimary?: boolean;
  }>;
  medications?: Array<{
    medicationName: string;
    genericName?: string;
    strength: string;
    dosage: string;
    route?: string;
    frequency: string;
    duration: number;
    durationUnit?: string;
    instructions?: string;
    beforeAfterFood?: string;
    isGenericAccepted?: boolean;
    janAushadhiPrice?: number;
    brandPrice?: number;
  }>;
  labInvestigations?: string[];
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
  vitals: SaveConsultationInput['vitals'] | null;
  diagnoses: SaveConsultationInput['diagnoses'];
  medications: SaveConsultationInput['medications'];
  labInvestigations?: string[];
  followUpAdvice?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const ICD10_CATALOGUE = [
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
  { code: 'E11.65', name: 'Type 2 diabetes mellitus with hyperglycemia', category: 'Endocrine' },
  { code: 'I10', name: 'Essential (primary) hypertension', category: 'Cardiovascular' },
  { code: 'E78.5', name: 'Hyperlipidemia, unspecified', category: 'Endocrine' },
  { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified', category: 'Respiratory' },
  { code: 'J20.9', name: 'Acute bronchitis, unspecified', category: 'Respiratory' },
  { code: 'K21.9', name: 'Gastro-esophageal reflux disease without esophagitis', category: 'Gastroenterology' },
  { code: 'R53.83', name: 'Other fatigue and lethargy', category: 'General' },
  { code: 'M54.5', name: 'Low back pain', category: 'Musculoskeletal' },
  { code: 'N39.0', name: 'Urinary tract infection, site not specified', category: 'Genitourinary' },
  { code: 'A09', name: 'Infectious gastroenteritis and colitis, unspecified', category: 'Infectious' }
];

export const GENERIC_DRUG_CATALOGUE = [
  {
    brandName: 'Glycomet 500mg',
    genericName: 'Metformin Hydrochloride 500mg',
    brandPrice: 65.0,
    janAushadhiPrice: 12.5,
    savingsPercent: 80,
    manufacturer: 'PMBJP (Pradhan Mantri Bhartiya Janaushadhi Pariyojana)',
    form: 'Tablet'
  },
  {
    brandName: 'Atorva 10mg',
    genericName: 'Atorvastatin Calcium 10mg',
    brandPrice: 110.0,
    janAushadhiPrice: 22.0,
    savingsPercent: 80,
    manufacturer: 'PMBJP',
    form: 'Tablet'
  },
  {
    brandName: 'Telma 40mg',
    genericName: 'Telmisartan 40mg',
    brandPrice: 145.0,
    janAushadhiPrice: 28.0,
    savingsPercent: 81,
    manufacturer: 'PMBJP',
    form: 'Tablet'
  },
  {
    brandName: 'Pan 40mg',
    genericName: 'Pantoprazole Sodium 40mg',
    brandPrice: 120.0,
    janAushadhiPrice: 25.0,
    savingsPercent: 79,
    manufacturer: 'PMBJP',
    form: 'Tablet'
  },
  {
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin and Potassium Clavulanate 625mg',
    brandPrice: 210.0,
    janAushadhiPrice: 68.0,
    savingsPercent: 68,
    manufacturer: 'PMBJP',
    form: 'Tablet'
  }
];

export class ClinicalWorkflowRepository {
  private memPatients = new Map<string, Patient[]>();
  private memEncounters = new Map<string, Encounter[]>();
  private memConsultations = new Map<string, StoredConsultation[]>();

  async searchPatients(tenantId: string, query?: string, dbClient = getDatabase()): Promise<Patient[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(patients)
          .where(eq(patients.tenantId, tenantId))
          .orderBy(desc(patients.createdAt));
        if (rows.length > 0) {
          if (!query) return rows;
          const q = query.toLowerCase();
          return rows.filter(r => 
            (r.firstName && r.firstName.toLowerCase().includes(q)) ||
            (r.lastName && r.lastName.toLowerCase().includes(q)) ||
            (r.mrn && r.mrn.toLowerCase().includes(q)) ||
            (r.patientCode && r.patientCode.toLowerCase().includes(q))
          );
        }
      } catch {
        // Fallback
      }
    }
    const list = this.memPatients.get(tenantId) || [];
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(r => 
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      r.mrn.toLowerCase().includes(q) ||
      r.patientCode.toLowerCase().includes(q)
    );
  }

  async createPatient(input: CreatePatientInput, dbClient = getDatabase()): Promise<Patient> {
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

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(patients).values(record as unknown as typeof patients.$inferInsert).returning();
        if (created) return created;
      } catch {
        // Fallback
      }
    }

    const current = this.memPatients.get(input.tenantId) || [];
    current.unshift(record as unknown as Patient);
    this.memPatients.set(input.tenantId, current);
    return record as unknown as Patient;
  }

  async getPatientById(tenantId: string, patientId: string, dbClient = getDatabase()): Promise<Patient | null> {
    if (dbClient) {
      try {
        const [found] = await dbClient
          .select()
          .from(patients)
          .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)));
        if (found) return found;
      } catch {
        // Fallback
      }
    }
    const list = this.memPatients.get(tenantId) || [];
    return list.find(p => p.id === patientId) || null;
  }

  async getEncounters(tenantId: string, status?: string, dbClient = getDatabase()): Promise<Encounter[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(encounters)
          .where(eq(encounters.tenantId, tenantId))
          .orderBy(desc(encounters.createdAt));
        if (rows.length > 0) {
          if (!status) return rows;
          return rows.filter(e => e.status === status);
        }
      } catch {
        // Fallback
      }
    }
    const list = this.memEncounters.get(tenantId) || [];
    if (!status) return list;
    return list.filter(e => e.status === status);
  }

  async createEncounter(input: CreateEncounterInput, dbClient = getDatabase()): Promise<Encounter> {
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

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(encounters).values(record as unknown as typeof encounters.$inferInsert).returning();
        if (created) return created;
      } catch {
        // Fallback
      }
    }

    const current = this.memEncounters.get(input.tenantId) || [];
    current.unshift(record as unknown as Encounter);
    this.memEncounters.set(input.tenantId, current);
    return record as unknown as Encounter;
  }

  async updateEncounterStatus(tenantId: string, encounterId: string, status: string, dbClient = getDatabase()): Promise<Encounter | null> {
    if (dbClient) {
      try {
        const [updated] = await dbClient
          .update(encounters)
          .set({ status, updatedAt: new Date() })
          .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)))
          .returning();
        if (updated) return updated;
      } catch {
        // Fallback
      }
    }
    const current = this.memEncounters.get(tenantId) || [];
    const item = current.find(e => e.id === encounterId);
    if (item) {
      item.status = status;
      item.updatedAt = new Date();
      return item;
    }
    return null;
  }

  async getConsultationByEncounter(tenantId: string, encounterId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    if (dbClient) {
      try {
        const [found] = await dbClient
          .select()
          .from(consultations)
          .where(and(eq(consultations.tenantId, tenantId), eq(consultations.encounterId, encounterId)));
        if (found) return found as unknown as StoredConsultation;
      } catch {
        // Fallback
      }
    }
    const current = this.memConsultations.get(tenantId) || [];
    return current.find(c => c.encounterId === encounterId) || null;
  }

  async getConsultationById(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    if (dbClient) {
      try {
        const [found] = await dbClient
          .select()
          .from(consultations)
          .where(and(eq(consultations.tenantId, tenantId), eq(consultations.id, consultationId)));
        if (found) return found as unknown as StoredConsultation;
      } catch {
        // Fallback
      }
    }
    const current = this.memConsultations.get(tenantId) || [];
    return current.find(c => c.id === consultationId) || null;
  }

  async saveConsultation(input: SaveConsultationInput, dbClient = getDatabase()): Promise<StoredConsultation> {
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

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(consultations).values({
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
        if (created) return record;
      } catch {
        // Fallback
      }
    }

    const current = this.memConsultations.get(input.tenantId) || [];
    current.unshift(record);
    this.memConsultations.set(input.tenantId, current);
    return record;
  }

  async finalizeConsultation(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    if (dbClient) {
      try {
        const [updated] = await dbClient
          .update(consultations)
          .set({ consultationStatus: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() } as unknown as typeof consultations.$inferInsert)
          .where(and(eq(consultations.tenantId, tenantId), eq(consultations.id, consultationId)))
          .returning();
        if (updated) {
          const item = (this.memConsultations.get(tenantId) || []).find(c => c.id === consultationId);
          if (item) {
            item.status = 'COMPLETED';
            item.completedAt = new Date();
            return item;
          }
          return updated as unknown as StoredConsultation;
        }
      } catch {
        // Fallback
      }
    }

    const current = this.memConsultations.get(tenantId) || [];
    const item = current.find(c => c.id === consultationId);
    if (item) {
      item.status = 'COMPLETED';
      item.completedAt = new Date();
      item.updatedAt = new Date();
      return item;
    }
    return null;
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

  async getPatientClinicalHistory(tenantId: string, patientId: string) {
    const current = this.memConsultations.get(tenantId) || [];
    const patientConsultations = current.filter(c => c.patientId === patientId);
    const labOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, patientId);

    return {
      patientId,
      consultations: patientConsultations,
      labOrders,
      totalEncounters: patientConsultations.length,
      totalLabOrders: labOrders.length
    };
  }
}

export const clinicalWorkflowRepository = new ClinicalWorkflowRepository();
