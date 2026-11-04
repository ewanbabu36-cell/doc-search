import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';

const logger = createLogger('monetization-engine-service');

export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'LIFETIME_FREE';
export type LicenseStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'GRACE_PERIOD' | 'EXPIRED' | 'LIFETIME_FREE' | 'SUSPENDED';

export interface PartnerLicenseRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  currency: string;
  tier: 'COMMUNITY_FREE' | 'SOLO_CLINIC_PRO' | 'POLYCLINIC_GROWTH' | 'HOSPITAL_ENTERPRISE';
  billingCycle: BillingCycle;
  licenseKey: string;
  monthlyRate: number;
  yearlyRate: number;
  marketCompetitorPriceMonthly: number; // e.g. Practo: ₹2,499, DocSearch: ₹499
  startDate: string;
  expiryDate: string;
  gracePeriodEnd?: string | undefined;
  status: LicenseStatus;
  autoRenew: boolean;
  earlyAdopterDiscountPercent: number; // Grandfathering protection (e.g. 50%)
  unlimitedFreeGrantedBy?: string | undefined;
  notes?: string | undefined;
  updatedAt: string;
}

export interface GlobalMonetizationConfig {
  globalFreeModeEnabled: boolean; // 100% Free globally for hyper-viral partner acquisition
  globalFreeModeTitle: string;
  globalFreeAnnouncementMessage: string;
  disruptiveLowestPriceModeActive: boolean;
  currencyRates: Record<string, { symbol: string; rateToInr: number }>;
  defaultMonthlyInr: number;
  defaultYearlyInr: number;
  gracePeriodDurationDays: number;
  earlyBirdGrandfatheringPercent: number;
}

export type GlobalMonetizationConfigUpdates = {
  [K in keyof GlobalMonetizationConfig]?: GlobalMonetizationConfig[K] | undefined;
};

// In-memory persistent master registry
let globalConfig: GlobalMonetizationConfig = {
  globalFreeModeEnabled: true,
  globalFreeModeTitle: 'DocSearch 100% Lifetime Free Healthcare Operating System',
  globalFreeAnnouncementMessage: 'Zero subscription barrier for all clinics & hospitals worldwide during global launch.',
  disruptiveLowestPriceModeActive: false,
  currencyRates: {
    INR: { symbol: '₹', rateToInr: 1 },
    USD: { symbol: '$', rateToInr: 87.5 },
    AED: { symbol: 'AED', rateToInr: 23.8 },
    EUR: { symbol: '€', rateToInr: 92.0 },
    GBP: { symbol: '£', rateToInr: 110.5 },
    BDT: { symbol: '৳', rateToInr: 0.73 }
  },
  defaultMonthlyInr: 499, // Lowest price in market vs ₹1,999 - ₹4,999 competitors
  defaultYearlyInr: 4999, // 2 months free equivalent
  gracePeriodDurationDays: 15,
  earlyBirdGrandfatheringPercent: 50
};

// Seed initial partner licenses
const partnerLicenses = new Map<string, PartnerLicenseRecord>([
  [
    'PARTNER-001',
    {
      id: 'LIC-2026-001',
      partnerId: 'PARTNER-001',
      partnerName: 'Metropolitan Multispecialty Hospital',
      contactEmail: 'admin@metrohospital.org',
      contactPhone: '+91 98765 43210',
      country: 'IN',
      currency: 'INR',
      tier: 'HOSPITAL_ENTERPRISE',
      billingCycle: 'LIFETIME_FREE',
      licenseKey: 'DS-METRO-ENT-2026-FREE-001',
      monthlyRate: 0,
      yearlyRate: 0,
      marketCompetitorPriceMonthly: 15000,
      startDate: '2026-01-01T00:00:00.000Z',
      expiryDate: '2099-12-31T23:59:59.000Z',
      status: 'LIFETIME_FREE',
      autoRenew: true,
      earlyAdopterDiscountPercent: 100,
      unlimitedFreeGrantedBy: 'Founder (Meraj Sharif)',
      notes: 'Global Launch Alpha Anchor Partner',
      updatedAt: new Date().toISOString()
    }
  ],
  [
    'PARTNER-002',
    {
      id: 'LIC-2026-002',
      partnerId: 'PARTNER-002',
      partnerName: 'Dr. Amitabh Verma Cardiology Clinic',
      contactEmail: 'dr.verma@cardiohealth.in',
      contactPhone: '+91 98111 22334',
      country: 'IN',
      currency: 'INR',
      tier: 'SOLO_CLINIC_PRO',
      billingCycle: 'MONTHLY',
      licenseKey: 'DS-SOLO-2026-VERMA-992',
      monthlyRate: 499,
      yearlyRate: 4999,
      marketCompetitorPriceMonthly: 2499,
      startDate: '2026-10-01T00:00:00.000Z',
      expiryDate: '2026-11-15T00:00:00.000Z',
      status: 'EXPIRING_SOON',
      autoRenew: false,
      earlyAdopterDiscountPercent: 50,
      notes: 'Solo Practice OPD & RapidRx',
      updatedAt: new Date().toISOString()
    }
  ],
  [
    'PARTNER-003',
    {
      id: 'LIC-2026-003',
      partnerId: 'PARTNER-003',
      partnerName: 'Dubai Marina International Polyclinic',
      contactEmail: 'ops@marinaclinic.ae',
      contactPhone: '+971 50 123 4567',
      country: 'AE',
      currency: 'AED',
      tier: 'POLYCLINIC_GROWTH',
      billingCycle: 'YEARLY',
      licenseKey: 'DS-GLOBAL-DXB-POLY-770',
      monthlyRate: 99,
      yearlyRate: 999,
      marketCompetitorPriceMonthly: 750,
      startDate: '2026-06-01T00:00:00.000Z',
      expiryDate: '2027-05-31T00:00:00.000Z',
      status: 'ACTIVE',
      autoRenew: true,
      earlyAdopterDiscountPercent: 40,
      notes: 'International Pilot (UAE)',
      updatedAt: new Date().toISOString()
    }
  ]
]);

export class MonetizationEngineService {
  /**
   * Returns current global monetization engine state & GTM strategy
   */
  public getGlobalConfig(): GlobalMonetizationConfig {
    return { ...globalConfig };
  }

  /**
   * Updates global monetization strategy (e.g. toggle 100% Free Launch vs Lowest-Price Mode)
   */
  public updateGlobalStrategy(updates: GlobalMonetizationConfigUpdates): GlobalMonetizationConfig {
    const sanitized: Partial<GlobalMonetizationConfig> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        (sanitized as any)[key] = value;
      }
    }
    globalConfig = { ...globalConfig, ...sanitized };
    logger.info(`Global Monetization Strategy Updated: FreeMode=${globalConfig.globalFreeModeEnabled}, LowestPriceActive=${globalConfig.disruptiveLowestPriceModeActive}`);
    return { ...globalConfig };
  }

  /**
   * Lists all partner licenses with status, expiry days, and filters
   */
  public listPartnerLicenses(filters?: {
    search?: string | undefined;
    status?: string | undefined;
    tier?: string | undefined;
    currency?: string | undefined;
  }): PartnerLicenseRecord[] {
    let records = Array.from(partnerLicenses.values());

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.partnerName.toLowerCase().includes(q) ||
          r.partnerId.toLowerCase().includes(q) ||
          r.licenseKey.toLowerCase().includes(q) ||
          r.contactEmail.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== 'ALL') {
      records = records.filter((r) => r.status === filters.status);
    }

    if (filters?.tier && filters.tier !== 'ALL') {
      records = records.filter((r) => r.tier === filters.tier);
    }

    if (filters?.currency && filters.currency !== 'ALL') {
      records = records.filter((r) => r.currency === filters.currency);
    }

    return records.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }

  /**
   * Extends 100% Free period for a partner (viral adoption booster)
   */
  public extendFreePeriod(
    partnerId: string,
    days: number,
    adminUser = 'Admin',
    isLifetime = false
  ): PartnerLicenseRecord {
    const existing = partnerLicenses.get(partnerId);
    if (!existing) {
      throw new AppError({
        message: `Partner license for ${partnerId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (isLifetime) {
      existing.status = 'LIFETIME_FREE';
      existing.billingCycle = 'LIFETIME_FREE';
      existing.expiryDate = '2099-12-31T23:59:59.000Z';
      existing.monthlyRate = 0;
      existing.yearlyRate = 0;
      existing.unlimitedFreeGrantedBy = adminUser;
    } else {
      const currentExpiry = new Date(existing.expiryDate);
      const baseDate = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + days);
      existing.expiryDate = baseDate.toISOString();
      if (existing.status === 'EXPIRED' || existing.status === 'GRACE_PERIOD') {
        existing.status = 'ACTIVE';
      }
    }

    existing.updatedAt = new Date().toISOString();
    partnerLicenses.set(partnerId, existing);

    logger.info(`Partner ${partnerId} Free Period Extended: +${days} days (Lifetime: ${isLifetime}) by ${adminUser}`);
    return existing;
  }

  /**
   * Commercial Renewal of a License (Monthly or Yearly disruptive pricing)
   */
  public renewLicense(
    partnerId: string,
    params: {
      billingCycle: 'MONTHLY' | 'YEARLY';
      planTier?: PartnerLicenseRecord['tier'] | undefined;
      customAmount?: number | undefined;
      autoRenew?: boolean | undefined;
      adminUser?: string | undefined;
    }
  ): PartnerLicenseRecord {
    const existing = partnerLicenses.get(partnerId);
    if (!existing) {
      throw new AppError({
        message: `Partner license for ${partnerId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const { billingCycle, planTier, customAmount, autoRenew = true } = params;
    if (planTier) existing.tier = planTier;
    existing.billingCycle = billingCycle;
    existing.autoRenew = autoRenew;

    // Apply lowest market pricing
    if (customAmount !== undefined) {
      if (billingCycle === 'MONTHLY') existing.monthlyRate = customAmount;
      else existing.yearlyRate = customAmount;
    } else {
      existing.monthlyRate = globalConfig.defaultMonthlyInr;
      existing.yearlyRate = globalConfig.defaultYearlyInr;
    }

    const currentExpiry = new Date(existing.expiryDate);
    const startDate = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
    
    if (billingCycle === 'MONTHLY') {
      startDate.setMonth(startDate.getMonth() + 1);
    } else {
      startDate.setFullYear(startDate.getFullYear() + 1);
    }

    existing.expiryDate = startDate.toISOString();
    existing.status = 'ACTIVE';
    existing.gracePeriodEnd = undefined;
    existing.updatedAt = new Date().toISOString();

    partnerLicenses.set(partnerId, existing);
    logger.info(`Partner ${partnerId} Renewed successfully (${billingCycle}) until ${existing.expiryDate}`);
    return existing;
  }

  /**
   * Activates Emergency Grace Period (clinical safety barrier: zero disruption to patients)
   */
  public grantGracePeriod(partnerId: string, days = 15): PartnerLicenseRecord {
    const existing = partnerLicenses.get(partnerId);
    if (!existing) {
      throw new AppError({
        message: `Partner license for ${partnerId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + days);

    existing.status = 'GRACE_PERIOD';
    existing.gracePeriodEnd = graceEnd.toISOString();
    existing.updatedAt = new Date().toISOString();

    partnerLicenses.set(partnerId, existing);
    logger.warn(`Partner ${partnerId} entered 15-day Grace Period until ${existing.gracePeriodEnd}. Read-only clinical barrier active.`);
    return existing;
  }

  /**
   * Computes Live Global Monetization KPIs (MRR, ARR, Conversion Rate, Savings vs Competitors)
   */
  public getMonetizationMetrics() {
    const all = Array.from(partnerLicenses.values());
    const totalPartners = all.length;
    const lifetimeFreeCount = all.filter((p) => p.status === 'LIFETIME_FREE').length;
    const activePayingCount = all.filter((p) => p.status === 'ACTIVE' && p.billingCycle !== 'LIFETIME_FREE').length;
    const expiringSoonCount = all.filter((p) => p.status === 'EXPIRING_SOON').length;
    const gracePeriodCount = all.filter((p) => p.status === 'GRACE_PERIOD').length;

    // Monthly Recurring Revenue (MRR) computation
    const monthlyGmvInr = all.reduce((sum, p) => {
      if (p.status === 'ACTIVE' || p.status === 'EXPIRING_SOON') {
        if (p.billingCycle === 'MONTHLY') return sum + p.monthlyRate;
        if (p.billingCycle === 'YEARLY') return sum + Math.round(p.yearlyRate / 12);
      }
      return sum;
    }, 0);

    const annualizedArrInr = monthlyGmvInr * 12;

    // Competitor savings delivered to doctors worldwide
    const totalCompetitorBaselineInr = all.reduce((sum, p) => sum + (p.marketCompetitorPriceMonthly * 12), 0);
    const doctorSavingsDeliveredInr = Math.max(0, totalCompetitorBaselineInr - annualizedArrInr);

    return {
      totalPartners,
      lifetimeFreeCount,
      activePayingCount,
      expiringSoonCount,
      gracePeriodCount,
      monthlyGmvInr,
      annualizedArrInr,
      doctorSavingsDeliveredInr,
      globalFreeModeEnabled: globalConfig.globalFreeModeEnabled,
      disruptiveLowestPriceModeActive: globalConfig.disruptiveLowestPriceModeActive,
      defaultMonthlyInr: globalConfig.defaultMonthlyInr,
      defaultYearlyInr: globalConfig.defaultYearlyInr
    };
  }
}

export const monetizationEngineService = new MonetizationEngineService();
