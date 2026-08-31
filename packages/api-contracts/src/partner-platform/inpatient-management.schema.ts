import { z } from 'zod';

/**
 * Inpatient Unit / Ward Enums & Schemas
 */
export const InpatientUnitTypeEnum = z.enum([
  'CRITICAL_CARE',
  'GENERAL_MEDICINE',
  'SURGICAL_CARE',
  'MATERNAL_CHILD',
  'ISOLATION_UNIT',
  'INPATIENT_DIVISION'
]);
export type InpatientUnitType = z.infer<typeof InpatientUnitTypeEnum>;

export const InpatientWardTypeEnum = z.enum([
  'GENERAL',
  'SEMI_PRIVATE',
  'PRIVATE',
  'DELUXE',
  'ICU',
  'HDU',
  'CCU',
  'NICU',
  'PICU',
  'ISOLATION',
  'POST_OP',
  'MATERNITY'
]);
export type InpatientWardType = z.infer<typeof InpatientWardTypeEnum>;

export const InpatientCareLevelEnum = z.enum([
  'LEVEL_1_OBSERVATION',
  'LEVEL_2_STEPDOWN',
  'LEVEL_3_ICU',
  'TERTIARY_CARE'
]);
export type InpatientCareLevel = z.infer<typeof InpatientCareLevelEnum>;

export const BedStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'OCCUPIED',
  'BLOCKED',
  'MAINTENANCE',
  'CLEANING',
  'OUT_OF_SERVICE'
]);
export type BedStatus = z.infer<typeof BedStatusEnum>;

export const BedTypeEnum = z.enum([
  'STANDARD_ELECTRIC',
  'ICU_CRITICAL',
  'PEDIATRIC_CRIB',
  'ISOLATION_BED',
  'BIRTHING_BED',
  'BARIATRIC'
]);
export type BedType = z.infer<typeof BedTypeEnum>;

export const BedClassEnum = z.enum([
  'GENERAL',
  'SEMI_PRIVATE',
  'PRIVATE',
  'DELUXE',
  'ICU',
  'HDU'
]);
export type BedClass = z.infer<typeof BedClassEnum>;

export const AdmissionRequestStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'BED_PENDING',
  'BED_ASSIGNED',
  'ADMITTED',
  'REJECTED',
  'CANCELLED'
]);
export type AdmissionRequestStatus = z.infer<typeof AdmissionRequestStatusEnum>;

export const AdmissionStatusEnum = z.enum([
  'PLANNED',
  'ADMISSION_PENDING',
  'ADMITTED',
  'TRANSFER_PENDING',
  'DISCHARGE_PLANNED',
  'DISCHARGE_PENDING',
  'DISCHARGED',
  'CANCELLED'
]);
export type AdmissionStatus = z.infer<typeof AdmissionStatusEnum>;

export const AdmissionTypeEnum = z.enum([
  'ELECTIVE',
  'EMERGENCY',
  'URGENT',
  'DIRECT_TRANSFER',
  'POST_OP',
  'DAY_CARE'
]);
export type AdmissionType = z.infer<typeof AdmissionTypeEnum>;

export const TransferStatusEnum = z.enum([
  'REQUESTED',
  'APPROVED',
  'BED_PENDING',
  'READY_FOR_TRANSFER',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED'
]);
export type TransferStatus = z.infer<typeof TransferStatusEnum>;

export const DischargeReadinessStatusEnum = z.enum([
  'NOT_STARTED',
  'PLANNING',
  'CLINICALLY_READY',
  'FINANCIAL_PENDING',
  'INSURANCE_PENDING',
  'DOCUMENTATION_PENDING',
  'READY_FOR_DISCHARGE',
  'DISCHARGE_IN_PROGRESS',
  'COMPLETED'
]);
export type DischargeReadinessStatus = z.infer<typeof DischargeReadinessStatusEnum>;

export const BedTurnaroundStatusEnum = z.enum([
  'PENDING_CLEANING',
  'IN_PROGRESS',
  'INSPECTED_PASSED',
  'AVAILABLE'
]);
export type BedTurnaroundStatus = z.infer<typeof BedTurnaroundStatusEnum>;

/**
 * DTOs & Entity Schemas
 */
export const InpatientUnitDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  unitCode: z.string(),
  unitName: z.string(),
  unitType: InpatientUnitTypeEnum,
  specialty: z.string(),
  building: z.string(),
  floor: z.string(),
  headNurseId: z.string().uuid().nullable().optional(),
  clinicalDirectorId: z.string().uuid().nullable().optional(),
  totalCapacity: z.number().int(),
  isActive: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientUnitDto = z.infer<typeof InpatientUnitDtoSchema>;

export const InpatientWardDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  unitId: z.string().uuid(),
  wardCode: z.string(),
  wardName: z.string(),
  wardType: InpatientWardTypeEnum,
  careLevel: InpatientCareLevelEnum,
  genderPolicy: z.string(),
  building: z.string(),
  floor: z.string(),
  wing: z.string().nullable().optional(),
  nursingStationName: z.string(),
  isolationCapable: z.boolean(),
  ventilatorCapable: z.boolean(),
  totalBeds: z.number().int(),
  activeBeds: z.number().int(),
  occupiedBeds: z.number().int(),
  blockedBeds: z.number().int(),
  cleaningBeds: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientWardDto = z.infer<typeof InpatientWardDtoSchema>;

export const InpatientBedDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  wardId: z.string().uuid(),
  wardName: z.string().optional(),
  roomId: z.string().uuid().nullable().optional(),
  roomNumber: z.string().optional(),
  bedCode: z.string(),
  bedNumber: z.string(),
  bedType: BedTypeEnum,
  bedClass: BedClassEnum,
  status: BedStatusEnum,
  genderEligibility: z.string(),
  hasOxygenPort: z.boolean(),
  hasSuctionPort: z.boolean(),
  hasVentilator: z.boolean(),
  hasCardiacMonitor: z.boolean(),
  dailyChargeRate: z.number(),
  currentPatientId: z.string().uuid().nullable().optional(),
  currentPatientName: z.string().nullable().optional(),
  currentPatientMrn: z.string().nullable().optional(),
  currentAdmissionId: z.string().uuid().nullable().optional(),
  lastCleanedAt: z.string().datetime().nullable().optional(),
  lastOccupiedAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientBedDto = z.infer<typeof InpatientBedDtoSchema>;

export const InpatientAdmissionRequestDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  requestNumber: z.string(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  encounterId: z.string().uuid().nullable().optional(),
  referringDoctorName: z.string(),
  admittingDoctorName: z.string(),
  department: z.string(),
  specialty: z.string(),
  requestedWardType: InpatientWardTypeEnum,
  requestedBedClass: BedClassEnum,
  admissionSource: z.string(),
  priority: z.string(),
  isEmergency: z.boolean(),
  provisionalDiagnosis: z.string(),
  admissionReason: z.string(),
  expectedLengthOfStayDays: z.number().int(),
  insurancePreAuthRef: z.string().nullable().optional(),
  status: AdmissionRequestStatusEnum,
  decisionNotes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientAdmissionRequestDto = z.infer<typeof InpatientAdmissionRequestDtoSchema>;

export const InpatientAdmissionDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionNumber: z.string(),
  admissionRequestId: z.string().uuid().nullable().optional(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  patientGender: z.string(),
  patientAge: z.number().int(),
  encounterId: z.string().uuid().nullable().optional(),
  admittingDoctorName: z.string(),
  attendingConsultantName: z.string(),
  department: z.string(),
  specialty: z.string(),
  wardId: z.string().uuid(),
  wardName: z.string(),
  bedId: z.string().uuid(),
  bedCode: z.string(),
  admissionType: AdmissionTypeEnum,
  admissionSource: z.string(),
  admissionDateTime: z.string().datetime(),
  expectedDischargeDate: z.string().datetime(),
  actualDischargeDateTime: z.string().datetime().nullable().optional(),
  primaryDiagnosis: z.string(),
  secondaryDiagnosis: z.string().nullable().optional(),
  isolationRequired: z.boolean(),
  payerType: z.string(),
  payerName: z.string().nullable().optional(),
  insuranceClaimNumber: z.string().nullable().optional(),
  financialDepositAmount: z.number(),
  status: AdmissionStatusEnum,
  dischargeDisposition: z.string().nullable().optional(),
  dischargeSummaryFinalized: z.boolean(),
  billingCleared: z.boolean(),
  insuranceCleared: z.boolean(),
  clinicalClearance: z.boolean(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientAdmissionDto = z.infer<typeof InpatientAdmissionDtoSchema>;

export const InpatientTransferDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  transferNumber: z.string(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  sourceWardId: z.string().uuid(),
  sourceWardName: z.string(),
  sourceBedId: z.string().uuid(),
  sourceBedCode: z.string(),
  destinationWardId: z.string().uuid(),
  destinationWardName: z.string(),
  destinationBedId: z.string().uuid().nullable().optional(),
  destinationBedCode: z.string().nullable().optional(),
  transferType: z.string(),
  priority: z.string(),
  transferReason: z.string(),
  requestingDoctorName: z.string(),
  transportRequirement: z.string(),
  nursingHandoffNotes: z.string().nullable().optional(),
  status: TransferStatusEnum,
  requestedAt: z.string().datetime(),
  approvedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientTransferDto = z.infer<typeof InpatientTransferDtoSchema>;

export const InpatientNursingAssessmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  assessedBy: z.string(),
  shiftType: z.string(),
  assessmentType: z.string(),
  fallRiskScore: z.number().int(),
  fallRiskLevel: z.string(),
  pressureInjuryRiskScore: z.number().int(),
  pressureInjuryRiskLevel: z.string(),
  painScore: z.number().int(),
  consciousnessLevel: z.string(),
  mobilityStatus: z.string(),
  dietaryIntakeLevel: z.string(),
  nursingSummary: z.string(),
  createdAt: z.string().datetime()
});
export type InpatientNursingAssessmentDto = z.infer<typeof InpatientNursingAssessmentDtoSchema>;

export const InpatientVitalObservationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  recordedBy: z.string(),
  temperatureCelsius: z.number().nullable().optional(),
  pulseBpm: z.number().int().nullable().optional(),
  respiratoryRateBpm: z.number().int().nullable().optional(),
  systolicBpMmHg: z.number().int().nullable().optional(),
  diastolicBpMmHg: z.number().int().nullable().optional(),
  spo2Percentage: z.number().int().nullable().optional(),
  bloodGlucoseMgDl: z.number().nullable().optional(),
  painScaleScore: z.number().int().nullable().optional(),
  gcsScore: z.number().int().nullable().optional(),
  isAbnormal: z.boolean(),
  abnormalDetails: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  recordedAt: z.string().datetime()
});
export type InpatientVitalObservationDto = z.infer<typeof InpatientVitalObservationDtoSchema>;

export const InpatientDoctorRoundDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorName: z.string(),
  doctorSpecialty: z.string(),
  roundType: z.string(),
  subjectiveAssessment: z.string(),
  objectiveClinicalFindings: z.string(),
  clinicalImpression: z.string(),
  treatmentPlanUpdates: z.string(),
  orderedInvestigationsSummary: z.string().nullable().optional(),
  medicationAdjustments: z.string().nullable().optional(),
  dischargeReadinessScore: z.number().int(),
  expectedDischargeReviewDate: z.string().datetime().nullable().optional(),
  roundTimestamp: z.string().datetime()
});
export type InpatientDoctorRoundDto = z.infer<typeof InpatientDoctorRoundDtoSchema>;

export const InpatientDischargePlanDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  targetDischargeDate: z.string().datetime(),
  readinessStatus: DischargeReadinessStatusEnum,
  isMedicationReconciled: z.boolean(),
  isNursingCareHandoverDone: z.boolean(),
  isBillingCleared: z.boolean(),
  isInsurancePreApproved: z.boolean(),
  isDischargeSummaryFinalized: z.boolean(),
  transportArrangement: z.string(),
  patientEducationSummary: z.string().nullable().optional(),
  followUpInstructions: z.string().nullable().optional(),
  coordinatorName: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientDischargePlanDto = z.infer<typeof InpatientDischargePlanDtoSchema>;

export const InpatientDischargeSummaryDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  summaryNumber: z.string(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  admissionDate: z.string().datetime(),
  dischargeDate: z.string().datetime(),
  attendingConsultantName: z.string(),
  finalPrimaryDiagnosis: z.string(),
  finalSecondaryDiagnosis: z.string().nullable().optional(),
  surgicalProceduresPerformed: z.string().nullable().optional(),
  hospitalCourseSummary: z.string(),
  keyInvestigationFindings: z.string().nullable().optional(),
  treatmentGiven: z.string(),
  dischargeMedicationAdvice: z.string(),
  dietAndActivityAdvice: z.string(),
  warningSignsToSeekImmediateCare: z.string(),
  followUpAppointmentDate: z.string().datetime().nullable().optional(),
  followUpDoctorName: z.string().nullable().optional(),
  isFinalized: z.boolean(),
  finalizedBy: z.string().nullable().optional(),
  finalizedAt: z.string().datetime().nullable().optional(),
  versionNumber: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientDischargeSummaryDto = z.infer<typeof InpatientDischargeSummaryDtoSchema>;

export const InpatientBedTurnaroundDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  turnaroundNumber: z.string(),
  bedId: z.string().uuid(),
  bedCode: z.string(),
  wardId: z.string().uuid(),
  vacatedByPatientId: z.string().uuid().nullable().optional(),
  cleaningType: z.string(),
  requestedAt: z.string().datetime(),
  assignedHousekeeper: z.string().nullable().optional(),
  cleaningStartedAt: z.string().datetime().nullable().optional(),
  cleaningCompletedAt: z.string().datetime().nullable().optional(),
  status: BedTurnaroundStatusEnum,
  environmentalInspectionPassed: z.boolean(),
  inspectedBy: z.string().nullable().optional(),
  turnaroundDurationMinutes: z.number().int().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientBedTurnaroundDto = z.infer<typeof InpatientBedTurnaroundDtoSchema>;

export const InpatientBedBlockDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  blockNumber: z.string(),
  bedId: z.string().uuid(),
  bedCode: z.string(),
  wardId: z.string().uuid(),
  blockReason: z.string(),
  blockedFrom: z.string().datetime(),
  blockedUntil: z.string().datetime().nullable().optional(),
  authorizedBy: z.string(),
  status: z.string(),
  unblockedAt: z.string().datetime().nullable().optional(),
  unblockedBy: z.string().nullable().optional(),
  justificationNotes: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type InpatientBedBlockDto = z.infer<typeof InpatientBedBlockDtoSchema>;

export const InpatientAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  traceNumber: z.string(),
  actorId: z.string().uuid().nullable().optional(),
  actorName: z.string(),
  actorRole: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  entityCode: z.string(),
  patientId: z.string().uuid().nullable().optional(),
  patientMrn: z.string().nullable().optional(),
  previousState: z.record(z.unknown()).nullable().optional(),
  newState: z.record(z.unknown()),
  justification: z.string(),
  ipAddress: z.string(),
  integrityHash: z.string(),
  previousHash: z.string(),
  timestamp: z.string().datetime()
});
export type InpatientAuditTraceDto = z.infer<typeof InpatientAuditTraceDtoSchema>;

/**
 * Metric & Analytics DTOs
 */
export const InpatientOverviewMetricsDtoSchema = z.object({
  totalInpatients: z.number().int(),
  admissionsToday: z.number().int(),
  dischargesToday: z.number().int(),
  pendingAdmissions: z.number().int(),
  totalBeds: z.number().int(),
  availableBeds: z.number().int(),
  occupiedBeds: z.number().int(),
  reservedBeds: z.number().int(),
  blockedBeds: z.number().int(),
  cleaningBeds: z.number().int(),
  occupancyRatePercentage: z.number(),
  icuOccupancyRatePercentage: z.number(),
  averageLengthOfStayDays: z.number(),
  transferBacklog: z.number().int(),
  dischargeBacklog: z.number().int(),
  cleaningBacklog: z.number().int(),
  criticalAlertsCount: z.number().int()
});
export type InpatientOverviewMetricsDto = z.infer<typeof InpatientOverviewMetricsDtoSchema>;

export const InpatientAnalyticsDtoSchema = z.object({
  wardOccupancy: z.array(z.object({
    wardName: z.string(),
    totalBeds: z.number().int(),
    occupiedBeds: z.number().int(),
    rate: z.number()
  })),
  dailyAdmissionDischargeTrends: z.array(z.object({
    date: z.string(),
    admissions: z.number().int(),
    discharges: z.number().int()
  })),
  lengthOfStayDistribution: z.array(z.object({
    bracket: z.string(),
    patientCount: z.number().int()
  })),
  careLevelUtilization: z.array(z.object({
    careLevel: z.string(),
    bedsCount: z.number().int(),
    activePatients: z.number().int()
  }))
});
export type InpatientAnalyticsDto = z.infer<typeof InpatientAnalyticsDtoSchema>;

/**
 * Mutation Request Payloads
 */
export const CreateWardRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  unitId: z.string().uuid(),
  wardCode: z.string().min(2),
  wardName: z.string().min(2),
  wardType: InpatientWardTypeEnum,
  careLevel: InpatientCareLevelEnum,
  genderPolicy: z.string().default('ALL'),
  building: z.string(),
  floor: z.string(),
  wing: z.string().optional(),
  nursingStationName: z.string(),
  isolationCapable: z.boolean().default(false),
  ventilatorCapable: z.boolean().default(false),
  totalBeds: z.number().int().min(1)
});
export type CreateWardRequest = z.infer<typeof CreateWardRequestSchema>;

export const UpdateWardRequestSchema = z.object({
  wardId: z.string().uuid(),
  tenantId: z.string().uuid(),
  wardName: z.string().min(2),
  careLevel: InpatientCareLevelEnum,
  nursingStationName: z.string(),
  isolationCapable: z.boolean(),
  ventilatorCapable: z.boolean(),
  isActive: z.boolean()
});
export type UpdateWardRequest = z.infer<typeof UpdateWardRequestSchema>;

export const CreateBedRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  wardId: z.string().uuid(),
  bedCode: z.string().min(2),
  bedNumber: z.string().min(1),
  bedType: BedTypeEnum,
  bedClass: BedClassEnum,
  genderEligibility: z.string().default('ALL'),
  hasOxygenPort: z.boolean().default(true),
  hasSuctionPort: z.boolean().default(true),
  hasVentilator: z.boolean().default(false),
  hasCardiacMonitor: z.boolean().default(false),
  dailyChargeRate: z.number().min(0)
});
export type CreateBedRequest = z.infer<typeof CreateBedRequestSchema>;

export const UpdateBedRequestSchema = z.object({
  bedId: z.string().uuid(),
  tenantId: z.string().uuid(),
  bedType: BedTypeEnum,
  bedClass: BedClassEnum,
  dailyChargeRate: z.number().min(0),
  hasOxygenPort: z.boolean(),
  hasSuctionPort: z.boolean(),
  hasVentilator: z.boolean(),
  hasCardiacMonitor: z.boolean(),
  isActive: z.boolean()
});
export type UpdateBedRequest = z.infer<typeof UpdateBedRequestSchema>;

export const BlockBedRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  bedId: z.string().uuid(),
  blockReason: z.string(),
  authorizedBy: z.string(),
  justificationNotes: z.string().min(5)
});
export type BlockBedRequest = z.infer<typeof BlockBedRequestSchema>;

export const CreateBedReservationRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  wardId: z.string().uuid(),
  bedId: z.string().uuid(),
  admissionRequestId: z.string().uuid().optional(),
  reservedFrom: z.string().datetime(),
  reservedUntil: z.string().datetime(),
  priority: z.string().default('ROUTINE'),
  reservedBy: z.string(),
  notes: z.string().optional()
});
export type CreateBedReservationRequest = z.infer<typeof CreateBedReservationRequestSchema>;

export const CancelBedReservationRequestSchema = z.object({
  reservationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  reason: z.string().min(5),
  cancelledBy: z.string()
});
export type CancelBedReservationRequest = z.infer<typeof CancelBedReservationRequestSchema>;

export const CreateAdmissionRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  referringDoctorName: z.string(),
  admittingDoctorName: z.string(),
  department: z.string(),
  specialty: z.string(),
  requestedWardType: InpatientWardTypeEnum,
  requestedBedClass: BedClassEnum,
  admissionSource: z.string().default('OPD'),
  priority: z.string().default('ROUTINE'),
  isEmergency: z.boolean().default(false),
  provisionalDiagnosis: z.string().min(3),
  admissionReason: z.string().min(5),
  expectedLengthOfStayDays: z.number().int().min(1).default(3),
  insurancePreAuthRef: z.string().optional()
});
export type CreateAdmissionRequest = z.infer<typeof CreateAdmissionRequestSchema>;

export const ApproveAdmissionRequestSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().uuid(),
  approverName: z.string(),
  approverRole: z.string(),
  allocatedWardId: z.string().uuid(),
  allocatedBedId: z.string().uuid(),
  justification: z.string().min(3)
});
export type ApproveAdmissionRequest = z.infer<typeof ApproveAdmissionRequestSchema>;

export const RejectAdmissionRequestSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().uuid(),
  rejectorName: z.string(),
  reason: z.string().min(5)
});
export type RejectAdmissionRequest = z.infer<typeof RejectAdmissionRequestSchema>;

export const CancelAdmissionRequestSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().uuid(),
  reason: z.string().min(5),
  cancelledBy: z.string()
});
export type CancelAdmissionRequest = z.infer<typeof CancelAdmissionRequestSchema>;

export const AllocateBedRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  wardId: z.string().uuid(),
  bedId: z.string().uuid(),
  allocatedBy: z.string()
});
export type AllocateBedRequest = z.infer<typeof AllocateBedRequestSchema>;

export const CreateTransferRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  destinationWardId: z.string().uuid(),
  transferType: z.string().default('CLINICAL_ESCALATION'),
  priority: z.string().default('ROUTINE'),
  transferReason: z.string().min(5),
  requestingDoctorName: z.string(),
  transportRequirement: z.string().default('WHEELCHAIR'),
  nursingHandoffNotes: z.string().optional()
});
export type CreateTransferRequest = z.infer<typeof CreateTransferRequestSchema>;

export const ApproveTransferRequestSchema = z.object({
  transferId: z.string().uuid(),
  tenantId: z.string().uuid(),
  approverName: z.string(),
  assignedBedId: z.string().uuid(),
  justification: z.string().min(3)
});
export type ApproveTransferRequest = z.infer<typeof ApproveTransferRequestSchema>;

export const CompleteTransferRequestSchema = z.object({
  transferId: z.string().uuid(),
  tenantId: z.string().uuid(),
  destinationBedId: z.string().uuid(),
  completedBy: z.string(),
  handoffConfirmed: z.boolean()
});
export type CompleteTransferRequest = z.infer<typeof CompleteTransferRequestSchema>;

export const RecordNursingAssessmentRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  assessedBy: z.string(),
  shiftType: z.string(),
  assessmentType: z.string(),
  fallRiskScore: z.number().int().min(0),
  fallRiskLevel: z.string(),
  pressureInjuryRiskScore: z.number().int().min(0),
  pressureInjuryRiskLevel: z.string(),
  painScore: z.number().int().min(0).max(10),
  consciousnessLevel: z.string(),
  mobilityStatus: z.string(),
  dietaryIntakeLevel: z.string(),
  nursingSummary: z.string().min(5)
});
export type RecordNursingAssessmentRequest = z.infer<typeof RecordNursingAssessmentRequestSchema>;

export const RecordNursingNoteRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  authorName: z.string(),
  noteType: z.string(),
  shift: z.string(),
  isCriticalFlag: z.boolean().default(false),
  noteContent: z.string().min(5)
});
export type RecordNursingNoteRequest = z.infer<typeof RecordNursingNoteRequestSchema>;

export const RecordCarePlanRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  nursingDiagnosis: z.string().min(3),
  expectedOutcome: z.string().min(5),
  interventions: z.string().min(5),
  targetEvaluationDate: z.string().datetime(),
  createdBy: z.string()
});
export type RecordCarePlanRequest = z.infer<typeof RecordCarePlanRequestSchema>;

export const RecordVitalObservationRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  recordedBy: z.string(),
  temperatureCelsius: z.number().optional(),
  pulseBpm: z.number().int().optional(),
  respiratoryRateBpm: z.number().int().optional(),
  systolicBpMmHg: z.number().int().optional(),
  diastolicBpMmHg: z.number().int().optional(),
  spo2Percentage: z.number().int().optional(),
  bloodGlucoseMgDl: z.number().optional(),
  painScaleScore: z.number().int().optional(),
  gcsScore: z.number().int().optional(),
  isAbnormal: z.boolean().default(false),
  abnormalDetails: z.string().optional(),
  notes: z.string().optional()
});
export type RecordVitalObservationRequest = z.infer<typeof RecordVitalObservationRequestSchema>;

export const RecordDoctorRoundRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorName: z.string(),
  doctorSpecialty: z.string(),
  roundType: z.string().default('MORNING_PRIMARY_ROUND'),
  subjectiveAssessment: z.string().min(5),
  objectiveClinicalFindings: z.string().min(5),
  clinicalImpression: z.string().min(3),
  treatmentPlanUpdates: z.string().min(5),
  orderedInvestigationsSummary: z.string().optional(),
  medicationAdjustments: z.string().optional(),
  dischargeReadinessScore: z.number().int().min(0).max(100).default(50)
});
export type RecordDoctorRoundRequest = z.infer<typeof RecordDoctorRoundRequestSchema>;

export const CreateDischargePlanRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  patientId: z.string().uuid(),
  targetDischargeDate: z.string().datetime(),
  coordinatorName: z.string(),
  transportArrangement: z.string().default('SELF_TRANSPORT'),
  patientEducationSummary: z.string().optional(),
  followUpInstructions: z.string().optional()
});
export type CreateDischargePlanRequest = z.infer<typeof CreateDischargePlanRequestSchema>;

export const RequestDischargeRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  requestingDoctorName: z.string(),
  dischargeType: z.string().default('ROUTINE_HOME'),
  conditionAtDischarge: z.string().default('STABLE_IMPROVED')
});
export type RequestDischargeRequest = z.infer<typeof RequestDischargeRequestSchema>;

export const ApproveDischargeRequestSchema = z.object({
  dischargeRequestId: z.string().uuid(),
  tenantId: z.string().uuid(),
  clinicalClearance: z.boolean(),
  financialClearance: z.boolean(),
  insuranceClearance: z.boolean(),
  authorizedBy: z.string()
});
export type ApproveDischargeRequest = z.infer<typeof ApproveDischargeRequestSchema>;

export const CompleteDischargeRequestSchema = z.object({
  admissionId: z.string().uuid(),
  tenantId: z.string().uuid(),
  dischargedBy: z.string(),
  dischargeDisposition: z.string().default('HOME_ROUTINE')
});
export type CompleteDischargeRequest = z.infer<typeof CompleteDischargeRequestSchema>;

export const FinalizeDischargeSummaryRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  admissionId: z.string().uuid(),
  attendingConsultantName: z.string(),
  finalPrimaryDiagnosis: z.string().min(3),
  finalSecondaryDiagnosis: z.string().optional(),
  surgicalProceduresPerformed: z.string().optional(),
  hospitalCourseSummary: z.string().min(10),
  keyInvestigationFindings: z.string().optional(),
  treatmentGiven: z.string().min(5),
  dischargeMedicationAdvice: z.string().min(5),
  dietAndActivityAdvice: z.string().min(5),
  warningSignsToSeekImmediateCare: z.string().min(5),
  followUpAppointmentDate: z.string().datetime().optional(),
  followUpDoctorName: z.string().optional(),
  finalizedBy: z.string()
});
export type FinalizeDischargeSummaryRequest = z.infer<typeof FinalizeDischargeSummaryRequestSchema>;

export const ReleaseBedRequestSchema = z.object({
  bedId: z.string().uuid(),
  tenantId: z.string().uuid(),
  releasedBy: z.string(),
  reason: z.string().min(3)
});
export type ReleaseBedRequest = z.infer<typeof ReleaseBedRequestSchema>;

export const CompleteCleaningRequestSchema = z.object({
  turnaroundId: z.string().uuid(),
  tenantId: z.string().uuid(),
  inspectedBy: z.string(),
  passed: z.boolean(),
  notes: z.string().optional()
});
export type CompleteCleaningRequest = z.infer<typeof CompleteCleaningRequestSchema>;
