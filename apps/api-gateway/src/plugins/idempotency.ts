import { type FastifyRequest, type FastifyReply } from 'fastify';
import crypto from 'node:crypto';
import { getDatabase } from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('financial-idempotency');

export interface IdempotentRecord {
  statusCode: number;
  payload: string;
  contentType?: string | undefined;
  requestHash: string;
  createdAt: number;
}

export interface InFlightIdempotencyContext {
  tenantId: string;
  key: string;
  requestHash: string;
}

// L1 Fast in-memory cache for low-latency hits within the same process (TTL: 10 minutes)
const l1IdempotencyCache = new Map<string, IdempotentRecord>();

/**
 * Deterministically serializes an arbitrary JSON-compatible object by recursively sorting its keys.
 * Volatile or un-serializable properties are handled safely.
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  return '{' + sortedKeys.map((k) => JSON.stringify(k) + ':' + canonicalizeJson(obj[k])).join(',') + '}';
}

/**
 * Computes a deterministic SHA-256 hex digest fingerprint for the canonical request body.
 * Supports both computeRequestHash(body) and computeRequestHash(method, routePath, body).
 */
export function computeRequestHash(arg1: any, arg2?: any, arg3?: any): string {
  if (typeof arg1 === 'string' && (arg1 === 'POST' || arg1 === 'PUT' || arg1 === 'PATCH' || arg1 === 'DELETE')) {
    const method = arg1;
    const route = typeof arg2 === 'string' ? arg2 : '';
    const body = arg3 !== undefined ? arg3 : arg2;
    const canonical = canonicalizeJson(body ?? {});
    return crypto.createHash('sha256').update(`${method}:${route}:${canonical}`).digest('hex');
  }
  const canonical = canonicalizeJson(arg1 ?? {});
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

declare module 'fastify' {
  interface FastifyRequest {
    idempotencyContext?: InFlightIdempotencyContext | undefined;
    idempotencyCacheKey?: string | undefined;
  }
}

/**
 * Retrieves a cached idempotent response from PostgreSQL or L1 memory cache.
 * Supports both (tenantId, key) and (cacheKey) signatures.
 * Returns a thenable object that allows both synchronous inspection and await.
 */
export function getIdempotentResponse(
  arg1: string,
  arg2?: string
): any {
  let tenantId: string;
  let key: string;
  if (arg2 === undefined) {
    const parts = (arg1 || '').split(':');
    if (parts.length >= 2) {
      tenantId = parts[0]!;
      key = parts.slice(1).join(':');
    } else {
      tenantId = '00000000-0000-4000-8000-000000000000';
      key = arg1 || '';
    }
  } else {
    tenantId = arg1 || '00000000-0000-4000-8000-000000000000';
    key = arg2 || '';
  }

  const memKey = `${tenantId}:${key}`;
  const memHit = l1IdempotencyCache.get(memKey);
  if (memHit && Date.now() - memHit.createdAt < 600000) {
    const data = {
      statusCode: memHit.statusCode,
      payload: memHit.payload,
      contentType: memHit.contentType,
      requestHash: memHit.requestHash,
      status: 'COMPLETED'
    };
    const promise = Promise.resolve(data);
    Object.assign(promise, data);
    return promise;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
  const dbTenantId = isUuid ? tenantId : '00000000-0000-4000-8000-000000000000';

  const asyncLookup = async () => {
    const db: any = getDatabase();
    if (!db) return null;

    try {
      const querySql = `
        SELECT "status", "status_code", "response_body", "response_headers", "request_hash", "expires_at", "created_at"
        FROM "core"."idempotency_records"
        WHERE "tenant_id" = '${dbTenantId}' AND "idempotency_key" = '${(key || '').replace(/'/g, "''")}'
        LIMIT 1;
      `;

      let rows: any[] = [];
      if (typeof db.execute === 'function') {
        const res = await db.execute(querySql);
        rows = Array.isArray(res) ? res : (res?.rows || []);
      } else if (typeof db.query === 'function') {
        const res = await db.query(querySql);
        rows = Array.isArray(res) ? res : (res?.rows || []);
      }

      if (rows.length === 0) return null;
      const rec = rows[0];

      // Check expiration
      if (rec.expires_at && new Date(rec.expires_at).getTime() < Date.now()) {
        return null;
      }

      const headers = typeof rec.response_headers === 'string' ? JSON.parse(rec.response_headers) : rec.response_headers;
      const contentType = headers?.['content-type'];

      const isStale = rec.status === 'IN_FLIGHT' && rec.created_at && (Date.now() - new Date(rec.created_at).getTime() > 120000);

      if (rec.status === 'COMPLETED' && rec.status_code && rec.response_body) {
        l1IdempotencyCache.set(memKey, {
          statusCode: rec.status_code,
          payload: rec.response_body,
          contentType,
          requestHash: rec.request_hash,
          createdAt: Date.now()
        });
      }

      return {
        statusCode: rec.status_code,
        payload: rec.response_body,
        contentType,
        requestHash: rec.request_hash,
        status: rec.status,
        isStale
      };
    } catch (err) {
      logger.warn('Error reading from PostgreSQL idempotency store:', { error: String(err) });
      return null;
    }
  };

  return asyncLookup();
}

/**
 * Atomically marks an idempotency key IN_FLIGHT in PostgreSQL before processing begins.
 * Returns true if this worker successfully acquired the in-flight lease.
 */
export async function claimInFlightIdempotency(
  tenantId: string,
  key: string,
  requestHash: string,
  method: string,
  routePath: string,
  userId?: string
): Promise<{ claimed: boolean; existingRecord?: any }> {
  const db: any = getDatabase();
  const id = crypto.randomUUID();
  const safeKey = key.replace(/'/g, "''");
  const safeMethod = method.replace(/'/g, "''");
  const safeRoute = routePath.replace(/'/g, "''");
  const safeUser = (userId || '').replace(/'/g, "''");

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
  const dbTenantId = isUuid ? tenantId : '00000000-0000-4000-8000-000000000000';

  // Check if record already exists in L1 memory cache or DB
  const preCheck = await getIdempotentResponse(tenantId, key);
  if (preCheck) {
    if (preCheck.isStale && db) {
      // Reclaim stale in-flight lease
      const updateSql = `
        UPDATE "core"."idempotency_records"
        SET "id" = '${id}', "request_hash" = '${requestHash}', "user_id" = '${safeUser}', "method" = '${safeMethod}',
            "route_path" = '${safeRoute}', "status" = 'IN_FLIGHT', "created_at" = now(), "expires_at" = now() + interval '10 minutes'
        WHERE "tenant_id" = '${dbTenantId}' AND "idempotency_key" = '${safeKey}' AND "status" = 'IN_FLIGHT';
      `;
      try {
        if (typeof db.execute === 'function') await db.execute(updateSql);
        else if (typeof db.query === 'function') await db.query(updateSql);
        return { claimed: true };
      } catch {}
    }
    return { claimed: false, existingRecord: preCheck };
  }

  if (!db) return { claimed: true };

  const insertSql = `
    INSERT INTO "core"."idempotency_records" (
      "id", "tenant_id", "user_id", "idempotency_key", "request_hash", "method", "route_path", "status", "created_at", "expires_at"
    ) VALUES (
      '${id}', '${dbTenantId}', '${safeUser}', '${safeKey}', '${requestHash}', '${safeMethod}', '${safeRoute}', 'IN_FLIGHT', now(), now() + interval '10 minutes'
    )
    RETURNING "id";
  `;

  try {
    let rows: any[] = [];
    if (typeof db.execute === 'function') {
      const res = await db.execute(insertSql);
      rows = Array.isArray(res) ? res : (res?.rows || []);
    } else if (typeof db.query === 'function') {
      const res = await db.query(insertSql);
      rows = Array.isArray(res) ? res : (res?.rows || []);
    }

    if (rows.length > 0) {
      return { claimed: true };
    }

    // Insert conflicted — fetch existing record
    const existing = await getIdempotentResponse(tenantId, key);
    return { claimed: false, existingRecord: existing };
  } catch (err: any) {
    const isConflict = String(err).includes('unique constraint') || String(err).includes('duplicate key') || err?.code === '23505';
    if (isConflict) {
      const existing = await getIdempotentResponse(tenantId, key);
      if (existing && existing.isStale) {
        // Reclaim stale in-flight lease
        const updateSql = `
          UPDATE "core"."idempotency_records"
          SET "id" = '${id}', "request_hash" = '${requestHash}', "user_id" = '${safeUser}', "method" = '${safeMethod}',
              "route_path" = '${safeRoute}', "status" = 'IN_FLIGHT', "created_at" = now(), "expires_at" = now() + interval '10 minutes'
          WHERE "tenant_id" = '${dbTenantId}' AND "idempotency_key" = '${safeKey}' AND "status" = 'IN_FLIGHT';
        `;
        try {
          if (typeof db.execute === 'function') await db.execute(updateSql);
          else if (typeof db.query === 'function') await db.query(updateSql);
          return { claimed: true };
        } catch {}
      }
      return { claimed: false, existingRecord: existing };
    }
    logger.error('Failed to register in-flight idempotency lease', { error: String(err), tenantId, key });
    return { claimed: true };
  }
}

/**
 * Persists a completed response to PostgreSQL and L1 cache.
 * Supports both (tenantId, key, record) and (cacheKey, record) signatures.
 */
export async function saveIdempotentResponse(
  arg1: string,
  arg2: any,
  arg3?: any
): Promise<void> {
  let tenantId: string;
  let key: string;
  let record: { statusCode: number; payload: string; contentType?: string | undefined; requestHash: string };

  if (arg3 !== undefined) {
    tenantId = arg1 || '00000000-0000-4000-8000-000000000000';
    key = typeof arg2 === 'string' ? arg2 : '';
    record = arg3 || { statusCode: 200, payload: '', requestHash: '' };
  } else {
    const parts = (arg1 || '').split(':');
    if (parts.length >= 2) {
      tenantId = parts[0]!;
      key = parts.slice(1).join(':');
    } else {
      tenantId = '00000000-0000-4000-8000-000000000000';
      key = arg1 || '';
    }
    record = arg2 || { statusCode: 200, payload: '', requestHash: '' };
  }

  const statusCode = typeof record.statusCode === 'number' ? record.statusCode : 200;
  const payload = typeof record.payload === 'string' ? record.payload : JSON.stringify(record.payload ?? {});
  const requestHash = record.requestHash || '';

  const memKey = `${tenantId}:${key}`;
  l1IdempotencyCache.set(memKey, {
    statusCode,
    payload,
    contentType: record.contentType,
    requestHash,
    createdAt: Date.now()
  });

  const db: any = getDatabase();
  if (!db) return;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
  const dbTenantId = isUuid ? tenantId : '00000000-0000-4000-8000-000000000000';

  const safeKey = (key || '').replace(/'/g, "''");
  const safePayload = payload.replace(/'/g, "''");
  const headersJson = JSON.stringify({ 'content-type': record.contentType || 'application/json' }).replace(/'/g, "''");

  const updateSql = `
    UPDATE "core"."idempotency_records"
    SET "status" = 'COMPLETED',
        "status_code" = ${statusCode},
        "response_body" = '${safePayload}',
        "response_headers" = '${headersJson}'::jsonb,
        "expires_at" = now() + interval '10 minutes'
    WHERE "tenant_id" = '${dbTenantId}' AND "idempotency_key" = '${safeKey}';
  `;

  try {
    if (typeof db.execute === 'function') {
      await db.execute(updateSql);
    } else if (typeof db.query === 'function') {
      await db.query(updateSql);
    }
  } catch (err) {
    logger.warn('Failed to commit completed response to PostgreSQL idempotency store', { error: String(err) });
  }
}

/**
 * Marks an in-flight idempotency record as FAILED or clears it on error.
 * Supports both (tenantId, key) and (cacheKey) signatures.
 */
export async function failIdempotentRequest(arg1: string, arg2?: string): Promise<void> {
  let tenantId: string;
  let key: string;
  if (arg2 === undefined) {
    const parts = (arg1 || '').split(':');
    if (parts.length >= 2) {
      tenantId = parts[0]!;
      key = parts.slice(1).join(':');
    } else {
      tenantId = '00000000-0000-4000-8000-000000000000';
      key = arg1 || '';
    }
  } else {
    tenantId = arg1 || '00000000-0000-4000-8000-000000000000';
    key = arg2 || '';
  }

  const memKey = `${tenantId}:${key}`;
  l1IdempotencyCache.delete(memKey);

  const db: any = getDatabase();
  if (!db) return;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
  const dbTenantId = isUuid ? tenantId : '00000000-0000-4000-8000-000000000000';

  const safeKey = (key || '').replace(/'/g, "''");
  const deleteSql = `
    DELETE FROM "core"."idempotency_records"
    WHERE "tenant_id" = '${dbTenantId}' AND "idempotency_key" = '${safeKey}' AND "status" = 'IN_FLIGHT';
  `;

  try {
    if (typeof db.execute === 'function') await db.execute(deleteSql);
    else if (typeof db.query === 'function') await db.query(deleteSql);
  } catch {}
}

export function clearIdempotencyStore(): void {
  l1IdempotencyCache.clear();
}

/**
 * Fastify preHandler hook enforcing enterprise financial idempotency:
 * 1. Computes canonical SHA-256 fingerprint over request.body.
 * 2. If key exists with DIFFERENT payload -> strictly REJECTS with HTTP 422 Unprocessable Entity.
 * 3. If key exists and COMPLETED -> replies with cached result and 'x-cache: IDEMPOTENT_HIT'.
 * 4. If key exists and IN_FLIGHT -> rejects with HTTP 409 Conflict to prevent concurrent duplicate side-effects.
 * 5. If new key -> claims atomic IN_FLIGHT lease in PostgreSQL.
 */
export async function enforceIdempotency(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return;

  const rawKey = ((request.headers['x-idempotency-key'] || request.headers['idempotency-key']) as string | undefined)?.trim();
  if (!rawKey) return;

  // Avoid redundant execution if already evaluated on this request by upstream middleware
  if (request.idempotencyContext) return;

  const tenantId = (request as any).session?.tenantId || (request.headers['x-tenant-id'] as string) || '00000000-0000-4000-8000-000000000000';
  const userId = (request as any).session?.userId;
  const routePath = request.routeOptions?.url || request.url.split('?')[0] || '/';

  // Compute canonical SHA-256 hash of payload
  const requestHash = computeRequestHash(request.body);
  request.idempotencyContext = { tenantId, key: rawKey, requestHash };
  request.idempotencyCacheKey = `${tenantId}:${rawKey}`;

  // 1. Check existing record
  const existing = await getIdempotentResponse(tenantId, rawKey);

  if (existing) {
    // Check for payload mismatch tampering (FIND-03)
    if (existing.requestHash && existing.requestHash !== requestHash) {
      logger.warn('Idempotency key reused with mismatched payload hash', {
        tenantId,
        key: rawKey,
        originalHash: existing.requestHash,
        incomingHash: requestHash
      });
      throw new AppError({
        message: 'Idempotency key reused with mismatched request payload. Tampering or conflicting replay rejected.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 422,
        details: [
          {
            message: 'Payload fingerprint mismatch',
            key: rawKey
          }
        ]
      });
    }

    if (existing.status === 'COMPLETED') {
      reply.header('x-cache', 'IDEMPOTENT_HIT');
      if (existing.contentType) {
        reply.type(existing.contentType);
      }
      return reply.status(existing.statusCode).send(existing.payload);
    }

    if (existing.status === 'IN_FLIGHT') {
      throw new AppError({
        message: 'An identical request with this idempotency key is currently being processed. Please retry shortly.',
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }
  }

  // 2. Claim IN_FLIGHT state in PostgreSQL
  const claim = await claimInFlightIdempotency(tenantId, rawKey, requestHash, request.method, routePath, userId);
  if (!claim.claimed && claim.existingRecord) {
    if (claim.existingRecord.requestHash !== requestHash) {
      throw new AppError({
        message: 'Idempotency key reused with mismatched request payload.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 422
      });
    }
    if (claim.existingRecord.status === 'COMPLETED') {
      reply.header('x-cache', 'IDEMPOTENT_HIT');
      return reply.status(claim.existingRecord.statusCode).send(claim.existingRecord.payload);
    }
    throw new AppError({
      message: 'An identical request with this idempotency key is currently being processed.',
      code: ErrorCode.CONFLICT,
      statusCode: 409
    });
  }
}
