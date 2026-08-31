import React, { useState } from 'react';
import type { IntegrationCredentialReferenceDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface CredentialRotateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  credential: IntegrationCredentialReferenceDto;
  onRotate: (credentialCode: string, reason: string) => Promise<void>;
}

export const CredentialRotateDialog: React.FC<CredentialRotateDialogProps> = ({
  isOpen,
  onClose,
  credential,
  onRotate
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A governance rationale is required for credential rotation.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onRotate(credential.credentialCode, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credential rotation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Rotate Integration Secret Reference"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Secret Rotation
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Zero Secret Exposure">
          Rotation triggers automated vault secret lifecycle re-encryption. The Company Platform stores and rotates vault pointer references only; secret bytes are never exposed in UI or memory.
        </Alert>

        <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Credential Reference: </span>
              <code>{credential.credentialCode}</code>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Owner: </span>
              <strong>{credential.ownerReference}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Vault Pointer: </span>
              <code>{credential.secretReference}</code>
            </div>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
            Governance Reason (Mandatory Audit)
          </label>
          <Input
            required
            placeholder="e.g. Scheduled quarterly credential rotation per policy SEC-ROT-01..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </form>
    </Dialog>
  );
};
