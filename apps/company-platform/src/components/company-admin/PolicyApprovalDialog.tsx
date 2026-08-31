import React, { useState } from 'react';
import type { CorporatePolicyDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface PolicyApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  policy: CorporatePolicyDto;
  onApprovePolicy: (policyId: string, resolutionReference: string, reason: string) => Promise<void>;
}

export const PolicyApprovalDialog: React.FC<PolicyApprovalDialogProps> = ({
  isOpen,
  onClose,
  policy,
  onApprovePolicy
}) => {
  const [resolutionReference, setResolutionReference] = useState(`res-board-${Date.now().toString().slice(-6)}`);
  const [reason, setReason] = useState('Unanimous written consent of the Board of Directors');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionReference || resolutionReference.trim().length < 2) {
      setError('A valid Board resolution reference is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onApprovePolicy(policy.id, resolutionReference, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Approve Corporate Policy: ${policy.title}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Board Sign-Off & Activate
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="success" title="Formal Board Approval & Activation">
          Approving this corporate policy marks it as formally adopted by the Board of Directors and activates mandatory enterprise governance compliance.
        </Alert>

        {error && <Alert type="error" title="Approval Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Policy Code & Category
          </label>
          <Input value={`${policy.policyCode} — ${policy.category} (Version: ${policy.versionReference})`} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Board Resolution Reference *
          </label>
          <Input
            value={resolutionReference}
            onChange={(e) => setResolutionReference(e.target.value)}
            placeholder="e.g. res-board-2026-03-bylaws"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Annual governance policy review passed by unanimous board vote"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
