import { z } from 'zod';
import type { SessionContext } from '@docsearch/auth';

/**
 * 12. AI Action Classification
 */
export type AiActionClassification =
  | 'READ'
  | 'SUGGEST'
  | 'DRAFT'
  | 'EXECUTE_WITH_APPROVAL'
  | 'BLOCKED';

/**
 * 3. AI Request Context
 * Strict server-derived context, never trusted from client arguments alone.
 */
export interface AiRequestContext {
  requestId: string;
  correlationId: string;
  userId: string;
  tenantId: string;
  branchId?: string | undefined;
  roles: string[];
  permissions: string[];
  capabilityId: string;
  toolId?: string | undefined;
  entitlementCode?: string | undefined;
  auditContext: {
    clientIp?: string | undefined;
    userAgent?: string | undefined;
  };
  timestamp: Date;
  session: SessionContext;
  roleContext?: import('./role-context.js').ResolvedRoleContext | undefined;
}

/**
 * 4. Capability Registry Interface
 */
export interface AiCapabilityDefinition {
  id: string;
  name: string;
  description: string;
  category: 'CLINICAL' | 'OPERATIONAL' | 'FINANCIAL' | 'DIAGNOSTIC';
  requiredPermission: string;
  requiredEntitlement: string;
  allowedRoles: string[];
  allowedScope: 'TENANT' | 'BRANCH';
  allowedTools: string[];
  humanApprovalRequired: boolean;
  auditRequired: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  version: string;
}

/**
 * 5. Tool Registry Interface
 */
export interface AiToolDefinition<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  description: string;
  actionClassification: AiActionClassification;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  requiredPermission: string;
  tenantScoped: boolean;
  branchScoped: boolean;
  allowedCapabilities: string[];
  humanApprovalRequired: boolean;
  auditRequired: boolean;
  handler: (context: AiRequestContext, input: TInput) => Promise<TOutput>;
}

/**
 * 7. Permission Firewall Result
 */
export interface PermissionFirewallResult {
  allowed: boolean;
  failedGate?:
    | 'IDENTITY'
    | 'TENANT'
    | 'BRANCH'
    | 'RBAC'
    | 'PERMISSION'
    | 'CAPABILITY'
    | 'TOOL'
    | 'ENTITLEMENT'
    | 'APPROVAL'
    | 'ROLE_ESCALATION'
    | 'PATIENT_ISOLATION'
    | 'KILL_SWITCH'
    | undefined;
  denialReason?: string | undefined;
  statusCode?: number | undefined;
}

/**
 * 2. Model Provider Interface
 */
export interface AiModelProvider {
  name: string;
  version: string;
  generateCompletion(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
  }>;
  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: Record<string, unknown>
  ): Promise<{
    data: T;
    inputTokens: number;
    outputTokens: number;
  }>;
}

/**
 * AI Execution Output & Telemetry
 */
export interface AiExecutionResult<T = unknown> {
  success: boolean;
  data: T;
  actionClassification: AiActionClassification;
  capabilityId: string;
  toolId?: string | undefined;
  usage: {
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
  };
  audit: {
    traceId: string;
    integrityHash: string;
    previousHash?: string | null | undefined;
    timestamp: string;
  };
}
