import React from 'react';
import type { IntegrationProviderDto, IntegrationEndpointDto } from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface IntegrationProviderProfileViewProps {
  provider: IntegrationProviderDto;
  endpoints: IntegrationEndpointDto[];
  onBack: () => void;
}

export const IntegrationProviderProfileView: React.FC<IntegrationProviderProfileViewProps> = ({
  provider,
  endpoints,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Providers
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {provider.providerCode}
              </code>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {provider.providerName}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Type: {provider.integrationType} | Protocol: {provider.protocol} | Lead: {provider.ownerEmail}
            </span>
          </div>
        </div>

        <Badge variant={provider.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {provider.status}
        </Badge>
      </div>

      <Alert type="info" title="External System Adapter Specification">
        Doc Search manages provider endpoints, connection states, and retry policies while isolating all secret references in secure external vaults.
      </Alert>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Card title="Provider Overview & Reference Specs" subtitle="Technical narrative and documentation pointers" padding="md">
          <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--ds-color-text-primary)' }}>
            {provider.description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Documentation: </span>
              <code style={{ fontFamily: 'var(--ds-font-mono)' }}>{provider.documentationReference}</code>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Support Channel: </span>
              <span>{provider.supportReference ?? 'Standard Platform Ops'}</span>
            </div>
          </div>
        </Card>

        <Card title="Registered Endpoints" subtitle="Base URL references and communication environments" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {endpoints.length === 0 ? (
              <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>No endpoints registered for this provider.</span>
            ) : (
              endpoints.map((ep) => (
                <div
                  key={ep.id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{ep.name}</strong>
                    <Badge variant="neutral">{ep.environment}</Badge>
                  </div>
                  <code style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>{ep.baseUrlReference}</code>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                    Auth: {ep.authenticationMethod} | Timeout: {ep.timeoutMs}ms
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
