import React, { useState } from 'react';
import type { IntegrationCredentialReferenceDto } from '@docsearch/api-contracts';
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
import { CredentialRotateDialog } from './CredentialRotateDialog.js';

export interface IntegrationCredentialLifecycleViewProps {
  credentials: IntegrationCredentialReferenceDto[];
  onRotateCredential: (credentialCode: string, reason: string) => Promise<void>;
}

export const IntegrationCredentialLifecycleView: React.FC<IntegrationCredentialLifecycleViewProps> = ({
  credentials,
  onRotateCredential
}) => {
  const [rotatingCredential, setRotatingCredential] = useState<IntegrationCredentialReferenceDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Vault Pointer References (Zero-Secret Storage)">
        All OAuth client secrets, webhook HMAC keys, and API tokens are managed via HashiCorp Vault. The Company Platform stores and rotates encrypted pointer references only; plaintext secrets are never held in the database.
      </Alert>

      <Card
        title="Integration Secret Pointers & Rotation Schedule"
        subtitle="Automated 90-day secret rotation tracking and vault lifecycle status"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credential Code</TableHead>
                <TableHead>Credential Type</TableHead>
                <TableHead>Owner Reference</TableHead>
                <TableHead>Vault Secret Reference</TableHead>
                <TableHead>Last Rotated</TableHead>
                <TableHead>Next Rotation Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((c) => (
                <TableRow key={c.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {c.credentialCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{c.credentialType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.ownerReference}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {c.secretReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {c.lastRotatedAt ? new Date(c.lastRotatedAt).toLocaleDateString() : 'Initial'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {c.nextRotationDue ? new Date(c.nextRotationDue).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'ACTIVE'
                          ? 'success'
                          : c.status === 'PENDING_ROTATION'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotatingCredential(c)}
                    >
                      Rotate Secret
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {rotatingCredential && (
        <CredentialRotateDialog
          isOpen={Boolean(rotatingCredential)}
          onClose={() => setRotatingCredential(null)}
          credential={rotatingCredential}
          onRotate={onRotateCredential}
        />
      )}
    </div>
  );
};
