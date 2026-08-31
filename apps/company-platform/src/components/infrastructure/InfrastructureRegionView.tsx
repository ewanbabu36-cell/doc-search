import React from 'react';
import type { InfrastructureRegionDto } from '@docsearch/api-contracts';
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

export interface InfrastructureRegionViewProps {
  regions: InfrastructureRegionDto[];
}

export const InfrastructureRegionView: React.FC<InfrastructureRegionViewProps> = ({ regions }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Multi-Region Cloud Architecture"
        subtitle="Active AWS deployment regions, geographic latency targets, and disaster recovery regional pairings"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region Code</TableHead>
                <TableHead>Region Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Geographic Placement</TableHead>
                <TableHead>Architecture Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {reg.regionCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{reg.regionName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{reg.provider}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {reg.geographicReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={reg.isPrimary ? 'primary' : 'warning'}>
                      {reg.isPrimary ? 'PRIMARY ACTIVE REGION' : 'DISASTER RECOVERY REGION'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={reg.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {reg.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(reg.updatedAt).toLocaleDateString()}
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
