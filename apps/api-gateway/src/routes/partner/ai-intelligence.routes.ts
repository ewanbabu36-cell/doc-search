import { type FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import { aiGatewayService } from '../../services/ai/AiGatewayService.js';
import { ewannameStaffTrainerService } from '../../services/ai/EwannameStaffTrainerService.js';
import { aiOperationsAssistantService } from '../../services/ai/AiOperationsAssistantService.js';
import { explainableAiAndAnomalyService } from '../../services/ai/ExplainableAiAndAnomalyService.js';
import { demandForecastingService } from '../../services/ai/DemandForecastingService.js';
import { aiCostAndBudgetController } from '../../services/ai/AiCostAndBudgetController.js';
import { aiIncidentAndCapaService } from '../../services/ai/AiIncidentAndCapaService.js';

export const partnerAiIntelligenceRoutes: FastifyPluginAsync = async (fastify) => {
  // -------------------------------------------------------------------------
  // 1. Central AI Gateway Execution & Audit
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/ai/gateway/execute', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const data = await aiGatewayService.executeAiRequest(request.session, body);
    return reply.status(200).send({ success: true, data });
  });

  fastify.get('/api/v1/partner/ai/gateway/history', { preHandler: [authenticate] }, async (request, reply) => {
    const query = (request.query as any) || {};
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const data = await aiGatewayService.getRequestHistory(request.session.tenantId, limit);
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------------------
  // 2. Staff Trainer — Ewanname Operational Guidance
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/ai/trainer/guidance', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const data = await ewannameStaffTrainerService.getGuidance(request.session, body);
    return reply.send({ success: true, data });
  });

  fastify.get('/api/v1/partner/ai/trainer/workflows', { preHandler: [authenticate] }, async (_request, reply) => {
    const data = await ewannameStaffTrainerService.listAvailableWorkflows();
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------------------
  // 3. Operations Assistant (Deterministic Question-Answering)
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/partner/ai/operations/summary', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await aiOperationsAssistantService.getLiveOperationsSummary(request.session);
    return reply.send({ success: true, data });
  });

  fastify.post('/api/v1/partner/ai/operations/query', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const question = String(body.question || body.queryText || '');
    const data = await aiOperationsAssistantService.answerOperationalQuestion(request.session, question);
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------------------
  // 4. Explainable AI & Anomaly Detection
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/ai/anomalies/detect', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const data = await explainableAiAndAnomalyService.detectAndRecordAnomaly(request.session, body);
    return reply.status(201).send({ success: true, data });
  });

  fastify.post('/api/v1/partner/ai/anomalies/lab-delta-check', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const data = await explainableAiAndAnomalyService.evaluateLabDeltaCheck(request.session, body);
    return reply.send({ success: true, data, detected: !!data });
  });

  fastify.post('/api/v1/partner/ai/anomalies/pharmacy-leakage', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const data = await explainableAiAndAnomalyService.evaluatePharmacyStockDiscrepancy(request.session, body);
    return reply.send({ success: true, data, detected: !!data });
  });

  fastify.get('/api/v1/partner/ai/anomalies', { preHandler: [authenticate] }, async (request, reply) => {
    const query = (request.query as any) || {};
    const data = await explainableAiAndAnomalyService.listAnomalies(request.session, query);
    return reply.send({ success: true, data });
  });

  fastify.patch('/api/v1/partner/ai/anomalies/:id/review', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const data = await explainableAiAndAnomalyService.reviewAnomaly(request.session, id, body);
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------------------
  // 5. Demand & Resource Forecasting (Advisory Only)
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/ai/forecasts/generate', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const data = await demandForecastingService.generateForecast(request.session, body);
    return reply.status(201).send({ success: true, data });
  });

  fastify.get('/api/v1/partner/ai/forecasts', { preHandler: [authenticate] }, async (request, reply) => {
    const query = (request.query as any) || {};
    const data = await demandForecastingService.getForecastHistory(request.session, query.domain);
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------------------
  // 6. Cost & Quota Status
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/partner/ai/budget/status', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await aiCostAndBudgetController.getBudgetStatus(request.session.tenantId, 'TENANT', request.session.tenantId);
    return reply.send({ success: true, data });
  });

  // -------------------------------------------------------------------------
  // 7. AI Incident Governance & CAPA
  // -------------------------------------------------------------------------
  fastify.post('/api/v1/partner/ai/incidents', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const data = await aiIncidentAndCapaService.reportIncident(request.session, body);
    return reply.status(201).send({ success: true, data });
  });

  fastify.get('/api/v1/partner/ai/incidents', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await aiIncidentAndCapaService.listIncidents(request.session);
    return reply.send({ success: true, data });
  });

  fastify.patch('/api/v1/partner/ai/incidents/:id/rca', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const data = await aiIncidentAndCapaService.conductRca(request.session, id, body);
    return reply.send({ success: true, data });
  });

  fastify.patch('/api/v1/partner/ai/incidents/:id/capa', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const data = await aiIncidentAndCapaService.assignCapa(request.session, id, body);
    return reply.send({ success: true, data });
  });

  fastify.patch('/api/v1/partner/ai/incidents/:id/close', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = await aiIncidentAndCapaService.verifyAndClose(request.session, id);
    return reply.send({ success: true, data });
  });
};
