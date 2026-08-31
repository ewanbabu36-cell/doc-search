import React, { useState, useEffect } from 'react';
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
  IntegrationHealthDto,
  IntegrationIncidentDto,
  IntegrationCredentialReferenceDto,
  IntegrationAuditTraceDto
} from '@docsearch/api-contracts';
import { integrationService } from '../../services/integration-service.js';
import { IntegrationOverviewView } from './IntegrationOverviewView.js';
import { ApiRouteRegistryView } from './ApiRouteRegistryView.js';
import { ApiRouteProfileView } from './ApiRouteProfileView.js';
import { ApiVersionManagementView } from './ApiVersionManagementView.js';
import { IntegrationProviderListView } from './IntegrationProviderListView.js';
import { IntegrationProviderProfileView } from './IntegrationProviderProfileView.js';
import { IntegrationConnectionView } from './IntegrationConnectionView.js';
import { HL7InteroperabilityView } from './HL7InteroperabilityView.js';
import { FHIRInteroperabilityView } from './FHIRInteroperabilityView.js';
import { WebhookCenterView } from './WebhookCenterView.js';
import { ApiRateLimitView } from './ApiRateLimitView.js';
import { IntegrationHealthView } from './IntegrationHealthView.js';
import { IntegrationIncidentCenterView } from './IntegrationIncidentCenterView.js';
import { IntegrationCredentialLifecycleView } from './IntegrationCredentialLifecycleView.js';
import { IntegrationAuditTraceView } from './IntegrationAuditTraceView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'routes'
  | 'versions'
  | 'providers'
  | 'connections'
  | 'hl7'
  | 'fhir'
  | 'webhooks'
  | 'rate-limits'
  | 'health'
  | 'incidents'
  | 'credentials'
  | 'audit';

export const IntegrationDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [overview, setOverview] = useState<IntegrationOverviewDto | null>(null);
  const [providers, setProviders] = useState<IntegrationProviderDto[]>([]);
  const [endpoints, setEndpoints] = useState<IntegrationEndpointDto[]>([]);
  const [apiRoutes, setApiRoutes] = useState<ApiRouteDto[]>([]);
  const [apiVersions, setApiVersions] = useState<ApiVersionDto[]>([]);
  const [connections, setConnections] = useState<IntegrationConnectionDto[]>([]);
  const [hl7Endpoints, setHl7Endpoints] = useState<HL7EndpointDto[]>([]);
  const [fhirCapabilities, setFhirCapabilities] = useState<FHIRCapabilityDto[]>([]);
  const [fhirResourceConfigs, setFhirResourceConfigs] = useState<FHIRResourceConfigurationDto[]>([]);
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpointDto[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDeliveryDto[]>([]);
  const [rateLimitPolicies, setRateLimitPolicies] = useState<ApiRateLimitPolicyDto[]>([]);
  const [healthRecords, setHealthRecords] = useState<IntegrationHealthDto[]>([]);
  const [incidents, setIncidents] = useState<IntegrationIncidentDto[]>([]);
  const [credentials, setCredentials] = useState<IntegrationCredentialReferenceDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<IntegrationAuditTraceDto[]>([]);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        providersRes,
        endpointsRes,
        routesRes,
        versionsRes,
        connectionsRes,
        hl7Res,
        fhirRes,
        fhirConfigRes,
        webhooksRes,
        deliveriesRes,
        rateLimitsRes,
        healthRes,
        incidentsRes,
        credentialsRes,
        tracesRes
      ] = await Promise.all([
        integrationService.getIntegrationOverview(),
        integrationService.getProviders(),
        integrationService.getEndpoints(),
        integrationService.getApiRoutes(),
        integrationService.getApiVersions(),
        integrationService.getConnections(),
        integrationService.getHL7Endpoints(),
        integrationService.getFHIRCapabilities(),
        integrationService.getFHIRResourceConfigurations(),
        integrationService.getWebhookEndpoints(),
        integrationService.getWebhookDeliveries(),
        integrationService.getRateLimitPolicies(),
        integrationService.getIntegrationHealth(),
        integrationService.getIntegrationIncidents(),
        integrationService.getIntegrationCredentials(),
        integrationService.getIntegrationAuditTraces()
      ]);
      setOverview(overviewRes);
      setProviders(providersRes);
      setEndpoints(endpointsRes);
      setApiRoutes(routesRes);
      setApiVersions(versionsRes);
      setConnections(connectionsRes);
      setHl7Endpoints(hl7Res);
      setFhirCapabilities(fhirRes);
      setFhirResourceConfigs(fhirConfigRes);
      setWebhookEndpoints(webhooksRes);
      setWebhookDeliveries(deliveriesRes);
      setRateLimitPolicies(rateLimitsRes);
      setHealthRecords(healthRes);
      setIncidents(incidentsRes);
      setCredentials(credentialsRes);
      setAuditTraces(tracesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integration control plane data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleTestConnection = async (connectionId: string, reason: string) => {
    const result = await integrationService.testConnection({
      connectionId,
      actorEmail: 'integration.lead@docsearch.internal',
      reason
    });
    return result;
  };

  const handleDeprecateVersion = async (
    versionId: string,
    sunsetDate: string,
    migrationReference: string,
    reason: string
  ) => {
    const updated = await integrationService.deprecateApiVersion({
      versionId,
      sunsetDate,
      migrationReference,
      actorEmail: 'integration.lead@docsearch.internal',
      reason
    });
    setApiVersions((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleRetryWebhook = async (deliveryId: string, reason: string) => {
    const retried = await integrationService.retryWebhookDelivery({
      deliveryId,
      actorEmail: 'integration.lead@docsearch.internal',
      reason
    });
    setWebhookDeliveries((prev) => prev.map((d) => (d.id === retried.id ? retried : d)));
  };

  const handleAcknowledgeIncident = async (incidentId: string, assignedToEmail: string, reason: string) => {
    const updated = await integrationService.acknowledgeIncident({
      incidentId,
      assignedToEmail,
      actorEmail: 'integration.lead@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleResolveIncident = async (incidentId: string, resolutionNotes: string, reason: string) => {
    const updated = await integrationService.resolveIncident({
      incidentId,
      resolutionNotes,
      actorEmail: 'integration.lead@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleRotateCredential = async (credentialCode: string, reason: string) => {
    const rotated = await integrationService.rotateCredentialReference({
      credentialCode,
      actorEmail: 'integration.lead@docsearch.internal',
      reason
    });
    setCredentials((prev) => prev.map((c) => (c.credentialCode === rotated.credentialCode ? rotated : c)));
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading API / Integration / Interoperability control plane...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Integration Workspace Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Route profile drilldown
  if (selectedRouteId) {
    const route = apiRoutes.find((r) => r.id === selectedRouteId);
    if (route) {
      return (
        <ApiRouteProfileView
          route={route}
          onBack={() => setSelectedRouteId(null)}
        />
      );
    }
  }

  // Provider profile drilldown
  if (selectedProviderId) {
    const prov = providers.find((p) => p.id === selectedProviderId);
    if (prov) {
      return (
        <IntegrationProviderProfileView
          provider={prov}
          endpoints={endpoints.filter((e) => e.providerId === prov.id)}
          onBack={() => setSelectedProviderId(null)}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              API / Integration / Interoperability
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Fastify Gateway route registry, EHR integrations, HL7 v2 / FHIR R4 bridges, webhook center, and secret reference governance
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'routes',
            label: '🛣️ API Gateway',
            badge: <Badge variant="neutral">{apiRoutes.length}</Badge>
          },
          {
            id: 'versions',
            label: '📦 API Versions',
            badge: <Badge variant="neutral">{apiVersions.length}</Badge>
          },
          {
            id: 'providers',
            label: '🏢 Providers',
            badge: <Badge variant="neutral">{providers.length}</Badge>
          },
          {
            id: 'connections',
            label: '🔗 Connections',
            badge: <Badge variant="neutral">{connections.length}</Badge>
          },
          {
            id: 'hl7',
            label: '🏥 HL7 v2 MLLP',
            badge: <Badge variant="neutral">{hl7Endpoints.length}</Badge>
          },
          {
            id: 'fhir',
            label: '🔥 FHIR R4 Bridge',
            badge: <Badge variant="neutral">{fhirCapabilities.length}</Badge>
          },
          {
            id: 'webhooks',
            label: '⚡ Webhooks',
            badge: <Badge variant="neutral">{webhookEndpoints.length}</Badge>
          },
          {
            id: 'rate-limits',
            label: '⏱️ Rate Limits',
            badge: <Badge variant="neutral">{rateLimitPolicies.length}</Badge>
          },
          {
            id: 'health',
            label: '🩺 Health Probes',
            badge: <Badge variant="neutral">{healthRecords.length}</Badge>
          },
          {
            id: 'incidents',
            label: '⚠️ Incidents',
            badge: <Badge variant={incidents.filter((i) => i.status === 'OPEN').length > 0 ? 'danger' : 'neutral'}>{incidents.length}</Badge>
          },
          {
            id: 'credentials',
            label: '🔑 Secret References',
            badge: <Badge variant={credentials.filter((c) => c.status === 'PENDING_ROTATION').length > 0 ? 'warning' : 'neutral'}>{credentials.length}</Badge>
          },
          {
            id: 'audit',
            label: '🔒 Audit Traces',
            badge: <Badge variant="neutral">{auditTraces.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <IntegrationOverviewView
          overview={overview}
          providers={providers}
          incidents={incidents}
        />
      )}

      {activeTab === 'routes' && (
        <ApiRouteRegistryView
          routes={apiRoutes}
          onSelectRoute={(id) => setSelectedRouteId(id)}
        />
      )}

      {activeTab === 'versions' && (
        <ApiVersionManagementView
          versions={apiVersions}
          onDeprecateVersion={handleDeprecateVersion}
        />
      )}

      {activeTab === 'providers' && (
        <IntegrationProviderListView
          providers={providers}
          onSelectProvider={(id) => setSelectedProviderId(id)}
        />
      )}

      {activeTab === 'connections' && (
        <IntegrationConnectionView
          connections={connections}
          onTestConnection={handleTestConnection}
        />
      )}

      {activeTab === 'hl7' && (
        <HL7InteroperabilityView hl7Endpoints={hl7Endpoints} />
      )}

      {activeTab === 'fhir' && (
        <FHIRInteroperabilityView
          capabilities={fhirCapabilities}
          resourceConfigs={fhirResourceConfigs}
        />
      )}

      {activeTab === 'webhooks' && (
        <WebhookCenterView
          endpoints={webhookEndpoints}
          deliveries={webhookDeliveries}
          onRetryDelivery={handleRetryWebhook}
        />
      )}

      {activeTab === 'rate-limits' && (
        <ApiRateLimitView policies={rateLimitPolicies} />
      )}

      {activeTab === 'health' && (
        <IntegrationHealthView healthRecords={healthRecords} />
      )}

      {activeTab === 'incidents' && (
        <IntegrationIncidentCenterView
          incidents={incidents}
          onAcknowledgeIncident={handleAcknowledgeIncident}
          onResolveIncident={handleResolveIncident}
        />
      )}

      {activeTab === 'credentials' && (
        <IntegrationCredentialLifecycleView
          credentials={credentials}
          onRotateCredential={handleRotateCredential}
        />
      )}

      {activeTab === 'audit' && (
        <IntegrationAuditTraceView auditTraces={auditTraces} />
      )}
    </div>
  );
};
