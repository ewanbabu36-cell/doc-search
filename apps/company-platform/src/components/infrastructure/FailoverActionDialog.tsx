import React, { useState } from 'react';
import type { DisasterRecoveryPlanDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface FailoverActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: DisasterRecoveryPlanDto;
  onInitiateFailover: (planId: string, environment: string, reason: string) => Promise<void>;
}

export const FailoverActionDialog: React.FC<FailoverActionDialogProps> = ({
  isOpen,
  onClose,
  plan,
  onInitiateFailover
}) => {
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const EXPECTED_PHRASE = 'CONFIRM-REGIONAL-FAILOVER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationPhrase !== EXPECTED_PHRASE) {
      setError(`Please enter "${EXPECTED_PHRASE}" exactly to confirm this action.`);
      return;
    }
    if (!reason || reason.trim().length < 5) {
      setError('A mandatory justification (at least 5 characters) is required for disaster recovery failover.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onInitiateFailover(plan.id, 'PRODUCTION', reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate failover');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Multi-Region Disaster Recovery Failover"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={confirmationPhrase !== EXPECTED_PHRASE}
          >
            Execute Regional Failover
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="error" title="High-Impact Infrastructure Operation">
          Production infrastructure failover is a high-impact operation that diverts live clinical and gateway traffic from <strong>{plan.primaryRegionCode ?? 'Primary Region'}</strong> to <strong>{plan.drRegionCode ?? 'DR Region'}</strong>.
        </Alert>

        <Alert type="info" title="Live Telemetry Notice">
          Simulation only — no live cloud infrastructure route changes are performed in preview mode.
        </Alert>

        {error && <Alert type="error" title="Failover Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Active Disaster Recovery Plan
          </label>
          <Input value={`${plan.planName} (RTO: ${plan.rtoMinutes}m / RPO: ${plan.rpoMinutes}m)`} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Primary $\rightarrow$ Target Regions
          </label>
          <Input value={`${plan.primaryRegionCode} (Source) → ${plan.drRegionCode} (DR Target)`} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Failover Justification & Incident Correlation *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scheduled DR compliance drill or primary region availability degradation"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Type "{EXPECTED_PHRASE}" to confirm *
          </label>
          <Input
            value={confirmationPhrase}
            onChange={(e) => setConfirmationPhrase(e.target.value)}
            placeholder={EXPECTED_PHRASE}
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
