import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BreakdownWorkOrderDto, CompleteWorkOrderRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  workOrder: BreakdownWorkOrderDto;
  onClose: () => void;
  onSubmit: (workOrderId: string, data: CompleteWorkOrderRequest) => Promise<void>;
}

export const CompleteWorkOrderDialog: React.FC<Props> = ({ isOpen, workOrder, onClose, onSubmit }) => {
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState('Drive belt tensioner failure due to particulate accumulation');
  const [correctiveActionTaken, setCorrectiveActionTaken] = useState('Replaced drive belt assembly and recalibrated mechanical limits');
  const [laborHours, setLaborHours] = useState(2.5);
  const [sparePartsCost, setSparePartsCost] = useState(35000);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(workOrder.id, {
        rootCauseAnalysis,
        correctiveActionTaken,
        laborHours,
        sparePartsCost
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Complete Repair & Service ({workOrder.workOrderNumber})</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Root Cause Analysis (RCA)</label>
            <Input value={rootCauseAnalysis} onChange={(e) => setRootCauseAnalysis(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Corrective Action Taken</label>
            <Input value={correctiveActionTaken} onChange={(e) => setCorrectiveActionTaken(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Labor Time (Hours)</label>
              <Input type="number" step="0.5" value={String(laborHours)} onChange={(e) => setLaborHours(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Spare Parts Incurred Cost (₹)</label>
              <Input type="number" value={String(sparePartsCost)} onChange={(e) => setSparePartsCost(Number(e.target.value))} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Completing...' : 'Submit for Clinician Sign-off'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
