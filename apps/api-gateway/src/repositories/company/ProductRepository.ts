import { eq, desc, and } from '@docsearch/database';
import {
  getDatabase,
  products,
  plans,
  features,
  planEntitlements,
  type Product,
  type NewProduct,
  type Plan
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
