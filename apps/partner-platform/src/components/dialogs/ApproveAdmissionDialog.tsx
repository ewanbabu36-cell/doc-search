import React, { useState } from 'react';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';
import type { ApproveAdmissionRequest, InpatientAdmissionRequestDto, InpatientWardDto, InpatientBedDto } from '@docsearch/api-contracts';

export interface ApproveAdmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: ApproveAdmissionRequest) => Promise<void>;
  request: InpatientAdmissionRequestDto | null;
  wards: InpatientWardDto[];
  beds: InpatientBedDto[];
  tenantId: string;
}

export const ApproveAdmissionDialog: React.FC<ApproveAdmissionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  request,
  wards,
  beds,
  tenantId
}) => {
  const [selectedWardId, setSelectedWardId] = useState(wards[0]?.id || '');
  const availableBeds = beds.filter((b) => b.wardId === selectedWardId && (b.status === 'AVAILABLE' || b.status === 'RESERVED'));
  const [selectedBedId, setSelectedBedId] = useState(availableBeds[0]?.id || '');
  const [approverName, setApproverName] = useState('Dr. Jonathan Reed, MD (Chief ADT Officer)');
  const [justification, setJustification] = useState('Bed availability verified and clinical admission authorized.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const bedIdToAssign = selectedBedId || availableBeds[0]?.id;
    if (!bedIdToAssign) {
      setError('Please select an available bed in this ward.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        requestId: request.id,
        tenantId,
        approverName,
        approverRole: 'ADT_ADMINISTRATOR',
        allocatedWardId: selectedWardId || wards[0]?.id || '',
        allocatedBedId: bedIdToAssign,
        justification
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve admission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Approve Admission — ${request.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}>
          <strong>Provisional Diagnosis:</strong> {request.provisionalDiagnosis}<br />
          <strong>Requested Care Level:</strong> {request.requestedWardType} ({request.requestedBedClass})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Allocate Ward *</label>
            <Select
              value={selectedWardId}
              onChange={(e) => {
                setSelectedWardId(e.target.value);
                const newAvail = beds.filter((b) => b.wardId === e.target.value && (b.status === 'AVAILABLE' || b.status === 'RESERVED'));
                setSelectedBedId(newAvail[0]?.id || '');
              }}
              options={wards.map((w) => ({ value: w.id, label: w.wardName }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Assign Available Bed *</label>
            <Select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              options={availableBeds.length > 0 ? availableBeds.map((b) => ({ value: b.id, label: `${b.bedCode} (${b.bedClass} - $${b.dailyChargeRate}/day)` })) : [{ value: '', label: 'No beds available in ward' }]}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Approving Officer</label>
          <Input value={approverName} onChange={(e) => setApproverName(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Clinical Approval Justification *</label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || availableBeds.length === 0}>
            {isSubmitting ? 'Authorizing...' : 'Authorize Admission & Admit Patient'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};