import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateOTScheduleRequest, OperationTheatreRoomDto, SurgeryRequestDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  requests: SurgeryRequestDto[];
  rooms: OperationTheatreRoomDto[];
  onSubmit: (req: CreateOTScheduleRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateOTScheduleDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  requests,
  rooms,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedRequestId, setSelectedRequestId] = useState(requests[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState('2026-08-31');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [primarySurgeon, setPrimarySurgeon] = useState('Dr. Gregory House');
  const [leadAnaesthetist, setLeadAnaesthetist] = useState('Dr. Christopher Nolan');
  const [scrubNurse, setScrubNurse] = useState('Nurse Jennifer Adams');
  const [circulatingNurse, setCirculatingNurse] = useState('Nurse Priya Singh');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const surgReq = requests.find((r) => r.id === selectedRequestId) || requests[0];
      const startIso = new Date(`${scheduledDate}T${startTimeStr}:00.000Z`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + (parseInt(durationMinutes) || 120) * 60 * 1000).toISOString();

      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        surgeryRequestId: surgReq?.id || 'req-001',
        patientId: surgReq?.patientId || 'pat-101',
        patientName: surgReq?.patientName || 'Patient',
        patientMrn: surgReq?.patientMrn || 'MRN-001',
        procedureName: surgReq?.procedureName || 'Surgical Procedure',
        roomId: selectedRoomId || rooms[0]?.id || '',
        scheduledDate: new Date(`${scheduledDate}T00:00:00.000Z`).toISOString(),
        startTime: startIso,
        endTime: endIso,
        estimatedDurationMinutes: parseInt(durationMinutes) || 120,
        primarySurgeonName: primarySurgeon,
        leadAnaesthetistName: leadAnaesthetist,
        scrubNurseName: scrubNurse,
        circulatingNurseName: circulatingNurse,
        isEmergency: false
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Book OT Room & Schedule Surgery</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Surgery Request</label>
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              {requests.map((r) => (
                <option key={r.id} value={r.id}>{r.requestNumber} — {r.patientName} ({r.procedureName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">OT Room</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              {rooms.map((rm) => (
                <option key={rm.id} value={rm.id}>{rm.roomName} ({rm.roomNumber}) — {rm.status}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
              <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Min)</label>
              <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Surgeon</label>
              <Input value={primarySurgeon} onChange={(e) => setPrimarySurgeon(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Anaesthetist</label>
              <Input value={leadAnaesthetist} onChange={(e) => setLeadAnaesthetist(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scrub Nurse</label>
              <Input value={scrubNurse} onChange={(e) => setScrubNurse(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Circulating Nurse</label>
              <Input value={circulatingNurse} onChange={(e) => setCirculatingNurse(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Booking...' : 'Confirm OT Schedule'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
