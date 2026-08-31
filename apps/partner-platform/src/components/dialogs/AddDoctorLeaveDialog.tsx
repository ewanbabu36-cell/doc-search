import React, { useState } from 'react';
import type {
  DoctorLeaveType,
  AddDoctorLeaveRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddDoctorLeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
  actorId: string;
  actorRole: string;
  doctors: { id: string; fullName: string; doctorCode: string }[];
  onAddLeave: (req: AddDoctorLeaveRequest) => Promise<void>;
}

export const AddDoctorLeaveDialog: React.FC<AddDoctorLeaveDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  doctors,
  onAddLeave
}) => {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '');
  const [leaveType, setLeaveType] = useState<DoctorLeaveType>('PLANNED_LEAVE');
  const [startDate, setStartDate] = useState('2026-03-02');
  const [endDate, setEndDate] = useState('2026-03-06');
  const [reason, setReason] = useState('Planned clinical leave / Medical conference');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      setError('Doctor selection is required.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddLeave({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId: branchId || undefined,
        doctorId,
        leaveType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Record Doctor Leave & Exclusion Window"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit Leave Request
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Automatic Slot Conflict Detection">
          Filing leave automatically blocks future recurring OPD slots during the leave window and prevents double-booking.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Doctor *
          </label>
          <Select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={doctors.map((d) => ({
              value: d.id,
              label: `${d.fullName} (${d.doctorCode})`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Leave Classification *
          </label>
          <Select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as DoctorLeaveType)}
            options={[
              { value: 'PLANNED_LEAVE', label: 'Planned Annual / Vacation Leave' },
              { value: 'EMERGENCY_LEAVE', label: 'Emergency Leave' },
              { value: 'MEDICAL_LEAVE', label: 'Medical / Sick Leave' },
              { value: 'CONFERENCE', label: 'Medical Conference / CME Academic Leave' },
              { value: 'CASUAL_LEAVE', label: 'Casual / Personal Day' }
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Leave Start Date *
            </label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Leave End Date *
            </label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Reason & Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Attending National Cardiology Summit"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
