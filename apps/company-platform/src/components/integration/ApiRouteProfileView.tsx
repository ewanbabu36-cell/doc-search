import React from 'react';
import type { ApiRouteDto } from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface ApiRouteProfileViewProps {
  route: ApiRouteDto;
  onBack: () => void;
}

export const ApiRouteProfileView: React.FC<ApiRouteProfileViewProps> = ({
  route,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Route Registry
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant={route.method === 'GET' ? 'primary' : route.method === 'POST' ? 'success' : 'warning'}>
                {route.method}
              </Badge>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)', fontFamily: 'var(--ds-font-mono)' }}>
                {route.pathPattern}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Service: {route.serviceName} | Domain: {route.domain} | Version: {route.version}
            </span>
          </div>
        </div>

        <Badge variant={route.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {route.status}
        </Badge>
      </div>

      <Alert type="info" title="API Gateway Routing Specification">
        This route is published on the Fastify API Gateway with automated token verification, RBAC authorization enforcement, and rate-limiting middleware.
      </Alert>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Card title="Route Metadata & Security Constraints" subtitle="Authentication, authorization, and rate limit bindings" padding="md">
          <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--ds-color-text-primary)' }}>
            {route.description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Authentication Required:</span>
              <Badge variant={route.authenticationRequired ? 'primary' : 'neutral'}>
                {route.authenticationRequired ? 'Mandatory JWT' : 'Public'}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Required Permission:</span>
              <code style={{ fontFamily: 'var(--ds-font-mono)' }}>{route.requiredPermission ?? 'None'}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Environment:</span>
              <Badge variant="neutral">{route.environment}</Badge>
            </div>
          </div>
        </Card>

        <Card title="Governance & Ownership" subtitle="Lead engineer and registration timestamps" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Route Code:</span>
              <code>{route.routeCode}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Lead Owner:</span>
              <span>{route.ownerEmail}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Registered At:</span>
              <span>{new Date(route.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
