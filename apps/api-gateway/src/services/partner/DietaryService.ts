import { dietaryRepository, type DietaryEntityData } from '../../repositories/partner/DietaryRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';

export class DietaryService {
  // 1. Overview & Telemetry
  async getOverviewMetrics(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async () => {
      return dietaryRepository.getOverviewMetrics();
    });
  }

  async getAnalytics(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async () => {
      return dietaryRepository.getAnalytics();
    });
  }

  // 2. Kitchens & Diet Types
  async getKitchens(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.getKitchens(session.tenantId, session.branchId, tx);
    });
  }

  async createKitchen(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const kitchen = await dietaryRepository.createKitchen({
        ...data,
        tenantId: session.tenantId,
        branchId: session.branchId || data['branchId']
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'KITCHEN_CREATED',
        resourceType: 'dietary_kitchen',
        resourceId: kitchen.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { kitchenCode: data['kitchenCode'] }
      }, session, tx);

      return kitchen;
    });
  }

  async getDietTypes(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.getDietTypes(session.tenantId, tx);
    });
  }

  async createDietType(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const dietType = await dietaryRepository.createDietType({
        ...data,
        tenantId: session.tenantId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'DIET_TYPE_CREATED',
        resourceType: 'dietary_diet_type',
        resourceId: dietType.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { code: data['code'] }
      }, session, tx);

      return dietType;
    });
  }

  async getFoodItems(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.getFoodItems(session.tenantId, tx);
    });
  }

  async createFoodItem(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.createFoodItem({
        ...data,
        tenantId: session.tenantId
      }, tx);
    });
  }

  // 3. Clinical Assessment & Diet Orders
  async getAssessments(patientId: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.getAssessments(session.tenantId, patientId, tx);
    });
  }

  async createAssessment(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const assessment = await dietaryRepository.createAssessment({
        ...data,
        tenantId: session.tenantId,
        branchId: session.branchId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'ASSESSMENT_CREATED',
        resourceType: 'dietary_assessment',
        resourceId: assessment.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { patientId: data['patientId'] }
      }, session, tx);

      return assessment;
    });
  }

  async finalizeAssessment(id: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const finalized = await dietaryRepository.finalizeAssessment(id, session.userId, tx);

      await auditRepository.recordEvent({
        eventType: 'ASSESSMENT_FINALIZED',
        resourceType: 'dietary_assessment',
        resourceId: id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { finalizedBy: session.userId }
      }, session, tx);

      return finalized;
    });
  }

  async getOrders(patientId: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.getOrders(session.tenantId, patientId, tx);
    });
  }

  async getOrderById(orderId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await dietaryRepository.getOrderById(orderId, tx);
      if (!order) {
        throw AppError.notFound('Diet order not found');
      }
      if (order.tenantId !== session.tenantId && !session.isSuperAdmin) {
        throw AppError.forbidden('Cross-tenant access strictly denied');
      }
      return order;
    });
  }

  async createOrder(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      // Clinical Allergen Safety Check
      const allergies = data['patientAllergies'] as string[] | undefined;
      const containsGluten = data['containsGluten'] as boolean | undefined;
      if (allergies?.includes('GLUTEN') && containsGluten) {
        throw AppError.badRequest('Clinical safety alert: Patient has known GLUTEN allergy');
      }

      const order = await dietaryRepository.createOrder({
        ...data,
        tenantId: session.tenantId,
        branchId: session.branchId,
        orderingPhysicianId: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'DIET_ORDER_CREATED',
        resourceType: 'dietary_order',
        resourceId: order.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { patientId: data['patientId'], dietTypeId: data['dietTypeId'] }
      }, session, tx);

      return order;
    });
  }

  async approveOrder(orderId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const order = await dietaryRepository.getOrderById(orderId, tx);
      if (!order) {
        throw AppError.notFound('Diet order not found');
      }

      const updated = await dietaryRepository.updateOrderStatus(orderId, 'APPROVED', tx);

      await auditRepository.recordEvent({
        eventType: 'DIET_ORDER_APPROVED',
        resourceType: 'dietary_order',
        resourceId: orderId,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { approvedBy: session.userId }
      }, session, tx);

      return updated;
    });
  }

  // 4. Production, Trays & Dispatch
  async createProductionPlan(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.createProductionPlan({
        ...data,
        tenantId: session.tenantId,
        branchId: session.branchId
      }, tx);
    });
  }

  async releaseProductionPlan(id: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const released = await dietaryRepository.releaseProductionPlan(id, session.userId, tx);

      await auditRepository.recordEvent({
        eventType: 'PRODUCTION_RELEASED',
        resourceType: 'dietary_production_plan',
        resourceId: id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { releasedBy: session.userId }
      }, session, tx);

      return released;
    });
  }

  async recordQualityCheck(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const check = await dietaryRepository.recordQualityCheck({
        ...data,
        inspectorId: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: data['result'] === 'PASS' ? 'QUALITY_CHECK_PASSED' : 'QUALITY_CHECK_FAILED',
        resourceType: 'dietary_quality_check',
        resourceId: check.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { result: data['result'], score: data['overallScore'] }
      }, session, tx);

      return check;
    });
  }

  async createTrayAssembly(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      // Quality Gate: If quality check failed, tray assembly is prohibited
      if (data['qualityCheckStatus'] === 'FAIL') {
        throw AppError.badRequest('Cannot assemble tray for meal that failed quality inspection');
      }

      return dietaryRepository.createTrayAssembly({
        ...data,
        tenantId: session.tenantId,
        branchId: session.branchId,
        assembledBy: session.userId
      }, tx);
    });
  }

  async dispatchMeal(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      // NPO Safety Gate: If patient is NPO, meal dispatch is strictly blocked
      if (data['isNpoPatient'] === true) {
        throw AppError.badRequest('Safety Gate: Patient is marked NPO (Nil Per Os). Meal dispatch is prohibited.');
      }

      const dispatch = await dietaryRepository.dispatchMeal({
        ...data,
        tenantId: session.tenantId,
        branchId: session.branchId,
        dispatchedBy: session.userId
      }, tx);

      await auditRepository.recordEvent({
        eventType: 'MEAL_DISPATCHED',
        resourceType: 'dietary_meal_dispatch',
        resourceId: dispatch.id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { trayAssemblyId: data['trayAssemblyId'] }
      }, session, tx);

      return dispatch;
    });
  }

  async confirmMealDelivery(id: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const delivered = await dietaryRepository.updateDispatchStatus(id, 'DELIVERED', new Date(), tx);

      await auditRepository.recordEvent({
        eventType: 'MEAL_DELIVERED',
        resourceType: 'dietary_meal_dispatch',
        resourceId: id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { deliveredAt: new Date().toISOString() }
      }, session, tx);

      return delivered;
    });
  }

  async refuseMeal(id: string, reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const refused = await dietaryRepository.updateDispatchStatus(id, 'REFUSED', undefined, tx);

      await auditRepository.recordEvent({
        eventType: 'MEAL_REFUSED',
        resourceType: 'dietary_meal_dispatch',
        resourceId: id,
        tenantId: session.tenantId,
        branchId: session.branchId,
        metadata: { reason }
      }, session, tx);

      return refused;
    });
  }

  // 5. Procurement & Billing References
  async createBillingReference(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.createBillingReference({
        ...data,
        tenantId: session.tenantId
      }, tx);
    });
  }

  async createProcurementReference(data: DietaryEntityData, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return dietaryRepository.createProcurementReference({
        ...data,
        tenantId: session.tenantId
      }, tx);
    });
  }
}

export const dietaryService = new DietaryService();
