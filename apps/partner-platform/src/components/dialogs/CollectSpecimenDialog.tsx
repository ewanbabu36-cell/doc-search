import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  InvestigationOrderDto,
  CollectSpecimenRequest,
  InvestigationSpecimenType
} from '@docsearch/api-contracts';

export interface CollectSpecimenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CollectSpecimenRequest) => Promise<void>;
  order: InvestigationOrderDto | null;
  tenantId: string;
}

export const CollectSpecimenDialog: React.FC<CollectSpecimenDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  tenantId
}) => {
  const [specimenType, setSpecimenType] = useState<InvestigationSpecimenType>(
    order?.specimenType || 'WHOLE_BLOOD'
  );
  const [containerType, setContainerType] = useState('Lavender K2-EDTA (3.0 mL)');
  const [collectionSite, setCollectionSite] = useState('Left Median Cubital Vein');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [justification, setJustification] = useState('Routine phlebotomy collection per physician clinical order.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerType.trim()) {
      setError('Container type is required.');
      return;
    }
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        orderId: order.id,
        specimenType,
        containerType,
        collectionSite: collectionSite || undefined,
        collectionNotes: collectionNotes || undefined,
        actorId: 'phleb.carol.danvers@docsearch.docsearch.health',
        actorRole: 'PHLEBOTOMIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to record specimen collection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="🩸 Record Phlebotomy / Specimen Collection"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording Collection...' : 'Confirm Collection'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(30, 41, 59, 0.85)', color: '#F8FAFC', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Order:</strong> {order.orderNumber} — {order.investigationName}</div>
          <div><strong>Patient:</strong> {order.patientName} (MRN: {order.patientMrn})</div>
          <div><strong>Priority:</strong> {order.priority}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Specimen Matrix *
            </label>
            <Select
              value={specimenType}
              onChange={(e) => setSpecimenType(e.target.value as InvestigationSpecimenType)}
              options={[
                { label: 'Whole Blood', value: 'WHOLE_BLOOD' },
                { label: 'Serum', value: 'SERUM' },
                { label: 'Plasma', value: 'PLASMA' },
                { label: 'Urine', value: 'URINE' },
                { label: 'Stool', value: 'STOOL' },
                { label: 'Sputum', value: 'SPUTUM' },
                { label: 'Swab', value: 'SWAB' },
                { label: 'Tissue Biopsy', value: 'TISSUE' },
                { label: 'CSF', value: 'CSF' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Container / Tube Type *
            </label>
            <Input
              value={containerType}
              onChange={(e) => setContainerType(e.target.value)}
              placeholder="e.g. SST Gold Gel Tube, EDTA Lavender"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Anatomical Collection Site
          </label>
          <Input
            value={collectionSite}
            onChange={(e) => setCollectionSite(e.target.value)}
            placeholder="e.g. Left Median Cubital Vein"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Collection Notes (Optional)
          </label>
          <Input
            value={collectionNotes}
            onChange={(e) => setCollectionNotes(e.target.value)}
            placeholder="e.g. Atraumatic venipuncture, fasting confirmed"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Phlebotomy verification statement..."
          />
        </div>
      </form>
    </Dialog>
  );
};
