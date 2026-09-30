import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { authenticate } from '../../plugins/auth-guard.js';
import { auditIntegrityService } from '../../services/reliability/AuditIntegrityService.js';
import { dataLineageService } from '../../services/reliability/DataLineageService.js';
import { reconciliationEngineService, type ReconciliationDomain } from '../../services/reliability/ReconciliationEngineService.js';
import { idempotencyEngineService } from '../../services/reliability/IdempotencyEngineService.js';
import { sagaOrchestratorService } from '../../services/reliability/SagaOrchestratorService.js';
import { deviceGovernanceService } from '../../services/reliability/DeviceGovernanceService.js';
import { offlineSyncService } from '../../services/reliability/OfflineSyncService.js';
import { incidentCapaService } from '../../services/reliability/IncidentCapaService.js';

export const partnerReliabilityRoutes: FastifyPluginAsync = async (fastify) => {
  // -------------------------------------------------------------------------
  // 1. Audit Ledger Verification & Cryptographic Export
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/reliability/audit/verify', { preHandler: [authenticate] }, async (request) => {
    const body = (request.body as any) || {};
    const data = await auditIntegrityService.verifyAuditLedger(
      request.session,
      {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined
      }
    );
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/audit/export', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as any) || {};
    const data = await auditIntegrityService.exportTamperEvidentLog(
      request.session,
      {
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined
      }
    );
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/audit/verifications', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as any) || {};
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const data = await auditIntegrityService.getVerificationHistory(request.session, limit);
    return { success: true, data };
  });

  // -------------------------------------------------------------------------
  // 2. Data Lineage Traceability DAG
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/partner/reliability/lineage/:entityType/:entityId', { preHandler: [authenticate] }, async (request) => {
    const { entityType, entityId } = request.params as { entityType: string; entityId: string };
    const data = await dataLineageService.getEntityLineage(entityType, entityId, request.session);
    return { success: true, data };
  });

  // -------------------------------------------------------------------------
  // 3. Multi-Domain Reconciliation Engine
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/reliability/reconciliation/run', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as { domain: ReconciliationDomain; branchId?: string; notes?: string };
    const data = await reconciliationEngineService.executeReconciliationRun(body, request.session);
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/reconciliation/runs', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as any) || {};
    const data = await reconciliationEngineService.getReconciliationRuns(
      request.session,
      query.domain as ReconciliationDomain | undefined,
      query.limit ? parseInt(query.limit, 10) : undefined
    );
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/reconciliation/runs/:id/discrepancies', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await reconciliationEngineService.getDiscrepanciesByRun(id, request.session);
    return { success: true, data };
  });

  fastify.post('/api/v1/partner/reliability/reconciliation/discrepancies/:id/resolve', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as { resolutionRemarks: string };
    const data = await reconciliationEngineService.resolveDiscrepancy(id, body, request.session);
    return { success: true, data };
  });

  // -------------------------------------------------------------------------
  // 4. Enterprise Idempotency Framework
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/partner/reliability/idempotency/stats', { preHandler: [authenticate] }, async (request) => {
    const data = await idempotencyEngineService.getIdempotencyStats(request.session);
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/idempotency/keys/:key', { preHandler: [authenticate] }, async (request) => {
    const { key } = request.params as { key: string };
    const data = await idempotencyEngineService.inspectKey(key, request.session);
    return { success: true, data };
  });

  fastify.delete('/api/v1/partner/reliability/idempotency/keys/:key', { preHandler: [authenticate] }, async (request) => {
    const { key } = request.params as { key: string };
    const body = (request.body as any) || {};
    const data = await idempotencyEngineService.evictKey(key, body.reason || 'Manual administrative eviction', request.session);
    return { success: true, data };
  });

  // -------------------------------------------------------------------------
  // 5. Distributed Saga Orchestrator
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/partner/reliability/sagas', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as any) || {};
    const data = await sagaOrchestratorService.getSagas(request.session, query.limit ? parseInt(query.limit, 10) : undefined);
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/sagas/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await sagaOrchestratorService.getSagaDetails(id, request.session);
    return { success: true, data };
  });

  // -------------------------------------------------------------------------
  // 6. Device Governance & Instant Revocation
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/reliability/devices/enroll', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as any;
    const data = await deviceGovernanceService.enrollDevice(body, request.session);
    return { success: true, data };
  });

  const DeviceHeartbeatSchema = z.object({
    deviceCode: z.string().min(1, 'deviceCode is required'),
    deviceToken: z.string().min(1, 'deviceToken is required'),
    firmwareVersion: z.string().optional(),
    networkStatus: z.string().optional(),
    batteryLevel: z.number().optional(),
    lastTelemetrySnapshot: z.record(z.any()).optional()
  });

  fastify.post('/api/v1/partner/reliability/devices/heartbeat', async (request) => {
    const parseResult = DeviceHeartbeatSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        message: 'Invalid device heartbeat payload: ' + parseResult.error.errors.map(e => e.message).join(', '),
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }
    const tenantId = (request.headers['x-tenant-id'] as string) || (request as any).session?.tenantId;
    if (!tenantId) {
      throw new AppError({
        message: 'Tenant context header (x-tenant-id) is required for device telemetry heartbeat',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
    const data = await deviceGovernanceService.recordHeartbeat(parseResult.data as any, tenantId);
    return { success: true, data };
  });

  fastify.post('/api/v1/partner/reliability/devices/:id/revoke', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const data = await deviceGovernanceService.revokeDevice(id, body.reason || 'Administrative revocation', request.session);
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/devices', { preHandler: [authenticate] }, async (request) => {
    const data = await deviceGovernanceService.listDevices(request.session);
    return { success: true, data };
  });

  // -------------------------------------------------------------------------
  // 7. Offline Sync Queue & Non-LWW Conflict Resolution
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/reliability/offline-sync/batch', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as any;
    const data = await offlineSyncService.submitSyncBatch(body, request.session);
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/offline-sync/conflicts', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as any) || {};
    const unresolvedOnly = query.unresolvedOnly !== 'false';
    const data = await offlineSyncService.getConflicts(request.session, unresolvedOnly);
    return { success: true, data };
  });

  fastify.post('/api/v1/partner/reliability/offline-sync/conflicts/:id/resolve', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data = await offlineSyncService.resolveConflict(id, body, request.session);
    return { success: true, data };
  });

  // -------------------------------------------------------------------------
  // 8. Incident Management & CAPA Tracking
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/reliability/incidents', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as any;
    const data = await incidentCapaService.reportIncident(body, request.session);
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/incidents', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as any) || {};
    const data = await incidentCapaService.getIncidents(query, request.session);
    return { success: true, data };
  });

  fastify.get('/api/v1/partner/reliability/incidents/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await incidentCapaService.getIncidentDetails(id, request.session);
    return { success: true, data };
  });

  fastify.post('/api/v1/partner/reliability/incidents/:id/rca', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data = await incidentCapaService.conductRca(id, body, request.session);
    return { success: true, data };
  });

  fastify.post('/api/v1/partner/reliability/incidents/:id/capa', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data = await incidentCapaService.assignCapa(id, body, request.session);
    return { success: true, data };
  });

  fastify.post('/api/v1/partner/reliability/incidents/capa/:id/verify', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const data = await incidentCapaService.verifyCapa(id, body.verificationNotes || 'Verified by quality auditor', request.session);
    return { success: true, data };
  });
};
