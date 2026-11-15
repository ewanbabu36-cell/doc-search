import type { FastifyPluginAsync } from 'fastify';
import { AssetBiomedicalService } from '../../services/partner/AssetBiomedicalService.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';

const service = new AssetBiomedicalService();

export const assetBiomedicalRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireModuleCommercialAccess('OPERATIONS'));

  const prefixes = ['/api/v1/partner/biomedical', '/api/v1/partner/asset-biomedical'];

  for (const prefix of prefixes) {
    // 1. Overview & Analytics
    app.get(
      `${prefix}/overview`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getOverviewMetrics(tenantId);
        return reply.send({ success: true, data });
      }
    );

    app.get(
      `${prefix}/analytics/downtime`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getDowntimeAnalytics(tenantId);
        return reply.send({ success: true, data });
      }
    );

    // 2. Assets
    app.get(
      `${prefix}/assets`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getAssets(tenantId);
        return reply.send({ success: true, data });
      }
    );

    app.post(
      `${prefix}/assets`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId, branchId, userId } = request.session;
        const payload = (request.body || {}) as Record<string, unknown>;
        const data = await service.createAsset(tenantId, branchId || 'branch_default', userId, payload);
        return reply.status(201).send({ success: true, data });
      }
    );

    const updateAssetHandler = async (request: any, reply: any) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.updateAsset(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    };

    app.patch(`${prefix}/assets/:id`, { preHandler: [authenticate] }, updateAssetHandler);
    app.put(`${prefix}/assets/:id`, { preHandler: [authenticate] }, updateAssetHandler);

    // 3. Work Orders
    app.get(
      `${prefix}/work-orders`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getWorkOrders(tenantId);
        return reply.send({ success: true, data });
      }
    );

    app.post(
      `${prefix}/work-orders`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId, branchId, userId } = request.session;
        const payload = (request.body || {}) as Record<string, unknown>;
        const data = await service.createWorkOrder(tenantId, branchId || 'branch_default', userId, payload);
        return reply.status(201).send({ success: true, data });
      }
    );

    const assignWorkOrderHandler = async (request: any, reply: any) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { assignedToEngineerId: string; priority?: string };
      const data = await service.assignWorkOrder(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    };
    app.patch(`${prefix}/work-orders/:id/assign`, { preHandler: [authenticate] }, assignWorkOrderHandler);
    app.post(`${prefix}/work-orders/:id/assign`, { preHandler: [authenticate] }, assignWorkOrderHandler);

    const completeWorkOrderHandler = async (request: any, reply: any) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { rootCause: string; correctiveAction: string; downtimeMinutes?: number };
      const data = await service.completeWorkOrder(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    };
    app.patch(`${prefix}/work-orders/:id/complete`, { preHandler: [authenticate] }, completeWorkOrderHandler);
    app.post(`${prefix}/work-orders/:id/complete`, { preHandler: [authenticate] }, completeWorkOrderHandler);

    const verifyWorkOrderHandler = async (request: any, reply: any) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { verifiedBy: string; verificationNotes: string };
      const data = await service.verifyWorkOrder(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    };
    app.patch(`${prefix}/work-orders/:id/verify`, { preHandler: [authenticate] }, verifyWorkOrderHandler);
    app.post(`${prefix}/work-orders/:id/verify`, { preHandler: [authenticate] }, verifyWorkOrderHandler);

    // 4. PPM Schedules
    app.get(
      `${prefix}/ppm-schedules`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getPpmSchedules(tenantId);
        return reply.send({ success: true, data });
      }
    );

    app.post(
      `${prefix}/ppm-schedules`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId, branchId, userId } = request.session;
        const payload = (request.body || {}) as Record<string, unknown>;
        const data = await service.createPpmSchedule(tenantId, branchId || 'branch_default', userId, payload);
        return reply.status(201).send({ success: true, data });
      }
    );

    const completePpmHandler = async (request: any, reply: any) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { checklistResults: Record<string, boolean>; completedBy: string; remarks?: string };
      const data = await service.completePpmTask(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    };
    app.patch(`${prefix}/ppm-schedules/:id/complete`, { preHandler: [authenticate] }, completePpmHandler);
    app.post(`${prefix}/ppm-schedules/:id/complete`, { preHandler: [authenticate] }, completePpmHandler);

    // 5. Calibration Records
    app.get(
      `${prefix}/calibrations`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getCalibrationRecords(tenantId);
        return reply.send({ success: true, data });
      }
    );

    app.post(
      `${prefix}/calibrations`,
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
      `${prefix}/safety-tests`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getSafetyTestRecords(tenantId);
        return reply.send({ success: true, data });
      }
    );

    app.post(
      `${prefix}/safety-tests`,
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
      `${prefix}/spare-parts`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getSpareParts(tenantId);
        return reply.send({ success: true, data });
      }
    );

    app.post(
      `${prefix}/spare-parts`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId, branchId, userId } = request.session;
        const payload = (request.body || {}) as Record<string, unknown>;
        const data = await service.createSparePart(tenantId, branchId || 'branch_default', userId, payload);
        return reply.status(201).send({ success: true, data });
      }
    );

    app.post(
      `${prefix}/spare-parts/consume`,
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
      `${prefix}/condemnations`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getCondemnations(tenantId);
        return reply.send({ success: true, data });
      }
    );

    app.post(
      `${prefix}/condemnations`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId, branchId, userId } = request.session;
        const payload = (request.body || {}) as Record<string, unknown>;
        const data = await service.createCondemnation(tenantId, branchId || 'branch_default', userId, payload);
        return reply.status(201).send({ success: true, data });
      }
    );

    const approveCondemnationHandler = async (request: any, reply: any) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = request.body as { approvedBy: string; committeeMeetingDate?: string; disposalMethod?: string };
      const data = await service.approveCondemnation(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    };
    app.patch(`${prefix}/condemnations/:id/approve`, { preHandler: [authenticate] }, approveCondemnationHandler);
    app.post(`${prefix}/condemnations/:id/approve`, { preHandler: [authenticate] }, approveCondemnationHandler);

    // 9. Audit Traces
    app.get(
      `${prefix}/audit-traces`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { tenantId } = request.session;
        const data = await service.getAuditTraces(tenantId);
        return reply.send({ success: true, data });
      }
    );

    // 10. Transfers, Incidents, Vendor Visits, Spare Part Usages aliases
    app.get(
      `${prefix}/transfers`,
      { preHandler: [authenticate] },
      async (_request, reply) => {
        return reply.send({ success: true, data: [] });
      }
    );
    app.post(
      `${prefix}/transfers`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const body = (request.body || {}) as any;
        return reply.status(201).send({ success: true, data: { id: crypto.randomUUID(), ...body, createdAt: new Date().toISOString() } });
      }
    );

    app.get(
      `${prefix}/incidents`,
      { preHandler: [authenticate] },
      async (_request, reply) => {
        return reply.send({ success: true, data: [] });
      }
    );
    app.post(
      `${prefix}/incidents`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const body = (request.body || {}) as any;
        return reply.status(201).send({ success: true, data: { id: crypto.randomUUID(), ...body, status: 'OPEN', createdAt: new Date().toISOString() } });
      }
    );
    app.post(
      `${prefix}/incidents/:id/resolve`,
      { preHandler: [authenticate] },
      async (_request, reply) => {
        return reply.send({ success: true, data: { status: 'RESOLVED', resolvedAt: new Date().toISOString() } });
      }
    );

    app.get(
      `${prefix}/spare-part-usages`,
      { preHandler: [authenticate] },
      async (_request, reply) => {
        return reply.send({ success: true, data: [] });
      }
    );

    app.get(
      `${prefix}/vendor-visits`,
      { preHandler: [authenticate] },
      async (_request, reply) => {
        return reply.send({ success: true, data: [] });
      }
    );
    app.post(
      `${prefix}/vendor-visits`,
      { preHandler: [authenticate] },
      async (request, reply) => {
        const body = (request.body || {}) as any;
        return reply.status(201).send({ success: true, data: { id: crypto.randomUUID(), ...body, visitDate: new Date().toISOString() } });
      }
    );
  }
};
