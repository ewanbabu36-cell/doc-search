import crypto from 'node:crypto';
import {
  getDatabase,
  withSecurityContext,
  sagaWorkflows,
  sagaSteps,
  desc,
  eq,
  and,
  type SagaWorkflow
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

const logger = createLogger('saga-orchestrator-service');

export interface SagaStepDefinition {
  stepName: string;
  forwardAction: string;
  executeForward: (context: any) => Promise<any>;
  compensationAction: string;
  executeCompensation: (context: any, forwardResult: any) => Promise<any>;
}

export interface SagaExecutionResult {
  sagaId: string;
  sagaCode: string;
  status: 'COMPLETED' | 'COMPENSATED' | 'FAILED';
  totalSteps: number;
  completedSteps: number;
  compensatedSteps: number;
  context: any;
  error?: string | undefined;
}

type ScopedDbClient = NonNullable<ReturnType<typeof getDatabase>>;

export class SagaOrchestratorService {
  private async runScoped<T>(
    session: SessionContext,
    db: any,
    fn: (tx: ScopedDbClient) => Promise<T>
  ): Promise<T> {
    const rootDb = getDatabase();
    if (db && rootDb && db === rootDb) {
      return withSecurityContext(rootDb, session, (tx) => fn(tx as unknown as ScopedDbClient));
    }
    return fn(db as ScopedDbClient);
  }

  /**
   * Executes a distributed multi-service saga with automated compensatory rollback upon failure.
   */
  async executeSaga(
    sagaType: string,
    correlationId: string,
    steps: SagaStepDefinition[],
    initialContext: Record<string, unknown>,
    session: SessionContext,
    db = getDatabase()
  ): Promise<SagaExecutionResult> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;
    const sagaSession: SessionContext = { ...session, tenantId };

    const sagaCode = `SGA-${sagaType.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const initiatedBy = session.actorEmail || session.userId || 'DISTRIBUTED_SAGA_COORDINATOR';

    const [workflow] = await this.runScoped(sagaSession, db, (tx) =>
      tx
        .insert(sagaWorkflows)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          branchId: scope.branchId || null,
          sagaCode,
          sagaType,
          correlationId,
          status: 'STARTED',
          currentStepIndex: 0,
          totalSteps: steps.length,
          contextPayload: initialContext,
          initiatedBy,
          startedAt: new Date()
        })
        .returning()
    );

    if (!workflow) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to initialize saga workflow.',
        statusCode: 500
      });
    }

    const currentContext = { ...initialContext };
    const executedStepResults: { stepIndex: number; stepId: string; def: SagaStepDefinition; result: any }[] = [];
    let failureOccurred = false;
    let failureError: any = null;
    let failedStepIndex = -1;

    for (let i = 0; i < steps.length; i++) {
      const stepDef = steps[i]!;

      // Insert saga step in PENDING/RUNNING state
      const [stepRow] = await this.runScoped(sagaSession, db, async (tx) => {
        const res = await tx
          .insert(sagaSteps)
          .values({
            id: crypto.randomUUID(),
            sagaId: workflow.id,
            tenantId,
            stepIndex: i,
            stepName: stepDef.stepName,
            status: 'RUNNING',
            forwardAction: stepDef.forwardAction,
            forwardPayload: currentContext,
            compensationAction: stepDef.compensationAction,
            startedAt: new Date()
          })
          .returning();

        await tx
          .update(sagaWorkflows)
          .set({ currentStepIndex: i, status: 'IN_PROGRESS' })
          .where(eq(sagaWorkflows.id, workflow.id));

        return res;
      });

      if (!stepRow) {
        throw new AppError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: `Failed to initialize saga step ${i + 1}.`,
          statusCode: 500
        });
      }

      try {
        logger.info(`Executing forward step ${i + 1}/${steps.length}: ${stepDef.stepName}`, { sagaCode });
        const stepOutput = await stepDef.executeForward(currentContext);

        await this.runScoped(sagaSession, db, (tx) =>
          tx
            .update(sagaSteps)
            .set({
              status: 'COMPLETED',
              forwardResult: stepOutput || {},
              completedAt: new Date()
            })
            .where(eq(sagaSteps.id, stepRow.id))
        );

        executedStepResults.push({
          stepIndex: i,
          stepId: stepRow.id,
          def: stepDef,
          result: stepOutput
        });

        if (stepOutput && typeof stepOutput === 'object') {
          Object.assign(currentContext, stepOutput);
        }
      } catch (err: any) {
        failureOccurred = true;
        failureError = err;
        failedStepIndex = i;

        logger.error(`Forward step ${i + 1} (${stepDef.stepName}) failed. Triggering compensation rollback.`, {
          sagaCode,
          error: String(err)
        });

        await this.runScoped(sagaSession, db, (tx) =>
          tx
            .update(sagaSteps)
            .set({
              status: 'FAILED',
              errorDetails: err?.message || String(err),
              completedAt: new Date()
            })
            .where(eq(sagaSteps.id, stepRow.id))
        );

        break;
      }
    }

    if (!failureOccurred) {
      await this.runScoped(sagaSession, db, async (tx) => {
        await tx
          .update(sagaWorkflows)
          .set({
            status: 'COMPLETED',
            completedAt: new Date(),
            contextPayload: currentContext
          })
          .where(eq(sagaWorkflows.id, workflow.id));

        await auditRepository.recordEvent({
          eventType: 'SAGA_WORKFLOW_COMPLETED',
          resourceType: 'saga_workflow',
          resourceId: workflow.id,
          tenantId,
          branchId: scope.branchId || session.branchId,
          metadata: {
            sagaCode,
            sagaType,
            totalSteps: steps.length,
            status: 'COMPLETED'
          }
        }, session, tx);
      });

      return {
        sagaId: workflow.id,
        sagaCode,
        status: 'COMPLETED',
        totalSteps: steps.length,
        completedSteps: steps.length,
        compensatedSteps: 0,
        context: currentContext
      };
    }

    // COMPENSATION ROLLBACK
    await this.runScoped(sagaSession, db, (tx) =>
      tx
        .update(sagaWorkflows)
        .set({
          status: 'COMPENSATING',
          failureReason: failureError?.message || String(failureError)
        })
        .where(eq(sagaWorkflows.id, workflow.id))
    );

    let compensatedCount = 0;
    let compensationFailed = false;

    for (let j = executedStepResults.length - 1; j >= 0; j--) {
      const exec = executedStepResults[j]!;
      logger.warn(`Compensating step ${exec.stepIndex + 1}: ${exec.def.compensationAction}`, { sagaCode });

      await this.runScoped(sagaSession, db, (tx) =>
        tx
          .update(sagaSteps)
          .set({ status: 'COMPENSATING' })
          .where(eq(sagaSteps.id, exec.stepId))
      );

      try {
        const compResult = await exec.def.executeCompensation(currentContext, exec.result);
        await this.runScoped(sagaSession, db, (tx) =>
          tx
            .update(sagaSteps)
            .set({
              status: 'COMPENSATED',
              compensationResult: compResult || {},
              completedAt: new Date()
            })
            .where(eq(sagaSteps.id, exec.stepId))
        );
        compensatedCount++;
      } catch (compErr: any) {
        compensationFailed = true;
        logger.error(`Compensation action for step ${exec.stepIndex + 1} failed!`, {
          sagaCode,
          error: String(compErr)
        });
        await this.runScoped(sagaSession, db, (tx) =>
          tx
            .update(sagaSteps)
            .set({
              status: 'FAILED',
              errorDetails: `Compensation error: ${compErr?.message || String(compErr)}`,
              completedAt: new Date()
            })
            .where(eq(sagaSteps.id, exec.stepId))
        );
      }
    }

    const finalSagaStatus: 'COMPENSATED' | 'FAILED' = compensationFailed ? 'FAILED' : 'COMPENSATED';

    await this.runScoped(sagaSession, db, async (tx) => {
      await tx
        .update(sagaWorkflows)
        .set({
          status: finalSagaStatus,
          completedAt: new Date()
        })
        .where(eq(sagaWorkflows.id, workflow.id));

      await auditRepository.recordEvent({
        eventType: 'SAGA_WORKFLOW_ROLLED_BACK',
        resourceType: 'saga_workflow',
        resourceId: workflow.id,
        tenantId,
        branchId: scope.branchId || session.branchId,
        metadata: {
          sagaCode,
          sagaType,
          failedStepIndex,
          failureReason: failureError?.message || String(failureError),
          compensatedSteps: compensatedCount,
          status: finalSagaStatus
        }
      }, session, tx);
    });

    return {
      sagaId: workflow.id,
      sagaCode,
      status: finalSagaStatus,
      totalSteps: steps.length,
      completedSteps: executedStepResults.length,
      compensatedSteps: compensatedCount,
      context: currentContext,
      error: failureError?.message || String(failureError)
    };
  }

  /**
   * Retrieves historical saga workflows for the session tenant.
   */
  async getSagas(session: SessionContext, limit = 50, db = getDatabase()): Promise<SagaWorkflow[]> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return this.runScoped({ ...session, tenantId: scope.tenantId }, db, (tx) =>
      tx
        .select()
        .from(sagaWorkflows)
        .where(eq(sagaWorkflows.tenantId, scope.tenantId))
        .orderBy(desc(sagaWorkflows.startedAt))
        .limit(limit)
    );
  }

  /**
   * Retrieves full execution trace and step records for a saga.
   */
  async getSagaDetails(sagaId: string, session: SessionContext, db = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);

    return this.runScoped({ ...session, tenantId: scope.tenantId }, db, async (tx) => {
      const [workflow] = await tx
        .select()
        .from(sagaWorkflows)
        .where(and(eq(sagaWorkflows.id, sagaId), eq(sagaWorkflows.tenantId, scope.tenantId)))
        .limit(1);

      if (!workflow) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: 'Saga workflow not found in tenant scope.',
          statusCode: 404
        });
      }

      const steps = await tx
        .select()
        .from(sagaSteps)
        .where(and(eq(sagaSteps.sagaId, sagaId), eq(sagaSteps.tenantId, scope.tenantId)))
        .orderBy(sagaSteps.stepIndex);

      return {
        workflow,
        steps
      };
    });
  }
}

export const sagaOrchestratorService = new SagaOrchestratorService();
