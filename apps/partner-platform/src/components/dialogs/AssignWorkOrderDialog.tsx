import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BreakdownWorkOrderDto, AssignWorkOrderRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  workOrder: BreakdownWorkOrderDto;
  onClose: () => void;
  onSubmit: (workOrderId: string, data: AssignWorkOrderRequest) => Promise<void>;
}

export const AssignWorkOrderDialog: React.FC<Props> = ({ isOpen, workOrder, onClose, onSubmit }) => {
  const [assignedEngineer, setAssignedEngineer] = useState('Er. Meenakshi Sundaram (BME)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(workOrder.id, { assignedEngineer });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Assign Work Order ({workOrder.workOrderNumber})</h2>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
          <p><strong>Equipment:</strong> {workOrder.assetName}</p>
          <p><strong>Problem:</strong> {workOrder.problemDescription}</p>
          <p><strong>Location:</strong> {workOrder.departmentName} - {workOrder.roomBedLocation}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Biomedical Engineer</label>
            <Input value={assignedEngineer} onChange={(e) => setAssignedEngineer(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Assigning...' : 'Assign Engineer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
