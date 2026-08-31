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

export const mockDietaryDepartments: DietaryDepartmentDto[] = [
  {
    id: 'dd111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    departmentCode: 'DEPT-DIET-MAIN',
    departmentName: 'Department of Clinical Nutrition & Dietetics',
    headOfDietetics: 'Dr. Sunita Sharma, PhD (RD)',
    contactEmail: 'dietetics.lead@docsearch-hospital.org',
    contactPhone: '+91 98765 43210',
    status: 'ACTIVE',
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const mockDietaryKitchens: DietaryKitchenDto[] = [
  {
    id: 'dk111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    kitchenCode: 'KIT-CENTRAL-01',
    kitchenName: 'Central Hospital Production Kitchen',
    kitchenType: 'CENTRAL',
    location: 'Basement Level B1, Main Wing',
    dailyCapacity: 1200,
    operatingHours: '05:00 - 22:30',
    responsibleManager: 'Chef Rajesh Khanna',
    contactPhone: '+91 98111 22334',
    foodSafetyStatus: 'ISO 22000 / HACCP CERTIFIED',
    status: 'ACTIVE',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'dk111111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    kitchenCode: 'KIT-ICU-PANTRY',
    kitchenName: 'Critical Care / ICU Satellite Pantry',
    kitchenType: 'SATELLITE',
    location: '3rd Floor, Tower B (Adjacent to ICU-A)',
    dailyCapacity: 250,
    operatingHours: '24x7 Continuous Feed Support',
    responsibleManager: 'Sister Meera Nair',
    contactPhone: '+91 98222 33445',
    foodSafetyStatus: 'STERILE ENTERAL COMPLIANT',
    status: 'ACTIVE',
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const mockDietaryDietTypes: DietaryDietTypeDto[] = [
  {
    id: 'dt111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    dietCode: 'DIET-REG-01',
    dietName: 'Standard Regular Hospital Diet',
    category: 'REGULAR',
    clinicalPurpose: 'Nutritionally balanced meal plan for patients without metabolic or chewing restrictions',
    allowedFoods: 'All whole grains, pulses, fresh vegetables, fruits, dairy, lean meats',
    restrictedFoods: 'None',
    allergensToAvoid: [],
    targetCalories: 2100,
    targetProteinGrams: 75,
    targetCarbsGrams: 280,
    targetFatGrams: 65,
    texture: 'REGULAR',
    mealFrequencyPerDay: 4,
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'dt111111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    dietCode: 'DIET-DIAB-1800',
    dietName: 'Diabetic Low-Glycemic Index (1800 kcal)',
    category: 'DIABETIC',
    clinicalPurpose: 'Glycemic control for Type 1 & 2 Diabetes with controlled carbohydrate distribution',
    allowedFoods: 'Complex whole grains, high-fiber vegetables, lentils, egg whites, bitter gourd, sprouts',
    restrictedFoods: 'Refined sugar, sweets, white bread, high-sugar fruits (mango, banana, grapes)',
    allergensToAvoid: [],
    targetCalories: 1800,
    targetProteinGrams: 70,
    targetCarbsGrams: 200,
    targetFatGrams: 45,
    texture: 'REGULAR',
    mealFrequencyPerDay: 5,
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'dt111111-1111-4111-8111-111111111103',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    dietCode: 'DIET-RENAL-LOWPRO',
    dietName: 'Renal Low-Protein Low-Potassium Diet',
    category: 'RENAL',
    clinicalPurpose: 'CKD Stages 3-4 management to minimize urea accumulation and hyperkalemia',
    allowedFoods: 'Leached vegetables, white rice, egg white (measured), apple, papaya',
    restrictedFoods: 'High potassium foods (coconut water, banana, spinach, citrus fruits, nuts)',
    allergensToAvoid: [],
    targetCalories: 1750,
    targetProteinGrams: 40,
    targetCarbsGrams: 260,
    targetFatGrams: 50,
    sodiumRestrictedMg: 1500,
    fluidRestrictedMl: 1200,
    texture: 'SOFT_MINCED',
    mealFrequencyPerDay: 4,
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'dt111111-1111-4111-8111-111111111104',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    dietCode: 'DIET-NPO',
    dietName: 'Nil Per Os (NPO / Strict Fasting)',
    category: 'NPO',
    clinicalPurpose: 'Strict zero oral intake for surgical prep, sedation, or acute aspiration risk',
    allowedFoods: 'None (Absolute NPO)',
    restrictedFoods: 'All foods, solids, liquids, water, and oral medications unless authorized',
    allergensToAvoid: [],
    targetCalories: 0,
    targetProteinGrams: 0,
    targetCarbsGrams: 0,
    targetFatGrams: 0,
    texture: 'REGULAR',
    mealFrequencyPerDay: 0,
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const mockDietaryFoodItems: DietaryFoodItemDto[] = [
  {
    id: 'fi111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    itemCode: 'ITEM-OATMEAL',
    itemName: 'Steamed Whole Grain Oatmeal Porridge',
    category: 'BREAKFAST',
    unit: 'BOWL',
    caloriesPerUnit: 180,
    proteinPerUnit: 6.5,
    carbsPerUnit: 32,
    fatPerUnit: 3,
    allergens: ['GLUTEN'],
    storageType: 'DRY',
    estimatedUnitCost: 25.0,
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'fi111111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    itemCode: 'ITEM-KHICHDI-MOONG',
    itemName: 'Therapeutic Moong Dal & Rice Khichdi',
    category: 'MAIN_COURSE',
    unit: 'PORTION',
    caloriesPerUnit: 320,
    proteinPerUnit: 12,
    carbsPerUnit: 54,
    fatPerUnit: 4.5,
    allergens: [],
    storageType: 'HOT_HOLDING',
    estimatedUnitCost: 45.0,
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const mockDietaryAssessments: DietaryAssessmentDto[] = [
  {
    id: 'da111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    assessmentNumber: 'ASSESS-DIET-0081',
    patientId: 'pa111111-1111-4111-8111-111111111101',
    patientName: 'Rameshwar Lal Verma',
    patientMrn: 'MRN-2026-8801',
    admissionId: 'ADM-IPD-2026-0912',
    wardName: 'Male Medical Ward (3W)',
    roomBedNumber: 'Bed 304-A',
    attendingDoctor: 'Dr. Alok Verma, MD (Internal Medicine)',
    dietitianName: 'Dietitian Suman Rao',
    assessmentDate: '2026-08-29',
    weightKg: 78.5,
    heightCm: 172,
    bmi: 26.54,
    nutritionalRiskScore: 'MODERATE_RISK',
    clinicalCondition: 'Type 2 Diabetes Mellitus with Essential Hypertension',
    foodAllergies: ['PEANUTS'],
    foodIntolerances: ['LACTOSE'],
    culturalReligiousPreferences: 'Vegetarian (No Onion/Garlic on Tuesdays)',
    swallowingDifficulty: false,
    feedingRoute: 'ORAL',
    fluidRestrictionMl: 1500,
    specialInstructions: 'Low sodium, strictly sugar-free, lactose-free milk substitute',
    status: 'COMPLETED',
    createdAt: '2026-08-29T09:30:00Z'
  },
  {
    id: 'da111111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    assessmentNumber: 'ASSESS-DIET-0082',
    patientId: 'pa111111-1111-4111-8111-111111111102',
    patientName: 'Sunita Devi Banerjee',
    patientMrn: 'MRN-2026-9042',
    admissionId: 'ADM-IPD-2026-0915',
    wardName: 'ICU Tower (Level 2)',
    roomBedNumber: 'ICU Bed 08',
    attendingDoctor: 'Dr. Vivek Mehra, DM (Critical Care)',
    dietitianName: 'Dietitian Pooja Joshi',
    assessmentDate: '2026-08-29',
    weightKg: 54.0,
    heightCm: 158,
    bmi: 21.63,
    nutritionalRiskScore: 'HIGH_RISK',
    clinicalCondition: 'Post-laparotomy bowel resection, resolving ileus',
    foodAllergies: ['SOY'],
    foodIntolerances: [],
    swallowingDifficulty: true,
    feedingRoute: 'NASOGASTRIC_TUBE',
    fluidRestrictionMl: 1000,
    specialInstructions: 'Full enteral tube feed formula at 50 mL/hr infusion rate',
    status: 'COMPLETED',
    createdAt: '2026-08-29T10:15:00Z'
  }
];

export const mockDietaryOrders: DietaryOrderDto[] = [
  {
    id: 'do111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    orderNumber: 'DO-2026-00451',
    patientId: 'pa111111-1111-4111-8111-111111111101',
    patientName: 'Rameshwar Lal Verma',
    patientMrn: 'MRN-2026-8801',
    admissionId: 'ADM-IPD-2026-0912',
    wardName: 'Male Medical Ward (3W)',
    roomBedNumber: 'Bed 304-A',
    dietTypeId: 'dt111111-1111-4111-8111-111111111102',
    dietTypeName: 'Diabetic Low-Glycemic Index (1800 kcal)',
    dietCategory: 'DIABETIC',
    mealFrequency: '5 Meals / Day',
    startDate: '2026-08-29',
    fluidRestrictionMl: 1500,
    texture: 'REGULAR',
    feedingRoute: 'ORAL',
    priority: 'ROUTINE',
    isNpo: false,
    specialInstructions: 'No peanuts, sugar-free, diabetic snack at 21:30',
    allergyWarnings: ['PEANUTS'],
    orderingDoctor: 'Dr. Alok Verma, MD',
    reviewedByDietitian: 'Dietitian Suman Rao',
    status: 'ACTIVE',
    createdAt: '2026-08-29T10:00:00Z'
  },
  {
    id: 'do111111-1111-4111-8111-111111111102',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    orderNumber: 'DO-2026-00452',
    patientId: 'pa111111-1111-4111-8111-111111111102',
    patientName: 'Sunita Devi Banerjee',
    patientMrn: 'MRN-2026-9042',
    admissionId: 'ADM-IPD-2026-0915',
    wardName: 'ICU Tower (Level 2)',
    roomBedNumber: 'ICU Bed 08',
    dietTypeId: 'dt111111-1111-4111-8111-111111111104',
    dietTypeName: 'Nil Per Os (NPO / Strict Fasting)',
    dietCategory: 'NPO',
    mealFrequency: 'None',
    startDate: '2026-08-29',
    texture: 'REGULAR',
    feedingRoute: 'NASOGASTRIC_TUBE',
    priority: 'STAT_EMERGENCY',
    isNpo: true,
    specialInstructions: 'Pre-procedure ultrasound abdominal fasting ordered by surgeon',
    allergyWarnings: ['SOY'],
    orderingDoctor: 'Dr. Vivek Mehra, DM',
    reviewedByDietitian: 'Dietitian Pooja Joshi',
    status: 'ACTIVE',
    createdAt: '2026-08-29T10:30:00Z'
  }
];

export const mockDietaryDietPlans: DietaryDietPlanDto[] = [
  {
    id: 'dp111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    planCode: 'PLAN-DIET-2026-01',
    orderId: 'do111111-1111-4111-8111-111111111101',
    patientName: 'Rameshwar Lal Verma',
    wardBed: '3W / Bed 304-A',
    planDate: '2026-08-29',
    dietTypeName: 'Diabetic Low-Glycemic Index (1800 kcal)',
    breakfastItems: 'Steamed Oats Porridge (Sugar-free), Skim Milk 150ml, 1 Boiled Egg White',
    midMorningItems: 'Roasted Chana (30g), Green Tea with Lemon',
    lunchItems: 'Brown Rice (1 cup), Yellow Moong Dal, Steamed Lauki Sabzi, Cucumber Salad',
    eveningSnackItems: 'Sprouts Chaat with Lime (No Salt Extra)',
    dinnerItems: '2 Multigrain Phulkas, Mixed Veg Curry (Low Oil), Curd 100g',
    bedtimeSnackItems: 'Warm Skim Milk 100ml with Turmeric',
    totalEstimatedCalories: 1780,
    totalEstimatedProtein: 72.5,
    specialPrepNotes: 'Strictly peanut-free preparation in sterile area',
    status: 'ACTIVE',
    createdAt: '2026-08-29T10:15:00Z'
  }
];

export const mockDietaryMenuTemplates: DietaryMenuTemplateDto[] = [
  {
    id: 'mt111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    templateCode: 'MENU-LUNCH-DIAB',
    templateName: 'Therapeutic Diabetic Lunch Platter (Low Glycemic)',
    dietCategory: 'DIABETIC',
    mealSlot: 'LUNCH',
    menuItemsDescription: 'Brown rice, Moong Dal Tadka, Gourd vegetable, Green Salad, Low-fat Buttermilk',
    ingredientList: ['Brown Rice', 'Yellow Moong', 'Bottle Gourd', 'Cucumber', 'Low-fat Curd'],
    portionSize: '1 Standard Tray',
    estimatedCalories: 520,
    estimatedCost: 85.0,
    kitchenId: 'dk111111-1111-4111-8111-111111111101',
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const mockDietaryMealSchedules: DietaryMealScheduleDto[] = [
  {
    id: 'ms111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    scheduleCode: 'SCHED-MEAL-091',
    orderId: 'do111111-1111-4111-8111-111111111101',
    patientName: 'Rameshwar Lal Verma',
    wardName: 'Male Medical Ward (3W)',
    roomBedNumber: 'Bed 304-A',
    mealDate: '2026-08-29',
    mealSlot: 'LUNCH',
    dietTypeName: 'Diabetic Low-Glycemic Index (1800 kcal)',
    itemsToServe: 'Brown Rice (1 cup), Moong Dal, Lauki Sabzi, Salad (Sugar-free tray)',
    scheduledDispatchTime: '12:30',
    status: 'DISPATCHED',
    createdAt: '2026-08-29T11:00:00Z'
  }
];

export const mockDietaryProductionPlans: DietaryProductionPlanDto[] = [
  {
    id: 'pp111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    planNumber: 'PROD-2026-0829-LUNCH',
    kitchenId: 'dk111111-1111-4111-8111-111111111101',
    kitchenName: 'Central Hospital Production Kitchen',
    productionDate: '2026-08-29',
    mealSlot: 'LUNCH',
    totalPatientsCount: 142,
    regularMealsCount: 88,
    therapeuticMealsCount: 46,
    npoCount: 8,
    specialAllergyCount: 12,
    status: 'READY',
    releasedBy: 'Chef Rajesh Khanna',
    releasedAt: '2026-08-29T10:45:00Z',
    createdAt: '2026-08-29T07:00:00Z'
  }
];

export const mockDietaryPreparationRecords: DietaryPreparationRecordDto[] = [
  {
    id: 'pr111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    batchNumber: 'BATCH-LUNCH-DAL-01',
    productionPlanId: 'pp111111-1111-4111-8111-111111111101',
    dietCategory: 'THERAPEUTIC_DIABETIC',
    foodItemName: 'Therapeutic Yellow Moong Dal (Low Salt)',
    quantityPrepared: 50,
    unit: 'SERVINGS',
    headChef: 'Chef Rajesh Khanna',
    cookingTemperatureC: 98.5,
    holdingTemperatureC: 68.2,
    startTime: '10:30',
    completionTime: '11:45',
    status: 'READY_HOT_HOLDING',
    createdAt: '2026-08-29T10:30:00Z'
  }
];

export const mockDietaryQualityChecks: DietaryQualityCheckDto[] = [
  {
    id: 'qc111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    checkCode: 'QC-DIET-2026-0829-01',
    batchNumber: 'BATCH-LUNCH-DAL-01',
    kitchenName: 'Central Hospital Production Kitchen',
    hygieneCheckPassed: true,
    temperatureCheckPassed: true,
    holdingTempC: 68.2,
    allergenSegregationPassed: true,
    packagingIntegrityPassed: true,
    inspectorName: 'Officer Kavita Roy',
    inspectorRole: 'FOOD_SAFETY_OFFICER',
    qualityStatus: 'PASSED',
    notes: 'Hot holding temperature > 65C maintained. HACCP sample collected.',
    inspectedAt: '2026-08-29T12:00:00Z'
  }
];

export const mockDietaryTrayAssemblies: DietaryTrayAssemblyDto[] = [
  {
    id: 'ta111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    trayBarcode: 'TRAY-3W-304A-LUNCH',
    orderId: 'do111111-1111-4111-8111-111111111101',
    patientName: 'Rameshwar Lal Verma',
    patientMrn: 'MRN-2026-8801',
    wardName: 'Male Medical Ward (3W)',
    roomBedNumber: 'Bed 304-A',
    mealSlot: 'LUNCH',
    dietTypeName: 'Diabetic Low-Glycemic Index (1800 kcal)',
    itemsIncluded: 'Brown Rice, Moong Dal, Lauki Sabzi, Cucumber Salad (Sugar-Free Tag)',
    allergyNotice: 'PEANUT ALLERGY VERIFIED',
    assembledByStaff: 'Assembly Staff Vikram',
    isVerified: true,
    verifiedBy: 'Dietitian Suman Rao',
    assemblyTime: '12:15',
    status: 'VERIFIED_READY'
  }
];

export const mockDietaryMealDispatches: DietaryMealDispatchDto[] = [
  {
    id: 'md111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    dispatchCode: 'DISP-2026-0829-001',
    trayBarcode: 'TRAY-3W-304A-LUNCH',
    patientName: 'Rameshwar Lal Verma',
    patientMrn: 'MRN-2026-8801',
    wardName: 'Male Medical Ward (3W)',
    roomBedNumber: 'Bed 304-A',
    mealSlot: 'LUNCH',
    dietTypeName: 'Diabetic Low-Glycemic Index (1800 kcal)',
    deliveryPersonName: 'Ward Attendant Gopal Singh',
    dispatchedAt: '2026-08-29T12:25:00Z',
    deliveredAt: '2026-08-29T12:40:00Z',
    receivedBy: 'PATIENT_CONFIRMED',
    deliveryStatus: 'ACCEPTED',
    createdAt: '2026-08-29T12:25:00Z'
  }
];

export const mockDietarySafetyAlerts: DietarySafetyAlertDto[] = [
  {
    id: 'sa111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    alertCode: 'ALERT-DIET-2026-01',
    patientName: 'Sunita Devi Banerjee',
    patientMrn: 'MRN-2026-9042',
    wardBed: 'ICU Tower / Bed 08',
    alertType: 'NPO_VIOLATION_PREVENTED',
    severity: 'CRITICAL',
    description: 'Patient marked strict NPO for OT recovery. Scheduled standard breakfast tray was automatically cancelled in kitchen queue.',
    isResolved: true,
    resolvedBy: 'Dietitian Pooja Joshi',
    resolvedAt: '2026-08-29T10:35:00Z',
    resolutionNotes: 'Tray intercept confirmed. Kitchen production board notified of zero oral feed.',
    createdAt: '2026-08-29T10:30:00Z'
  }
];

export const mockDietaryWasteRecords: DietaryWasteRecordDto[] = [
  {
    id: 'wr111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    wasteCode: 'WASTE-2026-0829-01',
    kitchenName: 'Central Hospital Production Kitchen',
    mealDate: '2026-08-29',
    mealSlot: 'BREAKFAST',
    preparedQuantity: 150,
    servedQuantity: 142,
    wastedQuantity: 8,
    unit: 'PORTIONS',
    reason: 'OVERPRODUCTION',
    estimatedCostLoss: 320.0,
    reportedBy: 'Chef Rajesh Khanna',
    recordedAt: '2026-08-29T10:00:00Z'
  }
];

export const mockDietaryCostRecords: DietaryCostRecordDto[] = [
  {
    id: 'cr111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    costCode: 'COST-2026-0829-3W',
    recordDate: '2026-08-29',
    wardName: 'Male Medical Ward (3W)',
    dietCategory: 'THERAPEUTIC_DIABETIC',
    totalMealsServed: 42,
    ingredientCostTotal: 2520.0,
    laborCostEstimate: 840.0,
    wasteCostTotal: 120.0,
    costPerMealAverage: 82.85,
    createdAt: '2026-08-29T13:00:00Z'
  }
];

export const mockDietaryProcurementRefs: DietaryProcurementRefDto[] = [
  {
    id: 'pr111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    requisitionRefNumber: 'REQ-DIET-2026-089',
    ingredientName: 'Organic Whole Oats (Rolled)',
    quantityRequested: 50,
    unit: 'KG',
    urgency: 'ROUTINE',
    vendorRef: 'Apex Agro Supplies Ltd.',
    status: 'SUBMITTED_TO_PROCUREMENT',
    requestedBy: 'Kitchen Supervisor Ramesh',
    createdAt: '2026-08-29T08:30:00Z'
  }
];

export const mockDietaryBillingRefs: DietaryBillingRefDto[] = [
  {
    id: 'br111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    chargeCode: 'CHG-DIET-THER-01',
    patientId: 'pa111111-1111-4111-8111-111111111101',
    patientName: 'Rameshwar Lal Verma',
    patientMrn: 'MRN-2026-8801',
    dietTypeName: 'Diabetic Low-Glycemic Index (1800 kcal)',
    chargeCategory: 'THERAPEUTIC_DIET_PLAN',
    amount: 350.0,
    billingStatus: 'POSTED_TO_BILLING',
    createdAt: '2026-08-29T12:45:00Z'
  }
];

export const mockDietaryAuditTraces: DietaryAuditTraceDto[] = [
  {
    id: 'at111111-1111-4111-8111-111111111101',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    branchId: '44444444-4444-4444-8444-444444444444',
    traceNumber: 'TRACE-DIET-89218001',
    actorId: 'usr-diet-01',
    actorName: 'Dietitian Suman Rao',
    actorRole: 'CLINICAL_DIETITIAN',
    action: 'APPROVE_DIET_ORDER',
    entityType: 'DIETARY_ORDER',
    entityId: 'do111111-1111-4111-8111-111111111101',
    entityCode: 'DO-2026-00451',
    justification: 'Nutritional calculation verified against biochemical HbA1c profile (8.2%)',
    integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    timestamp: '2026-08-29T10:10:00Z'
  }
];

export const mockDietaryOverviewMetrics: DietaryOverviewMetricsDto = {
  totalActiveDietaryPatients: 184,
  totalActiveDietOrders: 178,
  mealsDueToday: 712,
  mealsInPreparation: 142,
  mealsReadyForDispatch: 64,
  mealsDeliveredToday: 498,
  missedOrRefusedMeals: 6,
  activeSafetyAlerts: 2,
  npoPatientCount: 14,
  qualityFailureCount: 0,
  totalFoodWasteKgToday: 18.5,
  totalWasteCostLossToday: 840.0
};

export const mockDietaryAnalytics: DietaryAnalyticsDto = {
  mealsServedByDietCategory: {
    REGULAR: 380,
    DIABETIC: 145,
    RENAL: 48,
    CARDIAC_LOW_SODIUM: 62,
    SOFT_LIQUID: 52,
    ENTERAL_TUBE_FEED: 25
  },
  mealsDeliveredByWard: {
    'Male Medical (3W)': 120,
    'Female Surgical (4E)': 95,
    'ICU / Critical Care': 42,
    'Pediatric Ward (2N)': 68,
    'Private Rooms (5W)': 85,
    'Emergency Observation': 88
  },
  wasteByReasonKg: {
    OVERPRODUCTION: 8.5,
    PATIENT_REFUSED: 4.2,
    DIET_CHANGED_LAST_MIN: 3.8,
    SPOILAGE: 2.0
  },
  dailyMealDeliverySuccessRatePct: 98.8,
  averageTurnaroundMins: 22.4,
  monthlyExpenditureVsBudget: {
    ingredientCost: 485000,
    wasteLoss: 14200,
    budgetAllocated: 600000
  }
};
