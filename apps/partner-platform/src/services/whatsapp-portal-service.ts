import type {
  WhatsAppConversationThreadDto,
  HealthDocumentDispatchDto,
  AarogyaPatientProfileDto,
  LiveQueueTokenDto,
  WhatsAppOverviewMetricsDto,
  WhatsAppAuditTraceDto,
  SendWhatsAppMessageRequest,
  DispatchHealthDocumentRequest,
  SendMedicationReminderRequest
} from '@docsearch/api-contracts';

import {
  mockWhatsAppOverviewMetrics,
  mockWhatsAppConversations,
  mockDocumentDispatches,
  mockAarogyaPatientProfile,
  mockLiveQueueTokens,
  mockWhatsAppAuditTraces
} from './mock-whatsapp-portal-data.js';

export interface IWhatsAppPortalService {
  getOverviewMetrics(tenantId: string): Promise<WhatsAppOverviewMetricsDto>;
  getConversations(tenantId: string): Promise<WhatsAppConversationThreadDto[]>;
  sendMessage(tenantId: string, payload: SendWhatsAppMessageRequest): Promise<WhatsAppConversationThreadDto>;
  toggleBotActive(tenantId: string, conversationId: string, botActive: boolean): Promise<WhatsAppConversationThreadDto>;

  getDocumentDispatches(tenantId: string): Promise<HealthDocumentDispatchDto[]>;
  dispatchDocument(tenantId: string, payload: DispatchHealthDocumentRequest): Promise<HealthDocumentDispatchDto>;

  getPatientPortalProfile(tenantId: string, patientMrn: string): Promise<AarogyaPatientProfileDto>;
  getLiveQueueTokens(tenantId: string): Promise<LiveQueueTokenDto[]>;

  sendMedicationReminder(tenantId: string, payload: SendMedicationReminderRequest): Promise<void>;
  getAuditTraces(tenantId: string): Promise<WhatsAppAuditTraceDto[]>;
}

export class WhatsAppPortalService implements IWhatsAppPortalService {
  private metrics: WhatsAppOverviewMetricsDto = { ...mockWhatsAppOverviewMetrics };
  private conversations: WhatsAppConversationThreadDto[] = [...mockWhatsAppConversations];
  private dispatches: HealthDocumentDispatchDto[] = [...mockDocumentDispatches];
  private patientProfile: AarogyaPatientProfileDto = { ...mockAarogyaPatientProfile };
  private queueTokens: LiveQueueTokenDto[] = [...mockLiveQueueTokens];
  private auditTraces: WhatsAppAuditTraceDto[] = [...mockWhatsAppAuditTraces];

  private appendAudit(
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    actorName = 'WhatsApp Business Cloud Gateway',
    actorRole = 'SYSTEM_GATEWAY'
  ) {
    const traceNumber = `TRACE-WA-${Math.floor(10000 + Math.random() * 90000)}`;
    const trace: WhatsAppAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId: '11111111-1111-4111-8111-111111111111',
      traceNumber,
      action,
      entityType,
      entityId,
      entityCode,
      actorName,
      actorRole,
      justification,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(_tenantId: string): Promise<WhatsAppOverviewMetricsDto> {
    return { ...this.metrics };
  }

  async getConversations(_tenantId: string): Promise<WhatsAppConversationThreadDto[]> {
    return [...this.conversations];
  }

  async sendMessage(_tenantId: string, payload: SendWhatsAppMessageRequest): Promise<WhatsAppConversationThreadDto> {
    const conv = this.conversations.find((c) => c.id === payload.conversationId);
    if (!conv) throw new Error('Conversation not found');

    const newMsg = {
      id: crypto.randomUUID(),
      conversationId: conv.id,
      direction: 'OUTBOUND_AGENT' as const,
      senderPhone: 'DOC_SEARCH_AGENT_DESK',
      messageType: payload.messageType,
      textContent: payload.textContent,
      mediaUrl: payload.mediaUrl || null,
      mediaCaption: null,
      quickReplyOptions: [],
      deliveryStatus: 'SENT' as const,
      timestamp: new Date().toISOString()
    };

    conv.messages.push(newMsg);
    conv.lastMessageSnippet = payload.textContent;
    conv.lastActivityTimestamp = new Date().toISOString();

    this.appendAudit('SEND_WHATSAPP_MESSAGE', 'WHATSAPP_MESSAGE', newMsg.id, conv.phoneNumber, payload.textContent, 'Pooja Nair (Desk Coordinator)', 'RECEPTION_AGENT');
    return { ...conv };
  }

  async toggleBotActive(_tenantId: string, conversationId: string, botActive: boolean): Promise<WhatsAppConversationThreadDto> {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found');

    conv.botActive = botActive;
    if (!botActive) {
      conv.assignedAgent = 'Pooja Nair (Front Desk Reception)';
    } else {
      conv.assignedAgent = null;
    }

    this.appendAudit('TOGGLE_BOT_HANDOFF', 'WHATSAPP_CONVERSATION', conv.id, conv.phoneNumber, botActive ? 'Bot re-engaged' : 'Human agent escalation taken');
    return { ...conv };
  }

  async getDocumentDispatches(_tenantId: string): Promise<HealthDocumentDispatchDto[]> {
    return [...this.dispatches];
  }

  async dispatchDocument(_tenantId: string, payload: DispatchHealthDocumentRequest): Promise<HealthDocumentDispatchDto> {
    const newDispatch: HealthDocumentDispatchDto = {
      id: crypto.randomUUID(),
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      phoneNumber: payload.phoneNumber,
      documentType: payload.documentType,
      documentNumber: payload.documentNumber,
      fileName: payload.fileName,
      fileSizeKb: 310,
      dispatchChannel: 'WHATSAPP_CLOUD_API',
      deliveryStatus: 'DISPATCHED_READ',
      dispatchedAt: new Date().toISOString()
    };

    this.dispatches.unshift(newDispatch);
    this.metrics.documentsDispatchedMonth += 1;
    this.appendAudit('DISPATCH_DOCUMENT_PDF', 'HEALTH_DOCUMENT', newDispatch.id, payload.documentNumber, `Delivered ${payload.documentType} to ${payload.phoneNumber}`);
    return newDispatch;
  }

  async getPatientPortalProfile(_tenantId: string, _patientMrn: string): Promise<AarogyaPatientProfileDto> {
    return { ...this.patientProfile };
  }

  async getLiveQueueTokens(_tenantId: string): Promise<LiveQueueTokenDto[]> {
    return [...this.queueTokens];
  }

  async sendMedicationReminder(_tenantId: string, payload: SendMedicationReminderRequest): Promise<void> {
    this.appendAudit('SEND_MEDICATION_REMINDER', 'PRESCRIPTION_REFILL', crypto.randomUUID(), payload.drugName, `Refill reminder pushed to ${payload.phoneNumber} for ${payload.drugName}`);
  }

  async getAuditTraces(_tenantId: string): Promise<WhatsAppAuditTraceDto[]> {
    return [...this.auditTraces];
  }
}

export const whatsappPortalService = new WhatsAppPortalService();
