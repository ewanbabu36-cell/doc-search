import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateMedicationRequest,
  MedicationDosageForm,
  PharmacyMedicationRoute,
  MedicationCategory
} from '@docsearch/api-contracts';

export interface CreateMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateMedicationRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
}

export const CreateMedicationDialog: React.FC<CreateMedicationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [medicationCode, setMedicationCode] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState<MedicationDosageForm>('TABLET');
  const [route, setRoute] = useState<PharmacyMedicationRoute>('ORAL');
  const [packSize, setPackSize] = useState<number>(10);
  const [unitOfMeasure, setUnitOfMeasure] = useState('TABLET');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState<MedicationCategory>('GENERAL');
  const [controlledMedication, setControlledMedication] = useState(false);
  const [prescriptionRequired, setPrescriptionRequired] = useState(true);
  const [therapeuticClass, setTherapeuticClass] = useState('');
  const [storageConditions, setStorageConditions] = useState('Store below 25°C');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationCode || !genericName || !brandName || !strength || !manufacturer || !justification) {
      setError('Please provide all mandatory medication attributes and an audit justification.');
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
        medicationCode: medicationCode.trim(),
        genericName: genericName.trim(),
        brandName: brandName.trim(),
        strength: strength.trim(),
        dosageForm,
        route,
        packSize: Number(packSize),
        unitOfMeasure: unitOfMeasure.trim(),
        manufacturer: manufacturer.trim(),
        category,
        controlledMedication,
        prescriptionRequired,
        therapeuticClass: therapeuticClass.trim() || undefined,
        storageConditions: storageConditions.trim() || undefined,
        actorId: 'pharm.admin@docsearch.docsearch.health',
        actorRole: 'PHARMACY_DIRECTOR',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register medication in catalog');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Medication in Master Catalog"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register Medication'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Medication Code *
            </label>
            <Input
              value={medicationCode}
              onChange={(e) => setMedicationCode(e.target.value)}
              placeholder="e.g. MED-AMOX-500"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Category *
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as MedicationCategory)}
              options={[
                { value: 'GENERAL', label: 'General Medicine' },
                { value: 'ANTIBIOTIC', label: 'Antibiotic' },
                { value: 'ANALGESIC', label: 'Analgesic / Pain' },
                { value: 'CARDIOVASCULAR', label: 'Cardiovascular' },
                { value: 'ANTIDIABETIC', label: 'Antidiabetic' },
                { value: 'RESPIRATORY', label: 'Respiratory' },
                { value: 'GASTROINTESTINAL', label: 'Gastrointestinal' },
                { value: 'PSYCHIATRIC', label: 'Psychiatric' },
                { value: 'DERMATOLOGICAL', label: 'Dermatological' },
                { value: 'ONCOLOGY', label: 'Oncology' },
                { value: 'CONTROLLED_SUBSTANCE', label: 'Controlled Substance (Schedule)' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Generic (Active) Name *
            </label>
            <Input
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder="e.g. Amoxicillin Trihydrate"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Brand / Trade Name *
            </label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Amoxil"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Strength *
            </label>
            <Input
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder="e.g. 500 mg"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Dosage Form *
            </label>
            <Select
              value={dosageForm}
              onChange={(e) => setDosageForm(e.target.value as MedicationDosageForm)}
              options={[
                { value: 'TABLET', label: 'Tablet' },
                { value: 'CAPSULE', label: 'Capsule' },
                { value: 'SYRUP', label: 'Syrup / Oral Suspension' },
                { value: 'INJECTION', label: 'Injection / Ampoule' },
                { value: 'OINTMENT', label: 'Ointment / Cream' },
                { value: 'DROPS', label: 'Drops (Eye/Ear)' },
                { value: 'INHALER', label: 'Inhaler / MDI' },
                { value: 'IV_FLUID', label: 'IV Infusion' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Route *
            </label>
            <Select
              value={route}
              onChange={(e) => setRoute(e.target.value as PharmacyMedicationRoute)}
              options={[
                { value: 'ORAL', label: 'Oral' },
                { value: 'INTRAVENOUS', label: 'Intravenous (IV)' },
                { value: 'INTRAMUSCULAR', label: 'Intramuscular (IM)' },
                { value: 'SUBCUTANEOUS', label: 'Subcutaneous (SC)' },
                { value: 'TOPICAL', label: 'Topical' },
                { value: 'INHALATION', label: 'Inhalation' },
                { value: 'OPHTHALMIC', label: 'Ophthalmic' },
                { value: 'NASAL', label: 'Nasal' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Manufacturer *
            </label>
            <Input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. GlaxoSmithKline"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Therapeutic Class
            </label>
            <Input
              value={therapeuticClass}
              onChange={(e) => setTherapeuticClass(e.target.value)}
              placeholder="e.g. Beta-lactam Antibiotic"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Pack Size *
            </label>
            <Input
              type="number"
              value={packSize}
              onChange={(e) => setPackSize(Number(e.target.value))}
              min={1}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Unit of Measure *
            </label>
            <Input
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              placeholder="TABLET, ML, VIAL"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Storage Conditions
            </label>
            <Input
              value={storageConditions}
              onChange={(e) => setStorageConditions(e.target.value)}
              placeholder="Room temp / 2-8°C"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', padding: '0.5rem 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={controlledMedication}
              onChange={(e) => setControlledMedication(e.target.checked)}
            />
            Controlled Substance (Schedule II-V Safe Storage)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={prescriptionRequired}
              onChange={(e) => setPrescriptionRequired(e.target.checked)}
            />
            Prescription Required (Rx Only)
          </label>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Document clinical formulary committee approval reference..."
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
