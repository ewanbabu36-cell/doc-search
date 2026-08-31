import React, { useState } from 'react';
import type {
  ConsultationDto,
  ConsultationMedicationDto,
  UpdateMedicationRequest,
  MedicationRoute,
  MedicationFoodRelation,
  MedicationStatus
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface EditMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  medication: ConsultationMedicationDto;
  actorId: string;
  actorRole: string;
  onUpdateMedication: (req: UpdateMedicationRequest) => Promise<void>;
}

export const EditMedicationDialog: React.FC<EditMedicationDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  medication,
  actorId,
  actorRole,
  onUpdateMedication
}) => {
  const [strength, setStrength] = useState(medication.strength);
  const [dosage, setDosage] = useState(medication.dosage);
  const [route, setRoute] = useState<MedicationRoute>(medication.route);
  const [frequency, setFrequency] = useState(medication.frequency);
  const [duration, setDuration] = useState(medication.duration.toString());
  const [durationUnit, setDurationUnit] = useState(medication.durationUnit);
  const [quantity, setQuantity] = useState(medication.quantity.toString());
  const [foodRelation, setFoodRelation] = useState<MedicationFoodRelation>(medication.beforeAfterFood);
  const [status, setStatus] = useState<MedicationStatus>(medication.status);
  const [instructions, setInstructions] = useState(medication.instructions ?? '');
  const [justification, setJustification] = useState('Updated medication prescription dosage and duration');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdateMedication({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        medicationId: medication.id,
        strength,
        dosage,
        route,
        frequency,
        duration: parseInt(duration, 10) || 1,
        durationUnit,
        quantity: parseInt(quantity, 10) || 1,
        beforeAfterFood: foodRelation,
        status,
        instructions: instructions || undefined,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`✏️ Modify Medication Order: ${medication.medicationName} — ${consultation.patientName}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Medication'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Strength
            </label>
            <Input value={strength} onChange={(e) => setStrength(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Dosage Form
            </label>
            <Input value={dosage} onChange={(e) => setDosage(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Route
            </label>
            <Select
              value={route}
              onChange={(e) => setRoute(e.target.value as MedicationRoute)}
              options={[
                { value: 'ORAL', label: 'Oral' },
                { value: 'INHALATION', label: 'Inhalation' },
                { value: 'TOPICAL', label: 'Topical' },
                { value: 'INTRAVENOUS', label: 'Intravenous' },
                { value: 'SUBCUTANEOUS', label: 'Subcutaneous' },
                { value: 'OPHTHALMIC', label: 'Ophthalmic' },
                { value: 'OTIC', label: 'Otic' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Frequency
            </label>
            <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Food Relation
            </label>
            <Select
              value={foodRelation}
              onChange={(e) => setFoodRelation(e.target.value as MedicationFoodRelation)}
              options={[
                { value: 'AFTER_FOOD', label: 'After Food' },
                { value: 'BEFORE_FOOD', label: 'Before Food' },
                { value: 'WITH_FOOD', label: 'With Food' },
                { value: 'ANYTIME', label: 'Anytime' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Duration
            </label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" min="1" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Unit
            </label>
            <Select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value)}
              options={[
                { value: 'DAYS', label: 'Days' },
                { value: 'WEEKS', label: 'Weeks' },
                { value: 'MONTHS', label: 'Months' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Quantity
            </label>
            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="1" required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as MedicationStatus)}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DISCONTINUED', label: 'Discontinued' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Instructions
            </label>
            <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>
      </form>
    </Dialog>
  );
};
