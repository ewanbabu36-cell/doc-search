import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDatabase, getDatabaseStatus } from '@docsearch/database';
import { distributedCache } from '../services/cache/DistributedCacheService.js';
import { horizontalSocketGateway } from '../services/realtime/HorizontalSocketGateway.js';

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance): Promise<void> => {
  // Liveness Probe (process is alive)
  const healthHandler = async (_req: any, reply: any) => {
    const status = getDatabaseStatus();
    return reply.status(200).send({
      status: 'healthy',
      service: 'docsearch-api-gateway',
      database: {
        ready: status.ready,
        mode: status.mode,
        tables: 442
      },
      cache: distributedCache.getStats(),
      cluster: horizontalSocketGateway.getTelemetry(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // Dedicated Cache Telemetry Probe
  app.get('/api/v1/health/cache', async (_req, reply) => {
    return reply.status(200).send({
      success: true,
      data: distributedCache.getStats(),
      timestamp: new Date().toISOString()
    });
  });

  // Dedicated Realtime Cluster Pub/Sub Probe
  app.get('/api/v1/health/cluster', async (_req, reply) => {
    return reply.status(200).send({
      success: true,
      data: horizontalSocketGateway.getTelemetry(),
      timestamp: new Date().toISOString()
    });
  });

  // True Readiness Probe (verifies PostgreSQL database connectivity)
  app.get('/ready', async (_req, reply) => {
    try {
      const db = getDatabase();
      if (!db) {
        return reply.status(503).send({
          status: 'not_ready',
          database: 'uninitialized',
          error: 'Database instance not initialized',
          timestamp: new Date().toISOString()
        });
      }
      await db.execute('SELECT 1;');
      const status = getDatabaseStatus();
      return reply.status(200).send({
        status: 'ready',
        database: 'connected',
        mode: status.mode,
        tables: 442,
        timestamp: new Date().toISOString()
      });
    } catch (err: unknown) {
      return reply.status(503).send({
        status: 'not_ready',
        database: 'disconnected',
        error: 'Database connection check failed: ' + ((err as any)?.message || String(err)),
        timestamp: new Date().toISOString()
      });
    }
  });
};
