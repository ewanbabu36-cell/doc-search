import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

interface DetailedHealthTelemetry {
  status: string;
  database: {
    connected: boolean;
    latencyMs: number;
    pool?: Record<string, any>;
  };
  circuitBreakers: Record<string, { state: string; failureCount?: number; successCount?: number; lastFailureTime?: string }>;
  cache?: Record<string, any>;
  memory?: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  uptimeSeconds: number;
  timestamp: string;
}

interface ReliabilityProbeCheck {
  id: string;
  name: string;
  targetComponent: string;
  probeMethod: string;
  targetSla: string;
  endpoint: string;
}

const LIVE_PROBES: ReliabilityProbeCheck[] = [
  {
    id: 'PROBE-PG-HEALTH',
    name: 'PostgreSQL 18.4 Connection & Query Latency Probe',
    targetComponent: 'Primary PostgreSQL Database Pool',
    probeMethod: 'Live SELECT 1 Round-Trip & Pool Saturation Inspection',
    targetSla: '< 100 ms DB RTT',
    endpoint: '/api/v1/health/detailed'
  },
  {
    id: 'PROBE-AUDIT-HASH',
    name: 'Immutable SHA-256 Audit Ledger Chain Verification',
    targetComponent: 'Audit Integrity Engine (audit_events)',
    probeMethod: 'Cryptographic Hash Chain Continuity Check',
    targetSla: '0 Broken Links',
    endpoint: '/api/v1/company/reliability/audit/verify-ledger'
  },
  {
    id: 'PROBE-CIRCUITS',
    name: 'Distributed Circuit Breakers & Cache Health Check',
    targetComponent: 'API Gateway Circuit Breaker Registry & Cache',
    probeMethod: 'Live Telemetry Inspection across Open/Half-Open Circuits',
    targetSla: '0 OPEN Circuits',
    endpoint: '/api/v1/health/detailed'
  }
];

export const ChaosEngineeringSimulatorView: React.FC = () => {
  const [telemetry, setTelemetry] = useState<DetailedHealthTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProbe, setActiveProbe] = useState<string | null>(null);
  const [probeLog, setProbeLog] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await apiRequest<DetailedHealthTelemetry>('/api/v1/health/detailed');
    if (res.success && res.data) {
      setTelemetry(res.data);
    } else if (res.data) {
      setTelemetry(res.data);
    } else {
      setErrorMsg(res.error?.message || 'Unable to query /api/v1/health/detailed');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  const handleRunProbe = async (probe: ReliabilityProbeCheck) => {
    setActiveProbe(probe.id);
    setProbeLog(null);
    setErrorMsg(null);
    try {
      if (probe.id === 'PROBE-AUDIT-HASH') {
        const res = await apiRequest<any>(probe.endpoint, { method: 'POST', body: JSON.stringify({}) });
        if (res.success && res.data) {
          setProbeLog(
            `Audit Ledger Probe [${res.data.status || 'VERIFIED'}]: checked=${res.data.totalChecked ?? res.data.recordsVerified ?? 0}, invalid=${res.data.tamperedCount ?? res.data.brokenLinks ?? 0}.`
          );
        } else {
          setErrorMsg(res.error?.message || 'Audit hash verification probe failed.');
        }
      } else {
        const started = performance.now();
        const res = await apiRequest<DetailedHealthTelemetry>(probe.endpoint);
        const rttMs = Math.round(performance.now() - started);
        if (res.success && res.data) {
          setTelemetry(res.data);
          setProbeLog(
            `Live Probe "${probe.name}" completed in ${rttMs}ms (HTTP 200): status=${res.data.status}, dbConnected=${res.data.database.connected}, dbLatency=${res.data.database.latencyMs}ms.`
          );
        } else {
          setErrorMsg(res.error?.message || `Probe failed with error`);
        }
      }
    } finally {
      setActiveProbe(null);
    }
  };

  const circuitEntries = Object.entries(telemetry?.circuitBreakers || {});
  const openCircuits = circuitEntries.filter(([, c]) => c.state === 'OPEN').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              Infrastructure Resiliency &amp; Live Diagnostics Console
            </h2>
            <Badge variant={telemetry?.status === 'HEALTHY' ? 'success' : 'warning'}>
              {loading ? 'Probing...' : telemetry?.status || 'UNKNOWN'}
            </Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time PostgreSQL 18.4 connectivity, circuit-breaker telemetry &amp; cryptographic audit chain verification. Full chaos fault-injection runs in the CI reliability suite.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={loadTelemetry} disabled={loading}>
          Refresh Telemetry
        </Button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.875rem', fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}

      {probeLog && (
        <div style={{ backgroundColor: '#020617', border: '1.5px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 700 }}>
          {probeLog}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>POSTGRESQL DB LATENCY</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: telemetry?.database.connected ? '#10B981' : '#EF4444', marginTop: '2px' }}>
            {telemetry ? `${telemetry.database.latencyMs} ms` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            Status: {telemetry?.database.connected ? 'CONNECTED' : 'UNREACHABLE'}
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>CIRCUIT BREAKERS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: openCircuits === 0 ? '#38BDF8' : '#EF4444', marginTop: '2px' }}>
            {openCircuits} OPEN / {circuitEntries.length} TOTAL
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
            Gateway memory heap: {telemetry?.memory?.heapUsedMb ?? 0} MB
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>API GATEWAY UPTIME</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>
            {telemetry ? `${Math.round(telemetry.uptimeSeconds)}s` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
            Last Sample: {telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : '—'}
          </span>
        </div>
      </div>

      <Card title="Live Verification &amp; Resiliency Probes" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diagnostic Probe</TableHead>
                <TableHead>Target Component</TableHead>
                <TableHead>Verification Method</TableHead>
                <TableHead>Target SLA</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Run Live Check</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LIVE_PROBES.map((probe) => (
                <TableRow key={probe.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{probe.name}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{probe.targetComponent}</TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8' }}>{probe.probeMethod}</TableCell>
                  <TableCell style={{ color: '#10B981', fontWeight: 700 }}>{probe.targetSla}</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button size="sm" variant="primary" disabled={activeProbe === probe.id} onClick={() => handleRunProbe(probe)}>
                      {activeProbe === probe.id ? 'Running...' : 'Execute Probe'}
                    </Button>
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
