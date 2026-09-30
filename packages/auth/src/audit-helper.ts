import { createHash } from 'node:crypto';
import type { SessionContext, SecurityEventPayload } from './types.js';

export interface AuditRecordPayload {
  tenantId?: string | undefined;
  branchId?: string | undefined;
  actorId?: string | undefined;
  eventType: string;
  resourceType: string;
  resourceId?: string | undefined;
  correlationId?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  previousHash?: string | undefined;
  integrityHash?: string | undefined;
  timestamp: Date;
}

/**
 * Recursively sorts all object keys alphabetically for strict deterministic output
 * without stripping any nested properties or metadata fields.
 */
function canonicalizeObject(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeObject);
  }
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(value as Record<string, unknown>).sort();
  for (const k of keys) {
    sorted[k] = canonicalizeObject((value as Record<string, unknown>)[k]);
  }
  return sorted;
}

/**
 * Deterministically serializes an audit event payload into canonical JSON.
 */
export function canonicalizeAuditPayload(payload: Omit<AuditRecordPayload, 'integrityHash'>): string {
  const normalized = {
    tenantId: payload.tenantId || null,
    branchId: payload.branchId || null,
    actorId: payload.actorId || null,
    eventType: payload.eventType,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId || null,
    correlationId: payload.correlationId || null,
    ipAddress: payload.ipAddress || null,
    userAgent: payload.userAgent || null,
    metadata: payload.metadata || {},
    previousHash: payload.previousHash || 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: payload.timestamp instanceof Date ? payload.timestamp.toISOString() : new Date(payload.timestamp).toISOString()
  };

  // Sort all keys recursively at every level for strict deterministic output without property dropping
  return JSON.stringify(canonicalizeObject(normalized));
}

/**
 * Computes an immutable SHA-256 cryptographic hash for an audit record.
 * Chained with previousHash to guarantee tamper evidence.
 */
export function computeAuditHash(
  payload: Omit<AuditRecordPayload, 'integrityHash'>,
  previousHash = 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000'
): string {
  const canonical = canonicalizeAuditPayload({ ...payload, previousHash });
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Computes legacy audit hash using the historical replacer mechanism for backward-compatible
 * verification of historical events recorded prior to the recursive canonicalization update.
 */
export function computeLegacyAuditHash(
  payload: Omit<AuditRecordPayload, 'integrityHash'>,
  previousHash = 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000'
): string {
  const normalized = {
    tenantId: payload.tenantId || null,
    branchId: payload.branchId || null,
    actorId: payload.actorId || null,
    eventType: payload.eventType,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId || null,
    correlationId: payload.correlationId || null,
    ipAddress: payload.ipAddress || null,
    userAgent: payload.userAgent || null,
    metadata: payload.metadata || {},
    previousHash: payload.previousHash || previousHash,
    timestamp: payload.timestamp instanceof Date ? payload.timestamp.toISOString() : new Date(payload.timestamp).toISOString()
  };
  const canonical = JSON.stringify(normalized, Object.keys(normalized).sort());
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Creates a structured audit record payload with deterministic SHA-256 hash chaining.
 */
export function buildSecurityAuditRecord(
  event: SecurityEventPayload,
  session?: SessionContext | undefined,
  previousHash = 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000'
): AuditRecordPayload {
  const now = new Date();
  const rawPayload: Omit<AuditRecordPayload, 'integrityHash'> = {
    tenantId: session?.tenantId,
    branchId: session?.branchId,
    actorId: session?.userId,
    eventType: event.eventType,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    correlationId: event.correlationId ?? session?.sessionId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    metadata: event.metadata ?? {},
    previousHash,
    timestamp: now
  };

  const integrityHash = computeAuditHash(rawPayload, previousHash);

  return {
    ...rawPayload,
    integrityHash
  };
}
