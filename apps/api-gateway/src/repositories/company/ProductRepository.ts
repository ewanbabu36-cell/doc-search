import { eq, desc } from '@docsearch/database';
import { getDatabase, products, type Product, type NewProduct } from '@docsearch/database';

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
}

export const productRepository = new ProductRepository();
