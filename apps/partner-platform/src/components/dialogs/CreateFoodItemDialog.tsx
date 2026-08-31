import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateFoodItemRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFoodItemRequest) => Promise<void>;
}

export const CreateFoodItemDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('MAIN_COURSE');
  const [unit, setUnit] = useState('PORTION');
  const [caloriesPerUnit, setCaloriesPerUnit] = useState(150);
  const [proteinPerUnit, setProteinPerUnit] = useState(6);
  const [carbsPerUnit, setCarbsPerUnit] = useState(25);
  const [fatPerUnit, setFatPerUnit] = useState(3);
  const [storageType, setStorageType] = useState('DRY');
  const [estimatedUnitCost, setEstimatedUnitCost] = useState(40);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        itemCode,
        itemName,
        category,
        unit,
        caloriesPerUnit,
        proteinPerUnit,
        carbsPerUnit,
        fatPerUnit,
        allergens: [],
        storageType,
        estimatedUnitCost
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Add Nutritional Ingredient / Food Item</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Item Code</label>
            <Input value={itemCode} onChange={(e) => setItemCode(e.target.value)} placeholder="e.g. ITEM-DAL-01" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Item Name</label>
            <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Yellow Moong Dal (Leached)" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: 'BREAKFAST', label: 'Breakfast Item' },
                  { value: 'MAIN_COURSE', label: 'Main Course' },
                  { value: 'SOUP_BEVERAGE', label: 'Soup & Beverage' },
                  { value: 'SNACK', label: 'Nutritional Snack' },
                  { value: 'ENTERAL_FORMULA', label: 'Enteral Tube Feed Formula' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Serving Unit</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Calories</label>
              <Input type="number" value={String(caloriesPerUnit)} onChange={(e) => setCaloriesPerUnit(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Protein (g)</label>
              <Input type="number" value={String(proteinPerUnit)} onChange={(e) => setProteinPerUnit(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Carbs (g)</label>
              <Input type="number" value={String(carbsPerUnit)} onChange={(e) => setCarbsPerUnit(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fat (g)</label>
              <Input type="number" value={String(fatPerUnit)} onChange={(e) => setFatPerUnit(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Storage Requirement</label>
              <Select
                value={storageType}
                onChange={(e) => setStorageType(e.target.value)}
                options={[
                  { value: 'DRY', label: 'Dry Ambient Storage' },
                  { value: 'COLD', label: 'Cold Refrigeration (2-8°C)' },
                  { value: 'FROZEN', label: 'Deep Freeze (-18°C)' },
                  { value: 'HOT_HOLDING', label: 'Hot Holding (>65°C)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Cost (₹)</label>
              <Input type="number" value={String(estimatedUnitCost)} onChange={(e) => setEstimatedUnitCost(Number(e.target.value))} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Food Item'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
