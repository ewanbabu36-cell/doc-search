import { z } from 'zod';

export const EncounterTypeEnum = z.enum([
  'OPD',
  'IPD',
  'EMERGENCY',
  'FOLLOW_UP',
  'TELECONSULTATION',
  'WALK_IN'
]);
export type EncounterType = z.infer<typeof EncounterTypeEnum>;

export const EncounterStatusEnum = z.enum([
  'REGISTERED',
  'CHECKED_IN',
  'WAITING',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'REFERRED',
  'ADMITTED'
]);
export type EncounterStatus = z.infer<typeof EncounterStatusEnum>;

export const EncounterPriorityEnum = z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']);
export type EncounterPriority = z.infer<typeof EncounterPriorityEnum>;

export const EncounterConsultationModeEnum = z.enum([
  'IN_PERSON',
  'TELEHEALTH',
  'WALK_IN',
  'HOME_VISIT'
]);
export type EncounterConsultationMode = z.infer<typeof EncounterConsultationModeEnum>;


export const QueueStatusEnum = z.enum([
  'WAITING',
  'CALLED',
  'IN_PROGRESS',
  'SERVED',
  'MISSED',
  'CANCELLED'
]);
export type QueueStatus = z.infer<typeof QueueStatusEnum>;

export const ReferralTypeEnum = z.enum([
  'INTERNAL_DEPARTMENT',
  'INTERNAL_SPECIALIST',
  'EXTERNAL_HOSPITAL',
  'DIAGNOSTIC_CENTER'
]);
export type ReferralType = z.infer<typeof ReferralTypeEnum>;

export const ReferralUrgencyEnum = z.enum(['ROUTINE', 'URGENT', 'STAT']);
export type ReferralUrgency = z.infer<typeof ReferralUrgencyEnum>;

export const ReferralStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'COMPLETED', 'DECLINED']);
export type ReferralStatus = z.infer<typeof ReferralStatusEnum>;

// DTO Schemas
export const EncounterQueueDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  departmentId: z.string().uuid(),
  departmentName: z.string().optional(),
  doctorId: z.string().uuid().optional(),
  doctorName: z.string().optional(),
  encounterId: z.string().uuid(),
  tokenNumber: z.string(),
  queueDate: z.string(),
  queueStatus: QueueStatusEnum,
  estimatedWaitMinutes: z.number().int().min(0),
  calledAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type EncounterQueueDto = z.infer<typeof EncounterQueueDtoSchema>;

export const EncounterReferralDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string().optional(),
  patientMrn: z.string().optional(),
  referralType: ReferralTypeEnum,
  referringDoctorId: z.string().uuid().optional(),
  referringDoctorName: z.string().optional(),
  destinationDepartmentId: z.string().uuid().optional(),
  destinationDepartmentName: z.string().optional(),
  destinationDoctorId: z.string().uuid().optional(),
  destinationDoctorName: z.string().optional(),
  destinationFacilityName: z.string().optional(),
  clinicalSummary: z.string(),
  urgency: ReferralUrgencyEnum,
  referralStatus: ReferralStatusEnum,
  referredAt: z.string().datetime(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type EncounterReferralDto = z.infer<typeof EncounterReferralDtoSchema>;

export const EncounterAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  encounterId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  action: z.string(),
  targetEntity: z.string(),
  targetEntityId: z.string(),
  justification: z.string(),
  operationStatus: z.enum(['SUCCESS', 'FAILURE', 'DENIED']),
  correlationId: z.string(),
  metadata: z.record(z.unknown()),
  occurredAt: z.string().datetime()
});
export type EncounterAuditTraceDto = z.infer<typeof EncounterAuditTraceDtoSchema>;

export const EncounterDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  branchId: z.string().uuid(),
  branchName: z.string().optional(),
  departmentId: z.string().uuid(),
  departmentName: z.string().optional(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  patientDob: z.string().optional(),
  patientGender: z.string().optional(),
  patientMobile: z.string().optional(),
  doctorId: z.string().uuid().optional(),
  doctorName: z.string().optional(),
  doctorSpecialty: z.string().optional(),
  opdSlotId: z.string().uuid().optional(),
  slotTimeDisplay: z.string().optional(),
  encounterNumber: z.string(),
  encounterType: EncounterTypeEnum,
  status: EncounterStatusEnum,
  priority: EncounterPriorityEnum,
  consultationMode: EncounterConsultationModeEnum,
  chiefComplaint: z.string(),
  visitReason: z.string().optional(),
  triageNotes: z.string().optional(),
  referralSource: z.string().optional(),
  tokenNumber: z.string().optional(),
  queueItem: EncounterQueueDtoSchema.optional(),
  referrals: z.array(EncounterReferralDtoSchema).default([]),
  registeredAt: z.string().datetime(),
  checkedInAt: z.string().datetime().optional(),
  consultationStartedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  cancellationReason: z.string().optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type EncounterDto = z.infer<typeof EncounterDtoSchema>;

export const EncounterOverviewDtoSchema = z.object({
  totalEncountersTodayCount: z.number().int().min(0),
  waitingQueueCount: z.number().int().min(0),
  inConsultationCount: z.number().int().min(0),
  completedTodayCount: z.number().int().min(0),
  emergencyEncountersCount: z.number().int().min(0),
  telehealthEncountersCount: z.number().int().min(0),
  cancelledCount: z.number().int().min(0)
});
export type EncounterOverviewDto = z.infer<typeof EncounterOverviewDtoSchema>;

// Mutation Request Schemas
export const CreateEncounterSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  departmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid().optional(),
  opdSlotId: z.string().uuid().optional(),
  encounterType: EncounterTypeEnum.default('OPD'),
  priority: EncounterPriorityEnum.default('ROUTINE'),
  consultationMode: EncounterConsultationModeEnum.default('IN_PERSON'),
  chiefComplaint: z.string().min(2),
  visitReason: z.string().optional(),
  triageNotes: z.string().optional(),
  referralSource: z.string().optional(),
  autoCheckIn: z.boolean().default(false),
  reason: z.string().min(3)
});
export type CreateEncounterRequest = {
  actorId: string;
  actorRole: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  departmentId: string;
  patientId: string;
  doctorId?: string | undefined;
  opdSlotId?: string | undefined;
  encounterType?: EncounterType | undefined;
  priority?: EncounterPriority | undefined;
  consultationMode?: EncounterConsultationMode | undefined;
  chiefComplaint: string;
  visitReason?: string | undefined;
  triageNotes?: string | undefined;
  referralSource?: string | undefined;
  autoCheckIn?: boolean | undefined;
  reason: string;
};

export const CheckInEncounterSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  triageNotes: z.string().optional(),
  reason: z.string().min(3)
});
export type CheckInEncounterRequest = {
  actorId: string;
  actorRole: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  encounterId: string;
  triageNotes?: string | undefined;
  reason: string;
};

export const AssignDoctorSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  doctorId: z.string().uuid(),
  reason: z.string().min(3)
});
export type AssignDoctorRequest = z.infer<typeof AssignDoctorSchema>;

export const ChangeEncounterStatusSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  newStatus: EncounterStatusEnum,
  reason: z.string().min(3)
});
export type ChangeEncounterStatusRequest = z.infer<typeof ChangeEncounterStatusSchema>;

export const CancelEncounterSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  cancellationReason: z.string().min(3),
  reason: z.string().min(3)
});
export type CancelEncounterRequest = z.infer<typeof CancelEncounterSchema>;

export const ReferEncounterSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  referralType: ReferralTypeEnum,
  destinationDepartmentId: z.string().uuid().optional(),
  destinationDoctorId: z.string().uuid().optional(),
  destinationFacilityName: z.string().optional(),
  clinicalSummary: z.string().min(3),
  urgency: ReferralUrgencyEnum.default('ROUTINE'),
  reason: z.string().min(3)
});
export type ReferEncounterRequest = {
  actorId: string;
  actorRole: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  encounterId: string;
  referralType: ReferralType;
  destinationDepartmentId?: string | undefined;
  destinationDoctorId?: string | undefined;
  destinationFacilityName?: string | undefined;
  clinicalSummary: string;
  urgency?: ReferralUrgency | undefined;
  reason: string;
};

export const ReassignEncounterSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  newDepartmentId: z.string().uuid(),
  newDoctorId: z.string().uuid().optional(),
  reason: z.string().min(3)
});
export type ReassignEncounterRequest = {
  actorId: string;
  actorRole: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  encounterId: string;
  newDepartmentId: string;
  newDoctorId?: string | undefined;
  reason: string;
};

export const SearchEncounterSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  encounterNumber: z.string().optional(),
  status: EncounterStatusEnum.optional(),
  encounterType: EncounterTypeEnum.optional(),
  priority: EncounterPriorityEnum.optional(),
  consultationMode: EncounterConsultationModeEnum.optional(),
  date: z.string().optional(),
  query: z.string().optional(),
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50)
});
export type SearchEncounterRequest = {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  departmentId?: string | undefined;
  doctorId?: string | undefined;
  patientId?: string | undefined;
  encounterNumber?: string | undefined;
  status?: EncounterStatus | undefined;
  encounterType?: EncounterType | undefined;
  priority?: EncounterPriority | undefined;
  consultationMode?: EncounterConsultationMode | undefined;
  date?: string | undefined;
  query?: string | undefined;
  pageIndex?: number | undefined;
  pageSize?: number | undefined;
};

export const QueryEncounterAuditSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  encounterId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50)
});
export type QueryEncounterAuditRequest = {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  encounterId?: string | undefined;
  patientId?: string | undefined;
  pageIndex?: number | undefined;
  pageSize?: number | undefined;
};
