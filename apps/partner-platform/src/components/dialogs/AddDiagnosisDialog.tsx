import React, { useState } from 'react';
import type {
  ConsultationDto,
  AddDiagnosisRequest,
  DiagnosisType,
  DiagnosisClinicalStatus,
  DiagnosisCertainty
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddDiagnosisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  actorId: string;
  actorRole: string;
  onAddDiagnosis: (req: AddDiagnosisRequest) => Promise<void>;
}

export const AddDiagnosisDialog: React.FC<AddDiagnosisDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  actorId,
  actorRole,
  onAddDiagnosis
}) => {
  const [code, setCode] = useState('I10');
  const [name, setName] = useState('Essential (Primary) Hypertension');
  const [diagType, setDiagType] = useState<DiagnosisType>('PRIMARY');
  const [status, setStatus] = useState<DiagnosisClinicalStatus>('ACTIVE');
  const [certainty, setCertainty] = useState<DiagnosisCertainty>('CONFIRMED');
  const [isPrimary, setIsPrimary] = useState(true);
  const [notes, setNotes] = useState('');
  const [justification, setJustification] = useState('Documented clinical diagnosis to patient dossier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Diagnosis code and name are required.');
      return;
    }
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddDiagnosis({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        diagnosisCode: code.trim(),
        diagnosisName: name.trim(),
        diagnosisType: diagType,
        clinicalStatus: status,
        certainty,
        isPrimary,
        notes: notes || undefined,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add diagnosis');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`🔬 Add Clinical Diagnosis: ${consultation.patientName} (${consultation.patientMrn})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Diagnosis'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              ICD Code *
            </label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. I10" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Diagnosis Name *
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Essential Hypertension" required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Diagnosis Type
            </label>
            <Select
              value={diagType}
              onChange={(e) => {
                const val = e.target.value as DiagnosisType;
                setDiagType(val);
                setIsPrimary(val === 'PRIMARY');
              }}
              options={[
                { value: 'PRIMARY', label: 'Primary' },
                { value: 'SECONDARY', label: 'Secondary' },
                { value: 'DIFFERENTIAL', label: 'Differential' },
                { value: 'PROVISIONAL', label: 'Provisional' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Clinical Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as DiagnosisClinicalStatus)}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CHRONIC', label: 'Chronic' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Certainty
            </label>
            <Select
              value={certainty}
              onChange={(e) => setCertainty(e.target.value as DiagnosisCertainty)}
              options={[
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'SUSPECTED', label: 'Suspected' },
                { value: 'RULED_OUT', label: 'Ruled Out' }
              ]}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Clinical Notes & Rationale
          </label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Supporting diagnostic reasoning" />
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
