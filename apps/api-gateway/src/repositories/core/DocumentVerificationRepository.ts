import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  RoleDocumentRequirementsResponse,
  RoleDocumentRequirementItem,
  UploadDocumentRequest,
  VerifyDocumentRequest,
  EntityDocumentDto
} from '@docsearch/api-contracts';
import {
  getDatabase,
  documentTypes,
  entityDocuments,
  documentVerifications,
  documentAuditLogs,
  eq,
  and,
  desc,
  asc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('compliance-document-verification-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for document verification transaction');
    throw new AppError({
      message: 'Database service is unavailable. Document verification operations are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

function handleDbError(operation: string, err: unknown): never {
  if (
    err instanceof AppError ||
    (err && typeof err === 'object' && 'name' in err && (err as any).name === 'AppError') ||
    (err && typeof err === 'object' && 'statusCode' in err && typeof (err as any).statusCode === 'number')
  ) {
    throw err;
  }
  logger.error(`Document verification database operation '${operation}' failed:`, err);
  throw new AppError({
    message: `Database service is unavailable. Document verification operation '${operation}' halted.`,
    code: ErrorCode.SERVICE_UNAVAILABLE,
    statusCode: 503
  });
}

export function codeToUuid(code: string): string {
  const hash = crypto.createHash('sha256').update(`DOC_TYPE_${code}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function ensureUuid(val?: string | null): string {
  if (!val) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(val)) return val;
  const hash = crypto.createHash('sha256').update(val).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export interface SeedDocumentType {
  id: string;
  code: string;
  name: string;
  description: string;
  documentCategory: 'QUALIFICATION' | 'REGISTRATION' | 'LICENSE' | 'EXPERIENCE' | 'ACCREDITATION' | 'IDENTITY' | 'FACILITY' | 'TRAINING' | 'OTHER';
  applicableEntityType: 'FACILITY' | 'PROFESSIONAL' | 'STAFF' | 'TENANT';
  applicableRole?: string | null;
  facilityType?: string | null;
  isRequired: boolean;
  isConditional: boolean;
  conditionExpression?: string | null;
  allowedFileTypes: string[];
  maxFileSizeBytes: number;
  requiresExpiry: boolean;
  requiresRegistrationNumber: boolean;
  requiresIssuingAuthority: boolean;
  requiresIssueDate: boolean;
  requiresVerification: boolean;
  active: boolean;
  displayOrder: number;
}

export const MASTER_DOCUMENT_TYPES: SeedDocumentType[] = [
  // --- DOCTOR REQUIREMENTS ---
  {
    id: codeToUuid('DOC_DEGREE_MBBS_MD'),
    code: 'DOC_DEGREE_MBBS_MD',
    name: 'MBBS / MD / MS Medical Degree Certificate',
    description: 'Official recognized university graduation / post-graduate medical degree parchment.',
    documentCategory: 'QUALIFICATION',
    applicableEntityType: 'PROFESSIONAL',
    applicableRole: 'DOCTOR',
    facilityType: null,
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: false,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 1
  },
  {
    id: codeToUuid('DOC_STATE_COUNCIL_REG'),
    code: 'DOC_STATE_COUNCIL_REG',
    name: 'State Medical Council (MCI / MMC / DMC) Registration',
    description: 'Valid state medical council practitioner license certificate.',
    documentCategory: 'REGISTRATION',
    applicableEntityType: 'PROFESSIONAL',
    applicableRole: 'DOCTOR',
    facilityType: null,
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 2
  },
  {
    id: codeToUuid('DOC_SPECIALIZATION_CERT'),
    code: 'DOC_SPECIALIZATION_CERT',
    name: 'Board Specialization / Fellowship Certificate',
    description: 'Super-specialty (DM / MCh / DNB) or fellowship certificate (conditional).',
    documentCategory: 'QUALIFICATION',
    applicableEntityType: 'PROFESSIONAL',
    applicableRole: 'DOCTOR',
    facilityType: null,
    isRequired: false,
    isConditional: true,
    conditionExpression: 'specialization != null',
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: false,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 3
  },
  {
    id: codeToUuid('DOC_INDEMNITY_INSURANCE'),
    code: 'DOC_INDEMNITY_INSURANCE',
    name: 'Professional Medical Indemnity Insurance',
    description: 'Current professional liability & malpractice insurance policy copy.',
    documentCategory: 'LICENSE',
    applicableEntityType: 'PROFESSIONAL',
    applicableRole: 'DOCTOR',
    facilityType: null,
    isRequired: false,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 4
  },

  // --- LABORATORY REQUIREMENTS ---
  {
    id: codeToUuid('LAB_NABL_ACCREDITATION'),
    code: 'LAB_NABL_ACCREDITATION',
    name: 'NABL ISO 15189:2022 Accreditation Certificate',
    description: 'National Accreditation Board for Testing and Calibration Laboratories certificate.',
    documentCategory: 'ACCREDITATION',
    applicableEntityType: 'FACILITY',
    applicableRole: 'PATHOLOGIST',
    facilityType: 'LABORATORY',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 1
  },
  {
    id: codeToUuid('LAB_PATHOLOGIST_LICENSE'),
    code: 'LAB_PATHOLOGIST_LICENSE',
    name: 'Consultant Pathologist Medical License & MD Degree',
    description: 'MD (Pathology / Biochemistry) degree & medical council registration of responsible person.',
    documentCategory: 'REGISTRATION',
    applicableEntityType: 'FACILITY',
    applicableRole: 'PATHOLOGIST',
    facilityType: 'LABORATORY',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 2
  },
  {
    id: codeToUuid('LAB_BIOMEDICAL_WASTE_NOC'),
    code: 'LAB_BIOMEDICAL_WASTE_NOC',
    name: 'Bio-Medical Waste (BMW) Pollution Board Clearance',
    description: 'State Pollution Control Board authorization for bio-hazard waste management.',
    documentCategory: 'LICENSE',
    applicableEntityType: 'FACILITY',
    applicableRole: 'PATHOLOGIST',
    facilityType: 'LABORATORY',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 3
  },

  // --- HOSPITAL REQUIREMENTS ---
  {
    id: codeToUuid('HOSP_CLINICAL_ESTABLISHMENT'),
    code: 'HOSP_CLINICAL_ESTABLISHMENT',
    name: 'Clinical Establishment Act (CEA) Registration',
    description: 'State Government Directorate of Health Services clinical establishment license.',
    documentCategory: 'FACILITY',
    applicableEntityType: 'FACILITY',
    applicableRole: 'HOSPITAL_ADMIN',
    facilityType: 'HOSPITAL',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 1
  },
  {
    id: codeToUuid('HOSP_FIRE_SAFETY_NOC'),
    code: 'HOSP_FIRE_SAFETY_NOC',
    name: 'Municipal Fire & Life Safety NOC',
    description: 'Chief Fire Officer certified life safety compliance clearance.',
    documentCategory: 'LICENSE',
    applicableEntityType: 'FACILITY',
    applicableRole: 'HOSPITAL_ADMIN',
    facilityType: 'HOSPITAL',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 2
  },
  {
    id: codeToUuid('HOSP_NABH_ACCREDITATION'),
    code: 'HOSP_NABH_ACCREDITATION',
    name: 'NABH Hospital Quality Accreditation',
    description: 'National Accreditation Board for Hospitals & Healthcare Providers certificate.',
    documentCategory: 'ACCREDITATION',
    applicableEntityType: 'FACILITY',
    applicableRole: 'HOSPITAL_ADMIN',
    facilityType: 'HOSPITAL',
    isRequired: false,
    isConditional: true,
    conditionExpression: 'nabhClaimed == true',
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 3
  },

  // --- PHARMACY REQUIREMENTS ---
  {
    id: codeToUuid('PHARM_DRUG_LICENSE_20B_21B'),
    code: 'PHARM_DRUG_LICENSE_20B_21B',
    name: 'Retail & Wholesale Drug License (Form 20B / 21B)',
    description: 'State Drugs Control Department retail and wholesale drug sale licenses.',
    documentCategory: 'LICENSE',
    applicableEntityType: 'FACILITY',
    applicableRole: 'PHARMACIST',
    facilityType: 'PHARMACY',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 1
  },
  {
    id: codeToUuid('PHARM_COUNCIL_REGISTRATION'),
    code: 'PHARM_COUNCIL_REGISTRATION',
    name: 'Registered Pharmacist State Council Certificate',
    description: 'State Pharmacy Council Registered Pharmacist registration certificate.',
    documentCategory: 'REGISTRATION',
    applicableEntityType: 'PROFESSIONAL',
    applicableRole: 'PHARMACIST',
    facilityType: 'PHARMACY',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 2
  },

  {
    id: codeToUuid('PATH_CLINICAL_EST_ACT'),
    code: 'PATH_CLINICAL_EST_ACT',
    name: 'Clinical Establishment Act (CEA) Diagnostic / Lab Registration',
    description: 'State Government Directorate of Health Services clinical establishment license for pathology/diagnostic centers.',
    documentCategory: 'FACILITY',
    applicableEntityType: 'FACILITY',
    applicableRole: 'PATHOLOGIST',
    facilityType: 'LABORATORY',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 4
  },
  {
    id: codeToUuid('PATH_BIO_MEDICAL_WASTE'),
    code: 'PATH_BIO_MEDICAL_WASTE',
    name: 'Bio-Medical Waste (BMW) Authorization Certificate',
    description: 'State Pollution Control Board authorization for bio-hazard waste management.',
    documentCategory: 'LICENSE',
    applicableEntityType: 'FACILITY',
    applicableRole: 'PATHOLOGIST',
    facilityType: 'LABORATORY',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 5
  },
  {
    id: codeToUuid('PHARM_RETAIL_DRUG_LICENSE'),
    code: 'PHARM_RETAIL_DRUG_LICENSE',
    name: 'Retail Drug License (Form 20 / 21)',
    description: 'State Drugs Control Department retail drug sale license.',
    documentCategory: 'LICENSE',
    applicableEntityType: 'FACILITY',
    applicableRole: 'PHARMACIST',
    facilityType: 'PHARMACY',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 3
  },
  {
    id: codeToUuid('PHARM_WHOLESALE_DRUG_LICENSE'),
    code: 'PHARM_WHOLESALE_DRUG_LICENSE',
    name: 'Wholesale Drug License (Form 20B / 21B)',
    description: 'State Drugs Control Department wholesale B2B drug distribution license.',
    documentCategory: 'LICENSE',
    applicableEntityType: 'FACILITY',
    applicableRole: 'PHARMACIST',
    facilityType: 'PHARMACY',
    isRequired: false,
    isConditional: true,
    conditionExpression: 'wholesaleEnabled == true',
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 4
  },

  // --- DIAGNOSTIC CENTRE & RADIOLOGY REQUIREMENTS ---
  {
    id: codeToUuid('RAD_AERB_ELORA_LICENSE'),
    code: 'RAD_AERB_ELORA_LICENSE',
    name: 'AERB e-LORA Radiation Safety License / Authorization',
    description: 'Atomic Energy Regulatory Board (AERB) e-LORA operational license for X-Ray, CT, Mammography, and Cath Lab radiation equipment.',
    documentCategory: 'LICENSE',
    applicableEntityType: 'FACILITY',
    applicableRole: 'RADIOLOGIST',
    facilityType: 'DIAGNOSTIC_CENTRE',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 1
  },
  {
    id: codeToUuid('RAD_PCPNDT_CERTIFICATE'),
    code: 'RAD_PCPNDT_CERTIFICATE',
    name: 'PC-PNDT Act Registration Certificate (Ultrasound / Imaging)',
    description: 'District Appropriate Authority certificate under the Pre-Conception and Pre-Natal Diagnostic Techniques (PC-PNDT) Act.',
    documentCategory: 'REGISTRATION',
    applicableEntityType: 'FACILITY',
    applicableRole: 'RADIOLOGIST',
    facilityType: 'DIAGNOSTIC_CENTRE',
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: true,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 2
  },

  // --- STAFF & ALLIED HEALTH REQUIREMENTS ---
  {
    id: codeToUuid('STAFF_EDUCATIONAL_QUALIFICATION'),
    code: 'STAFF_EDUCATIONAL_QUALIFICATION',
    name: 'Highest Educational Degree / Diploma Certificate',
    description: 'Official degree/diploma marksheet (e.g. B.Sc Nursing, GNM, DMLT, MBA, B.Com).',
    documentCategory: 'QUALIFICATION',
    applicableEntityType: 'STAFF',
    applicableRole: 'STAFF',
    facilityType: null,
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: false,
    requiresRegistrationNumber: false,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 1
  },
  {
    id: codeToUuid('STAFF_EXPERIENCE_RELIEVING'),
    code: 'STAFF_EXPERIENCE_RELIEVING',
    name: 'Past Clinical / Hospital Experience & Relieving Certificate',
    description: 'Previous employer service letter or clinical experience certificate.',
    documentCategory: 'EXPERIENCE',
    applicableEntityType: 'STAFF',
    applicableRole: 'STAFF',
    facilityType: null,
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: false,
    requiresRegistrationNumber: false,
    requiresIssuingAuthority: true,
    requiresIssueDate: true,
    requiresVerification: true,
    active: true,
    displayOrder: 2
  },
  {
    id: codeToUuid('STAFF_GOVERNMENT_ID'),
    code: 'STAFF_GOVERNMENT_ID',
    name: 'Government Identity Proof (Aadhaar / Voter ID / PAN)',
    description: 'Official government photo identification proof.',
    documentCategory: 'IDENTITY',
    applicableEntityType: 'STAFF',
    applicableRole: 'STAFF',
    facilityType: null,
    isRequired: true,
    isConditional: false,
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    maxFileSizeBytes: 10485760,
    requiresExpiry: false,
    requiresRegistrationNumber: true,
    requiresIssuingAuthority: true,
    requiresIssueDate: false,
    requiresVerification: true,
    active: true,
    displayOrder: 3
  }
];

class DocumentVerificationRepository {
  private seededMasterTypes = false;
  private lastDbRef: any = null;

  private async ensureMasterDocumentTypes(db: any): Promise<void> {
    if (this.seededMasterTypes && this.lastDbRef === db) return;
    try {

      for (const m of MASTER_DOCUMENT_TYPES) {
        const q = db.insert(documentTypes).values({
          id: m.id,
          code: m.code,
          name: m.name,
          description: m.description,
          documentCategory: m.documentCategory,
          applicableEntityType: m.applicableEntityType,
          applicableRole: m.applicableRole || null,
          facilityType: m.facilityType || null,
          isRequired: m.isRequired,
          isConditional: m.isConditional,
          conditionExpression: m.conditionExpression || null,
          allowedFileTypes: m.allowedFileTypes,
          maxFileSizeBytes: m.maxFileSizeBytes,
          requiresExpiry: m.requiresExpiry,
          requiresRegistrationNumber: m.requiresRegistrationNumber,
          requiresIssuingAuthority: m.requiresIssuingAuthority,
          requiresIssueDate: m.requiresIssueDate,
          requiresVerification: m.requiresVerification,
          active: m.active,
          displayOrder: m.displayOrder
        });

        if (typeof q.onConflictDoNothing === 'function') {
          await q.onConflictDoNothing();
        } else {
          await q;
        }
      }
      this.seededMasterTypes = true;
      this.lastDbRef = db;
    } catch {
      // Ignore conflict / already exists
    }
  }

  public async getRequirements(params: {
    entityType?: string;
    role?: string;
    facilityType?: string;
    professionalType?: string;
    tenantId: string;
    ownerEntityId: string;
    specialization?: string;
    nabhClaimed?: boolean;
  }): Promise<RoleDocumentRequirementsResponse> {
    try {
      const db = requireDb();
      await this.ensureMasterDocumentTypes(db);

      const role = (params.role || '').toUpperCase();
      const facilityType = (params.facilityType || '').toUpperCase();

      // Query active master document types from PostgreSQL
      let dbTypes: SeedDocumentType[] = [];
      try {
        const rows = await db
          .select()
          .from(documentTypes)
          .where(eq(documentTypes.active, true))
          .orderBy(asc(documentTypes.displayOrder));
        if (rows && rows.length > 0) {
          dbTypes = rows.map((r: any) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            description: r.description || '',
            documentCategory: r.documentCategory,
            applicableEntityType: r.applicableEntityType,
            applicableRole: r.applicableRole,
            facilityType: r.facilityType,
            isRequired: Boolean(r.isRequired),
            isConditional: Boolean(r.isConditional),
            conditionExpression: r.conditionExpression,
            allowedFileTypes: Array.isArray(r.allowedFileTypes) ? r.allowedFileTypes : ['application/pdf', 'image/png', 'image/jpeg'],
            maxFileSizeBytes: Number(r.maxFileSizeBytes || 10485760),
            requiresExpiry: Boolean(r.requiresExpiry),
            requiresRegistrationNumber: Boolean(r.requiresRegistrationNumber),
            requiresIssuingAuthority: Boolean(r.requiresIssuingAuthority),
            requiresIssueDate: Boolean(r.requiresIssueDate),
            requiresVerification: Boolean(r.requiresVerification),
            active: Boolean(r.active),
            displayOrder: Number(r.displayOrder || 0)
          }));
        }
      } catch {
        // Fall back to MASTER_DOCUMENT_TYPES definitions if table query has issues
      }

      const typesToUse = dbTypes.length > 0 ? dbTypes : MASTER_DOCUMENT_TYPES;

      // Filter relevant document types dynamically
      const applicableTypes = typesToUse.filter((dt) => {
        if (facilityType === 'DIAGNOSTIC_CENTRE' || facilityType === 'RADIOLOGY' || role.includes('RADIOLOGIST')) {
          return dt.facilityType === 'DIAGNOSTIC_CENTRE' || dt.facilityType === 'LABORATORY' || dt.applicableRole === 'RADIOLOGIST';
        }
        if (role.includes('DOCTOR') || role.includes('SURGEON') || role.includes('PHYSICIAN')) {
          return dt.applicableRole === 'DOCTOR';
        }
        if (facilityType === 'LABORATORY' || facilityType === 'PATHOLOGY' || role.includes('PATHOLOGIST')) {
          return dt.facilityType === 'LABORATORY' || dt.applicableRole === 'PATHOLOGIST';
        }
        if (facilityType === 'HOSPITAL' || role.includes('HOSPITAL_ADMIN')) {
          return dt.facilityType === 'HOSPITAL' || dt.applicableRole === 'HOSPITAL_ADMIN';
        }
        if (facilityType === 'PHARMACY' || role.includes('PHARMACIST')) {
          return dt.facilityType === 'PHARMACY' || dt.applicableRole === 'PHARMACIST';
        }
        return dt.applicableEntityType === 'STAFF' || dt.applicableRole === 'STAFF';
      });

      // Check currently uploaded documents for this owner from PostgreSQL (Strictly scoped to tenantId)
      const ownerUuid = ensureUuid(params.ownerEntityId);
      const tenantUuid = ensureUuid(params.tenantId);
      const existingDocs = await db
        .select()
        .from(entityDocuments)
        .where(
          and(
            eq(entityDocuments.tenantId, tenantUuid),
            eq(entityDocuments.ownerEntityId, ownerUuid),
            eq(entityDocuments.isCurrent, true)
          )
        )
        .orderBy(desc(entityDocuments.createdAt));

      const docTypeMap = new Map(typesToUse.map((t) => [t.id, t]));

      const requirementItems: RoleDocumentRequirementItem[] = applicableTypes.map((dt) => {
        const currentDocRow = existingDocs.find(
          (d: any) => d.documentTypeId === dt.id || (docTypeMap.get(d.documentTypeId)?.code === dt.code)
        );
        let conditionMet = true;

        if (dt.isConditional) {
          if (dt.code === 'DOC_SPECIALIZATION_CERT' && !params.specialization) {
            conditionMet = false;
          }
          if (dt.code === 'HOSP_NABH_ACCREDITATION' && !params.nabhClaimed) {
            conditionMet = false;
          }
        }

        const currentDoc = currentDocRow ? this.mapToDto(currentDocRow, dt) : null;
        const isDocExpired = Boolean(currentDoc && ((currentDoc as any).isExpired || currentDoc.verificationStatus === 'EXPIRED'));
        const status = !currentDoc
          ? 'NOT_UPLOADED'
          : isDocExpired
            ? 'EXPIRED'
            : currentDoc.verificationStatus;
        const missingReason = !currentDoc && dt.isRequired
          ? 'Mandatory regulatory document missing'
          : isDocExpired && dt.isRequired
            ? `Mandatory regulatory document expired on ${currentDoc?.expiryDate} — renewal and reverification required`
            : null;

        return {
          documentTypeCode: dt.code,
          documentType: {
            id: dt.id,
            code: dt.code,
            name: dt.name,
            description: dt.description,
            documentCategory: dt.documentCategory,
            applicableEntityType: dt.applicableEntityType,
            applicableRole: dt.applicableRole || null,
            facilityType: dt.facilityType || null,
            isRequired: dt.isRequired,
            isConditional: dt.isConditional,
            conditionExpression: dt.conditionExpression || null,
            allowedFileTypes: dt.allowedFileTypes,
            maxFileSizeBytes: dt.maxFileSizeBytes,
            requiresExpiry: dt.requiresExpiry,
            requiresRegistrationNumber: dt.requiresRegistrationNumber,
            requiresIssuingAuthority: dt.requiresIssuingAuthority,
            requiresIssueDate: dt.requiresIssueDate,
            requiresVerification: dt.requiresVerification,
            active: dt.active,
            displayOrder: dt.displayOrder
          },
          isMandatory: dt.isRequired && conditionMet,
          isConditional: dt.isConditional,
          conditionMet,
          status,
          isSatisfied: status === 'VERIFIED' && !isDocExpired,
          isExpired: isDocExpired,
          currentDocument: currentDoc,
          missingReason
        } as any;
      });

      const mandatoryItems = requirementItems.filter((r) => r.isMandatory);
      const verifiedItems = requirementItems.filter(
        (r) => r.status === 'VERIFIED' && !(r.currentDocument as any)?.isExpired
      );
      const expiredMandatoryItems = mandatoryItems.filter(
        (r) => r.status === 'EXPIRED' || Boolean((r.currentDocument as any)?.isExpired)
      );
      const pendingItems = requirementItems.filter((r) => r.status === 'PENDING_VERIFICATION');

      const missingMandatory = mandatoryItems.filter(
        (r) => r.status !== 'VERIFIED' || Boolean((r.currentDocument as any)?.isExpired)
      );
      const submissionBlocked = missingMandatory.length > 0;
      const blockingReasons = missingMandatory.map((m) =>
        m.status === 'EXPIRED' || Boolean((m.currentDocument as any)?.isExpired)
          ? `Expired mandatory verification for: ${m.documentType.name} (expired ${m.currentDocument?.expiryDate})`
          : `Missing mandatory verification for: ${m.documentType.name}`
      );

      return {
        entityType: params.entityType || 'PROFESSIONAL',
        role: params.role || null,
        facilityType: params.facilityType || null,
        professionalType: params.professionalType || null,
        totalRequirements: requirementItems.length,
        mandatoryCount: mandatoryItems.length,
        verifiedCount: verifiedItems.length,
        pendingCount: pendingItems.length,
        expiredCount: expiredMandatoryItems.length,
        expiredMandatoryCount: expiredMandatoryItems.length,
        accountComplianceState: !submissionBlocked
          ? 'COMPLIANT'
          : expiredMandatoryItems.length > 0
            ? 'EXPIRED_COMPLIANCE_HOLD'
            : 'PENDING_COMPLIANCE',
        isFullyCompliant: !submissionBlocked,
        submissionBlocked,
        blockingReasons,
        requirements: requirementItems
      } as any;
    } catch (err) {
      handleDbError('getRequirements', err);
    }
  }

  /**
   * Evaluates at runtime whether a tenant has any mandatory compliance document
   * that has expired (VERIFIED + expiryDate < today) or is an unverified renewal
   * of an expired mandatory document. Used by commercial-guard to block dependent
   * operational workflows until a renewed document is uploaded AND verified.
   */
  public async hasExpiredMandatoryComplianceHold(
    tenantId: string
  ): Promise<{ onHold: boolean; reason?: string }> {
    try {
      const db = getDatabase();
      if (!db || !tenantId) {
        return { onHold: false };
      }

      const tenantUuid = ensureUuid(tenantId);
      const allTenantDocs = await db
        .select()
        .from(entityDocuments)
        .where(eq(entityDocuments.tenantId, tenantUuid))
        .orderBy(desc(entityDocuments.createdAt));

      if (!allTenantDocs || allTenantDocs.length === 0) {
        return { onHold: false };
      }

      const byDocType = new Map<string, any[]>();
      for (const row of allTenantDocs) {
        const list = byDocType.get(row.documentTypeId) || [];
        list.push(row);
        byDocType.set(row.documentTypeId, list);
      }

      for (const [docTypeId, docsForType] of byDocType.entries()) {
        const masterType = MASTER_DOCUMENT_TYPES.find((m) => m.id === docTypeId);
        if (masterType && !masterType.isRequired) {
          continue;
        }

        const currentDoc = docsForType.find((d) => d.isCurrent) || docsForType[0];
        if (!currentDoc) continue;

        const currentDto: any = this.mapToDto(currentDoc, masterType);

        // Case 1: Current document is VERIFIED (or stored as EXPIRED) and its expiryDate < today
        if (
          (currentDto.rawVerificationStatus === 'VERIFIED' || currentDto.verificationStatus === 'EXPIRED') &&
          currentDto.isExpired
        ) {
          return {
            onHold: true,
            reason: `EXPIRED_COMPLIANCE_HOLD: Mandatory compliance document (${currentDto.documentTypeName}) expired on ${currentDto.expiryDate}. Operational workflows are blocked until renewed and verified.`
          };
        }

        // Case 2: Current document is a renewal upload (e.g. PENDING_VERIFICATION) replacing a previously expired document
        // Validity must NOT be restored until actual valid verification occurs.
        if (currentDto.verificationStatus !== 'VERIFIED') {
          const hadPriorExpiredVerifiedDoc = docsForType.some((d) => {
            const dto: any = this.mapToDto(d, masterType);
            return (
              dto.isExpired &&
              (dto.rawVerificationStatus === 'VERIFIED' ||
                dto.rawVerificationStatus === 'SUPERSEDED' ||
                dto.verificationStatus === 'EXPIRED')
            );
          });
          if (hadPriorExpiredVerifiedDoc) {
            return {
              onHold: true,
              reason: `EXPIRED_COMPLIANCE_HOLD: Renewed mandatory compliance document (${currentDto.documentTypeName}) is in status ${currentDto.verificationStatus}. Operational workflows remain blocked until verification is completed.`
            };
          }
        }
      }

      return { onHold: false };
    } catch {
      return { onHold: false };
    }
  }

  private getStorageRootDir(): string {
    return path.resolve(process.cwd(), '.storage');
  }

  public resolveStorageFilePath(storageKey: string): string {
    const normalizedKey = storageKey.replace(/^\/+/, '').replace(/\.\./g, '');
    const rootDir = this.getStorageRootDir();
    const resolved = path.resolve(rootDir, normalizedKey);
    if (!resolved.startsWith(rootDir)) {
      throw AppError.forbidden('Invalid storage key path traversal rejected');
    }
    return resolved;
  }

  public async uploadDocument(
    data: UploadDocumentRequest,
    actor: { id: string; email: string; tenantId: string }
  ): Promise<EntityDocumentDto> {
    try {
      if (!actor?.tenantId || !actor?.id) {
        throw AppError.unauthorized('Authenticated tenant and user context required for document upload');
      }

      const rawFileName = String(data.fileName || '').trim();
      if (!rawFileName || rawFileName.includes('..') || rawFileName.includes('/') || rawFileName.includes('\\')) {
        throw AppError.badRequest('Invalid or unsafe file name provided for document upload');
      }

      const db = requireDb();
      await this.ensureMasterDocumentTypes(db);

      return await db.transaction(async (tx: any) => {
        // Find doc type
        let docType: SeedDocumentType | null = null;
        try {
          const rows = await tx.select().from(documentTypes).where(eq(documentTypes.code, data.documentTypeCode));
          if (rows && rows.length > 0) {
            const r = rows[0];
            docType = {
              id: r.id,
              code: r.code,
              name: r.name,
              description: r.description || '',
              documentCategory: r.documentCategory as any,
              applicableEntityType: r.applicableEntityType as any,
              applicableRole: r.applicableRole,
              facilityType: r.facilityType,
              isRequired: Boolean(r.isRequired),
              isConditional: Boolean(r.isConditional),
              conditionExpression: r.conditionExpression,
              allowedFileTypes: Array.isArray(r.allowedFileTypes) ? r.allowedFileTypes : ['application/pdf', 'image/png', 'image/jpeg'],
              maxFileSizeBytes: Number(r.maxFileSizeBytes || 10485760),
              requiresExpiry: Boolean(r.requiresExpiry),
              requiresRegistrationNumber: Boolean(r.requiresRegistrationNumber),
              requiresIssuingAuthority: Boolean(r.requiresIssuingAuthority),
              requiresIssueDate: Boolean(r.requiresIssueDate),
              requiresVerification: Boolean(r.requiresVerification),
              active: Boolean(r.active),
              displayOrder: Number(r.displayOrder || 0)
            };
          }
        } catch {
          // Continue to fallback
        }

        if (!docType) {
          const matchedMaster = MASTER_DOCUMENT_TYPES.find((dt) => dt.code === data.documentTypeCode);
          if (!matchedMaster) {
            throw AppError.badRequest(`Unsupported or invalid documentTypeCode '${data.documentTypeCode}'`);
          }
          docType = matchedMaster;
        }

        // Validate MIME type & file size
        const mimeType = String(data.mimeType || 'application/pdf').toLowerCase().trim();
        const allowedMimes = docType.allowedFileTypes.map((m) => m.toLowerCase());
        if (!allowedMimes.includes(mimeType)) {
          throw AppError.badRequest(
            `Invalid file MIME type '${mimeType}'. Allowed types for ${docType.code}: ${docType.allowedFileTypes.join(', ')}`
          );
        }

        if ((data as any).fileSizeBytes !== undefined && (Number(data.fileSizeBytes) <= 0 || Number(data.fileSizeBytes) > docType.maxFileSizeBytes)) {
          throw AppError.badRequest(
            `File size ${data.fileSizeBytes} bytes is outside allowed bounds (1 to ${docType.maxFileSizeBytes} bytes)`
          );
        }

        // Decode physical binary buffer — strictly reject missing, empty, or invalid base64 content (no synthetic PDF fallback)
        const rawBase64 =
          (data as any).fileContentBase64 ??
          (data as any).fileBase64 ??
          (data as any).contentBase64 ??
          (data as any).dataUrl;

        if (typeof rawBase64 !== 'string' || rawBase64.trim().length === 0) {
          throw AppError.badRequest('Binary document content (fileBase64 / fileContentBase64) is required');
        }

        const trimmedBase64 = rawBase64.trim();
        const strippedBase64 = (
          trimmedBase64.includes('base64,')
            ? trimmedBase64.split('base64,')[1] || ''
            : trimmedBase64
        ).replace(/\s+/g, '');

        if (!strippedBase64 || strippedBase64.length === 0) {
          throw AppError.badRequest('Binary document content (fileBase64 / fileContentBase64) is required');
        }

        const normalizedBase64 = strippedBase64.replace(/-/g, '+').replace(/_/g, '/');
        if (
          !/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64) ||
          normalizedBase64.length % 4 !== 0
        ) {
          throw AppError.badRequest(
            'Invalid base64 encoding: Binary document content (fileBase64 / fileContentBase64) is required'
          );
        }

        const binaryBuffer = Buffer.from(normalizedBase64, 'base64');
        if (
          binaryBuffer.length === 0 ||
          binaryBuffer.toString('base64').replace(/=+$/, '') !== normalizedBase64.replace(/=+$/, '')
        ) {
          throw AppError.badRequest(
            'Invalid base64 encoding: Binary document content (fileBase64 / fileContentBase64) is required'
          );
        }

        if (binaryBuffer.length > docType.maxFileSizeBytes) {
          throw AppError.badRequest(`Decoded binary size (${binaryBuffer.length} bytes) exceeds max allowed (${docType.maxFileSizeBytes} bytes)`);
        }

        const ownerUuid = ensureUuid(data.ownerEntityId || actor.tenantId);
        const tenantUuid = ensureUuid(actor.tenantId);
        const actorUuid = ensureUuid(actor.id);

        // Find existing active document for this owner and document type within the same tenant
        const existingRows = await tx
          .select()
          .from(entityDocuments)
          .where(
            and(
              eq(entityDocuments.tenantId, tenantUuid),
              eq(entityDocuments.ownerEntityId, ownerUuid),
              eq(entityDocuments.documentTypeId, docType.id),
              eq(entityDocuments.isCurrent, true)
            )
          );
        const existing = existingRows[0];

        let nextVersion = 1;
        const docId = crypto.randomUUID();

        if (existing) {
          nextVersion = Number(existing.version || 1) + 1;
          await tx
            .update(entityDocuments)
            .set({
              isCurrent: false,
              verificationStatus: 'SUPERSEDED',
              supersededBy: docId,
              metadata: { ...((existing.metadata as Record<string, unknown>) || {}), supersededBy: docId },
              updatedAt: new Date()
            })
            .where(eq(entityDocuments.id, existing.id));
        }

        // Compute SHA-256 over the actual binary bytes
        const sha256 = crypto
          .createHash('sha256')
          .update(binaryBuffer)
          .digest('hex');

        const safeFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageKey = `tenants/${tenantUuid}/documents/${docId}_${safeFileName}`;
        const absFilePath = this.resolveStorageFilePath(storageKey);

        // Write actual binary bytes to protected server storage
        fs.mkdirSync(path.dirname(absFilePath), { recursive: true });
        fs.writeFileSync(absFilePath, binaryBuffer);

        // Authenticated retrieval endpoint (never expose raw filesystem storage paths)
        const fileUrl = `/api/v1/compliance/documents/${docId}/download`;

        // Never synthesize fake OCR / AI match scores when OCR has not actually executed
        const newDocValues = {
          id: docId,
          documentTypeId: docType.id,
          tenantId: tenantUuid,
          ownerEntityId: ownerUuid,
          ownerEntityType: data.ownerEntityType,
          role: data.role || null,
          facilityType: data.facilityType || docType.facilityType || null,
          documentNumber: data.documentNumber || null,
          issuingAuthority: data.issuingAuthority || null,
          issueDate: data.issueDate || null,
          expiryDate: data.expiryDate || null,
          fileName: rawFileName,
          storageKey,
          fileUrl,
          mimeType,
          fileSizeBytes: Number(data.fileSizeBytes || binaryBuffer.length),
          sha256Hash: sha256,
          aiMatchScore: null,
          aiExtractedText: null,
          uploadedBy: actorUuid,
          uploadedAt: new Date(),
          verificationStatus: 'PENDING_VERIFICATION',
          version: nextVersion,
          isCurrent: true,
          metadata: {
            ocrStatus: 'NOT_PROCESSED',
            uploaderEmail: actor.email,
            rawUploaderId: actor.id
          }
        };

        await tx.insert(entityDocuments).values(newDocValues);

        // Audit Log Entry
        await tx.insert(documentAuditLogs).values({
          id: crypto.randomUUID(),
          documentId: docId,
          actorId: actorUuid,
          actorEmail: actor.email,
          action: 'UPLOAD',
          oldStatus: existing ? 'SUPERSEDED' : 'NOT_UPLOADED',
          newStatus: 'PENDING_VERIFICATION',
          reason: `Uploaded version ${nextVersion} for ${docType.name}`,
          metadata: {
            sha256Hash: sha256,
            fileSizeBytes: newDocValues.fileSizeBytes,
            ocrStatus: 'NOT_PROCESSED'
          },
          timestamp: new Date()
        });

        return this.mapToDto(newDocValues, docType);
      });
    } catch (err) {
      handleDbError('uploadDocument', err);
    }
  }

  public async verifyDocument(
    documentId: string,
    req: VerifyDocumentRequest,
    verifier: {
      id: string;
      email: string;
      roles?: string[];
      isSuperAdmin?: boolean;
      tenantId?: string;
      dataScope?: string;
    }
  ): Promise<EntityDocumentDto> {
    try {
      const db = requireDb();

      // 1. Strict HQ Role Enforcement (P0-SEC-02)
      const verifierRoles = Array.isArray(verifier.roles) ? verifier.roles : [];
      const isAuthorizedHqRole =
        Boolean(verifier.isSuperAdmin) ||
        verifierRoles.includes('SUPER_ADMIN') ||
        verifierRoles.includes('COMPANY_ADMIN') ||
        verifierRoles.includes('COMPLIANCE_OFFICER');

      if (!isAuthorizedHqRole) {
        throw new AppError({
          message: 'Access denied: Only authorized HQ Compliance Officers, Company Admins, or Super Admins may verify statutory compliance documents.',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }

      return await db.transaction(async (tx: any) => {
        const docRows = await tx.select().from(entityDocuments).where(eq(entityDocuments.id, documentId));
        const doc = docRows[0];
        if (!doc) {
          throw new AppError({
            message: `Document with ID ${documentId} was not found.`,
            code: ErrorCode.NOT_FOUND,
            statusCode: 404
          });
        }

        const verifierUuid = ensureUuid(verifier.id);
        const docMeta = (doc.metadata || {}) as Record<string, any>;

        // 2. Strict Maker-Checker Enforcement (Uploader must NEVER verify their own document)
        const isSelfUploadById = doc.uploadedBy === verifierUuid || (docMeta['rawUploaderId'] && docMeta['rawUploaderId'] === verifier.id);
        const isSelfUploadByEmail =
          verifier.email &&
          docMeta['uploaderEmail'] &&
          String(docMeta['uploaderEmail']).toLowerCase().trim() === String(verifier.email).toLowerCase().trim();

        if (isSelfUploadById || isSelfUploadByEmail) {
          throw new AppError({
            message: 'Maker-Checker violation: The uploader of a compliance document is strictly forbidden from verifying their own document.',
            code: ErrorCode.FORBIDDEN,
            statusCode: 403
          });
        }

        // 3. Strict Tenant Boundary Enforcement
        // If a verifier is scoped to a single tenant/branch/department/self (not global HQ scope), block cross-tenant AND self-tenant statutory verification
        if (
          !verifier.isSuperAdmin &&
          !verifierRoles.includes('SUPER_ADMIN') &&
          !verifierRoles.includes('COMPANY_ADMIN') &&
          ((verifier.dataScope && verifier.dataScope !== 'global') ||
            (verifier.tenantId && verifier.dataScope !== 'global' && ensureUuid(verifier.tenantId) !== doc.tenantId))
        ) {
          throw new AppError({
            message: 'Tenant-scoped verifier cannot perform HQ statutory document verification across or within partner tenants.',
            code: ErrorCode.FORBIDDEN,
            statusCode: 403
          });
        }

        if (doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'REJECTED') {
          throw new AppError({
            message: `Document ${documentId} has already been finalized with status '${doc.verificationStatus}'.`,
            code: ErrorCode.CONFLICT,
            statusCode: 409
          });
        }

        // 4. Strict Document Expiry Enforcement (FINDING-P1-COMP-EXPIRY-04)
        if (req.action === 'VERIFY' && doc.expiryDate) {
          const expiryStr =
            typeof doc.expiryDate === 'string'
              ? doc.expiryDate.split('T')[0] || ''
              : doc.expiryDate instanceof Date
                ? doc.expiryDate.toISOString().split('T')[0] || ''
                : String(doc.expiryDate).split('T')[0] || '';
          const todayStr = new Date().toISOString().split('T')[0] || '';
          if (expiryStr && expiryStr < todayStr) {
            throw new AppError({
              message: `Cannot verify expired compliance document: expiryDate (${expiryStr}) is before current server date (${todayStr}). Renewal or re-upload is required.`,
              code: ErrorCode.VALIDATION_ERROR,
              statusCode: 400
            });
          }
        }

        const previousStatus = doc.verificationStatus;
        const newStatus = req.action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';
        const rejectionReason = req.action === 'REJECT' ? (req.reason || 'Document verification failed compliance criteria.') : null;
        const verifiedAt = new Date();

        await tx
          .update(entityDocuments)
          .set({
            verificationStatus: newStatus,
            verifiedBy: verifierUuid,
            verifiedAt,
            rejectionReason: rejectionReason || doc.rejectionReason,
            updatedAt: new Date()
          })
          .where(eq(entityDocuments.id, documentId));

        await tx.insert(documentVerifications).values({
          id: crypto.randomUUID(),
          documentId,
          verifierId: verifierUuid,
          verifierEmail: verifier.email,
          action: req.action,
          previousStatus,
          newStatus,
          reason: req.reason || (req.action === 'VERIFY' ? 'Approved by Compliance Officer' : 'Rejected'),
          aiAuditScore: req.aiAuditScore ? String(req.aiAuditScore) : null,
          timestamp: verifiedAt
        });

        await tx.insert(documentAuditLogs).values({
          id: crypto.randomUUID(),
          documentId,
          actorId: verifierUuid,
          actorEmail: verifier.email,
          action: req.action,
          oldStatus: previousStatus,
          newStatus,
          reason: req.reason || (req.action === 'VERIFY' ? 'Approved by Compliance Officer' : 'Rejected'),
          metadata: {},
          timestamp: verifiedAt
        });

        let docType: any = null;
        try {
          const typeRows = await tx.select().from(documentTypes).where(eq(documentTypes.id, doc.documentTypeId));
          if (typeRows && typeRows.length > 0) {
            docType = typeRows[0];
          }
        } catch {
          // Fallback
        }

        if (!docType) {
          docType = MASTER_DOCUMENT_TYPES.find((m) => m.id === doc.documentTypeId);
        }

        const updatedDoc = {
          ...doc,
          verificationStatus: newStatus,
          verifiedBy: verifierUuid,
          verifiedAt,
          rejectionReason: rejectionReason || doc.rejectionReason
        };

        return this.mapToDto(updatedDoc, docType);
      });
    } catch (err) {
      handleDbError('verifyDocument', err);
    }
  }

  public async getVerificationQueue(
    filters?: { status?: string; role?: string; facilityType?: string; tenantId?: string; scope?: string },
    caller?: {
      userId?: string;
      tenantId?: string;
      roles?: string[];
      isSuperAdmin?: boolean;
      dataScope?: string;
    }
  ): Promise<EntityDocumentDto[]> {
    try {
      const db = requireDb();
      await this.ensureMasterDocumentTypes(db);
      const callerRoles = Array.isArray(caller?.roles) ? caller!.roles : [];
      const isAuthorizedHq =
        Boolean(caller?.isSuperAdmin) ||
        callerRoles.includes('SUPER_ADMIN') ||
        callerRoles.includes('COMPANY_ADMIN') ||
        callerRoles.includes('COMPLIANCE_OFFICER');

      const conditions = [eq(entityDocuments.isCurrent, true)];

      if (!isAuthorizedHq) {
        // Non-HQ partner/staff users must NEVER access the global verification queue or another tenant's documents
        if (!caller?.tenantId) {
          throw AppError.forbidden('Access denied: Missing tenant authorization context');
        }
        if (filters?.tenantId && ensureUuid(filters.tenantId) !== ensureUuid(caller.tenantId)) {
          throw AppError.forbidden('Access denied: Cross-tenant verification queue query is forbidden');
        }
        if (filters?.scope !== 'tenant') {
          throw AppError.forbidden(
            'Access denied: Only authorized HQ Compliance Officers or Company Admins may access the global verification queue.'
          );
        }
        conditions.push(eq(entityDocuments.tenantId, ensureUuid(caller.tenantId)));
      } else if (filters?.tenantId) {
        conditions.push(eq(entityDocuments.tenantId, ensureUuid(filters.tenantId)));
      }

      if (filters?.status && filters.status !== 'EXPIRED') {
        conditions.push(eq(entityDocuments.verificationStatus, filters.status));
      }
      if (filters?.role) conditions.push(eq(entityDocuments.role, filters.role));
      if (filters?.facilityType) conditions.push(eq(entityDocuments.facilityType, filters.facilityType));

      const rows = await db
        .select()
        .from(entityDocuments)
        .where(and(...conditions))
        .orderBy(desc(entityDocuments.uploadedAt));

      let allDocTypes: any[] = [];
      try {
        allDocTypes = await db.select().from(documentTypes);
      } catch {
        allDocTypes = MASTER_DOCUMENT_TYPES;
      }
      const typeMap = new Map(allDocTypes.map((t: any) => [t.id, t]));

      const mapped = rows.map((r: any) => this.mapToDto(r, typeMap.get(r.documentTypeId)));
      if (filters?.status === 'EXPIRED') {
        return mapped.filter((d) => d.verificationStatus === 'EXPIRED' || (d as any).isExpired);
      }
      if (filters?.status === 'VERIFIED') {
        return mapped.filter((d) => d.verificationStatus === 'VERIFIED' && !(d as any).isExpired);
      }
      return mapped;
    } catch (err) {
      handleDbError('getVerificationQueue', err);
    }
  }

  public async getDocumentById(
    documentId: string,
    caller?: {
      userId?: string;
      tenantId?: string;
      roles?: string[];
      isSuperAdmin?: boolean;
    }
  ): Promise<EntityDocumentDto | null> {
    try {
      const db = requireDb();
      await this.ensureMasterDocumentTypes(db);
      const rows = await db.select().from(entityDocuments).where(eq(entityDocuments.id, documentId));
      const row = rows[0];
      if (!row) return null;

      if (caller) {
        const callerRoles = Array.isArray(caller.roles) ? caller.roles : [];
        const isAuthorizedHq =
          Boolean(caller.isSuperAdmin) ||
          callerRoles.includes('SUPER_ADMIN') ||
          callerRoles.includes('COMPANY_ADMIN') ||
          callerRoles.includes('COMPLIANCE_OFFICER');

        if (!isAuthorizedHq && (!caller.tenantId || ensureUuid(caller.tenantId) !== row.tenantId)) {
          throw AppError.forbidden('Access denied: Cannot access compliance document belonging to another tenant');
        }
      }

      let docType: any = null;
      try {
        const typeRows = await db.select().from(documentTypes).where(eq(documentTypes.id, row.documentTypeId));
        if (typeRows && typeRows.length > 0) docType = typeRows[0];
      } catch {
        // Fallback
      }

      return this.mapToDto(row, docType);
    } catch (err) {
      handleDbError('getDocumentById', err);
    }
  }

  public async downloadDocumentBinary(
    documentId: string,
    caller: {
      userId: string;
      email?: string;
      tenantId?: string;
      roles?: string[];
      isSuperAdmin?: boolean;
    }
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string; sha256Hash: string; doc: EntityDocumentDto }> {
    try {
      const db = requireDb();
      const rows = await db.select().from(entityDocuments).where(eq(entityDocuments.id, documentId));
      const row = rows[0];
      if (!row) {
        throw AppError.notFound(`Document ${documentId} not found`);
      }

      const callerRoles = Array.isArray(caller.roles) ? caller.roles : [];
      const isAuthorizedHq =
        Boolean(caller.isSuperAdmin) ||
        callerRoles.includes('SUPER_ADMIN') ||
        callerRoles.includes('COMPANY_ADMIN') ||
        callerRoles.includes('COMPLIANCE_OFFICER');

      if (!isAuthorizedHq && (!caller.tenantId || ensureUuid(caller.tenantId) !== row.tenantId)) {
        throw AppError.forbidden('Access denied: Cross-tenant document download is strictly forbidden');
      }

      if (row.verificationStatus === 'REVOKED' || row.verificationStatus === 'DELETED') {
        throw new AppError({
          message: `Document ${documentId} has been ${row.verificationStatus} and cannot be downloaded.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }

      const absPath = this.resolveStorageFilePath(row.storageKey);
      if (!fs.existsSync(absPath)) {
        throw new AppError({
          message: `Stored binary object for document ${documentId} is missing from storage.`,
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      const buffer = fs.readFileSync(absPath);

      // INV-DOC-004: Verify SHA-256 checksum integrity on retrieval
      const actualSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      if (row.sha256Hash && actualSha256 !== row.sha256Hash) {
        throw new AppError({
          message: `Document checksum integrity verification failed for ${documentId}: stored hash (${row.sha256Hash}) does not match physical content hash (${actualSha256}).`,
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500
        });
      }

      await db.insert(documentAuditLogs).values({
        id: crypto.randomUUID(),
        documentId: row.id,
        actorId: ensureUuid(caller.userId),
        actorEmail: caller.email || 'authorized-user@docsearch.health',
        action: 'DOWNLOAD',
        oldStatus: row.verificationStatus,
        newStatus: row.verificationStatus,
        reason: 'Authorized binary document retrieval',
        metadata: { tenantId: row.tenantId, storageKey: row.storageKey, sha256Verified: true },
        timestamp: new Date()
      });

      return {
        buffer,
        mimeType: row.mimeType || 'application/pdf',
        fileName: row.fileName,
        sha256Hash: row.sha256Hash,
        doc: this.mapToDto(row)
      };
    } catch (err) {
      handleDbError('downloadDocumentBinary', err);
    }
  }

  public async revokeDocument(
    documentId: string,
    actor: { userId: string; email?: string; tenantId?: string; roles?: string[]; isSuperAdmin?: boolean },
    reason?: string
  ): Promise<EntityDocumentDto> {
    try {
      const db = requireDb();
      const rows = await db.select().from(entityDocuments).where(eq(entityDocuments.id, documentId));
      const row = rows[0];
      if (!row) {
        throw AppError.notFound(`Document ${documentId} not found`);
      }

      const callerRoles = Array.isArray(actor.roles) ? actor.roles : [];
      const isAuthorizedHq =
        Boolean(actor.isSuperAdmin) ||
        callerRoles.includes('SUPER_ADMIN') ||
        callerRoles.includes('COMPANY_ADMIN') ||
        callerRoles.includes('COMPLIANCE_OFFICER');

      if (!isAuthorizedHq && (!actor.tenantId || ensureUuid(actor.tenantId) !== row.tenantId)) {
        throw AppError.forbidden('Access denied: Cannot revoke document belonging to another tenant');
      }

      await db
        .update(entityDocuments)
        .set({
          verificationStatus: 'REVOKED',
          isCurrent: false,
          updatedAt: new Date()
        })
        .where(eq(entityDocuments.id, documentId));

      await db.insert(documentAuditLogs).values({
        id: crypto.randomUUID(),
        documentId: row.id,
        actorId: ensureUuid(actor.userId),
        actorEmail: actor.email || 'actor@docsearch.health',
        action: 'REVOKE',
        oldStatus: row.verificationStatus,
        newStatus: 'REVOKED',
        reason: reason || 'Document revoked',
        metadata: {},
        timestamp: new Date()
      });

      return this.mapToDto({ ...row, verificationStatus: 'REVOKED', isCurrent: false });
    } catch (err) {
      handleDbError('revokeDocument', err);
    }
  }

  public async getDocumentAuditLogs(documentId: string) {
    try {
      const db = requireDb();
      return await db
        .select()
        .from(documentAuditLogs)
        .where(eq(documentAuditLogs.documentId, documentId))
        .orderBy(desc(documentAuditLogs.timestamp));
    } catch (err) {
      handleDbError('getDocumentAuditLogs', err);
    }
  }

  private mapToDto(row: any, docType?: any): EntityDocumentDto {
    const matchedType =
      docType || MASTER_DOCUMENT_TYPES.find((m) => m.id === row.documentTypeId || m.code === row.documentTypeCode);
    const meta = (row.metadata as Record<string, unknown>) || {};
    const hasRealOcr = row.aiMatchScore != null && meta['ocrStatus'] === 'PROCESSED';

    const normalizedExpiryDate = row.expiryDate
      ? typeof row.expiryDate === 'string'
        ? row.expiryDate.split('T')[0] || null
        : row.expiryDate instanceof Date
        ? row.expiryDate.toISOString().split('T')[0] || null
        : String(row.expiryDate).split('T')[0] || null
      : null;

    const todayServerStr = new Date().toISOString().split('T')[0] || '';
    const isExpired = Boolean(normalizedExpiryDate && normalizedExpiryDate < todayServerStr);

    const rawVerificationStatus = String(row.verificationStatus || 'PENDING_VERIFICATION');
    // Required Rule (Section 16):
    // VERIFIED AND expiryDate >= today => valid verified document ('VERIFIED')
    // VERIFIED AND expiryDate < today  => expired document ('EXPIRED')
    const effectiveVerificationStatus =
      rawVerificationStatus === 'VERIFIED' && isExpired
        ? 'EXPIRED'
        : rawVerificationStatus;

    const validityState =
      rawVerificationStatus === 'VERIFIED'
        ? isExpired
          ? 'VERIFIED_EXPIRED'
          : 'VERIFIED_VALID'
        : isExpired
          ? 'EXPIRED'
          : rawVerificationStatus;

    const isValid = rawVerificationStatus === 'VERIFIED' && !isExpired;

    return {
      id: row.id,
      documentTypeId: row.documentTypeId,
      documentTypeCode: matchedType?.code || 'UNKNOWN',
      documentTypeName: matchedType?.name || 'Unknown Document',
      documentCategory: (matchedType?.documentCategory || 'OTHER') as any,
      tenantId: row.tenantId,
      ownerEntityId: row.ownerEntityId,
      ownerEntityType: row.ownerEntityType,
      role: row.role ?? null,
      facilityType: row.facilityType ?? null,
      documentNumber: row.documentNumber ?? null,
      issuingAuthority: row.issuingAuthority ?? null,
      issueDate: row.issueDate
        ? typeof row.issueDate === 'string'
          ? row.issueDate.split('T')[0] || null
          : row.issueDate instanceof Date
          ? row.issueDate.toISOString().split('T')[0] || null
          : String(row.issueDate)
        : null,
      expiryDate: normalizedExpiryDate,
      fileName: row.fileName,
      storageKey: row.storageKey,
      fileUrl: row.fileUrl,
      mimeType: row.mimeType || 'application/pdf',
      fileSizeBytes: Number(row.fileSizeBytes || 0),
      sha256Hash: row.sha256Hash,
      aiMatchScore: hasRealOcr ? Number(row.aiMatchScore) : null,
      aiExtractedText: hasRealOcr ? (row.aiExtractedText ?? null) : null,
      uploadedBy: row.uploadedBy,
      uploadedAt: row.uploadedAt instanceof Date ? row.uploadedAt.toISOString() : String(row.uploadedAt),
      verificationStatus: effectiveVerificationStatus as any,
      verifiedBy: row.verifiedBy ?? null,
      verifiedAt: row.verifiedAt
        ? row.verifiedAt instanceof Date
          ? row.verifiedAt.toISOString()
          : String(row.verifiedAt)
        : null,
      rejectionReason: row.rejectionReason ?? null,
      version: Number(row.version || 1),
      isCurrent: Boolean(row.isCurrent),
      isExpired,
      isValid,
      validityState,
      rawVerificationStatus,
      metadata: {
        ...meta,
        ocrStatus: meta['ocrStatus'] || (hasRealOcr ? 'PROCESSED' : 'NOT_PROCESSED'),
        isExpired,
        isValid,
        validityState,
        rawVerificationStatus
      }
    } as any;
  }
}

export const documentVerificationRepository = new DocumentVerificationRepository();

