import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietaryProductionPlanDto, RecordMealPreparationRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  productionPlan: DietaryProductionPlanDto;
  onClose: () => void;
  onSubmit: (data: RecordMealPreparationRequest) => Promise<void>;
}

export const RecordMealPreparationDialog: React.FC<Props> = ({ isOpen, productionPlan, onClose, onSubmit }) => {
  const [dietCategory, setDietCategory] = useState('THERAPEUTIC_DIABETIC');
  const [foodItemName, setFoodItemName] = useState('Therapeutic Moong Dal Tadka');
  const [quantityPrepared, setQuantityPrepared] = useState(60);
  const [unit, setUnit] = useState('PORTIONS');
  const [headChef, setHeadChef] = useState('Chef Rajesh Khanna');
  const [cookingTemperatureC, setCookingTemperatureC] = useState(98.5);
  const [holdingTemperatureC, setHoldingTemperatureC] = useState(68.0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        productionPlanId: productionPlan.id,
        dietCategory,
        foodItemName,
        quantityPrepared,
        unit,
        headChef,
        cookingTemperatureC,
        holdingTemperatureC
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Log Batch Culinary Preparation</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Diet / Recipe Category</label>
            <Input value={dietCategory} onChange={(e) => setDietCategory(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Prepared Dish / Food Item</label>
            <Input value={foodItemName} onChange={(e) => setFoodItemName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Cooked</label>
              <Input type="number" value={String(quantityPrepared)} onChange={(e) => setQuantityPrepared(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Chef Responsible</label>
            <Input value={headChef} onChange={(e) => setHeadChef(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cooking Core Temp (°C)</label>
              <Input type="number" step="0.1" value={String(cookingTemperatureC)} onChange={(e) => setCookingTemperatureC(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hot Holding Temp (°C)</label>
              <Input type="number" step="0.1" value={String(holdingTemperatureC)} onChange={(e) => setHoldingTemperatureC(Number(e.target.value))} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Log Batch Completion'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
