import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  VendorReturnDto,
  ApproveVendorReturnRequest
} from '@docsearch/api-contracts';

export interface ApproveVendorReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ApproveVendorReturnRequest) => Promise<void>;
  vendorReturn: VendorReturnDto | null;
  tenantId: string;
}

export const ApproveVendorReturnDialog: React.FC<ApproveVendorReturnDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendorReturn,
  tenantId
}) => {
  const [vendorAcknowledgementRef, setVendorAcknowledgementRef] = useState('ACK-VND-0019');
  const [creditNoteRef, setCreditNoteRef] = useState('CN-2026-004');
  const [comments, setComments] = useState('Vendor agreed to credit note issuance against return consignment.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!vendorReturn) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        vendorReturnId: vendorReturn.id,
        vendorAcknowledgementRef: vendorAcknowledgementRef.trim() || undefined,
        creditNoteRef: creditNoteRef.trim() || undefined,
        comments: comments.trim(),
        actorId: 'James Vance',
        actorRole: 'Purchase Manager',
        justification: comments.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Approve RTV: ${vendorReturn.returnNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Vendor Acknowledgement Ref
            </label>
            <Input value={vendorAcknowledgementRef} onChange={(e) => setVendorAcknowledgementRef(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Credit Note Number
            </label>
            <Input value={creditNoteRef} onChange={(e) => setCreditNoteRef(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Resolution & Settlement Comments *
          </label>
          <Input value={comments} onChange={(e) => setComments(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Authorizing...' : 'Authorize Return & Credit'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
