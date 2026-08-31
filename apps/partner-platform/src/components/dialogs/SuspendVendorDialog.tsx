import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  ProcurementVendorDto,
  SuspendVendorRequest
} from '@docsearch/api-contracts';

export interface SuspendVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: SuspendVendorRequest) => Promise<void>;
  vendor: ProcurementVendorDto | null;
  tenantId: string;
}

export const SuspendVendorDialog: React.FC<SuspendVendorDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendor,
  tenantId
}) => {
  const [reason, setReason] = useState('Vendor failed quality inspection criteria on two consecutive delivery consignments.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!vendor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        vendorId: vendor.id,
        reason: reason.trim(),
        actorId: 'James Vance',
        actorRole: 'Procurement Officer',
        justification: reason.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to suspend vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Suspend Vendor: ${vendor.vendorCode}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Alert type="error">
          Suspending <strong>{vendor.legalName}</strong> will freeze open PO generation and contract renewals until formal quality clearance.
        </Alert>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Suspension Reason & Quality Compliance Defect *
          </label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Suspending...' : 'Confirm Vendor Suspension'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
