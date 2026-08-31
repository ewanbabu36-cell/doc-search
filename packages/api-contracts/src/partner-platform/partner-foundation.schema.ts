import { z } from 'zod';

/**
 * Phase 2.1 Enums: Partner & Organization Foundation
 */

export const OperationalPartnerTypeEnum = z.enum([
  'CLINIC_NETWORK',
  'HOSPITAL_SYSTEM',
  'INTEGRATED_HEALTHCARE',
  'ENTERPRISE'
]);
export type OperationalPartnerType = z.infer<typeof OperationalPartnerTypeEnum>;

export const OperationalPartnerLifecycleStatusEnum = z.enum([
  'ONBOARDING',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
  'TERMINATED'
]);
export type OperationalPartnerLifecycleStatus = z.infer<typeof OperationalPartnerLifecycleStatusEnum>;

export const OrganizationTypeEnum = z.enum(['CLINIC', 'HOSPITAL']);
export type OrganizationType = z.infer<typeof OrganizationTypeEnum>;

export const OrganizationStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']);
export type OrganizationStatus = z.infer<typeof OrganizationStatusEnum>;

export const FacilityTypeEnum = z.enum([
  'OUTPATIENT_CLINIC',
  'INPATIENT_HOSPITAL',
  'DIAGNOSTIC_CENTER',
  'SPECIALTY_CENTER',
  'AMBULATORY_SURGERY'
]);
export type FacilityType = z.infer<typeof FacilityTypeEnum>;

export const FacilityOperationalStatusEnum = z.enum([
  'ACTIVE',
  'COMMISSIONING',
  'MAINTENANCE',
  'CLOSED'
]);
export type FacilityOperationalStatus = z.infer<typeof FacilityOperationalStatusEnum>;

export const OperationalEntitlementStatusEnum = z.enum([
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'EXPIRED'
]);
export type OperationalEntitlementStatus = z.infer<typeof OperationalEntitlementStatusEnum>;

export const OperationalAuditOperationStatusEnum = z.enum(['SUCCESS', 'FAILURE', 'DENIED']);
export type OperationalAuditOperationStatus = z.infer<typeof OperationalAuditOperationStatusEnum>;

/**
 * Phase 2.1 DTOs
 */

export const OperationalPartnerDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerCode: z.string().min(1),
  legalBusinessName: z.string().min(1),
  partnerType: OperationalPartnerTypeEnum,
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  status: OperationalPartnerLifecycleStatusEnum,
  onboardingMetadata: z.record(z.unknown()).default({}),
  contractReference: z.string().optional(),
  subscriptionReference: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperationalPartnerDto = z.infer<typeof OperationalPartnerDtoSchema>;

export const OperationalOrganizationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  partnerName: z.string().optional(),
  organizationCode: z.string().min(1),
  organizationName: z.string().min(1),
  organizationType: OrganizationTypeEnum,
  legalEntityReference: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  status: OrganizationStatusEnum,
  facilityCount: z.number().int().nonnegative().default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperationalOrganizationDto = z.infer<typeof OperationalOrganizationDtoSchema>;

export const OperationalFacilityDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  facilityCode: z.string().min(1),
  facilityName: z.string().min(1),
  facilityType: FacilityTypeEnum,
  addressStreet: z.string().min(1),
  addressCity: z.string().min(1),
  addressState: z.string().min(1),
  addressPostalCode: z.string().min(1),
  addressCountry: z.string().min(1).default('US'),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  status: FacilityOperationalStatusEnum,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperationalFacilityDto = z.infer<typeof OperationalFacilityDtoSchema>;

export const OperationalSubscriptionDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  planReference: z.string().min(1),
  enabledModules: z.array(z.string()).default([]),
  entitlementStatus: OperationalEntitlementStatusEnum,
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperationalSubscriptionDto = z.infer<typeof OperationalSubscriptionDtoSchema>;

export const OperationalAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  action: z.string().min(1),
  targetEntity: z.string().min(1),
  targetEntityId: z.string().min(1),
  justification: z.string().min(1),
  operationStatus: OperationalAuditOperationStatusEnum,
  correlationId: z.string().min(1),
  metadata: z.record(z.unknown()).default({}),
  occurredAt: z.string().datetime()
});
export type OperationalAuditTraceDto = z.infer<typeof OperationalAuditTraceDtoSchema>;

export const PanelContextDtoSchema = z.object({
  activeTenantId: z.string().uuid(),
  activeTenantName: z.string(),
  activePartnerId: z.string().uuid(),
  activePartnerName: z.string(),
  activeOrganizationId: z.string().uuid().optional(),
  activeOrganizationName: z.string().optional(),
  activeFacilityId: z.string().uuid().optional(),
  activeFacilityName: z.string().optional(),
  userRole: z.string(),
  userEmail: z.string().email()
});
export type PanelContextDto = z.infer<typeof PanelContextDtoSchema>;

export const PartnerFoundationOverviewDtoSchema = z.object({
  totalPartnersCount: z.number().int().nonnegative(),
  activePartnersCount: z.number().int().nonnegative(),
  totalOrganizationsCount: z.number().int().nonnegative(),
  clinicCount: z.number().int().nonnegative(),
  hospitalCount: z.number().int().nonnegative(),
  totalFacilitiesCount: z.number().int().nonnegative(),
  activeFacilitiesCount: z.number().int().nonnegative(),
  operationalSubscriptionsCount: z.number().int().nonnegative(),
  activeSubscriptionsCount: z.number().int().nonnegative()
});
export type PartnerFoundationOverviewDto = z.infer<typeof PartnerFoundationOverviewDtoSchema>;

/**
 * Phase 2.1 Mutation & Query Requests
 */

export const CreateOperationalPartnerRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerCode: z.string().min(2),
  legalBusinessName: z.string().min(2),
  partnerType: OperationalPartnerTypeEnum,
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  contractReference: z.string().optional(),
  subscriptionReference: z.string().optional(),
  reason: z.string().min(3)
});
export type CreateOperationalPartnerRequest = z.infer<typeof CreateOperationalPartnerRequestSchema>;

export const UpdateOperationalPartnerRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  status: OperationalPartnerLifecycleStatusEnum.optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contractReference: z.string().optional(),
  subscriptionReference: z.string().optional(),
  reason: z.string().min(3)
});
export type UpdateOperationalPartnerRequest = z.infer<typeof UpdateOperationalPartnerRequestSchema>;

export const CreateOperationalOrganizationRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationCode: z.string().min(2),
  organizationName: z.string().min(2),
  organizationType: OrganizationTypeEnum,
  legalEntityReference: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  reason: z.string().min(3)
});
export type CreateOperationalOrganizationRequest = z.infer<typeof CreateOperationalOrganizationRequestSchema>;

export const UpdateOperationalOrganizationRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  status: OrganizationStatusEnum.optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  reason: z.string().min(3)
});
export type UpdateOperationalOrganizationRequest = z.infer<typeof UpdateOperationalOrganizationRequestSchema>;

export const CreateOperationalFacilityRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  facilityCode: z.string().min(2),
  facilityName: z.string().min(2),
  facilityType: FacilityTypeEnum,
  addressStreet: z.string().min(2),
  addressCity: z.string().min(2),
  addressState: z.string().min(2),
  addressPostalCode: z.string().min(2),
  addressCountry: z.string().min(2).default('US'),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(2),
  reason: z.string().min(3)
});
export type CreateOperationalFacilityRequest = z.infer<typeof CreateOperationalFacilityRequestSchema>;

export const UpdateOperationalFacilityRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  facilityId: z.string().uuid(),
  status: FacilityOperationalStatusEnum.optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  reason: z.string().min(3)
});
export type UpdateOperationalFacilityRequest = z.infer<typeof UpdateOperationalFacilityRequestSchema>;

export const UpdateOperationalSubscriptionRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  planReference: z.string().min(1),
  enabledModules: z.array(z.string()),
  entitlementStatus: OperationalEntitlementStatusEnum,
  expiryDate: z.string().datetime().optional(),
  reason: z.string().min(3)
});
export type UpdateOperationalSubscriptionRequest = z.infer<typeof UpdateOperationalSubscriptionRequestSchema>;

export const QueryOperationalAuditRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  pageIndex: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().default(50)
});
export type QueryOperationalAuditRequest = z.infer<typeof QueryOperationalAuditRequestSchema>;
