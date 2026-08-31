import React, { useState } from 'react';
import type { SecurityCredentialDto } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Badge, Alert } from '@docsearch/ui-kit';

export interface CredentialActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  credential: SecurityCredentialDto;
  actionType: 'ROTATE' | 'REVOKE';
  onExecute: (credentialCode: string, action: 'ROTATE' | 'REVOKE', reason: string) => Promise<void>;
}

export const CredentialActionDialog: React.FC<CredentialActionDialogProps> = ({
  isOpen,
  onClose,
  credential,
  actionType,
  onExecute
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRevoke = actionType === 'REVOKE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(`A mandatory reason must be provided to ${isRevoke ? 'revoke' : 'rotate'} this credential.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onExecute(credential.credentialCode, actionType, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credential operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isRevoke ? 'Privileged Credential Revocation' : 'Credential Lifecycle Rotation'}
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={isRevoke ? 'danger' : 'primary'}
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isRevoke ? 'Revoke Credential' : 'Confirm Rotation'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert
          type={isRevoke ? 'error' : 'warning'}
          title={isRevoke ? 'Permanent Revocation Warning' : 'Cryptographic Rotation Trigger'}
        >
          {isRevoke
            ? `Revoking credential ${credential.credentialCode} will permanently sever all active integration requests signed with this key.`
            : `Rotating credential ${credential.credentialCode} updates the active lifecycle timestamp and schedules the next 90-day review period.`}
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>Credential Reference: </span>
            <code style={{ fontFamily: 'var(--ds-font-mono)' }}>{credential.credentialCode}</code>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>Owner: </span>
            <strong>{credential.ownerReference}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>Type: </span>
            <Badge variant="neutral">{credential.credentialType}</Badge>
          </div>
        </div>

        <FormField
          label="Governance & Operational Rationale"
          required
          helperText="Explain scheduled rotation, security patch, or key deprecation reason."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scheduled quarterly partner API key rotation."
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px',
              resize: 'vertical'
            }}
          />
        </FormField>
      </form>
    </Dialog>
  );
};
