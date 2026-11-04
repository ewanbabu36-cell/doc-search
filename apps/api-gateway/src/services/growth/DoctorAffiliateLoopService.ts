import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('doctor-affiliate-loop');

export interface DoctorAffiliateRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  referralCode: string;
  inviteLink: string;
  totalDoctorsInvited: number;
  activePayingDoctors: number;
  totalCommissionEarnedInr: number;
  pendingPayoutInr: number;
  commissionRatePercent: number; // default 15%
  upiId?: string | undefined;
  lastPayoutDate?: string | undefined;
}

const DEFAULT_AFFILIATES: DoctorAffiliateRecord[] = [
  {
    id: 'AFF-001',
    doctorId: 'DOC-VERMA-01',
    doctorName: 'Dr. Amitabh Verma',
    clinicName: 'Verma Cardiology Heart Center',
    referralCode: 'DRVERMA15',
    inviteLink: 'https://partner.docsearch.health/join?ref=DRVERMA15',
    totalDoctorsInvited: 12,
    activePayingDoctors: 8,
    totalCommissionEarnedInr: 14400,
    pendingPayoutInr: 3600,
    commissionRatePercent: 15.0,
    upiId: 'drverma@okaxis',
    lastPayoutDate: '2026-10-25T12:00:00.000Z'
  },
  {
    id: 'AFF-002',
    doctorId: 'DOC-RAO-02',
    doctorName: 'Dr. Sunita Rao',
    clinicName: 'Rao Child Care Clinic',
    referralCode: 'DRRAO15',
    inviteLink: 'https://partner.docsearch.health/join?ref=DRRAO15',
    totalDoctorsInvited: 5,
    activePayingDoctors: 4,
    totalCommissionEarnedInr: 7200,
    pendingPayoutInr: 1800,
    commissionRatePercent: 15.0,
    upiId: 'drsunita@okhdfcbank',
    lastPayoutDate: '2026-10-25T12:00:00.000Z'
  }
];

const affiliateStore = new Map<string, DoctorAffiliateRecord>(
  DEFAULT_AFFILIATES.map((a) => [a.id, a])
);

export class DoctorAffiliateLoopService {
  public getAffiliatesList(): DoctorAffiliateRecord[] {
    return Array.from(affiliateStore.values()).sort(
      (a, b) => b.totalCommissionEarnedInr - a.totalCommissionEarnedInr
    );
  }

  public getAffiliateSummary() {
    const all = Array.from(affiliateStore.values());
    const totalAffiliates = all.length;
    const totalDoctorsOnboardedViaD2D = all.reduce((sum, a) => sum + a.totalDoctorsInvited, 0);
    const totalCommissionsPaidInr = all.reduce((sum, a) => sum + (a.totalCommissionEarnedInr - a.pendingPayoutInr), 0);
    const totalPendingPayoutsInr = all.reduce((sum, a) => sum + a.pendingPayoutInr, 0);

    return {
      totalAffiliates,
      totalDoctorsOnboardedViaD2D,
      totalCommissionsPaidInr,
      totalPendingPayoutsInr,
      affiliateTakeRatePercent: 15.0
    };
  }

  public processBatchPayout(): { success: boolean; payoutCount: number; totalDisbursedInr: number; batchId: string } {
    let payoutCount = 0;
    let totalDisbursedInr = 0;
    const now = new Date().toISOString();

    for (const affiliate of affiliateStore.values()) {
      if (affiliate.pendingPayoutInr > 0) {
        totalDisbursedInr += affiliate.pendingPayoutInr;
        affiliate.pendingPayoutInr = 0;
        affiliate.lastPayoutDate = now;
        affiliateStore.set(affiliate.id, affiliate);
        payoutCount += 1;
      }
    }

    const batchId = `PAYOUT-BATCH-${Date.now()}`;
    logger.info(`Batch D2D Affiliate UPI Payout Dispatched: ₹${totalDisbursedInr} across ${payoutCount} doctors [Batch: ${batchId}]`);

    return {
      success: true,
      payoutCount,
      totalDisbursedInr,
      batchId
    };
  }
}

export const doctorAffiliateLoopService = new DoctorAffiliateLoopService();
