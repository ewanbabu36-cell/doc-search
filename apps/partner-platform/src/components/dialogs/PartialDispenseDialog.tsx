import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyPrescriptionDto,
  PharmacyBatchDto,
  PartialDispenseMedicationRequest
} from '@docsearch/api-contracts';

export interface PartialDispenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: PartialDispenseMedicationRequest) => Promise<void>;
  prescription: PharmacyPrescriptionDto | null;
  batches: PharmacyBatchDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const PartialDispenseDialog: React.FC<PartialDispenseDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prescription,
  batches,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedItemId, setSelectedItemId] = useState(prescription?.items[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [partialQuantity, setPartialQuantity] = useState<number>(1);
  const [partialReason, setPartialReason] = useState('Patient requested partial quantity / temporary stock limitation.');
  const [counselingNotes, setCounselingNotes] = useState('Patient advised to collect remaining balance within 7 calendar days.');
  const [justification, setJustification] = useState('Audited partial outpatient fulfillment committed.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!prescription) return null;

  const selectedItem = prescription.items.find((i) => i.id === selectedItemId) || prescription.items[0];
  const eligibleBatches = batches.filter(
    (b) => b.medicationId === selectedItem?.medicationId && b.availableQuantity > 0 && b.status !== 'BLOCKED' && b.status !== 'EXPIRED'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedBatchId || partialQuantity <= 0 || !partialReason) {
      setError('Please provide all mandatory partial dispensing fields and a valid reason.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        prescriptionId: prescription.id,
        patientId: prescription.patientId,
        pharmacistId: 'pharm.marcus.vance@docsearch.docsearch.health',
        pharmacistName: 'Marcus Vance, PharmD',
        dispensingMode: 'OUTPATIENT_COUNTER',
        counselingProvided: true,
        counselingNotes,
        partialFulfillmentReason: partialReason,
        items: [
          {
            prescriptionItemId: selectedItem.id,
            medicationId: selectedItem.medicationId,
            batchId: selectedBatchId,
            quantity: Number(partialQuantity),
            dosageInstructions: `${selectedItem.dosage} (${selectedItem.frequency})`,
            isSubstituted: false,
            pharmacistNotes: `Partial fulfillment of ${partialQuantity} units out of ${selectedItem.remainingQuantity} remaining balance.`
          }
        ],
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Partial dispensing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Partial Dispense — ${prescription.prescriptionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Commit Partial Dispensing'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Medication Line Item to Partially Dispense *
          </label>
          <Select
            value={selectedItemId}
            onChange={(e) => {
              setSelectedItemId(e.target.value);
              setSelectedBatchId('');
            }}
            options={prescription.items
              .filter((i) => i.remainingQuantity > 0)
              .map((i) => ({
                value: i.id,
                label: `${i.medicationName} (Prescribed: ${i.prescribedQuantity} | Remaining: ${i.remainingQuantity})`
              }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            FEFO Stock Batch *
          </label>
          <Select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            options={[
              { value: '', label: '-- Select Batch --' },
              ...eligibleBatches.map((b) => ({
                value: b.id,
                label: `${b.batchNumber} (Avail: ${b.availableQuantity} | Exp: ${new Date(b.expiryDate).toLocaleDateString()})`
              }))
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Partial Quantity to Dispense Now *
            </label>
            <Input
              type="number"
              value={partialQuantity}
              onChange={(e) => setPartialQuantity(Number(e.target.value))}
              min={1}
              max={selectedItem ? selectedItem.remainingQuantity - 1 || 1 : 1}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Balance Remaining Afterwards
            </label>
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>
              {Math.max(0, (selectedItem?.remainingQuantity || 0) - partialQuantity)} {selectedItem?.unit}
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Clinical & Logistical Reason for Partial Dispense *
          </label>
          <Input
            value={partialReason}
            onChange={(e) => setPartialReason(e.target.value)}
            placeholder="e.g. Patient financial preference, temporary pharmacy stock buffer..."
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Patient Instructions & Balance Collection Notes
          </label>
          <Input
            value={counselingNotes}
            onChange={(e) => setCounselingNotes(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
