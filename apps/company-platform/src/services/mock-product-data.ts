import type {
  ProductDto,
  PlanDto,
  FeatureDto,
  PlanEntitlementDto,
  PartnerPlanAssignmentDto
} from '@docsearch/api-contracts';

/**
 * Isolated development preview fixtures for Products, Plans, Features, and Entitlements.
 * Note: Never contains pricing, billing, invoice, or commercial transaction logic.
 * Clearly labeled as Sample / Live Telemetry data.
 */

export const mockProducts: ProductDto[] = [
  {
    id: 'prod-001-1111-4111-a111-111111111111',
    code: 'DOCSEARCH_CORE',
    name: 'Doc Search Enterprise Healthcare Platform',
    description: 'Core B2B healthcare multi-tenant governance, organization routing, and branch security subsystem.',
    category: 'CORE_PLATFORM',
    status: 'ACTIVE',
    version: '1.0.0',
    metadata: {
      tier: 'FOUNDATION'
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'prod-002-2222-4222-a222-222222222222',
    code: 'DOCSEARCH_AI_ASSIST',
    name: 'Doc Search Clinical AI & Governance Suite',
    description: 'AI model registry, clinical safety boundaries, prompt policy evaluator, and token telemetry.',
    category: 'AI_GOVERNANCE',
    status: 'ACTIVE',
    version: '1.0.0',
    metadata: {
      tier: 'ADDON_AI'
    },
    createdAt: '2026-03-15T00:00:00.000Z',
    updatedAt: '2026-08-22T11:30:00.000Z'
  },
  {
    id: 'prod-003-3333-4333-a333-333333333333',
    code: 'DOCSEARCH_INTEROP',
    name: 'Doc Search Interoperability Hub',
    description: 'FHIR R4/HL7 API gateways, outbound webhook pipeline, and partner integration connectors.',
    category: 'INTEROPERABILITY_HUB',
    status: 'ACTIVE',
    version: '1.0.0',
    metadata: {
      tier: 'ADDON_INTEGRATION'
    },
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-25T14:00:00.000Z'
  }
];

export const mockPlans: PlanDto[] = [
  {
    id: 'plan-001-1111-4111-a111-111111111111',
    productId: 'prod-001-1111-4111-a111-111111111111',
    productName: 'Doc Search Enterprise Healthcare Platform',
    productCode: 'DOCSEARCH_CORE',
    code: 'ENTERPRISE_HOSPITAL_NETWORK',
    name: 'Enterprise Hospital Network Tier',
    description: 'Uncapped facility branch scoping, dedicated tenant boundaries, and maximum audit retention.',
    status: 'ACTIVE',
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    entitlementCount: 5,
    metadata: {
      slaTargetPercent: 99.99
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'plan-002-2222-4222-a222-222222222222',
    productId: 'prod-001-1111-4111-a111-111111111111',
    productName: 'Doc Search Enterprise Healthcare Platform',
    productCode: 'DOCSEARCH_CORE',
    code: 'REGIONAL_CLINIC_TIER',
    name: 'Regional Clinic Group Tier',
    description: 'Designed for multi-facility ambulatory and clinic operations up to 10 facility branches.',
    status: 'ACTIVE',
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    entitlementCount: 4,
    metadata: {
      slaTargetPercent: 99.95
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'plan-003-3333-4333-a333-333333333333',
    productId: 'prod-002-2222-4222-a222-222222222222',
    productName: 'Doc Search Clinical AI & Governance Suite',
    productCode: 'DOCSEARCH_AI_ASSIST',
    code: 'AI_CLINICAL_PRO',
    name: 'Clinical AI Enterprise Pack',
    description: '100,000 monthly clinical token quota, custom safety policies, and HIPAA-compliant model routing.',
    status: 'ACTIVE',
    version: '1.0.0',
    effectiveDate: '2026-03-15T00:00:00.000Z',
    entitlementCount: 3,
    metadata: {
      monthlyTokenQuota: 100000
    },
    createdAt: '2026-03-15T00:00:00.000Z',
    updatedAt: '2026-08-22T11:30:00.000Z'
  }
];

export const mockFeatures: FeatureDto[] = [
  {
    id: 'feat-001',
    code: 'FEAT_MULTI_BRANCH_SCOPE',
    name: 'Multi-Branch Facility Isolation',
    description: 'Strict per-branch data partitioning and user-branch authorization enforcement.',
    category: 'DATA_SCOPE',
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'feat-002',
    code: 'FEAT_IMMUTABLE_AUDIT_LOGS',
    name: 'Immutable Security Audit Pipeline',
    description: 'Cryptographically ordered audit event stream with 7-year healthcare retention support.',
    category: 'SECURITY_GOVERNANCE',
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'feat-003',
    code: 'FEAT_API_GATEWAY_THROUGHPUT',
    name: 'API Gateway Rate Quota',
    description: 'Sustained and burst request rate allowance through the Fastify API Gateway.',
    category: 'INTEGRATION',
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'feat-004',
    code: 'FEAT_AI_COPILOT_ACCESS',
    name: 'Clinical AI Assistant Engine',
    description: 'Real-time medical synthesis and diagnosis reference assistance with strict safety guards.',
    category: 'AI_CAPABILITY',
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2026-03-15T00:00:00.000Z'
  },
  {
    id: 'feat-005',
    code: 'FEAT_FHIR_INTEROP_CONNECTOR',
    name: 'HL7 / FHIR R4 Interop Connector',
    description: 'Standardized EHR data synchronization and bidirectional healthcare webhooks.',
    category: 'INTEGRATION',
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2026-05-01T00:00:00.000Z'
  }
];

export const mockPlanEntitlements: Record<string, PlanEntitlementDto[]> = {
  'plan-001-1111-4111-a111-111111111111': [
    {
      id: 'pe-101',
      planId: 'plan-001-1111-4111-a111-111111111111',
      featureId: 'feat-001',
      featureCode: 'FEAT_MULTI_BRANCH_SCOPE',
      featureName: 'Multi-Branch Facility Isolation',
      featureCategory: 'DATA_SCOPE',
      entitlementType: 'LIMIT',
      value: 100,
      displayValue: 'Up to 100 Scoped Facilities',
      status: 'ACTIVE',
      metadata: {},
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'pe-102',
      planId: 'plan-001-1111-4111-a111-111111111111',
      featureId: 'feat-002',
      featureCode: 'FEAT_IMMUTABLE_AUDIT_LOGS',
      featureName: 'Immutable Security Audit Pipeline',
      featureCategory: 'SECURITY_GOVERNANCE',
      entitlementType: 'FEATURE_ACCESS',
      value: true,
      displayValue: 'Enabled (Unlimited Retention)',
      status: 'ACTIVE',
      metadata: {},
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'pe-103',
      planId: 'plan-001-1111-4111-a111-111111111111',
      featureId: 'feat-003',
      featureCode: 'FEAT_API_GATEWAY_THROUGHPUT',
      featureName: 'API Gateway Rate Quota',
      featureCategory: 'INTEGRATION',
      entitlementType: 'QUOTA',
      value: 5000,
      displayValue: '5,000 req / minute',
      status: 'ACTIVE',
      metadata: {},
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  'plan-002-2222-4222-a222-222222222222': [
    {
      id: 'pe-201',
      planId: 'plan-002-2222-4222-a222-222222222222',
      featureId: 'feat-001',
      featureCode: 'FEAT_MULTI_BRANCH_SCOPE',
      featureName: 'Multi-Branch Facility Isolation',
      featureCategory: 'DATA_SCOPE',
      entitlementType: 'LIMIT',
      value: 10,
      displayValue: 'Up to 10 Scoped Facilities',
      status: 'ACTIVE',
      metadata: {},
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'pe-202',
      planId: 'plan-002-2222-4222-a222-222222222222',
      featureId: 'feat-002',
      featureCode: 'FEAT_IMMUTABLE_AUDIT_LOGS',
      featureName: 'Immutable Security Audit Pipeline',
      featureCategory: 'SECURITY_GOVERNANCE',
      entitlementType: 'FEATURE_ACCESS',
      value: true,
      displayValue: 'Enabled (1-Year Retention)',
      status: 'ACTIVE',
      metadata: {},
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  'plan-003-3333-4333-a333-333333333333': [
    {
      id: 'pe-301',
      planId: 'plan-003-3333-4333-a333-333333333333',
      featureId: 'feat-004',
      featureCode: 'FEAT_AI_COPILOT_ACCESS',
      featureName: 'Clinical AI Assistant Engine',
      featureCategory: 'AI_CAPABILITY',
      entitlementType: 'QUOTA',
      value: 100000,
      displayValue: '100,000 tokens / month',
      status: 'ACTIVE',
      metadata: {},
      createdAt: '2026-03-15T00:00:00.000Z'
    }
  ]
};

export const mockPartnerAssignments: PartnerPlanAssignmentDto[] = [
  {
    id: 'assign-001-1111-4111-a111-111111111111',
    partnerId: '11111111-1111-4111-a111-111111111111',
    partnerTradeName: 'Metro Health Alliance',
    partnerTenantSlug: 'metro-health-alliance',
    productId: 'prod-001-1111-4111-a111-111111111111',
    productName: 'Doc Search Enterprise Healthcare Platform',
    planId: 'plan-001-1111-4111-a111-111111111111',
    planName: 'Enterprise Hospital Network Tier',
    planVersion: '1.0.0',
    assignmentStatus: 'ACTIVE',
    effectiveDate: '2026-02-10T16:45:00.000Z',
    assignedByEmail: 'security.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-02-10T16:45:00.000Z',
    updatedAt: '2026-02-10T16:45:00.000Z'
  },
  {
    id: 'assign-002-2222-4222-a222-222222222222',
    partnerId: '33333333-3333-4333-a333-333333333333',
    partnerTradeName: 'Apex Surgical Centers',
    partnerTenantSlug: 'apex-surgical-centers',
    productId: 'prod-001-1111-4111-a111-111111111111',
    productName: 'Doc Search Enterprise Healthcare Platform',
    planId: 'plan-002-2222-4222-a222-222222222222',
    planName: 'Regional Clinic Group Tier',
    planVersion: '1.0.0',
    assignmentStatus: 'ACTIVE',
    effectiveDate: '2026-07-01T10:00:00.000Z',
    assignedByEmail: 'onboarding.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z'
  }
];
