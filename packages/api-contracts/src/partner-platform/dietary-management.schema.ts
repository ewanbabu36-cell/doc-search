import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const KitchenStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  TEMPORARILY_CLOSED: 'TEMPORARILY_CLOSED'
} as const;
export type KitchenStatus = (typeof KitchenStatus)[keyof typeof KitchenStatus];

export const KitchenType = {
  CENTRAL: 'CENTRAL',
  SATELLITE: 'SATELLITE',
  PANTRY: 'PANTRY',
  DIETARY_UNIT: 'DIETARY_UNIT'
} as const;
export type KitchenType = (typeof KitchenType)[keyof typeof KitchenType];

export const DietCategory = {
  REGULAR: 'REGULAR',
  GENERAL: 'GENERAL',
  SOFT: 'SOFT',
  LIQUID: 'LIQUID',
  CLEAR_LIQUID: 'CLEAR_LIQUID',
  FULL_LIQUID: 'FULL_LIQUID',
  DIABETIC: 'DIABETIC',
  RENAL: 'RENAL',
  CARDIAC: 'CARDIAC',
  LOW_SODIUM: 'LOW_SODIUM',
  LOW_FAT: 'LOW_FAT',
  HIGH_PROTEIN: 'HIGH_PROTEIN',
  LOW_PROTEIN: 'LOW_PROTEIN',
  HIGH_CALORIE: 'HIGH_CALORIE',
  PEDIATRIC: 'PEDIATRIC',
  GERIATRIC: 'GERIATRIC',
  ENTERAL: 'ENTERAL',
  POST_OPERATIVE: 'POST_OPERATIVE',
  NPO: 'NPO',
  CUSTOM_THERAPEUTIC: 'CUSTOM_THERAPEUTIC'
} as const;
export type DietCategory = (typeof DietCategory)[keyof typeof DietCategory];

export const DietTexture = {
  REGULAR: 'REGULAR',
  SOFT_MINCED: 'SOFT_MINCED',
  PUREED: 'PUREED',
  LIQUIDISED: 'LIQUIDISED',
  THICKENED_FLUID: 'THICKENED_FLUID'
} as const;
export type DietTexture = (typeof DietTexture)[keyof typeof DietTexture];

export const FeedingRoute = {
  ORAL: 'ORAL',
  NASOGASTRIC_TUBE: 'NASOGASTRIC_TUBE',
  PEG_TUBE: 'PEG_TUBE',
  JEJUNOSTOMY_TUBE: 'JEJUNOSTOMY_TUBE',
  PARENTERAL: 'PARENTERAL'
} as const;
export type FeedingRoute = (typeof FeedingRoute)[keyof typeof FeedingRoute];

export const DietOrderStatus = {
  DRAFT: 'DRAFT',
  ORDERED: 'ORDERED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  MODIFIED: 'MODIFIED',
  DISCONTINUED: 'DISCONTINUED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type DietOrderStatus = (typeof DietOrderStatus)[keyof typeof DietOrderStatus];

export const DietOrderPriority = {
  ROUTINE: 'ROUTINE',
  URGENT: 'URGENT',
  STAT_EMERGENCY: 'STAT_EMERGENCY'
} as const;
export type DietOrderPriority = (typeof DietOrderPriority)[keyof typeof DietOrderPriority];

export const MealSlot = {
  BREAKFAST: 'BREAKFAST',
  MID_MORNING_SNACK: 'MID_MORNING_SNACK',
  LUNCH: 'LUNCH',
  EVENING_SNACK: 'EVENING_SNACK',
  DINNER: 'DINNER',
  BEDTIME_SNACK: 'BEDTIME_SNACK',
  CUSTOM: 'CUSTOM'
} as const;
export type MealSlot = (typeof MealSlot)[keyof typeof MealSlot];

export const ProductionPlanStatus = {
  PLANNED: 'PLANNED',
  RELEASED: 'RELEASED',
  IN_PREPARATION: 'IN_PREPARATION',
  READY: 'READY',
  PARTIALLY_READY: 'PARTIALLY_READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type ProductionPlanStatus = (typeof ProductionPlanStatus)[keyof typeof ProductionPlanStatus];

export const MealQualityStatus = {
  PENDING: 'PENDING',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  QUARANTINED: 'QUARANTINED'
} as const;
export type MealQualityStatus = (typeof MealQualityStatus)[keyof typeof MealQualityStatus];

export const MealDispatchStatus = {
  PENDING: 'PENDING',
  PREPARED: 'PREPARED',
  VERIFIED: 'VERIFIED',
  DISPATCHED: 'DISPATCHED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED'
} as const;
export type MealDispatchStatus = (typeof MealDispatchStatus)[keyof typeof MealDispatchStatus];

export const DietarySafetySeverity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
} as const;
export type DietarySafetySeverity = (typeof DietarySafetySeverity)[keyof typeof DietarySafetySeverity];

export const WasteReason = {
  OVERPRODUCTION: 'OVERPRODUCTION',
  SPOILAGE: 'SPOILAGE',
  EXPIRY: 'EXPIRY',
  DAMAGED: 'DAMAGED',
  PATIENT_REFUSED: 'PATIENT_REFUSED',
  DIET_CHANGED: 'DIET_CHANGED',
  MISSED_DELIVERY: 'MISSED_DELIVERY',
  QUALITY_FAILURE: 'QUALITY_FAILURE',
  OTHER: 'OTHER'
} as const;
export type WasteReason = (typeof WasteReason)[keyof typeof WasteReason];

// ============================================================================
// DTOs & SCHEMAS
// ============================================================================

export const DietaryDepartmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  departmentCode: z.string(),
  departmentName: z.string(),
  headOfDietetics: z.string(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  status: z.string(),
  createdAt: z.string()
});
export type DietaryDepartmentDto = z.infer<typeof DietaryDepartmentDtoSchema>;

export const DietaryKitchenDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  kitchenCode: z.string(),
  kitchenName: z.string(),
  kitchenType: z.enum(['CENTRAL', 'SATELLITE', 'PANTRY', 'DIETARY_UNIT']),
  location: z.string(),
  dailyCapacity: z.number().int().nonnegative(),
  operatingHours: z.string(),
  responsibleManager: z.string(),
  contactPhone: z.string(),
  foodSafetyStatus: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'TEMPORARILY_CLOSED']),
  createdAt: z.string()
});
export type DietaryKitchenDto = z.infer<typeof DietaryKitchenDtoSchema>;

export const DietaryDietTypeDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  dietCode: z.string(),
  dietName: z.string(),
  category: z.string(),
  clinicalPurpose: z.string(),
  allowedFoods: z.string(),
  restrictedFoods: z.string(),
  allergensToAvoid: z.array(z.string()),
  targetCalories: z.number().int().nonnegative(),
  targetProteinGrams: z.number().nonnegative(),
  targetCarbsGrams: z.number().nonnegative(),
  targetFatGrams: z.number().nonnegative(),
  sodiumRestrictedMg: z.number().nonnegative().optional(),
  fluidRestrictedMl: z.number().nonnegative().optional(),
  texture: z.enum(['REGULAR', 'SOFT_MINCED', 'PUREED', 'LIQUIDISED', 'THICKENED_FLUID']),
  mealFrequencyPerDay: z.number().int().positive(),
  isActive: z.boolean(),
  createdAt: z.string()
});
export type DietaryDietTypeDto = z.infer<typeof DietaryDietTypeDtoSchema>;

export const DietaryFoodItemDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  itemCode: z.string(),
  itemName: z.string(),
  category: z.string(),
  unit: z.string(),
  caloriesPerUnit: z.number().nonnegative(),
  proteinPerUnit: z.number().nonnegative(),
  carbsPerUnit: z.number().nonnegative(),
  fatPerUnit: z.number().nonnegative(),
  allergens: z.array(z.string()),
  storageType: z.string(),
  procurementRefId: z.string().optional(),
  estimatedUnitCost: z.number().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string()
});
export type DietaryFoodItemDto = z.infer<typeof DietaryFoodItemDtoSchema>;

export const DietaryAssessmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  assessmentNumber: z.string(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  admissionId: z.string().optional(),
  wardName: z.string(),
  roomBedNumber: z.string(),
  attendingDoctor: z.string(),
  dietitianName: z.string(),
  assessmentDate: z.string(),
  weightKg: z.number().positive(),
  heightCm: z.number().positive(),
  bmi: z.number().positive(),
  nutritionalRiskScore: z.string(),
  clinicalCondition: z.string(),
  foodAllergies: z.array(z.string()),
  foodIntolerances: z.array(z.string()),
  culturalReligiousPreferences: z.string().optional(),
  swallowingDifficulty: z.boolean(),
  feedingRoute: z.enum(['ORAL', 'NASOGASTRIC_TUBE', 'PEG_TUBE', 'JEJUNOSTOMY_TUBE', 'PARENTERAL']),
  fluidRestrictionMl: z.number().nonnegative().optional(),
  specialInstructions: z.string().optional(),
  status: z.string(),
  createdAt: z.string()
});
export type DietaryAssessmentDto = z.infer<typeof DietaryAssessmentDtoSchema>;

export const DietaryOrderDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  orderNumber: z.string(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  admissionId: z.string().optional(),
  wardName: z.string(),
  roomBedNumber: z.string(),
  dietTypeId: z.string().uuid(),
  dietTypeName: z.string(),
  dietCategory: z.string(),
  mealFrequency: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  fluidRestrictionMl: z.number().optional(),
  texture: z.enum(['REGULAR', 'SOFT_MINCED', 'PUREED', 'LIQUIDISED', 'THICKENED_FLUID']),
  feedingRoute: z.enum(['ORAL', 'NASOGASTRIC_TUBE', 'PEG_TUBE', 'JEJUNOSTOMY_TUBE', 'PARENTERAL']),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT_EMERGENCY']),
  isNpo: z.boolean(),
  specialInstructions: z.string().optional(),
  allergyWarnings: z.array(z.string()),
  orderingDoctor: z.string(),
  reviewedByDietitian: z.string().optional(),
  status: z.enum(['DRAFT', 'ORDERED', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'ON_HOLD', 'MODIFIED', 'DISCONTINUED', 'COMPLETED', 'CANCELLED']),
  createdAt: z.string()
});
export type DietaryOrderDto = z.infer<typeof DietaryOrderDtoSchema>;

export const DietaryDietPlanDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  planCode: z.string(),
  orderId: z.string().uuid(),
  patientName: z.string(),
  wardBed: z.string(),
  planDate: z.string(),
  dietTypeName: z.string(),
  breakfastItems: z.string(),
  midMorningItems: z.string().optional(),
  lunchItems: z.string(),
  eveningSnackItems: z.string().optional(),
  dinnerItems: z.string(),
  bedtimeSnackItems: z.string().optional(),
  totalEstimatedCalories: z.number().nonnegative(),
  totalEstimatedProtein: z.number().nonnegative(),
  specialPrepNotes: z.string().optional(),
  status: z.string(),
  createdAt: z.string()
});
export type DietaryDietPlanDto = z.infer<typeof DietaryDietPlanDtoSchema>;

export const DietaryMenuTemplateDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  templateCode: z.string(),
  templateName: z.string(),
  dietCategory: z.string(),
  mealSlot: z.enum(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'BEDTIME_SNACK', 'CUSTOM']),
  menuItemsDescription: z.string(),
  ingredientList: z.array(z.string()),
  portionSize: z.string(),
  estimatedCalories: z.number().nonnegative(),
  estimatedCost: z.number().nonnegative(),
  kitchenId: z.string().uuid(),
  isActive: z.boolean(),
  createdAt: z.string()
});
export type DietaryMenuTemplateDto = z.infer<typeof DietaryMenuTemplateDtoSchema>;

export const DietaryMealScheduleDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduleCode: z.string(),
  orderId: z.string().uuid(),
  patientName: z.string(),
  wardName: z.string(),
  roomBedNumber: z.string(),
  mealDate: z.string(),
  mealSlot: z.enum(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'BEDTIME_SNACK', 'CUSTOM']),
  dietTypeName: z.string(),
  itemsToServe: z.string(),
  scheduledDispatchTime: z.string(),
  status: z.string(),
  createdAt: z.string()
});
export type DietaryMealScheduleDto = z.infer<typeof DietaryMealScheduleDtoSchema>;

export const DietaryProductionPlanDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  planNumber: z.string(),
  kitchenId: z.string().uuid(),
  kitchenName: z.string(),
  productionDate: z.string(),
  mealSlot: z.enum(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'BEDTIME_SNACK', 'CUSTOM']),
  totalPatientsCount: z.number().int().nonnegative(),
  regularMealsCount: z.number().int().nonnegative(),
  therapeuticMealsCount: z.number().int().nonnegative(),
  npoCount: z.number().int().nonnegative(),
  specialAllergyCount: z.number().int().nonnegative(),
  status: z.enum(['PLANNED', 'RELEASED', 'IN_PREPARATION', 'READY', 'PARTIALLY_READY', 'COMPLETED', 'CANCELLED']),
  releasedBy: z.string().optional(),
  releasedAt: z.string().optional(),
  createdAt: z.string()
});
export type DietaryProductionPlanDto = z.infer<typeof DietaryProductionPlanDtoSchema>;

export const DietaryPreparationRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  batchNumber: z.string(),
  productionPlanId: z.string().uuid(),
  dietCategory: z.string(),
  foodItemName: z.string(),
  quantityPrepared: z.number().positive(),
  unit: z.string(),
  headChef: z.string(),
  cookingTemperatureC: z.number().optional(),
  holdingTemperatureC: z.number().optional(),
  startTime: z.string(),
  completionTime: z.string().optional(),
  status: z.string(),
  createdAt: z.string()
});
export type DietaryPreparationRecordDto = z.infer<typeof DietaryPreparationRecordDtoSchema>;

export const DietaryQualityCheckDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  checkCode: z.string(),
  batchNumber: z.string(),
  kitchenName: z.string(),
  hygieneCheckPassed: z.boolean(),
  temperatureCheckPassed: z.boolean(),
  holdingTempC: z.number(),
  allergenSegregationPassed: z.boolean(),
  packagingIntegrityPassed: z.boolean(),
  inspectorName: z.string(),
  inspectorRole: z.string(),
  qualityStatus: z.enum(['PENDING', 'PASSED', 'FAILED', 'QUARANTINED']),
  notes: z.string().optional(),
  inspectedAt: z.string()
});
export type DietaryQualityCheckDto = z.infer<typeof DietaryQualityCheckDtoSchema>;

export const DietaryTrayAssemblyDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  trayBarcode: z.string(),
  orderId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  wardName: z.string(),
  roomBedNumber: z.string(),
  mealSlot: z.enum(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'BEDTIME_SNACK', 'CUSTOM']),
  dietTypeName: z.string(),
  itemsIncluded: z.string(),
  allergyNotice: z.string().optional(),
  assembledByStaff: z.string(),
  isVerified: z.boolean(),
  verifiedBy: z.string().optional(),
  assemblyTime: z.string(),
  status: z.string()
});
export type DietaryTrayAssemblyDto = z.infer<typeof DietaryTrayAssemblyDtoSchema>;

export const DietaryMealDispatchDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  dispatchCode: z.string(),
  trayBarcode: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  wardName: z.string(),
  roomBedNumber: z.string(),
  mealSlot: z.string(),
  dietTypeName: z.string(),
  deliveryPersonName: z.string(),
  dispatchedAt: z.string(),
  deliveredAt: z.string().optional(),
  receivedBy: z.string().optional(),
  deliveryStatus: z.enum(['PENDING', 'PREPARED', 'VERIFIED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'ACCEPTED', 'REFUSED', 'MISSED', 'CANCELLED']),
  exceptionReason: z.string().optional(),
  createdAt: z.string()
});
export type DietaryMealDispatchDto = z.infer<typeof DietaryMealDispatchDtoSchema>;

export const DietarySafetyAlertDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  alertCode: z.string(),
  patientName: z.string(),
  patientMrn: z.string(),
  wardBed: z.string(),
  alertType: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  description: z.string(),
  isResolved: z.boolean(),
  resolvedBy: z.string().optional(),
  resolvedAt: z.string().optional(),
  resolutionNotes: z.string().optional(),
  createdAt: z.string()
});
export type DietarySafetyAlertDto = z.infer<typeof DietarySafetyAlertDtoSchema>;

export const DietaryWasteRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  wasteCode: z.string(),
  kitchenName: z.string(),
  mealDate: z.string(),
  mealSlot: z.string(),
  preparedQuantity: z.number().nonnegative(),
  servedQuantity: z.number().nonnegative(),
  wastedQuantity: z.number().positive(),
  unit: z.string(),
  reason: z.enum(['OVERPRODUCTION', 'SPOILAGE', 'EXPIRY', 'DAMAGED', 'PATIENT_REFUSED', 'DIET_CHANGED', 'MISSED_DELIVERY', 'QUALITY_FAILURE', 'OTHER']),
  estimatedCostLoss: z.number().nonnegative(),
  reportedBy: z.string(),
  recordedAt: z.string()
});
export type DietaryWasteRecordDto = z.infer<typeof DietaryWasteRecordDtoSchema>;

export const DietaryCostRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  costCode: z.string(),
  recordDate: z.string(),
  wardName: z.string(),
  dietCategory: z.string(),
  totalMealsServed: z.number().int().nonnegative(),
  ingredientCostTotal: z.number().nonnegative(),
  laborCostEstimate: z.number().nonnegative(),
  wasteCostTotal: z.number().nonnegative(),
  costPerMealAverage: z.number().nonnegative(),
  createdAt: z.string()
});
export type DietaryCostRecordDto = z.infer<typeof DietaryCostRecordDtoSchema>;

export const DietaryProcurementRefDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  requisitionRefNumber: z.string(),
  ingredientName: z.string(),
  quantityRequested: z.number().positive(),
  unit: z.string(),
  urgency: z.string(),
  vendorRef: z.string().optional(),
  status: z.string(),
  requestedBy: z.string(),
  createdAt: z.string()
});
export type DietaryProcurementRefDto = z.infer<typeof DietaryProcurementRefDtoSchema>;

export const DietaryBillingRefDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  chargeCode: z.string(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientMrn: z.string(),
  dietTypeName: z.string(),
  chargeCategory: z.string(),
  amount: z.number().nonnegative(),
  billingStatus: z.string(),
  createdAt: z.string()
});
export type DietaryBillingRefDto = z.infer<typeof DietaryBillingRefDtoSchema>;

export const DietaryAuditTraceDtoSchema = z.object({
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
  integrityHash: z.string(),
  timestamp: z.string()
});
export type DietaryAuditTraceDto = z.infer<typeof DietaryAuditTraceDtoSchema>;

export const DietaryOverviewMetricsDtoSchema = z.object({
  totalActiveDietaryPatients: z.number().int().nonnegative(),
  totalActiveDietOrders: z.number().int().nonnegative(),
  mealsDueToday: z.number().int().nonnegative(),
  mealsInPreparation: z.number().int().nonnegative(),
  mealsReadyForDispatch: z.number().int().nonnegative(),
  mealsDeliveredToday: z.number().int().nonnegative(),
  missedOrRefusedMeals: z.number().int().nonnegative(),
  activeSafetyAlerts: z.number().int().nonnegative(),
  npoPatientCount: z.number().int().nonnegative(),
  qualityFailureCount: z.number().int().nonnegative(),
  totalFoodWasteKgToday: z.number().nonnegative(),
  totalWasteCostLossToday: z.number().nonnegative()
});
export type DietaryOverviewMetricsDto = z.infer<typeof DietaryOverviewMetricsDtoSchema>;

export const DietaryAnalyticsDtoSchema = z.object({
  mealsServedByDietCategory: z.record(z.number()),
  mealsDeliveredByWard: z.record(z.number()),
  wasteByReasonKg: z.record(z.number()),
  dailyMealDeliverySuccessRatePct: z.number(),
  averageTurnaroundMins: z.number(),
  monthlyExpenditureVsBudget: z.object({
    ingredientCost: z.number(),
    wasteLoss: z.number(),
    budgetAllocated: z.number()
  })
});
export type DietaryAnalyticsDto = z.infer<typeof DietaryAnalyticsDtoSchema>;

// ============================================================================
// MUTATION REQUEST SCHEMAS
// ============================================================================

export const CreateKitchenSchema = z.object({
  kitchenCode: z.string().min(2),
  kitchenName: z.string().min(2),
  kitchenType: z.enum(['CENTRAL', 'SATELLITE', 'PANTRY', 'DIETARY_UNIT']),
  location: z.string().min(2),
  dailyCapacity: z.number().int().positive(),
  operatingHours: z.string().min(2),
  responsibleManager: z.string().min(2),
  contactPhone: z.string().min(5),
  foodSafetyStatus: z.string().default('COMPLIANT_HACCP')
});
export type CreateKitchenRequest = z.infer<typeof CreateKitchenSchema>;

export const UpdateKitchenSchema = CreateKitchenSchema.partial();
export type UpdateKitchenRequest = z.infer<typeof UpdateKitchenSchema>;

export const CreateDietTypeSchema = z.object({
  dietCode: z.string().min(2),
  dietName: z.string().min(2),
  category: z.string().min(2),
  clinicalPurpose: z.string().min(2),
  allowedFoods: z.string().min(2),
  restrictedFoods: z.string().min(2),
  allergensToAvoid: z.array(z.string()).default([]),
  targetCalories: z.number().int().nonnegative(),
  targetProteinGrams: z.number().nonnegative(),
  targetCarbsGrams: z.number().nonnegative(),
  targetFatGrams: z.number().nonnegative(),
  sodiumRestrictedMg: z.number().nonnegative().optional(),
  fluidRestrictedMl: z.number().nonnegative().optional(),
  texture: z.enum(['REGULAR', 'SOFT_MINCED', 'PUREED', 'LIQUIDISED', 'THICKENED_FLUID']),
  mealFrequencyPerDay: z.number().int().positive().default(4)
});
export type CreateDietTypeRequest = z.infer<typeof CreateDietTypeSchema>;

export const CreateFoodItemSchema = z.object({
  itemCode: z.string().min(2),
  itemName: z.string().min(2),
  category: z.string().min(2),
  unit: z.string().min(1),
  caloriesPerUnit: z.number().nonnegative(),
  proteinPerUnit: z.number().nonnegative(),
  carbsPerUnit: z.number().nonnegative(),
  fatPerUnit: z.number().nonnegative(),
  allergens: z.array(z.string()).default([]),
  storageType: z.string().default('DRY'),
  estimatedUnitCost: z.number().nonnegative()
});
export type CreateFoodItemRequest = z.infer<typeof CreateFoodItemSchema>;

export const CreateDietAssessmentSchema = z.object({
  patientId: z.string().uuid(),
  patientName: z.string().min(2),
  patientMrn: z.string().min(2),
  wardName: z.string().min(2),
  roomBedNumber: z.string().min(1),
  attendingDoctor: z.string().min(2),
  dietitianName: z.string().min(2),
  weightKg: z.number().positive(),
  heightCm: z.number().positive(),
  nutritionalRiskScore: z.string(),
  clinicalCondition: z.string().min(2),
  foodAllergies: z.array(z.string()).default([]),
  foodIntolerances: z.array(z.string()).default([]),
  culturalReligiousPreferences: z.string().optional(),
  swallowingDifficulty: z.boolean().default(false),
  feedingRoute: z.enum(['ORAL', 'NASOGASTRIC_TUBE', 'PEG_TUBE', 'JEJUNOSTOMY_TUBE', 'PARENTERAL']),
  fluidRestrictionMl: z.number().nonnegative().optional(),
  specialInstructions: z.string().optional()
});
export type CreateDietAssessmentRequest = z.infer<typeof CreateDietAssessmentSchema>;

export const CreateDietOrderSchema = z.object({
  patientId: z.string().uuid(),
  patientName: z.string().min(2),
  patientMrn: z.string().min(2),
  wardName: z.string().min(2),
  roomBedNumber: z.string().min(1),
  dietTypeId: z.string().uuid(),
  dietTypeName: z.string().min(2),
  dietCategory: z.string().min(2),
  mealFrequency: z.string().default('4 Meals / Day'),
  startDate: z.string(),
  endDate: z.string().optional(),
  fluidRestrictionMl: z.number().optional(),
  texture: z.enum(['REGULAR', 'SOFT_MINCED', 'PUREED', 'LIQUIDISED', 'THICKENED_FLUID']),
  feedingRoute: z.enum(['ORAL', 'NASOGASTRIC_TUBE', 'PEG_TUBE', 'JEJUNOSTOMY_TUBE', 'PARENTERAL']),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT_EMERGENCY']),
  isNpo: z.boolean().default(false),
  specialInstructions: z.string().optional(),
  allergyWarnings: z.array(z.string()).default([]),
  orderingDoctor: z.string().min(2)
});
export type CreateDietOrderRequest = z.infer<typeof CreateDietOrderSchema>;

export const ApproveDietOrderSchema = z.object({
  dietitianName: z.string().min(2),
  approvalNotes: z.string().optional()
});
export type ApproveDietOrderRequest = z.infer<typeof ApproveDietOrderSchema>;

export const ModifyDietOrderSchema = z.object({
  newDietTypeId: z.string().uuid(),
  newDietTypeName: z.string().min(2),
  modificationReason: z.string().min(3),
  modifiedBy: z.string().min(2)
});
export type ModifyDietOrderRequest = z.infer<typeof ModifyDietOrderSchema>;

export const CreateDietPlanSchema = z.object({
  orderId: z.string().uuid(),
  planDate: z.string(),
  breakfastItems: z.string().min(2),
  midMorningItems: z.string().optional(),
  lunchItems: z.string().min(2),
  eveningSnackItems: z.string().optional(),
  dinnerItems: z.string().min(2),
  bedtimeSnackItems: z.string().optional(),
  totalEstimatedCalories: z.number().nonnegative(),
  totalEstimatedProtein: z.number().nonnegative(),
  specialPrepNotes: z.string().optional()
});
export type CreateDietPlanRequest = z.infer<typeof CreateDietPlanSchema>;

export const CreateMenuTemplateSchema = z.object({
  templateCode: z.string().min(2),
  templateName: z.string().min(2),
  dietCategory: z.string().min(2),
  mealSlot: z.enum(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'BEDTIME_SNACK', 'CUSTOM']),
  menuItemsDescription: z.string().min(2),
  ingredientList: z.array(z.string()).default([]),
  portionSize: z.string().min(1),
  estimatedCalories: z.number().nonnegative(),
  estimatedCost: z.number().nonnegative(),
  kitchenId: z.string().uuid()
});
export type CreateMenuTemplateRequest = z.infer<typeof CreateMenuTemplateSchema>;

export const CreateMealScheduleSchema = z.object({
  orderId: z.string().uuid(),
  mealDate: z.string(),
  mealSlot: z.enum(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'BEDTIME_SNACK', 'CUSTOM']),
  itemsToServe: z.string().min(2),
  scheduledDispatchTime: z.string()
});
export type CreateMealScheduleRequest = z.infer<typeof CreateMealScheduleSchema>;

export const CreateProductionPlanSchema = z.object({
  kitchenId: z.string().uuid(),
  productionDate: z.string(),
  mealSlot: z.enum(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'BEDTIME_SNACK', 'CUSTOM']),
  totalPatientsCount: z.number().int().positive(),
  regularMealsCount: z.number().int().nonnegative(),
  therapeuticMealsCount: z.number().int().nonnegative(),
  npoCount: z.number().int().nonnegative(),
  specialAllergyCount: z.number().int().nonnegative()
});
export type CreateProductionPlanRequest = z.infer<typeof CreateProductionPlanSchema>;

export const ReleaseProductionPlanSchema = z.object({
  releasedBy: z.string().min(2)
});
export type ReleaseProductionPlanRequest = z.infer<typeof ReleaseProductionPlanSchema>;

export const RecordMealPreparationSchema = z.object({
  productionPlanId: z.string().uuid(),
  dietCategory: z.string().min(2),
  foodItemName: z.string().min(2),
  quantityPrepared: z.number().positive(),
  unit: z.string().min(1),
  headChef: z.string().min(2),
  cookingTemperatureC: z.number().optional(),
  holdingTemperatureC: z.number().optional()
});
export type RecordMealPreparationRequest = z.infer<typeof RecordMealPreparationSchema>;

export const RecordQualityCheckSchema = z.object({
  batchNumber: z.string().min(2),
  kitchenName: z.string().min(2),
  hygieneCheckPassed: z.boolean(),
  temperatureCheckPassed: z.boolean(),
  holdingTempC: z.number(),
  allergenSegregationPassed: z.boolean(),
  packagingIntegrityPassed: z.boolean(),
  inspectorName: z.string().min(2),
  inspectorRole: z.string().min(2),
  qualityStatus: z.enum(['PENDING', 'PASSED', 'FAILED', 'QUARANTINED']),
  notes: z.string().optional()
});
export type RecordQualityCheckRequest = z.infer<typeof RecordQualityCheckSchema>;

export const CreateTrayAssemblySchema = z.object({
  orderId: z.string().uuid(),
  mealSlot: z.enum(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'BEDTIME_SNACK', 'CUSTOM']),
  itemsIncluded: z.string().min(2),
  allergyNotice: z.string().optional(),
  assembledByStaff: z.string().min(2)
});
export type CreateTrayAssemblyRequest = z.infer<typeof CreateTrayAssemblySchema>;

export const DispatchMealSchema = z.object({
  trayBarcode: z.string().min(2),
  deliveryPersonName: z.string().min(2)
});
export type DispatchMealRequest = z.infer<typeof DispatchMealSchema>;

export const ConfirmMealDeliverySchema = z.object({
  receivedBy: z.string().min(2),
  deliveryStaff: z.string().min(2)
});
export type ConfirmMealDeliveryRequest = z.infer<typeof ConfirmMealDeliverySchema>;

export const RefuseMealSchema = z.object({
  reasonDescription: z.string().min(3),
  reportedByNurse: z.string().min(2)
});
export type RefuseMealRequest = z.infer<typeof RefuseMealSchema>;

export const RecordMissedMealSchema = z.object({
  reasonDescription: z.string().min(3),
  reportedBy: z.string().min(2)
});
export type RecordMissedMealRequest = z.infer<typeof RecordMissedMealSchema>;

export const CreateDietChangeSchema = z.object({
  orderId: z.string().uuid(),
  newDietTypeId: z.string().uuid(),
  justification: z.string().min(3),
  orderingClinician: z.string().min(2)
});
export type CreateDietChangeRequest = z.infer<typeof CreateDietChangeSchema>;

export const CreateNPOOrderSchema = z.object({
  orderId: z.string().uuid(),
  npoReason: z.string().min(3),
  orderingDoctor: z.string().min(2)
});
export type CreateNPOOrderRequest = z.infer<typeof CreateNPOOrderSchema>;

export const ResolveDietarySafetyAlertSchema = z.object({
  resolvedBy: z.string().min(2),
  resolutionNotes: z.string().min(3)
});
export type ResolveDietarySafetyAlertRequest = z.infer<typeof ResolveDietarySafetyAlertSchema>;

export const RecordFoodWasteSchema = z.object({
  kitchenName: z.string().min(2),
  mealDate: z.string(),
  mealSlot: z.string().min(2),
  preparedQuantity: z.number().nonnegative(),
  servedQuantity: z.number().nonnegative(),
  wastedQuantity: z.number().positive(),
  unit: z.string().min(1),
  reason: z.enum(['OVERPRODUCTION', 'SPOILAGE', 'EXPIRY', 'DAMAGED', 'PATIENT_REFUSED', 'DIET_CHANGED', 'MISSED_DELIVERY', 'QUALITY_FAILURE', 'OTHER']),
  estimatedCostLoss: z.number().nonnegative(),
  reportedBy: z.string().min(2)
});
export type RecordFoodWasteRequest = z.infer<typeof RecordFoodWasteSchema>;

export const CreateDietaryProcurementReferenceSchema = z.object({
  ingredientName: z.string().min(2),
  quantityRequested: z.number().positive(),
  unit: z.string().min(1),
  urgency: z.string().default('ROUTINE'),
  vendorRef: z.string().optional(),
  requestedBy: z.string().min(2)
});
export type CreateDietaryProcurementReferenceRequest = z.infer<typeof CreateDietaryProcurementReferenceSchema>;

export const CreateDietaryBillingReferenceSchema = z.object({
  patientId: z.string().uuid(),
  patientName: z.string().min(2),
  patientMrn: z.string().min(2),
  dietTypeName: z.string().min(2),
  chargeCategory: z.string().min(2),
  amount: z.number().positive()
});
export type CreateDietaryBillingReferenceRequest = z.infer<typeof CreateDietaryBillingReferenceSchema>;
