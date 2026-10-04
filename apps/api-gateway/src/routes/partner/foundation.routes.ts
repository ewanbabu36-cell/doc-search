import { type FastifyPluginAsync } from 'fastify';
import { partnerFoundationService } from '../../services/partner/PartnerFoundationService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import { type CreatePartnerData } from '../../repositories/partner/PartnerFoundationRepository.js';

export const partnerFoundationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('OPERATIONS'));

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

  fastify.get(
    '/api/v1/partner/foundation/organizations',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as { partnerId?: string };
      const organizations = await partnerFoundationService.getOrganizations(request.session, query?.partnerId);
      return { success: true, data: organizations };
    }
  );

  fastify.get(
    '/api/v1/partner/foundation/facilities',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as { partnerId?: string; organizationId?: string };
      const facilities = await partnerFoundationService.getFacilities(request.session, query?.partnerId, query?.organizationId);
      return { success: true, data: facilities };
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
