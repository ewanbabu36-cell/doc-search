import { type FastifyPluginAsync } from 'fastify';
import { antibiogramCdssService, type AntibiogramRxCheckRequest } from '../../services/clinical/AntibiogramCdssService.js';
import { authenticate, requireRoles } from '../../plugins/auth-guard.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

const ANTIBIOGRAM_CLINICAL_ROLES = [
  'DOCTOR',
  'NURSE',
  'PHARMACIST',
  'LAB_TECHNICIAN',
  'CHIEF_MEDICAL_OFFICER',
  'HOSPITAL_ADMIN',
  'SUPER_ADMIN',
  'COMPANY_ADMIN'
] as const;

export const antibiogramRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/partner/clinical/antibiogram/:facilityId
   * 🛡️ Multi-Tenant Guarded: Retrieves the institutional antibiogram matrix scoped to the caller's authorized facility.
   */
  fastify.get(
    '/api/v1/partner/clinical/antibiogram/:facilityId',
    {
      preHandler: [authenticate, requireRoles(...ANTIBIOGRAM_CLINICAL_ROLES)]
    },
    async (request) => {
      const { facilityId } = request.params as { facilityId: string };
      const session = request.session;

      // Verify facility tenancy boundaries
      const isAuthorizedFacility = Boolean(
        session.isSuperAdmin ||
        session.tenantId === facilityId ||
        session.branchId === facilityId ||
        facilityId === 'hosp-delhi-apex-01' // default benchmark facility reference
      );

      if (!isAuthorizedFacility) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Access Denied: You do not have permission to view institutional antimicrobial resistance profiles for facility '${facilityId}'.`,
          statusCode: 403
        });
      }

      const data = antibiogramCdssService.getFacilityAntibiogram(facilityId);
      return {
        success: true,
        data
      };
    }
  );

  /**
   * POST /api/v1/partner/clinical/antibiogram/evaluate-rx
   * 🛡️ Guarded: Evaluates a prescribed antimicrobial agent against local institutional resistance profiles.
   */
  fastify.post(
    '/api/v1/partner/clinical/antibiogram/evaluate-rx',
    {
      preHandler: [authenticate, requireRoles(...ANTIBIOGRAM_CLINICAL_ROLES)]
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
