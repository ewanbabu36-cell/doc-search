import type {
  IntegrationOverviewDto,
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
  CreateIntegrationProviderRequest,
  UpdateIntegrationProviderRequest,
  CreateIntegrationEndpointRequest,
  UpdateIntegrationEndpointRequest,
  RegisterApiRouteRequest,
  UpdateApiRouteRequest,
  CreateApiVersionRequest,
  DeprecateApiVersionRequest,
  CreateIntegrationConnectionRequest,
  TestIntegrationConnectionRequest,
  RegisterHL7EndpointRequest,
  RegisterFHIRCapabilityRequest,
  ConfigureFHIRResourceRequest,
  CreateWebhookEndpointRequest,
  UpdateWebhookEndpointRequest,
  RetryWebhookDeliveryRequest,
  CreateRateLimitPolicyRequest,
  UpdateRateLimitPolicyRequest,
  CreateIntegrationIncidentRequest,
  AcknowledgeIntegrationIncidentRequest,
  ResolveIntegrationIncidentRequest,
  RotateIntegrationCredentialReferenceRequest
} from '@docsearch/api-contracts';
import {
  mockIntegrationOverview,
  mockIntegrationProviders,
  mockIntegrationEndpoints,
  mockApiRoutes,
  mockApiVersions,
  mockIntegrationConnections,
  mockHL7Endpoints,
  mockFHIRCapabilities,
  mockFHIRResourceConfigurations,
  mockWebhookEndpoints,
  mockWebhookDeliveries,
  mockApiRateLimitPolicies,
  mockApiUsageRecords,
  mockIntegrationHealth,
  mockIntegrationIncidents,
  mockIntegrationCredentials,
  mockIntegrationAuditTraces
} from './mock-integration-data.js';

export interface IIntegrationService {
  getIntegrationOverview(): Promise<IntegrationOverviewDto>;
  getProviders(): Promise<IntegrationProviderDto[]>;
  getEndpoints(): Promise<IntegrationEndpointDto[]>;
  getApiRoutes(): Promise<ApiRouteDto[]>;
  getApiVersions(): Promise<ApiVersionDto[]>;
  getConnections(): Promise<IntegrationConnectionDto[]>;
  getHL7Endpoints(): Promise<HL7EndpointDto[]>;
  getFHIRCapabilities(): Promise<FHIRCapabilityDto[]>;
  getFHIRResourceConfigurations(): Promise<FHIRResourceConfigurationDto[]>;
  getWebhookEndpoints(): Promise<WebhookEndpointDto[]>;
  getWebhookDeliveries(): Promise<WebhookDeliveryDto[]>;
  getRateLimitPolicies(): Promise<ApiRateLimitPolicyDto[]>;
  getApiUsage(): Promise<ApiUsageRecordDto[]>;
  getIntegrationHealth(): Promise<IntegrationHealthDto[]>;
  getIntegrationIncidents(): Promise<IntegrationIncidentDto[]>;
  getIntegrationCredentials(): Promise<IntegrationCredentialReferenceDto[]>;
  getIntegrationAuditTraces(): Promise<IntegrationAuditTraceDto[]>;

  // Mutations
  createProvider(req: CreateIntegrationProviderRequest): Promise<IntegrationProviderDto>;
  updateProvider(req: UpdateIntegrationProviderRequest): Promise<IntegrationProviderDto>;
  createEndpoint(req: CreateIntegrationEndpointRequest): Promise<IntegrationEndpointDto>;
  updateEndpoint(req: UpdateIntegrationEndpointRequest): Promise<IntegrationEndpointDto>;
  registerApiRoute(req: RegisterApiRouteRequest): Promise<ApiRouteDto>;
  updateApiRoute(req: UpdateApiRouteRequest): Promise<ApiRouteDto>;
  createApiVersion(req: CreateApiVersionRequest): Promise<ApiVersionDto>;
  deprecateApiVersion(req: DeprecateApiVersionRequest): Promise<ApiVersionDto>;
  createConnection(req: CreateIntegrationConnectionRequest): Promise<IntegrationConnectionDto>;
  testConnection(req: TestIntegrationConnectionRequest): Promise<{ status: string; latencyMs: number; message: string }>;
  registerHL7Endpoint(req: RegisterHL7EndpointRequest): Promise<HL7EndpointDto>;
  registerFHIRCapability(req: RegisterFHIRCapabilityRequest): Promise<FHIRCapabilityDto>;
  configureFHIRResource(req: ConfigureFHIRResourceRequest): Promise<FHIRResourceConfigurationDto>;
  createWebhookEndpoint(req: CreateWebhookEndpointRequest): Promise<WebhookEndpointDto>;
  updateWebhookEndpoint(req: UpdateWebhookEndpointRequest): Promise<WebhookEndpointDto>;
  retryWebhookDelivery(req: RetryWebhookDeliveryRequest): Promise<WebhookDeliveryDto>;
  createRateLimitPolicy(req: CreateRateLimitPolicyRequest): Promise<ApiRateLimitPolicyDto>;
  updateRateLimitPolicy(req: UpdateRateLimitPolicyRequest): Promise<ApiRateLimitPolicyDto>;
  rotateCredentialReference(req: RotateIntegrationCredentialReferenceRequest): Promise<IntegrationCredentialReferenceDto>;
  createIncident(req: CreateIntegrationIncidentRequest): Promise<IntegrationIncidentDto>;
  acknowledgeIncident(req: AcknowledgeIntegrationIncidentRequest): Promise<IntegrationIncidentDto>;
  resolveIncident(req: ResolveIntegrationIncidentRequest): Promise<IntegrationIncidentDto>;
}

export class IntegrationService implements IIntegrationService {
  private overview: IntegrationOverviewDto = { ...mockIntegrationOverview };
  private providers: IntegrationProviderDto[] = [...mockIntegrationProviders];
  private endpoints: IntegrationEndpointDto[] = [...mockIntegrationEndpoints];
  private apiRoutes: ApiRouteDto[] = [...mockApiRoutes];
  private apiVersions: ApiVersionDto[] = [...mockApiVersions];
  private connections: IntegrationConnectionDto[] = [...mockIntegrationConnections];
  private hl7Endpoints: HL7EndpointDto[] = [...mockHL7Endpoints];
  private fhirCapabilities: FHIRCapabilityDto[] = [...mockFHIRCapabilities];
  private fhirResourceConfigs: FHIRResourceConfigurationDto[] = [...mockFHIRResourceConfigurations];
  private webhookEndpoints: WebhookEndpointDto[] = [...mockWebhookEndpoints];
  private webhookDeliveries: WebhookDeliveryDto[] = [...mockWebhookDeliveries];
  private rateLimitPolicies: ApiRateLimitPolicyDto[] = [...mockApiRateLimitPolicies];
  private apiUsage: ApiUsageRecordDto[] = [...mockApiUsageRecords];
  private health: IntegrationHealthDto[] = [...mockIntegrationHealth];
  private incidents: IntegrationIncidentDto[] = [...mockIntegrationIncidents];
  private credentials: IntegrationCredentialReferenceDto[] = [...mockIntegrationCredentials];
  private auditTraces: IntegrationAuditTraceDto[] = [...mockIntegrationAuditTraces];

  async getIntegrationOverview(): Promise<IntegrationOverviewDto> {
    return {
      ...this.overview,
      totalRoutesCount: this.apiRoutes.length,
      activeProvidersCount: this.providers.filter((p) => p.status === 'ACTIVE').length,
      activeConnectionsCount: this.connections.filter((c) => c.status === 'CONNECTED').length,
      hl7EndpointsCount: this.hl7Endpoints.length,
      fhirCapabilitiesCount: this.fhirCapabilities.length,
      webhookEndpointsCount: this.webhookEndpoints.length,
      rateLimitPoliciesCount: this.rateLimitPolicies.length,
      openIncidentsCount: this.incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length
    };
  }

  async getProviders(): Promise<IntegrationProviderDto[]> {
    return [...this.providers];
  }

  async getEndpoints(): Promise<IntegrationEndpointDto[]> {
    return [...this.endpoints];
  }

  async getApiRoutes(): Promise<ApiRouteDto[]> {
    return [...this.apiRoutes];
  }

  async getApiVersions(): Promise<ApiVersionDto[]> {
    return [...this.apiVersions];
  }

  async getConnections(): Promise<IntegrationConnectionDto[]> {
    return [...this.connections];
  }

  async getHL7Endpoints(): Promise<HL7EndpointDto[]> {
    return [...this.hl7Endpoints];
  }

  async getFHIRCapabilities(): Promise<FHIRCapabilityDto[]> {
    return [...this.fhirCapabilities];
  }

  async getFHIRResourceConfigurations(): Promise<FHIRResourceConfigurationDto[]> {
    return [...this.fhirResourceConfigs];
  }

  async getWebhookEndpoints(): Promise<WebhookEndpointDto[]> {
    return [...this.webhookEndpoints];
  }

  async getWebhookDeliveries(): Promise<WebhookDeliveryDto[]> {
    return [...this.webhookDeliveries];
  }

  async getRateLimitPolicies(): Promise<ApiRateLimitPolicyDto[]> {
    return [...this.rateLimitPolicies];
  }

  async getApiUsage(): Promise<ApiUsageRecordDto[]> {
    return [...this.apiUsage];
  }

  async getIntegrationHealth(): Promise<IntegrationHealthDto[]> {
    return [...this.health];
  }

  async getIntegrationIncidents(): Promise<IntegrationIncidentDto[]> {
    return [...this.incidents];
  }

  async getIntegrationCredentials(): Promise<IntegrationCredentialReferenceDto[]> {
    return [...this.credentials];
  }

  async getIntegrationAuditTraces(): Promise<IntegrationAuditTraceDto[]> {
    return [...this.auditTraces];
  }

  async createProvider(req: CreateIntegrationProviderRequest): Promise<IntegrationProviderDto> {
    const newProv: IntegrationProviderDto = {
      id: `p0000001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      providerCode: req.providerCode,
      providerName: req.providerName,
      description: req.description,
      integrationType: req.integrationType,
      protocol: req.protocol,
      status: 'ACTIVE',
      ownerEmail: req.ownerEmail,
      documentationReference: req.documentationReference,
      supportReference: req.supportReference,
      endpointsCount: 0,
      activeConnectionsCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.providers.unshift(newProv);
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_PROVIDER_CREATED', newProv.providerCode);
    return newProv;
  }

  async updateProvider(req: UpdateIntegrationProviderRequest): Promise<IntegrationProviderDto> {
    const idx = this.providers.findIndex((p) => p.id === req.providerId);
    const existing = idx !== -1 ? this.providers[idx] : undefined;
    if (!existing) throw new Error('Provider not found');
    const updated: IntegrationProviderDto = {
      ...existing,
      providerName: req.providerName ?? existing.providerName,
      description: req.description ?? existing.description,
      status: req.status ?? existing.status,
      updatedAt: new Date().toISOString()
    };
    this.providers[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_PROVIDER_UPDATED', updated.providerCode);
    return updated;
  }

  async createEndpoint(req: CreateIntegrationEndpointRequest): Promise<IntegrationEndpointDto> {
    const prov = this.providers.find((p) => p.id === req.providerId);
    const newEp: IntegrationEndpointDto = {
      id: `ep000001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      endpointCode: req.endpointCode,
      providerId: req.providerId,
      providerName: prov?.providerName,
      name: req.name,
      baseUrlReference: req.baseUrlReference,
      environment: req.environment,
      status: 'ONLINE',
      authenticationMethod: req.authenticationMethod,
      healthCheckPathReference: req.healthCheckPathReference,
      timeoutMs: req.timeoutMs,
      retryPolicy: 'EXPONENTIAL_BACKOFF_3X',
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.endpoints.unshift(newEp);
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_ENDPOINT_CREATED', newEp.endpointCode);
    return newEp;
  }

  async updateEndpoint(req: UpdateIntegrationEndpointRequest): Promise<IntegrationEndpointDto> {
    const idx = this.endpoints.findIndex((e) => e.id === req.endpointId);
    const existing = idx !== -1 ? this.endpoints[idx] : undefined;
    if (!existing) throw new Error('Endpoint not found');
    const updated: IntegrationEndpointDto = {
      ...existing,
      name: req.name ?? existing.name,
      status: req.status ?? existing.status,
      timeoutMs: req.timeoutMs ?? existing.timeoutMs,
      updatedAt: new Date().toISOString()
    };
    this.endpoints[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_ENDPOINT_UPDATED', updated.endpointCode);
    return updated;
  }

  async registerApiRoute(req: RegisterApiRouteRequest): Promise<ApiRouteDto> {
    const newRoute: ApiRouteDto = {
      id: `r0000001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      routeCode: req.routeCode,
      method: req.method,
      pathPattern: req.pathPattern,
      serviceName: req.serviceName,
      domain: req.domain,
      version: req.version,
      environment: req.environment,
      status: 'ACTIVE',
      authenticationRequired: req.authenticationRequired,
      requiredPermission: req.requiredPermission,
      rateLimitPolicyId: req.rateLimitPolicyId,
      description: req.description,
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.apiRoutes.unshift(newRoute);
    this.recordAuditTrace(req.actorEmail, 'API_ROUTE_REGISTERED', newRoute.routeCode);
    return newRoute;
  }

  async updateApiRoute(req: UpdateApiRouteRequest): Promise<ApiRouteDto> {
    const idx = this.apiRoutes.findIndex((r) => r.id === req.routeId);
    const existing = idx !== -1 ? this.apiRoutes[idx] : undefined;
    if (!existing) throw new Error('Route not found');
    const updated: ApiRouteDto = {
      ...existing,
      status: req.status ?? existing.status,
      rateLimitPolicyId: req.rateLimitPolicyId ?? existing.rateLimitPolicyId,
      description: req.description ?? existing.description,
      updatedAt: new Date().toISOString()
    };
    this.apiRoutes[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'API_ROUTE_UPDATED', updated.routeCode);
    return updated;
  }

  async createApiVersion(req: CreateApiVersionRequest): Promise<ApiVersionDto> {
    const newVer: ApiVersionDto = {
      id: `v0000001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      apiName: req.apiName,
      version: req.version,
      status: 'ACTIVE',
      releaseDate: req.releaseDate,
      breakingChange: req.breakingChange,
      migrationReference: req.migrationReference,
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.apiVersions.unshift(newVer);
    this.recordAuditTrace(req.actorEmail, 'API_VERSION_CREATED', `${newVer.apiName} ${newVer.version}`);
    return newVer;
  }

  async deprecateApiVersion(req: DeprecateApiVersionRequest): Promise<ApiVersionDto> {
    const idx = this.apiVersions.findIndex((v) => v.id === req.versionId);
    const existing = idx !== -1 ? this.apiVersions[idx] : undefined;
    if (!existing) throw new Error('API Version not found');
    const updated: ApiVersionDto = {
      ...existing,
      status: 'DEPRECATED',
      deprecationDate: new Date().toISOString(),
      sunsetDate: req.sunsetDate,
      migrationReference: req.migrationReference,
      updatedAt: new Date().toISOString()
    };
    this.apiVersions[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'API_VERSION_DEPRECATED', `${updated.apiName} ${updated.version}`);
    return updated;
  }

  async createConnection(req: CreateIntegrationConnectionRequest): Promise<IntegrationConnectionDto> {
    const prov = this.providers.find((p) => p.id === req.providerId);
    const ep = this.endpoints.find((e) => e.id === req.endpointId);
    const newConn: IntegrationConnectionDto = {
      id: `conn0001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      connectionCode: req.connectionCode,
      providerId: req.providerId,
      providerName: prov?.providerName,
      endpointId: req.endpointId,
      endpointName: ep?.name,
      partnerId: req.partnerId,
      tenantScope: req.tenantScope,
      environment: req.environment,
      status: 'CONNECTED',
      healthStatus: 'HEALTHY',
      failureCount: 0,
      successCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.connections.unshift(newConn);
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_CONNECTION_CREATED', newConn.connectionCode);
    return newConn;
  }

  async testConnection(req: TestIntegrationConnectionRequest): Promise<{ status: string; latencyMs: number; message: string }> {
    const conn = this.connections.find((c) => c.id === req.connectionId);
    if (!conn) throw new Error('Connection not found');
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_CONNECTION_TESTED', conn.connectionCode);
    return {
      status: 'HEALTHY_PROBE_CONFIRMED',
      latencyMs: 112,
      message: 'Probe handshake completed successfully against configured endpoint reference.'
    };
  }

  async registerHL7Endpoint(req: RegisterHL7EndpointRequest): Promise<HL7EndpointDto> {
    const conn = this.connections.find((c) => c.id === req.connectionId);
    const newHl7: HL7EndpointDto = {
      id: `hl700001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      endpointCode: req.endpointCode,
      connectionId: req.connectionId,
      connectionCode: conn?.connectionCode,
      hl7Version: req.hl7Version,
      messageTypes: req.messageTypes,
      transportProtocol: req.transportProtocol,
      acknowledgementMode: req.acknowledgementMode,
      status: 'ONLINE',
      facilityReference: req.facilityReference,
      routingRules: req.routingRules,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.hl7Endpoints.unshift(newHl7);
    this.recordAuditTrace(req.actorEmail, 'HL7_ENDPOINT_REGISTERED', newHl7.endpointCode);
    return newHl7;
  }

  async registerFHIRCapability(req: RegisterFHIRCapabilityRequest): Promise<FHIRCapabilityDto> {
    const conn = this.connections.find((c) => c.id === req.connectionId);
    const newFhir: FHIRCapabilityDto = {
      id: `fhir0001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      connectionId: req.connectionId,
      connectionCode: conn?.connectionCode,
      fhirVersion: req.fhirVersion,
      capabilityMode: req.capabilityMode,
      resourceTypes: req.resourceTypes,
      searchSupported: req.searchSupported,
      createSupported: req.createSupported,
      readSupported: req.readSupported,
      updateSupported: req.updateSupported,
      deleteSupported: false,
      batchSupported: req.batchSupported,
      subscriptionSupported: false,
      status: 'ONLINE',
      capabilityReference: req.capabilityReference,
      lastVerifiedAt: new Date().toISOString(),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.fhirCapabilities.unshift(newFhir);
    this.recordAuditTrace(req.actorEmail, 'FHIR_CAPABILITY_REGISTERED', newFhir.capabilityReference);
    return newFhir;
  }

  async configureFHIRResource(req: ConfigureFHIRResourceRequest): Promise<FHIRResourceConfigurationDto> {
    const newConfig: FHIRResourceConfigurationDto = {
      id: `frc00001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      connectionId: req.connectionId,
      resourceType: req.resourceType,
      status: req.status,
      readEnabled: req.readEnabled,
      writeEnabled: req.writeEnabled,
      searchEnabled: req.searchEnabled,
      exportEnabled: req.exportEnabled,
      validationMode: req.validationMode,
      mappingReference: req.mappingReference,
      governancePolicyReference: req.governancePolicyReference,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.fhirResourceConfigs.unshift(newConfig);
    this.recordAuditTrace(req.actorEmail, 'FHIR_RESOURCE_CONFIGURED', `${req.resourceType} (${req.validationMode})`);
    return newConfig;
  }

  async createWebhookEndpoint(req: CreateWebhookEndpointRequest): Promise<WebhookEndpointDto> {
    const prov = req.providerId ? this.providers.find((p) => p.id === req.providerId) : undefined;
    const newWh: WebhookEndpointDto = {
      id: `wh000001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      webhookCode: req.webhookCode,
      providerId: req.providerId,
      providerName: prov?.providerName,
      connectionId: req.connectionId,
      endpointReference: req.endpointReference,
      eventTypes: req.eventTypes,
      status: 'ACTIVE',
      authenticationMethod: req.authenticationMethod,
      retryPolicy: req.retryPolicy,
      maxRetryAttempts: req.maxRetryAttempts,
      timeoutMs: req.timeoutMs,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.webhookEndpoints.unshift(newWh);
    this.recordAuditTrace(req.actorEmail, 'WEBHOOK_ENDPOINT_CREATED', newWh.webhookCode);
    return newWh;
  }

  async updateWebhookEndpoint(req: UpdateWebhookEndpointRequest): Promise<WebhookEndpointDto> {
    const idx = this.webhookEndpoints.findIndex((w) => w.id === req.webhookId);
    const existing = idx !== -1 ? this.webhookEndpoints[idx] : undefined;
    if (!existing) throw new Error('Webhook not found');
    const updated: WebhookEndpointDto = {
      ...existing,
      status: req.status ?? existing.status,
      eventTypes: req.eventTypes ?? existing.eventTypes,
      updatedAt: new Date().toISOString()
    };
    this.webhookEndpoints[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'WEBHOOK_ENDPOINT_UPDATED', updated.webhookCode);
    return updated;
  }

  async retryWebhookDelivery(req: RetryWebhookDeliveryRequest): Promise<WebhookDeliveryDto> {
    const del = this.webhookDeliveries.find((d) => d.id === req.deliveryId);
    if (!del) throw new Error('Delivery record not found');
    const retried: WebhookDeliveryDto = {
      ...del,
      deliveryStatus: 'DELIVERED',
      attemptNumber: del.attemptNumber + 1,
      responseStatus: 200,
      latencyMs: 128,
      deliveredAt: new Date().toISOString()
    };
    const idx = this.webhookDeliveries.findIndex((d) => d.id === req.deliveryId);
    this.webhookDeliveries[idx] = retried;
    this.recordAuditTrace(req.actorEmail, 'WEBHOOK_DELIVERY_RETRIED', retried.deliveryId);
    return retried;
  }

  async createRateLimitPolicy(req: CreateRateLimitPolicyRequest): Promise<ApiRateLimitPolicyDto> {
    const newPol: ApiRateLimitPolicyDto = {
      id: `rl000001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      policyCode: req.policyCode,
      name: req.name,
      scopeType: req.scopeType,
      scopeReference: req.scopeReference,
      limitValue: req.limitValue,
      period: req.period,
      burstLimit: req.burstLimit,
      action: req.action,
      status: 'ACTIVE',
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.rateLimitPolicies.unshift(newPol);
    this.recordAuditTrace(req.actorEmail, 'RATE_LIMIT_POLICY_CREATED', newPol.policyCode);
    return newPol;
  }

  async updateRateLimitPolicy(req: UpdateRateLimitPolicyRequest): Promise<ApiRateLimitPolicyDto> {
    const idx = this.rateLimitPolicies.findIndex((p) => p.id === req.policyId);
    const existing = idx !== -1 ? this.rateLimitPolicies[idx] : undefined;
    if (!existing) throw new Error('Rate limit policy not found');
    const updated: ApiRateLimitPolicyDto = {
      ...existing,
      limitValue: req.limitValue ?? existing.limitValue,
      burstLimit: req.burstLimit ?? existing.burstLimit,
      status: req.status ?? existing.status,
      updatedAt: new Date().toISOString()
    };
    this.rateLimitPolicies[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'RATE_LIMIT_POLICY_UPDATED', updated.policyCode);
    return updated;
  }

  async rotateCredentialReference(req: RotateIntegrationCredentialReferenceRequest): Promise<IntegrationCredentialReferenceDto> {
    const cred = this.credentials.find((c) => c.credentialCode === req.credentialCode);
    if (!cred) throw new Error('Credential reference not found');
    const rotated: IntegrationCredentialReferenceDto = {
      ...cred,
      lastRotatedAt: new Date().toISOString(),
      nextRotationDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
    const idx = this.credentials.findIndex((c) => c.credentialCode === req.credentialCode);
    this.credentials[idx] = rotated;
    this.recordAuditTrace(req.actorEmail, 'CREDENTIAL_REFERENCE_ROTATED', rotated.credentialCode);
    return rotated;
  }

  async createIncident(req: CreateIntegrationIncidentRequest): Promise<IntegrationIncidentDto> {
    const newInc: IntegrationIncidentDto = {
      id: `inc00001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      incidentCode: `INC-INT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.incidents.length + 1).padStart(2, '0')}`,
      connectionId: req.connectionId,
      providerId: req.providerId,
      category: req.category,
      severity: req.severity,
      title: req.title,
      description: req.description,
      source: req.source,
      status: 'OPEN',
      detectedAt: new Date().toISOString(),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.incidents.unshift(newInc);
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_INCIDENT_CREATED', newInc.incidentCode);
    return newInc;
  }

  async acknowledgeIncident(req: AcknowledgeIntegrationIncidentRequest): Promise<IntegrationIncidentDto> {
    const idx = this.incidents.findIndex((i) => i.id === req.incidentId);
    const existing = idx !== -1 ? this.incidents[idx] : undefined;
    if (!existing) throw new Error('Incident not found');
    const updated: IntegrationIncidentDto = {
      ...existing,
      status: 'INVESTIGATING',
      assignedToEmail: req.assignedToEmail,
      acknowledgedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_INCIDENT_ACKNOWLEDGED', updated.incidentCode);
    return updated;
  }

  async resolveIncident(req: ResolveIntegrationIncidentRequest): Promise<IntegrationIncidentDto> {
    const idx = this.incidents.findIndex((i) => i.id === req.incidentId);
    const existing = idx !== -1 ? this.incidents[idx] : undefined;
    if (!existing) throw new Error('Incident not found');
    const updated: IntegrationIncidentDto = {
      ...existing,
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolutionNotes: req.resolutionNotes,
      updatedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    this.recordAuditTrace(req.actorEmail, 'INTEGRATION_INCIDENT_RESOLVED', updated.incidentCode);
    return updated;
  }

  private recordAuditTrace(actorEmail: string, action: string, evidenceRef: string) {
    const trace: IntegrationAuditTraceDto = {
      id: `tr000001-0000-0000-0000-${String(Date.now()).slice(-12)}`,
      traceId: `TR-INT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.auditTraces.length + 1).padStart(3, '0')}`,
      actorEmail,
      action,
      operationStatus: 'SUCCESS',
      environment: 'PRODUCTION',
      occurredAt: new Date().toISOString(),
      correlationReference: `CORR-${action}-${Date.now()}`,
      evidenceReference: evidenceRef,
      metadata: {}
    };
    this.auditTraces.unshift(trace);
  }
}

export const integrationService = new IntegrationService();
