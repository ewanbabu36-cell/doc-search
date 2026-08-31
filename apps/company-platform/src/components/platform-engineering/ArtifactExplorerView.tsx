import React, { useState } from 'react';
import type { ArtifactDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface ArtifactExplorerViewProps {
  artifacts: ArtifactDto[];
}

export const ArtifactExplorerView: React.FC<ArtifactExplorerViewProps> = ({
  artifacts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredArtifacts = artifacts.filter((a) => {
    const matchesSearch =
      a.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.artifactCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.version.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.artifactType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filter Bar */}
      <Card padding="md">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search artifacts by package name, code, or version..."
            style={{ flex: '1', minWidth: '240px' }}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Artifact Types' },
              { value: 'CONTAINER_IMAGE', label: 'Container Image (OCI)' },
              { value: 'NPM_PACKAGE', label: 'NPM Package' },
              { value: 'TARBALL_BUNDLE', label: 'Tarball Bundle' }
            ]}
          />
        </div>
      </Card>

      {/* Artifacts Table */}
      <Card
        title="Published Artifacts & OCI Images"
        subtitle="Cryptographic SHA-256 digests, package versions, and retention status"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artifact Code</TableHead>
                <TableHead>Package Name & Version</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>SHA-256 Digest</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtifacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No artifacts matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredArtifacts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {a.artifactCode}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)', fontSize: '0.8125rem' }}>
                        {a.packageName}
                      </strong>
                      <span style={{ marginLeft: '6px', fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-secondary)' }}>
                        @{a.version}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {a.repositoryName ?? 'Registry'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{a.artifactType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.digest}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {(a.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'RELEASED' ? 'success' : 'neutral'}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(a.publishedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
