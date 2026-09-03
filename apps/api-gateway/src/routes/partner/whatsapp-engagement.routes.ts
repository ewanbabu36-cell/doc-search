import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../plugins/auth-guard.js';
import {
  whatsAppEngagementService,
  type SendWhatsAppMessageDto,
  type DispatchHealthDocumentDto,
  type SendMedicationReminderDto,
  type InboundWebhookMessageDto
} from '../../services/partner/WhatsAppEngagementService.js';
import { AppError } from '@docsearch/shared-core';

export const whatsappEngagementRoutes: FastifyPluginAsync = async (app) => {
  const service = whatsAppEngagementService;

  // 1. Overview Metrics
  app.get(
    '/api/v1/partner/whatsapp/overview',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getOverviewMetrics(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 2. Conversations List
  app.get(
    '/api/v1/partner/whatsapp/conversations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getConversations(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 3. Single Conversation Details
  app.get(
    '/api/v1/partner/whatsapp/conversations/:conversationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { conversationId } = request.params as { conversationId: string };
      const data = await service.getConversationById(tenantId, conversationId);
      return reply.send({ success: true, data });
    }
  );

  // 4. Send Message from Live Desk (Human Agent Outbound)
  app.post(
    '/api/v1/partner/whatsapp/conversations/:conversationId/messages',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const { conversationId } = request.params as { conversationId: string };
      const body = (request.body || {}) as Record<string, unknown>;

      const payload: SendWhatsAppMessageDto = {
        conversationId,
        messageType: (body['messageType'] as SendWhatsAppMessageDto['messageType']) || 'TEXT_MESSAGE',
        textContent: String(body['textContent'] || ''),
        mediaUrl: body['mediaUrl'] as string | null | undefined,
        mediaCaption: body['mediaCaption'] as string | null | undefined,
        quickReplyOptions: body['quickReplyOptions'] as string[] | undefined
      };

      const data = await service.sendMessage(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 5. Toggle Bot Active / Human Desk Handoff
  app.post(
    '/api/v1/partner/whatsapp/conversations/:conversationId/toggle-bot',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const { conversationId } = request.params as { conversationId: string };
      const body = (request.body || {}) as Record<string, unknown>;
      const botActive = Boolean(body['botActive']);
      const agentName = body['agentName'] as string | undefined;

      const data = await service.toggleBotActive(tenantId, conversationId, botActive, userId, agentName);
      return reply.send({ success: true, data });
    }
  );

  // 6. Document Dispatches (e-Rx, Lab Report, Discharge Summary)
  app.get(
    '/api/v1/partner/whatsapp/dispatches',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getDocumentDispatches(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.post(
    '/api/v1/partner/whatsapp/dispatches',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const body = (request.body || {}) as Record<string, unknown>;

      const payload: DispatchHealthDocumentDto = {
        patientMrn: String(body['patientMrn'] || ''),
        patientName: String(body['patientName'] || ''),
        phoneNumber: String(body['phoneNumber'] || ''),
        documentType: (body['documentType'] as DispatchHealthDocumentDto['documentType']) || 'PRESCRIPTION_E_RX',
        documentNumber: String(body['documentNumber'] || ''),
        fileName: String(body['fileName'] || 'document.pdf'),
        fileSizeKb: typeof body['fileSizeKb'] === 'number' ? body['fileSizeKb'] : undefined,
        fileUrl: body['fileUrl'] as string | undefined,
        dispatchChannel: body['dispatchChannel'] as DispatchHealthDocumentDto['dispatchChannel']
      };

      const data = await service.dispatchHealthDocument(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 7. Patient Portal Profile (Aarogya 360)
  app.get(
    '/api/v1/partner/whatsapp/patient-profile/:patientMrn',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { patientMrn } = request.params as { patientMrn: string };
      const data = await service.getPatientPortalProfile(tenantId, patientMrn);
      return reply.send({ success: true, data });
    }
  );

  // 8. Live OPD Queue Tokens
  app.get(
    '/api/v1/partner/whatsapp/queue-tokens',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getLiveQueueTokens(tenantId);
      return reply.send({ success: true, data });
    }
  );

  app.patch(
    '/api/v1/partner/whatsapp/queue-tokens/:tokenId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const { tokenId } = request.params as { tokenId: string };
      const body = (request.body || {}) as Record<string, unknown>;
      const data = await service.updateQueueToken(tenantId, tokenId, body);
      return reply.send({ success: true, data });
    }
  );

  // 9. Medication Reminders
  app.post(
    '/api/v1/partner/whatsapp/medication-reminders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, branchId, userId } = request.session;
      const body = (request.body || {}) as Record<string, unknown>;

      const payload: SendMedicationReminderDto = {
        patientMrn: String(body['patientMrn'] || ''),
        phoneNumber: String(body['phoneNumber'] || ''),
        drugName: String(body['drugName'] || ''),
        dosageInstructions: String(body['dosageInstructions'] || ''),
        scheduledTime: body['scheduledTime'] as string | undefined
      };

      const data = await service.sendMedicationReminder(tenantId, branchId || 'branch_default', userId, payload);
      return reply.status(201).send({ success: true, data });
    }
  );

  // 10. Audit Traces
  app.get(
    '/api/v1/partner/whatsapp/audit-traces',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const data = await service.getAuditTraces(tenantId);
      return reply.send({ success: true, data });
    }
  );

  // 11. Meta Cloud API Webhook Handshake (GET)
  app.get(
    '/api/v1/partner/whatsapp/webhook',
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const mode = query['hub.mode'] || '';
      const token = query['hub.verify_token'] || '';
      const challenge = query['hub.challenge'] || '';

      const challengeResponse = service.verifyWebhookChallenge(mode, token, challenge);
      return reply.send(challengeResponse);
    }
  );

  // 12. Meta Cloud API Inbound Webhook (POST)
  app.post(
    '/api/v1/partner/whatsapp/webhook',
    async (request, reply) => {
      const signature = request.headers['x-hub-signature-256'] as string | undefined;
      const rawPayload = typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {});

      // If signature is provided, verify HMAC SHA-256
      if (signature) {
        const isValid = service.verifyHmacSignature(rawPayload, signature);
        if (!isValid) {
          throw new AppError({ message: 'HMAC SHA-256 webhook signature verification failed.', statusCode: 401 });
        }
      }

      const tenantId = (request.headers['x-tenant-id'] as string) || '11111111-1111-4111-8111-111111111111';
      const body = (typeof request.body === 'object' && request.body !== null ? request.body : JSON.parse(rawPayload)) as Record<string, unknown>;

      // Standard Meta WhatsApp Webhook Payload Parsing
      let messageDto: InboundWebhookMessageDto;

      if (body['entry'] && Array.isArray(body['entry'])) {
        const entry = (body['entry'][0] || {}) as Record<string, unknown>;
        const changes = (entry['changes'] && Array.isArray(entry['changes']) ? entry['changes'][0] : {}) as Record<string, unknown>;
        const value = (changes['value'] || {}) as Record<string, unknown>;
        const messages = (value['messages'] && Array.isArray(value['messages']) ? value['messages'][0] : {}) as Record<string, unknown>;
        const contacts = (value['contacts'] && Array.isArray(value['contacts']) ? value['contacts'][0] : {}) as Record<string, unknown>;
        const profile = (contacts['profile'] || {}) as Record<string, unknown>;

        const textObj = (messages['text'] || {}) as Record<string, unknown>;
        const interactiveObj = (messages['interactive'] || {}) as Record<string, unknown>;
        const buttonReply = (interactiveObj['button_reply'] || {}) as Record<string, unknown>;

        messageDto = {
          fromPhone: String(messages['from'] || contacts['wa_id'] || '+919820154321'),
          patientName: profile['name'] ? String(profile['name']) : undefined,
          messageId: messages['id'] ? String(messages['id']) : undefined,
          text: textObj['body'] ? String(textObj['body']) : undefined,
          buttonPayload: buttonReply['id'] || buttonReply['title'] ? String(buttonReply['id'] || buttonReply['title']) : undefined,
          timestamp: messages['timestamp'] ? String(messages['timestamp']) : undefined
        };
      } else {
        // Direct format support for API testing
        messageDto = {
          fromPhone: String(body['fromPhone'] || body['senderPhone'] || '+919820154321'),
          patientName: body['patientName'] as string | undefined,
          messageId: body['messageId'] as string | undefined,
          text: body['text'] as string | undefined,
          buttonPayload: body['buttonPayload'] as string | undefined,
          timestamp: body['timestamp'] as string | undefined
        };
      }

      const result = await service.processInboundMessage(tenantId, messageDto);
      return reply.send({ success: true, data: result });
    }
  );
};
