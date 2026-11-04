import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { tpaClaimFactoringService } from '../../services/finance/TpaClaimFactoringService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const tpaFactoringRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Factoring Overview & Liquidity Metrics
  const handleOverview = async () => ({
    success: true,
    data: tpaClaimFactoringService.getOverviewMetrics()
  });
  fastify.get('/api/v1/company/finance/factoring/overview', { preHandler: [authenticate] }, handleOverview);
  fastify.get('/api/v1/company/factoring/portfolio', { preHandler: [authenticate] }, handleOverview);

  // 2. List Claims Available / Processed for Factoring
  const handleListClaims = async (request: any) => {
    const query = (request.query as Record<string, string>) || {};
    const partnerId = query['partnerId'];
    return {
      success: true,
      data: tpaClaimFactoringService.listClaims(partnerId)
    };
  };
  fastify.get('/api/v1/company/finance/factoring/claims', { preHandler: [authenticate] }, handleListClaims);
  fastify.get('/api/v1/company/factoring/claims', { preHandler: [authenticate] }, handleListClaims);

  // 3. Disburse Day-0 Advance to Hospital (80% Instant Working Capital)
  const DisburseSchema = z.object({
    claimId: z.string(),
    feePercent: z.number().default(2.0)
  });

  const handleDisburse = async (request: any) => {
    const parsed = DisburseSchema.parse(request.body || {});
    const result = tpaClaimFactoringService.disburseDay0Advance(parsed.claimId, parsed.feePercent);
    return {
      success: true,
      data: result
    };
  };
  fastify.post('/api/v1/company/finance/factoring/claims', { preHandler: [authenticate] }, handleDisburse);
  fastify.post('/api/v1/company/factoring/advance', { preHandler: [authenticate] }, handleDisburse);

  // 4. Settle Insurer Payment & Release Reserve
  const SettleSchema = z.object({
    claimId: z.string(),
    settledAmountInr: z.number()
  });

  const handleSettle = async (request: any) => {
    const parsed = SettleSchema.parse(request.body || {});
    const result = tpaClaimFactoringService.settleInsurerPayment(parsed.claimId, parsed.settledAmountInr);
    return {
      success: true,
      data: result
    };
  };
  fastify.post('/api/v1/company/finance/factoring/settle', { preHandler: [authenticate] }, handleSettle);
  fastify.post('/api/v1/company/factoring/settle', { preHandler: [authenticate] }, handleSettle);
};
