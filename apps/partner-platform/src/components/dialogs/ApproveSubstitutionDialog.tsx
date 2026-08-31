import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert
} from '@docsearch/ui-kit';
import type {
  PharmacySubstitutionRequestDto,
  ApproveSubstitutionRequest
} from '@docsearch/api-contracts';

export interface ApproveSubstitutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ApproveSubstitutionRequest) => Promise<void>;
  substitutionRequest: PharmacySubstitutionRequestDto | null;
  tenantId: string;
}

export const ApproveSubstitutionDialog: React.FC<ApproveSubstitutionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  substitutionRequest,
  tenantId
}) => {
  const [doctorName, setDoctorName] = useState('Dr. Sarah Jenkins, MD');
  const [approvalNotes, setApprovalNotes] = useState('Medication substitution clinically approved. Dosing remains equivalent.');
  const [justification, setJustification] = useState('Electronic physician sign-off on pharmacy therapeutic substitution.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!substitutionRequest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        tenantId,
        requestId: substitutionRequest.id,
        approvedByDoctorId: 'aaaa1111-1111-4aaa-8aaa-111111111101',
        approvedByDoctorName: doctorName,
        approvalNotes,
        actorId: 'dr.sarah.jenkins@docsearch.docsearch.health',
        actorRole: 'ATTENDING_DOCTOR',
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve substitution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Physician Approval — Substitution for ${substitutionRequest.prescriptionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Approving...' : 'Approve & Update Prescription'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
            Original Order: <strong>{substitutionRequest.originalMedicationName}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#1e40af', marginTop: '0.25rem' }}>
            Requested Replacement: <strong>{substitutionRequest.requestedMedicationName}</strong>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: '0.25rem' }}>
            Reason: {substitutionRequest.reason} | Requested by: {substitutionRequest.pharmacistName}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Authorizing Doctor Name *
          </label>
          <Input
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Clinical Approval Notes *
          </label>
          <Input
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
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
