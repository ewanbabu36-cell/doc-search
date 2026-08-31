import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  PurchaseOrderDto,
  SendPurchaseOrderRequest
} from '@docsearch/api-contracts';

export interface SendPurchaseOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: SendPurchaseOrderRequest) => Promise<void>;
  purchaseOrder: PurchaseOrderDto | null;
  tenantId: string;
}

export const SendPurchaseOrderDialog: React.FC<SendPurchaseOrderDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  tenantId
}) => {
  const [transmissionMethod, setTransmissionMethod] = useState<'EMAIL' | 'EDI_GATEWAY' | 'VENDOR_PORTAL' | 'MANUAL_DISPATCH'>('EMAIL');
  const [recipientEmail, setRecipientEmail] = useState('orders@vendor.docsearch.health');
  const [notes, setNotes] = useState('Please confirm electronic order receipt and estimated dispatch dispatch window.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!purchaseOrder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        purchaseOrderId: purchaseOrder.id,
        transmissionMethod,
        recipientEmail: transmissionMethod === 'EMAIL' ? recipientEmail.trim() : undefined,
        notes: notes.trim() || undefined,
        actorId: 'James Vance',
        actorRole: 'Procurement Officer'
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Transmit PO: ${purchaseOrder.poNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Transmission Gateway / Method *
          </label>
          <Select
            value={transmissionMethod}
            onChange={(e) => setTransmissionMethod(e.target.value as 'EMAIL' | 'EDI_GATEWAY' | 'VENDOR_PORTAL' | 'MANUAL_DISPATCH')}
            options={[
              { value: 'EMAIL', label: 'Encrypted Email PDF Dispatch' },
              { value: 'EDI_GATEWAY', label: 'ANSI ASC X12 EDI (850 PO)' },
              { value: 'VENDOR_PORTAL', label: 'Direct Vendor API / Portal' },
              { value: 'MANUAL_DISPATCH', label: 'Physical Print / Manual Courier' }
            ]}
          />
        </div>

        {transmissionMethod === 'EMAIL' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Vendor Order Desk Email *
            </label>
            <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} required />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Transmission Notes
          </label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Transmitting...' : 'Transmit to Vendor'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
