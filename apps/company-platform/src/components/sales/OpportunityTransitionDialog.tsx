import React, { useState } from 'react';
import type { OpportunityDto, OpportunityStage } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Select, Badge, Alert } from '@docsearch/ui-kit';

export interface OpportunityTransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityDto;
  onTransition: (toStage: OpportunityStage, reason: string) => Promise<void>;
}

const allStages: OpportunityStage[] = [
  'QUALIFICATION',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST'
];

export const OpportunityTransitionDialog: React.FC<OpportunityTransitionDialogProps> = ({
  isOpen,
  onClose,
  opportunity,
  onTransition
}) => {
  const [selectedStage, setSelectedStage] = useState<OpportunityStage>(
    opportunity.stage === 'PROPOSAL' ? 'NEGOTIATION' : 'PROPOSAL'
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStages = allStages.filter((s) => s !== opportunity.stage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A business justification reason is mandatory for opportunity stage progression or closure.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTransition(selectedStage, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stage transition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Advance Opportunity Sales Stage"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute Stage Update
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Sales Pipeline Event">
          Advancing sales stages updates commercial forecasting and is recorded in the platform audit event stream.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>Current Stage:</span>
          <Badge variant="primary">{opportunity.stage}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>→ Target Stage:</span>
          <Badge variant="neutral">{selectedStage}</Badge>
        </div>

        <FormField label="Target Sales Stage" required>
          <Select
            options={availableStages.map((s) => ({ label: s, value: s }))}
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as OpportunityStage)}
          />
        </FormField>

        <FormField
          label={selectedStage === 'LOST' ? 'Loss Analysis & Mandatory Reason' : 'Stage Transition Rationale'}
          required
          helperText={selectedStage === 'LOST' ? 'Explain why this opportunity was not won.' : 'State progress milestone achieved.'}
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              selectedStage === 'LOST'
                ? 'e.g. Budget deferred to next fiscal year; competitor selected.'
                : 'e.g. Completed executive security review; delivered tailored enterprise proposal.'
            }
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
