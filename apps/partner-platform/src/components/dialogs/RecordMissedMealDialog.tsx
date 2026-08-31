import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietaryMealDispatchDto, RecordMissedMealRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  dispatch: DietaryMealDispatchDto;
  onClose: () => void;
  onSubmit: (dispatchId: string, data: RecordMissedMealRequest) => Promise<void>;
}

export const RecordMissedMealDialog: React.FC<Props> = ({ isOpen, dispatch, onClose, onSubmit }) => {
  const [reasonDescription, setReasonDescription] = useState('Patient away for CT Scan during lunch service window');
  const [reportedBy, setReportedBy] = useState('Delivery Officer Gopal');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(dispatch.id, { reasonDescription, reportedBy });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Record Missed Meal Delivery</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Missed Delivery</label>
            <Input value={reasonDescription} onChange={(e) => setReasonDescription(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reported By</label>
            <Input value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="outline" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Log Missed Meal'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
