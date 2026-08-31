import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyDispensingDto,
  ReturnReason,
  ReturnDisposition,
  CreateReturnRequest
} from '@docsearch/api-contracts';

export interface ReturnMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateReturnRequest) => Promise<void>;
  dispensing: PharmacyDispensingDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const ReturnMedicationDialog: React.FC<ReturnMedicationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dispensing,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedItemId, setSelectedItemId] = useState(dispensing?.items[0]?.id || '');
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<ReturnReason>('PATIENT_DISCONTINUED');
  const [condition, setCondition] = useState<'INTACT_SEALED' | 'OPENED_UNUSABLE' | 'DAMAGED' | 'COMPROMISED'>('INTACT_SEALED');
  const [disposition, setDisposition] = useState<ReturnDisposition>('RESTOCK');
  const [notes, setNotes] = useState('');
  const [justification, setJustification] = useState('Patient return processed with physical seal inspection.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!dispensing) return null;

  const selectedItem = dispensing.items.find((i) => i.id === selectedItemId) || dispensing.items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || returnQuantity <= 0) {
      setError('Please select an item and valid return quantity.');
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
        dispensingId: dispensing.id,
        patientId: dispensing.patientId,
        medicationId: selectedItem.medicationId,
        batchId: selectedItem.batchId,
        quantity: Number(returnQuantity),
        returnReason,
        condition,
        disposition,
        notes,
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log medication return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Medication Return — Dispensing ${dispensing.dispensingNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Logging Return...' : 'Record Return & Adjust Ledger'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Dispensed Line Item to Return *
          </label>
          <Select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            options={dispensing.items.map((i) => ({
              value: i.id,
              label: `${i.medicationName} (Batch: ${i.batchNumber} | Dispensed Qty: ${i.quantity} ${i.unit})`
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Return Quantity *
            </label>
            <Input
              type="number"
              value={returnQuantity}
              onChange={(e) => setReturnQuantity(Number(e.target.value))}
              min={1}
              max={selectedItem?.quantity || 1}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Return Reason *
            </label>
            <Select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
              options={[
                { value: 'PATIENT_DISCONTINUED', label: 'Patient Discontinued Therapy' },
                { value: 'ADVERSE_REACTION', label: 'Adverse Drug Reaction' },
                { value: 'PACKAGING_DEFECT', label: 'Packaging / Label Defect' },
                { value: 'DOSAGE_CHANGE', label: 'Physician Altered Dosage' },
                { value: 'EXPIRED_RETURN', label: 'Expired Product Return' },
                { value: 'OTHER', label: 'Other Clinical / Operational Reason' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Physical Condition *
            </label>
            <Select
              value={condition}
              onChange={(e) => setCondition(e.target.value as typeof condition)}
              options={[
                { value: 'INTACT_SEALED', label: 'Intact & Factory Sealed' },
                { value: 'OPENED_UNUSABLE', label: 'Opened / Unusable' },
                { value: 'DAMAGED', label: 'Damaged Packaging' },
                { value: 'COMPROMISED', label: 'Storage Chain Compromised' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Disposition Action *
            </label>
            <Select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value as ReturnDisposition)}
              options={[
                { value: 'RESTOCK', label: 'Restock into Available Inventory' },
                { value: 'QUARANTINE_FOR_DESTRUCTION', label: 'Quarantine for Safe Destruction' },
                { value: 'RETURN_TO_MANUFACTURER', label: 'Return to Drug Manufacturer' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Pharmacist Inspection Notes
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document seal inspection and reason details..."
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
