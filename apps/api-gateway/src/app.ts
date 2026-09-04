import { partnerFoundationRoutes } from './routes/partner/foundation.routes.js';
import { clinicalWorkflowRoutes } from './routes/partner/clinical-workflow.routes.js';
import { labDiagnosticsRoutes } from './routes/partner/lab-diagnostics.routes.js';
import { pharmacyManagementRoutes } from './routes/partner/pharmacy-management.routes.js';
import { inpatientManagementRoutes } from './routes/partner/inpatient-management.routes.js';
import { emergencyManagementRoutes } from './routes/partner/emergency-management.routes.js';
import { otManagementRoutes } from './routes/partner/ot-management.routes.js';
import { bloodBankManagementRoutes } from './routes/partner/blood-bank-management.routes.js';
import { billingManagementRoutes } from './routes/partner/billing-management.routes.js';
import { billingWebhookRoutes } from './routes/partner/billing-webhook.routes.js';
import { mrdManagementRoutes } from './routes/partner/mrd-management.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerSecurityPlugins } from './plugins/security.js';
import { authGuardPlugin } from './plugins/auth-guard.js';
import { saveIdempotentResponse } from './plugins/idempotency.js';
import { healthRoutes } from './routes/health.js';
import { executiveRoutes } from './routes/company/executive.routes.js';
import { partnerRoutes } from './routes/company/partner.routes.js';
import { productRoutes } from './routes/company/product.routes.js';
import { subscriptionRoutes } from './routes/company/subscription.routes.js';
import { salesMarketingRoutes } from './routes/company/sales-marketing.routes.js';
import { supportRoutes } from './routes/company/support.routes.js';
import { communicationRoutes } from './routes/company/communication.routes.js';
import { analyticsRoutes } from './routes/company/analytics.routes.js';
import { aiGovernanceRoutes } from './routes/company/ai-governance.routes.js';
import { securityAdminRoutes } from './routes/company/security-admin.routes.js';
import { complianceRoutes } from './routes/company/compliance.routes.js';
import { integrationRoutes } from './routes/company/integration.routes.js';
import { platformEngineeringRoutes } from './routes/company/platform-engineering.routes.js';
import { infrastructureRoutes } from './routes/company/infrastructure.routes.js';
import { companyAdminRoutes } from './routes/company/company-admin.routes.js';
import { radiologyRoutes } from './routes/partner/radiology.routes.js';
import { dietaryRoutes } from './routes/partner/dietary.routes.js';
import { assetBiomedicalRoutes } from './routes/partner/asset-biomedical.routes.js';
import { qualityInfectionRoutes } from './routes/partner/quality-infection.routes.js';
import { procurementRoutes } from './routes/partner/procurement.routes.js';
import { abdmRoutes } from './routes/partner/abdm.routes.js';
import { aiClinicalCopilotRoutes } from './routes/partner/ai-clinical-copilot.routes.js';
import { aiFoundationRoutes } from './routes/partner/ai-foundation.routes.js';
import { aiChatRoutes } from './routes/partner/ai-chat.routes.js';
import { aiVoiceRoutes } from './routes/partner/ai-voice.routes.js';
import { hardwareBridgeRoutes } from './routes/partner/hardware-bridge.routes.js';
import { whatsappEngagementRoutes } from './routes/partner/whatsapp-engagement.routes.js';
import { executiveMisRoutes } from './routes/partner/executive-mis.routes.js';
import { documentVerificationRoutes } from './routes/compliance/document-verification.routes.js';
import { workflowRoutes } from './routes/workflow.routes.js';
import { paymentWebhookRoutes } from './routes/webhooks/payment-webhook.routes.js';
import { AppError } from '@docsearch/shared-core';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    genReqId: () => crypto.randomUUID()
  });

  // Global Error Handler
  app.setErrorHandler((error: unknown, request, reply) => {
    const requestId = request.id || 'unknown';

    const isAppErr = error instanceof AppError || (error && typeof error === 'object' && ((error as any).name === 'AppError' || (error as any).isOperational));
    if (isAppErr) {
      const appErr = error as AppError;
      return reply.status(appErr.statusCode).send({
        error: {
          code: appErr.code,
          message: appErr.message,
          requestId,
          details: appErr.details
        }
      });
    }

    if (error instanceof SyntaxError || (error && typeof error === 'object' && (error as any).name === 'SyntaxError')) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Malformed JSON payload syntax',
          requestId
        }
      });
    }

    const err = error as { statusCode?: number; code?: string; message?: string; details?: unknown[] };
    if (err.statusCode && (err.statusCode < 500 || err.statusCode === 503 || err.statusCode === 502 || err.statusCode === 504)) {
      return reply.status(err.statusCode).send({
        error: {
          code: err.code || (err.statusCode === 503 ? 'SERVICE_UNAVAILABLE' : 'BAD_REQUEST'),
          message: err.message || 'Request failed',
          requestId,
          details: err.details
        }
      });
    }

    // Sanitize 500 internal errors
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred',
        requestId
      }
    });
  });

  // 1. Register Core Security (Helmet, CORS, Rate Limit)
  await registerSecurityPlugins(app);

  // Preserve raw request body for webhook cryptographic signature verification (HMAC-SHA256 / SHA-512)
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    try {
      const raw = (body as Buffer).toString('utf8');
      const json = raw ? JSON.parse(raw) : {};
      (req as any).rawBody = raw;
      done(null, json);
    } catch (err: any) {
      done(err, undefined);
    }
  });

  app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (req, body, done) => {
    try {
      const parsed = Object.fromEntries(new URLSearchParams(body as string));
      (req as any).rawBody = body;
      done(null, parsed);
    } catch (err: any) {
      done(err, undefined);
    }
  });

  // Global Idempotency onSend Hook: Caches successful responses under tenant-isolated cache key
  app.addHook('onSend', async (request, reply, payload: unknown) => {
    const cacheKey = (request as any).idempotencyCacheKey as string | undefined;
    if (!cacheKey || reply.getHeader('x-cache') === 'IDEMPOTENT_HIT') return payload;

    if (reply.statusCode >= 200 && reply.statusCode < 400 && typeof payload === 'string') {
      const ctHeader = reply.getHeader('content-type');
      saveIdempotentResponse(cacheKey, {
        statusCode: reply.statusCode,
        payload,
        contentType: typeof ctHeader === 'string' ? ctHeader : undefined,
        createdAt: Date.now()
      });
    }

    return payload;
  });

  // 2. Register Auth Guard Plugin (JWT verification & session context)
  await app.register(authGuardPlugin);

  // 3. Register Health & Readiness Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);

  // 4. Register All 15 Wave 3 Company Platform Domain Routes
  await app.register(executiveRoutes);
  await app.register(partnerRoutes);
  await app.register(partnerFoundationRoutes);
  await app.register(clinicalWorkflowRoutes);
  await app.register(labDiagnosticsRoutes);
  await app.register(pharmacyManagementRoutes);
  await app.register(inpatientManagementRoutes);
  await app.register(emergencyManagementRoutes);
  await app.register(otManagementRoutes);
  await app.register(bloodBankManagementRoutes);
  await app.register(billingManagementRoutes);
  await app.register(billingWebhookRoutes);
  await app.register(paymentWebhookRoutes);
  await app.register(mrdManagementRoutes);
  await app.register(productRoutes);
  await app.register(subscriptionRoutes);
  await app.register(salesMarketingRoutes);
  await app.register(supportRoutes);
  await app.register(communicationRoutes);
  await app.register(analyticsRoutes);
  await app.register(aiGovernanceRoutes);
  await app.register(securityAdminRoutes);
  await app.register(complianceRoutes);
  await app.register(integrationRoutes);
  await app.register(platformEngineeringRoutes);
  await app.register(infrastructureRoutes);
  await app.register(companyAdminRoutes);

  // 5. Register Partner Platform Domain Routes (Radiology 2.17 & Dietary 2.18)
  await app.register(radiologyRoutes);
  await app.register(dietaryRoutes);
  await app.register(assetBiomedicalRoutes);
  await app.register(qualityInfectionRoutes);
  await app.register(procurementRoutes);
  await app.register(abdmRoutes);
  await app.register(aiClinicalCopilotRoutes);
  await app.register(aiFoundationRoutes);
  await app.register(aiChatRoutes);
  await app.register(aiVoiceRoutes);
  await app.register(hardwareBridgeRoutes);
  await app.register(whatsappEngagementRoutes);
  await app.register(executiveMisRoutes);
  await app.register(documentVerificationRoutes, { prefix: '/api/v1/compliance/documents' });
  await app.register(workflowRoutes, { prefix: '/api/v1/workflow' });

  return app;
}
