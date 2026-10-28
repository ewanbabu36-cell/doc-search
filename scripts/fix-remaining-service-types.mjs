import fs from 'node:fs';
import path from 'node:path';

const servicesDir = path.join(process.cwd(), 'apps', 'partner-platform', 'src', 'services');

// 1. abdm-fhir-service.ts: bridgeStatus
{
  const p = path.join(servicesDir, 'abdm-fhir-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace("bridgeStatus: 'OPERATIONAL'", "bridgeStatus: 'CONNECTED_PRODUCTION'");
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed abdm-fhir-service.ts');
}

// 2. clinical-consultation-service.ts: remove unused DEFAULT_CONSULTATION_OVERVIEW
{
  const p = path.join(servicesDir, 'clinical-consultation-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const DEFAULT_CONSULTATION_OVERVIEW[\s\S]*?\};\r?\n/, '');
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed clinical-consultation-service.ts');
}

// 3. radiology-management-service.ts: DEFAULT_RADIOLOGY_ANALYTICS
{
  const p = path.join(servicesDir, 'radiology-management-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const DEFAULT_RADIOLOGY_ANALYTICS: RadiologyAnalyticsDto = \{[\s\S]*?\};\r?\n/, `const DEFAULT_RADIOLOGY_ANALYTICS: RadiologyAnalyticsDto = {
  studiesByModality: [],
  reportsByRadiologist: [],
  turnaroundTimeTrendHours: [],
  qualityEventsByType: []
};
`);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed radiology-management-service.ts');
}

// 4. executive-command-service.ts: DEFAULT_EXECUTIVE_SNAPSHOT
{
  const p = path.join(servicesDir, 'executive-command-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const DEFAULT_EXECUTIVE_SNAPSHOT: ExecutiveCommandSnapshotDto = \{[\s\S]*?\};\r?\n/, `const DEFAULT_EXECUTIVE_SNAPSHOT: ExecutiveCommandSnapshotDto = {
  tenantId: '11111111-1111-4111-8111-111111111111',
  hospitalName: 'Doc Search Medical Center',
  snapshotTimestamp: new Date().toISOString(),
  surgeLevel: 'NORMAL_GREEN',
  activeEmergencyCodes: [],
  totalBeds: 150,
  occupiedBeds: 120,
  bedOccupancyPct: 80,
  availableBedsCount: 30,
  icuBedsTotal: 20,
  icuBedsOccupied: 16,
  icuOccupancyPct: 80,
  ventilatorsTotal: 10,
  ventilatorsInUse: 4,
  ventilatorUtilizationPct: 40,
  edTriageWaitingCount: 5,
  edHoldForAdmissionCount: 2,
  edNedocsScore: 45,
  edNedocsStatus: 'Busy Normal',
  otSuitesActive: 4,
  otSuitesTotal: 6,
  otUtilizationPct: 66,
  surgeriesInProgressCount: 4,
  surgeriesDelayedCount: 0,
  dailyRevenueVelocityInr: 450000,
  unbilledChargesRiskInr: 0,
  claimsDenialRiskCount: 0,
  statLabOrdersPending: 2,
  statRadiologyOrdersPending: 1,
  criticalBloodUnitsAlertCount: 0,
  criticalConsumablesStockoutRiskCount: 0
};
`);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed executive-command-service.ts');
}

// 5. dietary-management-service.ts: add explicit types and fix analytics
{
  const p = path.join(servicesDir, 'dietary-management-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const DEFAULT_DIETARY_ANALYTICS: DietaryAnalyticsDto = \{[\s\S]*?\};\r?\n/, `const DEFAULT_DIETARY_ANALYTICS: DietaryAnalyticsDto = {
  mealsServedByDietCategory: {},
  mealsDeliveredByWard: {},
  wasteByReasonKg: {},
  dailyMealDeliverySuccessRatePct: 98.5,
  averageTurnaroundMins: 35,
  monthlyExpenditureVsBudget: {
    ingredientCost: 120000,
    wasteLoss: 4500,
    budgetAllocated: 150000
  }
};
`);

  const typedProperties = `  private departments: DietaryDepartmentDto[] = [];
  private kitchens: DietaryKitchenDto[] = [];
  private dietTypes: DietaryDietTypeDto[] = [];
  private foodItems: DietaryFoodItemDto[] = [];
  private assessments: DietaryAssessmentDto[] = [];
  private orders: DietaryOrderDto[] = [];
  private dietPlans: DietaryDietPlanDto[] = [];
  private menuTemplates: DietaryMenuTemplateDto[] = [];
  private mealSchedules: DietaryMealScheduleDto[] = [];
  private productionPlans: DietaryProductionPlanDto[] = [];
  private preparationRecords: DietaryPreparationRecordDto[] = [];
  private qualityChecks: DietaryQualityCheckDto[] = [];
  private trayAssemblies: DietaryTrayAssemblyDto[] = [];
  private mealDispatches: DietaryMealDispatchDto[] = [];
  private safetyAlerts: DietarySafetyAlertDto[] = [];
  private wasteRecords: DietaryWasteRecordDto[] = [];
  private costRecords: DietaryCostRecordDto[] = [];
  private procurementRefs: DietaryProcurementRefDto[] = [];
  private billingRefs: DietaryBillingRefDto[] = [];
  private auditTraces: DietaryAuditTraceDto[] = [];`;

  code = code.replace(/  private departments = \[\.\.\.\[\]\];[\s\S]*?  private auditTraces = \[\.\.\.\[\]\];/, typedProperties);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed dietary-management-service.ts');
}

console.log('--- ALL TYPES APPLIED ---');
