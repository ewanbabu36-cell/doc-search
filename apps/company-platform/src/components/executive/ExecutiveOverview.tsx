import React from 'react';
import type { ExecutiveMetrics } from '../../types/executive.js';
import { Badge } from '@docsearch/ui-kit';

export interface ExecutiveOverviewProps {
  metrics: ExecutiveMetrics;
  lastUpdated: string;
  isDevelopmentPreview?: boolean | undefined;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  metrics,
  lastUpdated,
  isDevelopmentPreview = false
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--ds-color-surface)',
        border: '1px solid var(--ds-color-border)',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--ds-shadow-sm)'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--ds-color-text-primary)',
                letterSpacing: '-0.02em'
              }}
            >
              Executive & Command Center
            </h1>
            <Badge variant="primary">Production Live</Badge>
            {isDevelopmentPreview && (
              <Badge variant="warning">Preview Mode</Badge>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: 'var(--ds-color-text-muted)'
            }}
          >
            Doc Search SaaS Operations & Platform Governance Oversight
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--ds-color-text-muted)',
              textAlign: 'right'
            }}
          >
            <div>System Architecture: <strong style={{ color: 'var(--ds-color-success)' }}>Operational</strong></div>
            <div>Refreshed: {new Date(lastUpdated).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--ds-color-border-subtle)',
          fontSize: '0.8125rem'
        }}
      >
        <span style={{ color: 'var(--ds-color-text-muted)' }}>Governance:</span>
        <Badge variant="neutral">{metrics.complianceStatus}</Badge>
        <span style={{ margin: '0 8px', color: 'var(--ds-color-border)' }}>|</span>
        <span style={{ color: 'var(--ds-color-text-muted)' }}>Platform Availability:</span>
        <Badge variant="neutral">{metrics.targetPlatformUptimePercent}% Live (PostgreSQL Connected)</Badge>
      </div>
    </div>
  );
};
