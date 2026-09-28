import { type FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import { systemObservabilityService } from '../../services/reliability/SystemObservabilityService.js';
import { auditIntegrityService } from '../../services/reliability/AuditIntegrityService.js';
import { retryAndDlqService } from '../../services/reliability/RetryAndDlqService.js';
import { disasterRecoveryService } from '../../services/reliability/DisasterRecoveryService.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export const hqReliabilityRoutes: FastifyPluginAsync = async (fastify) => {
  // Access control helper for HQ/Superadmin
  const requireHqAdmin = (request: any) => {
    const session = request.session;
    const isSuperAdmin = Boolean(
      session?.isSuperAdmin ||
      (session?.roles || []).some((r: string) =>
        ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SECURITY_ADMIN', 'SYSTEM_ADMIN'].includes(r)
      )
    );
    if (!isSuperAdmin) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Access denied: Requires HQ or Superadmin role.',
        statusCode: 403
      });
    }
  };

  // -------------------------------------------------------------------------
  // 1. Observability & Operational Metrics
  // -------------------------------------------------------------------------
  const handleMetrics = async (request: any) => {
    requireHqAdmin(request);
    const data = await systemObservabilityService.getSystemMetrics(request.session);
    return { success: true, data };
  };

  const handleHealth = async () => {
    const data = await systemObservabilityService.getSystemMetrics();
    return {
      success: true,
      status: data.status,
      timestamp: data.timestamp,
      database: data.database,
      queues: data.queues
    };
  };

  fastify.get('/api/v1/hq/reliability/metrics', { preHandler: [authenticate] }, handleMetrics);
  fastify.get('/api/v1/hq/reliability/health', handleHealth);
  fastify.get('/api/v1/company/reliability/metrics', { preHandler: [authenticate] }, handleMetrics);
  fastify.get('/api/v1/company/reliability/health', handleHealth);

  // -------------------------------------------------------------------------
  // 2. Platform Audit Ledger Verification
  // -------------------------------------------------------------------------
  const handleVerifyLedger = async (request: any) => {
    requireHqAdmin(request);
    const body = (request.body as any) || {};
    const data = await auditIntegrityService.verifyAuditLedger(
      request.session,
      {
        tenantId: body.tenantId || undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined
      }
    );
    return { success: true, data };
  };

  fastify.post('/api/v1/hq/reliability/audit/verify-ledger', { preHandler: [authenticate] }, handleVerifyLedger);
  fastify.post('/api/v1/company/reliability/audit/verify-ledger', { preHandler: [authenticate] }, handleVerifyLedger);

  // -------------------------------------------------------------------------
  // 3. Dead Letter Queue Operations
  // -------------------------------------------------------------------------
  const handleGetDlq = async (request: any) => {
    requireHqAdmin(request);
    const query = (request.query as any) || {};
    const data = await retryAndDlqService.getDlqJobs(
      {
        tenantId: query.tenantId,
        status: query.status,
        jobType: query.jobType,
        limit: query.limit ? parseInt(query.limit, 10) : undefined
      },
      request.session
    );
    return { success: true, data };
  };

  const handleReplayDlq = async (request: any) => {
    requireHqAdmin(request);
    const { id } = request.params as { id: string };
    const data = await retryAndDlqService.replayDlqJob(id, request.session);
    return { success: true, data };
  };

  const handleDiscardDlq = async (request: any) => {
    requireHqAdmin(request);
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const data = await retryAndDlqService.discardDlqJob(id, body.reason || 'HQ administrative discard', request.session);
    return { success: true, data };
  };

  const handleDlqMetrics = async (request: any) => {
    requireHqAdmin(request);
    const data = await retryAndDlqService.getDlqMetrics(request.session);
    return { success: true, data };
  };

  fastify.get('/api/v1/hq/reliability/dlq', { preHandler: [authenticate] }, handleGetDlq);
  fastify.post('/api/v1/hq/reliability/dlq/:id/replay', { preHandler: [authenticate] }, handleReplayDlq);
  fastify.post('/api/v1/hq/reliability/dlq/:id/discard', { preHandler: [authenticate] }, handleDiscardDlq);
  fastify.get('/api/v1/hq/reliability/dlq/metrics', { preHandler: [authenticate] }, handleDlqMetrics);

  fastify.get('/api/v1/company/reliability/dlq', { preHandler: [authenticate] }, handleGetDlq);
  fastify.post('/api/v1/company/reliability/dlq/:id/replay', { preHandler: [authenticate] }, handleReplayDlq);
  fastify.post('/api/v1/company/reliability/dlq/:id/discard', { preHandler: [authenticate] }, handleDiscardDlq);
  fastify.get('/api/v1/company/reliability/dlq/metrics', { preHandler: [authenticate] }, handleDlqMetrics);

  // -------------------------------------------------------------------------
  // 4. Disaster Recovery & Backup Verification
  // -------------------------------------------------------------------------
  const handleCreateBackup = async (request: any) => {
    requireHqAdmin(request);
    const body = (request.body as any) || {};
    const data = await disasterRecoveryService.createBackup(body, request.session);
    return { success: true, data };
  };

  const handleRestoreDrill = async (request: any) => {
    requireHqAdmin(request);
    const body = request.body as { backupId: string };
    if (!body?.backupId) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'backupId is required to execute restore drill.',
        statusCode: 400
      });
    }
    const data = await disasterRecoveryService.executeRestoreDrill(body.backupId, request.session);
    return { success: true, data };
  };

  const handleDrReadiness = async (request: any) => {
    requireHqAdmin(request);
    const data = await disasterRecoveryService.getDrReadiness(request.session);
    return { success: true, data };
  };

  fastify.post('/api/v1/hq/reliability/disaster-recovery/backups', { preHandler: [authenticate] }, handleCreateBackup);
  fastify.post('/api/v1/hq/reliability/disaster-recovery/restore-drill', { preHandler: [authenticate] }, handleRestoreDrill);
  fastify.get('/api/v1/hq/reliability/disaster-recovery/readiness', { preHandler: [authenticate] }, handleDrReadiness);

  fastify.post('/api/v1/company/reliability/disaster-recovery/backups', { preHandler: [authenticate] }, handleCreateBackup);
  fastify.post('/api/v1/company/reliability/disaster-recovery/restore-drill', { preHandler: [authenticate] }, handleRestoreDrill);
  fastify.get('/api/v1/company/reliability/disaster-recovery/readiness', { preHandler: [authenticate] }, handleDrReadiness);
};
