import React from 'react';
import type {
  PlatformUsageMetricDto,
  CrossTenantAggregatedMetricDto,
  SystemInsightDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface AnalyticsOverviewViewProps {
  usageMetrics: PlatformUsageMetricDto[];
  crossTenantAggs: CrossTenantAggregatedMetricDto[];
  insights: SystemInsightDto[];
}

export const AnalyticsOverviewView: React.FC<AnalyticsOverviewViewProps> = ({
  usageMetrics,
  crossTenantAggs,
  insights
}) => {
  const activeInsights = insights.filter((i) => !i.isAcknowledged);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Cross-Tenant Analytics & Intelligence Governance">
        <strong>Telemetry pipeline disconnected (Live Telemetry).</strong> Doc Search platform aggregates telemetry, tenant scale benchmarks, and system performance without exposing individual partner data. Zero fake revenue or clinical metrics.
      </Alert>

      {/* 4 KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {usageMetrics.map((m) => (
          <Card key={m.id} padding="md">
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
              {m.metricName}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {m.currentValue}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                {m.unit}
              </span>
            </div>
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge variant="neutral">{m.category}</Badge>
              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-warning)', fontWeight: '500' }}>
                Pending Pipeline
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Two Column Grid: Anonymized Tenant Cohorts & System Intelligence Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Anonymized Macro Cohorts */}
        <Card title="Anonymized Tenant Cohort Distribution" subtitle="Aggregate load distribution by healthcare facility scale" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {crossTenantAggs.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  borderRadius: '6px',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.875rem'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block' }}>
                    {c.anonymizedCohort}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    Sample Size: {c.sampleCount} Healthcare Facilities
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--ds-color-text-primary)' }}>
                    {c.aggregatedValue}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                    {c.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* System Intelligence Snapshot */}
        <Card title="Platform Intelligence & Anomaly Alerts" subtitle="Automated architectural recommendations and system benchmarks" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeInsights.length === 0 ? (
              <div style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.875rem' }}>
                Zero outstanding system alerts.
              </div>
            ) : (
              activeInsights.map((ins) => (
                <div
                  key={ins.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{ins.title}</strong>
                    <Badge variant={ins.severity === 'RECOMMENDATION' ? 'warning' : 'neutral'}>
                      {ins.severity}
                    </Badge>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', lineHeight: '1.5' }}>
                    {ins.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
