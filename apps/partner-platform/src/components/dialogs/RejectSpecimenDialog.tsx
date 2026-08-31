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
  InvestigationSpecimenDto,
  RejectSpecimenRequest
} from '@docsearch/api-contracts';

export interface RejectSpecimenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: RejectSpecimenRequest) => Promise<void>;
  order: InvestigationOrderDto | null;
  specimen: InvestigationSpecimenDto | null;
  tenantId: string;
}

export const RejectSpecimenDialog: React.FC<RejectSpecimenDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  specimen,
  tenantId
}) => {
  const [rejectionReasonCode, setRejectionReasonCode] = useState('HEMOLYZED');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order || !specimen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError('Audit justification is required for clinical specimen rejection.');
      return;
    }

    const fullReason = `${rejectionReasonCode}: ${additionalDetails || 'Specimen does not meet laboratory pre-analytical quality criteria.'}`;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        orderId: order.id,
        specimenId: specimen.id,
        rejectionReason: fullReason,
        actorId: 'tech.alex.rivera@docsearch.docsearch.health',
        actorRole: 'LAB_TECHNICIAN',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to reject specimen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="⚠️ Reject Clinical Laboratory Specimen"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Rejecting Specimen...' : 'Confirm Rejection'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <Alert type="warning" title="Clinical Safety Rule Notice">
          Rejecting this specimen will revert the order status to <strong>SAMPLE_REQUIRED</strong> and require a mandatory re-draw. A rejected specimen cannot be used for result entry.
        </Alert>

        <div style={{ padding: '10px 14px', backgroundColor: 'var(--ds-color-bg-subtle, #f8fafc)', borderRadius: '6px', fontSize: '0.875rem' }}>
          <div><strong>Accession #:</strong> {specimen.accessionNumber}</div>
          <div><strong>Specimen Matrix:</strong> {specimen.specimenType} ({specimen.containerType})</div>
          <div><strong>Patient:</strong> {order.patientName} (MRN: {order.patientMrn})</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Primary Pre-Analytical Rejection Reason *
          </label>
          <Select
            value={rejectionReasonCode}
            onChange={(e) => setRejectionReasonCode(e.target.value)}
            options={[
              { label: 'Gross Hemolysis (Interferes with enzymatic assays)', value: 'HEMOLYZED' },
              { label: 'Gross Lipemia / Icteric Serum', value: 'LIPEMIC' },
              { label: 'Clotted Whole Blood / Micro-clots in EDTA', value: 'CLOTTED' },
              { label: 'Quantity Not Sufficient (QNS) for analysis', value: 'QNS' },
              { label: 'Incorrect Collection Container / Tube Type', value: 'INCORRECT_CONTAINER' },
              { label: 'Mislabeled or Unlabeled Specimen Vial', value: 'MISLABELED' },
              { label: 'Specimen Exceeded Stability / Temperature Viability', value: 'EXPIRED_STABILITY' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Additional Clinical Details
          </label>
          <Input
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="Specific observation or technical discrepancy..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Document QA/QC rejection compliance note..."
          />
        </div>
      </form>
    </Dialog>
  );
};
