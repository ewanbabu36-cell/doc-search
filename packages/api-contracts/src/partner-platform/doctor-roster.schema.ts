import { z } from 'zod';

export const DoctorAvailabilityStatusEnum = z.enum([
  'AVAILABLE',
  'BUSY',
  'ON_LEAVE',
  'BLOCKED',
  'TEMPORARILY_UNAVAILABLE'
]);
export type DoctorAvailabilityStatus = z.infer<typeof DoctorAvailabilityStatusEnum>;

export const DoctorStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'ON_LEAVE'
]);
export type DoctorStatus = z.infer<typeof DoctorStatusEnum>;

export const ConsultationModeEnum = z.enum([
  'IN_PERSON',
  'TELEHEALTH',
  'HYBRID',
  'WALK_IN'
]);
export type ConsultationMode = z.infer<typeof ConsultationModeEnum>;

export const DayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
]);
export type DayOfWeek = z.infer<typeof DayOfWeekEnum>;

export const DoctorLeaveTypeEnum = z.enum([
  'PLANNED_LEAVE',
  'EMERGENCY_LEAVE',
  'MEDICAL_LEAVE',
  'CONFERENCE',
  'CASUAL_LEAVE'
]);
export type DoctorLeaveType = z.infer<typeof DoctorLeaveTypeEnum>;

export const DoctorLeaveApprovalStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
]);
export type DoctorLeaveApprovalStatus = z.infer<typeof DoctorLeaveApprovalStatusEnum>;

export const OpdSlotBookingStatusEnum = z.enum([
  'AVAILABLE',
  'BOOKED',
  'BLOCKED',
  'LEAVE_CONFLICT'
]);
export type OpdSlotBookingStatus = z.infer<typeof OpdSlotBookingStatusEnum>;

export const ConsultationTypeEnum = z.enum([
  'NEW_PATIENT',
  'FOLLOW_UP',
  'TELECONSULTATION',
  'EMERGENCY',
  'SECOND_OPINION'
]);
export type ConsultationType = z.infer<typeof ConsultationTypeEnum>;

// DTO Schemas
export const DoctorProfileDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  branchId: z.string().uuid(),
  branchName: z.string().optional(),
  departmentId: z.string().uuid(),
  departmentName: z.string().optional(),
  staffId: z.string().uuid(),
  fullName: z.string(),
  workEmail: z.string(),
  workPhone: z.string().optional(),
  doctorCode: z.string(),
  medicalLicenseNumber: z.string(),
  qualification: z.string(),
  experienceYears: z.number().int().min(0),
  primarySpecialty: z.string(),
  subSpecialties: z.array(z.string()),
  consultationModes: z.array(ConsultationModeEnum),
  telehealthEligible: z.boolean(),
  bioSummary: z.string().optional(),
  availabilityStatus: DoctorAvailabilityStatusEnum,
  status: DoctorStatusEnum,
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type DoctorProfileDto = z.infer<typeof DoctorProfileDtoSchema>;

export const DoctorSpecializationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  departmentId: z.string().uuid(),
  departmentName: z.string().optional(),
  specialtyCode: z.string(),
  specialtyName: z.string(),
  isSurgical: z.boolean(),
  opdConfig: z.object({
    defaultSlotDuration: z.number().int().min(5),
    maxDailyPatients: z.number().int().min(1)
  }),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type DoctorSpecializationDto = z.infer<typeof DoctorSpecializationDtoSchema>;

export const DoctorScheduleBreakDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  breakName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type DoctorScheduleBreakDto = z.infer<typeof DoctorScheduleBreakDtoSchema>;

export const DoctorScheduleDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  branchName: z.string().optional(),
  doctorId: z.string().uuid(),
  doctorName: z.string().optional(),
  dayOfWeek: DayOfWeekEnum,
  shiftName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  slotDurationMinutes: z.number().int().min(5),
  maxPatientsPerSlot: z.number().int().min(1),
  bufferTimeMinutes: z.number().int().min(0),
  consultationMode: ConsultationModeEnum,
  roomNumber: z.string().optional(),
  isActive: z.boolean(),
  breaks: z.array(DoctorScheduleBreakDtoSchema).default([]),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type DoctorScheduleDto = z.infer<typeof DoctorScheduleDtoSchema>;

export const DoctorLeaveDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  doctorId: z.string().uuid(),
  doctorName: z.string().optional(),
  leaveType: DoctorLeaveTypeEnum,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string(),
  approvalStatus: DoctorLeaveApprovalStatusEnum,
  approvedBy: z.string().optional(),
  affectedSlotsCount: z.number().int().min(0),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type DoctorLeaveDto = z.infer<typeof DoctorLeaveDtoSchema>;

export const OpdSlotDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  branchName: z.string().optional(),
  doctorId: z.string().uuid(),
  doctorName: z.string().optional(),
  scheduleId: z.string().uuid(),
  slotDate: z.string(), // YYYY-MM-DD
  startTime: z.string(), // HH:MM
  endTime: z.string(), // HH:MM
  consultationMode: ConsultationModeEnum,
  bookingStatus: OpdSlotBookingStatusEnum,
  blockReason: z.string().optional(),
  patientReference: z.string().optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OpdSlotDto = z.infer<typeof OpdSlotDtoSchema>;

export const ConsultationFeeMatrixDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  branchId: z.string().uuid().optional(),
  branchName: z.string().optional(),
  doctorId: z.string().uuid().optional(),
  doctorName: z.string().optional(),
  specialtyCode: z.string().optional(),
  consultationType: ConsultationTypeEnum,
  currency: z.string(),
  baseFeeAmount: z.number().min(0),
  followUpValidityDays: z.number().int().min(0),
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DEPRECATED']),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ConsultationFeeMatrixDto = z.infer<typeof ConsultationFeeMatrixDtoSchema>;

export const DoctorOpdAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
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
export type DoctorOpdAuditTraceDto = z.infer<typeof DoctorOpdAuditTraceDtoSchema>;

export const DoctorRosterOverviewDtoSchema = z.object({
  totalDoctorsCount: z.number().int().min(0),
  activeDoctorsCount: z.number().int().min(0),
  doctorsOnDutyTodayCount: z.number().int().min(0),
  doctorsOnLeaveCount: z.number().int().min(0),
  totalWeeklySchedulesCount: z.number().int().min(0),
  todaySlotsCount: z.number().int().min(0),
  todayBookedSlotsCount: z.number().int().min(0),
  todayBlockedSlotsCount: z.number().int().min(0),
  todayAvailableSlotsCount: z.number().int().min(0),
  pendingLeaveRequestsCount: z.number().int().min(0),
  scheduleConflictsCount: z.number().int().min(0)
});
export type DoctorRosterOverviewDto = z.infer<typeof DoctorRosterOverviewDtoSchema>;

// Mutation Requests
export const CreateDoctorProfileSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  departmentId: z.string().uuid(),
  staffId: z.string().uuid(),
  doctorCode: z.string().min(2),
  medicalLicenseNumber: z.string().min(2),
  qualification: z.string().min(2),
  experienceYears: z.number().int().min(0),
  primarySpecialty: z.string().min(2),
  subSpecialties: z.array(z.string()).default([]),
  consultationModes: z.array(ConsultationModeEnum).min(1),
  telehealthEligible: z.boolean().default(true),
  bioSummary: z.string().optional(),
  reason: z.string().min(3)
});
export type CreateDoctorProfileRequest = z.infer<typeof CreateDoctorProfileSchema>;

export const UpdateDoctorProfileSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  doctorId: z.string().uuid(),
  qualification: z.string().min(2).optional(),
  experienceYears: z.number().int().min(0).optional(),
  primarySpecialty: z.string().min(2).optional(),
  subSpecialties: z.array(z.string()).optional(),
  consultationModes: z.array(ConsultationModeEnum).optional(),
  telehealthEligible: z.boolean().optional(),
  bioSummary: z.string().optional(),
  availabilityStatus: DoctorAvailabilityStatusEnum.optional(),
  status: DoctorStatusEnum.optional(),
  reason: z.string().min(3)
});
export type UpdateDoctorProfileRequest = z.infer<typeof UpdateDoctorProfileSchema>;

export const CreateDoctorSpecializationSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  departmentId: z.string().uuid(),
  specialtyCode: z.string().min(2),
  specialtyName: z.string().min(2),
  isSurgical: z.boolean().default(false),
  defaultSlotDuration: z.number().int().min(5).default(15),
  maxDailyPatients: z.number().int().min(1).default(30),
  reason: z.string().min(3)
});
export type CreateDoctorSpecializationRequest = z.infer<typeof CreateDoctorSpecializationSchema>;

export const CreateDoctorScheduleSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  doctorId: z.string().uuid(),
  dayOfWeek: DayOfWeekEnum,
  shiftName: z.string().min(2),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  slotDurationMinutes: z.number().int().min(5).default(15),
  maxPatientsPerSlot: z.number().int().min(1).default(1),
  bufferTimeMinutes: z.number().int().min(0).default(0),
  consultationMode: ConsultationModeEnum.default('IN_PERSON'),
  roomNumber: z.string().optional(),
  reason: z.string().min(3)
});
export type CreateDoctorScheduleRequest = z.infer<typeof CreateDoctorScheduleSchema>;

export const UpdateDoctorScheduleSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  slotDurationMinutes: z.number().int().min(5).optional(),
  maxPatientsPerSlot: z.number().int().min(1).optional(),
  roomNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  reason: z.string().min(3)
});
export type UpdateDoctorScheduleRequest = z.infer<typeof UpdateDoctorScheduleSchema>;

export const AddDoctorLeaveSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  doctorId: z.string().uuid(),
  leaveType: DoctorLeaveTypeEnum,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(3)
});
export type AddDoctorLeaveRequest = z.infer<typeof AddDoctorLeaveSchema>;

export const ApproveDoctorLeaveSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  leaveId: z.string().uuid(),
  approvalStatus: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  reason: z.string().min(3)
});
export type ApproveDoctorLeaveRequest = z.infer<typeof ApproveDoctorLeaveSchema>;

export const BlockOpdSlotSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  slotId: z.string().uuid(),
  blockReason: z.string().min(3)
});
export type BlockOpdSlotRequest = z.infer<typeof BlockOpdSlotSchema>;

export const UnblockOpdSlotSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  slotId: z.string().uuid(),
  reason: z.string().min(3)
});
export type UnblockOpdSlotRequest = z.infer<typeof UnblockOpdSlotSchema>;

export const CreateConsultationFeeSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  specialtyCode: z.string().optional(),
  consultationType: ConsultationTypeEnum,
  currency: z.string().default('USD'),
  baseFeeAmount: z.number().min(0),
  followUpValidityDays: z.number().int().min(0).default(14),
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  reason: z.string().min(3)
});
export type CreateConsultationFeeRequest = z.infer<typeof CreateConsultationFeeSchema>;

export const UpdateConsultationFeeSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  feeId: z.string().uuid(),
  baseFeeAmount: z.number().min(0).optional(),
  followUpValidityDays: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DEPRECATED']).optional(),
  reason: z.string().min(3)
});
export type UpdateConsultationFeeRequest = z.infer<typeof UpdateConsultationFeeSchema>;

export const AssignDoctorLocationSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  doctorId: z.string().uuid(),
  toOrganizationId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  toDepartmentId: z.string().uuid(),
  reason: z.string().min(3)
});
export type AssignDoctorLocationRequest = z.infer<typeof AssignDoctorLocationSchema>;

export const QueryDoctorAuditSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50)
});
export type QueryDoctorAuditRequest = z.infer<typeof QueryDoctorAuditSchema>;
