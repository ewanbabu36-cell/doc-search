import { type FastifyPluginAsync } from 'fastify';
import { billingManagementService } from '../../services/partner/BillingManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type CreateInvoiceInput,
  type RecordInsurancePreAuthInput,
  type CollectPaymentInput
} from '../../repositories/partner/BillingManagementRepository.js';

export const billingManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Invoices List
  fastify.get(
    '/api/v1/partner/billing/invoices',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { patientId?: string; status?: string };
      const data = await billingManagementService.getInvoices(request.session, query?.patientId, query?.status);
      return { success: true, data };
    }
  );

  // 2. Create Consolidated Invoice
  fastify.post(
    '/api/v1/partner/billing/invoices',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateInvoiceInput, 'tenantId'>;
      const data = await billingManagementService.createInvoice(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 3. Insurance / TPA Pre-Authorization
  fastify.post(
    '/api/v1/partner/billing/invoices/:id/pre-auth',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<RecordInsurancePreAuthInput, 'tenantId' | 'invoiceId'>;
      const data = await billingManagementService.recordInsurancePreAuth({
        ...payload,
        invoiceId: id
      }, request.session);
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
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<CollectPaymentInput, 'tenantId' | 'invoiceId' | 'collectedBy'>;
      const data = await billingManagementService.collectPayment({
        ...payload,
        invoiceId: id
      }, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 5. Patient Billing History
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
