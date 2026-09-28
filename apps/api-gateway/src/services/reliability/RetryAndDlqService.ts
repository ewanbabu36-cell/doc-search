import crypto from 'node:crypto';
import {
  getDatabase,
  deadLetterJobs,
  outboxJobs,
  desc,
  eq,
  and,
  type DeadLetterJob
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

const logger = createLogger('retry-dlq-service');

export interface SendToDlqInput {
  tenantId: string;
  sourceQueue?: string | undefined;
  originalJobId: string;
  jobType: string;
  payload: any;
  failureReason: string;
  stackTrace?: string | undefined;
  totalAttempts?: number | undefined;
}

export interface DlqFilter {
  tenantId?: string | undefined;
  status?: 'DEAD_LETTERED' | 'REPLAYED' | 'DISCARDED' | undefined;
  jobType?: string | undefined;
  limit?: number | undefined;
}

export class RetryAndDlqService {
  /**
   * Computes exponential backoff with full jitter to avoid thundering herd problems.
   */
  calculateBackoff(attempt: number, baseDelayMs = 1000, maxDelayMs = 30000): number {
    const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    return Math.floor(Math.random() * exponential);
  }

  /**
   * Transitions an exhausted background job to the Dead Letter Queue.
   */
  async sendToDlq(input: SendToDlqInput, session?: SessionContext, db = getDatabase()): Promise<DeadLetterJob> {
    const id = crypto.randomUUID();

    const [dlqJob] = await db
      .insert(deadLetterJobs)
      .values({
        id,
        tenantId: input.tenantId,
        sourceQueue: input.sourceQueue || 'outbox_jobs',
        originalJobId: input.originalJobId,
        jobType: input.jobType,
        payload: input.payload,
        failureReason: input.failureReason,
        stackTrace: input.stackTrace || null,
        totalAttempts: input.totalAttempts || 5,
        status: 'DEAD_LETTERED'
      })
      .returning();

    if (!dlqJob) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to insert dead letter job.',
        statusCode: 500
      });
    }

    // If original job is in outboxJobs, mark it DLQ
    try {
      await db
        .update(outboxJobs)
        .set({ status: 'DLQ', lastError: input.failureReason, updatedAt: new Date() })
        .where(eq(outboxJobs.id, input.originalJobId));
    } catch {}

    logger.warn('Job routed to Dead Letter Queue', {
      dlqId: id,
      originalJobId: input.originalJobId,
      jobType: input.jobType,
      tenantId: input.tenantId
    });

    if (session) {
      await auditRepository.recordEvent({
        eventType: 'JOB_DEAD_LETTERED',
        resourceType: 'dead_letter_job',
        resourceId: id,
        tenantId: input.tenantId,
        branchId: session.branchId,
        metadata: {
          originalJobId: input.originalJobId,
          jobType: input.jobType,
          failureReason: input.failureReason
        }
      }, session, db);
    }

    return dlqJob;
  }

  /**
   * Lists DLQ records with role and tenant-based filtering.
   */
  async getDlqJobs(
    filter: DlqFilter,
    session: SessionContext,
    db = getDatabase()
  ): Promise<DeadLetterJob[]> {
    const isSuperAdmin = Boolean(session.isSuperAdmin || (session.roles || []).includes('SUPER_ADMIN'));
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const targetTenantId = isSuperAdmin && filter.tenantId !== undefined ? filter.tenantId : scope.tenantId;

    const conditions: any[] = [];
    if (targetTenantId) {
      conditions.push(eq(deadLetterJobs.tenantId, targetTenantId));
    }
    if (filter.status) {
      conditions.push(eq(deadLetterJobs.status, filter.status));
    }
    if (filter.jobType) {
      conditions.push(eq(deadLetterJobs.jobType, filter.jobType));
    }

    const limit = Math.min(filter.limit || 50, 200);

    return db
      .select()
      .from(deadLetterJobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(deadLetterJobs.createdAt))
      .limit(limit);
  }

  /**
   * Safely replays a dead-letter job by re-queuing it into outbox_jobs or re-dispatching.
   */
  async replayDlqJob(id: string, session: SessionContext, db = getDatabase()) {
    const isSuperAdmin = Boolean(session.isSuperAdmin || (session.roles || []).includes('SUPER_ADMIN'));
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const [job] = await db
      .select()
      .from(deadLetterJobs)
      .where(
        isSuperAdmin
          ? eq(deadLetterJobs.id, id)
          : and(eq(deadLetterJobs.id, id), eq(deadLetterJobs.tenantId, scope.tenantId))
      )
      .limit(1);

    if (!job) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Dead letter job not found in authorized scope.',
        statusCode: 404
      });
    }

    if (job.status !== 'DEAD_LETTERED') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Job cannot be replayed: current status is '${job.status}'.`,
        statusCode: 400
      });
    }

    const replayedBy = session.actorEmail || session.userId || 'HQ_OPERATIONS';
    const replayedAt = new Date();

    // Re-queue in outbox_jobs with reset attempt counter
    const [newOutboxJob] = await db
      .insert(outboxJobs)
      .values({
        id: crypto.randomUUID(),
        tenantId: job.tenantId,
        jobType: job.jobType,
        payload: job.payload,
        status: 'PENDING',
        priority: 1,
        attempts: 0,
        maxAttempts: 5
      })
      .returning();

    if (!newOutboxJob) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to re-queue job into outbox.',
        statusCode: 500
      });
    }

    // Update DLQ job status
    const [updatedDlq] = await db
      .update(deadLetterJobs)
      .set({
        status: 'REPLAYED',
        replayedAt,
        replayedBy,
        updatedAt: replayedAt
      })
      .where(eq(deadLetterJobs.id, job.id))
      .returning();

    await auditRepository.recordEvent({
      eventType: 'DLQ_JOB_REPLAYED',
      resourceType: 'dead_letter_job',
      resourceId: job.id,
      tenantId: job.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        dlqJobId: job.id,
        newOutboxJobId: newOutboxJob.id,
        replayedBy
      }
    }, session, db);

    return {
      replayed: true,
      dlqJob: updatedDlq,
      requeuedJobId: newOutboxJob.id
    };
  }

  /**
   * Permanently discards a dead-letter job with authorized rationale.
   */
  async discardDlqJob(id: string, reason: string, session: SessionContext, db = getDatabase()) {
    const isSuperAdmin = Boolean(session.isSuperAdmin || (session.roles || []).includes('SUPER_ADMIN'));
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    if (!reason || !reason.trim()) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Discard reason is mandatory.',
        statusCode: 400
      });
    }

    const [job] = await db
      .select()
      .from(deadLetterJobs)
      .where(
        isSuperAdmin
          ? eq(deadLetterJobs.id, id)
          : and(eq(deadLetterJobs.id, id), eq(deadLetterJobs.tenantId, scope.tenantId))
      )
      .limit(1);

    if (!job) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Dead letter job not found in authorized scope.',
        statusCode: 404
      });
    }

    if (job.status !== 'DEAD_LETTERED') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Job cannot be discarded: current status is '${job.status}'.`,
        statusCode: 400
      });
    }

    const discardedBy = session.actorEmail || session.userId || 'HQ_OPERATIONS';

    const [updated] = await db
      .update(deadLetterJobs)
      .set({
        status: 'DISCARDED',
        discardedBy,
        discardReason: reason.trim(),
        updatedAt: new Date()
      })
      .where(eq(deadLetterJobs.id, job.id))
      .returning();

    await auditRepository.recordEvent({
      eventType: 'DLQ_JOB_DISCARDED',
      resourceType: 'dead_letter_job',
      resourceId: job.id,
      tenantId: job.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        dlqJobId: job.id,
        discardedBy,
        discardReason: reason.trim()
      }
    }, session, db);

    return updated;
  }

  /**
   * Retrieves summary counts for the Dead Letter Queue.
   */
  async getDlqMetrics(session: SessionContext, db = getDatabase()) {
    const isSuperAdmin = Boolean(session.isSuperAdmin || (session.roles || []).includes('SUPER_ADMIN'));
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    const jobs = await db
      .select({ status: deadLetterJobs.status })
      .from(deadLetterJobs)
      .where(isSuperAdmin ? undefined : eq(deadLetterJobs.tenantId, scope.tenantId));

    let deadLettered = 0;
    let replayed = 0;
    let discarded = 0;

    for (const j of jobs) {
      if (j.status === 'DEAD_LETTERED') deadLettered++;
      else if (j.status === 'REPLAYED') replayed++;
      else if (j.status === 'DISCARDED') discarded++;
    }

    return {
      total: jobs.length,
      deadLettered,
      replayed,
      discarded
    };
  }
}

export const retryAndDlqService = new RetryAndDlqService();
