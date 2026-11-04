import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';
import { authenticate } from '../../plugins/auth-guard.js';

const logger = createLogger('hospital-events-hub');

export interface HospitalEventPayload {
  id?: string | undefined;
  type: string;
  timestamp?: string | undefined;
  sourceModule: string;
  data: any;
  summaryText?: string | undefined;
  tenantId?: string | undefined;
  senderId?: string | undefined;
}

interface SseClient {
  id: string;
  tenantId?: string | undefined;
  reply: FastifyReply;
  connectedAt: Date;
}

// Active connected SSE clients
const activeClients = new Map<string, SseClient>();

// Helper to broadcast event to all matching connected clients
export function broadcastHospitalEvent(event: HospitalEventPayload): number {
  const payloadStr = JSON.stringify({
    ...event,
    id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: event.timestamp || new Date().toISOString()
  });

  const formattedSse = `event: ${event.type}\ndata: ${payloadStr}\n\n`;
  const genericSse = `event: hospital-event\ndata: ${payloadStr}\n\n`;

  let sentCount = 0;
  for (const [clientId, client] of activeClients.entries()) {
    try {
      // If tenantId is specified on client and event, isolate tenant
      if (client.tenantId && event.tenantId && client.tenantId !== event.tenantId) {
        continue;
      }
      // If event originated from same client, don't echo back
      if (event.senderId && event.senderId === clientId) {
        continue;
      }
      client.reply.raw.write(formattedSse);
      client.reply.raw.write(genericSse);
      sentCount++;
    } catch {
      logger.warn(`Failed to write SSE event to client ${clientId}, pruning`);
      activeClients.delete(clientId);
    }
  }

  return sentCount;
}

export const hospitalEventsRoutes: FastifyPluginAsync = async (app) => {
  // 1. SSE Stream: Real-Time Broadcast to Clinic Workstations & Displays
  app.get('/api/v1/partner/events/stream', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = request.session;
    const query = (request.query as { tenantId?: string; clientId?: string }) || {};
    const clientId = query.clientId || `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    // Multi-tenant isolation: SuperAdmin may monitor specific or all tenants;
    // other users are strictly restricted to their session tenantId.
    const isSuperAdmin = session?.roles?.some((r: string) => r === 'SUPER_ADMIN' || r === 'FOUNDER');
    let effectiveTenantId = session?.tenantId || 'GLOBAL';
    if (query.tenantId && isSuperAdmin) {
      effectiveTenantId = query.tenantId;
    } else if (query.tenantId && query.tenantId !== session?.tenantId) {
      throw new AppError({
        message: 'Forbidden: Cannot subscribe to events outside your authenticated tenant scope',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

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

    const client: SseClient = {
      id: clientId,
      tenantId: effectiveTenantId,
      reply,
      connectedAt: new Date()
    };

    activeClients.set(clientId, client);

    logger.info(`Workstation ${clientId} connected to Hospital Events SSE Stream (active: ${activeClients.size})`);

    // Send initial handshake
    const handshake = JSON.stringify({
      status: 'CONNECTED',
      clientId,
      tenantId: effectiveTenantId,
      timestamp: new Date().toISOString(),
      activeSubscribers: activeClients.size
    });
    reply.raw.write(`event: connected\ndata: ${handshake}\n\n`);

    // Keepalive ping every 15 seconds
    const pingInterval = setInterval(() => {
      try {
        reply.raw.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        clearInterval(pingInterval);
        activeClients.delete(clientId);
      }
    }, 15000);

    // Clean up when client disconnects
    request.raw.on('close', () => {
      clearInterval(pingInterval);
      activeClients.delete(clientId);
      logger.info(`Workstation ${clientId} disconnected from Hospital Events SSE Stream (remaining: ${activeClients.size})`);
    });

    // Prevent Fastify from automatically closing the response
    return new Promise(() => {});
  });

  // 2. Publish Event Endpoint (Dispatches to active workstations & displays within tenant scope)
  app.post('/api/v1/partner/events/publish', { preHandler: [authenticate] }, async (request, reply) => {
    const session = request.session;
    const body = (request.body as HospitalEventPayload) || {};
    if (!body.type || !body.sourceModule) {
      return reply.status(400).send({
        error: { code: 'INVALID_EVENT', message: 'Event type and sourceModule are required' }
      });
    }

    const isSuperAdmin = session?.roles?.some((r: string) => r === 'SUPER_ADMIN' || r === 'FOUNDER');
    let targetTenantId = session?.tenantId;
    if (body.tenantId && isSuperAdmin) {
      targetTenantId = body.tenantId;
    } else if (body.tenantId && body.tenantId !== session?.tenantId) {
      throw new AppError({
        message: 'Forbidden: Cannot publish events for another tenant',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const eventId = body.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const eventPayload: HospitalEventPayload = {
      id: eventId,
      type: body.type,
      timestamp: body.timestamp || new Date().toISOString(),
      sourceModule: body.sourceModule,
      data: body.data || {},
      summaryText: body.summaryText || `${body.type} from ${body.sourceModule}`,
      tenantId: targetTenantId,
      senderId: body.senderId || session?.userId
    };

    const broadcastCount = broadcastHospitalEvent(eventPayload);

    return reply.status(200).send({
      success: true,
      eventId,
      broadcastCount,
      timestamp: eventPayload.timestamp
    });
  });

  // Alias for POST /api/v1/partner/events
  app.post('/api/v1/partner/events', { preHandler: [authenticate] }, async (request, reply) => {
    const session = request.session;
    const body = (request.body as HospitalEventPayload) || {};
    if (!body.type || !body.sourceModule) {
      return reply.status(400).send({
        error: { code: 'INVALID_EVENT', message: 'Event type and sourceModule are required' }
      });
    }

    const isSuperAdmin = session?.roles?.some((r: string) => r === 'SUPER_ADMIN' || r === 'FOUNDER');
    let targetTenantId = session?.tenantId;
    if (body.tenantId && isSuperAdmin) {
      targetTenantId = body.tenantId;
    } else if (body.tenantId && body.tenantId !== session?.tenantId) {
      throw new AppError({
        message: 'Forbidden: Cannot publish events for another tenant',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const eventId = body.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const eventPayload: HospitalEventPayload = {
      id: eventId,
      type: body.type,
      timestamp: body.timestamp || new Date().toISOString(),
      sourceModule: body.sourceModule,
      data: body.data || {},
      summaryText: body.summaryText || `${body.type} from ${body.sourceModule}`,
      tenantId: targetTenantId,
      senderId: body.senderId || session?.userId
    };

    const broadcastCount = broadcastHospitalEvent(eventPayload);

    return reply.status(200).send({
      success: true,
      eventId,
      broadcastCount,
      timestamp: eventPayload.timestamp
    });
  });

  // 3. Status Diagnostic Endpoint
  app.get('/api/v1/partner/events/status', { preHandler: [authenticate] }, async (request) => {
    const session = request.session;
    const isSuperAdmin = session?.roles?.some((r: string) => r === 'SUPER_ADMIN' || r === 'FOUNDER');
    const filteredClients = Array.from(activeClients.values())
      .filter((c) => isSuperAdmin || (c.tenantId && c.tenantId === session?.tenantId))
      .map((c) => ({
        id: c.id,
        tenantId: c.tenantId || 'GLOBAL',
        connectedAt: c.connectedAt.toISOString()
      }));

    return {
      status: 'OK',
      activeSubscribers: filteredClients.length,
      clients: filteredClients,
      timestamp: new Date().toISOString()
    };
  });
};
