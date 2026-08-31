import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const ABO_GROUPS = ['A', 'B', 'AB', 'O'] as const;
export type ABOGroup = (typeof ABO_GROUPS)[number];

export const RH_FACTORS = ['POSITIVE', 'NEGATIVE'] as const;
export type RhFactor = (typeof RH_FACTORS)[number];

export const TRANSFUSION_BLOOD_GROUPS = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE'
] as const;
export type TransfusionBloodGroup = (typeof TRANSFUSION_BLOOD_GROUPS)[number];

export const DONOR_TYPES = [
  'VOLUNTARY_NON_REMUNERATED',
  'REPLACEMENT_FAMILY',
  'DIRECTED_PATIENT_SPECIFIC',
  'AUTOLOGOUS_PRE_OP'
] as const;
export type DonorType = (typeof DONOR_TYPES)[number];

export const DONOR_ELIGIBILITY_STATUSES = [
  'ELIGIBLE_FOR_DONATION',
  'TEMPORARILY_DEFERRED',
  'PERMANENTLY_DEFERRED',
  'SCREENING_IN_PROGRESS'
] as const;
export type DonorEligibilityStatus = (typeof DONOR_ELIGIBILITY_STATUSES)[number];

export const BLOOD_UNIT_STATUSES = [
  'COLLECTED',
  'QUARANTINED',
  'TESTING_IN_PROGRESS',
  'RELEASED_USABLE',
  'RESERVED_FOR_PATIENT',
  'ISSUED_TO_DEPARTMENT',
  'TRANSFUSED',
  'RETURNED_TO_BANK',
  'DISCARDED_BIOHAZARD',
  'EXPIRED'
] as const;
export type BloodUnitStatus = (typeof BLOOD_UNIT_STATUSES)[number];

export const BLOOD_COMPONENT_TYPES = [
  'WHOLE_BLOOD',
  'PACKED_RED_BLOOD_CELLS_PRBC',
  'RANDOM_DONOR_PLATELETS_RDP',
  'SINGLE_DONOR_PLATELETS_SDP',
  'FRESH_FROZEN_PLASMA_FFP',
  'CRYOPRECIPITATE',
  'LEUKOREDUCED_PRBC'
] as const;
export type BloodComponentType = (typeof BLOOD_COMPONENT_TYPES)[number];

export const BLOOD_REQUEST_URGENCIES = [
  'STAT_EMERGENCY_IMMEDIATE',
  'URGENT_WITHIN_2_HOURS',
  'ROUTINE_SCHEDULED_OT',
  'STANDBY_RESERVATION'
] as const;
export type BloodRequestUrgency = (typeof BLOOD_REQUEST_URGENCIES)[number];

export const CROSSMATCH_RESULTS = [
  'PENDING_TESTING',
  'COMPATIBLE',
  'INCOMPATIBLE',
  'REQUIRES_SENIOR_REVIEW',
  'CANCELLED'
] as const;
export type CrossmatchResult = (typeof CROSSMATCH_RESULTS)[number];

export const TRANSFUSION_REACTION_SEVERITIES = [
  'MILD_ALLERGIC_FEBRILE',
  'MODERATE_ANAPHYLACTIC',
  'SEVERE_LIFE_THREATENING_TRALI_TACO',
  'HEMOLYTIC_TRANSFUSION_REACTION'
] as const;
export type TransfusionReactionSeverity = (typeof TRANSFUSION_REACTION_SEVERITIES)[number];

export const REACTION_STATUSES = [
  'REPORTED',
  'UNDER_INVESTIGATION',
  'CONFIRMED_REACTION',
  'RULED_OUT',
  'CLOSED_RESOLVED'
] as const;
export type ReactionStatus = (typeof REACTION_STATUSES)[number];

export const DISCARD_REASONS = [
  'EXPIRATION_DATE_EXCEEDED',
  'INFECTIOUS_DISEASE_SEROPOSITIVE',
  'HEMOLYSIS_OR_CLOT_NOTED',
  'COLD_CHAIN_TEMPERATURE_EXCURSION',
  'BAG_LEAK_OR_PHYSICAL_DAMAGE',
  'UNSATISFACTORY_COMPONENT_YIELD'
] as const;
export type DiscardReason = (typeof DISCARD_REASONS)[number];

// ============================================================================
// DTOs & SCHEMAS
// ============================================================================

export const BloodBankFacilitySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  facilityCode: z.string(),
  facilityName: z.string(),
  licenseNumber: z.string(),
  medicalDirectorName: z.string(),
  headTechnologistName: z.string(),
  storageLocationName: z.string(),
  totalAvailableUnits: z.number().int().nonnegative(),
  quarantineUnits: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type BloodBankFacilityDto = z.infer<typeof BloodBankFacilitySchema>;

export const BloodDonorSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  donorCode: z.string(),
  fullName: z.string(),
  gender: z.string(),
  dateOfBirth: z.string(),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  contactNumber: z.string(),
  email: z.string().optional(),
  donorType: z.enum(DONOR_TYPES),
  eligibilityStatus: z.enum(DONOR_ELIGIBILITY_STATUSES),
  deferralReason: z.string().optional(),
  deferralEndDate: z.string().optional(),
  totalDonationsCount: z.number().int().nonnegative(),
  lastDonationDate: z.string().optional(),
  nextEligibleDate: z.string(),
  createdAt: z.string()
});
export type BloodDonorDto = z.infer<typeof BloodDonorSchema>;

export const BloodDonorScreeningSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  screeningCode: z.string(),
  donorId: z.string(),
  donorName: z.string(),
  weightKg: z.number().positive(),
  hemoglobinGdl: z.number().positive(),
  systolicBp: z.number().int().positive(),
  diastolicBp: z.number().int().positive(),
  pulseBpm: z.number().int().positive(),
  temperatureF: z.number().positive(),
  medicalHistoryCleared: z.boolean(),
  screeningNurseName: z.string(),
  eligibilityDecision: z.enum(DONOR_ELIGIBILITY_STATUSES),
  remarks: z.string().optional(),
  screenedAt: z.string()
});
export type BloodDonorScreeningDto = z.infer<typeof BloodDonorScreeningSchema>;

export const BloodDonationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  donationNumber: z.string(),
  donorId: z.string(),
  donorName: z.string(),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  donationType: z.enum(DONOR_TYPES),
  collectedVolumeMl: z.number().int().positive(),
  anticoagulantType: z.string(),
  phlebotomistName: z.string(),
  collectionLocation: z.string(),
  unitStatus: z.enum(BLOOD_UNIT_STATUSES),
  bagBarcode: z.string(),
  collectedAt: z.string()
});
export type BloodDonationDto = z.infer<typeof BloodDonationSchema>;

export const BloodTestRecordSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  testCode: z.string(),
  donationId: z.string(),
  unitBarcode: z.string(),
  aboGroupingResult: z.enum(ABO_GROUPS),
  rhFactorResult: z.enum(RH_FACTORS),
  antibodyScreen: z.enum(['NEGATIVE', 'POSITIVE_UNIDENTIFIED_ANTIBODIES']),
  hivResult: z.enum(['NON_REACTIVE', 'REACTIVE']),
  hBsAgResult: z.enum(['NON_REACTIVE', 'REACTIVE']),
  hcvResult: z.enum(['NON_REACTIVE', 'REACTIVE']),
  syphilisVDRLResult: z.enum(['NON_REACTIVE', 'REACTIVE']),
  malariaResult: z.enum(['NEGATIVE', 'POSITIVE']),
  testingTechnicianName: z.string(),
  pathologistSignOffName: z.string(),
  isPassedForRelease: z.boolean(),
  testedAt: z.string()
});
export type BloodTestRecordDto = z.infer<typeof BloodTestRecordSchema>;

export const BloodComponentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  componentCode: z.string(),
  donationId: z.string(),
  componentType: z.enum(BLOOD_COMPONENT_TYPES),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  volumeMl: z.number().int().positive(),
  storageLocation: z.string(),
  storageTemperatureTargetC: z.string(),
  expiryDate: z.string(),
  status: z.enum(BLOOD_UNIT_STATUSES),
  preparedByTechnician: z.string(),
  releasedByPathologist: z.string().optional(),
  createdAt: z.string()
});
export type BloodComponentDto = z.infer<typeof BloodComponentSchema>;

export const BloodRequestSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  requestCode: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  encounterId: z.string(),
  requestingDepartment: z.string(),
  orderingPhysicianName: z.string(),
  requestedComponentType: z.enum(BLOOD_COMPONENT_TYPES),
  patientBloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  quantityUnits: z.number().int().positive(),
  urgency: z.enum(BLOOD_REQUEST_URGENCIES),
  clinicalIndication: z.string(),
  requiredByTimestamp: z.string(),
  status: z.enum(['PENDING_CROSSMATCH', 'RESERVED', 'PARTIALLY_ISSUED', 'COMPLETED', 'CANCELLED']),
  requestedAt: z.string()
});
export type BloodRequestDto = z.infer<typeof BloodRequestSchema>;

export const BloodCrossmatchSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  crossmatchCode: z.string(),
  requestId: z.string(),
  componentId: z.string(),
  componentCode: z.string(),
  patientName: z.string(),
  patientBloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  donorBloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  majorCrossmatchResult: z.enum(['COMPATIBLE', 'INCOMPATIBLE']),
  minorCrossmatchResult: z.enum(['COMPATIBLE', 'INCOMPATIBLE']),
  coombsTestResult: z.enum(['NEGATIVE', 'POSITIVE']),
  overallResult: z.enum(CROSSMATCH_RESULTS),
  testingTechnicianName: z.string(),
  verifiedByPathologist: z.string(),
  crossmatchedAt: z.string(),
  expiresAt: z.string()
});
export type BloodCrossmatchDto = z.infer<typeof BloodCrossmatchSchema>;

export const BloodIssueSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  issueCode: z.string(),
  requestId: z.string(),
  componentId: z.string(),
  componentCode: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  destinationDepartment: z.string(),
  issuingTechnicianName: z.string(),
  receivingNurseName: z.string(),
  transportBoxTemperatureC: z.string(),
  issuedAt: z.string()
});
export type BloodIssueDto = z.infer<typeof BloodIssueSchema>;

export const TransfusionRecordSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  transfusionCode: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  encounterId: z.string(),
  componentCode: z.string(),
  componentType: z.enum(BLOOD_COMPONENT_TYPES),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  administeredByNurse: z.string(),
  supervisingDoctorName: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  preTransfusionPulse: z.number().int().positive(),
  preTransfusionBp: z.string(),
  preTransfusionTempF: z.number().positive(),
  postTransfusionPulse: z.number().int().positive().optional(),
  postTransfusionBp: z.string().optional(),
  postTransfusionTempF: z.number().positive().optional(),
  adverseReactionNoted: z.boolean(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED_UNEVENTFUL', 'HALTED_DUE_TO_REACTION']),
  outcomeNotes: z.string().optional()
});
export type TransfusionRecordDto = z.infer<typeof TransfusionRecordSchema>;

export const TransfusionReactionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  reactionReportCode: z.string(),
  transfusionId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  componentCode: z.string(),
  severity: z.enum(TRANSFUSION_REACTION_SEVERITIES),
  symptomsObserved: z.string(),
  immediateInterventions: z.string(),
  notifiedPhysicianName: z.string(),
  clericalCheckConfirmedMatching: z.boolean(),
  postReactionUrineHemoglobin: z.string().optional(),
  directAntiglobulinTestDAT: z.string().optional(),
  investigationOutcome: z.string().optional(),
  status: z.enum(REACTION_STATUSES),
  reportedAt: z.string()
});
export type TransfusionReactionDto = z.infer<typeof TransfusionReactionSchema>;

export const BloodQualityCheckSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  qcCode: z.string(),
  equipmentName: z.string(),
  checkType: z.enum(['DAILY_TEMPERATURE_CALIBRATION', 'CENTRIFUGE_RPM_CHECK', 'REAGENT_POSITIVE_NEGATIVE_CONTROL', 'STERILITY_CULTURE_CHECK']),
  parameterMeasured: z.string(),
  expectedStandard: z.string(),
  actualReading: z.string(),
  isPassed: z.boolean(),
  technicianName: z.string(),
  checkedAt: z.string()
});
export type BloodQualityCheckDto = z.infer<typeof BloodQualityCheckSchema>;

export const BloodStorageTemperatureLogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  unitLocation: z.string(),
  storageUnitType: z.enum(['BLOOD_BANK_REFRIGERATOR_4C', 'DEEP_FREEZER_MINUS_40C', 'PLATELET_AGITATOR_INCUBATOR_22C']),
  recordedTemperatureC: z.number(),
  targetMinC: z.number(),
  targetMaxC: z.number(),
  isExcursion: z.boolean(),
  recordedAt: z.string()
});
export type BloodStorageTemperatureLogDto = z.infer<typeof BloodStorageTemperatureLogSchema>;

export const BloodDiscardRecordSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  discardCode: z.string(),
  componentCode: z.string(),
  componentType: z.enum(BLOOD_COMPONENT_TYPES),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  reason: z.enum(DISCARD_REASONS),
  authorizedByPathologist: z.string(),
  disposalMethod: z.string(),
  discardedAt: z.string()
});
export type BloodDiscardRecordDto = z.infer<typeof BloodDiscardRecordSchema>;

export const BloodBankAuditTraceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  traceNumber: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityCode: z.string(),
  justification: z.string(),
  ipAddress: z.string(),
  integrityHash: z.string(),
  previousHash: z.string(),
  newState: z.record(z.unknown()),
  timestamp: z.string()
});
export type BloodBankAuditTraceDto = z.infer<typeof BloodBankAuditTraceSchema>;

export const BloodBankOverviewMetricsSchema = z.object({
  totalAvailableUnits: z.number().int().nonnegative(),
  quarantineUnitsCount: z.number().int().nonnegative(),
  prbcStockCount: z.number().int().nonnegative(),
  plateletStockCount: z.number().int().nonnegative(),
  ffpStockCount: z.number().int().nonnegative(),
  pendingRequestsCount: z.number().int().nonnegative(),
  activeCrossmatchesCount: z.number().int().nonnegative(),
  todaysTransfusionsCount: z.number().int().nonnegative(),
  reactionCasesUnderReview: z.number().int().nonnegative(),
  criticalLowBloodGroups: z.array(z.string())
});
export type BloodBankOverviewMetricsDto = z.infer<typeof BloodBankOverviewMetricsSchema>;

export const BloodBankAnalyticsSchema = z.object({
  inventoryByBloodGroup: z.array(z.object({ group: z.string(), count: z.number() })),
  transfusionsByDepartment: z.array(z.object({ department: z.string(), count: z.number() })),
  monthlyDonationTrends: z.array(z.object({ month: z.string(), count: z.number() })),
  wastageReasons: z.array(z.object({ reason: z.string(), count: z.number() }))
});
export type BloodBankAnalyticsDto = z.infer<typeof BloodBankAnalyticsSchema>;

// ============================================================================
// MUTATION REQUEST SCHEMAS
// ============================================================================

export const CreateDonorSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  fullName: z.string().min(1),
  gender: z.string().min(1),
  dateOfBirth: z.string(),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  contactNumber: z.string().min(1),
  email: z.string().optional(),
  donorType: z.enum(DONOR_TYPES)
});
export type CreateDonorRequest = z.infer<typeof CreateDonorSchema>;

export const ScreenDonorSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  donorId: z.string(),
  donorName: z.string().min(1),
  weightKg: z.number().positive(),
  hemoglobinGdl: z.number().positive(),
  systolicBp: z.number().int().positive(),
  diastolicBp: z.number().int().positive(),
  pulseBpm: z.number().int().positive(),
  temperatureF: z.number().positive(),
  medicalHistoryCleared: z.boolean(),
  screeningNurseName: z.string().min(1),
  eligibilityDecision: z.enum(DONOR_ELIGIBILITY_STATUSES),
  remarks: z.string().optional()
});
export type ScreenDonorRequest = z.infer<typeof ScreenDonorSchema>;

export const CreateDonationSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  donorId: z.string(),
  donorName: z.string().min(1),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  donationType: z.enum(DONOR_TYPES),
  collectedVolumeMl: z.number().int().positive().default(450),
  anticoagulantType: z.string().min(1).default('CPDA-1 (63ml)'),
  phlebotomistName: z.string().min(1),
  collectionLocation: z.string().min(1)
});
export type CreateDonationRequest = z.infer<typeof CreateDonationSchema>;

export const RecordBloodTestSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  donationId: z.string(),
  unitBarcode: z.string().min(1),
  aboGroupingResult: z.enum(ABO_GROUPS),
  rhFactorResult: z.enum(RH_FACTORS),
  antibodyScreen: z.enum(['NEGATIVE', 'POSITIVE_UNIDENTIFIED_ANTIBODIES']),
  hivResult: z.enum(['NON_REACTIVE', 'REACTIVE']),
  hBsAgResult: z.enum(['NON_REACTIVE', 'REACTIVE']),
  hcvResult: z.enum(['NON_REACTIVE', 'REACTIVE']),
  syphilisVDRLResult: z.enum(['NON_REACTIVE', 'REACTIVE']),
  malariaResult: z.enum(['NEGATIVE', 'POSITIVE']),
  testingTechnicianName: z.string().min(1),
  pathologistSignOffName: z.string().min(1),
  isPassedForRelease: z.boolean()
});
export type RecordBloodTestRequest = z.infer<typeof RecordBloodTestSchema>;

export const ReleaseBloodUnitSchema = z.object({
  tenantId: z.string(),
  unitId: z.string(),
  releasedByPathologist: z.string().min(1),
  verificationNotes: z.string().min(1)
});
export type ReleaseBloodUnitRequest = z.infer<typeof ReleaseBloodUnitSchema>;

export const CreateComponentSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  donationId: z.string(),
  componentType: z.enum(BLOOD_COMPONENT_TYPES),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  volumeMl: z.number().int().positive(),
  storageLocation: z.string().min(1),
  preparedByTechnician: z.string().min(1)
});
export type CreateComponentRequest = z.infer<typeof CreateComponentSchema>;

export const CreateBloodRequestSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  patientId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  encounterId: z.string(),
  requestingDepartment: z.string().min(1),
  orderingPhysicianName: z.string().min(1),
  requestedComponentType: z.enum(BLOOD_COMPONENT_TYPES),
  patientBloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  quantityUnits: z.number().int().positive(),
  urgency: z.enum(BLOOD_REQUEST_URGENCIES),
  clinicalIndication: z.string().min(1),
  requiredByTimestamp: z.string()
});
export type CreateBloodRequestRequest = z.infer<typeof CreateBloodRequestSchema>;

export const CreateCrossmatchSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  requestId: z.string(),
  componentId: z.string(),
  componentCode: z.string().min(1),
  patientName: z.string().min(1),
  patientBloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  donorBloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  majorCrossmatchResult: z.enum(['COMPATIBLE', 'INCOMPATIBLE']),
  minorCrossmatchResult: z.enum(['COMPATIBLE', 'INCOMPATIBLE']),
  coombsTestResult: z.enum(['NEGATIVE', 'POSITIVE']),
  overallResult: z.enum(CROSSMATCH_RESULTS),
  testingTechnicianName: z.string().min(1),
  verifiedByPathologist: z.string().min(1)
});
export type CreateCrossmatchRequest = z.infer<typeof CreateCrossmatchSchema>;

export const ReserveBloodUnitSchema = z.object({
  tenantId: z.string(),
  requestId: z.string(),
  componentId: z.string(),
  reservedByStaff: z.string().min(1)
});
export type ReserveBloodUnitRequest = z.infer<typeof ReserveBloodUnitSchema>;

export const IssueBloodUnitSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  requestId: z.string(),
  componentId: z.string(),
  componentCode: z.string().min(1),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  destinationDepartment: z.string().min(1),
  issuingTechnicianName: z.string().min(1),
  receivingNurseName: z.string().min(1),
  transportBoxTemperatureC: z.string().min(1)
});
export type IssueBloodUnitRequest = z.infer<typeof IssueBloodUnitSchema>;

export const RecordTransfusionSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  encounterId: z.string(),
  componentCode: z.string().min(1),
  componentType: z.enum(BLOOD_COMPONENT_TYPES),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  administeredByNurse: z.string().min(1),
  supervisingDoctorName: z.string().min(1),
  startTime: z.string(),
  preTransfusionPulse: z.number().int().positive(),
  preTransfusionBp: z.string().min(1),
  preTransfusionTempF: z.number().positive()
});
export type RecordTransfusionRequest = z.infer<typeof RecordTransfusionSchema>;

export const RecordTransfusionObservationSchema = z.object({
  tenantId: z.string(),
  transfusionId: z.string(),
  endTime: z.string(),
  postTransfusionPulse: z.number().int().positive(),
  postTransfusionBp: z.string().min(1),
  postTransfusionTempF: z.number().positive(),
  adverseReactionNoted: z.boolean(),
  status: z.enum(['COMPLETED_UNEVENTFUL', 'HALTED_DUE_TO_REACTION']),
  outcomeNotes: z.string().optional()
});
export type RecordTransfusionObservationRequest = z.infer<typeof RecordTransfusionObservationSchema>;

export const ReportTransfusionReactionSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  transfusionId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  componentCode: z.string().min(1),
  severity: z.enum(TRANSFUSION_REACTION_SEVERITIES),
  symptomsObserved: z.string().min(1),
  immediateInterventions: z.string().min(1),
  notifiedPhysicianName: z.string().min(1),
  clericalCheckConfirmedMatching: z.boolean()
});
export type ReportTransfusionReactionRequest = z.infer<typeof ReportTransfusionReactionSchema>;

export const ReturnBloodUnitSchema = z.object({
  tenantId: z.string(),
  componentId: z.string(),
  returnedByNurse: z.string().min(1),
  returnReason: z.string().min(1),
  transportTemperatureMaintained: z.boolean(),
  reEntryApproved: z.boolean(),
  evaluatingOfficer: z.string().min(1)
});
export type ReturnBloodUnitRequest = z.infer<typeof ReturnBloodUnitSchema>;

export const DiscardBloodUnitSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  componentCode: z.string().min(1),
  componentType: z.enum(BLOOD_COMPONENT_TYPES),
  bloodGroup: z.enum(TRANSFUSION_BLOOD_GROUPS),
  reason: z.enum(DISCARD_REASONS),
  authorizedByPathologist: z.string().min(1),
  disposalMethod: z.string().min(1)
});
export type DiscardBloodUnitRequest = z.infer<typeof DiscardBloodUnitSchema>;

export const CreateQualityCheckSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  equipmentName: z.string().min(1),
  checkType: z.enum(['DAILY_TEMPERATURE_CALIBRATION', 'CENTRIFUGE_RPM_CHECK', 'REAGENT_POSITIVE_NEGATIVE_CONTROL', 'STERILITY_CULTURE_CHECK']),
  parameterMeasured: z.string().min(1),
  expectedStandard: z.string().min(1),
  actualReading: z.string().min(1),
  isPassed: z.boolean(),
  technicianName: z.string().min(1)
});
export type CreateQualityCheckRequest = z.infer<typeof CreateQualityCheckSchema>;

export const RecordTemperatureSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  unitLocation: z.string().min(1),
  storageUnitType: z.enum(['BLOOD_BANK_REFRIGERATOR_4C', 'DEEP_FREEZER_MINUS_40C', 'PLATELET_AGITATOR_INCUBATOR_22C']),
  recordedTemperatureC: z.number(),
  targetMinC: z.number(),
  targetMaxC: z.number()
});
export type RecordTemperatureRequest = z.infer<typeof RecordTemperatureSchema>;

export const ResolveStorageExcursionSchema = z.object({
  tenantId: z.string(),
  logId: z.string(),
  correctiveActionTaken: z.string().min(1),
  resolvedByOfficer: z.string().min(1)
});
export type ResolveStorageExcursionRequest = z.infer<typeof ResolveStorageExcursionSchema>;
