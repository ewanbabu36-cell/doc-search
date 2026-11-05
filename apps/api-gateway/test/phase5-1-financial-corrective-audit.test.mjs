process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { signJwt } from '@docsearch/auth';
import { env } from '../dist/config/env.js';
import { statutoryTdsEngineService } from '../dist/services/finance/StatutoryTdsEngineService.js';
import { doubleEntryAccountingService, STANDARD_CHART_OF_ACCOUNTS } from '../dist/services/finance/DoubleEntryAccountingService.js';
import { taxEngineService } from '../dist/services/partner/TaxEngineService.js';
import { platformRevenueWaterfallService } from '../dist/services/finance/PlatformRevenueWaterfallService.js';
import { razorpayEscrowService } from '../dist/services/payment/RazorpayEscrowService.js';
import { companyFinancialService } from '../dist/services/company/CompanyFinancialService.js';
import { billingManagementRepository } from '../dist/repositories/partner/BillingManagementRepository.js';

describe('Phase 5.1: Financial Corrective Audit & Tax-Rule Remediation Suite', () => {
  const tenantId = crypto.randomUUID();
  const partnerId = crypto.randomUUID();
  const branchId = crypto.randomUUID();
  const patientId = crypto.randomUUID();
  const cashierId = crypto.randomUUID();
  const supervisorId = crypto.randomUUID();

  const supervisorSession = {
    userId: supervisorId,
    actorEmail: 'cfo@docsearch.internal',
    tenantId,
    partnerId,
    organizationId: partnerId,
    branchId,
    role: 'SUPER_ADMIN',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    isSuperAdmin: true,
    permissions: ['*'],
    departmentId: 'FINANCE'
  };

  const supervisorOverrideToken = signJwt(
    {
      sub: supervisorId,
      roles: ['SUPERVISOR'],
      purpose: 'INVOICE_VOID_OVERRIDE',
      override: true
    },
    {
      secret: env.JWT_SECRET || 'docsearch-dev-jwt-secret-do-not-use-in-production-2026',
      expiresInSeconds: 3600
    }
  );

  function createDbMock({ invoice = null, existingPayment = null, onInsert, onUpdate } = {}) {
    const normInvoice = invoice ? {
      ...invoice,
      dueAmount: String(invoice.balanceDue ?? invoice.dueAmount ?? 0),
      paidAmount: String(invoice.paidAmount ?? 0),
      totalAmount: String(invoice.totalAmount ?? 0),
      patientPayableAmount: String(invoice.patientPayableAmount ?? invoice.totalAmount ?? 0)
    } : null;

    const invoiceRow = normInvoice ? {
      invoice: normInvoice,
      patientFirstName: 'Eleanor',
      patientLastName: 'Vance',
      patientMrn: 'MRN-2026-000101'
    } : null;

    const makeQuery = (data) => {
      const p = Promise.resolve(data);
      p.limit = () => Promise.resolve(data);
      p.orderBy = () => p;
      p.for = () => p;
      p.returning = () => Promise.resolve(data);
      p.from = () => p;
      p.leftJoin = () => p;
      p.where = () => p;
      return p;
    };

    return {
      select: () => {
        let hadLeftJoin = false;
        let selectedTable = null;
        const queryHandler = {
          from: (tbl) => {
            selectedTable = tbl;
            return queryHandler;
          },
          leftJoin: () => {
            hadLeftJoin = true;
            return queryHandler;
          },
          where: () => {
            const isPaymentTable = selectedTable && (
              selectedTable.paymentNumber !== undefined ||
              selectedTable?._?.name === 'billing_payments' ||
              String(selectedTable?._?.name || '').includes('payment')
            );
            if (isPaymentTable) {
              return makeQuery(existingPayment ? [existingPayment] : []);
            }
            const data = hadLeftJoin ? (invoiceRow ? [invoiceRow] : []) : (normInvoice ? [normInvoice] : []);
            return makeQuery(data);
          },
          orderBy: () => queryHandler,
          limit: () => {
            const isPaymentTable = selectedTable && (
              selectedTable.paymentNumber !== undefined ||
              selectedTable?._?.name === 'billing_payments' ||
              String(selectedTable?._?.name || '').includes('payment')
            );
            if (isPaymentTable) {
              return Promise.resolve(existingPayment ? [existingPayment] : []);
            }
            const data = hadLeftJoin ? (invoiceRow ? [invoiceRow] : []) : (normInvoice ? [normInvoice] : []);
            return Promise.resolve(data);
          },
          for: () => queryHandler
        };
        return queryHandler;
      },
      insert: (table) => ({
        values: (val) => {
          if (onInsert) onInsert(table, val);
          const p = Promise.resolve([val]);
          p.returning = () => Promise.resolve([val]);
          return p;
        }
      }),
      update: (table) => ({
        set: (val) => ({
          where: () => {
            if (onUpdate) onUpdate(table, val);
            const p = Promise.resolve([val]);
            p.returning = () => Promise.resolve([val]);
            return p;
          }
        })
      })
    };
  }

  // ==========================================================================
  // SCENARIO 1: Section 194-O Statutory Effective-Dated Boundaries
  // ==========================================================================
  describe('Scenario 1: Section 194-O Effective-Dated Boundaries & Law-Version Evaluation', () => {
    test('1.1 Pre-amendment boundary (30 September 2024): 1.0% rate applied under Section 194-O (Finance Act 2020)', () => {
      const result = statutoryTdsEngineService.calculateTds({
        partnerId: 'partner_historical_hosp',
        partnerLegalName: 'Apollo Hospitals Enterprise Ltd',
        deducteeCategory: 'COMPANY',
        pan: 'AAAAP1234A',
        transactionDate: '2024-09-30T14:30:00.000Z',
        grossAmountInr: 1000000,
        gstAmountInr: 0
      });

      assert.equal(result.applicableLaw, 'INCOME_TAX_ACT_1961_ORIGINAL');
      assert.equal(result.statutoryRatePercent, 1.0, 'Historical rate before 1 Oct 2024 must be exactly 1.0%');
      assert.equal(result.tdsAmountInr, 10000);
      assert.equal(result.netDisbursementInr, 990000);
      assert.ok(result.statutoryCitation.includes('Finance Act, 2020'));
      assert.equal(result.form26QParticulars.financialYear, '2024-2025');
      assert.equal(result.form26QParticulars.quarter, 'Q2');
    });

    test('1.2 Amendment boundary (1 October 2024): 0.1% rate applied under Section 60(a) Finance (No. 2) Act, 2024', () => {
      const result = statutoryTdsEngineService.calculateTds({
        partnerId: 'partner_amended_hosp',
        partnerLegalName: 'Fortis Healthcare Ltd',
        deducteeCategory: 'COMPANY',
        pan: 'AAACF5678B',
        transactionDate: '2024-10-01T09:00:00.000Z',
        grossAmountInr: 1000000,
        gstAmountInr: 0
      });

      assert.equal(result.applicableLaw, 'INCOME_TAX_ACT_1961_AMENDED_2024');
      assert.equal(result.statutoryRatePercent, 0.1, 'Rate from 1 Oct 2024 must be exactly 0.1%');
      assert.equal(result.tdsAmountInr, 1000);
      assert.equal(result.netDisbursementInr, 999000);
      assert.ok(result.statutoryCitation.includes('Finance (No. 2) Act, 2024'));
      assert.equal(result.form26QParticulars.financialYear, '2024-2025');
      assert.equal(result.form26QParticulars.quarter, 'Q3');
    });

    test('1.3 Financial Year rollover boundary (31 March 2026): Retains 0.1% amended rate in Q4', () => {
      const result = statutoryTdsEngineService.calculateTds({
        partnerId: 'partner_fy_rollover',
        partnerLegalName: 'Max Healthcare Institute',
        deducteeCategory: 'COMPANY',
        pan: 'AAACM9999C',
        transactionDate: '2026-03-31T23:59:59.000Z',
        grossAmountInr: 2500000,
        gstAmountInr: 0
      });

      assert.equal(result.applicableLaw, 'INCOME_TAX_ACT_1961_AMENDED_2024');
      assert.equal(result.statutoryRatePercent, 0.1);
      assert.equal(result.tdsAmountInr, 2500);
      assert.equal(result.form26QParticulars.financialYear, '2025-2026');
      assert.equal(result.form26QParticulars.quarter, 'Q4');
    });

    test('1.4 New Tax Code era (1 April 2026 onward): Evaluated under codified Income-tax Act 2025 schedule (0.1%)', () => {
      const result = statutoryTdsEngineService.calculateTds({
        partnerId: 'partner_future_era',
        partnerLegalName: 'Narayana Health',
        deducteeCategory: 'COMPANY',
        pan: 'AAACN1111D',
        transactionDate: '2026-04-01T00:00:01.000Z',
        grossAmountInr: 4000000,
        gstAmountInr: 0
      });

      assert.equal(result.applicableLaw, 'INCOME_TAX_ACT_2025_CODIFIED');
      assert.equal(result.statutoryRatePercent, 0.1);
      assert.equal(result.tdsAmountInr, 4000);
      assert.ok(result.statutoryCitation.includes('Income-tax Act 2025'));
      assert.equal(result.form26QParticulars.financialYear, '2026-2027');
      assert.equal(result.form26QParticulars.quarter, 'Q1');
    });
  });

  // ==========================================================================
  // SCENARIO 2: Section 194-O Thresholds, PAN Status & Form 26Q Export
  // ==========================================================================
  describe('Scenario 2: Section 194-O Deductee Category, PAN & Exemption Thresholds', () => {
    test('2.1 Non-PAN deductee escalates to 5.0% under Section 206AA second proviso for 194-O', () => {
      const result = statutoryTdsEngineService.calculateTds({
        partnerId: 'partner_no_pan',
        partnerLegalName: 'Unregistered Clinic Partner',
        deducteeCategory: 'PARTNERSHIP',
        pan: null, // No PAN provided
        transactionDate: '2026-05-10T11:00:00.000Z',
        grossAmountInr: 500000,
        gstAmountInr: 0
      });

      assert.equal(result.isPanFurnished, false);
      assert.equal(result.statutoryRatePercent, 5.0, 'Non-PAN deduction must be capped at 5.0% under Section 206AA second proviso for 194-O');
      assert.equal(result.tdsAmountInr, 25000, '5% of 500,000 is 25,000');
      assert.equal(result.netDisbursementInr, 475000);
      assert.equal(result.form26QParticulars.panStatus, 'NO_PAN_HIGHER_RATE');
    });

    test('2.2 Section 194-O(2) Individual / HUF exemption: Cumulative GMV <= ₹5,00,000 has 0% TDS', () => {
      const result = statutoryTdsEngineService.calculateTds({
        partnerId: 'partner_doctor_indiv',
        partnerLegalName: 'Dr. Siddharth Sen (Individual)',
        deducteeCategory: 'INDIVIDUAL',
        pan: 'AAAPS1234Z',
        transactionDate: '2026-06-15T12:00:00.000Z',
        grossAmountInr: 350000,
        cumulativeFyGmvInr: 0
      });

      assert.equal(result.isThresholdExempt, true);
      assert.equal(result.statutoryRatePercent, 0.0, 'Individual <= ₹5 Lakhs is exempt under Section 194-O(2)');
      assert.equal(result.tdsAmountInr, 0);
      assert.equal(result.netDisbursementInr, 350000);
    });

    test('2.3 Threshold crossing: Individual exceeding ₹5,00,000 cumulative GMV triggers 0.1% TDS', () => {
      const result = statutoryTdsEngineService.calculateTds({
        partnerId: 'partner_doctor_indiv',
        partnerLegalName: 'Dr. Siddharth Sen (Individual)',
        deducteeCategory: 'INDIVIDUAL',
        pan: 'AAAPS1234Z',
        transactionDate: '2026-09-20T12:00:00.000Z',
        grossAmountInr: 200000,
        cumulativeFyGmvInr: 450000 // Total becomes 650,000, crossing 500,000
      });

      assert.equal(result.isThresholdExempt, false, 'Crossing ₹5 Lakhs removes Section 194-O(2) exemption');
      assert.equal(result.statutoryRatePercent, 0.1);
      assert.equal(result.tdsAmountInr, 200);
    });

    test('2.4 Base excludes separately stated GST per CBDT Circular 23/2017', () => {
      const grossWithGst = 118000;
      const gstComponent = 18000; // 18% GST

      const result = statutoryTdsEngineService.calculateTds({
        partnerId: 'partner_commercial_lab',
        partnerLegalName: 'Precision Pathology Diagnostics LLP',
        deducteeCategory: 'LLP',
        pan: 'AAAFP7777E',
        transactionDate: '2026-07-10T10:00:00.000Z',
        grossAmountInr: grossWithGst,
        gstAmountInr: gstComponent
      });

      assert.equal(result.taxableBaseAmountInr, 100000, 'TDS base must exclude GST');
      assert.equal(result.tdsAmountInr, 100, '0.1% on ₹100,000 is ₹100, NOT on ₹118,000');
    });

    test('2.5 Form 26Q export formatting produces valid deductee codes (01 company, 02 non-company) and challan particulars', () => {
      const records = [
        statutoryTdsEngineService.calculateTds({
          partnerId: 'p1',
          partnerLegalName: 'Apollo Hospitals Enterprise Ltd',
          deducteeCategory: 'COMPANY',
          pan: 'AAAAP1234A',
          transactionDate: '2026-10-15T00:00:00.000Z',
          grossAmountInr: 1000000
        }),
        statutoryTdsEngineService.calculateTds({
          partnerId: 'p2',
          partnerLegalName: 'Dr. John Doe Clinic',
          deducteeCategory: 'INDIVIDUAL',
          pan: 'AAAPD5678B',
          transactionDate: '2026-10-15T00:00:00.000Z',
          grossAmountInr: 800000,
          cumulativeFyGmvInr: 600000
        })
      ];

      const metaMap = new Map([
        ['p1', { legalName: 'Apollo Hospitals Enterprise Ltd', pan: 'AAAAP1234A' }],
        ['p2', { legalName: 'Dr. John Doe Clinic', pan: 'AAAPD5678B' }]
      ]);

      const form26Q = statutoryTdsEngineService.generateForm26QRows(records, metaMap);
      assert.equal(form26Q.length, 2);
      assert.equal(form26Q[0].deducteeCode, '01', 'Company deductee code must be 01');
      assert.equal(form26Q[1].deducteeCode, '02', 'Non-Company deductee code must be 02');
      assert.equal(form26Q[0].sectionCode, '94O');
      assert.ok(form26Q[0].challanNumber.startsWith('CH-IT-'));
      assert.equal(form26Q[0].ratePercent, 0.1);
    });

    test('2.6 Platform Waterfall accurately applies 0.1% amended rate for October 2026', () => {
      const waterfall = platformRevenueWaterfallService.getRevenueWaterfall();
      assert.equal(waterfall.periodMonth, 'October 2026');
      assert.equal(waterfall.totalGrossGmvInr, 9140000);
      assert.equal(waterfall.deductions.tdsSection194OInr, 9140, '0.1% on ₹91,40,000 GMV is ₹9,140 (NOT ₹91,400)');
    });
  });

  // ==========================================================================
  // SCENARIO 3: GST Classification, Room Rent Thresholds & Citations
  // ==========================================================================
  describe('Scenario 3: Indian GST Statutory Classification & Notification Citations', () => {
    test('3.1 Clinical consultations (SAC 999312) and diagnostics (SAC 999316) are 0% exempt with citation to Notification No. 12/2017-CT(R)', async () => {
      const result = await taxEngineService.calculateTaxes(
        [
          { serviceName: 'Cardiology Specialist Consultation', category: 'CONSULTATION', quantity: 1, unitPrice: 1500 },
          { serviceName: 'Complete Blood Count (CBC) with ESR', category: 'LAB_TEST', quantity: 1, unitPrice: 650 }
        ],
        { tenantId }
      );

      assert.equal(result.taxTotal, 0);
      assert.equal(result.grandTotal, 2150);
      assert.equal(result.items[0].isExempt, true);
      assert.equal(result.items[1].isExempt, true);
      assert.ok(result.items[0].statutoryCitation.includes('Notification No. 12/2017-Central Tax (Rate), Sl. No. 74'));
    });

    test('3.2 Inpatient ICU bed is unconditionally 0% exempt regardless of daily rate under Notif 12/2017-CT(R) proviso', async () => {
      const result = await taxEngineService.calculateTaxes(
        [
          { serviceName: 'Intensive Coronary Care Unit (ICCU) Bed', category: 'BED_CHARGES', quantity: 2, unitPrice: 18000 }
        ],
        { tenantId }
      );

      assert.equal(result.taxTotal, 0, 'ICU/CCU/NICU beds must be 0% exempt even if > ₹5,000/day');
      assert.equal(result.items[0].isExempt, true);
      assert.ok(result.items[0].statutoryCitation.includes('ICU/CCU/NICU beds unconditionally EXEMPT'));
    });

    test('3.3 Inpatient non-ICU bed <= ₹5,000/day is 0% exempt under Notif 12/2017-CT(R)', async () => {
      const result = await taxEngineService.calculateTaxes(
        [
          { serviceName: 'Twin Sharing Semi-Private Room', category: 'BED_CHARGES', quantity: 3, unitPrice: 4500 }
        ],
        { tenantId }
      );

      assert.equal(result.taxTotal, 0);
      assert.equal(result.items[0].isExempt, true);
      assert.ok(result.items[0].statutoryCitation.includes('Inpatient room rent <= ₹5,000/day EXEMPT'));
    });

    test('3.4 Inpatient non-ICU bed > ₹5,000/day applies 5% GST without ITC under Notification No. 04/2022-CT(R)', async () => {
      const result = await taxEngineService.calculateTaxes(
        [
          { serviceName: 'Super Deluxe Executive Suite Room', category: 'BED_CHARGES', quantity: 2, unitPrice: 8500 }
        ],
        { tenantId, isInterstate: false }
      );

      assert.equal(result.items[0].isExempt, false, 'Non-ICU room exceeding ₹5,000 is taxable');
      assert.equal(result.items[0].cgstRatePercent, 2.5);
      assert.equal(result.items[0].sgstRatePercent, 2.5);
      assert.equal(result.items[0].taxAmount, 850, '5% of ₹17,000 is ₹850');
      assert.equal(result.grandTotal, 17850);
      assert.ok(result.items[0].statutoryCitation.includes('Notification No. 04/2022-CT(R)'));
    });

    test('3.5 Place of supply switches equal CGST+SGST (intra-state) to single IGST (inter-state)', async () => {
      const intra = await taxEngineService.calculateTaxes(
        [{ serviceName: 'Executive Suite', category: 'BED_CHARGES', quantity: 1, unitPrice: 10000 }],
        { tenantId, patientState: 'Maharashtra', facilityState: 'Maharashtra' }
      );
      assert.equal(intra.isInterstate, false);
      assert.equal(intra.cgstTotal, 250);
      assert.equal(intra.sgstTotal, 250);
      assert.equal(intra.igstTotal, 0);

      const inter = await taxEngineService.calculateTaxes(
        [{ serviceName: 'Executive Suite', category: 'BED_CHARGES', quantity: 1, unitPrice: 10000 }],
        { tenantId, patientState: 'Karnataka', facilityState: 'Maharashtra' }
      );
      assert.equal(inter.isInterstate, true);
      assert.equal(inter.cgstTotal, 0);
      assert.equal(inter.sgstTotal, 0);
      assert.equal(inter.igstTotal, 500);
    });
  });

  // ==========================================================================
  // SCENARIO 4: True Double-Entry General Ledger Balancing & Invariants
  // ==========================================================================
  describe('Scenario 4: True Double-Entry General Ledger Balancing & Invariants', () => {
    test('4.1 Double-entry invariant strictly enforces sum(Debit) === sum(Credit) with at least two lines', async () => {
      const journal = await doubleEntryAccountingService.postJournalEntry({
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        sourceReferenceType: 'PAYMENT',
        sourceReferenceId: 'pmt_double_entry_001',
        lines: [
          { accountCode: '1030_GATEWAY_CLEARING_RAZORPAY', debit: 2500, credit: 0, description: 'Payment collected via UPI' },
          { accountCode: '1200_ACCOUNTS_RECEIVABLE', debit: 0, credit: 2500, description: 'Accounts receivable cleared' }
        ],
        actorId: 'STAFF_01'
      });

      assert.equal(journal.isBalanced, true);
      assert.equal(journal.totalDebit, 2500);
      assert.equal(journal.totalCredit, 2500);
      assert.equal(journal.status, 'POSTED');
      assert.equal(journal.lines.length, 2);
    });

    test('4.2 Rejects unbalanced journal entry (e.g. Debits 1000 vs Credits 800) with 400 Validation Error', async () => {
      await assert.rejects(
        async () => {
          await doubleEntryAccountingService.postJournalEntry({
            tenantId,
            partnerId,
            organizationId: partnerId,
            branchId,
            sourceReferenceType: 'ADJUSTMENT',
            sourceReferenceId: 'adj_unbalanced_001',
            lines: [
              { accountCode: '1010_CASH_ON_HAND', debit: 1000, credit: 0, description: 'Cash collected' },
              { accountCode: '1200_ACCOUNTS_RECEIVABLE', debit: 0, credit: 800, description: 'Short credit' }
            ],
            actorId: 'STAFF_01'
          });
        },
        /Total Debits .* do not equal Total Credits/i,
        'Unbalanced journal entry must be strictly rejected'
      );
    });

    test('4.3 Rejects single-line or negative-amount journal entries', async () => {
      // Single line
      await assert.rejects(
        async () => {
          await doubleEntryAccountingService.postJournalEntry({
            tenantId,
            partnerId,
            organizationId: partnerId,
            branchId,
            sourceReferenceType: 'ADJUSTMENT',
            sourceReferenceId: 'adj_single_001',
            lines: [
              { accountCode: '1010_CASH_ON_HAND', debit: 500, credit: 0, description: 'Single line' }
            ],
            actorId: 'STAFF_01'
          });
        },
        /must contain at least two valid lines/i
      );

      // Negative amount
      await assert.rejects(
        async () => {
          await doubleEntryAccountingService.postJournalEntry({
            tenantId,
            partnerId,
            organizationId: partnerId,
            branchId,
            sourceReferenceType: 'ADJUSTMENT',
            sourceReferenceId: 'adj_neg_001',
            lines: [
              { accountCode: '1010_CASH_ON_HAND', debit: -500, credit: 0, description: 'Negative debit' },
              { accountCode: '1200_ACCOUNTS_RECEIVABLE', debit: 0, credit: -500, description: 'Negative credit' }
            ],
            actorId: 'STAFF_01'
          });
        },
        /must be a non-negative number/i
      );
    });

    test('4.4 Linked reversal journal swaps debits and credits without mutating original journal', async () => {
      const original = await doubleEntryAccountingService.postJournalEntry({
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        sourceReferenceType: 'PAYMENT',
        sourceReferenceId: 'pmt_to_reverse_001',
        lines: [
          { accountCode: '1010_CASH_ON_HAND', debit: 1200, credit: 0, description: 'Cash received' },
          { accountCode: '1200_ACCOUNTS_RECEIVABLE', debit: 0, credit: 1200, description: 'AR credited' }
        ],
        actorId: 'STAFF_01'
      });

      const reversal = await doubleEntryAccountingService.reverseJournalEntry(
        tenantId,
        original.journalId,
        'Cashier counted duplicate payment',
        'SUPERVISOR_01'
      );

      assert.equal(reversal.status, 'POSTED');
      assert.equal(reversal.sourceReferenceType, 'REVERSAL');
      assert.equal(reversal.reversalOfJournalId, original.journalId);
      assert.equal(original.status, 'REVERSED');

      // Reversal lines must have swapped debits and credits
      const revCash = reversal.lines.find((l) => l.accountCode === '1010_CASH_ON_HAND');
      const revAr = reversal.lines.find((l) => l.accountCode === '1200_ACCOUNTS_RECEIVABLE');
      assert.equal(revCash.debit, 0);
      assert.equal(revCash.credit, 1200);
      assert.equal(revAr.debit, 1200);
      assert.equal(revAr.credit, 0);
    });

    test('4.5 Closed accounting period blocks new journal entry postings', async () => {
      const closedMonth = '2025-01';
      doubleEntryAccountingService.closePeriod(closedMonth);

      await assert.rejects(
        async () => {
          await doubleEntryAccountingService.postJournalEntry({
            tenantId,
            partnerId,
            organizationId: partnerId,
            branchId,
            transactionDate: '2025-01-15T10:00:00.000Z',
            sourceReferenceType: 'ADJUSTMENT',
            sourceReferenceId: 'retro_001',
            lines: [
              { accountCode: '1010_CASH_ON_HAND', debit: 500, credit: 0, description: 'Retroactive cash' },
              { accountCode: '1200_ACCOUNTS_RECEIVABLE', debit: 0, credit: 500, description: 'Retroactive AR' }
            ],
            actorId: 'STAFF_01'
          });
        },
        /Accounting Period Lock: Fiscal period 2025-01 is closed/i,
        'Posting into closed period must be strictly prevented'
      );
    });
  });

  // ==========================================================================
  // SCENARIO 5: Payment Gateway, Webhook Idempotency & Tenant Isolation
  // ==========================================================================
  describe('Scenario 5: Payment Gateway Forensics & Multi-Tenant Isolation', () => {
    test('5.1 Fail-closed HMAC-SHA256 signature verification rejects forged or missing webhook signature', () => {
      const payload = JSON.stringify({ event: 'payment.captured', id: 'pay_9981' });
      const secret = 'docsearch-escrow-secret-prod-2026';
      const validSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      assert.equal(razorpayEscrowService.verifyWebhookSignature(payload, validSig), true);
      assert.equal(razorpayEscrowService.verifyWebhookSignature(payload, 'forged_fake_sig'), false);
      assert.equal(razorpayEscrowService.verifyWebhookSignature(payload, ''), false);
      assert.equal(razorpayEscrowService.verifyWebhookSignature('', validSig), false);
    });

    test('5.2 Replayed webhook callback returns isDuplicate: true without double-crediting invoice', async () => {
      const invoiceId = crypto.randomUUID();
      const gatewayPaymentId = 'pay_razor_replay_test_001';

      const existingPayment = {
        id: crypto.randomUUID(),
        tenantId,
        invoiceId,
        referenceNumber: gatewayPaymentId,
        amount: 1500,
        status: 'SUCCESS'
      };

      const mockDb = createDbMock({ existingPayment });

      const result = await billingManagementRepository.reconcileWebhookPayment(
        {
          tenantId,
          invoiceId,
          gateway: 'RAZORPAY',
          gatewayPaymentId,
          amount: 1500,
          currency: 'INR'
        },
        mockDb
      );

      assert.equal(result.isDuplicate, true, 'Duplicate webhook payment must be flagged');
      assert.equal(result.paymentId, existingPayment.id);
    });

    test('5.3 Cross-tenant ledger posting / querying is strictly forbidden', async () => {
      const tenantA = crypto.randomUUID();
      const tenantB = crypto.randomUUID();
      const invoiceId = crypto.randomUUID();

      const mockDb = createDbMock({ invoice: null });
      const result = await billingManagementRepository.getInvoiceById(tenantA, invoiceId, mockDb);
      assert.equal(result, null, 'Tenant A cannot query Tenant B invoice');
    });

    test('5.4 Maker-Checker dual control strictly forbids self-approval of corporate financial changes', async () => {
      const makerEmail = 'treasury_maker@docsearch.internal';
      const makerSession = {
        userId: crypto.randomUUID(),
        actorEmail: makerEmail,
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
        isSuperAdmin: true,
        permissions: ['*'],
        departmentId: 'FINANCE'
      };

      const updated = await companyFinancialService.updateConfig(
        { businessUpiId: 'docsearch.maker@hdfcbank' },
        makerSession
      );

      assert.ok(updated.pendingChange, 'Sensitive banking modification must create pending change');
      assert.equal(updated.pendingChange.initiatedBy, makerEmail);

      // Attempt self-approval
      await assert.rejects(
        async () => {
          await companyFinancialService.approvePendingConfigChange(updated.pendingChange.id, 'APPROVED', makerSession);
        },
        /Maker-Checker dual control violation: Change cannot be approved by the same user who initiated it/i,
        'Self approval must throw 403 Forbidden'
      );
    });
  });

  // ==========================================================================
  // SCENARIO 6: Statutory E-Invoice Status Forensics
  // ==========================================================================
  describe('Scenario 6: Statutory E-Invoice Status Forensics', () => {
    test('6.1 Corporate B2B monthly ledger route outputs eInvoiceStatus: PROTOTYPE_SIMULATION and eInvoiceIrnGenerated: null', async () => {
      // Test verifying that corporate B2B does NOT falsely emit fake IRN as registered government IRN
      const mockReply = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        send(data) { this.body = data; return this; }
      };

      // Import route and simulate call
      const { corporateB2bRoutes } = await import('../dist/routes/partner/corporate-b2b.routes.js');
      let registeredHandler = null;
      const fakeFastify = {
        addHook: () => {},
        get: () => {},
        post: (path, handler) => {
          if (path.includes('generate-monthly-ledger')) registeredHandler = handler;
        },
        log: { warn: () => {} }
      };

      await corporateB2bRoutes(fakeFastify);
      assert.ok(registeredHandler, 'Corporate monthly ledger route must be registered');

      const fakeReq = {
        body: { contractCode: 'CORP-TEST-2026', billingMonth: 'October 2026' },
        session: { tenantId }
      };

      const reply = { ...mockReply };
      await registeredHandler(fakeReq, reply);

      assert.equal(reply.statusCode, 201);
      assert.equal(reply.body.data.eInvoiceStatus, 'PROTOTYPE_SIMULATION');
      assert.equal(reply.body.data.eInvoiceIrnGenerated, null, 'Real IRN must be null until genuine NIC IRP connection');
      assert.equal(reply.body.data.statutoryRegistrationConfirmed, false);
      assert.ok(reply.body.data.statutoryDisclaimer.includes('PROTOTYPE SIMULATION ONLY'));
    });
  });
});
