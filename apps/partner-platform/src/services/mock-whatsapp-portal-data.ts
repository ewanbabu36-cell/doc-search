import type {
  WhatsAppConversationThreadDto,
  HealthDocumentDispatchDto,
  AarogyaPatientProfileDto,
  LiveQueueTokenDto,
  WhatsAppOverviewMetricsDto,
  WhatsAppAuditTraceDto
} from '@docsearch/api-contracts';

export const mockWhatsAppOverviewMetrics: WhatsAppOverviewMetricsDto = {
  totalConversationsToday: 148,
  botHandledInteractionsPct: 91.2,
  documentsDispatchedMonth: 1240,
  appointmentsBookedViaWhatsApp: 312,
  activePortalUsersCount: 1850,
  medicationRefillCompliancePct: 95.6,
  averageBotResponseTimeSec: 1.4,
  patientNpsScore: 92.4
};

export const mockWhatsAppConversations: WhatsAppConversationThreadDto[] = [
  {
    id: 'wac-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    phoneNumber: '+91 98201 54321',
    lastMessageSnippet: 'Namaste Gopal ji, your Digital Prescription RX-2026-08819 is ready. Click below to download PDF.',
    unreadCount: 0,
    assignedAgent: null,
    botActive: true,
    lastActivityTimestamp: '2026-08-30T07:05:00.000Z',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'wac-1111-1111-4111-8111-111111111101',
        direction: 'INBOUND_PATIENT',
        senderPhone: '+91 98201 54321',
        messageType: 'TEXT_MESSAGE',
        textContent: 'Hi, please send my latest blood test report and prescription from Dr. Sanjay Gupta.',
        mediaUrl: null,
        mediaCaption: null,
        quickReplyOptions: [],
        deliveryStatus: 'READ',
        timestamp: '2026-08-30T07:04:00.000Z'
      },
      {
        id: 'msg-2',
        conversationId: 'wac-1111-1111-4111-8111-111111111101',
        direction: 'OUTBOUND_BOT',
        senderPhone: 'DOC_SEARCH_WHATSAPP_BOT',
        messageType: 'MEDIA_DOCUMENT_PDF',
        textContent: 'Namaste Gopal ji, your Digital Prescription RX-2026-08819 is ready. Click below to download PDF.',
        mediaUrl: 'https://storage.docsearch.health/rx/RX-2026-08819.pdf',
        mediaCaption: 'Prescription_Dr_Sanjay_Gupta_30Aug.pdf (240 KB)',
        quickReplyOptions: ['View Lab Reports', 'Track OPD Queue Token', 'Book Follow-Up'],
        deliveryStatus: 'READ',
        timestamp: '2026-08-30T07:05:00.000Z'
      }
    ]
  },
  {
    id: 'wac-1111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    phoneNumber: '+91 98402 91823',
    lastMessageSnippet: 'Patient requested live receptionist for insurance pre-auth assistance.',
    unreadCount: 1,
    assignedAgent: 'Pooja Nair (Front Desk Reception)',
    botActive: false,
    lastActivityTimestamp: '2026-08-30T06:58:00.000Z',
    messages: [
      {
        id: 'msg-3',
        conversationId: 'wac-1111-1111-4111-8111-111111111102',
        direction: 'INBOUND_PATIENT',
        senderPhone: '+91 98402 91823',
        messageType: 'TEXT_MESSAGE',
        textContent: 'I need to speak to someone regarding Star Health insurance cashless approval.',
        mediaUrl: null,
        mediaCaption: null,
        quickReplyOptions: [],
        deliveryStatus: 'DELIVERED',
        timestamp: '2026-08-30T06:58:00.000Z'
      }
    ]
  }
];

export const mockDocumentDispatches: HealthDocumentDispatchDto[] = [
  {
    id: 'hdd-1',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    phoneNumber: '+91 98201 54321',
    documentType: 'PRESCRIPTION_E_RX',
    documentNumber: 'RX-2026-08819',
    fileName: 'Prescription_Cardiology_30Aug.pdf',
    fileSizeKb: 245,
    dispatchChannel: 'WHATSAPP_CLOUD_API',
    deliveryStatus: 'DISPATCHED_READ',
    dispatchedAt: '2026-08-30T07:05:00.000Z'
  },
  {
    id: 'hdd-2',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    phoneNumber: '+91 98201 54321',
    documentType: 'DIAGNOSTIC_LAB_REPORT',
    documentNumber: 'LAB-2026-99120',
    fileName: 'Lipid_Profile_HbA1c_Report.pdf',
    fileSizeKb: 410,
    dispatchChannel: 'WHATSAPP_CLOUD_API',
    deliveryStatus: 'DISPATCHED_READ',
    dispatchedAt: '2026-08-30T06:30:00.000Z'
  },
  {
    id: 'hdd-3',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    phoneNumber: '+91 98402 91823',
    documentType: 'DISCHARGE_SUMMARY',
    documentNumber: 'DIS-2026-00412',
    fileName: 'Inpatient_Discharge_Summary_Signed.pdf',
    fileSizeKb: 890,
    dispatchChannel: 'PATIENT_PORTAL_VAULT',
    deliveryStatus: 'DELIVERED',
    dispatchedAt: '2026-08-30T05:15:00.000Z'
  }
];

export const mockAarogyaPatientProfile: AarogyaPatientProfileDto = {
  id: 'aarogya-1',
  patientMrn: 'MRN-2026-9021',
  abhaNumber: '91-4589-2311-0982',
  abhaAddress: 'gopal.krishna@abdm',
  fullName: 'Gopal Krishna',
  mobileNumber: '+91 98201 54321',
  dateOfBirth: '1968-05-14',
  gender: 'MALE',
  bloodGroup: 'B_POSITIVE',
  activePrescriptionsCount: 3,
  upcomingAppointmentsCount: 1,
  totalHealthRecordsCount: 14,
  portalRole: 'PATIENT_PRIMARY'
};

export const mockLiveQueueTokens: LiveQueueTokenDto[] = [
  {
    id: 'lqt-1',
    tokenNumber: 'TKN-042',
    patientMrn: 'MRN-2026-9021',
    patientName: 'Gopal Krishna',
    doctorName: 'Dr. Sanjay Gupta',
    departmentName: 'Cardiology OPD Suite',
    roomNumber: 'Room 204 (2nd Floor)',
    currentTokenServing: 'TKN-039',
    estimatedWaitMinutes: 12,
    queueStatus: 'WAITING_IN_LOBBY',
    lastUpdated: '2026-08-30T07:10:00.000Z'
  },
  {
    id: 'lqt-2',
    tokenNumber: 'TKN-018',
    patientMrn: 'MRN-2026-8819',
    patientName: 'Meenakshi Sundaram',
    doctorName: 'Dr. Vivek Mehra',
    departmentName: 'General Surgery OPD',
    roomNumber: 'Room 108 (1st Floor)',
    currentTokenServing: 'TKN-018',
    estimatedWaitMinutes: 0,
    queueStatus: 'CALLED_TO_ROOM',
    lastUpdated: '2026-08-30T07:08:00.000Z'
  }
];

export const mockWhatsAppAuditTraces: WhatsAppAuditTraceDto[] = [
  {
    id: 'wa-tr-1111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceNumber: 'TRACE-WA-09182',
    action: 'DISPATCH_PRESCRIPTION_PDF',
    entityType: 'WHATSAPP_MESSAGE',
    entityId: 'msg-2',
    entityCode: 'RX-2026-08819',
    actorName: 'WhatsApp Business Cloud API Engine',
    actorRole: 'SYSTEM_BOT',
    justification: 'Automated digital prescription PDF dispatch to verified patient WhatsApp (+91 98201 54321).',
    integrityHash: 'b4e8b01298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852e992',
    timestamp: '2026-08-30T07:05:00.000Z'
  }
];
