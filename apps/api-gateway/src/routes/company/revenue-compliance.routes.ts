import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { asc606RevenueRecognitionService } from '../../services/finance/Asc606RevenueRecognitionService.js';
import { smartDunningRecoveryService } from '../../services/finance/SmartDunningRecoveryService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const revenueComplianceRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. ASC 606 / Ind AS 115 Revenue Waterfall
  fastify.get('/api/v1/company/finance/asc606/waterfall', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as Record<string, string>) || {};
    const summary = asc606RevenueRecognitionService.getWaterfallSummary({
      plan: query['plan'],
      term: query['term']
    });
    return {
      success: true,
      data: summary
    };
  });

  // 2. Smart Dunning Queue
  fastify.get('/api/v1/company/finance/dunning/queue', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as Record<string, string>) || {};
    const queue = smartDunningRecoveryService.getQueue(query['stage']);
    return {
      success: true,
      data: queue
    };
  });

  // 3. Smart Dunning Analytics
  fastify.get('/api/v1/company/finance/dunning/analytics', { preHandler: [authenticate] }, async () => {
    const analytics = smartDunningRecoveryService.getAnalytics();
    return {
      success: true,
      data: analytics
    };
  });

  // 4. Retry Dunning Charge Now
  const RetrySchema = z.object({
    invoiceId: z.string()
  });

  fastify.post('/api/v1/company/finance/dunning/retry-now', { preHandler: [authenticate] }, async (request) => {
    const parsed = RetrySchema.parse(request.body || {});
    const result = smartDunningRecoveryService.retryPaymentNow(parsed.invoiceId);
    return {
      success: result.success,
      data: result
    };
  });

  // 5. Apply Hardship Promo / Waiver
  const WaiverSchema = z.object({
    invoiceId: z.string(),
    waiverPercent: z.number().min(1).max(100)
  });

  fastify.post('/api/v1/company/finance/dunning/apply-waiver', { preHandler: [authenticate] }, async (request) => {
    const parsed = WaiverSchema.parse(request.body || {});
    const result = smartDunningRecoveryService.applyHardshipPromo(parsed.invoiceId, parsed.waiverPercent);
    return {
      success: result.success,
      data: result
    };
  });
};
