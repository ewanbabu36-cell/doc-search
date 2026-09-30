import type {
  DietaryDepartmentDto,
  DietaryKitchenDto,
  DietaryDietTypeDto,
  DietaryFoodItemDto,
  DietaryAssessmentDto,
  DietaryOrderDto,
  DietaryDietPlanDto,
  DietaryMenuTemplateDto,
  DietaryMealScheduleDto,
  DietaryProductionPlanDto,
  DietaryPreparationRecordDto,
  DietaryQualityCheckDto,
  DietaryTrayAssemblyDto,
  DietaryMealDispatchDto,
  DietarySafetyAlertDto,
  DietaryWasteRecordDto,
  DietaryCostRecordDto,
  DietaryProcurementRefDto,
  DietaryBillingRefDto,
  DietaryAuditTraceDto,
  DietaryOverviewMetricsDto,
  DietaryAnalyticsDto
} from '@docsearch/api-contracts';

export const mockDietaryDepartments: DietaryDepartmentDto[] = [];
export const mockDietaryKitchens: DietaryKitchenDto[] = [];

export const mockDietaryDietTypes: DietaryDietTypeDto[] = [];

export const mockDietaryFoodItems: DietaryFoodItemDto[] = [];
export const mockDietaryAssessments: DietaryAssessmentDto[] = [];
export const mockDietaryOrders: DietaryOrderDto[] = [];
export const mockDietaryDietPlans: DietaryDietPlanDto[] = [];
export const mockDietaryMenuTemplates: DietaryMenuTemplateDto[] = [];
export const mockDietaryMealSchedules: DietaryMealScheduleDto[] = [];
export const mockDietaryProductionPlans: DietaryProductionPlanDto[] = [];
export const mockDietaryPreparationRecords: DietaryPreparationRecordDto[] = [];
export const mockDietaryQualityChecks: DietaryQualityCheckDto[] = [];
export const mockDietaryTrayAssemblies: DietaryTrayAssemblyDto[] = [];
export const mockDietaryMealDispatches: DietaryMealDispatchDto[] = [];
export const mockDietarySafetyAlerts: DietarySafetyAlertDto[] = [];
export const mockDietaryWasteRecords: DietaryWasteRecordDto[] = [];
export const mockDietaryCostRecords: DietaryCostRecordDto[] = [];
export const mockDietaryProcurementRefs: DietaryProcurementRefDto[] = [];
export const mockDietaryBillingRefs: DietaryBillingRefDto[] = [];
export const mockDietaryAuditTraces: DietaryAuditTraceDto[] = [];

export const mockDietaryOverviewMetrics: DietaryOverviewMetricsDto = {
  totalActiveDietaryPatients: 0,
  totalActiveDietOrders: 0,
  mealsDueToday: 0,
  mealsInPreparation: 0,
  mealsReadyForDispatch: 0,
  mealsDeliveredToday: 0,
  missedOrRefusedMeals: 0,
  activeSafetyAlerts: 0,
  npoPatientCount: 0,
  qualityFailureCount: 0,
  totalFoodWasteKgToday: 0,
  totalWasteCostLossToday: 0
};

export const mockDietaryAnalytics: DietaryAnalyticsDto = {
  mealsServedByDietCategory: {},
  mealsDeliveredByWard: {},
  wasteByReasonKg: {},
  dailyMealDeliverySuccessRatePct: 100,
  averageTurnaroundMins: 0,
  monthlyExpenditureVsBudget: {
    ingredientCost: 0,
    wasteLoss: 0,
    budgetAllocated: 0
  }
};
