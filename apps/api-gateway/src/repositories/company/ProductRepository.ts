import { eq, desc, and, or } from '@docsearch/database';
import {
  getDatabase,
  products,
  plans,
  features,
  planEntitlements,
  type Product,
  type NewProduct,
  type Plan,
  type NewPlan,
  type Feature,
  type NewFeature,
  type PlanEntitlement
} from '@docsearch/database';

const memoryProducts: Product[] = [];

export class ProductRepository {
  async findMany(dbClient = getDatabase()): Promise<Product[]> {
    if (dbClient) {
      try {
        return await dbClient.select().from(products).orderBy(desc(products.createdAt));
      } catch {
        // Fallback
      }
    }
    return [...memoryProducts];
  }

  async findById(productId: string, dbClient = getDatabase()): Promise<Product | null> {
    if (dbClient) {
      try {
        const [prod] = await dbClient.select().from(products).where(eq(products.id, productId)).limit(1);
        if (prod) return prod;
      } catch {
        // Fallback
      }
    }
    return memoryProducts.find((p) => p.id === productId) || null;
  }

  async create(data: NewProduct, dbClient = getDatabase()): Promise<Product> {
    if (dbClient) {
      try {
        const [created] = await dbClient.insert(products).values(data).returning();
        if (created) return created;
      } catch {
        // Fallback
      }
    }

    const created: Product = {
      id: crypto.randomUUID(),
      code: data.code,
      name: data.name,
      description: data.description || '',
      category: data.category ?? 'CORE_PLATFORM',
      status: data.status ?? 'ACTIVE',
      version: data.version ?? '1.0.0',
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryProducts.push(created);
    return created;
  }

  async findAllPlans(dbClient = getDatabase()): Promise<Plan[]> {
    if (dbClient) {
      try {
        return await dbClient.select().from(plans).orderBy(desc(plans.createdAt));
      } catch {}
    }
    return [];
  }

  async findPlanById(planId: string, dbClient = getDatabase()): Promise<Plan | null> {
    if (dbClient) {
      try {
        const [plan] = await dbClient.select().from(plans).where(eq(plans.id, planId)).limit(1);
        if (plan) return plan;
      } catch {}
    }
    return null;
  }

  async findPlanByCode(planCode: string, dbClient = getDatabase()): Promise<Plan | null> {
    if (dbClient) {
      try {
        const [plan] = await dbClient.select().from(plans).where(eq(plans.code, planCode)).limit(1);
        if (plan) return plan;
      } catch {}
    }
    return null;
  }

  async createPlan(data: any, dbClient = getDatabase()): Promise<Plan> {
    if (dbClient) {
      const [created] = await dbClient.insert(plans).values(data).returning();
      if (created) return created;
    }
    throw new Error('Failed to create plan or database client missing');
  }

  async updatePlan(planId: string, updates: Partial<NewPlan>, dbClient = getDatabase()): Promise<Plan> {
    if (dbClient) {
      const [updated] = await dbClient
        .update(plans)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(plans.id, planId))
        .returning();
      if (updated) return updated;
    }
    throw new Error(`Failed to update plan ${planId}`);
  }

  async updatePlanStatus(planId: string, status: string, dbClient = getDatabase()): Promise<Plan> {
    return this.updatePlan(planId, { status }, dbClient);
  }

  async findAllFeatures(dbClient = getDatabase()): Promise<Feature[]> {
    if (dbClient) {
      try {
        return await dbClient.select().from(features).orderBy(features.name);
      } catch {}
    }
    return [];
  }

  async findFeatureById(featureId: string, dbClient = getDatabase()): Promise<Feature | null> {
    if (dbClient) {
      try {
        const [feature] = await dbClient.select().from(features).where(eq(features.id, featureId)).limit(1);
        if (feature) return feature;
      } catch {}
    }
    return null;
  }

  async findFeatureByCode(code: string, dbClient = getDatabase()): Promise<Feature | null> {
    if (dbClient) {
      try {
        const [feature] = await dbClient.select().from(features).where(eq(features.code, code)).limit(1);
        if (feature) return feature;
      } catch {}
    }
    return null;
  }

  async createFeature(data: NewFeature, dbClient = getDatabase()): Promise<Feature> {
    if (dbClient) {
      const [created] = await dbClient.insert(features).values(data).returning();
      if (created) return created;
    }
    throw new Error('Failed to create feature or database client missing');
  }

  async addPlanEntitlement(
    planId: string,
    featureId: string,
    value: any = { enabled: true },
    entitlementType = 'FEATURE_ACCESS',
    dbClient = getDatabase()
  ): Promise<PlanEntitlement> {
    if (dbClient) {
      const [entitlement] = await dbClient
        .insert(planEntitlements)
        .values({
          planId,
          featureId,
          value,
          entitlementType,
          status: 'ACTIVE'
        })
        .onConflictDoUpdate({
          target: [planEntitlements.planId, planEntitlements.featureId],
          set: {
            value,
            entitlementType,
            status: 'ACTIVE'
          }
        })
        .returning();
      if (entitlement) return entitlement;
    }
    throw new Error(`Failed to add entitlement for plan ${planId} and feature ${featureId}`);
  }

  async removePlanEntitlement(
    planId: string,
    featureId: string,
    dbClient = getDatabase()
  ): Promise<boolean> {
    if (dbClient) {
      const result = await dbClient
        .delete(planEntitlements)
        .where(
          or(
            and(eq(planEntitlements.planId, planId), eq(planEntitlements.featureId, featureId)),
            and(eq(planEntitlements.planId, planId), eq(planEntitlements.id, featureId))
          )
        )
        .returning();
      return result.length > 0;
    }
    return false;
  }

  async getPlanEntitlementsWithFeature(
    planId: string,
    dbClient = getDatabase()
  ): Promise<Array<{ id: string; featureId: string; code: string; name: string; category: string; value: any; status: string; entitlementType: string }>> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select({
            id: planEntitlements.id,
            featureId: planEntitlements.featureId,
            code: features.code,
            name: features.name,
            category: features.category,
            value: planEntitlements.value,
            status: planEntitlements.status,
            entitlementType: planEntitlements.entitlementType
          })
          .from(planEntitlements)
          .innerJoin(features, eq(planEntitlements.featureId, features.id))
          .where(eq(planEntitlements.planId, planId));

        return rows;
      } catch {}
    }
    return [];
  }

  async getPlanEntitlements(
    planId: string,
    dbClient = getDatabase()
  ): Promise<Array<{ code: string; name: string; category: string; value: any; entitlementType: string }>> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select({
            code: features.code,
            name: features.name,
            category: features.category,
            value: planEntitlements.value,
            entitlementType: planEntitlements.entitlementType
          })
          .from(planEntitlements)
          .innerJoin(features, eq(planEntitlements.featureId, features.id))
          .where(and(eq(planEntitlements.planId, planId), eq(planEntitlements.status, 'ACTIVE')));

        return rows;
      } catch {}
    }
    return [];
  }
}

export const productRepository = new ProductRepository();
