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
  const getSwabsHandler = async (request: any, reply: any) => {
    const { tenantId } = request.session;
    const data = await service.getEnvironmentalSwabs(tenantId);
    return reply.send({ success: true, data });
  };
  const postSwabsHandler = async (request: any, reply: any) => {
    const { tenantId, branchId, userId } = request.session;
    const payload = (request.body || {}) as Record<string, unknown>;
    const data = await service.recordEnvironmentalSwab(tenantId, branchId || 'branch_default', userId, payload);
    return reply.status(201).send({ success: true, data });
  };
  app.get('/api/v1/partner/quality/swabs', { preHandler: [authenticate, requirePermission('infection:swab', 'read')] }, getSwabsHandler);
  app.get('/api/v1/partner/quality/environmental-swabs', { preHandler: [authenticate, requirePermission('infection:swab', 'read')] }, getSwabsHandler);
  app.post('/api/v1/partner/quality/swabs', { preHandler: [authenticate, requirePermission('infection:swab', 'create')] }, postSwabsHandler);
  app.post('/api/v1/partner/quality/environmental-swabs', { preHandler: [authenticate, requirePermission('infection:swab', 'create')] }, postSwabsHandler);

  // 9. Needle Stick Logs
  const getNeedleStickHandler = async (request: any, reply: any) => {
    const { tenantId } = request.session;
    const data = await service.getNeedleStickLogs(tenantId);
    return reply.send({ success: true, data });
  };
  const postNeedleStickHandler = async (request: any, reply: any) => {
    const { tenantId, branchId, userId } = request.session;
    const payload = (request.body || {}) as Record<string, unknown>;
    const data = await service.recordNeedleStickLog(tenantId, branchId || 'branch_default', userId, payload);
    return reply.status(201).send({ success: true, data });
  };
  app.get('/api/v1/partner/quality/needle-stick', { preHandler: [authenticate, requirePermission('infection:sharps', 'read')] }, getNeedleStickHandler);
  app.get('/api/v1/partner/quality/needle-stick-logs', { preHandler: [authenticate, requirePermission('infection:sharps', 'read')] }, getNeedleStickHandler);
  app.post('/api/v1/partner/quality/needle-stick', { preHandler: [authenticate, requirePermission('infection:sharps', 'create')] }, postNeedleStickHandler);
  app.post('/api/v1/partner/quality/needle-stick-logs', { preHandler: [authenticate, requirePermission('infection:sharps', 'create')] }, postNeedleStickHandler);

  // 10. BMW Logs
  const getBmwHandler = async (request: any, reply: any) => {
    const { tenantId } = request.session;
    const data = await service.getBmwLogs(tenantId);
    return reply.send({ success: true, data });
  };
  const postBmwHandler = async (request: any, reply: any) => {
    const { tenantId, branchId, userId } = request.session;
    const payload = (request.body || {}) as Record<string, unknown>;
    const data = await service.recordBmwLog(tenantId, branchId || 'branch_default', userId, payload);
    return reply.status(201).send({ success: true, data });
  };
  app.get('/api/v1/partner/quality/bmw', { preHandler: [authenticate, requirePermission('infection:waste', 'read')] }, getBmwHandler);
  app.get('/api/v1/partner/quality/bmw-logs', { preHandler: [authenticate, requirePermission('infection:waste', 'read')] }, getBmwHandler);
  app.post('/api/v1/partner/quality/bmw', { preHandler: [authenticate, requirePermission('infection:waste', 'create')] }, postBmwHandler);
  app.post('/api/v1/partner/quality/bmw-logs', { preHandler: [authenticate, requirePermission('infection:waste', 'create')] }, postBmwHandler);

  // 10b. HAI Device Days Surveillance Metrics
  app.get(
    '/api/v1/partner/quality/hai-device-days',
    { preHandler: [authenticate, requirePermission('infection:hai', 'read')] },
    async (request, reply) => {
      const { tenantId } = request.session;
      return reply.send({
        success: true,
        data: {
          id: 'hai-dev-month',
          tenantId: tenantId || '11111111-1111-4111-8111-111111111111',
          departmentName: 'ICU / Critical Care Fleet',
          monthYear: new Date().toISOString().slice(0, 7),
          centralLineDays: 140,
          clabsiCount: 0,
          clabsiRatePer1000Days: 0,
          urinaryCatheterDays: 165,
          cautiCount: 0,
          cautiRatePer1000Days: 0,
          ventilatorDays: 95,
          vapCount: 0,
          vapRatePer1000Days: 0
        }
      });
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
