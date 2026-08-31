import React, { useState } from 'react';
import type {
  PatientDto,
  MergePatientRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface MergePatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientDto[];
  candidateId?: string | undefined;
  actorId: string;
  actorRole: string;
  onMergePatients: (req: MergePatientRequest) => Promise<void>;
}

export const MergePatientDialog: React.FC<MergePatientDialogProps> = ({
  isOpen,
  onClose,
  patients,
  candidateId,
  actorId,
  actorRole,
  onMergePatients
}) => {
  const activePatients = patients.filter((p) => p.status !== 'MERGED');
  const [canonicalId, setCanonicalId] = useState(activePatients[0]?.id ?? '');
  const [mergedId, setMergedId] = useState(activePatients[1]?.id ?? '');
  const [mergeReason, setMergeReason] = useState('Consolidated duplicate patient record into canonical Master Patient Index identity');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalId || !mergedId) {
      setError('Both canonical and target duplicate patients must be selected.');
      return;
    }
    if (canonicalId === mergedId) {
      setError('Canonical patient and duplicate patient cannot be identical.');
      return;
    }
    if (!mergeReason || mergeReason.trim().length < 3) {
      setError('Merge justification is mandatory.');
      return;
    }
    const canonical = patients.find((p) => p.id === canonicalId);
    if (!canonical) {
      setError('Canonical patient not found.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onMergePatients({
        actorId,
        actorRole,
        tenantId: canonical.tenantId,
        partnerId: canonical.partnerId,
        organizationId: canonical.organizationId,
        canonicalPatientId: canonicalId,
        mergedPatientId: mergedId,
        mergeReason,
        ...(candidateId ? { candidateId } : {})
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute patient merge');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Merge Duplicate Patient Records"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute Irreversible Merge
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Audited Master Patient Index Merge">
          Merging copies identifiers, contacts, and insurance to the <strong>Canonical Patient</strong> and sets the duplicate record status to <code>MERGED</code> with backlink references. Records are NEVER silently deleted.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Canonical Patient (Record to Retain) *
          </label>
          <Select
            value={canonicalId}
            onChange={(e) => setCanonicalId(e.target.value)}
            options={activePatients.map((p) => ({
              value: p.id,
              label: `${p.fullName} (${p.mrn}) — DOB: ${p.dateOfBirth}`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Duplicate Patient Record (To Be Merged & Retired) *
          </label>
          <Select
            value={mergedId}
            onChange={(e) => setMergedId(e.target.value)}
            options={activePatients
              .filter((p) => p.id !== canonicalId)
              .map((p) => ({
                value: p.id,
                label: `${p.fullName} (${p.mrn}) — DOB: ${p.dateOfBirth}`
              }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Merge Justification & Audit Reason *
          </label>
          <Input
            value={mergeReason}
            onChange={(e) => setMergeReason(e.target.value)}
            placeholder="e.g. Verified photo ID and matched past clinical encounter files"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
