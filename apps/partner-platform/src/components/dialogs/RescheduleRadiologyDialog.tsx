import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyAppointmentDto, RescheduleRadiologyStudyRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: RadiologyAppointmentDto | null;
  onSubmit: (req: RescheduleRadiologyStudyRequest) => Promise<void>;
  tenantId: string;
}

export const RescheduleRadiologyDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  appointment,
  onSubmit,
  tenantId
}) => {
  const [start, setStart] = useState('2026-08-29T16:00');
  const [end, setEnd] = useState('2026-08-29T16:30');
  const [reason, setReason] = useState('Patient delayed in dialysis unit.');
  const [staff, setStaff] = useState('Imaging Coordinator Marcus');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        appointmentId: appointment.id,
        newScheduledStart: new Date(start).toISOString(),
        newScheduledEnd: new Date(end).toISOString(),
        rescheduleReason: reason,
        rescheduledByStaff: staff
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Reschedule Imaging Study</h2>
        <p className="text-xs text-gray-500 mb-4">{appointment.appointmentCode} — {appointment.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Start Time</label>
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New End Time</label>
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reschedule Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Authorizing Change</label>
            <Input value={staff} onChange={(e) => setStaff(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Rescheduling...' : 'Save New Time'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
