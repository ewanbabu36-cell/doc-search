import React, { useState } from 'react';
import type { PackageReleaseDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface ReleasePromoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  release: PackageReleaseDto;
  onPromote: (releaseId: string, reason: string) => Promise<void>;
}

export const ReleasePromoteDialog: React.FC<ReleasePromoteDialogProps> = ({
  isOpen,
  onClose,
  release,
  onPromote
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification (at least 3 characters) is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onPromote(release.id, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote release');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Promote Release: ${release.packageName}@${release.version}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Promote to Released
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Package Release Promotion">
          Promoting this release changes its lifecycle status from <strong>CANDIDATE</strong> to <strong>RELEASED</strong> in the enterprise package registry and records an immutable trace.
        </Alert>

        {error && <Alert type="error" title="Promotion Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Package & Version
          </label>
          <Input value={`${release.packageName} @ ${release.version} (${release.releaseType})`} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Commit Reference
          </label>
          <Input value={release.commitReference} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Release Notes
          </label>
          <Input value={release.releaseNotesReference} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification / Release Approval Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved for general distribution following quality gate verification"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
