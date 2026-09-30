import type { FastifyPluginAsync } from 'fastify';
import { HardwareBridgeService } from '../../services/partner/HardwareBridgeService.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';

const service = new HardwareBridgeService();

export const hardwareBridgeRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireModuleCommercialAccess('OPERATIONS'));

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

  // ==========================================================================
  // 7. LIS Hardware Analyzer Interfacing Routes (Milestone 3.3)
  // ==========================================================================

  // Analyzers List
  app.get(
    '/api/v1/partner/hardware/analyzers',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAnalyzers(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // Register Analyzer
  app.post(
    '/api/v1/partner/hardware/analyzers',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.registerAnalyzer(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // Single Analyzer Detail
  app.get(
    '/api/v1/partner/hardware/analyzers/:analyzerId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { analyzerId } = request.params as { analyzerId: string };
      const data = await service.getAnalyzerById(tenantId, analyzerId);
      return reply.send({ success: true, data });
    }
  );

  // ASTM E1381 Handshake (ENQ -> ACK)
  app.post(
    '/api/v1/partner/hardware/analyzers/:analyzerId/astm/handshake',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { analyzerId } = request.params as { analyzerId: string };
      const body = (request.body || {}) as Record<string, unknown>;
      const controlChar = String(body['controlByte'] || body['controlChar'] || 'ENQ');
      const data = await service.processAstmHandshake(tenantId, analyzerId, controlChar);
      return reply.send({ success: true, data });
    }
  );

  // ASTM E1381 / E1394 Message Ingestion
  app.post(
    '/api/v1/partner/hardware/analyzers/:analyzerId/astm/message',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const { analyzerId } = request.params as { analyzerId: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.processAstmMessage(tenantId, branchId || 'branch_default', userId, analyzerId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // HL7 v2.x MLLP Message Ingestion & ACK
  app.post(
    '/api/v1/partner/hardware/analyzers/:analyzerId/hl7/message',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const { analyzerId } = request.params as { analyzerId: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.processHl7Message(tenantId, branchId || 'branch_default', userId, analyzerId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // Bidirectional Worklist Barcode Query
  app.post(
    '/api/v1/partner/hardware/analyzers/:analyzerId/query-worklist',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { analyzerId } = request.params as { analyzerId: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const barcode = String(payload['specimenBarcode'] || payload['barcode'] || 'TUB-2026-9812');
      const data = await service.queryWorklistByBarcode(tenantId, analyzerId, barcode);
      return reply.send({ success: true, data });
    }
  );

  // Quality Control Evaluation (Westgard Multirules)
  app.post(
    '/api/v1/partner/hardware/analyzers/:analyzerId/qc-runs',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const { analyzerId } = request.params as { analyzerId: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.evaluateQcRun(tenantId, branchId || 'branch_default', userId, analyzerId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // QC Historical Runs
  app.get(
    '/api/v1/partner/hardware/analyzers/qc-runs',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const query = (request.query || {}) as Record<string, string>;
      const data = await service.getQcRuns(tenantId, query['analyzerId'], query['testCode']);
      return reply.send({ success: true, data });
    }
  );

  // Panic / Critical Value Alerts
  app.get(
    '/api/v1/partner/hardware/analyzers/critical-alerts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const query = (request.query || {}) as Record<string, string>;
      const data = await service.getCriticalAlerts(tenantId, query['patientMrn']);
      return reply.send({ success: true, data });
    }
  );

  // Analyzer Results Acquisition Log
  app.get(
    '/api/v1/partner/hardware/analyzers/results',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const query = (request.query || {}) as Record<string, string>;
      const data = await service.getAnalyzerResults(tenantId, query['analyzerId'], query['specimenBarcode']);
      return reply.send({ success: true, data });
    }
  );
};
