import { type FastifyPluginAsync } from 'fastify';
import { authenticate } from '../plugins/auth-guard.js';
import {
  ewanAssistantService,
  type EwanAskInput,
  type InitiateRenewalOrderInput,
  type VerifyRenewalPaymentInput
} from '../services/ai/EwanAssistantService.js';

export const ewanRoutes: FastifyPluginAsync = async (fastify) => {
  // ---------------------------------------------------------------------------
  // PARTNER EWAN ROUTES (Accessible even when account is LOCKED / EXPIRED)
  // ---------------------------------------------------------------------------

  /**
   * GET /api/v1/partner/ewan/context
   * Returns partner's live license lifecycle stage, Ewan operating mode,
   * available vs locked modules, and renewal options.
   */
  fastify.get(
    '/api/v1/partner/ewan/context',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await ewanAssistantService.getPartnerEwanContext(request.session);
      return reply.status(200).send({ success: true, data });
    }
  );

  /**
   * POST /api/v1/partner/ewan/ask
   * Partner Ewan Conversational & Action Assistant (Modes 1, 3, 4, 5, 6)
   * Protected by the Adversarial Prompt-Injection & Governance Firewall.
   */
  fastify.post(
    '/api/v1/partner/ewan/ask',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body as EwanAskInput) || { prompt: '' };
      const result = await ewanAssistantService.askEwan(request.session, body);
      const statusCode = result.blockedByFirewall ? 403 : result.allowed === false ? 403 : 200;
      return reply.status(statusCode).send({
        success: result.allowed !== false,
        data: result
      });
    }
  );

  /**
   * GET /api/v1/partner/ewan/customer-success
   * Mode 3: Customer Success Assistant (Real PostgreSQL Usage & Adoption)
   */
  fastify.get(
    '/api/v1/partner/ewan/customer-success',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await ewanAssistantService.getCustomerSuccessSummary(request.session);
      return reply.status(200).send({ success: true, data });
    }
  );

  /**
   * POST /api/v1/partner/ewan/renewal/initiate-order
   * Mode 5 & 6: Initiates an authoritative renewal order from HQ-configured plans & price_versions
   */
  fastify.post(
    '/api/v1/partner/ewan/renewal/initiate-order',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body as InitiateRenewalOrderInput) || {};
      const data = await ewanAssistantService.initiateRenewalOrder(request.session, body);
      return reply.status(201).send({ success: true, data });
    }
  );

  /**
   * POST /api/v1/partner/ewan/renewal/verify-payment
   * Mode 5 & 6: Verifies cryptographic payment signature, handles idempotency,
   * extends subscription & license, recalculates entitlements, and unlocks the account.
   */
  fastify.post(
    '/api/v1/partner/ewan/renewal/verify-payment',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body as VerifyRenewalPaymentInput) || ({} as VerifyRenewalPaymentInput);
      const data = await ewanAssistantService.verifyAndSettleRenewalPayment(request.session, body);
      return reply.status(200).send({ success: true, data });
    }
  );

  // ---------------------------------------------------------------------------
  // COMPANY HQ EWAN ROUTES (Mode 2: Sales Manager, Mode 3: CS, Finance Assistant)
  // ---------------------------------------------------------------------------

  /**
   * GET /api/v1/company/ewan/sales-overview
   * Mode 2: Company Sales Manager Assistant (Leads, Pipeline, Renewal Opportunities, Plan Recommendation)
   */
  fastify.get(
    '/api/v1/company/ewan/sales-overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const query = (request.query || {}) as {
        partnerType?: string;
        doctorCount?: string;
        branchCount?: string;
      };
      const requirements: NonNullable<EwanAskInput['requirements']> = {};
      if (query.partnerType) requirements.partnerType = query.partnerType;
      if (query.doctorCount) requirements.doctorCount = Number(query.doctorCount);
      if (query.branchCount) requirements.branchCount = Number(query.branchCount);
      const hasReq = Object.keys(requirements).length > 0;

      const data = await ewanAssistantService.getCompanySalesManagerOverview(
        request.session,
        hasReq ? requirements : undefined
      );
      return reply.status(200).send({ success: true, data });
    }
  );

  /**
   * GET /api/v1/company/ewan/customer-success/:tenantId
   * Mode 3 (HQ View): Customer Success Assistant for any partner tenant
   */
  fastify.get(
    '/api/v1/company/ewan/customer-success/:tenantId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.params as { tenantId: string };
      const data = await ewanAssistantService.getCustomerSuccessSummary(request.session, tenantId);
      return reply.status(200).send({ success: true, data });
    }
  );

  /**
   * GET /api/v1/company/ewan/finance-overview
   * HQ Finance Manager Assistant (Subscriptions, Invoices, Payments, Revenue & Reconciliation)
   */
  fastify.get(
    '/api/v1/company/ewan/finance-overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await ewanAssistantService.getFinanceManagerOverview(request.session);
      return reply.status(200).send({ success: true, data });
    }
  );

  /**
   * POST /api/v1/company/ewan/ask
   * HQ Conversational Assistant for Sales, Customer Success, Renewal, and Finance Managers
   */
  fastify.post(
    '/api/v1/company/ewan/ask',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body as EwanAskInput) || { prompt: '' };
      const result = await ewanAssistantService.askEwan(request.session, body);
      const statusCode = result.blockedByFirewall ? 403 : result.allowed === false ? 403 : 200;
      return reply.status(statusCode).send({
        success: result.allowed !== false,
        data: result
      });
    }
  );
};
