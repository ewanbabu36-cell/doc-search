/**
 * DOC SEARCH API Gateway - Granular CRDT Sync Routes
 *
 * Exposes atomic, field-level conflict-free synchronization endpoints for
 * resilient multi-counter hospital workflows.
 */

import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, requirePermission, requireRoles } from '../../plugins/auth-guard.js';
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
  hlcTimestamp: z.string().trim().optional(),
  nodeId: z.string().trim().optional(),
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
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR', 'NURSE', 'RECEPTIONIST'),
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

      const sanitizedDeltas = (parsed.data.deltas as GranularDeltaInput[]).map((d) => ({
        ...d,
        actorId: request.session.userId
      }));

      const result = await granularSyncService.processGranularDeltas(
        sanitizedDeltas,
        request.session
      );

      reply.status(200);
      return result;
    }
  );

  // GET /api/v1/partner/clinical/sync/snapshot-export
  fastify.get(
    '/api/v1/partner/clinical/sync/snapshot-export',
    {
      preHandler: [
        authenticate,
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR', 'NURSE', 'RECEPTIONIST')
      ]
    },
    async (request, reply) => {
      const snapshot = await granularSyncService.exportBlackoutSnapshot(request.session);
      return reply.status(200).send({ success: true, snapshot });
    }
  );

  // POST /api/v1/partner/clinical/sync/blackout-bundle
  fastify.post(
    '/api/v1/partner/clinical/sync/blackout-bundle',
    {
      preHandler: [
        authenticate,
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR', 'NURSE', 'RECEPTIONIST'),
        enforceIdempotency
      ]
    },
    async (request, reply) => {
      const BlackoutBundleSchema = z.object({
        bundleId: z.string().min(1),
        nodeId: z.string().min(1),
        checksumSha256: z.string().optional(),
        deltas: z.array(GranularDeltaItemSchema).min(1)
      });
      const parsed = BlackoutBundleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid blackout bundle payload', details: parsed.error.issues }
        });
      }

      const result = await granularSyncService.ingestBlackoutBundle(
        {
          bundleId: parsed.data.bundleId,
          nodeId: parsed.data.nodeId,
          ...(parsed.data.checksumSha256 ? { checksumSha256: parsed.data.checksumSha256 } : {}),
          deltas: parsed.data.deltas as GranularDeltaInput[]
        },
        request.session
      );
      return reply.status(200).send(result);
    }
  );
};
