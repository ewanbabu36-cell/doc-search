import { z } from 'zod';

/**
 * ============================================================================
 * Phase 2.8: Pharmacy, Medication Dispensing & Inventory Management Schemas
 * ============================================================================
 */

export const PharmacyMedicationStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'DISCONTINUED',
  'RESTRICTED'
]);
export type PharmacyMedicationStatus = z.infer<typeof PharmacyMedicationStatusEnum>;

export const MedicationDosageFormEnum = z.enum([
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'OINTMENT',
  'DROPS',
  'INHALER',
  'SUPPOSITORY',
  'PATCH',
  'IV_FLUID'
]);
export type MedicationDosageForm = z.infer<typeof MedicationDosageFormEnum>;

export const PharmacyMedicationRouteEnum = z.enum([
  'ORAL',
  'INTRAVENOUS',
  'INTRAMUSCULAR',
  'SUBCUTANEOUS',
  'TOPICAL',
  'INHALATION',
  'OPHTHALMIC',
  'OTIC',
  'NASAL',
  'RECTAL'
]);
export type PharmacyMedicationRoute = z.infer<typeof PharmacyMedicationRouteEnum>;

export const MedicationCategoryEnum = z.enum([
  'ANTIBIOTIC',
  'ANALGESIC',
  'CARDIOVASCULAR',
  'ANTIDIABETIC',
  'RESPIRATORY',
  'GASTROINTESTINAL',
  'PSYCHIATRIC',
  'DERMATOLOGICAL',
  'ONCOLOGY',
  'CONTROLLED_SUBSTANCE',
  'GENERAL'
]);
export type MedicationCategory = z.infer<typeof MedicationCategoryEnum>;

export const PrescriptionPriorityEnum = z.enum([
  'STAT',
  'EMERGENCY',
  'URGENT',
  'ROUTINE'
]);
export type PrescriptionPriority = z.infer<typeof PrescriptionPriorityEnum>;

export const PharmacyPrescriptionStatusEnum = z.enum([
  'CREATED',
  'RECEIVED_BY_PHARMACY',
  'UNDER_REVIEW',
  'VERIFIED',
  'STOCK_RESERVED',
  'READY_FOR_DISPENSING',
  'PARTIALLY_DISPENSED',
  'DISPENSED',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED'
]);
export type PharmacyPrescriptionStatus = z.infer<typeof PharmacyPrescriptionStatusEnum>;

export const PrescriptionItemFulfillmentStatusEnum = z.enum([
  'PENDING',
  'RESERVED',
  'PARTIALLY_DISPENSED',
  'FULFILLED',
  'CANCELLED'
]);
export type PrescriptionItemFulfillmentStatus = z.infer<typeof PrescriptionItemFulfillmentStatusEnum>;

export const BatchStatusEnum = z.enum([
  'ACTIVE',
  'LOW_STOCK',
  'NEAR_EXPIRY',
  'EXPIRED',
  'BLOCKED',
  'DEPLETED'
]);
export type BatchStatus = z.infer<typeof BatchStatusEnum>;

export const StockMovementTypeEnum = z.enum([
  'RECEIPT',
  'DISPENSE',
  'RETURN',
  'ADJUSTMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'DAMAGE',
  'EXPIRY',
  'REVERSAL'
]);
export type StockMovementType = z.infer<typeof StockMovementTypeEnum>;

export const StockReservationStatusEnum = z.enum([
  'ACTIVE',
  'FULFILLED',
  'RELEASED',
  'EXPIRED'
]);
export type StockReservationStatus = z.infer<typeof StockReservationStatusEnum>;

export const DispensingStatusEnum = z.enum([
  'PENDING',
  'VERIFIED',
  'PARTIALLY_DISPENSED',
  'DISPENSED',
  'CANCELLED',
  'REVERSED'
]);
export type DispensingStatus = z.infer<typeof DispensingStatusEnum>;

export const DispensingModeEnum = z.enum([
  'OUTPATIENT_COUNTER',
  'BEDSIDE_IPD',
  'EMERGENCY_CRITICAL',
  'HOME_DELIVERY'
]);
export type DispensingMode = z.infer<typeof DispensingModeEnum>;

export const ReturnReasonEnum = z.enum([
  'PATIENT_DISCONTINUED',
  'ADVERSE_REACTION',
  'PACKAGING_DEFECT',
  'DOSAGE_CHANGE',
  'EXPIRED_RETURN',
  'PATIENT_DECEASED',
  'OTHER'
]);
export type ReturnReason = z.infer<typeof ReturnReasonEnum>;

export const ReturnDispositionEnum = z.enum([
  'RESTOCK',
  'QUARANTINE_FOR_DESTRUCTION',
  'RETURN_TO_MANUFACTURER'
]);
export type ReturnDisposition = z.infer<typeof ReturnDispositionEnum>;

export const StockAdjustmentReasonEnum = z.enum([
  'DAMAGE',
  'EXPIRY',
  'COUNT_CORRECTION',
  'LOSS',
  'FOUND',
  'SYSTEM_CORRECTION',
  'OTHER'
]);
export type StockAdjustmentReason = z.infer<typeof StockAdjustmentReasonEnum>;

export const SubstitutionStatusEnum = z.enum([
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
]);
export type SubstitutionStatus = z.infer<typeof SubstitutionStatusEnum>;

export const PharmacyAuditOperationStatusEnum = z.enum([
  'SUCCESS',
  'FAILURE',
  'DENIED'
]);
export type PharmacyAuditOperationStatus = z.infer<typeof PharmacyAuditOperationStatusEnum>;

// ============================================================================
// DTOs
// ============================================================================

export const MedicationVariantDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  medicationId: z.string().uuid(),
  variantCode: z.string(),
  variantName: z.string(),
  strength: z.string(),
  dosageForm: z.string(),
  packConfiguration: z.string(),
  barcode: z.string().optional(),
  alternateIdentifier: z.string().optional(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type MedicationVariantDto = z.infer<typeof MedicationVariantDtoSchema>;

export const MedicationCatalogDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  medicationCode: z.string(),
  genericName: z.string(),
  brandName: z.string(),
  strength: z.string(),
  dosageForm: MedicationDosageFormEnum,
  route: PharmacyMedicationRouteEnum,
  packSize: z.number(),
  unitOfMeasure: z.string(),
  manufacturer: z.string(),
  category: MedicationCategoryEnum,
  controlledMedication: z.boolean(),
  prescriptionRequired: z.boolean(),
  status: PharmacyMedicationStatusEnum,
  therapeuticClass: z.string().optional(),
  storageConditions: z.string().optional(),
  variants: z.array(MedicationVariantDtoSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type MedicationCatalogDto = z.infer<typeof MedicationCatalogDtoSchema>;

export const PharmacyPrescriptionItemDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  medicationId: z.string().uuid(),
  medicationCode: z.string(),
  medicationName: z.string(),
  genericName: z.string(),
  strength: z.string(),
  dosageForm: z.string(),
  prescribedQuantity: z.number(),
  unit: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  route: z.string(),
  duration: z.number(),
  durationUnit: z.string(),
  prn: z.boolean(),
  prnIndication: z.string().optional(),
  substitutionAllowed: z.boolean(),
  substitutionReason: z.string().optional(),
  fulfillmentStatus: PrescriptionItemFulfillmentStatusEnum,
  dispensedQuantity: z.number(),
  remainingQuantity: z.number(),
  instructions: z.string().optional(),
  availableStock: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PharmacyPrescriptionItemDto = z.infer<typeof PharmacyPrescriptionItemDtoSchema>;

export const PharmacyPrescriptionDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string(),
  branchId: z.string().uuid(),
  branchName: z.string(),
  prescriptionNumber: z.string(),
  sourcePrescriptionId: z.string().optional(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  patientDob: z.string().optional(),
  patientGender: z.string().optional(),
  patientAllergies: z.array(z.string()).default([]),
  encounterId: z.string().uuid(),
  encounterNumber: z.string(),
  consultationId: z.string().uuid().optional(),
  prescribingDoctorId: z.string().uuid(),
  prescribingDoctorName: z.string(),
  prescribingDoctorSpecialty: z.string().optional(),
  priority: PrescriptionPriorityEnum,
  status: PharmacyPrescriptionStatusEnum,
  prescriptionType: z.enum(['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'DISCHARGE']),
  items: z.array(PharmacyPrescriptionItemDtoSchema),
  verifiedByPharmacistId: z.string().optional(),
  verifiedByPharmacistName: z.string().optional(),
  verifiedAt: z.string().optional(),
  verificationNotes: z.string().optional(),
  prescribedAt: z.string(),
  expiryAt: z.string().optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
  cancelledBy: z.string().optional(),
  cancelledAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PharmacyPrescriptionDto = z.infer<typeof PharmacyPrescriptionDtoSchema>;

export const PharmacyBatchDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  medicationId: z.string().uuid(),
  medicationCode: z.string(),
  medicationName: z.string(),
  batchNumber: z.string(),
  manufacturer: z.string(),
  manufacturingDate: z.string(),
  expiryDate: z.string(),
  receivedQuantity: z.number(),
  availableQuantity: z.number(),
  reservedQuantity: z.number(),
  unitCost: z.string(),
  purchaseReference: z.string().optional(),
  supplierReference: z.string().optional(),
  status: BatchStatusEnum,
  daysToExpiry: z.number(),
  blockReason: z.string().optional(),
  blockedBy: z.string().optional(),
  blockedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PharmacyBatchDto = z.infer<typeof PharmacyBatchDtoSchema>;

export const PharmacyInventoryDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  medicationId: z.string().uuid(),
  medicationCode: z.string(),
  genericName: z.string(),
  brandName: z.string(),
  strength: z.string(),
  dosageForm: z.string(),
  category: z.string(),
  controlledMedication: z.boolean(),
  availableQuantity: z.number(),
  reservedQuantity: z.number(),
  damagedQuantity: z.number(),
  expiredQuantity: z.number(),
  reorderLevel: z.number(),
  reorderQuantity: z.number(),
  isLowStock: z.boolean(),
  batches: z.array(PharmacyBatchDtoSchema).default([]),
  lastStockMovementAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PharmacyInventoryDto = z.infer<typeof PharmacyInventoryDtoSchema>;

export const PharmacyStockMovementDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  medicationId: z.string().uuid(),
  medicationName: z.string(),
  batchId: z.string().uuid(),
  batchNumber: z.string(),
  movementType: StockMovementTypeEnum,
  quantity: z.number(),
  beforeQuantity: z.number(),
  afterQuantity: z.number(),
  actorId: z.string(),
  actorRole: z.string(),
  reason: z.string(),
  correlationId: z.string(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  occurredAt: z.string()
});
export type PharmacyStockMovementDto = z.infer<typeof PharmacyStockMovementDtoSchema>;

export const PharmacyStockReservationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  prescriptionNumber: z.string(),
  prescriptionItemId: z.string().uuid(),
  medicationId: z.string().uuid(),
  medicationName: z.string(),
  batchId: z.string().uuid(),
  batchNumber: z.string(),
  reservedQuantity: z.number(),
  status: StockReservationStatusEnum,
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PharmacyStockReservationDto = z.infer<typeof PharmacyStockReservationDtoSchema>;

export const PharmacyDispensingItemDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  dispensingId: z.string().uuid(),
  prescriptionItemId: z.string().uuid(),
  medicationId: z.string().uuid(),
  medicationName: z.string(),
  batchId: z.string().uuid(),
  batchNumber: z.string(),
  quantity: z.number(),
  unit: z.string(),
  dosageInstructions: z.string(),
  isSubstituted: z.boolean(),
  substitutedMedicationId: z.string().uuid().optional(),
  substitutedMedicationName: z.string().optional(),
  pharmacistNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PharmacyDispensingItemDto = z.infer<typeof PharmacyDispensingItemDtoSchema>;

export const PharmacyDispensingDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  dispensingNumber: z.string(),
  prescriptionId: z.string().uuid(),
  prescriptionNumber: z.string(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  pharmacistId: z.string(),
  pharmacistName: z.string(),
  dispensingStatus: DispensingStatusEnum,
  dispensingMode: DispensingModeEnum,
  counselingProvided: z.boolean(),
  counselingNotes: z.string().optional(),
  items: z.array(PharmacyDispensingItemDtoSchema),
  dispensedAt: z.string(),
  reversalReason: z.string().optional(),
  reversedBy: z.string().optional(),
  reversedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PharmacyDispensingDto = z.infer<typeof PharmacyDispensingDtoSchema>;

export const PharmacyReturnDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  returnNumber: z.string(),
  dispensingId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  medicationId: z.string().uuid(),
  medicationName: z.string(),
  batchId: z.string().uuid(),
  batchNumber: z.string(),
  quantity: z.number(),
  returnReason: ReturnReasonEnum,
  condition: z.enum(['INTACT_SEALED', 'OPENED_UNUSABLE', 'DAMAGED', 'COMPROMISED']),
  disposition: ReturnDispositionEnum,
  actorId: z.string(),
  actorRole: z.string(),
  notes: z.string().optional(),
  occurredAt: z.string()
});
export type PharmacyReturnDto = z.infer<typeof PharmacyReturnDtoSchema>;

export const PharmacyStockAdjustmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  adjustmentNumber: z.string(),
  medicationId: z.string().uuid(),
  medicationName: z.string(),
  batchId: z.string().uuid(),
  batchNumber: z.string(),
  reason: StockAdjustmentReasonEnum,
  justification: z.string(),
  beforeQuantity: z.number(),
  adjustmentQuantity: z.number(),
  afterQuantity: z.number(),
  actorId: z.string(),
  actorRole: z.string(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  occurredAt: z.string()
});
export type PharmacyStockAdjustmentDto = z.infer<typeof PharmacyStockAdjustmentDtoSchema>;

export const PharmacySubstitutionRequestDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  prescriptionNumber: z.string(),
  prescriptionItemId: z.string().uuid(),
  originalMedicationId: z.string().uuid(),
  originalMedicationName: z.string(),
  requestedMedicationId: z.string().uuid(),
  requestedMedicationName: z.string(),
  reason: z.string(),
  justification: z.string(),
  pharmacistId: z.string(),
  pharmacistName: z.string(),
  doctorApprovalRequired: z.boolean(),
  status: SubstitutionStatusEnum,
  approvedByDoctorId: z.string().optional(),
  approvedByDoctorName: z.string().optional(),
  approvalNotes: z.string().optional(),
  actionedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PharmacySubstitutionRequestDto = z.infer<typeof PharmacySubstitutionRequestDtoSchema>;

export const PharmacyAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  traceId: z.string(),
  correlationId: z.string(),
  actorId: z.string(),
  actorRole: z.string(),
  action: z.string(),
  targetEntity: z.string(),
  targetEntityId: z.string(),
  prescriptionId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  previousSnapshot: z.record(z.unknown()).optional(),
  newSnapshot: z.record(z.unknown()).optional(),
  justification: z.string(),
  operationStatus: PharmacyAuditOperationStatusEnum,
  occurredAt: z.string()
});
export type PharmacyAuditTraceDto = z.infer<typeof PharmacyAuditTraceDtoSchema>;

export const PharmacyOverviewDtoSchema = z.object({
  prescriptionsToday: z.number(),
  pendingVerificationCount: z.number(),
  readyForDispensingCount: z.number(),
  dispensedTodayCount: z.number(),
  partiallyDispensedCount: z.number(),
  lowStockAlertsCount: z.number(),
  nearExpiryBatchesCount: z.number(),
  criticalExceptionsCount: z.number()
});
export type PharmacyOverviewDto = z.infer<typeof PharmacyOverviewDtoSchema>;

// ============================================================================
// REQUEST / MUTATION SCHEMAS
// ============================================================================

export const CreateMedicationSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  medicationCode: z.string().min(2),
  genericName: z.string().min(2),
  brandName: z.string().min(2),
  strength: z.string().min(1),
  dosageForm: MedicationDosageFormEnum,
  route: PharmacyMedicationRouteEnum,
  packSize: z.number().int().positive().default(1),
  unitOfMeasure: z.string().min(1),
  manufacturer: z.string().min(2),
  category: MedicationCategoryEnum,
  controlledMedication: z.boolean().default(false),
  prescriptionRequired: z.boolean().default(true),
  therapeuticClass: z.string().optional(),
  storageConditions: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type CreateMedicationRequest = z.infer<typeof CreateMedicationSchema>;

export const UpdateCatalogMedicationSchema = z.object({
  tenantId: z.string().uuid(),
  medicationId: z.string().uuid(),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  strength: z.string().optional(),
  dosageForm: MedicationDosageFormEnum.optional(),
  route: PharmacyMedicationRouteEnum.optional(),
  packSize: z.number().int().positive().optional(),
  unitOfMeasure: z.string().optional(),
  manufacturer: z.string().optional(),
  category: MedicationCategoryEnum.optional(),
  controlledMedication: z.boolean().optional(),
  prescriptionRequired: z.boolean().optional(),
  status: PharmacyMedicationStatusEnum.optional(),
  storageConditions: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type UpdateCatalogMedicationRequest = z.infer<typeof UpdateCatalogMedicationSchema>;

export const ReceiveStockSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  medicationId: z.string().uuid(),
  batchNumber: z.string().min(2),
  manufacturer: z.string().min(2),
  manufacturingDate: z.string(),
  expiryDate: z.string(),
  receivedQuantity: z.number().int().positive(),
  unitCost: z.string(),
  purchaseReference: z.string().optional(),
  supplierReference: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type ReceiveStockRequest = z.infer<typeof ReceiveStockSchema>;

export const VerifyPrescriptionSchema = z.object({
  tenantId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  pharmacistId: z.string(),
  pharmacistName: z.string(),
  verificationNotes: z.string().min(3),
  allergyCheckPassed: z.boolean(),
  interactionCheckPassed: z.boolean(),
  dosageCheckPassed: z.boolean(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type VerifyPrescriptionRequest = z.infer<typeof VerifyPrescriptionSchema>;

export const ReserveStockSchema = z.object({
  tenantId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  prescriptionItemId: z.string().uuid(),
  medicationId: z.string().uuid(),
  batchId: z.string().uuid(),
  quantity: z.number().int().positive(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type ReserveStockRequest = z.infer<typeof ReserveStockSchema>;

export const DispenseMedicationItemSchema = z.object({
  prescriptionItemId: z.string().uuid(),
  medicationId: z.string().uuid(),
  batchId: z.string().uuid(),
  quantity: z.number().int().positive(),
  dosageInstructions: z.string(),
  isSubstituted: z.boolean().default(false),
  substitutedMedicationId: z.string().uuid().optional(),
  pharmacistNotes: z.string().optional()
});
export type DispenseMedicationItem = z.infer<typeof DispenseMedicationItemSchema>;

export const DispenseMedicationSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  patientId: z.string().uuid(),
  pharmacistId: z.string(),
  pharmacistName: z.string(),
  dispensingMode: DispensingModeEnum.default('OUTPATIENT_COUNTER'),
  counselingProvided: z.boolean().default(true),
  counselingNotes: z.string().optional(),
  items: z.array(DispenseMedicationItemSchema).min(1),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type DispenseMedicationRequest = z.infer<typeof DispenseMedicationSchema>;

export const PartialDispenseMedicationSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  patientId: z.string().uuid(),
  pharmacistId: z.string(),
  pharmacistName: z.string(),
  dispensingMode: DispensingModeEnum.default('OUTPATIENT_COUNTER'),
  counselingProvided: z.boolean().default(true),
  counselingNotes: z.string().optional(),
  items: z.array(DispenseMedicationItemSchema).min(1),
  partialFulfillmentReason: z.string().min(3),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type PartialDispenseMedicationRequest = z.infer<typeof PartialDispenseMedicationSchema>;

export const CreateSubstitutionRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  prescriptionItemId: z.string().uuid(),
  originalMedicationId: z.string().uuid(),
  requestedMedicationId: z.string().uuid(),
  reason: z.string().min(3),
  pharmacistId: z.string(),
  pharmacistName: z.string(),
  doctorApprovalRequired: z.boolean().default(true),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type CreateSubstitutionRequest = z.infer<typeof CreateSubstitutionRequestSchema>;

export const ApproveSubstitutionSchema = z.object({
  tenantId: z.string().uuid(),
  requestId: z.string().uuid(),
  approvedByDoctorId: z.string(),
  approvedByDoctorName: z.string(),
  approvalNotes: z.string().min(3),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type ApproveSubstitutionRequest = z.infer<typeof ApproveSubstitutionSchema>;

export const RejectSubstitutionSchema = z.object({
  tenantId: z.string().uuid(),
  requestId: z.string().uuid(),
  rejectedByDoctorId: z.string(),
  rejectionReason: z.string().min(3),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type RejectSubstitutionRequest = z.infer<typeof RejectSubstitutionSchema>;

export const CreateReturnSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  dispensingId: z.string().uuid(),
  patientId: z.string().uuid(),
  medicationId: z.string().uuid(),
  batchId: z.string().uuid(),
  quantity: z.number().int().positive(),
  returnReason: ReturnReasonEnum,
  condition: z.enum(['INTACT_SEALED', 'OPENED_UNUSABLE', 'DAMAGED', 'COMPROMISED']),
  disposition: ReturnDispositionEnum,
  notes: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type CreateReturnRequest = z.infer<typeof CreateReturnSchema>;

export const CreateStockAdjustmentSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  medicationId: z.string().uuid(),
  batchId: z.string().uuid(),
  reason: StockAdjustmentReasonEnum,
  adjustmentQuantity: z.number().int(), // can be positive or negative
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type CreateStockAdjustmentRequest = z.infer<typeof CreateStockAdjustmentSchema>;

export const TransferStockSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  sourceBranchId: z.string().uuid(),
  destinationBranchId: z.string().uuid(),
  medicationId: z.string().uuid(),
  batchId: z.string().uuid(),
  quantity: z.number().int().positive(),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type TransferStockRequest = z.infer<typeof TransferStockSchema>;

export const BlockBatchSchema = z.object({
  tenantId: z.string().uuid(),
  batchId: z.string().uuid(),
  blockReason: z.string().min(3),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type BlockBatchRequest = z.infer<typeof BlockBatchSchema>;

export const UnblockBatchSchema = z.object({
  tenantId: z.string().uuid(),
  batchId: z.string().uuid(),
  unblockReason: z.string().min(3),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type UnblockBatchRequest = z.infer<typeof UnblockBatchSchema>;

export const CancelPrescriptionSchema = z.object({
  tenantId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  cancellationReason: z.string().min(3),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type CancelPrescriptionRequest = z.infer<typeof CancelPrescriptionSchema>;

export const ReverseDispensingSchema = z.object({
  tenantId: z.string().uuid(),
  dispensingId: z.string().uuid(),
  reversalReason: z.string().min(3),
  actorId: z.string(),
  actorRole: z.string(),
  justification: z.string().min(3)
});
export type ReverseDispensingRequest = z.infer<typeof ReverseDispensingSchema>;

export const SearchPharmacyOrdersSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  encounterId: z.string().uuid().optional(),
  status: PharmacyPrescriptionStatusEnum.optional(),
  priority: PrescriptionPriorityEnum.optional(),
  searchTerm: z.string().optional(),
  pageIndex: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().default(50)
});
export type SearchPharmacyOrdersRequest = z.infer<typeof SearchPharmacyOrdersSchema>;

export const QueryPharmacyAuditSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  prescriptionId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  action: z.string().optional(),
  pageIndex: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().default(50)
});
export type QueryPharmacyAuditRequest = z.infer<typeof QueryPharmacyAuditSchema>;
