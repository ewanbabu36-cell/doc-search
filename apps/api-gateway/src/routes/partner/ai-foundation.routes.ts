import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireActiveCommercialAccess } from '../../plugins/commercial-guard.js';
import { aiCore, capabilityRegistry, toolRegistry, resolveRoleContext } from '../../ai/index.js';
import { AppError } from '@docsearch/shared-core';

export const aiFoundationRoutes: FastifyPluginAsync = async (app) => {
  /**
   * 0. Resolve Role Context for authenticated session
   */
  app.get(
    '/api/v1/partner/ai/role-context',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const roleContext = resolveRoleContext(request.session);
      return reply.send({
        success: true,
        data: roleContext
      });
    }
  );
  /**
   * 1. List active AI capabilities
   */
  app.get(
    '/api/v1/partner/ai/capabilities',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (_request, reply) => {
      const capabilities = capabilityRegistry.listCapabilities();
      return reply.send({
        success: true,
        data: capabilities
      });
    }
  );

  /**
   * 2. List permitted tools for a capability
   */
  app.get(
    '/api/v1/partner/ai/tools',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const { capabilityId } = request.query as { capabilityId?: string };
      if (!capabilityId) {
        const allTools = toolRegistry.listTools().map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          actionClassification: t.actionClassification,
          allowedCapabilities: t.allowedCapabilities,
          humanApprovalRequired: t.humanApprovalRequired
        }));
        return reply.send({ success: true, data: allTools });
      }

      const capability = capabilityRegistry.getCapability(capabilityId);
      if (!capability) {
        throw new AppError({
          message: `Capability '${capabilityId}' not found`,
          statusCode: 404
        });
      }

      const tools = toolRegistry.listToolsForCapability(capabilityId).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        actionClassification: t.actionClassification,
        allowedCapabilities: t.allowedCapabilities,
        humanApprovalRequired: t.humanApprovalRequired
      }));

      return reply.send({ success: true, data: tools });
    }
  );

  /**
   * 3. Execute AI capability through the 9-gate Permission Firewall
   */
  app.post(
    '/api/v1/partner/ai/execute',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        capabilityId?: string;
        toolId?: string;
        toolInput?: unknown;
        prompt?: string;
        isApprovalGranted?: boolean;
        approverId?: string;
        approvalCapabilityId?: string;
        targetTenantId?: string;
        targetBranchId?: string;
      };

      if (!body.capabilityId) {
        throw new AppError({
          message: "Field 'capabilityId' is mandatory for AI execution",
          statusCode: 400
        });
      }

      const correlationId = (request.headers['x-correlation-id'] as string) || request.id;
      const clientIp = request.ip;
      const userAgent = request.headers['user-agent'];

      const result = await aiCore.executeCapability(request.session, body.capabilityId, {
        toolId: body.toolId,
        toolInput: body.toolInput,
        prompt: body.prompt,
        targetTenantId: body.targetTenantId,
        targetBranchId: body.targetBranchId,
        isApprovalGranted: body.isApprovalGranted,
        approverId: body.approverId,
        approvalCapabilityId: body.approvalCapabilityId,
        correlationId,
        clientIp,
        userAgent
      });

      return reply.send({
        success: true,
        data: result
      });
    }
  );

  /**
   * 4. Retrieve usage telemetry for the caller's organization
   */
  app.get(
    '/api/v1/partner/ai/usage',
    { preHandler: [authenticate, requireActiveCommercialAccess] },
    async (request, reply) => {
      const telemetry = aiCore.getTelemetryForTenant(request.session.tenantId);
      return reply.send({
        success: true,
        data: telemetry
      });
    }
  );
};
