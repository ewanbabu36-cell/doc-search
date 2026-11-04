export interface GmvStreamItem {
  streamName: string; // 'OPD Consultations' | 'IPD Surgeries & Beds' | 'In-House Pharmacy' | 'Laboratory Diagnostics'
  grossGmvInr: number;
  transactionCount: number;
  gatewayFeeInr: number; // ~1.8%
  platformTakeRateInr: number; // ~2.5%
  tdsSection194OInr: number; // 1%
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
   * Computes full Gross-to-Net Revenue Take-Rate Waterfall
   */
  public getRevenueWaterfall(): RevenueWaterfallReport {
    const streams: GmvStreamItem[] = [
      {
        streamName: 'IPD Surgeries & Inpatient Admissions',
        grossGmvInr: 4850000,
        transactionCount: 312,
        gatewayFeeInr: 87300,
        platformTakeRateInr: 121250,
        tdsSection194OInr: 48500,
        netSettlementInr: 4592950
      },
      {
        streamName: 'OPD Doctor Consultations & Tele-Health',
        grossGmvInr: 1420000,
        transactionCount: 2840,
        gatewayFeeInr: 25560,
        platformTakeRateInr: 35500,
        tdsSection194OInr: 14200,
        netSettlementInr: 1344740
      },
      {
        streamName: 'In-House Pharmacy & D2D Smart Refills',
        grossGmvInr: 1980000,
        transactionCount: 3960,
        gatewayFeeInr: 35640,
        platformTakeRateInr: 49500,
        tdsSection194OInr: 19800,
        netSettlementInr: 1875060
      },
      {
        streamName: 'Laboratory & Diagnostic Pathology',
        grossGmvInr: 890000,
        transactionCount: 1780,
        gatewayFeeInr: 16020,
        platformTakeRateInr: 22250,
        tdsSection194OInr: 8900,
        netSettlementInr: 842830
      }
    ];

    const totalGrossGmv = streams.reduce((sum, s) => sum + s.grossGmvInr, 0);
    const totalTransactions = streams.reduce((sum, s) => sum + s.transactionCount, 0);
    const totalGatewayFee = streams.reduce((sum, s) => sum + s.gatewayFeeInr, 0);
    const totalTakeRate = streams.reduce((sum, s) => sum + s.platformTakeRateInr, 0);
    const totalTds = streams.reduce((sum, s) => sum + s.tdsSection194OInr, 0);
    const t0FactoringFee = 32500;
    const gstLiabilityOnTakeRate = Math.round(totalTakeRate * 0.18);
    const netDisbursement = totalGrossGmv - totalGatewayFee - totalTakeRate - totalTds - t0FactoringFee;
    const platformNetRevenue = totalTakeRate + t0FactoringFee;

    return {
      periodMonth: 'October 2026',
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
   * Generates electronic Section 194O TDS and GSTR-1 Ledger records
   */
  public getTdsGstr1Ledger(): TdsGstr1Record[] {
    return [
      {
        partnerId: 'PARTNER-DELHI-001',
        partnerLegalName: 'Apex Heart & Multispeciality Institute LLP',
        gstin: '07AAAAA0000A1Z5',
        pan: 'AAAAA0000A',
        grossTransactionValueInr: 3840000,
        tdsDeductedInr: 38400,
        challanNumber: 'IT-CH-2026-98210',
        gstr1FilingStatus: 'READY_FOR_FILING',
        settlementDate: '2026-10-31'
      },
      {
        partnerId: 'PARTNER-BLR-002',
        partnerLegalName: 'MediCare Life Sciences Healthcare Ltd',
        gstin: '29BBBBB1111B1Z2',
        pan: 'BBBBB1111B',
        grossTransactionValueInr: 2950000,
        tdsDeductedInr: 29500,
        challanNumber: 'IT-CH-2026-98211',
        gstr1FilingStatus: 'READY_FOR_FILING',
        settlementDate: '2026-10-31'
      },
      {
        partnerId: 'PARTNER-MUM-003',
        partnerLegalName: 'Sanjeevani Clinic & Daycare Centers',
        gstin: '27CCCCC2222C1Z8',
        pan: 'CCCCC2222C',
        grossTransactionValueInr: 2350000,
        tdsDeductedInr: 23500,
        challanNumber: 'IT-CH-2026-98212',
        gstr1FilingStatus: 'FILED_ACKNOWLEDGED',
        settlementDate: '2026-10-30'
      }
    ];
  }
}

export const platformRevenueWaterfallService = new PlatformRevenueWaterfallService();
