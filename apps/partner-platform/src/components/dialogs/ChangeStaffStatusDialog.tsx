import React, { useState } from 'react';
import type {
  OperationalStaffDto,
  OperationalStaffStatus,
  ChangeStaffStatusRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface ChangeStaffStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  actorId: string;
  actorRole: string;
  onChangeStatus: (req: ChangeStaffStatusRequest) => Promise<void>;
}

export const ChangeStaffStatusDialog: React.FC<ChangeStaffStatusDialogProps> = ({
  isOpen,
  onClose,
  staff,
  actorId,
  actorRole,
  onChangeStatus
}) => {
  const [newStatus, setNewStatus] = useState<OperationalStaffStatus>(staff.employmentStatus);
  const [reason, setReason] = useState('Staff lifecycle status change');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus === staff.employmentStatus) {
      setError('Please select a different lifecycle status.');
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
        tenantId: staff.tenantId,
        partnerId: staff.partnerId,
        organizationId: staff.organizationId,
        staffId: staff.id,
        newStatus,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lifecycle status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Staff Lifecycle Transition: ${staff.fullName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Transition
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Audited Staff Lifecycle Transition">
          Status changes affect active scheduling rosters, appointment assignments, and clinical prescription signing permissions.
        </Alert>

        {error && <Alert type="error" title="Transition Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Current Status
          </label>
          <Input value={staff.employmentStatus} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            New Lifecycle Status *
          </label>
          <Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as OperationalStaffStatus)}
            options={[
              { value: 'ACTIVE', label: 'Active (Available for duty & scheduling)' },
              { value: 'ON_LEAVE', label: 'On Leave (Temporary absence)' },
              { value: 'SUSPENDED', label: 'Suspended (Operational hold / Investigation)' },
              { value: 'TERMINATED', label: 'Terminated (Employment ended)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Approved medical leave of absence for 2 weeks"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
