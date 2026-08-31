import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, CreateOTTransferRequest, OperationTheatreRoomDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  rooms: OperationTheatreRoomDto[];
  onSubmit: (req: CreateOTTransferRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateOTTransferDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  rooms,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [sourceLocation, setSourceLocation] = useState('Ward 3 / Bed 12');
  const [destinationRoomId, setDestinationRoomId] = useState(schedule?.roomId || rooms[0]?.id || '');
  const [transportStaffName, setTransportStaffName] = useState('Orderly Ramesh');
  const [handoverGivenBy, setHandoverGivenBy] = useState('Ward Nurse Sunita');
  const [handoverReceivedBy, setHandoverReceivedBy] = useState('OT Nurse Jennifer');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        scheduleId: schedule.id,
        patientId: schedule.patientId,
        patientName: schedule.patientName,
        sourceLocation,
        destinationRoomId: destinationRoomId || schedule.roomId,
        transportStaffName,
        handoverGivenBy,
        handoverReceivedBy,
        patientConditionOnArrival: 'STABLE_CONSCIOUS'
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Patient Transfer to OT</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} ({schedule.patientMrn})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Source Location</label>
              <Input value={sourceLocation} onChange={(e) => setSourceLocation(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Destination OT</label>
              <select
                value={destinationRoomId}
                onChange={(e) => setDestinationRoomId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.roomName}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Transport Staff</label>
            <Input value={transportStaffName} onChange={(e) => setTransportStaffName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Handover Given By</label>
              <Input value={handoverGivenBy} onChange={(e) => setHandoverGivenBy(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Handover Received By</label>
              <Input value={handoverReceivedBy} onChange={(e) => setHandoverReceivedBy(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Transferring...' : 'Log OT Arrival & Handover'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
