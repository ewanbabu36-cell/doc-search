import { apiCall } from './api-client.js';

export type CostCategory =
  | 'CLOUD_INFRA'
  | 'AI_INFERENCE'
  | 'SMS_WHATSAPP'
  | 'GATEWAY_MDR'
  | 'PAYROLL_SUPPORT'
  | 'MARKETING_CAC'
  | 'REFUND_WRITEOFF';

export type MitigationAction =
  | 'CONTAIN_BILLING_FREEZE'
  | 'CONTAIN_THROTTLE_QUOTA'
  | 'REVOKE_OVERDUE_GRACE'
  | 'ISSUE_RECOVERY_NOTICE'
  | 'MARK_RESOLVED'
  | 'DISMISS';

export interface PartnerUnitEconomicsDto {
  partnerId: string;
  tenantId: string;
  partnerName: string;
  partnerType: string;
  lifecycleStatus: string;
  planCode: string;
  planName: string;
  licenseStatus: string;
  isFreeTier: boolean;
  contractedMrrInr: number;
  collectedRevenueInr: number;
  pendingReceivableInr: number;
  overdueReceivableInr: number;
  attributedCostInr: number;
  cogsInr: number;
  opexInr: number;
  netMarginInr: number;
  grossMarginPercent: number | null;
  clinicalGmvInr: number;
  clinicalCollectedInr: number;
  clinicalDiscountsInr: number;
  clinicalRefundsInr: number;
  refundRatePercent: number;
  unbilledCompletedEncounters: number;
  expiredBatchLossInr: number;
  openAlertCount: number;
  riskStatus: 'PROFITABLE' | 'THIN_MARGIN' | 'LOSS_MAKING' | 'FREE_BURN';
}

export interface RiskPreventionPolicyDto {
  id: string;
  policyCode: string;
  policyName: string;
  minGrossMarginPercent: string;
  maxDiscountPercentWithoutCfo: string;
  maxGraceDaysBeforeThrottle: number;
  freeTierMonthlyCogsCapInr: string;
  partnerRefundSpikeThresholdPercent: string;
  autoThrottleUnpaidOverdue: boolean;
  autoBlockBelowMarginFloor: boolean;
  isActive: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface RiskLeakageAlertDto {
  id: string;
  riskType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  partnerId: string | null;
  tenantId: string | null;
  title: string;
  summary: string;
  estimatedLossInr: string;
  monthlyBurnInr: string;
  evidenceJson: Record<string, unknown>;
  preventionRuleCode: string | null;
  fingerprint: string;
  status: 'OPEN' | 'CONTAINED' | 'RESOLVED' | 'DISMISSED';
  mitigationAction: string | null;
  mitigatedBy: string | null;
  mitigatedAt: string | null;
  mitigationNotes: string | null;
  detectedAt: string;
}

export interface CostLedgerEntryDto {
  id: string;
  category: CostCategory;
  partnerId: string | null;
  tenantId: string | null;
  amountInr: string;
  billingPeriod: string;
  source: string;
  description: string | null;
  createdBy: string;
  incurredAt: string;
}

export interface CompanyRiskOverviewDto {
  dataSource: 'live_postgresql';
  billingPeriod: string;
  isEmptyDatabase: boolean;
  pnl: {
    contractedMrrInr: number;
    contractedArrInr: number;
    collectedCashInr: number;
    pendingReceivablesInr: number;
    overdueReceivablesInr: number;
    discountWaiverLossInr: number;
    partnerClinicalGmvInr: number;
    partnerClinicalCollectedInr: number;
    partnerClinicalRefundsInr: number;
    platformTakeRateInr: number;
    tdsSection194OInr: number;
    totalRecognizedRevenueInr: number;
    totalCogsInr: number;
    totalOpexInr: number;
    totalCostInr: number;
    netProfitLossInr: number;
    grossMarginPercent: number;
    ebitdaMarginPercent: number;
    monthlyBurnRateInr: number;
    totalDirectLeakageExposureInr: number;
  };
  costBreakdown: Array<{
    category: CostCategory;
    isCogs: boolean;
    amountInr: number;
    entryCount: number;
  }>;
  partnerSummary: {
    totalPartners: number;
    paidPartners: number;
    freeTierPartners: number;
    lossMakingPartners: number;
    overduePartners: number;
  };
  unitMarginLeaderboard: PartnerUnitEconomicsDto[];
  openAlertsSummary: {
    totalOpen: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalEstimatedLossInr: number;
    totalMonthlyBurnInr: number;
  };
  activePolicy: RiskPreventionPolicyDto;
  generatedAt: string;
}

export interface RevenueWaterfallReportDto {
  periodMonth: string;
  totalGrossGmvInr: number;
  totalTransactions: number;
  deductions: {
    paymentGatewayFeeInr: number;
    t0FactoringFeeInr: number;
    platformTakeRateFeeInr: number;
    tdsSection194OInr: number;
    gstLiabilityOnTakeRateInr: number;
  };
  netPartnerDisbursementInr: number;
  platformNetRevenueInr: number;
  streams: Array<{
    streamName: string;
    grossGmvInr: number;
    transactionCount: number;
    gatewayFeeInr: number;
    platformTakeRateInr: number;
    tdsSection194OInr: number;
    netSettlementInr: number;
  }>;
  escrowStatus: string;
  complianceStatus: string;
  generatedAt: string;
}

export interface TdsGstr1RecordDto {
  partnerId: string;
  partnerLegalName: string;
  gstin: string;
  pan: string;
  grossTransactionValueInr: number;
  tdsDeductedInr: number;
  challanNumber: string;
  gstr1FilingStatus: string;
  settlementDate: string;
}

export const riskManagementService = {
  getOverview(period?: string): Promise<CompanyRiskOverviewDto> {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    return apiCall<CompanyRiskOverviewDto>(`/api/v1/company/risk-management/overview${qs}`);
  },

  listCosts(filters?: { category?: string; billingPeriod?: string; partnerId?: string }): Promise<CostLedgerEntryDto[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.billingPeriod) params.set('billingPeriod', filters.billingPeriod);
    if (filters?.partnerId) params.set('partnerId', filters.partnerId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiCall<CostLedgerEntryDto[]>(`/api/v1/company/risk-management/costs${qs}`);
  },

  recordCost(payload: {
    category: CostCategory;
    partnerId?: string | null;
    tenantId?: string | null;
    amountInr: number;
    billingPeriod?: string;
    source?: string;
    description?: string;
  }): Promise<CostLedgerEntryDto> {
    return apiCall<CostLedgerEntryDto>('/api/v1/company/risk-management/costs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  runLeakageScan(): Promise<{
    scannedAt: string;
    candidatesDetected: number;
    insertedCount: number;
    updatedCount: number;
    totalAlerts: number;
    openAlerts: number;
    alerts: RiskLeakageAlertDto[];
  }> {
    return apiCall('/api/v1/company/risk-management/scan', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  listAlerts(filters?: {
    status?: string;
    severity?: string;
    riskType?: string;
    partnerId?: string;
  }): Promise<RiskLeakageAlertDto[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.severity && filters.severity !== 'ALL') params.set('severity', filters.severity);
    if (filters?.riskType && filters.riskType !== 'ALL') params.set('riskType', filters.riskType);
    if (filters?.partnerId) params.set('partnerId', filters.partnerId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiCall<RiskLeakageAlertDto[]>(`/api/v1/company/risk-management/alerts${qs}`);
  },

  mitigateAlert(
    alertId: string,
    payload: { action: MitigationAction; notes?: string }
  ): Promise<{ alert: RiskLeakageAlertDto; executionDetails: Record<string, unknown> }> {
    return apiCall(`/api/v1/company/risk-management/alerts/${encodeURIComponent(alertId)}/mitigate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getPolicy(): Promise<RiskPreventionPolicyDto> {
    return apiCall<RiskPreventionPolicyDto>('/api/v1/company/risk-management/policies');
  },

  updatePolicy(payload: {
    policyName?: string;
    minGrossMarginPercent?: number;
    maxDiscountPercentWithoutCfo?: number;
    maxGraceDaysBeforeThrottle?: number;
    freeTierMonthlyCogsCapInr?: number;
    partnerRefundSpikeThresholdPercent?: number;
    autoThrottleUnpaidOverdue?: boolean;
    autoBlockBelowMarginFloor?: boolean;
    isActive?: boolean;
  }): Promise<RiskPreventionPolicyDto> {
    return apiCall<RiskPreventionPolicyDto>('/api/v1/company/risk-management/policies', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  getRevenueWaterfall(): Promise<RevenueWaterfallReportDto> {
    return apiCall<RevenueWaterfallReportDto>('/api/v1/company/revenue/gmv-waterfall');
  },

  getTdsGstr1Ledger(): Promise<TdsGstr1RecordDto[]> {
    return apiCall<TdsGstr1RecordDto[]>('/api/v1/company/revenue/tds-gstr1-ledger');
  }
};
