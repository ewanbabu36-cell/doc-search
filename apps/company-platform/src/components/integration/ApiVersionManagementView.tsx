import React, { useState } from 'react';
import type { ApiVersionDto } from '@docsearch/api-contracts';
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
  TableCell,
  Alert
} from '@docsearch/ui-kit';
import { ApiDeprecateDialog } from './ApiDeprecateDialog.js';

export interface ApiVersionManagementViewProps {
  versions: ApiVersionDto[];
  onDeprecateVersion: (versionId: string, sunsetDate: string, migrationReference: string, reason: string) => Promise<void>;
}

export const ApiVersionManagementView: React.FC<ApiVersionManagementViewProps> = ({
  versions,
  onDeprecateVersion
}) => {
  const [deprecatingVersion, setDeprecatingVersion] = useState<ApiVersionDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="API Gateway Versioning Lifecycle">
        Doc Search enforces semantic versioning across all Fastify microservices. Deprecated versions transmit automated `Sunset` and `Deprecation` response headers prior to final gateway route teardown.
      </Alert>

      <Card
        title="Active & Scheduled API Version Catalog"
        subtitle="Lifecycle release dates, breaking change warnings, and sunset migration milestones"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API Name & Version</TableHead>
                <TableHead>Release Date</TableHead>
                <TableHead>Breaking Changes</TableHead>
                <TableHead>Deprecation Date</TableHead>
                <TableHead>Sunset Date</TableHead>
                <TableHead>Migration Guide</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{v.apiName}</strong>
                      <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                        {v.version}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(v.releaseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.breakingChange ? 'warning' : 'neutral'}>
                      {v.breakingChange ? 'Breaking Changes' : 'Backward Compatible'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {v.deprecationDate ? new Date(v.deprecationDate).toLocaleDateString() : 'Active Version'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {v.sunsetDate ? new Date(v.sunsetDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {v.migrationReference ?? 'Standard Docs'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        v.status === 'ACTIVE'
                          ? 'success'
                          : v.status === 'DRAFT'
                          ? 'primary'
                          : v.status === 'DEPRECATED'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {v.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeprecatingVersion(v)}
                      >
                        Deprecate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {deprecatingVersion && (
        <ApiDeprecateDialog
          isOpen={Boolean(deprecatingVersion)}
          onClose={() => setDeprecatingVersion(null)}
          apiVersion={deprecatingVersion}
          onDeprecate={onDeprecateVersion}
        />
      )}
    </div>
  );
};
