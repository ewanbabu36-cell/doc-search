import type {
  IntegrationProviderDto,
  IntegrationEndpointDto,
  ApiRouteDto,
  ApiVersionDto,
  IntegrationConnectionDto,
  HL7EndpointDto,
  FHIRCapabilityDto,
  FHIRResourceConfigurationDto,
  WebhookEndpointDto,
  WebhookDeliveryDto,
  ApiRateLimitPolicyDto,
  ApiUsageRecordDto,
  IntegrationHealthDto,
  IntegrationIncidentDto,
  IntegrationCredentialReferenceDto,
  IntegrationAuditTraceDto,
  IntegrationOverviewDto
} from '@docsearch/api-contracts';

/**
 * Isolated Live Telemetry Fixtures for API / Integration / Interoperability.
 *
 * CRITICAL SAFETY RULES:
 * 1. Never fabricate live production API traffic, uptime percentages, or real partner connectivity.
 * 2. Clearly labeled as "Live Telemetry — Live Telemetry".
 * 3. Telemetry notice: "Live integration telemetry is not connected."
 * 4. Zero PHI, zero real medical records, zero raw secret keys/tokens. Secret references and hashes only.
 */

export const mockIntegrationOverview: IntegrationOverviewDto = {
  totalRoutesCount: 16,
  activeProvidersCount: 4,
  activeConnectionsCount: 6,
  hl7EndpointsCount: 2,
  fhirCapabilitiesCount: 2,
  webhookEndpointsCount: 3,
  rateLimitPoliciesCount: 3,
  openIncidentsCount: 1,
  pendingRotationsCount: 1,
  telemetryStatus: 'Live integration telemetry is not connected.'
};

export const mockIntegrationProviders: IntegrationProviderDto[] = [
  {
    id: 'p0000001-0000-0000-0000-000000000001',
    providerCode: 'PROV-EPIC-EHR',
    providerName: 'Epic Systems Interconnect',
    description: 'Enterprise EHR adapter supporting FHIR R4 US Core and RESTful clinical encounter synchronizations.',
    integrationType: 'EHR_EMR',
    protocol: 'FHIR_R4',
    status: 'ACTIVE',
    ownerEmail: 'integration.lead@docsearch.internal',
    documentationReference: 'DOC-REF-EPIC-FHIR-R4-V2',
    supportReference: 'support.epic-interconnect@example.com',
    endpointsCount: 2,
    activeConnectionsCount: 3,
    metadata: { authType: 'SMART_ON_FHIR_BACKEND' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'p0000001-0000-0000-0000-000000000002',
    providerCode: 'PROV-CERNER-HL7',
    providerName: 'Oracle Cerner Millennium Interface Engine',
    description: 'Bi-directional HL7 v2.5.1 MLLP feed for real-time ADT patient movement and lab order/result telemetry.',
    integrationType: 'EHR_EMR',
    protocol: 'HL7_V2',
    status: 'ACTIVE',
    ownerEmail: 'integration.lead@docsearch.internal',
    documentationReference: 'DOC-REF-CERNER-HL7-V25',
    supportReference: 'tier3-cerner@example.com',
    endpointsCount: 1,
    activeConnectionsCount: 2,
    metadata: { transport: 'MLLP_OVER_MTLS' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'p0000001-0000-0000-0000-000000000003',
    providerCode: 'PROV-STRIPE-BILLING',
    providerName: 'Stripe Billing Webhooks',
    description: 'Inbound webhook event receiver for partner subscription charges, invoice payments, and credit adjustments.',
    integrationType: 'BILLING_CLEARINGHOUSE',
    protocol: 'WEBHOOK',
    status: 'ACTIVE',
    ownerEmail: 'finance.eng@docsearch.internal',
    documentationReference: 'DOC-REF-STRIPE-WEBHOOK-V2',
    supportReference: 'merchant-ops@stripe.example.com',
    endpointsCount: 1,
    activeConnectionsCount: 1,
    metadata: { signatureScheme: 'STRIPE_HMAC_SHA256' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'p0000001-0000-0000-0000-000000000004',
    providerCode: 'PROV-TWILIO-GATEWAY',
    providerName: 'Twilio Healthcare Alert Gateway',
    description: 'Outbound multi-channel dispatch provider for urgent clinical alerts, doctor callbacks, and emergency bulletins.',
    integrationType: 'NOTIFICATION_GATEWAY',
    protocol: 'REST_JSON',
    status: 'ACTIVE',
    ownerEmail: 'platform.eng@docsearch.internal',
    documentationReference: 'DOC-REF-TWILIO-REST-V1',
    supportReference: 'enterprise-support@twilio.example.com',
    endpointsCount: 1,
    activeConnectionsCount: 1,
    metadata: { rateLimitTier: 'ENTERPRISE_GOLD' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  }
];

export const mockIntegrationEndpoints: IntegrationEndpointDto[] = [
  {
    id: 'ep000001-0000-0000-0000-000000000001',
    endpointCode: 'EP-EPIC-FHIR-PROD',
    providerId: 'p0000001-0000-0000-0000-000000000001',
    providerName: 'Epic Systems Interconnect',
    name: 'Epic Production FHIR R4 Gateway',
    baseUrlReference: 'https://gw.epic-connect.internal/fhir/r4',
    environment: 'PRODUCTION',
    status: 'ONLINE',
    authenticationMethod: 'OAUTH2_CLIENT_CREDENTIALS',
    healthCheckPathReference: '/metadata',
    timeoutMs: 5000,
    retryPolicy: 'EXPONENTIAL_BACKOFF_3X',
    ownerEmail: 'integration.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'ep000001-0000-0000-0000-000000000002',
    endpointCode: 'EP-CERNER-MLLP-PROD',
    providerId: 'p0000001-0000-0000-0000-000000000002',
    providerName: 'Oracle Cerner Millennium Interface Engine',
    name: 'Cerner Millennium MLLP Listener',
    baseUrlReference: 'mllp://hl7.cerner-gw.internal:2575',
    environment: 'PRODUCTION',
    status: 'ONLINE',
    authenticationMethod: 'MTLS_CERTIFICATE',
    healthCheckPathReference: '/ping',
    timeoutMs: 3000,
    retryPolicy: 'RETRY_IMMEDIATE_2X',
    ownerEmail: 'integration.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  }
];

export const mockApiRoutes: ApiRouteDto[] = [
  {
    id: 'r0000001-0000-0000-0000-000000000001',
    routeCode: 'RT-CORE-PARTNERS-GET',
    method: 'GET',
    pathPattern: '/api/v1/partners',
    serviceName: 'company-platform-api',
    domain: 'CRM',
    version: 'v1',
    environment: 'PRODUCTION',
    status: 'ACTIVE',
    authenticationRequired: true,
    requiredPermission: 'partner:read',
    description: 'Retrieve paginated healthcare partner profiles and lifecycle states.',
    ownerEmail: 'crm.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'r0000001-0000-0000-0000-000000000002',
    routeCode: 'RT-INTEROP-FHIR-SEARCH',
    method: 'GET',
    pathPattern: '/api/v1/clinical/fhir/r4/:resourceType',
    serviceName: 'fhir-bridge-service',
    domain: 'INTEROPERABILITY',
    version: 'v1',
    environment: 'PRODUCTION',
    status: 'ACTIVE',
    authenticationRequired: true,
    requiredPermission: 'fhir:read',
    description: 'FHIR R4 standard search endpoint for configured clinical resources.',
    ownerEmail: 'integration.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'r0000001-0000-0000-0000-000000000003',
    routeCode: 'RT-AUTH-TOKEN-ISSUE',
    method: 'POST',
    pathPattern: '/api/v1/auth/tokens',
    serviceName: 'auth-gateway-service',
    domain: 'SECURITY',
    version: 'v1',
    environment: 'PRODUCTION',
    status: 'ACTIVE',
    authenticationRequired: false,
    requiredPermission: 'public',
    description: 'Issue short-lived signed JWT access tokens with hardware-backed MFA verification.',
    ownerEmail: 'security.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  }
];

export const mockApiVersions: ApiVersionDto[] = [
  {
    id: 'v0000001-0000-0000-0000-000000000001',
    apiName: 'Company Platform Core Gateway',
    version: 'v1.0.0',
    status: 'ACTIVE',
    releaseDate: '2026-01-01T00:00:00.000Z',
    breakingChange: false,
    ownerEmail: 'platform.eng@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  },
  {
    id: 'v0000001-0000-0000-0000-000000000002',
    apiName: 'Company Platform Core Gateway',
    version: 'v2.0.0-beta',
    status: 'DRAFT',
    releaseDate: '2026-11-01T00:00:00.000Z',
    breakingChange: true,
    migrationReference: 'DOC-MIGRATE-V1-TO-V2',
    ownerEmail: 'platform.eng@docsearch.internal',
    metadata: {},
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z'
  }
];

export const mockIntegrationConnections: IntegrationConnectionDto[] = [
  {
    id: 'conn0001-0000-0000-0000-000000000001',
    connectionCode: 'CONN-STJUDE-EPIC-01',
    providerId: 'p0000001-0000-0000-0000-000000000001',
    providerName: 'Epic Systems Interconnect',
    endpointId: 'ep000001-0000-0000-0000-000000000001',
    endpointName: 'Epic Production FHIR R4 Gateway',
    partnerName: 'St. Jude Children Research Hospital',
    tenantScope: 'PARTNER_TENANT_01',
    environment: 'PRODUCTION',
    status: 'CONNECTED',
    lastSuccessAt: '2026-08-29T13:00:00.000Z',
    lastHealthCheckAt: '2026-08-29T13:30:00.000Z',
    failureCount: 0,
    successCount: 1420,
    healthStatus: 'HEALTHY',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T13:30:00.000Z'
  },
  {
    id: 'conn0001-0000-0000-0000-000000000002',
    connectionCode: 'CONN-METRO-CERNER-02',
    providerId: 'p0000001-0000-0000-0000-000000000002',
    providerName: 'Oracle Cerner Millennium Interface Engine',
    endpointId: 'ep000001-0000-0000-0000-000000000002',
    endpointName: 'Cerner Millennium MLLP Listener',
    partnerName: 'Metro General Health System',
    tenantScope: 'PARTNER_TENANT_02',
    environment: 'PRODUCTION',
    status: 'CONNECTED',
    lastSuccessAt: '2026-08-29T13:15:00.000Z',
    lastHealthCheckAt: '2026-08-29T13:30:00.000Z',
    failureCount: 0,
    successCount: 890,
    healthStatus: 'HEALTHY',
    metadata: {},
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-08-29T13:30:00.000Z'
  }
];

export const mockHL7Endpoints: HL7EndpointDto[] = [
  {
    id: 'hl700001-0000-0000-0000-000000000001',
    endpointCode: 'HL7-METRO-ADT-INBOUND',
    connectionId: 'conn0001-0000-0000-0000-000000000002',
    connectionCode: 'CONN-METRO-CERNER-02',
    hl7Version: 'HL7_V2_5_1',
    messageTypes: ['ADT_A01_ADMIT', 'ADT_A08_UPDATE', 'ADT_A03_DISCHARGE'],
    transportProtocol: 'MLLP_TLS',
    acknowledgementMode: 'ORIGINAL_MODE',
    status: 'ONLINE',
    facilityReference: 'FAC-METRO-MAIN-HOSPITAL',
    routingRules: ['RULE_DEIDENTIFY_METADATA', 'RULE_FORWARD_CLINICAL_EVENT'],
    lastMessageAt: '2026-08-29T13:15:00.000Z',
    metadata: {},
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-08-29T13:15:00.000Z'
  }
];

export const mockFHIRCapabilities: FHIRCapabilityDto[] = [
  {
    id: 'fhir0001-0000-0000-0000-000000000001',
    connectionId: 'conn0001-0000-0000-0000-000000000001',
    connectionCode: 'CONN-STJUDE-EPIC-01',
    fhirVersion: 'FHIR_R4',
    capabilityMode: 'BRIDGE',
    resourceTypes: ['Patient', 'Encounter', 'Observation', 'Condition', 'Medication', 'Appointment'],
    searchSupported: true,
    createSupported: false,
    readSupported: true,
    updateSupported: false,
    deleteSupported: false,
    batchSupported: true,
    subscriptionSupported: false,
    status: 'ONLINE',
    capabilityReference: 'CAP-EPIC-US-CORE-R4-2026',
    lastVerifiedAt: '2026-08-25T11:00:00.000Z',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-25T11:00:00.000Z'
  }
];

export const mockFHIRResourceConfigurations: FHIRResourceConfigurationDto[] = [
  {
    id: 'frc00001-0000-0000-0000-000000000001',
    connectionId: 'conn0001-0000-0000-0000-000000000001',
    resourceType: 'Patient',
    status: 'READ_ONLY',
    readEnabled: true,
    writeEnabled: false,
    searchEnabled: true,
    exportEnabled: false,
    validationMode: 'STRICT_US_CORE',
    mappingReference: 'MAP-US-CORE-PATIENT-V3',
    governancePolicyReference: 'POL-HIPAA-MIN-NECESSARY',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'frc00001-0000-0000-0000-000000000002',
    connectionId: 'conn0001-0000-0000-0000-000000000001',
    resourceType: 'Encounter',
    status: 'ENABLED',
    readEnabled: true,
    writeEnabled: false,
    searchEnabled: true,
    exportEnabled: false,
    validationMode: 'STRICT_US_CORE',
    mappingReference: 'MAP-US-CORE-ENCOUNTER-V3',
    governancePolicyReference: 'POL-HIPAA-MIN-NECESSARY',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const mockWebhookEndpoints: WebhookEndpointDto[] = [
  {
    id: 'wh000001-0000-0000-0000-000000000001',
    webhookCode: 'WH-STRIPE-INVOICING',
    providerName: 'Stripe Billing Webhooks',
    endpointReference: 'https://gateway.docsearch.internal/webhooks/stripe/v1',
    eventTypes: ['invoice.paid', 'invoice.payment_failed', 'customer.subscription.updated'],
    status: 'ACTIVE',
    authenticationMethod: 'WEBHOOK_HMAC_SIGNATURE',
    retryPolicy: 'EXPONENTIAL_BACKOFF_5X',
    maxRetryAttempts: 5,
    timeoutMs: 5000,
    lastDeliveryAt: '2026-08-29T12:45:00.000Z',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-29T12:45:00.000Z'
  }
];

export const mockWebhookDeliveries: WebhookDeliveryDto[] = [
  {
    id: 'del00001-0000-0000-0000-000000000001',
    deliveryId: 'DEL-20260829-00192',
    webhookEndpointId: 'wh000001-0000-0000-0000-000000000001',
    webhookCode: 'WH-STRIPE-INVOICING',
    eventType: 'invoice.paid',
    deliveryStatus: 'DELIVERED',
    attemptNumber: 1,
    responseStatus: 200,
    latencyMs: 142,
    deliveredAt: '2026-08-29T12:45:00.000Z',
    traceReference: 'TRACE-WH-20260829-STRIPE-01',
    metadata: {},
    createdAt: '2026-08-29T12:45:00.000Z'
  }
];

export const mockApiRateLimitPolicies: ApiRateLimitPolicyDto[] = [
  {
    id: 'rl000001-0000-0000-0000-000000000001',
    policyCode: 'POL-RL-PLATFORM-GLOBAL',
    name: 'Platform Global Rate Limiter',
    scopeType: 'PLATFORM',
    scopeReference: 'GLOBAL',
    limitValue: 10000,
    period: 'MINUTE',
    burstLimit: 15000,
    action: 'BLOCK_429',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    ownerEmail: 'infrastructure.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'rl000001-0000-0000-0000-000000000002',
    policyCode: 'POL-RL-PARTNER-STANDARD',
    name: 'Partner Integration Rate Limiting Baseline',
    scopeType: 'PARTNER',
    scopeReference: 'STANDARD_TIER',
    limitValue: 2000,
    period: 'MINUTE',
    burstLimit: 3000,
    action: 'THROTTLE_QUEUE',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    ownerEmail: 'integration.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'rl000001-0000-0000-0000-000000000003',
    policyCode: 'POL-RL-AUTH-BRUTEFORCE',
    name: 'Authentication Endpoint Abuse Prevention',
    scopeType: 'ENDPOINT',
    scopeReference: '/api/v1/auth/tokens',
    limitValue: 60,
    period: 'MINUTE',
    burstLimit: 100,
    action: 'BLOCK_429',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    ownerEmail: 'security.lead@docsearch.internal',
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const mockApiUsageRecords: ApiUsageRecordDto[] = [
  {
    id: 'u0000001-0000-0000-0000-000000000001',
    routeId: 'r0000001-0000-0000-0000-000000000001',
    routePath: '/api/v1/partners',
    tenantScope: 'PLATFORM',
    environment: 'PRODUCTION',
    requestCount: 1420,
    successCount: 1418,
    errorCount: 2,
    rateLimitedCount: 0,
    recordedAt: '2026-08-29T12:00:00.000Z',
    sourceStatus: 'PENDING_TELEMETRY_PIPELINE',
    metadata: {}
  }
];

export const mockIntegrationHealth: IntegrationHealthDto[] = [
  {
    id: 'h0000001-0000-0000-0000-000000000001',
    connectionId: 'conn0001-0000-0000-0000-000000000001',
    connectionCode: 'CONN-STJUDE-EPIC-01',
    providerName: 'Epic Systems Interconnect',
    healthStatus: 'HEALTHY',
    availabilityStatus: 'TELEMETRY_PENDING',
    latencyMs: 142,
    consecutiveFailures: 0,
    lastSuccessAt: '2026-08-29T13:00:00.000Z',
    checkedAt: '2026-08-29T13:30:00.000Z',
    checkSource: 'GATEWAY_PROBE',
    metadata: {}
  },
  {
    id: 'h0000001-0000-0000-0000-000000000002',
    connectionId: 'conn0001-0000-0000-0000-000000000002',
    connectionCode: 'CONN-METRO-CERNER-02',
    providerName: 'Oracle Cerner Millennium Interface Engine',
    healthStatus: 'HEALTHY',
    availabilityStatus: 'TELEMETRY_PENDING',
    latencyMs: 88,
    consecutiveFailures: 0,
    lastSuccessAt: '2026-08-29T13:15:00.000Z',
    checkedAt: '2026-08-29T13:30:00.000Z',
    checkSource: 'GATEWAY_PROBE',
    metadata: {}
  }
];

export const mockIntegrationIncidents: IntegrationIncidentDto[] = [
  {
    id: 'inc00001-0000-0000-0000-000000000001',
    incidentCode: 'INC-INT-20260829-01',
    connectionCode: 'CONN-STJUDE-EPIC-01',
    providerName: 'Epic Systems Interconnect',
    category: 'RATE_LIMIT_BREACH',
    severity: 'MEDIUM',
    title: 'Batch Sync Encounter Rate Limit Warning on Epic Staging Gateway',
    description: 'Automated clinical encounter staging synchronization reached 92% of configured token bucket limit.',
    source: 'GATEWAY_RATE_LIMITER',
    status: 'OPEN',
    assignedToEmail: 'integration.lead@docsearch.internal',
    detectedAt: '2026-08-29T12:15:00.000Z',
    acknowledgedAt: '2026-08-29T12:30:00.000Z',
    metadata: {},
    createdAt: '2026-08-29T12:15:00.000Z',
    updatedAt: '2026-08-29T12:30:00.000Z'
  }
];

export const mockIntegrationCredentials: IntegrationCredentialReferenceDto[] = [
  {
    id: 'ic000001-0000-0000-0000-000000000001',
    credentialCode: 'CRED-REF-EPIC-OAUTH-2026',
    credentialType: 'OAUTH_CLIENT_REFERENCE',
    ownerType: 'PROVIDER',
    ownerReference: 'Epic Systems Interconnect',
    status: 'ACTIVE',
    secretReference: 'vault://secrets/int/epic-prod-client',
    createdByEmail: 'integration.lead@docsearch.internal',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastRotatedAt: '2026-06-01T00:00:00.000Z',
    nextRotationDue: '2026-09-01T00:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
    metadata: {}
  },
  {
    id: 'ic000001-0000-0000-0000-000000000002',
    credentialCode: 'CRED-REF-STRIPE-SIGNING-KEY',
    credentialType: 'WEBHOOK_SECRET_REFERENCE',
    ownerType: 'PROVIDER',
    ownerReference: 'Stripe Billing Webhooks',
    status: 'ACTIVE',
    secretReference: 'vault://secrets/int/stripe-webhook-secret',
    createdByEmail: 'finance.eng@docsearch.internal',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastRotatedAt: '2026-07-01T00:00:00.000Z',
    nextRotationDue: '2026-10-01T00:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
    metadata: {}
  }
];

export const mockIntegrationAuditTraces: IntegrationAuditTraceDto[] = [
  {
    id: 'tr000001-0000-0000-0000-000000000001',
    traceId: 'TR-INT-20260829-001',
    actorEmail: 'integration.lead@docsearch.internal',
    action: 'FHIR_CAPABILITY_VERIFIED',
    operationStatus: 'SUCCESS',
    environment: 'PRODUCTION',
    occurredAt: '2026-08-29T11:00:00.000Z',
    correlationReference: 'CORR-FHIR-EPIC-001',
    evidenceReference: 'CAP-EPIC-US-CORE-R4-2026',
    metadata: {}
  },
  {
    id: 'tr000001-0000-0000-0000-000000000002',
    traceId: 'TR-INT-20260829-002',
    actorEmail: 'security.lead@docsearch.internal',
    action: 'RATE_LIMIT_POLICY_UPDATED',
    operationStatus: 'SUCCESS',
    environment: 'PRODUCTION',
    occurredAt: '2026-08-29T12:00:00.000Z',
    correlationReference: 'CORR-RL-GLOBAL-001',
    evidenceReference: 'POL-RL-PLATFORM-GLOBAL',
    metadata: {}
  }
];
