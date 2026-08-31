import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietaryProductionPlanDto, ReleaseProductionPlanRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  plan: DietaryProductionPlanDto;
  onClose: () => void;
  onSubmit: (planId: string, data: ReleaseProductionPlanRequest) => Promise<void>;
}

export const ReleaseProductionPlanDialog: React.FC<Props> = ({ isOpen, plan, onClose, onSubmit }) => {
  const [releasedBy, setReleasedBy] = useState('Chef Rajesh Khanna (Executive Chef)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(plan.id, { releasedBy });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Release Production Plan ({plan.planNumber})</h2>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-xs space-y-1">
          <p><strong>Kitchen:</strong> {plan.kitchenName}</p>
          <p><strong>Date / Slot:</strong> {plan.productionDate} ({plan.mealSlot})</p>
          <p><strong>Total Meal Batches:</strong> {plan.totalPatientsCount - plan.npoCount} Meals</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Releasing Kitchen Executive</label>
            <Input value={releasedBy} onChange={(e) => setReleasedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Releasing...' : 'Release Batch to Culinary Team'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
