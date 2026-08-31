import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const AssetCategoryEnum = z.enum([
  'BIOMEDICAL_LIFE_SUPPORT',
  'BIOMEDICAL_DIAGNOSTIC',
  'BIOMEDICAL_THERAPEUTIC',
  'IMAGING_RADIOLOGY',
  'SURGICAL_OT',
  'LABORATORY',
  'FACILITY_HVAC_MGPS',
  'ELECTRICAL_UPS',
  'IT_INFRASTRUCTURE'
]);
export type AssetCategory = z.infer<typeof AssetCategoryEnum>;

export const AssetRiskCriticalityEnum = z.enum([
  'CRITICAL_LIFE_SUPPORT',
  'HIGH_RISK',
  'MEDIUM_RISK',
  'LOW_RISK_GENERAL'
]);
export type AssetRiskCriticality = z.infer<typeof AssetRiskCriticalityEnum>;

export const AssetOperationalStatusEnum = z.enum([
  'IN_SERVICE',
  'UNDER_MAINTENANCE',
  'OUT_OF_SERVICE_BREAKDOWN',
  'STANDBY_READY',
  'CALIBRATION_OVERDUE',
  'DECOMMISSIONED_CONDEMNED'
]);
export type AssetOperationalStatus = z.infer<typeof AssetOperationalStatusEnum>;

export const WorkOrderPriorityEnum = z.enum([
  'EMERGENCY_STAT',
  'URGENT',
  'ROUTINE',
  'SCHEDULED'
]);
export type WorkOrderPriority = z.infer<typeof WorkOrderPriorityEnum>;

export const WorkOrderStatusEnum = z.enum([
  'OPEN_REPORTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'PENDING_SPARE_PARTS',
  'COMPLETED',
  'VERIFIED_BY_CLINICIAN',
  'CLOSED'
]);
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusEnum>;

export const PpmFrequencyEnum = z.enum([
  'MONTHLY',
  'QUARTERLY',
  'SEMI_ANNUAL',
  'ANNUAL',
  'STATUTORY_BIENNIAL'
]);
export type PpmFrequency = z.infer<typeof PpmFrequencyEnum>;

export const CalibrationStatusEnum = z.enum([
  'CALIBRATED_PASS',
  'CALIBRATED_WITH_DEVIATION',
  'FAILED_UNSAFE',
  'DUE_OVERDUE'
]);
export type CalibrationStatus = z.infer<typeof CalibrationStatusEnum>;

export const SafetyTestTypeEnum = z.enum([
  'ELECTRICAL_SAFETY_IEC_62353',
  'EARTH_RESISTANCE',
  'LEAKAGE_CURRENT',
  'PERFORMANCE_OUTPUT_ACCURACY',
  'RADIATION_LEAKAGE_AERB'
]);
export type SafetyTestType = z.infer<typeof SafetyTestTypeEnum>;

export const CondemnationStatusEnum = z.enum([
  'PROPOSED',
  'UNDER_BOARD_REVIEW',
  'APPROVED_FOR_SCRAP',
  'DISPOSED_HAZARDOUS',
  'DISPOSED_GENERAL'
]);
export type CondemnationStatus = z.infer<typeof CondemnationStatusEnum>;

export const MaintenanceContractTypeEnum = z.enum([
  'WARRANTY_OEM',
  'COMPREHENSIVE_CMC',
  'ANNUAL_MAINTENANCE_AMC',
  'TIME_AND_MATERIAL',
  'IN_HOUSE_BIOMEDICAL'
]);
export type MaintenanceContractType = z.infer<typeof MaintenanceContractTypeEnum>;

// ============================================================================
// DTOs
// ============================================================================

export const BiomedicalAssetDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  modelNumber: z.string(),
  serialNumber: z.string(),
  manufacturer: z.string(),
  category: AssetCategoryEnum,
  riskCriticality: AssetRiskCriticalityEnum,
  operationalStatus: AssetOperationalStatusEnum,
  departmentName: z.string(),
  physicalLocation: z.string(),
  installationDate: z.string(),
  purchaseDate: z.string(),
  purchaseCost: z.number(),
  currentValue: z.number(),
  warrantyExpiryDate: z.string().nullable().optional(),
  contractType: MaintenanceContractTypeEnum,
  contractVendorName: z.string(),
  contractExpiryDate: z.string().nullable().optional(),
  ppmFrequency: PpmFrequencyEnum,
  lastPpmDate: z.string().nullable().optional(),
  nextPpmDueDate: z.string(),
  calibrationFrequencyMonths: z.number(),
  lastCalibrationDate: z.string().nullable().optional(),
  nextCalibrationDueDate: z.string(),
  calibrationStatus: CalibrationStatusEnum,
  electricalSafetyCertified: z.boolean(),
  qrCodeIdentifier: z.string(),
  responsibleBiomedicalEngineer: z.string(),
  uptimePercentage: z.number(),
  isActive: z.boolean(),
  createdAt: z.string()
});
export type BiomedicalAssetDto = z.infer<typeof BiomedicalAssetDtoSchema>;

export const AssetTransferDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  fromDepartment: z.string(),
  fromLocation: z.string(),
  toDepartment: z.string(),
  toLocation: z.string(),
  transferReason: z.string(),
  initiatedBy: z.string(),
  approvedBy: z.string(),
  transferDate: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED']),
  createdAt: z.string()
});
export type AssetTransferDto = z.infer<typeof AssetTransferDtoSchema>;

export const PpmScheduleDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  scheduleCode: z.string(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  departmentName: z.string(),
  frequency: PpmFrequencyEnum,
  scheduledDueDate: z.string(),
  assignedEngineer: z.string(),
  tasksChecklist: z.array(z.string()),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED_PASS', 'COMPLETED_WITH_OBSERVATIONS', 'OVERDUE', 'CANCELLED']),
  completedDate: z.string().nullable().optional(),
  servicingNotes: z.string().nullable().optional(),
  partsReplaced: z.array(z.string()).optional(),
  createdAt: z.string()
});
export type PpmScheduleDto = z.infer<typeof PpmScheduleDtoSchema>;

export const BreakdownWorkOrderDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  workOrderNumber: z.string(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  departmentName: z.string(),
  roomBedLocation: z.string(),
  reportedByClinician: z.string(),
  reportedTime: z.string(),
  problemDescription: z.string(),
  priority: WorkOrderPriorityEnum,
  status: WorkOrderStatusEnum,
  assignedEngineer: z.string().nullable().optional(),
  assignedTime: z.string().nullable().optional(),
  clinicalImpactLevel: z.enum(['CRITICAL_PATIENT_SAFETY', 'PROCEDURE_HALTED', 'SUB_OPTIMAL_BACKUP_AVAILABLE', 'ROUTINE_NO_IMPACT']),
  rootCauseAnalysis: z.string().nullable().optional(),
  correctiveActionTaken: z.string().nullable().optional(),
  sparePartsCost: z.number().default(0),
  laborHours: z.number().default(0),
  downtimeHours: z.number().default(0),
  completedAt: z.string().nullable().optional(),
  verifiedByClinicianName: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
  createdAt: z.string()
});
export type BreakdownWorkOrderDto = z.infer<typeof BreakdownWorkOrderDtoSchema>;

export const CalibrationRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  certificateNumber: z.string(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  calibrationDate: z.string(),
  validUntilDate: z.string(),
  calibratedByAgency: z.string(),
  leadMetrologistName: z.string(),
  traceableStandardsUsed: z.string(),
  tolerancesObserved: z.string(),
  status: CalibrationStatusEnum,
  safetyTestPassed: z.boolean(),
  certificateUrl: z.string().nullable().optional(),
  remarks: z.string(),
  createdAt: z.string()
});
export type CalibrationRecordDto = z.infer<typeof CalibrationRecordDtoSchema>;

export const SafetyTestRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  testCode: z.string(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  testType: SafetyTestTypeEnum,
  testStandard: z.string(), // e.g. "IEC 62353"
  earthResistanceOhms: z.number().nullable().optional(),
  chassisLeakageMicroAmps: z.number().nullable().optional(),
  patientLeakageMicroAmps: z.number().nullable().optional(),
  insulationResistanceMOhm: z.number().nullable().optional(),
  testedByEngineer: z.string(),
  testDate: z.string(),
  testPassed: z.boolean(),
  remarks: z.string(),
  createdAt: z.string()
});
export type SafetyTestRecordDto = z.infer<typeof SafetyTestRecordDtoSchema>;

export const SparePartDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partCode: z.string(),
  partName: z.string(),
  compatibleModels: z.array(z.string()),
  manufacturer: z.string(),
  quantityOnHand: z.number(),
  minimumThresholdQuantity: z.number(),
  unitCost: z.number(),
  storageBinLocation: z.string(),
  isCriticalSpare: z.boolean(),
  leadTimeDays: z.number(),
  createdAt: z.string()
});
export type SparePartDto = z.infer<typeof SparePartDtoSchema>;

export const SparePartUsageDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  usageCode: z.string(),
  workOrderId: z.string().uuid().nullable().optional(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  partId: z.string().uuid(),
  partCode: z.string(),
  partName: z.string(),
  quantityUsed: z.number(),
  unitCost: z.number(),
  totalCost: z.number(),
  usedByEngineer: z.string(),
  usageDate: z.string(),
  createdAt: z.string()
});
export type SparePartUsageDto = z.infer<typeof SparePartUsageDtoSchema>;

export const VendorServiceVisitDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  visitCode: z.string(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  vendorName: z.string(),
  serviceEngineerName: z.string(),
  contactPhone: z.string(),
  visitType: z.enum(['PPM_SERVICE', 'BREAKDOWN_CALL', 'INSTALLATION_COMMISSIONING', 'CALIBRATION_AUDIT', 'SAFETY_UPGRADE']),
  visitDate: z.string(),
  serviceReportNumber: z.string(),
  serviceSummary: z.string(),
  serviceCost: z.number(),
  vendorPerformanceRating: z.number(), // 1 to 5
  hospitalSupervisorName: z.string(),
  createdAt: z.string()
});
export type VendorServiceVisitDto = z.infer<typeof VendorServiceVisitDtoSchema>;

export const CondemnationRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  condemnationCode: z.string(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  departmentName: z.string(),
  purchaseYear: numberOrStringToString(),
  cumulativeMaintenanceCost: z.number(),
  reasonForCondemnation: z.string(),
  condemnationBoardChairman: z.string(),
  estimatedScrapValue: z.number(),
  hazardousDisposalProtocol: z.string().nullable().optional(),
  status: CondemnationStatusEnum,
  approvedDate: z.string().nullable().optional(),
  createdAt: z.string()
});
function numberOrStringToString() {
  return z.union([z.string(), z.number()]).transform((val) => String(val));
}
export type CondemnationRecordDto = z.infer<typeof CondemnationRecordDtoSchema>;

export const BiomedicalIncidentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  incidentCode: z.string(),
  assetId: z.string().uuid(),
  assetCode: z.string(),
  assetName: z.string(),
  departmentName: z.string(),
  incidentDateTime: z.string(),
  severity: z.enum(['CRITICAL_ADVERSE_EVENT', 'NEAR_MISS', 'EQUIPMENT_MALFUNCTION_NO_HARM']),
  patientInvolved: z.boolean(),
  patientMrn: z.string().nullable().optional(),
  incidentSummary: z.string(),
  initialActionTaken: z.string(),
  investigatingOfficer: z.string(),
  rootCause: z.string().nullable().optional(),
  capaActionPlan: z.string().nullable().optional(),
  isResolved: z.boolean(),
  resolvedAt: z.string().nullable().optional(),
  createdAt: z.string()
});
export type BiomedicalIncidentDto = z.infer<typeof BiomedicalIncidentDtoSchema>;

export const BiomedicalAuditTraceDtoSchema = z.object({
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
export type BiomedicalAuditTraceDto = z.infer<typeof BiomedicalAuditTraceDtoSchema>;

// Summary & Overview DTOs
export const AssetOverviewMetricsDtoSchema = z.object({
  totalAssetsCount: z.number(),
  inServiceCount: z.number(),
  underMaintenanceCount: z.number(),
  breakdownCount: z.number(),
  criticalLifeSupportCount: z.number(),
  ppmOverdueCount: z.number(),
  calibrationDueNext30Days: z.number(),
  openWorkOrdersCount: z.number(),
  emergencyWorkOrdersCount: z.number(),
  overallFleetUptimePercentage: z.number()
});
export type AssetOverviewMetricsDto = z.infer<typeof AssetOverviewMetricsDtoSchema>;

export const AssetDowntimeAnalyticsDtoSchema = z.object({
  meanTimeToRepairHours: z.number(),
  meanTimeBetweenFailuresHours: z.number(),
  totalDowntimeHoursMonth: z.number(),
  fleetUptimePct: z.number(),
  downtimeByDepartment: z.record(z.string(), z.number()),
  breakdownsByCategory: z.record(z.string(), z.number()),
  annualMaintenanceSpend: z.object({
    sparePartsCost: z.number(),
    vendorContractCost: z.number(),
    inHouseLaborCost: z.number(),
    budgetAllocated: z.number()
  })
});
export type AssetDowntimeAnalyticsDto = z.infer<typeof AssetDowntimeAnalyticsDtoSchema>;

// ============================================================================
// Request & Mutation Schemas
// ============================================================================

export const CreateBiomedicalAssetRequestSchema = z.object({
  assetCode: z.string(),
  assetName: z.string(),
  modelNumber: z.string(),
  serialNumber: z.string(),
  manufacturer: z.string(),
  category: AssetCategoryEnum,
  riskCriticality: AssetRiskCriticalityEnum,
  departmentName: z.string(),
  physicalLocation: z.string(),
  installationDate: z.string(),
  purchaseDate: z.string(),
  purchaseCost: z.number(),
  warrantyExpiryDate: z.string().nullable().optional(),
  contractType: MaintenanceContractTypeEnum,
  contractVendorName: z.string(),
  ppmFrequency: PpmFrequencyEnum,
  calibrationFrequencyMonths: z.number(),
  responsibleBiomedicalEngineer: z.string()
});
export type CreateBiomedicalAssetRequest = z.infer<typeof CreateBiomedicalAssetRequestSchema>;

export const UpdateBiomedicalAssetRequestSchema = z.object({
  assetName: z.string().optional(),
  departmentName: z.string().optional(),
  physicalLocation: z.string().optional(),
  operationalStatus: AssetOperationalStatusEnum.optional(),
  contractType: MaintenanceContractTypeEnum.optional(),
  contractVendorName: z.string().optional(),
  responsibleBiomedicalEngineer: z.string().optional()
});
export type UpdateBiomedicalAssetRequest = z.infer<typeof UpdateBiomedicalAssetRequestSchema>;

export const CreateAssetTransferRequestSchema = z.object({
  assetId: z.string().uuid(),
  toDepartment: z.string(),
  toLocation: z.string(),
  transferReason: z.string(),
  initiatedBy: z.string(),
  approvedBy: z.string()
});
export type CreateAssetTransferRequest = z.infer<typeof CreateAssetTransferRequestSchema>;

export const CreatePpmScheduleRequestSchema = z.object({
  assetId: z.string().uuid(),
  frequency: PpmFrequencyEnum,
  scheduledDueDate: z.string(),
  assignedEngineer: z.string(),
  tasksChecklist: z.array(z.string())
});
export type CreatePpmScheduleRequest = z.infer<typeof CreatePpmScheduleRequestSchema>;

export const CompletePpmTaskRequestSchema = z.object({
  servicingNotes: z.string(),
  passedInspection: z.boolean(),
  partsReplaced: z.array(z.string()).optional()
});
export type CompletePpmTaskRequest = z.infer<typeof CompletePpmTaskRequestSchema>;

export const CreateWorkOrderRequestSchema = z.object({
  assetId: z.string().uuid(),
  problemDescription: z.string(),
  priority: WorkOrderPriorityEnum,
  clinicalImpactLevel: z.enum(['CRITICAL_PATIENT_SAFETY', 'PROCEDURE_HALTED', 'SUB_OPTIMAL_BACKUP_AVAILABLE', 'ROUTINE_NO_IMPACT']),
  reportedByClinician: z.string(),
  departmentName: z.string(),
  roomBedLocation: z.string()
});
export type CreateWorkOrderRequest = z.infer<typeof CreateWorkOrderRequestSchema>;

export const AssignWorkOrderRequestSchema = z.object({
  assignedEngineer: z.string()
});
export type AssignWorkOrderRequest = z.infer<typeof AssignWorkOrderRequestSchema>;

export const CompleteWorkOrderRequestSchema = z.object({
  rootCauseAnalysis: z.string(),
  correctiveActionTaken: z.string(),
  laborHours: z.number(),
  sparePartsCost: z.number()
});
export type CompleteWorkOrderRequest = z.infer<typeof CompleteWorkOrderRequestSchema>;

export const VerifyWorkOrderRequestSchema = z.object({
  verifiedByClinicianName: z.string()
});
export type VerifyWorkOrderRequest = z.infer<typeof VerifyWorkOrderRequestSchema>;

export const CreateCalibrationRecordRequestSchema = z.object({
  assetId: z.string().uuid(),
  calibrationDate: z.string(),
  validUntilDate: z.string(),
  calibratedByAgency: z.string(),
  leadMetrologistName: z.string(),
  traceableStandardsUsed: z.string(),
  tolerancesObserved: z.string(),
  status: CalibrationStatusEnum,
  safetyTestPassed: z.boolean(),
  remarks: z.string()
});
export type CreateCalibrationRecordRequest = z.infer<typeof CreateCalibrationRecordRequestSchema>;

export const CreateSafetyTestRecordRequestSchema = z.object({
  assetId: z.string().uuid(),
  testType: SafetyTestTypeEnum,
  testStandard: z.string(),
  earthResistanceOhms: z.number().nullable().optional(),
  chassisLeakageMicroAmps: z.number().nullable().optional(),
  patientLeakageMicroAmps: z.number().nullable().optional(),
  insulationResistanceMOhm: z.number().nullable().optional(),
  testedByEngineer: z.string(),
  testDate: z.string(),
  testPassed: z.boolean(),
  remarks: z.string()
});
export type CreateSafetyTestRecordRequest = z.infer<typeof CreateSafetyTestRecordRequestSchema>;

export const CreateSparePartRequestSchema = z.object({
  partCode: z.string(),
  partName: z.string(),
  compatibleModels: z.array(z.string()),
  manufacturer: z.string(),
  quantityOnHand: z.number(),
  minimumThresholdQuantity: z.number(),
  unitCost: z.number(),
  storageBinLocation: z.string(),
  isCriticalSpare: z.boolean(),
  leadTimeDays: z.number()
});
export type CreateSparePartRequest = z.infer<typeof CreateSparePartRequestSchema>;

export const ConsumeSparePartRequestSchema = z.object({
  workOrderId: z.string().uuid().optional(),
  assetId: z.string().uuid(),
  partId: z.string().uuid(),
  quantityUsed: z.number(),
  usedByEngineer: z.string()
});
export type ConsumeSparePartRequest = z.infer<typeof ConsumeSparePartRequestSchema>;

export const LogVendorVisitRequestSchema = z.object({
  assetId: z.string().uuid(),
  vendorName: z.string(),
  serviceEngineerName: z.string(),
  contactPhone: z.string(),
  visitType: z.enum(['PPM_SERVICE', 'BREAKDOWN_CALL', 'INSTALLATION_COMMISSIONING', 'CALIBRATION_AUDIT', 'SAFETY_UPGRADE']),
  visitDate: z.string(),
  serviceReportNumber: z.string(),
  serviceSummary: z.string(),
  serviceCost: z.number(),
  vendorPerformanceRating: z.number(),
  hospitalSupervisorName: z.string()
});
export type LogVendorVisitRequest = z.infer<typeof LogVendorVisitRequestSchema>;

export const CreateCondemnationRequestSchema = z.object({
  assetId: z.string().uuid(),
  reasonForCondemnation: z.string(),
  condemnationBoardChairman: z.string(),
  estimatedScrapValue: z.number(),
  hazardousDisposalProtocol: z.string().optional()
});
export type CreateCondemnationRequest = z.infer<typeof CreateCondemnationRequestSchema>;

export const ApproveCondemnationRequestSchema = z.object({
  status: CondemnationStatusEnum,
  approvedBy: z.string()
});
export type ApproveCondemnationRequest = z.infer<typeof ApproveCondemnationRequestSchema>;

export const CreateBiomedicalIncidentRequestSchema = z.object({
  assetId: z.string().uuid(),
  departmentName: z.string(),
  incidentDateTime: z.string(),
  severity: z.enum(['CRITICAL_ADVERSE_EVENT', 'NEAR_MISS', 'EQUIPMENT_MALFUNCTION_NO_HARM']),
  patientInvolved: z.boolean(),
  patientMrn: z.string().optional(),
  incidentSummary: z.string(),
  initialActionTaken: z.string(),
  investigatingOfficer: z.string()
});
export type CreateBiomedicalIncidentRequest = z.infer<typeof CreateBiomedicalIncidentRequestSchema>;

export const ResolveBiomedicalIncidentRequestSchema = z.object({
  rootCause: z.string(),
  capaActionPlan: z.string(),
  resolvedBy: z.string()
});
export type ResolveBiomedicalIncidentRequest = z.infer<typeof ResolveBiomedicalIncidentRequestSchema>;

export const CreateMaintenanceProcurementRequestSchema = z.object({
  partName: z.string(),
  quantityRequested: z.number(),
  urgency: z.string(),
  vendorRef: z.string().optional(),
  requestedBy: z.string()
});
export type CreateMaintenanceProcurementRequest = z.infer<typeof CreateMaintenanceProcurementRequestSchema>;
