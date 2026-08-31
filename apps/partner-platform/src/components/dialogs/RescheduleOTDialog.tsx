import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, RescheduleOTRequest, OperationTheatreRoomDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  rooms: OperationTheatreRoomDto[];
  onSubmit: (req: RescheduleOTRequest) => Promise<void>;
  tenantId: string;
}

export const RescheduleOTDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  rooms,
  onSubmit,
  tenantId
}) => {
  const [roomId, setRoomId] = useState(schedule?.roomId || rooms[0]?.id || '');
  const [newDate, setNewDate] = useState('2026-09-01');
  const [newTime, setNewTime] = useState('11:00');
  const [reason, setReason] = useState('Surgeon clinical emergency delay');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const startIso = new Date(`${newDate}T${newTime}:00.000Z`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + schedule.estimatedDurationMinutes * 60 * 1000).toISOString();

      await onSubmit({
        scheduleId: schedule.id,
        tenantId,
        newRoomId: roomId || schedule.roomId,
        newStartTime: startIso,
        newEndTime: endIso,
        rescheduledBy: 'Dr. Arthur Vance',
        reason
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Reschedule OT Slot</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.scheduleNumber} — {schedule.patientName} ({schedule.procedureName})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New OT Room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.roomName} ({r.roomNumber})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">New Date</label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">New Time</label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Justification for Rescheduling</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Rescheduling...' : 'Apply Reschedule'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
