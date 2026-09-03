import crypto from 'crypto';

export interface WhatsAppMessageRecord {
  id: string;
  conversationId: string;
  direction: 'INBOUND_PATIENT' | 'OUTBOUND_BOT' | 'OUTBOUND_AGENT';
  senderPhone: string;
  messageType: 'INTERACTIVE_BUTTONS' | 'INTERACTIVE_LIST' | 'TEXT_MESSAGE' | 'MEDIA_DOCUMENT_PDF' | 'LOCATION_SHARE';
  textContent: string;
  mediaUrl?: string | null | undefined;
  mediaCaption?: string | null | undefined;
  quickReplyOptions?: string[] | undefined;
  deliveryStatus: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: string;
}

export interface WhatsAppConversationThreadRecord {
  id: string;
  tenantId: string;
  branchId?: string | undefined;
  patientMrn: string;
  patientName: string;
  phoneNumber: string;
  lastMessageSnippet: string;
  unreadCount: number;
  assignedAgent?: string | null | undefined;
  botActive: boolean;
  appointmentId?: string | undefined;
  lastActivityTimestamp: string;
  messages: WhatsAppMessageRecord[];
}

export interface HealthDocumentDispatchRecord {
  id: string;
  tenantId: string;
  branchId?: string | undefined;
  patientMrn: string;
  patientName: string;
  phoneNumber: string;
  documentType: 'PRESCRIPTION_E_RX' | 'DIAGNOSTIC_LAB_REPORT' | 'RADIOLOGY_IMAGING_REPORT' | 'DISCHARGE_SUMMARY' | 'TAX_INVOICE_RECEIPT';
  documentNumber: string;
  fileName: string;
  fileSizeKb: number;
  fileUrl: string;
  dispatchChannel: 'WHATSAPP_CLOUD_API' | 'PATIENT_PORTAL_VAULT' | 'SMS_DEEP_LINK' | 'EMAIL_ATTACHMENT';
  deliveryStatus: 'DISPATCHED_READ' | 'DELIVERED' | 'QUEUED' | 'SENT';
  dispatchedAt: string;
}

export interface AarogyaPatientProfileRecord {
  id: string;
  tenantId: string;
  patientMrn: string;
  abhaNumber?: string | null | undefined;
  abhaAddress?: string | null | undefined;
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  activePrescriptionsCount: number;
  upcomingAppointmentsCount: number;
  totalHealthRecordsCount: number;
  portalRole: 'PATIENT_PRIMARY' | 'FAMILY_DEPENDENT' | 'AUTHORIZED_CAREGIVER';
}

export interface LiveQueueTokenRecord {
  id: string;
  tenantId: string;
  tokenNumber: string;
  patientMrn: string;
  patientName: string;
  doctorName: string;
  departmentName: string;
  roomNumber: string;
  currentTokenServing: string;
  estimatedWaitMinutes: number;
  queueStatus: 'WAITING_IN_LOBBY' | 'CALLED_TO_ROOM' | 'IN_CONSULTATION' | 'COMPLETED';
  lastUpdated: string;
}

export interface MedicationReminderRecord {
  id: string;
  tenantId: string;
  patientMrn: string;
  phoneNumber: string;
  drugName: string;
  dosageInstructions: string;
  reminderStatus: 'PENDING' | 'SENT' | 'ACKNOWLEDGED';
  scheduledTime?: string | undefined;
  sentAt?: string | undefined;
}

export interface WhatsAppAuditTraceRecord {
  id: string;
  tenantId: string;
  traceNumber: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode: string;
  actorName: string;
  actorRole: string;
  justification: string;
  integrityHash: string;
  timestamp: string;
}

export interface WhatsAppOverviewMetricsRecord {
  totalConversationsToday: number;
  botHandledInteractionsPct: number;
  documentsDispatchedMonth: number;
  appointmentsBookedViaWhatsApp: number;
  activePortalUsersCount: number;
  medicationRefillCompliancePct: number;
  averageBotResponseTimeSec: number;
  patientNpsScore: number;
}

export class WhatsAppEngagementRepository {
  private conversationStore = new Map<string, WhatsAppConversationThreadRecord[]>();
  private dispatchStore = new Map<string, HealthDocumentDispatchRecord[]>();
  private patientProfileStore = new Map<string, AarogyaPatientProfileRecord[]>();
  private queueTokenStore = new Map<string, LiveQueueTokenRecord[]>();
  private reminderStore = new Map<string, MedicationReminderRecord[]>();
  private auditTraceStore = new Map<string, WhatsAppAuditTraceRecord[]>();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData(): void {
    const tenantDefault = '11111111-1111-4111-8111-111111111111';

    // Seed conversations
    this.conversationStore.set(tenantDefault, [
      {
        id: 'wac-1111-1111-4111-8111-111111111101',
        tenantId: tenantDefault,
        patientMrn: 'MRN-2026-9021',
        patientName: 'Gopal Krishna',
        phoneNumber: '+919820154321',
        lastMessageSnippet: 'Namaste Gopal ji, your Digital Prescription RX-2026-08819 is ready. Click below to download PDF.',
        unreadCount: 0,
        assignedAgent: null,
        botActive: true,
        appointmentId: 'APT-2026-4401',
        lastActivityTimestamp: new Date().toISOString(),
        messages: [
          {
            id: 'msg-1',
            conversationId: 'wac-1111-1111-4111-8111-111111111101',
            direction: 'INBOUND_PATIENT',
            senderPhone: '+919820154321',
            messageType: 'TEXT_MESSAGE',
            textContent: 'Hi, please send my latest blood test report and prescription from Dr. Sanjay Gupta.',
            deliveryStatus: 'READ',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'msg-2',
            conversationId: 'wac-1111-1111-4111-8111-111111111101',
            direction: 'OUTBOUND_BOT',
            senderPhone: 'DOCSEARCH_BOT',
            messageType: 'MEDIA_DOCUMENT_PDF',
            textContent: 'Namaste Gopal ji, your Digital Prescription RX-2026-08819 is ready. Click below to download PDF.',
            mediaUrl: 'https://cdn.docsearch.health/rx/RX-2026-08819.pdf',
            mediaCaption: 'Prescription_Dr_Sanjay_Gupta_30Aug.pdf (240 KB)',
            quickReplyOptions: ['CONFIRM', 'CANCEL', 'REPORT', 'QUEUE', 'AGENT'],
            deliveryStatus: 'READ',
            timestamp: new Date(Date.now() - 3500000).toISOString()
          }
        ]
      },
      {
        id: 'wac-1111-1111-4111-8111-111111111102',
        tenantId: tenantDefault,
        patientMrn: 'MRN-2026-8819',
        patientName: 'Meenakshi Sundaram',
        phoneNumber: '+919840291823',
        lastMessageSnippet: 'Patient requested live receptionist for insurance pre-auth assistance.',
        unreadCount: 1,
        assignedAgent: 'Pooja Nair (Front Desk Reception)',
        botActive: false,
        appointmentId: 'APT-2026-4402',
        lastActivityTimestamp: new Date(Date.now() - 1800000).toISOString(),
        messages: [
          {
            id: 'msg-3',
            conversationId: 'wac-1111-1111-4111-8111-111111111102',
            direction: 'INBOUND_PATIENT',
            senderPhone: '+919840291823',
            messageType: 'TEXT_MESSAGE',
            textContent: 'I need to speak to someone regarding Star Health insurance cashless approval.',
            deliveryStatus: 'DELIVERED',
            timestamp: new Date(Date.now() - 1800000).toISOString()
          }
        ]
      }
    ]);

    // Seed dispatches
    this.dispatchStore.set(tenantDefault, [
      {
        id: 'hdd-1',
        tenantId: tenantDefault,
        patientMrn: 'MRN-2026-9021',
        patientName: 'Gopal Krishna',
        phoneNumber: '+919820154321',
        documentType: 'PRESCRIPTION_E_RX',
        documentNumber: 'RX-2026-08819',
        fileName: 'Prescription_Cardiology_30Aug.pdf',
        fileSizeKb: 245,
        fileUrl: 'https://cdn.docsearch.health/rx/RX-2026-08819.pdf',
        dispatchChannel: 'WHATSAPP_CLOUD_API',
        deliveryStatus: 'DISPATCHED_READ',
        dispatchedAt: new Date(Date.now() - 3500000).toISOString()
      },
      {
        id: 'hdd-2',
        tenantId: tenantDefault,
        patientMrn: 'MRN-2026-9021',
        patientName: 'Gopal Krishna',
        phoneNumber: '+919820154321',
        documentType: 'DIAGNOSTIC_LAB_REPORT',
        documentNumber: 'LAB-2026-99120',
        fileName: 'Lipid_Profile_HbA1c_Report.pdf',
        fileSizeKb: 410,
        fileUrl: 'https://cdn.docsearch.health/lab/LAB-2026-99120.pdf',
        dispatchChannel: 'WHATSAPP_CLOUD_API',
        deliveryStatus: 'DISPATCHED_READ',
        dispatchedAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]);

    // Seed patient profiles
    this.patientProfileStore.set(tenantDefault, [
      {
        id: 'aarogya-1',
        tenantId: tenantDefault,
        patientMrn: 'MRN-2026-9021',
        abhaNumber: '91-4589-2311-0982',
        abhaAddress: 'gopal.krishna@abdm',
        fullName: 'Gopal Krishna',
        mobileNumber: '+919820154321',
        dateOfBirth: '1968-05-14',
        gender: 'MALE',
        bloodGroup: 'B_POSITIVE',
        activePrescriptionsCount: 3,
        upcomingAppointmentsCount: 1,
        totalHealthRecordsCount: 14,
        portalRole: 'PATIENT_PRIMARY'
      }
    ]);

    // Seed queue tokens
    this.queueTokenStore.set(tenantDefault, [
      {
        id: 'lqt-1',
        tenantId: tenantDefault,
        tokenNumber: 'TKN-042',
        patientMrn: 'MRN-2026-9021',
        patientName: 'Gopal Krishna',
        doctorName: 'Dr. Sanjay Gupta',
        departmentName: 'Cardiology OPD Suite',
        roomNumber: 'Room 204 (2nd Floor)',
        currentTokenServing: 'TKN-039',
        estimatedWaitMinutes: 12,
        queueStatus: 'WAITING_IN_LOBBY',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'lqt-2',
        tenantId: tenantDefault,
        tokenNumber: 'TKN-018',
        patientMrn: 'MRN-2026-8819',
        patientName: 'Meenakshi Sundaram',
        doctorName: 'Dr. Vivek Mehra',
        departmentName: 'General Surgery OPD',
        roomNumber: 'Room 108 (1st Floor)',
        currentTokenServing: 'TKN-018',
        estimatedWaitMinutes: 0,
        queueStatus: 'CALLED_TO_ROOM',
        lastUpdated: new Date().toISOString()
      }
    ]);

    // Seed audit traces
    this.auditTraceStore.set(tenantDefault, [
      {
        id: 'wa-tr-1111-1111-4111-8111-111111111101',
        tenantId: tenantDefault,
        traceNumber: 'TRACE-WA-09182',
        action: 'DISPATCH_PRESCRIPTION_PDF',
        entityType: 'WHATSAPP_MESSAGE',
        entityId: 'msg-2',
        entityCode: 'RX-2026-08819',
        actorName: 'WhatsApp Business Cloud API Engine',
        actorRole: 'SYSTEM_BOT',
        justification: 'Automated digital prescription PDF dispatch to verified patient WhatsApp (+91 98201 54321).',
        integrityHash: 'b4e8b01298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852e992',
        timestamp: new Date().toISOString()
      }
    ]);
  }

  // --- Metrics ---
  async getOverviewMetrics(tenantId: string): Promise<WhatsAppOverviewMetricsRecord> {
    const convs = this.conversationStore.get(tenantId) || [];
    const dispatches = this.dispatchStore.get(tenantId) || [];
    const totalToday = convs.length || 148;
    const botHandled = convs.filter((c) => c.botActive).length;
    const botPct = totalToday > 0 ? Number(((botHandled / totalToday) * 100).toFixed(1)) : 91.2;

    return {
      totalConversationsToday: totalToday,
      botHandledInteractionsPct: botPct,
      documentsDispatchedMonth: dispatches.length || 1240,
      appointmentsBookedViaWhatsApp: 312,
      activePortalUsersCount: 1850,
      medicationRefillCompliancePct: 95.6,
      averageBotResponseTimeSec: 1.4,
      patientNpsScore: 92.4
    };
  }

  // --- Conversations ---
  async getConversations(tenantId: string): Promise<WhatsAppConversationThreadRecord[]> {
    return [...(this.conversationStore.get(tenantId) || [])];
  }

  async getConversationById(tenantId: string, id: string): Promise<WhatsAppConversationThreadRecord | undefined> {
    const list = this.conversationStore.get(tenantId) || [];
    return list.find((c) => c.id === id);
  }

  async getConversationByPhone(tenantId: string, phone: string): Promise<WhatsAppConversationThreadRecord | undefined> {
    const list = this.conversationStore.get(tenantId) || [];
    const norm = phone.replace(/\D/g, '');
    return list.find((c) => c.phoneNumber.replace(/\D/g, '') === norm);
  }

  async createConversation(tenantId: string, record: Partial<WhatsAppConversationThreadRecord>): Promise<WhatsAppConversationThreadRecord> {
    const list = this.conversationStore.get(tenantId) || [];
    const created: WhatsAppConversationThreadRecord = {
      id: record.id || `wac_${crypto.randomBytes(6).toString('hex')}`,
      tenantId,
      branchId: record.branchId,
      patientMrn: record.patientMrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: record.patientName || 'Anonymous Patient',
      phoneNumber: record.phoneNumber || '',
      lastMessageSnippet: record.lastMessageSnippet || '',
      unreadCount: record.unreadCount || 0,
      assignedAgent: record.assignedAgent || null,
      botActive: record.botActive !== undefined ? record.botActive : true,
      appointmentId: record.appointmentId,
      lastActivityTimestamp: new Date().toISOString(),
      messages: record.messages || []
    };
    list.unshift(created);
    this.conversationStore.set(tenantId, list);
    return created;
  }

  async addMessage(
    tenantId: string,
    conversationId: string,
    message: Partial<WhatsAppMessageRecord>
  ): Promise<{ conversation: WhatsAppConversationThreadRecord; message: WhatsAppMessageRecord }> {
    const list = this.conversationStore.get(tenantId) || [];
    const conv = list.find((c) => c.id === conversationId);
    if (!conv) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const newMsg: WhatsAppMessageRecord = {
      id: message.id || `msg_${crypto.randomBytes(6).toString('hex')}`,
      conversationId,
      direction: message.direction || 'OUTBOUND_BOT',
      senderPhone: message.senderPhone || 'DOCSEARCH_BOT',
      messageType: message.messageType || 'TEXT_MESSAGE',
      textContent: message.textContent || '',
      mediaUrl: message.mediaUrl || null,
      mediaCaption: message.mediaCaption || null,
      quickReplyOptions: message.quickReplyOptions,
      deliveryStatus: message.deliveryStatus || 'SENT',
      timestamp: new Date().toISOString()
    };

    conv.messages.push(newMsg);
    conv.lastMessageSnippet = newMsg.textContent;
    conv.lastActivityTimestamp = newMsg.timestamp;
    if (newMsg.direction === 'INBOUND_PATIENT') {
      conv.unreadCount += 1;
    }

    return { conversation: conv, message: newMsg };
  }

  async updateConversation(
    tenantId: string,
    conversationId: string,
    updates: Partial<WhatsAppConversationThreadRecord>
  ): Promise<WhatsAppConversationThreadRecord> {
    const list = this.conversationStore.get(tenantId) || [];
    const conv = list.find((c) => c.id === conversationId);
    if (!conv) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    Object.assign(conv, updates, { lastActivityTimestamp: new Date().toISOString() });
    return conv;
  }

  // --- Document Dispatches ---
  async getDocumentDispatches(tenantId: string): Promise<HealthDocumentDispatchRecord[]> {
    return [...(this.dispatchStore.get(tenantId) || [])];
  }

  async createDocumentDispatch(
    tenantId: string,
    record: Partial<HealthDocumentDispatchRecord>
  ): Promise<HealthDocumentDispatchRecord> {
    const list = this.dispatchStore.get(tenantId) || [];
    const created: HealthDocumentDispatchRecord = {
      id: record.id || `hdd_${crypto.randomBytes(6).toString('hex')}`,
      tenantId,
      branchId: record.branchId,
      patientMrn: record.patientMrn || '',
      patientName: record.patientName || '',
      phoneNumber: record.phoneNumber || '',
      documentType: record.documentType || 'PRESCRIPTION_E_RX',
      documentNumber: record.documentNumber || `DOC-${Date.now()}`,
      fileName: record.fileName || 'document.pdf',
      fileSizeKb: record.fileSizeKb || 250,
      fileUrl: record.fileUrl || `https://cdn.docsearch.health/docs/${record.documentNumber || Date.now()}.pdf`,
      dispatchChannel: record.dispatchChannel || 'WHATSAPP_CLOUD_API',
      deliveryStatus: record.deliveryStatus || 'DISPATCHED_READ',
      dispatchedAt: new Date().toISOString()
    };
    list.unshift(created);
    this.dispatchStore.set(tenantId, list);
    return created;
  }

  // --- Patient Portal Profiles ---
  async getPatientPortalProfile(tenantId: string, patientMrn: string): Promise<AarogyaPatientProfileRecord | undefined> {
    const list = this.patientProfileStore.get(tenantId) || [];
    return list.find((p) => p.patientMrn === patientMrn);
  }

  async upsertPatientProfile(
    tenantId: string,
    profile: Partial<AarogyaPatientProfileRecord> & { patientMrn: string }
  ): Promise<AarogyaPatientProfileRecord> {
    const list = this.patientProfileStore.get(tenantId) || [];
    const existing = list.find((p) => p.patientMrn === profile.patientMrn);
    if (existing) {
      Object.assign(existing, profile);
      return existing;
    }
    const created: AarogyaPatientProfileRecord = {
      id: profile.id || `aarogya_${crypto.randomBytes(6).toString('hex')}`,
      tenantId,
      patientMrn: profile.patientMrn,
      abhaNumber: profile.abhaNumber,
      abhaAddress: profile.abhaAddress,
      fullName: profile.fullName || 'Patient',
      mobileNumber: profile.mobileNumber || '',
      dateOfBirth: profile.dateOfBirth || '1990-01-01',
      gender: profile.gender || 'OTHER',
      bloodGroup: profile.bloodGroup || 'UNKNOWN',
      activePrescriptionsCount: profile.activePrescriptionsCount || 0,
      upcomingAppointmentsCount: profile.upcomingAppointmentsCount || 0,
      totalHealthRecordsCount: profile.totalHealthRecordsCount || 0,
      portalRole: profile.portalRole || 'PATIENT_PRIMARY'
    };
    list.unshift(created);
    this.patientProfileStore.set(tenantId, list);
    return created;
  }

  // --- Queue Tokens ---
  async getLiveQueueTokens(tenantId: string): Promise<LiveQueueTokenRecord[]> {
    return [...(this.queueTokenStore.get(tenantId) || [])];
  }

  async updateQueueToken(
    tenantId: string,
    tokenId: string,
    updates: Partial<LiveQueueTokenRecord>
  ): Promise<LiveQueueTokenRecord> {
    const list = this.queueTokenStore.get(tenantId) || [];
    const token = list.find((t) => t.id === tokenId || t.tokenNumber === tokenId);
    if (!token) {
      throw new Error(`Token not found: ${tokenId}`);
    }
    Object.assign(token, updates, { lastUpdated: new Date().toISOString() });
    return token;
  }

  // --- Medication Reminders ---
  async getMedicationReminders(tenantId: string): Promise<MedicationReminderRecord[]> {
    return [...(this.reminderStore.get(tenantId) || [])];
  }

  async createMedicationReminder(
    tenantId: string,
    reminder: Partial<MedicationReminderRecord>
  ): Promise<MedicationReminderRecord> {
    const list = this.reminderStore.get(tenantId) || [];
    const created: MedicationReminderRecord = {
      id: reminder.id || `rem_${crypto.randomBytes(6).toString('hex')}`,
      tenantId,
      patientMrn: reminder.patientMrn || '',
      phoneNumber: reminder.phoneNumber || '',
      drugName: reminder.drugName || '',
      dosageInstructions: reminder.dosageInstructions || '',
      reminderStatus: 'SENT',
      scheduledTime: reminder.scheduledTime || new Date().toISOString(),
      sentAt: new Date().toISOString()
    };
    list.unshift(created);
    this.reminderStore.set(tenantId, list);
    return created;
  }

  // --- Audit Traces ---
  async createAuditTrace(tenantId: string, trace: Omit<WhatsAppAuditTraceRecord, 'id' | 'tenantId' | 'timestamp' | 'integrityHash'>): Promise<WhatsAppAuditTraceRecord> {
    const list = this.auditTraceStore.get(tenantId) || [];
    const id = `wa-tr-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
    const payloadToHash = `${tenantId}:${trace.traceNumber}:${trace.action}:${trace.entityType}:${trace.entityId}:${timestamp}`;
    const integrityHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const created: WhatsAppAuditTraceRecord = {
      id,
      tenantId,
      ...trace,
      integrityHash,
      timestamp
    };
    list.unshift(created);
    this.auditTraceStore.set(tenantId, list);
    return created;
  }

  async getAuditTraces(tenantId: string): Promise<WhatsAppAuditTraceRecord[]> {
    return [...(this.auditTraceStore.get(tenantId) || [])];
  }
}

export const whatsAppEngagementRepository = new WhatsAppEngagementRepository();
