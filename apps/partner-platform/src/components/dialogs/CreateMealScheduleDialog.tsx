import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { DietaryOrderDto, CreateMealScheduleRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  orders: DietaryOrderDto[];
  onClose: () => void;
  onSubmit: (data: CreateMealScheduleRequest) => Promise<void>;
}

export const CreateMealScheduleDialog: React.FC<Props> = ({ isOpen, orders, onClose, onSubmit }) => {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [mealSlot, setMealSlot] = useState<'BREAKFAST' | 'MID_MORNING_SNACK' | 'LUNCH' | 'EVENING_SNACK' | 'DINNER' | 'BEDTIME_SNACK' | 'CUSTOM'>('LUNCH');
  const [itemsToServe, setItemsToServe] = useState('Standard hospital diet tray');
  const [scheduledDispatchTime, setScheduledDispatchTime] = useState('12:30');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        orderId: selectedOrderId,
        mealDate,
        mealSlot,
        itemsToServe,
        scheduledDispatchTime
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Schedule Inpatient Meal Service</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Patient Diet Order</label>
            <Select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              options={orders.map((o) => ({ value: o.id, label: `${o.patientName} (${o.wardName} - ${o.roomBedNumber}) - ${o.dietTypeName}` }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meal Date</label>
              <Input type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meal Slot</label>
              <Select
                value={mealSlot}
                onChange={(e) => setMealSlot(e.target.value as 'BREAKFAST' | 'MID_MORNING_SNACK' | 'LUNCH' | 'EVENING_SNACK' | 'DINNER' | 'BEDTIME_SNACK' | 'CUSTOM')}
                options={[
                  { value: 'BREAKFAST', label: 'Breakfast (08:00)' },
                  { value: 'LUNCH', label: 'Lunch (12:30)' },
                  { value: 'EVENING_SNACK', label: 'Evening Snack (16:30)' },
                  { value: 'DINNER', label: 'Dinner (19:30)' }
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Items to Serve</label>
            <Input value={itemsToServe} onChange={(e) => setItemsToServe(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Dispatch Time</label>
            <Input value={scheduledDispatchTime} onChange={(e) => setScheduledDispatchTime(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule Meal'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
