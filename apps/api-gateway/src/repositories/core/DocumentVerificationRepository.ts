import crypto from 'node:crypto';
import type {
  RoleDocumentRequirementsResponse,
  RoleDocumentRequirementItem,
  UploadDocumentRequest,
  VerifyDocumentRequest,
  EntityDocumentDto
} from '@docsearch/api-contracts';

// In-Memory Master Store & Database Integration Bridge
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
    id: 'dt-doc-001',
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
    id: 'dt-doc-002',
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
    id: 'dt-doc-003',
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
    id: 'dt-doc-004',
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
    id: 'dt-lab-001',
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
    id: 'dt-lab-002',
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
    id: 'dt-lab-003',
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
    id: 'dt-hosp-001',
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
    id: 'dt-hosp-002',
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
    id: 'dt-hosp-003',
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
    id: 'dt-pharm-001',
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
    id: 'dt-pharm-002',
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

  // --- STAFF & ALLIED HEALTH REQUIREMENTS ---
  {
    id: 'dt-staff-001',
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
    id: 'dt-staff-002',
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
    id: 'dt-staff-003',
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
  private documentsStore: Map<string, EntityDocumentDto> = new Map();
  private auditLogsStore: any[] = [];

  constructor() {
    this.seedInitialDocuments();
  }

  private seedInitialDocuments() {
    // Seed Tata Pathology Lab NABL Verified Document
    const tataDocId = 'doc-tata-nabl-001';
    this.documentsStore.set(tataDocId, {
      id: tataDocId,
      documentTypeId: 'dt-lab-001',
      documentTypeCode: 'LAB_NABL_ACCREDITATION',
      documentTypeName: 'NABL ISO 15189:2022 Accreditation Certificate',
      documentCategory: 'ACCREDITATION',
      tenantId: '11111111-1111-4111-8111-111111111111',
      ownerEntityId: '11111111-1111-4111-8111-111111111111',
      ownerEntityType: 'TENANT',
      role: 'PATHOLOGIST',
      facilityType: 'LABORATORY',
      documentNumber: 'MC-4892-2026',
      issuingAuthority: 'National Accreditation Board for Testing and Calibration Laboratories',
      issueDate: '2024-01-15',
      expiryDate: '2028-12-31',
      fileName: 'nabl_iso15189_accreditation.pdf',
      storageKey: 'tenants/tata/documents/nabl_cert.pdf',
      fileUrl: '/storage/tenants/tata/documents/nabl_cert.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2048500,
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      aiMatchScore: 99.4,
      aiExtractedText: 'NABL ISO 15189:2022 CERTIFICATE MC-4892 TATA PATHOLOGY LAB VALID UNTIL 31-DEC-2028',
      uploadedBy: '99999999-9999-4999-8999-999999999999',
      uploadedAt: '2026-08-15T10:00:00.000Z',
      verificationStatus: 'VERIFIED',
      verifiedBy: '11111111-1111-4111-8111-000000000001',
      verifiedAt: '2026-08-15T11:30:00.000Z',
      version: 1,
      isCurrent: true,
      metadata: {}
    });
  }

  public getRequirements(params: {
    entityType?: string;
    role?: string;
    facilityType?: string;
    professionalType?: string;
    tenantId: string;
    ownerEntityId: string;
    specialization?: string;
    nabhClaimed?: boolean;
  }): RoleDocumentRequirementsResponse {
    const role = (params.role || '').toUpperCase();
    const facilityType = (params.facilityType || '').toUpperCase();

    // Filter relevant document types dynamically
    const applicableTypes = MASTER_DOCUMENT_TYPES.filter((dt) => {
      if (role.includes('DOCTOR') || role.includes('SURGEON') || role.includes('PHYSICIAN')) {
        return dt.applicableRole === 'DOCTOR';
      }
      if (facilityType === 'LABORATORY' || role.includes('PATHOLOGIST')) {
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

    // Check currently uploaded documents for this owner
    const existingDocs = Array.from(this.documentsStore.values()).filter(
      (d) => d.ownerEntityId === params.ownerEntityId && d.isCurrent
    );

    const requirementItems: RoleDocumentRequirementItem[] = applicableTypes.map((dt) => {
      const currentDoc = existingDocs.find((d) => d.documentTypeId === dt.id || d.documentTypeCode === dt.code);
      let conditionMet = true;

      if (dt.isConditional) {
        if (dt.code === 'DOC_SPECIALIZATION_CERT' && !params.specialization) {
          conditionMet = false;
        }
        if (dt.code === 'HOSP_NABH_ACCREDITATION' && !params.nabhClaimed) {
          conditionMet = false;
        }
      }

      const status = currentDoc ? currentDoc.verificationStatus : 'NOT_UPLOADED';
      const missingReason = !currentDoc && dt.isRequired ? 'Mandatory regulatory document missing' : null;

      return {
        documentType: dt,
        isMandatory: dt.isRequired && conditionMet,
        isConditional: dt.isConditional,
        conditionMet,
        status,
        currentDocument: currentDoc || null,
        missingReason
      };
    });

    const mandatoryItems = requirementItems.filter((r) => r.isMandatory);
    const verifiedItems = requirementItems.filter((r) => r.status === 'VERIFIED');
    const pendingItems = requirementItems.filter((r) => r.status === 'PENDING_VERIFICATION');

    const missingMandatory = mandatoryItems.filter((r) => r.status !== 'VERIFIED');
    const submissionBlocked = missingMandatory.length > 0;
    const blockingReasons = missingMandatory.map(
      (m) => `Missing mandatory verification for: ${m.documentType.name}`
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
      isFullyCompliant: !submissionBlocked,
      submissionBlocked,
      blockingReasons,
      requirements: requirementItems
    };
  }

  public uploadDocument(
    data: UploadDocumentRequest,
    actor: { id: string; email: string; tenantId: string }
  ): EntityDocumentDto {
    const docType = MASTER_DOCUMENT_TYPES.find((dt) => dt.code === data.documentTypeCode) || MASTER_DOCUMENT_TYPES[0]!;

    // Find any existing version and supersede it
    const existing = Array.from(this.documentsStore.values()).find(
      (d) => d.ownerEntityId === data.ownerEntityId && d.documentTypeId === docType.id && d.isCurrent
    );

    let nextVersion = 1;
    if (existing) {
      existing.isCurrent = false;
      existing.verificationStatus = 'SUPERSEDED';
      nextVersion = existing.version + 1;
    }

    const docId = `doc-${crypto.randomUUID()}`;
    const sha256 = crypto
      .createHash('sha256')
      .update(`${data.fileName}-${Date.now()}-${data.documentNumber || ''}`)
      .digest('hex');

    const newDoc: EntityDocumentDto = {
      id: docId,
      documentTypeId: docType.id,
      documentTypeCode: docType.code,
      documentTypeName: docType.name,
      documentCategory: docType.documentCategory,
      tenantId: actor.tenantId,
      ownerEntityId: data.ownerEntityId,
      ownerEntityType: data.ownerEntityType,
      role: data.role || null,
      facilityType: data.facilityType || null,
      documentNumber: data.documentNumber || null,
      issuingAuthority: data.issuingAuthority || null,
      issueDate: data.issueDate || null,
      expiryDate: data.expiryDate || null,
      fileName: data.fileName,
      storageKey: `tenants/${actor.tenantId}/documents/${docId}_${data.fileName}`,
      fileUrl: `/storage/tenants/${actor.tenantId}/documents/${docId}_${data.fileName}`,
      mimeType: data.mimeType || 'application/pdf',
      fileSizeBytes: data.fileSizeBytes || 1048576,
      sha256Hash: sha256,
      aiMatchScore: data.aiMatchScore || 99.4,
      aiExtractedText: data.aiExtractedText || `VERIFIED REGULATORY DOCUMENT: ${data.fileName} • ${data.documentNumber || ''}`,
      uploadedBy: actor.id,
      uploadedAt: new Date().toISOString(),
      verificationStatus: 'PENDING_VERIFICATION',
      version: nextVersion,
      isCurrent: true,
      metadata: {}
    };

    if (existing) {
      existing.metadata = { ...existing.metadata, supersededBy: docId };
    }

    this.documentsStore.set(docId, newDoc);

    // Audit Log Entry
    this.auditLogsStore.push({
      id: crypto.randomUUID(),
      documentId: docId,
      actorEmail: actor.email,
      action: 'UPLOAD',
      oldStatus: existing ? 'SUPERSEDED' : 'NOT_UPLOADED',
      newStatus: 'PENDING_VERIFICATION',
      reason: `Uploaded version ${nextVersion} for ${docType.name}`,
      timestamp: new Date().toISOString()
    });

    return newDoc;
  }

  public verifyDocument(
    documentId: string,
    req: VerifyDocumentRequest,
    verifier: { id: string; email: string }
  ): EntityDocumentDto {
    const doc = this.documentsStore.get(documentId);
    if (!doc) {
      throw new Error(`Document with ID ${documentId} was not found.`);
    }

    const previousStatus = doc.verificationStatus;
    const newStatus = req.action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';

    doc.verificationStatus = newStatus;
    doc.verifiedBy = verifier.id;
    doc.verifiedAt = new Date().toISOString();
    if (req.action === 'REJECT') {
      doc.rejectionReason = req.reason || 'Document verification failed compliance criteria.';
    }

    this.auditLogsStore.push({
      id: crypto.randomUUID(),
      documentId,
      actorEmail: verifier.email,
      action: req.action,
      previousStatus,
      newStatus,
      reason: req.reason || (req.action === 'VERIFY' ? 'Approved by Compliance Officer' : 'Rejected'),
      timestamp: new Date().toISOString()
    });

    return doc;
  }

  public getVerificationQueue(filters?: { status?: string; role?: string; facilityType?: string }) {
    const all = Array.from(this.documentsStore.values()).filter((d) => d.isCurrent);
    if (!filters) return all;

    return all.filter((d) => {
      if (filters.status && d.verificationStatus !== filters.status) return false;
      if (filters.role && d.role !== filters.role) return false;
      if (filters.facilityType && d.facilityType !== filters.facilityType) return false;
      return true;
    });
  }
}

export const documentVerificationRepository = new DocumentVerificationRepository();
