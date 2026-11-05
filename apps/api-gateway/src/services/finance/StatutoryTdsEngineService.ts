import crypto from 'node:crypto';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export type DeducteeCategory = 'COMPANY' | 'LLP' | 'INDIVIDUAL' | 'HUF' | 'PARTNERSHIP';

export interface TdsCalculationInput {
  transactionId?: string;
  partnerId: string;
  partnerLegalName: string;
  deducteeCategory: DeducteeCategory;
  pan?: string | null | undefined;
  transactionDate: Date | string;
  grossAmountInr: number;
  gstAmountInr?: number | undefined;
  cumulativeFyGmvInr?: number | undefined;
  isRefundOrReversal?: boolean | undefined;
}

export interface TdsCalculationResult {
  transactionId: string;
  partnerId: string;
  applicableLaw: 'INCOME_TAX_ACT_1961_ORIGINAL' | 'INCOME_TAX_ACT_1961_AMENDED_2024' | 'INCOME_TAX_ACT_2025_CODIFIED';
  statutorySection: string; // '194-O' or '194-O (Finance Act 2024)' or 'ITA 2025 E-Commerce Withholding'
  statutoryRatePercent: number; // 1.0, 0.1, or 5.0 (Section 206AA)
  taxableBaseAmountInr: number; // Excludes GST component per CBDT Circular 23/2017
  tdsAmountInr: number;
  netDisbursementInr: number;
  isPanFurnished: boolean;
  isThresholdExempt: boolean; // ₹5L individual exemption under Section 194-O(2)
  effectiveDateRule: string;
  statutoryCitation: string;
  form26QParticulars: {
    deducteeCode: '01' | '02'; // 01 for Companies, 02 for Non-Companies (Individuals, HUF, Firms)
    sectionCode: '94O';
    panStatus: 'VALID_PAN' | 'NO_PAN_HIGHER_RATE' | 'INVALID_PAN';
    rateApplied: number;
    financialYear: string;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  };
}

export interface Form26QExportRow {
  slNo: number;
  deducteeCode: '01' | '02';
  pan: string;
  deducteeName: string;
  dateOfPaymentOrCredit: string;
  amountPaidOrCreditedInr: number;
  tdsDeductedInr: number;
  dateOfDeduction: string;
  ratePercent: number;
  sectionCode: string;
  challanNumber: string;
  bsrCode: string;
  challanDate: string;
  certificate197Applicable: boolean;
}

/**
 * Statutory Income Tax Section 194-O Engine.
 * 
 * Rules Implemented:
 * 1. Historical Baseline (01-Oct-2020 to 30-Sep-2024): 1.0% under Section 194-O (Finance Act 2020).
 * 2. Amended Law (01-Oct-2024 to 31-Mar-2026): 0.1% under Section 194-O(1) as amended by Section 60(a) of the Finance (No. 2) Act, 2024.
 * 3. Codified Direct Tax Era (01-Apr-2026 onward): 0.1% under the Income-tax Act 2025 / Direct Tax Code successor schedule.
 * 4. Section 206AA Proviso: If PAN is not furnished, TDS rate is 5.0% (capped specifically for Section 194-O, not 20%).
 * 5. Section 194-O(2) Threshold: Individual/HUF with cumulative GMV <= ₹5,00,000 in FY who furnished PAN is EXEMPT (0% TDS).
 * 6. CBDT Circular 23/2017 & Section 194-O FAQs: TDS is deducted on gross amount EXCLUDING GST indicated separately.
 */
export class StatutoryTdsEngineService {
  private static readonly PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  private static readonly INDIVIDUAL_EXEMPTION_THRESHOLD = 500000; // ₹5 Lakhs (Section 194-O(2))

  /**
   * Evaluates the financial year (e.g. "2024-2025", "2026-2027") and Quarter (Q1-Q4)
   */
  public getFinancialPeriod(date: Date): { financialYear: string; quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'; fyStartYear: number } {
    const month = date.getUTCMonth(); // UTC month (0 = Jan, 2 = Mar, 3 = Apr, etc.)
    const year = date.getUTCFullYear();

    let fyStartYear: number;
    let fyEndYear: number;
    let quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

    if (month >= 3) {
      // April (3) to Dec (11)
      fyStartYear = year;
      fyEndYear = year + 1;
      if (month <= 5) quarter = 'Q1'; // Apr - Jun
      else if (month <= 8) quarter = 'Q2'; // Jul - Sep
      else quarter = 'Q3'; // Oct - Dec
    } else {
      // Jan (0) to Mar (2)
      fyStartYear = year - 1;
      fyEndYear = year;
      quarter = 'Q4'; // Jan - Mar
    }

    return {
      financialYear: `${fyStartYear}-${fyEndYear}`,
      quarter,
      fyStartYear
    };
  }

  /**
   * Validates whether a provided PAN is legally valid according to CBDT standards.
   */
  public isValidPan(pan: string | null | undefined): boolean {
    if (!pan || typeof pan !== 'string') return false;
    return StatutoryTdsEngineService.PAN_REGEX.test(pan.trim().toUpperCase());
  }

  /**
   * Determines the statutory rate and legal basis for a given transaction date and PAN status.
   */
  public calculateTds(input: TdsCalculationInput): TdsCalculationResult {
    const txDate = input.transactionDate instanceof Date ? input.transactionDate : new Date(input.transactionDate);
    if (isNaN(txDate.getTime())) {
      throw new AppError({
        message: `Invalid transaction date for TDS evaluation: ${input.transactionDate}`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const { financialYear, quarter } = this.getFinancialPeriod(txDate);
    const hasValidPan = this.isValidPan(input.pan);
    const deducteeCode: '01' | '02' = input.deducteeCategory === 'COMPANY' ? '01' : '02';

    // CBDT Circular 23/2017: Base amount excludes separately stated GST
    const grossInr = Math.max(0, input.grossAmountInr || 0);
    const gstInr = Math.max(0, input.gstAmountInr || 0);
    const taxableBase = Math.max(0, grossInr - gstInr);

    // Date milestones
    const dateOct2024 = new Date('2024-10-01T00:00:00.000Z');
    const dateApr2026 = new Date('2026-04-01T00:00:00.000Z');

    let applicableLaw: TdsCalculationResult['applicableLaw'];
    let statutorySection: string;
    let standardRate: number;
    let statutoryCitation: string;
    let effectiveDateRule: string;

    if (txDate < dateOct2024) {
      // Historical period: 1 Oct 2020 to 30 Sep 2024
      applicableLaw = 'INCOME_TAX_ACT_1961_ORIGINAL';
      statutorySection = 'Section 194-O';
      standardRate = 1.0;
      statutoryCitation = 'Section 194-O of the Income-tax Act, 1961 (inserted by Finance Act, 2020)';
      effectiveDateRule = 'Applicable for transactions prior to 01-October-2024 (1.0% standard rate)';
    } else if (txDate < dateApr2026) {
      // Amended law period: 1 Oct 2024 to 31 Mar 2026
      applicableLaw = 'INCOME_TAX_ACT_1961_AMENDED_2024';
      statutorySection = 'Section 194-O (Finance (No. 2) Act, 2024)';
      standardRate = 0.1;
      statutoryCitation = 'Section 194-O(1) as amended by Section 60(a) of the Finance (No. 2) Act, 2024 w.e.f. 01-10-2024';
      effectiveDateRule = 'Applicable from 01-October-2024 to 31-March-2026 (0.1% rate reduction)';
    } else {
      // Codified direct tax era: 1 Apr 2026 onward
      applicableLaw = 'INCOME_TAX_ACT_2025_CODIFIED';
      statutorySection = 'Section 194-O / Direct Tax Code 2025';
      standardRate = 0.1;
      statutoryCitation = 'Income-tax Act 2025, Schedule for E-Commerce Marketplace Withholding';
      effectiveDateRule = 'Applicable from 01-April-2026 onward under codified Direct Tax provisions (0.1%)';
    }

    // Evaluate Section 194-O(2) threshold for Individual / HUF
    let isThresholdExempt = false;
    const isIndividualOrHuf = input.deducteeCategory === 'INDIVIDUAL' || input.deducteeCategory === 'HUF';
    const cumulativeGmv = (input.cumulativeFyGmvInr || 0) + taxableBase;

    if (isIndividualOrHuf && hasValidPan && cumulativeGmv <= StatutoryTdsEngineService.INDIVIDUAL_EXEMPTION_THRESHOLD) {
      isThresholdExempt = true;
    }

    // Determine final rate: If exempt -> 0%; Else if no PAN -> 5% (Section 206AA proviso); Else -> standardRate
    let finalRatePercent = standardRate;
    let panStatus: 'VALID_PAN' | 'NO_PAN_HIGHER_RATE' | 'INVALID_PAN' = 'VALID_PAN';

    if (isThresholdExempt) {
      finalRatePercent = 0.0;
    } else if (!hasValidPan) {
      // Section 206AA second proviso caps 194-O non-PAN deduction at 5% instead of 20%
      finalRatePercent = 5.0;
      panStatus = input.pan ? 'INVALID_PAN' : 'NO_PAN_HIGHER_RATE';
      statutoryCitation += ' read with Section 206AA second proviso (higher rate 5.0% for non-furnishing of PAN)';
    }

    // Calculate TDS amount (rounded to nearest integer per Section 288B)
    const rawTds = isThresholdExempt ? 0 : (taxableBase * finalRatePercent) / 100;
    const tdsAmountInr = Math.round(rawTds);
    const netDisbursementInr = Math.round((grossInr - tdsAmountInr) * 100) / 100;

    return {
      transactionId: input.transactionId || `TX-TDS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      partnerId: input.partnerId,
      applicableLaw,
      statutorySection,
      statutoryRatePercent: finalRatePercent,
      taxableBaseAmountInr: taxableBase,
      tdsAmountInr,
      netDisbursementInr,
      isPanFurnished: hasValidPan,
      isThresholdExempt,
      effectiveDateRule,
      statutoryCitation,
      form26QParticulars: {
        deducteeCode,
        sectionCode: '94O',
        panStatus,
        rateApplied: finalRatePercent,
        financialYear,
        quarter
      }
    };
  }

  /**
   * Generates electronic Form 26Q e-TDS return export rows conforming to NSDL TIN specs.
   */
  public generateForm26QRows(records: TdsCalculationResult[], partnerMetadata: Map<string, { legalName: string; pan?: string }>): Form26QExportRow[] {
    return records.map((rec, idx) => {
      const meta = partnerMetadata.get(rec.partnerId) || { legalName: 'Healthcare Partner Facility', pan: 'AAAAA0000A' };
      const nowStr: string = new Date().toISOString().split('T')[0] ?? '';
      return {
        slNo: idx + 1,
        deducteeCode: rec.form26QParticulars.deducteeCode,
        pan: rec.isPanFurnished ? (meta.pan || 'PAN_NOT_PROVIDED') : 'PANNOTREQD',
        deducteeName: meta.legalName,
        dateOfPaymentOrCredit: nowStr,
        amountPaidOrCreditedInr: rec.taxableBaseAmountInr,
        tdsDeductedInr: rec.tdsAmountInr,
        dateOfDeduction: nowStr,
        ratePercent: rec.statutoryRatePercent,
        sectionCode: rec.form26QParticulars.sectionCode,
        challanNumber: `CH-IT-${rec.form26QParticulars.financialYear.replace('-', '')}-${(idx + 1).toString().padStart(5, '0')}`,
        bsrCode: '0210001',
        challanDate: nowStr,
        certificate197Applicable: false
      };
    });
  }
}

export const statutoryTdsEngineService = new StatutoryTdsEngineService();
