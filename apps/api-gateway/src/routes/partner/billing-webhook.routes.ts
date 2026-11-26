import { type FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import { billingManagementService } from '../../services/partner/BillingManagementService.js';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { env } from '../../config/env.js';

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

  // 3. Dynamic UPI Soundbox Instant Ingestion Webhook (Paytm, PhonePe, Razorpay POS - 🛡️ Secret Token Verified)
  fastify.post(
    '/api/v1/partner/billing/webhooks/upi-soundbox',
    async (request, reply) => {
      const soundboxSecretHeader = String(
        request.headers['x-soundbox-secret'] ||
        request.headers['x-soundbox-signature'] ||
        request.headers['x-api-key'] ||
        ''
      );
      const expectedSecret = process.env['UPI_SOUNDBOX_WEBHOOK_SECRET'] || env.UPI_SOUNDBOX_WEBHOOK_SECRET;
      if (!expectedSecret || expectedSecret === 'docsearch_soundbox_secret_default') {
        throw new AppError({
          message: 'UPI Soundbox webhook is disabled until a dedicated UPI_SOUNDBOX_WEBHOOK_SECRET is configured.',
          code: ErrorCode.SERVICE_UNAVAILABLE,
          statusCode: 503
        });
      }
      const receivedHash = crypto.createHash('sha256').update(soundboxSecretHeader).digest();
      const expectedHash = crypto.createHash('sha256').update(expectedSecret).digest();
      if (!soundboxSecretHeader || !crypto.timingSafeEqual(receivedHash, expectedHash)) {
        throw new AppError({
          message: 'Unauthorized Soundbox webhook: Missing or invalid secret key header.',
          code: ErrorCode.UNAUTHORIZED,
          statusCode: 401
        });
      }

      const payload = (request.body || {}) as Record<string, unknown>;

      const txnRef = String(payload['txnRef'] || payload['transactionReference'] || payload['orderId'] || '');
      const amount = Number(payload['amount'] || payload['paymentAmount'] || 0);
      const status = String(payload['status'] || payload['paymentStatus'] || 'SUCCESS').toUpperCase() === 'SUCCESS' ? 'SUCCESS' : 'FAILURE';
      const payerVpa = payload['payerVpa'] ? String(payload['payerVpa']) : undefined;
      const soundboxDeviceId = payload['deviceId'] || payload['soundboxDeviceId'] ? String(payload['deviceId'] || payload['soundboxDeviceId']) : undefined;

      if (!txnRef) {
        throw new AppError({
          message: 'Missing txnRef in UPI soundbox webhook payload.',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }

      try {
        const result = await billingManagementService.processSoundboxWebhook({
          txnRef,
          amount,
          status,
          payerVpa,
          soundboxDeviceId
        });

        return reply.status(200).send({
          status: 'ok',
          result
        });
      } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error('Error processing UPI Soundbox webhook', err);
        throw new AppError({
          message: 'UPI Soundbox webhook processing failed',
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500
        });
      }
    }
  );
};
