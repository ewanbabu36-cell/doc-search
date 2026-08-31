import React from 'react';
import type { TrendDataPoint } from '../../types/executive.js';
import { Card, Badge } from '@docsearch/ui-kit';

export interface TrendAnalyticsProps {
  trends: TrendDataPoint[];
}

export const TrendAnalytics: React.FC<TrendAnalyticsProps> = ({ trends }) => {
  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Platform Scaling & Usage Velocity</span>
          <Badge variant="neutral">Target / Preview</Badge>
        </div>
      }
      subtitle="Quarterly tenant expansion and aggregated API throughput (No live telemetry connected)"
      padding="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${trends.length}, 1fr)`,
            gap: '12px',
            alignItems: 'flex-end',
            minHeight: '120px',
            paddingTop: '20px',
            borderBottom: '1px solid var(--ds-color-border-subtle)'
          }}
        >
          {trends.map((pt) => {
            return (
              <div
                key={pt.period}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--ds-color-text-muted)' }}>
                  {pt.apiRequestsMillions > 0 ? `${pt.apiRequestsMillions}M req` : '0 req'}
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: '12px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    border: '1px dashed var(--ds-color-border)',
                    borderRadius: '4px 4px 0 0'
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--ds-color-text-muted)' }}>
                  {pt.period}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--ds-color-text-muted)'
          }}
        >
          <span>Live Telemetry: Offline</span>
          <span>Target baseline will populate as telemetry aggregates</span>
        </div>
      </div>
    </Card>
  );
};
