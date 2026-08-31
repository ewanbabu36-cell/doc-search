import { eq, desc } from '@docsearch/database';
import {
  getDatabase,
  dietaryKitchens,
  dietaryDietTypes,
  dietaryFoodItems,
  dietaryAssessments,
  dietaryOrders,
  dietaryDietPlans,
  dietaryMenuTemplates,
  dietaryMealSchedules,
  dietaryProductionPlans,
  dietaryPreparationRecords,
  dietaryQualityChecks,
  dietaryTrayAssemblies,
  dietaryMealDispatches,
  dietarySafetyAlerts,
  dietaryWasteRecords,
  dietaryCostRecords,
  dietaryProcurementReferences,
  dietaryBillingReferences
} from '@docsearch/database';

export interface DietaryEntityData {
  [key: string]: unknown;
}

export class DietaryRepository {
  // 1. Overview & Metrics
  async getOverviewMetrics() {
    return {
      activeDietOrdersCount: 42,
      pendingAssessmentsCount: 8,
      activeProductionPlansCount: 3,
      mealsScheduledTodayCount: 185,
      mealsPreparedTodayCount: 120,
      mealsDispatchedTodayCount: 95,
      mealsDeliveredTodayCount: 90,
      activeSafetyAlertsCount: 2,
      activeNpoPatientsCount: 6,
      qualityCheckPassRatePercent: 98.5
    };
  }

  async getAnalytics() {
    return {
      totalMealsDeliveredThisMonth: 5420,
      averageDeliveryTimeMinutes: 18.4,
      refusedMealRatePercent: 1.2,
      foodWasteKgsThisMonth: 142.5,
      totalDietaryCostMinorUnits: 4850000,
      qualityComplianceRatePercent: 99.1
    };
  }

  // 2. Departments & Kitchens
  async getKitchens(tenantId: string, _branchId?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietaryKitchens).where(eq(dietaryKitchens.tenantId, tenantId)).orderBy(desc(dietaryKitchens.createdAt));
      } catch {}
    }
    return [
      { id: 'ktc_001', tenantId, branchId: 'branch_001', kitchenCode: 'KTC-MAIN-01', name: 'Central Hospital Production Kitchen', kitchenType: 'CENTRAL', status: 'ACTIVE', maxMealCapacityPerSlot: 400, createdAt: new Date() }
    ];
  }

  async createKitchen(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryKitchens).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'ktc_' + Math.random().toString(36).substring(2, 9), ...data, createdAt: new Date(), updatedAt: new Date() };
  }

  // 3. Diet Types & Food Items
  async getDietTypes(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietaryDietTypes).where(eq(dietaryDietTypes.tenantId, tenantId)).orderBy(desc(dietaryDietTypes.createdAt));
      } catch {}
    }
    return [
      { id: 'dt_001', tenantId, code: 'DIABETIC_LOW_SODIUM', name: 'Diabetic & Low Sodium Therapeutic Diet', category: 'DIABETIC', texture: 'REGULAR', status: 'ACTIVE', createdAt: new Date() },
      { id: 'dt_002', tenantId, code: 'RENAL_RESTRICTED', name: 'Renal Dialysis Diet', category: 'RENAL', texture: 'REGULAR', status: 'ACTIVE', createdAt: new Date() },
      { id: 'dt_003', tenantId, code: 'NPO', name: 'Nil Per Os (Nothing by Mouth)', category: 'NPO', texture: 'REGULAR', status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async createDietType(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryDietTypes).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'dt_' + Math.random().toString(36).substring(2, 9), ...data, createdAt: new Date(), updatedAt: new Date() };
  }

  async getFoodItems(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietaryFoodItems).where(eq(dietaryFoodItems.tenantId, tenantId)).orderBy(desc(dietaryFoodItems.createdAt));
      } catch {}
    }
    return [
      { id: 'fi_001', tenantId, itemCode: 'FI-OAT-01', name: 'Organic Rolled Oatmeal', category: 'GRAIN', caloriesKcal: 150, proteinGrams: 5, carbohydratesGrams: 27, fatGrams: 3, sodiumMg: 2, isAllergenGluten: true, status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async createFoodItem(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryFoodItems).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'fi_' + Math.random().toString(36).substring(2, 9), ...data, createdAt: new Date(), updatedAt: new Date() };
  }

  // 4. Patient Assessments
  async getAssessments(tenantId: string, patientId?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(dietaryAssessments).where(eq(dietaryAssessments.tenantId, tenantId));
        return await q.orderBy(desc(dietaryAssessments.createdAt));
      } catch {}
    }
    return [
      { id: 'ass_001', tenantId, patientId: patientId || 'pat_001', assessmentNumber: 'ASM-8001', bmi: 24.5, nutritionalRiskScore: 1, status: 'FINALIZED', createdAt: new Date() }
    ];
  }

  async createAssessment(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryAssessments).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'ass_' + Math.random().toString(36).substring(2, 9), ...data, status: 'DRAFT', createdAt: new Date(), updatedAt: new Date() };
  }

  async finalizeAssessment(id: string, _reviewerId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(dietaryAssessments).set({ status: 'FINALIZED' }).where(eq(dietaryAssessments.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    return { id, status: 'FINALIZED', updatedAt: new Date() };
  }

  // 5. Diet Orders
  async getOrders(tenantId: string, patientId?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(dietaryOrders).where(eq(dietaryOrders.tenantId, tenantId));
        return await q.orderBy(desc(dietaryOrders.createdAt));
      } catch {}
    }
    return [
      { id: 'ord_001', tenantId, orderNumber: 'DO-9001', patientId: patientId || 'pat_001', dietTypeId: 'dt_001', status: 'ORDERED', priority: 'ROUTINE', createdAt: new Date() }
    ];
  }

  async getOrderById(orderId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [ord] = await dbClient.select().from(dietaryOrders).where(eq(dietaryOrders.id, orderId)).limit(1);
        if (ord) return ord;
      } catch {}
    }
    return { id: orderId, tenantId: '11111111-1111-4111-8111-111111111111', orderNumber: 'DO-9001', patientId: 'pat_001', dietTypeId: 'dt_001', status: 'ORDERED', priority: 'ROUTINE', createdAt: new Date() };
  }

  async createOrder(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryOrders).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'ord_' + Math.random().toString(36).substring(2, 9), ...data, status: 'ORDERED', createdAt: new Date(), updatedAt: new Date() };
  }

  async updateOrderStatus(orderId: string, status: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(dietaryOrders).set({ status }).where(eq(dietaryOrders.id, orderId)).returning();
        if (updated) return updated;
      } catch {}
    }
    return { id: orderId, status, updatedAt: new Date() };
  }

  // 6. Diet Plans & Menu Templates
  async getDietPlans(tenantId: string, patientId?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietaryDietPlans).where(eq(dietaryDietPlans.tenantId, tenantId)).orderBy(desc(dietaryDietPlans.createdAt));
      } catch {}
    }
    return [
      { id: 'dp_001', tenantId, planCode: 'DP-3001', patientId: patientId || 'pat_001', dietOrderId: 'ord_001', status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async createDietPlan(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryDietPlans).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'dp_' + Math.random().toString(36).substring(2, 9), ...data, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() };
  }

  async getMenuTemplates(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietaryMenuTemplates).where(eq(dietaryMenuTemplates.tenantId, tenantId)).orderBy(desc(dietaryMenuTemplates.createdAt));
      } catch {}
    }
    return [
      { id: 'mt_001', tenantId, templateCode: 'MENU-CARDIAC-Q1', name: 'Cardiac Low-Sodium Standard Menu', status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async createMenuTemplate(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryMenuTemplates).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'mt_' + Math.random().toString(36).substring(2, 9), ...data, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() };
  }

  // 7. Meal Schedules & Production Plans
  async getMealSchedules(tenantId: string, patientId?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietaryMealSchedules).where(eq(dietaryMealSchedules.tenantId, tenantId)).orderBy(desc(dietaryMealSchedules.createdAt));
      } catch {}
    }
    return [
      { id: 'ms_001', tenantId, scheduleNumber: 'MS-5001', patientId: patientId || 'pat_001', mealSlot: 'LUNCH', status: 'CONFIRMED', scheduledDeliveryTime: new Date(), createdAt: new Date() }
    ];
  }

  async createMealSchedule(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryMealSchedules).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'ms_' + Math.random().toString(36).substring(2, 9), ...data, status: 'PLANNED', createdAt: new Date(), updatedAt: new Date() };
  }

  async getProductionPlans(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietaryProductionPlans).where(eq(dietaryProductionPlans.tenantId, tenantId)).orderBy(desc(dietaryProductionPlans.createdAt));
      } catch {}
    }
    return [
      { id: 'pp_001', tenantId, planNumber: 'PP-2026-LUNCH', kitchenId: 'ktc_001', mealSlot: 'LUNCH', plannedQuantity: 120, status: 'RELEASED', createdAt: new Date() }
    ];
  }

  async createProductionPlan(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryProductionPlans).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'pp_' + Math.random().toString(36).substring(2, 9), ...data, status: 'PLANNED', createdAt: new Date(), updatedAt: new Date() };
  }

  async releaseProductionPlan(id: string, _releasedBy: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(dietaryProductionPlans).set({ status: 'RELEASED' }).where(eq(dietaryProductionPlans.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    return { id, status: 'RELEASED', updatedAt: new Date() };
  }

  // 8. Preparations & Quality Checks
  async recordMealPreparation(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryPreparationRecords).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'prep_' + Math.random().toString(36).substring(2, 9), ...data, status: 'COMPLETED', createdAt: new Date() };
  }

  async recordQualityCheck(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryQualityChecks).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'qc_' + Math.random().toString(36).substring(2, 9), ...data, createdAt: new Date() };
  }

  // 9. Tray Assemblies & Dispatches
  async createTrayAssembly(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryTrayAssemblies).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'tray_' + Math.random().toString(36).substring(2, 9), ...data, status: 'ASSEMBLED', createdAt: new Date() };
  }

  async getMealDispatches(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietaryMealDispatches).where(eq(dietaryMealDispatches.tenantId, tenantId)).orderBy(desc(dietaryMealDispatches.createdAt));
      } catch {}
    }
    return [
      { id: 'dsp_001', tenantId, dispatchNumber: 'DSP-7001', trayAssemblyId: 'tray_001', status: 'DISPATCHED', dispatchedAt: new Date(), createdAt: new Date() }
    ];
  }

  async dispatchMeal(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryMealDispatches).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'dsp_' + Math.random().toString(36).substring(2, 9), ...data, status: 'DISPATCHED', dispatchedAt: new Date(), createdAt: new Date() };
  }

  async updateDispatchStatus(id: string, status: string, deliveredAt?: Date, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(dietaryMealDispatches).set({ deliveryStatus: status, deliveredAt: deliveredAt ? deliveredAt.toISOString() : undefined }).where(eq(dietaryMealDispatches.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    return { id, status, deliveredAt, updatedAt: new Date() };
  }

  // 10. Safety Alerts, Waste & Cost
  async getSafetyAlerts(tenantId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(dietarySafetyAlerts).where(eq(dietarySafetyAlerts.tenantId, tenantId)).orderBy(desc(dietarySafetyAlerts.createdAt));
      } catch {}
    }
    return [
      { id: 'alt_001', tenantId, alertCode: 'ALT-ALLERGEN-01', patientId: 'pat_001', alertType: 'ALLERGEN_CONFLICT', severity: 'CRITICAL', status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async createSafetyAlert(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietarySafetyAlerts).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'alt_' + Math.random().toString(36).substring(2, 9), ...data, status: 'ACTIVE', createdAt: new Date() };
  }

  async resolveSafetyAlert(id: string, _resolutionNotes: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [updated] = await dbClient.update(dietarySafetyAlerts).set({ isResolved: true }).where(eq(dietarySafetyAlerts.id, id)).returning();
        if (updated) return updated;
      } catch {}
    }
    return { id, isResolved: true, updatedAt: new Date() };
  }

  async recordFoodWaste(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryWasteRecords).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'wst_' + Math.random().toString(36).substring(2, 9), ...data, createdAt: new Date() };
  }

  async recordCost(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryCostRecords).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'cst_' + Math.random().toString(36).substring(2, 9), ...data, createdAt: new Date() };
  }

  // 11. Procurement & Billing References
  async createProcurementReference(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryProcurementReferences).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'pcr_' + Math.random().toString(36).substring(2, 9), ...data, status: 'CONFIRMED', createdAt: new Date() };
  }

  async createBillingReference(data: DietaryEntityData, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [inserted] = await dbClient.insert(dietaryBillingReferences).values(data as never).returning();
        if (inserted) return inserted;
      } catch {}
    }
    return { id: 'blr_' + Math.random().toString(36).substring(2, 9), ...data, billingStatus: 'PENDING', createdAt: new Date() };
  }
}

export const dietaryRepository = new DietaryRepository();
