import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const ESI_LEVELS = [
  'ESI_1_IMMEDIATE_RESUSCITATION',
  'ESI_2_EMERGENT_HIGH_RISK',
  'ESI_3_URGENT_MULTIPLE_RESOURCES',
  'ESI_4_LESS_URGENT_ONE_RESOURCE',
  'ESI_5_NON_URGENT_NO_RESOURCES'
] as const;
export type ESILevel = (typeof ESI_LEVELS)[number];

export const EMERGENCY_ARRIVAL_MODES = [
  'WALK_IN',
  'AMBULANCE_GROUND',
  'AMBULANCE_AIR',
  'POLICE_ESCORT',
  'INTER_FACILITY_TRANSFER',
  'REFERRAL_HOSPITAL',
  'MASS_CASUALTY_DISASTER'
] as const;
export type EmergencyArrivalMode = (typeof EMERGENCY_ARRIVAL_MODES)[number];

export const EMERGENCY_ENCOUNTER_STATUSES = [
  'ARRIVED',
  'REGISTERED',
  'TRIAGE_PENDING',
  'TRIAGED',
  'WAITING',
  'IN_TREATMENT',
  'RESUSCITATION',
  'OBSERVATION',
  'DISPOSITION_PENDING',
  'DISCHARGED',
  'ADMITTED',
  'TRANSFERRED',
  'REFERRED',
  'LEFT_AGAINST_MEDICAL_ADVICE',
  'DECEASED',
  'CANCELLED'
] as const;
export type EmergencyEncounterStatus = (typeof EMERGENCY_ENCOUNTER_STATUSES)[number];

export const EMERGENCY_ZONE_TYPES = [
  'RESUSCITATION_BAY',
  'TRAUMA_SUITE',
  'MAJOR_ACUTE_ZONE',
  'OBSERVATION_UNIT',
  'MINOR_TREATMENT_FAST_TRACK',
  'PROCEDURE_ROOM',
  'ISOLATION_ROOM',
  'PEDIATRIC_EMERGENCY',
  'TRIAGE_AREA',
  'WAITING_AREA',
  'AMBULANCE_BAY'
] as const;
export type EmergencyZoneType = (typeof EMERGENCY_ZONE_TYPES)[number];

export const TRAUMA_ACTIVATION_LEVELS = [
  'LEVEL_1_HIGHEST_TRAUMA_ALERT',
  'LEVEL_2_INTERMEDIATE_TRAUMA_ALERT',
  'LEVEL_3_CONSULT_TRAUMA',
  'CODE_RED_MASS_CASUALTY'
] as const;
export type TraumaActivationLevel = (typeof TRAUMA_ACTIVATION_LEVELS)[number];

export const RESUSCITATION_RHYTHMS = [
  'VENTRICULAR_FIBRILLATION',
  'PULSELESS_VT',
  'ASYSTOLE',
  'PEA',
  'ROSC_ACHIEVED',
  'SINUS_TACHYCARDIA',
  'BRADYCARDIA'
] as const;
export type ResuscitationRhythm = (typeof RESUSCITATION_RHYTHMS)[number];

export const MLC_CASE_TYPES = [
  'ROAD_TRAFFIC_ACCIDENT',
  'PHYSICAL_ASSAULT',
  'GUNSHOT_OR_STAB_WOUND',
  'SUSPECTED_POISONING',
  'BURNS_AND_ELECTROCUTION',
  'INDUSTRIAL_ACCIDENT',
  'SEXUAL_ASSAULT_EXAMINATION',
  'HANGING_OR_STRANGULATION',
  'UNKNOWN_UNCONSCIOUS_TRAUMA',
  'OTHER_MEDICO_LEGAL'
] as const;
export type MLCCaseType = (typeof MLC_CASE_TYPES)[number];

export const DISPOSITION_OUTCOMES = [
  'DISCHARGE_HOME',
  'IPD_ADMISSION_WARD',
  'IPD_ADMISSION_HDU',
  'IPD_ADMISSION_ICU',
  'OPERATION_THEATRE_STAT',
  'INTER_HOSPITAL_TRANSFER',
  'OBSERVATION_EXTENDED',
  'LEFT_AGAINST_MEDICAL_ADVICE',
  'BROUGHT_DEAD_ON_ARRIVAL',
  'DECEASED_IN_EMERGENCY'
] as const;
export type DispositionOutcome = (typeof DISPOSITION_OUTCOMES)[number];

// ============================================================================
// DTOs & SCHEMAS
// ============================================================================

export const EmergencyDepartmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  departmentCode: z.string(),
  departmentName: z.string(),
  totalBeds: z.number().int().nonnegative(),
  resuscitationBeds: z.number().int().nonnegative(),
  traumaBeds: z.number().int().nonnegative(),
  observationBeds: z.number().int().nonnegative(),
  headOfEmergency: z.string(),
  isDisasterModeActive: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type EmergencyDepartmentDto = z.infer<typeof EmergencyDepartmentSchema>;

export const EmergencyZoneSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  departmentId: z.string(),
  zoneCode: z.string(),
  zoneName: z.string(),
  zoneType: z.enum(EMERGENCY_ZONE_TYPES),
  capacity: z.number().int().positive(),
  occupiedCount: z.number().int().nonnegative(),
  chargePerHour: z.number().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type EmergencyZoneDto = z.infer<typeof EmergencyZoneSchema>;

export const EmergencyEncounterSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterNumber: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  isUnknownPatient: z.boolean(),
  temporaryIdentifier: z.string().optional(),
  patientGender: z.string(),
  patientAge: z.number().int().optional(),
  arrivalMode: z.enum(EMERGENCY_ARRIVAL_MODES),
  broughtBy: z.string(),
  referralSource: z.string().optional(),
  chiefComplaint: z.string(),
  arrivalTimestamp: z.string(),
  registrationTimestamp: z.string(),
  currentStatus: z.enum(EMERGENCY_ENCOUNTER_STATUSES),
  currentZoneId: z.string().optional(),
  currentZoneName: z.string().optional(),
  currentBedNumber: z.string().optional(),
  assignedPhysicianName: z.string().optional(),
  assignedNurseName: z.string().optional(),
  triageEsiLevel: z.enum(ESI_LEVELS).optional(),
  isTraumaAlert: z.boolean(),
  isCodeBlue: z.boolean(),
  isMLC: z.boolean(),
  mlcCaseNumber: z.string().optional(),
  dispositionOutcome: z.enum(DISPOSITION_OUTCOMES).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type EmergencyEncounterDto = z.infer<typeof EmergencyEncounterSchema>;

export const EmergencyTriageAssessmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  triageNurseName: z.string(),
  esiLevel: z.enum(ESI_LEVELS),
  chiefComplaint: z.string(),
  painScore: z.number().int().min(0).max(10),
  systolicBp: z.number().int(),
  diastolicBp: z.number().int(),
  pulseRate: z.number().int(),
  respiratoryRate: z.number().int(),
  temperatureF: z.number(),
  spo2Percentage: z.number(),
  gcsScore: z.number().int().min(3).max(15),
  bloodGlucoseMgDl: z.number().optional(),
  isPregnant: z.boolean().optional(),
  allergiesNoted: z.string(),
  highRiskIndicators: z.string().optional(),
  sepsisScreenPositive: z.boolean(),
  strokeScreenPositive: z.boolean(),
  stemiScreenPositive: z.boolean(),
  triageNotes: z.string(),
  timestamp: z.string()
});
export type EmergencyTriageAssessmentDto = z.infer<typeof EmergencyTriageAssessmentSchema>;

export const EmergencyTriageReassessmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  reassessedByNurse: z.string(),
  previousEsi: z.enum(ESI_LEVELS),
  newEsi: z.enum(ESI_LEVELS),
  justification: z.string(),
  reassessmentVitalsSummary: z.string(),
  timestamp: z.string()
});
export type EmergencyTriageReassessmentDto = z.infer<typeof EmergencyTriageReassessmentSchema>;

export const EmergencyResuscitationEventSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  eventNumber: z.string(),
  locationBay: z.string(),
  teamLeaderName: z.string(),
  initialRhythm: z.enum(RESUSCITATION_RHYTHMS),
  startTime: z.string(),
  endTime: z.string().optional(),
  cprDurationMinutes: z.number().int().nonnegative(),
  shocksDeliveredCount: z.number().int().nonnegative(),
  airwaySecuredType: z.string(),
  medicationsAdministeredSummary: z.string(),
  roscAchieved: z.boolean(),
  finalOutcome: z.string(),
  notes: z.string(),
  createdAt: z.string()
});
export type EmergencyResuscitationEventDto = z.infer<typeof EmergencyResuscitationEventSchema>;

export const TraumaActivationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  activationNumber: z.string(),
  activationLevel: z.enum(TRAUMA_ACTIVATION_LEVELS),
  mechanismOfInjury: z.string(),
  timeOfInjury: z.string(),
  traumaTeamLeader: z.string(),
  airwayStatus: z.string(),
  breathingStatus: z.string(),
  circulationStatus: z.string(),
  disabilityGcs: z.number().int().min(3).max(15),
  exposureFindings: z.string(),
  fastScanPositive: z.boolean(),
  pelvicBinderApplied: z.boolean(),
  massiveTransfusionActivated: z.boolean(),
  specialistConsultsCalled: z.string(),
  dispositionPlan: z.string(),
  activatedAt: z.string(),
  closedAt: z.string().optional()
});
export type TraumaActivationDto = z.infer<typeof TraumaActivationSchema>;

export const EmergencyObservationCaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  observationBedNumber: z.string(),
  admissionReason: z.string(),
  attendingDoctor: z.string(),
  startedAt: z.string(),
  clinicalProgressSummary: z.string(),
  hoursInObservation: z.number(),
  status: z.enum(['ACTIVE_MONITORING', 'READY_FOR_DISCHARGE', 'ESCALATING_TO_IPD']),
  finalDecisionNotes: z.string().optional()
});
export type EmergencyObservationCaseDto = z.infer<typeof EmergencyObservationCaseSchema>;

export const EmergencyMLCCaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  mlcNumber: z.string(),
  caseType: z.enum(MLC_CASE_TYPES),
  policeStation: z.string(),
  policeOfficerName: z.string(),
  policeBadgeNumber: z.string().optional(),
  firNumber: z.string().optional(),
  injuryDescription: z.string(),
  evidenceItemsCollected: z.string(),
  chainOfCustodyCustodian: z.string(),
  governmentNotificationSent: z.boolean(),
  registeredByDoctor: z.string(),
  timestamp: z.string()
});
export type EmergencyMLCCaseDto = z.infer<typeof EmergencyMLCCaseSchema>;

export const EmergencyCrashCartSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  cartCode: z.string(),
  locationZone: z.string(),
  sealNumber: z.string(),
  isSealIntact: z.boolean(),
  lastCheckedAt: z.string(),
  lastCheckedBy: z.string(),
  defibrillatorBatteryPercent: z.number().int().min(0).max(100),
  oxygenCylinderPressurePsi: z.number().int(),
  hasExpiredItems: z.boolean(),
  status: z.enum(['READY', 'NEEDS_RESTOCKING', 'SEAL_BROKEN_USED'])
});
export type EmergencyCrashCartDto = z.infer<typeof EmergencyCrashCartSchema>;

export const EmergencyAmbulanceTransferSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  transferCode: z.string(),
  patientName: z.string(),
  ambulanceNumber: z.string(),
  transportType: z.enum(['INBOUND_RECEIVAL', 'OUTBOUND_INTER_FACILITY']),
  sendingFacility: z.string(),
  receivingFacility: z.string(),
  accompanyingParamedic: z.string(),
  transferReason: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string().optional(),
  status: z.enum(['DISPATCHED', 'IN_TRANSIT', 'ARRIVED_HANDOVER_COMPLETE'])
});
export type EmergencyAmbulanceTransferDto = z.infer<typeof EmergencyAmbulanceTransferSchema>;

export const EmergencyDispositionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  outcome: z.enum(DISPOSITION_OUTCOMES),
  authorizingPhysician: z.string(),
  destinationWardOrFacility: z.string().optional(),
  clinicalSummary: z.string(),
  followUpInstructions: z.string().optional(),
  dispositionTimestamp: z.string()
});
export type EmergencyDispositionDto = z.infer<typeof EmergencyDispositionSchema>;

export const EmergencyDeathRecordSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  deathCertificateNumber: z.string(),
  patientName: z.string(),
  isBroughtDead: z.boolean(),
  declaredDeadTimestamp: z.string(),
  declaringPhysician: z.string(),
  primaryCauseOfDeath: z.string(),
  secondaryCauses: z.string().optional(),
  mortuaryHandoverStaff: z.string(),
  policeInformed: z.boolean(),
  notes: z.string()
});
export type EmergencyDeathRecordDto = z.infer<typeof EmergencyDeathRecordSchema>;

export const EmergencyDisasterEventSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  incidentCode: z.string(),
  disasterType: z.string(),
  incidentCommanderName: z.string(),
  totalVictimsCount: z.number().int().nonnegative(),
  criticalVictimsCount: z.number().int().nonnegative(),
  activatedAt: z.string(),
  isDeactivated: z.boolean(),
  deactivatedAt: z.string().optional()
});
export type EmergencyDisasterEventDto = z.infer<typeof EmergencyDisasterEventSchema>;

export const EmergencyAuditTraceSchema = z.object({
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
export type EmergencyAuditTraceDto = z.infer<typeof EmergencyAuditTraceSchema>;

export const EmergencyOverviewMetricsSchema = z.object({
  activeEDCensus: z.number().int().nonnegative(),
  waitingForTriageCount: z.number().int().nonnegative(),
  esi1Count: z.number().int().nonnegative(),
  esi2Count: z.number().int().nonnegative(),
  esi3Count: z.number().int().nonnegative(),
  activeTraumaAlerts: z.number().int().nonnegative(),
  activeResuscitationCount: z.number().int().nonnegative(),
  mlcCasesToday: z.number().int().nonnegative(),
  observationPatientsCount: z.number().int().nonnegative(),
  averageDoorToDoctorMinutes: z.number().nonnegative(),
  averageDoorToTriageMinutes: z.number().nonnegative(),
  isDisasterModeActive: z.boolean()
});
export type EmergencyOverviewMetricsDto = z.infer<typeof EmergencyOverviewMetricsSchema>;

export const EmergencyAnalyticsSchema = z.object({
  esiDistribution: z.array(z.object({ esiLevel: z.string(), count: z.number() })),
  arrivalModes: z.array(z.object({ mode: z.string(), count: z.number() })),
  hourlyVolume: z.array(z.object({ hourLabel: z.string(), count: z.number() })),
  dispositionBreakdown: z.array(z.object({ outcome: z.string(), count: z.number() }))
});
export type EmergencyAnalyticsDto = z.infer<typeof EmergencyAnalyticsSchema>;

// ============================================================================
// MUTATION REQUEST SCHEMAS
// ============================================================================

export const RegisterEmergencyPatientSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  patientName: z.string().min(1),
  patientMrn: z.string().min(1),
  isUnknownPatient: z.boolean().default(false),
  temporaryIdentifier: z.string().optional(),
  patientGender: z.string(),
  patientAge: z.number().int().optional(),
  arrivalMode: z.enum(EMERGENCY_ARRIVAL_MODES),
  broughtBy: z.string().min(1),
  referralSource: z.string().optional(),
  chiefComplaint: z.string().min(1),
  zoneId: z.string().optional()
});
export type RegisterEmergencyPatientRequest = z.infer<typeof RegisterEmergencyPatientSchema>;

export const CreateTriageAssessmentSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  triageNurseName: z.string().min(1),
  esiLevel: z.enum(ESI_LEVELS),
  chiefComplaint: z.string().min(1),
  painScore: z.number().int().min(0).max(10),
  systolicBp: z.number().int(),
  diastolicBp: z.number().int(),
  pulseRate: z.number().int(),
  respiratoryRate: z.number().int(),
  temperatureF: z.number(),
  spo2Percentage: z.number(),
  gcsScore: z.number().int().min(3).max(15),
  allergiesNoted: z.string(),
  sepsisScreenPositive: z.boolean().default(false),
  strokeScreenPositive: z.boolean().default(false),
  stemiScreenPositive: z.boolean().default(false),
  triageNotes: z.string()
});
export type CreateTriageAssessmentRequest = z.infer<typeof CreateTriageAssessmentSchema>;

export const ReassessTriageSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  reassessedByNurse: z.string().min(1),
  newEsi: z.enum(ESI_LEVELS),
  justification: z.string().min(1),
  reassessmentVitalsSummary: z.string()
});
export type ReassessTriageRequest = z.infer<typeof ReassessTriageSchema>;

export const AssignEmergencyPatientSchema = z.object({
  tenantId: z.string(),
  encounterId: z.string(),
  zoneId: z.string(),
  bedNumber: z.string(),
  assignedPhysicianName: z.string(),
  assignedNurseName: z.string(),
  assignedBy: z.string()
});
export type AssignEmergencyPatientRequest = z.infer<typeof AssignEmergencyPatientSchema>;

export const CreateResuscitationEventSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  locationBay: z.string(),
  teamLeaderName: z.string(),
  initialRhythm: z.enum(RESUSCITATION_RHYTHMS),
  airwaySecuredType: z.string(),
  notes: z.string()
});
export type CreateResuscitationEventRequest = z.infer<typeof CreateResuscitationEventSchema>;

export const RecordResuscitationActionSchema = z.object({
  tenantId: z.string(),
  eventId: z.string(),
  actionTaken: z.string(),
  cprDurationMinutes: z.number().int().nonnegative(),
  shocksDeliveredCount: z.number().int().nonnegative(),
  medicationsAdministeredSummary: z.string(),
  roscAchieved: z.boolean(),
  finalOutcome: z.string(),
  recordedBy: z.string()
});
export type RecordResuscitationActionRequest = z.infer<typeof RecordResuscitationActionSchema>;

export const CreateTraumaActivationSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  activationLevel: z.enum(TRAUMA_ACTIVATION_LEVELS),
  mechanismOfInjury: z.string(),
  timeOfInjury: z.string(),
  traumaTeamLeader: z.string(),
  airwayStatus: z.string(),
  breathingStatus: z.string(),
  circulationStatus: z.string(),
  disabilityGcs: z.number().int().min(3).max(15),
  exposureFindings: z.string(),
  fastScanPositive: z.boolean().default(false),
  pelvicBinderApplied: z.boolean().default(false),
  massiveTransfusionActivated: z.boolean().default(false),
  specialistConsultsCalled: z.string(),
  dispositionPlan: z.string()
});
export type CreateTraumaActivationRequest = z.infer<typeof CreateTraumaActivationSchema>;

export const RecordTraumaAssessmentSchema = z.object({
  tenantId: z.string(),
  traumaId: z.string(),
  secondarySurveyFindings: z.string(),
  fracturesIdentified: z.string(),
  updatedGcs: z.number().int().min(3).max(15),
  consultantSurgeonFindings: z.string(),
  recordedBy: z.string()
});
export type RecordTraumaAssessmentRequest = z.infer<typeof RecordTraumaAssessmentSchema>;

export const CreateEmergencyProcedureSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  procedureName: z.string(),
  performedByDoctor: z.string(),
  assistingStaff: z.string(),
  indication: z.string(),
  techniqueNotes: z.string(),
  complications: z.string().default('None')
});
export type CreateEmergencyProcedureRequest = z.infer<typeof CreateEmergencyProcedureSchema>;

export const CreateObservationCaseSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  observationBedNumber: z.string(),
  admissionReason: z.string(),
  attendingDoctor: z.string(),
  clinicalProgressSummary: z.string()
});
export type CreateObservationCaseRequest = z.infer<typeof CreateObservationCaseSchema>;

export const CreateMLCCaseSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  caseType: z.enum(MLC_CASE_TYPES),
  policeStation: z.string(),
  policeOfficerName: z.string(),
  policeBadgeNumber: z.string().optional(),
  firNumber: z.string().optional(),
  injuryDescription: z.string(),
  evidenceItemsCollected: z.string(),
  chainOfCustodyCustodian: z.string(),
  registeredByDoctor: z.string()
});
export type CreateMLCCaseRequest = z.infer<typeof CreateMLCCaseSchema>;

export const CreateAmbulanceTransferSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  ambulanceNumber: z.string(),
  transportType: z.enum(['INBOUND_RECEIVAL', 'OUTBOUND_INTER_FACILITY']),
  sendingFacility: z.string(),
  receivingFacility: z.string(),
  accompanyingParamedic: z.string(),
  transferReason: z.string()
});
export type CreateAmbulanceTransferRequest = z.infer<typeof CreateAmbulanceTransferSchema>;

export const CreateDispositionSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  outcome: z.enum(DISPOSITION_OUTCOMES),
  authorizingPhysician: z.string(),
  destinationWardOrFacility: z.string().optional(),
  clinicalSummary: z.string(),
  followUpInstructions: z.string().optional()
});
export type CreateDispositionRequest = z.infer<typeof CreateDispositionSchema>;

export const CreateEmergencyDeathRecordSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  encounterId: z.string(),
  patientName: z.string(),
  isBroughtDead: z.boolean(),
  declaringPhysician: z.string(),
  primaryCauseOfDeath: z.string(),
  mortuaryHandoverStaff: z.string(),
  policeInformed: z.boolean(),
  notes: z.string()
});
export type CreateEmergencyDeathRecordRequest = z.infer<typeof CreateEmergencyDeathRecordSchema>;

export const ActivateDisasterModeSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  disasterType: z.string(),
  incidentCommanderName: z.string(),
  justification: z.string()
});
export type ActivateDisasterModeRequest = z.infer<typeof ActivateDisasterModeSchema>;

export const RegisterDisasterPatientSchema = z.object({
  tenantId: z.string(),
  partnerId: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  disasterIncidentCode: z.string(),
  temporaryIdentifier: z.string(),
  estimatedAge: z.number().int().optional(),
  gender: z.string(),
  triageTagColor: z.enum(['RED_IMMEDIATE', 'YELLOW_DELAYED', 'GREEN_MINOR', 'BLACK_DECEASED']),
  primaryZoneAssigned: z.string()
});
export type RegisterDisasterPatientRequest = z.infer<typeof RegisterDisasterPatientSchema>;

export const CheckCrashCartSchema = z.object({
  tenantId: z.string(),
  cartId: z.string(),
  sealNumber: z.string(),
  isSealIntact: z.boolean(),
  defibrillatorBatteryPercent: z.number().int().min(0).max(100),
  oxygenCylinderPressurePsi: z.number().int(),
  hasExpiredItems: z.boolean(),
  checkedByStaff: z.string(),
  notes: z.string().optional()
});
export type CheckCrashCartRequest = z.infer<typeof CheckCrashCartSchema>;
