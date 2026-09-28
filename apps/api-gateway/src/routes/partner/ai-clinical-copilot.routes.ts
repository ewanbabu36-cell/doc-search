import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { AiClinicalCopilotService } from '../../services/partner/AiClinicalCopilotService.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireFeatureEntitlement } from '../../plugins/commercial-guard.js';
import { RBACEvaluator } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';

const service = new AiClinicalCopilotService();

const CLINICIAN_ROLES = [
  'DOCTOR',
  'CLINIC_DOCTOR',
  'ATTENDING_PHYSICIAN',
  'ATTENDING_DOCTOR',
  'PHYSICIAN',
  'CONSULTANT',
  'CONSULTANT_PHYSICIAN',
  'SURGEON',
  'CARDIOLOGIST',
  'CARDIOLOGY_HOD',
  'PEDIATRICIAN',
  'GYNECOLOGIST',
  'ORTHOPEDIC_SURGEON',
  'NEPHROLOGIST',
  'ONCOLOGIST',
  'NEUROLOGIST',
  'OPHTHALMOLOGIST',
  'DENTIST',
  'AYURVEDIC_VAIDYA',
  'PULMONOLOGIST',
  'PSYCHIATRIST',
  'DERMATOLOGIST',
  'EMERGENCY_PHYSICIAN',
  'CHIEF_MEDICAL_OFFICER',
  'CLINICAL_DIRECTOR',
  'HOSPITAL_DIRECTOR',
  'SUPER_ADMIN'
];

function requireClinicianOrPermission(permission: string) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const session = request.session;
    if (!session) {
      throw AppError.unauthorized('Authentication required');
    }
    if (session.isSuperAdmin) {
      return;
    }
    const hasRole = session.roles?.some((r) => CLINICIAN_ROLES.includes(r));
    const hasPerm = RBACEvaluator.hasPermission(session, permission);
    if (!hasRole && !hasPerm) {
      throw new AppError({
        message: `Clinical safety violation: Only licensed medical practitioners with ${permission} permission may perform this clinical mutation.`,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  };
}

export const aiClinicalCopilotRoutes: FastifyPluginAsync = async (app) => {
  const copilotGuard = [authenticate, requireFeatureEntitlement('MODULE_AI_COPILOT')];

  // 1. Overview & Metrics
  app.get(
    '/api/v1/partner/ai-copilot/overview',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getOverviewMetrics(request.session);
      return reply.send({ success: true, data });
    }
  );

  // 2. Ambient AI Scribe & SOAP Generation (Strict Clinician Role Enforced)
  app.post(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap',
    { preHandler: [...copilotGuard, requireClinicianOrPermission('ai_copilot:soap:generate')] },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.generateSoapNoteFromTranscript(request.session, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap',
    { preHandler: [...copilotGuard, requireClinicianOrPermission('ai_copilot:soap:read')] },
    async (request, reply) => {
      const data = await service.getSoapNotes(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/ambient-scribe/soap/:id/approve',
    { preHandler: [...copilotGuard, requireClinicianOrPermission('ai_copilot:soap:approve')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await service.approveSoapNote(request.session, id);
      return reply.send({ success: true, data });
    }
  );

  // 3. Sepsis NEWS2 Alerts & Care Bundle
  app.post(
    '/api/v1/partner/ai-copilot/sepsis/evaluate',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.evaluateSepsisRisk(request.session, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/sepsis/alerts',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getSepsisAlerts(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/sepsis/alerts/:id/acknowledge',
    { preHandler: [...copilotGuard, requireClinicianOrPermission('ai_copilot:sepsis:ack')] },
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
    { preHandler: copilotGuard },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.evaluateDdi(request.session, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/ddi',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getDdiChecks(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/ai-copilot/ddi/override',
    { preHandler: [...copilotGuard, requireClinicianOrPermission('ai_copilot:ddi:override')] },
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
    { preHandler: copilotGuard },
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.reportPanicValue(request.session, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/panic-values',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getPanicAlerts(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/ai-copilot/panic-values/:id/acknowledge',
    { preHandler: [...copilotGuard, requireClinicianOrPermission('ai_copilot:panic:ack')] },
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
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getAuditTraces(request.session);
      return reply.send({ success: true, data });
    }
  );

  // 7. Route Aliases & Resilience for Partner Platform
  app.get(
    '/api/v1/partner/ai-copilot/ambient/transcripts',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getSoapNotes(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/ddi/assessments',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getDdiChecks(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/panic/alerts',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getPanicAlerts(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/audit/traces',
    { preHandler: copilotGuard },
    async (request, reply) => {
      const data = await service.getAuditTraces(request.session);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/ai-copilot/renal/adjustments',
    { preHandler: copilotGuard },
    async (_request, reply) => {
      return reply.send({ success: true, data: [] });
    }
  );
};

