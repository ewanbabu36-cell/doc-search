import React, { useState } from 'react';
import type { InfrastructureHealthSnapshotDto } from '@docsearch/api-contracts';
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

export interface InfrastructureHealthViewProps {
  snapshots: InfrastructureHealthSnapshotDto[];
  onRunHealthProbe: (resourceType: string, resourceReference: string, environment: string, reason: string) => Promise<void>;
}

export const InfrastructureHealthView: React.FC<InfrastructureHealthViewProps> = ({
  snapshots,
  onRunHealthProbe
}) => {
  const [isProbing, setIsProbing] = useState(false);

  const handleTriggerGlobalProbe = async () => {
    setIsProbing(true);
    try {
      await onRunHealthProbe(
        'CLUSTER',
        'eks-prod-useast1',
        'PRODUCTION',
        'Manual health probe triggered from Infrastructure control plane'
      );
    } finally {
      setIsProbing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Telemetry Status: Live Telemetry">
        Telemetry unavailable — showing development preview data. <strong>Live infrastructure telemetry is not connected.</strong> Simulated control-plane health probes record verification traces in <code>core.audit_events</code>.
      </Alert>

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Infrastructure Health Probes & Monitoring
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Simulated probe heartbeats across EKS clusters, compute nodes, and database endpoints
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={handleTriggerGlobalProbe} isLoading={isProbing}>
          🩺 Trigger Health Probe
        </Button>
      </div>

      {/* Health Snapshots Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource Type</TableHead>
                <TableHead>Resource Reference</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Health Status</TableHead>
                <TableHead>CPU / Memory (Sample)</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Error Rate</TableHead>
                <TableHead>Probe Source</TableHead>
                <TableHead>Checked At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Badge variant="neutral">{s.resourceType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {s.resourceReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{s.environment}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.healthStatus === 'HEALTHY' ? 'success' : 'warning'}>
                      {s.healthStatus}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {s.cpuUtilizationReference} / {s.memoryUtilizationReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {s.latencyReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {s.errorRateReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    {s.checkSource}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(s.checkedAt).toLocaleTimeString()}
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
