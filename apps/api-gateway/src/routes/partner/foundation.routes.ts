import { type FastifyPluginAsync } from 'fastify';
import { partnerFoundationService } from '../../services/partner/PartnerFoundationService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { type CreatePartnerData } from '../../repositories/partner/PartnerFoundationRepository.js';

export const partnerFoundationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/partner/foundation/overview',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const overview = await partnerFoundationService.getOverview(request.session);
      return { success: true, data: overview };
    }
  );

  fastify.get(
    '/api/v1/partner/foundation/partners',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const partners = await partnerFoundationService.getPartners(request.session);
      return { success: true, data: partners };
    }
  );

  fastify.post(
    '/api/v1/partner/foundation/partners',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreatePartnerData, 'tenantId'>;
      const created = await partnerFoundationService.createPartner(payload, request.session);
      reply.status(201);
      return { success: true, data: created };
    }
  );
};
