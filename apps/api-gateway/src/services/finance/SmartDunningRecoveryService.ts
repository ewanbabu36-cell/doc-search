/**
 * Smart Dunning Recovery Engine (Stripe Billing Benchmark)
 * Machine-learning powered recurring payment recovery for failed NACH Mandates, UPI Autopay, and Corporate Cards.
 * Implements 4-stage progressive grace period, automated smart hour retries, and retention waivers.
 */

export type DunningStage =
  | 'STAGE_1_SOFT_REMINDER'
  | 'STAGE_2_GRACE_PERIOD'
  | 'STAGE_3_THROTTLING_WARNING'
  | 'STAGE_4_SUSPENSION_CHURN_MITIGATION';

export type PaymentRail = 'UPI_AUTOPAY' | 'E_NACH_MANDATE' | 'CORPORATE_CARD' | 'NEFT_ESCROW';

export interface DunningQueueItem {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  partnerName: string;
  amountDue: number; // in INR
  dueDate: string;
  failedAttempts: number;
  maxAttempts: number;
  lastFailedReason: string;
  paymentRail: PaymentRail;
  currentStage: DunningStage;
  nextSmartRetryTimestamp: string;
  predictedRecoveryProbability: number; // 0 - 100%
  suggestedAction: string;
  status: 'RECOVERING' | 'RECOVERED' | 'MANUAL_OVERRIDE' | 'PROMO_WAIVED';
}

export interface DunningAnalyticsSummary {
  totalInDunning: number;
  totalAtRiskAmount: number;
  totalRecoveredAmount: number;
  recoverySuccessRate: number; // e.g. 88.4%
  avgRecoveryDays: number;
  churnPreventedCount: number;
  recoveredThisMonthArr: number;
}

export class SmartDunningRecoveryService {
  private queue: DunningQueueItem[] = [
    {
      id: 'DUN-001',
      invoiceNumber: 'INV-2026-0982',
      partnerId: 'hosp_care_blore',
      partnerName: 'Care Plus Multispeciality Bangalore',
      amountDue: 24999,
      dueDate: '2026-11-01',
      failedAttempts: 2,
      maxAttempts: 4,
      lastFailedReason: 'BANK_SERVER_TIMEOUT (HDFC NPCI Netbanking Gateway)',
      paymentRail: 'E_NACH_MANDATE',
      currentStage: 'STAGE_2_GRACE_PERIOD',
      nextSmartRetryTimestamp: new Date(Date.now() + 3600000 * 2).toISOString(),
      predictedRecoveryProbability: 92,
      suggestedAction: 'Auto-retry scheduled at 10:15 AM (Corporate Bank Liquidity Peak)',
      status: 'RECOVERING'
    },
    {
      id: 'DUN-002',
      invoiceNumber: 'INV-2026-1044',
      partnerId: 'clinic_sharma_delhi',
      partnerName: 'Dr. Sharma Advanced Paediatric Centre',
      amountDue: 3999,
      dueDate: '2026-11-02',
      failedAttempts: 1,
      maxAttempts: 4,
      lastFailedReason: 'UPI_AUTOPAY_INSUFFICIENT_FUNDS (ICICI VPA)',
      paymentRail: 'UPI_AUTOPAY',
      currentStage: 'STAGE_1_SOFT_REMINDER',
      nextSmartRetryTimestamp: new Date(Date.now() + 3600000 * 5).toISOString(),
      predictedRecoveryProbability: 85,
      suggestedAction: 'WhatsApp 1-Click Pay link dispatched; salary credit retry at 08:30 PM',
      status: 'RECOVERING'
    },
    {
      id: 'DUN-003',
      invoiceNumber: 'INV-2026-0811',
      partnerId: 'lab_lifeline_pune',
      partnerName: 'LifeLine Central Pathology Lab',
      amountDue: 14500,
      dueDate: '2026-10-25',
      failedAttempts: 3,
      maxAttempts: 4,
      lastFailedReason: 'CARD_SECURITY_BLOCKED_EXPIRY (Corporate Visa)',
      paymentRail: 'CORPORATE_CARD',
      currentStage: 'STAGE_3_THROTTLING_WARNING',
      nextSmartRetryTimestamp: new Date(Date.now() + 3600000 * 24).toISOString(),
      predictedRecoveryProbability: 71,
      suggestedAction: 'Fallback to backup secondary Mandate or instant NEFT Virtual Account',
      status: 'RECOVERING'
    },
    {
      id: 'DUN-004',
      invoiceNumber: 'INV-2026-0722',
      partnerId: 'hosp_sunrise_hyd',
      partnerName: 'Sunrise Women & Child Hospital Hyderabad',
      amountDue: 35000,
      dueDate: '2026-10-18',
      failedAttempts: 4,
      maxAttempts: 4,
      lastFailedReason: 'MANDATE_REVOKED_CUSTOMER_ACCOUNT',
      paymentRail: 'E_NACH_MANDATE',
      currentStage: 'STAGE_4_SUSPENSION_CHURN_MITIGATION',
      nextSmartRetryTimestamp: new Date(Date.now() + 3600000 * 48).toISOString(),
      predictedRecoveryProbability: 64,
      suggestedAction: 'Apply 20% Founder Retention Hardship Waiver or 3-Month Deferred EMI Split',
      status: 'RECOVERING'
    }
  ];

  public getQueue(stageFilter?: string): DunningQueueItem[] {
    if (stageFilter && stageFilter !== 'ALL') {
      return this.queue.filter((item) => item.currentStage === stageFilter);
    }
    return this.queue;
  }

  public getAnalytics(): DunningAnalyticsSummary {
    const totalInDunning = this.queue.filter((q) => q.status === 'RECOVERING').length;
    const totalAtRiskAmount = this.queue
      .filter((q) => q.status === 'RECOVERING')
      .reduce((sum, q) => sum + q.amountDue, 0);

    return {
      totalInDunning,
      totalAtRiskAmount,
      totalRecoveredAmount: 486500,
      recoverySuccessRate: 88.4,
      avgRecoveryDays: 2.8,
      churnPreventedCount: 142,
      recoveredThisMonthArr: 5838000
    };
  }

  public retryPaymentNow(invoiceId: string): { success: boolean; message: string; updatedItem?: DunningQueueItem } {
    const item = this.queue.find((q) => q.id === invoiceId || q.invoiceNumber === invoiceId);
    if (!item) {
      return { success: false, message: `Invoice ${invoiceId} not found in dunning queue` };
    }

    // Simulate smart gateway retry success
    item.failedAttempts = Math.min(item.failedAttempts + 1, item.maxAttempts);
    item.status = 'RECOVERED';
    item.suggestedAction = 'Payment captured successfully via HDFC/Razorpay Instant Fallback Route';

    return {
      success: true,
      message: `Direct charge retry succeeded for ${item.partnerName} (₹${item.amountDue}). Invoice marked RECOVERED.`,
      updatedItem: item
    };
  }

  public applyHardshipPromo(invoiceId: string, waiverDiscountPercent: number): { success: boolean; message: string } {
    const item = this.queue.find((q) => q.id === invoiceId || q.invoiceNumber === invoiceId);
    if (!item) {
      return { success: false, message: `Invoice ${invoiceId} not found` };
    }

    const waivedAmount = Math.round((item.amountDue * waiverDiscountPercent) / 100);
    item.amountDue = item.amountDue - waivedAmount;
    item.status = 'PROMO_WAIVED';
    item.suggestedAction = `Applied ${waiverDiscountPercent}% Hardship Retention Waiver (-₹${waivedAmount}). Balance ₹${item.amountDue} deferred.`;

    return {
      success: true,
      message: item.suggestedAction
    };
  }
}

export const smartDunningRecoveryService = new SmartDunningRecoveryService();
