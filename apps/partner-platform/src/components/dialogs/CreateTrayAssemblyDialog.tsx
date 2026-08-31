import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { DietaryOrderDto, CreateTrayAssemblyRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  orders: DietaryOrderDto[];
  onClose: () => void;
  onSubmit: (data: CreateTrayAssemblyRequest) => Promise<void>;
}

export const CreateTrayAssemblyDialog: React.FC<Props> = ({ isOpen, orders, onClose, onSubmit }) => {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [mealSlot, setMealSlot] = useState<'BREAKFAST' | 'MID_MORNING_SNACK' | 'LUNCH' | 'EVENING_SNACK' | 'DINNER' | 'BEDTIME_SNACK' | 'CUSTOM'>('LUNCH');
  const [itemsIncluded, setItemsIncluded] = useState('Brown rice, Moong dal, Lauki sabzi, Cucumber salad');
  const [allergyNotice, setAllergyNotice] = useState('PEANUT ALLERGY TAG ATTACHED');
  const [assembledByStaff, setAssembledByStaff] = useState('Assembly Tech Vikram');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        orderId: selectedOrderId,
        mealSlot,
        itemsIncluded,
        allergyNotice,
        assembledByStaff
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Assemble Patient Meal Tray</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Diet Order</label>
            <Select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              options={orders.map((o) => ({ value: o.id, label: `${o.patientName} (${o.wardName} - ${o.roomBedNumber}) - ${o.dietTypeName}` }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Meal Slot</label>
            <Select
              value={mealSlot}
              onChange={(e) => setMealSlot(e.target.value as 'BREAKFAST' | 'MID_MORNING_SNACK' | 'LUNCH' | 'EVENING_SNACK' | 'DINNER' | 'BEDTIME_SNACK' | 'CUSTOM')}
              options={[
                { value: 'BREAKFAST', label: 'Breakfast' },
                { value: 'LUNCH', label: 'Lunch' },
                { value: 'EVENING_SNACK', label: 'Evening Snack' },
                { value: 'DINNER', label: 'Dinner' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tray Plated Menu Items</label>
            <Input value={itemsIncluded} onChange={(e) => setItemsIncluded(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Allergy / Safety Tag Label</label>
            <Input value={allergyNotice} onChange={(e) => setAllergyNotice(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assembly Technician Name</label>
            <Input value={assembledByStaff} onChange={(e) => setAssembledByStaff(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Assembling...' : 'Tag & Seal Tray'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
