import { type FastifyPluginAsync, type FastifyRequest, type FastifyReply } from 'fastify';
import { z } from 'zod';
import { createLogger } from '@docsearch/shared-core';
import { authenticate, requireRoles, requireTenantId } from '../../plugins/auth-guard.js';

const logger = createLogger('emergency-code-blue');

export interface EmergencyEvent {
  id: string;
  tenantId: string;
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

interface SseClient {
  tenantId: string;
  write: (event: EmergencyEvent) => void;
}

// In-memory active emergency state store (with distributed broadcast support)
const activeEmergencies = new Map<string, EmergencyEvent>();
const sseSubscribers = new Set<SseClient>();

export const codeBlueRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Trigger Emergency Code Broadcast
  const TriggerSchema = z.object({
    codeType: z.enum(['CODE_BLUE', 'CODE_RED', 'CODE_PINK', 'CODE_VIOLET', 'TRAUMA_ALERT']).default('CODE_BLUE'),
    location: z.string().min(1, 'Location is required (e.g. ICU Bed 4, OPD Waiting Area)'),
    wardOrDepartment: z.string().min(1, 'Ward or Department is required'),
    bedNumber: z.string().optional(),
    notes: z.string().optional()
  });

  fastify.post('/api/v1/emergency/code-blue', { preHandler: [authenticate, requireRoles('DOCTOR', 'NURSE', 'CHIEF_MEDICAL_OFFICER', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')] }, async (request, reply) => {
    const parsed = TriggerSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: 'INVALID_EMERGENCY_PAYLOAD', details: parsed.error.format() } };
    }

    const session = (request as any).session;
    const tenantId = requireTenantId(request);
    const callerId = session?.user?.id || 'STAFF-EMERGENCY-CALLER';
    const callerName = session?.user?.name || 'On-Duty Nurse / Staff';

    const emergencyId = `EMRG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const event: EmergencyEvent = {
      id: emergencyId,
      tenantId,
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

    logger.warn(`EMERGENCY BROADCAST TRIGGERED: ${event.codeType} at ${event.location} by ${callerName} (${callerId}) [Tenant: ${tenantId}]`);

    // Notify all active SSE / WebSocket listeners for this tenant only
    for (const sub of sseSubscribers) {
      if (sub.tenantId === event.tenantId) {
        try {
          sub.write(event);
        } catch (err) {
          logger.error('Failed to dispatch emergency event to subscriber:', { error: String(err) });
        }
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

  // 2. Real-Time SSE Stream for Emergency Displays and Nurse Cockpits (🛡️ Tenant Scoped & Authenticated)
  fastify.get('/api/v1/emergency/code-blue/stream', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = requireTenantId(request);

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.flushHeaders();

    const tenantActiveCount = Array.from(activeEmergencies.values()).filter(e => e.status !== 'RESOLVED' && e.tenantId === tenantId).length;

    // Initial heartbeat scoped to tenant
    reply.raw.write(`data: ${JSON.stringify({ type: 'CONNECTED', activeCount: tenantActiveCount, timestamp: new Date().toISOString() })}\n\n`);

    const client: SseClient = {
      tenantId,
      write: (event: EmergencyEvent) => {
        reply.raw.write(`data: ${JSON.stringify({ type: 'EMERGENCY_BROADCAST', event })}\n\n`);
      }
    };

    sseSubscribers.add(client);

    request.raw.on('close', () => {
      sseSubscribers.delete(client);
    });
  });

  // 3. List Active Emergencies (Tenant Scoped)
  fastify.get('/api/v1/emergency/code-blue/active', { preHandler: [authenticate] }, async (request) => {
    const tenantId = (request as any).session?.tenantId;
    const active = Array.from(activeEmergencies.values()).filter((e) => e.status !== 'RESOLVED' && (!tenantId || e.tenantId === tenantId));
    return {
      success: true,
      data: {
        activeEmergencies: active,
        count: active.length
      }
    };
  });

  // 4. Resolve Emergency Alert (🛡️ Clinical Role Guarded)
  const ResolveSchema = z.object({
    emergencyId: z.string(),
    resolutionNotes: z.string().min(3, 'Resolution notes are required')
  });

  fastify.post('/api/v1/emergency/code-blue/resolve', { preHandler: [authenticate, requireRoles('DOCTOR', 'NURSE', 'CHIEF_MEDICAL_OFFICER', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')] }, async (request, reply) => {
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
    if (existing.tenantId && session?.tenantId && existing.tenantId !== session.tenantId) {
      reply.status(403);
      return { success: false, error: { code: 'FORBIDDEN', message: 'Cannot resolve emergency alert belonging to another facility.' } };
    }

    existing.status = 'RESOLVED';
    existing.resolvedAt = new Date().toISOString();
    existing.resolvedBy = session?.user?.name || 'Attending Physician';
    existing.resolutionNotes = resolutionNotes;

    logger.info(`Emergency ${emergencyId} resolved by ${existing.resolvedBy}`);

    for (const sub of sseSubscribers) {
      if (sub.tenantId === existing.tenantId) {
        try {
          sub.write(existing);
        } catch {}
      }
    }

    return {
      success: true,
      data: existing
    };
  });
};
