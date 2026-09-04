import crypto from 'node:crypto';
import { desc, eq } from '@docsearch/database';
import { getDatabase, auditEvents, type AuditEvent, type NewAuditEvent } from '@docsearch/database';
import { buildSecurityAuditRecord, type SecurityEventPayload, type SessionContext } from '@docsearch/auth';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('audit-repository');
const memoryAuditStore: AuditEvent[] = [];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AuditRepository {
  async getLatestEvent(tenantId?: string, dbClient = getDatabase()): Promise<AuditEvent | null> {
    const validTenantId = tenantId && UUID_REGEX.test(tenantId) ? tenantId : null;
    if (dbClient) {
      try {
        const results = validTenantId
          ? await dbClient.select().from(auditEvents).where(eq(auditEvents.tenantId, validTenantId)).orderBy(desc(auditEvents.timestamp)).limit(1)
          : await dbClient.select().from(auditEvents).orderBy(desc(auditEvents.timestamp)).limit(1);
        return results[0] || null;
      } catch {
        // Fallback to memory store if db is offline
      }
    }
    const filtered = tenantId ? memoryAuditStore.filter((e) => e.tenantId === tenantId) : memoryAuditStore;
    return filtered[filtered.length - 1] || null;
  }

  async getEventsByTenant(tenantId: string, limit = 50, dbClient = getDatabase()): Promise<AuditEvent[]> {
    const validTenantId = tenantId && UUID_REGEX.test(tenantId) ? tenantId : null;
    if (dbClient && validTenantId) {
      try {
        return await dbClient
          .select()
          .from(auditEvents)
          .where(eq(auditEvents.tenantId, validTenantId))
          .orderBy(desc(auditEvents.timestamp))
          .limit(limit);
      } catch {
        // Fallback to memory store
      }
    }
    return memoryAuditStore
      .filter((e) => e.tenantId === tenantId)
      .slice(-limit)
      .reverse();
  }

  async recordEvent(
    payload: SecurityEventPayload,
    session: SessionContext,
    dbClient = getDatabase()
  ): Promise<AuditEvent> {
    const previous = await this.getLatestEvent(payload.tenantId || session.tenantId || undefined, dbClient);
    const previousHash = previous?.integrityHash;

    const auditRecord = buildSecurityAuditRecord(payload, session, previousHash || undefined);

    const actorUuid = auditRecord.actorId && UUID_REGEX.test(auditRecord.actorId) ? auditRecord.actorId : null;
    const tenantUuid = auditRecord.tenantId && UUID_REGEX.test(auditRecord.tenantId) ? auditRecord.tenantId : null;
    const branchUuid = auditRecord.branchId && UUID_REGEX.test(auditRecord.branchId) ? auditRecord.branchId : null;

    const newRecord: NewAuditEvent = {
      id: crypto.randomUUID(),
      tenantId: tenantUuid,
      branchId: branchUuid,
      actorId: actorUuid,
      eventType: auditRecord.eventType,
      resourceType: auditRecord.resourceType,
      resourceId: auditRecord.resourceId,
      correlationId: auditRecord.correlationId,
      ipAddress: auditRecord.ipAddress,
      userAgent: auditRecord.userAgent,
      metadata: {
        ...(auditRecord.metadata || {}),
        ...(auditRecord.actorId && !actorUuid ? { rawActorId: auditRecord.actorId } : {})
      },
      previousHash: auditRecord.previousHash,
      integrityHash: auditRecord.integrityHash,
      timestamp: auditRecord.timestamp
    };

    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(auditEvents).values(newRecord).returning();
        if (inserted) {
          logger.info('Audit event committed to database', {
            eventType: inserted.eventType,
            hash: inserted.integrityHash
          });
          return inserted;
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        if (
          errMessage.includes('audit_events_actor_id') ||
          errMessage.includes('audit_events_branch_id') ||
          errMessage.includes('foreign key') ||
          errMessage.includes('Foreign key')
        ) {
          try {
            const fallbackRecord: NewAuditEvent = {
              ...newRecord,
              actorId: null,
              branchId: null
            };
            const [inserted] = await dbClient.insert(auditEvents).values(fallbackRecord).returning();
            if (inserted) {
              return inserted;
            }
          } catch {
            // fall through to memory store
          }
        }
        logger.error('Failed to write audit event to database, using memory fallback', { error: errMessage });
      }
    }

    const memoryRecord: AuditEvent = {
      id: crypto.randomUUID(),
      tenantId: newRecord.tenantId || null,
      branchId: newRecord.branchId || null,
      actorId: newRecord.actorId || null,
      eventType: newRecord.eventType,
      resourceType: newRecord.resourceType,
      resourceId: newRecord.resourceId || null,
      correlationId: newRecord.correlationId || null,
      ipAddress: newRecord.ipAddress || null,
      userAgent: newRecord.userAgent || null,
      metadata: newRecord.metadata || {},
      previousHash: (newRecord.previousHash || null) as string | null,
      integrityHash: auditRecord.integrityHash || null,
      timestamp: newRecord.timestamp || new Date()
    };
    memoryAuditStore.push(memoryRecord);
    return memoryRecord;
  }
}

export const auditRepository = new AuditRepository();
