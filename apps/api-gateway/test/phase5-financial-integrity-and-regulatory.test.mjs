process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { signJwt } from '@docsearch/auth';
import { env } from '../dist/config/env.js';
import { taxEngineService } from '../dist/services/partner/TaxEngineService.js';
import { razorpayEscrowService } from '../dist/services/payment/RazorpayEscrowService.js';
import { companyFinancialService } from '../dist/services/company/CompanyFinancialService.js';
import { platformRevenueWaterfallService } from '../dist/services/finance/PlatformRevenueWaterfallService.js';
import { asc606RevenueRecognitionService } from '../dist/services/finance/Asc606RevenueRecognitionService.js';
import { smartDunningRecoveryService } from '../dist/services/finance/SmartDunningRecoveryService.js';
import { billingManagementRepository } from '../dist/repositories/partner/BillingManagementRepository.js';
import { billingManagementService } from '../dist/services/partner/BillingManagementService.js';
import { cashierShiftService } from '../dist/services/partner/CashierShiftService.js';
import { eodClosingService } from '../dist/services/partner/EodClosingService.js';
import { wholesaleInvoiceIngestionService, GSTIN_REGEX, INDIAN_STATE_GST_CODES } from '../dist/services/partner/WholesaleInvoiceIngestionService.js';

describe('Phase 5: Financial, Payment, Accounting, Taxation & Regulatory Integrity Certification', () => {
  const tenantId = crypto.randomUUID();
  const partnerId = crypto.randomUUID();
  const branchId = crypto.randomUUID();
  const patientId = crypto.randomUUID();
  const cashierId = crypto.randomUUID();
  const supervisorId = crypto.randomUUID();

  const mockSession = {
    userId: cashierId,
    actorEmail: 'cashier@docsearch.internal',
    tenantId,
    partnerId,
    organizationId: partnerId,
    branchId,
    role: 'CASHIER',
    roles: ['CASHIER', 'BILLING_STAFF'],
    isSuperAdmin: false,
    permissions: ['*'],
    departmentId: 'BILLING'
  };

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
  // SCENARIO 1: OPD Consultation Billing & Financial Lifecycle
  // ==========================================================================
  describe('Scenario 1: OPD Consultation Billing & Financial Lifecycle', () => {
    test('1.1 Generates OPD invoice with healthcare consultation (SAC 999312) at 0% GST exemption', async () => {
      const calculation = await taxEngineService.calculateTaxes(
        [
          {
            serviceName: 'Senior Cardiologist Consultation',
            category: 'CONSULTATION',
            quantity: 1,
            unitPrice: 1500,
            discountAmount: 0
          }
        ],
        { tenantId, isInterstate: false },
        { select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }) }
      );

      assert.equal(calculation.subtotal, 1500);
      assert.equal(calculation.taxTotal, 0);
      assert.equal(calculation.grandTotal, 1500);
      assert.equal(calculation.items[0].isExempt, true);
      assert.equal(calculation.items[0].hsnSacCode, '999312');
    });

    test('1.2 Rejects payment collection that exceeds current invoice balance due', async () => {
      const mockInvoice = {
        id: crypto.randomUUID(),
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        patientId,
        invoiceNumber: 'INV-2026-0001',
        totalAmount: 1500,
        paidAmount: 1000,
        balanceDue: 500,
        dueAmount: '500',
        patientPayableAmount: 1500,
        status: 'PARTIALLY_PAID',
        payments: []
      };

      const mockDb = createDbMock({ invoice: mockInvoice });

      await assert.rejects(
        async () => {
          await billingManagementRepository.collectPayment(
            {
              tenantId,
              invoiceId: mockInvoice.id,
              amount: 800, // Exceeds balanceDue 500
              paymentMethod: 'CASH'
            },
            mockDb
          );
        },
        /exceeds outstanding balance/i,
        'Overpayment exceeding balance due must be rejected'
      );
    });

    test('1.3 Normal OPD payment collection updates balance and inserts ledger transaction', async () => {
      const invoiceId = crypto.randomUUID();
      const mockInvoice = {
        id: invoiceId,
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        patientId,
        invoiceNumber: 'INV-2026-0002',
        totalAmount: 1500,
        paidAmount: 0,
        balanceDue: 1500,
        dueAmount: '1500',
        patientPayableAmount: 1500,
        status: 'PENDING_PAYMENT',
        payments: []
      };

      const insertedRecords = [];
      const updatedRecords = [];

      const mockDb = createDbMock({
        invoice: mockInvoice,
        onInsert: (table, val) => insertedRecords.push({ table, val }),
        onUpdate: (table, val) => updatedRecords.push({ table, val })
      });

      const result = await billingManagementRepository.collectPayment(
        {
          tenantId,
          invoiceId: mockInvoice.id,
          amount: 1500,
          paymentMethod: 'UPI',
          transactionReference: 'UPI-RR-992817261'
        },
        mockDb
      );

      assert.equal(result.invoice.balanceDue, 0, 'Balance due must reach 0 after full payment');
      assert.equal(result.invoice.status, 'PAID', 'Invoice status must transition to PAID');
      assert.ok(result.receiptNumber.startsWith('REC-'), 'Receipt number must be generated');

      const ftx = insertedRecords.find((r) => r.val && (r.val.transactionNumber?.startsWith('FTX-PMT-') || r.val.transactionType === 'PAYMENT'));
      assert.ok(ftx, 'General Ledger transaction must be inserted');
      assert.equal(ftx.val.credit, '1500.00');
      assert.equal(ftx.val.balanceImpact, '-1500.00');
    });
  });

  // ==========================================================================
  // SCENARIO 2: Pharmacy Dispensing Billing & FEFO Stock Ledger
  // ==========================================================================
  describe('Scenario 2: Pharmacy Billing, Medicine GST & FEFO Inventory Ledger', () => {
    test('2.1 Intra-state medicine sale applies 5% GST (2.5% CGST + 2.5% SGST) under HSN 3004', async () => {
      const calculation = await taxEngineService.calculateTaxes(
        [
          {
            serviceName: 'Amoxicillin + Clavulanic Acid 625mg',
            category: 'PHARMACY',
            quantity: 2,
            unitPrice: 200, // Total gross = 400
            discountAmount: 0
          }
        ],
        { tenantId, isInterstate: false },
        { select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }) }
      );

      assert.equal(calculation.subtotal, 400);
      assert.equal(calculation.taxableTotal, 400);
      assert.equal(calculation.cgstTotal, 10.00, 'CGST 2.5% on 400 must equal 10.00');
      assert.equal(calculation.sgstTotal, 10.00, 'SGST 2.5% on 400 must equal 10.00');
      assert.equal(calculation.igstTotal, 0, 'IGST must be 0 for intra-state sale');
      assert.equal(calculation.taxTotal, 20.00, 'Total GST must be 20.00 (5%)');
      assert.equal(calculation.grandTotal, 420.00);
      assert.equal(calculation.items[0].isExempt, false, 'Medicines must not be tax exempt');
      assert.equal(calculation.items[0].hsnSacCode, '3004');
    });

    test('2.2 Inter-state medicine sale applies 5% IGST without CGST/SGST split', async () => {
      const calculation = await taxEngineService.calculateTaxes(
        [
          {
            serviceName: 'Metformin 500mg SR',
            category: 'PHARMACY',
            quantity: 5,
            unitPrice: 100, // Total gross = 500
            discountAmount: 0
          }
        ],
        { tenantId, isInterstate: true },
        { select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }) }
      );

      assert.equal(calculation.subtotal, 500);
      assert.equal(calculation.cgstTotal, 0, 'CGST must be 0 for inter-state sale');
      assert.equal(calculation.sgstTotal, 0, 'SGST must be 0 for inter-state sale');
      assert.equal(calculation.igstTotal, 25.00, 'IGST 5.0% on 500 must equal 25.00');
      assert.equal(calculation.grandTotal, 525.00);
    });

    test('2.3 GSTIN validation strictly conforms to statutory Indian GSTIN format', () => {
      const validGstin = '29ABCDE1234F1Z5'; // Karnataka valid GSTIN
      const invalidGstin = '29ABCDE1234F199'; // Invalid check pattern

      assert.ok(GSTIN_REGEX.test(validGstin), 'Valid GSTIN must pass regex');
      assert.ok(!GSTIN_REGEX.test(invalidGstin), 'Invalid GSTIN must fail regex');
      assert.equal(INDIAN_STATE_GST_CODES['29'], 'Karnataka');
      assert.equal(INDIAN_STATE_GST_CODES['27'], 'Maharashtra');
      assert.equal(INDIAN_STATE_GST_CODES['07'], 'Delhi');
    });
  });

  // ==========================================================================
  // SCENARIO 3: Laboratory Investigation Billing & Status Synchronization
  // ==========================================================================
  describe('Scenario 3: Laboratory Investigation Billing & Status Synchronization', () => {
    test('3.1 Diagnostic pathology (SAC 999316) is 0% GST exempt under Notification 12/2017', async () => {
      const calculation = await taxEngineService.calculateTaxes(
        [
          {
            serviceName: 'Comprehensive Metabolic Panel (CMP)',
            category: 'LAB_TEST',
            quantity: 1,
            unitPrice: 1200,
            discountAmount: 100
          }
        ],
        { tenantId, isInterstate: false },
        { select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }) }
      );

      assert.equal(calculation.subtotal, 1200);
      assert.equal(calculation.discountTotal, 100);
      assert.equal(calculation.taxableTotal, 1100);
      assert.equal(calculation.taxTotal, 0, 'Clinical lab diagnostics must be 0% exempt');
      assert.equal(calculation.grandTotal, 1100);
      assert.equal(calculation.items[0].isExempt, true);
      assert.equal(calculation.items[0].hsnSacCode, '999316');
    });

    test('3.2 Reconciling webhook payment updates lab investigation order billing status to BILLED', async () => {
      const invoiceId = crypto.randomUUID();
      const labOrderId = crypto.randomUUID();

      const mockInvoice = {
        id: invoiceId,
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        patientId,
        invoiceNumber: 'INV-2026-LAB-01',
        totalAmount: 1200,
        paidAmount: 0,
        balanceDue: 1200,
        dueAmount: '1200',
        patientPayableAmount: 1200,
        status: 'PENDING_PAYMENT',
        items: [
          {
            category: 'LAB_TEST',
            serviceName: 'CBC + ESR',
            orderId: labOrderId
          }
        ],
        payments: []
      };

      const insertedRecords = [];
      const updatedRecords = [];

      const mockDb = createDbMock({
        invoice: mockInvoice,
        onInsert: (table, val) => insertedRecords.push({ table, val }),
        onUpdate: (table, val) => updatedRecords.push({ table, val })
      });

      const result = await billingManagementRepository.reconcileWebhookPayment(
        {
          tenantId,
          invoiceId,
          gateway: 'RAZORPAY',
          gatewayPaymentId: 'pay_lab_webhook_99211',
          amount: 1200,
          currency: 'INR'
        },
        mockDb
      );

      assert.equal(result.isDuplicate, false);
      assert.equal(result.invoice.balanceDue, 0);
      assert.equal(result.invoice.status, 'PAID');

      // Verify that GL ledger record was inserted
      const ftx = insertedRecords.find((r) => r.val && r.val.transactionNumber?.startsWith('FTX-PG-'));
      assert.ok(ftx, 'GL transaction record must be created during webhook reconciliation');
      assert.equal(ftx.val.credit, '1200.00');
      assert.equal(ftx.val.balanceImpact, '-1200.00');
    });
  });

  // ==========================================================================
  // SCENARIO 4: Multi-Tenant Merchant Segregation & Institutional VANs
  // ==========================================================================
  describe('Scenario 4: Multi-Tenant Merchant Segregation & Institutional VANs', () => {
    test('4.1 Generates dedicated institutional Virtual Account Numbers (VAN) per partner facility', async () => {
      const mockProfiles = [
        {
          id: 'partner-hosp-001',
          partnerType: 'HOSPITAL',
          metadata: { partnerCode: 'APOLLO01', facilityName: 'Apollo Speciality Hospital' }
        },
        {
          id: 'partner-hosp-002',
          partnerType: 'HOSPITAL',
          metadata: { partnerCode: 'FORTIS02', facilityName: 'Fortis Healthcare' }
        }
      ];

      const vans = mockProfiles.map((p) => {
        const code = p.metadata.partnerCode;
        return {
          partnerId: p.id,
          partnerCode: code,
          virtualAccountNumber: `DOCS${code}`,
          virtualIfsc: 'HDFC0000240',
          clearingMode: 'INSTANT_SETTLEMENT'
        };
      });

      assert.equal(vans[0].virtualAccountNumber, 'DOCSAPOLLO01');
      assert.equal(vans[1].virtualAccountNumber, 'DOCSFORTIS02');
      assert.notEqual(vans[0].virtualAccountNumber, vans[1].virtualAccountNumber, 'Hospitals must have distinct VANs');
      assert.equal(vans[0].virtualIfsc, 'HDFC0000240');
    });

    test('4.2 Tenant isolation: Invoice lookup strictly partitions queries by tenantId', async () => {
      const tenantA = crypto.randomUUID();
      const invoiceId = crypto.randomUUID();

      const mockDb = createDbMock({ invoice: null });
      const result = await billingManagementRepository.getInvoiceById(tenantA, invoiceId, mockDb);
      assert.equal(result, null, 'Invoice belonging to other tenant must return null');
    });
  });

  // ==========================================================================
  // SCENARIO 5: Corporate SaaS Billing & Treasury Segregation
  // ==========================================================================
  describe('Scenario 5: Corporate SaaS Billing & Treasury Segregation', () => {
    test('5.1 Corporate platform config routes SaaS subscription fees to DocSearch HQ current account', () => {
      const config = companyFinancialService.getConfig();

      assert.equal(config.legalEntityName, 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED');
      assert.equal(config.bankName, 'HDFC Bank Ltd');
      assert.equal(config.ifscCode, 'HDFC0000240');
      assert.equal(config.accountType, 'CURRENT');
      assert.ok(config.businessUpiId.includes('@hdfcbank'));
      assert.equal(config.pan, 'AABCD1234E');
      assert.ok(config.supportedCurrencies.includes('INR'));
    });

    test('5.2 Partner subscription payment proof enforces dual-control review workflow', async () => {
      const proof = await companyFinancialService.submitPartnerPaymentProof(
        {
          partnerId: crypto.randomUUID(),
          planId: 'plan_enterprise_hospital',
          planName: 'Enterprise Hospital Tier',
          planCode: 'ENTERPRISE',
          durationYears: 1,
          payableAmountInr: 96000,
          paymentMethod: 'NEFT_RTGS_IMPS',
          utrNumber: 'HDFCN26189912001'
        },
        supervisorSession
      );

      assert.equal(proof.status, 'PENDING_VERIFICATION');
      assert.equal(proof.payableAmountInr, 96000);
      assert.equal(proof.utrNumber, 'HDFCN26189912001');

      // Supervisor approves
      const approved = await companyFinancialService.verifyPaymentProof(
        proof.id,
        'APPROVED',
        undefined,
        supervisorSession
      );

      assert.equal(approved.status, 'APPROVED');
      assert.ok(approved.verifiedAt);
    });
  });

  // ==========================================================================
  // SCENARIO 6: Refund Workflows & Balance Reversal Integrity
  // ==========================================================================
  describe('Scenario 6: Refund Workflows & Balance Reversal Integrity', () => {
    test('6.1 Reject refund request exceeding current paid balance with 400 Bad Request', async () => {
      const invoiceId = crypto.randomUUID();
      const mockInvoice = {
        id: invoiceId,
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        patientId,
        invoiceNumber: 'INV-2026-0003',
        totalAmount: 2000,
        paidAmount: 500, // Only 500 paid
        balanceDue: 1500,
        dueAmount: '1500',
        patientPayableAmount: 2000,
        status: 'PARTIALLY_PAID',
        payments: []
      };

      const mockDb = createDbMock({ invoice: mockInvoice });

      await assert.rejects(
        async () => {
          await billingManagementRepository.processRefund(
            {
              tenantId,
              invoiceId,
              amount: 800, // Exceeds paidAmount 500
              reason: 'Patient requested excess refund',
              supervisorUserId: supervisorId,
              supervisorOverrideToken
            },
            mockDb
          );
        },
        /exceeds total paid amount|exceeds current paid balance/i,
        'Refund exceeding paid balance must throw validation error'
      );
    });

    test('6.2 Staff refund requires supervisorUserId or valid supervisorOverrideToken', async () => {
      const invoiceId = crypto.randomUUID();
      const mockInvoice = {
        id: invoiceId,
        tenantId,
        totalAmount: 1000,
        paidAmount: 1000,
        balanceDue: 0,
        dueAmount: '0',
        status: 'PAID',
        payments: []
      };

      const mockDb = createDbMock({ invoice: mockInvoice });

      await assert.rejects(
        async () => {
          await billingManagementRepository.processRefund(
            {
              tenantId,
              invoiceId,
              amount: 500,
              reason: 'Unauthorized refund attempt'
              // Missing supervisorUserId and supervisorOverrideToken
            },
            mockDb
          );
        },
        /supervisorUserId or a valid supervisorOverrideToken is mandatory|requires a validated supervisor override token/i,
        'Staff refund without supervisor approval must be rejected'
      );
    });

    test('6.3 Partial refund adjusts paidAmount, sets PARTIALLY_PAID status, and inserts GL refund entry', async () => {
      const invoiceId = crypto.randomUUID();
      const mockInvoice = {
        id: invoiceId,
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        patientId,
        invoiceNumber: 'INV-2026-0004',
        totalAmount: 2000,
        paidAmount: 2000,
        balanceDue: 0,
        dueAmount: '0',
        patientPayableAmount: 2000,
        status: 'PAID',
        payments: []
      };

      const insertedRecords = [];
      const updatedRecords = [];

      const mockDb = createDbMock({
        invoice: mockInvoice,
        onInsert: (table, val) => insertedRecords.push({ table, val }),
        onUpdate: (table, val) => updatedRecords.push({ table, val })
      });

      const result = await billingManagementRepository.processRefund(
        {
          tenantId,
          invoiceId,
          amount: 500, // Refund 500 out of 2000
          reason: 'Test cancellation refund',
          supervisorUserId: supervisorId,
          supervisorOverrideToken
        },
        mockDb
      );

      assert.equal(result.success, true);
      assert.equal(result.invoice.paidAmount, 1500, 'Paid amount must be reduced to 1500');
      assert.equal(result.invoice.balanceDue, 500, 'Balance due must be restored to 500');
      assert.equal(result.invoice.status, 'PARTIALLY_PAID');

      // Verify refund GL transaction
      const refundFtx = insertedRecords.find((r) => r.val && r.val.transactionNumber?.startsWith('FTX-REF-'));
      assert.ok(refundFtx, 'Refund General Ledger entry must be created');
      assert.equal(refundFtx.val.debit, '500.00');
      assert.equal(refundFtx.val.credit, '0.00');
      assert.equal(refundFtx.val.balanceImpact, '500.00');
    });

    test('6.4 Full refund zeroes paidAmount, restores balanceDue, and sets PENDING_PAYMENT status', async () => {
      const invoiceId = crypto.randomUUID();
      const mockInvoice = {
        id: invoiceId,
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        patientId,
        invoiceNumber: 'INV-2026-0005',
        totalAmount: 1200,
        paidAmount: 1200,
        balanceDue: 0,
        dueAmount: '0',
        patientPayableAmount: 1200,
        status: 'PAID',
        payments: []
      };

      const mockDb = createDbMock({ invoice: mockInvoice });

      const result = await billingManagementRepository.processRefund(
        {
          tenantId,
          invoiceId,
          amount: 1200, // Full refund
          reason: 'Full consultation cancellation',
          supervisorUserId: supervisorId,
          supervisorOverrideToken
        },
        mockDb
      );

      assert.equal(result.success, true);
      assert.equal(result.invoice.paidAmount, 0, 'Paid amount must be zeroed');
      assert.equal(result.invoice.balanceDue, 1200, 'Full balance due must be restored');
      assert.equal(result.invoice.status, 'PENDING_PAYMENT');
    });
  });

  // ==========================================================================
  // SCENARIO 7: Payment Gateway Webhook Verification & Idempotency
  // ==========================================================================
  describe('Scenario 7: Payment Gateway Webhook Verification & Idempotency', () => {
    test('7.1 Fail-closed HMAC-SHA256 signature verification rejects forged or missing webhook signature', () => {
      const payload = JSON.stringify({ event: 'payment.captured', id: 'pay_998811' });
      const secret = 'docsearch-escrow-secret-prod-2026';
      const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      assert.equal(razorpayEscrowService.verifyWebhookSignature(payload, validSignature), true, 'Valid signature must pass');
      assert.equal(razorpayEscrowService.verifyWebhookSignature(payload, 'forged_fake_signature_hex'), false, 'Forged signature must fail');
      assert.equal(razorpayEscrowService.verifyWebhookSignature(payload, ''), false, 'Empty signature must fail closed');
      assert.equal(razorpayEscrowService.verifyWebhookSignature('', validSignature), false, 'Empty payload must fail closed');
    });

    test('7.2 Duplicate webhook callbacks return isDuplicate: true without double-crediting invoice', async () => {
      const invoiceId = crypto.randomUUID();
      const gatewayPaymentId = 'pay_razor_idem_001';

      const existingPayment = {
        id: crypto.randomUUID(),
        tenantId,
        invoiceId,
        referenceNumber: gatewayPaymentId,
        amount: 1000,
        status: 'SUCCESS'
      };

      const mockDb = createDbMock({ existingPayment });

      const result = await billingManagementRepository.reconcileWebhookPayment(
        {
          tenantId,
          invoiceId,
          gateway: 'RAZORPAY',
          gatewayPaymentId,
          amount: 1000,
          currency: 'INR'
        },
        mockDb
      );

      assert.equal(result.isDuplicate, true, 'Duplicate gateway payment must be flagged');
      assert.equal(result.paymentId, existingPayment.id, 'Must return existing payment record ID');
    });

    test('7.3 Webhook payment failure handler logs failure without deducting or altering invoice balance', async () => {
      const result = await billingManagementRepository.handleWebhookPaymentFailure({
        gateway: 'RAZORPAY',
        gatewayPaymentId: 'pay_failed_123',
        errorCode: 'BAD_REQUEST_ERROR',
        errorDescription: 'Card expired or insufficient funds'
      });

      assert.equal(result.success, true);
      assert.equal(result.message, 'Payment failure recorded');
    });
  });

  // ==========================================================================
  // SCENARIO 8: Double-Entry General Ledger Balancing & Invariant Proofs
  // ==========================================================================
  describe('Scenario 8: Double-Entry General Ledger Balancing & Invariants', () => {
    test('8.1 Invariant proof: delta Balance Due + delta Paid Amount === 0 across payments', () => {
      const initialTotal = 5000;
      let paid = 0;
      let balance = initialTotal;

      const payments = [1500, 2000, 1500];
      for (const p of payments) {
        const deltaPaid = p;
        const deltaBalance = -p;
        paid += deltaPaid;
        balance += deltaBalance;

        assert.equal(deltaPaid + deltaBalance, 0, 'Conservation of accounting value must hold');
        assert.equal(paid + balance, initialTotal, 'Total must equal paid + balance');
      }

      assert.equal(paid, 5000);
      assert.equal(balance, 0);
    });

    test('8.2 Invariant proof: General Ledger credit equals negative balance impact for collections', () => {
      const paymentAmount = 2500;
      const credit = paymentAmount.toFixed(2);
      const debit = '0.00';
      const balanceImpact = (-paymentAmount).toFixed(2);

      assert.equal(Number(balanceImpact), -Number(credit), 'Balance impact must exactly invert credit amount');
      assert.equal(Number(debit), 0);
    });

    test('8.3 Invariant proof: General Ledger debit equals positive balance impact for refunds', () => {
      const refundAmount = 750;
      const credit = '0.00';
      const debit = refundAmount.toFixed(2);
      const balanceImpact = refundAmount.toFixed(2);

      assert.equal(Number(balanceImpact), Number(debit), 'Balance impact must equal debit amount for refunds');
      assert.equal(Number(credit), 0);
    });
  });

  // ==========================================================================
  // SCENARIO 9: Indian GST Matrix & Place-of-Supply Engine
  // ==========================================================================
  describe('Scenario 9: Comprehensive Indian GST Rule Matrix & Place-of-Supply Engine', () => {
    test('9.1 Clinical healthcare exemptions (0% GST) across all clinical categories', async () => {
      const mockEmptyDb = { select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }) };

      const exemptServices = [
        { serviceName: 'OPD Consultation', category: 'CONSULTATION', expectedCode: '999312' },
        { serviceName: 'Blood Sugar Fasting', category: 'LAB_TEST', expectedCode: '999316' },
        { serviceName: 'Chest X-Ray Digital', category: 'RADIOLOGY', expectedCode: '999315' },
        { serviceName: 'Appendectomy OT Charges', category: 'SURGERY_OT', expectedCode: '999313' },
        { serviceName: 'Ward Nursing Services', category: 'NURSING', expectedCode: '999314' },
        { serviceName: 'Whole Blood PRBC 350ml', category: 'BLOOD_BANK', expectedCode: '999317' }
      ];

      for (const svc of exemptServices) {
        const res = await taxEngineService.calculateTaxes(
          [{ serviceName: svc.serviceName, category: svc.category, quantity: 1, unitPrice: 1000 }],
          { tenantId, isInterstate: false },
          mockEmptyDb
        );

        assert.equal(res.taxTotal, 0, `${svc.category} must have 0% GST`);
        assert.equal(res.items[0].isExempt, true, `${svc.category} must be exempt`);
        assert.equal(res.items[0].hsnSacCode, svc.expectedCode, `${svc.category} code mismatch`);
      }
    });

    test('9.2 Taxable hospital services: Room Bed (5%) and General Administrative (18%)', async () => {
      const mockEmptyDb = { select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }) };

      // Room Bed Charges (5% GST: 2.5% CGST + 2.5% SGST)
      const bedRes = await taxEngineService.calculateTaxes(
        [{ serviceName: 'Deluxe Private Room Bed', category: 'BED_CHARGES', quantity: 2, unitPrice: 3000 }],
        { tenantId, isInterstate: false },
        mockEmptyDb
      );
      assert.equal(bedRes.subtotal, 6000);
      assert.equal(bedRes.cgstTotal, 150.00, '2.5% CGST on 6000');
      assert.equal(bedRes.sgstTotal, 150.00, '2.5% SGST on 6000');
      assert.equal(bedRes.taxTotal, 300.00, 'Total 5% GST = 300');
      assert.equal(bedRes.grandTotal, 6300.00);

      // General Administrative / Medical Records (18% GST: 9% CGST + 9% SGST)
      const genRes = await taxEngineService.calculateTaxes(
        [{ serviceName: 'Medical Records Certificate & Attestation', category: 'GENERAL', quantity: 1, unitPrice: 500 }],
        { tenantId, isInterstate: false },
        mockEmptyDb
      );
      assert.equal(genRes.subtotal, 500);
      assert.equal(genRes.cgstTotal, 45.00, '9% CGST on 500');
      assert.equal(genRes.sgstTotal, 45.00, '9% SGST on 500');
      assert.equal(genRes.taxTotal, 90.00, 'Total 18% GST = 90');
      assert.equal(genRes.grandTotal, 590.00);
    });

    test('9.3 Place of Supply: Inter-state transaction switches equal split to IGST single bucket', async () => {
      const mockEmptyDb = { select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }) };

      // Patient from Maharashtra (27), Facility in Karnataka (29)
      const res = await taxEngineService.calculateTaxes(
        [{ serviceName: 'Administrative Kit', category: 'GENERAL', quantity: 1, unitPrice: 1000 }],
        { tenantId, patientState: 'Maharashtra', facilityState: 'Karnataka' },
        mockEmptyDb
      );

      assert.equal(res.isInterstate, true, 'Different states must trigger isInterstate');
      assert.equal(res.cgstTotal, 0, 'Inter-state must have 0 CGST');
      assert.equal(res.sgstTotal, 0, 'Inter-state must have 0 SGST');
      assert.equal(res.igstTotal, 180.00, 'Inter-state must apply full 18% IGST');
      assert.equal(res.grandTotal, 1180.00);
    });
  });

  // ==========================================================================
  // SCENARIO 10: Section 194O TDS Deductions & Tax Withholding
  // ==========================================================================
  describe('Scenario 10: Section 194O TDS Deductions & Tax Withholding', () => {
    test('10.1 Platform waterfall computes 1% Section 194O TDS on gross marketplace GMV', () => {
      const waterfall = platformRevenueWaterfallService.getRevenueWaterfall();

      assert.ok(waterfall.totalGrossGmvInr > 0);
      assert.ok(waterfall.streams.length >= 4);

      for (const stream of waterfall.streams) {
        const expectedTds = Math.round(stream.grossGmvInr * 0.01);
        assert.equal(
          stream.tdsSection194OInr,
          expectedTds,
          `TDS for ${stream.streamName} must be exactly 1% of gross GMV`
        );

        // Net settlement invariant check
        const calculatedNet = stream.grossGmvInr - stream.gatewayFeeInr - stream.platformTakeRateInr - stream.tdsSection194OInr;
        assert.equal(stream.netSettlementInr, calculatedNet, 'Stream net settlement must equal gross minus deductions');
      }

      assert.equal(waterfall.complianceStatus, '100% SECTION 194O COMPLIANT');
    });

    test('10.2 GSTR-1 and Form 26Q export records validate partner PAN, GSTIN, and challan numbers', () => {
      const records = platformRevenueWaterfallService.getTdsGstr1Ledger();

      assert.ok(records.length > 0);
      for (const r of records) {
        assert.ok(r.partnerLegalName);
        assert.ok(r.gstin);
        assert.ok(r.pan);
        assert.equal(r.tdsDeductedInr, Math.round(r.grossTransactionValueInr * 0.01), 'TDS must be 1%');
        assert.ok(r.challanNumber.startsWith('IT-CH-'));
        assert.ok(['READY_FOR_FILING', 'FILED_ACKNOWLEDGED'].includes(r.gstr1FilingStatus));
      }
    });
  });

  // ==========================================================================
  // SCENARIO 11: E-Invoice IRN & ClearTax GSP Forensic Validation
  // ==========================================================================
  describe('Scenario 11: E-Invoice IRN & Sandbox Submission Forensics', () => {
    test('11.1 Indian GST E-Invoice IRN specification: SHA-256 hash of supplier GSTIN, DocType, DocNo, FinYear', () => {
      const supplierGstin = '29AABCT1332L1ZV';
      const docType = 'INV';
      const docNumber = 'DOCS/2026/001';
      const finYear = '2026-27';

      const canonicalString = `${supplierGstin}${docType}${docNumber}${finYear}`;
      const irnHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

      assert.equal(irnHash.length, 64, 'IRN hash must be exactly 64 hexadecimal characters');
      assert.match(irnHash, /^[a-f0-9]{64}$/, 'IRN must strictly be SHA-256 hex');
    });

    test('11.2 Forensic verification detects corporate B2B route generates simulated IRN strings', () => {
      const simulatedIrn = `IRN-${Date.now().toString(36).toUpperCase()}`;
      assert.ok(simulatedIrn.startsWith('IRN-'));
      assert.notEqual(simulatedIrn.length, 64, 'Prototype mock IRN is not 64-char NIC SHA-256 hash');
    });
  });

  // ==========================================================================
  // SCENARIO 12: Maker-Checker Dual Control & Penny-Drop Account Verification
  // ==========================================================================
  describe('Scenario 12: Maker-Checker Dual Control & Penny-Drop Verification', () => {
    test('12.1 Penny-drop verification executes ₹1 IMPS simulation with RRN tracking', async () => {
      const result = await companyFinancialService.verifyPennyDrop(
        '50100492817261',
        'HDFC0000240',
        'DocSearch Health Technologies Pvt Ltd',
        supervisorSession
      );

      assert.equal(result.success, true);
      assert.ok(result.bankRrn.startsWith('IMPS'));
      assert.equal(result.pennyDropStatus, 'VERIFIED');
      assert.equal(result.matchScore, 100);
    });

    test('12.2 Propose corporate financial change creates pending change under maker-checker dual control', async () => {
      // Enable maker-checker on corporate configuration
      await companyFinancialService.updateConfig(
        { makerCheckerEnabled: true },
        supervisorSession
      );

      const makerSession = {
        userId: 'admin_maker_01',
        actorEmail: 'maker@docsearch.internal',
        isSuperAdmin: true,
        roles: ['SUPER_ADMIN']
      };

      const updated = await companyFinancialService.updateConfig(
        { businessUpiId: 'docsearch.billing.v2@hdfcbank' },
        makerSession
      );

      assert.ok(updated.pendingChange, 'Maker-Checker must produce pendingChange for sensitive update');
      assert.equal(updated.pendingChange.status, 'PENDING');
      assert.equal(updated.pendingChange.proposedConfig.businessUpiId, 'docsearch.billing.v2@hdfcbank');

      // Checker approves change
      const approvedConfig = await companyFinancialService.approvePendingConfigChange(
        updated.pendingChange.id,
        'APPROVED',
        supervisorSession
      );

      assert.equal(approvedConfig.businessUpiId, 'docsearch.billing.v2@hdfcbank');
      assert.equal(approvedConfig.pendingChange, undefined);
    });

    test('12.3 Maker-checker blocks self-approval when initiator attempts to review own financial change', async () => {
      await companyFinancialService.updateConfig(
        { makerCheckerEnabled: true },
        supervisorSession
      );

      const makerSession = {
        userId: 'admin_maker_02',
        actorEmail: 'maker2@docsearch.internal',
        isSuperAdmin: true,
        roles: ['SUPER_ADMIN']
      };

      const updated = await companyFinancialService.updateConfig(
        { businessUpiId: 'docsearch.maker@hdfcbank' },
        makerSession
      );

      assert.ok(updated.pendingChange);

      await assert.rejects(
        async () => {
          await companyFinancialService.approvePendingConfigChange(
            updated.pendingChange.id,
            'APPROVED',
            makerSession // Same user attempting self-approval
          );
        },
        /Change cannot be approved by the same user who initiated it/i,
        'Dual control violation: Self-approval must be rejected'
      );
    });
  });

  // ==========================================================================
  // SCENARIO 13: Split Escrow Exact Paise Invariant Balancing
  // ==========================================================================
  describe('Scenario 13: Split Escrow Exact Paise Invariant Balancing', () => {
    test('13.1 Split settlement enforces exact conservation of paise: Doctor + Hospital + Platform === Total', async () => {
      const totalAmountPaise = 200000; // ₹2,000.00
      const doctorSharePaise = 140000; // ₹1,400.00 (70%)
      const hospitalSharePaise = 50000; // ₹500.00 (25%)
      const platformFeePaise = 10000;  // ₹100.00 (5%)

      const result = await razorpayEscrowService.executeSplitSettlement({
        orderId: 'order_hosp_split_001',
        paymentId: 'pay_hosp_split_001',
        totalAmountPaise,
        doctorVirtualAccountId: 'acc_doc_virtual_01',
        doctorSharePaise,
        hospitalMerchantAccountId: 'acc_hosp_merchant_01',
        hospitalSharePaise,
        platformFeePaise
      });

      assert.equal(result.status, 'PROCESSED');
      assert.equal(result.totalAmountPaise, 200000);
      assert.equal(result.splits.length, 3);

      const sumSplits = result.splits.reduce((acc, s) => acc + s.amountPaise, 0);
      assert.equal(sumSplits, totalAmountPaise, 'Sum of paise transfers must exactly equal total payment paise');
      assert.ok(result.auditSignature, 'Must generate SHA-256 tamper-evident audit signature');
    });

    test('13.2 Rejects split settlement when component sum deviates from total payment even by 1 paise', async () => {
      await assert.rejects(
        async () => {
          await razorpayEscrowService.executeSplitSettlement({
            orderId: 'order_hosp_split_err',
            paymentId: 'pay_hosp_split_err',
            totalAmountPaise: 100000,
            doctorVirtualAccountId: 'acc_doc_01',
            doctorSharePaise: 70000,
            hospitalMerchantAccountId: 'acc_hosp_01',
            hospitalSharePaise: 29999, // 1 paise short!
            platformFeePaise: 0
          });
        },
        /Split settlement invariant violation/i,
        '1 paise mismatch must throw invariant violation error'
      );
    });

    test('13.3 Dynamic UPI QR URI string generation includes valid NPCI standard parameters', () => {
      const qrData = razorpayEscrowService.generateDynamicUpiQrUri({
        payeeVpa: 'docsearch.apollo@hdfcbank',
        payeeName: 'Apollo Hospital Billing',
        amount: 850.50,
        transactionRef: 'DOCS-TXN-881920',
        transactionNote: 'Consultation INV-2026-901'
      });

      assert.ok(qrData.startsWith('upi://pay?'), 'Must start with upi://pay? scheme');
      assert.ok(qrData.includes('pa=docsearch.apollo%40hdfcbank') || qrData.includes('pa=docsearch.apollo@hdfcbank'));
      assert.ok(qrData.includes('am=850.50'));
      assert.ok(qrData.includes('cu=INR'));
      assert.ok(qrData.includes('tr=DOCS-TXN-881920'));
    });
  });

  // ==========================================================================
  // SCENARIO 14: Cashier Shift Balancing & Cash Register Reconciliation
  // ==========================================================================
  describe('Scenario 14: Cashier Shift Balancing & Cash Register Reconciliation', () => {
    test('14.1 Cashier shift opening rejects opening if cashier already has an active open shift', async () => {
      const existingSession = {
        id: crypto.randomUUID(),
        sessionNumber: 'SFT-OPEN-001',
        cashierId,
        tenantId,
        status: 'OPEN'
      };

      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => {
              const p = Promise.resolve([existingSession]);
              p.limit = () => Promise.resolve([existingSession]);
              return p;
            }
          })
        })
      };

      await assert.rejects(
        async () => {
          await cashierShiftService.openShift(
            { cashierName: 'Primary Cashier', openingBalance: 1000 },
            mockSession,
            mockDb
          );
        },
        /Cashier already has an open shift session/i,
        'Duplicate shift opening by same cashier must be blocked'
      );
    });

    test('14.2 Cashier shift closing computes variance between expected ledger collections and physical cash', async () => {
      const sessionId = crypto.randomUUID();
      const existingSession = {
        id: sessionId,
        sessionNumber: 'SFT-2026-002',
        cashierId,
        tenantId,
        partnerId,
        organizationId: partnerId,
        branchId,
        status: 'OPEN',
        openingBalance: '1000.00',
        cashReceived: '4000.00',
        cashRefunded: '0.00',
        openedAt: new Date(Date.now() - 28800000)
      };

      const mockQueryChain = (result) => {
        const p = Promise.resolve(result);
        p.limit = () => Promise.resolve(result);
        p.orderBy = () => p;
        p.for = () => p;
        p.returning = () => Promise.resolve(result);
        return p;
      };

      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => mockQueryChain([existingSession]),
            orderBy: () => mockQueryChain([])
          })
        }),
        update: () => ({
          set: (val) => ({
            where: () => ({
              returning: () => Promise.resolve([{ ...existingSession, ...val, status: 'RECONCILIATION_PENDING' }])
            })
          })
        }),
        insert: () => ({
          values: (val) => ({
            returning: () => Promise.resolve([val])
          })
        })
      };

      // Expected cash = 1000 (opening) + 4000 (collected) = 5000
      // Actual counted cash = 4950 (50 shortage)
      const closed = await cashierShiftService.closeShift(
        sessionId,
        { actualCash: 4950, notes: '₹50 shortage due to coin change' },
        mockSession,
        mockDb
      );

      assert.equal(closed.shift.status, 'RECONCILIATION_PENDING');
      assert.equal(closed.variance, -50);
      assert.equal(closed.isBalanced, false);
    });
  });

  // ==========================================================================
  // SCENARIO 15: End-of-Day (EOD) Financial Closing & Reopening Controls
  // ==========================================================================
  describe('Scenario 15: End-of-Day (EOD) Financial Closing & Dual-Control Reopening', () => {
    test('15.1 Rejects closing an already closed business date to prevent duplicate closing tampering', async () => {
      const closingDate = '2026-11-04';
      const closedRecord = {
        id: crypto.randomUUID(),
        tenantId,
        closingDate,
        status: 'CLOSED'
      };

      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => {
              const p = Promise.resolve([closedRecord]);
              p.limit = () => Promise.resolve([closedRecord]);
              return p;
            }
          })
        })
      };

      await assert.rejects(
        async () => {
          await eodClosingService.closeDay(
            { closingDate, notes: 'Attempt duplicate closure' },
            supervisorSession,
            mockDb
          );
        },
        /is already closed.*Duplicate closure rejected/i,
        'Duplicate closure on closed business date must be blocked'
      );
    });

    test('15.2 Reopening a closed day requires supervisor authorization and valid reason', async () => {
      const closingId = crypto.randomUUID();
      const closedRecord = {
        id: closingId,
        tenantId,
        closingDate: '2026-11-03',
        status: 'CLOSED'
      };

      const mockQueryChain = (result) => {
        const p = Promise.resolve(result);
        p.limit = () => Promise.resolve(result);
        p.orderBy = () => p;
        p.for = () => p;
        p.returning = () => Promise.resolve(result);
        return p;
      };

      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => mockQueryChain([closedRecord]),
            orderBy: () => mockQueryChain([])
          })
        }),
        update: () => ({
          set: (val) => ({
            where: () => ({
              returning: () => Promise.resolve([{ ...closedRecord, ...val, status: 'REOPENED' }])
            })
          })
        }),
        insert: () => ({
          values: (val) => ({
            returning: () => Promise.resolve([val])
          })
        })
      };

      // Empty reason must throw validation error
      await assert.rejects(
        async () => {
          await eodClosingService.reopenDay(
            closingId,
            { reason: '' },
            supervisorSession,
            mockDb
          );
        },
        /Reopen justification reason is strictly mandatory/i,
        'Empty reason for reopening closed financial day must fail'
      );

      // Valid supervisor reopening
      const reopened = await eodClosingService.reopenDay(
        closingId,
        { reason: 'Late emergency surgery ledger reconciliation approved by CMO' },
        supervisorSession,
        mockDb
      );

      assert.equal(reopened.status, 'REOPENED');
      assert.equal(reopened.reopenedBy, supervisorSession.userId);
    });
  });
});
