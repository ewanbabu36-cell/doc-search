import React from 'react';
import type { InfrastructureNodeDto } from '@docsearch/api-contracts';
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

export interface InfrastructureComputeViewProps {
  nodes: InfrastructureNodeDto[];
}

export const InfrastructureComputeView: React.FC<InfrastructureComputeViewProps> = ({ nodes }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Compute & Worker Node Inventory"
        subtitle="EC2 virtual machine instances, vCPU/RAM capacity allocations, and availability zone placement"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node Code</TableHead>
                <TableHead>Internal Hostname</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Instance Type</TableHead>
                <TableHead>vCPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Availability Zone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((n) => (
                <TableRow key={n.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {n.nodeCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)', fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                      {n.nodeName}
                    </strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {n.clusterName ?? 'EKS Cluster'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {n.instanceReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {n.cpuCapacity}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {n.memoryCapacity}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {n.availabilityZoneReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={n.status === 'READY' ? 'success' : 'warning'}>
                      {n.status}
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
