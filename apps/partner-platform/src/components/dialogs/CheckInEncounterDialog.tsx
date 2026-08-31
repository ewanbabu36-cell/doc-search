import React, { useState } from 'react';
import type {
  EncounterDto,
  CheckInEncounterRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface CheckInEncounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: EncounterDto;
  actorId: string;
  actorRole: string;
  onCheckIn: (req: CheckInEncounterRequest) => Promise<void>;
}

export const CheckInEncounterDialog: React.FC<CheckInEncounterDialogProps> = ({
  isOpen,
  onClose,
  encounter,
  actorId,
  actorRole,
  onCheckIn
}) => {
  const [triageNotes, setTriageNotes] = useState(encounter.triageNotes ?? 'Vitals recorded: BP 120/80, Pulse 72 bpm');
  const [reason, setReason] = useState('Patient verified in person and placed into active waiting queue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCheckIn({
        actorId,
        actorRole,
        tenantId: encounter.tenantId,
        partnerId: encounter.partnerId,
        organizationId: encounter.organizationId,
        encounterId: encounter.id,
        triageNotes: triageNotes || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Check-In Patient: ${encounter.patientName} (${encounter.encounterNumber})`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Arrival & Issue Queue Token
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Queue Activation">
          Checking in moves the patient from <code>REGISTERED</code> to <code>WAITING</code> and automatically issues the next sequential OPD token.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ border: '1px solid var(--ds-color-border)', borderRadius: '6px', padding: '12px' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--ds-color-text-muted)', display: 'block' }}>
            CLINICAL ROUTING
          </span>
          <strong style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)' }}>
            {encounter.departmentName ?? 'Department'} · {encounter.doctorName ?? 'Unassigned Doctor Pool'}
          </strong>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', marginTop: '2px' }}>
            Chief Complaint: {encounter.chiefComplaint}
          </span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Triage Vitals / Check-in Notes
          </label>
          <Input
            value={triageNotes}
            onChange={(e) => setTriageNotes(e.target.value)}
            placeholder="e.g. BP 120/80, SpO2 99%, Patient ambulatory"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Verified patient arrival at reception desk"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
