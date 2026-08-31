import React, { useState } from 'react';
import type { IntegrationConnectionDto } from '@docsearch/api-contracts';
import {
  Card,
  Button,
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
import { ConnectionTestDialog } from './ConnectionTestDialog.js';

export interface IntegrationConnectionViewProps {
  connections: IntegrationConnectionDto[];
  onTestConnection: (connectionId: string, reason: string) => Promise<{ status: string; latencyMs: number; message: string }>;
}

export const IntegrationConnectionView: React.FC<IntegrationConnectionViewProps> = ({
  connections,
  onTestConnection
}) => {
  const [testingConnection, setTestingConnection] = useState<IntegrationConnectionDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Partner & Platform Connection Health">
        Real-time telemetry probes evaluate endpoint socket connectivity, mutual TLS handshake validity, and OAuth token rotation. All manual connectivity tests are logged to `core.audit_events`.
      </Alert>

      <Card
        title="Active Healthcare Partner & Platform Integration Connections"
        subtitle="Connected EHR endpoints, background sync states, and probe health status"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connection Code</TableHead>
                <TableHead>Provider & Endpoint</TableHead>
                <TableHead>Partner Scope</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Last Health Probe</TableHead>
                <TableHead>Health Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {c.connectionCode}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.providerName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        {c.endpointName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {c.partnerName ?? 'Global Platform Scope'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{c.environment}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {c.lastHealthCheckAt ? new Date(c.lastHealthCheckAt).toLocaleString() : 'Pending Probe'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.healthStatus === 'HEALTHY'
                          ? 'success'
                          : c.healthStatus === 'DEGRADED'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {c.healthStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'CONNECTED' ? 'success' : 'neutral'}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setTestingConnection(c)}>
                      Test Connection
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {testingConnection && (
        <ConnectionTestDialog
          isOpen={Boolean(testingConnection)}
          onClose={() => setTestingConnection(null)}
          connection={testingConnection}
          onTest={onTestConnection}
        />
      )}
    </div>
  );
};
