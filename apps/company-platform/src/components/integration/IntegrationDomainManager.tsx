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
import { LimsAnalyzerSimulatorView } from './LimsAnalyzerSimulatorView.js';
import { DicomPacsGatewayView } from './DicomPacsGatewayView.js';
import { AbdmGatewayBridgeView } from './AbdmGatewayBridgeView.js';
import { CustomWebhookIngressBuilderView } from './CustomWebhookIngressBuilderView.js';
import { FhirBundleValidatorModal } from './FhirBundleValidatorModal.js';
import { ApiKeyVaultManagerModal } from './ApiKeyVaultManagerModal.js';
import { Tabs, Badge, Button, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'custom-webhooks'
  | 'lims-streamer'
  | 'dicom-pacs'
  | 'abdm-gateway'
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

  // Modals state
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : 'Failed to load Integration & Interoperability data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleDeprecateVersion = async (versionId: string, sunsetDate: string, reason: string) => {
    const updated = await integrationService.deprecateApiVersion({
      versionId,
      sunsetDate,
      reason,
      migrationReference: 'https://docs.docsearch.in/v2-migration',
      actorEmail: 'admin@docsearch.internal'
    });
    setApiVersions((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleTestConnection = async (connectionId: string, reason: string) => {
    const result = await integrationService.testConnection({
      connectionId,
      actorEmail: 'admin@docsearch.internal',
      reason
    });
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? {
              ...c,
              healthStatus: result.status === 'SUCCESS' ? 'HEALTHY' : 'DEGRADED',
              lastHeartbeatAt: new Date().toISOString()
            }
          : c
      )
    );
    return result;
  };

  const handleRetryWebhook = async (deliveryId: string) => {
    const retried = await integrationService.retryWebhookDelivery({
      deliveryId,
      actorEmail: 'admin@docsearch.internal',
      reason: 'Manual webhook redelivery retry'
    });
    setWebhookDeliveries((prev) => prev.map((d) => (d.id === retried.id ? retried : d)));
  };

  const handleAcknowledgeIncident = async (incidentId: string, reason: string) => {
    const updated = await integrationService.acknowledgeIncident({
      incidentId,
      actorEmail: 'admin@docsearch.internal',
      assignedToEmail: 'lead.integrations@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleResolveIncident = async (incidentId: string, resolutionNotes: string) => {
    const updated = await integrationService.resolveIncident({
      incidentId,
      actorEmail: 'admin@docsearch.internal',
      reason: 'Resolved operational integration outage',
      resolutionNotes
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleRotateCredential = async (credentialCode: string, reason: string) => {
    const updated = await integrationService.rotateCredentialReference({
      credentialCode,
      actorEmail: 'admin@docsearch.internal',
      reason
    });
    setCredentials((prev) => prev.map((c) => (c.credentialCode === updated.credentialCode ? updated : c)));
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Integration & Interoperability control plane...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Integration Workspace Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown: API Route Profile
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

  // Drilldown: Provider Profile
  if (selectedProviderId) {
    const provider = providers.find((p) => p.id === selectedProviderId);
    if (provider) {
      const providerEndpoints = endpoints.filter((e) => e.providerId === selectedProviderId);
      return (
        <IntegrationProviderProfileView
          provider={provider}
          endpoints={providerEndpoints}
          onBack={() => setSelectedProviderId(null)}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              🔌 Universal API, Integration & Healthcare Interoperability Hub
            </h1>
            <Badge variant="success">● HL7 FHIR & ABDM 2.0 Certified</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Pathology LIMS blood analyzers, DICOM PACS radiology bridge, National ABDM Ayushman Bharat gateway, and enterprise OAuth2 vault
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFhirModalOpen(true)}
            style={{
              borderColor: '#06B6D4',
              color: '#38BDF8',
              fontWeight: 800
            }}
          >
            🏥 Validate FHIR Bundle
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsApiKeyModalOpen(true)}
            style={{
              backgroundColor: '#06B6D4',
              color: '#070C16',
              fontWeight: 900
            }}
          >
            🔑 Issue API Key
          </Button>
        </div>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {successBanner}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'custom-webhooks',
            label: '⚡ Custom Webhook Builder',
            badge: <Badge variant="success">Zapier/Slack</Badge>
          },
          {
            id: 'lims-streamer',
            label: '🧪 LIMS Analyzers',
            badge: <Badge variant="success">Live Socket</Badge>
          },
          {
            id: 'dicom-pacs',
            label: '🩻 DICOM PACS',
            badge: <Badge variant="primary">Radiology</Badge>
          },
          {
            id: 'abdm-gateway',
            label: '⚡ ABDM 2.0 Gateway',
            badge: <Badge variant="success">Govt M1-M3</Badge>
          },
          {
            id: 'routes',
            label: '🌐 API Routes',
            badge: <Badge variant="neutral">{apiRoutes.length}</Badge>
          },
          {
            id: 'versions',
            label: '🏷️ Versions',
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
            label: '📑 HL7 v2.x',
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

      {activeTab === 'custom-webhooks' && (
        <CustomWebhookIngressBuilderView />
      )}

      {activeTab === 'lims-streamer' && (
        <LimsAnalyzerSimulatorView />
      )}

      {activeTab === 'dicom-pacs' && (
        <DicomPacsGatewayView />
      )}

      {activeTab === 'abdm-gateway' && (
        <AbdmGatewayBridgeView />
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

      {/* Modals */}
      <FhirBundleValidatorModal
        isOpen={isFhirModalOpen}
        onClose={() => setIsFhirModalOpen(false)}
      />

      <ApiKeyVaultManagerModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onIssueSuccess={(keyName) => {
          setSuccessBanner(`✓ API Key for "${keyName}" issued and active with IP whitelisting!`);
          setTimeout(() => setSuccessBanner(null), 5000);
        }}
      />
    </div>
  );
};
