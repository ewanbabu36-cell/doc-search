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
  DispenseMedicationRequest,
  DispensingMode
} from '@docsearch/api-contracts';

export interface DispenseMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: DispenseMedicationRequest) => Promise<void>;
  prescription: PharmacyPrescriptionDto | null;
  batches: PharmacyBatchDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const DispenseMedicationDialog: React.FC<DispenseMedicationDialogProps> = ({
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
  const [dispensingMode, setDispensingMode] = useState<DispensingMode>('OUTPATIENT_COUNTER');
  const [pharmacistName, setPharmacistName] = useState('Marcus Vance, PharmD');
  const [counselingProvided, setCounselingProvided] = useState(true);
  const [counselingNotes, setCounselingNotes] = useState('Patient educated on dosing schedule, potential adverse effects, and hydration.');
  const [justification, setJustification] = useState('Complete electronic outpatient fulfillment committed with barcode verification.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map each pending prescription item to a selected batch & quantity
  const [itemAllocations, setItemAllocations] = useState<Record<string, { batchId: string; quantity: number }>>(() => {
    const map: Record<string, { batchId: string; quantity: number }> = {};
    if (prescription) {
      for (const item of prescription.items) {
        const eligible = batches.filter(
          (b) => b.medicationId === item.medicationId && b.availableQuantity > 0 && b.status !== 'BLOCKED' && b.status !== 'EXPIRED'
        );
        map[item.id] = {
          batchId: eligible[0]?.id || '',
          quantity: item.remainingQuantity
        };
      }
    }
    return map;
  });

  if (!prescription) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToDispense = prescription.items.map((item) => {
      const alloc = itemAllocations[item.id];
      if (!alloc || !alloc.batchId || alloc.quantity <= 0) {
        throw new Error(`Please assign a valid batch for ${item.medicationName}`);
      }
      return {
        prescriptionItemId: item.id,
        medicationId: item.medicationId,
        batchId: alloc.batchId,
        quantity: alloc.quantity,
        dosageInstructions: `${item.dosage} (${item.frequency}) for ${item.duration} ${item.durationUnit}`,
        isSubstituted: false
      };
    });

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
        pharmacistName,
        dispensingMode,
        counselingProvided,
        counselingNotes,
        items: itemsToDispense,
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Dispensing transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Dispense Medication — ${prescription.prescriptionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Dispensing...' : 'Commit Dispensing & Deduct Inventory'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem' }}>
          <div style={{ fontWeight: 600, color: '#166534' }}>
            Patient: {prescription.patientName} ({prescription.patientMrn})
          </div>
          <div style={{ fontSize: '0.825rem', color: '#15803d', marginTop: '0.25rem' }}>
            Prescribed by {prescription.prescribingDoctorName} | Priority: {prescription.priority}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Dispensing Mode *
            </label>
            <Select
              value={dispensingMode}
              onChange={(e) => setDispensingMode(e.target.value as DispensingMode)}
              options={[
                { value: 'OUTPATIENT_COUNTER', label: 'Outpatient Pharmacy Counter' },
                { value: 'BEDSIDE_IPD', label: 'Bedside Inpatient (IPD)' },
                { value: 'EMERGENCY_CRITICAL', label: 'Emergency Room (ED / STAT)' },
                { value: 'HOME_DELIVERY', label: 'Home Prescription Delivery' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Dispensing Pharmacist *
            </label>
            <Input
              value={pharmacistName}
              onChange={(e) => setPharmacistName(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Batch Allocation per Medication Item:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {prescription.items.map((item) => {
              const eligible = batches.filter(
                (b) => b.medicationId === item.medicationId && b.availableQuantity > 0 && b.status !== 'BLOCKED' && b.status !== 'EXPIRED'
              );
              const currentAlloc = itemAllocations[item.id] || { batchId: eligible[0]?.id || '', quantity: item.remainingQuantity };

              return (
                <div key={item.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                    {item.medicationName} — Prescribed: {item.prescribedQuantity} {item.unit} (Remaining: {item.remainingQuantity})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        FEFO Batch Selection
                      </label>
                      <Select
                        value={currentAlloc.batchId}
                        onChange={(e) =>
                          setItemAllocations((prev) => ({
                            ...prev,
                            [item.id]: { ...currentAlloc, batchId: e.target.value }
                          }))
                        }
                        options={eligible.map((b) => ({
                          value: b.id,
                          label: `${b.batchNumber} (Avail: ${b.availableQuantity} | Exp: ${new Date(b.expiryDate).toLocaleDateString()})`
                        }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        Quantity
                      </label>
                      <Input
                        type="number"
                        value={currentAlloc.quantity}
                        onChange={(e) =>
                          setItemAllocations((prev) => ({
                            ...prev,
                            [item.id]: { ...currentAlloc, quantity: Number(e.target.value) }
                          }))
                        }
                        min={1}
                        max={item.remainingQuantity}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={counselingProvided}
              onChange={(e) => setCounselingProvided(e.target.checked)}
            />
            Patient / Caregiver Medication Counseling Provided
          </label>
          <Input
            value={counselingNotes}
            onChange={(e) => setCounselingNotes(e.target.value)}
            placeholder="Document counseling provided..."
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
