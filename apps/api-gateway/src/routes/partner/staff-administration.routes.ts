import { type FastifyPluginAsync } from 'fastify';
import { staffAdministrationService } from '../../services/partner/StaffAdministrationService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import type {
  CreateOperationalDepartmentRequest,
  CreateOperationalStaffRequest,
  UpdateOperationalStaffRequest,
  ChangeStaffStatusRequest,
  AssignStaffRoleRequest,
  AddStaffCredentialRequest,
  CreateStaffTransferRequest
} from '@docsearch/api-contracts';

export const staffAdministrationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('OPERATIONS'));

  // 1. Overview
  fastify.get(
    '/api/v1/partner/staff/overview',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as { partnerId?: string; organizationId?: string };
      const data = await staffAdministrationService.getOverview(
        request.session,
        query?.partnerId,
        query?.organizationId
      );
      return { success: true, data };
    }
  );

  // 2. Departments
  fastify.get(
    '/api/v1/partner/staff/departments',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as { partnerId?: string; organizationId?: string };
      const data = await staffAdministrationService.getDepartments(
        request.session,
        query?.partnerId,
        query?.organizationId
      );
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/staff/departments',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateOperationalDepartmentRequest, 'tenantId'>;
      const data = await staffAdministrationService.createDepartment(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.put(
    '/api/v1/partner/staff/departments/:id',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Partial<CreateOperationalDepartmentRequest>;
      const data = await staffAdministrationService.updateDepartment(id, payload, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found' } };
      }
      return { success: true, data };
    }
  );

  // 3. Staff Directory
  fastify.get(
    '/api/v1/partner/staff/members',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as {
        partnerId?: string;
        organizationId?: string;
        branchId?: string;
        departmentId?: string;
        staffType?: string;
        status?: string;
      };
      const data = await staffAdministrationService.getStaff(request.session, query);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/staff/members/:id',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await staffAdministrationService.getStaffById(request.session, id);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/staff/members',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateOperationalStaffRequest, 'tenantId'>;
      const data = await staffAdministrationService.createStaff(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.put(
    '/api/v1/partner/staff/members/:id',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<UpdateOperationalStaffRequest, 'tenantId'>;
      const data = await staffAdministrationService.updateStaff(id, payload, request.session);
      return { success: true, data };
    }
  );

  fastify.patch(
    '/api/v1/partner/staff/members/:id/status',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<ChangeStaffStatusRequest, 'tenantId' | 'staffId'>;
      const data = await staffAdministrationService.changeStaffStatus(
        {
          ...payload,
          staffId: id
        },
        request.session
      );
      return { success: true, data };
    }
  );

  // 4. Role Assignments
  fastify.get(
    '/api/v1/partner/staff/roles',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as { staffId?: string };
      const data = await staffAdministrationService.getRoleAssignments(request.session, query?.staffId);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/staff/roles/assign',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<AssignStaffRoleRequest, 'tenantId'>;
      const data = await staffAdministrationService.assignStaffRole(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 5. Professional Credentials
  fastify.get(
    '/api/v1/partner/staff/credentials',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as { staffId?: string };
      const data = await staffAdministrationService.getCredentials(request.session, query?.staffId);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/staff/credentials',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<AddStaffCredentialRequest, 'tenantId'>;
      const data = await staffAdministrationService.addCredential(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  fastify.patch(
    '/api/v1/partner/staff/credentials/:id/verify',
    {
      preHandler: [authenticate, requirePermission('partners', 'update')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const payload = (request.body as { verificationReference?: string }) || {};
      const data = await staffAdministrationService.verifyCredential(
        id,
        request.session,
        payload.verificationReference
      );
      return { success: true, data };
    }
  );

  // 6. Staff Transfers
  fastify.get(
    '/api/v1/partner/staff/transfers',
    {
      preHandler: [authenticate, requirePermission('partners', 'read')]
    },
    async (request) => {
      const query = request.query as { staffId?: string };
      const data = await staffAdministrationService.getTransfers(request.session, query?.staffId);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/staff/transfers',
    {
      preHandler: [authenticate, requirePermission('partners', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<CreateStaffTransferRequest, 'tenantId'>;
      const data = await staffAdministrationService.createTransfer(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );
};
