import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, CancelSurgeryRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CancelSurgeryRequest) => Promise<void>;
  tenantId: string;
}

export const CancelSurgeryDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId
}) => {
  const [cancellationReason, setCancellationReason] = useState('Patient presented with fever and productive cough on admission');
  const [cancelledBy, setCancelledBy] = useState('Dr. Christopher Nolan');
  const [cancelledByRole, setCancelledByRole] = useState('LEAD_ANAESTHETIST');
  const [reschedulingRequested, setReschedulingRequested] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        scheduleId: schedule.id,
        tenantId,
        cancellationReason,
        cancelledBy,
        cancelledByRole,
        reschedulingRequested
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-red-600 mb-2">Cancel Scheduled Surgery</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.scheduleNumber} — {schedule.patientName} ({schedule.procedureName})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Cancellation</label>
            <Input value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cancelled By</label>
              <Input value={cancelledBy} onChange={(e) => setCancelledBy(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizer Role</label>
              <Input value={cancelledByRole} onChange={(e) => setCancelledByRole(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={reschedulingRequested} onChange={(e) => setReschedulingRequested(e.target.checked)} className="rounded" />
              Request Elective Rescheduling in Roster
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Dismiss</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Cancelling...' : 'Confirm Cancellation & Release OT'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
