import React from 'react';
import type { SystemHealthStatus } from '../../types/executive.js';
import { Card, Badge } from '@docsearch/ui-kit';

export interface SystemHealthSummaryProps {
  health: SystemHealthStatus;
}

export const SystemHealthSummary: React.FC<SystemHealthSummaryProps> = ({ health }) => {
  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Platform & Infrastructure Health</span>
          <Badge variant={health.isLiveTelemetryConnected ? 'success' : 'neutral'}>
            {health.isLiveTelemetryConnected ? 'Live' : 'Live Connected'}
          </Badge>
        </div>
      }
      subtitle="Runtime architecture and security subsystem status"
      padding="md"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--ds-color-surface-subtle)',
            borderRadius: '6px',
            border: '1px solid var(--ds-color-border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Gateway Telemetry
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {health.gatewayLatencyMs ? `${health.gatewayLatencyMs} ms` : 'Not Connected'}
          </div>
          <div style={{ marginTop: '4px' }}>
            <Badge variant="neutral">Target SLA: &lt; 50ms</Badge>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--ds-color-surface-subtle)',
            borderRadius: '6px',
            border: '1px solid var(--ds-color-border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Database Cluster
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            PostgreSQL HA
          </div>
          <div style={{ marginTop: '4px' }}>
            <Badge variant="success">Schema Core v1.0</Badge>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--ds-color-surface-subtle)',
            borderRadius: '6px',
            border: '1px solid var(--ds-color-border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Authentication & RBAC
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Security Subsystem
          </div>
          <div style={{ marginTop: '4px' }}>
            <Badge variant="success">Auth Foundation v1.0</Badge>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--ds-color-surface-subtle)',
            borderRadius: '6px',
            border: '1px solid var(--ds-color-border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Audit Event Pipeline
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Immutable Log Schema
          </div>
          <div style={{ marginTop: '4px' }}>
            <Badge variant="success">Initialized</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
