import React, { useState } from 'react';
import type { SecurityCredentialDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert
} from '@docsearch/ui-kit';
import { CredentialActionDialog } from './CredentialActionDialog.js';

export interface CredentialLifecycleViewProps {
  credentials: SecurityCredentialDto[];
  onRotateCredential: (credentialCode: string, reason: string) => Promise<void>;
  onRevokeCredential: (credentialCode: string, reason: string) => Promise<void>;
}

export const CredentialLifecycleView: React.FC<CredentialLifecycleViewProps> = ({
  credentials,
  onRotateCredential,
  onRevokeCredential
}) => {
  const [selectedCred, setSelectedCred] = useState<SecurityCredentialDto | null>(null);
  const [actionType, setActionType] = useState<'ROTATE' | 'REVOKE'>('ROTATE');

  const handleExecute = async (credentialCode: string, action: 'ROTATE' | 'REVOKE', reason: string) => {
    if (action === 'ROTATE') {
      await onRotateCredential(credentialCode, reason);
    } else {
      await onRevokeCredential(credentialCode, reason);
    }
    setSelectedCred(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="warning" title="Secret Reference Governance">
        Platform credentials (API keys, service tokens, webhook secrets) are tracked exclusively by cryptographic reference identifier. <strong>Raw secrets are never persisted in the database or rendered in the UI.</strong>
      </Alert>

      <Card
        title="Integration Credential & API Key Lifecycle Governance"
        subtitle="Mandatory 90-day rotation tracking, key fingerprint validation, and instantaneous revocation controls"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credential Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Owner / Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Rotated</TableHead>
                <TableHead>Next Rotation Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No credentials registered.
                  </TableCell>
                </TableRow>
              ) : (
                credentials.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {c.credentialCode}
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{c.credentialType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block' }}>
                        {c.ownerReference}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        Type: {c.ownerType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : c.status === 'PENDING_ROTATION' ? 'warning' : 'danger'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {c.lastRotatedAt ? new Date(c.lastRotatedAt).toLocaleDateString() : 'Initial Release'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {c.nextRotationDue ? new Date(c.nextRotationDue).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {c.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCred(c);
                              setActionType('ROTATE');
                            }}
                          >
                            Rotate
                          </Button>
                        )}
                        {c.status !== 'REVOKED' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedCred(c);
                              setActionType('REVOKE');
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                        {c.status === 'REVOKED' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                            Revoked
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedCred && (
        <CredentialActionDialog
          isOpen={Boolean(selectedCred)}
          onClose={() => setSelectedCred(null)}
          credential={selectedCred}
          actionType={actionType}
          onExecute={handleExecute}
        />
      )}
    </div>
  );
};
