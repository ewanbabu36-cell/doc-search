import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { microAddonMarketplaceService } from '../../services/company/MicroAddonMarketplaceService.js';
import { usageQuotaThrottlerService } from '../../services/company/UsageQuotaThrottlerService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const microAddonRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Get & Create Addons Catalog
  fastify.get('/api/v1/company/addons/catalog', { preHandler: [authenticate] }, async () => {
    return {
      success: true,
      data: microAddonMarketplaceService.getCatalog()
    };
  });

  const CatalogItemSchema = z.object({
    id: z.string(),
    featureKey: z.string(),
    name: z.string(),
    tagline: z.string(),
    category: z.enum(['CLINICAL_AI', 'COMMUNICATION', 'HARDWARE_KIOSK', 'INPATIENT_SURGICAL', 'DIAGNOSTICS']),
    monthlyPriceInr: z.number(),
    yearlyPriceInr: z.number(),
    marketCompetitorPriceMonthlyInr: z.number(),
    icon: z.string().default('🧩'),
    includedInFreeLaunch: z.boolean().default(false)
  });

  fastify.post('/api/v1/company/addons/catalog', { preHandler: [authenticate] }, async (request) => {
    const parsed = CatalogItemSchema.parse(request.body || {});
    const created = microAddonMarketplaceService.addCatalogItem(parsed);
    return {
      success: true,
      data: created
    };
  });

  // 2. Subscribe Addon for Partner
  const SubscribeSchema = z.object({
    partnerId: z.string(),
    addonId: z.string(),
    billingCycle: z.enum(['MONTHLY', 'YEARLY', 'LIFETIME_FREE']).default('MONTHLY'),
    isFreeGrant: z.boolean().default(false)
  });

  fastify.post('/api/v1/company/addons/subscribe', { preHandler: [authenticate] }, async (request) => {
    const parsed = SubscribeSchema.parse(request.body || {});
    const result = microAddonMarketplaceService.subscribeAddon(parsed);
    return {
      success: true,
      data: result
    };
  });

  // 3. Get Partner Usage Quotas
  fastify.get('/api/v1/company/addons/quotas/:partnerId', { preHandler: [authenticate] }, async (request) => {
    const params = request.params as { partnerId: string };
    const quota = usageQuotaThrottlerService.getQuota(params.partnerId);
    return {
      success: true,
      data: quota
    };
  });

  // 4. Update Partner Usage Quota Limits
  const UpdateQuotaSchema = z.object({
    whatsappLimit: z.number().optional(),
    dicomStorageLimitGb: z.number().optional(),
    aiScribeLimitMinutes: z.number().optional(),
    isUnlimitedVip: z.boolean().optional()
  });

  fastify.put('/api/v1/company/addons/quotas/:partnerId', { preHandler: [authenticate] }, async (request) => {
    const params = request.params as { partnerId: string };
    const parsed = UpdateQuotaSchema.parse(request.body || {});
    const updated = usageQuotaThrottlerService.updateQuotaLimits({
      partnerId: params.partnerId,
      ...parsed
    });
    return {
      success: true,
      data: updated
    };
  });
};
