import React, { useState } from 'react';
import type { ContentItemDto, ContentStatus } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface ContentTransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItemDto;
  onTransition: (toStatus: ContentStatus, reason: string) => Promise<void>;
}

const allContentStatuses: ContentStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
  'RETRACTED'
];

export const ContentTransitionDialog: React.FC<ContentTransitionDialogProps> = ({
  isOpen,
  onClose,
  item,
  onTransition
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus>(
    item.status === 'DRAFT' ? 'PUBLISHED' : 'ARCHIVED'
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = allContentStatuses.filter((s) => s !== item.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A business justification reason is mandatory for altering content publication state.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTransition(selectedStatus, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Content transition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Modify Publication & Lifecycle State"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute State Transition
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Content Publication Event">
          Publishing or retracting content items broadcasts visibility changes to partner platform shells and is logged in the immutable audit trail.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Current Status:</span>
          <Badge variant="primary">{item.status}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>→ Target Status:</span>
          <Badge variant="neutral">{selectedStatus}</Badge>
        </div>

        <FormField label="Target Publication Status" required>
          <Select
            options={availableStatuses.map((s) => ({ label: s, value: s }))}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ContentStatus)}
          />
        </FormField>

        <FormField
          label="Publication / Archival Rationale"
          required
          helperText="Explain why this content item is being published, scheduled, or archived."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved by Platform Engineering lead; scheduled for release synchronization."
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
