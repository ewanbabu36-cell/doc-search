import React from 'react';
import type { PlatformUsageMetricDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface PlatformUsageViewProps {
  metrics: PlatformUsageMetricDto[];
}

export const PlatformUsageView: React.FC<PlatformUsageViewProps> = ({ metrics }) => {
  return (
    <Card
      title="Platform Usage & Operations Telemetry"
      subtitle="Aggregated platform resource utilization, tenant growth benchmarks, and database throughput"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric Identifier</TableHead>
              <TableHead>Metric Category</TableHead>
              <TableHead>Current Metric Value</TableHead>
              <TableHead>Sampling Granularity</TableHead>
              <TableHead>Telemetry Status</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No usage metrics available.
                </TableCell>
              </TableRow>
            ) : (
              metrics.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{m.metricName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        {m.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{m.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--ds-color-text-primary)' }}>
                        {m.currentValue}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        {m.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{m.granularity}</TableCell>
                  <TableCell>
                    <Badge variant="warning">Sample Preview</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.trendDirection === 'UP'
                          ? 'success'
                          : m.trendDirection === 'DOWN'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {m.trendDirection}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
