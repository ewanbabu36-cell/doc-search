import React, { useState } from 'react';
import type {
  ConsultationDto,
  AddMedicationRequest,
  MedicationRoute,
  MedicationFoodRelation
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  actorId: string;
  actorRole: string;
  onAddMedication: (req: AddMedicationRequest) => Promise<void>;
}

export const AddMedicationDialog: React.FC<AddMedicationDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  actorId,
  actorRole,
  onAddMedication
}) => {
  const [name, setName] = useState('Amlodipine Besylate');
  const [generic, setGeneric] = useState('Amlodipine');
  const [strength, setStrength] = useState('5 mg');
  const [dosage, setDosage] = useState('1 Tablet');
  const [route, setRoute] = useState<MedicationRoute>('ORAL');
  const [frequency, setFrequency] = useState('Once Daily (Morning)');
  const [duration, setDuration] = useState('30');
  const [durationUnit, setDurationUnit] = useState('DAYS');
  const [quantity, setQuantity] = useState('30');
  const [foodRelation, setFoodRelation] = useState<MedicationFoodRelation>('AFTER_FOOD');
  const [asNeeded, setAsNeeded] = useState(false);
  const [indication, setIndication] = useState('Hypertension Management');
  const [instructions, setInstructions] = useState('Take 1 tablet daily with or after breakfast');
  const [justification, setJustification] = useState('Prescribed clinical medication');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !strength.trim() || !dosage.trim() || !frequency.trim()) {
      setError('Medication name, strength, dosage, and frequency are required.');
      return;
    }
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddMedication({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        medicationName: name.trim(),
        genericName: generic.trim() || undefined,
        strength: strength.trim(),
        dosage: dosage.trim(),
        route,
        frequency: frequency.trim(),
        duration: parseInt(duration, 10) || 1,
        durationUnit,
        quantity: parseInt(quantity, 10) || 1,
        beforeAfterFood: foodRelation,
        asNeeded,
        indication: indication.trim() || undefined,
        instructions: instructions.trim() || undefined,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAllergyWarning = consultation.patientAllergies.some((a) =>
    a.toLowerCase().includes(name.toLowerCase()) || (generic && a.toLowerCase().includes(generic.toLowerCase()))
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`💊 Prescribe Clinical Medication: ${consultation.patientName} (${consultation.patientMrn})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Prescribing...' : 'Prescribe Medication'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        {consultation.patientAllergies.length > 0 && (
          <Alert type={hasAllergyWarning ? 'error' : 'warning'} title="⚠️ Patient Documented Allergies">
            {consultation.patientAllergies.join(', ')}
            {hasAllergyWarning && <div style={{ marginTop: '4px', fontWeight: 'bold' }}>Caution: Potential allergy conflict detected!</div>}
          </Alert>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Medication / Brand Name *
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amlodipine Besylate" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Generic Name
            </label>
            <Input value={generic} onChange={(e) => setGeneric(e.target.value)} placeholder="e.g. Amlodipine" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Strength *
            </label>
            <Input value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 5 mg" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Dosage Form *
            </label>
            <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 1 Tablet" required />
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
              Frequency *
            </label>
            <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Once Daily (Morning)" required />
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
              Duration *
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
              Total Quantity
            </label>
            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="1" required />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="asNeededCheck"
            checked={asNeeded}
            onChange={(e) => setAsNeeded(e.target.checked)}
          />
          <label htmlFor="asNeededCheck" style={{ fontSize: '0.875rem' }}>
            As Needed (PRN) Medication
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Indication
            </label>
            <Input value={indication} onChange={(e) => setIndication(e.target.value)} placeholder="e.g. Hypertension" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Instructions / Sig Notes
            </label>
            <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Specific intake guidelines" />
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
