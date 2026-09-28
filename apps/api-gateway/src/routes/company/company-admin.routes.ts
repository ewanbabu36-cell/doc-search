import { type FastifyPluginAsync } from 'fastify';
import { companyAdminService } from '../../services/company/CompanyAdminService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import type {
  CreateInternalEmployeeRequest,
  CreateLegalEntityRequest,
  CreateDepartmentRequest,
  CreateDesignationRequest
} from '@docsearch/api-contracts';

export const companyAdminRoutes: FastifyPluginAsync = async (fastify) => {
  // --- INTERNAL EMPLOYEES ---
  fastify.get(
    '/api/v1/company/admin/internal-employees',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const employees = await companyAdminService.getEmployees(request.session);
      return { success: true, data: employees };
    }
  );

  fastify.post(
    '/api/v1/company/admin/internal-employees',
    {
      preHandler: [authenticate, requirePermission('admin', 'create')]
    },
    async (request) => {
      const body = request.body as CreateInternalEmployeeRequest;
      const employee = await companyAdminService.createEmployee(body, request.session);
      return { success: true, data: employee };
    }
  );

  fastify.patch(
    '/api/v1/company/admin/internal-employees/:id/status',
    {
      preHandler: [authenticate, requirePermission('admin', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { status: string; reason?: string };
      const updated = await companyAdminService.updateEmployeeStatus(id, body.status, body.reason || 'Status updated via admin console', request.session);
      return { success: true, data: updated };
    }
  );

  fastify.delete(
    '/api/v1/company/admin/internal-employees/:id',
    {
      preHandler: [authenticate, requirePermission('admin', 'delete')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const res = await companyAdminService.deleteEmployee(id, request.session);
      return { success: true, data: res };
    }
  );

  // --- LEGAL ENTITIES ---
  fastify.get(
    '/api/v1/company/admin/legal-entities',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const entities = await companyAdminService.getLegalEntities(request.session);
      return { success: true, data: entities };
    }
  );

  fastify.post(
    '/api/v1/company/admin/legal-entities',
    {
      preHandler: [authenticate, requirePermission('admin', 'create')]
    },
    async (request) => {
      const body = request.body as CreateLegalEntityRequest;
      const entity = await companyAdminService.createLegalEntity(body, request.session);
      return { success: true, data: entity };
    }
  );

  // --- DEPARTMENTS ---
  fastify.get(
    '/api/v1/company/admin/departments',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const depts = await companyAdminService.getDepartments(request.session);
      return { success: true, data: depts };
    }
  );

  fastify.post(
    '/api/v1/company/admin/departments',
    {
      preHandler: [authenticate, requirePermission('admin', 'create')]
    },
    async (request) => {
      const body = request.body as CreateDepartmentRequest;
      const dept = await companyAdminService.createDepartment(body, request.session);
      return { success: true, data: dept };
    }
  );

  // --- DESIGNATIONS ---
  fastify.get(
    '/api/v1/company/admin/designations',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const desigs = await companyAdminService.getDesignations(request.session);
      return { success: true, data: desigs };
    }
  );

  fastify.post(
    '/api/v1/company/admin/designations',
    {
      preHandler: [authenticate, requirePermission('admin', 'create')]
    },
    async (request) => {
      const body = request.body as CreateDesignationRequest;
      const desig = await companyAdminService.createDesignation(body, request.session);
      return { success: true, data: desig };
    }
  );

  // --- POLICIES ---
  fastify.get(
    '/api/v1/company/admin/policies',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const policies = await companyAdminService.getPolicies(request.session);
      return { success: true, data: policies };
    }
  );

  // --- COMPLIANCE OFFICERS ---
  fastify.get(
    '/api/v1/company/admin/compliance-officers',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const officers = await companyAdminService.getComplianceOfficers(request.session);
      return { success: true, data: officers };
    }
  );

  // --- BOARD MEMBERS ---
  fastify.get(
    '/api/v1/company/admin/board-members',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const members = await companyAdminService.getBoardMembers(request.session);
      return { success: true, data: members };
    }
  );

  // --- GOVERNANCE EVENTS ---
  fastify.get(
    '/api/v1/company/admin/governance-events',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const events = await companyAdminService.getGovernanceEvents(request.session);
      return { success: true, data: events };
    }
  );

  // --- AUDIT TRACES ---
  fastify.get(
    '/api/v1/company/admin/audit-traces',
    {
      preHandler: [authenticate, requirePermission('admin', 'read')]
    },
    async (request) => {
      const traces = await companyAdminService.getAuditTraces(request.session);
      return { success: true, data: traces };
    }
  );
};

