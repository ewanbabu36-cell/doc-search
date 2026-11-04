import { type FastifyPluginAsync } from 'fastify';
import { antibiogramCdssService, type AntibiogramRxCheckRequest } from '../../services/clinical/AntibiogramCdssService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const antibiogramRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/partner/clinical/antibiogram/:facilityId
   * Retrieves the institutional antibiogram matrix for the facility.
   */
  fastify.get(
    '/api/v1/partner/clinical/antibiogram/:facilityId',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const { facilityId } = request.params as { facilityId: string };
      const data = antibiogramCdssService.getFacilityAntibiogram(facilityId);
      return {
        success: true,
        data
      };
    }
  );

  /**
   * POST /api/v1/partner/clinical/antibiogram/evaluate-rx
   * Evaluates a prescribed antimicrobial agent against local institutional resistance profiles.
   */
  fastify.post(
    '/api/v1/partner/clinical/antibiogram/evaluate-rx',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const body = request.body as AntibiogramRxCheckRequest;
      const evaluation = antibiogramCdssService.evaluatePrescription(body);
      return {
        success: true,
        data: evaluation
      };
    }
  );
};
