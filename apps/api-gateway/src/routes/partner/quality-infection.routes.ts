import type { FastifyPluginAsync } from 'fastify';
import { QualityInfectionService } from '../../services/partner/QualityInfectionService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';

const service = new QualityInfectionService();

export const qualityInfectionRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireModuleCommercialAccess('CLINICAL_EMR'));

  // 1. Overview & Standards
  app.get(
    '/api/v1/partner/quality/overview',
    { preHandler: [authenticate, requirePermission('quality:incident', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getOverviewMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/quality/standards',
    { preHandler: [authenticate, requirePermission('quality:standards', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getStandards(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Incidents
  app.get(
    '/api/v1/partner/quality/incidents',
    { preHandler: [authenticate, requirePermission('quality:incident', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getIncidents(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/quality-infection/incidents',
    { preHandler: [authenticate, requirePermission('quality:incident', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getIncidents(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/incidents',
    { preHandler: [authenticate, requirePermission('quality:incident', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.reportIncident(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality-infection/incidents',
    { preHandler: [authenticate, requirePermission('quality:incident', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.reportIncident(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/quality/incidents/:id/triage',
    { preHandler: [authenticate, requirePermission('quality:incident', 'update')] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { sacScore: string; investigatingOfficer: string; rcaRequired: boolean };
      const data = await service.triageIncident(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/quality/incidents/:id/close',
    { preHandler: [authenticate, requirePermission('quality:incident', 'update')] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.closeIncident(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  // 3. RCAs
  app.get(
    '/api/v1/partner/quality/rcas',
    { preHandler: [authenticate, requirePermission('quality:rca', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getRcas(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/rcas',
    { preHandler: [authenticate, requirePermission('quality:rca', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createRca(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 4. CAPAs
  app.get(
    '/api/v1/partner/quality/capas',
    { preHandler: [authenticate, requirePermission('quality:capa', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getCapas(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/capas',
    { preHandler: [authenticate, requirePermission('quality:capa', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createCapa(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/quality/capas/:id/verify',
    { preHandler: [authenticate, requirePermission('quality:capa', 'update')] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { verificationNotes: string; isEffective: boolean };
      const data = await service.verifyCapa(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 5. HAI Surveillance
  app.get(
    '/api/v1/partner/quality/hai',
    { preHandler: [authenticate, requirePermission('infection:hai', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getHaiSurveillances(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/hai',
    { preHandler: [authenticate, requirePermission('infection:hai', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.logHaiCase(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 6. Patient Isolations
  app.get(
    '/api/v1/partner/quality/isolations',
    { preHandler: [authenticate, requirePermission('infection:isolation', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getPatientIsolations(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/isolations',
    { preHandler: [authenticate, requirePermission('infection:isolation', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.assignIsolation(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/quality/isolations/:id/discharge',
    { preHandler: [authenticate, requirePermission('infection:isolation', 'update')] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.dischargeIsolation(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  // 7. Hand Hygiene
  app.get(
    '/api/v1/partner/quality/hand-hygiene',
    { preHandler: [authenticate, requirePermission('infection:hygiene', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getHandHygieneAudits(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/hand-hygiene',
    { preHandler: [authenticate, requirePermission('infection:hygiene', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.recordHandHygieneAudit(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 8. Environmental Swabs
  app.get(
    '/api/v1/partner/quality/swabs',
    { preHandler: [authenticate, requirePermission('infection:swab', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getEnvironmentalSwabs(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/swabs',
    { preHandler: [authenticate, requirePermission('infection:swab', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.recordEnvironmentalSwab(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 9. Needle Stick Logs
  app.get(
    '/api/v1/partner/quality/needle-stick',
    { preHandler: [authenticate, requirePermission('infection:sharps', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getNeedleStickLogs(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/needle-stick',
    { preHandler: [authenticate, requirePermission('infection:sharps', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.recordNeedleStickLog(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 10. BMW Logs
  app.get(
    '/api/v1/partner/quality/bmw',
    { preHandler: [authenticate, requirePermission('infection:waste', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getBmwLogs(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/quality/bmw',
    { preHandler: [authenticate, requirePermission('infection:waste', 'create')] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.recordBmwLog(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 11. Audit Traces
  app.get(
    '/api/v1/partner/quality/audit-traces',
    { preHandler: [authenticate, requirePermission('quality:audit', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );
};
