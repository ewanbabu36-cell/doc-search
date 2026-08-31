import React from 'react';
import type { ApiTelemetryTimeSeriesDto } from '@docsearch/api-contracts';
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

export interface ApiTelemetryViewProps {
  telemetrySeries: ApiTelemetryTimeSeriesDto[];
}

export const ApiTelemetryView: React.FC<ApiTelemetryViewProps> = ({
  telemetrySeries
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Benchmark summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Card title="Fastify Gateway Performance Benchmark" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Target SLA Response:</span>
              <Badge variant="success">&lt; 50ms P95</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Observed Gateway P95:</span>
              <strong>28.4 ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Gateway Error Budget:</span>
              <Badge variant="success">99.99% Availability</Badge>
            </div>
          </div>
        </Card>

        <Card title="Interoperability Gateway Security" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Tenant Boundary Enforcement:</span>
              <Badge variant="success">Active on All Routes</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>FHIR Payload Validation:</span>
              <Badge variant="success">Strict Zod Contract</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Audit Telemetry Ingestion:</span>
              <Badge variant="success">Asynchronous Stream</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Gateway Telemetry Table */}
      <Card
        title="Gateway Ingress / Egress Telemetry Log"
        subtitle="Recent sampling windows of Fastify gateway endpoint throughput and latencies"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sampling Timestamp</TableHead>
                <TableHead>Endpoint Category</TableHead>
                <TableHead>Throughput Estimate</TableHead>
                <TableHead>P95 Latency</TableHead>
                <TableHead>Error Rate</TableHead>
                <TableHead>Telemetry Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {telemetrySeries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No telemetry records sampled.
                  </TableCell>
                </TableRow>
              ) : (
                telemetrySeries.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{t.endpointCategory}</strong>
                    </TableCell>
                    <TableCell style={{ fontWeight: '500' }}>
                      {t.requestCountEstimate.toLocaleString()} req
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.p95LatencyMs < 40 ? 'success' : 'warning'}>
                        {t.p95LatencyMs} ms
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {t.errorRatePercent}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">Sample Preview</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
