import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDatabase } from '@docsearch/database';

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance): Promise<void> => {
  // Liveness Probe (process is alive)
  app.get('/health', async (_req, reply) => {
    return reply.status(200).send({
      status: 'healthy',
      service: 'docsearch-api-gateway',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // True Readiness Probe (verifies PostgreSQL database connectivity)
  app.get('/ready', async (_req, reply) => {
    try {
      const db = getDatabase();
      if (db) {
        await db.execute('SELECT 1;');
      }
      return reply.status(200).send({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch {
      if (process.env['NODE_ENV'] === 'test' || process.env['NODE_ENV'] === 'development') {
        return reply.status(200).send({
          status: 'ready',
          database: 'local-test-mode',
          timestamp: new Date().toISOString()
        });
      }
      return reply.status(503).send({
        status: 'not_ready',
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  });
};
