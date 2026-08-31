import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateDietTypeRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDietTypeRequest) => Promise<void>;
}

export const CreateDietTypeDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [dietCode, setDietCode] = useState('');
  const [dietName, setDietName] = useState('');
  const [category, setCategory] = useState('CUSTOM_THERAPEUTIC');
  const [clinicalPurpose, setClinicalPurpose] = useState('');
  const [allowedFoods, setAllowedFoods] = useState('');
  const [restrictedFoods, setRestrictedFoods] = useState('');
  const [targetCalories, setTargetCalories] = useState(2000);
  const [targetProteinGrams, setTargetProteinGrams] = useState(70);
  const [targetCarbsGrams, setTargetCarbsGrams] = useState(250);
  const [targetFatGrams, setTargetFatGrams] = useState(55);
  const [texture, setTexture] = useState<'REGULAR' | 'SOFT_MINCED' | 'PUREED' | 'LIQUIDISED' | 'THICKENED_FLUID'>('REGULAR');
  const [mealFrequencyPerDay, setMealFrequencyPerDay] = useState(4);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        dietCode,
        dietName,
        category,
        clinicalPurpose,
        allowedFoods,
        restrictedFoods,
        allergensToAvoid: [],
        targetCalories,
        targetProteinGrams,
        targetCarbsGrams,
        targetFatGrams,
        texture,
        mealFrequencyPerDay
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Define New Clinical Diet Type</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diet Code</label>
              <Input value={dietCode} onChange={(e) => setDietCode(e.target.value)} placeholder="e.g. DIET-CARDIAC-01" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diet Profile Name</label>
              <Input value={dietName} onChange={(e) => setDietName(e.target.value)} placeholder="e.g. Cardiac Low-Sodium" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Diet Category</label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'REGULAR', label: 'Regular / General Diet' },
                { value: 'DIABETIC', label: 'Diabetic Low-Glycemic' },
                { value: 'RENAL', label: 'Renal Low-Protein' },
                { value: 'CARDIAC', label: 'Cardiac Low-Sodium' },
                { value: 'SOFT', label: 'Soft / Dysphagia' },
                { value: 'LIQUID', label: 'Full / Clear Liquid' },
                { value: 'ENTERAL', label: 'Enteral Tube Feed' },
                { value: 'CUSTOM_THERAPEUTIC', label: 'Custom Therapeutic' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Indications / Purpose</label>
            <Input value={clinicalPurpose} onChange={(e) => setClinicalPurpose(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Permitted Foods</label>
            <Input value={allowedFoods} onChange={(e) => setAllowedFoods(e.target.value)} placeholder="e.g. Oats, boiled lentils, steamed vegetables" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Restricted / Forbidden Ingredients</label>
            <Input value={restrictedFoods} onChange={(e) => setRestrictedFoods(e.target.value)} placeholder="e.g. Extra salt, fried items, pickles" required />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Calories (kcal)</label>
              <Input type="number" value={String(targetCalories)} onChange={(e) => setTargetCalories(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Protein (g)</label>
              <Input type="number" value={String(targetProteinGrams)} onChange={(e) => setTargetProteinGrams(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Carbs (g)</label>
              <Input type="number" value={String(targetCarbsGrams)} onChange={(e) => setTargetCarbsGrams(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fat (g)</label>
              <Input type="number" value={String(targetFatGrams)} onChange={(e) => setTargetFatGrams(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Dietary Texture</label>
              <Select
                value={texture}
                onChange={(e) => setTexture(e.target.value as 'REGULAR' | 'SOFT_MINCED' | 'PUREED' | 'LIQUIDISED' | 'THICKENED_FLUID')}
                options={[
                  { value: 'REGULAR', label: 'Regular Solid' },
                  { value: 'SOFT_MINCED', label: 'Soft & Minced' },
                  { value: 'PUREED', label: 'Smooth Pureed' },
                  { value: 'LIQUIDISED', label: 'Liquidised / Drinkable' },
                  { value: 'THICKENED_FLUID', label: 'Thickened Fluid (IDDSI)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meal Frequency / Day</label>
              <Input type="number" value={String(mealFrequencyPerDay)} onChange={(e) => setMealFrequencyPerDay(Number(e.target.value))} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Save Diet Type'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
