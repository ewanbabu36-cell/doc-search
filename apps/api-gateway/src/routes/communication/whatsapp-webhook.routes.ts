import { type FastifyPluginAsync } from 'fastify';
import { whatsAppCloudApiService } from '../../services/communication/WhatsAppCloudApiService.js';
import { createLogger } from '@docsearch/shared-core';
import { authenticate } from '../../plugins/auth-guard.js';

const logger = createLogger('whatsapp-webhook-routes');

export const whatsappWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Meta Webhook Subscription Verification (GET)
  fastify.get('/api/v1/communication/whatsapp/webhook', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'] || '';

    if (!mode || !token) {
      reply.status(400);
      return { error: 'Missing hub.mode or hub.verify_token' };
    }

    const verifiedChallenge = whatsAppCloudApiService.verifyWebhookChallenge(mode, token, challenge);
    if (verifiedChallenge) {
      reply.status(200).send(verifiedChallenge);
      return;
    }

    reply.status(403);
    return { error: 'Webhook verification token mismatch' };
  });

  // 2. Inbound Interactive WhatsApp Messages (POST)
  fastify.post('/api/v1/communication/whatsapp/webhook', async (request, reply) => {
    const signature = request.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = (request as any).rawBody || JSON.stringify(request.body);

    const isValid = whatsAppCloudApiService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      reply.status(401);
      return { success: false, error: 'Invalid WhatsApp Webhook HMAC signature' };
    }

    const parsed = whatsAppCloudApiService.parseInboundMessage(request.body);
    if (!parsed) {
      return { success: true, status: 'EVENT_ACKNOWLEDGED' };
    }

    logger.info(`Received WhatsApp interaction from ${parsed.fromPhone}: ${parsed.interactionType} [Text: ${parsed.rawText || ''}]`);

    // Handle 1 (Confirm) / 2 (Reschedule)
    let actionResult = 'ACK';
    if (parsed.interactionType === 'CONFIRM') {
      actionResult = 'APPOINTMENT_CONFIRMED';
    } else if (parsed.interactionType === 'RESCHEDULE') {
      actionResult = 'RESCHEDULE_LINK_DISPATCHED';
    }

    return {
      success: true,
      interaction: parsed,
      resolution: actionResult
    };
  });

  // 3. Automated PDF "Meri Parchi" Media Transmission (POST)
  fastify.post('/api/v1/communication/whatsapp/send-parchi', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as any) || {};
    const { toPhone, base64Pdf, fileName, caption } = body;

    if (!toPhone || !base64Pdf) {
      reply.status(400);
      return { success: false, error: 'toPhone and base64Pdf are required.' };
    }

    const pdfBuffer = Buffer.from(base64Pdf, 'base64');
    const result = await whatsAppCloudApiService.sendMeriParchiPdf({
      toPhone,
      pdfBuffer,
      fileName: fileName || 'DocSearch_Meri_Parchi.pdf',
      caption
    });

    return {
      success: true,
      data: result
    };
  });
};
