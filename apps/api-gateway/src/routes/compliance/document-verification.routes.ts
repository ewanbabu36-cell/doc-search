import type { FastifyPluginAsync } from 'fastify';
import {
  UploadDocumentRequestSchema,
  VerifyDocumentRequestSchema
} from '@docsearch/api-contracts';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { documentVerificationRepository } from '../../repositories/core/DocumentVerificationRepository.js';

export const documentVerificationRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. GET /api/v1/compliance/documents/requirements
  fastify.get(
    '/requirements',
    {
      preHandler: [authenticate, requirePermission('compliance:documents', 'read')]
    },
    async (request, reply) => {
      const query = request.query as any;
      const requirements = await documentVerificationRepository.getRequirements({
        entityType: query?.entityType,
        role: query?.role,
        facilityType: query?.facilityType,
        professionalType: query?.professionalType,
        tenantId: request.session.tenantId,
        ownerEntityId: query?.ownerEntityId || request.session.tenantId,
        specialization: query?.specialization,
        nabhClaimed: query?.nabhClaimed === 'true'
      });

      return reply.status(200).send({
        success: true,
        data: requirements
      });
    }
  );

  // 2. POST /api/v1/compliance/documents/upload
  fastify.post(
    '/upload',
    {
      preHandler: [authenticate, requirePermission('compliance:documents', 'create')]
    },
    async (request, reply) => {
      const body = UploadDocumentRequestSchema.parse(request.body);
      const actor = {
        id: request.session.userId,
        email: request.session.actorEmail || 'staff@tatapathology.com',
        tenantId: request.session.tenantId
      };

      const doc = await documentVerificationRepository.uploadDocument(body, actor);
      return reply.status(201).send({
        success: true,
        data: doc,
        message: 'Document uploaded successfully and queued for Company Admin verification.'
      });
    }
  );

  // 3. POST /api/v1/compliance/documents/:id/verify
  fastify.post(
    '/:id/verify',
    {
      preHandler: [authenticate, requirePermission('compliance:documents', 'manage')]
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = VerifyDocumentRequestSchema.parse(request.body);
      const verifier = {
        id: request.session.userId,
        email: request.session.actorEmail || 'compliance@docsearch.health'
      };

      const doc = await documentVerificationRepository.verifyDocument(params.id, body, verifier);
      return reply.status(200).send({
        success: true,
        data: doc,
        message: `Document status updated to ${doc.verificationStatus}.`
      });
    }
  );

  // 4. GET /api/v1/compliance/documents/verification-queue
  fastify.get(
    '/verification-queue',
    {
      preHandler: [authenticate, requirePermission('compliance:documents', 'read')]
    },
    async (request, reply) => {
      const query = request.query as any;
      const queue = await documentVerificationRepository.getVerificationQueue(query);
      return reply.status(200).send({
        success: true,
        data: queue
      });
    }
  );
};
