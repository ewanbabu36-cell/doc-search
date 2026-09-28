import crypto from 'crypto';
import {
  whatsAppEngagementRepository,
  type WhatsAppConversationThreadRecord,
  type WhatsAppMessageRecord,
  type HealthDocumentDispatchRecord,
  type AarogyaPatientProfileRecord,
  type LiveQueueTokenRecord,
  type MedicationReminderRecord,
  type WhatsAppAuditTraceRecord,
  type WhatsAppOverviewMetricsRecord
} from '../../repositories/partner/WhatsAppEngagementRepository.js';
import { AppError } from '@docsearch/shared-core';

export interface SendWhatsAppMessageDto {
  conversationId: string;
  messageType: 'TEXT_MESSAGE' | 'INTERACTIVE_BUTTONS' | 'INTERACTIVE_LIST' | 'MEDIA_DOCUMENT_PDF' | 'LOCATION_SHARE';
  textContent: string;
  mediaUrl?: string | null | undefined;
  mediaCaption?: string | null | undefined;
  quickReplyOptions?: string[] | undefined;
}

export interface DispatchHealthDocumentDto {
  patientMrn: string;
  patientName: string;
  phoneNumber: string;
  documentType: 'PRESCRIPTION_E_RX' | 'DIAGNOSTIC_LAB_REPORT' | 'RADIOLOGY_IMAGING_REPORT' | 'DISCHARGE_SUMMARY' | 'TAX_INVOICE_RECEIPT';
  documentNumber: string;
  fileName: string;
  fileSizeKb?: number | undefined;
  fileUrl?: string | undefined;
  dispatchChannel?: 'WHATSAPP_CLOUD_API' | 'PATIENT_PORTAL_VAULT' | 'SMS_DEEP_LINK' | 'EMAIL_ATTACHMENT' | undefined;
}

export interface SendMedicationReminderDto {
  patientMrn: string;
  phoneNumber: string;
  drugName: string;
  dosageInstructions: string;
  scheduledTime?: string | undefined;
}

export interface InboundWebhookMessageDto {
  fromPhone: string;
  patientName?: string | undefined;
  messageId?: string | undefined;
  text?: string | undefined;
  buttonPayload?: string | undefined;
  timestamp?: string | undefined;
}

export const WA_SECURITY_DEFAULTS = {
  WEBHOOK_VERIFY_TOKEN: 'docsearch_wa_webhook_verify_token_prod',
  APP_SECRET: 'docsearch_wa_app_secret_prod_64char_token_value'
};

export class WhatsAppEngagementService {
  constructor(private repo = whatsAppEngagementRepository) {}

  // --- Metrics ---
  async getOverviewMetrics(tenantId: string): Promise<WhatsAppOverviewMetricsRecord> {
    return this.repo.getOverviewMetrics(tenantId);
  }

  // --- Conversations ---
  async getConversations(tenantId: string): Promise<WhatsAppConversationThreadRecord[]> {
    return this.repo.getConversations(tenantId);
  }

  async getConversationById(tenantId: string, id: string): Promise<WhatsAppConversationThreadRecord> {
    const conv = await this.repo.getConversationById(tenantId, id);
    if (!conv) {
      throw new AppError({ message: `WhatsApp conversation ${id} was not found.`, statusCode: 404 });
    }
    return conv;
  }

  // --- Outbound Agent Messaging ---
  async sendMessage(
    tenantId: string,
    _branchId: string,
    userId: string,
    payload: SendWhatsAppMessageDto
  ): Promise<WhatsAppConversationThreadRecord> {
    const conv = await this.repo.getConversationById(tenantId, payload.conversationId);
    if (!conv) {
      throw new AppError({ message: `Conversation ${payload.conversationId} not found`, statusCode: 404 });
    }

    const { conversation, message } = await this.repo.addMessage(tenantId, conv.id, {
      direction: 'OUTBOUND_AGENT',
      senderPhone: 'DOCSEARCH_AGENT_DESK',
      messageType: payload.messageType,
      textContent: payload.textContent,
      mediaUrl: payload.mediaUrl,
      mediaCaption: payload.mediaCaption,
      quickReplyOptions: payload.quickReplyOptions,
      deliveryStatus: 'SENT'
    });

    await this.repo.createAuditTrace(tenantId, {
      traceNumber: `TRACE-WA-${Math.floor(10000 + Math.random() * 90000)}`,
      action: 'SEND_WHATSAPP_AGENT_MESSAGE',
      entityType: 'WHATSAPP_MESSAGE',
      entityId: message.id,
      entityCode: conv.phoneNumber,
      actorName: userId || 'Front Desk Reception Agent',
      actorRole: 'RECEPTION_AGENT',
      justification: `Manual outbound reply: "${payload.textContent.substring(0, 50)}..."`
    });

    return conversation;
  }

  // --- Toggle Bot / Human Handoff ---
  async toggleBotActive(
    tenantId: string,
    conversationId: string,
    botActive: boolean,
    userId: string,
    agentName?: string
  ): Promise<WhatsAppConversationThreadRecord> {
    const conv = await this.repo.getConversationById(tenantId, conversationId);
    if (!conv) {
      throw new AppError({ message: `Conversation ${conversationId} not found`, statusCode: 404 });
    }

    const assignedAgent = botActive ? null : (agentName || 'Pooja Nair (Front Desk Reception)');
    const updated = await this.repo.updateConversation(tenantId, conversationId, {
      botActive,
      assignedAgent
    });

    await this.repo.createAuditTrace(tenantId, {
      traceNumber: `TRACE-WA-${Math.floor(10000 + Math.random() * 90000)}`,
      action: 'TOGGLE_BOT_HANDOFF',
      entityType: 'WHATSAPP_CONVERSATION',
      entityId: conv.id,
      entityCode: conv.phoneNumber,
      actorName: userId || 'Front Desk Supervisor',
      actorRole: 'RECEPTION_SUPERVISOR',
      justification: botActive ? 'Bot automation resumed for patient' : `Escalated to human receptionist (${assignedAgent})`
    });

    return updated;
  }

  // --- Health Document Dispatches (e-Rx, Lab Report, Discharge) ---
  async dispatchHealthDocument(
    tenantId: string,
    branchId: string,
    userId: string,
    payload: DispatchHealthDocumentDto
  ): Promise<HealthDocumentDispatchRecord> {
    let channel = payload.dispatchChannel || 'WHATSAPP_CLOUD_API';
    const fileUrl = payload.fileUrl || `https://cdn.docsearch.health/docs/${payload.documentType.toLowerCase()}/${payload.documentNumber}.pdf`;
    let deliveryStatus: 'DISPATCHED_READ' | 'DELIVERED' | 'QUEUED' | 'SENT' = 'DISPATCHED_READ';
    let fallbackTriggered = false;
    let failureReason: string | undefined;

    // Find or auto-create conversation thread
    let conv: any;
    try {
      conv = await this.repo.getConversationByPhone(tenantId, payload.phoneNumber);
      if (!conv) {
        conv = await this.repo.createConversation(tenantId, {
          branchId,
          patientMrn: payload.patientMrn,
          patientName: payload.patientName,
          phoneNumber: payload.phoneNumber,
          lastMessageSnippet: `Delivered ${payload.documentType} (${payload.documentNumber})`,
          botActive: true
        });
      }
    } catch (e: any) {
      // If conversation thread lookup fails, gracefully fall back to portal
      channel = 'PATIENT_PORTAL_VAULT';
      deliveryStatus = 'QUEUED';
      fallbackTriggered = true;
      failureReason = e?.message || 'Conversation thread unavailable';
    }

    // Build notification message text
    let docLabel = 'Health Document';
    if (payload.documentType === 'PRESCRIPTION_E_RX') docLabel = 'Digital e-Prescription';
    else if (payload.documentType === 'DIAGNOSTIC_LAB_REPORT') docLabel = 'Laboratory Test Report';
    else if (payload.documentType === 'DISCHARGE_SUMMARY') docLabel = 'Hospital Discharge Summary';
    else if (payload.documentType === 'RADIOLOGY_IMAGING_REPORT') docLabel = 'Radiology Imaging Report';

    const textContent = `Namaste ${payload.patientName} ji, aapka ${docLabel} (${payload.documentNumber}) taiyar hai. Neeche diye gaye link se PDF download karein: ${fileUrl}`;

    if (!fallbackTriggered && channel === 'WHATSAPP_CLOUD_API' && conv) {
      try {
        await this.repo.addMessage(tenantId, conv.id, {
          direction: 'OUTBOUND_BOT',
          senderPhone: 'DOCSEARCH_BOT',
          messageType: 'MEDIA_DOCUMENT_PDF',
          textContent,
          mediaUrl: fileUrl,
          mediaCaption: `${payload.fileName} (${payload.fileSizeKb || 310} KB)`,
          quickReplyOptions: ['CONFIRM', 'REPORT', 'RX', 'QUEUE', 'AGENT'],
          deliveryStatus: 'SENT'
        });
      } catch (err: any) {
        // Safe Graceful Degradation: Fallback to Patient Portal Vault
        channel = 'PATIENT_PORTAL_VAULT';
        deliveryStatus = 'QUEUED';
        fallbackTriggered = true;
        failureReason = err?.message || 'Outbound WhatsApp delivery failed';
      }
    }

    const dispatch = await this.repo.createDocumentDispatch(tenantId, {
      branchId,
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      phoneNumber: payload.phoneNumber,
      documentType: payload.documentType,
      documentNumber: payload.documentNumber,
      fileName: payload.fileName,
      fileSizeKb: payload.fileSizeKb || 310,
      fileUrl,
      dispatchChannel: channel,
      deliveryStatus
    });

    await this.repo.createAuditTrace(tenantId, {
      traceNumber: `TRACE-WA-${Math.floor(10000 + Math.random() * 90000)}`,
      action: fallbackTriggered ? 'DISPATCH_FALLBACK_PORTAL_VAULT' : 'DISPATCH_HEALTH_DOCUMENT',
      entityType: 'HEALTH_DOCUMENT',
      entityId: dispatch.id,
      entityCode: payload.documentNumber,
      actorName: userId || 'Clinical Dispatch System',
      actorRole: 'SYSTEM_BOT',
      justification: fallbackTriggered
        ? `Primary WhatsApp failed (${failureReason}); safely degraded to PATIENT_PORTAL_VAULT for ${payload.documentNumber}`
        : `Dispatched ${payload.documentType} (${payload.documentNumber}) via ${channel} to ${payload.phoneNumber}`
    });

    return dispatch;
  }

  async getDocumentDispatches(tenantId: string): Promise<HealthDocumentDispatchRecord[]> {
    return this.repo.getDocumentDispatches(tenantId);
  }

  // --- Patient Portal Profiles ---
  async getPatientPortalProfile(tenantId: string, patientMrn: string): Promise<AarogyaPatientProfileRecord> {
    const profile = await this.repo.getPatientPortalProfile(tenantId, patientMrn);
    if (!profile) {
      throw new AppError({ message: `Patient profile ${patientMrn} was not found.`, statusCode: 404 });
    }
    return profile;
  }

  // --- Live Queue Tokens ---
  async getLiveQueueTokens(tenantId: string): Promise<LiveQueueTokenRecord[]> {
    return this.repo.getLiveQueueTokens(tenantId);
  }

  async updateQueueToken(
    tenantId: string,
    tokenId: string,
    updates: Partial<LiveQueueTokenRecord>
  ): Promise<LiveQueueTokenRecord> {
    return this.repo.updateQueueToken(tenantId, tokenId, updates);
  }

  // --- Medication Reminders ---
  async sendMedicationReminder(
    tenantId: string,
    branchId: string,
    userId: string,
    payload: SendMedicationReminderDto
  ): Promise<MedicationReminderRecord> {
    const reminder = await this.repo.createMedicationReminder(tenantId, {
      patientMrn: payload.patientMrn,
      phoneNumber: payload.phoneNumber,
      drugName: payload.drugName,
      dosageInstructions: payload.dosageInstructions,
      scheduledTime: payload.scheduledTime
    });

    // Send WhatsApp notification
    let conv = await this.repo.getConversationByPhone(tenantId, payload.phoneNumber);
    if (!conv) {
      conv = await this.repo.createConversation(tenantId, {
        branchId,
        patientMrn: payload.patientMrn,
        phoneNumber: payload.phoneNumber,
        lastMessageSnippet: `Medication Reminder: ${payload.drugName}`,
        botActive: true
      });
    }

    const msgText = `⏰ Namaste! Yeh DocSearch Aarogya reminder hai:\n\n💊 Dawa: ${payload.drugName}\n📋 Dosage: ${payload.dosageInstructions}\n\nKripya samay par apni dava lein. Refill ke lye 'REFILL' likhen.`;

    await this.repo.addMessage(tenantId, conv.id, {
      direction: 'OUTBOUND_BOT',
      senderPhone: 'DOCSEARCH_BOT',
      messageType: 'TEXT_MESSAGE',
      textContent: msgText,
      quickReplyOptions: ['TAKEN', 'REFILL', 'AGENT'],
      deliveryStatus: 'SENT'
    });

    await this.repo.createAuditTrace(tenantId, {
      traceNumber: `TRACE-WA-${Math.floor(10000 + Math.random() * 90000)}`,
      action: 'SEND_MEDICATION_REMINDER',
      entityType: 'MEDICATION_REMINDER',
      entityId: reminder.id,
      entityCode: payload.drugName,
      actorName: userId || 'Chronic Care Engine',
      actorRole: 'SYSTEM_BOT',
      justification: `Automated refill reminder pushed to ${payload.phoneNumber} for ${payload.drugName}`
    });

    return reminder;
  }

  // --- Inbound Webhook & Conversational Bot State Machine ---
  verifyWebhookChallenge(mode: string, token: string, challenge: string, configuredToken = WA_SECURITY_DEFAULTS.WEBHOOK_VERIFY_TOKEN): string {
    if (mode === 'subscribe' && token === configuredToken) {
      return challenge;
    }
    throw new AppError({ message: 'Invalid webhook verification token or mode', statusCode: 403 });
  }

  verifyHmacSignature(rawBody: string, signatureHeader: string | undefined, secret = WA_SECURITY_DEFAULTS.APP_SECRET): boolean {
    if (!signatureHeader) return false;
    const expectedHash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const parts = signatureHeader.split('=');
    const providedHash = parts.length === 2 ? parts[1] : signatureHeader;

    if (!providedHash || providedHash.length !== expectedHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(expectedHash));
  }

  async processInboundMessage(
    tenantId: string,
    messageDto: InboundWebhookMessageDto
  ): Promise<{
    status: string;
    conversationId: string;
    botActive: boolean;
    intentDetected: string;
    replyMessage?: WhatsAppMessageRecord | undefined;
  }> {
    const rawInput = (messageDto.buttonPayload || messageDto.text || '').trim();
    const upperInput = rawInput.toUpperCase();

    // 1. Find or create conversation
    let conv = await this.repo.getConversationByPhone(tenantId, messageDto.fromPhone);
    if (!conv) {
      conv = await this.repo.createConversation(tenantId, {
        patientName: messageDto.patientName || 'Patient',
        phoneNumber: messageDto.fromPhone,
        lastMessageSnippet: rawInput,
        botActive: true
      });
    }

    // 2. Add inbound message
    await this.repo.addMessage(tenantId, conv.id, {
      direction: 'INBOUND_PATIENT',
      senderPhone: messageDto.fromPhone,
      messageType: messageDto.buttonPayload ? 'INTERACTIVE_BUTTONS' : 'TEXT_MESSAGE',
      textContent: rawInput,
      deliveryStatus: 'READ'
    });

    // 3. If bot is paused (human handoff active), do not auto-reply
    if (!conv.botActive) {
      await this.repo.createAuditTrace(tenantId, {
        traceNumber: `TRACE-WA-${Math.floor(10000 + Math.random() * 90000)}`,
        action: 'INBOUND_AGENT_ROUTED',
        entityType: 'WHATSAPP_MESSAGE',
        entityId: conv.id,
        entityCode: messageDto.fromPhone,
        actorName: 'Inbound Webhook Processor',
        actorRole: 'SYSTEM_ROUTER',
        justification: `Message "${rawInput.substring(0, 40)}" routed to active agent desk (${conv.assignedAgent})`
      });

      return {
        status: 'ROUTED_TO_AGENT',
        conversationId: conv.id,
        botActive: false,
        intentDetected: 'HUMAN_AGENT_ACTIVE'
      };
    }

    // 4. Conversational Bot State Machine
    let replyText = '';
    let intentDetected = 'UNKNOWN';
    let quickReplies: string[] = ['CONFIRM', 'REPORT', 'RX', 'QUEUE', 'AGENT'];
    let mediaUrl: string | null = null;
    let messageType: WhatsAppMessageRecord['messageType'] = 'TEXT_MESSAGE';

    if (upperInput === 'CONFIRM' || upperInput === '1' || upperInput === 'YES') {
      intentDetected = 'APPOINTMENT_CONFIRMED';
      replyText = '✅ Bahut badiya! Aapka appointment confirm kar diya gaya hai.\n\n📍 DocSearch Central Hospital OPD\n🕒 Kripya samay se 15 minute pehle pahuchein.\n🎫 Token status janne ke lye "QUEUE" likhen.';
      quickReplies = ['QUEUE', 'REPORT', 'AGENT'];
    } else if (upperInput === 'CANCEL' || upperInput === '2') {
      intentDetected = 'APPOINTMENT_CANCELLED';
      replyText = '⚠️ Aapka appointment cancel kar diya gaya hai. Agar aap kisi anya tarikh ya samay par aana chahein, to "RESCHEDULE" likhen.';
      quickReplies = ['RESCHEDULE', 'BOOK_NEW', 'AGENT'];
    } else if (upperInput.includes('RESCHEDULE')) {
      intentDetected = 'APPOINTMENT_RESCHEDULE_PROMPT';
      replyText = '📅 Kripya apna manpasand slot chunein:\n1. Kal Subah (10:00 AM)\n2. Kal Dopahar (02:30 PM)\n3. Parson Subah (11:00 AM)\n\nSlot number reply karein.';
      quickReplies = ['10:00 AM', '02:30 PM', '11:00 AM'];
    } else if (upperInput.includes('REPORT') || upperInput === '3' || upperInput.includes('LAB')) {
      intentDetected = 'REPORT_RETRIEVED';
      const dispatches = await this.repo.getDocumentDispatches(tenantId);
      const labDoc = dispatches.find((d) => d.phoneNumber === messageDto.fromPhone && d.documentType === 'DIAGNOSTIC_LAB_REPORT');
      messageType = 'MEDIA_DOCUMENT_PDF';
      mediaUrl = labDoc?.fileUrl || 'https://storage.docsearch.health/reports/LAB-2026-8812.pdf';
      const docNum = labDoc?.documentNumber || 'LAB-2026-8812';
      replyText = `📄 Aapka Latest Lab Report (${docNum}) taiyar hai. PDF link: ${mediaUrl}`;
      quickReplies = ['RX', 'QUEUE', 'AGENT'];
    } else if (upperInput.includes('RX') || upperInput.includes('PRESCRIPTION') || upperInput.includes('DAWA')) {
      intentDetected = 'PRESCRIPTION_RETRIEVED';
      const dispatches = await this.repo.getDocumentDispatches(tenantId);
      const rxDoc = dispatches.find((d) => d.phoneNumber === messageDto.fromPhone && d.documentType === 'PRESCRIPTION_E_RX');
      messageType = 'MEDIA_DOCUMENT_PDF';
      mediaUrl = rxDoc?.fileUrl || 'https://storage.docsearch.health/prescriptions/RX-2026-9901.pdf';
      const docNum = rxDoc?.documentNumber || 'RX-2026-9901';
      replyText = `💊 Aapka Digital Prescription (${docNum}) yahan available hai: ${mediaUrl}`;
      quickReplies = ['REPORT', 'QUEUE', 'AGENT'];
    } else if (upperInput.includes('QUEUE') || upperInput.includes('TOKEN') || upperInput.includes('WAIT')) {
      intentDetected = 'QUEUE_TRACKED';
      const tokens = await this.repo.getLiveQueueTokens(tenantId);
      const userToken = tokens.find((t) => t.patientMrn === conv?.patientMrn) || tokens[0];
      if (userToken) {
        replyText = `🎫 Live OPD Queue Update:\n\n• Token No: ${userToken.tokenNumber}\n• Doctor: ${userToken.doctorName}\n• Room: ${userToken.roomNumber}\n• Current Serving: ${userToken.currentTokenServing}\n• Anumanit Samay: ~${userToken.estimatedWaitMinutes} minute wait\n• Status: ${userToken.queueStatus.replace(/_/g, ' ')}`;
      } else {
        replyText = '🎫 Filhal aapka koi active OPD queue token nahi hai. Naya appointment lene ke lye "BOOK" likhen.';
      }
      quickReplies = ['CONFIRM', 'REPORT', 'AGENT'];
    } else if (upperInput.includes('AGENT') || upperInput.includes('HELP') || upperInput.includes('HUMAN') || upperInput.includes('RECEPTION')) {
      intentDetected = 'HANDOFF_TO_AGENT';
      await this.repo.updateConversation(tenantId, conv.id, {
        botActive: false,
        assignedAgent: 'Pooja Nair (Front Desk Reception)'
      });
      replyText = '🧑‍💼 Aapko hamare Front Desk Reception Coordinator (Pooja Nair) se joda ja raha hai. Kripya apna prashna yahan likhen, executive turant jawab denge.';
      quickReplies = [];
    } else {
      intentDetected = 'MENU_DISPLAYED';
      replyText = 'Namaste! DocSearch 24x7 Aarogya Bot me aapka swagat hai.\n\nKripya vikalp chunein:\n• "CONFIRM" - Appointment confirm karein\n• "CANCEL" - Appointment cancel karein\n• "REPORT" - Latest lab report paayein\n• "RX" - Digital prescription dekhein\n• "QUEUE" - Live OPD token wait time dekhein\n• "AGENT" - Front desk se baat karein';
    }

    const { message: replyMsg } = await this.repo.addMessage(tenantId, conv.id, {
      direction: 'OUTBOUND_BOT',
      senderPhone: 'DOCSEARCH_BOT',
      messageType,
      textContent: replyText,
      mediaUrl,
      quickReplyOptions: quickReplies,
      deliveryStatus: 'SENT'
    });

    await this.repo.createAuditTrace(tenantId, {
      traceNumber: `TRACE-WA-${Math.floor(10000 + Math.random() * 90000)}`,
      action: 'INBOUND_BOT_INTERACTION',
      entityType: 'WHATSAPP_MESSAGE',
      entityId: replyMsg.id,
      entityCode: messageDto.fromPhone,
      actorName: 'WhatsApp Conversational Bot Engine',
      actorRole: 'SYSTEM_BOT',
      justification: `Intent "${intentDetected}" matched from input "${rawInput.substring(0, 30)}"`
    });

    return {
      status: 'AUTO_REPLIED',
      conversationId: conv.id,
      botActive: intentDetected !== 'HANDOFF_TO_AGENT',
      intentDetected,
      replyMessage: replyMsg
    };
  }

  // --- Audit Traces ---
  async getAuditTraces(tenantId: string): Promise<WhatsAppAuditTraceRecord[]> {
    return this.repo.getAuditTraces(tenantId);
  }
}

export const whatsAppEngagementService = new WhatsAppEngagementService();
