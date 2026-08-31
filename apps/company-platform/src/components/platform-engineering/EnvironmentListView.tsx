import React from 'react';
import type { EnvironmentDto } from '@docsearch/api-contracts';
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

export interface EnvironmentListViewProps {
  environments: EnvironmentDto[];
  onSelectEnvironment: (id: string) => void;
}

export const EnvironmentListView: React.FC<EnvironmentListViewProps> = ({
  environments
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Platform Environment Topology"
        subtitle="Healthcare deployment clusters, region placements, and active versions"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Environment Code</TableHead>
                <TableHead>Environment Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Region Reference</TableHead>
                <TableHead>Deployment Policy</TableHead>
                <TableHead>Active Workload Version</TableHead>
                <TableHead>Configurations</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {environments.map((env) => (
                <TableRow key={env.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {env.environmentCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{env.environmentName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant={env.environmentType === 'PRODUCTION' ? 'primary' : 'neutral'}>
                      {env.environmentType}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {env.regionReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {env.deploymentPolicyReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                    {env.activeVersion ?? '—'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {env.configurationsCount} keys
                  </TableCell>
                  <TableCell>
                    <Badge variant={env.status === 'HEALTHY' ? 'success' : 'warning'}>
                      {env.status}
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
