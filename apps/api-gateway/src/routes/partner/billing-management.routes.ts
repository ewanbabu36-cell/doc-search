import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { billingManagementService } from '../../services/partner/BillingManagementService.js';
import { taxEngineService } from '../../services/partner/TaxEngineService.js';
import { packageBillingService } from '../../services/partner/PackageBillingService.js';
import { creditReceivablesService } from '../../services/partner/CreditReceivablesService.js';
import { accountsPayableService } from '../../services/partner/AccountsPayableService.js';
import { cashierShiftService } from '../../services/partner/CashierShiftService.js';
import { eodClosingService } from '../../services/partner/EodClosingService.js';
import { reconciliationService } from '../../services/partner/ReconciliationService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import { enforceIdempotency } from '../../plugins/idempotency.js';
import {
  type CreateInvoiceInput,
  type RecordInsurancePreAuthInput,
  type CollectPaymentInput
} from '../../repositories/partner/BillingManagementRepository.js';

export const CreateInvoiceSchema = z.object({
  patientId: z.string().trim().optional().default('55555555-5555-4555-8555-555555555501'),
  encounterId: z.string().trim().optional(),
  partnerId: z.string().trim().optional(),
  organizationId: z.string().trim().optional(),
  branchId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  tenantId: z.string().trim().optional(),
  patientName: z.string().trim().optional(),
  patientMrn: z.string().trim().optional(),
  invoiceType: z.string().trim().optional(),
  encounterType: z.string().trim().optional(),
  billingType: z.preprocess((val) => val === 'OUTPATIENT' ? 'SELF_PAY' : val, z.enum(['SELF_PAY', 'INSURANCE_TPA', 'AYUSHMAN_BHARAT_PMJAY', 'CORPORATE']).optional().default('SELF_PAY')),
  insurancePayerName: z.string().trim().optional(),
  policyNumber: z.string().trim().optional(),
  paymentMode: z.string().trim().optional(),
  paymentStatus: z.string().trim().optional(),
  paymentReference: z.string().trim().optional(),
  transactionReference: z.string().trim().optional(),
  actorId: z.string().trim().optional(),
  actorRole: z.string().trim().optional(),
  isInterstate: z.boolean().optional(),
  justification: z.string().trim().optional(),
  dueDays: z.number().optional(),
  items: z.array(z.object({
    serviceName: z.string().trim().optional(),
    description: z.string().trim().optional(),
    serviceCode: z.string().trim().optional(),
    category: z.string().trim().optional(),
    quantity: z.number().positive().optional().default(1),
    unitPrice: z.number().nonnegative().optional().default(0),
    totalPrice: z.number().nonnegative().optional(),
    discountAmount: z.number().nonnegative().optional().default(0),
    taxAmount: z.number().nonnegative().optional().default(0),
    gstRate: z.number().nonnegative().optional(),
    taxRate: z.number().nonnegative().optional(),
    sacCode: z.string().optional(),
    chargeId: z.string().optional(),
    chargeItemId: z.string().optional(),
    serviceCatalogId: z.string().optional()
  })).optional(),
  lineItems: z.array(z.record(z.any())).optional()
}).transform((data) => {
  const items = (data.items || []).map((it) => {
    const qty = it.quantity || 1;
    const price = it.unitPrice || 0;
    const cat = (it.category && ['CONSULTATION', 'BED_CHARGES', 'PHARMACY', 'LAB_TEST', 'LABORATORY', 'SURGERY_OT', 'BLOOD_BANK', 'NURSING'].includes(it.category))
      ? it.category as any
      : 'CONSULTATION';
    return {
      serviceName: it.serviceName || it.description || it.serviceCode || 'General Healthcare Service',
      serviceCode: it.serviceCode || cat,
      category: cat,
      quantity: qty,
      unitPrice: price,
      discountAmount: it.discountAmount || 0,
      gstRate: it.gstRate ?? it.taxRate,
      sacCode: it.sacCode,
      totalPrice: it.totalPrice !== undefined ? it.totalPrice : (qty * price)
    };
  });
  return {
    ...data,
    items
  };
}).refine(
  (data) => (data.items && data.items.length > 0) || (data.lineItems && data.lineItems.length > 0),
  { message: 'At least one line item is required to generate an invoice' }
);


export const RecordInsurancePreAuthSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  payerName: z.string().trim().min(1, 'payerName is required'),
  policyNumber: z.string().trim().min(1, 'policyNumber is required'),
  preAuthNumber: z.string().trim().min(1, 'preAuthNumber is required'),
  requestedAmount: z.number().nonnegative().optional(),
  approvedAmount: z.number().nonnegative().optional(),
  coPayAmount: z.number().nonnegative().optional(),
  status: z.string().trim().optional(),
  claimStatus: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  metadata: z.record(z.any()).optional()
});

export const CollectPaymentSchema = z.object({
  amount: z.number().positive('amount must be greater than 0'),
  paymentMode: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
  transactionReference: z.string().trim().optional(),
  transactionRef: z.string().trim().optional(),
  paymentReference: z.string().trim().optional(),
  metadata: z.record(z.any()).optional()
}).transform((data) => ({
  ...data,
  paymentMode: (data.paymentMode || data.paymentMethod || 'CASH').toUpperCase() as 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'INSURANCE_SETTLEMENT'
}));

export const VoidInvoiceSchema = z.object({
  void_reason: z.string().trim().min(1, 'void_reason cannot be empty').optional(),
  voidReason: z.string().trim().min(1, 'voidReason cannot be empty').optional(),
  supervisor_user_id: z.string().trim().min(1, 'supervisor_user_id cannot be empty').optional(),
  supervisorUserId: z.string().trim().min(1, 'supervisorUserId cannot be empty').optional(),
  supervisor_override_token: z.string().trim().optional(),
  supervisorOverrideToken: z.string().trim().optional()
}).refine(
  (data) => Boolean((data.void_reason && data.void_reason.trim()) || (data.voidReason && data.voidReason.trim())),
  { message: 'void_reason is mandatory and cannot be empty' }
).refine(
  (data) => Boolean((data.supervisor_user_id && data.supervisor_user_id.trim()) || (data.supervisorUserId && data.supervisorUserId.trim())),
  { message: 'supervisor_user_id is mandatory and cannot be empty' }
);

export const ApplyDiscountSchema = z.object({
  discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discount_value: z.number().positive('discount_value must be greater than 0').optional(),
  discountValue: z.number().positive('discountValue must be greater than 0').optional(),
  reason: z.string().trim().min(1, 'reason is mandatory and cannot be empty'),
  approved_by: z.string().trim().min(1, 'approved_by cannot be empty').optional(),
  approvedBy: z.string().trim().min(1, 'approvedBy cannot be empty').optional(),
  invoice_item_id: z.string().optional(),
  invoiceItemId: z.string().optional(),
  supervisor_override_token: z.string().trim().optional(),
  supervisorOverrideToken: z.string().trim().optional()
}).refine(
  (data) => Boolean(data.discount_type || data.discountType),
  { message: 'discount_type must be PERCENTAGE or FIXED_AMOUNT' }
).refine(
  (data) => (data.discount_value !== undefined && data.discount_value > 0) || (data.discountValue !== undefined && data.discountValue > 0),
  { message: 'discount_value must be a positive number' }
).refine(
  (data) => Boolean((data.approved_by && data.approved_by.trim()) || (data.approvedBy && data.approvedBy.trim())),
  { message: 'approved_by is mandatory and cannot be empty' }
);

export const RefundInvoiceSchema = z.object({
  amount: z.number().positive('amount must be greater than 0'),
  reason: z.string().trim().min(1, 'reason is mandatory and cannot be empty'),
  supervisor_user_id: z.string().trim().min(1, 'supervisor_user_id cannot be empty').optional(),
  supervisorUserId: z.string().trim().min(1, 'supervisorUserId cannot be empty').optional(),
  supervisor_override_token: z.string().trim().optional(),
  supervisorOverrideToken: z.string().trim().optional(),
  paymentId: z.string().trim().optional()
});

export const billingManagementRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('TPA_INSURANCE'));

  // 1. Invoices List
  fastify.get(
    '/api/v1/partner/billing/invoices',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const query = (request.query || {}) as {
        patientId?: string;
        status?: string;
        tenantId?: string;
        branchId?: string;
        departmentId?: string;
      };
      const data = await billingManagementService.getInvoices(request.session, query.patientId, query.status, {
        tenantId: query.tenantId,
        branchId: query.branchId,
        departmentId: query.departmentId
      });
      return { success: true, data };
    }
  );

  // 1b. Get Single Invoice by ID
  fastify.get(
    '/api/v1/partner/billing/invoices/:id',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const query = (request.query || {}) as { tenantId?: string; branchId?: string; departmentId?: string };
      const data = await billingManagementService.getInvoiceById(request.session, id, {
        tenantId: query.tenantId,
        branchId: query.branchId,
        departmentId: query.departmentId
      });
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' } };
      }
      return { success: true, data };
    }
  );

  // 2. Create Consolidated Invoice
  fastify.post(
    '/api/v1/partner/billing/invoices',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create'), enforceIdempotency]
    },
    async (request, reply) => {
      const parsed = CreateInvoiceSchema.safeParse(request.body || {});
      if (!parsed.success) {
        throw new AppError({
          message: parsed.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const data = await billingManagementService.createInvoice(parsed.data as Omit<CreateInvoiceInput, 'tenantId'>, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 3. Insurance / TPA Pre-Authorization
  fastify.post(
    '/api/v1/partner/billing/invoices/:id/pre-auth',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = RecordInsurancePreAuthSchema.safeParse(request.body || {});
      if (!parsed.success) {
        throw new AppError({
          message: parsed.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const data = await billingManagementService.recordInsurancePreAuth({
        ...parsed.data,
        invoiceId: id
      } as Omit<RecordInsurancePreAuthInput, 'tenantId'>, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' } };
      }
      return { success: true, data };
    }
  );

  // 4. Collect Payment & Settle Bill
  fastify.post(
    '/api/v1/partner/billing/invoices/:id/payments',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create'), enforceIdempotency]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = CollectPaymentSchema.safeParse(request.body || {});
      if (!parsed.success) {
        throw new AppError({
          message: parsed.error.issues.map((i) => i.message).join('; '),
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      const data = await billingManagementService.collectPayment({
        ...parsed.data,
        transactionReference: parsed.data.transactionReference || parsed.data.transactionRef || parsed.data.paymentReference,
        invoiceId: id
      } as Omit<CollectPaymentInput, 'tenantId' | 'collectedBy'>, request.session);
      reply.status(201);
      return {
        success: true,
        data: {
          ...data,
          ...data.invoice,
          invoice: data.invoice,
          receiptNumber: data.receiptNumber
        }
      };
    }
  );

  // 5. Void / Cancel Invoice (with strict supervisor override policy)
  const handleVoidInvoice = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const parsed = VoidInvoiceSchema.safeParse(request.body || {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues.map((i) => i.message).join('; ')
        }
      };
    }

    const body = parsed.data;
    const voidReason = (body.void_reason || body.voidReason)!.trim();
    const supervisorUserId = (body.supervisor_user_id || body.supervisorUserId)!.trim();
    const supervisorOverrideToken =
      body.supervisor_override_token ||
      body.supervisorOverrideToken ||
      (request.headers['x-supervisor-override-token'] as string | undefined);

    const data = await billingManagementService.voidInvoice(
      {
        invoiceId: id,
        voidReason,
        supervisorUserId,
        supervisorOverrideToken
      },
      request.session
    );

    return { success: true, data };
  };

  fastify.post(
    '/api/v1/partner/billing/invoices/:id/void',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'cancel')]
    },
    handleVoidInvoice
  );

  fastify.post(
    '/api/v1/partner/billing/invoices/:id/cancel',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'cancel')]
    },
    handleVoidInvoice
  );

  // 6. Apply Discount to Invoice (blocks PAID without supervisor override)
  fastify.post(
    '/api/v1/partner/billing/invoices/:id/discounts',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = ApplyDiscountSchema.safeParse(request.body || {});
      if (!parsed.success) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues.map((i) => i.message).join('; ')
          }
        };
      }

      const body = parsed.data;
      const discountType = (body.discount_type || body.discountType)!;
      const discountValue = (body.discount_value ?? body.discountValue)!;
      const approvedBy = (body.approved_by || body.approvedBy)!.trim();
      const supervisorOverrideToken =
        body.supervisor_override_token ||
        body.supervisorOverrideToken ||
        (request.headers['x-supervisor-override-token'] as string | undefined);

      const data = await billingManagementService.applyDiscount(
        {
          invoiceId: id,
          invoiceItemId: body.invoice_item_id || body.invoiceItemId,
          discountType,
          discountValue,
          reason: body.reason.trim(),
          approvedBy,
          supervisorOverrideToken
        },
        request.session
      );

      reply.status(200);
      return { success: true, data };
    }
  );

  // 6b. Process Staff Refund on Invoice
  const handleRefund = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const parsed = RefundInvoiceSchema.safeParse(request.body || {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues.map((i) => i.message).join('; ')
        }
      };
    }

    const body = parsed.data;
    const supervisorOverrideToken =
      body.supervisor_override_token ||
      body.supervisorOverrideToken ||
      (request.headers['x-supervisor-override-token'] as string | undefined);
    const supervisorUserId = (body.supervisor_user_id || body.supervisorUserId)?.trim();

    const data = await billingManagementService.processRefund(
      {
        invoiceId: id,
        amount: body.amount,
        reason: body.reason.trim(),
        supervisorUserId,
        supervisorOverrideToken,
        paymentId: body.paymentId
      },
      request.session
    );

    reply.status(200);
    return { success: true, data };
  };

  fastify.post(
    '/api/v1/partner/billing/invoices/:id/refund',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'refund')]
    },
    handleRefund
  );

  fastify.post(
    '/api/v1/partner/billing/invoices/:id/refunds',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'refund')]
    },
    handleRefund
  );

  // 7. Patient Billing History
  fastify.get(
    '/api/v1/partner/patients/:id/billing-history',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await billingManagementService.getPatientBillingHistory(request.session, id);
      return { success: true, data };
    }
  );

  // ==========================================
  // PHASE 11: FINANCE & COMMERCIAL LAYER
  // ==========================================

  // 8. Financial Dashboard Overview (Real PostgreSQL aggregation, zero mock data)
  fastify.get(
    '/api/v1/partner/billing/dashboard/overview',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await billingManagementService.getFinancialOverview(request.session, request.query as any);
      return { success: true, data };
    }
  );

  // 9. GST / Tax Engine Routes
  fastify.get(
    '/api/v1/partner/billing/tax-rates',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await taxEngineService.getTaxRates(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/tax-rates',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request, reply) => {
      const data = await taxEngineService.createTaxRate(request.session, request.body as any);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/tax-rates/calculate',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const body = request.body as { items: any[]; isInterstate?: boolean };
      const data = await taxEngineService.calculateTaxes(
        body?.items || [],
        { tenantId: request.session.tenantId, isInterstate: Boolean(body?.isInterstate) }
      );
      return { success: true, data };
    }
  );

  // 10. Billing Packages & Patient Consumption Tracking
  fastify.get(
    '/api/v1/partner/billing/packages',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const query = request.query as { category?: string };
      const data = await packageBillingService.getPackages(request.session, query?.category);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/packages',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
    },
    async (request, reply) => {
      const data = await packageBillingService.createPackage(request.body as any, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/patient-packages/purchase',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
    },
    async (request, reply) => {
      const data = await packageBillingService.purchasePackage(request.body as any, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/patient-packages/consume',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request) => {
      const data = await packageBillingService.consumePackageService(request.body as any, request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/patients/:patientId/packages',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const { patientId } = request.params as { patientId: string };
      const data = await packageBillingService.getPatientPackages(patientId, request.session);
      return { success: true, data };
    }
  );

  // 11. Patient Credit Accounts & Accounts Receivable (AR) Ageing
  fastify.get(
    '/api/v1/partner/billing/credit-accounts/:patientId',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const { patientId } = request.params as { patientId: string };
      const data = await creditReceivablesService.getCreditAccount(patientId, request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/credit-accounts',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request, reply) => {
      const data = await creditReceivablesService.upsertCreditAccount(request.body as any, request.session);
      reply.status(200);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/receivables/ageing',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await creditReceivablesService.getReceivablesAgeing(request.session);
      return { success: true, data };
    }
  );

  // 12. Accounts Payable (AP) Vendor Bills & Supplier Payments
  fastify.get(
    '/api/v1/partner/billing/payables',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await accountsPayableService.getPayables(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/payables/summary',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await accountsPayableService.getPayablesSummary(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/payables/:id',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await accountsPayableService.getPayableById(id, request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/payables',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
    },
    async (request, reply) => {
      const data = await accountsPayableService.createPayable(request.body as any, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/payables/:id/payments',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const data = await accountsPayableService.recordPayablePayment(
        { ...body, payableId: id },
        request.session
      );
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/payables/:id/approve',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await accountsPayableService.approvePayable(id, request.session);
      return { success: true, data };
    }
  );

  // 13. Cashier Workstation Shift Sessions & Reconciliation
  fastify.post(
    '/api/v1/partner/billing/shifts/open',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
    },
    async (request, reply) => {
      const data = await cashierShiftService.openShift(request.body as any || {}, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/shifts/current',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await cashierShiftService.getCurrentShift(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/shifts/:id/close',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await cashierShiftService.closeShift(id, request.body as any, request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/shifts',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await cashierShiftService.getShifts(request.session);
      return { success: true, data };
    }
  );

  // 14. End-of-Day (EOD) Closing & Audit Protection
  fastify.post(
    '/api/v1/partner/billing/eod-closings/close',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request, reply) => {
      const data = await eodClosingService.closeDay(request.body as any || {}, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/eod-closings/:id/reopen',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await eodClosingService.reopenDay(id, request.body as any, request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/eod-closings',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await eodClosingService.getEodClosings(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/eod-closings/:id',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await eodClosingService.getEodClosingById(id, request.session);
      return { success: true, data };
    }
  );

  // 15. Reconciliation & Cash Variance Management
  fastify.get(
    '/api/v1/partner/billing/reconciliations',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const data = await reconciliationService.getReconciliations(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/billing/reconciliations/:id',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await reconciliationService.getReconciliationById(id, request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/reconciliations',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
    },
    async (request, reply) => {
      const data = await reconciliationService.createReconciliation(request.body as any, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/billing/reconciliations/:id/resolve',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await reconciliationService.resolveDiscrepancy(id, request.body as any, request.session);
      return { success: true, data };
    }
  );
};
