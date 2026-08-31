import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietaryMealDispatchDto, RefuseMealRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  dispatch: DietaryMealDispatchDto;
  onClose: () => void;
  onSubmit: (dispatchId: string, data: RefuseMealRequest) => Promise<void>;
}

export const RefuseMealDialog: React.FC<Props> = ({ isOpen, dispatch, onClose, onSubmit }) => {
  const [reasonDescription, setReasonDescription] = useState('Patient reported nausea / loss of appetite');
  const [reportedByNurse, setReportedByNurse] = useState('Staff Nurse Anita');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(dispatch.id, { reasonDescription, reportedByNurse });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Record Patient Meal Refusal</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Refusal Reason / Symptoms</label>
            <Input value={reasonDescription} onChange={(e) => setReasonDescription(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reporting Ward Nurse</label>
            <Input value={reportedByNurse} onChange={(e) => setReportedByNurse(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Log Refusal'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
