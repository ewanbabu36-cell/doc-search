import type { FastifyPluginAsync } from 'fastify';
import { HardwareBridgeService } from '../../services/partner/HardwareBridgeService.js';
import { authenticate } from '../../plugins/auth-guard.js';

const service = new HardwareBridgeService();

export const hardwareBridgeRoutes: FastifyPluginAsync = async (app) => {
  // 1. Overview Metrics
  app.get(
    '/api/v1/partner/hardware/overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getOverviewMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Devices (WebUSB / WebSerial Handshake)
  app.get(
    '/api/v1/partner/hardware/devices',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getDevices(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/hardware/devices',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.registerDevice(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 3. Barcode Scans
  app.get(
    '/api/v1/partner/hardware/scans',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getScans(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/hardware/scans',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.processBarcodeScan(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 4. RFID UHF Tags
  app.get(
    '/api/v1/partner/hardware/rfid-reads',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getRfidReads(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/hardware/rfid-reads',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.processRfidTagRead(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 5. ZPL Label Print Jobs
  app.get(
    '/api/v1/partner/hardware/print-jobs',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getPrintJobs(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/hardware/print-jobs/generate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.generateZplLabel(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 6. Audit Traces
  app.get(
    '/api/v1/partner/hardware/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );
};
