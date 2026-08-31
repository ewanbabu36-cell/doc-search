import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const WhatsAppMessageDirectionEnum = z.enum([
  'INBOUND_PATIENT',
  'OUTBOUND_BOT',
  'OUTBOUND_AGENT'
]);
export type WhatsAppMessageDirection = z.infer<typeof WhatsAppMessageDirectionEnum>;

export const WhatsAppMessageTypeEnum = z.enum([
  'INTERACTIVE_BUTTONS',
  'INTERACTIVE_LIST',
  'TEXT_MESSAGE',
  'MEDIA_DOCUMENT_PDF',
  'LOCATION_SHARE'
]);
export type WhatsAppMessageType = z.infer<typeof WhatsAppMessageTypeEnum>;

export const WhatsAppTemplateCategoryEnum = z.enum([
  'APPOINTMENT_CONFIRMATION',
  'LAB_REPORT_DISPATCH',
  'PRESCRIPTION_PDF',
  'MEDICATION_REFILL_REMINDER',
  'POST_DISCHARGE_CHECKIN'
]);
export type WhatsAppTemplateCategory = z.infer<typeof WhatsAppTemplateCategoryEnum>;

export const PortalAccessRoleEnum = z.enum([
  'PATIENT_PRIMARY',
  'FAMILY_DEPENDENT',
  'AUTHORIZED_CAREGIVER'
]);
export type PortalAccessRole = z.infer<typeof PortalAccessRoleEnum>;

// ============================================================================
// DTOs
// ============================================================================

export const WhatsAppMessageDtoSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  direction: WhatsAppMessageDirectionEnum,
  senderPhone: z.string(),
  messageType: WhatsAppMessageTypeEnum,
  textContent: z.string(),
  mediaUrl: z.string().nullable().optional(),
  mediaCaption: z.string().nullable().optional(),
  quickReplyOptions: z.array(z.string()).optional(),
  deliveryStatus: z.enum(['SENT', 'DELIVERED', 'READ', 'FAILED']),
  timestamp: z.string()
});
export type WhatsAppMessageDto = z.infer<typeof WhatsAppMessageDtoSchema>;

export const WhatsAppConversationThreadDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  phoneNumber: z.string(), // e.g. "+91 98201 54321"
  lastMessageSnippet: z.string(),
  unreadCount: z.number().default(0),
  assignedAgent: z.string().nullable().optional(),
  botActive: z.boolean().default(true),
  lastActivityTimestamp: z.string(),
  messages: z.array(WhatsAppMessageDtoSchema)
});
export type WhatsAppConversationThreadDto = z.infer<typeof WhatsAppConversationThreadDtoSchema>;

export const HealthDocumentDispatchDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  phoneNumber: z.string(),
  documentType: z.enum(['PRESCRIPTION_E_RX', 'DIAGNOSTIC_LAB_REPORT', 'RADIOLOGY_IMAGING_REPORT', 'DISCHARGE_SUMMARY', 'TAX_INVOICE_RECEIPT']),
  documentNumber: z.string(),
  fileName: z.string(),
  fileSizeKb: z.number(),
  dispatchChannel: z.enum(['WHATSAPP_CLOUD_API', 'PATIENT_PORTAL_VAULT', 'SMS_DEEP_LINK']),
  deliveryStatus: z.enum(['DISPATCHED_READ', 'DELIVERED', 'QUEUED']),
  dispatchedAt: z.string()
});
export type HealthDocumentDispatchDto = z.infer<typeof HealthDocumentDispatchDtoSchema>;

export const AarogyaPatientProfileDtoSchema = z.object({
  id: z.string().uuid(),
  patientMrn: z.string(),
  abhaNumber: z.string().nullable().optional(),
  abhaAddress: z.string().nullable().optional(),
  fullName: z.string(),
  mobileNumber: z.string(),
  dateOfBirth: z.string(),
  gender: z.string(),
  bloodGroup: z.string(),
  activePrescriptionsCount: z.number(),
  upcomingAppointmentsCount: z.number(),
  totalHealthRecordsCount: z.number(),
  portalRole: PortalAccessRoleEnum
});
export type AarogyaPatientProfileDto = z.infer<typeof AarogyaPatientProfileDtoSchema>;

export const LiveQueueTokenDtoSchema = z.object({
  id: z.string().uuid(),
  tokenNumber: z.string(), // e.g. "TKN-042"
  patientMrn: z.string(),
  patientName: z.string(),
  doctorName: z.string(),
  departmentName: z.string(),
  roomNumber: z.string(),
  currentTokenServing: z.string(), // e.g. "TKN-038"
  estimatedWaitMinutes: z.number(),
  queueStatus: z.enum(['WAITING_IN_LOBBY', 'CALLED_TO_ROOM', 'IN_CONSULTATION', 'COMPLETED']),
  lastUpdated: z.string()
});
export type LiveQueueTokenDto = z.infer<typeof LiveQueueTokenDtoSchema>;

export const WhatsAppOverviewMetricsDtoSchema = z.object({
  totalConversationsToday: z.number(),
  botHandledInteractionsPct: z.number(),
  documentsDispatchedMonth: z.number(),
  appointmentsBookedViaWhatsApp: z.number(),
  activePortalUsersCount: z.number(),
  medicationRefillCompliancePct: z.number(),
  averageBotResponseTimeSec: z.number(),
  patientNpsScore: z.number()
});
export type WhatsAppOverviewMetricsDto = z.infer<typeof WhatsAppOverviewMetricsDtoSchema>;

export const WhatsAppAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  traceNumber: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityCode: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  justification: z.string(),
  integrityHash: z.string(),
  timestamp: z.string()
});
export type WhatsAppAuditTraceDto = z.infer<typeof WhatsAppAuditTraceDtoSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

export const SendWhatsAppMessageRequestSchema = z.object({
  conversationId: z.string().uuid(),
  messageType: WhatsAppMessageTypeEnum,
  textContent: z.string(),
  mediaUrl: z.string().nullable().optional()
});
export type SendWhatsAppMessageRequest = z.infer<typeof SendWhatsAppMessageRequestSchema>;

export const DispatchHealthDocumentRequestSchema = z.object({
  patientMrn: z.string(),
  patientName: z.string(),
  phoneNumber: z.string(),
  documentType: z.enum(['PRESCRIPTION_E_RX', 'DIAGNOSTIC_LAB_REPORT', 'RADIOLOGY_IMAGING_REPORT', 'DISCHARGE_SUMMARY', 'TAX_INVOICE_RECEIPT']),
  documentNumber: z.string(),
  fileName: z.string()
});
export type DispatchHealthDocumentRequest = z.infer<typeof DispatchHealthDocumentRequestSchema>;

export const SendMedicationReminderRequestSchema = z.object({
  patientMrn: z.string(),
  phoneNumber: z.string(),
  drugName: z.string(),
  dosageInstructions: z.string()
});
export type SendMedicationReminderRequest = z.infer<typeof SendMedicationReminderRequestSchema>;
