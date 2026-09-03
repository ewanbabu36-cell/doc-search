import { type FastifyPluginAsync } from 'fastify';
import { billingManagementService } from '../../services/partner/BillingManagementService.js';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('billing-webhook-routes');

export const billingWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Razorpay Webhook Ingestion
  fastify.post(
    '/api/v1/partner/billing/webhooks/razorpay',
    async (request, reply) => {
      const signature = request.headers['x-razorpay-signature'] as string | undefined;
      if (!signature) {
        throw new AppError({
          message: 'Missing x-razorpay-signature header.',
          code: ErrorCode.UNAUTHORIZED,
          statusCode: 401
        });
      }

      // Raw body stored by custom content-type parser or reconstructed string
      const rawBody = (request as any).rawBody || (typeof request.body === 'string' ? request.body : JSON.stringify(request.body));
      const payload = typeof request.body === 'object' && request.body !== null ? request.body : JSON.parse(rawBody);

      try {
        const result = await billingManagementService.processRazorpayWebhook(rawBody, signature, payload);
        return reply.status(200).send({
          status: 'ok',
          event: (payload as any)?.event,
          result
        });
      } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error('Error processing Razorpay webhook', err);
        throw new AppError({
          message: 'Webhook processing failed',
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500
        });
      }
    }
  );

  // 2. PayU Webhook Ingestion
  fastify.post(
    '/api/v1/partner/billing/webhooks/payu',
    async (request, reply) => {
      const payload = (request.body || {}) as Record<string, unknown>;

      if (!payload['hash']) {
        throw new AppError({
          message: 'Missing hash in PayU webhook payload.',
          code: ErrorCode.UNAUTHORIZED,
          statusCode: 401
        });
      }

      try {
        const result = await billingManagementService.processPayUWebhook(payload);
        return reply.status(200).send({
          status: 'ok',
          result
        });
      } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error('Error processing PayU webhook', err);
        throw new AppError({
          message: 'Webhook processing failed',
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500
        });
      }
    }
  );
};
