import React from 'react';
import type { EnvironmentConfigurationDto } from '@docsearch/api-contracts';
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

export interface EnvironmentConfigurationViewProps {
  configurations: EnvironmentConfigurationDto[];
}

export const EnvironmentConfigurationView: React.FC<EnvironmentConfigurationViewProps> = ({
  configurations
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Zero-Secret Plaintext Policy">
        All environment variables containing credentials, database URIs, and JWT signing keys are stored exclusively as <strong>HashiCorp Vault pointers</strong> (<code>vault://platform/...</code>). Plaintext secrets are never stored or rendered.
      </Alert>

      <Card
        title="Environment Configurations & Secret Pointers"
        subtitle="Audited environment variable definitions, classifications, and rotation records"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Config Code</TableHead>
                <TableHead>Configuration Key</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Value / Vault Pointer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Last Rotated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configurations.map((c) => (
                <TableRow key={c.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {c.configurationCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)', fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                      {c.configurationKey}
                    </strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{c.environmentCode ?? 'ENV'}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {c.secretReference ? (
                      <span style={{ color: 'var(--ds-color-primary)', fontWeight: '600' }}>{c.secretReference}</span>
                    ) : (
                      c.valueReference
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    {c.valueType}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.classification === 'RESTRICTED' ? 'danger' : 'neutral'}>
                      {c.classification}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {c.lastRotatedAt ? new Date(c.lastRotatedAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {c.status}
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
