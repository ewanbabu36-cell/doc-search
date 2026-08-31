import React from 'react';
import type { DatabaseConnectionPoolDto } from '@docsearch/api-contracts';
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

export interface DatabaseConnectionPoolViewProps {
  pools: DatabaseConnectionPoolDto[];
}

export const DatabaseConnectionPoolView: React.FC<DatabaseConnectionPoolViewProps> = ({ pools }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="PgBouncer Connection Pooling Posture">
        Database connection pool metrics below represent development preview telemetry. <strong>Live infrastructure telemetry is not connected.</strong> Real-time pool saturation and query wait queues are monitored continuously via CloudWatch/Prometheus once the telemetry agent is attached.
      </Alert>

      <Card
        title="Database Connection Pools & Transaction Queues"
        subtitle="PgBouncer server-side connection pool limits, active utilization, and client queue timeouts"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool Code</TableHead>
                <TableHead>Target Database</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Max Connections</TableHead>
                <TableHead>Active / In-Use</TableHead>
                <TableHead>Idle Pool</TableHead>
                <TableHead>Waiting Clients</TableHead>
                <TableHead>Timeout (ms)</TableHead>
                <TableHead>Pool Status</TableHead>
                <TableHead>Last Heartbeat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {p.poolCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.databaseName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{p.environment}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {p.maxConnections}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
                    {p.activeConnections}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.idleConnections}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: p.waitingConnections > 0 ? 'var(--ds-color-danger)' : 'var(--ds-color-text-muted)' }}>
                    {p.waitingConnections}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.connectionTimeoutMs}ms
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'HEALTHY' ? 'success' : 'warning'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(p.lastCheckedAt).toLocaleTimeString()}
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
