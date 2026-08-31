import React from 'react';
import type { DataClassificationDto } from '@docsearch/api-contracts';
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

export interface DataGovernanceViewProps {
  classifications: DataClassificationDto[];
}

export const DataGovernanceView: React.FC<DataGovernanceViewProps> = ({
  classifications
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Data Classification & Handling Hierarchy">
        Doc Search enforces strict boundary restrictions across 5 data classification tiers. <strong>PHI_RESTRICTED represents an administrative governance tier only; zero actual patient records or PHI are held within the Company Platform.</strong>
      </Alert>

      <Card
        title="Organizational Data Classifications & Handling Directives"
        subtitle="Mandatory export gates, encryption specifications, and storage segregation rules per data tier"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classification Tier</TableHead>
                <TableHead>Level Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Handling Directives</TableHead>
                <TableHead>Export Allowed</TableHead>
                <TableHead>External Sharing</TableHead>
                <TableHead>Retention Required</TableHead>
                <TableHead>Governance Lead</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classifications.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.name}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.classificationLevel === 'PHI_RESTRICTED'
                          ? 'danger'
                          : c.classificationLevel === 'RESTRICTED'
                          ? 'warning'
                          : c.classificationLevel === 'CONFIDENTIAL'
                          ? 'primary'
                          : 'neutral'
                      }
                    >
                      {c.classificationLevel}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', maxWidth: '260px' }}>
                    {c.description}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                      {c.handlingRequirements.map((req, idx) => (
                        <span key={idx} style={{ color: 'var(--ds-color-text-secondary)' }}>
                          • {req}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.exportAllowed ? 'success' : 'danger'}>
                      {c.exportAllowed ? 'Permitted' : 'Blocked'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.externalSharingAllowed ? 'success' : 'danger'}>
                      {c.externalSharingAllowed ? 'Permitted' : 'Prohibited'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.retentionRequired ? 'primary' : 'neutral'}>
                      {c.retentionRequired ? 'Mandatory' : 'Optional'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {c.ownerEmail}
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
