import React from 'react';
import type { OperationalKpi } from '../../types/executive.js';
import { Card, Badge } from '@docsearch/ui-kit';

export interface KpiSummaryProps {
  kpis: OperationalKpi[];
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ kpis }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}
    >
      {kpis.map((kpi) => (
        <Card key={kpi.id} padding="md" hoverable>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--ds-color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <span>{kpi.label}</span>
              {kpi.trend !== 'neutral' && (
                <Badge variant={kpi.trend === 'up' ? 'success' : 'danger'}>
                  {kpi.trend === 'up' ? '▲' : '▼'} {kpi.trendPercent}%
                </Badge>
              )}
            </div>

            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--ds-color-text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              {kpi.value}
            </div>

            {kpi.subtext && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--ds-color-text-muted)'
                }}
              >
                {kpi.subtext}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
