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
import {
  MOCK_INSURANCE_PAYERS,
  MOCK_INSURANCE_PLANS,
  MOCK_PATIENT_POLICIES,
  MOCK_ELIGIBILITY_CHECKS,
  MOCK_AUTHORIZATIONS,
  MOCK_CLAIMS,
  MOCK_CLAIM_SUBMISSIONS,
  MOCK_CLAIM_ADJUDICATIONS,
  MOCK_CLAIM_DENIALS,
  MOCK_CLAIM_APPEALS,
  MOCK_SETTLEMENTS,
  MOCK_RECONCILIATIONS,
  MOCK_INSURANCE_DOCUMENTS,
  MOCK_INSURANCE_AUDIT_TRACES,
  MOCK_INSURANCE_OVERVIEW_METRICS,
  MOCK_PATIENT_INSURANCE_HISTORIES,
  MOCK_INSURANCE_REPORTS
} from './mock-insurance-claims-data.js';

export interface IInsuranceClaimsManagementService {
  // Payers & Plans
  getPayers(tenantId: string): Promise<InsurancePayerDto[]>;
  createPayer(request: CreatePayerRequest): Promise<InsurancePayerDto>;
  getPlans(tenantId: string, payerId?: string): Promise<InsurancePlanDto[]>;
  createPlan(request: CreateInsurancePlanRequest): Promise<InsurancePlanDto>;

  // Patient Policies & Eligibility
  getPatientPolicies(tenantId: string, patientId?: string): Promise<InsurancePatientPolicyDto[]>;
  registerPatientPolicy(request: RegisterPatientPolicyRequest): Promise<InsurancePatientPolicyDto>;
  getEligibilityChecks(tenantId: string, patientId?: string): Promise<InsuranceEligibilityCheckDto[]>;
  verifyEligibility(request: VerifyInsuranceEligibilityRequest): Promise<InsuranceEligibilityCheckDto>;

  // Authorizations
  getAuthorizations(tenantId: string, patientId?: string): Promise<InsuranceAuthorizationDto[]>;
  createAuthorization(request: CreateAuthorizationRequest): Promise<InsuranceAuthorizationDto>;
  submitAuthorization(request: SubmitAuthorizationRequest): Promise<InsuranceAuthorizationDto>;
  approveAuthorization(request: ApproveAuthorizationRequest): Promise<InsuranceAuthorizationDto>;
  denyAuthorization(request: DenyAuthorizationRequest): Promise<InsuranceAuthorizationDto>;

  // Claims
  getClaims(tenantId: string, options?: { patientId?: string; status?: string }): Promise<InsuranceClaimDto[]>;
  getClaimById(tenantId: string, claimId: string): Promise<InsuranceClaimDto | null>;
  createClaim(request: CreateClaimRequest): Promise<InsuranceClaimDto>;
  validateClaim(request: ValidateClaimRequest): Promise<{ valid: boolean; validationErrors: string[] }>;
  submitClaim(request: SubmitClaimRequest): Promise<InsuranceClaimSubmissionDto>;
  acknowledgeClaim(request: AcknowledgeClaimRequest): Promise<InsuranceClaimDto>;
  adjudicateClaim(request: AdjudicateClaimRequest): Promise<InsuranceClaimAdjudicationDto>;
  recordDenial(request: RecordClaimDenialRequest): Promise<InsuranceClaimDenialDto>;
  createAppeal(request: CreateClaimAppealRequest): Promise<InsuranceClaimAppealDto>;
  resolveAppeal(request: ResolveClaimAppealRequest): Promise<InsuranceClaimAppealDto>;
  amendClaim(request: AmendClaimRequest): Promise<InsuranceClaimDto>;
  cancelClaim(request: CancelClaimRequest): Promise<InsuranceClaimDto>;

  // Submissions, Adjudications, Denials, Appeals Queries
  getSubmissions(tenantId: string, claimId?: string): Promise<InsuranceClaimSubmissionDto[]>;
  getAdjudications(tenantId: string, claimId?: string): Promise<InsuranceClaimAdjudicationDto[]>;
  getDenials(tenantId: string, claimId?: string): Promise<InsuranceClaimDenialDto[]>;
  getAppeals(tenantId: string, claimId?: string): Promise<InsuranceClaimAppealDto[]>;

  // Settlements & Reconciliations
  getSettlements(tenantId: string): Promise<InsuranceSettlementDto[]>;
  recordSettlement(request: RecordSettlementRequest): Promise<InsuranceSettlementDto>;
  getReconciliations(tenantId: string): Promise<InsuranceReconciliationDto[]>;
  reconcileSettlement(request: ReconcileSettlementRequest): Promise<InsuranceReconciliationDto>;

  // Overview, Reports & Audit
  getOverviewMetrics(tenantId: string): Promise<InsuranceOverviewMetricsDto>;
  getPatientInsuranceHistory(tenantId: string, patientId: string): Promise<PatientInsuranceHistoryDto | null>;
  getReports(tenantId: string): Promise<InsuranceReportsDto>;
  getDocuments(tenantId: string, options?: { claimId?: string; policyId?: string }): Promise<InsuranceDocumentRecordDto[]>;
  getAuditTraces(tenantId: string): Promise<InsuranceAuditTraceDto[]>;
}

export class InsuranceClaimsManagementService implements IInsuranceClaimsManagementService {
  private payers: InsurancePayerDto[] = [...MOCK_INSURANCE_PAYERS];
  private plans: InsurancePlanDto[] = [...MOCK_INSURANCE_PLANS];
  private policies: InsurancePatientPolicyDto[] = [...MOCK_PATIENT_POLICIES];
  private eligibilityChecks: InsuranceEligibilityCheckDto[] = [...MOCK_ELIGIBILITY_CHECKS];
  private authorizations: InsuranceAuthorizationDto[] = [...MOCK_AUTHORIZATIONS];
  private claims: InsuranceClaimDto[] = [...MOCK_CLAIMS];
  private submissions: InsuranceClaimSubmissionDto[] = [...MOCK_CLAIM_SUBMISSIONS];
  private adjudications: InsuranceClaimAdjudicationDto[] = [...MOCK_CLAIM_ADJUDICATIONS];
  private denials: InsuranceClaimDenialDto[] = [...MOCK_CLAIM_DENIALS];
  private appeals: InsuranceClaimAppealDto[] = [...MOCK_CLAIM_APPEALS];
  private settlements: InsuranceSettlementDto[] = [...MOCK_SETTLEMENTS];
  private reconciliations: InsuranceReconciliationDto[] = [...MOCK_RECONCILIATIONS];
  private documents: InsuranceDocumentRecordDto[] = [...MOCK_INSURANCE_DOCUMENTS];
  private auditTraces: InsuranceAuditTraceDto[] = [...MOCK_INSURANCE_AUDIT_TRACES];

  private recordAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string,
    actorId: string,
    actorRole: string,
    operation: string,
    entityType: string,
    entityId: string,
    reason: string,
    financialImpact = 0,
    beforeSnapshot?: Record<string, unknown>,
    afterSnapshot?: Record<string, unknown>,
    claimId?: string,
    patientId?: string
  ): void {
    const trace: InsuranceAuditTraceDto = {
      id: crypto.randomUUID(),
      traceId: `TRACE-INS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      tenantId,
      partnerId,
      organizationId,
      actorId,
      actorRole,
      operation,
      entityType,
      entityId,
      patientId,
      claimId,
      beforeSnapshot,
      afterSnapshot,
      financialImpact,
      reason,
      timestamp: new Date().toISOString(),
      operationStatus: 'SUCCESS',
      hashPointer: `sha256-${Math.random().toString(36).slice(2)}`
    };
    this.auditTraces.unshift(trace);
  }

  // Payers & Plans
  async getPayers(tenantId: string): Promise<InsurancePayerDto[]> {
    return this.payers.filter((p) => p.tenantId === tenantId);
  }

  async createPayer(request: CreatePayerRequest): Promise<InsurancePayerDto> {
    const exists = this.payers.some(
      (p) => p.tenantId === request.tenantId && p.payerCode.toLowerCase() === request.payerCode.toLowerCase()
    );
    if (exists) {
      throw new Error(`Insurance Payer with code '${request.payerCode}' already exists in tenant.`);
    }

    const payer: InsurancePayerDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId,
      payerCode: request.payerCode.toUpperCase(),
      payerName: request.payerName,
      payerType: request.payerType,
      tpaName: request.tpaName,
      contactPerson: request.contactPerson,
      contactEmail: request.contactEmail,
      contactPhone: request.contactPhone,
      claimSubmissionMode: request.claimSubmissionMode,
      electronicPayerId: request.electronicPayerId,
      settlementPeriodDays: request.settlementPeriodDays,
      status: 'ACTIVE',
      effectiveFrom: new Date().toISOString(),
      activePlanCount: 0,
      activePolicyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.payers.unshift(payer);
    this.recordAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.actorId,
      request.actorRole,
      'PAYER_CREATED',
      'PAYER',
      payer.id,
      request.justification,
      0,
      undefined,
      payer as unknown as Record<string, unknown>
    );
    return payer;
  }

  async getPlans(tenantId: string, payerId?: string): Promise<InsurancePlanDto[]> {
    return this.plans.filter((p) => p.tenantId === tenantId && (!payerId || p.payerId === payerId));
  }

  async createPlan(request: CreateInsurancePlanRequest): Promise<InsurancePlanDto> {
    const payer = this.payers.find((p) => p.id === request.payerId);
    if (!payer) {
      throw new Error(`Insurance Payer with ID '${request.payerId}' not found.`);
    }

    const plan: InsurancePlanDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      payerId: request.payerId,
      payerName: payer.payerName,
      planCode: request.planCode.toUpperCase(),
      planName: request.planName,
      planType: request.planType,
      networkType: request.networkType,
      copayPercentage: request.copayPercentage,
      standardDeductible: request.standardDeductible,
      preAuthThreshold: request.preAuthThreshold,
      authorizationRules: request.authorizationRules || {},
      coverageRules: request.coverageRules || {},
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.plans.unshift(plan);
    payer.activePlanCount += 1;
    this.recordAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.actorId,
      request.actorRole,
      'PLAN_CONFIGURED',
      'PLAN',
      plan.id,
      request.justification,
      0,
      undefined,
      plan as unknown as Record<string, unknown>
    );
    return plan;
  }

  // Patient Policies & Eligibility
  async getPatientPolicies(tenantId: string, patientId?: string): Promise<InsurancePatientPolicyDto[]> {
    return this.policies.filter((p) => p.tenantId === tenantId && (!patientId || p.patientId === patientId));
  }

  async registerPatientPolicy(request: RegisterPatientPolicyRequest): Promise<InsurancePatientPolicyDto> {
    const payer = this.payers.find((p) => p.id === request.payerId);
    const plan = this.plans.find((pl) => pl.id === request.planId);
    if (!payer || !plan) {
      throw new Error('Valid Insurance Payer and Insurance Plan are required.');
    }

    const policy: InsurancePatientPolicyDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId,
      patientId: request.patientId,
      patientName: request.patientName,
      patientMrn: request.patientMrn,
      payerId: request.payerId,
      payerName: payer.payerName,
      planId: request.planId,
      planName: plan.planName,
      memberId: request.memberId,
      policyNumber: request.policyNumber,
      groupNumber: request.groupNumber,
      subscriberName: request.subscriberName,
      subscriberRelationship: request.subscriberRelationship,
      subscriberDob: request.subscriberDob,
      subscriberGender: request.subscriberGender,
      effectiveFrom: request.effectiveFrom,
      effectiveTo: request.effectiveTo,
      priority: request.priority,
      coverageStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      cardFrontUrl: request.cardFrontUrl,
      cardBackUrl: request.cardBackUrl,
      verifiedAt: new Date().toISOString(),
      verifiedBy: request.actorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.policies.unshift(policy);
    payer.activePolicyCount += 1;
    this.recordAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.actorId,
      request.actorRole,
      'POLICY_REGISTERED',
      'POLICY',
      policy.id,
      request.justification,
      0,
      undefined,
      policy as unknown as Record<string, unknown>,
      undefined,
      policy.patientId
    );
    return policy;
  }

  async getEligibilityChecks(tenantId: string, patientId?: string): Promise<InsuranceEligibilityCheckDto[]> {
    return this.eligibilityChecks.filter((e) => e.tenantId === tenantId && (!patientId || e.patientId === patientId));
  }

  async verifyEligibility(request: VerifyInsuranceEligibilityRequest): Promise<InsuranceEligibilityCheckDto> {
    const policy = this.policies.find((p) => p.id === request.policyId);
    if (!policy) {
      throw new Error(`Insurance policy with ID '${request.policyId}' not found.`);
    }

    const plan = this.plans.find((pl) => pl.id === policy.planId);
    const copayAmt = plan ? (plan.copayPercentage > 0 ? 15.0 : 0.0) : 0.0;
    const copayPct = plan ? plan.copayPercentage : 0;
    const deductibleRemaining = plan ? plan.standardDeductible : 0.0;

    const check: InsuranceEligibilityCheckDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId,
      patientId: request.patientId,
      patientName: policy.patientName,
      patientMrn: policy.patientMrn,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      payerId: policy.payerId,
      payerName: policy.payerName,
      checkReferenceNumber: `ELIG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 899 + 100)}`,
      eligibilityStatus: 'ELIGIBLE',
      copayAmount: copayAmt,
      copayPercentage: copayPct,
      deductibleTotal: plan?.standardDeductible || 0,
      deductibleRemaining,
      annualBenefitLimit: 15000.00,
      annualBenefitRemaining: 14200.00,
      preAuthRequired: (plan?.preAuthThreshold || 500) < 600,
      benefitsSummary: `Active network coverage verified. Copay: ${copayPct}%, Pre-auth threshold: $${plan?.preAuthThreshold || 500}.`,
      checkedBy: request.actorId,
      checkedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.eligibilityChecks.unshift(check);
    this.recordAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.actorId,
      request.actorRole,
      'ELIGIBILITY_VERIFIED',
      'ELIGIBILITY',
      check.id,
      request.justification,
      0,
      undefined,
      check as unknown as Record<string, unknown>,
      undefined,
      check.patientId
    );
    return check;
  }

  // Authorizations
  async getAuthorizations(tenantId: string, patientId?: string): Promise<InsuranceAuthorizationDto[]> {
    return this.authorizations.filter((a) => a.tenantId === tenantId && (!patientId || a.patientId === patientId));
  }

  async createAuthorization(request: CreateAuthorizationRequest): Promise<InsuranceAuthorizationDto> {
    const policy = this.policies.find((p) => p.id === request.policyId);
    if (!policy) {
      throw new Error('Active patient policy reference is required.');
    }

    const auth: InsuranceAuthorizationDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId,
      patientId: request.patientId,
      patientName: policy.patientName,
      patientMrn: policy.patientMrn,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      payerId: policy.payerId,
      payerName: policy.payerName,
      encounterId: request.encounterId,
      authorizationNumber: `AUTH-${policy.payerName.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      requestedServices: request.requestedServices,
      diagnosisContext: request.diagnosisContext,
      requestedAmount: request.requestedAmount,
      approvedAmount: 0.00,
      approvedUnits: request.approvedUnits,
      status: 'REQUESTED',
      validFrom: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      submittedBy: request.actorId,
      createdAt: new Date().toISOString()
    };

    this.authorizations.unshift(auth);
    this.recordAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.actorId,
      request.actorRole,
      'PRE_AUTH_REQUESTED',
      'AUTHORIZATION',
      auth.id,
      request.justification,
      request.requestedAmount,
      undefined,
      auth as unknown as Record<string, unknown>,
      undefined,
      auth.patientId
    );
    return auth;
  }

  async submitAuthorization(request: SubmitAuthorizationRequest): Promise<InsuranceAuthorizationDto> {
    const auth = this.authorizations.find((a) => a.id === request.authorizationId && a.tenantId === request.tenantId);
    if (!auth) {
      throw new Error(`Authorization with ID '${request.authorizationId}' not found.`);
    }

    auth.status = 'PENDING';
    auth.submittedAt = new Date().toISOString();
    auth.submittedBy = request.actorId;

    this.recordAudit(
      request.tenantId,
      '22222222-2222-4222-8222-222222222201',
      '44444444-4444-4444-8444-444444444401',
      request.actorId,
      request.actorRole,
      'PRE_AUTH_SUBMITTED',
      'AUTHORIZATION',
      auth.id,
      request.justification,
      auth.requestedAmount
    );
    return auth;
  }

  async approveAuthorization(request: ApproveAuthorizationRequest): Promise<InsuranceAuthorizationDto> {
    const auth = this.authorizations.find((a) => a.id === request.authorizationId && a.tenantId === request.tenantId);
    if (!auth) {
      throw new Error(`Authorization with ID '${request.authorizationId}' not found.`);
    }

    const prev = { ...auth };
    auth.status = request.approvedAmount < auth.requestedAmount ? 'PARTIALLY_APPROVED' : 'APPROVED';
    auth.approvedAmount = request.approvedAmount;
    auth.approvedUnits = request.approvedUnits;
    auth.validTo = request.validTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    auth.payerRemarks = request.payerRemarks;
    auth.adjudicatedAt = new Date().toISOString();
    auth.adjudicatedBy = request.actorId;

    this.recordAudit(
      request.tenantId,
      '22222222-2222-4222-8222-222222222201',
      '44444444-4444-4444-8444-444444444401',
      request.actorId,
      request.actorRole,
      'PRE_AUTH_APPROVED',
      'AUTHORIZATION',
      auth.id,
      request.justification,
      auth.approvedAmount,
      prev as unknown as Record<string, unknown>,
      auth as unknown as Record<string, unknown>,
      undefined,
      auth.patientId
    );
    return auth;
  }

  async denyAuthorization(request: DenyAuthorizationRequest): Promise<InsuranceAuthorizationDto> {
    const auth = this.authorizations.find((a) => a.id === request.authorizationId && a.tenantId === request.tenantId);
    if (!auth) {
      throw new Error(`Authorization with ID '${request.authorizationId}' not found.`);
    }

    const prev = { ...auth };
    auth.status = 'DENIED';
    auth.approvedAmount = 0;
    auth.payerRemarks = request.payerRemarks;
    auth.adjudicatedAt = new Date().toISOString();
    auth.adjudicatedBy = request.actorId;

    this.recordAudit(
      request.tenantId,
      '22222222-2222-4222-8222-222222222201',
      '44444444-4444-4444-8444-444444444401',
      request.actorId,
      request.actorRole,
      'PRE_AUTH_DENIED',
      'AUTHORIZATION',
      auth.id,
      request.justification,
      0,
      prev as unknown as Record<string, unknown>,
      auth as unknown as Record<string, unknown>,
      undefined,
      auth.patientId
    );
    return auth;
  }

  // Claims
  async getClaims(tenantId: string, options?: { patientId?: string; status?: string }): Promise<InsuranceClaimDto[]> {
    return this.claims.filter(
      (c) =>
        c.tenantId === tenantId &&
        (!options?.patientId || c.patientId === options.patientId) &&
        (!options?.status || c.status === options.status)
    );
  }

  async getClaimById(tenantId: string, claimId: string): Promise<InsuranceClaimDto | null> {
    return this.claims.find((c) => c.tenantId === tenantId && c.id === claimId) || null;
  }

  async createClaim(request: CreateClaimRequest): Promise<InsuranceClaimDto> {
    const policy = this.policies.find((p) => p.id === request.policyId);
    const payer = this.payers.find((p) => p.id === request.payerId);
    if (!policy || !payer) {
      throw new Error('Valid Insurance Policy and Payer are required to create a claim.');
    }

    const claimId = crypto.randomUUID();
    const claimItems = request.items.map((it) => ({
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId,
      invoiceItemId: it.invoiceItemId,
      chargeItemId: it.chargeItemId,
      serviceCode: it.serviceCode,
      serviceDescription: it.serviceDescription,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      billedAmount: it.billedAmount,
      allowedAmount: it.billedAmount,
      approvedAmount: 0.00,
      deniedAmount: 0.00,
      patientResponsibility: 0.00,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString()
    }));

    const totalAmount = claimItems.reduce((acc, i) => acc + i.billedAmount, 0);

    const claim: InsuranceClaimDto = {
      id: claimId,
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId,
      patientId: request.patientId,
      patientName: policy.patientName,
      patientMrn: policy.patientMrn,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      payerId: payer.id,
      payerName: payer.payerName,
      payerCode: payer.payerCode,
      encounterId: request.encounterId,
      invoiceId: request.invoiceId,
      authorizationId: request.authorizationId,
      claimNumber: `CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 89999 + 10000)}`,
      claimType: request.claimType,
      submissionMode: request.submissionMode,
      totalClaimAmount: totalAmount,
      approvedAmount: 0.00,
      deniedAmount: 0.00,
      patientResponsibility: 0.00,
      adjustmentAmount: 0.00,
      status: 'READY_FOR_SUBMISSION',
      primaryDiagnosisCode: request.primaryDiagnosisCode,
      primaryDiagnosisDescription: request.primaryDiagnosisDescription,
      attendingDoctorName: request.attendingDoctorName,
      items: claimItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.claims.unshift(claim);
    this.recordAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.actorId,
      request.actorRole,
      'CLAIM_CREATED',
      'CLAIM',
      claim.id,
      request.justification,
      totalAmount,
      undefined,
      claim as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return claim;
  }

  async validateClaim(request: ValidateClaimRequest): Promise<{ valid: boolean; validationErrors: string[] }> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    if (!claim) {
      throw new Error(`Claim with ID '${request.claimId}' not found.`);
    }

    const errors: string[] = [];
    if (!claim.policyNumber) errors.push('Missing member policy number.');
    if (!claim.primaryDiagnosisCode) errors.push('Missing primary ICD-10 diagnosis code.');
    if (!claim.items || claim.items.length === 0) errors.push('Claim must contain at least one itemized service.');
    if (claim.totalClaimAmount <= 0) errors.push('Total claim amount must be greater than zero.');

    return {
      valid: errors.length === 0,
      validationErrors: errors
    };
  }

  async submitClaim(request: SubmitClaimRequest): Promise<InsuranceClaimSubmissionDto> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    if (!claim) {
      throw new Error(`Claim with ID '${request.claimId}' not found.`);
    }
    if (claim.status !== 'DRAFT' && claim.status !== 'READY_FOR_SUBMISSION') {
      throw new Error(`Claim ${claim.claimNumber} is in status '${claim.status}' and cannot be submitted.`);
    }

    const submission: InsuranceClaimSubmissionDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      submissionNumber: `SUB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 899 + 100)}`,
      transmissionBatchId: request.transmissionBatchId || `BATCH-EDI-${Math.floor(Math.random() * 8999 + 1000)}`,
      submissionPayloadReference: `edi_837_${claim.claimNumber.toLowerCase()}.x12`,
      transmissionStatus: 'ACKNOWLEDGED',
      payerAcknowledgement: 'Electronic EDI clearinghouse batch acknowledged (TA1/999 Accepted).',
      acknowledgementReference: `ACK-${claim.payerCode.slice(0, 4)}-${Math.floor(Math.random() * 899999 + 100000)}`,
      submittedBy: request.actorId,
      submittedAt: new Date().toISOString(),
      responseReceivedAt: new Date().toISOString()
    };

    claim.status = 'SUBMITTED';
    claim.submittedAt = submission.submittedAt;
    claim.submittedBy = submission.submittedBy;
    claim.updatedAt = new Date().toISOString();

    this.submissions.unshift(submission);
    this.recordAudit(
      request.tenantId,
      claim.partnerId,
      claim.organizationId,
      request.actorId,
      request.actorRole,
      'CLAIM_SUBMITTED',
      'CLAIM',
      claim.id,
      request.justification,
      claim.totalClaimAmount,
      undefined,
      claim as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return submission;
  }

  async acknowledgeClaim(request: AcknowledgeClaimRequest): Promise<InsuranceClaimDto> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    if (!claim) {
      throw new Error(`Claim with ID '${request.claimId}' not found.`);
    }

    claim.status = 'ACKNOWLEDGED';
    claim.updatedAt = new Date().toISOString();

    this.recordAudit(
      request.tenantId,
      claim.partnerId,
      claim.organizationId,
      request.actorId,
      request.actorRole,
      'CLAIM_ACKNOWLEDGED',
      'CLAIM',
      claim.id,
      request.justification
    );
    return claim;
  }

  async adjudicateClaim(request: AdjudicateClaimRequest): Promise<InsuranceClaimAdjudicationDto> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    if (!claim) {
      throw new Error(`Claim with ID '${request.claimId}' not found.`);
    }

    const prev = { ...claim };

    claim.approvedAmount = request.approvedAmount;
    claim.deniedAmount = request.deniedAmount;
    claim.patientResponsibility = request.patientResponsibility;
    claim.adjustmentAmount = request.contractualAdjustment;
    claim.status = request.adjudicationStatus;
    claim.adjudicatedAt = new Date().toISOString();
    claim.adjudicatedBy = request.actorId;
    claim.updatedAt = new Date().toISOString();

    if (request.itemAdjudications && request.itemAdjudications.length > 0) {
      for (const itemAdj of request.itemAdjudications) {
        const item = claim.items.find((it) => it.id === itemAdj.itemId);
        if (item) {
          item.approvedAmount = itemAdj.approvedAmount;
          item.deniedAmount = itemAdj.deniedAmount;
          item.patientResponsibility = itemAdj.patientResponsibility;
          item.denialReason = itemAdj.denialReason;
          item.denialCode = itemAdj.denialCode;
          item.status = itemAdj.status;
        }
      }
    }

    const adjudication: InsuranceClaimAdjudicationDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      adjudicationReference: `EOB-${claim.payerCode.slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      adjudicationStatus: request.adjudicationStatus,
      totalBilled: claim.totalClaimAmount,
      approvedAmount: request.approvedAmount,
      deniedAmount: request.deniedAmount,
      patientResponsibility: request.patientResponsibility,
      contractualAdjustment: request.contractualAdjustment,
      payerRemarks: request.payerRemarks,
      eobDocumentUrl: request.eobDocumentUrl,
      adjudicatedAt: new Date().toISOString(),
      adjudicatedBy: request.actorId
    };

    this.adjudications.unshift(adjudication);
    this.recordAudit(
      request.tenantId,
      claim.partnerId,
      claim.organizationId,
      request.actorId,
      request.actorRole,
      'CLAIM_ADJUDICATED',
      'CLAIM',
      claim.id,
      request.justification,
      claim.approvedAmount,
      prev as unknown as Record<string, unknown>,
      claim as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return adjudication;
  }

  async recordDenial(request: RecordClaimDenialRequest): Promise<InsuranceClaimDenialDto> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    if (!claim) {
      throw new Error(`Claim with ID '${request.claimId}' not found.`);
    }

    const denial: InsuranceClaimDenialDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      claimItemId: request.claimItemId,
      patientName: claim.patientName,
      payerName: claim.payerName,
      denialNumber: `DEN-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      denialCode: request.denialCode,
      denialCategory: request.denialCategory,
      denialReason: request.denialReason,
      deniedAmount: request.deniedAmount,
      appealEligible: request.appealEligible,
      appealDeadline: new Date(Date.now() + request.appealDeadlineDays * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    claim.status = 'DENIED';
    claim.deniedAmount = request.deniedAmount;
    claim.updatedAt = new Date().toISOString();

    this.denials.unshift(denial);
    this.recordAudit(
      request.tenantId,
      claim.partnerId,
      claim.organizationId,
      request.actorId,
      request.actorRole,
      'CLAIM_DENIED',
      'DENIAL',
      denial.id,
      request.justification,
      request.deniedAmount,
      undefined,
      denial as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return denial;
  }

  async createAppeal(request: CreateClaimAppealRequest): Promise<InsuranceClaimAppealDto> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    const denial = this.denials.find((d) => d.id === request.denialId);
    if (!claim || !denial) {
      throw new Error('Valid claim and denial records are required to lodge an appeal.');
    }

    const appeal: InsuranceClaimAppealDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      denialId: denial.id,
      denialCode: denial.denialCode,
      payerName: claim.payerName,
      patientName: claim.patientName,
      appealNumber: `APL-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      appealLevel: request.appealLevel,
      appealReason: request.appealReason,
      supportingDocumentsSummary: request.supportingDocumentsSummary,
      submittedAt: new Date().toISOString(),
      submittedBy: request.actorId,
      status: 'UNDER_REVIEW',
      recoveredAmount: 0.00,
      createdAt: new Date().toISOString()
    };

    claim.status = 'APPEAL_SUBMITTED';
    denial.status = 'APPEAL_IN_PROGRESS';
    claim.updatedAt = new Date().toISOString();

    this.appeals.unshift(appeal);
    this.recordAudit(
      request.tenantId,
      claim.partnerId,
      claim.organizationId,
      request.actorId,
      request.actorRole,
      'APPEAL_SUBMITTED',
      'APPEAL',
      appeal.id,
      request.justification,
      denial.deniedAmount,
      undefined,
      appeal as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return appeal;
  }

  async resolveAppeal(request: ResolveClaimAppealRequest): Promise<InsuranceClaimAppealDto> {
    const appeal = this.appeals.find((a) => a.id === request.appealId && a.tenantId === request.tenantId);
    if (!appeal) {
      throw new Error(`Appeal with ID '${request.appealId}' not found.`);
    }

    const claim = this.claims.find((c) => c.id === request.claimId);
    appeal.status = request.status;
    appeal.recoveredAmount = request.recoveredAmount;
    appeal.outcomeNotes = request.outcomeNotes;
    appeal.resolvedAt = new Date().toISOString();

    if (claim) {
      claim.status = request.status === 'APPROVED' ? 'APPROVED' : request.status === 'PARTIALLY_OVERTURNED' ? 'PARTIALLY_APPROVED' : 'DENIED';
      if (request.recoveredAmount > 0) {
        claim.approvedAmount += request.recoveredAmount;
        claim.deniedAmount = Math.max(0, claim.deniedAmount - request.recoveredAmount);
      }
      claim.updatedAt = new Date().toISOString();
    }

    this.recordAudit(
      request.tenantId,
      claim?.partnerId || '22222222-2222-4222-8222-222222222201',
      claim?.organizationId || '44444444-4444-4444-8444-444444444401',
      request.actorId,
      request.actorRole,
      'APPEAL_RESOLVED',
      'APPEAL',
      appeal.id,
      request.justification,
      request.recoveredAmount,
      undefined,
      appeal as unknown as Record<string, unknown>,
      claim?.id,
      claim?.patientId
    );
    return appeal;
  }

  async amendClaim(request: AmendClaimRequest): Promise<InsuranceClaimDto> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    if (!claim) {
      throw new Error(`Claim with ID '${request.claimId}' not found.`);
    }
    if (claim.status === 'SETTLED' || claim.status === 'CLOSED') {
      throw new Error('Settled or closed claims cannot be amended.');
    }

    const prev = { ...claim };
    if (request.updatedDiagnosisCode) claim.primaryDiagnosisCode = request.updatedDiagnosisCode;
    if (request.updatedDiagnosisDescription) claim.primaryDiagnosisDescription = request.updatedDiagnosisDescription;

    claim.status = 'READY_FOR_SUBMISSION';
    claim.updatedAt = new Date().toISOString();

    this.recordAudit(
      request.tenantId,
      claim.partnerId,
      claim.organizationId,
      request.actorId,
      request.actorRole,
      'CLAIM_AMENDED',
      'CLAIM',
      claim.id,
      request.justification,
      0,
      prev as unknown as Record<string, unknown>,
      claim as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return claim;
  }

  async cancelClaim(request: CancelClaimRequest): Promise<InsuranceClaimDto> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    if (!claim) {
      throw new Error(`Claim with ID '${request.claimId}' not found.`);
    }
    if (claim.status === 'SETTLED' || claim.status === 'CLOSED') {
      throw new Error('Settled or closed claims cannot be cancelled.');
    }

    const prev = { ...claim };
    claim.status = 'CANCELLED';
    claim.updatedAt = new Date().toISOString();

    this.recordAudit(
      request.tenantId,
      claim.partnerId,
      claim.organizationId,
      request.actorId,
      request.actorRole,
      'CLAIM_CANCELLED',
      'CLAIM',
      claim.id,
      request.justification,
      0,
      prev as unknown as Record<string, unknown>,
      claim as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return claim;
  }

  // Submissions, Adjudications, Denials, Appeals Queries
  async getSubmissions(tenantId: string, claimId?: string): Promise<InsuranceClaimSubmissionDto[]> {
    return this.submissions.filter((s) => s.tenantId === tenantId && (!claimId || s.claimId === claimId));
  }

  async getAdjudications(tenantId: string, claimId?: string): Promise<InsuranceClaimAdjudicationDto[]> {
    return this.adjudications.filter((a) => a.tenantId === tenantId && (!claimId || a.claimId === claimId));
  }

  async getDenials(tenantId: string, claimId?: string): Promise<InsuranceClaimDenialDto[]> {
    return this.denials.filter((d) => d.tenantId === tenantId && (!claimId || d.claimId === claimId));
  }

  async getAppeals(tenantId: string, claimId?: string): Promise<InsuranceClaimAppealDto[]> {
    return this.appeals.filter((ap) => ap.tenantId === tenantId && (!claimId || ap.claimId === claimId));
  }

  // Settlements & Reconciliations
  async getSettlements(tenantId: string): Promise<InsuranceSettlementDto[]> {
    return this.settlements.filter((s) => s.tenantId === tenantId);
  }

  async recordSettlement(request: RecordSettlementRequest): Promise<InsuranceSettlementDto> {
    const claim = this.claims.find((c) => c.id === request.claimId && c.tenantId === request.tenantId);
    const payer = this.payers.find((p) => p.id === request.payerId);
    if (!claim || !payer) {
      throw new Error('Valid Claim and Payer are required to record a settlement.');
    }

    const settlement: InsuranceSettlementDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: request.partnerId,
      organizationId: request.organizationId,
      branchId: request.branchId,
      payerId: payer.id,
      payerName: payer.payerName,
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      patientName: claim.patientName,
      settlementReference: request.settlementReference,
      eftTransactionNumber: request.eftTransactionNumber,
      settlementAmount: request.settlementAmount,
      settlementDate: request.settlementDate || new Date().toISOString(),
      status: 'RECEIVED',
      paymentReference: request.paymentReference,
      recordedBy: request.actorId,
      createdAt: new Date().toISOString()
    };

    claim.status = 'SETTLED';
    claim.settledAt = settlement.settlementDate;
    claim.updatedAt = new Date().toISOString();

    this.settlements.unshift(settlement);
    this.recordAudit(
      request.tenantId,
      request.partnerId,
      request.organizationId,
      request.actorId,
      request.actorRole,
      'SETTLEMENT_RECEIVED',
      'SETTLEMENT',
      settlement.id,
      request.justification,
      request.settlementAmount,
      undefined,
      settlement as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return settlement;
  }

  async getReconciliations(tenantId: string): Promise<InsuranceReconciliationDto[]> {
    return this.reconciliations.filter((r) => r.tenantId === tenantId);
  }

  async reconcileSettlement(request: ReconcileSettlementRequest): Promise<InsuranceReconciliationDto> {
    const settlement = this.settlements.find((s) => s.id === request.settlementId && s.tenantId === request.tenantId);
    const claim = this.claims.find((c) => c.id === request.claimId);
    if (!settlement || !claim) {
      throw new Error('Valid Settlement and Claim references are required.');
    }

    const variance = request.receivedAmount - request.expectedAmount;
    const reconciliation: InsuranceReconciliationDto = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      partnerId: settlement.partnerId,
      organizationId: settlement.organizationId,
      branchId: settlement.branchId,
      settlementId: settlement.id,
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      payerName: settlement.payerName,
      reconciliationReference: `REC-INS-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      expectedAmount: request.expectedAmount,
      receivedAmount: request.receivedAmount,
      variance,
      reconciliationStatus: request.reconciliationStatus,
      reason: request.reason,
      resolvedBy: request.actorId,
      resolvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    settlement.status = 'RECONCILED';
    this.reconciliations.unshift(reconciliation);
    this.recordAudit(
      request.tenantId,
      settlement.partnerId,
      settlement.organizationId,
      request.actorId,
      request.actorRole,
      'RECONCILIATION_COMPLETED',
      'RECONCILIATION',
      reconciliation.id,
      request.justification,
      variance,
      undefined,
      reconciliation as unknown as Record<string, unknown>,
      claim.id,
      claim.patientId
    );
    return reconciliation;
  }

  // Overview, Reports & Audit
  async getOverviewMetrics(tenantId: string): Promise<InsuranceOverviewMetricsDto> {
    const claims = this.claims.filter((c) => c.tenantId === tenantId);
    const activePatients = new Set(this.policies.filter((p) => p.tenantId === tenantId && p.coverageStatus === 'ACTIVE').map((p) => p.patientId)).size;
    const checksToday = this.eligibilityChecks.filter((e) => e.tenantId === tenantId).length;
    const pendingAuths = this.authorizations.filter((a) => a.tenantId === tenantId && (a.status === 'REQUESTED' || a.status === 'PENDING')).length;
    const readyClaims = claims.filter((c) => c.status === 'READY_FOR_SUBMISSION' || c.status === 'DRAFT').length;
    const submittedClaims = claims.filter((c) => c.status === 'SUBMITTED' || c.status === 'ACKNOWLEDGED').length;
    const inAdjudication = claims.filter((c) => c.status === 'PROCESSING').length;
    const approvedClaims = claims.filter((c) => c.status === 'APPROVED' || c.status === 'SETTLED').length;
    const deniedClaims = claims.filter((c) => c.status === 'DENIED').length;
    const activeAppeals = this.appeals.filter((a) => a.tenantId === tenantId && a.status === 'UNDER_REVIEW').length;
    const outstandingReceivables = claims.filter((c) => c.status === 'APPROVED').reduce((sum, c) => sum + c.approvedAmount, 0);
    const totalVolume = claims.reduce((sum, c) => sum + c.totalClaimAmount, 0);

    return {
      activeInsuredPatients: activePatients || MOCK_INSURANCE_OVERVIEW_METRICS.activeInsuredPatients,
      eligibilityChecksToday: checksToday || MOCK_INSURANCE_OVERVIEW_METRICS.eligibilityChecksToday,
      authorizationsPending: pendingAuths,
      claimsReadyForSubmission: readyClaims,
      claimsSubmitted: submittedClaims,
      claimsInAdjudication: inAdjudication,
      claimsApproved: approvedClaims,
      claimsDenied: deniedClaims,
      activeAppealsCount: activeAppeals,
      outstandingPayerReceivables: outstandingReceivables || 12450.00,
      settlementPendingAmount: 3820.00,
      reconciliationVarianceAmount: 0.00,
      denialRatePercentage: claims.length > 0 ? parseFloat(((deniedClaims / claims.length) * 100).toFixed(1)) : 8.7,
      approvalRatePercentage: claims.length > 0 ? parseFloat(((approvedClaims / claims.length) * 100).toFixed(1)) : 91.3,
      avgAdjudicationDays: 3.4,
      totalPayerVolumeUSD: totalVolume || 68900.00
    };
  }

  async getPatientInsuranceHistory(tenantId: string, patientId: string): Promise<PatientInsuranceHistoryDto | null> {
    const history = MOCK_PATIENT_INSURANCE_HISTORIES[patientId];
    if (history) return history;

    const patientPolicies = this.policies.filter((p) => p.tenantId === tenantId && p.patientId === patientId);
    const patientChecks = this.eligibilityChecks.filter((e) => e.tenantId === tenantId && e.patientId === patientId);
    const patientAuths = this.authorizations.filter((a) => a.tenantId === tenantId && a.patientId === patientId);
    const patientClaims = this.claims.filter((c) => c.tenantId === tenantId && c.patientId === patientId);

    if (patientPolicies.length === 0 && patientClaims.length === 0) return null;

    const totalClaimed = patientClaims.reduce((s, c) => s + c.totalClaimAmount, 0);
    const totalApproved = patientClaims.reduce((s, c) => s + c.approvedAmount, 0);
    const totalPatientPaid = patientClaims.reduce((s, c) => s + c.patientResponsibility, 0);
    const totalPendingPayer = totalClaimed - totalApproved - totalPatientPaid;

    return {
      patientId,
      patientName: patientPolicies[0]?.patientName || 'Patient',
      patientMrn: patientPolicies[0]?.patientMrn || 'MRN-SAMPLE',
      activePolicies: patientPolicies,
      eligibilityChecks: patientChecks,
      authorizations: patientAuths,
      claims: patientClaims,
      totalClaimed,
      totalApproved,
      totalPatientPaid,
      totalPendingPayer: Math.max(0, totalPendingPayer)
    };
  }

  async getReports(_tenantId: string): Promise<InsuranceReportsDto> {
    return MOCK_INSURANCE_REPORTS;
  }

  async getDocuments(tenantId: string, options?: { claimId?: string; policyId?: string }): Promise<InsuranceDocumentRecordDto[]> {
    return this.documents.filter(
      (d) =>
        d.tenantId === tenantId &&
        (!options?.claimId || d.claimId === options.claimId) &&
        (!options?.policyId || d.policyId === options.policyId)
    );
  }

  async getAuditTraces(tenantId: string): Promise<InsuranceAuditTraceDto[]> {
    return this.auditTraces.filter((t) => t.tenantId === tenantId);
  }
}

export const insuranceClaimsManagementService = new InsuranceClaimsManagementService();
