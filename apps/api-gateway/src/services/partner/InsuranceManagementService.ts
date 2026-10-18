import crypto from 'crypto';
import {
  InsuranceManagementRepository,
  insuranceManagementRepository
} from '../../repositories/partner/InsuranceManagementRepository.js';
import { AppError } from '@docsearch/shared-core';

export class InsuranceManagementService {
  constructor(private readonly repo: InsuranceManagementRepository = insuranceManagementRepository) {}

  private computeHash(payload: Record<string, unknown>, previousHash?: string): string {
    const serialized = JSON.stringify(payload);
    return crypto.createHash('sha256').update(`${previousHash || 'GENESIS'}::${serialized}`).digest('hex');
  }

  // 1. Overview & Metrics
  async getOverviewMetrics(tenantId: string) {
    return await this.repo.getOverviewMetrics(tenantId);
  }

  // 2. Payers
  async getPayers(tenantId: string) {
    return await this.repo.getPayers(tenantId);
  }

  async createPayer(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const payerName = String(payload['payerName'] || '');
    if (!payerName) {
      throw new AppError({ message: 'Payer name is required', statusCode: 400 });
    }

    const payer = await this.repo.createPayer(tenantId, payload);
    if (!payer) {
      throw new AppError({ message: 'Failed to create payer record', statusCode: 500 });
    }

    const hash = this.computeHash({ event: 'PAYER_CREATED', payerId: payer.id, payerName });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'INSURANCE_PAYER',
      entityId: payer.id,
      entityCode: payer.payerCode,
      action: 'CREATE_PAYER',
      actorName: actorId,
      actorRole: 'INSURANCE_ADMIN',
      justification: 'Insurance payer onboarded',
      integrityHash: hash
    });

    return payer;
  }

  // 3. Plans
  async getPlans(tenantId: string, payerId?: string) {
    return await this.repo.getPlans(tenantId, payerId);
  }

  async createPlan(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const planName = String(payload['planName'] || '');
    if (!planName) {
      throw new AppError({ message: 'Plan name is required', statusCode: 400 });
    }

    const plan = await this.repo.createPlan(tenantId, payload);
    if (!plan) {
      throw new AppError({ message: 'Failed to create plan record', statusCode: 500 });
    }

    const hash = this.computeHash({ event: 'PLAN_CREATED', planId: plan.id, planName });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'INSURANCE_PLAN',
      entityId: plan.id,
      entityCode: plan.planCode,
      action: 'CREATE_PLAN',
      actorName: actorId,
      actorRole: 'INSURANCE_ADMIN',
      justification: 'Insurance plan published',
      integrityHash: hash
    });

    return plan;
  }

  // 4. Patient Policies
  async getPatientPolicies(tenantId: string, patientId?: string) {
    return await this.repo.getPatientPolicies(tenantId, patientId);
  }

  async registerPatientPolicy(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const policy = await this.repo.registerPatientPolicy(tenantId, payload);
    if (!policy) {
      throw new AppError({ message: 'Failed to register policy record', statusCode: 500 });
    }

    const hash = this.computeHash({ event: 'POLICY_REGISTERED', policyId: policy.id, policyNumber: policy.policyNumber });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'PATIENT_POLICY',
      entityId: policy.id,
      entityCode: policy.policyNumber,
      action: 'REGISTER_POLICY',
      actorName: actorId,
      actorRole: 'DESK_EXECUTIVE',
      justification: 'Patient insurance card verified and policy registered',
      integrityHash: hash
    });
    return policy;
  }

  // 5. Authorizations
  async getAuthorizations(tenantId: string, patientId?: string) {
    return await this.repo.getAuthorizations(tenantId, patientId);
  }

  async createAuthorization(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const auth = await this.repo.createAuthorization(tenantId, { ...payload, submittedBy: actorId });
    if (!auth) {
      throw new AppError({ message: 'Failed to create authorization record', statusCode: 500 });
    }

    const hash = this.computeHash({ event: 'PREAUTH_REQUESTED', authId: auth.id, authNumber: auth.authorizationNumber });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'PRE_AUTHORIZATION',
      entityId: auth.id,
      entityCode: auth.authorizationNumber,
      action: 'REQUEST_PREAUTH',
      actorName: actorId,
      actorRole: 'TPA_DESK',
      justification: 'Pre-authorization requested for hospital procedure',
      integrityHash: hash
    });
    return auth;
  }

  async updateAuthorizationStatus(tenantId: string, authId: string, actorId: string, status: string, approvedAmount?: number, remarks?: string) {
    const updated = await this.repo.updateAuthorizationStatus(tenantId, authId, status, approvedAmount, remarks);
    const hash = this.computeHash({ event: 'PREAUTH_STATUS_CHANGED', authId, status, approvedAmount });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'PRE_AUTHORIZATION',
      entityId: authId,
      entityCode: updated?.authorizationNumber || authId,
      action: `PREAUTH_${status}`,
      actorName: actorId,
      actorRole: 'TPA_DESK',
      justification: `Pre-authorization marked as ${status}`,
      integrityHash: hash
    });
    return updated;
  }

  // 6. Claims
  async getClaims(tenantId: string, options?: { patientId?: string; status?: string }) {
    return await this.repo.getClaims(tenantId, options);
  }

  async getClaimById(tenantId: string, claimId: string) {
    return await this.repo.getClaimById(tenantId, claimId);
  }

  async createClaim(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const claim = await this.repo.createClaim(tenantId, payload);
    if (!claim) {
      throw new AppError({ message: 'Failed to create claim record', statusCode: 500 });
    }

    const hash = this.computeHash({ event: 'CLAIM_CREATED', claimId: claim.id, claimNumber: claim.claimNumber });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'INSURANCE_CLAIM',
      entityId: claim.id,
      entityCode: claim.claimNumber,
      action: 'CREATE_CLAIM',
      actorName: actorId,
      actorRole: 'BILLING_EXECUTIVE',
      justification: 'Insurance claim dossier created',
      integrityHash: hash
    });
    return claim;
  }

  async submitClaim(tenantId: string, claimId: string, actorId: string) {
    const claim = await this.repo.submitClaim(tenantId, claimId, actorId);
    const hash = this.computeHash({ event: 'CLAIM_SUBMITTED', claimId, claimNumber: claim?.claimNumber });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'INSURANCE_CLAIM',
      entityId: claimId,
      entityCode: claim?.claimNumber || claimId,
      action: 'SUBMIT_CLAIM',
      actorName: actorId,
      actorRole: 'BILLING_EXECUTIVE',
      justification: 'Electronic EDI claim submission sent to payer TPA',
      integrityHash: hash
    });
    return claim;
  }

  async adjudicateClaim(
    tenantId: string,
    claimId: string,
    data: { approvedAmount: number; deniedAmount: number; patientResponsibility: number; status?: string; remarks?: string },
    actorId: string
  ) {
    const claim = await this.repo.adjudicateClaim(tenantId, claimId, data, actorId);
    const hash = this.computeHash({ event: 'CLAIM_ADJUDICATED', claimId, approvedAmount: data.approvedAmount });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'INSURANCE_CLAIM',
      entityId: claimId,
      entityCode: claim?.claimNumber || claimId,
      action: 'ADJUDICATE_CLAIM',
      actorName: actorId,
      actorRole: 'TPA_AUDITOR',
      justification: `Claim adjudicated: ₹${data.approvedAmount} approved, ₹${data.deniedAmount} denied`,
      integrityHash: hash
    });
    return claim;
  }

  // 7. Settlements
  async getSettlements(tenantId: string) {
    return await this.repo.getSettlements(tenantId);
  }

  async recordSettlement(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const settlement = await this.repo.recordSettlement(tenantId, payload);
    if (!settlement) {
      throw new AppError({ message: 'Failed to record settlement', statusCode: 500 });
    }

    const hash = this.computeHash({ event: 'SETTLEMENT_RECORDED', settlementId: settlement.id });
    await this.repo.appendAuditTrace({
      tenantId,
      entityType: 'CLAIM_SETTLEMENT',
      entityId: settlement.id,
      entityCode: settlement.settlementReference,
      action: 'RECORD_SETTLEMENT',
      actorName: actorId,
      actorRole: 'FINANCE_MANAGER',
      justification: 'Payer EFT settlement reconciled and posted to ledger',
      integrityHash: hash
    });
    return settlement;
  }

  // 8. Audit Traces & Reports
  async getAuditTraces(tenantId: string) {
    return await this.repo.getAuditTraces(tenantId);
  }

  async getReports(tenantId: string) {
    const metrics = await this.repo.getOverviewMetrics(tenantId);
    return {
      monthlyPerformance: [
        { month: 'Oct 2026', submittedAmount: metrics.totalSubmittedAmountInr, settledAmount: metrics.totalApprovedAmountInr, claimCount: metrics.totalClaimsCount }
      ],
      payerDistribution: [],
      denialReasonBreakdown: []
    };
  }
}

export const insuranceManagementService = new InsuranceManagementService();
