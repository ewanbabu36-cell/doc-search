import { z } from 'zod';

export const ProductStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductCategorySchema = z.enum([
  'CORE_PLATFORM',
  'CLINICAL_SUITE',
  'AI_GOVERNANCE',
  'INTEROPERABILITY_HUB',
  'ANALYTICS_BI'
]);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const PlanStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED']);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const FeatureStatusSchema = z.enum(['ACTIVE', 'DEPRECATED']);
export type FeatureStatus = z.infer<typeof FeatureStatusSchema>;

export const FeatureCategorySchema = z.enum([
  'MODULE_ACCESS',
  'DATA_SCOPE',
  'AI_CAPABILITY',
  'INTEGRATION',
  'SECURITY_GOVERNANCE'
]);
export type FeatureCategory = z.infer<typeof FeatureCategorySchema>;

export const EntitlementTypeSchema = z.enum([
  'FEATURE_ACCESS',
  'LIMIT',
  'QUOTA',
  'CAPABILITY',
  'MODULE_ACCESS'
]);
export type EntitlementType = z.infer<typeof EntitlementTypeSchema>;

export const AssignmentStatusSchema = z.enum([
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'CANCELLED'
]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

// DTO Schemas
export const ProductDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  category: ProductCategorySchema,
  status: ProductStatusSchema,
  version: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ProductDto = z.infer<typeof ProductDtoSchema>;

export const PlanDtoSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string().optional(),
  productCode: z.string().optional(),
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  status: PlanStatusSchema,
  version: z.string(),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  entitlementCount: z.number().int().nonnegative().default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PlanDto = z.infer<typeof PlanDtoSchema>;

export const FeatureDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string(),
  category: FeatureCategorySchema,
  status: FeatureStatusSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type FeatureDto = z.infer<typeof FeatureDtoSchema>;

export const PlanEntitlementDtoSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  featureId: z.string().uuid(),
  featureCode: z.string(),
  featureName: z.string(),
  featureCategory: FeatureCategorySchema,
  entitlementType: EntitlementTypeSchema,
  value: z.union([z.boolean(), z.number(), z.string(), z.record(z.unknown())]),
  displayValue: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type PlanEntitlementDto = z.infer<typeof PlanEntitlementDtoSchema>;

export const PartnerPlanAssignmentDtoSchema = z.object({
  id: z.string().uuid(),
  partnerId: z.string().uuid(),
  partnerTradeName: z.string(),
  partnerTenantSlug: z.string(),
  productId: z.string().uuid(),
  productName: z.string(),
  planId: z.string().uuid(),
  planName: z.string(),
  planVersion: z.string(),
  assignmentStatus: AssignmentStatusSchema,
  effectiveDate: z.string().datetime(),
  expirationDate: z.string().datetime().optional(),
  assignedByEmail: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PartnerPlanAssignmentDto = z.infer<typeof PartnerPlanAssignmentDtoSchema>;

export const AssignPlanRequestSchema = z.object({
  partnerId: z.string().uuid(),
  productId: z.string().uuid(),
  planId: z.string().uuid(),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  reason: z.string().min(3)
});
export type AssignPlanRequest = z.infer<typeof AssignPlanRequestSchema>;
