import React, { useState } from 'react';
import type { DisasterRecoveryDrillDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface DrillExecuteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drill: DisasterRecoveryDrillDto;
  onExecuteDrill: (drillId: string, reason: string) => Promise<void>;
}

export const DrillExecuteDialog: React.FC<DrillExecuteDialogProps> = ({
  isOpen,
  onClose,
  drill,
  onExecuteDrill
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory justification (at least 3 characters) is required to execute a disaster recovery drill.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onExecuteDrill(drill.id, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute drill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Execute Disaster Recovery Drill: ${drill.drillCode}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Run DR Drill Simulation
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="DR Simulation Run">
          Executing this drill will run the automated regional failover verification harness, measuring actual simulated RTO and RPO against target thresholds.
        </Alert>

        {error && <Alert type="error" title="Execution Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Drill Type
          </label>
          <Input value={`${drill.drillType} (Expected RTO: ${drill.expectedRtoMinutes}m / RPO: ${drill.expectedRpoMinutes}m)`} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Associated Plan
          </label>
          <Input value={drill.planName ?? 'Disaster Recovery Plan'} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Execution Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scheduled quarterly failover simulation for compliance verification"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
