import type { FastifyPluginAsync } from 'fastify';
import { insuranceManagementService } from '../../services/partner/InsuranceManagementService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const insuranceManagementRoutes: FastifyPluginAsync = async (app) => {
  // 1. Overview & Metrics
  app.get(
    '/api/v1/partner/insurance/overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await insuranceManagementService.getOverviewMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Payers
  app.get(
    '/api/v1/partner/insurance/payers',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await insuranceManagementService.getPayers(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/payers',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await insuranceManagementService.createPayer(tenantId, userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 3. Plans
  app.get(
    '/api/v1/partner/insurance/plans',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { payerId } = request.query as { payerId?: string };
      const data = await insuranceManagementService.getPlans(tenantId, payerId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/plans',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await insuranceManagementService.createPlan(tenantId, userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 4. Patient Policies
  app.get(
    '/api/v1/partner/insurance/policies',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { patientId } = request.query as { patientId?: string };
      const data = await insuranceManagementService.getPatientPolicies(tenantId, patientId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/policies',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await insuranceManagementService.registerPatientPolicy(tenantId, userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 5. Authorizations (Pre-Auth)
  app.get(
    '/api/v1/partner/insurance/authorizations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { patientId } = request.query as { patientId?: string };
      const data = await insuranceManagementService.getAuthorizations(tenantId, patientId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/authorizations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await insuranceManagementService.createAuthorization(tenantId, userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/authorizations/:id/submit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await insuranceManagementService.updateAuthorizationStatus(tenantId, id, userId, 'SUBMITTED');
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/authorizations/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as { approvedAmount?: number; remarks?: string };
      const data = await insuranceManagementService.updateAuthorizationStatus(tenantId, id, userId, 'APPROVED', body.approvedAmount, body.remarks);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/authorizations/:id/deny',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as { remarks?: string };
      const data = await insuranceManagementService.updateAuthorizationStatus(tenantId, id, userId, 'DENIED', 0, body.remarks);
      return reply.send({ success: true, data });
    }
  );

  // 6. Claims
  app.get(
    '/api/v1/partner/insurance/claims',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const query = request.query as { patientId?: string; status?: string };
      const data = await insuranceManagementService.getClaims(tenantId, query);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/insurance/claims/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { id } = request.params as { id: string };
      const data = await insuranceManagementService.getClaimById(tenantId, id);
      if (!data) {
        return reply.status(404).send({ success: false, error: 'Claim not found' });
      }
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/claims',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await insuranceManagementService.createClaim(tenantId, userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/claims/:id/submit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await insuranceManagementService.submitClaim(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/claims/:id/adjudicate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as { approvedAmount: number; deniedAmount: number; patientResponsibility: number; status?: string; remarks?: string };
      const data = await insuranceManagementService.adjudicateClaim(tenantId, id, body, userId);
      return reply.send({ success: true, data });
    }
  );

  // 7. Settlements
  app.get(
    '/api/v1/partner/insurance/settlements',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await insuranceManagementService.getSettlements(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/insurance/settlements',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await insuranceManagementService.recordSettlement(tenantId, userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 8. Reports & Audit Traces
  app.get(
    '/api/v1/partner/insurance/reports',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await insuranceManagementService.getReports(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/insurance/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await insuranceManagementService.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );
};
