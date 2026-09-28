import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import { businessHistoryService, type HistoryAction } from '../../services/partner/BusinessHistoryService.js';

export const GetBusinessHistoryQuerySchema = z.object({
  action: z.enum(['read', 'print', 'export', 'share']).optional().default('read'),
  format: z.enum(['json', 'summary']).optional().default('json'),
  includeAuditTrail: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional().default(true))
});

export const businessHistoryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('OPERATIONS'));

  // GET /api/v1/partner/business-history/:entityType/:entityId
  fastify.get(
    '/api/v1/partner/business-history/:entityType/:entityId',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { entityType, entityId } = request.params as { entityType: string; entityId: string };
      const parsed = GetBusinessHistoryQuerySchema.safeParse(request.query || {});
      if (!parsed.success) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues.map((i) => i.message).join('; ')
          }
        };
      }

      const { action, format, includeAuditTrail } = parsed.data;

      const history = await businessHistoryService.getEntityHistory(
        entityType,
        entityId,
        request.session,
        {
          action: action as HistoryAction,
          format,
          includeAuditTrail
        }
      );

      return history;
    }
  );

  // Alias convenience route: GET /api/v1/partner/clinical/history/:entityType/:entityId
  fastify.get(
    '/api/v1/partner/clinical/history/:entityType/:entityId',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { entityType, entityId } = request.params as { entityType: string; entityId: string };
      const parsed = GetBusinessHistoryQuerySchema.safeParse(request.query || {});
      if (!parsed.success) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues.map((i) => i.message).join('; ')
          }
        };
      }

      const { action, format, includeAuditTrail } = parsed.data;

      const history = await businessHistoryService.getEntityHistory(
        entityType,
        entityId,
        request.session,
        {
          action: action as HistoryAction,
          format,
          includeAuditTrail
        }
      );

      return history;
    }
  );
};
