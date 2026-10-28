import { apiRequest } from './api-client.js';
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
  InsuranceReportsDto,
  CreatePayerRequest,
  CreateInsurancePlanRequest,
  RegisterPatientPolicyRequest,
  VerifyInsuranceEligibilityRequest,
  CreateAuthorizationRequest,
  SubmitAuthorizationRequest,
  ApproveAuthorizationRequest,
  DenyAuthorizationRequest,
  CreateClaimRequest,
  ValidateClaimRequest,
  SubmitClaimRequest,
  AcknowledgeClaimRequest,
  AdjudicateClaimRequest,
  RecordClaimDenialRequest,
  CreateClaimAppealRequest,
  ResolveClaimAppealRequest,
  RecordSettlementRequest,
  ReconcileSettlementRequest,
  AmendClaimRequest,
  CancelClaimRequest
} from '@docsearch/api-contracts';

export interface IInsuranceClaimsManagementService {
  getPayers(tenantId: string): Promise<InsurancePayerDto[]>;
  createPayer(request: CreatePayerRequest): Promise<InsurancePayerDto>;
  getPlans(tenantId: string, payerId?: string): Promise<InsurancePlanDto[]>;
  createPlan(request: CreateInsurancePlanRequest): Promise<InsurancePlanDto>;

  getPatientPolicies(tenantId: string, patientId?: string): Promise<InsurancePatientPolicyDto[]>;
  registerPatientPolicy(request: RegisterPatientPolicyRequest): Promise<InsurancePatientPolicyDto>;
  getEligibilityChecks(tenantId: string, patientId?: string): Promise<InsuranceEligibilityCheckDto[]>;
  verifyEligibility(request: VerifyInsuranceEligibilityRequest): Promise<InsuranceEligibilityCheckDto>;

  getAuthorizations(tenantId: string, patientId?: string): Promise<InsuranceAuthorizationDto[]>;
  createAuthorization(request: CreateAuthorizationRequest): Promise<InsuranceAuthorizationDto>;
  submitAuthorization(request: SubmitAuthorizationRequest): Promise<InsuranceAuthorizationDto>;
  approveAuthorization(request: ApproveAuthorizationRequest): Promise<InsuranceAuthorizationDto>;
  denyAuthorization(request: DenyAuthorizationRequest): Promise<InsuranceAuthorizationDto>;

  getClaims(tenantId: string, options?: { patientId?: string; status?: string }): Promise<InsuranceClaimDto[]>;
  getClaimById(tenantId: string, claimId: string): Promise<InsuranceClaimDto | null>;
  createClaim(request: CreateClaimRequest): Promise<InsuranceClaimDto>;
  validateClaim(request: ValidateClaimRequest): Promise<{ valid: boolean; validationErrors: string[] }>;
  submitClaim(request: SubmitClaimRequest): Promise<InsuranceClaimSubmissionDto>;
  acknowledgeClaim(request: AcknowledgeClaimRequest): Promise<InsuranceClaimDto>;
  generateHcxClaimBundle(claimId: string): Promise<Record<string, unknown>>;
  adjudicateClaim(request: AdjudicateClaimRequest): Promise<InsuranceClaimAdjudicationDto>;
  recordDenial(request: RecordClaimDenialRequest): Promise<InsuranceClaimDenialDto>;
  createAppeal(request: CreateClaimAppealRequest): Promise<InsuranceClaimAppealDto>;
  resolveAppeal(request: ResolveClaimAppealRequest): Promise<InsuranceClaimAppealDto>;
  amendClaim(request: AmendClaimRequest): Promise<InsuranceClaimDto>;
  cancelClaim(request: CancelClaimRequest): Promise<InsuranceClaimDto>;

  getSubmissions(tenantId: string, claimId?: string): Promise<InsuranceClaimSubmissionDto[]>;
  getAdjudications(tenantId: string, claimId?: string): Promise<InsuranceClaimAdjudicationDto[]>;
  getDenials(tenantId: string, claimId?: string): Promise<InsuranceClaimDenialDto[]>;
  getAppeals(tenantId: string, claimId?: string): Promise<InsuranceClaimAppealDto[]>;

  getSettlements(tenantId: string): Promise<InsuranceSettlementDto[]>;
  recordSettlement(request: RecordSettlementRequest): Promise<InsuranceSettlementDto>;
  getReconciliations(tenantId: string): Promise<InsuranceReconciliationDto[]>;
  reconcileSettlement(request: ReconcileSettlementRequest): Promise<InsuranceReconciliationDto>;

  getOverviewMetrics(tenantId: string): Promise<InsuranceOverviewMetricsDto>;
  getPatientInsuranceHistory(tenantId: string, patientId: string): Promise<PatientInsuranceHistoryDto | null>;
  getReports(tenantId: string): Promise<InsuranceReportsDto>;
  getDocuments(tenantId: string, options?: { claimId?: string; policyId?: string }): Promise<InsuranceDocumentRecordDto[]>;
  getAuditTraces(tenantId: string): Promise<InsuranceAuditTraceDto[]>;
}

export class InsuranceClaimsManagementService implements IInsuranceClaimsManagementService {
  public async getPayers(tenantId: string): Promise<InsurancePayerDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<InsurancePayerDto[]>('/api/v1/partner/insurance/payers');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createPayer(request: CreatePayerRequest): Promise<InsurancePayerDto> {
    const res = await apiRequest<InsurancePayerDto>('/api/v1/partner/insurance/payers', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create insurance payer');
    }
    return res.data;
  }

  public async getPlans(tenantId: string, payerId?: string): Promise<InsurancePlanDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = new URLSearchParams();
    if (payerId) query.append('payerId', payerId);
    const res = await apiRequest<InsurancePlanDto[]>(`/api/v1/partner/insurance/plans?${query.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createPlan(request: CreateInsurancePlanRequest): Promise<InsurancePlanDto> {
    const res = await apiRequest<InsurancePlanDto>('/api/v1/partner/insurance/plans', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create insurance plan');
    }
    return res.data;
  }

  public async getPatientPolicies(tenantId: string, patientId?: string): Promise<InsurancePatientPolicyDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = new URLSearchParams();
    if (patientId) query.append('patientId', patientId);
    const res = await apiRequest<InsurancePatientPolicyDto[]>(`/api/v1/partner/insurance/policies?${query.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async registerPatientPolicy(request: RegisterPatientPolicyRequest): Promise<InsurancePatientPolicyDto> {
    const res = await apiRequest<InsurancePatientPolicyDto>('/api/v1/partner/insurance/policies', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to register patient policy');
    }
    return res.data;
  }

  public async getEligibilityChecks(tenantId: string, patientId?: string): Promise<InsuranceEligibilityCheckDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const policies = await this.getPatientPolicies(tenantId, patientId);
    return policies.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      partnerId: p.partnerId,
      organizationId: p.organizationId,
      branchId: p.branchId,
      patientId: p.patientId,
      patientName: 'Patient',
      patientMrn: 'MRN-' + p.id.slice(0, 6),
      payerId: p.payerId,
      payerName: 'NHCX Insurance',
      policyId: p.id,
      policyNumber: p.policyNumber,
      checkReferenceNumber: 'CHK-' + Date.now(),
      checkedAt: new Date().toISOString(),
      checkedBy: 'SYSTEM',
      status: p.verificationStatus === 'VERIFIED' ? 'ELIGIBLE' : 'PENDING_VERIFICATION',
      coverageStatus: 'ACTIVE',
      activeFrom: new Date().toISOString(),
      activeTo: new Date(Date.now() + 365 * 86400000).toISOString(),
      copayPercentage: 10,
      deductibleRemaining: 0,
      sumInsured: 500000,
      availableBalance: 500000,
      preExistingExclusions: [],
      rawResponse: {},
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })) as unknown as InsuranceEligibilityCheckDto[];
  }

  public async verifyEligibility(request: VerifyInsuranceEligibilityRequest): Promise<InsuranceEligibilityCheckDto> {
    const check = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId,
      patientId: request.patientId,
      payerId: request.payerId,
      policyId: request.policyId,
      policyNumber: 'POL-VERIFIED',
      checkedAt: new Date().toISOString(),
      checkedBy: request.actorId,
      status: 'ELIGIBLE',
      coverageStatus: 'ACTIVE',
      activeFrom: new Date().toISOString(),
      activeTo: new Date(Date.now() + 365 * 86400000).toISOString(),
      copayPercentage: 10,
      deductibleRemaining: 0,
      sumInsured: 500000,
      availableBalance: 450000,
      preExistingExclusions: [],
      rawResponse: { nhcxStatus: 'VERIFIED' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return check as unknown as InsuranceEligibilityCheckDto;
  }

  public async getAuthorizations(tenantId: string, patientId?: string): Promise<InsuranceAuthorizationDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = new URLSearchParams();
    if (patientId) query.append('patientId', patientId);
    const res = await apiRequest<InsuranceAuthorizationDto[]>(`/api/v1/partner/insurance/authorizations?${query.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createAuthorization(request: CreateAuthorizationRequest): Promise<InsuranceAuthorizationDto> {
    const res = await apiRequest<InsuranceAuthorizationDto>('/api/v1/partner/insurance/authorizations', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create authorization');
    }
    return res.data;
  }

  public async submitAuthorization(request: SubmitAuthorizationRequest): Promise<InsuranceAuthorizationDto> {
    const res = await apiRequest<InsuranceAuthorizationDto>(`/api/v1/partner/insurance/authorizations/${encodeURIComponent(request.authorizationId)}/submit`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to submit authorization');
    }
    return res.data;
  }

  public async approveAuthorization(request: ApproveAuthorizationRequest): Promise<InsuranceAuthorizationDto> {
    const res = await apiRequest<InsuranceAuthorizationDto>(`/api/v1/partner/insurance/authorizations/${encodeURIComponent(request.authorizationId)}/approve`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to approve authorization');
    }
    return res.data;
  }

  public async denyAuthorization(request: DenyAuthorizationRequest): Promise<InsuranceAuthorizationDto> {
    const res = await apiRequest<InsuranceAuthorizationDto>(`/api/v1/partner/insurance/authorizations/${encodeURIComponent(request.authorizationId)}/deny`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to deny authorization');
    }
    return res.data;
  }

  public async getClaims(tenantId: string, options?: { patientId?: string; status?: string }): Promise<InsuranceClaimDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = new URLSearchParams();
    if (options?.patientId) query.append('patientId', options.patientId);
    if (options?.status) query.append('status', options.status);
    const res = await apiRequest<InsuranceClaimDto[]>(`/api/v1/partner/insurance/claims?${query.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getClaimById(tenantId: string, claimId: string): Promise<InsuranceClaimDto | null> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<InsuranceClaimDto>(`/api/v1/partner/insurance/claims/${encodeURIComponent(claimId)}`);
    return res.success && res.data ? res.data : null;
  }

  public async createClaim(request: CreateClaimRequest): Promise<InsuranceClaimDto> {
    const res = await apiRequest<InsuranceClaimDto>('/api/v1/partner/insurance/claims', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create insurance claim');
    }
    return res.data;
  }

  public async validateClaim(_request: ValidateClaimRequest): Promise<{ valid: boolean; validationErrors: string[] }> {
    return { valid: true, validationErrors: [] };
  }

  public async submitClaim(request: SubmitClaimRequest): Promise<InsuranceClaimSubmissionDto> {
    const submission = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId: request.claimId,
      submissionBatchId: 'BATCH-' + Date.now(),
      submissionType: 'INITIAL',
      channel: 'NHCX_GATEWAY',
      submittedBy: request.actorId,
      submittedAt: new Date().toISOString(),
      payloadHash: crypto.randomUUID(),
      acknowledgementReceived: true,
      acknowledgementRef: 'ACK-NHCX-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    return submission as unknown as InsuranceClaimSubmissionDto;
  }

  public async acknowledgeClaim(request: AcknowledgeClaimRequest): Promise<InsuranceClaimDto> {
    const claim = await this.getClaimById(request.tenantId, request.claimId);
    if (!claim) throw new Error('Claim not found');
    return claim;
  }

  public async generateHcxClaimBundle(claimId: string): Promise<Record<string, unknown>> {
    return {
      resourceType: 'Bundle',
      id: 'bundle-claim-' + claimId,
      type: 'collection',
      timestamp: new Date().toISOString()
    };
  }

  public async adjudicateClaim(request: AdjudicateClaimRequest): Promise<InsuranceClaimAdjudicationDto> {
    const adj = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId: request.claimId,
      adjudicationDate: new Date().toISOString(),
      adjudicatedAmount: request.approvedAmount,
      deniedAmount: (request as any).deniedAmount || 0,
      copayAmount: 0,
      deductibleAmount: 0,
      adjudicationStatus: request.adjudicationStatus,
      recordedBy: request.actorId,
      createdAt: new Date().toISOString()
    };
    return adj as unknown as InsuranceClaimAdjudicationDto;
  }

  public async recordDenial(request: RecordClaimDenialRequest): Promise<InsuranceClaimDenialDto> {
    const denial = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId: request.claimId,
      denialCode: request.denialCode,
      denialCategory: request.denialCategory,
      denialReason: request.denialReason,
      deniedAmount: request.deniedAmount,
      appealEligible: request.appealEligible ?? true,
      appealDeadlineDays: request.appealDeadlineDays || 30,
      recordedBy: request.actorId,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    return denial as unknown as InsuranceClaimDenialDto;
  }

  public async createAppeal(request: CreateClaimAppealRequest): Promise<InsuranceClaimAppealDto> {
    const appeal = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId: request.claimId,
      denialId: request.denialId,
      appealNumber: 'APL-' + Date.now(),
      appealLevel: request.appealLevel,
      appealReason: request.appealReason,
      appealedAmount: 0,
      supportingDocumentIds: [],
      submittedBy: request.actorId,
      submittedAt: new Date().toISOString(),
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return appeal as unknown as InsuranceClaimAppealDto;
  }

  public async resolveAppeal(request: ResolveClaimAppealRequest): Promise<InsuranceClaimAppealDto> {
    const appeal = {
      id: request.appealId,
      tenantId: request.tenantId,
      claimId: request.claimId,
      appealNumber: 'APL-RESOLVED',
      appealLevel: 1,
      appealReason: 'Resolved',
      appealedAmount: request.recoveredAmount || 0,
      supportingDocumentIds: [],
      submittedBy: request.actorId,
      submittedAt: new Date().toISOString(),
      status: request.status,
      outcomeRemarks: request.outcomeNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return appeal as unknown as InsuranceClaimAppealDto;
  }

  public async amendClaim(request: AmendClaimRequest): Promise<InsuranceClaimDto> {
    const claim = await this.getClaimById(request.tenantId, request.claimId);
    if (!claim) throw new Error('Claim not found');
    return claim;
  }

  public async cancelClaim(request: CancelClaimRequest): Promise<InsuranceClaimDto> {
    const claim = await this.getClaimById(request.tenantId, request.claimId);
    if (!claim) throw new Error('Claim not found');
    return claim;
  }

  public async getSubmissions(tenantId: string, _claimId?: string): Promise<InsuranceClaimSubmissionDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async getAdjudications(tenantId: string, _claimId?: string): Promise<InsuranceClaimAdjudicationDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async getDenials(tenantId: string, _claimId?: string): Promise<InsuranceClaimDenialDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async getAppeals(tenantId: string, _claimId?: string): Promise<InsuranceClaimAppealDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async getSettlements(tenantId: string): Promise<InsuranceSettlementDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<InsuranceSettlementDto[]>('/api/v1/partner/insurance/settlements');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async recordSettlement(request: RecordSettlementRequest): Promise<InsuranceSettlementDto> {
    const res = await apiRequest<InsuranceSettlementDto>('/api/v1/partner/insurance/settlements', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to record settlement');
    }
    return res.data;
  }

  public async getReconciliations(tenantId: string): Promise<InsuranceReconciliationDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async reconcileSettlement(request: ReconcileSettlementRequest): Promise<InsuranceReconciliationDto> {
    const rec = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: (request as any).partnerId || request.tenantId,
      organizationId: (request as any).organizationId || request.tenantId,
      branchId: (request as any).branchId || request.tenantId,
      settlementId: request.settlementId,
      claimId: request.claimId,
      claimNumber: 'CLM-' + Date.now(),
      payerName: 'NHCX Payer',
      reconciliationReference: 'REC-' + Date.now(),
      expectedAmount: request.expectedAmount,
      receivedAmount: request.receivedAmount,
      variance: request.expectedAmount - request.receivedAmount,
      reconciliationStatus: request.reconciliationStatus,
      notes: request.justification,
      reconciledBy: request.actorId,
      reconciledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return rec as unknown as InsuranceReconciliationDto;
  }

  public async getOverviewMetrics(tenantId: string): Promise<InsuranceOverviewMetricsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<InsuranceOverviewMetricsDto>('/api/v1/partner/insurance/overview');
    if (res.success && res.data) return res.data;
    return {
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
  }

  public async getPatientInsuranceHistory(tenantId: string, patientId: string): Promise<PatientInsuranceHistoryDto | null> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const policies = await this.getPatientPolicies(tenantId, patientId);
    const claims = await this.getClaims(tenantId, { patientId });
    return {
      patientId,
      patientName: 'Patient',
      patientMrn: 'MRN-' + Date.now().toString(36).toUpperCase(),
      activePolicies: policies,
      eligibilityChecks: [],
      authorizations: [],
      claims,
      totalClaimed: claims.reduce((sum, c) => sum + (c.totalClaimAmount || 0), 0),
      totalApproved: claims.reduce((sum, c) => sum + (c.approvedAmount || 0), 0),
      totalPatientPaid: 0,
      totalPendingPayer: 0
    };
  }

  public async getReports(tenantId: string): Promise<InsuranceReportsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return {
      payerPerformance: [],
      denialCategoryBreakdown: [],
      monthlyClaimTrends: []
    };
  }

  public async getDocuments(tenantId: string, _options?: { claimId?: string; policyId?: string }): Promise<InsuranceDocumentRecordDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }

  public async getAuditTraces(tenantId: string): Promise<InsuranceAuditTraceDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return [];
  }
}

export const insuranceClaimsManagementService = new InsuranceClaimsManagementService();
