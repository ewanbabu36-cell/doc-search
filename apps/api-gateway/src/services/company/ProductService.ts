import { productRepository } from '../../repositories/company/ProductRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
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
}

export const productService = new ProductService();
