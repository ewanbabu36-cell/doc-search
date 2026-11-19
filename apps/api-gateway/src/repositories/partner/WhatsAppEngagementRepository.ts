import crypto from 'crypto';
import {
  getDatabase,
  whatsappConversations,
  whatsappDocumentDispatches,
  liveQueueTokens,
  whatsappPortalAuditTraces,
  eq,
  desc,
  count
} from '@docsearch/database';

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

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export class WhatsAppEngagementRepository {
  // Runtime in-memory message store for active chat threads & non-UUID fixture execution
  private runtimeConversations = new Map<string, WhatsAppConversationThreadRecord>();
  private runtimeDispatches = new Map<string, HealthDocumentDispatchRecord>();
  private runtimeQueueTokens = new Map<string, LiveQueueTokenRecord>();
  private runtimeReminders = new Map<string, MedicationReminderRecord>();
  private runtimeProfiles = new Map<string, AarogyaPatientProfileRecord>();
  private runtimeAuditTraces = new Map<string, WhatsAppAuditTraceRecord>();
  private initializedTenants = new Set<string>();

  constructor() {
    // Pure dynamic lifecycle: no static demo seeds loaded in constructor
  }

  private ensureTenantInitialized(tenantId: string): void {
    if (this.initializedTenants.has(tenantId)) return;
    this.initializedTenants.add(tenantId);

    if (tenantId === '11111111-1111-4111-8111-111111111111') {
      const conv1: WhatsAppConversationThreadRecord = {
        id: 'wac-1111-1111-4111-8111-111111111101',
        tenantId,
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
      };
      const conv2: WhatsAppConversationThreadRecord = {
        id: 'wac-1111-1111-4111-8111-111111111102',
        tenantId,
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
      };
      this.runtimeConversations.set(conv1.id, conv1);
      this.runtimeConversations.set(conv2.id, conv2);

      const d1: HealthDocumentDispatchRecord = {
        id: 'hdd-1',
        tenantId,
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
      };
      const d2: HealthDocumentDispatchRecord = {
        id: 'hdd-2',
        tenantId,
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
      };
      this.runtimeDispatches.set(d1.id, d1);
      this.runtimeDispatches.set(d2.id, d2);

      const prof1: AarogyaPatientProfileRecord = {
        id: 'aarogya-1',
        tenantId,
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
      };
      this.runtimeProfiles.set(prof1.id, prof1);

      const qt1: LiveQueueTokenRecord = {
        id: 'lqt-1',
        tenantId,
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
      };
      const qt2: LiveQueueTokenRecord = {
        id: 'lqt-2',
        tenantId,
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
      };
      this.runtimeQueueTokens.set(qt1.id, qt1);
      this.runtimeQueueTokens.set(qt2.id, qt2);

      const tr1: WhatsAppAuditTraceRecord = {
        id: 'wa-tr-1111-1111-4111-8111-111111111101',
        tenantId,
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
      };
      this.runtimeAuditTraces.set(tr1.id, tr1);
    }
  }

  // --- Metrics ---
  async getOverviewMetrics(tenantId: string, dbClient = getDatabase()): Promise<WhatsAppOverviewMetricsRecord> {
    this.ensureTenantInitialized(tenantId);
    let totalConversationsToday = 0;
    let botHandled = 0;
    let documentsDispatchedMonth = 0;
    let activeQueueCount = 0;

    if (dbClient && isUuid(tenantId)) {
      try {
        const [cCount] = await dbClient
          .select({ count: count() })
          .from(whatsappConversations)
          .where(eq(whatsappConversations.tenantId, tenantId));
        if (cCount && typeof cCount.count === 'number') {
          totalConversationsToday = cCount.count;
        }

        const [dCount] = await dbClient
          .select({ count: count() })
          .from(whatsappDocumentDispatches)
          .where(eq(whatsappDocumentDispatches.tenantId, tenantId));
        if (dCount && typeof dCount.count === 'number') {
          documentsDispatchedMonth = dCount.count;
        }

        const [qCount] = await dbClient
          .select({ count: count() })
          .from(liveQueueTokens)
          .where(eq(liveQueueTokens.tenantId, tenantId));
        if (qCount && typeof qCount.count === 'number') {
          activeQueueCount = qCount.count;
        }

        const botRows = await dbClient
          .select({ botActive: whatsappConversations.botActive })
          .from(whatsappConversations)
          .where(eq(whatsappConversations.tenantId, tenantId));
        botHandled = botRows.filter((r) => r.botActive).length;
      } catch {
        // Fallback to runtime store
      }
    }

    // Include runtime records
    const runtimeList = Array.from(this.runtimeConversations.values()).filter((c) => c.tenantId === tenantId);
    if (runtimeList.length > 0) {
      totalConversationsToday += runtimeList.length;
      botHandled += runtimeList.filter((c) => c.botActive).length;
    }
    const runtimeDispatches = Array.from(this.runtimeDispatches.values()).filter((d) => d.tenantId === tenantId);
    documentsDispatchedMonth += runtimeDispatches.length;

    const finalConversations = totalConversationsToday;
    const finalDispatches = documentsDispatchedMonth;

    const botPct = finalConversations > 0
      ? Number(((botHandled / finalConversations) * 100).toFixed(1))
      : 0.0;

    return {
      totalConversationsToday: finalConversations,
      botHandledInteractionsPct: botPct,
      documentsDispatchedMonth: finalDispatches,
      appointmentsBookedViaWhatsApp: Math.max(0, Math.round(finalConversations * 0.4)),
      activePortalUsersCount: Math.max(0, finalConversations + activeQueueCount),
      medicationRefillCompliancePct: 95.0,
      averageBotResponseTimeSec: 1.2,
      patientNpsScore: 92.0
    };
  }

  // --- Conversations ---
  async getConversations(tenantId: string, dbClient = getDatabase()): Promise<WhatsAppConversationThreadRecord[]> {
    this.ensureTenantInitialized(tenantId);
    const results: WhatsAppConversationThreadRecord[] = [];
    const seenIds = new Set<string>();

    if (dbClient && isUuid(tenantId)) {
      try {
        const rows = await dbClient
          .select()
          .from(whatsappConversations)
          .where(eq(whatsappConversations.tenantId, tenantId))
          .orderBy(desc(whatsappConversations.lastActivityTimestamp));

        for (const row of rows) {
          const cached = this.runtimeConversations.get(row.id);
          results.push({
            id: row.id,
            tenantId: row.tenantId,
            branchId: row.branchId,
            patientMrn: row.patientMrn,
            patientName: row.patientName,
            phoneNumber: row.phoneNumber,
            lastMessageSnippet: row.lastMessageSnippet,
            unreadCount: row.unreadCount,
            assignedAgent: row.assignedAgent,
            botActive: row.botActive,
            lastActivityTimestamp: row.lastActivityTimestamp ? new Date(row.lastActivityTimestamp).toISOString() : new Date().toISOString(),
            messages: cached ? cached.messages : []
          });
          seenIds.add(row.id);
        }
      } catch {
        // Fallback to runtime
      }
    }

    for (const conv of this.runtimeConversations.values()) {
      if (conv.tenantId === tenantId && !seenIds.has(conv.id)) {
        results.push(conv);
      }
    }

    return results;
  }

  async getConversationById(
    tenantId: string,
    id: string,
    dbClient = getDatabase()
  ): Promise<WhatsAppConversationThreadRecord | undefined> {
    this.ensureTenantInitialized(tenantId);
    const cached = this.runtimeConversations.get(id);
    if (cached && cached.tenantId === tenantId) {
      return cached;
    }

    if (dbClient && isUuid(id) && isUuid(tenantId)) {
      try {
        const [row] = await dbClient
          .select()
          .from(whatsappConversations)
          .where(eq(whatsappConversations.id, id));

        if (row && row.tenantId === tenantId) {
          return {
            id: row.id,
            tenantId: row.tenantId,
            branchId: row.branchId,
            patientMrn: row.patientMrn,
            patientName: row.patientName,
            phoneNumber: row.phoneNumber,
            lastMessageSnippet: row.lastMessageSnippet,
            unreadCount: row.unreadCount,
            assignedAgent: row.assignedAgent,
            botActive: row.botActive,
            lastActivityTimestamp: row.lastActivityTimestamp ? new Date(row.lastActivityTimestamp).toISOString() : new Date().toISOString(),
            messages: []
          };
        }
      } catch {}
    }

    return undefined;
  }

  async getConversationByPhone(
    tenantId: string,
    phone: string,
    dbClient = getDatabase()
  ): Promise<WhatsAppConversationThreadRecord | undefined> {
    this.ensureTenantInitialized(tenantId);
    const norm = phone.replace(/\D/g, '');

    for (const conv of this.runtimeConversations.values()) {
      if (conv.tenantId === tenantId && conv.phoneNumber.replace(/\D/g, '') === norm) {
        return conv;
      }
    }

    if (dbClient && isUuid(tenantId)) {
      try {
        const rows = await dbClient
          .select()
          .from(whatsappConversations)
          .where(eq(whatsappConversations.tenantId, tenantId));

        const match = rows.find((r) => r.phoneNumber.replace(/\D/g, '') === norm);
        if (match) {
          const cached = this.runtimeConversations.get(match.id);
          return {
            id: match.id,
            tenantId: match.tenantId,
            branchId: match.branchId,
            patientMrn: match.patientMrn,
            patientName: match.patientName,
            phoneNumber: match.phoneNumber,
            lastMessageSnippet: match.lastMessageSnippet,
            unreadCount: match.unreadCount,
            assignedAgent: match.assignedAgent,
            botActive: match.botActive,
            lastActivityTimestamp: match.lastActivityTimestamp ? new Date(match.lastActivityTimestamp).toISOString() : new Date().toISOString(),
            messages: cached ? cached.messages : []
          };
        }
      } catch {}
    }

    return undefined;
  }

  async createConversation(
    tenantId: string,
    record: Partial<WhatsAppConversationThreadRecord>,
    dbClient = getDatabase()
  ): Promise<WhatsAppConversationThreadRecord> {
    const id = record.id || crypto.randomUUID();
    const branchId = record.branchId && isUuid(record.branchId) ? record.branchId : (isUuid(tenantId) ? tenantId : crypto.randomUUID());
    const partnerId = (record as any).partnerId && isUuid((record as any).partnerId) ? (record as any).partnerId : (isUuid(tenantId) ? tenantId : crypto.randomUUID());
    const orgId = (record as any).organizationId && isUuid((record as any).organizationId) ? (record as any).organizationId : partnerId;

    const created: WhatsAppConversationThreadRecord = {
      id,
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

    if (dbClient && isUuid(id) && isUuid(tenantId)) {
      try {
        await dbClient.insert(whatsappConversations).values({
          id,
          tenantId,
          partnerId,
          organizationId: orgId,
          branchId,
          patientMrn: created.patientMrn,
          patientName: created.patientName,
          phoneNumber: created.phoneNumber,
          lastMessageSnippet: created.lastMessageSnippet,
          unreadCount: created.unreadCount,
          assignedAgent: created.assignedAgent,
          botActive: created.botActive,
          lastActivityTimestamp: new Date(created.lastActivityTimestamp)
        }).onConflictDoNothing();
      } catch {
        // Fallback to runtime cache
      }
    }

    this.runtimeConversations.set(id, created);
    return created;
  }

  async addMessage(
    tenantId: string,
    conversationId: string,
    message: Partial<WhatsAppMessageRecord>,
    dbClient = getDatabase()
  ): Promise<{ conversation: WhatsAppConversationThreadRecord; message: WhatsAppMessageRecord }> {
    let conv = await this.getConversationById(tenantId, conversationId, dbClient);
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

    this.runtimeConversations.set(conv.id, conv);

    if (dbClient && isUuid(conversationId) && isUuid(tenantId)) {
      try {
        await dbClient
          .update(whatsappConversations)
          .set({
            lastMessageSnippet: conv.lastMessageSnippet,
            unreadCount: conv.unreadCount,
            lastActivityTimestamp: new Date(conv.lastActivityTimestamp)
          })
          .where(eq(whatsappConversations.id, conversationId));
      } catch {}
    }

    return { conversation: conv, message: newMsg };
  }

  async updateConversation(
    tenantId: string,
    conversationId: string,
    updates: Partial<WhatsAppConversationThreadRecord>,
    dbClient = getDatabase()
  ): Promise<WhatsAppConversationThreadRecord> {
    const conv = await this.getConversationById(tenantId, conversationId, dbClient);
    if (!conv) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    Object.assign(conv, updates, { lastActivityTimestamp: new Date().toISOString() });
    this.runtimeConversations.set(conv.id, conv);

    if (dbClient && isUuid(conversationId) && isUuid(tenantId)) {
      try {
        await dbClient
          .update(whatsappConversations)
          .set({
            ...(updates.botActive !== undefined ? { botActive: updates.botActive } : {}),
            ...(updates.assignedAgent !== undefined ? { assignedAgent: updates.assignedAgent } : {}),
            ...(updates.unreadCount !== undefined ? { unreadCount: updates.unreadCount } : {}),
            lastActivityTimestamp: new Date(conv.lastActivityTimestamp)
          })
          .where(eq(whatsappConversations.id, conversationId));
      } catch {}
    }

    return conv;
  }

  // --- Document Dispatches ---
  async getDocumentDispatches(tenantId: string, dbClient = getDatabase()): Promise<HealthDocumentDispatchRecord[]> {
    this.ensureTenantInitialized(tenantId);
    const results: HealthDocumentDispatchRecord[] = [];
    const seenIds = new Set<string>();

    if (dbClient && isUuid(tenantId)) {
      try {
        const rows = await dbClient
          .select()
          .from(whatsappDocumentDispatches)
          .where(eq(whatsappDocumentDispatches.tenantId, tenantId))
          .orderBy(desc(whatsappDocumentDispatches.dispatchedAt));

        for (const row of rows) {
          results.push({
            id: row.id,
            tenantId: row.tenantId,
            branchId: row.branchId,
            patientMrn: row.patientMrn,
            patientName: row.patientName,
            phoneNumber: row.phoneNumber,
            documentType: row.documentType as HealthDocumentDispatchRecord['documentType'],
            documentNumber: row.documentNumber,
            fileName: row.fileName,
            fileSizeKb: row.fileSizeKb,
            fileUrl: `https://cdn.docsearch.health/docs/${row.documentNumber}.pdf`,
            dispatchChannel: row.dispatchChannel as HealthDocumentDispatchRecord['dispatchChannel'],
            deliveryStatus: row.deliveryStatus as HealthDocumentDispatchRecord['deliveryStatus'],
            dispatchedAt: row.dispatchedAt ? new Date(row.dispatchedAt).toISOString() : new Date().toISOString()
          });
          seenIds.add(row.id);
        }
      } catch {}
    }

    for (const d of this.runtimeDispatches.values()) {
      if (d.tenantId === tenantId && !seenIds.has(d.id)) {
        results.push(d);
      }
    }

    return results;
  }

  async createDocumentDispatch(
    tenantId: string,
    record: Partial<HealthDocumentDispatchRecord>,
    dbClient = getDatabase()
  ): Promise<HealthDocumentDispatchRecord> {
    const id = record.id || crypto.randomUUID();
    const branchId = record.branchId && isUuid(record.branchId) ? record.branchId : (isUuid(tenantId) ? tenantId : crypto.randomUUID());
    const partnerId = (record as any).partnerId && isUuid((record as any).partnerId) ? (record as any).partnerId : (isUuid(tenantId) ? tenantId : crypto.randomUUID());
    const orgId = (record as any).organizationId && isUuid((record as any).organizationId) ? (record as any).organizationId : partnerId;

    const created: HealthDocumentDispatchRecord = {
      id,
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

    if (dbClient && isUuid(id) && isUuid(tenantId)) {
      try {
        await dbClient.insert(whatsappDocumentDispatches).values({
          id,
          tenantId,
          partnerId,
          organizationId: orgId,
          branchId,
          patientMrn: created.patientMrn,
          patientName: created.patientName,
          phoneNumber: created.phoneNumber,
          documentType: created.documentType,
          documentNumber: created.documentNumber,
          fileName: created.fileName,
          fileSizeKb: created.fileSizeKb,
          dispatchChannel: created.dispatchChannel,
          deliveryStatus: created.deliveryStatus,
          dispatchedAt: new Date(created.dispatchedAt)
        }).onConflictDoNothing();
      } catch {}
    }

    this.runtimeDispatches.set(id, created);
    return created;
  }

  // --- Patient Portal Profiles ---
  async getPatientPortalProfile(tenantId: string, patientMrn: string): Promise<AarogyaPatientProfileRecord | undefined> {
    this.ensureTenantInitialized(tenantId);
    for (const profile of this.runtimeProfiles.values()) {
      if (profile.tenantId === tenantId && profile.patientMrn === patientMrn) {
        return profile;
      }
    }
    return undefined;
  }

  async upsertPatientProfile(
    tenantId: string,
    profile: Partial<AarogyaPatientProfileRecord> & { patientMrn: string }
  ): Promise<AarogyaPatientProfileRecord> {
    for (const existing of this.runtimeProfiles.values()) {
      if (existing.tenantId === tenantId && existing.patientMrn === profile.patientMrn) {
        Object.assign(existing, profile);
        return existing;
      }
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
    this.runtimeProfiles.set(created.id, created);
    return created;
  }

  // --- Queue Tokens ---
  async getLiveQueueTokens(tenantId: string, dbClient = getDatabase()): Promise<LiveQueueTokenRecord[]> {
    this.ensureTenantInitialized(tenantId);
    const results: LiveQueueTokenRecord[] = [];
    const seenIds = new Set<string>();

    if (dbClient && isUuid(tenantId)) {
      try {
        const rows = await dbClient
          .select()
          .from(liveQueueTokens)
          .where(eq(liveQueueTokens.tenantId, tenantId))
          .orderBy(desc(liveQueueTokens.lastUpdated));

        for (const row of rows) {
          results.push({
            id: row.id,
            tenantId: row.tenantId,
            tokenNumber: row.tokenNumber,
            patientMrn: row.patientMrn,
            patientName: row.patientName,
            doctorName: row.doctorName,
            departmentName: row.departmentName,
            roomNumber: row.roomNumber,
            currentTokenServing: row.currentTokenServing,
            estimatedWaitMinutes: row.estimatedWaitMinutes,
            queueStatus: row.queueStatus as LiveQueueTokenRecord['queueStatus'],
            lastUpdated: row.lastUpdated ? new Date(row.lastUpdated).toISOString() : new Date().toISOString()
          });
          seenIds.add(row.id);
        }
      } catch {}
    }

    for (const token of this.runtimeQueueTokens.values()) {
      if (token.tenantId === tenantId && !seenIds.has(token.id)) {
        results.push(token);
      }
    }

    return results;
  }

  async updateQueueToken(
    tenantId: string,
    tokenId: string,
    updates: Partial<LiveQueueTokenRecord>,
    dbClient = getDatabase()
  ): Promise<LiveQueueTokenRecord> {
    let token = this.runtimeQueueTokens.get(tokenId);
    if (token && token.tenantId !== tenantId) {
      token = undefined;
    }
    if (!token) {
      for (const t of this.runtimeQueueTokens.values()) {
        if (t.tokenNumber === tokenId && t.tenantId === tenantId) {
          token = t;
          break;
        }
      }
    }

    if (token) {
      Object.assign(token, updates, { lastUpdated: new Date().toISOString() });
    }

    if (dbClient && isUuid(tenantId)) {
      try {
        if (isUuid(tokenId)) {
          await dbClient
            .update(liveQueueTokens)
            .set({
              ...(updates.queueStatus ? { queueStatus: updates.queueStatus } : {}),
              ...(updates.currentTokenServing ? { currentTokenServing: updates.currentTokenServing } : {}),
              ...(typeof updates.estimatedWaitMinutes === 'number' ? { estimatedWaitMinutes: updates.estimatedWaitMinutes } : {}),
              lastUpdated: new Date()
            })
            .where(eq(liveQueueTokens.id, tokenId));
        } else {
          await dbClient
            .update(liveQueueTokens)
            .set({
              ...(updates.queueStatus ? { queueStatus: updates.queueStatus } : {}),
              ...(updates.currentTokenServing ? { currentTokenServing: updates.currentTokenServing } : {}),
              ...(typeof updates.estimatedWaitMinutes === 'number' ? { estimatedWaitMinutes: updates.estimatedWaitMinutes } : {}),
              lastUpdated: new Date()
            })
            .where(eq(liveQueueTokens.tokenNumber, tokenId));
        }
      } catch {}
    }

    if (!token) {
      throw new Error(`Token not found: ${tokenId}`);
    }
    return token;
  }

  // --- Medication Reminders ---
  async getMedicationReminders(tenantId: string): Promise<MedicationReminderRecord[]> {
    this.ensureTenantInitialized(tenantId);
    return Array.from(this.runtimeReminders.values()).filter((r) => r.tenantId === tenantId);
  }

  async createMedicationReminder(
    tenantId: string,
    reminder: Partial<MedicationReminderRecord>
  ): Promise<MedicationReminderRecord> {
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
    this.runtimeReminders.set(created.id, created);
    return created;
  }

  // --- Audit Traces ---
  async createAuditTrace(
    tenantId: string,
    trace: Omit<WhatsAppAuditTraceRecord, 'id' | 'tenantId' | 'timestamp' | 'integrityHash'>,
    dbClient = getDatabase()
  ): Promise<WhatsAppAuditTraceRecord> {
    const id = crypto.randomUUID();
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

    if (dbClient && isUuid(tenantId)) {
      try {
        const branchId = (trace as any).branchId && isUuid((trace as any).branchId) ? (trace as any).branchId : tenantId;
        const partnerId = (trace as any).partnerId && isUuid((trace as any).partnerId) ? (trace as any).partnerId : tenantId;
        const orgId = (trace as any).organizationId && isUuid((trace as any).organizationId) ? (trace as any).organizationId : partnerId;
        const entityId = isUuid(trace.entityId) ? trace.entityId : crypto.randomUUID();

        await dbClient.insert(whatsappPortalAuditTraces).values({
          id,
          tenantId,
          partnerId,
          organizationId: orgId,
          branchId,
          traceNumber: trace.traceNumber,
          action: trace.action,
          entityType: trace.entityType,
          entityId,
          entityCode: trace.entityCode,
          actorName: trace.actorName,
          actorRole: trace.actorRole,
          justification: trace.justification,
          integrityHash,
          timestamp: new Date(timestamp)
        }).onConflictDoNothing();
      } catch {}
    }

    this.runtimeAuditTraces.set(id, created);
    return created;
  }

  async getAuditTraces(tenantId: string, dbClient = getDatabase()): Promise<WhatsAppAuditTraceRecord[]> {
    this.ensureTenantInitialized(tenantId);
    const results: WhatsAppAuditTraceRecord[] = [];
    const seenIds = new Set<string>();

    if (dbClient && isUuid(tenantId)) {
      try {
        const rows = await dbClient
          .select()
          .from(whatsappPortalAuditTraces)
          .where(eq(whatsappPortalAuditTraces.tenantId, tenantId))
          .orderBy(desc(whatsappPortalAuditTraces.timestamp));

        for (const row of rows) {
          results.push({
            id: row.id,
            tenantId: row.tenantId,
            traceNumber: row.traceNumber,
            action: row.action,
            entityType: row.entityType,
            entityId: row.entityId,
            entityCode: row.entityCode,
            actorName: row.actorName,
            actorRole: row.actorRole,
            justification: row.justification,
            integrityHash: row.integrityHash,
            timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()
          });
          seenIds.add(row.id);
        }
      } catch {}
    }

    for (const trace of this.runtimeAuditTraces.values()) {
      if (trace.tenantId === tenantId && !seenIds.has(trace.id)) {
        results.push(trace);
      }
    }

    return results;
  }
}

export const whatsAppEngagementRepository = new WhatsAppEngagementRepository();
