import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateDietaryProcurementReferenceRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDietaryProcurementReferenceRequest) => Promise<void>;
}

export const CreateProcurementReferenceDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [ingredientName, setIngredientName] = useState('');
  const [quantityRequested, setQuantityRequested] = useState(50);
  const [unit, setUnit] = useState('KG');
  const [urgency, setUrgency] = useState('ROUTINE');
  const [vendorRef, setVendorRef] = useState('Apex Agro Supplies Ltd.');
  const [requestedBy, setRequestedBy] = useState('Kitchen Supervisor Ramesh');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ingredientName,
        quantityRequested,
        unit,
        urgency,
        vendorRef,
        requestedBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Request Raw Ingredient Procurement</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ingredient / Raw Material</label>
            <Input value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} placeholder="e.g. Rolled Whole Oats" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
              <Input type="number" value={String(quantityRequested)} onChange={(e) => setQuantityRequested(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Requisition Urgency</label>
            <Select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              options={[
                { value: 'ROUTINE', label: 'Routine Restock' },
                { value: 'URGENT', label: 'Urgent (Stock Critical)' },
                { value: 'EMERGENCY', label: 'Emergency Stockout' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Vendor</label>
            <Input value={vendorRef} onChange={(e) => setVendorRef(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Requested By</label>
            <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit to Procurement'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
