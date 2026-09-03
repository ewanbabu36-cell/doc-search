import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { billingManagementService } from '../../services/partner/BillingManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type CreateInvoiceInput,
  type RecordInsurancePreAuthInput,
  type CollectPaymentInput
} from '../../repositories/partner/BillingManagementRepository.js';

export const CreateInvoiceSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  encounterId: z.string().trim().min(1, 'encounterId is required'),
  partnerId: z.string().trim().optional(),
  organizationId: z.string().trim().optional(),
  branchId: z.string().trim().optional(),
  patientName: z.string().trim().optional(),
  encounterType: z.string().trim().optional(),
  billingType: z.enum(['SELF_PAY', 'INSURANCE_TPA', 'AYUSHMAN_BHARAT_PMJAY', 'CORPORATE']),
  insurancePayerName: z.string().trim().optional(),
  policyNumber: z.string().trim().optional(),
  items: z.array(z.object({
    serviceName: z.string().min(1),
    category: z.enum(['CONSULTATION', 'BED_CHARGES', 'PHARMACY', 'LAB_TEST', 'SURGERY_OT', 'BLOOD_BANK', 'NURSING']),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative()
  })).optional(),
  lineItems: z.array(z.record(z.any())).optional()
});

export const RecordInsurancePreAuthSchema = z.object({
  patientId: z.string().trim().min(1, 'patientId is required'),
  payerName: z.string().trim().min(1, 'payerName is required'),
  policyNumber: z.string().trim().min(1, 'policyNumber is required'),
  preAuthNumber: z.string().trim().min(1, 'preAuthNumber is required'),
  approvedAmount: z.number().nonnegative().optional(),
  coPayAmount: z.number().nonnegative().optional(),
  claimStatus: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  metadata: z.record(z.any()).optional()
});

export const CollectPaymentSchema = z.object({
  amount: z.number().positive('amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE', 'INSURANCE_DIRECT']),
  transactionRef: z.string().trim().optional(),
  paymentReference: z.string().trim().optional(),
  metadata: z.record(z.any()).optional()
});

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

export const billingManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Invoices List
  fastify.get(
    '/api/v1/partner/billing/invoices',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'read')]
    },
    async (request) => {
      const query = request.query as { patientId?: string; status?: string };
      const data = await billingManagementService.getInvoices(request.session, query?.patientId, query?.status);
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
      const data = await billingManagementService.getInvoiceById(request.session, id);
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
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
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
      preHandler: [authenticate, requirePermission('billing:invoices', 'create')]
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
        invoiceId: id
      } as Omit<CollectPaymentInput, 'tenantId' | 'collectedBy'>, request.session);
      reply.status(201);
      return { success: true, data };
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
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
    },
    handleVoidInvoice
  );

  fastify.post(
    '/api/v1/partner/billing/invoices/:id/cancel',
    {
      preHandler: [authenticate, requirePermission('billing:invoices', 'update')]
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
};
