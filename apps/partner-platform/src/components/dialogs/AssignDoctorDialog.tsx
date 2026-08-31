import React, { useState } from 'react';
import type {
  EncounterDto,
  DoctorProfileDto,
  AssignDoctorRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AssignDoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: EncounterDto;
  doctors: DoctorProfileDto[];
  actorId: string;
  actorRole: string;
  onAssignDoctor: (req: AssignDoctorRequest) => Promise<void>;
}

export const AssignDoctorDialog: React.FC<AssignDoctorDialogProps> = ({
  isOpen,
  onClose,
  encounter,
  doctors,
  actorId,
  actorRole,
  onAssignDoctor
}) => {
  const [doctorId, setDoctorId] = useState(encounter.doctorId ?? doctors[0]?.id ?? '');
  const [reason, setReason] = useState('Assigned consulting physician to patient encounter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      setError('Doctor selection is mandatory.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAssignDoctor({
        actorId,
        actorRole,
        tenantId: encounter.tenantId,
        partnerId: encounter.partnerId,
        organizationId: encounter.organizationId,
        encounterId: encounter.id,
        doctorId,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Doctor: ${encounter.patientName} (${encounter.encounterNumber})`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Assign Physician
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Clinical Assignment">
          Assigning a physician routes this encounter directly to the doctor’s today worklist and consultation queue.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Select Attending / Consulting Physician *
          </label>
          <Select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={doctors.map((doc) => ({
              value: doc.id,
              label: `${doc.fullName} (${doc.primarySpecialty})`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Clinical department triage assigned patient to Dr. Jenkins"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
