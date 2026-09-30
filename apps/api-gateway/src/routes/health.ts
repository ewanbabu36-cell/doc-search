import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDatabase, getDatabaseStatus } from '@docsearch/database';

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
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

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
