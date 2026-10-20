/**
 * DOC SEARCH - Catalog Synchronization Fastify Routes
 *
 * Exposes:
 * - GET  /api/v1/partner/catalog/sync
 *   Returns versioned formulary & investigation catalog with checksum and upToDate detection.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../plugins/auth-guard.js';
import { catalogSyncService } from '../../services/partner/CatalogSyncService.js';
import { distributedCache } from '../../services/cache/DistributedCacheService.js';

const CatalogSyncQuerySchema = z.object({
  version: z.coerce.number().int().optional(),
  since: z.string().optional()
});

export const catalogSyncRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/api/v1/partner/catalog/sync',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const query = CatalogSyncQuerySchema.parse(request.query || {});
      const cacheKey = `docsearch:cache:${request.session.tenantId}:catalog:sync:${query.version || 0}:${query.since || 'none'}`;

      const syncResult = await distributedCache.getOrSet(
        cacheKey,
        () => catalogSyncService.getCatalogSyncPayload(request.session, query.version, query.since),
        300 // 5-minute cache for heavy static catalogs
      );

      return reply.send({
        success: true,
        data: syncResult
      });
    }
  );
};
