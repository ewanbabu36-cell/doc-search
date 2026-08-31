import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { DietaryOrderDto, DietaryDietTypeDto, CreateDietChangeRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  order: DietaryOrderDto;
  dietTypes: DietaryDietTypeDto[];
  onClose: () => void;
  onSubmit: (data: CreateDietChangeRequest) => Promise<void>;
}

export const CreateDietChangeDialog: React.FC<Props> = ({ isOpen, order, dietTypes, onClose, onSubmit }) => {
  const [newDietTypeId, setNewDietTypeId] = useState(dietTypes[0]?.id || '');
  const [justification, setJustification] = useState('Change of clinical protocol');
  const [orderingClinician, setOrderingClinician] = useState('Dr. Alok Verma');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        orderId: order.id,
        newDietTypeId,
        justification,
        orderingClinician
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Instant Diet Change Alert ({order.orderNumber})</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Diet Prescription</label>
            <Select
              value={newDietTypeId}
              onChange={(e) => setNewDietTypeId(e.target.value)}
              options={dietTypes.map((dt) => ({ value: dt.id, label: dt.dietName }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Justification</label>
            <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ordering Clinician</label>
            <Input value={orderingClinician} onChange={(e) => setOrderingClinician(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Applying...' : 'Apply & Alert Kitchen'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
