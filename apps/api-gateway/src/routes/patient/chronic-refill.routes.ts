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
    async (request, reply) => {
      const { patientId } = request.params as { patientId: string };
      const session = (request as any).session;
      if (session?.roles?.includes('PATIENT')) {
        const callerPatientId = session.patientId || session.userId;
        if (callerPatientId && callerPatientId !== patientId) {
          return reply.status(403).send({
            success: false,
            error: 'FORBIDDEN',
            message: 'Access denied: You are not authorized to view another patient prescription refill status.'
          });
        }
      }
      const data = chronicRefillPredictorService.getChronicRefillStatus(patientId);
      return {
        success: true,
        data
      };
    }
  );

  /**
   * GET /api/v1/patient-mobile/chronic-refill/status/:patientId (🛡️ Authenticated & BOLA Protected)
   */
  fastify.get(
    '/api/v1/patient-mobile/chronic-refill/status/:patientId',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { patientId } = request.params as { patientId: string };
      const session = (request as any).session;
      if (session?.roles?.includes('PATIENT')) {
        const callerPatientId = session.patientId || session.userId;
        if (callerPatientId && callerPatientId !== patientId) {
          return reply.status(403).send({
            success: false,
            error: 'FORBIDDEN',
            message: 'Access denied: You are not authorized to view another patient prescription refill status.'
          });
        }
      }
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
    async (request, reply) => {
      const body = request.body as ChronicRefillOrderRequest;
      const session = (request as any).session;
      if (session?.roles?.includes('PATIENT')) {
        const callerPatientId = session.patientId || session.userId;
        if (callerPatientId && body.patientId && callerPatientId !== body.patientId) {
          return reply.status(403).send({
            success: false,
            error: 'FORBIDDEN',
            message: 'Access denied: You cannot order prescription refills for another patient.'
          });
        }
      }
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
