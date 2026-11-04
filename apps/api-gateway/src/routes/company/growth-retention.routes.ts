import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { aiChurnRadarService } from '../../services/growth/AiChurnRadarService.js';
import { doctorAffiliateLoopService } from '../../services/growth/DoctorAffiliateLoopService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const growthRetentionRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Get Churn Alerts
  fastify.get('/api/v1/company/growth/churn/alerts', { preHandler: [authenticate] }, async () => {
    return {
      success: true,
      data: aiChurnRadarService.getDormancyAlerts()
    };
  });

  // 2. Dispatch Automated WhatsApp Retention Care
  const OutreachSchema = z.object({
    partnerId: z.string()
  });

  fastify.post('/api/v1/company/growth/churn/outreach', { preHandler: [authenticate] }, async (request) => {
    const parsed = OutreachSchema.parse(request.body || {});
    const result = aiChurnRadarService.dispatchAutomatedRetentionOutreach(parsed.partnerId);
    return {
      success: true,
      data: result
    };
  });

  // 3. Apply Dynamic Retention Offer
  const ApplyOfferSchema = z.object({
    partnerId: z.string(),
    offerType: z.enum(['50_PERCENT_LOYALTY_LOCK', 'FREE_AI_SCRIBE_3_MONTHS', 'LIFETIME_COMMUNITY_FREE'])
  });

  fastify.post('/api/v1/company/growth/churn/apply-offer', { preHandler: [authenticate] }, async (request) => {
    const parsed = ApplyOfferSchema.parse(request.body || {});
    const result = aiChurnRadarService.applyRetentionOffer(parsed.partnerId, parsed.offerType);
    return {
      success: true,
      data: result
    };
  });

  // 4. Affiliate Summary
  fastify.get('/api/v1/company/growth/affiliates/summary', { preHandler: [authenticate] }, async () => {
    return {
      success: true,
      data: doctorAffiliateLoopService.getAffiliateSummary()
    };
  });

  // 5. Affiliates List
  fastify.get('/api/v1/company/growth/affiliates/list', { preHandler: [authenticate] }, async () => {
    return {
      success: true,
      data: doctorAffiliateLoopService.getAffiliatesList()
    };
  });

  // 6. Process Payout Batch
  fastify.post('/api/v1/company/growth/affiliates/payout-batch', { preHandler: [authenticate] }, async () => {
    const result = doctorAffiliateLoopService.processBatchPayout();
    return {
      success: true,
      data: result
    };
  });
};
