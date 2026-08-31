import React, { useState } from 'react';
import type { PackageReleaseDto } from '@docsearch/api-contracts';
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
  TableCell
} from '@docsearch/ui-kit';
import { ReleasePromoteDialog } from './ReleasePromoteDialog.js';

export interface PackageReleaseListViewProps {
  releases: PackageReleaseDto[];
  onPromoteRelease: (releaseId: string, reason: string) => Promise<void>;
}

export const PackageReleaseListView: React.FC<PackageReleaseListViewProps> = ({
  releases,
  onPromoteRelease
}) => {
  const [selectedReleaseForPromote, setSelectedReleaseForPromote] = useState<PackageReleaseDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Package Releases & Semantic Versioning"
        subtitle="Audited release candidates, published tags, and changelogs"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Release Code</TableHead>
                <TableHead>Package Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Release Type</TableHead>
                <TableHead>Commit Reference</TableHead>
                <TableHead>Released By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Released At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {rel.releaseCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{rel.packageName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                    {rel.version}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{rel.releaseType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {rel.commitReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {rel.releasedByEmail}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rel.status === 'RELEASED'
                          ? 'success'
                          : rel.status === 'CANDIDATE'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {rel.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(rel.releasedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {rel.status === 'CANDIDATE' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedReleaseForPromote(rel)}
                      >
                        Promote
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        Signed
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedReleaseForPromote && (
        <ReleasePromoteDialog
          isOpen={Boolean(selectedReleaseForPromote)}
          onClose={() => setSelectedReleaseForPromote(null)}
          release={selectedReleaseForPromote}
          onPromote={onPromoteRelease}
        />
      )}
    </div>
  );
};
