import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { monetizationEngineService } from '../../services/company/MonetizationEngineService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const monetizationEngineRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Get Global Monetization Config & GTM Strategy
  fastify.get('/api/v1/company/monetization/config', { preHandler: [authenticate] }, async () => {
    return {
      success: true,
      data: monetizationEngineService.getGlobalConfig()
    };
  });

  // 2. Update Global Monetization Config (e.g. Free Mode, Lowest Price Launch)
  const UpdateStrategySchema = z.object({
    globalFreeModeEnabled: z.boolean().optional(),
    globalFreeModeTitle: z.string().optional(),
    globalFreeAnnouncementMessage: z.string().optional(),
    disruptiveLowestPriceModeActive: z.boolean().optional(),
    defaultMonthlyInr: z.number().optional(),
    defaultYearlyInr: z.number().optional(),
    gracePeriodDurationDays: z.number().optional(),
    earlyBirdGrandfatheringPercent: z.number().optional()
  });

  fastify.post('/api/v1/company/monetization/config', { preHandler: [authenticate] }, async (request) => {
    const parsed = UpdateStrategySchema.parse(request.body || {});
    const updated = monetizationEngineService.updateGlobalStrategy(parsed);
    return {
      success: true,
      data: updated
    };
  });

  // 3. Get Real-Time Monetization KPIs (MRR/ARR/Savings)
  fastify.get('/api/v1/company/monetization/metrics', { preHandler: [authenticate] }, async () => {
    return {
      success: true,
      data: monetizationEngineService.getMonetizationMetrics()
    };
  });

  // 4. List Partner Licenses with Filter & Search
  fastify.get('/api/v1/company/monetization/licenses', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as Record<string, string>) || {};
    const licenses = monetizationEngineService.listPartnerLicenses({
      search: query['search'],
      status: query['status'],
      tier: query['tier'],
      currency: query['currency']
    });
    return {
      success: true,
      data: {
        total: licenses.length,
        licenses
      }
    };
  });

  // 5. Extend Free Period (+Days or Lifetime Free)
  const ExtendFreeSchema = z.object({
    days: z.number().default(30),
    isLifetime: z.boolean().default(false),
    reason: z.string().optional()
  });

  fastify.post('/api/v1/company/monetization/licenses/:partnerId/extend-free', { preHandler: [authenticate] }, async (request) => {
    const params = request.params as { partnerId: string };
    const parsed = ExtendFreeSchema.parse(request.body || {});
    const session = (request as any).session;
    const adminUser = session?.user?.name || 'Company Admin';

    const result = monetizationEngineService.extendFreePeriod(
      params.partnerId,
      parsed.days,
      adminUser,
      parsed.isLifetime
    );

    return {
      success: true,
      data: result
    };
  });

  // 6. Commercial License Renewal (Monthly or Yearly Lowest Pricing)
  const RenewSchema = z.object({
    billingCycle: z.enum(['MONTHLY', 'YEARLY']),
    planTier: z.enum(['COMMUNITY_FREE', 'SOLO_CLINIC_PRO', 'POLYCLINIC_GROWTH', 'HOSPITAL_ENTERPRISE']).optional(),
    customAmount: z.number().optional(),
    autoRenew: z.boolean().default(true)
  });

  fastify.post('/api/v1/company/monetization/licenses/:partnerId/renew', { preHandler: [authenticate] }, async (request) => {
    const params = request.params as { partnerId: string };
    const parsed = RenewSchema.parse(request.body || {});
    const session = (request as any).session;
    const adminUser = session?.user?.name || 'Company Admin';

    const result = monetizationEngineService.renewLicense(params.partnerId, {
      billingCycle: parsed.billingCycle,
      planTier: parsed.planTier,
      customAmount: parsed.customAmount,
      autoRenew: parsed.autoRenew,
      adminUser
    });

    return {
      success: true,
      data: result
    };
  });

  // 7. Grant Emergency Grace Period (Clinical Safety Anti-Lockout)
  const GraceSchema = z.object({
    days: z.number().default(15)
  });

  fastify.post('/api/v1/company/monetization/licenses/:partnerId/grace-period', { preHandler: [authenticate] }, async (request) => {
    const params = request.params as { partnerId: string };
    const parsed = GraceSchema.parse(request.body || {});

    const result = monetizationEngineService.grantGracePeriod(params.partnerId, parsed.days);

    return {
      success: true,
      data: result
    };
  });
};
