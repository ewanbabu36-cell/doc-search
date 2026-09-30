import { type FastifyPluginAsync } from 'fastify';
import { partnerAccountService } from '../../services/partner/PartnerAccountService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const partnerAccountRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/partner/account/plan-and-features
   * Authoritative read endpoint for the authenticated partner's
   * organization profile, current plan, subscription status, validity,
   * feature entitlement matrix (available vs locked), and usage limits.
   * 
   * Strict server-side scoping to authenticated session's tenantId.
   * No client-supplied partnerId or tenantId parameter is accepted (Zero IDOR).
   */
  fastify.get(
    '/api/v1/partner/account/plan-and-features',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.getPlanAndFeatures(request.session);
      return { success: true, data };
    }
  );

  /**
   * GET /api/v1/partner/account/profile
   * GET /api/v1/partner/profile
   * Authoritative read endpoints for partner profile details and verification status.
   * Strictly guaranteed: Never blocked by commercial license, expired subscription, or feature gates.
   */
  fastify.get(
    '/api/v1/partner/account/profile',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.getPlanAndFeatures(request.session);
      return { success: true, data: data.organizationProfile, fullAccount: data };
    }
  );

  fastify.get(
    '/api/v1/partner/profile',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.getPlanAndFeatures(request.session);
      return { success: true, data: data.organizationProfile, fullAccount: data };
    }
  );

  /**
   * PUT /api/v1/partner/account/profile
   * PUT /api/v1/partner/profile
   * Updates partner profile statutory fields, address, and marks profile as completed.
   */
  fastify.put(
    '/api/v1/partner/account/profile',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.updateProfile(request.session, request.body as any);
      return { success: true, data };
    }
  );

  fastify.put(
    '/api/v1/partner/profile',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.updateProfile(request.session, request.body as any);
      return { success: true, data };
    }
  );

  fastify.patch(
    '/api/v1/partner/account/profile',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.updateProfile(request.session, request.body as any);
      return { success: true, data };
    }
  );

  fastify.patch(
    '/api/v1/partner/profile',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.updateProfile(request.session, request.body as any);
      return { success: true, data };
    }
  );

  /**
   * GET /api/v1/partner/account/preferences
   * GET /api/v1/partner/preferences
   * Retrieves partner/user UI preferences (themePreference, display modes, etc.)
   */
  fastify.get(
    '/api/v1/partner/account/preferences',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.getPreferences(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/preferences',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.getPreferences(request.session);
      return { success: true, data };
    }
  );

  /**
   * PATCH /api/v1/partner/account/preferences
   * PUT /api/v1/partner/account/preferences
   * Persists partner/user UI preferences (themePreference, etc.) to PostgreSQL
   */
  fastify.patch(
    '/api/v1/partner/account/preferences',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.updatePreferences(request.session, request.body as any);
      return { success: true, data };
    }
  );

  fastify.put(
    '/api/v1/partner/account/preferences',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.updatePreferences(request.session, request.body as any);
      return { success: true, data };
    }
  );

  fastify.patch(
    '/api/v1/partner/preferences',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const data = await partnerAccountService.updatePreferences(request.session, request.body as any);
      return { success: true, data };
    }
  );

  /**
   * GET /api/v1/partner/account/renewal-status
   * Authoritative commercial lifecycle & locked-account recovery status.
   */
  fastify.get(
    '/api/v1/partner/account/renewal-status',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const { ewanAssistantService } = await import('../../services/ai/EwanAssistantService.js');
      const data = await ewanAssistantService.getPartnerEwanContext(request.session);
      return { success: true, data };
    }
  );

  /**
   * POST /api/v1/partner/account/renewal/initiate-order
   * Initiates a deterministic renewal order from HQ-configured plans & price_versions.
   */
  fastify.post(
    '/api/v1/partner/account/renewal/initiate-order',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { ewanAssistantService } = await import('../../services/ai/EwanAssistantService.js');
      const data = await ewanAssistantService.initiateRenewalOrder(request.session, (request.body as any) || {});
      return reply.status(201).send({ success: true, data });
    }
  );

  /**
   * POST /api/v1/partner/account/renewal/verify-payment
   * Verifies cryptographic payment signature, enforces idempotency, extends license,
   * recalculates entitlements, and unlocks the partner account.
   */
  fastify.post(
    '/api/v1/partner/account/renewal/verify-payment',
    {
      preHandler: [authenticate]
    },
    async (request) => {
      const { ewanAssistantService } = await import('../../services/ai/EwanAssistantService.js');
      const data = await ewanAssistantService.verifyAndSettleRenewalPayment(request.session, (request.body as any) || {});
      return { success: true, data };
    }
  );
};
