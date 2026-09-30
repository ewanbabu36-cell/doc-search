import { partnerFoundationRoutes } from './routes/partner/foundation.routes.js';
import { clinicalWorkflowRoutes } from './routes/partner/clinical-workflow.routes.js';
import { granularSyncRoutes } from './routes/partner/granular-sync.routes.js';
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
import { authGuardPlugin, authenticate } from './plugins/auth-guard.js';
import { requireActiveCommercialAccess } from './plugins/commercial-guard.js';
import { saveIdempotentResponse, failIdempotentRequest, type InFlightIdempotencyContext } from './plugins/idempotency.js';
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
import { founderApprovalRoutes } from './routes/company/founder-approval.routes.js';
import { partnerAccessControlRoutes } from './routes/company/partner-access-control.routes.js';
import { hqCommandCenterRoutes } from './routes/company/hq-command-center.routes.js';
import { partnerCommandCenterRoutes } from './routes/partner/command-center.routes.js';
import { radiologyRoutes } from './routes/partner/radiology.routes.js';
import { dietaryRoutes } from './routes/partner/dietary.routes.js';
import { assetBiomedicalRoutes } from './routes/partner/asset-biomedical.routes.js';
import { qualityInfectionRoutes } from './routes/partner/quality-infection.routes.js';
import { procurementRoutes } from './routes/partner/procurement.routes.js';
import { supplyChainRoutes } from './routes/partner/supply-chain.routes.js';
import { abdmRoutes } from './routes/partner/abdm.routes.js';
import { aiClinicalCopilotRoutes } from './routes/partner/ai-clinical-copilot.routes.js';
import { aiFoundationRoutes } from './routes/partner/ai-foundation.routes.js';
import { aiChatRoutes } from './routes/partner/ai-chat.routes.js';
import { aiVoiceRoutes } from './routes/partner/ai-voice.routes.js';
import { hardwareBridgeRoutes } from './routes/partner/hardware-bridge.routes.js';
import { whatsappEngagementRoutes } from './routes/partner/whatsapp-engagement.routes.js';
import { executiveMisRoutes } from './routes/partner/executive-mis.routes.js';
import { staffAdministrationRoutes } from './routes/partner/staff-administration.routes.js';
import { partnerAccountRoutes } from './routes/partner/account.routes.js';
import { partnerConfigurationRoutes } from './routes/partner/partner-configuration.routes.js';
import { identitySecurityFoundationRoutes } from './routes/security/identity-security-foundation.routes.js';
import { universalWorkflowRoutes } from './routes/partner/universal-workflow.routes.js';
import { patient360ContinuityRoutes } from './routes/partner/patient-360-continuity.routes.js';
import { rosterRoutes } from './routes/partner/roster.routes.js';
import { documentVerificationRoutes } from './routes/compliance/document-verification.routes.js';
import { workflowRoutes } from './routes/workflow.routes.js';
import { businessHistoryRoutes } from './routes/partner/business-history.routes.js';
import { paymentWebhookRoutes } from './routes/webhooks/payment-webhook.routes.js';
import { licenseGovernanceRoutes } from './routes/company/license-governance.routes.js';
import { commercialRoutes } from './routes/company/commercial.routes.js';
import { partnerReliabilityRoutes } from './routes/partner/reliability.routes.js';
import { hqReliabilityRoutes } from './routes/company/reliability-hq.routes.js';
import { hqAiIntelligenceRoutes } from './routes/company/ai-intelligence-hq.routes.js';
import { partnerAiIntelligenceRoutes } from './routes/partner/ai-intelligence.routes.js';
import { ewanRoutes } from './routes/ewan.routes.js';
import { publicKioskRoutes } from './routes/partner/public-kiosk.routes.js';
import { catalogSyncRoutes } from './routes/partner/catalog-sync.routes.js';
import { AppError } from '@docsearch/shared-core';
import { ensureDatabaseReady, setTestDatabase } from '@docsearch/database';

export interface BuildAppOptions {
  db?: any;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  if (options.db) {
    const dbToSet = (options.db && typeof options.db === 'object' && 'db' in options.db) ? options.db.db : options.db;
    setTestDatabase(dbToSet);
  } else {
    try {
      await ensureDatabaseReady();
    } catch {
      // Non-fatal warning if in test/mock environment
    }
  }

  const app = Fastify({
    logger: false,
    bodyLimit: 1048576, // 1MB payload ceiling for DoS / resource exhaustion protection
    genReqId: () => crypto.randomUUID()
  });

  // Fastify 5 validator compiler configuration to eliminate schema compilation warnings
  app.setValidatorCompiler(({ schema }: { schema: any }) => {
    return (data: any) => {
      if (typeof (schema as any)?.safeParse === 'function') {
        const result = (schema as any).safeParse(data);
        if (!result.success) {
          return { error: result.error };
        }
        return { value: result.data };
      }
      return { value: data };
    };
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

    if (err.statusCode === 429) {
      const retryAfter = reply.getHeader('retry-after');
      return reply.status(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        retryAfter: retryAfter ? Number(retryAfter) : undefined,
        requestId,
        details: err.details
      });
    }

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

    // Sanitize 500 internal errors (Zero internal leakage in production)
    console.error('[FASTIFY_500_ERROR]', { requestId, error });
    const isProd = process.env['NODE_ENV'] === 'production';
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: isProd ? 'An internal server error occurred' : ((error as any)?.message || 'An internal server error occurred'),
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

  // Global Idempotency onSend Hook: Caches successful responses under tenant-isolated PostgreSQL store
  app.addHook('onSend', async (request, reply, payload: unknown) => {
    const ctx = (request as any).idempotencyContext as InFlightIdempotencyContext | undefined;
    if (!ctx || reply.getHeader('x-cache') === 'IDEMPOTENT_HIT') return payload;

    if (reply.statusCode >= 200 && reply.statusCode < 400 && typeof payload === 'string') {
      const ctHeader = reply.getHeader('content-type');
      await saveIdempotentResponse(ctx.tenantId, ctx.key, {
        statusCode: reply.statusCode,
        payload,
        contentType: typeof ctHeader === 'string' ? ctHeader : undefined,
        requestHash: ctx.requestHash
      });
    }

    return payload;
  });

  // Idempotency onError Hook: Cleans up in-flight lease if request crashes with unhandled error
  app.addHook('onError', async (request, _reply, _error) => {
    const ctx = (request as any).idempotencyContext as InFlightIdempotencyContext | undefined;
    if (ctx) {
      await failIdempotentRequest(ctx.tenantId, ctx.key);
    }
  });

  // 2. Register Auth Guard Plugin (JWT verification & session context)
  await app.register(authGuardPlugin);

  // Enforce Commercial Subscription & License verification on all authenticated partner routes
  // Partner profile & account plan overview remain accessible under all license states so partners can view/update KYC & renew plans
  app.addHook('onRoute', (routeOptions) => {
    const isGetMethod =
      routeOptions.method === 'GET' ||
      (Array.isArray(routeOptions.method) && routeOptions.method.includes('GET'));
    const isReadOnlyConfigDiagnostic =
      isGetMethod &&
      (routeOptions.url === '/api/v1/partner/configuration' ||
        routeOptions.url === '/api/v1/partner/configuration/validation');

    if (
      !routeOptions.url ||
      !routeOptions.url.startsWith('/api/v1/partner/') ||
      routeOptions.url.startsWith('/api/v1/partner/account/') ||
      routeOptions.url === '/api/v1/partner/profile' ||
      routeOptions.url.startsWith('/api/v1/partner/ewan') ||
      routeOptions.url.startsWith('/api/v1/partner/ai/trainer') ||
      isReadOnlyConfigDiagnostic
    ) {
      return;
    }

    let preHandlers: any[] = [];
    if (Array.isArray(routeOptions.preHandler)) {
      preHandlers = routeOptions.preHandler;
    } else if (typeof routeOptions.preHandler === 'function') {
      preHandlers = [routeOptions.preHandler];
    } else {
      return;
    }

    // Only apply to routes that require authentication
    const authIdx = preHandlers.indexOf(authenticate);
    if (authIdx === -1) {
      return;
    }

    // Prevent duplicate commercial guards and insert right after authenticate
    const hasCommercial = preHandlers.some(
      (fn) => fn === requireActiveCommercialAccess || fn?.name === 'requireActiveCommercialAccess'
    );
    if (!hasCommercial) {
      preHandlers.splice(authIdx + 1, 0, requireActiveCommercialAccess);
      routeOptions.preHandler = preHandlers;
    }
  });

  // 3. Register Health & Readiness Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);

  // 4. Register All 15 Wave 3 Company Platform Domain Routes
  await app.register(executiveRoutes);
  await app.register(partnerRoutes);
  await app.register(partnerFoundationRoutes);
  await app.register(clinicalWorkflowRoutes);
  await app.register(granularSyncRoutes);
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
  await app.register(commercialRoutes);
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
  await app.register(founderApprovalRoutes);
  await app.register(partnerAccessControlRoutes);
  await app.register(licenseGovernanceRoutes);
  await app.register(hqCommandCenterRoutes);
  await app.register(hqReliabilityRoutes);
  await app.register(hqAiIntelligenceRoutes);

  // 5. Register Partner Platform Domain Routes (Radiology 2.17 & Dietary 2.18)
  await app.register(partnerCommandCenterRoutes);
  await app.register(partnerReliabilityRoutes);
  await app.register(partnerAiIntelligenceRoutes);
  await app.register(ewanRoutes);
  await app.register(radiologyRoutes);
  await app.register(dietaryRoutes);
  await app.register(assetBiomedicalRoutes);
  await app.register(qualityInfectionRoutes);
  await app.register(procurementRoutes);
  await app.register(supplyChainRoutes);
  await app.register(abdmRoutes);
  await app.register(aiClinicalCopilotRoutes);
  await app.register(aiFoundationRoutes);
  await app.register(aiChatRoutes);
  await app.register(aiVoiceRoutes);
  await app.register(hardwareBridgeRoutes);
  await app.register(whatsappEngagementRoutes);
  await app.register(executiveMisRoutes);
  await app.register(staffAdministrationRoutes);
  await app.register(partnerAccountRoutes);
  await app.register(partnerConfigurationRoutes);
  await app.register(identitySecurityFoundationRoutes);
  await app.register(universalWorkflowRoutes);
  await app.register(patient360ContinuityRoutes);
  await app.register(rosterRoutes);
  await app.register(documentVerificationRoutes, { prefix: '/api/v1/compliance/documents' });
  await app.register(workflowRoutes, { prefix: '/api/v1/workflow' });
  await app.register(businessHistoryRoutes);
  await app.register(publicKioskRoutes);
  await app.register(catalogSyncRoutes);

  // Block any direct guessed physical storage URL access (/storage/*)
  app.get('/storage/*', async (_request, reply) => {
    return reply.status(403).send({
      error: {
        code: 'FORBIDDEN',
        message: 'Direct storage URL access is forbidden. Use authenticated /api/v1/compliance/documents/:id/download.'
      }
    });
  });

  return app;
}
