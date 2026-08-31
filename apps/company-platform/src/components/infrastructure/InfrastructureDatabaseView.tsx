import React from 'react';
import type { InfrastructureDatabaseDto } from '@docsearch/api-contracts';
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

export interface InfrastructureDatabaseViewProps {
  databases: InfrastructureDatabaseDto[];
}

export const InfrastructureDatabaseView: React.FC<InfrastructureDatabaseViewProps> = ({ databases }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Zero-Credential Infrastructure Policy">
        Database connection credentials, Master DB passwords, and replication auth keys are managed via <strong>HashiCorp Vault</strong> and AWS Secrets Manager. Plaintext connection strings are never exposed or rendered.
      </Alert>

      <Card
        title="Managed Database Clusters & Replicas"
        subtitle="PostgreSQL Multi-AZ instances, streaming replication modes, and backup policy bindings"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Database Code</TableHead>
                <TableHead>Database Name</TableHead>
                <TableHead>Engine & Version</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Replication Mode</TableHead>
                <TableHead>Backup Policy</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {databases.map((db) => (
                <TableRow key={db.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {db.databaseCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{db.databaseName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {db.engineVersion}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {db.regionCode ?? 'us-east-1'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{db.environment}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{db.replicationMode}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {db.backupPolicyName ?? 'Default 30-Day Snapshot'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={db.status === 'ONLINE' ? 'success' : 'warning'}>
                      {db.status}
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
