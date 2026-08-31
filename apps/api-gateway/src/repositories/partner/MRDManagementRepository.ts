import {
  getDatabase,
  medicalRecordIndexes,
  medicalDiagnosisCodes,
  codingReviews,
  eq,
  and,
  desc
} from '@docsearch/database';

export interface CreateMedicalRecordInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  patientName?: string;
  patientMrn?: string;
  encounterId: string;
  encounterNumber?: string;
  encounterType?: string; // OPD, IPD, EMERGENCY, SURGERY
  admissionDate?: string;
  primaryAttendingDoctor?: string;
}

export interface AssignICD10DiagnosisInput {
  tenantId: string;
  recordId: string;
  icdCode: string;
  icdDescription: string;
  codeType?: 'PRIMARY_DIAGNOSIS' | 'SECONDARY_DIAGNOSIS' | 'COMORBIDITY';
  poaIndicator?: 'YES_PRESENT_ON_ADMISSION' | 'NO_HOSPITAL_ACQUIRED';
  sequencingOrder?: number;
  assignedByCoder: string;
  coderNotes?: string;
}

export interface SubmitCodingReviewInput {
  tenantId: string;
  recordId: string;
  reviewerName: string;
  reviewerRole?: string;
  reviewLevel?: string;
  status: 'CODING_VERIFIED' | 'QUERY_RAISED';
  findingsAndErrorsNotes: string;
  codingAccuracyScorePercent?: number;
}

export interface FinalizeMedicalRecordInput {
  tenantId: string;
  recordId: string;
  finalizedBy: string;
  completionNotes?: string;
}

export interface AmendMedicalRecordInput {
  tenantId: string;
  recordId: string;
  amendedBy: string;
  amendmentReason: string;
  additionalNotes: string;
}

export interface ICD10CatalogItem {
  code: string;
  description: string;
  category: string;
  version: string;
  isBillable: boolean;
}

export const AUTHORITATIVE_ICD10_CATALOG: ICD10CatalogItem[] = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine, nutritional and metabolic diseases', version: 'ICD-10-CM 2026', isBillable: true },
  { code: 'I10', description: 'Essential (primary) hypertension', category: 'Diseases of the circulatory system', version: 'ICD-10-CM 2026', isBillable: true },
  { code: 'K80.20', description: 'Calculus of gallbladder without cholecystitis without obstruction', category: 'Diseases of the digestive system', version: 'ICD-10-CM 2026', isBillable: true },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', category: 'Diseases of the respiratory system', version: 'ICD-10-CM 2026', isBillable: true },
  { code: 'M54.5', description: 'Low back pain', category: 'Diseases of the musculoskeletal system', version: 'ICD-10-CM 2026', isBillable: true },
  { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified', category: 'Certain infectious and parasitic diseases', version: 'ICD-10-CM 2026', isBillable: true },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified', category: 'Diseases of the genitourinary system', version: 'ICD-10-CM 2026', isBillable: true },
  { code: 'S06.0X0A', description: 'Concussion without loss of consciousness, initial encounter', category: 'Injury, poisoning and certain other consequences of external causes', version: 'ICD-10-CM 2026', isBillable: true },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', category: 'Factors influencing health status and contact with health services', version: 'ICD-10-CM 2026', isBillable: true }
];

export interface StoredDiagnosisCode {
  id: string;
  recordId: string;
  icdCode: string;
  icdDescription: string;
  codeType: string;
  poaIndicator: string;
  sequencingOrder: number;
  assignedByCoder: string;
  coderNotes?: string | undefined;
  createdAt: Date;
}

export interface StoredCodingReview {
  id: string;
  recordId: string;
  reviewNumber: string;
  reviewerName: string;
  reviewerRole: string;
  reviewLevel: string;
  status: string;
  findingsAndErrorsNotes: string;
  codingAccuracyScorePercent: number;
  reviewedAt: Date;
}

export interface StoredAmendment {
  id: string;
  amendedBy: string;
  amendmentReason: string;
  additionalNotes: string;
  amendedAt: Date;
}

export interface StoredMedicalRecord {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  recordNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  encounterId: string;
  encounterNumber: string;
  encounterType: string;
  admissionDate: Date;
  dischargeDate?: Date | undefined;
  primaryAttendingDoctor: string;
  completionStatus: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'FINALIZED' | 'AMENDED';
  codingStatus: 'PENDING_INITIAL_CODE' | 'CODING_IN_PROGRESS' | 'CODING_COMPLETED' | 'CODING_VERIFIED';
  storageType: string;
  isLegalHoldActive: boolean;
  diagnoses: StoredDiagnosisCode[];
  reviews: StoredCodingReview[];
  amendments: StoredAmendment[];
  createdAt: Date;
  updatedAt: Date;
}

export class MRDManagementRepository {
  private memRecords = new Map<string, StoredMedicalRecord[]>();

  async searchICD10(query?: string, category?: string): Promise<ICD10CatalogItem[]> {
    let list = AUTHORITATIVE_ICD10_CATALOG;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(item => item.code.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
    }
    if (category) {
      list = list.filter(item => item.category.toLowerCase().includes(category.toLowerCase()));
    }
    return list;
  }

  async getMedicalRecords(tenantId: string, patientId?: string, status?: string, dbClient = getDatabase()): Promise<StoredMedicalRecord[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(medicalRecordIndexes)
          .where(eq(medicalRecordIndexes.tenantId, tenantId))
          .orderBy(desc(medicalRecordIndexes.createdAt));
        if (rows.length > 0) {
          let list = rows as unknown as StoredMedicalRecord[];
          if (patientId) list = list.filter(r => r.patientId === patientId);
          if (status) list = list.filter(r => r.completionStatus === status);
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memRecords.get(tenantId) || [];
    if (patientId) list = list.filter(r => r.patientId === patientId);
    if (status) list = list.filter(r => r.completionStatus === status);
    return list;
  }

  async getRecordById(tenantId: string, recordId: string): Promise<StoredMedicalRecord | null> {
    const list = this.memRecords.get(tenantId) || [];
    return list.find(r => r.id === recordId) || null;
  }

  async createMedicalRecord(input: CreateMedicalRecordInput, dbClient = getDatabase()): Promise<StoredMedicalRecord> {
    const id = crypto.randomUUID();
    const now = new Date();
    const recordNumber = `MRD-REC-${Math.floor(100000 + Math.random() * 900000)}`;

    const record: StoredMedicalRecord = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      recordNumber,
      patientId: input.patientId,
      patientName: input.patientName || 'Patient',
      patientMrn: input.patientMrn || 'MRN-001',
      encounterId: input.encounterId,
      encounterNumber: input.encounterNumber || `ENC-${Math.floor(100000 + Math.random() * 900000)}`,
      encounterType: input.encounterType || 'IPD',
      admissionDate: input.admissionDate ? new Date(input.admissionDate) : now,
      primaryAttendingDoctor: input.primaryAttendingDoctor || 'Attending Physician',
      completionStatus: 'DRAFT',
      codingStatus: 'PENDING_INITIAL_CODE',
      storageType: 'DIGITAL_ONLY_EHR',
      isLegalHoldActive: false,
      diagnoses: [],
      reviews: [],
      amendments: [],
      createdAt: now,
      updatedAt: now
    };

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(medicalRecordIndexes).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          recordNumber: record.recordNumber,
          patientId: record.patientId,
          patientName: record.patientName,
          patientMrn: record.patientMrn,
          encounterId: record.encounterId,
          encounterNumber: record.encounterNumber,
          encounterType: record.encounterType,
          admissionDate: record.admissionDate,
          primaryAttendingDoctor: record.primaryAttendingDoctor,
          completionStatus: record.completionStatus,
          codingStatus: record.codingStatus,
          storageType: record.storageType,
          isLegalHoldActive: record.isLegalHoldActive
        } as unknown as typeof medicalRecordIndexes.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memRecords.get(input.tenantId) || [];
    current.unshift(record);
    this.memRecords.set(input.tenantId, current);
    return record;
  }

  async assignICD10Diagnosis(input: AssignICD10DiagnosisInput, dbClient = getDatabase()): Promise<StoredMedicalRecord | null> {
    const record = await this.getRecordById(input.tenantId, input.recordId);
    if (!record) return null;

    // Validate ICD-10 Code
    const isValid = AUTHORITATIVE_ICD10_CATALOG.some(item => item.code.toUpperCase() === input.icdCode.toUpperCase());
    if (!isValid) {
      throw new Error(`Invalid or unverified ICD-10 Code: ${input.icdCode}. Code must exist in authoritative ICD-10 master.`);
    }

    if (record.completionStatus === 'FINALIZED') {
      throw new Error('Medical Record is FINALIZED. Direct diagnosis modifications are locked. Use controlled amendment workflow.');
    }

    const now = new Date();
    const diagnosisId = crypto.randomUUID();
    const diagnosisItem: StoredDiagnosisCode = {
      id: diagnosisId,
      recordId: record.id,
      icdCode: input.icdCode.toUpperCase(),
      icdDescription: input.icdDescription,
      codeType: input.codeType || 'PRIMARY_DIAGNOSIS',
      poaIndicator: input.poaIndicator || 'YES_PRESENT_ON_ADMISSION',
      sequencingOrder: input.sequencingOrder || (record.diagnoses.length + 1),
      assignedByCoder: input.assignedByCoder,
      coderNotes: input.coderNotes,
      createdAt: now
    };

    record.diagnoses.push(diagnosisItem);
    record.codingStatus = 'CODING_COMPLETED';
    record.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(medicalDiagnosisCodes).values({
          id: diagnosisId,
          tenantId: input.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          recordId: record.id,
          icdCode: diagnosisItem.icdCode,
          icdDescription: diagnosisItem.icdDescription,
          codeType: diagnosisItem.codeType,
          poaIndicator: diagnosisItem.poaIndicator,
          sequencingOrder: diagnosisItem.sequencingOrder,
          assignedByCoder: diagnosisItem.assignedByCoder,
          coderNotes: diagnosisItem.coderNotes,
          createdAt: now
        } as unknown as typeof medicalDiagnosisCodes.$inferInsert);

        await dbClient
          .update(medicalRecordIndexes)
          .set({ codingStatus: 'CODING_COMPLETED', updatedAt: now })
          .where(and(eq(medicalRecordIndexes.tenantId, input.tenantId), eq(medicalRecordIndexes.id, record.id)));
      } catch {
        // Fallback
      }
    }

    return record;
  }

  async submitCodingReview(input: SubmitCodingReviewInput, dbClient = getDatabase()): Promise<StoredMedicalRecord | null> {
    const record = await this.getRecordById(input.tenantId, input.recordId);
    if (!record) return null;

    const now = new Date();
    const reviewId = crypto.randomUUID();
    const reviewNumber = `REV-${Math.floor(100000 + Math.random() * 900000)}`;

    const reviewItem: StoredCodingReview = {
      id: reviewId,
      recordId: record.id,
      reviewNumber,
      reviewerName: input.reviewerName,
      reviewerRole: input.reviewerRole || 'SENIOR_MEDICAL_CODER',
      reviewLevel: input.reviewLevel || 'PEER_LEVEL_2',
      status: input.status,
      findingsAndErrorsNotes: input.findingsAndErrorsNotes,
      codingAccuracyScorePercent: input.codingAccuracyScorePercent || 100,
      reviewedAt: now
    };

    record.reviews.push(reviewItem);
    if (input.status === 'CODING_VERIFIED') {
      record.codingStatus = 'CODING_VERIFIED';
      record.completionStatus = 'REVIEWED';
    }
    record.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient.insert(codingReviews).values({
          id: reviewId,
          tenantId: input.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          recordId: record.id,
          reviewNumber,
          reviewerName: reviewItem.reviewerName,
          reviewerRole: reviewItem.reviewerRole,
          reviewLevel: reviewItem.reviewLevel,
          status: reviewItem.status,
          findingsAndErrorsNotes: reviewItem.findingsAndErrorsNotes,
          codingAccuracyScorePercent: reviewItem.codingAccuracyScorePercent,
          reviewedAt: now
        } as unknown as typeof codingReviews.$inferInsert);

        await dbClient
          .update(medicalRecordIndexes)
          .set({ codingStatus: record.codingStatus, completionStatus: record.completionStatus, updatedAt: now })
          .where(and(eq(medicalRecordIndexes.tenantId, input.tenantId), eq(medicalRecordIndexes.id, record.id)));
      } catch {
        // Fallback
      }
    }

    return record;
  }

  async finalizeMedicalRecord(input: FinalizeMedicalRecordInput, dbClient = getDatabase()): Promise<StoredMedicalRecord | null> {
    const record = await this.getRecordById(input.tenantId, input.recordId);
    if (!record) return null;

    if (record.diagnoses.length === 0) {
      throw new Error('Cannot finalize medical record without at least one primary ICD-10 coded diagnosis.');
    }

    const now = new Date();
    record.completionStatus = 'FINALIZED';
    record.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient
          .update(medicalRecordIndexes)
          .set({ completionStatus: 'FINALIZED', updatedAt: now })
          .where(and(eq(medicalRecordIndexes.tenantId, input.tenantId), eq(medicalRecordIndexes.id, record.id)));
      } catch {
        // Fallback
      }
    }

    return record;
  }

  async amendMedicalRecord(input: AmendMedicalRecordInput, dbClient = getDatabase()): Promise<StoredMedicalRecord | null> {
    const record = await this.getRecordById(input.tenantId, input.recordId);
    if (!record) return null;

    if (!input.amendmentReason || input.amendmentReason.trim().length === 0) {
      throw new Error('Formal amendment reason is strictly required to amend a finalized medical record.');
    }

    const now = new Date();
    const amendment: StoredAmendment = {
      id: crypto.randomUUID(),
      amendedBy: input.amendedBy,
      amendmentReason: input.amendmentReason,
      additionalNotes: input.additionalNotes,
      amendedAt: now
    };

    record.amendments.push(amendment);
    record.completionStatus = 'AMENDED';
    record.updatedAt = now;

    if (dbClient) {
      try {
        await dbClient
          .update(medicalRecordIndexes)
          .set({ completionStatus: 'AMENDED', updatedAt: now })
          .where(and(eq(medicalRecordIndexes.tenantId, input.tenantId), eq(medicalRecordIndexes.id, record.id)));
      } catch {
        // Fallback
      }
    }

    return record;
  }

  async getPatientMRDHistory(tenantId: string, patientId: string): Promise<StoredMedicalRecord[]> {
    const list = this.memRecords.get(tenantId) || [];
    return list.filter(r => r.patientId === patientId);
  }
}

export const mrdManagementRepository = new MRDManagementRepository();
