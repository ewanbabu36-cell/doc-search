import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { RecordNursingNoteRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface NursingNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RecordNursingNoteRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const NursingNoteDialog: React.FC<NursingNoteDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [authorName, setAuthorName] = useState('Staff Nurse Emily Watson, RN');
  const [noteType, setNoteType] = useState('PROGRESS_NOTE');
  const [shift, setShift] = useState('DAY');
  const [isCriticalFlag, setIsCriticalFlag] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!admission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionId: admission.id,
        patientId: admission.patientId,
        authorName,
        noteType,
        shift,
        isCriticalFlag,
        noteContent
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add nursing note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Add Nursing Note — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Note Type</label>
            <Select value={noteType} onChange={(e) => setNoteType(e.target.value)} options={[
              { value: 'PROGRESS_NOTE', label: 'Routine Progress Note' },
              { value: 'SHIFT_HANDOVER', label: 'Shift Handover Summary' },
              { value: 'INCIDENT_NOTE', label: 'Incident / Adverse Event Note' },
              { value: 'DOCTOR_ORDER_EXECUTION', label: 'Doctor Order Execution' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Shift</label>
            <Select value={shift} onChange={(e) => setShift(e.target.value)} options={[
              { value: 'DAY', label: 'Day Shift' },
              { value: 'EVENING', label: 'Evening Shift' },
              { value: 'NIGHT', label: 'Night Shift' }
            ]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Author Nurse</label>
            <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Clinical Note Content *</label>
          <Input value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Document observations and patient response" required />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#dc2626' }}>
          <input type="checkbox" checked={isCriticalFlag} onChange={(e) => setIsCriticalFlag(e.target.checked)} />
          Flag as Critical Nurse Observation
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Note'}</Button>
        </div>
      </form>
    </Dialog>
  );
};