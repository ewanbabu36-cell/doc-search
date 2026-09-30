import React, { useState } from 'react';
import type { OperationalStaffDto } from '@docsearch/api-contracts';
import { Dialog, Button, Alert, Input } from '@docsearch/ui-kit';

export interface DeleteStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  onDeleteStaff: (staffId: string, reason: string) => Promise<void>;
}

export const DeleteStaffDialog: React.FC<DeleteStaffDialogProps> = ({
  isOpen,
  onClose,
  staff,
  onDeleteStaff
}) => {
  const [confirmCode, setConfirmCode] = useState('');
  const [reason, setReason] = useState('Staff member removed from active directory');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmCode.trim().toUpperCase() === staff.staffCode.toUpperCase();

  const handleDelete = async () => {
    if (!isConfirmed) {
      setError(`Please type "${staff.staffCode}" to confirm deletion.`);
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('A valid audit reason is required for deletion.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onDeleteStaff(staff.id, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="🗑️ Delete Healthcare Staff Member"
      maxWidth="sm"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isSubmitting}
            disabled={!isConfirmed || isSubmitting}
          >
            🗑️ Delete Staff
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Permanent Record Deletion">
          Are you sure you want to remove <strong>{staff.fullName}</strong> from the facility staff directory? Historical clinical and billing signatures will be preserved in compliance with medical archival regulations.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ padding: '10px 12px', backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))', borderRadius: '6px', fontSize: '0.8125rem' }}>
          <div><strong>Staff Code:</strong> <code>{staff.staffCode}</code></div>
          <div><strong>Full Name:</strong> {staff.fullName}</div>
          <div><strong>Department:</strong> {staff.departmentName || 'General'}</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Confirm by typing Staff Code: <code>{staff.staffCode}</code> *
          </label>
          <Input
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
            placeholder={`Type ${staff.staffCode} to confirm`}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Deletion Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Contract terminated / Duplicate entry cleanup"
            required
          />
        </div>
      </div>
    </Dialog>
  );
};
