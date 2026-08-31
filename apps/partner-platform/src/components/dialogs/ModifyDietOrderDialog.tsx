import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { DietaryOrderDto, DietaryDietTypeDto, ModifyDietOrderRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  order: DietaryOrderDto;
  dietTypes: DietaryDietTypeDto[];
  onClose: () => void;
  onSubmit: (orderId: string, data: ModifyDietOrderRequest) => Promise<void>;
}

export const ModifyDietOrderDialog: React.FC<Props> = ({ isOpen, order, dietTypes, onClose, onSubmit }) => {
  const [newDietTypeId, setNewDietTypeId] = useState(dietTypes[0]?.id || '');
  const [modificationReason, setModificationReason] = useState('Patient clinical status improved — transitioning from soft to regular diet');
  const [modifiedBy, setModifiedBy] = useState('Dietitian Suman Rao');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const dt = dietTypes.find((d) => d.id === newDietTypeId) || dietTypes[0];
    if (!dt) return;
    try {
      await onSubmit(order.id, {
        newDietTypeId: dt.id,
        newDietTypeName: dt.dietName,
        modificationReason,
        modifiedBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Modify Active Diet Order ({order.orderNumber})</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Clinical Diet Type</label>
            <Select
              value={newDietTypeId}
              onChange={(e) => setNewDietTypeId(e.target.value)}
              options={dietTypes.map((dt) => ({ value: dt.id, label: dt.dietName }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Modification Rationale</label>
            <Input value={modificationReason} onChange={(e) => setModificationReason(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Dietitian / Doctor</label>
            <Input value={modifiedBy} onChange={(e) => setModifiedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Modifying...' : 'Save & Intercept Meals'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
