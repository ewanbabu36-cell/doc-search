import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateProductionPlanRequest, DietaryKitchenDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  kitchens: DietaryKitchenDto[];
  onClose: () => void;
  onSubmit: (data: CreateProductionPlanRequest) => Promise<void>;
}

export const CreateProductionPlanDialog: React.FC<Props> = ({ isOpen, kitchens, onClose, onSubmit }) => {
  const [kitchenId, setKitchenId] = useState(kitchens[0]?.id || '');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [mealSlot, setMealSlot] = useState<'BREAKFAST' | 'MID_MORNING_SNACK' | 'LUNCH' | 'EVENING_SNACK' | 'DINNER' | 'BEDTIME_SNACK' | 'CUSTOM'>('LUNCH');
  const [totalPatientsCount, setTotalPatientsCount] = useState(150);
  const [regularMealsCount, setRegularMealsCount] = useState(90);
  const [therapeuticMealsCount, setTherapeuticMealsCount] = useState(48);
  const [npoCount, setNpoCount] = useState(12);
  const [specialAllergyCount, setSpecialAllergyCount] = useState(10);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        kitchenId,
        productionDate,
        mealSlot,
        totalPatientsCount,
        regularMealsCount,
        therapeuticMealsCount,
        npoCount,
        specialAllergyCount
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Generate Kitchen Batch Production Plan</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Kitchen Facility</label>
            <Select
              value={kitchenId}
              onChange={(e) => setKitchenId(e.target.value)}
              options={kitchens.map((k) => ({ value: k.id, label: k.kitchenName }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Production Date</label>
              <Input type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} required />
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Inpatient Census</label>
              <Input type="number" value={String(totalPatientsCount)} onChange={(e) => setTotalPatientsCount(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Regular Meals Required</label>
              <Input type="number" value={String(regularMealsCount)} onChange={(e) => setRegularMealsCount(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Therapeutic</label>
              <Input type="number" value={String(therapeuticMealsCount)} onChange={(e) => setTherapeuticMealsCount(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">NPO (Fasting)</label>
              <Input type="number" value={String(npoCount)} onChange={(e) => setNpoCount(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Allergy Alerts</label>
              <Input type="number" value={String(specialAllergyCount)} onChange={(e) => setSpecialAllergyCount(Number(e.target.value))} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Generating...' : 'Calculate Batch Census'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
