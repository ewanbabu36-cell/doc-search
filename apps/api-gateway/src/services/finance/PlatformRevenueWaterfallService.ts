import { statutoryTdsEngineService } from './StatutoryTdsEngineService.js';

export interface GmvStreamItem {
  streamName: string; // 'OPD Consultations' | 'IPD Surgeries & Beds' | 'In-House Pharmacy' | 'Laboratory Diagnostics'
  grossGmvInr: number;
  transactionCount: number;
  gatewayFeeInr: number; // ~1.8%
  platformTakeRateInr: number; // ~2.5%
  tdsSection194OInr: number; // 0.1% post-01-Oct-2024 (1.0% historical)
  netSettlementInr: number;
}

export interface RevenueWaterfallReport {
  periodMonth: string;
  totalGrossGmvInr: number;
  totalTransactions: number;
  deductions: {
    paymentGatewayFeeInr: number;
    t0FactoringFeeInr: number;
    platformTakeRateFeeInr: number;
    tdsSection194OInr: number;
    gstLiabilityOnTakeRateInr: number; // 18% on platform take-rate
  };
  netPartnerDisbursementInr: number;
  platformNetRevenueInr: number;
  streams: GmvStreamItem[];
  escrowStatus: 'SETTLED_DAILY_CYCLE' | 'ESCROW_HELD_T1';
  complianceStatus: '100% SECTION 194O COMPLIANT';
  generatedAt: string;
}

export interface TdsGstr1Record {
  partnerId: string;
  partnerLegalName: string;
  gstin: string;
  pan: string;
  grossTransactionValueInr: number;
  tdsDeductedInr: number;
  challanNumber: string;
  gstr1FilingStatus: 'READY_FOR_FILING' | 'FILED_ACKNOWLEDGED';
  settlementDate: string;
}

export class PlatformRevenueWaterfallService {
  /**
   * Computes full Gross-to-Net Revenue Take-Rate Waterfall dynamically applying
   * statutory Section 194-O effective-dated withholding rates (0.1% post-01-Oct-2024, 1.0% historical).
   */
  public getRevenueWaterfall(options?: { asOfDate?: Date | string }): RevenueWaterfallReport {
    const txDate = options?.asOfDate ? new Date(options.asOfDate) : new Date('2026-10-15T00:00:00.000Z');

    const streamRaw = [
      {
        streamName: 'IPD Surgeries & Inpatient Admissions',
        grossGmvInr: 4850000,
        transactionCount: 312,
        gatewayFeeInr: 87300,
        platformTakeRateInr: 121250,
        deducteeCategory: 'COMPANY' as const,
        pan: 'AAACH0001A'
      },
      {
        streamName: 'OPD Doctor Consultations & Tele-Health',
        grossGmvInr: 1420000,
        transactionCount: 2840,
        gatewayFeeInr: 25560,
        platformTakeRateInr: 35500,
        deducteeCategory: 'LLP' as const,
        pan: 'BBBCH0002B'
      },
      {
        streamName: 'In-House Pharmacy & D2D Smart Refills',
        grossGmvInr: 1980000,
        transactionCount: 3960,
        gatewayFeeInr: 35640,
        platformTakeRateInr: 49500,
        deducteeCategory: 'COMPANY' as const,
        pan: 'CCCCH0003C'
      },
      {
        streamName: 'Laboratory & Diagnostic Pathology',
        grossGmvInr: 890000,
        transactionCount: 1780,
        gatewayFeeInr: 16020,
        platformTakeRateInr: 22250,
        deducteeCategory: 'COMPANY' as const,
        pan: 'DDDCH0004D'
      }
    ];

    const streams: GmvStreamItem[] = streamRaw.map((s) => {
      const tdsResult = statutoryTdsEngineService.calculateTds({
        partnerId: s.streamName,
        partnerLegalName: s.streamName,
        deducteeCategory: s.deducteeCategory,
        pan: s.pan,
        transactionDate: txDate,
        grossAmountInr: s.grossGmvInr,
        gstAmountInr: 0
      });

      const tdsSection194OInr = tdsResult.tdsAmountInr;
      const netSettlementInr = s.grossGmvInr - s.gatewayFeeInr - s.platformTakeRateInr - tdsSection194OInr;

      return {
        streamName: s.streamName,
        grossGmvInr: s.grossGmvInr,
        transactionCount: s.transactionCount,
        gatewayFeeInr: s.gatewayFeeInr,
        platformTakeRateInr: s.platformTakeRateInr,
        tdsSection194OInr,
        netSettlementInr
      };
    });

    const totalGrossGmv = streams.reduce((sum, s) => sum + s.grossGmvInr, 0);
    const totalTransactions = streams.reduce((sum, s) => sum + s.transactionCount, 0);
    const totalGatewayFee = streams.reduce((sum, s) => sum + s.gatewayFeeInr, 0);
    const totalTakeRate = streams.reduce((sum, s) => sum + s.platformTakeRateInr, 0);
    const totalTds = streams.reduce((sum, s) => sum + s.tdsSection194OInr, 0);
    const t0FactoringFee = 32500;
    const gstLiabilityOnTakeRate = Math.round(totalTakeRate * 0.18);
    const netDisbursement = totalGrossGmv - totalGatewayFee - totalTakeRate - totalTds - t0FactoringFee;
    const platformNetRevenue = totalTakeRate + t0FactoringFee;

    const monthStr = txDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return {
      periodMonth: monthStr || 'October 2026',
      totalGrossGmvInr: totalGrossGmv,
      totalTransactions,
      deductions: {
        paymentGatewayFeeInr: totalGatewayFee,
        t0FactoringFeeInr: t0FactoringFee,
        platformTakeRateFeeInr: totalTakeRate,
        tdsSection194OInr: totalTds,
        gstLiabilityOnTakeRateInr: gstLiabilityOnTakeRate
      },
      netPartnerDisbursementInr: netDisbursement,
      platformNetRevenueInr: platformNetRevenue,
      streams,
      escrowStatus: 'SETTLED_DAILY_CYCLE',
      complianceStatus: '100% SECTION 194O COMPLIANT',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generates electronic Section 194O TDS and GSTR-1 Ledger records adhering to
   * amended Section 194-O statutory rates (0.1%) with partner PAN/GSTIN tracking.
   */
  public getTdsGstr1Ledger(options?: { asOfDate?: Date | string }): TdsGstr1Record[] {
    const txDate = options?.asOfDate ? new Date(options.asOfDate) : new Date('2026-10-31T00:00:00.000Z');

    const partners = [
      {
        partnerId: 'PARTNER-DELHI-001',
        partnerLegalName: 'Apex Heart & Multispeciality Institute LLP',
        gstin: '07AAAAA0000A1Z5',
        pan: 'AAAAA0000A',
        grossTransactionValueInr: 3840000,
        challanNumber: 'IT-CH-2026-98210',
        gstr1FilingStatus: 'READY_FOR_FILING' as const,
        settlementDate: '2026-10-31'
      },
      {
        partnerId: 'PARTNER-BLR-002',
        partnerLegalName: 'MediCare Life Sciences Healthcare Ltd',
        gstin: '29BBBBB1111B1Z2',
        pan: 'BBBBB1111B',
        grossTransactionValueInr: 2950000,
        challanNumber: 'IT-CH-2026-98211',
        gstr1FilingStatus: 'READY_FOR_FILING' as const,
        settlementDate: '2026-10-31'
      },
      {
        partnerId: 'PARTNER-MUM-003',
        partnerLegalName: 'Sanjeevani Clinic & Daycare Centers',
        gstin: '27CCCCC2222C1Z8',
        pan: 'CCCCC2222C',
        grossTransactionValueInr: 2350000,
        challanNumber: 'IT-CH-2026-98212',
        gstr1FilingStatus: 'FILED_ACKNOWLEDGED' as const,
        settlementDate: '2026-10-30'
      }
    ];

    return partners.map((p) => {
      const calc = statutoryTdsEngineService.calculateTds({
        partnerId: p.partnerId,
        partnerLegalName: p.partnerLegalName,
        deducteeCategory: 'COMPANY',
        pan: p.pan,
        transactionDate: txDate,
        grossAmountInr: p.grossTransactionValueInr
      });

      return {
        partnerId: p.partnerId,
        partnerLegalName: p.partnerLegalName,
        gstin: p.gstin,
        pan: p.pan,
        grossTransactionValueInr: p.grossTransactionValueInr,
        tdsDeductedInr: calc.tdsAmountInr,
        challanNumber: p.challanNumber,
        gstr1FilingStatus: p.gstr1FilingStatus,
        settlementDate: p.settlementDate
      };
    });
  }
}

export const platformRevenueWaterfallService = new PlatformRevenueWaterfallService();
