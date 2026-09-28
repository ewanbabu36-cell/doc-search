import type {
  WhatsAppConversationThreadDto,
  HealthDocumentDispatchDto,
  AarogyaPatientProfileDto,
  LiveQueueTokenDto,
  WhatsAppOverviewMetricsDto,
  WhatsAppAuditTraceDto
} from '@docsearch/api-contracts';

export const mockWhatsAppOverviewMetrics: WhatsAppOverviewMetricsDto = {
  totalConversationsToday: 0,
  botHandledInteractionsPct: 0,
  documentsDispatchedMonth: 0,
  appointmentsBookedViaWhatsApp: 0,
  activePortalUsersCount: 0,
  medicationRefillCompliancePct: 0,
  averageBotResponseTimeSec: 0,
  patientNpsScore: 0
};

export const mockWhatsAppConversations: WhatsAppConversationThreadDto[] = [];

export const mockDocumentDispatches: HealthDocumentDispatchDto[] = [];

export const mockAarogyaPatientProfile: AarogyaPatientProfileDto = {
  id: '00000000-0000-0000-0000-000000000000',
  patientMrn: '',
  abhaNumber: '',
  abhaAddress: '',
  fullName: '',
  mobileNumber: '',
  dateOfBirth: '',
  gender: 'UNKNOWN',
  bloodGroup: '',
  activePrescriptionsCount: 0,
  upcomingAppointmentsCount: 0,
  totalHealthRecordsCount: 0,
  portalRole: 'PATIENT_PRIMARY'
};

export const mockLiveQueueTokens: LiveQueueTokenDto[] = [];

export const mockWhatsAppAuditTraces: WhatsAppAuditTraceDto[] = [];
