import { type FastifyPluginAsync } from 'fastify';
import { securityAdminService } from '../../services/company/SecurityAdminService.js';
import { authenticate, requirePermission, requireRoles } from '../../plugins/auth-guard.js';

export const securityAdminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/v1/company/security/overview',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const overview = await securityAdminService.getOverview(request.session);
      return { success: true, data: overview };
    }
  );

  fastify.get(
    '/api/v1/company/security/roles',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const roles = await securityAdminService.getRoles(request.session);
      return { success: true, data: roles };
    }
  );

  fastify.get(
    '/api/v1/company/security/permissions',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const permissions = await securityAdminService.getPermissions(request.session);
      return { success: true, data: permissions };
    }
  );

  fastify.get(
    '/api/v1/company/security/policies',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const policies = await securityAdminService.getPolicies(request.session);
      return { success: true, data: policies };
    }
  );

  // Sessions Inspection & Remote Revocation
  fastify.get(
    '/api/v1/company/security/sessions',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const sessions = await securityAdminService.getSessions(request.session);
      return { success: true, data: sessions };
    }
  );

  fastify.post(
    '/api/v1/company/security/sessions/:id/terminate',
    {
      preHandler: [
        authenticate,
        requirePermission('security', 'delete'),
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPLIANCE_OFFICER')
      ]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { reason?: string };
      const terminated = await securityAdminService.terminateSession(id, body?.reason || 'Revoked via Admin Console', request.session);
      return { success: true, data: terminated };
    }
  );

  // Credentials Lifecycle
  fastify.get(
    '/api/v1/company/security/credentials',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const credentials = await securityAdminService.getCredentials(request.session);
      return { success: true, data: credentials };
    }
  );

  fastify.post(
    '/api/v1/company/security/credentials/:id/rotate',
    {
      preHandler: [
        authenticate,
        requirePermission('security', 'update'),
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPLIANCE_OFFICER')
      ]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { reason?: string };
      const rotated = await securityAdminService.rotateCredential(id, body?.reason || 'Rotated via Security Console', request.session);
      return { success: true, data: rotated };
    }
  );

  fastify.post(
    '/api/v1/company/security/credentials/:id/revoke',
    {
      preHandler: [
        authenticate,
        requirePermission('security', 'delete'),
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPLIANCE_OFFICER')
      ]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { reason?: string };
      const revoked = await securityAdminService.revokeCredential(id, body?.reason || 'Revoked via Security Console', request.session);
      return { success: true, data: revoked };
    }
  );

  // Incidents Center
  fastify.get(
    '/api/v1/company/security/incidents',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const incidents = await securityAdminService.getIncidents(request.session);
      return { success: true, data: incidents };
    }
  );

  fastify.post(
    '/api/v1/company/security/incidents/:id/acknowledge',
    {
      preHandler: [
        authenticate,
        requirePermission('security', 'update'),
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPLIANCE_OFFICER')
      ]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const incident = await securityAdminService.acknowledgeIncident(id, request.session);
      return { success: true, data: incident };
    }
  );

  fastify.post(
    '/api/v1/company/security/incidents/:id/resolve',
    {
      preHandler: [
        authenticate,
        requirePermission('security', 'update'),
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPLIANCE_OFFICER')
      ]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { resolutionNotes?: string };
      const incident = await securityAdminService.resolveIncident(id, body?.resolutionNotes || 'Incident resolved and verified.', request.session);
      return { success: true, data: incident };
    }
  );

  // Audit Verifications
  fastify.get(
    '/api/v1/company/security/audit-verifications',
    {
      preHandler: [authenticate, requirePermission('security', 'read')]
    },
    async (request) => {
      const verifications = await securityAdminService.getAuditVerifications(request.session);
      return { success: true, data: verifications };
    }
  );

  fastify.post(
    '/api/v1/company/security/audit-verifications',
    {
      preHandler: [
        authenticate,
        requirePermission('security', 'create'),
        requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPLIANCE_OFFICER')
      ]
    },
    async (request) => {
      const body = request.body as any;
      const verification = await securityAdminService.verifyAuditEvent(body, request.session);
      return { success: true, data: verification };
    }
  );
};
