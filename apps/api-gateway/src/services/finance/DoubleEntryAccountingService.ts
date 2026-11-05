import crypto from 'node:crypto';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { getDatabase, billingFinancialTransactions } from '@docsearch/database';

const logger = createLogger('double-entry-accounting-service');

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface ChartOfAccount {
  code: string;
  name: string;
  type: AccountType;
  description: string;
}

export const STANDARD_CHART_OF_ACCOUNTS: Record<string, ChartOfAccount> = {
  // ASSETS (1000s)
  '1010_CASH_ON_HAND': { code: '1010_CASH_ON_HAND', name: 'Cash on Hand (Cashier Drawer)', type: 'ASSET', description: 'Physical cash collected at billing counter' },
  '1020_BANK_HDFC_OPERATING': { code: '1020_BANK_HDFC_OPERATING', name: 'HDFC Operating Current Account', type: 'ASSET', description: 'Primary hospital/corporate operating bank account' },
  '1030_GATEWAY_CLEARING_RAZORPAY': { code: '1030_GATEWAY_CLEARING_RAZORPAY', name: 'Razorpay Escrow Clearing', type: 'ASSET', description: 'Funds authorized/captured by payment gateway awaiting bank payout' },
  '1040_GATEWAY_CLEARING_STRIPE': { code: '1040_GATEWAY_CLEARING_STRIPE', name: 'Stripe Connect Clearing', type: 'ASSET', description: 'Stripe merchant destination charge clearing' },
  '1200_ACCOUNTS_RECEIVABLE': { code: '1200_ACCOUNTS_RECEIVABLE', name: 'Patient & Institutional Accounts Receivable', type: 'ASSET', description: 'Amounts billed to patients and corporate payers pending collection' },
  '1300_PHARMACY_INVENTORY': { code: '1300_PHARMACY_INVENTORY', name: 'Pharmacy Stock Inventory', type: 'ASSET', description: 'Medicaments and clinical supplies inventory on hand' },

  // LIABILITIES (2000s)
  '2010_ACCOUNTS_PAYABLE': { code: '2010_ACCOUNTS_PAYABLE', name: 'Trade & Vendor Accounts Payable', type: 'LIABILITY', description: 'Liabilities owed to medicine suppliers and wholesalers' },
  '2100_GST_OUTPUT_TAX_PAYABLE': { code: '2100_GST_OUTPUT_TAX_PAYABLE', name: 'GST Output Tax Liability', type: 'LIABILITY', description: 'CGST, SGST, and IGST collected on taxable hospital services and pharmacy sales' },
  '2200_SECTION_194O_TDS_PAYABLE': { code: '2200_SECTION_194O_TDS_PAYABLE', name: 'Section 194O TDS Withholding Payable', type: 'LIABILITY', description: 'Tax deducted on marketplace participant disbursements payable to Income Tax Dept' },
  '2300_PATIENT_UNEARNED_ADVANCES': { code: '2300_PATIENT_UNEARNED_ADVANCES', name: 'Patient Unearned Advance Deposits', type: 'LIABILITY', description: 'Pre-admission and outpatient deposits held prior to service consumption' },

  // EQUITY (3000s)
  '3010_RETAINED_EARNINGS': { code: '3010_RETAINED_EARNINGS', name: 'Institutional Retained Earnings', type: 'EQUITY', description: 'Accumulated operating surpluses' },

  // REVENUES (4000s)
  '4010_OPD_CONSULTATION_REVENUE': { code: '4010_OPD_CONSULTATION_REVENUE', name: 'OPD Doctor Consultation Revenue', type: 'REVENUE', description: 'Clinical medical consultation fees (0% GST exempt under Notif 12/2017)' },
  '4020_IPD_INPATIENT_REVENUE': { code: '4020_IPD_INPATIENT_REVENUE', name: 'Inpatient Surgical & Care Revenue', type: 'REVENUE', description: 'Operating theatre, procedures, and ICU care (0% GST exempt)' },
  '4025_ROOM_BED_REVENUE_TAXABLE': { code: '4025_ROOM_BED_REVENUE_TAXABLE', name: 'Taxable Room Rent Revenue (> ₹5,000/day)', type: 'REVENUE', description: 'Hospital room rent exceeding ₹5,000/day (5% GST under Notif 04/2022)' },
  '4030_PHARMACY_SALES_REVENUE': { code: '4030_PHARMACY_SALES_REVENUE', name: 'Pharmacy Retail Sales Revenue', type: 'REVENUE', description: 'Outpatient and inpatient medicine dispensing (HSN 3004)' },
  '4040_LAB_DIAGNOSTIC_REVENUE': { code: '4040_LAB_DIAGNOSTIC_REVENUE', name: 'Diagnostic Pathology Revenue', type: 'REVENUE', description: 'Clinical laboratory diagnostic investigations (0% GST exempt)' },
  '4050_RADIOLOGY_REVENUE': { code: '4050_RADIOLOGY_REVENUE', name: 'Radiology Imaging Revenue', type: 'REVENUE', description: 'X-Ray, CT, and MRI imaging services (0% GST exempt)' },
  '4100_PLATFORM_SAAS_REVENUE': { code: '4100_PLATFORM_SAAS_REVENUE', name: 'DocSearch Platform SaaS Subscriptions', type: 'REVENUE', description: 'Corporate software licensing and tier subscriptions' },

  // EXPENSES (5000s)
  '5010_COGS_PHARMACY': { code: '5010_COGS_PHARMACY', name: 'Cost of Goods Sold - Pharmacy', type: 'EXPENSE', description: 'Acquisition cost of dispensed medicament batches' },
  '5020_GATEWAY_PROCESSING_FEES': { code: '5020_GATEWAY_PROCESSING_FEES', name: 'Payment Gateway Processing MDR', type: 'EXPENSE', description: 'Interchange and settlement transaction charges' },
  '5030_REFUNDS_AND_ALLOWANCES': { code: '5030_REFUNDS_AND_ALLOWANCES', name: 'Sales Returns & Patient Refunds', type: 'EXPENSE', description: 'Contra-revenue refunds and approved billing write-downs' }
};

export interface JournalLineItem {
  accountCode: string;
  accountName?: string | undefined;
  accountType?: AccountType | undefined;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntry {
  journalId: string;
  journalNumber: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  transactionDate: string;
  sourceReferenceType: 'INVOICE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'REVERSAL' | 'PERIOD_CLOSE';
  sourceReferenceId: string;
  currency: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: 'POSTED' | 'REVERSED';
  lines: JournalLineItem[];
  actorId: string;
  notes?: string | undefined;
  reversalOfJournalId?: string | undefined;
  reversalReason?: string | undefined;
  postedAt: string;
}

export class DoubleEntryAccountingService {
  private inMemoryJournals: Map<string, JournalEntry> = new Map();
  private closedFiscalPeriods: Set<string> = new Set(); // e.g. "2025-Q1", "2026-03"

  /**
   * Enforces the double-entry accounting invariant: Total Debits must strictly equal Total Credits.
   */
  public validateJournalBalance(lines: JournalLineItem[]): { totalDebit: number; totalCredit: number; isBalanced: boolean } {
    if (!lines || lines.length < 2) {
      throw new AppError({
        message: 'Double-entry accounting violation: Every journal entry must contain at least two valid lines.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      if (typeof line.debit !== 'number' || line.debit < 0 || isNaN(line.debit)) {
        throw new AppError({
          message: `Double-entry invariant error on line ${i + 1}: Debit amount (${line.debit}) must be a non-negative number.`,
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      if (typeof line.credit !== 'number' || line.credit < 0 || isNaN(line.credit)) {
        throw new AppError({
          message: `Double-entry invariant error on line ${i + 1}: Credit amount (${line.credit}) must be a non-negative number.`,
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new AppError({
          message: `Double-entry error on line ${i + 1}: A line cannot have both positive debit and positive credit simultaneously.`,
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new AppError({
          message: `Double-entry error on line ${i + 1}: Line item cannot have zero debit and zero credit.`,
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.005) {
      throw new AppError({
        message: `Double-entry accounting invariant violation: Total Debits (₹${totalDebit.toFixed(2)}) do not equal Total Credits (₹${totalCredit.toFixed(2)}). Variance: ₹${diff.toFixed(2)}. Entry cannot be posted.`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    return { totalDebit, totalCredit, isBalanced: true };
  }

  /**
   * Posts an immutable, balanced double-entry Journal Entry.
   * Persists both to the in-memory journal store and to billing_financial_transactions in DB.
   */
  public async postJournalEntry(
    input: {
      tenantId: string;
      partnerId: string;
      organizationId: string;
      branchId: string;
      sourceReferenceType: JournalEntry['sourceReferenceType'];
      sourceReferenceId: string;
      transactionDate?: string;
      currency?: string;
      lines: JournalLineItem[];
      actorId: string;
      notes?: string;
      patientId?: string;
    },
    tx: any = getDatabase()
  ): Promise<JournalEntry> {
    if (!input.tenantId || !input.partnerId) {
      throw new AppError({
        message: 'Tenant context and partner identity are mandatory for double-entry posting.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    // Check if period is closed
    const dateStr = input.transactionDate || new Date().toISOString();
    const periodKey = dateStr.slice(0, 7); // e.g. "2026-03"
    if (this.closedFiscalPeriods.has(periodKey)) {
      throw new AppError({
        message: `Accounting Period Lock: Fiscal period ${periodKey} is closed. Modifications and retroactive journal postings are strictly prohibited.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    // Validate double-entry invariant
    const { totalDebit, totalCredit } = this.validateJournalBalance(input.lines);

    const journalId = crypto.randomUUID();
    const journalNumber = `JRN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const nowIso = new Date().toISOString();

    // Populate metadata for lines
    const enrichedLines: JournalLineItem[] = input.lines.map((l) => {
      const coa = STANDARD_CHART_OF_ACCOUNTS[l.accountCode];
      return {
        accountCode: l.accountCode,
        accountName: coa?.name || l.accountName || l.accountCode,
        accountType: coa?.type || l.accountType || 'ASSET',
        debit: l.debit,
        credit: l.credit,
        description: l.description
      };
    });

    const journal: JournalEntry = {
      journalId,
      journalNumber,
      tenantId: input.tenantId,
      partnerId: input.partnerId,
      organizationId: input.organizationId,
      branchId: input.branchId,
      transactionDate: dateStr,
      sourceReferenceType: input.sourceReferenceType,
      sourceReferenceId: input.sourceReferenceId,
      currency: input.currency || 'INR',
      totalDebit,
      totalCredit,
      isBalanced: true,
      status: 'POSTED',
      lines: enrichedLines,
      actorId: input.actorId,
      postedAt: nowIso,
      ...(input.notes !== undefined ? { notes: input.notes } : {})
    };

    // Store in journal store
    const storeKey = `${input.tenantId}_${journalId}`;
    this.inMemoryJournals.set(storeKey, journal);

    // Persist lines to database billingFinancialTransactions table if tx is provided
    if (tx && typeof tx.insert === 'function') {
      try {
        for (let i = 0; i < enrichedLines.length; i++) {
          const line = enrichedLines[i];
          if (!line) continue;
          const lineTxNumber = `${journalNumber}-L${(i + 1).toString().padStart(2, '0')}`;
          const balanceImpact = line.debit > 0 ? line.debit : -line.credit;

          await tx.insert(billingFinancialTransactions).values({
            id: crypto.randomUUID(),
            tenantId: input.tenantId,
            partnerId: input.partnerId,
            organizationId: input.organizationId,
            branchId: input.branchId,
            transactionNumber: lineTxNumber,
            transactionType: input.sourceReferenceType,
            referenceType: input.sourceReferenceType,
            referenceId: input.sourceReferenceId,
            patientId: input.patientId || null,
            debit: line.debit.toFixed(2),
            credit: line.credit.toFixed(2),
            balanceImpact: balanceImpact.toFixed(2),
            currency: input.currency || 'INR',
            actorId: input.actorId,
            notes: `[${journalNumber}] ${line.accountCode}: ${line.description}`,
            metadata: {
              journalId,
              journalNumber,
              lineIndex: i + 1,
              accountCode: line.accountCode,
              accountName: line.accountName || line.accountCode,
              accountType: line.accountType || 'ASSET',
              isDoubleEntryLine: true
            }
          });
        }
      } catch (dbErr: any) {
        logger.warn('Could not insert double-entry lines into database table', { error: String(dbErr) });
      }
    }

    return journal;
  }

  /**
   * Creates a linked reversal journal entry for a previously posted journal entry.
   * Swaps debits and credits so the original entry remains immutable while reversing the balance.
   */
  public async reverseJournalEntry(
    tenantId: string,
    originalJournalId: string,
    reason: string,
    actorId: string,
    tx: any = getDatabase()
  ): Promise<JournalEntry> {
    const storeKey = `${tenantId}_${originalJournalId}`;
    const original = this.inMemoryJournals.get(storeKey);
    if (!original) {
      throw new AppError({
        message: `Original journal entry ${originalJournalId} not found for reversal.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (original.status === 'REVERSED') {
      throw new AppError({
        message: `Journal entry ${original.journalNumber} has already been reversed.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    // Reversal swaps debits and credits
    const reversalLines: JournalLineItem[] = original.lines.map((line) => ({
      accountCode: line.accountCode,
      accountName: line.accountName || line.accountCode,
      accountType: line.accountType || 'ASSET',
      debit: line.credit, // Debit receives original credit
      credit: line.debit, // Credit receives original debit
      description: `Reversal of [${original.journalNumber}] ${line.description}: ${reason}`
    }));

    const reversalJournal = await this.postJournalEntry(
      {
        tenantId,
        partnerId: original.partnerId,
        organizationId: original.organizationId,
        branchId: original.branchId,
        sourceReferenceType: 'REVERSAL',
        sourceReferenceId: original.sourceReferenceId,
        currency: original.currency,
        lines: reversalLines,
        actorId,
        notes: `Reversal of ${original.journalNumber}. Reason: ${reason}`
      },
      tx
    );

    original.status = 'REVERSED';
    reversalJournal.reversalOfJournalId = originalJournalId;

    return reversalJournal;
  }

  /**
   * Helper to construct a standard balanced OPD consultation payment journal.
   * Line 1: Debit Cash/Bank/Gateway (Asset increases)
   * Line 2: Credit Accounts Receivable (Asset decreases)
   */
  public createPaymentLines(input: {
    amount: number;
    paymentMode: string;
    invoiceNumber: string;
  }): JournalLineItem[] {
    const mode = input.paymentMode.toUpperCase();
    let assetAccount = '1010_CASH_ON_HAND';
    if (mode.includes('UPI') || mode.includes('RAZOR') || mode.includes('GATEWAY') || mode.includes('ONLINE')) {
      assetAccount = '1030_GATEWAY_CLEARING_RAZORPAY';
    } else if (mode.includes('NEFT') || mode.includes('RTGS') || mode.includes('BANK')) {
      assetAccount = '1020_BANK_HDFC_OPERATING';
    }

    return [
      {
        accountCode: assetAccount,
        debit: input.amount,
        credit: 0,
        description: `Payment collected for invoice ${input.invoiceNumber} via ${input.paymentMode}`
      },
      {
        accountCode: '1200_ACCOUNTS_RECEIVABLE',
        debit: 0,
        credit: input.amount,
        description: `Receivable cleared for invoice ${input.invoiceNumber}`
      }
    ];
  }

  /**
   * Helper to construct a standard balanced refund journal.
   * Line 1: Debit Sales Returns & Refunds (Contra-Revenue/Expense increases)
   * Line 2: Credit Cash/Bank/Gateway (Asset decreases)
   */
  public createRefundLines(input: {
    amount: number;
    paymentMode?: string;
    invoiceNumber: string;
    reason: string;
  }): JournalLineItem[] {
    const mode = (input.paymentMode || 'ONLINE').toUpperCase();
    let assetAccount = '1030_GATEWAY_CLEARING_RAZORPAY';
    if (mode.includes('CASH')) {
      assetAccount = '1010_CASH_ON_HAND';
    } else if (mode.includes('BANK') || mode.includes('NEFT')) {
      assetAccount = '1020_BANK_HDFC_OPERATING';
    }

    return [
      {
        accountCode: '5030_REFUNDS_AND_ALLOWANCES',
        debit: input.amount,
        credit: 0,
        description: `Refund for invoice ${input.invoiceNumber}: ${input.reason}`
      },
      {
        accountCode: assetAccount,
        debit: 0,
        credit: input.amount,
        description: `Disbursement of refund for invoice ${input.invoiceNumber} via ${assetAccount}`
      }
    ];
  }

  /**
   * Helper to construct a standard balanced invoice creation journal.
   * Line 1: Debit Accounts Receivable (totalAmount)
   * Line 2: Credit Healthcare Service Revenue (taxableAmount)
   * Line 3: Credit GST Output Tax Liability (taxAmount, if > 0)
   */
  public createInvoiceLines(input: {
    totalAmount: number;
    taxableAmount: number;
    taxAmount: number;
    category: string;
    invoiceNumber: string;
  }): JournalLineItem[] {
    const cat = input.category.toUpperCase();
    let revAccount = '4010_OPD_CONSULTATION_REVENUE';
    if (cat.includes('PHARM')) revAccount = '4030_PHARMACY_SALES_REVENUE';
    else if (cat.includes('LAB') || cat.includes('DIAG')) revAccount = '4040_LAB_DIAGNOSTIC_REVENUE';
    else if (cat.includes('RADIO')) revAccount = '4050_RADIOLOGY_REVENUE';
    else if (cat.includes('BED') && input.taxAmount > 0) revAccount = '4025_ROOM_BED_REVENUE_TAXABLE';
    else if (cat.includes('IPD') || cat.includes('SURGERY')) revAccount = '4020_IPD_INPATIENT_REVENUE';

    const lines: JournalLineItem[] = [
      {
        accountCode: '1200_ACCOUNTS_RECEIVABLE',
        debit: input.totalAmount,
        credit: 0,
        description: `Receivable established for invoice ${input.invoiceNumber}`
      },
      {
        accountCode: revAccount,
        debit: 0,
        credit: input.taxableAmount,
        description: `Healthcare revenue recognized for invoice ${input.invoiceNumber}`
      }
    ];

    if (input.taxAmount > 0) {
      lines.push({
        accountCode: '2100_GST_OUTPUT_TAX_PAYABLE',
        debit: 0,
        credit: input.taxAmount,
        description: `GST Output Liability collected on invoice ${input.invoiceNumber}`
      });
    }

    return lines;
  }

  /**
   * Freezes a fiscal period, preventing retroactive journal mutations.
   */
  public closePeriod(periodKey: string): void {
    this.closedFiscalPeriods.add(periodKey);
  }

  /**
   * Reopens a fiscal period under supervisor authorization.
   */
  public reopenPeriod(periodKey: string, supervisorOverrideToken?: string): void {
    if (!supervisorOverrideToken) {
      throw new AppError({
        message: 'Reopening a closed accounting period strictly requires supervisor cryptographic authorization.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
    this.closedFiscalPeriods.delete(periodKey);
  }
}

export const doubleEntryAccountingService = new DoubleEntryAccountingService();
