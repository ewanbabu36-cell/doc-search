import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import {
  identitySecurityFoundationService,
  type AuthorizationResourceTarget,
  type AuthorizationEvaluationContext,
  type StaffLifecycleStatus,
  type CredentialLifecycleStatus
} from '../../services/security/IdentitySecurityFoundationService.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export const identitySecurityFoundationRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Canonical Master Identity Resolution
  fastify.get(
    '/api/v1/partner/security/identity',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const identity = await identitySecurityFoundationService.resolveCanonicalIdentity(request.session);
      if (!identity) {
        throw AppError.unauthorized('Unable to resolve canonical identity');
      }
      return reply.send({ success: true, data: identity });
    }
  );

  // 2. Canonical Permission Registry
  fastify.get(
    '/api/v1/partner/security/permissions/registry',
    { preHandler: [authenticate] },
    async (_request, reply) => {
      const registry = identitySecurityFoundationService.getPermissionRegistry();
      return reply.send({ success: true, data: registry });
    }
  );

  // 3. RBAC Custom Role Creation & Update
  fastify.post(
    '/api/v1/partner/security/roles',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        code: string;
        name: string;
        description?: string;
        permissions: string[];
      };
      const created = await identitySecurityFoundationService.createCustomRole(request.session, body);
      return reply.status(201).send({ success: true, data: created });
    }
  );

  fastify.patch(
    '/api/v1/partner/security/roles/:roleCode',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { roleCode } = request.params as { roleCode: string };
      const body = (request.body || {}) as {
        addPermissions?: string[];
        revokePermissions?: string[];
        disable?: boolean;
      };
      const updated = await identitySecurityFoundationService.updateCustomRolePermissions(
        request.session,
        roleCode,
        body
      );
      return reply.send({ success: true, data: updated });
    }
  );

  // 4. Canonical Access Decision Engine Endpoint (authorize)
  const handleAuthorize = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = (request.body || {}) as {
      action: string;
      resource?: AuthorizationResourceTarget;
      context?: AuthorizationEvaluationContext;
    };

    const headers = request.headers;
    const evalContext: AuthorizationEvaluationContext = {
      ...(body.context || {}),
      requestId: request.id,
      ipAddress: request.ip,
      userAgent: typeof headers['user-agent'] === 'string' ? headers['user-agent'] : undefined,
      clientSuppliedPartnerId:
        body.context?.clientSuppliedPartnerId ||
        (typeof headers['x-partner-id'] === 'string' ? headers['x-partner-id'] : undefined) ||
        (typeof (body as any).partnerId === 'string' ? (body as any).partnerId : undefined),
      clientSuppliedStaffId:
        body.context?.clientSuppliedStaffId ||
        (typeof headers['x-staff-id'] === 'string' ? headers['x-staff-id'] : undefined) ||
        (typeof (body as any).staffId === 'string' ? (body as any).staffId : undefined),
      clientSuppliedUserId:
        body.context?.clientSuppliedUserId ||
        (typeof headers['x-user-id'] === 'string' ? headers['x-user-id'] : undefined),
      clientSuppliedRole:
        body.context?.clientSuppliedRole ||
        (typeof headers['x-role'] === 'string' ? headers['x-role'] : undefined)
    };

    const result = await identitySecurityFoundationService.authorize(
      request.session,
      body.action,
      body.resource || {},
      evalContext
    );

    const statusCode = result.allowed ? 200 : 403;
    return reply.status(statusCode).send({
      success: result.allowed,
      data: result,
      ...(result.allowed
        ? {}
        : {
            error: {
              code: result.reasonCode,
              decision: result.decision,
              message: result.reason
            }
          })
    });
  };

  fastify.post('/api/v1/partner/security/authorize', { preHandler: [authenticate] }, handleAuthorize);
  fastify.post('/api/v1/company/security/authorize', { preHandler: [authenticate] }, handleAuthorize);

  // 5. "Why Can't I Access This?" Access Diagnostic Engine
  fastify.post(
    '/api/v1/partner/security/access-diagnostics',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        action: string;
        resource?: AuthorizationResourceTarget;
        context?: AuthorizationEvaluationContext;
      };
      const report = await identitySecurityFoundationService.diagnoseAccess(request.session, {
        action: body.action,
        resource: body.resource,
        context: body.context
      });
      return reply.send({ success: true, data: report });
    }
  );

  // 5.5 Break-Glass Emergency Access Activation & Expiry
  fastify.post(
    '/api/v1/partner/security/break-glass',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        patientId: string;
        reason: string;
        expiresInSeconds?: number;
        durationMinutes?: number;
      };
      const record = identitySecurityFoundationService.grantBreakGlassAccess(request.session, body);
      return reply.status(201).send({ success: true, data: record });
    }
  );

  fastify.post(
    '/api/v1/partner/security/break-glass/:id/expire',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      identitySecurityFoundationService.expireBreakGlassAccess(id);
      return reply.send({ success: true, data: { id, expired: true } });
    }
  );

  // 6. Maker-Checker Separation of Duties Workflow
  fastify.post(
    '/api/v1/partner/security/maker-checker/submit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        action: string;
        resourceType: string;
        resourceId: string;
        oldValue?: Record<string, unknown> | null;
        newValue: Record<string, unknown>;
        reason: string;
      };
      const created = await identitySecurityFoundationService.submitMakerCheckerRequest(request.session, body);
      return reply.status(201).send({ success: true, data: created });
    }
  );

  fastify.post(
    '/api/v1/partner/security/maker-checker/:requestId/decide',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { requestId } = request.params as { requestId: string };
      const body = (request.body || {}) as {
        decision: 'APPROVED' | 'REJECTED';
        reason: string;
      };
      const decided = await identitySecurityFoundationService.decideMakerCheckerRequest(
        request.session,
        requestId,
        body.decision || 'APPROVED',
        body.reason || 'Reviewed by Checker'
      );
      return reply.send({ success: true, data: decided });
    }
  );

  // 7. Staff & Credential Runtime State Governance (Immediate Propagation)
  fastify.patch(
    '/api/v1/partner/security/staff/:staffId/runtime-state',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { staffId } = request.params as { staffId: string };
      const body = (request.body || {}) as {
        userId?: string;
        staffStatus?: StaffLifecycleStatus;
        departmentIds?: string[];
        locationIds?: string[];
        credentialStatus?: CredentialLifecycleStatus;
      };

      const caller = await identitySecurityFoundationService.resolveCanonicalIdentity(request.session);
      if (!caller || (!caller.isSuperAdmin && !caller.effectivePermissions.includes('SECURITY:RBAC:MANAGE'))) {
        throw AppError.forbidden('Access denied: requires SECURITY:RBAC:MANAGE to update staff security state');
      }

      identitySecurityFoundationService.setStaffRuntimeState({
        partnerId: caller.partnerId,
        userId: body.userId,
        staffId,
        staffStatus: body.staffStatus,
        departmentIds: body.departmentIds,
        locationIds: body.locationIds,
        credentialStatus: body.credentialStatus
      });

      await identitySecurityFoundationService.recordSecurityAudit({
        actorUserId: caller.userId,
        actorStaffId: caller.staffId,
        partnerId: caller.partnerId,
        role: caller.roleCodes[0] || 'ADMIN',
        action: 'SECURITY:STAFF:RUNTIME_STATE_UPDATE',
        resourceType: 'STAFF',
        resourceId: staffId,
        decision: 'ALLOW',
        reasonCode: 'STAFF_RUNTIME_STATE_UPDATED',
        after: body as Record<string, unknown>
      });

      return reply.send({
        success: true,
        data: {
          staffId,
          partnerId: caller.partnerId,
          ...body,
          updatedAt: new Date().toISOString()
        }
      });
    }
  );

  // 8. Authoritative Patient & Encounter Scope Registration
  fastify.post(
    '/api/v1/partner/security/scope/register-patient',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        patientId: string;
        locationId: string;
        departmentId: string;
        assignedDoctorId?: string;
        confidential?: boolean;
      };
      identitySecurityFoundationService.registerPatientScope({
        patientId: body.patientId,
        partnerId: request.session.tenantId,
        locationId: body.locationId,
        departmentId: body.departmentId,
        assignedDoctorId: body.assignedDoctorId,
        confidential: body.confidential
      });
      return reply.status(201).send({ success: true, data: body });
    }
  );

  fastify.post(
    '/api/v1/partner/security/scope/register-encounter',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body || {}) as {
        encounterId: string;
        patientId: string;
        locationId: string;
        departmentId: string;
        encounterType?: string;
        status?: string;
        assignedDoctorId?: string;
      };
      identitySecurityFoundationService.registerEncounterScope({
        encounterId: body.encounterId,
        patientId: body.patientId,
        partnerId: request.session.tenantId,
        locationId: body.locationId,
        departmentId: body.departmentId,
        encounterType: body.encounterType || 'OPD',
        status: body.status || 'IN_PROGRESS',
        assignedDoctorId: body.assignedDoctorId
      });
      return reply.status(201).send({ success: true, data: body });
    }
  );

  // 9. Security Audit Trail Query & Tamper-Resistance Guard (INVARIANT 15)
  fastify.get(
    '/api/v1/partner/security/audit-events',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const query = (request.query || {}) as {
        partnerId?: string;
        action?: string;
        decision?: string;
        limit?: number;
      };
      const events = identitySecurityFoundationService.getSecurityAuditTrail(request.session, query);
      return reply.send({ success: true, data: events });
    }
  );

  const rejectAuditTampering = async (request: FastifyRequest) => {
    const { eventId } = request.params as { eventId: string };
    await identitySecurityFoundationService.recordSecurityAudit({
      actorUserId: request.session?.userId || 'UNKNOWN',
      partnerId: request.session?.tenantId || 'UNKNOWN',
      role: request.session?.roles?.[0] || 'USER',
      action: `SECURITY:AUDIT:${request.method}`,
      resourceType: 'AUDIT_EVENT',
      resourceId: eventId,
      decision: 'DENY',
      reasonCode: 'AUDIT_TAMPER_FORBIDDEN'
    });
    throw new AppError({
      message: 'INVARIANT 15: Security audit records are append-only and tamper-resistant; modification or deletion is strictly forbidden.',
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  };

  fastify.put('/api/v1/partner/security/audit-events/:eventId', { preHandler: [authenticate] }, rejectAuditTampering);
  fastify.patch('/api/v1/partner/security/audit-events/:eventId', { preHandler: [authenticate] }, rejectAuditTampering);
  fastify.delete('/api/v1/partner/security/audit-events/:eventId', { preHandler: [authenticate] }, rejectAuditTampering);
};
