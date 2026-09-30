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
  MedicationCatalogDto,
  CreateSubstitutionRequest
} from '@docsearch/api-contracts';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface SubstituteMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateSubstitutionRequest) => Promise<void>;
  prescription: PharmacyPrescriptionDto | null;
  catalog: MedicationCatalogDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const SubstituteMedicationDialog: React.FC<SubstituteMedicationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prescription,
  catalog,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const profile = getUnifiedPartnerProfile();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [requestedMedicationId, setRequestedMedicationId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [doctorApprovalRequired, setDoctorApprovalRequired] = useState<boolean>(true);
  const [justification, setJustification] = useState<string>('Clinical equivalency and bioequivalence matched.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!prescription) return null;

  const selectedItem = prescription.items.find((i) => i.id === selectedItemId) || prescription.items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !requestedMedicationId || !reason.trim()) {
      setError('Please select items and provide a reason.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const selectedItem = prescription.items.find((i) => i.id === selectedItemId);
      if (!selectedItem) throw new Error('Selected prescription item not found');

      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        prescriptionId: prescription.id,
        prescriptionItemId: selectedItem.id,
        originalMedicationId: selectedItem.medicationId,
        requestedMedicationId,
        reason,
        pharmacistId: profile.supportEmail || 'dispensing.pharmacist@docsearch.health',
        pharmacistName: profile.pharmacistName ? `${profile.pharmacistName}, ${profile.pharmacistDegree || 'B.Pharm'}` : 'Registered Pharmacist',
        doctorApprovalRequired,
        actorId: profile.supportEmail || 'dispensing.pharmacist@docsearch.health',
        actorRole: 'PHARMACIST',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit substitution request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Request Medication Substitution — ${prescription.prescriptionNumber}`}
      isFullPage={true}
      maxWidth="full"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Substitution Request'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Original Prescribed Item *
          </label>
          <Select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            options={prescription.items.map((i) => ({
              value: i.id,
              label: `${i.medicationName} (Qty: ${i.prescribedQuantity} ${i.unit})`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Proposed Substitute Medication *
          </label>
          <Select
            value={requestedMedicationId}
            onChange={(e) => setRequestedMedicationId(e.target.value)}
            options={[
              { value: '', label: '-- Select Alternative Medication from Catalog --' },
              ...catalog
                .filter((m) => m.id !== selectedItem?.medicationId)
                .map((m) => ({
                  value: m.id,
                  label: `${m.genericName} (${m.brandName}) — ${m.strength} [${m.dosageForm}]`
                }))
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Substitution Reason *
          </label>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={[
              { value: 'OUT_OF_STOCK', label: 'Out of Stock / Depleted Stock' },
              { value: 'GENERIC_EQUIVALENT', label: 'Generic Equivalent Formulation' },
              { value: 'THERAPEUTIC_ALTERNATIVE', label: 'Therapeutic Class Alternative' },
              { value: 'FORMULATION_UNAVAILABLE', label: 'Prescribed Dosage Form Unavailable' },
              { value: 'COST_OPTIMIZATION', label: 'Patient Insurance / Cost Optimization' }
            ]}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={doctorApprovalRequired}
            onChange={(e) => setDoctorApprovalRequired(e.target.checked)}
          />
          Doctor Electronic Authorization Required (Standard EMR Protocol)
        </label>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Clinical Justification & Equivalence Statement *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explain bioequivalence, dosage conversion, and stock rationale..."
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
