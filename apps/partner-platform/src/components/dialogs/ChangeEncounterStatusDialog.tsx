import React, { useState } from 'react';
import type {
  EncounterDto,
  EncounterStatus,
  ChangeEncounterStatusRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface ChangeEncounterStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: EncounterDto;
  actorId: string;
  actorRole: string;
  onChangeStatus: (req: ChangeEncounterStatusRequest) => Promise<void>;
}

export const ChangeEncounterStatusDialog: React.FC<ChangeEncounterStatusDialogProps> = ({
  isOpen,
  onClose,
  encounter,
  actorId,
  actorRole,
  onChangeStatus
}) => {
  const [newStatus, setNewStatus] = useState<EncounterStatus>(encounter.status);
  const [reason, setReason] = useState('Updated encounter clinical workflow state');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus === encounter.status) {
      setError('Selected status is identical to current status.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onChangeStatus({
        actorId,
        actorRole,
        tenantId: encounter.tenantId,
        partnerId: encounter.partnerId,
        organizationId: encounter.organizationId,
        encounterId: encounter.id,
        newStatus,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change encounter status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Status: ${encounter.patientName} (${encounter.encounterNumber})`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Update Workflow State
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Encounter State Transition">
          Current State: <strong>{encounter.status}</strong>. Valid transitions advance the encounter through consultation and completion.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            New Clinical Status *
          </label>
          <Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as EncounterStatus)}
            options={[
              { value: 'REGISTERED', label: 'Registered (Arrival Pending)' },
              { value: 'CHECKED_IN', label: 'Checked-in (At Reception)' },
              { value: 'WAITING', label: 'Waiting in OPD Queue' },
              { value: 'IN_CONSULTATION', label: 'In Active Consultation' },
              { value: 'COMPLETED', label: 'Completed (Consultation Finished)' },
              { value: 'NO_SHOW', label: 'No Show' },
              { value: 'ADMITTED', label: 'Admitted to Inpatient Ward' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Concluded physical examination and issued advice"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
