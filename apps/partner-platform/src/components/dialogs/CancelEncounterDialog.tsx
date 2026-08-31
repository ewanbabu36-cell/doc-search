import React, { useState } from 'react';
import type {
  EncounterDto,
  CancelEncounterRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface CancelEncounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: EncounterDto;
  actorId: string;
  actorRole: string;
  onCancelEncounter: (req: CancelEncounterRequest) => Promise<void>;
}

export const CancelEncounterDialog: React.FC<CancelEncounterDialogProps> = ({
  isOpen,
  onClose,
  encounter,
  actorId,
  actorRole,
  onCancelEncounter
}) => {
  const [cancellationReason, setCancellationReason] = useState('Patient requested appointment cancellation');
  const [reason, setReason] = useState('Patient cancelled clinic appointment prior to encounter consultation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason || cancellationReason.trim().length < 3) {
      setError('Cancellation reason is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCancelEncounter({
        actorId,
        actorRole,
        tenantId: encounter.tenantId,
        partnerId: encounter.partnerId,
        organizationId: encounter.organizationId,
        encounterId: encounter.id,
        cancellationReason,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel encounter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Encounter: ${encounter.patientName} (${encounter.encounterNumber})`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Back
          </Button>
          <Button variant="danger" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Cancellation
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Encounter Cancellation">
          Cancelling will withdraw the encounter from active queues and mark it as <code>CANCELLED</code>.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Cancellation Reason *
          </label>
          <Input
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="e.g. Patient called to cancel due to travel conflict"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Administrative cancellation logged by reception desk"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
