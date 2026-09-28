import type {
  InsurancePayerDto,
  InsurancePlanDto,
  InsurancePatientPolicyDto,
  InsuranceEligibilityCheckDto,
  InsuranceAuthorizationDto,
  InsuranceClaimDto,
  InsuranceClaimSubmissionDto,
  InsuranceClaimAdjudicationDto,
  InsuranceClaimDenialDto,
  InsuranceClaimAppealDto,
  InsuranceSettlementDto,
  InsuranceReconciliationDto,
  InsuranceDocumentRecordDto,
  InsuranceAuditTraceDto,
  InsuranceOverviewMetricsDto,
  PatientInsuranceHistoryDto,
  InsuranceReportsDto
} from '@docsearch/api-contracts';

export const MOCK_INSURANCE_PAYERS: InsurancePayerDto[] = [];
export const MOCK_INSURANCE_PLANS: InsurancePlanDto[] = [];
export const MOCK_PATIENT_POLICIES: InsurancePatientPolicyDto[] = [];
export const MOCK_ELIGIBILITY_CHECKS: InsuranceEligibilityCheckDto[] = [];
export const MOCK_AUTHORIZATIONS: InsuranceAuthorizationDto[] = [];
export const MOCK_CLAIMS: InsuranceClaimDto[] = [];
export const MOCK_CLAIM_SUBMISSIONS: InsuranceClaimSubmissionDto[] = [];
export const MOCK_CLAIM_ADJUDICATIONS: InsuranceClaimAdjudicationDto[] = [];
export const MOCK_CLAIM_DENIALS: InsuranceClaimDenialDto[] = [];
export const MOCK_CLAIM_APPEALS: InsuranceClaimAppealDto[] = [];
export const MOCK_SETTLEMENTS: InsuranceSettlementDto[] = [];
export const MOCK_RECONCILIATIONS: InsuranceReconciliationDto[] = [];
export const MOCK_INSURANCE_DOCUMENTS: InsuranceDocumentRecordDto[] = [];
export const MOCK_INSURANCE_AUDIT_TRACES: InsuranceAuditTraceDto[] = [];

export const MOCK_INSURANCE_OVERVIEW_METRICS: InsuranceOverviewMetricsDto = {
  activeInsuredPatients: 0,
  eligibilityChecksToday: 0,
  authorizationsPending: 0,
  claimsReadyForSubmission: 0,
  claimsSubmitted: 0,
  claimsInAdjudication: 0,
  claimsApproved: 0,
  claimsDenied: 0,
  activeAppealsCount: 0,
  outstandingPayerReceivables: 0,
  settlementPendingAmount: 0,
  reconciliationVarianceAmount: 0,
  denialRatePercentage: 0,
  approvalRatePercentage: 100,
  avgAdjudicationDays: 0,
  totalPayerVolumeUSD: 0
};

export const MOCK_PATIENT_INSURANCE_HISTORIES: Record<string, PatientInsuranceHistoryDto> = {};

export const MOCK_INSURANCE_REPORTS: InsuranceReportsDto = {
  payerPerformance: [],
  denialCategoryBreakdown: [],
  monthlyClaimTrends: []
};
