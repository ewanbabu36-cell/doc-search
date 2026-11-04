import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';

const logger = createLogger('ai-churn-radar');

export type ChurnRiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RetentionStatus = 'MONITORED' | 'WHATSAPP_DISPATCHED' | 'RETENTION_OFFER_ACCEPTED' | 'SAVED_COMMUNITY_FREE';

export interface PartnerDormancyAlert {
  id: string;
  partnerId: string;
  partnerName: string;
  doctorName: string;
  phone: string;
  specialty: string;
  churnScore: number; // 0 to 100
  riskTier: ChurnRiskTier;
  opdDropPercent: number; // e.g. 42% drop compared to 14-day baseline
  daysSinceLastRx: number;
  retentionStatus: RetentionStatus;
  suggestedOffer: '50_PERCENT_LOYALTY_LOCK' | 'FREE_AI_SCRIBE_3_MONTHS' | 'LIFETIME_COMMUNITY_FREE';
  lastEvaluatedAt: string;
}

const DEFAULT_DORMANCY_ALERTS: PartnerDormancyAlert[] = [
  {
    id: 'CHURN-2026-001',
    partnerId: 'PARTNER-002',
    partnerName: 'Dr. Amitabh Verma Cardiology Clinic',
    doctorName: 'Dr. Amitabh Verma',
    phone: '+91 98111 22334',
    specialty: 'Cardiology',
    churnScore: 78,
    riskTier: 'HIGH',
    opdDropPercent: 45,
    daysSinceLastRx: 6,
    retentionStatus: 'MONITORED',
    suggestedOffer: '50_PERCENT_LOYALTY_LOCK',
    lastEvaluatedAt: new Date().toISOString()
  },
  {
    id: 'CHURN-2026-002',
    partnerId: 'PARTNER-004',
    partnerName: 'Apex Diagnostics & Lab Network',
    doctorName: 'Dr. S. K. Gupta',
    phone: '+91 99000 11223',
    specialty: 'Pathology & Biochemistry',
    churnScore: 89,
    riskTier: 'CRITICAL',
    opdDropPercent: 60,
    daysSinceLastRx: 9,
    retentionStatus: 'WHATSAPP_DISPATCHED',
    suggestedOffer: 'LIFETIME_COMMUNITY_FREE',
    lastEvaluatedAt: new Date().toISOString()
  }
];

const alertStore = new Map<string, PartnerDormancyAlert>(
  DEFAULT_DORMANCY_ALERTS.map((a) => [a.partnerId, a])
);

export class AiChurnRadarService {
  public getDormancyAlerts(): PartnerDormancyAlert[] {
    return Array.from(alertStore.values()).sort((a, b) => b.churnScore - a.churnScore);
  }

  public dispatchAutomatedRetentionOutreach(partnerId: string): { success: boolean; message: string; alert: PartnerDormancyAlert } {
    const alert = alertStore.get(partnerId);
    if (!alert) {
      throw new AppError({
        message: `Churn record for partner ${partnerId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    alert.retentionStatus = 'WHATSAPP_DISPATCHED';
    alert.lastEvaluatedAt = new Date().toISOString();
    alertStore.set(partnerId, alert);

    const message = `Namaste ${alert.doctorName} ji, humne dekha ki pichle kuch dino me aapki OPD activity slow rahi hai. DocSearch par kisi bhi feature ya prescription formatting me koi pareshani to nahi aayi? Hamari Clinical Senior Team aapki suvidha ke liye 50% Lifetime Loyalty Lock extend kar rahi hai.`;

    logger.info(`Automated WhatsApp Retention Care Dispatched to ${alert.phone} (${alert.doctorName})`);

    return {
      success: true,
      message,
      alert
    };
  }

  public applyRetentionOffer(
    partnerId: string,
    offerType: '50_PERCENT_LOYALTY_LOCK' | 'FREE_AI_SCRIBE_3_MONTHS' | 'LIFETIME_COMMUNITY_FREE'
  ): PartnerDormancyAlert {
    const alert = alertStore.get(partnerId);
    if (!alert) {
      throw new AppError({
        message: `Churn record for partner ${partnerId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    alert.suggestedOffer = offerType;
    alert.retentionStatus =
      offerType === 'LIFETIME_COMMUNITY_FREE'
        ? 'SAVED_COMMUNITY_FREE'
        : 'RETENTION_OFFER_ACCEPTED';
    alert.churnScore = Math.max(10, alert.churnScore - 40);
    alert.lastEvaluatedAt = new Date().toISOString();

    alertStore.set(partnerId, alert);
    logger.info(`Retention Offer '${offerType}' applied to ${alert.partnerName}. Churn score reduced to ${alert.churnScore}`);
    return alert;
  }
}

export const aiChurnRadarService = new AiChurnRadarService();
