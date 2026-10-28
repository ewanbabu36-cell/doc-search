import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'node:crypto';

export interface WiretapEvent {
  id: string;
  timestamp: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  method: string;
  url: string;
  statusCode?: number | undefined;
  isSnoopSuspicious?: boolean | undefined;
  patientId?: string | undefined;
  anomalyScore?: number | undefined;
}

// In-memory ring buffer of the latest 200 live wiretap packet events
export const wiretapRingBuffer: WiretapEvent[] = [];

export function pushWiretapEvent(event: WiretapEvent) {
  wiretapRingBuffer.unshift(event);
  if (wiretapRingBuffer.length > 200) {
    wiretapRingBuffer.pop();
  }
}

export const phiWiretapPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const session = (request as any).session;
      const url = request.url;
      const tenantId = session?.tenantId || (request.headers['x-tenant-id'] as string) || '6855be07-5298-4148-a571-c51ac49ac7f3';
      const actorId = session?.userId || 'ANONYMOUS_STAFF';
      const actorName = session?.name || 'Staff User';
      const actorRole = session?.roles?.[0] || 'RECEPTIONIST';

      // Detect patient profile/chart reads
      const isPatientRead = url.includes('/patients') || url.includes('/encounters') || url.includes('/chart');
      const patientIdMatch = url.match(/patients\/([a-zA-Z0-9_-]+)/);
      const patientId = patientIdMatch ? patientIdMatch[1] : undefined;

      const isSnoopSuspicious = Boolean(
        isPatientRead &&
        (String(actorRole).toUpperCase().includes('RECEPTION') || String(actorRole).toUpperCase().includes('CASHIER'))
      );

      const event: WiretapEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        tenantId,
        actorId,
        actorName,
        actorRole,
        method: request.method,
        url,
        statusCode: reply.statusCode,
        isSnoopSuspicious,
        patientId,
        anomalyScore: isSnoopSuspicious ? 94 : 12
      };

      pushWiretapEvent(event);
    } catch {
      // Non-blocking telemetry
    }
  });
};
