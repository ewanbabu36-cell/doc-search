import { z } from 'zod';

export const ComplianceFrameworkTypeSchema = z.enum([
  'HIPAA',
  'SOC2',
  'INTERNAL_CONTROL',
  'DATA_GOVERNANCE'
]);
export type ComplianceFrameworkType = z.infer<typeof ComplianceFrameworkTypeSchema>;

export const ComplianceControlStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'EVIDENCE_REQUIRED',
  'READY_FOR_REVIEW',
  'VERIFIED',
  'EXCEPTION',
  'RETIRED'
]);
export type ComplianceControlStatus = z.infer<typeof ComplianceControlStatusSchema>;

export const EvidenceTypeSchema = z.enum([
  'POLICY_DOCUMENT',
  'AUDIT_LOG',
  'CONFIGURATION_RECORD',
  'ACCESS_REVIEW',
  'TRAINING_RECORD',
  'VENDOR_DOCUMENT',
  'BAA_DOCUMENT',
  'SYSTEM_CONTROL',
  'VERIFICATION_RECORD'
]);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const EvidenceStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED'
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

export const DataClassificationSchema = z.enum([
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
  'PHI_RESTRICTED'
]);
export type DataClassification = z.infer<typeof DataClassificationSchema>;

export const RetentionPolicyStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'SUSPENDED',
  'RETIRED'
]);
export type RetentionPolicyStatus = z.infer<typeof RetentionPolicyStatusSchema>;

export const BAAStatusSchema = z.enum([
  'NOT_REQUIRED',
  'PENDING',
  'ACTIVE',
  'EXPIRING',
  'EXPIRED',
  'TERMINATED'
]);
export type BAAStatus = z.infer<typeof BAAStatusSchema>;

export const GovernanceExceptionStatusSchema = z.enum([
  'REQUESTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CLOSED'
]);
export type GovernanceExceptionStatus = z.infer<typeof GovernanceExceptionStatusSchema>;

export const VerificationStatusSchema = z.enum([
  'PENDING',
  'VERIFIED',
  'FAILED',
  'REQUIRES_REVIEW'
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

// DTOs
export const ComplianceFrameworkDtoSchema = z.object({
  id: z.string().uuid(),
  frameworkCode: z.string().min(2),
  frameworkType: ComplianceFrameworkTypeSchema,
  name: z.string().min(2),
  description: z.string(),
  version: z.string().default('1.0.0'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  controlCount: z.number().int().min(0).default(0),
  verifiedControlCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ComplianceFrameworkDto = z.infer<typeof ComplianceFrameworkDtoSchema>;

export const ComplianceControlDtoSchema = z.object({
  id: z.string().uuid(),
  frameworkId: z.string().uuid(),
  frameworkCode: z.string().optional(),
  controlCode: z.string().min(2),
  title: z.string().min(2),
  description: z.string(),
  controlCategory: z.string().min(2),
  controlStatus: ComplianceControlStatusSchema,
  requirementSummary: z.string(),
  implementationNotes: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  reviewDueDate: z.string().datetime().optional(),
  lastVerifiedAt: z.string().datetime().optional(),
  evidenceCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ComplianceControlDto = z.infer<typeof ComplianceControlDtoSchema>;

export const ComplianceEvidenceDtoSchema = z.object({
  id: z.string().uuid(),
  evidenceCode: z.string().min(2),
  evidenceType: EvidenceTypeSchema,
  title: z.string().min(2),
  description: z.string(),
  sourceDomain: z.string().min(2),
  sourceReference: z.string(),
  evidenceStatus: EvidenceStatusSchema,
  collectedAt: z.string().datetime(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  submittedById: z.string().uuid().optional(),
  submittedByEmail: z.string().email(),
  reviewedById: z.string().uuid().optional(),
  reviewedByEmail: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
  linkedControlCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ComplianceEvidenceDto = z.infer<typeof ComplianceEvidenceDtoSchema>;

export const ComplianceControlMappingDtoSchema = z.object({
  id: z.string().uuid(),
  controlId: z.string().uuid(),
  controlCode: z.string().optional(),
  controlTitle: z.string().optional(),
  evidenceId: z.string().uuid(),
  evidenceCode: z.string().optional(),
  evidenceTitle: z.string().optional(),
  evidenceType: EvidenceTypeSchema.optional(),
  mappingStatus: z.enum(['ACTIVE', 'DEPRECATED']).default('ACTIVE'),
  mappingNotes: z.string().optional(),
  mappedById: z.string().uuid().optional(),
  mappedByEmail: z.string().email(),
  mappedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).default({})
});
export type ComplianceControlMappingDto = z.infer<typeof ComplianceControlMappingDtoSchema>;

export const DataClassificationDtoSchema = z.object({
  id: z.string().uuid(),
  classificationCode: z.string().min(2),
  name: z.string().min(2),
  classificationLevel: DataClassificationSchema,
  description: z.string(),
  handlingRequirements: z.array(z.string()).default([]),
  exportAllowed: z.boolean().default(false),
  externalSharingAllowed: z.boolean().default(false),
  retentionRequired: z.boolean().default(true),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  status: z.enum(['ACTIVE', 'DEPRECATED']).default('ACTIVE'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type DataClassificationDto = z.infer<typeof DataClassificationDtoSchema>;

export const DataRetentionPolicyDtoSchema = z.object({
  id: z.string().uuid(),
  policyCode: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  status: RetentionPolicyStatusSchema,
  defaultRetentionDays: z.number().int().min(1),
  legalHoldSupported: z.boolean().default(true),
  deletionMethod: z.string().default('CRYPTOGRAPHIC_ERASURE'),
  archiveBeforeDelete: z.boolean().default(true),
  approvalRequired: z.boolean().default(true),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  version: z.string().default('1.0.0'),
  rulesCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type DataRetentionPolicyDto = z.infer<typeof DataRetentionPolicyDtoSchema>;

export const DataRetentionRuleDtoSchema = z.object({
  id: z.string().uuid(),
  retentionPolicyId: z.string().uuid(),
  dataDomain: z.string().min(2),
  resourceType: z.string().min(2),
  classificationLevel: DataClassificationSchema,
  retentionDays: z.number().int().min(1),
  legalHoldBehavior: z.string().default('SUSPEND_DELETION'),
  deletionBehavior: z.string().default('PURGE_AND_AUDIT'),
  archiveBehavior: z.string().default('COLD_STORAGE_ENCRYPTED'),
  exceptionAllowed: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type DataRetentionRuleDto = z.infer<typeof DataRetentionRuleDtoSchema>;

export const BAARecordDtoSchema = z.object({
  id: z.string().uuid(),
  baaCode: z.string().min(2),
  partnerId: z.string().uuid().optional(),
  partnerName: z.string().min(2),
  status: BAAStatusSchema,
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  signedReference: z.string(),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  reviewDueDate: z.string().datetime().optional(),
  terminationDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type BAARecordDto = z.infer<typeof BAARecordDtoSchema>;

export const GovernanceExceptionDtoSchema = z.object({
  id: z.string().uuid(),
  exceptionCode: z.string().min(2),
  title: z.string().min(2),
  description: z.string(),
  frameworkId: z.string().uuid().optional(),
  frameworkCode: z.string().optional(),
  controlId: z.string().uuid().optional(),
  controlCode: z.string().optional(),
  requestedById: z.string().uuid().optional(),
  requestedByEmail: z.string().email(),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  status: GovernanceExceptionStatusSchema,
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  justification: z.string().min(5),
  compensatingControls: z.string().min(5),
  requestedExpirationDate: z.string().datetime().optional(),
  approvedById: z.string().uuid().optional(),
  approvedByEmail: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  closedAt: z.string().datetime().optional(),
  closureNotes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type GovernanceExceptionDto = z.infer<typeof GovernanceExceptionDtoSchema>;

export const ComplianceVerificationDtoSchema = z.object({
  id: z.string().uuid(),
  verificationCode: z.string().min(2),
  controlId: z.string().uuid(),
  controlCode: z.string().optional(),
  verificationType: z.string().min(2),
  status: VerificationStatusSchema,
  verifierId: z.string().uuid().optional(),
  verifierEmail: z.string().email(),
  verificationDate: z.string().datetime(),
  evidenceReference: z.string(),
  findings: z.string(),
  remediationRequired: z.boolean().default(false),
  remediationDueDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type ComplianceVerificationDto = z.infer<typeof ComplianceVerificationDtoSchema>;

export const ComplianceReportDtoSchema = z.object({
  id: z.string().uuid(),
  reportCode: z.string().min(2),
  reportName: z.string().min(2),
  frameworkType: ComplianceFrameworkTypeSchema,
  reportingPeriodStart: z.string().datetime(),
  reportingPeriodEnd: z.string().datetime(),
  outputFormat: z.string().default('PDF_AND_JSON'),
  status: z.enum(['GENERATING', 'COMPLETED', 'FAILED']).default('COMPLETED'),
  generatedAt: z.string().datetime(),
  generatedById: z.string().uuid().optional(),
  generatedByEmail: z.string().email(),
  evidenceReference: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type ComplianceReportDto = z.infer<typeof ComplianceReportDtoSchema>;

export const ComplianceOverviewDtoSchema = z.object({
  activeFrameworksCount: z.number().int().min(0),
  totalControlsCount: z.number().int().min(0),
  controlsRequiringReviewCount: z.number().int().min(0),
  evidenceRequiringReviewCount: z.number().int().min(0),
  expiringEvidenceCount: z.number().int().min(0),
  activeBAACount: z.number().int().min(0),
  expiringBAACount: z.number().int().min(0),
  activeRetentionPoliciesCount: z.number().int().min(0),
  openExceptionsCount: z.number().int().min(0),
  pendingVerificationsCount: z.number().int().min(0),
  telemetryStatus: z.string()
});
export type ComplianceOverviewDto = z.infer<typeof ComplianceOverviewDtoSchema>;

// Requests
export const CreateComplianceFrameworkRequestSchema = z.object({
  frameworkCode: z.string().min(2),
  frameworkType: ComplianceFrameworkTypeSchema,
  name: z.string().min(2),
  description: z.string().min(5),
  version: z.string().default('1.0.0'),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateComplianceFrameworkRequest = z.infer<typeof CreateComplianceFrameworkRequestSchema>;

export const CreateComplianceControlRequestSchema = z.object({
  frameworkId: z.string().uuid(),
  controlCode: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(5),
  controlCategory: z.string().min(2),
  requirementSummary: z.string().min(5),
  ownerEmail: z.string().email(),
  reviewDueDate: z.string().datetime().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateComplianceControlRequest = z.infer<typeof CreateComplianceControlRequestSchema>;

export const CreateComplianceEvidenceRequestSchema = z.object({
  evidenceCode: z.string().min(2),
  evidenceType: EvidenceTypeSchema,
  title: z.string().min(2),
  description: z.string().min(5),
  sourceDomain: z.string().min(2),
  sourceReference: z.string().min(2),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  submittedByEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateComplianceEvidenceRequest = z.infer<typeof CreateComplianceEvidenceRequestSchema>;

export const MapEvidenceToControlRequestSchema = z.object({
  controlId: z.string().uuid(),
  evidenceId: z.string().uuid(),
  mappingNotes: z.string().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type MapEvidenceToControlRequest = z.infer<typeof MapEvidenceToControlRequestSchema>;

export const CreateRetentionPolicyRequestSchema = z.object({
  policyCode: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(5),
  defaultRetentionDays: z.number().int().min(1),
  legalHoldSupported: z.boolean().default(true),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateRetentionPolicyRequest = z.infer<typeof CreateRetentionPolicyRequestSchema>;

export const CreateBAARecordRequestSchema = z.object({
  baaCode: z.string().min(2),
  partnerId: z.string().uuid().optional(),
  partnerName: z.string().min(2),
  status: BAAStatusSchema.default('ACTIVE'),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  signedReference: z.string().min(2),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateBAARecordRequest = z.infer<typeof CreateBAARecordRequestSchema>;

export const CreateGovernanceExceptionRequestSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  frameworkId: z.string().uuid().optional(),
  controlId: z.string().uuid().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  justification: z.string().min(5),
  compensatingControls: z.string().min(5),
  requestedExpirationDate: z.string().datetime().optional(),
  requestedByEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateGovernanceExceptionRequest = z.infer<typeof CreateGovernanceExceptionRequestSchema>;

export const ReviewGovernanceExceptionRequestSchema = z.object({
  exceptionId: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED', 'CLOSED']),
  closureNotes: z.string().min(3),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ReviewGovernanceExceptionRequest = z.infer<typeof ReviewGovernanceExceptionRequestSchema>;

export const VerifyComplianceControlRequestSchema = z.object({
  controlId: z.string().uuid(),
  verificationType: z.string().min(2),
  status: VerificationStatusSchema,
  evidenceReference: z.string().min(2),
  findings: z.string().min(3),
  remediationRequired: z.boolean().default(false),
  remediationDueDate: z.string().datetime().optional(),
  verifierEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type VerifyComplianceControlRequest = z.infer<typeof VerifyComplianceControlRequestSchema>;

export const GenerateComplianceReportRequestSchema = z.object({
  reportName: z.string().min(2),
  frameworkType: ComplianceFrameworkTypeSchema,
  reportingPeriodStart: z.string().datetime(),
  reportingPeriodEnd: z.string().datetime(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type GenerateComplianceReportRequest = z.infer<typeof GenerateComplianceReportRequestSchema>;
