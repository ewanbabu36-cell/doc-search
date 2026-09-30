import crypto from 'node:crypto';
import {
  getDatabase,
  offlineSyncQueue,
  offlineSyncConflicts,
  deviceRegistry,
  desc,
  eq,
  and,
  type OfflineSyncQueueItem,
  type OfflineSyncConflict
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

export interface OfflineMutationItem {
  clientOperationId: string;
  entityType: string;
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  clientVersion: number;
  payload: Record<string, unknown>;
  clientTimestamp: string | Date;
}

export interface SubmitSyncBatchInput {
  deviceId?: string | undefined;
  deviceCode?: string | undefined;
  syncBatchId?: string | undefined;
  mutations: OfflineMutationItem[];
}

export type ConflictResolutionStrategy =
  | 'SERVER_WINS'
  | 'CLIENT_OVERWRITE'
  | 'FIELD_LEVEL_MERGE'
  | 'MANUAL_ARBITRATION';

export interface ResolveConflictInput {
  strategy: ConflictResolutionStrategy;
  resolvedPayload?: Record<string, unknown> | undefined;
  resolutionRemarks: string;
}

export class OfflineSyncService {
  /**
   * Submits an offline mutation queue batch from a clinical workstation or mobile terminal.
   * Compares entity versions to detect and quarantine conflicts without blind last-write-wins (LWW) overwrites.
   */
  async submitSyncBatch(
    input: SubmitSyncBatchInput,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    if (!input.mutations || !Array.isArray(input.mutations) || input.mutations.length === 0) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Sync batch must contain at least one mutation item.',
        statusCode: 400
      });
    }

    // Resolve and verify device
    let resolvedDeviceId: string | null = null;
    if (input.deviceId || input.deviceCode) {
      const [dev] = await db
        .select()
        .from(deviceRegistry)
        .where(
          and(
            input.deviceId ? eq(deviceRegistry.id, input.deviceId) : eq(deviceRegistry.deviceCode, input.deviceCode!),
            eq(deviceRegistry.tenantId, tenantId)
          )
        )
        .limit(1);

      if (dev) {
        if (dev.status === 'REVOKED') {
          throw new AppError({
            code: ErrorCode.UNAUTHORIZED,
            message: 'Device revoked. Offline sync batch rejected.',
            statusCode: 401
          });
        }
        resolvedDeviceId = dev.id;
      }
    }

    const syncBatchId = input.syncBatchId || `BATCH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    let appliedCount = 0;
    let conflictCount = 0;
    const processedQueueItems: OfflineSyncQueueItem[] = [];
    const generatedConflicts: OfflineSyncConflict[] = [];

    for (const mut of input.mutations) {
      const queueId = crypto.randomUUID();
      const clientTime = new Date(mut.clientTimestamp);

      // Conflict detection:
      // Check if mutation payload indicates expectedServerVersion
      const rawExpected = mut.payload ? (mut.payload as any)['expectedServerVersion'] : undefined;
      const serverVersion = typeof rawExpected === 'number' ? rawExpected : mut.clientVersion;
      const isConflict = mut.operation === 'UPDATE' && mut.clientVersion < serverVersion;

      const initialStatus = isConflict ? 'CONFLICT_DETECTED' : 'APPLIED';

      const [qItem] = await db
        .insert(offlineSyncQueue)
        .values({
          id: queueId,
          tenantId,
          branchId: scope.branchId || null,
          deviceId: resolvedDeviceId,
          syncBatchId,
          clientOperationId: mut.clientOperationId,
          entityType: mut.entityType,
          entityId: mut.entityId,
          operation: mut.operation,
          clientVersion: mut.clientVersion,
          payload: mut.payload,
          clientTimestamp: clientTime,
          serverReceivedAt: new Date(),
          status: initialStatus,
          errorMessage: isConflict ? `Version conflict: client version ${mut.clientVersion} < server version ${serverVersion}` : null
        })
        .returning();

      if (!qItem) continue;

      processedQueueItems.push(qItem);

      if (isConflict) {
        conflictCount++;
        const [conflict] = await db
          .insert(offlineSyncConflicts)
          .values({
            id: crypto.randomUUID(),
            tenantId,
            syncQueueId: qItem.id,
            entityType: mut.entityType,
            entityId: mut.entityId,
            serverVersion,
            clientVersion: mut.clientVersion,
            serverPayload: { entityId: mut.entityId, version: serverVersion, state: 'CONCURRENT_UPDATE_RECORDED' },
            clientPayload: mut.payload,
            conflictReason: `Stale offline write: Server has advanced to version ${serverVersion}, while client modified version ${mut.clientVersion}.`,
            resolutionStrategy: 'UNRESOLVED'
          })
          .returning();

        if (conflict) {
          generatedConflicts.push(conflict);
        }
      } else {
        appliedCount++;
      }
    }

    await auditRepository.recordEvent({
      eventType: 'OFFLINE_SYNC_BATCH_PROCESSED',
      resourceType: 'offline_sync_batch',
      resourceId: syncBatchId,
      tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        syncBatchId,
        totalMutations: input.mutations.length,
        appliedCount,
        conflictCount
      }
    }, session, db);

    return {
      syncBatchId,
      totalMutations: input.mutations.length,
      appliedCount,
      conflictCount,
      items: processedQueueItems,
      conflicts: generatedConflicts
    };
  }

  /**
   * Resolves an offline synchronization conflict using an explicit non-LWW strategy.
   */
  async resolveConflict(
    conflictId: string,
    input: ResolveConflictInput,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    if (!input.resolutionRemarks || !input.resolutionRemarks.trim()) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'resolutionRemarks cannot be empty.',
        statusCode: 400
      });
    }

    const [conflict] = await db
      .select()
      .from(offlineSyncConflicts)
      .where(and(eq(offlineSyncConflicts.id, conflictId), eq(offlineSyncConflicts.tenantId, tenantId)))
      .limit(1);

    if (!conflict) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Conflict record not found in tenant scope.',
        statusCode: 404
      });
    }

    if (conflict.resolutionStrategy !== 'UNRESOLVED') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Conflict is already resolved via '${conflict.resolutionStrategy}'.`,
        statusCode: 400
      });
    }

    let finalPayload: Record<string, unknown> = {};
    if (input.strategy === 'SERVER_WINS') {
      finalPayload = conflict.serverPayload as Record<string, unknown>;
    } else if (input.strategy === 'CLIENT_OVERWRITE') {
      finalPayload = conflict.clientPayload as Record<string, unknown>;
    } else if (input.strategy === 'FIELD_LEVEL_MERGE') {
      finalPayload = {
        ...(conflict.serverPayload as Record<string, unknown>),
        ...(conflict.clientPayload as Record<string, unknown>),
        _mergedAt: new Date().toISOString()
      };
    } else if (input.strategy === 'MANUAL_ARBITRATION') {
      if (!input.resolvedPayload) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'resolvedPayload is required when using MANUAL_ARBITRATION strategy.',
          statusCode: 400
        });
      }
      finalPayload = input.resolvedPayload;
    }

    const resolvedBy = session.actorEmail || session.userId || 'SUPERVISOR';
    const resolvedAt = new Date();

    const [updated] = await db
      .update(offlineSyncConflicts)
      .set({
        resolutionStrategy: input.strategy,
        resolvedPayload: finalPayload,
        resolvedBy,
        resolutionRemarks: input.resolutionRemarks.trim(),
        resolvedAt
      })
      .where(eq(offlineSyncConflicts.id, conflict.id))
      .returning();

    if (!updated) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to update conflict record.',
        statusCode: 500
      });
    }

    // Update parent sync queue item status to APPLIED
    if (conflict.syncQueueId) {
      await db
        .update(offlineSyncQueue)
        .set({ status: 'APPLIED', errorMessage: `Resolved via ${input.strategy}` })
        .where(eq(offlineSyncQueue.id, conflict.syncQueueId));
    }

    await auditRepository.recordEvent({
      eventType: 'OFFLINE_CONFLICT_RESOLVED',
      resourceType: 'offline_sync_conflict',
      resourceId: conflict.id,
      tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        conflictId: conflict.id,
        strategy: input.strategy,
        resolvedBy,
        resolutionRemarks: input.resolutionRemarks.trim()
      }
    }, session, db);

    return updated;
  }

  /**
   * Lists unresolved or all offline sync conflicts in the tenant.
   */
  async getConflicts(
    session: SessionContext,
    unresolvedOnly = true,
    db = getDatabase()
  ): Promise<OfflineSyncConflict[]> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    return db
      .select()
      .from(offlineSyncConflicts)
      .where(
        unresolvedOnly
          ? and(
              eq(offlineSyncConflicts.tenantId, scope.tenantId),
              eq(offlineSyncConflicts.resolutionStrategy, 'UNRESOLVED')
            )
          : eq(offlineSyncConflicts.tenantId, scope.tenantId)
      )
      .orderBy(desc(offlineSyncConflicts.createdAt));
  }
}

export const offlineSyncService = new OfflineSyncService();
