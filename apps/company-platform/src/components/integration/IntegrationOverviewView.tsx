import React from 'react';
import type {
  IntegrationOverviewDto,
  IntegrationProviderDto,
  IntegrationIncidentDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface IntegrationOverviewViewProps {
  overview: IntegrationOverviewDto;
  providers: IntegrationProviderDto[];
  incidents: IntegrationIncidentDto[];
}

export const IntegrationOverviewView: React.FC<IntegrationOverviewViewProps> = ({
  overview,
  providers,
  incidents
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Live Telemetry & Telemetry Disclaimers */}
      <Alert type="info" title="Live Telemetry — Live Telemetry">
        {overview.telemetryStatus} Live traffic metrics, real-time uptime, and external clinical handshakes represent sandbox simulations and control-plane metadata.
      </Alert>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)' }}>
              API GATEWAY ROUTES
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {overview.totalRoutesCount}
              </span>
              <Badge variant="primary">Fastify Gateway</Badge>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
              Configured REST & FHIR Endpoints
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)' }}>
              ACTIVE INTEGRATIONS
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {overview.activeProvidersCount}
              </span>
              <Badge variant="success">{overview.activeConnectionsCount} Connections</Badge>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
              EHR, Billing, Lab & Alert Providers
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)' }}>
              HL7 & FHIR CAPABILITIES
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {overview.hl7EndpointsCount + overview.fhirCapabilitiesCount}
              </span>
              <Badge variant="neutral">Interoperability</Badge>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
              {overview.hl7EndpointsCount} HL7 MLLP | {overview.fhirCapabilitiesCount} FHIR R4
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)' }}>
              OPEN INCIDENTS
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: overview.openIncidentsCount > 0 ? 'var(--ds-color-warning)' : 'var(--ds-color-text-primary)' }}>
                {overview.openIncidentsCount}
              </span>
              <Badge variant={overview.openIncidentsCount > 0 ? 'warning' : 'success'}>
                {overview.openIncidentsCount > 0 ? 'Triage Active' : 'All Clear'}
              </Badge>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
              {overview.pendingRotationsCount} Credential Rotations Due
            </span>
          </div>
        </Card>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Providers Summary */}
        <Card title="Registered Integration Providers" subtitle="Active EHR, clearinghouse, and gateway connections" padding="none">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
            {providers.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-primary)', display: 'block' }}>
                    {p.providerName}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    Type: {p.integrationType} | Protocol: {p.protocol}
                  </span>
                </div>
                <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Incident Watch */}
        <Card title="Integration Incidents & Health Feed" subtitle="Telemetry anomalies, rate-limit breaches, and circuit breaks" padding="none">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
            {incidents.length === 0 ? (
              <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Zero open integration incidents.</span>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {inc.incidentCode}
                    </code>
                    <Badge variant={inc.severity === 'CRITICAL' ? 'danger' : inc.severity === 'HIGH' ? 'warning' : 'neutral'}>
                      {inc.severity}
                    </Badge>
                  </div>
                  <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                    {inc.title}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    Detected: {new Date(inc.detectedAt).toLocaleString()} | Status: {inc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
