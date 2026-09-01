import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface SlowTrace {
  id: string;
  timestamp: string;
  operation: string;
  service: string;
  durationMs: number;
  statusCode: number;
  traceId: string;
}

const SAMPLE_SLOW_TRACES: SlowTrace[] = [
  {
    id: 'TRACE-001',
    timestamp: 'Just now',
    operation: 'POST /v1/emr/consultations/create',
    service: 'api-gateway -> emr-engine',
    durationMs: 42,
    statusCode: 201,
    traceId: 'otel-tr-89410-b9821'
  },
  {
    id: 'TRACE-002',
    timestamp: '12 sec ago',
    operation: 'POST /v1/lims/analyzers/mllp-ingest',
    service: 'lims-daemon -> mongo-atlas',
    durationMs: 64,
    statusCode: 200,
    traceId: 'otel-tr-89411-a4729'
  },
  {
    id: 'TRACE-003',
    timestamp: '28 sec ago',
    operation: 'GET /v1/abdm/m3/consents/search',
    service: 'fhir-bridge -> abdm-gateway',
    durationMs: 98,
    statusCode: 200,
    traceId: 'otel-tr-89412-f1920'
  }
];

export const OpenTelemetryApmRadarView: React.FC = () => {
  const [traces] = useState<SlowTrace[]>(SAMPLE_SLOW_TRACES);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📊 Prometheus & OpenTelemetry Real-Time Live APM Telemetry Radar
          </h2>
          <Badge variant="success">● OpenTelemetry Agent v1.34 Active (Port 4317 gRPC)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Distributed tracing, distributed transaction waterfall, and P50/P95/P99 latency benchmarks across all services
        </p>
      </div>

      {/* APM Latency Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>P50 MEDIAN LATENCY</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>18.4 ms</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Super-fast Fastify core</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>P95 LATENCY</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>42.1 ms</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Under 50ms SLA target</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>P99 PEAK TAIL LATENCY</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>88.6 ms</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Includes AI model calls</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>NODE GC PAUSE TIME</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A855F7', marginTop: '2px' }}>1.2 ms Avg</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>V8 Young Generation Scavenge</span>
        </div>
      </div>

      {/* Traces Table */}
      <Card title="📜 Live Distributed OpenTelemetry Traces" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HTTP Operation / Span</TableHead>
                <TableHead>Microservice Route</TableHead>
                <TableHead>Span Duration</TableHead>
                <TableHead>HTTP Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>OpenTelemetry Trace ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traces.map((tr) => (
                <TableRow key={tr.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{tr.operation}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{tr.timestamp}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {tr.service}
                  </TableCell>
                  <TableCell>
                    <span style={{ color: tr.durationMs > 80 ? '#F59E0B' : '#10B981', fontWeight: 800 }}>
                      {tr.durationMs} ms
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{tr.statusCode}</Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', color: '#38BDF8', fontSize: '0.75rem' }}>
                    {tr.traceId}
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
