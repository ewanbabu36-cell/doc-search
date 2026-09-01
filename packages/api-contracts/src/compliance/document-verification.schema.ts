import { z } from 'zod';

export const DocumentCategorySchema = z.enum([
  'QUALIFICATION',
  'REGISTRATION',
  'LICENSE',
  'EXPERIENCE',
  'ACCREDITATION',
  'IDENTITY',
  'FACILITY',
  'TRAINING',
  'OTHER'
]);
export type DocumentCategory = z.infer<typeof DocumentCategorySchema>;

export const DocumentVerificationStatusSchema = z.enum([
  'NOT_UPLOADED',
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
  'SUPERSEDED'
]);
export type DocumentVerificationStatus = z.infer<typeof DocumentVerificationStatusSchema>;

export const DocumentTypeDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  documentCategory: DocumentCategorySchema,
  applicableEntityType: z.enum(['FACILITY', 'PROFESSIONAL', 'STAFF', 'TENANT']),
  applicableRole: z.string().optional().nullable(),
  facilityType: z.string().optional().nullable(),
  isRequired: z.boolean(),
  isConditional: z.boolean(),
  conditionExpression: z.string().optional().nullable(),
  allowedFileTypes: z.array(z.string()).default(['application/pdf', 'image/png', 'image/jpeg']),
  maxFileSizeBytes: z.number().default(10485760),
  requiresExpiry: z.boolean().default(false),
  requiresRegistrationNumber: z.boolean().default(false),
  requiresIssuingAuthority: z.boolean().default(false),
  requiresIssueDate: z.boolean().default(false),
  requiresVerification: z.boolean().default(true),
  active: z.boolean().default(true),
  displayOrder: z.number().default(0)
});
export type DocumentTypeDto = z.infer<typeof DocumentTypeDtoSchema>;

export const EntityDocumentDtoSchema = z.object({
  id: z.string().uuid(),
  documentTypeId: z.string().uuid(),
  documentTypeCode: z.string(),
  documentTypeName: z.string(),
  documentCategory: DocumentCategorySchema,
  tenantId: z.string().uuid(),
  ownerEntityId: z.string().uuid(),
  ownerEntityType: z.string(),
  role: z.string().optional().nullable(),
  facilityType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  issuingAuthority: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  fileName: z.string(),
  storageKey: z.string(),
  fileUrl: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number(),
  sha256Hash: z.string(),
  aiMatchScore: z.number().optional().nullable(),
  aiExtractedText: z.string().optional().nullable(),
  uploadedBy: z.string().uuid(),
  uploadedAt: z.string(),
  verificationStatus: DocumentVerificationStatusSchema,
  verifiedBy: z.string().uuid().optional().nullable(),
  verifiedAt: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  version: z.number(),
  isCurrent: z.boolean(),
  metadata: z.record(z.unknown()).default({})
});
export type EntityDocumentDto = z.infer<typeof EntityDocumentDtoSchema>;

export const RoleDocumentRequirementItemSchema = z.object({
  documentType: DocumentTypeDtoSchema,
  isMandatory: z.boolean(),
  isConditional: z.boolean(),
  conditionMet: z.boolean(),
  status: DocumentVerificationStatusSchema,
  currentDocument: EntityDocumentDtoSchema.optional().nullable(),
  missingReason: z.string().optional().nullable()
});
export type RoleDocumentRequirementItem = z.infer<typeof RoleDocumentRequirementItemSchema>;

export const RoleDocumentRequirementsResponseSchema = z.object({
  entityType: z.string(),
  role: z.string().optional().nullable(),
  facilityType: z.string().optional().nullable(),
  professionalType: z.string().optional().nullable(),
  totalRequirements: z.number(),
  mandatoryCount: z.number(),
  verifiedCount: z.number(),
  pendingCount: z.number(),
  isFullyCompliant: z.boolean(),
  submissionBlocked: z.boolean(),
  blockingReasons: z.array(z.string()),
  requirements: z.array(RoleDocumentRequirementItemSchema)
});
export type RoleDocumentRequirementsResponse = z.infer<typeof RoleDocumentRequirementsResponseSchema>;

export const UploadDocumentRequestSchema = z.object({
  documentTypeCode: z.string(),
  ownerEntityId: z.string().uuid(),
  ownerEntityType: z.enum(['TENANT', 'BRANCH', 'USER', 'STAFF']),
  role: z.string().optional(),
  facilityType: z.string().optional(),
  documentNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  fileName: z.string(),
  fileBase64: z.string().optional(),
  mimeType: z.string().default('application/pdf'),
  fileSizeBytes: z.number().default(1024),
  aiMatchScore: z.number().optional(),
  aiExtractedText: z.string().optional()
});
export type UploadDocumentRequest = z.infer<typeof UploadDocumentRequestSchema>;

export const VerifyDocumentRequestSchema = z.object({
  action: z.enum(['VERIFY', 'REJECT', 'REQUEST_REUPLOAD']),
  reason: z.string().optional(),
  aiAuditScore: z.number().optional()
});
export type VerifyDocumentRequest = z.infer<typeof VerifyDocumentRequestSchema>;

export const DocumentAuditLogDtoSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  actorEmail: z.string(),
  action: z.string(),
  oldStatus: z.string().optional().nullable(),
  newStatus: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  timestamp: z.string()
});
export type DocumentAuditLogDto = z.infer<typeof DocumentAuditLogDtoSchema>;
