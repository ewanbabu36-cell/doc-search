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
  DietaryAnalyticsDto,
  CreateKitchenRequest,
  UpdateKitchenRequest,
  CreateDietTypeRequest,
  CreateFoodItemRequest,
  CreateDietAssessmentRequest,
  CreateDietOrderRequest,
  ApproveDietOrderRequest,
  ModifyDietOrderRequest,
  CreateDietPlanRequest,
  CreateMenuTemplateRequest,
  CreateMealScheduleRequest,
  CreateProductionPlanRequest,
  ReleaseProductionPlanRequest,
  RecordMealPreparationRequest,
  RecordQualityCheckRequest,
  CreateTrayAssemblyRequest,
  DispatchMealRequest,
  ConfirmMealDeliveryRequest,
  RefuseMealRequest,
  RecordMissedMealRequest,
  CreateDietChangeRequest,
  CreateNPOOrderRequest,
  ResolveDietarySafetyAlertRequest,
  RecordFoodWasteRequest,
  CreateDietaryProcurementReferenceRequest,
  CreateDietaryBillingReferenceRequest
} from '@docsearch/api-contracts';

import {
  mockDietaryDepartments,
  mockDietaryKitchens,
  mockDietaryDietTypes,
  mockDietaryFoodItems,
  mockDietaryAssessments,
  mockDietaryOrders,
  mockDietaryDietPlans,
  mockDietaryMenuTemplates,
  mockDietaryMealSchedules,
  mockDietaryProductionPlans,
  mockDietaryPreparationRecords,
  mockDietaryQualityChecks,
  mockDietaryTrayAssemblies,
  mockDietaryMealDispatches,
  mockDietarySafetyAlerts,
  mockDietaryWasteRecords,
  mockDietaryCostRecords,
  mockDietaryProcurementRefs,
  mockDietaryBillingRefs,
  mockDietaryAuditTraces,
  mockDietaryOverviewMetrics,
  mockDietaryAnalytics
} from './mock-dietary-data.js';

export interface IDietaryManagementService {
  getOverviewMetrics(tenantId: string): Promise<DietaryOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<DietaryAnalyticsDto>;
  getDepartments(tenantId: string): Promise<DietaryDepartmentDto[]>;
  getKitchens(tenantId: string): Promise<DietaryKitchenDto[]>;
  createKitchen(tenantId: string, payload: CreateKitchenRequest): Promise<DietaryKitchenDto>;
  updateKitchen(tenantId: string, id: string, payload: UpdateKitchenRequest): Promise<DietaryKitchenDto>;
  getDietTypes(tenantId: string): Promise<DietaryDietTypeDto[]>;
  createDietType(tenantId: string, payload: CreateDietTypeRequest): Promise<DietaryDietTypeDto>;
  getFoodItems(tenantId: string): Promise<DietaryFoodItemDto[]>;
  createFoodItem(tenantId: string, payload: CreateFoodItemRequest): Promise<DietaryFoodItemDto>;
  getAssessments(tenantId: string): Promise<DietaryAssessmentDto[]>;
  createAssessment(tenantId: string, payload: CreateDietAssessmentRequest): Promise<DietaryAssessmentDto>;
  getOrders(tenantId: string): Promise<DietaryOrderDto[]>;
  createOrder(tenantId: string, payload: CreateDietOrderRequest): Promise<DietaryOrderDto>;
  approveOrder(tenantId: string, orderId: string, payload: ApproveDietOrderRequest): Promise<DietaryOrderDto>;
  modifyOrder(tenantId: string, orderId: string, payload: ModifyDietOrderRequest): Promise<DietaryOrderDto>;
  cancelOrder(tenantId: string, orderId: string, reason: string): Promise<DietaryOrderDto>;
  getDietPlans(tenantId: string): Promise<DietaryDietPlanDto[]>;
  createDietPlan(tenantId: string, payload: CreateDietPlanRequest): Promise<DietaryDietPlanDto>;
  getMenuTemplates(tenantId: string): Promise<DietaryMenuTemplateDto[]>;
  createMenuTemplate(tenantId: string, payload: CreateMenuTemplateRequest): Promise<DietaryMenuTemplateDto>;
  getMealSchedules(tenantId: string): Promise<DietaryMealScheduleDto[]>;
  createMealSchedule(tenantId: string, payload: CreateMealScheduleRequest): Promise<DietaryMealScheduleDto>;
  getProductionPlans(tenantId: string): Promise<DietaryProductionPlanDto[]>;
  createProductionPlan(tenantId: string, payload: CreateProductionPlanRequest): Promise<DietaryProductionPlanDto>;
  releaseProductionPlan(tenantId: string, planId: string, payload: ReleaseProductionPlanRequest): Promise<DietaryProductionPlanDto>;
  getPreparationRecords(tenantId: string): Promise<DietaryPreparationRecordDto[]>;
  recordMealPreparation(tenantId: string, payload: RecordMealPreparationRequest): Promise<DietaryPreparationRecordDto>;
  getQualityChecks(tenantId: string): Promise<DietaryQualityCheckDto[]>;
  recordQualityCheck(tenantId: string, payload: RecordQualityCheckRequest): Promise<DietaryQualityCheckDto>;
  getTrayAssemblies(tenantId: string): Promise<DietaryTrayAssemblyDto[]>;
  createTrayAssembly(tenantId: string, payload: CreateTrayAssemblyRequest): Promise<DietaryTrayAssemblyDto>;
  getMealDispatches(tenantId: string): Promise<DietaryMealDispatchDto[]>;
  dispatchMeal(tenantId: string, payload: DispatchMealRequest): Promise<DietaryMealDispatchDto>;
  confirmMealDelivery(tenantId: string, dispatchId: string, payload: ConfirmMealDeliveryRequest): Promise<DietaryMealDispatchDto>;
  refuseMeal(tenantId: string, dispatchId: string, payload: RefuseMealRequest): Promise<DietaryMealDispatchDto>;
  recordMissedMeal(tenantId: string, dispatchId: string, payload: RecordMissedMealRequest): Promise<DietaryMealDispatchDto>;
  createDietChange(tenantId: string, payload: CreateDietChangeRequest): Promise<DietaryOrderDto>;
  createNPOOrder(tenantId: string, payload: CreateNPOOrderRequest): Promise<DietaryOrderDto>;
  getSafetyAlerts(tenantId: string): Promise<DietarySafetyAlertDto[]>;
  resolveSafetyAlert(tenantId: string, alertId: string, payload: ResolveDietarySafetyAlertRequest): Promise<DietarySafetyAlertDto>;
  getWasteRecords(tenantId: string): Promise<DietaryWasteRecordDto[]>;
  recordFoodWaste(tenantId: string, payload: RecordFoodWasteRequest): Promise<DietaryWasteRecordDto>;
  getCostRecords(tenantId: string): Promise<DietaryCostRecordDto[]>;
  getProcurementRefs(tenantId: string): Promise<DietaryProcurementRefDto[]>;
  createProcurementRef(tenantId: string, payload: CreateDietaryProcurementReferenceRequest): Promise<DietaryProcurementRefDto>;
  getBillingRefs(tenantId: string): Promise<DietaryBillingRefDto[]>;
  createBillingRef(tenantId: string, payload: CreateDietaryBillingReferenceRequest): Promise<DietaryBillingRefDto>;
  getAuditTraces(tenantId: string): Promise<DietaryAuditTraceDto[]>;
}

class DietaryManagementService implements IDietaryManagementService {
  private departments = [...mockDietaryDepartments];
  private kitchens = [...mockDietaryKitchens];
  private dietTypes = [...mockDietaryDietTypes];
  private foodItems = [...mockDietaryFoodItems];
  private assessments = [...mockDietaryAssessments];
  private orders = [...mockDietaryOrders];
  private dietPlans = [...mockDietaryDietPlans];
  private menuTemplates = [...mockDietaryMenuTemplates];
  private mealSchedules = [...mockDietaryMealSchedules];
  private productionPlans = [...mockDietaryProductionPlans];
  private preparationRecords = [...mockDietaryPreparationRecords];
  private qualityChecks = [...mockDietaryQualityChecks];
  private trayAssemblies = [...mockDietaryTrayAssemblies];
  private mealDispatches = [...mockDietaryMealDispatches];
  private safetyAlerts = [...mockDietarySafetyAlerts];
  private wasteRecords = [...mockDietaryWasteRecords];
  private costRecords = [...mockDietaryCostRecords];
  private procurementRefs = [...mockDietaryProcurementRefs];
  private billingRefs = [...mockDietaryBillingRefs];
  private auditTraces = [...mockDietaryAuditTraces];

  private appendAudit(
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    actorRole = 'DIETARY_OFFICER',
    actorName = 'Authorized Dietary Staff'
  ) {
    const traceNumber = `TRACE-DIET-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const trace: DietaryAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId: '11111111-1111-4111-8111-111111111111',
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      traceNumber,
      actorId: 'usr-diet-current',
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      entityCode,
      justification,
      integrityHash: 'sha256-' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(_tenantId: string): Promise<DietaryOverviewMetricsDto> {
    return {
      ...mockDietaryOverviewMetrics,
      totalActiveDietOrders: this.orders.filter((o) => o.status === 'ACTIVE').length,
      npoPatientCount: this.orders.filter((o) => o.isNpo && o.status === 'ACTIVE').length,
      activeSafetyAlerts: this.safetyAlerts.filter((a) => !a.isResolved).length
    };
  }

  async getAnalytics(_tenantId: string): Promise<DietaryAnalyticsDto> {
    return { ...mockDietaryAnalytics };
  }

  async getDepartments(_tenantId: string): Promise<DietaryDepartmentDto[]> {
    return [...this.departments];
  }

  async getKitchens(_tenantId: string): Promise<DietaryKitchenDto[]> {
    return [...this.kitchens];
  }

  async createKitchen(tenantId: string, payload: CreateKitchenRequest): Promise<DietaryKitchenDto> {
    const kitchen: DietaryKitchenDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      kitchenCode: payload.kitchenCode,
      kitchenName: payload.kitchenName,
      kitchenType: payload.kitchenType,
      location: payload.location,
      dailyCapacity: payload.dailyCapacity,
      operatingHours: payload.operatingHours,
      responsibleManager: payload.responsibleManager,
      contactPhone: payload.contactPhone,
      foodSafetyStatus: payload.foodSafetyStatus || 'COMPLIANT_HACCP',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.kitchens.unshift(kitchen);
    this.appendAudit('CREATE_KITCHEN', 'DIETARY_KITCHEN', kitchen.id, kitchen.kitchenCode, 'New kitchen facility registered');
    return kitchen;
  }

    async updateKitchen(_tenantId: string, id: string, payload: UpdateKitchenRequest): Promise<DietaryKitchenDto> {
    const idx = this.kitchens.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error('Kitchen not found');
    const existing = this.kitchens[idx];
    if (!existing) throw new Error("Kitchen not found");
    const updated: DietaryKitchenDto = {
      id: existing.id,
      tenantId: existing.tenantId,
      partnerId: existing.partnerId,
      organizationId: existing.organizationId,
      branchId: existing.branchId,
      kitchenCode: existing.kitchenCode,
      kitchenName: payload.kitchenName ?? existing.kitchenName,
      kitchenType: payload.kitchenType ?? existing.kitchenType,
      location: payload.location ?? existing.location,
      dailyCapacity: payload.dailyCapacity ?? existing.dailyCapacity,
      operatingHours: payload.operatingHours ?? existing.operatingHours,
      responsibleManager: payload.responsibleManager ?? existing.responsibleManager,
      contactPhone: payload.contactPhone ?? existing.contactPhone,
      foodSafetyStatus: payload.foodSafetyStatus ?? existing.foodSafetyStatus,
      status: existing.status,
      createdAt: existing.createdAt
    };
    this.kitchens[idx] = updated;
    this.appendAudit('UPDATE_KITCHEN', 'DIETARY_KITCHEN', updated.id, updated.kitchenCode, 'Kitchen parameters updated');
    return updated;
  }

  async getDietTypes(_tenantId: string): Promise<DietaryDietTypeDto[]> {
    return [...this.dietTypes];
  }

  async createDietType(tenantId: string, payload: CreateDietTypeRequest): Promise<DietaryDietTypeDto> {
    const dt: DietaryDietTypeDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      dietCode: payload.dietCode,
      dietName: payload.dietName,
      category: payload.category,
      clinicalPurpose: payload.clinicalPurpose,
      allowedFoods: payload.allowedFoods,
      restrictedFoods: payload.restrictedFoods,
      allergensToAvoid: payload.allergensToAvoid || [],
      targetCalories: payload.targetCalories,
      targetProteinGrams: payload.targetProteinGrams,
      targetCarbsGrams: payload.targetCarbsGrams,
      targetFatGrams: payload.targetFatGrams,
      sodiumRestrictedMg: payload.sodiumRestrictedMg,
      fluidRestrictedMl: payload.fluidRestrictedMl,
      texture: payload.texture,
      mealFrequencyPerDay: payload.mealFrequencyPerDay,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.dietTypes.unshift(dt);
    this.appendAudit('CREATE_DIET_TYPE', 'DIET_TYPE', dt.id, dt.dietCode, 'New clinical diet master profile defined');
    return dt;
  }

  async getFoodItems(_tenantId: string): Promise<DietaryFoodItemDto[]> {
    return [...this.foodItems];
  }

  async createFoodItem(tenantId: string, payload: CreateFoodItemRequest): Promise<DietaryFoodItemDto> {
    const fi: DietaryFoodItemDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      itemCode: payload.itemCode,
      itemName: payload.itemName,
      category: payload.category,
      unit: payload.unit,
      caloriesPerUnit: payload.caloriesPerUnit,
      proteinPerUnit: payload.proteinPerUnit,
      carbsPerUnit: payload.carbsPerUnit,
      fatPerUnit: payload.fatPerUnit,
      allergens: payload.allergens || [],
      storageType: payload.storageType || 'DRY',
      estimatedUnitCost: payload.estimatedUnitCost,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.foodItems.unshift(fi);
    this.appendAudit('CREATE_FOOD_ITEM', 'FOOD_ITEM', fi.id, fi.itemCode, 'New ingredient/item registered in nutritional catalog');
    return fi;
  }

  async getAssessments(_tenantId: string): Promise<DietaryAssessmentDto[]> {
    return [...this.assessments];
  }

  async createAssessment(tenantId: string, payload: CreateDietAssessmentRequest): Promise<DietaryAssessmentDto> {
    const heightM = payload.heightCm / 100;
    const bmi = Number((payload.weightKg / (heightM * heightM)).toFixed(2));
    const da: DietaryAssessmentDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      assessmentNumber: `ASSESS-DIET-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: payload.patientId,
      patientName: payload.patientName,
      patientMrn: payload.patientMrn,
      wardName: payload.wardName,
      roomBedNumber: payload.roomBedNumber,
      attendingDoctor: payload.attendingDoctor,
      dietitianName: payload.dietitianName,
      assessmentDate: new Date().toISOString().split('T')[0] || '2026-08-30',
      weightKg: payload.weightKg,
      heightCm: payload.heightCm,
      bmi,
      nutritionalRiskScore: payload.nutritionalRiskScore,
      clinicalCondition: payload.clinicalCondition,
      foodAllergies: payload.foodAllergies || [],
      foodIntolerances: payload.foodIntolerances || [],
      culturalReligiousPreferences: payload.culturalReligiousPreferences,
      swallowingDifficulty: payload.swallowingDifficulty,
      feedingRoute: payload.feedingRoute,
      fluidRestrictionMl: payload.fluidRestrictionMl,
      specialInstructions: payload.specialInstructions,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    this.assessments.unshift(da);
    this.appendAudit('CREATE_DIET_ASSESSMENT', 'DIETARY_ASSESSMENT', da.id, da.assessmentNumber, 'Inpatient nutritional assessment finalized');
    return da;
  }

  async getOrders(_tenantId: string): Promise<DietaryOrderDto[]> {
    return [...this.orders];
  }

  async createOrder(tenantId: string, payload: CreateDietOrderRequest): Promise<DietaryOrderDto> {
    const order: DietaryOrderDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      orderNumber: `DO-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: payload.patientId,
      patientName: payload.patientName,
      patientMrn: payload.patientMrn,
      wardName: payload.wardName,
      roomBedNumber: payload.roomBedNumber,
      dietTypeId: payload.dietTypeId,
      dietTypeName: payload.dietTypeName,
      dietCategory: payload.dietCategory,
      mealFrequency: payload.mealFrequency,
      startDate: payload.startDate,
      endDate: payload.endDate,
      fluidRestrictionMl: payload.fluidRestrictionMl,
      texture: payload.texture,
      feedingRoute: payload.feedingRoute,
      priority: payload.priority,
      isNpo: payload.isNpo,
      specialInstructions: payload.specialInstructions,
      allergyWarnings: payload.allergyWarnings || [],
      orderingDoctor: payload.orderingDoctor,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.orders.unshift(order);
    this.appendAudit('CREATE_DIET_ORDER', 'DIETARY_ORDER', order.id, order.orderNumber, 'Clinical diet order prescribed');
    return order;
  }

  async approveOrder(_tenantId: string, orderId: string, payload: ApproveDietOrderRequest): Promise<DietaryOrderDto> {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    const existing = this.orders[idx];
    if (!existing) throw new Error("Diet order not found");
    const updated: DietaryOrderDto = {
      ...existing,
      reviewedByDietitian: payload.dietitianName,
      status: 'APPROVED'
    };
    this.orders[idx] = updated;
    this.appendAudit('APPROVE_DIET_ORDER', 'DIETARY_ORDER', updated.id, updated.orderNumber, payload.approvalNotes || 'Diet order verified by dietitian', 'CLINICAL_DIETITIAN', payload.dietitianName);
    return updated;
  }

  async modifyOrder(_tenantId: string, orderId: string, payload: ModifyDietOrderRequest): Promise<DietaryOrderDto> {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    const existing = this.orders[idx];
    if (!existing) throw new Error("Diet order not found");
    const updated: DietaryOrderDto = {
      ...existing,
      dietTypeId: payload.newDietTypeId,
      dietTypeName: payload.newDietTypeName,
      status: 'MODIFIED'
    };
    this.orders[idx] = updated;
    this.appendAudit('MODIFY_DIET_ORDER', 'DIETARY_ORDER', updated.id, updated.orderNumber, payload.modificationReason, 'CLINICAL_DIETITIAN', payload.modifiedBy);
    return updated;
  }

  async cancelOrder(_tenantId: string, orderId: string, reason: string): Promise<DietaryOrderDto> {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    const existing = this.orders[idx];
    if (!existing) throw new Error("Diet order not found");
    const updated: DietaryOrderDto = {
      ...existing,
      status: 'CANCELLED'
    };
    this.orders[idx] = updated;
    this.appendAudit('CANCEL_DIET_ORDER', 'DIETARY_ORDER', updated.id, updated.orderNumber, reason);
    return updated;
  }

  async getDietPlans(_tenantId: string): Promise<DietaryDietPlanDto[]> {
    return [...this.dietPlans];
  }

  async createDietPlan(tenantId: string, payload: CreateDietPlanRequest): Promise<DietaryDietPlanDto> {
    const order = this.orders.find((o) => o.id === payload.orderId);
    const plan: DietaryDietPlanDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      planCode: `PLAN-DIET-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: payload.orderId,
      patientName: order?.patientName || 'Inpatient',
      wardBed: `${order?.wardName || 'Ward'} / ${order?.roomBedNumber || 'Bed'}`,
      planDate: payload.planDate,
      dietTypeName: order?.dietTypeName || 'Therapeutic Diet',
      breakfastItems: payload.breakfastItems,
      midMorningItems: payload.midMorningItems,
      lunchItems: payload.lunchItems,
      eveningSnackItems: payload.eveningSnackItems,
      dinnerItems: payload.dinnerItems,
      bedtimeSnackItems: payload.bedtimeSnackItems,
      totalEstimatedCalories: payload.totalEstimatedCalories,
      totalEstimatedProtein: payload.totalEstimatedProtein,
      specialPrepNotes: payload.specialPrepNotes,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.dietPlans.unshift(plan);
    this.appendAudit('CREATE_DIET_PLAN', 'DIET_PLAN', plan.id, plan.planCode, 'Personalized patient daily meal plan formulated');
    return plan;
  }

  async getMenuTemplates(_tenantId: string): Promise<DietaryMenuTemplateDto[]> {
    return [...this.menuTemplates];
  }

  async createMenuTemplate(tenantId: string, payload: CreateMenuTemplateRequest): Promise<DietaryMenuTemplateDto> {
    const template: DietaryMenuTemplateDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      templateCode: payload.templateCode,
      templateName: payload.templateName,
      dietCategory: payload.dietCategory,
      mealSlot: payload.mealSlot,
      menuItemsDescription: payload.menuItemsDescription,
      ingredientList: payload.ingredientList || [],
      portionSize: payload.portionSize,
      estimatedCalories: payload.estimatedCalories,
      estimatedCost: payload.estimatedCost,
      kitchenId: payload.kitchenId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.menuTemplates.unshift(template);
    this.appendAudit('CREATE_MENU_TEMPLATE', 'MENU_TEMPLATE', template.id, template.templateCode, 'New hospital meal menu template configured');
    return template;
  }

  async getMealSchedules(_tenantId: string): Promise<DietaryMealScheduleDto[]> {
    return [...this.mealSchedules];
  }

  async createMealSchedule(tenantId: string, payload: CreateMealScheduleRequest): Promise<DietaryMealScheduleDto> {
    const order = this.orders.find((o) => o.id === payload.orderId);
    const schedule: DietaryMealScheduleDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      scheduleCode: `SCHED-MEAL-${Math.floor(100 + Math.random() * 900)}`,
      orderId: payload.orderId,
      patientName: order?.patientName || 'Inpatient',
      wardName: order?.wardName || 'Ward',
      roomBedNumber: order?.roomBedNumber || 'Bed',
      mealDate: payload.mealDate,
      mealSlot: payload.mealSlot,
      dietTypeName: order?.dietTypeName || 'Standard Diet',
      itemsToServe: payload.itemsToServe,
      scheduledDispatchTime: payload.scheduledDispatchTime,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    };
    this.mealSchedules.unshift(schedule);
    this.appendAudit('CREATE_MEAL_SCHEDULE', 'MEAL_SCHEDULE', schedule.id, schedule.scheduleCode, 'Meal dispatch slot scheduled');
    return schedule;
  }

  async getProductionPlans(_tenantId: string): Promise<DietaryProductionPlanDto[]> {
    return [...this.productionPlans];
  }

  async createProductionPlan(tenantId: string, payload: CreateProductionPlanRequest): Promise<DietaryProductionPlanDto> {
    const kitchen = this.kitchens.find((k) => k.id === payload.kitchenId);
    const plan: DietaryProductionPlanDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      planNumber: `PROD-${payload.productionDate}-${payload.mealSlot}`,
      kitchenId: payload.kitchenId,
      kitchenName: kitchen?.kitchenName || 'Kitchen',
      productionDate: payload.productionDate,
      mealSlot: payload.mealSlot,
      totalPatientsCount: payload.totalPatientsCount,
      regularMealsCount: payload.regularMealsCount,
      therapeuticMealsCount: payload.therapeuticMealsCount,
      npoCount: payload.npoCount,
      specialAllergyCount: payload.specialAllergyCount,
      status: 'PLANNED',
      createdAt: new Date().toISOString()
    };
    this.productionPlans.unshift(plan);
    this.appendAudit('CREATE_PRODUCTION_PLAN', 'PRODUCTION_PLAN', plan.id, plan.planNumber, 'Batch production census calculated');
    return plan;
  }

  async releaseProductionPlan(_tenantId: string, planId: string, payload: ReleaseProductionPlanRequest): Promise<DietaryProductionPlanDto> {
    const idx = this.productionPlans.findIndex((p) => p.id === planId);
    if (idx === -1) throw new Error('Production plan not found');
    const existing = this.productionPlans[idx];
    if (!existing) throw new Error("Production plan not found");
    const updated: DietaryProductionPlanDto = {
      ...existing,
      releasedBy: payload.releasedBy,
      releasedAt: new Date().toISOString(),
      status: 'RELEASED'
    };
    this.productionPlans[idx] = updated;
    this.appendAudit('RELEASE_PRODUCTION_PLAN', 'PRODUCTION_PLAN', updated.id, updated.planNumber, 'Production batch released to kitchen chefs', 'KITCHEN_SUPERVISOR', payload.releasedBy);
    return updated;
  }

  async getPreparationRecords(_tenantId: string): Promise<DietaryPreparationRecordDto[]> {
    return [...this.preparationRecords];
  }

  async recordMealPreparation(tenantId: string, payload: RecordMealPreparationRequest): Promise<DietaryPreparationRecordDto> {
    const prep: DietaryPreparationRecordDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      productionPlanId: payload.productionPlanId,
      dietCategory: payload.dietCategory,
      foodItemName: payload.foodItemName,
      quantityPrepared: payload.quantityPrepared,
      unit: payload.unit,
      headChef: payload.headChef,
      cookingTemperatureC: payload.cookingTemperatureC || 95.0,
      holdingTemperatureC: payload.holdingTemperatureC || 68.0,
      startTime: new Date().toTimeString().slice(0, 5),
      status: 'PREPARED',
      createdAt: new Date().toISOString()
    };
    this.preparationRecords.unshift(prep);
    this.appendAudit('RECORD_MEAL_PREPARATION', 'PREPARATION_RECORD', prep.id, prep.batchNumber, 'Culinary batch completed with temperature log', 'HEAD_CHEF', payload.headChef);
    return prep;
  }

  async getQualityChecks(_tenantId: string): Promise<DietaryQualityCheckDto[]> {
    return [...this.qualityChecks];
  }

  async recordQualityCheck(tenantId: string, payload: RecordQualityCheckRequest): Promise<DietaryQualityCheckDto> {
    const check: DietaryQualityCheckDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      checkCode: `QC-DIET-${Date.now().toString().slice(-6)}`,
      batchNumber: payload.batchNumber,
      kitchenName: payload.kitchenName,
      hygieneCheckPassed: payload.hygieneCheckPassed,
      temperatureCheckPassed: payload.temperatureCheckPassed,
      holdingTempC: payload.holdingTempC,
      allergenSegregationPassed: payload.allergenSegregationPassed,
      packagingIntegrityPassed: payload.packagingIntegrityPassed,
      inspectorName: payload.inspectorName,
      inspectorRole: payload.inspectorRole,
      qualityStatus: payload.qualityStatus,
      notes: payload.notes,
      inspectedAt: new Date().toISOString()
    };
    this.qualityChecks.unshift(check);
    this.appendAudit('RECORD_QUALITY_CHECK', 'QUALITY_CHECK', check.id, check.checkCode, `HACCP Safety audit: ${payload.qualityStatus}`, payload.inspectorRole, payload.inspectorName);
    return check;
  }

  async getTrayAssemblies(_tenantId: string): Promise<DietaryTrayAssemblyDto[]> {
    return [...this.trayAssemblies];
  }

  async createTrayAssembly(tenantId: string, payload: CreateTrayAssemblyRequest): Promise<DietaryTrayAssemblyDto> {
    const order = this.orders.find((o) => o.id === payload.orderId);
    const tray: DietaryTrayAssemblyDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      trayBarcode: `TRAY-${order?.wardName?.slice(0, 2) || 'W'}-${order?.roomBedNumber || 'B'}-${payload.mealSlot}`,
      orderId: payload.orderId,
      patientName: order?.patientName || 'Inpatient',
      patientMrn: order?.patientMrn || 'MRN',
      wardName: order?.wardName || 'Ward',
      roomBedNumber: order?.roomBedNumber || 'Bed',
      mealSlot: payload.mealSlot,
      dietTypeName: order?.dietTypeName || 'Standard Diet',
      itemsIncluded: payload.itemsIncluded,
      allergyNotice: payload.allergyNotice,
      assembledByStaff: payload.assembledByStaff,
      isVerified: true,
      verifiedBy: payload.assembledByStaff,
      assemblyTime: new Date().toTimeString().slice(0, 5),
      status: 'VERIFIED_READY'
    };
    this.trayAssemblies.unshift(tray);
    this.appendAudit('CREATE_TRAY_ASSEMBLY', 'TRAY_ASSEMBLY', tray.id, tray.trayBarcode, 'Meal tray assembled and tagged with barcode');
    return tray;
  }

  async getMealDispatches(_tenantId: string): Promise<DietaryMealDispatchDto[]> {
    return [...this.mealDispatches];
  }

  async dispatchMeal(tenantId: string, payload: DispatchMealRequest): Promise<DietaryMealDispatchDto> {
    const tray = this.trayAssemblies.find((t) => t.trayBarcode === payload.trayBarcode);
    const dispatch: DietaryMealDispatchDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      dispatchCode: `DISP-${Date.now().toString().slice(-6)}`,
      trayBarcode: payload.trayBarcode,
      patientName: tray?.patientName || 'Inpatient',
      patientMrn: tray?.patientMrn || 'MRN',
      wardName: tray?.wardName || 'Ward',
      roomBedNumber: tray?.roomBedNumber || 'Bed',
      mealSlot: tray?.mealSlot || 'MEAL',
      dietTypeName: tray?.dietTypeName || 'Standard Diet',
      deliveryPersonName: payload.deliveryPersonName,
      dispatchedAt: new Date().toISOString(),
      deliveryStatus: 'DISPATCHED',
      createdAt: new Date().toISOString()
    };
    this.mealDispatches.unshift(dispatch);
    this.appendAudit('DISPATCH_MEAL', 'MEAL_DISPATCH', dispatch.id, dispatch.dispatchCode, 'Tray dispatched to ward delivery route');
    return dispatch;
  }

  async confirmMealDelivery(_tenantId: string, dispatchId: string, payload: ConfirmMealDeliveryRequest): Promise<DietaryMealDispatchDto> {
    const idx = this.mealDispatches.findIndex((d) => d.id === dispatchId);
    if (idx === -1) throw new Error('Dispatch record not found');
    const existing = this.mealDispatches[idx];
    if (!existing) throw new Error("Meal dispatch not found");
    const updated: DietaryMealDispatchDto = {
      ...existing,
      deliveredAt: new Date().toISOString(),
      receivedBy: payload.receivedBy,
      deliveryStatus: 'ACCEPTED'
    };
    this.mealDispatches[idx] = updated;
    this.appendAudit('CONFIRM_MEAL_DELIVERY', 'MEAL_DISPATCH', updated.id, updated.dispatchCode, `Meal received and accepted by ${payload.receivedBy}`, 'WARD_STAFF', payload.deliveryStaff);
    return updated;
  }

  async refuseMeal(_tenantId: string, dispatchId: string, payload: RefuseMealRequest): Promise<DietaryMealDispatchDto> {
    const idx = this.mealDispatches.findIndex((d) => d.id === dispatchId);
    if (idx === -1) throw new Error('Dispatch record not found');
    const existing = this.mealDispatches[idx];
    if (!existing) throw new Error("Meal dispatch not found");
    const updated: DietaryMealDispatchDto = {
      ...existing,
      deliveryStatus: 'REFUSED',
      exceptionReason: payload.reasonDescription
    };
    this.mealDispatches[idx] = updated;
    this.appendAudit('REFUSE_MEAL', 'MEAL_DISPATCH', updated.id, updated.dispatchCode, `Meal refused by patient: ${payload.reasonDescription}`, 'WARD_NURSE', payload.reportedByNurse);
    return updated;
  }

  async recordMissedMeal(_tenantId: string, dispatchId: string, payload: RecordMissedMealRequest): Promise<DietaryMealDispatchDto> {
    const idx = this.mealDispatches.findIndex((d) => d.id === dispatchId);
    if (idx === -1) throw new Error('Dispatch record not found');
    const existing = this.mealDispatches[idx];
    if (!existing) throw new Error("Meal dispatch not found");
    const updated: DietaryMealDispatchDto = {
      ...existing,
      deliveryStatus: 'MISSED',
      exceptionReason: payload.reasonDescription
    };
    this.mealDispatches[idx] = updated;
    this.appendAudit('RECORD_MISSED_MEAL', 'MEAL_DISPATCH', updated.id, updated.dispatchCode, `Missed meal registered: ${payload.reasonDescription}`, 'DISPATCH_OFFICER', payload.reportedBy);
    return updated;
  }

  async createDietChange(tenantId: string, payload: CreateDietChangeRequest): Promise<DietaryOrderDto> {
    const idx = this.orders.findIndex((o) => o.id === payload.orderId);
    if (idx === -1) throw new Error('Order not found');
    const existing = this.orders[idx];
    if (!existing) throw new Error("Diet order not found");
    const dt = this.dietTypes.find((t) => t.id === payload.newDietTypeId);
    const updated: DietaryOrderDto = {
      ...existing,
      dietTypeId: payload.newDietTypeId,
      dietTypeName: dt?.dietName || 'Modified Diet',
      dietCategory: dt?.category || 'CUSTOM_THERAPEUTIC',
      status: 'MODIFIED'
    };
    this.orders[idx] = updated;

    // Trigger safety alert for kitchen interception
    const alert: DietarySafetyAlertDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      alertCode: `ALERT-DIET-${Date.now().toString().slice(-6)}`,
      patientName: updated.patientName,
      patientMrn: updated.patientMrn,
      wardBed: `${updated.wardName} / ${updated.roomBedNumber}`,
      alertType: 'DIET_CHANGE_CONFLICT',
      severity: 'HIGH',
      description: `Diet changed from ${existing.dietTypeName} to ${updated.dietTypeName}. Reason: ${payload.justification}`,
      isResolved: false,
      createdAt: new Date().toISOString()
    };
    this.safetyAlerts.unshift(alert);

    this.appendAudit('CREATE_DIET_CHANGE', 'DIETARY_ORDER', updated.id, updated.orderNumber, payload.justification, 'ORDERING_CLINICIAN', payload.orderingClinician);
    return updated;
  }

  async createNPOOrder(tenantId: string, payload: CreateNPOOrderRequest): Promise<DietaryOrderDto> {
    const idx = this.orders.findIndex((o) => o.id === payload.orderId);
    if (idx === -1) throw new Error('Order not found');
    const existing = this.orders[idx];
    if (!existing) throw new Error("Diet order not found");
    const updated: DietaryOrderDto = {
      ...existing,
      isNpo: true,
      priority: 'STAT_EMERGENCY',
      specialInstructions: `STRICT NPO ORDERED: ${payload.npoReason}`,
      status: 'ACTIVE'
    };
    this.orders[idx] = updated;

    // Create Critical Safety Alert
    const alert: DietarySafetyAlertDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      alertCode: `ALERT-NPO-${Date.now().toString().slice(-6)}`,
      patientName: updated.patientName,
      patientMrn: updated.patientMrn,
      wardBed: `${updated.wardName} / ${updated.roomBedNumber}`,
      alertType: 'NPO_ORDER_ACTIVATED',
      severity: 'CRITICAL',
      description: `Strict zero oral intake declared for ${updated.patientName}. Reason: ${payload.npoReason}. Future meals halted.`,
      isResolved: false,
      createdAt: new Date().toISOString()
    };
    this.safetyAlerts.unshift(alert);

    this.appendAudit('CREATE_NPO_ORDER', 'DIETARY_ORDER', updated.id, updated.orderNumber, payload.npoReason, 'ORDERING_DOCTOR', payload.orderingDoctor);
    return updated;
  }

  async getSafetyAlerts(_tenantId: string): Promise<DietarySafetyAlertDto[]> {
    return [...this.safetyAlerts];
  }

  async resolveSafetyAlert(_tenantId: string, alertId: string, payload: ResolveDietarySafetyAlertRequest): Promise<DietarySafetyAlertDto> {
    const idx = this.safetyAlerts.findIndex((a) => a.id === alertId);
    if (idx === -1) throw new Error('Alert not found');
    const existing = this.safetyAlerts[idx];
    if (!existing) throw new Error("Safety alert not found");
    const updated: DietarySafetyAlertDto = {
      ...existing,
      isResolved: true,
      resolvedBy: payload.resolvedBy,
      resolvedAt: new Date().toISOString(),
      resolutionNotes: payload.resolutionNotes
    };
    this.safetyAlerts[idx] = updated;
    this.appendAudit('RESOLVE_SAFETY_ALERT', 'SAFETY_ALERT', updated.id, updated.alertCode, payload.resolutionNotes, 'DIETARY_SAFETY_OFFICER', payload.resolvedBy);
    return updated;
  }

  async getWasteRecords(_tenantId: string): Promise<DietaryWasteRecordDto[]> {
    return [...this.wasteRecords];
  }

  async recordFoodWaste(tenantId: string, payload: RecordFoodWasteRequest): Promise<DietaryWasteRecordDto> {
    const record: DietaryWasteRecordDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      wasteCode: `WASTE-${Date.now().toString().slice(-6)}`,
      kitchenName: payload.kitchenName,
      mealDate: payload.mealDate,
      mealSlot: payload.mealSlot,
      preparedQuantity: payload.preparedQuantity,
      servedQuantity: payload.servedQuantity,
      wastedQuantity: payload.wastedQuantity,
      unit: payload.unit,
      reason: payload.reason,
      estimatedCostLoss: payload.estimatedCostLoss,
      reportedBy: payload.reportedBy,
      recordedAt: new Date().toISOString()
    };
    this.wasteRecords.unshift(record);
    this.appendAudit('RECORD_FOOD_WASTE', 'WASTE_RECORD', record.id, record.wasteCode, `Food waste logged: ${payload.reason}`, 'KITCHEN_CHEF', payload.reportedBy);
    return record;
  }

  async getCostRecords(_tenantId: string): Promise<DietaryCostRecordDto[]> {
    return [...this.costRecords];
  }

  async getProcurementRefs(_tenantId: string): Promise<DietaryProcurementRefDto[]> {
    return [...this.procurementRefs];
  }

  async createProcurementRef(tenantId: string, payload: CreateDietaryProcurementReferenceRequest): Promise<DietaryProcurementRefDto> {
    const ref: DietaryProcurementRefDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      requisitionRefNumber: `REQ-DIET-${Date.now().toString().slice(-6)}`,
      ingredientName: payload.ingredientName,
      quantityRequested: payload.quantityRequested,
      unit: payload.unit,
      urgency: payload.urgency,
      vendorRef: payload.vendorRef,
      status: 'SUBMITTED_TO_PROCUREMENT',
      requestedBy: payload.requestedBy,
      createdAt: new Date().toISOString()
    };
    this.procurementRefs.unshift(ref);
    this.appendAudit('CREATE_PROCUREMENT_REF', 'PROCUREMENT_REF', ref.id, ref.requisitionRefNumber, 'Ingredient requisition submitted to procurement module');
    return ref;
  }

  async getBillingRefs(_tenantId: string): Promise<DietaryBillingRefDto[]> {
    return [...this.billingRefs];
  }

  async createBillingRef(tenantId: string, payload: CreateDietaryBillingReferenceRequest): Promise<DietaryBillingRefDto> {
    const ref: DietaryBillingRefDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      chargeCode: `CHG-DIET-${Date.now().toString().slice(-6)}`,
      patientId: payload.patientId,
      patientName: payload.patientName,
      patientMrn: payload.patientMrn,
      dietTypeName: payload.dietTypeName,
      chargeCategory: payload.chargeCategory,
      amount: payload.amount,
      billingStatus: 'POSTED_TO_BILLING',
      createdAt: new Date().toISOString()
    };
    this.billingRefs.unshift(ref);
    this.appendAudit('CREATE_BILLING_REF', 'BILLING_REF', ref.id, ref.chargeCode, 'Therapeutic diet charge linked to RCM billing engine');
    return ref;
  }

  async getAuditTraces(_tenantId: string): Promise<DietaryAuditTraceDto[]> {
    return [...this.auditTraces];
  }
}

export const dietaryManagementService: IDietaryManagementService = new DietaryManagementService();
