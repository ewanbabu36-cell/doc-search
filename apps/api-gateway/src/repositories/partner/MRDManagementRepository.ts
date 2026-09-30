import crypto from 'crypto';
import {
  getDatabase,
  medicalRecordIndexes,
  medicalDiagnosisCodes,
  codingReviews,
  medicalRecordAuditEvents,
  eq,
  and,
  desc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('partner-mrd-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for MRD operation');
    throw new AppError({
      message: 'Database service is unavailable. MRD operations are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

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

  async getMedicalRecords(
    tenantId: string,
    patientId?: string,
    status?: string,
    dbClient = getDatabase()
  ): Promise<StoredMedicalRecord[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(medicalRecordIndexes)
        .where(eq(medicalRecordIndexes.tenantId, tenantId))
        .orderBy(desc(medicalRecordIndexes.createdAt));

      let matchedRows = rows;
      if (patientId) matchedRows = matchedRows.filter((r: any) => r.patientId === patientId);
      if (status) matchedRows = matchedRows.filter((r: any) => r.completionStatus === status);

      const records: StoredMedicalRecord[] = [];

      for (const r of matchedRows) {
        let diagnoses: StoredDiagnosisCode[] = [];
        try {
          const diagRows = await db
            .select()
            .from(medicalDiagnosisCodes)
            .where(and(eq(medicalDiagnosisCodes.tenantId, tenantId), eq(medicalDiagnosisCodes.recordId, r.id)));
          diagnoses = diagRows.map((d: any) => ({
            id: d.id,
            recordId: d.recordId,
            icdCode: d.icdCode,
            icdDescription: d.icdDescription,
            codeType: d.codeType,
            poaIndicator: d.poaIndicator,
            sequencingOrder: d.sequencingOrder,
            assignedByCoder: d.assignedByCoder,
            coderNotes: d.coderNotes || undefined,
            createdAt: d.createdAt ? new Date(d.createdAt) : new Date()
          }));
        } catch {
          // Empty if none found
        }

        let reviews: StoredCodingReview[] = [];
        try {
          const reviewRows = await db
            .select()
            .from(codingReviews)
            .where(and(eq(codingReviews.tenantId, tenantId), eq(codingReviews.recordId, r.id)));
          reviews = reviewRows.map((rw: any) => ({
            id: rw.id,
            recordId: rw.recordId,
            reviewNumber: rw.reviewNumber,
            reviewerName: rw.reviewerName,
            reviewerRole: rw.reviewerRole,
            reviewLevel: rw.reviewLevel,
            status: rw.status,
            findingsAndErrorsNotes: rw.findingsAndErrorsNotes,
            codingAccuracyScorePercent: rw.codingAccuracyScorePercent,
            reviewedAt: rw.reviewedAt ? new Date(rw.reviewedAt) : new Date()
          }));
        } catch {
          // Empty if none found
        }

        let amendments: StoredAmendment[] = [];
        try {
          const amendRows = await db
            .select()
            .from(medicalRecordAuditEvents)
            .where(and(
              eq(medicalRecordAuditEvents.tenantId, tenantId),
              eq(medicalRecordAuditEvents.entityId, r.id),
              eq(medicalRecordAuditEvents.action, 'CHART_AMENDED')
            ))
            .orderBy(desc(medicalRecordAuditEvents.timestamp));

          amendments = amendRows.map(a => ({
            id: a.id,
            amendedBy: a.actorName,
            amendmentReason: a.justification,
            additionalNotes: ((a.newState as any)?.additionalNotes) || '',
            amendedAt: a.timestamp ? new Date(a.timestamp) : new Date()
          }));
        } catch {
          // Empty if none found
        }

        records.push({
          id: r.id,
          tenantId: r.tenantId,
          partnerId: r.partnerId,
          organizationId: r.organizationId,
          branchId: r.branchId,
          recordNumber: r.recordNumber,
          patientId: r.patientId,
          patientName: r.patientName,
          patientMrn: r.patientMrn,
          encounterId: r.encounterId,
          encounterNumber: r.encounterNumber,
          encounterType: r.encounterType,
          admissionDate: r.admissionDate ? new Date(r.admissionDate) : new Date(),
          dischargeDate: r.dischargeDate ? new Date(r.dischargeDate) : undefined,
          primaryAttendingDoctor: r.primaryAttendingDoctor,
          completionStatus: (r.completionStatus || 'DRAFT') as StoredMedicalRecord['completionStatus'],
          codingStatus: (r.codingStatus || 'PENDING_INITIAL_CODE') as StoredMedicalRecord['codingStatus'],
          storageType: r.storageType || 'DIGITAL_ONLY_EHR',
          isLegalHoldActive: !!r.isLegalHoldActive,
          diagnoses,
          reviews,
          amendments,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
        });
      }

      return records;
    } catch (err) {
      logger.error('Failed to query medical records from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Medical records lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getRecordById(tenantId: string, recordId: string, dbClient = getDatabase()): Promise<StoredMedicalRecord | null> {
    const db = requireDb(dbClient);
    try {
      const [r] = await db
        .select()
        .from(medicalRecordIndexes)
        .where(and(eq(medicalRecordIndexes.tenantId, tenantId), eq(medicalRecordIndexes.id, recordId)))
        .limit(1);

      if (!r) return null;

      let diagnoses: StoredDiagnosisCode[] = [];
      try {
        const diagRows = await db
          .select()
          .from(medicalDiagnosisCodes)
          .where(and(eq(medicalDiagnosisCodes.tenantId, tenantId), eq(medicalDiagnosisCodes.recordId, r.id)))
          .orderBy(medicalDiagnosisCodes.sequencingOrder);

        diagnoses = diagRows.map(d => ({
          id: d.id,
          recordId: d.recordId,
          icdCode: d.icdCode,
          icdDescription: d.icdDescription,
          codeType: d.codeType,
          poaIndicator: d.poaIndicator,
          sequencingOrder: d.sequencingOrder,
          assignedByCoder: d.assignedByCoder,
          coderNotes: d.coderNotes || undefined,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date()
        }));
      } catch {}

      let reviews: StoredCodingReview[] = [];
      try {
        const reviewRows = await db
          .select()
          .from(codingReviews)
          .where(and(eq(codingReviews.tenantId, tenantId), eq(codingReviews.recordId, r.id)))
          .orderBy(desc(codingReviews.reviewedAt));

        reviews = reviewRows.map(rw => ({
          id: rw.id,
          recordId: rw.recordId,
          reviewNumber: rw.reviewNumber,
          reviewerName: rw.reviewerName,
          reviewerRole: rw.reviewerRole,
          reviewLevel: rw.reviewLevel,
          status: rw.status,
          findingsAndErrorsNotes: rw.findingsAndErrorsNotes,
          codingAccuracyScorePercent: rw.codingAccuracyScorePercent,
          reviewedAt: rw.reviewedAt ? new Date(rw.reviewedAt) : new Date()
        }));
      } catch {}

      let amendments: StoredAmendment[] = [];
      try {
        const amendRows = await db
          .select()
          .from(medicalRecordAuditEvents)
          .where(and(
            eq(medicalRecordAuditEvents.tenantId, tenantId),
            eq(medicalRecordAuditEvents.entityId, r.id),
            eq(medicalRecordAuditEvents.action, 'CHART_AMENDED')
          ))
          .orderBy(desc(medicalRecordAuditEvents.timestamp));

        amendments = amendRows.map(a => ({
          id: a.id,
          amendedBy: a.actorName,
          amendmentReason: a.justification,
          additionalNotes: ((a.newState as any)?.additionalNotes) || '',
          amendedAt: a.timestamp ? new Date(a.timestamp) : new Date()
        }));
      } catch {}

      return {
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        organizationId: r.organizationId,
        branchId: r.branchId,
        recordNumber: r.recordNumber,
        patientId: r.patientId,
        patientName: r.patientName,
        patientMrn: r.patientMrn,
        encounterId: r.encounterId,
        encounterNumber: r.encounterNumber,
        encounterType: r.encounterType,
        admissionDate: r.admissionDate ? new Date(r.admissionDate) : new Date(),
        dischargeDate: r.dischargeDate ? new Date(r.dischargeDate) : undefined,
        primaryAttendingDoctor: r.primaryAttendingDoctor,
        completionStatus: (r.completionStatus || 'DRAFT') as StoredMedicalRecord['completionStatus'],
        codingStatus: (r.codingStatus || 'PENDING_INITIAL_CODE') as StoredMedicalRecord['codingStatus'],
        storageType: r.storageType || 'DIGITAL_ONLY_EHR',
        isLegalHoldActive: !!r.isLegalHoldActive,
        diagnoses,
        reviews,
        amendments,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
      };
    } catch (err) {
      logger.error('Failed to query single medical record from database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database query failed. Medical record lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createMedicalRecord(input: CreateMedicalRecordInput, dbClient = getDatabase()): Promise<StoredMedicalRecord> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const now = new Date();
    const recordNumber = `MRD-REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const partnerId = input.partnerId || '00000000-0000-4000-8000-000000000001';
    const organizationId = input.organizationId || '00000000-0000-4000-8000-000000000002';
    const branchId = input.branchId || '00000000-0000-4000-8000-000000000003';
    const patientName = input.patientName || 'Patient';
    const patientMrn = input.patientMrn || 'MRN-001';
    const encounterNumber = input.encounterNumber || `ENC-${Math.floor(100000 + Math.random() * 900000)}`;
    const encounterType = input.encounterType || 'IPD';
    const admissionDate = input.admissionDate ? new Date(input.admissionDate) : now;
    const primaryAttendingDoctor = input.primaryAttendingDoctor || 'Attending Physician';

    try {
      const [created] = await db.insert(medicalRecordIndexes).values({
        id,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        recordNumber,
        patientId: input.patientId,
        patientName,
        patientMrn,
        encounterId: input.encounterId,
        encounterNumber,
        encounterType,
        admissionDate,
        primaryAttendingDoctor,
        completionStatus: 'DRAFT',
        codingStatus: 'PENDING_INITIAL_CODE',
        storageType: 'DIGITAL_ONLY_EHR',
        isLegalHoldActive: false
      } as unknown as typeof medicalRecordIndexes.$inferInsert).returning();

      return {
        id: created?.id || id,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        recordNumber,
        patientId: input.patientId,
        patientName,
        patientMrn,
        encounterId: input.encounterId,
        encounterNumber,
        encounterType,
        admissionDate,
        primaryAttendingDoctor,
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
    } catch (err) {
      logger.error('Failed to create medical record in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Medical record creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async assignICD10Diagnosis(
    input: AssignICD10DiagnosisInput,
    dbClient = getDatabase()
  ): Promise<StoredMedicalRecord | null> {
    const db = requireDb(dbClient);
    const record = await this.getRecordById(input.tenantId, input.recordId, dbClient);
    if (!record) return null;

    // Validate ICD-10 Code
    const isValid = AUTHORITATIVE_ICD10_CATALOG.some(item => item.code.toUpperCase() === input.icdCode.toUpperCase());
    if (!isValid) {
      throw new AppError({
        message: `Invalid or unverified ICD-10 Code: ${input.icdCode}. Code must exist in authoritative ICD-10 master.`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    if (record.completionStatus === 'FINALIZED') {
      throw new AppError({
        message: 'Medical Record is FINALIZED. Direct diagnosis modifications are locked. Use controlled amendment workflow.',
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
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

    const executeInTx = async (tx: any) => {
      await tx.insert(medicalDiagnosisCodes).values({
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

      await tx
        .update(medicalRecordIndexes)
        .set({ codingStatus: 'CODING_COMPLETED', updatedAt: now })
        .where(and(eq(medicalRecordIndexes.tenantId, input.tenantId), eq(medicalRecordIndexes.id, record.id)));
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeInTx);
      } else {
        await executeInTx(db);
      }

      record.diagnoses.push(diagnosisItem);
      record.codingStatus = 'CODING_COMPLETED';
      record.updatedAt = now;
      return record;
    } catch (err) {
      logger.error('Failed to assign ICD-10 diagnosis in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. ICD-10 assignment aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async submitCodingReview(
    input: SubmitCodingReviewInput,
    dbClient = getDatabase()
  ): Promise<StoredMedicalRecord | null> {
    const db = requireDb(dbClient);
    const record = await this.getRecordById(input.tenantId, input.recordId, dbClient);
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

    const newCodingStatus = input.status === 'CODING_VERIFIED' ? 'CODING_VERIFIED' : record.codingStatus;
    const newCompletionStatus = input.status === 'CODING_VERIFIED' ? 'REVIEWED' : record.completionStatus;

    const executeInTx = async (tx: any) => {
      await tx.insert(codingReviews).values({
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

      await tx
        .update(medicalRecordIndexes)
        .set({ codingStatus: newCodingStatus, completionStatus: newCompletionStatus, updatedAt: now })
        .where(and(eq(medicalRecordIndexes.tenantId, input.tenantId), eq(medicalRecordIndexes.id, record.id)));
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeInTx);
      } else {
        await executeInTx(db);
      }

      record.reviews.push(reviewItem);
      record.codingStatus = newCodingStatus as StoredMedicalRecord['codingStatus'];
      record.completionStatus = newCompletionStatus as StoredMedicalRecord['completionStatus'];
      record.updatedAt = now;
      return record;
    } catch (err) {
      logger.error('Failed to submit coding review in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Coding review submission aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async finalizeMedicalRecord(
    input: FinalizeMedicalRecordInput,
    dbClient = getDatabase()
  ): Promise<StoredMedicalRecord | null> {
    const db = requireDb(dbClient);
    const record = await this.getRecordById(input.tenantId, input.recordId, dbClient);
    if (!record) return null;

    if (record.diagnoses.length === 0) {
      throw new AppError({
        message: 'Cannot finalize medical record without at least one primary ICD-10 coded diagnosis.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const now = new Date();

    try {
      await db
        .update(medicalRecordIndexes)
        .set({ completionStatus: 'FINALIZED', updatedAt: now })
        .where(and(eq(medicalRecordIndexes.tenantId, input.tenantId), eq(medicalRecordIndexes.id, record.id)));

      record.completionStatus = 'FINALIZED';
      record.updatedAt = now;
      return record;
    } catch (err) {
      logger.error('Failed to finalize medical record in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Medical record finalization aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async amendMedicalRecord(
    input: AmendMedicalRecordInput,
    dbClient = getDatabase()
  ): Promise<StoredMedicalRecord | null> {
    const db = requireDb(dbClient);
    const record = await this.getRecordById(input.tenantId, input.recordId, dbClient);
    if (!record) return null;

    if (!input.amendmentReason || input.amendmentReason.trim().length === 0) {
      throw new AppError({
        message: 'Formal amendment reason is strictly required to amend a finalized medical record.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const now = new Date();
    const amendmentId = crypto.randomUUID();
    const amendment: StoredAmendment = {
      id: amendmentId,
      amendedBy: input.amendedBy,
      amendmentReason: input.amendmentReason,
      additionalNotes: input.additionalNotes,
      amendedAt: now
    };

    const integrityHash = crypto.createHash('sha256')
      .update(`${record.id}::${input.amendedBy}::${input.amendmentReason}::${now.toISOString()}`)
      .digest('hex');

    const executeInTx = async (tx: any) => {
      await tx
        .update(medicalRecordIndexes)
        .set({ completionStatus: 'AMENDED', updatedAt: now })
        .where(and(eq(medicalRecordIndexes.tenantId, input.tenantId), eq(medicalRecordIndexes.id, record.id)));

      await tx.insert(medicalRecordAuditEvents).values({
        id: amendmentId,
        tenantId: input.tenantId,
        partnerId: record.partnerId,
        organizationId: record.organizationId,
        branchId: record.branchId,
        traceNumber: `TRACE-AMEND-${Date.now().toString().slice(-6)}`,
        actorId: input.amendedBy,
        actorName: input.amendedBy,
        actorRole: 'MRD_CODER',
        action: 'CHART_AMENDED',
        entityType: 'MEDICAL_RECORD',
        entityId: record.id,
        entityCode: record.recordNumber,
        justification: input.amendmentReason,
        ipAddress: '127.0.0.1',
        integrityHash,
        previousHash: 'GENESIS',
        newState: { amendmentReason: input.amendmentReason, additionalNotes: input.additionalNotes, amendedAt: now },
        timestamp: now
      });
    };

    try {
      if (typeof (db as any).transaction === 'function') {
        await (db as any).transaction(executeInTx);
      } else {
        await executeInTx(db);
      }

      record.amendments.push(amendment);
      record.completionStatus = 'AMENDED';
      record.updatedAt = now;
      return record;
    } catch (err) {
      logger.error('Failed to amend medical record in database', err);
      if (err instanceof AppError) throw err;
      throw new AppError({
        message: 'Database persistence failed. Medical record amendment aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPatientMRDHistory(tenantId: string, patientId: string, dbClient = getDatabase()): Promise<StoredMedicalRecord[]> {
    return this.getMedicalRecords(tenantId, patientId, undefined, dbClient);
  }
}

export const mrdManagementRepository = new MRDManagementRepository();
