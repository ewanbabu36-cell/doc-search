import React, { useState } from 'react';
import type { AIPromptVersionDto, AIPromptApprovalStatus } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface PromptApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  version: AIPromptVersionDto;
  onApprove: (approvalStatus: AIPromptApprovalStatus, reason: string) => Promise<void>;
}

export const PromptApprovalDialog: React.FC<PromptApprovalDialogProps> = ({
  isOpen,
  onClose,
  version,
  onApprove
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AIPromptApprovalStatus>('APPROVED_FOR_PRODUCTION');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Approval or rejection rationale is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onApprove(selectedStatus, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prompt approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Prompt Version Production Approval"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Record Governance Decision
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Strict Prompt Governance Mandate">
          Only prompt versions explicitly marked <strong>Approved for Production</strong> by an authorized safety officer can be ingested by platform inference pipelines.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Target Version:</span>
          <Badge variant="primary">{version.version}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Current Status:</span>
          <Badge variant="neutral">{version.approvalStatus}</Badge>
        </div>

        <FormField label="Approval Decision" required>
          <Select
            options={[
              { label: 'Approved for Production', value: 'APPROVED_FOR_PRODUCTION' },
              { label: 'Rejected', value: 'REJECTED' },
              { label: 'Retired', value: 'RETIRED' }
            ]}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as AIPromptApprovalStatus)}
          />
        </FormField>

        <FormField
          label="Safety Evaluation & Approval Rationale"
          required
          helperText="Explain test suite evaluation results, safety boundary compliance, or rejection causes."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Verified against prompt injection benchmark suite and anti-diagnosis boundaries."
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
