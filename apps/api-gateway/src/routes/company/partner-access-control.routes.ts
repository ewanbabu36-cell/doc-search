import { type FastifyPluginAsync } from 'fastify';
import { authenticate, requireRoles, optionalAuthenticate } from '../../plugins/auth-guard.js';
import { partnerTemplateService, ensureTenantExists, ensureUserExists } from '../../services/company/PartnerTemplateService.js';
import { capabilityEngine } from '../../services/company/CapabilityAndDependencyEngine.js';
import { effectiveAccessEngine } from '../../services/company/EffectiveAccessEngine.js';
import { configurationVersioningService } from '../../services/company/ConfigurationVersioningService.js';
import { masterFoundationService } from '../../services/company/MasterFoundationService.js';
import {
  getDatabase,
  partnerCapabilities,
  breakGlassAccess,
  accessPolicies,
  roles,
  patients,
  eq,
  and,
  desc
} from '@docsearch/database';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

/**
 * Enforces strict tenant isolation on `/api/v1/company/partners/:partnerId/*` routes.
 * Only SUPER_ADMIN or COMPANY_ADMIN may access or mutate another partner's resources.
 */
function assertPartnerTenantScope(request: any, partnerId: string): void {
  const session = request.session;
  if (!session) {
    throw AppError.unauthorized('Authentication required');
  }
  const isGlobalHqAdmin = Boolean(
    session.isSuperAdmin ||
      (Array.isArray(session.roles) &&
        session.roles.some((r: string) => {
          const upper = String(r).toUpperCase().trim();
          return upper === 'SUPER_ADMIN' || upper === 'COMPANY_ADMIN';
        }))
  );
  if (isGlobalHqAdmin) {
    return;
  }

  const sessionTenantId = String(session.tenantId || '').trim();
  if (!sessionTenantId) {
    throw new AppError({
      message: 'Forbidden: Missing tenant context for partner resource access.',
      code: ErrorCode.TENANT_ACCESS_DENIED,
      statusCode: 403
    });
  }

  const targetUuid = partnerId.includes('-') && partnerId.length === 36 ? partnerId : toDeterministicUuid(partnerId);
  const sessionUuid =
    sessionTenantId.includes('-') && sessionTenantId.length === 36
      ? sessionTenantId
      : toDeterministicUuid(sessionTenantId);

  if (sessionTenantId !== partnerId && sessionUuid !== targetUuid) {
    throw new AppError({
      message: 'Forbidden: Cross-tenant partner access or configuration mutation is strictly denied.',
      code: ErrorCode.TENANT_ACCESS_DENIED,
      statusCode: 403
    });
  }
}

export const partnerAccessControlRoutes: FastifyPluginAsync = async (fastify) => {
  // =========================================================================
  // 0. PHASE 1 MASTER FOUNDATION CONTROL PLANE
  // =========================================================================

  // GET /api/v1/company/master-foundation/catalog
  fastify.get(
    '/api/v1/company/master-foundation/catalog',
    {
      preHandler: [optionalAuthenticate]
    },
    async (_request, reply) => {
      const catalog = masterFoundationService.getMasterCatalog();
      return reply.send({ success: true, data: catalog });
    }
  );

  // GET /api/v1/partner/master-foundation/effective-context
  fastify.get(
    '/api/v1/partner/master-foundation/effective-context',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const query = (request.query || {}) as { partnerId?: string };
      const requestedPartnerId = query.partnerId || request.session.tenantId;
      if (!requestedPartnerId) {
        throw AppError.badRequest('Partner or tenant context is required');
      }
      assertPartnerTenantScope(request, requestedPartnerId);
      const context = await masterFoundationService.resolveEffectivePartnerFoundation(requestedPartnerId);
      return reply.send({ success: true, data: context });
    }
  );

  // POST /api/v1/company/partners/:partnerId/master-foundation/configure
  fastify.post(
    '/api/v1/company/partners/:partnerId/master-foundation/configure',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const body = (request.body || {}) as {
        industry: string;
        operatingModel: string;
        activeCapabilities?: string[];
        customDepartmentCodes?: string[];
        reason?: string;
        publishImmediately?: boolean;
      };
      if (!body.industry || !body.operatingModel) {
        throw AppError.badRequest('industry and operatingModel are required');
      }
      const actor = (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health';
      const result = await masterFoundationService.configurePartnerFoundation(
        partnerId,
        {
          industry: body.industry,
          operatingModel: body.operatingModel,
          reason: body.reason || 'HQ Master Foundation Configuration',
          lifecycleStatus: body.publishImmediately === false ? 'DRAFT' : 'PUBLISHED'
        },
        actor
      );
      return reply.send({
        success: true,
        data: result,
        message: `Master foundation configured for partner ${partnerId} (Industry: ${result.industry}, Operating Model: ${result.operatingModel}).`
      });
    }
  );

  // POST /api/v1/company/partners/:partnerId/configuration/versions/:versionNumber/publish
  fastify.post(
    '/api/v1/company/partners/:partnerId/configuration/versions/:versionNumber/publish',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId, versionNumber } = request.params as { partnerId: string; versionNumber: string };
      assertPartnerTenantScope(request, partnerId);
      const actor = (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health';
      const published = await configurationVersioningService.publishDraftVersion(
        partnerId,
        parseInt(versionNumber, 10),
        actor
      );
      return reply.send({
        success: true,
        data: published,
        message: `Configuration version ${versionNumber} published for partner ${partnerId}.`
      });
    }
  );

  // =========================================================================
  // 1. TEMPLATE MASTER & BLUEPRINTS
  // =========================================================================

  // GET /api/v1/company/templates
  fastify.get(
    '/api/v1/company/templates',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request, reply) => {
      const { category } = request.query as { category?: string };
      const templates = await partnerTemplateService.getTemplates(category);
      return reply.send({ success: true, data: templates });
    }
  );

  // GET /api/v1/company/templates/:templateId
  fastify.get(
    '/api/v1/company/templates/:templateId',
    {
      preHandler: [optionalAuthenticate]
    },
    async (request, reply) => {
      const { templateId } = request.params as { templateId: string };
      const tpl = await partnerTemplateService.getTemplateById(templateId);
      if (!tpl) {
        throw new AppError({ message: `Template ${templateId} not found`, statusCode: 404 });
      }
      return reply.send({ success: true, data: tpl });
    }
  );

  // POST /api/v1/company/templates/:templateId/versions
  fastify.post(
    '/api/v1/company/templates/:templateId/versions',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { templateId } = request.params as { templateId: string };
      const body = request.body as any;
      const res = await partnerTemplateService.createTemplateVersion(
        templateId,
        body,
        (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health'
      );
      return reply.status(201).send({ success: true, data: res, message: `Version ${res.versionNumber} created.` });
    }
  );

  // POST /api/v1/company/templates/:templateId/apply/:partnerId
  fastify.post(
    '/api/v1/company/templates/:templateId/apply/:partnerId',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { templateId, partnerId } = request.params as { templateId: string; partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const { versionNumber } = (request.body as { versionNumber?: number }) || {};
      const res = await partnerTemplateService.applyTemplateToPartner(
        partnerId,
        templateId,
        versionNumber,
        (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health'
      );
      return reply.send({ success: true, data: res, message: res.message });
    }
  );

  // POST /api/v1/company/partners/:partnerId/save-as-template
  fastify.post(
    '/api/v1/company/partners/:partnerId/save-as-template',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const body = request.body as {
        templateName: string;
        templateCode: string;
        category?: 'CLINIC' | 'HOSPITAL' | 'DIAGNOSTICS' | 'PHARMACY' | 'HEALTHCARE_GROUP' | 'SPECIALTY';
      };

      if (!body.templateName || !body.templateCode) {
        throw new AppError({ message: 'templateName and templateCode are required', statusCode: 400 });
      }

      const res = await partnerTemplateService.savePartnerAsTemplate(
        partnerId,
        body.templateName,
        body.templateCode,
        body.category || 'HOSPITAL',
        (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health'
      );
      return reply.status(201).send({ success: true, data: res, message: `Partner configuration saved as template "${body.templateName}".` });
    }
  );

  // =========================================================================
  // 2. CAPABILITIES & COMBO PARTNER CONFIGURATION
  // =========================================================================

  // GET /api/v1/company/capabilities
  fastify.get(
    '/api/v1/company/capabilities',
    {
      preHandler: [optionalAuthenticate]
    },
    async (_request, reply) => {
      const all = capabilityEngine.getAllCapabilities();
      return reply.send({ success: true, data: all });
    }
  );

  // GET /api/v1/company/partners/:partnerId/capabilities
  fastify.get(
    '/api/v1/company/partners/:partnerId/capabilities',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const db = getDatabase();
      const pUuid = toDeterministicUuid(partnerId);

      let caps: any[] = [];
      if (db) {
        caps = await db
          .select()
          .from(partnerCapabilities)
          .where(eq(partnerCapabilities.tenantId, pUuid));
      }

      return reply.send({ success: true, data: caps });
    }
  );

  // PUT /api/v1/company/partners/:partnerId/capabilities
  fastify.put(
    '/api/v1/company/partners/:partnerId/capabilities',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const body = request.body as {
        activeCapabilities: string[];
        reason?: string;
      };

      const activeCodes = body.activeCapabilities || [];

      // Validate inter-capability dependencies
      const check = capabilityEngine.validateCapabilityDependencies(activeCodes);
      if (!check.valid) {
        throw new AppError({
          message: `Capability dependency conflict: ${check.conflicts[0]?.message}`,
          statusCode: 400
        });
      }

      const db = getDatabase();
      const pUuid = toDeterministicUuid(partnerId);
      const actor = (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health';

      if (db) {
        await ensureTenantExists(pUuid, partnerId);
        const allMasterCaps = capabilityEngine.getAllCapabilities();
        for (const masterCap of allMasterCaps) {
          const isActive = activeCodes.includes(masterCap.code);
          const [existingCap] = await db
            .select()
            .from(partnerCapabilities)
            .where(
              and(
                eq(partnerCapabilities.tenantId, pUuid),
                eq(partnerCapabilities.capabilityCode, masterCap.code)
              )
            );
          if (existingCap) {
            await db
              .update(partnerCapabilities)
              .set({
                status: isActive ? 'ACTIVE' : 'DISABLED',
                isHqOverride: true,
                overrideReason: body.reason || 'HQ Custom Configuration',
                updatedBy: actor,
                updatedAt: new Date()
              })
              .where(eq(partnerCapabilities.id, existingCap.id));
          } else {
            await db
              .insert(partnerCapabilities)
              .values({
                id: crypto.randomUUID(),
                partnerId,
                tenantId: pUuid,
                capabilityCode: masterCap.code,
                status: isActive ? 'ACTIVE' : 'DISABLED',
                isHqOverride: true,
                overrideReason: body.reason || 'HQ Custom Configuration',
                updatedBy: actor
              });
          }
        }

        // Capture a configuration version snapshot
        await configurationVersioningService.createSnapshot(
          partnerId,
          body.reason || `Updated active capabilities to [${activeCodes.join(', ')}]`,
          actor
        );
      }

      return reply.send({
        success: true,
        data: { activeCapabilities: activeCodes },
        message: `Partner capabilities updated successfully.`
      });
    }
  );

  // POST /api/v1/company/partners/:partnerId/capabilities
  fastify.post(
    '/api/v1/company/partners/:partnerId/capabilities',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const body = request.body as {
        activeCapabilities: string[];
        reason?: string;
      };

      const activeCodes = body.activeCapabilities || [];

      // Validate inter-capability dependencies
      const check = capabilityEngine.validateCapabilityDependencies(activeCodes);
      if (!check.valid) {
        throw new AppError({
          message: `Capability dependency conflict: ${check.conflicts[0]?.message}`,
          statusCode: 400
        });
      }

      const db = getDatabase();
      const pUuid = toDeterministicUuid(partnerId);
      const actor = (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health';

      if (db) {
        await ensureTenantExists(pUuid, partnerId);
        const allMasterCaps = capabilityEngine.getAllCapabilities();
        for (const masterCap of allMasterCaps) {
          const isActive = activeCodes.includes(masterCap.code);
          const [existingCap] = await db
            .select()
            .from(partnerCapabilities)
            .where(
              and(
                eq(partnerCapabilities.tenantId, pUuid),
                eq(partnerCapabilities.capabilityCode, masterCap.code)
              )
            );
          if (existingCap) {
            await db
              .update(partnerCapabilities)
              .set({
                status: isActive ? 'ACTIVE' : 'DISABLED',
                isHqOverride: true,
                overrideReason: body.reason || 'HQ Custom Configuration',
                updatedBy: actor,
                updatedAt: new Date()
              })
              .where(eq(partnerCapabilities.id, existingCap.id));
          } else {
            await db
              .insert(partnerCapabilities)
              .values({
                id: crypto.randomUUID(),
                partnerId,
                tenantId: pUuid,
                capabilityCode: masterCap.code,
                status: isActive ? 'ACTIVE' : 'DISABLED',
                isHqOverride: true,
                overrideReason: body.reason || 'HQ Custom Configuration',
                updatedBy: actor
              });
          }
        }

        // Capture a configuration version snapshot
        await configurationVersioningService.createSnapshot(
          partnerId,
          body.reason || `Updated active capabilities to [${activeCodes.join(', ')}]`,
          actor
        );
      }

      return reply.send({
        success: true,
        data: { activeCapabilities: activeCodes },
        message: `Partner capabilities updated successfully.`
      });
    }
  );

  // =========================================================================
  // 3. PERMISSION PACKS & POLICIES
  // =========================================================================

  // GET /api/v1/company/permission-packs
  fastify.get(
    '/api/v1/company/permission-packs',
    {
      preHandler: [optionalAuthenticate]
    },
    async (_request, reply) => {
      const packs = [
        {
          code: 'PACK_OPD_BASIC',
          name: 'OPD Basic Access',
          category: 'OPERATIONS',
          permissions: ['patient:record:view', 'patient:record:create', 'appointment:token:view', 'appointment:token:create']
        },
        {
          code: 'PACK_CLINICAL_DOCS',
          name: 'Clinical Documentation Access',
          category: 'CLINICAL',
          permissions: ['patient:record:view', 'clinical:consultation:author', 'clinical:prescription:sign', 'clinical:vitals:record']
        },
        {
          code: 'PACK_PHARMACY_OPERATOR',
          name: 'Pharmacy Operator Access',
          category: 'OPERATIONS',
          permissions: ['pharmacy:dispense:create', 'pharmacy:stock:view', 'pharmacy:stock:adjust', 'pharmacy:invoice:create']
        },
        {
          code: 'PACK_LAB_TECH',
          name: 'Laboratory Technician Access',
          category: 'DIAGNOSTICS',
          permissions: ['lab:order:view', 'lab:sample:collect', 'lab:result:enter', 'lab:result:validate']
        },
        {
          code: 'PACK_BILLING_DESK',
          name: 'Billing & Cashier Access',
          category: 'ADMIN',
          permissions: ['billing:invoice:view', 'billing:invoice:create', 'billing:payment:collect', 'billing:claims:submit']
        },
        {
          code: 'PACK_RECEPTION_DESK',
          name: 'Reception & Front Desk Access',
          category: 'OPERATIONS',
          permissions: ['patient:record:view', 'patient:record:create', 'appointment:token:view', 'appointment:token:create', 'billing:invoice:view']
        },
        {
          code: 'PACK_NURSING_CORE',
          name: 'Ward Nursing Core Access',
          category: 'CLINICAL',
          permissions: ['patient:record:view', 'clinical:vitals:record', 'inpatient:bed:manage', 'inpatient:rounds:note']
        },
        {
          code: 'PACK_EXECUTIVE_AUDIT',
          name: 'Executive & Compliance Audit Access',
          category: 'ADMIN',
          permissions: ['*']
        }
      ];
      return reply.send({ success: true, data: packs });
    }
  );

  // POST /api/v1/company/partners/:partnerId/roles
  fastify.post(
    '/api/v1/company/partners/:partnerId/roles',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const body = request.body as {
        name: string;
        code: string;
        description?: string;
        departmentId?: string;
        permissionPackCodes?: string[];
        customPermissions?: string[];
      };

      if (!body.name || !body.code) {
        throw new AppError({ message: 'name and code are required for custom role', statusCode: 400 });
      }

      const db = getDatabase();
      const pUuid = toDeterministicUuid(partnerId);

      let createdRole: any = {
        id: crypto.randomUUID(),
        code: body.code.toUpperCase(),
        name: body.name,
        description: body.description,
        tenantId: pUuid,
        partnerId,
        departmentId: body.departmentId || null,
        isCustom: true
      };

      if (db) {
        await ensureTenantExists(pUuid, partnerId);
        const [existingRole] = await db
          .select()
          .from(roles)
          .where(
            and(
              eq(roles.tenantId, pUuid),
              eq(roles.code, body.code.toUpperCase())
            )
          );
        if (existingRole) {
          const [updated] = await db
            .update(roles)
            .set({
              name: body.name,
              description: body.description,
              updatedAt: new Date()
            })
            .where(eq(roles.id, existingRole.id))
            .returning();
          createdRole = updated || existingRole;
        } else {
          const [r] = await db
            .insert(roles)
            .values({
              id: crypto.randomUUID(),
              code: body.code.toUpperCase(),
              name: body.name,
              description: body.description,
              tenantId: pUuid,
              isSystem: false
            })
            .returning();
          createdRole = r;
        }
      }

      return reply.status(201).send({
        success: true,
        data: createdRole,
        message: `Custom role "${body.name}" created successfully.`
      });
    }
  );

  // GET /api/v1/company/partners/:partnerId/policies
  fastify.get(
    '/api/v1/company/partners/:partnerId/policies',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const db = getDatabase();
      const pUuid = toDeterministicUuid(partnerId);

      let list: any[] = [];
      if (db) {
        list = await db
          .select()
          .from(accessPolicies)
          .where(eq(accessPolicies.tenantId, pUuid))
          .orderBy(desc(accessPolicies.priority));
      }

      return reply.send({ success: true, data: list });
    }
  );

  // POST /api/v1/company/partners/:partnerId/policies
  fastify.post(
    '/api/v1/company/partners/:partnerId/policies',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const body = request.body as any;

      if (!body.code || !body.name) {
        throw new AppError({ message: 'code and name are required for policy', statusCode: 400 });
      }

      const db = getDatabase();
      const pUuid = toDeterministicUuid(partnerId);

      let created: any = {
        id: crypto.randomUUID(),
        code: body.code,
        name: body.name,
        effect: body.effect || 'ALLOW',
        priority: body.priority || 100
      };

      if (db) {
        await ensureTenantExists(pUuid, partnerId);
        const [row] = await db
          .insert(accessPolicies)
          .values({
            id: crypto.randomUUID(),
            tenantId: pUuid,
            partnerId,
            code: body.code,
            name: body.name,
            description: body.description,
            effect: body.effect || 'ALLOW',
            priority: body.priority || 100,
            conditions: body.conditions || [],
            actions: body.actions || [],
            timeWindow: body.timeWindow || null,
            status: 'ACTIVE',
            createdBy: (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health'
          })
          .returning();
        created = row;
      }
      return reply.status(201).send({ success: true, data: created });
    }
  );

  // =========================================================================
  // 4. EFFECTIVE ACCESS EVALUATION & ACCESS SIMULATOR
  // =========================================================================

  // GET /api/v1/company/partners/:partnerId/effective-access
  fastify.get(
    '/api/v1/company/partners/:partnerId/effective-access',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      const { role, branchId, action } = request.query as {
        role?: string;
        branchId?: string;
        action?: string;
      };

      // 1. Tenant isolation: caller must be SUPER_ADMIN/COMPANY_ADMIN OR belong to the requested partner organization
      const sessionTenantId = request.session?.tenantId;
      const isPrivilegedAdmin = Boolean(
        request.session?.isSuperAdmin ||
        (request.session?.roles || []).some((r) => r === 'SUPER_ADMIN' || r === 'COMPANY_ADMIN')
      );
      if (!isPrivilegedAdmin) {
        const targetUuid = partnerId.includes('-') && partnerId.length === 36 ? partnerId : toDeterministicUuid(partnerId);
        if (sessionTenantId !== targetUuid && sessionTenantId !== partnerId) {
          throw new AppError({
            message: 'Forbidden: Cross-tenant effective access evaluation is denied',
            statusCode: 403
          });
        }
      }

      // 2. Branch isolation: branch-scoped users are restricted to their assigned branch
      const isTenantOrGlobalAdmin =
        request.session.isSuperAdmin ||
        request.session.roles.includes('SUPER_ADMIN') ||
        request.session.roles.includes('COMPANY_ADMIN') ||
        (request.session.roles.includes('HOSPITAL_ADMIN') && request.session.dataScope !== 'branch') ||
        (request.session.roles.includes('CLINIC_ADMIN') && request.session.dataScope !== 'branch');

      const isBranchScoped =
        request.session.dataScope === 'branch' ||
        (!isTenantOrGlobalAdmin && Boolean(request.session.branchId));

      if (isBranchScoped && request.session.branchId) {
        if (branchId && branchId !== request.session.branchId) {
          throw new AppError({
            message: 'Access denied: Access outside your assigned branch is forbidden',
            code: ErrorCode.BRANCH_ACCESS_DENIED,
            statusCode: 403
          });
        }
      }

      // 3. Prevent privilege elevation / reconnaissance by non-admin callers
      if (!isPrivilegedAdmin && role && !request.session.roles.includes(role as any)) {
        throw new AppError({
          message: `Access denied: Cannot evaluate effective access for unassigned role "${role}"`,
          code: ErrorCode.INSUFFICIENT_PERMISSIONS,
          statusCode: 403
        });
      }

      const targetRole = role || request.session?.roles?.[0] || 'DOCTOR';
      const targetBranchId = branchId || (isBranchScoped ? request.session?.branchId : undefined);
      const effectiveAssignedBranchId = (request.query as any).assignedBranchId || request.session?.branchId || undefined;

      const result = await effectiveAccessEngine.evaluateAccess({
        partnerId,
        role: targetRole,
        branchId: targetBranchId,
        assignedBranchId: effectiveAssignedBranchId,
        action: action || 'patient.view',
        isSuperAdmin: targetRole ? false : request.session?.isSuperAdmin
      });

      return reply.send({ success: true, data: result });
    }
  );

  // POST /api/v1/company/access/simulate
  fastify.post(
    '/api/v1/company/access/simulate',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const body = request.body as any;
      const result = await effectiveAccessEngine.simulateAccess({
        partnerId: body.partnerId,
        role: body.role || 'DOCTOR',
        roles: body.roles,
        branchId: body.branchId,
        departmentCode: body.departmentCode,
        action: body.action || 'patient.view',
        globalFreezeOverride: body.globalFreezeOverride,
        licenseStatusOverride: body.licenseStatusOverride,
        capabilitiesOverride: body.capabilitiesOverride,
        isSuperAdmin: false
      });

      return reply.send({ success: true, data: result });
    }
  );

  // =========================================================================
  // 5. CONFIGURATION VERSIONING, DIFF & ROLLBACK
  // =========================================================================

  // GET /api/v1/company/partners/:partnerId/configuration/history
  fastify.get(
    '/api/v1/company/partners/:partnerId/configuration/history',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const history = await configurationVersioningService.getVersionHistory(partnerId);
      return reply.send({ success: true, data: history });
    }
  );

  // GET /api/v1/company/partners/:partnerId/configuration/diff
  fastify.get(
    '/api/v1/company/partners/:partnerId/configuration/diff',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const { v1, v2 } = request.query as { v1: string; v2: string };

      if (!v1 || !v2) {
        throw new AppError({ message: 'Query params v1 and v2 are required for diff', statusCode: 400 });
      }

      const diff = await configurationVersioningService.compareVersions(partnerId, parseInt(v1, 10), parseInt(v2, 10));
      return reply.send({ success: true, data: diff });
    }
  );

  // POST /api/v1/company/partners/:partnerId/configuration/rollback
  fastify.post(
    '/api/v1/company/partners/:partnerId/configuration/rollback',
    {
      preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]
    },
    async (request, reply) => {
      const { partnerId } = request.params as { partnerId: string };
      assertPartnerTenantScope(request, partnerId);
      const { targetVersion } = request.body as { targetVersion: number };

      if (!targetVersion) {
        throw new AppError({ message: 'targetVersion is required for rollback', statusCode: 400 });
      }

      const res = await configurationVersioningService.rollbackToVersion(
        partnerId,
        targetVersion,
        (request.session as any)?.email || request.session?.userId || 'founder@docsearch.health'
      );
      return reply.send({ success: true, data: res, message: res.message });
    }
  );

  // =========================================================================
  // 6. BREAK-GLASS EMERGENCY CLINICAL ACCESS (FINDING-P1-ABAC-BREAKGLASS-05)
  // =========================================================================

  const handleBreakGlassRequest = async (request: any, reply: any) => {
    const body = (request.body || {}) as {
      partnerId?: string;
      tenantId?: string;
      reason?: string;
      patientId?: string;
      encounterId?: string;
      durationMinutes?: number;
      expiresInSeconds?: number;
    };

    const session = request.session;
    if (!session || !session.userId || !session.tenantId) {
      throw AppError.unauthorized('Authenticated session context is required for break-glass emergency access.');
    }

    // Invariant (P1-05 #10): Normal/non-staff users (e.g. PATIENT, GUEST, PUBLIC_USER, VENDOR) cannot manufacture Break-Glass privilege
    const NON_STAFF_FORBIDDEN_ROLES = new Set(['PATIENT', 'GUEST', 'PUBLIC_USER', 'EXTERNAL_USER', 'VENDOR', 'ANONYMOUS']);
    const callerRoles = Array.isArray(session.roles) ? session.roles.map((r: any) => String(r).toUpperCase().trim()) : [];
    if (
      callerRoles.length === 0 ||
      callerRoles.every((r: string) => NON_STAFF_FORBIDDEN_ROLES.has(r))
    ) {
      throw new AppError({
        message: 'Access denied: Normal or non-healthcare users cannot request or manufacture Break-Glass emergency privilege.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const reasonText = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reasonText || reasonText.length < 5) {
      throw new AppError({
        message: 'Explicit emergency clinical reason (minimum 5 characters) is mandatory for break-glass access.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : '';
    if (!patientId) {
      throw new AppError({
        message: 'Patient/record scope (patientId) is mandatory for break-glass emergency access.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    if (
      patientId === '*' ||
      patientId.toLowerCase() === 'all' ||
      (typeof (body as any).scope === 'string' && ((body as any).scope === '*' || (body as any).scope.toUpperCase() === 'ALL'))
    ) {
      throw new AppError({
        message: 'Access denied: Wildcard or permanent Break-Glass privilege is strictly forbidden. Must target a single specific patientId.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    const requestedTenantId = (body.tenantId || body.partnerId || session.tenantId).trim();
    const sessionTenantUuid = toDeterministicUuid(session.tenantId);
    const requestedTenantUuid = toDeterministicUuid(requestedTenantId);

    // Enforce strict tenant isolation: cross-tenant break-glass is strictly denied
    if (requestedTenantId !== session.tenantId && requestedTenantUuid !== sessionTenantUuid) {
      throw new AppError({
        message: 'Access denied: Cross-tenant break-glass emergency access is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    let durationMs = 60 * 60 * 1000; // default 60 minutes
    let durationLabel = '60 minutes';
    if (body.expiresInSeconds !== undefined) {
      const secs = Number(body.expiresInSeconds);
      if (!Number.isFinite(secs) || secs <= 0 || secs > 240 * 60) {
        throw new AppError({
          message: 'Invalid break-glass duration: expiresInSeconds must be between 1 and 14400 seconds (max 4 hours).',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      durationMs = secs * 1000;
      durationLabel = `${secs} seconds`;
    } else if (body.durationMinutes !== undefined) {
      const mins = Number(body.durationMinutes);
      if (!Number.isFinite(mins) || mins <= 0 || mins > 240) {
        throw new AppError({
          message: 'Invalid break-glass duration: durationMinutes must be between 1 and 240 minutes (no permanent emergency privilege allowed).',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      durationMs = mins * 60 * 1000;
      durationLabel = `${mins} minutes`;
    }

    const db = getDatabase();
    if (db) {
      // Validate patientId scope in PostgreSQL: must exist and belong to caller's tenant
      const patientRows = await db
        .select({ id: patients.id, tenantId: patients.tenantId })
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      const patientRow = patientRows[0];
      if (!patientRow) {
        throw new AppError({
          message: `Invalid patient scope: Patient chart '${patientId}' does not exist.`,
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      if (
        patientRow.tenantId !== session.tenantId &&
        toDeterministicUuid(patientRow.tenantId) !== sessionTenantUuid
      ) {
        throw new AppError({
          message: 'Access denied: Target patient belongs to a different tenant. Cross-tenant break-glass is forbidden.',
          code: ErrorCode.TENANT_ACCESS_DENIED,
          statusCode: 403
        });
      }
    }

    const triggeredAt = new Date();
    const expiresAt = new Date(triggeredAt.getTime() + durationMs);
    const actorEmail = session.actorEmail || (session as any).email || session.userId;
    const partnerIdVal = body.partnerId || session.tenantId;

    let record: any = {
      id: crypto.randomUUID(),
      tenantId: sessionTenantUuid,
      partnerId: partnerIdVal,
      userId: session.userId,
      userEmail: actorEmail,
      patientId,
      encounterId: body.encounterId || null,
      reason: reasonText,
      scope: 'CLINICAL_EMERGENCY_PATIENT_CHART',
      triggeredAt: triggeredAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revokedAt: null
    };

    if (db) {
      await ensureTenantExists(sessionTenantUuid, partnerIdVal);
      const userUuid = toDeterministicUuid(session.userId);
      await ensureUserExists(userUuid, actorEmail);
      const [row] = await db
        .insert(breakGlassAccess)
        .values({
          id: record.id,
          tenantId: sessionTenantUuid,
          partnerId: partnerIdVal,
          userId: userUuid,
          userEmail: actorEmail,
          patientId,
          encounterId: body.encounterId || null,
          reason: reasonText,
          scope: 'CLINICAL_EMERGENCY_PATIENT_CHART',
          triggeredAt,
          expiresAt,
          ipAddress: request.ip || null
        })
        .returning();
      if (row) {
        record = row;
      }
    }

    await auditRepository.recordEvent(
      {
        eventType: 'BREAK_GLASS_EMERGENCY_GRANTED',
        resourceType: 'patient_chart',
        resourceId: patientId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          breakGlassId: record.id,
          actorId: session.userId,
          actorEmail,
          timestamp: triggeredAt.toISOString(),
          reason: reasonText,
          patientId,
          encounterId: body.encounterId || null,
          actionPerformed: 'EMERGENCY_BREAK_GLASS_GRANTED',
          expiresAt: expiresAt.toISOString()
        }
      },
      session
    );

    return reply.status(201).send({
      success: true,
      data: record,
      message: `Break-glass emergency access granted for ${durationLabel}. Reason and actions are fully audited.`
    });
  };

  // POST /api/v1/company/break-glass
  fastify.post(
    '/api/v1/company/break-glass',
    { preHandler: [authenticate] },
    handleBreakGlassRequest
  );

  // POST /api/v1/partner/break-glass
  fastify.post(
    '/api/v1/partner/break-glass',
    { preHandler: [authenticate] },
    handleBreakGlassRequest
  );

  const handleBreakGlassRevoke = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const session = request.session;
    const db = getDatabase();
    if (!db) {
      throw AppError.internal('Database unavailable');
    }

    const rows = await db.select().from(breakGlassAccess).where(eq(breakGlassAccess.id, id)).limit(1);
    const existing = rows[0];
    if (!existing) {
      throw AppError.notFound(`Break-glass grant ${id} not found`);
    }

    const sessionTenantUuid = toDeterministicUuid(session.tenantId);
    if (!session.isSuperAdmin && existing.tenantId !== sessionTenantUuid && existing.tenantId !== session.tenantId) {
      throw new AppError({
        message: 'Access denied: Cannot revoke break-glass grant belonging to another tenant.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const revokedAt = new Date();
    const revokedBy = session.actorEmail || (session as any).email || session.userId;
    const [updated] = await db
      .update(breakGlassAccess)
      .set({ revokedAt, revokedBy })
      .where(eq(breakGlassAccess.id, id))
      .returning();

    await auditRepository.recordEvent(
      {
        eventType: 'BREAK_GLASS_EMERGENCY_REVOKED',
        resourceType: 'patient_chart',
        resourceId: existing.patientId || id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: {
          breakGlassId: id,
          actorId: session.userId,
          actorEmail: revokedBy,
          timestamp: revokedAt.toISOString(),
          reason: existing.reason,
          patientId: existing.patientId,
          actionPerformed: 'EMERGENCY_BREAK_GLASS_REVOKED'
        }
      },
      session
    );

    return reply.status(200).send({
      success: true,
      data: updated,
      message: 'Break-glass emergency access revoked. Normal RBAC permissions restored immediately.'
    });
  };

  fastify.post(
    '/api/v1/company/break-glass/:id/revoke',
    { preHandler: [authenticate] },
    handleBreakGlassRevoke
  );

  fastify.post(
    '/api/v1/partner/break-glass/:id/revoke',
    { preHandler: [authenticate] },
    handleBreakGlassRevoke
  );
};
