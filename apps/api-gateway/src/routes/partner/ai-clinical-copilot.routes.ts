import type { FastifyPluginAsync } from 'fastify';
import { AiClinicalCopilotService } from '../../services/partner/AiClinicalCopilotService.js';
import { authenticate } from '../../plugins/auth-guard.js';

const service = new AiClinicalCopilotService();

export const aiClinicalCopilotRoutes: FastifyPluginAsync = async (app) => {
  // 1. Overview & Metrics
  app.get(
    '/api/v1/partner/ai-copilot/overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getOverviewMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Ambient AI Scribe & SOAP Generation
  app.post(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.generateSoapNoteFromTranscript(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getSoapNotes(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const data = await service.approveSoapNote(tenantId, id, userId);
      return reply.send({ success: true, data });
    }
  );

  // 3. Sepsis NEWS2 Alerts & Care Bundle
  app.post(
    '/api/v1/partner/ai-copilot/sepsis/evaluate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.evaluateSepsisRisk(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/sepsis/alerts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getSepsisAlerts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/sepsis/alerts/:id/acknowledge',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.acknowledgeSepsisAlert(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 4. Drug-Drug Interaction (DDI) Evaluator
  app.post(
    '/api/v1/partner/ai-copilot/ddi/evaluate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.evaluateDdi(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/ai-copilot/ddi/override',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const interactionId = String(payload['interactionId'] || '');
      const data = await service.overrideDdiWarning(tenantId, interactionId, userId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  // 5. Critical Diagnostic Panic Values
  app.post(
    '/api/v1/partner/ai-copilot/panic-values',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.reportPanicValue(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/panic-values',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getPanicAlerts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/panic-values/:id/acknowledge',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { id } = request.params as { id: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.acknowledgePanicValue(tenantId, id, userId, payload);
      return reply.send({ success: true, data });
    }
  );

  // 6. Audit Traces
  app.get(
    '/api/v1/partner/ai-copilot/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );
};
