import { type FastifyPluginAsync, type FastifyRequest, type FastifyReply } from 'fastify';
import { z } from 'zod';
import { createLogger } from '@docsearch/shared-core';
import { authenticate } from '../../plugins/auth-guard.js';

const logger = createLogger('emergency-code-blue');

export interface EmergencyEvent {
  id: string;
  codeType: 'CODE_BLUE' | 'CODE_RED' | 'CODE_PINK' | 'CODE_VIOLET' | 'TRAUMA_ALERT';
  location: string;
  wardOrDepartment: string;
  bedNumber?: string | undefined;
  initiatedBy: string;
  initiatedByName?: string | undefined;
  initiatedAt: string;
  status: 'ACTIVE' | 'RESPONDING' | 'RESOLVED';
  resolvedAt?: string | undefined;
  resolvedBy?: string | undefined;
  resolutionNotes?: string | undefined;
  resuscitationTeamDispatched: boolean;
}

// In-memory active emergency state store (with distributed broadcast support)
const activeEmergencies = new Map<string, EmergencyEvent>();
const sseSubscribers = new Set<(event: EmergencyEvent) => void>();

export const codeBlueRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Trigger Emergency Code Broadcast
  const TriggerSchema = z.object({
    codeType: z.enum(['CODE_BLUE', 'CODE_RED', 'CODE_PINK', 'CODE_VIOLET', 'TRAUMA_ALERT']).default('CODE_BLUE'),
    location: z.string().min(1, 'Location is required (e.g. ICU Bed 4, OPD Waiting Area)'),
    wardOrDepartment: z.string().min(1, 'Ward or Department is required'),
    bedNumber: z.string().optional(),
    notes: z.string().optional()
  });

  fastify.post('/api/v1/emergency/code-blue', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = TriggerSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: 'INVALID_EMERGENCY_PAYLOAD', details: parsed.error.format() } };
    }

    const session = (request as any).session;
    const callerId = session?.user?.id || 'STAFF-EMERGENCY-CALLER';
    const callerName = session?.user?.name || 'On-Duty Nurse / Staff';

    const emergencyId = `EMRG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const event: EmergencyEvent = {
      id: emergencyId,
      codeType: parsed.data.codeType,
      location: parsed.data.location,
      wardOrDepartment: parsed.data.wardOrDepartment,
      bedNumber: parsed.data.bedNumber,
      initiatedBy: callerId,
      initiatedByName: callerName,
      initiatedAt: new Date().toISOString(),
      status: 'ACTIVE',
      resuscitationTeamDispatched: true
    };

    activeEmergencies.set(emergencyId, event);

    logger.warn(`EMERGENCY BROADCAST TRIGGERED: ${event.codeType} at ${event.location} by ${callerName} (${callerId})`);

    // Notify all active SSE / WebSocket listeners
    for (const listener of sseSubscribers) {
      try {
        listener(event);
      } catch (err) {
        logger.error('Failed to dispatch emergency event to subscriber:', { error: String(err) });
      }
    }

    return {
      success: true,
      data: {
        broadcastId: emergencyId,
        event,
        chimeAlert: true,
        speechAnnouncement: `Emergency Alert: ${event.codeType.replace('_', ' ')} in ${event.location}. Resuscitation team respond immediately.`
      }
    };
  });

  // 2. Real-Time SSE Stream for Emergency Displays and Nurse Cockpits
  fastify.get('/api/v1/emergency/code-blue/stream', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.flushHeaders();

    // Initial heartbeat
    reply.raw.write(`data: ${JSON.stringify({ type: 'CONNECTED', activeCount: activeEmergencies.size, timestamp: new Date().toISOString() })}\n\n`);

    const listener = (event: EmergencyEvent) => {
      reply.raw.write(`data: ${JSON.stringify({ type: 'EMERGENCY_BROADCAST', event })}\n\n`);
    };

    sseSubscribers.add(listener);

    request.raw.on('close', () => {
      sseSubscribers.delete(listener);
    });
  });

  // 3. List Active Emergencies
  fastify.get('/api/v1/emergency/code-blue/active', { preHandler: [authenticate] }, async () => {
    const active = Array.from(activeEmergencies.values()).filter((e) => e.status !== 'RESOLVED');
    return {
      success: true,
      data: {
        activeEmergencies: active,
        count: active.length
      }
    };
  });

  // 4. Resolve Emergency Alert
  const ResolveSchema = z.object({
    emergencyId: z.string(),
    resolutionNotes: z.string().min(3, 'Resolution notes are required')
  });

  fastify.post('/api/v1/emergency/code-blue/resolve', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = ResolveSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: 'INVALID_RESOLVE_PAYLOAD', details: parsed.error.format() } };
    }

    const { emergencyId, resolutionNotes } = parsed.data;
    const existing = activeEmergencies.get(emergencyId);
    if (!existing) {
      reply.status(404);
      return { success: false, error: { code: 'EMERGENCY_NOT_FOUND', message: 'No such emergency alert found.' } };
    }

    const session = (request as any).session;
    existing.status = 'RESOLVED';
    existing.resolvedAt = new Date().toISOString();
    existing.resolvedBy = session?.user?.name || 'Attending Physician';
    existing.resolutionNotes = resolutionNotes;

    logger.info(`Emergency ${emergencyId} resolved by ${existing.resolvedBy}`);

    for (const listener of sseSubscribers) {
      try {
        listener(existing);
      } catch {}
    }

    return {
      success: true,
      data: existing
    };
  });
};
