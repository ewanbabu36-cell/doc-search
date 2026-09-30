import { type FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import { aiCostAndBudgetController } from '../../services/ai/AiCostAndBudgetController.js';
import { aiIncidentAndCapaService } from '../../services/ai/AiIncidentAndCapaService.js';
import { aiGatewayService } from '../../services/ai/AiGatewayService.js';
import { permissionFirewall } from '../../ai/permission-firewall.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export const hqAiIntelligenceRoutes: FastifyPluginAsync = async (fastify) => {
  const requireHqAdmin = (request: any) => {
    const session = request.session;
    const isSuperAdmin = Boolean(
      session?.isSuperAdmin ||
      (session?.roles || []).some((r: string) =>
        ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SECURITY_ADMIN', 'SYSTEM_ADMIN', 'HQ_SUPER_ADMIN'].includes(r)
      )
    );
    if (!isSuperAdmin) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Access denied: Requires HQ Superadmin or Company Admin authority.',
        statusCode: 403
      });
    }
  };

  // 1. Cross-tenant AI Governance Incidents View
  fastify.get('/api/v1/hq/ai/incidents', { preHandler: [authenticate] }, async (request, reply) => {
    requireHqAdmin(request);
    const data = await aiIncidentAndCapaService.listIncidents(request.session);
    return reply.send({ success: true, data });
  });

  // 2. Set Tenant AI Budget Ceiling
  fastify.post('/api/v1/hq/ai/budget/set-limit', { preHandler: [authenticate] }, async (request, reply) => {
    requireHqAdmin(request);
    const body = (request.body as any) || {};
    const { tenantId, monthlyTokenLimit, monthlyBudgetInr, dailyTokenLimit, hardStopThresholdPercent, warningThresholdPercent } = body;

    if (!tenantId) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'tenantId is mandatory for HQ budget setting.',
        statusCode: 400
      });
    }

    const data = await aiCostAndBudgetController.setBudgetLimit(tenantId, 'TENANT', tenantId, {
      monthlyTokenLimit,
      monthlyBudgetInr,
      dailyTokenLimit,
      hardStopThresholdPercent,
      warningThresholdPercent
    });
    return reply.send({ success: true, data });
  });

  // 3. Inspect Specific Tenant AI Budget
  fastify.get('/api/v1/hq/ai/budget/:tenantId', { preHandler: [authenticate] }, async (request, reply) => {
    requireHqAdmin(request);
    const { tenantId } = request.params as { tenantId: string };
    const data = await aiCostAndBudgetController.getBudgetStatus(tenantId, 'TENANT', tenantId);
    return reply.send({ success: true, data });
  });

  // 4. Inspect Tenant AI Request Audit Registry
  fastify.get('/api/v1/hq/ai/requests/:tenantId', { preHandler: [authenticate] }, async (request, reply) => {
    requireHqAdmin(request);
    const { tenantId } = request.params as { tenantId: string };
    const query = (request.query as any) || {};
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const data = await aiGatewayService.getRequestHistory(tenantId, limit);
    return reply.send({ success: true, data });
  });

  // 5. Inspect Global AI Kill-Switch State
  fastify.get('/api/v1/hq/ai/kill-switch', { preHandler: [authenticate] }, async (request, reply) => {
    requireHqAdmin(request);
    const mode = permissionFirewall.getOperatingMode();
    return reply.send({
      success: true,
      data: {
        mode,
        description:
          mode === 'AI_ENABLED'
            ? 'AI services are operating normally across all authorized domains.'
            : mode === 'AI_RESTRICTED'
              ? 'AI services are in RESTRICTED safety mode (read-only advisory, no write actions or clinical mutations).'
              : 'AI services are completely DISABLED by platform kill switch. Core clinical and ERP workflows remain fully operational.'
      }
    });
  });

  // 6. Set Global AI Kill-Switch State (HQ Super Admin Only)
  fastify.post('/api/v1/hq/ai/kill-switch', { preHandler: [authenticate] }, async (request, reply) => {
    requireHqAdmin(request);
    const body = (request.body as any) || {};
    const { mode, reason } = body;

    if (!mode || !['AI_ENABLED', 'AI_RESTRICTED', 'AI_DISABLED'].includes(mode)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Invalid mode. Must be one of: 'AI_ENABLED', 'AI_RESTRICTED', 'AI_DISABLED'",
        statusCode: 400
      });
    }

    permissionFirewall.setOperatingMode(mode);
    return reply.send({
      success: true,
      data: {
        mode,
        updatedBy: request.session.userId,
        reason: reason || 'Administrative kill-switch transition',
        timestamp: new Date().toISOString()
      }
    });
  });
};
