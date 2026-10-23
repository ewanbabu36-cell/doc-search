/**
 * DocSearch Notification Delivery & DLT Webhook Routes
 * ----------------------------------------------------
 * Receives Inbound DLRs (Delivery Receipts) from:
 * - Gupshup Enterprise DLT
 * - MSG91 DLT Webhooks
 * - Twilio Message Status Callbacks
 * - Meta WhatsApp Cloud API v18 Webhooks
 */

import { type FastifyPluginAsync } from 'fastify';
import {
  notificationDispatchService,
  type NotificationProvider
} from '../../services/notification-dispatch.service.js';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('notification-webhook-routes');

export const notificationWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Inbound Delivery Status Callback for all supported providers
  fastify.post('/api/v1/webhooks/notifications/:provider', async (request: any, reply: any) => {
    const rawProvider = (request.params?.provider || '').toUpperCase();
    let provider: NotificationProvider = 'LOCAL_MOCK_FALLBACK';

    if (rawProvider.includes('GUPSHUP')) provider = 'GUPSHUP_DLT';
    else if (rawProvider.includes('MSG91')) provider = 'MSG91_DLT';
    else if (rawProvider.includes('TWILIO')) provider = 'TWILIO';
    else if (rawProvider.includes('META')) provider = 'META_WHATSAPP';

    const payload = request.body || {};
    logger.info('Received notification delivery webhook', { provider, payload });

    const status = notificationDispatchService.processDeliveryWebhook(provider, payload);

    return reply.status(200).send({
      success: true,
      provider,
      status: status.status,
      messageId: status.messageId,
      timestamp: status.timestamp
    });
  });

  // 2. Dispatch Trigger API Endpoint
  fastify.post('/api/v1/notifications/dispatch', async (request: any, reply: any) => {
    const { recipientPhone, channel, templateId, params, preferredProvider } = request.body || {};

    if (!recipientPhone || !channel || !templateId) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required parameters: recipientPhone, channel, templateId'
      });
    }

    try {
      const result = await notificationDispatchService.dispatch({
        recipientPhone,
        channel,
        templateId,
        params: params || {},
        preferredProvider
      });

      return reply.status(result.success ? 200 : 500).send(result);
    } catch (err: any) {
      logger.error('Failed to dispatch notification', { error: err.message });
      return reply.status(500).send({
        success: false,
        error: err.message
      });
    }
  });
};
