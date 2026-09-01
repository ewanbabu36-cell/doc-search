import type { FastifyPluginAsync } from 'fastify';
import {
  UploadDocumentRequestSchema,
  VerifyDocumentRequestSchema
} from '@docsearch/api-contracts';
import { documentVerificationRepository } from '../../repositories/core/DocumentVerificationRepository.js';

export const documentVerificationRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. GET /api/v1/compliance/documents/requirements
  fastify.get('/requirements', async (request, reply) => {
    const query = request.query as any;
    const requirements = documentVerificationRepository.getRequirements({
      entityType: query.entityType,
      role: query.role,
      facilityType: query.facilityType,
      professionalType: query.professionalType,
      tenantId: query.tenantId || '11111111-1111-4111-8111-111111111111',
      ownerEntityId: query.ownerEntityId || query.tenantId || '11111111-1111-4111-8111-111111111111',
      specialization: query.specialization,
      nabhClaimed: query.nabhClaimed === 'true'
    });

    return reply.status(200).send({
      success: true,
      data: requirements
    });
  });

  // 2. POST /api/v1/compliance/documents/upload
  fastify.post('/upload', async (request, reply) => {
    const body = UploadDocumentRequestSchema.parse(request.body);
    const actor = {
      id: (request.headers['x-user-id'] as string) || '99999999-9999-4999-8999-999999999999',
      email: (request.headers['x-user-email'] as string) || 'staff@tatapathology.com',
      tenantId: (request.headers['x-tenant-id'] as string) || '11111111-1111-4111-8111-111111111111'
    };

    const doc = documentVerificationRepository.uploadDocument(body, actor);
    return reply.status(201).send({
      success: true,
      data: doc,
      message: 'Document uploaded successfully and queued for Company Admin verification.'
    });
  });

  // 3. POST /api/v1/compliance/documents/:id/verify
  fastify.post('/:id/verify', async (request, reply) => {
    const params = request.params as { id: string };
    const body = VerifyDocumentRequestSchema.parse(request.body);
    const verifier = {
      id: (request.headers['x-user-id'] as string) || '11111111-1111-4111-8111-000000000001',
      email: (request.headers['x-user-email'] as string) || 'compliance@docsearch.health'
    };

    const doc = documentVerificationRepository.verifyDocument(params.id, body, verifier);
    return reply.status(200).send({
      success: true,
      data: doc,
      message: `Document status updated to ${doc.verificationStatus}.`
    });
  });

  // 4. GET /api/v1/compliance/documents/verification-queue
  fastify.get('/verification-queue', async (request, reply) => {
    const query = request.query as any;
    const queue = documentVerificationRepository.getVerificationQueue(query);
    return reply.status(200).send({
      success: true,
      data: queue
    });
  });
};
