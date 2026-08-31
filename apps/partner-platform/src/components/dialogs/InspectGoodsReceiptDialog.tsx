import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  GoodsReceiptDto,
  InspectGoodsReceiptRequest,
  QualityInspectionStatus
} from '@docsearch/api-contracts';

export interface InspectGoodsReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: InspectGoodsReceiptRequest) => Promise<void>;
  goodsReceipt: GoodsReceiptDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | null | undefined;
}

export const InspectGoodsReceiptDialog: React.FC<InspectGoodsReceiptDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  goodsReceipt,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [status, setStatus] = useState<QualityInspectionStatus>('PASSED');
  const [inspectorId, setInspectorId] = useState('Dr. Gregory House (QC Director)');
  const [passedQuantity, setPassedQuantity] = useState(goodsReceipt?.items[0]?.receivedQuantity.toString() || '50');
  const [failedQuantity, setFailedQuantity] = useState('0');
  const [quarantinedQuantity, setQuarantinedQuantity] = useState('0');
  const [notes, setNotes] = useState('Physical packaging seals, chemical labeling, and Certificate of Analysis (CoA) verified compliant.');
  const [justification, setJustification] = useState('Incoming goods quality inspection conducted.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!goodsReceipt) return null;
  const firstItem = goodsReceipt.items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstItem) {
      setError('GRN has no line items to inspect.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || undefined,
        goodsReceiptId: goodsReceipt.id,
        inspectorId,
        inspectionDate: new Date().toISOString(),
        status,
        notes: notes.trim() || undefined,
        items: [
          {
            goodsReceiptItemId: firstItem.id,
            procurementItemId: firstItem.procurementItemId,
            itemCode: firstItem.itemCode,
            itemName: firstItem.itemName,
            inspectedQuantity: firstItem.receivedQuantity,
            passedQuantity: parseInt(passedQuantity, 10) || 0,
            failedQuantity: parseInt(failedQuantity, 10) || 0,
            quarantinedQuantity: parseInt(quarantinedQuantity, 10) || 0,
            checklist: { packagingIntact: true, coaVerified: true, labelCompliant: true }
          }
        ],
        actorId: inspectorId,
        actorRole: 'Quality Inspector',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record inspection decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Quality Inspection: ${goodsReceipt.grnNumber}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Inspection Decision *
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as QualityInspectionStatus)}
              options={[
                { value: 'PASSED', label: 'Passed — Release into Available Stock' },
                { value: 'FAILED', label: 'Failed — Reject & Route to Return' },
                { value: 'QUARANTINED', label: 'Quarantined — Hold for Lab Testing' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Inspector *
            </label>
            <Input value={inspectorId} onChange={(e) => setInspectorId(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Passed Qty (Stocked)
            </label>
            <Input type="number" value={passedQuantity} onChange={(e) => setPassedQuantity(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Failed Qty (Rejected)
            </label>
            <Input type="number" value={failedQuantity} onChange={(e) => setFailedQuantity(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Quarantine Qty
            </label>
            <Input type="number" value={quarantinedQuantity} onChange={(e) => setQuarantinedQuantity(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Inspection Notes & Observations
          </label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Commit Inspection Decision'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
