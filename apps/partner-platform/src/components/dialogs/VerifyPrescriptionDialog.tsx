import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacyPrescriptionDto,
  VerifyPrescriptionRequest
} from '@docsearch/api-contracts';

export interface VerifyPrescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: VerifyPrescriptionRequest) => Promise<void>;
  prescription: PharmacyPrescriptionDto | null;
  tenantId: string;
}

export const VerifyPrescriptionDialog: React.FC<VerifyPrescriptionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prescription,
  tenantId
}) => {
  const [pharmacistName, setPharmacistName] = useState('Marcus Vance, PharmD');
  const [allergyCheckPassed, setAllergyCheckPassed] = useState(true);
  const [interactionCheckPassed, setInteractionCheckPassed] = useState(true);
  const [dosageCheckPassed, setDosageCheckPassed] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState('Allergy profile, dosage suitability, and drug-drug interactions clinically verified.');
  const [justification, setJustification] = useState('Electronic clinical review completed by licensed pharmacist.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!prescription) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergyCheckPassed || !interactionCheckPassed || !dosageCheckPassed) {
      setError('All safety checks (allergy, drug interactions, dosage) must be validated before prescription verification.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        prescriptionId: prescription.id,
        pharmacistId: 'pharm.marcus.vance@docsearch.docsearch.health',
        pharmacistName,
        verificationNotes,
        allergyCheckPassed,
        interactionCheckPassed,
        dosageCheckPassed,
        actorId: 'pharm.marcus.vance@docsearch.docsearch.health',
        actorRole: 'PHARMACIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Prescription verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Pharmacist Verification — ${prescription.prescriptionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Authorize for Dispensing'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1e293b' }}>
            Patient: {prescription.patientName} ({prescription.patientMrn})
          </div>
          <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.25rem' }}>
            Prescribing Doctor: {prescription.prescribingDoctorName} | Priority: {prescription.priority}
          </div>
          {prescription.patientAllergies.length > 0 && (
            <div style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.825rem', fontWeight: 600 }}>
              ⚠️ Known Allergies: {prescription.patientAllergies.join(', ')}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Ordered Medication Items:
          </label>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155' }}>
            {prescription.items.map((item) => (
              <li key={item.id} style={{ marginBottom: '0.25rem' }}>
                <strong>{item.medicationName}</strong> — {item.dosage} ({item.frequency}) for {item.duration} {item.durationUnit} [Qty: {item.prescribedQuantity} {item.unit}]
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={allergyCheckPassed}
              onChange={(e) => setAllergyCheckPassed(e.target.checked)}
            />
            Patient Allergy & Contraindication Check Verified
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={interactionCheckPassed}
              onChange={(e) => setInteractionCheckPassed(e.target.checked)}
            />
            Drug-Drug & Drug-Disease Interaction Screening Cleared
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dosageCheckPassed}
              onChange={(e) => setDosageCheckPassed(e.target.checked)}
            />
            Therapeutic Dosage Range & Frequency Verified
          </label>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Pharmacist Sign-off Name *
          </label>
          <Input
            value={pharmacistName}
            onChange={(e) => setPharmacistName(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Verification Clinical Notes *
          </label>
          <Input
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            required
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
