import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietaryOrderDto, CreateDietPlanRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  order: DietaryOrderDto;
  onClose: () => void;
  onSubmit: (data: CreateDietPlanRequest) => Promise<void>;
}

export const CreateDietPlanDialog: React.FC<Props> = ({ isOpen, order, onClose, onSubmit }) => {
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [breakfastItems, setBreakfastItems] = useState('Oatmeal porridge, boiled egg white, skim milk');
  const [midMorningItems, setMidMorningItems] = useState('Roasted chana, green tea');
  const [lunchItems, setLunchItems] = useState('Brown rice, Moong dal, Lauki vegetable, salad');
  const [eveningSnackItems, setEveningSnackItems] = useState('Mixed sprout chaat');
  const [dinnerItems, setDinnerItems] = useState('2 Phulkas, Mixed veg curry, curd');
  const [bedtimeSnackItems, setBedtimeSnackItems] = useState('Warm skim milk');
  const [totalEstimatedCalories, setTotalEstimatedCalories] = useState(1850);
  const [totalEstimatedProtein, setTotalEstimatedProtein] = useState(72);
  const [specialPrepNotes, setSpecialPrepNotes] = useState('Low salt, peanut-free kitchen prep');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        orderId: order.id,
        planDate,
        breakfastItems,
        midMorningItems,
        lunchItems,
        eveningSnackItems,
        dinnerItems,
        bedtimeSnackItems,
        totalEstimatedCalories,
        totalEstimatedProtein,
        specialPrepNotes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Formulate Daily Meal Plan for {order.patientName}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Plan Date</label>
            <Input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Breakfast Menu Items</label>
            <Input value={breakfastItems} onChange={(e) => setBreakfastItems(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mid-Morning Snack</label>
            <Input value={midMorningItems} onChange={(e) => setMidMorningItems(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Lunch Menu Items</label>
            <Input value={lunchItems} onChange={(e) => setLunchItems(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Evening Snack</label>
            <Input value={eveningSnackItems} onChange={(e) => setEveningSnackItems(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dinner Menu Items</label>
            <Input value={dinnerItems} onChange={(e) => setDinnerItems(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Bedtime Snack</label>
            <Input value={bedtimeSnackItems} onChange={(e) => setBedtimeSnackItems(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Target Calories (kcal)</label>
              <Input type="number" value={String(totalEstimatedCalories)} onChange={(e) => setTotalEstimatedCalories(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Target Protein (g)</label>
              <Input type="number" value={String(totalEstimatedProtein)} onChange={(e) => setTotalEstimatedProtein(Number(e.target.value))} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Chef Preparation Notes</label>
            <Input value={specialPrepNotes} onChange={(e) => setSpecialPrepNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Release Meal Plan'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
