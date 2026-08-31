import React from 'react';
import type { InfrastructureServiceDto } from '@docsearch/api-contracts';
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

export interface InfrastructureServiceViewProps {
  services: InfrastructureServiceDto[];
}

export const InfrastructureServiceView: React.FC<InfrastructureServiceViewProps> = ({ services }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Managed Infrastructure Services & Daemons"
        subtitle="Active ingress proxies, API workloads, queue processors, and background workers"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Code</TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Runtime Status</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {s.serviceCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.serviceName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{s.serviceType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {s.clusterName ?? 'EKS Cluster'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{s.environment}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {s.versionReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {s.ownerEmail}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'RUNNING' ? 'success' : 'warning'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.healthStatus === 'HEALTHY' ? 'success' : 'neutral'}>
                      {s.healthStatus}
                    </Badge>
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
