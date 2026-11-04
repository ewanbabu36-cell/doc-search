import { type FastifyPluginAsync } from 'fastify';
import { sepsisDeteriorationSentinelService, type SepsisAssessmentRequest } from '../../services/clinical/SepsisDeteriorationSentinelService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const clinicalSentinelRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/v1/partner/clinical/sepsis-assessment
   * Performs real-time qSOFA and PEWS clinical deterioration calculation.
   */
  fastify.post(
    '/api/v1/partner/clinical/sepsis-assessment',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const body = request.body as SepsisAssessmentRequest;
      const evaluation = sepsisDeteriorationSentinelService.evaluatePatientRisk(body);
      return {
        success: true,
        data: evaluation
      };
    }
  );

  /**
   * GET /api/v1/partner/clinical/deterioration-radar/:patientId
   * Retrieves active deterioration radar telemetry for an inpatient/OPD encounter.
   */
  fastify.get(
    '/api/v1/partner/clinical/deterioration-radar/:patientId',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const { patientId } = request.params as { patientId: string };
      const data = sepsisDeteriorationSentinelService.getPatientDeteriorationRadar(patientId);
      return {
        success: true,
        data
      };
    }
  );
};
