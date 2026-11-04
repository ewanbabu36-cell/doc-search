import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('usage-quota-throttler');

export interface PartnerUsageQuota {
  partnerId: string;
  isUnlimitedVip: boolean;
  whatsappMessages: {
    allocatedLimit: number;
    usedCount: number;
    softWarningTriggered: boolean;
  };
  dicomStorageGb: {
    allocatedLimit: number;
    usedGb: number;
    softWarningTriggered: boolean;
  };
  aiScribeMinutes: {
    allocatedLimit: number;
    usedMinutes: number;
    softWarningTriggered: boolean;
  };
  updatedAt: string;
}

const partnerQuotas = new Map<string, PartnerUsageQuota>([
  [
    'PARTNER-001',
    {
      partnerId: 'PARTNER-001',
      isUnlimitedVip: true,
      whatsappMessages: { allocatedLimit: 100000, usedCount: 1240, softWarningTriggered: false },
      dicomStorageGb: { allocatedLimit: 1000, usedGb: 48.5, softWarningTriggered: false },
      aiScribeMinutes: { allocatedLimit: 50000, usedMinutes: 320, softWarningTriggered: false },
      updatedAt: new Date().toISOString()
    }
  ],
  [
    'PARTNER-002',
    {
      partnerId: 'PARTNER-002',
      isUnlimitedVip: false,
      whatsappMessages: { allocatedLimit: 250, usedCount: 215, softWarningTriggered: true },
      dicomStorageGb: { allocatedLimit: 5, usedGb: 1.2, softWarningTriggered: false },
      aiScribeMinutes: { allocatedLimit: 100, usedMinutes: 85, softWarningTriggered: true },
      updatedAt: new Date().toISOString()
    }
  ]
]);

export class UsageQuotaThrottlerService {
  public getQuota(partnerId: string): PartnerUsageQuota {
    const existing = partnerQuotas.get(partnerId);
    if (existing) return existing;

    const defaultQuota: PartnerUsageQuota = {
      partnerId,
      isUnlimitedVip: false,
      whatsappMessages: { allocatedLimit: 100, usedCount: 0, softWarningTriggered: false },
      dicomStorageGb: { allocatedLimit: 5, usedGb: 0, softWarningTriggered: false },
      aiScribeMinutes: { allocatedLimit: 60, usedMinutes: 0, softWarningTriggered: false },
      updatedAt: new Date().toISOString()
    };
    partnerQuotas.set(partnerId, defaultQuota);
    return defaultQuota;
  }

  public updateQuotaLimits(params: {
    partnerId: string;
    whatsappLimit?: number | undefined;
    dicomStorageLimitGb?: number | undefined;
    aiScribeLimitMinutes?: number | undefined;
    isUnlimitedVip?: boolean | undefined;
  }): PartnerUsageQuota {
    const quota = this.getQuota(params.partnerId);

    if (params.whatsappLimit !== undefined) quota.whatsappMessages.allocatedLimit = params.whatsappLimit;
    if (params.dicomStorageLimitGb !== undefined) quota.dicomStorageGb.allocatedLimit = params.dicomStorageLimitGb;
    if (params.aiScribeLimitMinutes !== undefined) quota.aiScribeMinutes.allocatedLimit = params.aiScribeLimitMinutes;
    if (params.isUnlimitedVip !== undefined) quota.isUnlimitedVip = params.isUnlimitedVip;

    quota.updatedAt = new Date().toISOString();
    partnerQuotas.set(params.partnerId, quota);

    logger.info(`Updated Quota Limits for Partner ${params.partnerId}: VIP=${quota.isUnlimitedVip}`);
    return quota;
  }

  public checkAndRecordUsage(params: {
    partnerId: string;
    type: 'WHATSAPP' | 'DICOM' | 'AI_SCRIBE';
    amount?: number | undefined;
  }): { allowed: boolean; remaining: number; softWarning: boolean } {
    const { partnerId, type, amount = 1 } = params;
    const quota = this.getQuota(partnerId);

    if (quota.isUnlimitedVip) {
      return { allowed: true, remaining: 999999, softWarning: false };
    }

    let allowed = true;
    let remaining = 0;
    let softWarning = false;

    if (type === 'WHATSAPP') {
      const nextCount = quota.whatsappMessages.usedCount + amount;
      remaining = Math.max(0, quota.whatsappMessages.allocatedLimit - nextCount);
      if (nextCount > quota.whatsappMessages.allocatedLimit) {
        allowed = false;
      } else {
        quota.whatsappMessages.usedCount = nextCount;
        if (nextCount >= quota.whatsappMessages.allocatedLimit * 0.8) {
          quota.whatsappMessages.softWarningTriggered = true;
          softWarning = true;
        }
      }
    } else if (type === 'DICOM') {
      const nextGb = quota.dicomStorageGb.usedGb + amount;
      remaining = Math.max(0, quota.dicomStorageGb.allocatedLimit - nextGb);
      if (nextGb > quota.dicomStorageGb.allocatedLimit) {
        allowed = false;
      } else {
        quota.dicomStorageGb.usedGb = nextGb;
        if (nextGb >= quota.dicomStorageGb.allocatedLimit * 0.8) {
          quota.dicomStorageGb.softWarningTriggered = true;
          softWarning = true;
        }
      }
    } else if (type === 'AI_SCRIBE') {
      const nextMinutes = quota.aiScribeMinutes.usedMinutes + amount;
      remaining = Math.max(0, quota.aiScribeMinutes.allocatedLimit - nextMinutes);
      if (nextMinutes > quota.aiScribeMinutes.allocatedLimit) {
        allowed = false;
      } else {
        quota.aiScribeMinutes.usedMinutes = nextMinutes;
        if (nextMinutes >= quota.aiScribeMinutes.allocatedLimit * 0.8) {
          quota.aiScribeMinutes.softWarningTriggered = true;
          softWarning = true;
        }
      }
    }

    quota.updatedAt = new Date().toISOString();
    partnerQuotas.set(partnerId, quota);

    return { allowed, remaining, softWarning };
  }
}

export const usageQuotaThrottlerService = new UsageQuotaThrottlerService();
