import { desc } from '@docsearch/database';
import { getDatabase, auditEvents, type AuditEvent, type NewAuditEvent } from '@docsearch/database';
import { buildSecurityAuditRecord, type SecurityEventPayload, type SessionContext } from '@docsearch/auth';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('audit-repository');
const memoryAuditStore: AuditEvent[] = [];

export class AuditRepository {
  async getLatestEvent(tenantId?: string, dbClient = getDatabase()): Promise<AuditEvent | null> {
    if (dbClient) {
      try {
        const query = dbClient.select().from(auditEvents);
        const results = tenantId
          ? await query.orderBy(desc(auditEvents.timestamp)).limit(1)
          : await query.orderBy(desc(auditEvents.timestamp)).limit(1);
        return results[0] || null;
      } catch {
        // Fallback to memory store if db is offline
      }
    }
    const filtered = tenantId ? memoryAuditStore.filter((e) => e.tenantId === tenantId) : memoryAuditStore;
    return filtered[filtered.length - 1] || null;
  }

  async recordEvent(
    payload: SecurityEventPayload,
    session: SessionContext,
    dbClient = getDatabase()
  ): Promise<AuditEvent> {
    const previous = await this.getLatestEvent(payload.tenantId || session.tenantId || undefined, dbClient);
    const previousHash = previous?.integrityHash;

    const auditRecord = buildSecurityAuditRecord(payload, session, previousHash || undefined);

    const newRecord: NewAuditEvent = {
      tenantId: auditRecord.tenantId,
      branchId: auditRecord.branchId,
      actorId: auditRecord.actorId,
      eventType: auditRecord.eventType,
      resourceType: auditRecord.resourceType,
      resourceId: auditRecord.resourceId,
      correlationId: auditRecord.correlationId,
      ipAddress: auditRecord.ipAddress,
      userAgent: auditRecord.userAgent,
      metadata: auditRecord.metadata,
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
      } catch {
        // Fallback to memory store
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
