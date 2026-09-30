import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { authenticate } from '../../plugins/auth-guard.js';
import { partnerConfigurationEngineService } from '../../services/partner/PartnerConfigurationEngineService.js';
import { staffAdministrationService } from '../../services/partner/StaffAdministrationService.js';

const ADMIN_CONFIG_ROLE_SET = new Set<string>([
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'COMPANY_ADMIN',
  'PARTNER_SUPER_ADMIN',
  'PARTNER_ADMIN',
  'FACILITY_ADMIN',
  'BRANCH_MANAGER',
  'OPERATIONS_MANAGER',
  'HR_STAFF_ADMIN',
  'HR_COORDINATOR',
  'ADMIN'
]);

const CreateLocationBodySchema = z.object({
  locationCode: z.string().min(2).max(100).optional(),
  locationName: z.string().min(2).max(255),
  locationType: z.string().min(2).max(50).optional(),
  addressStreet: z.string().min(2).max(500),
  addressCity: z.string().min(2).max(100),
  addressState: z.string().min(2).max(100),
  addressPostalCode: z.string().min(3).max(20),
  addressCountry: z.string().min(2).max(100).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(6).max(50),
  operatingHours: z.string().max(100).optional(),
  emergencyAvailable: z.boolean().optional()
});

const UpdateLocationBodySchema = z.object({
  locationName: z.string().min(2).max(255).optional(),
  addressStreet: z.string().min(2).max(500).optional(),
  addressCity: z.string().min(2).max(100).optional(),
  addressState: z.string().min(2).max(100).optional(),
  addressPostalCode: z.string().min(3).max(20).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(6).max(50).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'CLOSED']).optional(),
  operatingHours: z.string().max(100).optional(),
  emergencyAvailable: z.boolean().optional()
});

const CreateDepartmentBodySchema = z.object({
  departmentCode: z.string().min(2).max(100),
  departmentName: z.string().min(2).max(255),
  locationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  costCenterCode: z.string().max(100).optional(),
  departmentHeadId: z.string().max(100).optional()
});

const UpdateDepartmentBodySchema = z.object({
  departmentName: z.string().min(2).max(255).optional(),
  costCenterCode: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'RESTRUCTURED']).optional()
});

const CreateServiceBodySchema = z.object({
  serviceCode: z.string().min(2).max(100),
  serviceName: z.string().min(2).max(255),
  category: z.string().min(2).max(100),
  departmentId: z.string().uuid(),
  locationId: z.string().uuid(),
  baseTariffInr: z.number().min(0).optional(),
  turnaroundMinutes: z.number().int().min(1).optional(),
  isActive: z.boolean().optional()
});

const UpdateServiceBodySchema = z.object({
  serviceName: z.string().min(2).max(255).optional(),
  baseTariffInr: z.number().min(0).optional(),
  turnaroundMinutes: z.number().int().min(1).optional(),
  isActive: z.boolean().optional()
});

function enforceTenantAndRole(request: any, requireAdminMutationRole = false) {
  const session = request.session;
  if (!session || !session.tenantId) {
    throw new AppError({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Authentication session required',
      statusCode: 401
    });
  }

  const sessionRoles: string[] = Array.isArray(session.roles)
    ? session.roles.map((r: any) => String(r).toUpperCase())
    : [];
  const primaryRole = String((session as any).role || sessionRoles[0] || '').toUpperCase();
  const allRoles = new Set<string>([...sessionRoles, primaryRole].filter(Boolean));

  const isHqAdmin =
    allRoles.has('SUPER_ADMIN') ||
    allRoles.has('PLATFORM_ADMIN') ||
    allRoles.has('COMPANY_ADMIN');

  const bodyTenantId = request.body?.tenantId || request.query?.tenantId;
  const headerTenantId = request.headers['x-tenant-id'];

  if (!isHqAdmin) {
    if (bodyTenantId && String(bodyTenantId) !== session.tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Cross-tenant security violation: Cannot target another partner tenantId in request payload.',
        statusCode: 403
      });
    }
    if (headerTenantId && String(headerTenantId) !== session.tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Cross-tenant security violation: x-tenant-id header does not match authenticated partner session.',
        statusCode: 403
      });
    }
  }

  if (requireAdminMutationRole) {
    const hasAdminRole = Array.from(allRoles).some((r) => ADMIN_CONFIG_ROLE_SET.has(r));
    if (!hasAdminRole) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Insufficient role permissions: Partner Configuration mutations require Partner Admin or Facility Admin privileges.',
        statusCode: 403
      });
    }
  }

  return session;
}

export const partnerConfigurationRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * 1. GET /api/v1/partner/configuration
   * Returns full 16-stage Partner Configuration state + 14-domain validation report
   */
  app.get(
    '/api/v1/partner/configuration',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, false);
      const data = await partnerConfigurationEngineService.getFullPartnerConfiguration(session);
      return reply.status(200).send({
        success: true,
        data,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString()
        }
      });
    }
  );

  /**
   * 2. POST /api/v1/partner/configuration/initialize
   * Deterministically & idempotently initializes Partner Configuration (Locations, Applicable Departments, Capabilities, Validation)
   */
  app.post(
    '/api/v1/partner/configuration/initialize',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const body = (request.body || {}) as { reason?: string; source?: 'HQ_APPROVAL' | 'PARTNER_ADMIN' | 'SYSTEM_RECONCILE' };
      const data = await partnerConfigurationEngineService.initializePartnerConfiguration(session, {
        reason: body.reason || 'Manual idempotent partner configuration initialization',
        source: body.source || 'PARTNER_ADMIN'
      });
      return reply.status(200).send({
        success: true,
        data,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString()
        }
      });
    }
  );

  /**
   * 3. GET /api/v1/partner/configuration/validation
   * Evaluates all 14 domains and Structural, Security, Commercial, and Operational rules
   */
  app.get(
    '/api/v1/partner/configuration/validation',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, false);
      const report = await partnerConfigurationEngineService.validatePartnerConfiguration(session);
      return reply.status(200).send({
        success: true,
        data: report,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString()
        }
      });
    }
  );

  /**
   * 4. LOCATIONS / BRANCHES ENDPOINTS
   */
  app.get(
    '/api/v1/partner/locations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, false);
      const locations = await partnerConfigurationEngineService.getLocations(session);
      return reply.status(200).send({
        success: true,
        data: locations,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
          total: locations.length
        }
      });
    }
  );

  app.post(
    '/api/v1/partner/locations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const parsed = CreateLocationBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid location payload',
          statusCode: 400,
          details: parsed.error.issues as any
        });
      }
      const created = await partnerConfigurationEngineService.createLocation(session, parsed.data);
      return reply.status(201).send({
        success: true,
        data: created,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  app.patch(
    '/api/v1/partner/locations/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const { id } = request.params as { id: string };
      const parsed = UpdateLocationBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid location update payload',
          statusCode: 400,
          details: parsed.error.issues as any
        });
      }
      const updated = await partnerConfigurationEngineService.updateLocation(session, id, parsed.data);
      return reply.status(200).send({
        success: true,
        data: updated,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  /**
   * 5. APPLICABLE DEPARTMENTS ENDPOINTS
   */
  app.get(
    '/api/v1/partner/departments',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, false);
      const deptBundle = await partnerConfigurationEngineService.getDepartments(session);
      return reply.status(200).send({
        success: true,
        data: deptBundle,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  app.post(
    '/api/v1/partner/departments',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const parsed = CreateDepartmentBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid department payload',
          statusCode: 400,
          details: parsed.error.issues as any
        });
      }
      const created = await partnerConfigurationEngineService.createDepartment(session, {
        departmentCode: parsed.data.departmentCode,
        departmentName: parsed.data.departmentName,
        locationId: parsed.data.locationId || parsed.data.branchId,
        costCenterCode: parsed.data.costCenterCode,
        departmentHeadId: parsed.data.departmentHeadId
      });
      return reply.status(201).send({
        success: true,
        data: created,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  app.patch(
    '/api/v1/partner/departments/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const { id } = request.params as { id: string };
      const parsed = UpdateDepartmentBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid department update payload',
          statusCode: 400,
          details: parsed.error.issues as any
        });
      }
      const updated = await partnerConfigurationEngineService.updateDepartment(session, id, parsed.data);
      return reply.status(200).send({
        success: true,
        data: updated,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  /**
   * 6. APPLICABLE SERVICES ENDPOINTS (Genuine Zero-State + Capability & Department Validated)
   */
  app.get(
    '/api/v1/partner/services',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, false);
      const services = await partnerConfigurationEngineService.getServices(session);
      return reply.status(200).send({
        success: true,
        data: services,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  app.post(
    '/api/v1/partner/services',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const parsed = CreateServiceBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid service payload',
          statusCode: 400,
          details: parsed.error.issues as any
        });
      }
      const created = await partnerConfigurationEngineService.createService(session, parsed.data);
      return reply.status(201).send({
        success: true,
        data: created,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  app.patch(
    '/api/v1/partner/services/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const { id } = request.params as { id: string };
      const parsed = UpdateServiceBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid service update payload',
          statusCode: 400,
          details: parsed.error.issues as any
        });
      }
      const updated = await partnerConfigurationEngineService.updateService(session, id, parsed.data);
      return reply.status(200).send({
        success: true,
        data: updated,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  /**
   * 7. STANDARD STAFF ROLE TEMPLATES ENDPOINT (Metadata Catalog Only — Zero Fake Staff)
   */
  app.get(
    '/api/v1/partner/staff-templates',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, false);
      const templates = await partnerConfigurationEngineService.getStaffTemplates(session);
      return reply.status(200).send({
        success: true,
        data: templates,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  /**
   * 8. UNIFIED STAFF & ROLE ASSIGNMENT ENDPOINTS
   */
  app.get(
    '/api/v1/partner/staff',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, false);
      const staff = await staffAdministrationService.getStaff(session, {});
      return reply.status(200).send({
        success: true,
        data: staff,
        meta: { requestId: request.id, timestamp: new Date().toISOString(), total: staff.length }
      });
    }
  );

  app.post(
    '/api/v1/partner/staff',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const created = await partnerConfigurationEngineService.createPartnerStaff(session, request.body);
      return reply.status(201).send({
        success: true,
        data: created,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  app.patch(
    '/api/v1/partner/staff/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as any;
      let updated;
      if (body.status && !body.fullName && !body.primaryRole) {
        updated = await staffAdministrationService.changeStaffStatus(
          {
            staffId: id,
            status: body.status,
            reason: body.reason || 'Partner configuration staff status update'
          } as any,
          session
        );
      } else {
        updated = await staffAdministrationService.updateStaff(id, body, session);
      }
      return reply.status(200).send({
        success: true,
        data: updated,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );

  app.post(
    '/api/v1/partner/roles/assign',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const session = enforceTenantAndRole(request, true);
      const created = await partnerConfigurationEngineService.assignPartnerStaffRole(session, request.body);
      return reply.status(201).send({
        success: true,
        data: created,
        meta: { requestId: request.id, timestamp: new Date().toISOString() }
      });
    }
  );
};
