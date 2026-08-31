import React from 'react';
import type { ArtifactRepositoryDto } from '@docsearch/api-contracts';
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

export interface ArtifactRepositoryListViewProps {
  repositories: ArtifactRepositoryDto[];
}

export const ArtifactRepositoryListView: React.FC<ArtifactRepositoryListViewProps> = ({
  repositories
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Artifact Repositories & Registries"
        subtitle="OCI container registries and internal package repositories"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository Code</TableHead>
                <TableHead>Repository Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Endpoint Reference</TableHead>
                <TableHead>Retention Policy</TableHead>
                <TableHead>Artifacts Stored</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repositories.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {repo.repositoryCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{repo.name}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{repo.repositoryType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {repo.provider}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {repo.endpointReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    {repo.retentionPolicyReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {repo.artifactsCount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={repo.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {repo.status}
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
