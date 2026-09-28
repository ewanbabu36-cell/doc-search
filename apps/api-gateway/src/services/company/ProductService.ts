import { productRepository } from '../../repositories/company/ProductRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { entitlementService } from './EntitlementService.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase, type Product, type NewProduct } from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';

export class ProductService {
  async getProducts(session: SessionContext): Promise<Product[]> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return productRepository.findMany(tx);
    });
  }

  async getProductById(productId: string, session: SessionContext): Promise<Product> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const product = await productRepository.findById(productId, tx);
      if (!product) {
        throw AppError.notFound(`Product ${productId} not found`);
      }
      return product;
    });
  }

  async createProduct(data: Omit<NewProduct, 'id' | 'createdAt' | 'updatedAt'>, session: SessionContext): Promise<Product> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const created = await productRepository.create(data as NewProduct, tx);

      await auditRepository.recordEvent({
        eventType: 'PRODUCT_CREATED',
        resourceType: 'PRODUCT',
        resourceId: created.id,
        metadata: {
          code: created.code,
          name: created.name,
          category: created.category
        }
      }, session, tx);

      return created;
    });
  }

  async getPlans(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return productRepository.findAllPlans(tx);
    });
  }

  async getPlanById(planId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const plan = await productRepository.findPlanById(planId, tx);
      if (!plan) {
        throw AppError.notFound(`Plan ${planId} not found`);
      }
      return plan;
    });
  }

  async createPlan(data: any, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const created = await productRepository.createPlan(data, tx);
      await auditRepository.recordEvent(
        {
          eventType: 'PLAN_CREATED',
          resourceType: 'PLAN',
          resourceId: created.id,
          metadata: {
            code: created.code,
            name: created.name
          }
        },
        session,
        tx
      );
      return created;
    });
  }

  async updatePlan(planId: string, updates: any, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existing = await productRepository.findPlanById(planId, tx);
      if (!existing) {
        throw AppError.notFound(`Plan ${planId} not found`);
      }

      const updated = await productRepository.updatePlan(planId, updates, tx);
      entitlementService.invalidateTenantCache();

      await auditRepository.recordEvent(
        {
          eventType: 'PLAN_UPDATED',
          resourceType: 'PLAN',
          resourceId: planId,
          metadata: {
            previous: existing,
            updates
          }
        },
        session,
        tx
      );
      return updated;
    });
  }

  async updatePlanStatus(planId: string, status: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existing = await productRepository.findPlanById(planId, tx);
      if (!existing) {
        throw AppError.notFound(`Plan ${planId} not found`);
      }

      const updated = await productRepository.updatePlanStatus(planId, status, tx);
      entitlementService.invalidateTenantCache();

      await auditRepository.recordEvent(
        {
          eventType: 'PLAN_STATUS_CHANGED',
          resourceType: 'PLAN',
          resourceId: planId,
          metadata: {
            previousStatus: existing.status,
            newStatus: status
          }
        },
        session,
        tx
      );
      return updated;
    });
  }

  async deletePlan(planId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existing = await productRepository.findPlanById(planId, tx);
      if (!existing) {
        throw AppError.notFound(`Plan ${planId} not found`);
      }

      // Soft delete: transition status to ARCHIVED and invalidate caches
      const updated = await productRepository.updatePlanStatus(planId, 'ARCHIVED', tx);
      entitlementService.invalidateTenantCache();

      await auditRepository.recordEvent(
        {
          eventType: 'PLAN_ARCHIVED',
          resourceType: 'PLAN',
          resourceId: planId,
          metadata: {
            archivedAt: new Date().toISOString()
          }
        },
        session,
        tx
      );
      return updated;
    });
  }

  async getPlanEntitlements(planId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return productRepository.getPlanEntitlementsWithFeature(planId, tx);
    });
  }

  async attachPlanEntitlement(
    planId: string,
    featureId: string,
    value: any = { enabled: true },
    entitlementType = 'FEATURE_ACCESS',
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const plan = await productRepository.findPlanById(planId, tx);
      if (!plan) {
        throw AppError.notFound(`Plan ${planId} not found`);
      }
      const feature = await productRepository.findFeatureById(featureId, tx);
      if (!feature) {
        throw AppError.notFound(`Feature ${featureId} not found`);
      }

      const entitlement = await productRepository.addPlanEntitlement(
        planId,
        featureId,
        value,
        entitlementType,
        tx
      );
      entitlementService.invalidateTenantCache();

      await auditRepository.recordEvent(
        {
          eventType: 'PLAN_ENTITLEMENT_ATTACHED',
          resourceType: 'PLAN',
          resourceId: planId,
          metadata: {
            featureId,
            featureCode: feature.code,
            featureName: feature.name,
            entitlementType,
            value
          }
        },
        session,
        tx
      );
      return entitlement;
    });
  }

  async removePlanEntitlement(planId: string, featureId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const removed = await productRepository.removePlanEntitlement(planId, featureId, tx);
      entitlementService.invalidateTenantCache();

      await auditRepository.recordEvent(
        {
          eventType: 'PLAN_ENTITLEMENT_REMOVED',
          resourceType: 'PLAN',
          resourceId: planId,
          metadata: {
            featureId
          }
        },
        session,
        tx
      );
      return { success: removed };
    });
  }

  async getFeatures(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return productRepository.findAllFeatures(tx);
    });
  }

  async createFeature(data: any, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existing = await productRepository.findFeatureByCode(data.code, tx);
      if (existing) {
        throw AppError.badRequest(`Feature with code '${data.code}' already exists.`);
      }

      const created = await productRepository.createFeature(data, tx);
      await auditRepository.recordEvent(
        {
          eventType: 'FEATURE_CREATED',
          resourceType: 'FEATURE',
          resourceId: created.id,
          metadata: {
            code: created.code,
            name: created.name,
            category: created.category
          }
        },
        session,
        tx
      );
      return created;
    });
  }
}

export const productService = new ProductService();

