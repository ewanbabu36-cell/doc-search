import React, { useState } from 'react';
import type {
  EncounterDto,
  DoctorProfileDto,
  OperationalDepartmentDto,
  ReassignEncounterRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface ReassignEncounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  encounter: EncounterDto;
  departments: OperationalDepartmentDto[];
  doctors: DoctorProfileDto[];
  actorId: string;
  actorRole: string;
  onReassignEncounter: (req: ReassignEncounterRequest) => Promise<void>;
}

export const ReassignEncounterDialog: React.FC<ReassignEncounterDialogProps> = ({
  isOpen,
  onClose,
  encounter,
  departments,
  doctors,
  actorId,
  actorRole,
  onReassignEncounter
}) => {
  const [departmentId, setDepartmentId] = useState(encounter.departmentId);
  const [doctorId, setDoctorId] = useState(encounter.doctorId ?? '');
  const [reason, setReason] = useState('Reassigned encounter due to department workload balancing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      setError('Target department is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onReassignEncounter({
        actorId,
        actorRole,
        tenantId: encounter.tenantId,
        partnerId: encounter.partnerId,
        organizationId: encounter.organizationId,
        encounterId: encounter.id,
        newDepartmentId: departmentId,
        reason,
        ...(doctorId ? { newDoctorId: doctorId } : {})
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign encounter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Reassign Encounter: ${encounter.patientName} (${encounter.encounterNumber})`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Reassign Clinical Routing
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Clinical Department / Physician Reassignment">
          Reassigning updates the active encounter routing and realigns queue ownership.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Target Clinical Department *
          </label>
          <Select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={departments.map((d) => ({
              value: d.id,
              label: d.departmentName
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Target Attending Doctor (Optional)
          </label>
          <Select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={[
              { value: '', label: '— Unassigned / General Pool —' },
              ...doctors.map((doc) => ({
                value: doc.id,
                label: `${doc.fullName} (${doc.primarySpecialty})`
              }))
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
            placeholder="e.g. Clinical routing reassigned to Cardiology after triage"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
