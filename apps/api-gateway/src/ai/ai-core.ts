import { createHash, randomUUID } from 'node:crypto';
import type { SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { capabilityRegistry } from './capability-registry.js';
import { toolRegistry } from './tool-registry.js';
import { permissionFirewall } from './permission-firewall.js';
import { defaultModelProvider } from './provider-interface.js';
import { resolveRoleContext } from './role-context.js';
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
      approverId: options.approverId
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

    const capability = capabilityRegistry.getCapability(capabilityId)!;
    let executionOutput: T;
    let inputTokens = 0;
    let outputTokens = 0;
    let actionClassification: AiActionClassification = 'SUGGEST';

    try {
      // 2. Controlled Execution Path
      if (options.toolId) {
        // Safe Tool Invocation Boundary
        const tool = toolRegistry.getTool(options.toolId)!;
        actionClassification = tool.actionClassification;

        // Input Schema Validation
        const validatedInput = tool.inputSchema.parse(options.toolInput || {});

        // Execute Tool Handler under human session context
        executionOutput = (await tool.handler(context, validatedInput)) as T;

        // Output Schema Validation
        tool.outputSchema.parse(executionOutput);

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

      // 4. Audit Trail Cryptographic Hash Hook
      const traceId = `TRACE-AI-${randomUUID().substring(0, 8)}`;
      const integrityHash = this.computeAuditHash({
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
}

export const aiCore = new AiCoreOrchestrator();
