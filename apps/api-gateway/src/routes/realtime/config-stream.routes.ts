import { type FastifyPluginAsync } from 'fastify';
import { horizontalSocketGateway } from '../../services/realtime/HorizontalSocketGateway.js';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('config-stream-routes');

export const configStreamRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/realtime/config-stream', async (request, reply) => {
    const query = (request.query || {}) as { tenantId?: string; clientId?: string };
    const tenantId = query.tenantId || (request as any).session?.tenantId || '*';
    const clientId = query.clientId || `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });

    if (reply.raw.flushHeaders) {
      reply.raw.flushHeaders();
    }

    logger.info(`[CONFIG_STREAM] Client ${clientId} subscribed to config-stream (tenant: ${tenantId})`);

    // Send initial handshake
    reply.raw.write(
      `event: connected\ndata: ${JSON.stringify({
        status: 'CONNECTED',
        clientId,
        tenantId,
        timestamp: new Date().toISOString()
      })}\n\n`
    );

    // Keepalive ping every 15s
    const pingInterval = setInterval(() => {
      try {
        reply.raw.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        clearInterval(pingInterval);
      }
    }, 15000);

    // Subscribe to horizontal pubsub for PARTNER_CONFIG_MUTATED
    const unsubscribe = horizontalSocketGateway.subscribe(
      tenantId,
      'PARTNER_CONFIG_MUTATED',
      (event) => {
        try {
          reply.raw.write(
            `event: config_mutation\ndata: ${JSON.stringify(event.payload)}\n\n`
          );
        } catch (err: any) {
          logger.warn(`[CONFIG_STREAM] Failed to write SSE message to ${clientId}: ${err?.message}`);
        }
      }
    );

    request.raw.on('close', () => {
      clearInterval(pingInterval);
      unsubscribe();
      logger.info(`[CONFIG_STREAM] Client ${clientId} disconnected from config-stream`);
    });
  });
};
