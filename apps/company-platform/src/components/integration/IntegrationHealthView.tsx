import React from 'react';
import type { IntegrationHealthDto } from '@docsearch/api-contracts';
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

export interface IntegrationHealthViewProps {
  healthRecords: IntegrationHealthDto[];
}

export const IntegrationHealthView: React.FC<IntegrationHealthViewProps> = ({
  healthRecords
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Integration Health Probe Status">
        Automated health checks run asynchronous synthetic handshakes every 30 seconds against partner endpoints. <strong>Uptime SLA calculation is deferred to the connected telemetry pipeline.</strong>
      </Alert>

      <Card
        title="Integration Connection Health & Availability Probes"
        subtitle="Socket latency, failure counters, and synthetic handshake status"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connection Code</TableHead>
                <TableHead>Integration Provider</TableHead>
                <TableHead>Health Status</TableHead>
                <TableHead>Availability State</TableHead>
                <TableHead>Probe Latency</TableHead>
                <TableHead>Consecutive Failures</TableHead>
                <TableHead>Last Success Probe</TableHead>
                <TableHead>Check Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthRecords.map((h) => (
                <TableRow key={h.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {h.connectionCode ?? 'CONN-PRIMARY'}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{h.providerName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        h.healthStatus === 'HEALTHY'
                          ? 'success'
                          : h.healthStatus === 'DEGRADED'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {h.healthStatus}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <code>{h.availabilityStatus}</code>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {h.latencyMs ? `${h.latencyMs}ms` : '—'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <span style={{ color: h.consecutiveFailures > 0 ? 'var(--ds-color-danger)' : 'var(--ds-color-text-secondary)', fontWeight: '700' }}>
                      {h.consecutiveFailures}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {h.lastSuccessAt ? new Date(h.lastSuccessAt).toLocaleTimeString() : 'Pending'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {h.checkSource}
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
