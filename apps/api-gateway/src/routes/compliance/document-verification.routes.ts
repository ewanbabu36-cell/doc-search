import type { FastifyPluginAsync } from 'fastify';
import {
  UploadDocumentRequestSchema,
  VerifyDocumentRequestSchema
} from '@docsearch/api-contracts';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  documentVerificationRepository,
  ensureUuid
} from '../../repositories/core/DocumentVerificationRepository.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

function isAuthorizedHqComplianceCaller(session: any): boolean {
  if (!session) return false;
  const roles: string[] = Array.isArray(session.roles) ? session.roles : [];
  return (
    Boolean(session.isSuperAdmin) ||
    roles.includes('SUPER_ADMIN') ||
    roles.includes('COMPANY_ADMIN') ||
    roles.includes('COMPLIANCE_OFFICER')
  );
}

export const documentVerificationRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. GET /api/v1/compliance/documents/requirements
  fastify.get(
    '/requirements',
    {
      preHandler: [authenticate, requirePermission('compliance:documents', 'read')]
    },
    async (request, reply) => {
      const query = request.query as any;
      const isHq = isAuthorizedHqComplianceCaller(request.session);

      if (!isHq && query?.tenantId && ensureUuid(query.tenantId) !== ensureUuid(request.session.tenantId)) {
        throw AppError.forbidden('Access denied: Cannot query compliance requirements for another tenant');
      }

      const effectiveTenantId = isHq && query?.tenantId ? query.tenantId : request.session.tenantId;
      if (!effectiveTenantId) {
        throw AppError.forbidden('Tenant context required for compliance document requirements');
      }

      const requirements = await documentVerificationRepository.getRequirements({
        entityType: query?.entityType,
        role: query?.role,
        facilityType: query?.facilityType,
        professionalType: query?.professionalType,
        tenantId: effectiveTenantId,
        ownerEntityId: query?.ownerEntityId || effectiveTenantId,
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
      const rawBody = (request.body || {}) as Record<string, any>;
      if (
        !isAuthorizedHqComplianceCaller(request.session) &&
        rawBody['tenantId'] &&
        ensureUuid(String(rawBody['tenantId'])) !== ensureUuid(request.session.tenantId)
      ) {
        throw AppError.forbidden('Access denied: Cannot upload compliance document into another tenant');
      }

      const effectiveTenantId =
        isAuthorizedHqComplianceCaller(request.session) && rawBody['tenantId']
          ? String(rawBody['tenantId'])
          : request.session.tenantId;

      const rawBinaryInput =
        rawBody['fileBase64'] ??
        rawBody['fileContentBase64'] ??
        rawBody['contentBase64'] ??
        rawBody['dataUrl'];

      const normalizedUploadBody = {
        ...rawBody,
        ownerEntityId: ensureUuid(
          String(rawBody['ownerEntityId'] || effectiveTenantId || request.session.userId)
        ),
        ownerEntityType: rawBody['ownerEntityType'] || 'TENANT',
        fileBase64: typeof rawBinaryInput === 'string' ? rawBinaryInput : undefined
      };

      const parsed = UploadDocumentRequestSchema.safeParse(normalizedUploadBody);
      if (!parsed.success) {
        throw new AppError({
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
          code: ErrorCode.BAD_REQUEST,
          statusCode: 400
        });
      }

      const body = {
        ...parsed.data,
        fileSizeBytes: rawBody['fileSizeBytes'],
        fileBase64: rawBody['fileBase64'],
        fileContentBase64: rawBody['fileContentBase64'] ?? rawBody['fileBase64'],
        contentBase64: rawBody['contentBase64'],
        dataUrl: rawBody['dataUrl']
      };

      const actor = {
        id: request.session.userId,
        email: request.session.actorEmail || (request.session as any).email || 'staff@tatapathology.com',
        tenantId: effectiveTenantId
      };

      const doc = await documentVerificationRepository.uploadDocument(body as any, actor);
      return reply.status(201).send({
        success: true,
        data: {
          ...doc,
          ocrStatus: (doc.metadata as any)?.ocrStatus || 'NOT_PROCESSED'
        },
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
      if (!isAuthorizedHqComplianceCaller(request.session)) {
        throw new AppError({
          message: 'Access denied: Only authorized HQ Compliance Officers, Company Admins, or Super Admins may verify statutory compliance documents.',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }

      const params = request.params as { id: string };
      const rawBody = (request.body || {}) as Record<string, any>;
      const mappedAction =
        rawBody['action'] ||
        (rawBody['status'] === 'VERIFIED'
          ? 'VERIFY'
          : rawBody['status'] === 'REJECTED'
          ? 'REJECT'
          : rawBody['status'] === 'REQUEST_REUPLOAD'
          ? 'REQUEST_REUPLOAD'
          : undefined);

      const normalizedVerifyBody = {
        ...rawBody,
        action: mappedAction,
        reason: rawBody['reason'] || rawBody['notes'] || rawBody['comments']
      };

      const body = VerifyDocumentRequestSchema.parse(normalizedVerifyBody);
      const verifier = {
        id: request.session.userId,
        email: request.session.actorEmail || (request.session as any).email || 'compliance@docsearch.health',
        roles: request.session.roles as string[],
        isSuperAdmin: request.session.isSuperAdmin,
        tenantId: request.session.tenantId,
        dataScope: request.session.dataScope
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
      const query = (request.query || {}) as Record<string, any>;
      const queue = await documentVerificationRepository.getVerificationQueue(query, {
        userId: request.session.userId,
        tenantId: request.session.tenantId,
        roles: request.session.roles as string[],
        isSuperAdmin: request.session.isSuperAdmin,
        dataScope: request.session.dataScope
      });
      return reply.status(200).send({
        success: true,
        data: queue
      });
    }
  );

  // 5. GET /api/v1/compliance/documents/:id (Authenticated & Tenant-Isolated Metadata Lookup)
  fastify.get(
    '/:id',
    {
      preHandler: [authenticate, requirePermission('compliance:documents', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const doc = await documentVerificationRepository.getDocumentById(id, {
        userId: request.session.userId,
        tenantId: request.session.tenantId,
        roles: request.session.roles as string[],
        isSuperAdmin: request.session.isSuperAdmin
      });
      if (!doc) {
        throw AppError.notFound(`Document ${id} not found`);
      }
      return reply.status(200).send({
        success: true,
        data: doc
      });
    }
  );

  // 6. GET /api/v1/compliance/documents/:id/download (Authenticated & Tenant-Isolated Binary Retrieval)
  fastify.get(
    '/:id/download',
    {
      preHandler: [authenticate, requirePermission('compliance:documents', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await documentVerificationRepository.downloadDocumentBinary(id, {
        userId: request.session.userId,
        email: request.session.actorEmail || 'user@docsearch.health',
        tenantId: request.session.tenantId,
        roles: request.session.roles as string[],
        isSuperAdmin: request.session.isSuperAdmin
      });

      reply.header('Content-Type', result.mimeType);
      reply.header('Content-Disposition', `attachment; filename="${result.fileName}"`);
      reply.header('X-Document-SHA256', result.sha256Hash);
      reply.header('X-Content-SHA256', result.sha256Hash);
      return reply.status(200).send(result.buffer);
    }
  );

  // 7. POST /api/v1/compliance/documents/:id/revoke (Revoke / Delete Document Lifecycle)
  fastify.post(
    '/:id/revoke',
    {
      preHandler: [authenticate, requirePermission('compliance:documents', 'manage')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as { reason?: string };
      const revoked = await documentVerificationRepository.revokeDocument(
        id,
        {
          userId: request.session.userId,
          email: request.session.actorEmail || 'actor@docsearch.health',
          tenantId: request.session.tenantId,
          roles: request.session.roles as string[],
          isSuperAdmin: request.session.isSuperAdmin
        },
        body?.reason
      );
      return reply.status(200).send({
        success: true,
        data: revoked,
        message: 'Document has been revoked.'
      });
    }
  );

  // 8. Block direct guessed storage key access (/api/v1/compliance/documents/storage/*)
  fastify.get(
    '/storage/*',
    async () => {
      throw new AppError({
        message: 'Direct storage key access is forbidden. Use authenticated /api/v1/compliance/documents/:id/download.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  );
};

