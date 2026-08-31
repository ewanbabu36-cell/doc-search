import React, { useState } from 'react';
import type {
  OperationalPartnerDto,
  OperationalPartnerLifecycleStatus,
  UpdateOperationalPartnerRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface PartnerStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partner: OperationalPartnerDto;
  actorId: string;
  actorRole: string;
  onUpdatePartner: (req: UpdateOperationalPartnerRequest) => Promise<void>;
}

export const PartnerStatusDialog: React.FC<PartnerStatusDialogProps> = ({
  isOpen,
  onClose,
  partner,
  actorId,
  actorRole,
  onUpdatePartner
}) => {
  const [status, setStatus] = useState<OperationalPartnerLifecycleStatus>(partner.status);
  const [reason, setReason] = useState('Partner lifecycle status update');
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
      await onUpdatePartner({
        actorId,
        actorRole,
        tenantId: partner.tenantId,
        partnerId: partner.id,
        status,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Partner Lifecycle: ${partner.legalBusinessName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Status
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Audited Operational Lifecycle Change">
          Changing partner status impacts all child clinics, hospitals, and branch facilities.
        </Alert>

        {error && <Alert type="error" title="Status Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Partner Code
          </label>
          <Input value={partner.partnerCode} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Lifecycle Status *
          </label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as OperationalPartnerLifecycleStatus)}
            options={[
              { value: 'ONBOARDING', label: 'Onboarding (Facility setup in progress)' },
              { value: 'ACTIVE', label: 'Active (Fully operational)' },
              { value: 'SUSPENDED', label: 'Suspended (Temporary operational hold)' },
              { value: 'INACTIVE', label: 'Inactive (Dormant partner)' },
              { value: 'TERMINATED', label: 'Terminated (Contract concluded)' }
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
            placeholder="e.g. Completed initial clinic accreditation & licensing verification"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
