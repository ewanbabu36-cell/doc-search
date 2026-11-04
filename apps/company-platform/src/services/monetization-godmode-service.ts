import { apiRequest } from './api-client.js';

export interface MicroAddonCatalogItem {
  id: string;
  name: string;
  code: string;
  category: 'AI_CLINICAL' | 'COMMUNICATION' | 'HOSPITAL_HARDWARE' | 'SPECIALTY_CARE';
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  marketPriceMonthlyInr: number;
  description: string;
  status: 'GA' | 'BETA';
}

export interface PartnerAddonEntitlement {
  id: string;
  partnerId: string;
  addonId: string;
  addonCode: string;
  addonName: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME_FREE';
  status: 'ACTIVE' | 'CANCELLED';
  currentMonthlyInr: number;
  subscribedAt: string;
  autoRenew: boolean;
}

export interface UsageQuotaStatus {
  partnerId: string;
  partnerName: string;
  whatsappMessages: { used: number; limit: number; softAlertThreshold: number };
  pacsDicomStorageGb: { used: number; limit: number; softAlertThreshold: number };
  aiScribeMinutes: { used: number; limit: number; softAlertThreshold: number };
  isUnlimitedVip: boolean;
  lastUpdated: string;
}

export interface FactoredClaimRecord {
  id: string;
  claimNumber: string;
  hospitalPartnerId: string;
  hospitalName: string;
  patientName: string;
  patientUhid: string;
  insurancePayer: 'STAR_HEALTH' | 'CARE_HEALTH' | 'HDFC_ERGO' | 'ICICI_LOMBARD' | 'MAX_BUPA';
  totalClaimAmountInr: number;
  advancedPercent: number;
  advancedAmountInr: number;
  factoringFeePercent: number;
  factoringFeeInr: number;
  escrowReserveInr: number;
  status: 'PENDING_ADVANCE' | 'ADVANCED_DAY_0' | 'SETTLED_BY_INSURER' | 'REJECTED';
  disbursedAt?: string | undefined;
  settledAt?: string | undefined;
  finalSettledAmountInr?: number | undefined;
  reconciliationAuditSignature: string;
}

export interface FactoringPortfolioOverview {
  totalClaims: number;
  totalVolumeInr: number;
  totalAdvancedInr: number;
  totalFeeRevenueInr: number;
  pendingDisbursementCount: number;
  averageFactoringFeePercent: number;
}

export interface ChurnRiskRecord {
  partnerId: string;
  partnerName: string;
  contactEmail: string;
  contactPhone: string;
  dormancyScore: number; // 0 (active) to 100 (critical churn)
  riskLevel: 'HEALTHY' | 'MODERATE_RISK' | 'HIGH_CHURN_RISK' | 'CRITICAL_DORMANT';
  daysInactive: number;
  lastActiveDate: string;
  primaryRiskFactor: string;
  recommendedRetentionAction: string;
}

export interface AffiliateDoctorRecord {
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospitalPartnerId: string;
  referralCode: string;
  referralLink: string;
  commissionPercent: number;
  referredPartnersCount: number;
  totalReferredRevenueInr: number;
  totalCommissionsEarnedInr: number;
  pendingPayoutInr: number;
  lastPayoutDate?: string | undefined;
  upiId: string;
  status: 'ACTIVE' | 'FLAGGED';
}

export interface GlobalMonetizationConfig {
  currentPhase: 'PHASE_1_100_PERCENT_FREE' | 'PHASE_2_LOWEST_MARKET_PRICE';
  launchFreeMonths: number;
  gracePeriodDays: number;
  plans: {
    SOLO_CLINIC_PRO: { monthlyInr: number; yearlyInr: number; competitorsAvgMonthlyInr: number };
    POLYCLINIC_GROWTH: { monthlyInr: number; yearlyInr: number; competitorsAvgMonthlyInr: number };
    HOSPITAL_ENTERPRISE: { monthlyInr: number; yearlyInr: number; competitorsAvgMonthlyInr: number };
  };
  earlyBirdDiscountPercent: number;
  grandfatherOldAccounts: boolean;
  currency: string;
}

class MonetizationGodModeClientService {
  // Global Strategy
  async getGlobalStrategy(): Promise<GlobalMonetizationConfig | null> {
    const res = await apiRequest<GlobalMonetizationConfig>('/api/v1/company/monetization/strategy');
    return res.data || null;
  }

  async updateGlobalStrategy(updates: Partial<GlobalMonetizationConfig>): Promise<GlobalMonetizationConfig | null> {
    const res = await apiRequest<GlobalMonetizationConfig>('/api/v1/company/monetization/strategy', {
      method: 'POST',
      body: JSON.stringify(updates)
    });
    return res.data || null;
  }

  // Micro Addons
  async getAddonCatalog(): Promise<MicroAddonCatalogItem[]> {
    const res = await apiRequest<MicroAddonCatalogItem[]>('/api/v1/company/addons/catalog');
    return res.data || [];
  }

  async getPartnerAddons(partnerId: string): Promise<PartnerAddonEntitlement[]> {
    const res = await apiRequest<PartnerAddonEntitlement[]>(`/api/v1/company/addons/partner/${encodeURIComponent(partnerId)}`);
    return res.data || [];
  }

  async subscribeAddon(payload: {
    partnerId: string;
    addonId: string;
    billingCycle?: 'MONTHLY' | 'YEARLY' | 'LIFETIME_FREE' | undefined;
  }): Promise<PartnerAddonEntitlement | null> {
    const res = await apiRequest<PartnerAddonEntitlement>('/api/v1/company/addons/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data || null;
  }

  // Usage Quotas
  async getQuotaStatus(partnerId: string): Promise<UsageQuotaStatus | null> {
    const res = await apiRequest<UsageQuotaStatus>(`/api/v1/company/addons/quotas/${encodeURIComponent(partnerId)}`);
    return res.data || null;
  }

  async updateQuotas(payload: {
    partnerId: string;
    whatsappLimit?: number | undefined;
    pacsGbLimit?: number | undefined;
    aiMinutesLimit?: number | undefined;
    isUnlimitedVip?: boolean | undefined;
  }): Promise<UsageQuotaStatus | null> {
    const res = await apiRequest<UsageQuotaStatus>('/api/v1/company/addons/quotas/adjust', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data || null;
  }

  // T-0 Factoring
  async getFactoringOverview(): Promise<FactoringPortfolioOverview | null> {
    const res = await apiRequest<FactoringPortfolioOverview>('/api/v1/company/factoring/portfolio');
    return res.data || null;
  }

  async listFactoringClaims(partnerId?: string | undefined): Promise<FactoredClaimRecord[]> {
    const q = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : '';
    const res = await apiRequest<FactoredClaimRecord[]>(`/api/v1/company/factoring/claims${q}`);
    return res.data || [];
  }

  async advanceClaimDayZero(payload: {
    claimId: string;
    factoringFeePercent?: number | undefined;
  }): Promise<FactoredClaimRecord | null> {
    const res = await apiRequest<FactoredClaimRecord>('/api/v1/company/factoring/advance', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data || null;
  }

  async settleClaimByInsurer(payload: {
    claimId: string;
    finalSettledAmountInr: number;
  }): Promise<FactoredClaimRecord | null> {
    const res = await apiRequest<FactoredClaimRecord>('/api/v1/company/factoring/settle', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data || null;
  }

  // AI Churn Radar
  async getChurnRadar(): Promise<ChurnRiskRecord[]> {
    const res = await apiRequest<ChurnRiskRecord[]>('/api/v1/company/growth/churn-radar');
    return res.data || [];
  }

  async dispatchEmpathyOutreach(payload: {
    partnerId: string;
    channel: 'WHATSAPP' | 'EMAIL' | 'CALL_TASK';
  }): Promise<unknown> {
    const res = await apiRequest('/api/v1/company/growth/churn-radar/outreach', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  async sendRetentionOffer(payload: {
    partnerId: string;
    discountPercent: number;
    extendFreeMonths: number;
  }): Promise<unknown> {
    const res = await apiRequest('/api/v1/company/growth/churn-radar/retention-offer', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  // Doctor Affiliate Loop
  async getAffiliates(): Promise<AffiliateDoctorRecord[]> {
    const res = await apiRequest<AffiliateDoctorRecord[]>('/api/v1/company/growth/affiliates');
    return res.data || [];
  }

  async executeBatchAffiliatePayouts(payoutIds?: string[] | undefined): Promise<{ count: number; totalDisbursedInr: number }> {
    const res = await apiRequest<{ count: number; totalDisbursedInr: number }>('/api/v1/company/growth/affiliates/batch-payout', {
      method: 'POST',
      body: JSON.stringify({ payoutIds })
    });
    return res.data || { count: 0, totalDisbursedInr: 0 };
  }
}

export const monetizationGodModeService = new MonetizationGodModeClientService();
