import React, { useState } from 'react';
import type { OperationalStaffDto } from '@docsearch/api-contracts';
import { Dialog, Button, Alert, Input } from '@docsearch/ui-kit';

export interface RevokeStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: OperationalStaffDto;
  onRevokeStaff: (staffId: string, reason: string) => Promise<void>;
}

export const RevokeStaffDialog: React.FC<RevokeStaffDialogProps> = ({
  isOpen,
  onClose,
  staff,
  onRevokeStaff
}) => {
  const [reason, setReason] = useState('Immediate security revocation by administrator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async () => {
    if (!reason || reason.trim().length < 4) {
      setError('A valid audit reason (at least 4 characters) is required to revoke staff access.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onRevokeStaff(staff.id, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke staff access');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Instant Kill Switch: Revoke Staff Access"
      maxWidth="sm"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRevoke}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            ⚡ Confirm Immediate Revocation
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="error" title="Emergency Access Termination">
          Revoking access will immediately lock <strong>{staff.fullName}</strong> ({staff.staffCode}) out of the facility portal. Any active smartphone or desktop workstations will be disconnected on their next request.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.8125rem', color: '#f87171' }}>
            <div><strong>Staff Member:</strong> {staff.fullName}</div>
            <div><strong>Staff Code:</strong> <code>{staff.staffCode}</code></div>
            <div><strong>Email:</strong> {staff.workEmail}</div>
            <div><strong>Assigned Role:</strong> {staff.primaryRole}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification / Termination Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. End of employment contract / Suspected data leak"
            required
          />
          <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
            This reason is permanently recorded in the facility DPDP audit vault.
          </span>
        </div>
      </div>
    </Dialog>
  );
};
