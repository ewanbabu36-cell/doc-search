import { z } from 'zod';

/**
 * Phase 2.13 — Operation Theatre (OT) & Surgery Management Enums
 */

export const OTStatusEnum = z.enum([
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'CLEANING',
  'BLOCKED',
  'EMERGENCY_ONLY',
  'INACTIVE'
]);
export type OTStatus = z.infer<typeof OTStatusEnum>;

export const OTTypeEnum = z.enum([
  'MAJOR_OT',
  'MINOR_OT',
  'EMERGENCY_OT',
  'OBSTETRIC_OT',
  'ORTHOPAEDIC_OT',
  'CARDIAC_OT',
  'NEUROSURGERY_OT',
  'OPHTHALMIC_OT',
  'ENT_OT',
  'UROLOGY_OT',
  'DAYCARE_OT'
]);
export type OTType = z.infer<typeof OTTypeEnum>;

export const SurgicalSpecialtyEnum = z.enum([
  'GENERAL_SURGERY',
  'ORTHOPAEDICS',
  'CARDIOTHORACIC',
  'NEUROSURGERY',
  'OBSTETRICS_GYNECOLOGY',
  'UROLOGY',
  'OPHTHALMOLOGY',
  'ENT_HEAD_NECK',
  'PLASTIC_RECONSTRUCTIVE',
  'PAEDIATRIC_SURGERY',
  'SURGICAL_ONCOLOGY',
  'VASCULAR_SURGERY'
]);
export type SurgicalSpecialty = z.infer<typeof SurgicalSpecialtyEnum>;

export const ProcedureCategoryEnum = z.enum([
  'ELECTIVE',
  'EMERGENCY',
  'URGENT',
  'DAY_CARE',
  'MINOR_PROCEDURE',
  'MAJOR_PROCEDURE',
  'SUPRA_MAJOR'
]);
export type ProcedureCategory = z.infer<typeof ProcedureCategoryEnum>;

export const AnaesthesiaTypeEnum = z.enum([
  'GENERAL_ANAESTHESIA',
  'SPINAL_ANAESTHESIA',
  'EPIDURAL_ANAESTHESIA',
  'REGIONAL_NERVE_BLOCK',
  'MONITORED_ANAESTHESIA_CARE_MAC',
  'LOCAL_ANAESTHESIA',
  'CONSCIOUS_SEDATION',
  'TOPICAL'
]);
export type AnaesthesiaType = z.infer<typeof AnaesthesiaTypeEnum>;

export const SurgeryRequestStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
]);
export type SurgeryRequestStatus = z.infer<typeof SurgeryRequestStatusEnum>;

export const PreOpFitnessStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'CLEARED',
  'CONDITIONALLY_CLEARED',
  'NOT_CLEARED',
  'EXPIRED'
]);
export type PreOpFitnessStatus = z.infer<typeof PreOpFitnessStatusEnum>;

export const ASAClassEnum = z.enum([
  'ASA_I_NORMAL_HEALTHY',
  'ASA_II_MILD_SYSTEMIC_DISEASE',
  'ASA_III_SEVERE_SYSTEMIC_DISEASE',
  'ASA_IV_LIFE_THREATENING_DISEASE',
  'ASA_V_MORIBUND_PATIENT',
  'ASA_VI_BRAIN_DEAD_ORGAN_DONOR',
  'ASA_E_EMERGENCY_MODIFIER'
]);
export type ASAClass = z.infer<typeof ASAClassEnum>;

export const OTScheduleStatusEnum = z.enum([
  'DRAFT',
  'RESERVED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED',
  'DELAYED'
]);
export type OTScheduleStatus = z.infer<typeof OTScheduleStatusEnum>;

export const SurgicalSafetyStageEnum = z.enum([
  'SIGN_IN',
  'TIME_OUT',
  'SIGN_OUT'
]);
export type SurgicalSafetyStage = z.infer<typeof SurgicalSafetyStageEnum>;

export const PACUStatusEnum = z.enum([
  'ARRIVED',
  'RECOVERING',
  'READY_FOR_TRANSFER',
  'TRANSFERRED',
  'ESCALATED'
]);
export type PACUStatus = z.infer<typeof PACUStatusEnum>;

/**
 * DTOs & Entity Schemas
 */

export const OperationTheatreComplexDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  complexCode: z.string(),
  complexName: z.string(),
  building: z.string(),
  floor: z.string(),
  headOfOT: z.string().nullable().optional(),
  totalRooms: z.number().int(),
  activeRooms: z.number().int(),
  operatingHours: z.string(),
  hasLaminarAirflow: z.boolean(),
  hasCentralSterileSupply: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperationTheatreComplexDto = z.infer<typeof OperationTheatreComplexDtoSchema>;

export const OperationTheatreRoomDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  complexId: z.string().uuid(),
  complexName: z.string().optional(),
  roomNumber: z.string(),
  roomName: z.string(),
  otType: OTTypeEnum,
  status: OTStatusEnum,
  primarySpecialty: SurgicalSpecialtyEnum,
  supportedSpecialties: z.array(z.string()),
  hasPendantSystem: z.boolean(),
  hasCardiacMonitor: z.boolean(),
  hasAnaesthesiaWorkstation: z.boolean(),
  hasC臂Fluoroscopy: z.boolean().optional(),
  hasLaminarFlow: z.boolean(),
  hasHepaFilter: z.boolean(),
  lastCleanedAt: z.string().datetime().nullable().optional(),
  hourlyRate: z.number(),
  isActive: z.boolean(),
  currentSurgeryId: z.string().uuid().nullable().optional(),
  currentPatientName: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperationTheatreRoomDto = z.infer<typeof OperationTheatreRoomDtoSchema>;

export const SurgicalProcedureDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  procedureCode: z.string(),
  procedureName: z.string(),
  specialty: SurgicalSpecialtyEnum,
  category: ProcedureCategoryEnum,
  defaultDurationMinutes: z.number().int(),
  recommendedAnaesthesia: AnaesthesiaTypeEnum,
  requiresImplant: z.boolean(),
  requiresBloodCrossmatch: z.boolean(),
  requiresICUStay: z.boolean(),
  baseProcedureCharge: z.number(),
  cptOrIcdCode: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SurgicalProcedureDto = z.infer<typeof SurgicalProcedureDtoSchema>;

export const SurgeryRequestDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  requestNumber: z.string(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  patientAge: z.number().int(),
  patientGender: z.string(),
  encounterId: z.string().uuid().nullable().optional(),
  admissionId: z.string().uuid().nullable().optional(),
  requestingDoctorName: z.string(),
  primarySurgeonName: z.string(),
  specialty: SurgicalSpecialtyEnum,
  procedureId: z.string().uuid(),
  procedureName: z.string(),
  preOperativeDiagnosis: z.string(),
  clinicalIndication: z.string(),
  category: ProcedureCategoryEnum,
  priority: z.string(),
  isEmergency: z.boolean(),
  proposedSurgeryDate: z.string().datetime(),
  estimatedDurationMinutes: z.number().int(),
  requiredAnaesthesia: AnaesthesiaTypeEnum,
  implantRequirementDetails: z.string().nullable().optional(),
  bloodComponentsRequired: z.string().nullable().optional(),
  specialEquipmentRequired: z.string().nullable().optional(),
  pacClearanceStatus: PreOpFitnessStatusEnum,
  status: SurgeryRequestStatusEnum,
  decisionNotes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SurgeryRequestDto = z.infer<typeof SurgeryRequestDtoSchema>;

export const PreOperativeAssessmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  surgeryRequestId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  assessedByAnaesthetist: z.string(),
  assessmentDate: z.string().datetime(),
  asaClassification: ASAClassEnum,
  airwayMallampatiScore: z.number().int(),
  npoStatusHours: z.number().int(),
  cardiacClearanceGiven: z.boolean(),
  respiratoryClearanceGiven: z.boolean(),
  allergiesNoted: z.string().nullable().optional(),
  currentMedicationsNoted: z.string().nullable().optional(),
  lastHaemoglobinGdl: z.number().nullable().optional(),
  coagulationProfileStatus: z.string().nullable().optional(),
  bloodArrangementUnits: z.number().int(),
  fitnessStatus: PreOpFitnessStatusEnum,
  anaesthesiaPlanNotes: z.string(),
  riskFactorsSummary: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PreOperativeAssessmentDto = z.infer<typeof PreOperativeAssessmentDtoSchema>;

export const SurgicalConsentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  surgeryRequestId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  consentNumber: z.string(),
  procedureConsentGiven: z.boolean(),
  anaesthesiaConsentGiven: z.boolean(),
  bloodTransfusionConsentGiven: z.boolean(),
  highRiskConsentGiven: z.boolean(),
  implantConsentGiven: z.boolean(),
  consentingPersonName: z.string(),
  relationshipToPatient: z.string(),
  counselledByDoctor: z.string(),
  witnessName: z.string(),
  isSignedDigitally: z.boolean(),
  consentTimestamp: z.string().datetime(),
  status: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().datetime()
});
export type SurgicalConsentDto = z.infer<typeof SurgicalConsentDtoSchema>;

export const OTScheduleDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleNumber: z.string(),
  surgeryRequestId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  procedureName: z.string(),
  roomId: z.string().uuid(),
  roomName: z.string(),
  scheduledDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  estimatedDurationMinutes: z.number().int(),
  primarySurgeonName: z.string(),
  assistantSurgeonName: z.string().nullable().optional(),
  leadAnaesthetistName: z.string(),
  anaesthesiaTechName: z.string().nullable().optional(),
  scrubNurseName: z.string(),
  circulatingNurseName: z.string(),
  isEmergency: z.boolean(),
  status: OTScheduleStatusEnum,
  delayReason: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OTScheduleDto = z.infer<typeof OTScheduleDtoSchema>;

export const PreOpChecklistDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  verifiedByNurse: z.string(),
  patientIdentityVerified: z.boolean(),
  surgicalSiteMarked: z.boolean(),
  consentVerified: z.boolean(),
  npoVerified: z.boolean(),
  allergiesChecked: z.boolean(),
  preOpVitalsChecked: z.boolean(),
  labReportsAvailable: z.boolean(),
  imagingAvailable: z.boolean(),
  bloodReservedAndChecked: z.boolean(),
  implantsVerifiedInOT: z.boolean(),
  denturesJewelryRemoved: z.boolean(),
  preMedicationAdministered: z.boolean(),
  isClearedForOT: z.boolean(),
  notes: z.string().nullable().optional(),
  completedAt: z.string().datetime()
});
export type PreOpChecklistDto = z.infer<typeof PreOpChecklistDtoSchema>;

export const SurgicalSafetyChecklistDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  stage: SurgicalSafetyStageEnum,
  conductedBy: z.string(),
  conductedRole: z.string(),
  patientConfirmed: z.boolean(),
  siteMarkingConfirmed: z.boolean(),
  anaesthesiaMachineChecked: z.boolean(),
  pulseOximeterFunctioning: z.boolean(),
  knownAllergyConfirmed: z.boolean(),
  difficultAirwayRiskEvaluated: z.boolean(),
  bloodLossRiskEvaluated: z.boolean(),
  teamIntroducedRoles: z.boolean(),
  antibioticProphylaxisGiven: z.boolean(),
  essentialImagingDisplayed: z.boolean(),
  spongeCountCorrect: z.boolean(),
  needleCountCorrect: z.boolean(),
  instrumentCountCorrect: z.boolean(),
  specimenProperlyLabeled: z.boolean(),
  equipmentIssuesIdentified: z.boolean(),
  recoveryConcernsAddressed: z.boolean(),
  isExceptionOverridden: z.boolean().optional(),
  overrideReason: z.string().nullable().optional(),
  timestamp: z.string().datetime()
});
export type SurgicalSafetyChecklistDto = z.infer<typeof SurgicalSafetyChecklistDtoSchema>;

export const OTTransferDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  transferNumber: z.string(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  sourceLocation: z.string(),
  destinationRoomId: z.string().uuid(),
  destinationRoomName: z.string(),
  transportStaffName: z.string(),
  handoverGivenBy: z.string(),
  handoverReceivedBy: z.string(),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime().nullable().optional(),
  patientConditionOnArrival: z.string(),
  status: z.string(),
  createdAt: z.string().datetime()
});
export type OTTransferDto = z.infer<typeof OTTransferDtoSchema>;

export const AnaesthesiaRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  leadAnaesthetist: z.string(),
  anaesthesiaType: AnaesthesiaTypeEnum,
  inductionTime: z.string().datetime(),
  intubationDetails: z.string().nullable().optional(),
  airwayDeviceUsed: z.string(),
  administeredAgentsSummary: z.string(),
  ivFluidsAdministeredMl: z.number().int(),
  bloodTransfusedUnits: z.number().int(),
  estimatedIntraopBloodLossMl: z.number().int(),
  intraopVitalsStability: z.string(),
  anaesthesiaEndTime: z.string().datetime().nullable().optional(),
  extubationTime: z.string().datetime().nullable().optional(),
  intraoperativeComplications: z.string().nullable().optional(),
  postAnaesthesiaAldreteScore: z.number().int(),
  createdAt: z.string().datetime()
});
export type AnaesthesiaRecordDto = z.infer<typeof AnaesthesiaRecordDtoSchema>;

export const IntraoperativeRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  procedureName: z.string(),
  primarySurgeon: z.string(),
  assistantSurgeon: z.string().nullable().optional(),
  scrubNurse: z.string(),
  circulatingNurse: z.string(),
  incisionTime: z.string().datetime(),
  closureTime: z.string().datetime().nullable().optional(),
  surgicalApproach: z.string(),
  intraoperativeFindings: z.string(),
  procedureDetails: z.string(),
  specimensCollectedCount: z.number().int(),
  implantsPlacedCount: z.number().int(),
  spongeCountVerified: z.boolean(),
  needleCountVerified: z.boolean(),
  instrumentCountVerified: z.boolean(),
  drainsPlaced: z.string().nullable().optional(),
  closureTechnique: z.string(),
  patientConditionPostSurgery: z.string(),
  status: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type IntraoperativeRecordDto = z.infer<typeof IntraoperativeRecordDtoSchema>;

export const OperativeNoteDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  noteNumber: z.string(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  primarySurgeonName: z.string(),
  preOperativeDiagnosis: z.string(),
  postOperativeDiagnosis: z.string(),
  procedurePerformedTitle: z.string(),
  detailedOperativeFindings: z.string(),
  operativeTechniqueStepByStep: z.string(),
  estimatedBloodLossMl: z.number().int(),
  tissueSpecimensSentForBiopsy: z.string().nullable().optional(),
  prosthesisAndImplantsUsed: z.string().nullable().optional(),
  postOperativeInstructions: z.string(),
  isFinalized: z.boolean(),
  finalizedBy: z.string().nullable().optional(),
  finalizedAt: z.string().datetime().nullable().optional(),
  versionNumber: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperativeNoteDto = z.infer<typeof OperativeNoteDtoSchema>;

export const SurgicalSpecimenDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  specimenNumber: z.string(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  anatomicOriginSite: z.string(),
  specimenDescription: z.string(),
  fixativeUsed: z.string(),
  orderedInvestigation: z.string(),
  destinationLab: z.string(),
  collectedBySurgeon: z.string(),
  collectionTime: z.string().datetime(),
  labelVerifiedByNurse: z.string(),
  labHandoverStatus: z.string(),
  labReceivedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime()
});
export type SurgicalSpecimenDto = z.infer<typeof SurgicalSpecimenDtoSchema>;

export const SurgicalImplantDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  implantTrackingNumber: z.string(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  implantName: z.string(),
  implantType: z.string(),
  manufacturerName: z.string(),
  modelNumber: z.string(),
  serialOrLotNumber: z.string(),
  udiBarcode: z.string().nullable().optional(),
  expiryDate: z.string().datetime().nullable().optional(),
  anatomicPlacementSite: z.string(),
  implantedBySurgeon: z.string(),
  implantTimestamp: z.string().datetime(),
  supplierOrVendor: z.string(),
  unitCost: z.number(),
  status: z.string(),
  createdAt: z.string().datetime()
});
export type SurgicalImplantDto = z.infer<typeof SurgicalImplantDtoSchema>;

export const SurgicalConsumableUsageDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  itemCode: z.string(),
  itemName: z.string(),
  batchNumber: z.string(),
  quantityUsed: z.number(),
  unitOfMeasure: z.string(),
  unitPrice: z.number(),
  totalCost: z.number(),
  recordedBy: z.string(),
  inventoryDeductionStatus: z.string(),
  usedAt: z.string().datetime()
});
export type SurgicalConsumableUsageDto = z.infer<typeof SurgicalConsumableUsageDtoSchema>;

export const PACURecoveryRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  recoveryBedNumber: z.string(),
  pacuNurseName: z.string(),
  arrivalTime: z.string().datetime(),
  initialAldreteScore: z.number().int(),
  currentAldreteScore: z.number().int(),
  consciousnessLevel: z.string(),
  airwayStatus: z.string(),
  oxygenSupportLpm: z.number(),
  spo2Percentage: z.number().int(),
  systolicBpMmHg: z.number().int(),
  diastolicBpMmHg: z.number().int(),
  heartRateBpm: z.number().int(),
  painScoreNumeric: z.number().int(),
  nauseaVomitingStatus: z.string(),
  woundDrainOutputMl: z.number().int(),
  status: PACUStatusEnum,
  dischargeCriteriaMet: z.boolean(),
  authorizedTransferDestination: z.string(),
  dischargedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PACURecoveryRecordDto = z.infer<typeof PACURecoveryRecordDtoSchema>;

export const PostoperativeTransferDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  transferNumber: z.string(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  originLocation: z.string(),
  destinationWardOrICU: z.string(),
  destinationBedNumber: z.string(),
  transferringNurse: z.string(),
  receivingNurse: z.string(),
  clinicalConditionSummary: z.string(),
  transferTime: z.string().datetime(),
  status: z.string(),
  createdAt: z.string().datetime()
});
export type PostoperativeTransferDto = z.infer<typeof PostoperativeTransferDtoSchema>;

export const SurgeryCancellationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  cancellationNumber: z.string(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  procedureName: z.string(),
  cancellationReason: z.string(),
  cancelledBy: z.string(),
  cancelledByRole: z.string(),
  reschedulingRequested: z.boolean(),
  notes: z.string().nullable().optional(),
  cancelledAt: z.string().datetime()
});
export type SurgeryCancellationDto = z.infer<typeof SurgeryCancellationDtoSchema>;

export const OTAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
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
  newState: z.record(z.unknown()).optional(),
  previousHash: z.string().optional(),
  timestamp: z.string().datetime()
});
export type OTAuditTraceDto = z.infer<typeof OTAuditTraceDtoSchema>;

export const OTOverviewMetricsDtoSchema = z.object({
  totalOTRooms: z.number().int(),
  activeOTRooms: z.number().int(),
  occupiedOTRooms: z.number().int(),
  availableOTRooms: z.number().int(),
  surgeriesToday: z.number().int(),
  completedSurgeriesToday: z.number().int(),
  inProgressSurgeries: z.number().int(),
  emergencySurgeriesToday: z.number().int(),
  pendingRequests: z.number().int(),
  pacuPatientsCount: z.number().int(),
  otUtilizationPercentage: z.number(),
  delayedSurgeriesCount: z.number().int(),
  averageTurnaroundTimeMinutes: z.number()
});
export type OTOverviewMetricsDto = z.infer<typeof OTOverviewMetricsDtoSchema>;

export const OTAnalyticsDtoSchema = z.object({
  specialtyDistribution: z.array(
    z.object({
      specialty: z.string(),
      caseCount: z.number().int(),
      utilizationPercentage: z.number()
    })
  ),
  monthlySurgeryTrends: z.array(
    z.object({
      month: z.string(),
      electiveCount: z.number().int(),
      emergencyCount: z.number().int()
    })
  ),
  turnaroundTimeByRoom: z.array(
    z.object({
      roomName: z.string(),
      avgTurnaroundMinutes: z.number()
    })
  ),
  cancellationReasons: z.array(
    z.object({
      reason: z.string(),
      count: z.number().int()
    })
  )
});
export type OTAnalyticsDto = z.infer<typeof OTAnalyticsDtoSchema>;

/**
 * Mutation Request Schemas
 */

export const CreateOperationTheatreComplexRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  complexCode: z.string().min(2),
  complexName: z.string().min(3),
  building: z.string(),
  floor: z.string(),
  operatingHours: z.string().default('24/7'),
  hasLaminarAirflow: z.boolean().default(true),
  hasCentralSterileSupply: z.boolean().default(true)
});
export type CreateOperationTheatreComplexRequest = z.infer<typeof CreateOperationTheatreComplexRequestSchema>;

export const UpdateOperationTheatreComplexRequestSchema = z.object({
  complexId: z.string().uuid(),
  complexName: z.string().min(3).optional(),
  operatingHours: z.string().optional(),
  hasLaminarAirflow: z.boolean().optional(),
  hasCentralSterileSupply: z.boolean().optional(),
  isActive: z.boolean().optional()
});
export type UpdateOperationTheatreComplexRequest = z.infer<typeof UpdateOperationTheatreComplexRequestSchema>;

export const CreateOTRoomRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  complexId: z.string().uuid(),
  roomNumber: z.string().min(1),
  roomName: z.string().min(2),
  otType: OTTypeEnum,
  primarySpecialty: SurgicalSpecialtyEnum,
  supportedSpecialties: z.array(z.string()).default([]),
  hasPendantSystem: z.boolean().default(true),
  hasCardiacMonitor: z.boolean().default(true),
  hasAnaesthesiaWorkstation: z.boolean().default(true),
  hasLaminarFlow: z.boolean().default(true),
  hasHepaFilter: z.boolean().default(true),
  hourlyRate: z.number().min(0)
});
export type CreateOTRoomRequest = z.infer<typeof CreateOTRoomRequestSchema>;

export const CreateSurgicalProcedureRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  procedureCode: z.string().min(2),
  procedureName: z.string().min(3),
  specialty: SurgicalSpecialtyEnum,
  category: ProcedureCategoryEnum,
  defaultDurationMinutes: z.number().int().min(15),
  recommendedAnaesthesia: AnaesthesiaTypeEnum,
  requiresImplant: z.boolean().default(false),
  requiresBloodCrossmatch: z.boolean().default(false),
  requiresICUStay: z.boolean().default(false),
  baseProcedureCharge: z.number().min(0)
});
export type CreateSurgicalProcedureRequest = z.infer<typeof CreateSurgicalProcedureRequestSchema>;

export const CreateSurgeryRequestRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  patientAge: z.number().int().default(35),
  patientGender: z.string().default('M'),
  encounterId: z.string().uuid().optional(),
  admissionId: z.string().uuid().optional(),
  requestingDoctorName: z.string(),
  primarySurgeonName: z.string(),
  specialty: SurgicalSpecialtyEnum,
  procedureId: z.string().uuid(),
  procedureName: z.string(),
  preOperativeDiagnosis: z.string().min(3),
  clinicalIndication: z.string().min(3),
  category: ProcedureCategoryEnum,
  priority: z.string().default('ROUTINE'),
  isEmergency: z.boolean().default(false),
  proposedSurgeryDate: z.string().datetime(),
  estimatedDurationMinutes: z.number().int().min(15),
  requiredAnaesthesia: AnaesthesiaTypeEnum,
  implantRequirementDetails: z.string().optional(),
  bloodComponentsRequired: z.string().optional(),
  specialEquipmentRequired: z.string().optional()
});
export type CreateSurgeryRequestRequest = z.infer<typeof CreateSurgeryRequestRequestSchema>;

export const ApproveSurgeryRequestRequestSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().uuid(),
  approverName: z.string(),
  approverRole: z.string(),
  decisionNotes: z.string().min(3)
});
export type ApproveSurgeryRequestRequest = z.infer<typeof ApproveSurgeryRequestRequestSchema>;

export const RejectSurgeryRequestRequestSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().uuid(),
  rejectorName: z.string(),
  reason: z.string().min(3)
});
export type RejectSurgeryRequestRequest = z.infer<typeof RejectSurgeryRequestRequestSchema>;

export const CreatePreOperativeAssessmentRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  surgeryRequestId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  assessedByAnaesthetist: z.string(),
  asaClassification: ASAClassEnum,
  airwayMallampatiScore: z.number().int().min(1).max(4),
  npoStatusHours: z.number().int().min(0),
  cardiacClearanceGiven: z.boolean().default(true),
  respiratoryClearanceGiven: z.boolean().default(true),
  allergiesNoted: z.string().optional(),
  currentMedicationsNoted: z.string().optional(),
  lastHaemoglobinGdl: z.number().optional(),
  bloodArrangementUnits: z.number().int().default(0),
  fitnessStatus: PreOpFitnessStatusEnum,
  anaesthesiaPlanNotes: z.string().min(5),
  riskFactorsSummary: z.string().min(3)
});
export type CreatePreOperativeAssessmentRequest = z.infer<typeof CreatePreOperativeAssessmentRequestSchema>;

export const CreateSurgicalConsentRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  surgeryRequestId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  procedureConsentGiven: z.boolean().default(true),
  anaesthesiaConsentGiven: z.boolean().default(true),
  bloodTransfusionConsentGiven: z.boolean().default(true),
  highRiskConsentGiven: z.boolean().default(false),
  implantConsentGiven: z.boolean().default(false),
  consentingPersonName: z.string().min(2),
  relationshipToPatient: z.string().default('SELF'),
  counselledByDoctor: z.string(),
  witnessName: z.string(),
  notes: z.string().optional()
});
export type CreateSurgicalConsentRequest = z.infer<typeof CreateSurgicalConsentRequestSchema>;

export const CreateOTScheduleRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  surgeryRequestId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  procedureName: z.string(),
  roomId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  estimatedDurationMinutes: z.number().int().min(15),
  primarySurgeonName: z.string(),
  assistantSurgeonName: z.string().optional(),
  leadAnaesthetistName: z.string(),
  anaesthesiaTechName: z.string().optional(),
  scrubNurseName: z.string(),
  circulatingNurseName: z.string(),
  isEmergency: z.boolean().default(false)
});
export type CreateOTScheduleRequest = z.infer<typeof CreateOTScheduleRequestSchema>;

export const RescheduleOTRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  newRoomId: z.string().uuid(),
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime(),
  rescheduledBy: z.string(),
  reason: z.string().min(5)
});
export type RescheduleOTRequest = z.infer<typeof RescheduleOTRequestSchema>;

export const AssignSurgicalTeamRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  primarySurgeonName: z.string(),
  assistantSurgeonName: z.string().optional(),
  leadAnaesthetistName: z.string(),
  scrubNurseName: z.string(),
  circulatingNurseName: z.string(),
  assignedBy: z.string()
});
export type AssignSurgicalTeamRequest = z.infer<typeof AssignSurgicalTeamRequestSchema>;

export const CompletePreOpChecklistRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  verifiedByNurse: z.string(),
  patientIdentityVerified: z.boolean(),
  surgicalSiteMarked: z.boolean(),
  consentVerified: z.boolean(),
  npoVerified: z.boolean(),
  allergiesChecked: z.boolean(),
  preOpVitalsChecked: z.boolean(),
  labReportsAvailable: z.boolean(),
  imagingAvailable: z.boolean(),
  bloodReservedAndChecked: z.boolean(),
  implantsVerifiedInOT: z.boolean(),
  denturesJewelryRemoved: z.boolean(),
  preMedicationAdministered: z.boolean(),
  isClearedForOT: z.boolean(),
  notes: z.string().optional()
});
export type CompletePreOpChecklistRequest = z.infer<typeof CompletePreOpChecklistRequestSchema>;

export const CompleteSafetyChecklistRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  stage: SurgicalSafetyStageEnum,
  conductedBy: z.string(),
  conductedRole: z.string(),
  patientConfirmed: z.boolean(),
  siteMarkingConfirmed: z.boolean(),
  anaesthesiaMachineChecked: z.boolean(),
  pulseOximeterFunctioning: z.boolean(),
  knownAllergyConfirmed: z.boolean(),
  difficultAirwayRiskEvaluated: z.boolean(),
  bloodLossRiskEvaluated: z.boolean(),
  teamIntroducedRoles: z.boolean(),
  antibioticProphylaxisGiven: z.boolean(),
  essentialImagingDisplayed: z.boolean(),
  spongeCountCorrect: z.boolean(),
  needleCountCorrect: z.boolean(),
  instrumentCountCorrect: z.boolean(),
  specimenProperlyLabeled: z.boolean(),
  equipmentIssuesIdentified: z.boolean(),
  recoveryConcernsAddressed: z.boolean(),
  isExceptionOverridden: z.boolean().optional(),
  overrideReason: z.string().optional()
});
export type CompleteSafetyChecklistRequest = z.infer<typeof CompleteSafetyChecklistRequestSchema>;

export const CreateOTTransferRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  sourceLocation: z.string(),
  destinationRoomId: z.string().uuid(),
  transportStaffName: z.string(),
  handoverGivenBy: z.string(),
  handoverReceivedBy: z.string(),
  patientConditionOnArrival: z.string().default('STABLE')
});
export type CreateOTTransferRequest = z.infer<typeof CreateOTTransferRequestSchema>;

export const CreateAnaesthesiaRecordRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  leadAnaesthetist: z.string(),
  anaesthesiaType: AnaesthesiaTypeEnum,
  airwayDeviceUsed: z.string(),
  administeredAgentsSummary: z.string().min(5),
  ivFluidsAdministeredMl: z.number().int().default(500),
  bloodTransfusedUnits: z.number().int().default(0),
  estimatedIntraopBloodLossMl: z.number().int().default(50),
  intraopVitalsStability: z.string().default('HEMODYNAMICALLY_STABLE'),
  postAnaesthesiaAldreteScore: z.number().int().min(0).max(10).default(9)
});
export type CreateAnaesthesiaRecordRequest = z.infer<typeof CreateAnaesthesiaRecordRequestSchema>;

export const StartSurgeryRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  startedBy: z.string(),
  surgicalApproach: z.string().min(3),
  notes: z.string().optional()
});
export type StartSurgeryRequest = z.infer<typeof StartSurgeryRequestSchema>;

export const CompleteSurgeryRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  completedBy: z.string(),
  intraoperativeFindings: z.string().min(5),
  procedureDetails: z.string().min(5),
  closureTechnique: z.string().min(3),
  patientConditionPostSurgery: z.string().default('STABLE'),
  spongeCountVerified: z.boolean().default(true),
  needleCountVerified: z.boolean().default(true),
  instrumentCountVerified: z.boolean().default(true)
});
export type CompleteSurgeryRequest = z.infer<typeof CompleteSurgeryRequestSchema>;

export const CreateOperativeNoteRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  primarySurgeonName: z.string(),
  preOperativeDiagnosis: z.string().min(3),
  postOperativeDiagnosis: z.string().min(3),
  procedurePerformedTitle: z.string().min(3),
  detailedOperativeFindings: z.string().min(10),
  operativeTechniqueStepByStep: z.string().min(10),
  estimatedBloodLossMl: z.number().int().default(50),
  tissueSpecimensSentForBiopsy: z.string().optional(),
  prosthesisAndImplantsUsed: z.string().optional(),
  postOperativeInstructions: z.string().min(5)
});
export type CreateOperativeNoteRequest = z.infer<typeof CreateOperativeNoteRequestSchema>;

export const FinalizeOperativeNoteRequestSchema = z.object({
  noteId: z.string().uuid(),
  tenantId: z.string().uuid(),
  finalizedBy: z.string()
});
export type FinalizeOperativeNoteRequest = z.infer<typeof FinalizeOperativeNoteRequestSchema>;

export const CreateSurgicalSpecimenRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  anatomicOriginSite: z.string().min(2),
  specimenDescription: z.string().min(3),
  fixativeUsed: z.string().default('10% BUFFERED FORMALIN'),
  orderedInvestigation: z.string().min(3),
  destinationLab: z.string().default('HISTOPATHOLOGY_LAB'),
  collectedBySurgeon: z.string(),
  labelVerifiedByNurse: z.string()
});
export type CreateSurgicalSpecimenRequest = z.infer<typeof CreateSurgicalSpecimenRequestSchema>;

export const CreateSurgicalImplantRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  implantName: z.string().min(3),
  implantType: z.string().min(2),
  manufacturerName: z.string().min(2),
  modelNumber: z.string().min(2),
  serialOrLotNumber: z.string().min(2),
  anatomicPlacementSite: z.string().min(2),
  implantedBySurgeon: z.string(),
  supplierOrVendor: z.string(),
  unitCost: z.number().min(0)
});
export type CreateSurgicalImplantRequest = z.infer<typeof CreateSurgicalImplantRequestSchema>;

export const RecordConsumableUsageRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  itemCode: z.string(),
  itemName: z.string().min(2),
  batchNumber: z.string(),
  quantityUsed: z.number().min(1),
  unitOfMeasure: z.string(),
  unitPrice: z.number().min(0),
  recordedBy: z.string()
});
export type RecordConsumableUsageRequest = z.infer<typeof RecordConsumableUsageRequestSchema>;

export const CreatePACURecordRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  recoveryBedNumber: z.string(),
  pacuNurseName: z.string(),
  initialAldreteScore: z.number().int().min(0).max(10).default(8),
  currentAldreteScore: z.number().int().min(0).max(10).default(9),
  consciousnessLevel: z.string().default('AWAKE_ALERT'),
  airwayStatus: z.string().default('PATENT_CLEAR'),
  oxygenSupportLpm: z.number().default(2),
  spo2Percentage: z.number().int().default(98),
  systolicBpMmHg: z.number().int().default(120),
  diastolicBpMmHg: z.number().int().default(80),
  heartRateBpm: z.number().int().default(75),
  painScoreNumeric: z.number().int().min(0).max(10).default(2),
  nauseaVomitingStatus: z.string().default('NONE'),
  authorizedTransferDestination: z.string().default('INPATIENT_POST_OP_WARD')
});
export type CreatePACURecordRequest = z.infer<typeof CreatePACURecordRequestSchema>;

export const CreatePostoperativeTransferRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  originLocation: z.string().default('PACU_RECOVERY'),
  destinationWardOrICU: z.string(),
  destinationBedNumber: z.string(),
  transferringNurse: z.string(),
  receivingNurse: z.string(),
  clinicalConditionSummary: z.string().min(5)
});
export type CreatePostoperativeTransferRequest = z.infer<typeof CreatePostoperativeTransferRequestSchema>;

export const CancelSurgeryRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  cancellationReason: z.string().min(5),
  cancelledBy: z.string(),
  cancelledByRole: z.string(),
  reschedulingRequested: z.boolean().default(true),
  notes: z.string().optional()
});
export type CancelSurgeryRequest = z.infer<typeof CancelSurgeryRequestSchema>;

export const CreateEmergencySurgeryRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  primarySurgeonName: z.string(),
  leadAnaesthetistName: z.string(),
  procedureName: z.string(),
  specialty: SurgicalSpecialtyEnum,
  roomId: z.string().uuid(),
  preOperativeDiagnosis: z.string().min(3),
  emergencyIndication: z.string().min(3),
  emergencyAuthorizationBy: z.string()
});
export type CreateEmergencySurgeryRequest = z.infer<typeof CreateEmergencySurgeryRequestSchema>;

export const OverrideOTConflictRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  authorizedBy: z.string(),
  authorizedRole: z.string(),
  conflictType: z.string(),
  justification: z.string().min(5)
});
export type OverrideOTConflictRequest = z.infer<typeof OverrideOTConflictRequestSchema>;
