/**
 * DOC SEARCH API Gateway - Granular CRDT Sync Routes
 *
 * Exposes atomic, field-level conflict-free synchronization endpoints for
 * resilient multi-counter hospital workflows.
 */

import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { enforceIdempotency } from '../../plugins/idempotency.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import { granularSyncService, type GranularDeltaInput } from '../../services/partner/GranularSyncService.js';

export const GranularDeltaItemSchema = z.object({
  deltaId: z.string().trim().min(1, 'deltaId is required'),
  entityType: z.enum(['PATIENT', 'ENCOUNTER', 'CONSULTATION']),
  entityId: z.string().trim().min(1, 'entityId is required'),
  patientId: z.string().trim().min(1, 'patientId is required'),
  encounterId: z.string().trim().optional(),
  deltaType: z.enum(['DEMOGRAPHICS', 'VITALS', 'CLINICAL_NOTES', 'PRESCRIPTIONS']),
  clientTimestamp: z.string().trim().min(1, 'clientTimestamp is required'),
  lamportClock: z.number().int().optional(),
  actorId: z.string().trim().optional(),
  actorRole: z.string().trim().optional(),
  data: z.record(z.any())
});

export const GranularMergeBatchSchema = z.object({
  deltas: z.array(GranularDeltaItemSchema).min(1, 'At least one delta is required')
});

export const granularSyncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('CLINICAL_EMR'));

  // POST /api/v1/partner/clinical/sync/granular-merge
  fastify.post(
    '/api/v1/partner/clinical/sync/granular-merge',
    {
      preHandler: [
        authenticate,
        requirePermission('clinical:consultations', 'create'),
        enforceIdempotency
      ]
    },
    async (request, reply) => {
      const parsed = GranularMergeBatchSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid granular delta payload',
            details: parsed.error.issues
          }
        };
      }

      const result = await granularSyncService.processGranularDeltas(
        parsed.data.deltas as GranularDeltaInput[],
        request.session
      );

      reply.status(200);
      return result;
    }
  );
};
