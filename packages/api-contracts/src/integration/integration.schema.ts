import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const IntegrationProviderStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'DEPRECATED',
  'MAINTENANCE'
]);
export type IntegrationProviderStatus = z.infer<typeof IntegrationProviderStatusSchema>;

export const IntegrationTypeSchema = z.enum([
  'EHR_EMR',
  'LAB_SYSTEM',
  'IMAGING_PACS',
  'BILLING_CLEARINGHOUSE',
  'IDENTITY_PROVIDER',
  'NOTIFICATION_GATEWAY',
  'ANALYTICS_WAREHOUSE',
  'CUSTOM_REST_API'
]);
export type IntegrationType = z.infer<typeof IntegrationTypeSchema>;

export const IntegrationProtocolSchema = z.enum([
  'REST_JSON',
  'HL7_V2',
  'FHIR_R4',
  'WEBHOOK',
  'SOAP_XML',
  'GRPC',
  'SFTP'
]);
export type IntegrationProtocol = z.infer<typeof IntegrationProtocolSchema>;

export const EndpointEnvironmentSchema = z.enum([
  'PRODUCTION',
  'STAGING',
  'SANDBOX',
  'DEVELOPMENT'
]);
export type EndpointEnvironment = z.infer<typeof EndpointEnvironmentSchema>;

export const EndpointStatusSchema = z.enum([
  'ONLINE',
  'OFFLINE',
  'DEGRADED',
  'MAINTENANCE',
  'PENDING_VERIFICATION'
]);
export type EndpointStatus = z.infer<typeof EndpointStatusSchema>;

export const ApiRouteStatusSchema = z.enum([
  'ACTIVE',
  'DEPRECATED',
  'SUNSET',
  'EXPERIMENTAL',
  'INTERNAL_ONLY'
]);
export type ApiRouteStatus = z.infer<typeof ApiRouteStatusSchema>;

export const ApiVersionStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'DEPRECATED',
  'SUNSET'
]);
export type ApiVersionStatus = z.infer<typeof ApiVersionStatusSchema>;

export const AuthenticationMethodSchema = z.enum([
  'BEARER_JWT',
  'API_KEY_HEADER',
  'MTLS_CERTIFICATE',
  'OAUTH2_CLIENT_CREDENTIALS',
  'WEBHOOK_HMAC_SIGNATURE',
  'NONE'
]);
export type AuthenticationMethod = z.infer<typeof AuthenticationMethodSchema>;

export const HL7VersionSchema = z.enum([
  'HL7_V2_3',
  'HL7_V2_4',
  'HL7_V2_5',
  'HL7_V2_5_1',
  'HL7_V2_6'
]);
export type HL7Version = z.infer<typeof HL7VersionSchema>;

export const FHIRVersionSchema = z.enum([
  'FHIR_R4',
  'FHIR_R4B',
  'FHIR_R5'
]);
export type FHIRVersion = z.infer<typeof FHIRVersionSchema>;

export const FHIRCapabilityModeSchema = z.enum([
  'SERVER',
  'CLIENT',
  'BRIDGE',
  'PASSTHROUGH_GATEWAY'
]);
export type FHIRCapabilityMode = z.infer<typeof FHIRCapabilityModeSchema>;

export const FHIRResourceStatusSchema = z.enum([
  'ENABLED',
  'READ_ONLY',
  'DISABLED',
  'RESTRICTED'
]);
export type FHIRResourceStatus = z.infer<typeof FHIRResourceStatusSchema>;

export const WebhookStatusSchema = z.enum([
  'ACTIVE',
  'PAUSED',
  'FAILED_CIRCUIT_OPEN',
  'DISABLED'
]);
export type WebhookStatus = z.infer<typeof WebhookStatusSchema>;

export const WebhookDeliveryStatusSchema = z.enum([
  'DELIVERED',
  'FAILED',
  'RETRYING',
  'PENDING',
  'EXPIRED'
]);
export type WebhookDeliveryStatus = z.infer<typeof WebhookDeliveryStatusSchema>;

export const WebhookFailureReasonSchema = z.enum([
  'TIMEOUT',
  'HTTP_5XX_SERVER_ERROR',
  'HTTP_4XX_CLIENT_ERROR',
  'CONNECTION_REFUSED',
  'TLS_HANDSHAKE_FAILURE',
  'CIRCUIT_BREAKER_TRIGGERED'
]);
export type WebhookFailureReason = z.infer<typeof WebhookFailureReasonSchema>;

export const RateLimitScopeSchema = z.enum([
  'PLATFORM',
  'COMPANY',
  'PARTNER',
  'ENDPOINT',
  'USER_SESSION'
]);
export type RateLimitScope = z.infer<typeof RateLimitScopeSchema>;

export const RateLimitPeriodSchema = z.enum([
  'SECOND',
  'MINUTE',
  'HOUR',
  'DAY'
]);
export type RateLimitPeriod = z.infer<typeof RateLimitPeriodSchema>;

export const RateLimitActionSchema = z.enum([
  'BLOCK_429',
  'THROTTLE_QUEUE',
  'ALERT_ONLY',
  'LOG_TELEMETRY'
]);
export type RateLimitAction = z.infer<typeof RateLimitActionSchema>;

export const IntegrationHealthStatusSchema = z.enum([
  'HEALTHY',
  'DEGRADED',
  'UNAVAILABLE',
  'UNKNOWN',
  'PENDING_TELEMETRY_PIPELINE'
]);
export type IntegrationHealthStatus = z.infer<typeof IntegrationHealthStatusSchema>;

export const IntegrationIncidentSeveritySchema = z.enum([
  'INFO',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);
export type IntegrationIncidentSeverity = z.infer<typeof IntegrationIncidentSeveritySchema>;

export const IntegrationIncidentStatusSchema = z.enum([
  'OPEN',
  'INVESTIGATING',
  'CONTAINED',
  'RESOLVED',
  'FALSE_POSITIVE'
]);
export type IntegrationIncidentStatus = z.infer<typeof IntegrationIncidentStatusSchema>;

export const CredentialReferenceStatusSchema = z.enum([
  'ACTIVE',
  'PENDING_ROTATION',
  'EXPIRED',
  'REVOKED'
]);
export type CredentialReferenceStatus = z.infer<typeof CredentialReferenceStatusSchema>;

export const IntegrationAuditStatusSchema = z.enum([
  'SUCCESS',
  'FAILURE',
  'DENIED',
  'SIMULATED'
]);
export type IntegrationAuditStatus = z.infer<typeof IntegrationAuditStatusSchema>;

// ==========================================
// DTOs
// ==========================================

export const IntegrationProviderDtoSchema = z.object({
  id: z.string().uuid(),
  providerCode: z.string().min(2),
  providerName: z.string().min(2),
  description: z.string(),
  integrationType: IntegrationTypeSchema,
  protocol: IntegrationProtocolSchema,
  status: IntegrationProviderStatusSchema,
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  documentationReference: z.string(),
  supportReference: z.string().optional(),
  endpointsCount: z.number().int().min(0).default(0),
  activeConnectionsCount: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type IntegrationProviderDto = z.infer<typeof IntegrationProviderDtoSchema>;

export const IntegrationEndpointDtoSchema = z.object({
  id: z.string().uuid(),
  endpointCode: z.string().min(2),
  providerId: z.string().uuid(),
  providerName: z.string().optional(),
  name: z.string().min(2),
  baseUrlReference: z.string(),
  environment: EndpointEnvironmentSchema,
  status: EndpointStatusSchema,
  authenticationMethod: AuthenticationMethodSchema,
  healthCheckPathReference: z.string().optional(),
  timeoutMs: z.number().int().min(100).default(5000),
  retryPolicy: z.string().default('EXPONENTIAL_BACKOFF_3X'),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type IntegrationEndpointDto = z.infer<typeof IntegrationEndpointDtoSchema>;

export const ApiRouteDtoSchema = z.object({
  id: z.string().uuid(),
  routeCode: z.string().min(2),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  pathPattern: z.string().min(1),
  serviceName: z.string().min(2),
  domain: z.string().min(2),
  version: z.string().default('v1'),
  environment: EndpointEnvironmentSchema,
  status: ApiRouteStatusSchema,
  authenticationRequired: z.boolean().default(true),
  requiredPermission: z.string().optional(),
  rateLimitPolicyId: z.string().uuid().optional(),
  rateLimitPolicyCode: z.string().optional(),
  description: z.string(),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ApiRouteDto = z.infer<typeof ApiRouteDtoSchema>;

export const ApiVersionDtoSchema = z.object({
  id: z.string().uuid(),
  apiName: z.string().min(2),
  version: z.string().min(1),
  status: ApiVersionStatusSchema,
  releaseDate: z.string().datetime(),
  deprecationDate: z.string().datetime().optional(),
  sunsetDate: z.string().datetime().optional(),
  breakingChange: z.boolean().default(false),
  migrationReference: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ApiVersionDto = z.infer<typeof ApiVersionDtoSchema>;

export const IntegrationConnectionDtoSchema = z.object({
  id: z.string().uuid(),
  connectionCode: z.string().min(2),
  providerId: z.string().uuid(),
  providerName: z.string().optional(),
  endpointId: z.string().uuid(),
  endpointName: z.string().optional(),
  partnerId: z.string().uuid().optional(),
  partnerName: z.string().optional(),
  tenantScope: z.string().default('PLATFORM'),
  environment: EndpointEnvironmentSchema,
  status: z.enum(['CONNECTED', 'DISCONNECTED', 'DEGRADED', 'CONFIGURATION_PENDING']),
  lastSuccessAt: z.string().datetime().optional(),
  lastFailureAt: z.string().datetime().optional(),
  lastHealthCheckAt: z.string().datetime().optional(),
  failureCount: z.number().int().min(0).default(0),
  successCount: z.number().int().min(0).default(0),
  healthStatus: IntegrationHealthStatusSchema,
  credentialReferenceId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type IntegrationConnectionDto = z.infer<typeof IntegrationConnectionDtoSchema>;

export const HL7EndpointDtoSchema = z.object({
  id: z.string().uuid(),
  endpointCode: z.string().min(2),
  connectionId: z.string().uuid(),
  connectionCode: z.string().optional(),
  hl7Version: HL7VersionSchema,
  messageTypes: z.array(z.string()).default([]), // e.g. ['ADT_A01', 'ADT_A08', 'ORM_O01', 'ORU_R01']
  transportProtocol: z.enum(['MLLP_TLS', 'HTTPS_REST_WRAPPED', 'SFTP_BATCH']),
  acknowledgementMode: z.enum(['ORIGINAL_MODE', 'ENHANCED_MODE']),
  status: EndpointStatusSchema,
  facilityReference: z.string(),
  routingRules: z.array(z.string()).default([]),
  lastMessageAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type HL7EndpointDto = z.infer<typeof HL7EndpointDtoSchema>;

export const FHIRCapabilityDtoSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  connectionCode: z.string().optional(),
  fhirVersion: FHIRVersionSchema,
  capabilityMode: FHIRCapabilityModeSchema,
  resourceTypes: z.array(z.string()).default([]), // e.g. ['Patient', 'Encounter', 'Observation', 'Condition', 'Medication']
  searchSupported: z.boolean().default(true),
  createSupported: z.boolean().default(false),
  readSupported: z.boolean().default(true),
  updateSupported: z.boolean().default(false),
  deleteSupported: z.boolean().default(false),
  batchSupported: z.boolean().default(true),
  subscriptionSupported: z.boolean().default(false),
  status: EndpointStatusSchema,
  capabilityReference: z.string(),
  lastVerifiedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type FHIRCapabilityDto = z.infer<typeof FHIRCapabilityDtoSchema>;

export const FHIRResourceConfigurationDtoSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  resourceType: z.string().min(2),
  status: FHIRResourceStatusSchema,
  readEnabled: z.boolean().default(true),
  writeEnabled: z.boolean().default(false),
  searchEnabled: z.boolean().default(true),
  exportEnabled: z.boolean().default(false),
  validationMode: z.enum(['STRICT_US_CORE', 'STANDARD_R4', 'PERMISSIVE']),
  mappingReference: z.string(),
  governancePolicyReference: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type FHIRResourceConfigurationDto = z.infer<typeof FHIRResourceConfigurationDtoSchema>;

export const WebhookEndpointDtoSchema = z.object({
  id: z.string().uuid(),
  webhookCode: z.string().min(2),
  providerId: z.string().uuid().optional(),
  providerName: z.string().optional(),
  connectionId: z.string().uuid().optional(),
  endpointReference: z.string(),
  eventTypes: z.array(z.string()).default([]), // e.g. ['partner.status_changed', 'invoice.created', 'security.alert']
  status: WebhookStatusSchema,
  authenticationMethod: AuthenticationMethodSchema,
  retryPolicy: z.string().default('EXPONENTIAL_BACKOFF_5X'),
  maxRetryAttempts: z.number().int().min(1).max(10).default(5),
  timeoutMs: z.number().int().min(100).default(5000),
  lastDeliveryAt: z.string().datetime().optional(),
  lastFailureAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type WebhookEndpointDto = z.infer<typeof WebhookEndpointDtoSchema>;

export const WebhookDeliveryDtoSchema = z.object({
  id: z.string().uuid(),
  deliveryId: z.string().min(2),
  webhookEndpointId: z.string().uuid(),
  webhookCode: z.string().optional(),
  eventType: z.string().min(2),
  deliveryStatus: WebhookDeliveryStatusSchema,
  attemptNumber: z.number().int().min(1).default(1),
  responseStatus: z.number().int().optional(),
  latencyMs: z.number().int().optional(),
  failureReason: WebhookFailureReasonSchema.optional(),
  deliveredAt: z.string().datetime().optional(),
  nextRetryAt: z.string().datetime().optional(),
  traceReference: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime()
});
export type WebhookDeliveryDto = z.infer<typeof WebhookDeliveryDtoSchema>;

export const ApiRateLimitPolicyDtoSchema = z.object({
  id: z.string().uuid(),
  policyCode: z.string().min(2),
  name: z.string().min(2),
  scopeType: RateLimitScopeSchema,
  scopeReference: z.string().default('GLOBAL'),
  limitValue: z.number().int().min(1),
  period: RateLimitPeriodSchema,
  burstLimit: z.number().int().min(1),
  action: RateLimitActionSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'MONITORING_ONLY']),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ApiRateLimitPolicyDto = z.infer<typeof ApiRateLimitPolicyDtoSchema>;

export const ApiUsageRecordDtoSchema = z.object({
  id: z.string().uuid(),
  routeId: z.string().uuid(),
  routePath: z.string().optional(),
  connectionId: z.string().uuid().optional(),
  tenantScope: z.string().default('PLATFORM'),
  environment: EndpointEnvironmentSchema,
  requestCount: z.number().int().min(0).default(0),
  successCount: z.number().int().min(0).default(0),
  errorCount: z.number().int().min(0).default(0),
  rateLimitedCount: z.number().int().min(0).default(0),
  recordedAt: z.string().datetime(),
  sourceStatus: z.string().default('PENDING_TELEMETRY_PIPELINE'),
  metadata: z.record(z.unknown()).default({})
});
export type ApiUsageRecordDto = z.infer<typeof ApiUsageRecordDtoSchema>;

export const IntegrationHealthDtoSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  connectionCode: z.string().optional(),
  providerName: z.string().optional(),
  healthStatus: IntegrationHealthStatusSchema,
  availabilityStatus: z.string().default('TELEMETRY_PENDING'),
  latencyMs: z.number().int().optional(),
  consecutiveFailures: z.number().int().min(0).default(0),
  lastSuccessAt: z.string().datetime().optional(),
  lastFailureAt: z.string().datetime().optional(),
  checkedAt: z.string().datetime(),
  checkSource: z.string().default('GATEWAY_PROBE'),
  metadata: z.record(z.unknown()).default({})
});
export type IntegrationHealthDto = z.infer<typeof IntegrationHealthDtoSchema>;

export const IntegrationIncidentDtoSchema = z.object({
  id: z.string().uuid(),
  incidentCode: z.string().min(2),
  connectionId: z.string().uuid().optional(),
  connectionCode: z.string().optional(),
  providerId: z.string().uuid().optional(),
  providerName: z.string().optional(),
  category: z.enum([
    'CONNECTION_FAILURE',
    'AUTHENTICATION_FAILURE',
    'RATE_LIMIT_BREACH',
    'WEBHOOK_FAILURE',
    'HL7_FAILURE',
    'FHIR_FAILURE',
    'API_VERSION_CONFLICT',
    'CERTIFICATE_EXPIRATION',
    'CREDENTIAL_EXPIRATION',
    'PROVIDER_OUTAGE'
  ]),
  severity: IntegrationIncidentSeveritySchema,
  title: z.string().min(2),
  description: z.string(),
  source: z.string(),
  status: IntegrationIncidentStatusSchema,
  assignedToId: z.string().uuid().optional(),
  assignedToEmail: z.string().optional(),
  detectedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolutionNotes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type IntegrationIncidentDto = z.infer<typeof IntegrationIncidentDtoSchema>;

export const IntegrationCredentialReferenceDtoSchema = z.object({
  id: z.string().uuid(),
  credentialCode: z.string().min(2),
  credentialType: z.enum([
    'API_KEY_REFERENCE',
    'OAUTH_CLIENT_REFERENCE',
    'MTLS_CERTIFICATE_REFERENCE',
    'WEBHOOK_SECRET_REFERENCE',
    'SERVICE_ACCOUNT_REFERENCE'
  ]),
  ownerType: z.string(),
  ownerReference: z.string(),
  status: CredentialReferenceStatusSchema,
  secretReference: z.string(), // e.g. "vault://secrets/int/partner-stjude-apikey"
  createdById: z.string().uuid().optional(),
  createdByEmail: z.string().email(),
  createdAt: z.string().datetime(),
  lastRotatedAt: z.string().datetime().optional(),
  nextRotationDue: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type IntegrationCredentialReferenceDto = z.infer<typeof IntegrationCredentialReferenceDtoSchema>;

export const IntegrationAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(2),
  connectionId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  webhookDeliveryId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  actorEmail: z.string().email(),
  action: z.string().min(2),
  operationStatus: IntegrationAuditStatusSchema,
  environment: EndpointEnvironmentSchema,
  occurredAt: z.string().datetime(),
  correlationReference: z.string(),
  evidenceReference: z.string(),
  metadata: z.record(z.unknown()).default({})
});
export type IntegrationAuditTraceDto = z.infer<typeof IntegrationAuditTraceDtoSchema>;

export const IntegrationOverviewDtoSchema = z.object({
  totalRoutesCount: z.number().int().min(0),
  activeProvidersCount: z.number().int().min(0),
  activeConnectionsCount: z.number().int().min(0),
  hl7EndpointsCount: z.number().int().min(0),
  fhirCapabilitiesCount: z.number().int().min(0),
  webhookEndpointsCount: z.number().int().min(0),
  rateLimitPoliciesCount: z.number().int().min(0),
  openIncidentsCount: z.number().int().min(0),
  pendingRotationsCount: z.number().int().min(0),
  telemetryStatus: z.string()
});
export type IntegrationOverviewDto = z.infer<typeof IntegrationOverviewDtoSchema>;

// ==========================================
// Requests
// ==========================================

export const CreateIntegrationProviderRequestSchema = z.object({
  providerCode: z.string().min(2),
  providerName: z.string().min(2),
  description: z.string().min(5),
  integrationType: IntegrationTypeSchema,
  protocol: IntegrationProtocolSchema,
  ownerEmail: z.string().email(),
  documentationReference: z.string().min(2),
  supportReference: z.string().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateIntegrationProviderRequest = z.infer<typeof CreateIntegrationProviderRequestSchema>;

export const UpdateIntegrationProviderRequestSchema = z.object({
  providerId: z.string().uuid(),
  providerName: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  status: IntegrationProviderStatusSchema.optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateIntegrationProviderRequest = z.infer<typeof UpdateIntegrationProviderRequestSchema>;

export const CreateIntegrationEndpointRequestSchema = z.object({
  endpointCode: z.string().min(2),
  providerId: z.string().uuid(),
  name: z.string().min(2),
  baseUrlReference: z.string().min(2),
  environment: EndpointEnvironmentSchema,
  authenticationMethod: AuthenticationMethodSchema,
  healthCheckPathReference: z.string().optional(),
  timeoutMs: z.number().int().min(100).default(5000),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateIntegrationEndpointRequest = z.infer<typeof CreateIntegrationEndpointRequestSchema>;

export const UpdateIntegrationEndpointRequestSchema = z.object({
  endpointId: z.string().uuid(),
  name: z.string().min(2).optional(),
  status: EndpointStatusSchema.optional(),
  timeoutMs: z.number().int().min(100).optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateIntegrationEndpointRequest = z.infer<typeof UpdateIntegrationEndpointRequestSchema>;

export const RegisterApiRouteRequestSchema = z.object({
  routeCode: z.string().min(2),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  pathPattern: z.string().min(1),
  serviceName: z.string().min(2),
  domain: z.string().min(2),
  version: z.string().default('v1'),
  environment: EndpointEnvironmentSchema.default('PRODUCTION'),
  authenticationRequired: z.boolean().default(true),
  requiredPermission: z.string().optional(),
  rateLimitPolicyId: z.string().uuid().optional(),
  description: z.string().min(5),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RegisterApiRouteRequest = z.infer<typeof RegisterApiRouteRequestSchema>;

export const UpdateApiRouteRequestSchema = z.object({
  routeId: z.string().uuid(),
  status: ApiRouteStatusSchema.optional(),
  rateLimitPolicyId: z.string().uuid().optional(),
  description: z.string().min(5).optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateApiRouteRequest = z.infer<typeof UpdateApiRouteRequestSchema>;

export const CreateApiVersionRequestSchema = z.object({
  apiName: z.string().min(2),
  version: z.string().min(1),
  releaseDate: z.string().datetime(),
  breakingChange: z.boolean().default(false),
  migrationReference: z.string().optional(),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateApiVersionRequest = z.infer<typeof CreateApiVersionRequestSchema>;

export const DeprecateApiVersionRequestSchema = z.object({
  versionId: z.string().uuid(),
  sunsetDate: z.string().datetime(),
  migrationReference: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type DeprecateApiVersionRequest = z.infer<typeof DeprecateApiVersionRequestSchema>;

export const CreateIntegrationConnectionRequestSchema = z.object({
  connectionCode: z.string().min(2),
  providerId: z.string().uuid(),
  endpointId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  tenantScope: z.string().default('PLATFORM'),
  environment: EndpointEnvironmentSchema,
  credentialReferenceId: z.string().uuid().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateIntegrationConnectionRequest = z.infer<typeof CreateIntegrationConnectionRequestSchema>;

export const TestIntegrationConnectionRequestSchema = z.object({
  connectionId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type TestIntegrationConnectionRequest = z.infer<typeof TestIntegrationConnectionRequestSchema>;

export const RegisterHL7EndpointRequestSchema = z.object({
  endpointCode: z.string().min(2),
  connectionId: z.string().uuid(),
  hl7Version: HL7VersionSchema,
  messageTypes: z.array(z.string()).min(1),
  transportProtocol: z.enum(['MLLP_TLS', 'HTTPS_REST_WRAPPED', 'SFTP_BATCH']),
  acknowledgementMode: z.enum(['ORIGINAL_MODE', 'ENHANCED_MODE']),
  facilityReference: z.string().min(2),
  routingRules: z.array(z.string()).default([]),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RegisterHL7EndpointRequest = z.infer<typeof RegisterHL7EndpointRequestSchema>;

export const RegisterFHIRCapabilityRequestSchema = z.object({
  connectionId: z.string().uuid(),
  fhirVersion: FHIRVersionSchema,
  capabilityMode: FHIRCapabilityModeSchema,
  resourceTypes: z.array(z.string()).min(1),
  searchSupported: z.boolean().default(true),
  createSupported: z.boolean().default(false),
  readSupported: z.boolean().default(true),
  updateSupported: z.boolean().default(false),
  batchSupported: z.boolean().default(true),
  capabilityReference: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RegisterFHIRCapabilityRequest = z.infer<typeof RegisterFHIRCapabilityRequestSchema>;

export const ConfigureFHIRResourceRequestSchema = z.object({
  connectionId: z.string().uuid(),
  resourceType: z.string().min(2),
  status: FHIRResourceStatusSchema,
  readEnabled: z.boolean().default(true),
  writeEnabled: z.boolean().default(false),
  searchEnabled: z.boolean().default(true),
  exportEnabled: z.boolean().default(false),
  validationMode: z.enum(['STRICT_US_CORE', 'STANDARD_R4', 'PERMISSIVE']),
  mappingReference: z.string().min(2),
  governancePolicyReference: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ConfigureFHIRResourceRequest = z.infer<typeof ConfigureFHIRResourceRequestSchema>;

export const CreateWebhookEndpointRequestSchema = z.object({
  webhookCode: z.string().min(2),
  providerId: z.string().uuid().optional(),
  connectionId: z.string().uuid().optional(),
  endpointReference: z.string().min(2),
  eventTypes: z.array(z.string()).min(1),
  authenticationMethod: AuthenticationMethodSchema,
  retryPolicy: z.string().default('EXPONENTIAL_BACKOFF_5X'),
  maxRetryAttempts: z.number().int().min(1).max(10).default(5),
  timeoutMs: z.number().int().min(100).default(5000),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateWebhookEndpointRequest = z.infer<typeof CreateWebhookEndpointRequestSchema>;

export const UpdateWebhookEndpointRequestSchema = z.object({
  webhookId: z.string().uuid(),
  status: WebhookStatusSchema.optional(),
  eventTypes: z.array(z.string()).optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateWebhookEndpointRequest = z.infer<typeof UpdateWebhookEndpointRequestSchema>;

export const RetryWebhookDeliveryRequestSchema = z.object({
  deliveryId: z.string().uuid(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RetryWebhookDeliveryRequest = z.infer<typeof RetryWebhookDeliveryRequestSchema>;

export const CreateRateLimitPolicyRequestSchema = z.object({
  policyCode: z.string().min(2),
  name: z.string().min(2),
  scopeType: RateLimitScopeSchema,
  scopeReference: z.string().default('GLOBAL'),
  limitValue: z.number().int().min(1),
  period: RateLimitPeriodSchema,
  burstLimit: z.number().int().min(1),
  action: RateLimitActionSchema,
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateRateLimitPolicyRequest = z.infer<typeof CreateRateLimitPolicyRequestSchema>;

export const UpdateRateLimitPolicyRequestSchema = z.object({
  policyId: z.string().uuid(),
  limitValue: z.number().int().min(1).optional(),
  burstLimit: z.number().int().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MONITORING_ONLY']).optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateRateLimitPolicyRequest = z.infer<typeof UpdateRateLimitPolicyRequestSchema>;

export const CreateIntegrationIncidentRequestSchema = z.object({
  connectionId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  category: z.enum([
    'CONNECTION_FAILURE',
    'AUTHENTICATION_FAILURE',
    'RATE_LIMIT_BREACH',
    'WEBHOOK_FAILURE',
    'HL7_FAILURE',
    'FHIR_FAILURE',
    'API_VERSION_CONFLICT',
    'CERTIFICATE_EXPIRATION',
    'CREDENTIAL_EXPIRATION',
    'PROVIDER_OUTAGE'
  ]),
  severity: IntegrationIncidentSeveritySchema,
  title: z.string().min(2),
  description: z.string().min(5),
  source: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateIntegrationIncidentRequest = z.infer<typeof CreateIntegrationIncidentRequestSchema>;

export const AcknowledgeIntegrationIncidentRequestSchema = z.object({
  incidentId: z.string().uuid(),
  assignedToEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type AcknowledgeIntegrationIncidentRequest = z.infer<typeof AcknowledgeIntegrationIncidentRequestSchema>;

export const ResolveIntegrationIncidentRequestSchema = z.object({
  incidentId: z.string().uuid(),
  resolutionNotes: z.string().min(5),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ResolveIntegrationIncidentRequest = z.infer<typeof ResolveIntegrationIncidentRequestSchema>;

export const RotateIntegrationCredentialReferenceRequestSchema = z.object({
  credentialCode: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type RotateIntegrationCredentialReferenceRequest = z.infer<typeof RotateIntegrationCredentialReferenceRequestSchema>;

export const GenerateIntegrationAuditReportRequestSchema = z.object({
  reportName: z.string().min(2),
  environment: EndpointEnvironmentSchema,
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type GenerateIntegrationAuditReportRequest = z.infer<typeof GenerateIntegrationAuditReportRequestSchema>;
