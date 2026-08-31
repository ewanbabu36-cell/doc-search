import React from 'react';
import type { LegalEntityDto } from '@docsearch/api-contracts';
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

export interface LegalEntityListViewProps {
  entities: LegalEntityDto[];
}

export const LegalEntityListView: React.FC<LegalEntityListViewProps> = ({ entities }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Corporate Legal Entities Registry"
        subtitle="Incorporation credentials, statutory registered addresses, and parent-subsidiary governance"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Code</TableHead>
                <TableHead>Company Legal Name</TableHead>
                <TableHead>Structure Type</TableHead>
                <TableHead>Incorporation Jurisdiction</TableHead>
                <TableHead>Registration Number</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Registered Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((e) => (
                <TableRow key={e.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {e.entityCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{e.entityName}</strong>
                    {e.parentEntityName && (
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        Parent: {e.parentEntityName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{e.entityType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {e.jurisdiction}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {e.registrationNumber}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {e.taxIdentifierReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', maxWidth: '220px' }}>
                    {e.registeredAddress}
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {e.status}
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
