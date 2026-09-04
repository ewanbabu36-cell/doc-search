import { createHash, randomUUID } from 'node:crypto';
import type { SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { capabilityRegistry } from './capability-registry.js';
import { toolRegistry } from './tool-registry.js';
import { permissionFirewall } from './permission-firewall.js';
import { defaultModelProvider } from './provider-interface.js';
import { resolveRoleContext } from './role-context.js';
import type { AuditEvent } from '@docsearch/database';
import { auditRepository } from '../repositories/core/AuditRepository.js';
import type {
  AiActionClassification,
  AiExecutionResult,
  AiModelProvider,
  AiRequestContext
} from './types.js';

const logger = createLogger('ai-core');

export interface ExecuteCapabilityOptions {
  toolId?: string | undefined;
  toolInput?: unknown;
  prompt?: string | undefined;
  targetTenantId?: string | undefined;
  targetBranchId?: string | undefined;
  isApprovalGranted?: boolean | undefined;
  approverId?: string | undefined;
  approvalCapabilityId?: string | undefined;
  correlationId?: string | undefined;
  clientIp?: string | undefined;
  userAgent?: string | undefined;
}

export interface AiUsageTelemetryRecord {
  requestId: string;
  tenantId: string;
  userId: string;
  capabilityId: string;
  toolId?: string | undefined;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  timestamp: Date;
  success: boolean;
}

export class AiCoreOrchestrator {
  private modelProvider: AiModelProvider = defaultModelProvider;
  private telemetryStore: AiUsageTelemetryRecord[] = [];

  /**
   * Sets or swaps the active model provider.
   */
  public setModelProvider(provider: AiModelProvider): void {
    this.modelProvider = provider;
  }

  /**
   * Constructs the strict, server-derived AiRequestContext from an authenticated SessionContext.
   */
  public buildRequestContext(
    session: SessionContext,
    capabilityId: string,
    options: {
      toolId?: string | undefined;
      correlationId?: string | undefined;
      clientIp?: string | undefined;
      userAgent?: string | undefined;
    } = {}
  ): AiRequestContext {
    if (!session || !session.userId || !session.tenantId) {
      throw AppError.unauthorized('Authenticated session required to establish AI Request Context');
    }

    const capability = capabilityRegistry.getCapability(capabilityId);
    const entitlementCode = capability?.requiredEntitlement || 'MODULE_AI_COPILOT';
    const roleContext = resolveRoleContext(session);

    return {
      requestId: randomUUID(),
      correlationId: options.correlationId || randomUUID(),
      userId: session.userId,
      tenantId: session.tenantId,
      branchId: session.branchId,
      roles: session.roles || [],
      permissions: session.permissions || [],
      capabilityId,
      toolId: options.toolId,
      entitlementCode,
      auditContext: {
        clientIp: options.clientIp,
        userAgent: options.userAgent
      },
      timestamp: new Date(),
      session,
      roleContext
    };
  }

  /**
   * Computes a deterministic SHA-256 cryptographic audit hash for an AI operation.
   */
  public computeAuditHash(payload: Record<string, unknown>, previousHash = 'GENESIS_AI_ROOT'): string {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return createHash('sha256').update(`${previousHash}::${canonical}`).digest('hex');
  }

  /**
   * Central AI Execution Pipeline:
   * 1. Establish Request Context
   * 2. Execute Permission Firewall (9 Gates)
   * 3. Execute Tool or Model Generation
   * 4. Record Usage Telemetry
   * 5. Generate Cryptographic Audit Trail
   */
  public async executeCapability<T = unknown>(
    session: SessionContext,
    capabilityId: string,
    options: ExecuteCapabilityOptions = {}
  ): Promise<AiExecutionResult<T>> {
    const startTime = Date.now();
    const context = this.buildRequestContext(session, capabilityId, {
      toolId: options.toolId,
      correlationId: options.correlationId,
      clientIp: options.clientIp,
      userAgent: options.userAgent
    });

    // 1. Permission Firewall 9-Gate Evaluation
    const firewallResult = await permissionFirewall.evaluate(context, {
      toolId: options.toolId,
      toolInput: options.toolInput,
      targetTenantId: options.targetTenantId,
      targetBranchId: options.targetBranchId,
      isApprovalGranted: options.isApprovalGranted,
      approverId: options.approverId,
      approvalCapabilityId: options.approvalCapabilityId
    });

    if (!firewallResult.allowed) {
      logger.warn('AI execution blocked by Permission Firewall', {
        requestId: context.requestId,
        failedGate: firewallResult.failedGate,
        reason: firewallResult.denialReason,
        tenantId: context.tenantId,
        userId: context.userId
      });

      throw new AppError({
        message: firewallResult.denialReason || 'Access denied by AI Permission Firewall',
        code: firewallResult.statusCode === 401 ? ErrorCode.UNAUTHORIZED : ErrorCode.FORBIDDEN,
        statusCode: firewallResult.statusCode || 403
      });
    }

    const capability = capabilityRegistry.getCapability(capabilityId);
    if (!capability) {
      throw new AppError({
        message: `Capability '${capabilityId}' not found`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    let executionOutput: T;
    let inputTokens = 0;
    let outputTokens = 0;
    let actionClassification: AiActionClassification = 'SUGGEST';

    try {
      // 2. Controlled Execution Path
      if (options.toolId) {
        // Safe Tool Invocation Boundary
        const tool = toolRegistry.getTool(options.toolId);
        if (!tool) {
          throw new AppError({
            message: `Tool '${options.toolId}' not found`,
            code: ErrorCode.NOT_FOUND,
            statusCode: 404
          });
        }
        actionClassification = tool.actionClassification;

        // Input Schema Validation
        let validatedInput: unknown;
        try {
          validatedInput = tool.inputSchema.parse(options.toolInput || {});
        } catch {
          throw new AppError({
            message: `Malformed tool input: Validation failed for tool '${tool.name}'`,
            code: ErrorCode.VALIDATION_ERROR,
            statusCode: 400
          });
        }

        // Execute Tool Handler under human session context
        executionOutput = (await tool.handler(context, validatedInput)) as T;

        // Output Schema Validation
        try {
          tool.outputSchema.parse(executionOutput);
        } catch {
          throw new AppError({
            message: `Tool output safety violation: Output schema validation failed for tool '${tool.name}'`,
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            statusCode: 502
          });
        }

        // Approximate token cost for tool payload
        inputTokens = Math.ceil(JSON.stringify(validatedInput).length / 4);
        outputTokens = Math.ceil(JSON.stringify(executionOutput).length / 4);
      } else {
        // Model Completion Path
        actionClassification = capability.humanApprovalRequired ? 'DRAFT' : 'SUGGEST';
        const prompt = options.prompt || `Perform clinical evaluation for capability ${capability.name}`;
        const completionResult = await this.modelProvider.generateCompletion(prompt);

        executionOutput = {
          capabilityId: capability.id,
          capabilityName: capability.name,
          result: completionResult.text,
          reviewStatus: capability.humanApprovalRequired ? 'AI_DRAFTED' : 'EVALUATED'
        } as unknown as T;

        inputTokens = completionResult.inputTokens;
        outputTokens = completionResult.outputTokens;
      }

      const durationMs = Date.now() - startTime;

      // 3. Usage & Cost Metering Hook
      this.recordTelemetry({
        requestId: context.requestId,
        tenantId: context.tenantId,
        userId: context.userId,
        capabilityId,
        toolId: options.toolId,
        inputTokens,
        outputTokens,
        durationMs,
        timestamp: new Date(),
        success: true
      });

      // 4. Persistent Audit & Cryptographic Hash Chain Hook
      const traceId = `TRACE-AI-${randomUUID().substring(0, 8)}`;
      let auditRecord: AuditEvent | undefined;

      try {
        auditRecord = await auditRepository.recordEvent(
          {
            tenantId: context.tenantId,
            branchId: context.branchId,
            eventType: 'AI_CAPABILITY_EXECUTED',
            resourceType: 'AI_CAPABILITY',
            resourceId: capabilityId,
            correlationId: context.correlationId,
            ipAddress: context.auditContext.clientIp,
            userAgent: context.auditContext.userAgent,
            metadata: {
              requestId: context.requestId,
              traceId,
              tenantId: context.tenantId,
              branchId: context.branchId,
              userId: context.userId,
              capabilityId,
              toolId: options.toolId,
              actionClassification,
              provider: this.modelProvider.name,
              modelVersion: this.modelProvider.version,
              inputTokens,
              outputTokens,
              durationMs,
              success: true,
              timestamp: new Date().toISOString()
            }
          },
          context.session
        );
      } catch (auditErr: unknown) {
        logger.warn('Failed to record persistent AI execution audit event', {
          error: auditErr instanceof Error ? auditErr.message : String(auditErr)
        });
      }

      const integrityHash = auditRecord?.integrityHash || this.computeAuditHash({
        traceId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        userId: context.userId,
        capabilityId,
        toolId: options.toolId,
        actionClassification,
        timestamp: context.timestamp.toISOString()
      });

      return {
        success: true,
        data: executionOutput,
        actionClassification,
        capabilityId,
        toolId: options.toolId,
        usage: {
          inputTokens,
          outputTokens,
          durationMs
        },
        audit: {
          traceId,
          integrityHash,
          previousHash: auditRecord?.previousHash || undefined,
          timestamp: new Date().toISOString()
        }
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;

      this.recordTelemetry({
        requestId: context.requestId,
        tenantId: context.tenantId,
        userId: context.userId,
        capabilityId,
        toolId: options.toolId,
        inputTokens,
        outputTokens,
        durationMs,
        timestamp: new Date(),
        success: false
      });

      // Attempt persistent failure audit
      try {
        await auditRepository.recordEvent(
          {
            tenantId: context.tenantId,
            branchId: context.branchId,
            eventType: 'AI_CAPABILITY_FAILED',
            resourceType: 'AI_CAPABILITY',
            resourceId: capabilityId,
            correlationId: context.correlationId,
            ipAddress: context.auditContext.clientIp,
            userAgent: context.auditContext.userAgent,
            metadata: {
              requestId: context.requestId,
              tenantId: context.tenantId,
              branchId: context.branchId,
              userId: context.userId,
              capabilityId,
              toolId: options.toolId,
              provider: this.modelProvider.name,
              modelVersion: this.modelProvider.version,
              inputTokens,
              outputTokens,
              durationMs,
              success: false,
              error: err instanceof Error ? err.message : String(err),
              timestamp: new Date().toISOString()
            }
          },
          context.session
        );
      } catch {
        // Fall through
      }

      if (err instanceof AppError) {
        throw err;
      }

      logger.error('Unexpected failure during AI execution', {
        requestId: context.requestId,
        error: err instanceof Error ? err.message : String(err)
      });

      throw new AppError({
        message: 'AI execution encountered an unrecoverable internal error',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }
  }

  /**
   * Records usage telemetry for metering, quota checks, and billing aggregation.
   */
  private recordTelemetry(record: AiUsageTelemetryRecord): void {
    this.telemetryStore.push(record);
    // Keep bounded in-memory buffer
    if (this.telemetryStore.length > 5000) {
      this.telemetryStore.shift();
    }
  }

  /**
   * Retrieves aggregated usage statistics for an organization.
   */
  public getTelemetryForTenant(tenantId: string): AiUsageTelemetryRecord[] {
    return this.telemetryStore.filter((r) => r.tenantId === tenantId);
  }

  /**
   * Retrieves persistent audit events recorded for an organization.
   */
  public async getAuditEventsForTenant(tenantId: string, limit = 50): Promise<AuditEvent[]> {
    return await auditRepository.getEventsByTenant(tenantId, limit);
  }
}

export const aiCore = new AiCoreOrchestrator();
