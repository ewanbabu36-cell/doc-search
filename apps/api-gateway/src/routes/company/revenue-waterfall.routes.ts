import { type FastifyPluginAsync } from 'fastify';
import { platformRevenueWaterfallService } from '../../services/finance/PlatformRevenueWaterfallService.js';
import { authenticate, requireRoles } from '../../plugins/auth-guard.js';

export const revenueWaterfallRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/company/revenue/gmv-waterfall
   * Computes enterprise Gross-to-Net Revenue Take-Rate Waterfall.
   */
  fastify.get(
    '/api/v1/company/revenue/gmv-waterfall',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER')]
    },
    async (request) => {
      const report = await platformRevenueWaterfallService.getLiveRevenueWaterfall(request.session);
      return {
        success: true,
        data: report
      };
    }
  );

  /**
   * GET /api/v1/company/revenue/tds-gstr1-ledger
   * Section 194O 1% TDS and GSTR-1 electronic filing export ledger.
   */
  fastify.get(
    '/api/v1/company/revenue/tds-gstr1-ledger',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_MANAGER')]
    },
    async (request) => {
      const records = await platformRevenueWaterfallService.getLiveTdsGstr1Ledger(request.session);
      return {
        success: true,
        data: records
      };
    }
  );
};
