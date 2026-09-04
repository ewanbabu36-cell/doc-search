import { RBACEvaluator } from '@docsearch/auth';
import { capabilityRegistry } from './capability-registry.js';
import { toolRegistry } from './tool-registry.js';
import { entitlementService } from '../services/company/EntitlementService.js';
import { resolveRoleContext } from './role-context.js';
import type { AiRequestContext, PermissionFirewallResult } from './types.js';

export interface FirewallEvaluationOptions {
  toolId?: string | undefined;
  toolInput?: unknown;
  targetTenantId?: string | undefined;
  targetBranchId?: string | undefined;
  isApprovalGranted?: boolean | undefined;
  approverId?: string | undefined;
}

export class AiPermissionFirewall {
  /**
   * Evaluates the 9 consecutive security gates + Role Escalation + Patient Isolation.
   * Fail-Closed: returns { allowed: false, failedGate, denialReason, statusCode } immediately on any gate failure.
   */
  async evaluate(
    context: AiRequestContext,
    options: FirewallEvaluationOptions = {}
  ): Promise<PermissionFirewallResult> {
    // GATE 1: Identity Check
    if (!context.userId || !context.session || !context.session.userId) {
      return {
        allowed: false,
        failedGate: 'IDENTITY',
        denialReason: 'Unauthenticated AI invocation: Valid human user session required',
        statusCode: 401
      };
    }

    // GATE 2: Tenant Check
    if (!context.tenantId || !context.session.tenantId) {
      return {
        allowed: false,
        failedGate: 'TENANT',
        denialReason: 'Missing tenant context: AI cannot execute without verified organization boundary',
        statusCode: 403
      };
    }

    if (
      options.targetTenantId &&
      options.targetTenantId !== context.tenantId &&
      !context.session.isSuperAdmin
    ) {
      return {
        allowed: false,
        failedGate: 'TENANT',
        denialReason: 'Cross-tenant violation: AI cannot operate across organizational boundaries',
        statusCode: 403
      };
    }

    // GATE 3: Branch Check
    const isTenantAdmin =
      context.session.isSuperAdmin ||
      context.roles.includes('SUPER_ADMIN') ||
      context.roles.includes('COMPANY_ADMIN') ||
      context.roles.includes('HOSPITAL_ADMIN') ||
      context.roles.includes('CLINIC_ADMIN');

    if (
      !isTenantAdmin &&
      context.branchId &&
      options.targetBranchId &&
      options.targetBranchId !== context.branchId
    ) {
      return {
        allowed: false,
        failedGate: 'BRANCH',
        denialReason: 'Cross-branch violation: AI cannot access resources outside assigned facility branch',
        statusCode: 403
      };
    }

    // GATE 4: Capability Check
    const capability = capabilityRegistry.getCapability(context.capabilityId);
    if (!capability || capability.status !== 'ACTIVE') {
      return {
        allowed: false,
        failedGate: 'CAPABILITY',
        denialReason: `Capability '${context.capabilityId}' is unregistered, inactive, or deprecated`,
        statusCode: 403
      };
    }

    // GATE 4.5: Cross-Role Escalation Gate
    const roleContext = context.roleContext || resolveRoleContext(context.session);
    if (
      !context.session.isSuperAdmin &&
      !roleContext.permittedCapabilities.includes(context.capabilityId)
    ) {
      return {
        allowed: false,
        failedGate: 'ROLE_ESCALATION',
        denialReason: `Cross-role escalation violation: Role '${roleContext.role}' is not permitted to invoke capability '${capability.name}'`,
        statusCode: 403
      };
    }

    // GATE 4.6: Patient Data Isolation Gate
    if (roleContext.role === 'PATIENT') {
      const inputObj = (options.toolInput || {}) as Record<string, unknown>;
      const requestedMrn = inputObj['patientMrn'] || inputObj['patient_mrn'];
      if (
        requestedMrn &&
        typeof requestedMrn === 'string' &&
        requestedMrn !== context.userId &&
        requestedMrn !== roleContext.patientMrn
      ) {
        return {
          allowed: false,
          failedGate: 'PATIENT_ISOLATION',
          denialReason: 'Patient data isolation violation: Authenticated patient cannot access records of another patient',
          statusCode: 403
        };
      }
    }

    // GATE 5: RBAC Role Check
    if (!context.session.isSuperAdmin) {
      const hasAllowedRole = context.roles.some((r) => capability.allowedRoles.includes(r));
      if (!hasAllowedRole) {
        return {
          allowed: false,
          failedGate: 'RBAC',
          denialReason: `User role [${context.roles.join(', ')}] is not authorized for capability '${capability.name}'`,
          statusCode: 403
        };
      }
    }

    // GATE 6: Granular Permission Check
    if (!RBACEvaluator.hasPermission(context.session, capability.requiredPermission)) {
      return {
        allowed: false,
        failedGate: 'PERMISSION',
        denialReason: `User lacks required permission '${capability.requiredPermission}' for capability '${capability.name}'`,
        statusCode: 403
      };
    }

    // GATE 7: Tool Check (If a tool is being invoked)
    const toolIdToVerify = options.toolId || context.toolId;
    if (toolIdToVerify) {
      const tool = toolRegistry.getTool(toolIdToVerify);
      if (!tool) {
        return {
          allowed: false,
          failedGate: 'TOOL',
          denialReason: `Tool '${toolIdToVerify}' is not registered in the tool catalog`,
          statusCode: 403
        };
      }

      if (!capability.allowedTools.includes(toolIdToVerify)) {
        return {
          allowed: false,
          failedGate: 'TOOL',
          denialReason: `Tool '${toolIdToVerify}' is not permitted for capability '${capability.name}'`,
          statusCode: 403
        };
      }

      // Tool-level permission check
      if (tool.requiredPermission && !RBACEvaluator.hasPermission(context.session, tool.requiredPermission)) {
        return {
          allowed: false,
          failedGate: 'PERMISSION',
          denialReason: `User lacks tool-specific permission '${tool.requiredPermission}' for tool '${tool.name}'`,
          statusCode: 403
        };
      }
    }

    // GATE 8: Commercial Entitlement Check
    const isEntitled = await entitlementService.canAccess(
      context.session,
      capability.requiredEntitlement
    );

    if (!isEntitled) {
      return {
        allowed: false,
        failedGate: 'ENTITLEMENT',
        denialReason: `Feature entitlement '${capability.requiredEntitlement}' is not active in organization subscription`,
        statusCode: 403
      };
    }

    // GATE 9: Human-in-the-Loop Approval Check
    if (capability.humanApprovalRequired) {
      if (options.isApprovalGranted === false || (!options.isApprovalGranted && options.approverId === undefined)) {
        if (options.toolId) {
          const tool = toolRegistry.getTool(options.toolId);
          if (tool?.humanApprovalRequired && !options.isApprovalGranted) {
            return {
              allowed: false,
              failedGate: 'APPROVAL',
              denialReason: `Operation on tool '${tool.name}' requires verified clinician approval before execution`,
              statusCode: 400
            };
          }
        }
      }
    }

    return { allowed: true };
  }
}

export const permissionFirewall = new AiPermissionFirewall();
