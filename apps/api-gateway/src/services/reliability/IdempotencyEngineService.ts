import {
  getDatabase,
  idempotencyRecords,
  eq,
  and
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import {
  computeRequestHash,
  claimInFlightIdempotency,
  saveIdempotentResponse,
  failIdempotentRequest,
  getIdempotentResponse
} from '../../plugins/idempotency.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

export interface IdempotencyStats {
  tenantId: string;
  totalKeys: number;
  completedKeys: number;
  inFlightKeys: number;
  failedKeys: number;
  retentionWindow: string;
}

export class IdempotencyEngineService {
  /**
   * Inspects the status, TTL, and payload fingerprint of an idempotency key.
   */
  async inspectKey(key: string, session: SessionContext, db = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    const [record] = await db
      .select()
      .from(idempotencyRecords)
      .where(
        and(
          eq(idempotencyRecords.tenantId, tenantId),
          eq(idempotencyRecords.idempotencyKey, key)
        )
      )
      .limit(1);

    if (!record) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Idempotency key '${key}' not found in tenant scope.`,
        statusCode: 404
      });
    }

    const now = Date.now();
    const expiresAtMs = new Date(record.expiresAt).getTime();
    const isExpired = expiresAtMs < now;
    const ttlSeconds = isExpired ? 0 : Math.round((expiresAtMs - now) / 1000);

    return {
      id: record.id,
      tenantId: record.tenantId,
      idempotencyKey: record.idempotencyKey,
      requestHash: record.requestHash,
      status: record.status,
      statusCode: record.statusCode,
      method: record.method,
      routePath: record.routePath,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      ttlSeconds,
      isExpired
    };
  }

  /**
   * Explicitly evicts an idempotency key with administrative authorization and audit trail.
   */
  async evictKey(key: string, reason: string, session: SessionContext, db = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    const [existing] = await db
      .select()
      .from(idempotencyRecords)
      .where(
        and(
          eq(idempotencyRecords.tenantId, tenantId),
          eq(idempotencyRecords.idempotencyKey, key)
        )
      )
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Idempotency key '${key}' not found in tenant scope.`,
        statusCode: 404
      });
    }

    await failIdempotentRequest(tenantId, key);

    await db
      .delete(idempotencyRecords)
      .where(
        and(
          eq(idempotencyRecords.tenantId, tenantId),
          eq(idempotencyRecords.idempotencyKey, key)
        )
      );

    await auditRepository.recordEvent({
      eventType: 'IDEMPOTENCY_KEY_EVICTED',
      resourceType: 'idempotency_record',
      resourceId: key,
      tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        idempotencyKey: key,
        reason,
        evictedBy: session.actorEmail || session.userId
      }
    }, session, db);

    return {
      evicted: true,
      idempotencyKey: key,
      tenantId
    };
  }

  /**
   * Retrieves tenant idempotency operational metrics.
   */
  async getIdempotencyStats(session: SessionContext, db = getDatabase()): Promise<IdempotencyStats> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    const records = await db
      .select({
        status: idempotencyRecords.status
      })
      .from(idempotencyRecords)
      .where(eq(idempotencyRecords.tenantId, tenantId));

    let completedKeys = 0;
    let inFlightKeys = 0;
    let failedKeys = 0;

    for (const r of records) {
      if (r.status === 'COMPLETED') completedKeys++;
      else if (r.status === 'IN_FLIGHT') inFlightKeys++;
      else failedKeys++;
    }

    return {
      tenantId,
      totalKeys: records.length,
      completedKeys,
      inFlightKeys,
      failedKeys,
      retentionWindow: '10_MINUTES'
    };
  }

  /**
   * Programmatic high-concurrency execution gate ensuring strict idempotency.
   */
  async executeIdempotent<T>(
    key: string,
    payload: any,
    session: SessionContext,
    method: string,
    routePath: string,
    handler: () => Promise<{ statusCode: number; body: T }>
  ): Promise<{ statusCode: number; body: T; cached: boolean }> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    const requestHash = computeRequestHash(payload);

    // 1. Check existing record
    const existing = await getIdempotentResponse(tenantId, key);
    if (existing) {
      if (existing.requestHash && existing.requestHash !== requestHash) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Idempotency key reused with mismatched request payload. Tampering or conflicting replay rejected.',
          statusCode: 422
        });
      }

      if (existing.status === 'COMPLETED') {
        const parsedBody = typeof existing.payload === 'string' ? JSON.parse(existing.payload) : existing.payload;
        return {
          statusCode: existing.statusCode || 200,
          body: parsedBody,
          cached: true
        };
      }

      if (existing.status === 'IN_FLIGHT') {
        throw new AppError({
          code: ErrorCode.CONFLICT,
          message: 'An identical request with this idempotency key is currently being processed.',
          statusCode: 409
        });
      }
    }

    // 2. Claim in-flight lease
    const claim = await claimInFlightIdempotency(tenantId, key, requestHash, method, routePath, session.userId);
    if (!claim.claimed && claim.existingRecord) {
      if (claim.existingRecord.requestHash !== requestHash) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Idempotency key reused with mismatched request payload.',
          statusCode: 422
        });
      }
      if (claim.existingRecord.status === 'COMPLETED') {
        const parsed = typeof claim.existingRecord.payload === 'string' ? JSON.parse(claim.existingRecord.payload) : claim.existingRecord.payload;
        return { statusCode: claim.existingRecord.statusCode || 200, body: parsed, cached: true };
      }
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: 'An identical request with this idempotency key is currently being processed.',
        statusCode: 409
      });
    }

    // 3. Execute work
    try {
      const result = await handler();
      await saveIdempotentResponse(tenantId, key, {
        statusCode: result.statusCode,
        payload: JSON.stringify(result.body),
        requestHash
      });
      return {
        statusCode: result.statusCode,
        body: result.body,
        cached: false
      };
    } catch (err) {
      await failIdempotentRequest(tenantId, key);
      throw err;
    }
  }
}

export const idempotencyEngineService = new IdempotencyEngineService();
