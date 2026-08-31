import type { FastifyPluginAsync } from 'fastify';
import { AssetBiomedicalService } from '../../services/partner/AssetBiomedicalService.js';
import { authenticate } from '../../plugins/auth-guard.js';

const service = new AssetBiomedicalService();

export const assetBiomedicalRoutes: FastifyPluginAsync = async (app) => {
  // 1. Overview & Analytics
  app.get(
    '/api/v1/partner/biomedical/overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getOverviewMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/biomedical/analytics/downtime',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getDowntimeAnalytics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Assets
  app.get(
    '/api/v1/partner/biomedical/assets',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAssets(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/biomedical/assets',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createAsset(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/biomedical/assets/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.updateAsset(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 3. Work Orders
  app.get(
    '/api/v1/partner/biomedical/work-orders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getWorkOrders(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/biomedical/work-orders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createWorkOrder(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/biomedical/work-orders/:id/assign',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { assignedToEngineerId: string; priority?: string };
      const data = await service.assignWorkOrder(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/biomedical/work-orders/:id/complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { rootCause: string; correctiveAction: string; downtimeMinutes?: number };
      const data = await service.completeWorkOrder(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/biomedical/work-orders/:id/verify',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { verifiedBy: string; verificationNotes: string };
      const data = await service.verifyWorkOrder(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 4. PPM Schedules
  app.get(
    '/api/v1/partner/biomedical/ppm-schedules',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getPpmSchedules(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/biomedical/ppm-schedules',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createPpmSchedule(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/biomedical/ppm-schedules/:id/complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { checklistResults: Record<string, boolean>; completedBy: string; remarks?: string };
      const data = await service.completePpmTask(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 5. Calibration Records
  app.get(
    '/api/v1/partner/biomedical/calibrations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getCalibrationRecords(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/biomedical/calibrations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createCalibrationRecord(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 6. Safety Tests (IEC 62353)
  app.get(
    '/api/v1/partner/biomedical/safety-tests',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getSafetyTestRecords(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/biomedical/safety-tests',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createSafetyTestRecord(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 7. Spare Parts
  app.get(
    '/api/v1/partner/biomedical/spare-parts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getSpareParts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/biomedical/spare-parts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createSparePart(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/biomedical/spare-parts/consume',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = request.body as { sparePartId: string; workOrderId?: string; quantityUsed: number; usedBy: string };
      const data = await service.consumeSparePart(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 8. Condemnations
  app.get(
    '/api/v1/partner/biomedical/condemnations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getCondemnations(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/biomedical/condemnations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createCondemnation(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/biomedical/condemnations/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { approvedBy: string; committeeMeetingDate?: string; disposalMethod?: string };
      const data = await service.approveCondemnation(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 9. Audit Traces
  app.get(
    '/api/v1/partner/biomedical/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );
};
