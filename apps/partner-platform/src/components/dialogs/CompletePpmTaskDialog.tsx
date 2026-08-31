import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { PpmScheduleDto, CompletePpmTaskRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  schedule: PpmScheduleDto;
  onClose: () => void;
  onSubmit: (scheduleId: string, data: CompletePpmTaskRequest) => Promise<void>;
}

export const CompletePpmTaskDialog: React.FC<Props> = ({ isOpen, schedule, onClose, onSubmit }) => {
  const [servicingNotes, setServicingNotes] = useState('All checklist items executed. Operational parameters verified against manufacturer specs.');
  const [passedInspection, setPassedInspection] = useState(true);
  const [partsReplacedInput, setPartsReplacedInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(schedule.id, {
        servicingNotes,
        passedInspection,
        partsReplaced: partsReplacedInput ? partsReplacedInput.split(',').map((p) => p.trim()) : []
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Complete PPM Task ({schedule.scheduleCode})</h2>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1">
          <p><strong>Equipment:</strong> {schedule.assetName} ({schedule.assetCode})</p>
          <p><strong>Department:</strong> {schedule.departmentName}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input type="checkbox" id="pass-chk" checked={passedInspection} onChange={(e) => setPassedInspection(e.target.checked)} className="rounded" />
            <label htmlFor="pass-chk" className="text-xs font-semibold text-gray-700">Passed Quality & Electrical Safety Check</label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Servicing Log Notes & Observations</label>
            <Input value={servicingNotes} onChange={(e) => setServicingNotes(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Parts Replaced (comma separated, if any)</label>
            <Input value={partsReplacedInput} onChange={(e) => setPartsReplacedInput(e.target.value)} placeholder="e.g. Expiratory valve membrane, O-ring" />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Completing...' : 'Sign & Complete PPM'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
