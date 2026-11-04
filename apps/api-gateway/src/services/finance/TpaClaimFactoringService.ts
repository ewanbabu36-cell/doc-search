import crypto from 'node:crypto';
import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';

const logger = createLogger('tpa-claim-factoring');

export type FactoringStatus = 'PENDING_ADVANCE' | 'ADVANCED_DAY_0' | 'SETTLED_BY_INSURER' | 'REJECTED';

export interface FactoredClaimRecord {
  id: string;
  claimNumber: string;
  hospitalPartnerId: string;
  hospitalName: string;
  patientName: string;
  patientUhid: string;
  insurancePayer: 'STAR_HEALTH' | 'CARE_HEALTH' | 'HDFC_ERGO' | 'ICICI_LOMBARD' | 'MAX_BUPA';
  totalClaimAmountInr: number;
  advancedPercent: number; // default 80%
  advancedAmountInr: number;
  factoringFeePercent: number; // default 2%
  factoringFeeInr: number;
  escrowReserveInr: number; // Remaining 18% held until insurer settlement
  status: FactoringStatus;
  disbursedAt?: string | undefined;
  settledAt?: string | undefined;
  finalSettledAmountInr?: number | undefined;
  reconciliationAuditSignature: string;
}

const DEFAULT_CLAIMS: FactoredClaimRecord[] = [
  {
    id: 'FCT-2026-001',
    claimNumber: 'CLM-STAR-88192',
    hospitalPartnerId: 'PARTNER-001',
    hospitalName: 'Metropolitan Multispecialty Hospital',
    patientName: 'Kishore Kumar',
    patientUhid: 'UHID-2026-102',
    insurancePayer: 'STAR_HEALTH',
    totalClaimAmountInr: 125000,
    advancedPercent: 80,
    advancedAmountInr: 100000,
    factoringFeePercent: 2.0,
    factoringFeeInr: 2500,
    escrowReserveInr: 22500,
    status: 'ADVANCED_DAY_0',
    disbursedAt: '2026-11-01T10:30:00.000Z',
    reconciliationAuditSignature: 'sig_fct_88192_verified'
  },
  {
    id: 'FCT-2026-002',
    claimNumber: 'CLM-HDFC-99301',
    hospitalPartnerId: 'PARTNER-001',
    hospitalName: 'Metropolitan Multispecialty Hospital',
    patientName: 'Sunita Deshmukh',
    patientUhid: 'UHID-2026-108',
    insurancePayer: 'HDFC_ERGO',
    totalClaimAmountInr: 85000,
    advancedPercent: 80,
    advancedAmountInr: 68000,
    factoringFeePercent: 2.0,
    factoringFeeInr: 1700,
    escrowReserveInr: 15300,
    status: 'PENDING_ADVANCE',
    reconciliationAuditSignature: 'sig_fct_99301_pending'
  }
];

const claimsLedger = new Map<string, FactoredClaimRecord>(
  DEFAULT_CLAIMS.map((c) => [c.id, c])
);

export class TpaClaimFactoringService {
  private computeSignature(claimId: string, amount: number, status: string): string {
    const secret = process.env['FACTORING_SIGN_SECRET'] || 'docsearch-factoring-vault-2026';
    return crypto.createHmac('sha256', secret).update(`${claimId}|${amount}|${status}`).digest('hex');
  }

  public getOverviewMetrics() {
    const all = Array.from(claimsLedger.values());
    const totalClaims = all.length;
    const totalVolumeInr = all.reduce((sum, c) => sum + c.totalClaimAmountInr, 0);
    const totalAdvancedInr = all
      .filter((c) => c.status === 'ADVANCED_DAY_0' || c.status === 'SETTLED_BY_INSURER')
      .reduce((sum, c) => sum + c.advancedAmountInr, 0);
    const totalFeeRevenueInr = all
      .filter((c) => c.status === 'ADVANCED_DAY_0' || c.status === 'SETTLED_BY_INSURER')
      .reduce((sum, c) => sum + c.factoringFeeInr, 0);
    const pendingDisbursementCount = all.filter((c) => c.status === 'PENDING_ADVANCE').length;

    return {
      totalClaims,
      totalVolumeInr,
      totalAdvancedInr,
      totalFeeRevenueInr,
      pendingDisbursementCount,
      averageFactoringFeePercent: 2.0
    };
  }

  public listClaims(partnerId?: string | undefined): FactoredClaimRecord[] {
    let all = Array.from(claimsLedger.values());
    if (partnerId) {
      all = all.filter((c) => c.hospitalPartnerId === partnerId);
    }
    return all.sort((a, b) => (b.disbursedAt || '').localeCompare(a.disbursedAt || ''));
  }

  public disburseDay0Advance(claimId: string, customFeePercent = 2.0): FactoredClaimRecord {
    const claim = claimsLedger.get(claimId);
    if (!claim) {
      throw new AppError({
        message: `Claim ${claimId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (claim.status !== 'PENDING_ADVANCE') {
      throw new AppError({
        message: `Claim ${claimId} has already been advanced or settled.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    claim.factoringFeePercent = customFeePercent;
    claim.factoringFeeInr = Math.round(claim.totalClaimAmountInr * (customFeePercent / 100));
    claim.advancedAmountInr = Math.round(claim.totalClaimAmountInr * 0.8);
    claim.escrowReserveInr = claim.totalClaimAmountInr - claim.advancedAmountInr - claim.factoringFeeInr;
    claim.status = 'ADVANCED_DAY_0';
    claim.disbursedAt = new Date().toISOString();
    claim.reconciliationAuditSignature = this.computeSignature(claim.id, claim.advancedAmountInr, claim.status);

    claimsLedger.set(claim.id, claim);
    logger.info(`T-0 Advance Disbursed for Claim ${claim.claimNumber}: ₹${claim.advancedAmountInr} (Fee: ₹${claim.factoringFeeInr})`);
    return claim;
  }

  public settleInsurerPayment(claimId: string, settledAmountInr: number): FactoredClaimRecord {
    const claim = claimsLedger.get(claimId);
    if (!claim) {
      throw new AppError({
        message: `Claim ${claimId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    claim.status = 'SETTLED_BY_INSURER';
    claim.settledAt = new Date().toISOString();
    claim.finalSettledAmountInr = settledAmountInr;
    claim.reconciliationAuditSignature = this.computeSignature(claim.id, settledAmountInr, claim.status);

    claimsLedger.set(claim.id, claim);
    logger.info(`Claim ${claim.claimNumber} settled by insurer: ₹${settledAmountInr}`);
    return claim;
  }
}

export const tpaClaimFactoringService = new TpaClaimFactoringService();
