import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietaryKitchenDto, UpdateKitchenRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  kitchen: DietaryKitchenDto;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateKitchenRequest) => Promise<void>;
}

export const EditKitchenDialog: React.FC<Props> = ({ isOpen, kitchen, onClose, onSubmit }) => {
  const [kitchenName, setKitchenName] = useState(kitchen.kitchenName);
  const [location, setLocation] = useState(kitchen.location);
  const [dailyCapacity, setDailyCapacity] = useState(kitchen.dailyCapacity);
  const [operatingHours, setOperatingHours] = useState(kitchen.operatingHours);
  const [responsibleManager, setResponsibleManager] = useState(kitchen.responsibleManager);
  const [contactPhone, setContactPhone] = useState(kitchen.contactPhone);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(kitchen.id, {
        kitchenName,
        location,
        dailyCapacity,
        operatingHours,
        responsibleManager,
        contactPhone
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Update Kitchen Parameters ({kitchen.kitchenCode})</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kitchen Facility Name</label>
            <Input value={kitchenName} onChange={(e) => setKitchenName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Physical Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Daily Meal Output Capacity</label>
            <Input type="number" value={String(dailyCapacity)} onChange={(e) => setDailyCapacity(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Operating Hours</label>
            <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible Manager</label>
            <Input value={responsibleManager} onChange={(e) => setResponsibleManager(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone (10-Digit Mobile)</label>
            <div className="flex items-center">
              <span className="px-2.5 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-xs font-bold text-gray-700">+91</span>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setContactPhone(digits.slice(0, 10));
                }}
                maxLength={10}
                placeholder="98765 43210"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r text-xs focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Updating...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
