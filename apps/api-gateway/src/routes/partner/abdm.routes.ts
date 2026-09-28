import type { FastifyPluginAsync } from 'fastify';
import { AbdmGatewayService } from '../../services/partner/AbdmGatewayService.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';

const service = new AbdmGatewayService();

export const abdmRoutes: FastifyPluginAsync = async (app) => {
  const commercialGuard = requireModuleCommercialAccess('ABDM_GATEWAY');
  app.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/api/v1/abdm/callback/')) {
      return;
    }
    return commercialGuard(request, reply);
  });

  // --------------------------------------------------------------------------
  // Overview & Bridge Telemetry
  // --------------------------------------------------------------------------
  app.get(
    '/api/v1/partner/abdm/overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getOverviewMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // --------------------------------------------------------------------------
  // Milestone 1: ABHA Registration & Verification
  // --------------------------------------------------------------------------
  app.post(
    '/api/v1/partner/abdm/m1/generate-aadhaar-otp',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.generateAadhaarOtp(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m1/verify-aadhaar-otp',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.verifyAadhaarOtp(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m1/generate-mobile-otp',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.generateMobileOtp(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m1/verify-mobile-otp',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.verifyMobileOtp(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m1/verify-demographics',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.verifyDemographics(tenantId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m1/search-by-health-id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { abhaAddress } = (request.body || {}) as { abhaAddress: string };
      const data = await service.searchByHealthId(tenantId, abhaAddress);
      return reply.send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/abdm/m1/abha-accounts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAbhaAccounts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // --------------------------------------------------------------------------
  // Milestone 2: HIP Care Contexts & Scan and Share
  // --------------------------------------------------------------------------
  app.get(
    '/api/v1/partner/abdm/m2/care-contexts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getCareContexts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m2/care-contexts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.linkCareContext(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m2/care-contexts/discover',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { patientAbhaAddress } = (request.body || {}) as { patientAbhaAddress: string };
      const data = await service.discoverCareContexts(tenantId, patientAbhaAddress);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m2/care-contexts/link/init',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.initCareContextLinking(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m2/care-contexts/link/confirm',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.confirmCareContextLinking(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/abdm/m2/scan-and-share/tokens',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getScanAndShareTokens(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m2/scan-and-share',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.processScanAndShare(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // --------------------------------------------------------------------------
  // Milestone 3: Consents & FHIR R4 Bundles
  // --------------------------------------------------------------------------
  app.get(
    '/api/v1/partner/abdm/m3/consent-requests',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getConsentArtefacts(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m3/consent-requests',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.createConsentRequest(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m3/consents/revoke',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const { artefactId } = (request.body || {}) as { artefactId: string };
      const data = await service.revokeConsent(tenantId, branchId || 'branch_default', userId, artefactId);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.get(
    '/api/v1/partner/abdm/m3/fhir-bundles',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getFhirBundles(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m3/fhir-bundles/generate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.generateFhirBundle(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m3/health-information/request',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.requestHealthInformationTransfer(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m3/health-information/encrypt-payload',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { receiverPublicKeyPem, plainTextPayload } = (request.body || {}) as {
        receiverPublicKeyPem: string;
        plainTextPayload: string | Record<string, unknown>;
      };
      const data = service.encryptHealthPayload(receiverPublicKeyPem, plainTextPayload);
      return reply.status(200).send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/abdm/m3/health-information/decrypt-payload',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { privateKeyPem, senderPublicKeyPem, encryptedData, iv, authTag } = (request.body || {}) as {
        privateKeyPem: string;
        senderPublicKeyPem: string;
        encryptedData: string;
        iv: string;
        authTag: string;
      };
      const data = service.decryptHealthPayload(privateKeyPem, senderPublicKeyPem, encryptedData, iv, authTag);
      return reply.status(200).send({ success: true, data });
    }
  );

  // --------------------------------------------------------------------------
  // Audit Trail
  // --------------------------------------------------------------------------
  app.get(
    '/api/v1/partner/abdm/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // --------------------------------------------------------------------------
  // NHA Gateway Callback Handlers (Public NHA Endpoint Bridge)
  // --------------------------------------------------------------------------
  app.post(
    '/api/v1/abdm/callback/v0.5/care-contexts/on-discover',
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.handleNhaCallback('ON_DISCOVER_CALLBACK', payload);
      return reply.status(200).send(data);
    }
  );

  app.post(
    '/api/v1/abdm/callback/v0.5/consents/hip/on-notify',
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;
      const data = await service.handleNhaCallback('ON_NOTIFY_CONSENT_CALLBACK', payload);
      return reply.status(200).send(data);
    }
  );
};
