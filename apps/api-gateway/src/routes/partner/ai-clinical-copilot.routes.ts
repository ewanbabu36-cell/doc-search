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
      const data = await service.getOverviewMetrics(request.session);
      return reply.send({ success: true, data });
    }
  );

  // 2. Ambient AI Scribe & SOAP Generation
  app.post(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.generateSoapNoteFromTranscript(request.session, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await service.getSoapNotes(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap/:id/approve',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await service.approveSoapNote(request.session, id);
      return reply.send({ success: true, data });
    }
  );

  // 3. Sepsis NEWS2 Alerts & Care Bundle
  app.post(
    '/api/v1/partner/ai-copilot/sepsis/evaluate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.evaluateSepsisRisk(request.session, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/sepsis/alerts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await service.getSepsisAlerts(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/sepsis/alerts/:id/acknowledge',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.acknowledgeSepsisAlert(request.session, id, payload);
      return reply.send({ success: true, data });
    }
  );

  // 4. Drug-Drug Interaction (DDI) Evaluator
  app.post(
    '/api/v1/partner/ai-copilot/ddi/evaluate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.evaluateDdi(request.session, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/ddi',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await service.getDdiChecks(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/ai-copilot/ddi/override',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const interactionId = String(payload['interactionId'] || '');
      const data = await service.overrideDdiWarning(request.session, interactionId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  // 5. Critical Diagnostic Panic Values
  app.post(
    '/api/v1/partner/ai-copilot/panic-values',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.reportPanicValue(request.session, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/panic-values',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await service.getPanicAlerts(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/panic-values/:id/acknowledge',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.acknowledgePanicValue(request.session, id, payload);
      return reply.send({ success: true, data });
    }
  );

  // 6. Audit Traces
  app.get(
    '/api/v1/partner/ai-copilot/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await service.getAuditTraces(request.session);
      return reply.send({ success: true, data });
    }
  );
};

