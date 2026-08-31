import { z } from 'zod';

// ============================================================================
// ENUMS & LITERALS
// ============================================================================

export const PayerTypeEnum = z.enum([
  'COMMERCIAL_INSURANCE',
  'TPA',
  'GOVERNMENT_HEALTHCARE',
  'CORPORATE_DIRECT',
  'CASH_SELFPAY'
]);
export type PayerType = z.infer<typeof PayerTypeEnum>;

export const PayerStatusEnum = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
  'UNDER_REVIEW'
]);
export type PayerStatus = z.infer<typeof PayerStatusEnum>;

export const ClaimSubmissionModeEnum = z.enum([
  'EDI_ELECTRONIC',
  'PAYER_PORTAL',
  'API_DIRECT',
  'PHYSICAL_BATCH'
]);
export type ClaimSubmissionMode = z.infer<typeof ClaimSubmissionModeEnum>;

export const InsurancePlanTypeEnum = z.enum([
  'COMPREHENSIVE',
  'OPD_ONLY',
  'IPD_CATASTROPHIC',
  'DENTAL_VISION',
  'SENIOR_GOLD',
  'CORPORATE_CUSTOM'
]);
export type InsurancePlanType = z.infer<typeof InsurancePlanTypeEnum>;

export const NetworkTierEnum = z.enum([
  'TIER_1_IN_NETWORK',
  'TIER_2_PREFERRED',
  'OUT_OF_NETWORK'
]);
export type NetworkTier = z.infer<typeof NetworkTierEnum>;

export const PolicyCoverageStatusEnum = z.enum([
  'ACTIVE',
  'EXPIRED',
  'LAPSED',
  'TERMINATED'
]);
export type PolicyCoverageStatus = z.infer<typeof PolicyCoverageStatusEnum>;

export const PolicyVerificationStatusEnum = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'EXPIRED'
]);
export type PolicyVerificationStatus = z.infer<typeof PolicyVerificationStatusEnum>;

export const PolicyPriorityEnum = z.enum([
  'PRIMARY',
  'SECONDARY',
  'TERTIARY'
]);
export type PolicyPriority = z.infer<typeof PolicyPriorityEnum>;

export const SubscriberRelationshipEnum = z.enum([
  'SELF',
  'SPOUSE',
  'CHILD',
  'PARENT',
  'EMPLOYEE',
  'OTHER'
]);
export type SubscriberRelationship = z.infer<typeof SubscriberRelationshipEnum>;

export const EligibilityStatusEnum = z.enum([
  'ELIGIBLE',
  'PARTIALLY_ELIGIBLE',
  'INELIGIBLE',
  'PROCESSING',
  'ERROR'
]);
export type EligibilityStatus = z.infer<typeof EligibilityStatusEnum>;

export const AuthorizationStatusEnum = z.enum([
  'REQUESTED',
  'SUBMITTED',
  'PENDING',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'DENIED',
  'EXPIRED',
  'CANCELLED'
]);
export type AuthorizationStatus = z.infer<typeof AuthorizationStatusEnum>;

export const ClaimTypeEnum = z.enum([
  'OUTPATIENT',
  'INPATIENT',
  'EMERGENCY',
  'DAY_CARE',
  'PHARMACY_DIRECT',
  'DIAGNOSTIC_DIRECT'
]);
export type ClaimType = z.infer<typeof ClaimTypeEnum>;

export const ClaimStatusEnum = z.enum([
  'DRAFT',
  'READY_FOR_SUBMISSION',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'PROCESSING',
  'ADJUDICATED',
  'PARTIALLY_APPROVED',
  'APPROVED',
  'DENIED',
  'APPEAL_SUBMITTED',
  'APPEAL_RESOLVED',
  'SETTLED',
  'CLOSED',
  'CANCELLED'
]);
export type ClaimStatus = z.infer<typeof ClaimStatusEnum>;

export const ClaimItemStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'DENIED'
]);
export type ClaimItemStatus = z.infer<typeof ClaimItemStatusEnum>;

export const TransmissionStatusEnum = z.enum([
  'QUEUED',
  'TRANSMITTED',
  'ACKNOWLEDGED',
  'REJECTED',
  'FAILED'
]);
export type TransmissionStatus = z.infer<typeof TransmissionStatusEnum>;

export const DenialCategoryEnum = z.enum([
  'MEDICAL_NECESSITY',
  'PRE_AUTH_MISSING',
  'ELIGIBILITY_EXPIRED',
  'TIMELY_FILING',
  'NON_COVERED_SERVICE',
  'CODING_DISCREPANCY',
  'DUPLICATE_CLAIM',
  'BENEFIT_EXHAUSTED'
]);
export type DenialCategory = z.infer<typeof DenialCategoryEnum>;

export const DenialStatusEnum = z.enum([
  'ACTIVE',
  'APPEAL_IN_PROGRESS',
  'APPEAL_RESOLVED',
  'WRITTEN_OFF'
]);
export type DenialStatus = z.infer<typeof DenialStatusEnum>;

export const AppealStatusEnum = z.enum([
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'PARTIALLY_OVERTURNED',
  'UPHELD_DENIED'
]);
export type AppealStatus = z.infer<typeof AppealStatusEnum>;

export const SettlementStatusEnum = z.enum([
  'RECEIVED',
  'ALLOCATED',
  'RECONCILED',
  'DISPUTED'
]);
export type SettlementStatus = z.infer<typeof SettlementStatusEnum>;

export const InsuranceReconciliationStatusEnum = z.enum([
  'MATCHED',
  'VARIANCE_ACCEPTED',
  'UNDERPAYMENT_DISPUTED',
  'WRITE_OFF_AUTHORIZED'
]);
export type InsuranceReconciliationStatus = z.infer<typeof InsuranceReconciliationStatusEnum>;

export const DocumentTypeEnum = z.enum([
  'INSURANCE_CARD',
  'PRE_AUTH_APPROVAL',
  'DISCHARGE_SUMMARY',
  'LAB_REPORT',
  'ITEM_BILL',
  'EOB_REMITTANCE',
  'APPEAL_LETTER'
]);
export type InsuranceDocumentType = z.infer<typeof DocumentTypeEnum>;

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

export interface InsurancePayerDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  payerCode: string;
  payerName: string;
  payerType: PayerType;
  tpaName?: string | null | undefined;
  contactPerson?: string | null | undefined;
  contactEmail?: string | null | undefined;
  contactPhone?: string | null | undefined;
  claimSubmissionMode: ClaimSubmissionMode;
  electronicPayerId?: string | null | undefined;
  settlementPeriodDays: number;
  status: PayerStatus;
  effectiveFrom: string;
  effectiveTo?: string | null | undefined;
  activePlanCount: number;
  activePolicyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InsurancePlanDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  payerId: string;
  payerName?: string | null | undefined;
  planCode: string;
  planName: string;
  planType: InsurancePlanType;
  networkType: NetworkTier;
  copayPercentage: number;
  standardDeductible: number;
  preAuthThreshold: number;
  authorizationRules: Record<string, unknown>;
  coverageRules: Record<string, unknown>;
  status: 'ACTIVE' | 'RETIRED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
}

export interface InsurancePatientPolicyDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  patientId: string;
  patientName: string;
  patientMrn: string;
  payerId: string;
  payerName: string;
  planId: string;
  planName: string;
  memberId: string;
  policyNumber: string;
  groupNumber?: string | null | undefined;
  subscriberName: string;
  subscriberRelationship: SubscriberRelationship;
  subscriberDob?: string | null | undefined;
  subscriberGender?: string | null | undefined;
  effectiveFrom: string;
  effectiveTo?: string | null | undefined;
  priority: PolicyPriority;
  coverageStatus: PolicyCoverageStatus;
  verificationStatus: PolicyVerificationStatus;
  cardFrontUrl?: string | null | undefined;
  cardBackUrl?: string | null | undefined;
  verifiedAt?: string | null | undefined;
  verifiedBy?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceEligibilityCheckDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  patientId: string;
  patientName: string;
  patientMrn: string;
  policyId: string;
  policyNumber: string;
  payerId: string;
  payerName: string;
  checkReferenceNumber: string;
  eligibilityStatus: EligibilityStatus;
  copayAmount: number;
  copayPercentage: number;
  deductibleTotal: number;
  deductibleRemaining: number;
  annualBenefitLimit?: number | null | undefined;
  annualBenefitRemaining?: number | null | undefined;
  preAuthRequired: boolean;
  benefitsSummary?: string | null | undefined;
  checkedBy: string;
  checkedAt: string;
  createdAt: string;
}

export interface InsuranceAuthorizationDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  patientId: string;
  patientName: string;
  patientMrn: string;
  policyId: string;
  policyNumber: string;
  payerId: string;
  payerName: string;
  encounterId?: string | null | undefined;
  authorizationNumber: string;
  requestedServices: string;
  diagnosisContext: string;
  requestedAmount: number;
  approvedAmount: number;
  approvedUnits: number;
  status: AuthorizationStatus;
  payerRemarks?: string | null | undefined;
  validFrom: string;
  validTo?: string | null | undefined;
  submittedAt?: string | null | undefined;
  adjudicatedAt?: string | null | undefined;
  submittedBy?: string | null | undefined;
  adjudicatedBy?: string | null | undefined;
  createdAt: string;
}

export interface InsuranceClaimItemDto {
  id: string;
  tenantId: string;
  claimId: string;
  invoiceItemId?: string | null | undefined;
  chargeItemId?: string | null | undefined;
  serviceCode: string;
  serviceDescription: string;
  quantity: number;
  unitPrice: number;
  billedAmount: number;
  allowedAmount: number;
  approvedAmount: number;
  deniedAmount: number;
  patientResponsibility: number;
  denialReason?: string | null | undefined;
  denialCode?: string | null | undefined;
  status: ClaimItemStatus;
  createdAt: string;
}

export interface InsuranceClaimDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  patientId: string;
  patientName: string;
  patientMrn: string;
  policyId: string;
  policyNumber: string;
  payerId: string;
  payerName: string;
  payerCode: string;
  encounterId?: string | null | undefined;
  invoiceId?: string | null | undefined;
  invoiceNumber?: string | null | undefined;
  authorizationId?: string | null | undefined;
  authorizationNumber?: string | null | undefined;
  claimNumber: string;
  claimType: ClaimType;
  submissionMode: ClaimSubmissionMode;
  totalClaimAmount: number;
  approvedAmount: number;
  deniedAmount: number;
  patientResponsibility: number;
  adjustmentAmount: number;
  status: ClaimStatus;
  primaryDiagnosisCode?: string | null | undefined;
  primaryDiagnosisDescription?: string | null | undefined;
  attendingDoctorName?: string | null | undefined;
  items: InsuranceClaimItemDto[];
  submittedAt?: string | null | undefined;
  submittedBy?: string | null | undefined;
  adjudicatedAt?: string | null | undefined;
  adjudicatedBy?: string | null | undefined;
  settledAt?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceClaimSubmissionDto {
  id: string;
  tenantId: string;
  claimId: string;
  claimNumber: string;
  submissionNumber: string;
  transmissionBatchId?: string | null | undefined;
  submissionPayloadReference?: string | null | undefined;
  transmissionStatus: TransmissionStatus;
  payerAcknowledgement?: string | null | undefined;
  acknowledgementReference?: string | null | undefined;
  submittedBy: string;
  submittedAt: string;
  responseReceivedAt?: string | null | undefined;
}

export interface InsuranceClaimAdjudicationDto {
  id: string;
  tenantId: string;
  claimId: string;
  claimNumber: string;
  adjudicationReference: string;
  adjudicationStatus: 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED';
  totalBilled: number;
  approvedAmount: number;
  deniedAmount: number;
  patientResponsibility: number;
  contractualAdjustment: number;
  payerRemarks?: string | null | undefined;
  eobDocumentUrl?: string | null | undefined;
  adjudicatedAt: string;
  adjudicatedBy: string;
}

export interface InsuranceClaimDenialDto {
  id: string;
  tenantId: string;
  claimId: string;
  claimNumber: string;
  claimItemId?: string | null | undefined;
  patientName: string;
  payerName: string;
  denialNumber: string;
  denialCode: string;
  denialCategory: DenialCategory;
  denialReason: string;
  deniedAmount: number;
  appealEligible: boolean;
  appealDeadline?: string | null | undefined;
  status: DenialStatus;
  createdAt: string;
}

export interface InsuranceClaimAppealDto {
  id: string;
  tenantId: string;
  claimId: string;
  claimNumber: string;
  denialId: string;
  denialCode: string;
  payerName: string;
  patientName: string;
  appealNumber: string;
  appealLevel: number;
  appealReason: string;
  supportingDocumentsSummary?: string | null | undefined;
  submittedAt: string;
  submittedBy: string;
  status: AppealStatus;
  outcomeNotes?: string | null | undefined;
  recoveredAmount: number;
  resolvedAt?: string | null | undefined;
  createdAt: string;
}

export interface InsuranceSettlementDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  payerId: string;
  payerName: string;
  claimId: string;
  claimNumber: string;
  patientName: string;
  settlementReference: string;
  eftTransactionNumber?: string | null | undefined;
  settlementAmount: number;
  settlementDate: string;
  status: SettlementStatus;
  paymentReference?: string | null | undefined;
  recordedBy: string;
  createdAt: string;
}

export interface InsuranceReconciliationDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  settlementId: string;
  claimId: string;
  claimNumber: string;
  payerName: string;
  reconciliationReference: string;
  expectedAmount: number;
  receivedAmount: number;
  variance: number;
  reconciliationStatus: InsuranceReconciliationStatus;
  reason?: string | null | undefined;
  resolvedBy: string;
  resolvedAt: string;
  createdAt: string;
}

export interface InsuranceDocumentRecordDto {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  claimId?: string | null | undefined;
  policyId?: string | null | undefined;
  authorizationId?: string | null | undefined;
  documentType: InsuranceDocumentType;
  title: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface InsuranceAuditTraceDto {
  id: string;
  traceId: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
  actorId: string;
  actorRole: string;
  operation: string;
  entityType: string;
  entityId: string;
  patientId?: string | null | undefined;
  claimId?: string | null | undefined;
  beforeSnapshot?: Record<string, unknown> | null | undefined;
  afterSnapshot?: Record<string, unknown> | null | undefined;
  financialImpact?: number | null | undefined;
  reason: string;
  ipAddress?: string | null | undefined;
  timestamp: string;
  operationStatus: string;
  hashPointer?: string | null | undefined;
}

export interface InsuranceOverviewMetricsDto {
  activeInsuredPatients: number;
  eligibilityChecksToday: number;
  authorizationsPending: number;
  claimsReadyForSubmission: number;
  claimsSubmitted: number;
  claimsInAdjudication: number;
  claimsApproved: number;
  claimsDenied: number;
  activeAppealsCount: number;
  outstandingPayerReceivables: number;
  settlementPendingAmount: number;
  reconciliationVarianceAmount: number;
  denialRatePercentage: number;
  approvalRatePercentage: number;
  avgAdjudicationDays: number;
  totalPayerVolumeUSD: number;
}

export interface PatientInsuranceHistoryDto {
  patientId: string;
  patientName: string;
  patientMrn: string;
  activePolicies: InsurancePatientPolicyDto[];
  eligibilityChecks: InsuranceEligibilityCheckDto[];
  authorizations: InsuranceAuthorizationDto[];
  claims: InsuranceClaimDto[];
  totalClaimed: number;
  totalApproved: number;
  totalPatientPaid: number;
  totalPendingPayer: number;
}

export interface InsuranceReportsDto {
  payerPerformance: {
    payerName: string;
    claimsCount: number;
    billedAmount: number;
    approvedAmount: number;
    denialRate: number;
    avgDaysToPay: number;
  }[];
  denialCategoryBreakdown: {
    category: DenialCategory;
    count: number;
    totalDeniedAmount: number;
    percentage: number;
  }[];
  monthlyClaimTrends: {
    month: string;
    submittedAmount: number;
    settledAmount: number;
    deniedAmount: number;
  }[];
}

// ============================================================================
// MUTATION REQUEST SCHEMAS (ZOD VALIDATION)
// ============================================================================

export const CreatePayerSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  payerCode: z.string().min(2).max(50),
  payerName: z.string().min(2).max(255),
  payerType: PayerTypeEnum,
  tpaName: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  claimSubmissionMode: ClaimSubmissionModeEnum.default('EDI_ELECTRONIC'),
  electronicPayerId: z.string().optional(),
  settlementPeriodDays: z.number().int().positive().default(30),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreatePayerRequest = z.infer<typeof CreatePayerSchema>;

export const CreateInsurancePlanSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  payerId: z.string().uuid(),
  planCode: z.string().min(2).max(50),
  planName: z.string().min(2).max(255),
  planType: InsurancePlanTypeEnum,
  networkType: NetworkTierEnum.default('TIER_1_IN_NETWORK'),
  copayPercentage: z.number().min(0).max(100).default(0),
  standardDeductible: z.number().nonnegative().default(0),
  preAuthThreshold: z.number().nonnegative().default(500),
  authorizationRules: z.record(z.unknown()).optional(),
  coverageRules: z.record(z.unknown()).optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateInsurancePlanRequest = z.infer<typeof CreateInsurancePlanSchema>;

export const RegisterPatientPolicySchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  payerId: z.string().uuid(),
  planId: z.string().uuid(),
  memberId: z.string().min(2).max(100),
  policyNumber: z.string().min(2).max(100),
  groupNumber: z.string().optional(),
  subscriberName: z.string().min(2).max(255),
  subscriberRelationship: SubscriberRelationshipEnum.default('SELF'),
  subscriberDob: z.string().optional(),
  subscriberGender: z.string().optional(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  priority: PolicyPriorityEnum.default('PRIMARY'),
  cardFrontUrl: z.string().optional(),
  cardBackUrl: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type RegisterPatientPolicyRequest = z.infer<typeof RegisterPatientPolicySchema>;

export const VerifyInsuranceEligibilitySchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  policyId: z.string().uuid(),
  payerId: z.string().uuid(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type VerifyInsuranceEligibilityRequest = z.infer<typeof VerifyInsuranceEligibilitySchema>;

export const CreateAuthorizationSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  policyId: z.string().uuid(),
  payerId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  requestedServices: z.string().min(3),
  diagnosisContext: z.string().min(3),
  requestedAmount: z.number().positive(),
  approvedUnits: z.number().int().positive().default(1),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateAuthorizationRequest = z.infer<typeof CreateAuthorizationSchema>;

export const SubmitAuthorizationSchema = z.object({
  tenantId: z.string().uuid(),
  authorizationId: z.string().uuid(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type SubmitAuthorizationRequest = z.infer<typeof SubmitAuthorizationSchema>;

export const ApproveAuthorizationSchema = z.object({
  tenantId: z.string().uuid(),
  authorizationId: z.string().uuid(),
  approvedAmount: z.number().positive(),
  approvedUnits: z.number().int().positive().default(1),
  validTo: z.string().optional(),
  payerRemarks: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type ApproveAuthorizationRequest = z.infer<typeof ApproveAuthorizationSchema>;

export const DenyAuthorizationSchema = z.object({
  tenantId: z.string().uuid(),
  authorizationId: z.string().uuid(),
  payerRemarks: z.string().min(5),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type DenyAuthorizationRequest = z.infer<typeof DenyAuthorizationSchema>;

export const CreateClaimSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  policyId: z.string().uuid(),
  payerId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  authorizationId: z.string().uuid().optional(),
  claimType: ClaimTypeEnum.default('OUTPATIENT'),
  submissionMode: ClaimSubmissionModeEnum.default('EDI_ELECTRONIC'),
  primaryDiagnosisCode: z.string().optional(),
  primaryDiagnosisDescription: z.string().optional(),
  attendingDoctorName: z.string().optional(),
  items: z.array(
    z.object({
      invoiceItemId: z.string().uuid().optional(),
      chargeItemId: z.string().uuid().optional(),
      serviceCode: z.string(),
      serviceDescription: z.string(),
      quantity: z.number().int().positive().default(1),
      unitPrice: z.number().nonnegative(),
      billedAmount: z.number().nonnegative()
    })
  ).min(1),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateClaimRequest = z.infer<typeof CreateClaimSchema>;

export const ValidateClaimSchema = z.object({
  tenantId: z.string().uuid(),
  claimId: z.string().uuid(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type ValidateClaimRequest = z.infer<typeof ValidateClaimSchema>;

export const SubmitClaimSchema = z.object({
  tenantId: z.string().uuid(),
  claimId: z.string().uuid(),
  transmissionBatchId: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type SubmitClaimRequest = z.infer<typeof SubmitClaimSchema>;

export const AcknowledgeClaimSchema = z.object({
  tenantId: z.string().uuid(),
  claimId: z.string().uuid(),
  acknowledgementReference: z.string().min(2),
  payerAcknowledgement: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type AcknowledgeClaimRequest = z.infer<typeof AcknowledgeClaimSchema>;

export const AdjudicateClaimSchema = z.object({
  tenantId: z.string().uuid(),
  claimId: z.string().uuid(),
  adjudicationStatus: z.enum(['APPROVED', 'PARTIALLY_APPROVED', 'DENIED']),
  approvedAmount: z.number().nonnegative(),
  deniedAmount: z.number().nonnegative(),
  patientResponsibility: z.number().nonnegative().default(0),
  contractualAdjustment: z.number().nonnegative().default(0),
  payerRemarks: z.string().optional(),
  eobDocumentUrl: z.string().optional(),
  itemAdjudications: z.array(
    z.object({
      itemId: z.string().uuid(),
      approvedAmount: z.number().nonnegative(),
      deniedAmount: z.number().nonnegative(),
      patientResponsibility: z.number().nonnegative(),
      denialReason: z.string().optional(),
      denialCode: z.string().optional(),
      status: ClaimItemStatusEnum
    })
  ).optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type AdjudicateClaimRequest = z.infer<typeof AdjudicateClaimSchema>;

export const RecordClaimDenialSchema = z.object({
  tenantId: z.string().uuid(),
  claimId: z.string().uuid(),
  claimItemId: z.string().uuid().optional(),
  denialCode: z.string().min(2),
  denialCategory: DenialCategoryEnum,
  denialReason: z.string().min(5),
  deniedAmount: z.number().positive(),
  appealEligible: z.boolean().default(true),
  appealDeadlineDays: z.number().int().positive().default(60),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type RecordClaimDenialRequest = z.infer<typeof RecordClaimDenialSchema>;

export const CreateClaimAppealSchema = z.object({
  tenantId: z.string().uuid(),
  claimId: z.string().uuid(),
  denialId: z.string().uuid(),
  appealLevel: z.number().int().min(1).max(3).default(1),
  appealReason: z.string().min(10),
  supportingDocumentsSummary: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CreateClaimAppealRequest = z.infer<typeof CreateClaimAppealSchema>;

export const ResolveClaimAppealSchema = z.object({
  tenantId: z.string().uuid(),
  appealId: z.string().uuid(),
  claimId: z.string().uuid(),
  status: z.enum(['APPROVED', 'PARTIALLY_OVERTURNED', 'UPHELD_DENIED']),
  recoveredAmount: z.number().nonnegative().default(0),
  outcomeNotes: z.string().min(5),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type ResolveClaimAppealRequest = z.infer<typeof ResolveClaimAppealSchema>;

export const RecordSettlementSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  payerId: z.string().uuid(),
  claimId: z.string().uuid(),
  settlementReference: z.string().min(2),
  eftTransactionNumber: z.string().optional(),
  settlementAmount: z.number().positive(),
  settlementDate: z.string().optional(),
  paymentReference: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type RecordSettlementRequest = z.infer<typeof RecordSettlementSchema>;

export const ReconcileSettlementSchema = z.object({
  tenantId: z.string().uuid(),
  settlementId: z.string().uuid(),
  claimId: z.string().uuid(),
  expectedAmount: z.number().nonnegative(),
  receivedAmount: z.number().nonnegative(),
  reconciliationStatus: InsuranceReconciliationStatusEnum,
  reason: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type ReconcileSettlementRequest = z.infer<typeof ReconcileSettlementSchema>;

export const AmendClaimSchema = z.object({
  tenantId: z.string().uuid(),
  claimId: z.string().uuid(),
  amendmentReason: z.string().min(5),
  updatedDiagnosisCode: z.string().optional(),
  updatedDiagnosisDescription: z.string().optional(),
  updatedItems: z.array(
    z.object({
      serviceCode: z.string(),
      serviceDescription: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
      billedAmount: z.number().nonnegative()
    })
  ).optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type AmendClaimRequest = z.infer<typeof AmendClaimSchema>;

export const CancelClaimSchema = z.object({
  tenantId: z.string().uuid(),
  claimId: z.string().uuid(),
  reason: z.string().min(5),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(5)
});
export type CancelClaimRequest = z.infer<typeof CancelClaimSchema>;
