import { type FastifyPluginAsync } from 'fastify';
import {
  chronicRefillPredictorService,
  type ChronicRefillOrderRequest
} from '../../services/patient/ChronicRefillPredictorService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const chronicRefillRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/patient/chronic-refill/status/:patientId
   * Retrieves active chronic medicine exhaustion countdown and 1-tap reorder payload.
   */
  fastify.get(
    '/api/v1/patient/chronic-refill/status/:patientId',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const { patientId } = request.params as { patientId: string };
      const data = chronicRefillPredictorService.getChronicRefillStatus(patientId);
      return {
        success: true,
        data
      };
    }
  );

  /**
   * POST /api/v1/patient/chronic-refill/order
   * Places an expedited chronic medicine refill order.
   */
  fastify.post(
    '/api/v1/patient/chronic-refill/order',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const body = request.body as ChronicRefillOrderRequest;
      const order = chronicRefillPredictorService.createRefillOrder(body);
      return {
        success: true,
        data: order
      };
    }
  );

  /**
   * GET /api/v1/patient/household-health-score/:householdId
   * Retrieves composite household wellness scorecard (0-100).
   */
  fastify.get(
    '/api/v1/patient/household-health-score/:householdId',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const { householdId } = request.params as { householdId: string };
      const scorecard = chronicRefillPredictorService.getHouseholdHealthScore(householdId);
      return {
        success: true,
        data: scorecard
      };
    }
  );
};
