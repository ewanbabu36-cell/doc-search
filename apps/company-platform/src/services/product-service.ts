import type {
  ProductDto,
  ProductStatus,
  ProductCategory,
  PlanDto,
  PlanStatus,
  FeatureDto,
  PlanEntitlementDto,
  PartnerPlanAssignmentDto,
  AssignPlanRequest,
  AssignmentStatus
} from '@docsearch/api-contracts';
import {
  mockProducts,
  mockPlans,
  mockFeatures,
  mockPlanEntitlements,
  mockPartnerAssignments
} from './mock-product-data.js';

export interface ProductFilters {
  search?: string | undefined;
  status?: ProductStatus | 'ALL' | undefined;
  category?: ProductCategory | 'ALL' | undefined;
}

export interface PlanFilters {
  productId?: string | undefined;
  status?: PlanStatus | 'ALL' | undefined;
}

export interface AssignmentFilters {
  partnerId?: string | undefined;
  status?: AssignmentStatus | 'ALL' | undefined;
}

export interface IProductService {
  getProducts(filters?: ProductFilters): Promise<ProductDto[]>;
  getProductById(id: string): Promise<ProductDto | null>;
  getPlans(filters?: PlanFilters): Promise<PlanDto[]>;
  getPlanById(id: string): Promise<PlanDto | null>;
  getPlanEntitlements(planId: string): Promise<PlanEntitlementDto[]>;
  getFeatures(): Promise<FeatureDto[]>;
  getPartnerAssignments(filters?: AssignmentFilters): Promise<PartnerPlanAssignmentDto[]>;
  assignPlanToPartner(
    req: AssignPlanRequest,
    partnerTradeName?: string,
    partnerTenantSlug?: string,
    actorEmail?: string
  ): Promise<PartnerPlanAssignmentDto>;
  updateAssignmentStatus(
    id: string,
    status: AssignmentStatus,
    reason: string
  ): Promise<PartnerPlanAssignmentDto>;
}

export class ProductService implements IProductService {
  private readonly apiUrl?: string | undefined;
  private products: ProductDto[] = [...mockProducts];
  private plans: PlanDto[] = [...mockPlans];
  private features: FeatureDto[] = [...mockFeatures];
  private planEntitlements: Record<string, PlanEntitlementDto[]> = { ...mockPlanEntitlements };
  private assignments: PartnerPlanAssignmentDto[] = [...mockPartnerAssignments];

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl;
  }

  async getProducts(filters?: ProductFilters): Promise<ProductDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.category && filters.category !== 'ALL') params.set('category', filters.category);
      const res = await fetch(`${this.apiUrl}/api/v1/company/products?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
      return (await res.json()) as ProductDto[];
    }

    let result = [...this.products];
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters?.category && filters.category !== 'ALL') {
      result = result.filter((p) => p.category === filters.category);
    }
    return result;
  }

  async getProductById(id: string): Promise<ProductDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/products/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch product: ${res.statusText}`);
      return (await res.json()) as ProductDto;
    }
    const prod = this.products.find((p) => p.id === id);
    return prod ? { ...prod } : null;
  }

  async getPlans(filters?: PlanFilters): Promise<PlanDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.productId) params.set('productId', filters.productId);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      const res = await fetch(`${this.apiUrl}/api/v1/company/plans?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch plans: ${res.statusText}`);
      return (await res.json()) as PlanDto[];
    }

    let result = [...this.plans];
    if (filters?.productId) {
      result = result.filter((p) => p.productId === filters.productId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((p) => p.status === filters.status);
    }
    return result;
  }

  async getPlanById(id: string): Promise<PlanDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/plans/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch plan: ${res.statusText}`);
      return (await res.json()) as PlanDto;
    }
    const plan = this.plans.find((p) => p.id === id);
    return plan ? { ...plan } : null;
  }

  async getPlanEntitlements(planId: string): Promise<PlanEntitlementDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/plans/${planId}/entitlements`);
      if (!res.ok) throw new Error(`Failed to fetch entitlements: ${res.statusText}`);
      return (await res.json()) as PlanEntitlementDto[];
    }
    const items = this.planEntitlements[planId];
    return items ? [...items] : [];
  }

  async getFeatures(): Promise<FeatureDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/features`);
      if (!res.ok) throw new Error(`Failed to fetch features: ${res.statusText}`);
      return (await res.json()) as FeatureDto[];
    }
    return [...this.features];
  }

  async getPartnerAssignments(filters?: AssignmentFilters): Promise<PartnerPlanAssignmentDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.partnerId) params.set('partnerId', filters.partnerId);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      const res = await fetch(`${this.apiUrl}/api/v1/company/partner-assignments?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch assignments: ${res.statusText}`);
      return (await res.json()) as PartnerPlanAssignmentDto[];
    }

    let result = [...this.assignments];
    if (filters?.partnerId) {
      result = result.filter((a) => a.partnerId === filters.partnerId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((a) => a.assignmentStatus === filters.status);
    }
    return result;
  }

  async assignPlanToPartner(
    req: AssignPlanRequest,
    partnerTradeName = 'Sample Healthcare Partner',
    partnerTenantSlug = 'partner-scope',
    actorEmail = 'executive.lead@docsearch.internal'
  ): Promise<PartnerPlanAssignmentDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/partner-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to assign plan: ${res.statusText}`);
      return (await res.json()) as PartnerPlanAssignmentDto;
    }

    const prod = this.products.find((p) => p.id === req.productId);
    const plan = this.plans.find((p) => p.id === req.planId);
    if (!prod || !plan) {
      throw new Error('Specified Product or Plan does not exist.');
    }

    // Check if assignment already exists for this partner + product
    const existingIdx = this.assignments.findIndex(
      (a) => a.partnerId === req.partnerId && a.productId === req.productId
    );

    const now = new Date().toISOString();
    const newAssignment: PartnerPlanAssignmentDto = {
      id: `assign-${Date.now()}`,
      partnerId: req.partnerId,
      partnerTradeName,
      partnerTenantSlug,
      productId: req.productId,
      productName: prod.name,
      planId: req.planId,
      planName: plan.name,
      planVersion: plan.version,
      assignmentStatus: 'ACTIVE',
      effectiveDate: req.effectiveDate ?? now,
      expirationDate: req.expirationDate,
      assignedByEmail: actorEmail,
      metadata: { reason: req.reason },
      createdAt: now,
      updatedAt: now
    };

    if (existingIdx >= 0) {
      this.assignments[existingIdx] = newAssignment;
    } else {
      this.assignments.unshift(newAssignment);
    }

    return { ...newAssignment };
  }

  async updateAssignmentStatus(
    id: string,
    status: AssignmentStatus,
    _reason: string
  ): Promise<PartnerPlanAssignmentDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/partner-assignments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: _reason })
      });
      if (!res.ok) throw new Error(`Failed to update assignment status: ${res.statusText}`);
      return (await res.json()) as PartnerPlanAssignmentDto;
    }

    const idx = this.assignments.findIndex((a) => a.id === id);
    const current = this.assignments[idx];
    if (idx === -1 || !current) {
      throw new Error(`Assignment ${id} not found`);
    }

    const updated: PartnerPlanAssignmentDto = {
      ...current,
      assignmentStatus: status,
      updatedAt: new Date().toISOString()
    };

    this.assignments[idx] = updated;
    return { ...updated };
  }
}

export const productService = new ProductService();
