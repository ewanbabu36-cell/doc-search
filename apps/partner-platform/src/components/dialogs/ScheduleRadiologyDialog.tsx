import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type {
  RadiologyOrderDto,
  RadiologyModalityDto,
  ScheduleRadiologyStudyRequest
} from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderDto | null;
  modalities: RadiologyModalityDto[];
  onSubmit: (req: ScheduleRadiologyStudyRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const ScheduleRadiologyDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  modalities,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedModId, setSelectedModId] = useState(modalities[0]?.id || '');
  const [start, setStart] = useState('2026-08-29T14:00');
  const [end, setEnd] = useState('2026-08-29T14:30');
  const [technologist, setTechnologist] = useState('Arthur Dent, R.T.(R)(CT)');
  const [notes, setNotes] = useState('Pre-procedure checklist verified. IV cannula in place.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const currentMod = modalities.find((m) => m.id === selectedModId) || modalities[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMod) return;
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        orderId: order.id,
        patientName: order.patientName,
        patientMrn: order.patientMrn,
        modalityId: currentMod.id,
        modalityName: currentMod.modalityName,
        roomNumber: currentMod.roomNumber,
        scheduledStart: new Date(start).toISOString(),
        scheduledEnd: new Date(end).toISOString(),
        assignedTechnologistName: technologist,
        notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Schedule Imaging Study</h2>
        <p className="text-xs text-gray-500 mb-4">{order.orderNumber} — {order.patientName} ({order.procedureName})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Modality & Room</label>
            <select
              value={selectedModId}
              onChange={(e) => setSelectedModId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
            >
              {modalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.modalityName} ({m.roomNumber})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Technologist</label>
            <Input value={technologist} onChange={(e) => setTechnologist(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Preparation & Scheduling Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Scheduling...' : 'Confirm Schedule'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
