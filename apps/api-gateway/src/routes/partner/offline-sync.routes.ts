import type { FastifyPluginAsync } from 'fastify';
import { getDatabase, offlineSyncQueue, and, eq, inArray } from '@docsearch/database';
import { authenticate, requireRoles, requireTenantId } from '../../plugins/auth-guard.js';
import { offlineSyncService, type OfflineMutationItem } from '../../services/reliability/OfflineSyncService.js';
import { isValidUuid } from '../../utils/uuid-guard.js';

export const offlineSyncRoutes: FastifyPluginAsync = async (app) => {
  // 1. Replay Offline Queue (PostgreSQL-backed Idempotent Batch Replay)
  app.post(
    '/api/v1/partner/offline-sync/batch-replay',
    {
      preHandler: [
        authenticate,
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST', 'BILLING_CLERK')
      ]
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request);
      const body = (request.body || {}) as {
        deviceId?: string;
        deviceCode?: string;
        syncBatchId?: string;
        mutations?: OfflineMutationItem[];
        tokens?: Array<{
          id: string;
          idempotencyKey?: string;
          patientName: string;
          tokenNumber: string;
          doctorName?: string;
          departmentName?: string;
          consultationFee?: number;
          timestamp?: string;
        }>;
        receipts?: Array<{
          id: string;
          idempotencyKey?: string;
          receiptNumber: string;
          patientName: string;
          amount: number;
          cashierName?: string;
          timestamp?: string;
        }>;
      };

      const tokens = body.tokens || [];
      const receipts = body.receipts || [];
      const explicitMutations: OfflineMutationItem[] = (body.mutations || []).map((m: any) => ({
        clientOperationId: String(m.clientOperationId || m.id || `${m.entityType || 'RECORD'}-${Date.now()}`),
        entityType: String(m.entityType || 'RECORD'),
        entityId: String(m.entityId || m.clientOperationId || m.id || 'UNKNOWN'),
        operation: (m.operation || m.operationType || 'UPDATE') as 'INSERT' | 'UPDATE' | 'DELETE',
        clientVersion: Number.isFinite(Number(m.clientVersion)) ? Number(m.clientVersion) : 1,
        payload: (m.payload && typeof m.payload === 'object' ? m.payload : {}) as Record<string, unknown>,
        clientTimestamp: m.clientTimestamp || new Date().toISOString()
      }));

      const combinedMutations: OfflineMutationItem[] = [
        ...explicitMutations,
        ...tokens.map((t) => ({
          clientOperationId: t.idempotencyKey || t.id,
          entityType: 'OPD_TOKEN',
          entityId: t.id,
          operation: 'INSERT' as const,
          clientVersion: 1,
          payload: t as unknown as Record<string, unknown>,
          clientTimestamp: t.timestamp || new Date().toISOString()
        })),
        ...receipts.map((r) => ({
          clientOperationId: r.idempotencyKey || r.id,
          entityType: 'CASHIER_RECEIPT',
          entityId: r.id,
          operation: 'INSERT' as const,
          clientVersion: 1,
          payload: r as unknown as Record<string, unknown>,
          clientTimestamp: r.timestamp || new Date().toISOString()
        }))
      ];

      if (combinedMutations.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Offline batch replay requires at least one token, receipt, or mutation item.'
        });
      }

      const db = getDatabase();
      const opIds = combinedMutations.map((m) => m.clientOperationId).filter(Boolean);
      const existingRows = opIds.length > 0
        ? await db
            .select({ clientOperationId: offlineSyncQueue.clientOperationId })
            .from(offlineSyncQueue)
            .where(and(eq(offlineSyncQueue.tenantId, tenantId), inArray(offlineSyncQueue.clientOperationId, opIds)))
        : [];
      const alreadySyncedSet = new Set(existingRows.map((r) => r.clientOperationId));

      const freshMutations = combinedMutations.filter((m) => !alreadySyncedSet.has(m.clientOperationId));
      const duplicatesSkipped = combinedMutations.length - freshMutations.length;

      let batchResult: Awaited<ReturnType<typeof offlineSyncService.submitSyncBatch>> | null = null;
      if (freshMutations.length > 0) {
        const safeDeviceId = isValidUuid(body.deviceId) ? body.deviceId.trim() : undefined;
        const safeDeviceCode =
          body.deviceCode || (!safeDeviceId && body.deviceId ? body.deviceId : undefined);
        batchResult = await offlineSyncService.submitSyncBatch(
          {
            deviceId: safeDeviceId,
            deviceCode: safeDeviceCode,
            syncBatchId: body.syncBatchId,
            mutations: freshMutations
          },
          request.session,
          db
        );
      }

      const persistedTokens = freshMutations
        .filter((m) => m.entityType === 'OPD_TOKEN')
        .map((m) => ({
          tokenNumber: String((m.payload as any)?.tokenNumber || m.entityId),
          patientName: String((m.payload as any)?.patientName || ''),
          status: 'SYNCED_TO_PERSISTENT_QUEUE',
          committedAt: new Date().toISOString()
        }));
      const persistedReceipts = freshMutations
        .filter((m) => m.entityType === 'CASHIER_RECEIPT')
        .map((m) => ({
          receiptNumber: String((m.payload as any)?.receiptNumber || m.entityId),
          amount: Number((m.payload as any)?.amount || 0),
          status: 'PERSISTED_TO_SYNC_QUEUE',
          committedAt: new Date().toISOString()
        }));

      return reply.send({
        success: true,
        data: {
          status: (batchResult?.conflictCount || 0) > 0 ? 'BATCH_REPLAY_WITH_CONFLICTS' : 'BATCH_REPLAY_COMMITTED',
          syncBatchId: batchResult?.syncBatchId || body.syncBatchId || null,
          appliedCount: batchResult?.appliedCount || 0,
          conflictCount: batchResult?.conflictCount || 0,
          syncedTokensCount: persistedTokens.length,
          syncedReceiptsCount: persistedReceipts.length,
          duplicatesSkipped,
          serverCommittedAt: new Date().toISOString(),
          auditBatchRef: batchResult?.syncBatchId || `BATCH-REPLAY-IDEMPOTENT-${Date.now().toString(36).toUpperCase()}`,
          conflicts: batchResult?.conflicts || [],
          records: {
            tokens: persistedTokens,
            receipts: persistedReceipts
          }
        }
      });
    }
  );

  // 2. Gateway Connectivity & Heartbeat Check for PWA Offline Resilience
  app.get(
    '/api/v1/partner/offline-sync/status',
    async (_request, reply) => {
      return reply.send({
        success: true,
        data: {
          gatewayOnline: true,
          serverTime: new Date().toISOString(),
          supportedOfflineEntities: ['OPD_TOKEN', 'CASHIER_RECEIPT', 'PHARMACY_CASH_SALE'],
          syncEngineVersion: '2.0.0-pwa'
        }
      });
    }
  );
};
