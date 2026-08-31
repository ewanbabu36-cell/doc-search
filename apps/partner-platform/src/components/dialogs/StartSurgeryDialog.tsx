import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, StartSurgeryRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: StartSurgeryRequest) => Promise<void>;
  tenantId: string;
}

export const StartSurgeryDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId
}) => {
  const [startedBy, setStartedBy] = useState(schedule?.primarySurgeonName || 'Dr. Gregory House');
  const [surgicalApproach, setSurgicalApproach] = useState('Standard surgical access');
  const [notes, setNotes] = useState('Incision made under full sterile precautions; WHO Time-Out confirmed.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        scheduleId: schedule.id,
        tenantId,
        startedBy,
        surgicalApproach,
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
        <h2 className="text-xl font-bold text-green-700 mb-2">Start Surgery (Incision)</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.scheduleNumber} — {schedule.patientName} ({schedule.procedureName})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Operating Surgeon</label>
            <Input value={startedBy} onChange={(e) => setStartedBy(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Surgical Approach</label>
            <Input value={surgicalApproach} onChange={(e) => setSurgicalApproach(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Incision Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Starting...' : 'Log Incision & Start Case'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
