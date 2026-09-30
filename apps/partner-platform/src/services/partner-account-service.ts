import { apiRequest } from './api-client.js';

export type FeatureEntitlementDto = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  isEntitledInPlan: boolean;
  staffPermitted: boolean;
  status: 'AVAILABLE' | 'LOCKED' | 'EXPIRED' | 'SUSPENDED' | 'NOT_CONFIGURED';
  reason: string | null;
};

export interface PartnerAccountPlanFeaturesData {
  organizationProfile: {
    partnerId: string | null;
    tenantId: string;
    legalName: string;
    tradeName: string;
    partnerType: string;
    lifecycleStatus: string;
    verificationStatus: string;
    primaryContactName: string | null;
    primaryContactEmail: string | null;
    primaryContactPhone: string | null;
    primaryContactRole: string | null;
    tenantName: string | null;
    tenantSlug: string | null;
    tenantStatus: string;
  };
  currentPlan: {
    id: string;
    code: string;
    name: string;
    description: string;
    version: string;
    basePrice: number;
    currency: string;
    billingInterval: string;
    status: string;
    isTrial: boolean;
  } | null;
  subscription: {
    id: string | null;
    status: string;
    billingCycle: string;
    startDate: string | null;
    expiryDate: string | null;
    renewalDate: string | null;
    gracePeriodEnd: string | null;
    daysRemaining: number | null;
    licenseKey: string | null;
    licenseStatus: string;
    licenseType: string;
    isSignatureValid: boolean | null;
    isAccessAllowed: boolean;
    isInGracePeriod: boolean;
    isRenewalWindow?: boolean;
    isExpiringSoon: boolean;
    isExpired: boolean;
    isLocked?: boolean;
    isSuspended: boolean;
    isFirstYearFree?: boolean;
    freePeriodEndDate?: string | null;
    daysRemainingInFreeYear?: number | null;
    availableRenewalTenures?: Array<{
      tenureCode: string;
      label: string;
      months: number;
      defaultDiscountPercent: number;
      badge: string;
      monthlyEquivalent: number;
      totalPrice: number;
      savingsAmount: number;
    }>;
  };
  features: FeatureEntitlementDto[];
  limits: {
    doctorSeats: {
      name: string;
      limit: number;
      used: number;
      remaining: number;
      status: 'NORMAL' | 'NEAR_LIMIT' | 'EXCEEDED';
    };
    inpatientBeds: {
      name: string;
      limit: number;
      used: number;
      remaining: number;
      status: 'NORMAL' | 'NEAR_LIMIT' | 'EXCEEDED';
    };
    branches: {
      name: string;
      limit: number;
      used: number;
      remaining: number;
      status: 'NORMAL' | 'NEAR_LIMIT' | 'EXCEEDED';
    };
    concurrentUsers: {
      name: string;
      limit: number | null;
      used: 'UNKNOWN';
      remaining: 'UNKNOWN';
    };
    whatsappCredits: {
      name: string;
      limit: number | null;
      used: 'UNKNOWN';
      remaining: 'UNKNOWN';
    };
    storageQuotaGb: {
      name: string;
      limit: number | null;
      used: 'UNKNOWN';
      remaining: 'UNKNOWN';
    };
  };
}

export async function fetchPartnerAccountPlanFeatures(): Promise<{
  success: boolean;
  data?: PartnerAccountPlanFeaturesData;
  error?: string;
}> {
  try {
    const res = await apiRequest<PartnerAccountPlanFeaturesData>('/api/v1/partner/account/plan-and-features', {
      method: 'GET'
    });

    if (res.success && res.data) {
      return { success: true, data: res.data };
    }

    return {
      success: false,
      error: res.error?.message || 'Failed to retrieve authoritative account plan and features.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while querying account plan and features.'
    };
  }
}

export async function fetchPartnerConfiguration(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const res = await apiRequest<any>('/api/v1/partner/configuration', {
      method: 'GET'
    });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error?.message || 'Failed to load partner configuration state.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while querying partner configuration.'
    };
  }
}

export async function triggerPartnerConfigurationInitialize(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const res = await apiRequest<any>('/api/v1/partner/configuration/initialize', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Partner Admin triggered deterministic configuration initialization',
        source: 'PARTNER_ADMIN'
      })
    });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error?.message || 'Failed to initialize partner configuration.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while initializing partner configuration.'
    };
  }
}

export async function fetchCanonicalIdentity(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const res = await apiRequest<any>('/api/v1/partner/security/identity', {
      method: 'GET'
    });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error?.message || 'Failed to resolve canonical identity context.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while querying canonical identity context.'
    };
  }
}

export async function diagnosePartnerAccess(payload: {
  action: string;
  resource?: Record<string, unknown>;
  context?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const res = await apiRequest<any>('/api/v1/partner/security/access-diagnostics', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error?.message || 'Access diagnostic evaluation denied.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while running access diagnostic evaluation.'
    };
  }
}

