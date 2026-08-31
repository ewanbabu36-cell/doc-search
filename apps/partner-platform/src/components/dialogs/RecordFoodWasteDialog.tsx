import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { RecordFoodWasteRequest, DietaryKitchenDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  kitchens: DietaryKitchenDto[];
  onClose: () => void;
  onSubmit: (data: RecordFoodWasteRequest) => Promise<void>;
}

export const RecordFoodWasteDialog: React.FC<Props> = ({ isOpen, kitchens, onClose, onSubmit }) => {
  const [kitchenName, setKitchenName] = useState(kitchens[0]?.kitchenName || 'Central Kitchen');
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [mealSlot, setMealSlot] = useState('LUNCH');
  const [preparedQuantity, setPreparedQuantity] = useState(150);
  const [servedQuantity, setServedQuantity] = useState(140);
  const [wastedQuantity, setWastedQuantity] = useState(10);
  const [unit] = useState('PORTIONS');
  const [reason, setReason] = useState<'OVERPRODUCTION' | 'SPOILAGE' | 'EXPIRY' | 'DAMAGED' | 'PATIENT_REFUSED' | 'DIET_CHANGED' | 'MISSED_DELIVERY' | 'QUALITY_FAILURE' | 'OTHER'>('OVERPRODUCTION');
  const [estimatedCostLoss, setEstimatedCostLoss] = useState(450);
  const [reportedBy, setReportedBy] = useState('Kitchen Supervisor Ramesh');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        kitchenName,
        mealDate,
        mealSlot,
        preparedQuantity,
        servedQuantity,
        wastedQuantity,
        unit,
        reason,
        estimatedCostLoss,
        reportedBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Log Kitchen Food Waste Record</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kitchen Facility</label>
            <Select
              value={kitchenName}
              onChange={(e) => setKitchenName(e.target.value)}
              options={kitchens.map((k) => ({ value: k.kitchenName, label: k.kitchenName }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meal Date</label>
              <Input type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meal Slot</label>
              <Input value={mealSlot} onChange={(e) => setMealSlot(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Prepared Qty</label>
              <Input type="number" value={String(preparedQuantity)} onChange={(e) => setPreparedQuantity(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Served Qty</label>
              <Input type="number" value={String(servedQuantity)} onChange={(e) => setServedQuantity(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Wasted Qty</label>
              <Input type="number" value={String(wastedQuantity)} onChange={(e) => setWastedQuantity(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Waste Cause</label>
              <Select
                value={reason}
                onChange={(e) => setReason(e.target.value as 'OVERPRODUCTION' | 'SPOILAGE' | 'EXPIRY' | 'DAMAGED' | 'PATIENT_REFUSED' | 'DIET_CHANGED' | 'MISSED_DELIVERY' | 'QUALITY_FAILURE' | 'OTHER')}
                options={[
                  { value: 'OVERPRODUCTION', label: 'Overproduction' },
                  { value: 'PATIENT_REFUSED', label: 'Patient Refusal' },
                  { value: 'DIET_CHANGED', label: 'Last Minute Diet Change / NPO' },
                  { value: 'SPOILAGE', label: 'Spoilage' },
                  { value: 'QUALITY_FAILURE', label: 'Quality Check Rejection' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Financial Loss (₹)</label>
              <Input type="number" value={String(estimatedCostLoss)} onChange={(e) => setEstimatedCostLoss(Number(e.target.value))} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reporting Staff</label>
            <Input value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Record Waste'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
