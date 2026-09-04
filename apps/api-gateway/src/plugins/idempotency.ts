import { type FastifyRequest, type FastifyReply } from 'fastify';

export interface IdempotentRecord {
  statusCode: number;
  payload: string;
  contentType?: string | undefined;
  createdAt: number;
}

// Transaction idempotency cache (TTL: 10 minutes)
const idempotencyStore = new Map<string, IdempotentRecord>();

export function getIdempotentResponse(cacheKey: string): IdempotentRecord | null {
  const cached = idempotencyStore.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.createdAt < 600000) {
    return cached;
  }
  idempotencyStore.delete(cacheKey);
  return null;
}

export function saveIdempotentResponse(cacheKey: string, record: IdempotentRecord): void {
  idempotencyStore.set(cacheKey, record);
}

export function clearIdempotencyStore(): void {
  idempotencyStore.clear();
}

/**
 * Executes post-authentication idempotency lookup.
 * Computes tenant-scoped, user-scoped, method-scoped, route-scoped cache key.
 */
declare module 'fastify' {
  interface FastifyRequest {
    idempotencyCacheKey?: string | undefined;
  }
}

export async function enforceIdempotency(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return;

  const rawKey = request.headers['x-idempotency-key'] as string | undefined;
  if (!rawKey) return;

  const session = request.session;
  if (!session) return; // Must be authenticated

  const routePath = request.routeOptions?.url || request.url.split('?')[0];
  const cacheKey = `${session.tenantId}:${session.userId}:${request.method}:${routePath}:${rawKey}`;
  request.idempotencyCacheKey = cacheKey;

  const cached = getIdempotentResponse(cacheKey);
  if (cached) {
    reply.header('x-cache', 'IDEMPOTENT_HIT');
    if (cached.contentType) {
      reply.type(cached.contentType);
    }
    return reply.status(cached.statusCode).send(cached.payload);
  }
}

