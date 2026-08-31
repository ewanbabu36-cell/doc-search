import React from 'react';
import type { DeveloperExperienceMetricDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert
} from '@docsearch/ui-kit';

export interface DeveloperExperienceViewProps {
  metrics: DeveloperExperienceMetricDto[];
}

export const DeveloperExperienceView: React.FC<DeveloperExperienceViewProps> = ({
  metrics
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Live Telemetry — DevEx Metrics">
        Developer Experience metrics below are simulated samples. <strong>Live platform telemetry is not connected.</strong> Historical latency averages, queue times, and build cache hit ratios are evaluated once the metrics pipeline is linked.
      </Alert>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Avg Build Duration
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              2m 22s
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Turborepo full monorepo graph
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Avg CI Pipeline Lead Time
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              4m 45s
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Commit to staging preview
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Deployment Frequency
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              4 runs / day
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Continuous deployment pace
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Pipeline Success Rate
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              96%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Zero warning strict quality gate
            </span>
          </div>
        </Card>
      </div>

      {/* Metrics Table */}
      <Card
        title="Developer Experience & Pipeline Velocity Metrics"
        subtitle="Telemetry indicators, evaluation intervals, and pipeline benchmark targets"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sample Value</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Evaluation Window</TableHead>
                <TableHead>Telemetry Status</TableHead>
                <TableHead>Recorded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{m.metricName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{m.metricType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                    {m.unit === 'MS' ? `${(m.numericValue / 1000).toFixed(1)}s` : m.numericValue}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {m.unit}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {m.evaluationPeriod}
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning">{m.sourceStatus}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(m.recordedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
