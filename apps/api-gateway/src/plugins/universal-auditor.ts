import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { auditRepository } from '../repositories/core/AuditRepository.js';
import type { SessionContext } from '@docsearch/auth';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('universal-auditor');

const EXCLUDED_PREFIXES = [
  '/api/v1/health',
  '/health',
  '/metrics',
  '/favicon.ico',
  '/api/v1/partner/configuration/validation'
];

function deriveResourceDetails(url: string, method: string) {
  const cleanUrl = url.split('?')[0] || '';
  const parts = cleanUrl.split('/').filter(Boolean);
  
  // Example: ['api', 'v1', 'partner', 'clinical-workflow', 'encounters', '123']
  let domain = 'SYSTEM';
  let resource = 'RECORD';

  if (parts.length >= 3) {
    domain = parts[2]?.toUpperCase() || 'SYSTEM'; // 'PARTNER', 'COMPANY', 'PATIENT', 'PUBLIC'
  }
  if (parts.length >= 4) {
    resource = parts[3]?.toUpperCase().replace(/-/g, '_') || 'RECORD';
  }
  if (parts.length >= 5 && isNaN(Number(parts[4])) && !parts[4]?.match(/^[0-9a-fA-F-]{36}$/)) {
    resource = `${resource}_${parts[4]?.toUpperCase().replace(/-/g, '_')}`;
  }

  const eventType = `API_${domain}_${resource}_${method}`;
  return { eventType, resourceType: resource, domain };
}

export const universalMutationAuditPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only audit state-mutating HTTP methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return;
    }

    const url = request.url || '';
    if (EXCLUDED_PREFIXES.some(prefix => url.startsWith(prefix))) {
      return;
    }

    // Skip if an explicit route handler already recorded the event
    if ((request as any)._auditRecorded) {
      return;
    }

    // Capture caller context
    const session: SessionContext = (request as any).session || {
      userId: (request.headers['x-user-id'] as string) || '00000000-0000-4000-8000-000000000001',
      tenantId: (request.headers['x-tenant-id'] as string) || '11111111-1111-4111-8111-111111111111',
      roles: ['USER'],
      permissions: ['*'],
      isSuperAdmin: false
    };

    const { eventType, resourceType } = deriveResourceDetails(url, request.method);
    const ipAddress = request.ip || (request.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = (request.headers['user-agent'] as string) || 'API Client';

    // Fire-and-forget asynchronous audit persistence (Zero latency impact on HTTP roundtrip)
    setImmediate(async () => {
      try {
        await auditRepository.recordEvent(
          {
            eventType,
            resourceType,
            resourceId: (request.params as any)?.id || (request.params as any)?.encounterId || undefined,
            correlationId: request.id,
            ipAddress,
            userAgent,
            tenantId: session.tenantId,
            branchId: session.branchId,
            metadata: {
              url,
              method: request.method,
              statusCode: reply.statusCode,
              responseTimeMs: reply.elapsedTime
            }
          },
          session
        );
      } catch (err: any) {
        // Non-blocking logger notification
        logger.warn('Universal audit hook background persistence notice', {
          error: err.message,
          url,
          method: request.method
        });
      }
    });
  });
};
