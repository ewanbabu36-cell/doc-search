import { type FastifyPluginAsync } from 'fastify';
import { billingManagementService } from '../../services/partner/BillingManagementService.js';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { verifyRazorpaySignature } from '@docsearch/auth';

const logger = createLogger('payment-webhook-routes');

export const paymentWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // Handler for Razorpay Webhooks
  const razorpayHandler = async (request: any, reply: any) => {
    const signature = request.headers['x-razorpay-signature'] as string | undefined;
    if (!signature) {
      throw new AppError({
        message: 'Missing x-razorpay-signature header.',
        code: ErrorCode.UNAUTHORIZED,
        statusCode: 401
      });
    }

    // Raw body buffer or string for HMAC-SHA256 signature verification
    const rawBody = request.rawBody || (typeof request.body === 'string' ? request.body : JSON.stringify(request.body));
    const webhookSecret = process.env['RAZORPAY_WEBHOOK_SECRET'] || 'rzp_test_secret_key_123';

    const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      logger.warn('Razorpay webhook signature verification failed');
      throw new AppError({
        message: 'Invalid Razorpay webhook signature.',
        code: ErrorCode.UNAUTHORIZED,
        statusCode: 401
      });
    }

    const payload = typeof request.body === 'object' && request.body !== null ? request.body : JSON.parse(rawBody);
    const event = payload?.event;

    logger.info('Processing validated Razorpay webhook', { event });

    try {
      if (event === 'payment.captured' || event === 'order.paid') {
        const result = await billingManagementService.processRazorpayWebhook(rawBody, signature, payload, webhookSecret);
        return reply.status(200).send({
          status: 'ok',
          event,
          isDuplicate: Boolean((result as any)?.isDuplicate),
          result
        });
      }

      if (event === 'payment.failed') {
        const result = await billingManagementService.processRazorpayWebhook(rawBody, signature, payload, webhookSecret);
        return reply.status(200).send({
          status: 'ok',
          event,
          result
        });
      }

      if (event === 'refund.processed') {
        const result = await billingManagementService.processRazorpayWebhook(rawBody, signature, payload, webhookSecret);
        return reply.status(200).send({
          status: 'ok',
          event,
          result
        });
      }

      // Unhandled / informational events return 200 to acknowledge webhook delivery
      logger.info('Ignoring unhandled webhook event', { event });
      return reply.status(200).send({
        status: 'ignored',
        event,
        message: `Webhook event '${event}' acknowledged but not processed.`
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Error processing Razorpay webhook settlement', err);
      throw new AppError({
        message: 'Webhook settlement failed.',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }
  };

  // Primary endpoint
  fastify.post('/api/v1/webhooks/razorpay', razorpayHandler);

  // Alias endpoints
  fastify.post('/api/v1/webhooks/payment/razorpay', razorpayHandler);
};
