import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDatabase, getDatabaseStatus, getDatabasePoolMetrics } from '@docsearch/database';
import { distributedCache } from '../services/cache/DistributedCacheService.js';
import { horizontalSocketGateway } from '../services/realtime/HorizontalSocketGateway.js';
import { circuitBreakerRegistry } from '../services/reliability/CircuitBreakerService.js';

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance): Promise<void> => {
  // Liveness Probe (process is alive & event loop responsive)
  const livenessHandler = async (_req: any, reply: any) => {
    const status = getDatabaseStatus();
    return reply.status(200).send({
      status: 'healthy',
      service: 'docsearch-api-gateway',
      liveness: 'ALIVE',
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

  app.get('/health', livenessHandler);
  app.get('/api/health', livenessHandler);
  app.get('/api/v1/health', livenessHandler);
  app.get('/live', livenessHandler);
  app.get('/livez', livenessHandler);
  app.get('/api/livez', livenessHandler);
  app.get('/api/v1/livez', livenessHandler);

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

  // Dedicated Circuit Breakers Telemetry Probe
  app.get('/api/v1/health/circuit-breakers', async (_req, reply) => {
    return reply.status(200).send({
      success: true,
      data: circuitBreakerRegistry.getAllTelemetry(),
      timestamp: new Date().toISOString()
    });
  });

  // True Readiness Probe (verifies PostgreSQL database connectivity, latency, memory)
  const readyHandler = async (_req: any, reply: any) => {
    const start = Date.now();
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
      const latencyMs = Date.now() - start;
      const status = getDatabaseStatus();
      const mem = process.memoryUsage();

      return reply.status(200).send({
        status: 'ready',
        database: {
          connected: true,
          mode: status.mode,
          latencyMs,
          tables: 442
        },
        memory: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    } catch (err: unknown) {
      return reply.status(503).send({
        status: 'not_ready',
        database: {
          connected: false,
          error: 'Database connection check failed: ' + ((err as any)?.message || String(err))
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  app.get('/ready', readyHandler);
  app.get('/readyz', readyHandler);
  app.get('/api/readyz', readyHandler);
  app.get('/api/v1/readyz', readyHandler);

  // Comprehensive Detailed APM Observability Probe
  app.get('/api/v1/health/detailed', async (_req: any, reply: any) => {
    const start = Date.now();
    let dbConnected = false;
    let dbLatencyMs = -1;
    try {
      const db = getDatabase();
      if (db) {
        await db.execute('SELECT 1;');
        dbConnected = true;
        dbLatencyMs = Date.now() - start;
      }
    } catch {
      dbConnected = false;
    }

    const poolMetrics = getDatabasePoolMetrics();
    const circuits = circuitBreakerRegistry.getAllTelemetry();
    const cacheStats = distributedCache.getStats();
    const clusterTelemetry = horizontalSocketGateway.getTelemetry();
    const mem = process.memoryUsage();

    const allCircuitsHealthy = Object.values(circuits).every(c => c.state !== 'OPEN');
    const isOverallHealthy = dbConnected && allCircuitsHealthy;

    return reply.status(isOverallHealthy ? 200 : 503).send({
      status: isOverallHealthy ? 'HEALTHY' : 'DEGRADED',
      database: {
        connected: dbConnected,
        latencyMs: dbLatencyMs,
        pool: poolMetrics
      },
      circuitBreakers: circuits,
      cache: cacheStats,
      cluster: clusterTelemetry,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
      },
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
};
