import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateMenuTemplateRequest, DietaryKitchenDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  kitchens: DietaryKitchenDto[];
  onClose: () => void;
  onSubmit: (data: CreateMenuTemplateRequest) => Promise<void>;
}

export const CreateMenuTemplateDialog: React.FC<Props> = ({ isOpen, kitchens, onClose, onSubmit }) => {
  const [templateCode, setTemplateCode] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [dietCategory, setDietCategory] = useState('REGULAR');
  const [mealSlot, setMealSlot] = useState<'BREAKFAST' | 'MID_MORNING_SNACK' | 'LUNCH' | 'EVENING_SNACK' | 'DINNER' | 'BEDTIME_SNACK' | 'CUSTOM'>('LUNCH');
  const [menuItemsDescription, setMenuItemsDescription] = useState('');
  const [portionSize, setPortionSize] = useState('1 Standard Tray');
  const [estimatedCalories, setEstimatedCalories] = useState(550);
  const [estimatedCost, setEstimatedCost] = useState(90);
  const [kitchenId, setKitchenId] = useState(kitchens[0]?.id || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        templateCode,
        templateName,
        dietCategory,
        mealSlot,
        menuItemsDescription,
        ingredientList: [],
        portionSize,
        estimatedCalories,
        estimatedCost,
        kitchenId
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Create Meal Menu Template</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Template Code</label>
            <Input value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} placeholder="e.g. MENU-DINNER-CARDIAC" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Template Name</label>
            <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Cardiac Low-Salt Dinner Platter" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diet Category</label>
              <Select
                value={dietCategory}
                onChange={(e) => setDietCategory(e.target.value)}
                options={[
                  { value: 'REGULAR', label: 'Regular' },
                  { value: 'DIABETIC', label: 'Diabetic' },
                  { value: 'RENAL', label: 'Renal' },
                  { value: 'CARDIAC', label: 'Cardiac' },
                  { value: 'SOFT', label: 'Soft' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meal Slot</label>
              <Select
                value={mealSlot}
                onChange={(e) => setMealSlot(e.target.value as 'BREAKFAST' | 'MID_MORNING_SNACK' | 'LUNCH' | 'EVENING_SNACK' | 'DINNER' | 'BEDTIME_SNACK' | 'CUSTOM')}
                options={[
                  { value: 'BREAKFAST', label: 'Breakfast' },
                  { value: 'MID_MORNING_SNACK', label: 'Mid-Morning' },
                  { value: 'LUNCH', label: 'Lunch' },
                  { value: 'EVENING_SNACK', label: 'Evening Snack' },
                  { value: 'DINNER', label: 'Dinner' }
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Menu Items Description</label>
            <Input value={menuItemsDescription} onChange={(e) => setMenuItemsDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Portion Size</label>
              <Input value={portionSize} onChange={(e) => setPortionSize(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Est. Calories</label>
              <Input type="number" value={String(estimatedCalories)} onChange={(e) => setEstimatedCalories(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Est. Cost (₹)</label>
              <Input type="number" value={String(estimatedCost)} onChange={(e) => setEstimatedCost(Number(e.target.value))} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Production Kitchen</label>
            <Select
              value={kitchenId}
              onChange={(e) => setKitchenId(e.target.value)}
              options={kitchens.map((k) => ({ value: k.id, label: k.kitchenName }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Save Template'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
