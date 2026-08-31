import React, { useState } from 'react';
import type { OpdSlotDto, BlockOpdSlotRequest } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface BlockSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  slot: OpdSlotDto;
  actorId: string;
  actorRole: string;
  onBlockSlot: (req: BlockOpdSlotRequest) => Promise<void>;
}

export const BlockSlotDialog: React.FC<BlockSlotDialogProps> = ({
  isOpen,
  onClose,
  slot,
  actorId,
  actorRole,
  onBlockSlot
}) => {
  const [reason, setReason] = useState('Emergency procedural block / OR reservation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('Audit block justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onBlockSlot({
        actorId,
        actorRole,
        tenantId: slot.tenantId,
        partnerId: slot.partnerId,
        organizationId: slot.organizationId,
        slotId: slot.id,
        blockReason: reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Block Consultation Slot: ${slot.slotDate} (${slot.startTime} - ${slot.endTime})`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Block
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Audited Slot Blocking">
          Blocking an OPD slot renders it unavailable for front desk booking, online patient self-scheduling, and triage queues.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Doctor & Location
          </label>
          <Input value={`${slot.doctorName ?? 'Doctor'} · ${slot.branchName ?? 'Branch'}`} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Blocking Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Urgent cardiac catheterization case reservation"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
