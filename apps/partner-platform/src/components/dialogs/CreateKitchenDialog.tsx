import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateKitchenRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateKitchenRequest) => Promise<void>;
}

export const CreateKitchenDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [kitchenCode, setKitchenCode] = useState('');
  const [kitchenName, setKitchenName] = useState('');
  const [kitchenType, setKitchenType] = useState<'CENTRAL' | 'SATELLITE' | 'PANTRY' | 'DIETARY_UNIT'>('CENTRAL');
  const [location, setLocation] = useState('');
  const [dailyCapacity, setDailyCapacity] = useState(500);
  const [operatingHours, setOperatingHours] = useState('05:00 - 22:00');
  const [responsibleManager, setResponsibleManager] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [foodSafetyStatus, setFoodSafetyStatus] = useState('COMPLIANT_HACCP');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        kitchenCode,
        kitchenName,
        kitchenType,
        location,
        dailyCapacity,
        operatingHours,
        responsibleManager,
        contactPhone,
        foodSafetyStatus
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Register New Dietary Kitchen Facility</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kitchen Code</label>
            <Input value={kitchenCode} onChange={(e) => setKitchenCode(e.target.value)} placeholder="e.g. KIT-MAIN-01" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kitchen Facility Name</label>
            <Input value={kitchenName} onChange={(e) => setKitchenName(e.target.value)} placeholder="e.g. Central Production Kitchen" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kitchen Facility Type</label>
            <Select
              value={kitchenType}
              onChange={(e) => setKitchenType(e.target.value as 'CENTRAL' | 'SATELLITE' | 'PANTRY' | 'DIETARY_UNIT')}
              options={[
                { value: 'CENTRAL', label: 'Central Hospital Production Kitchen' },
                { value: 'SATELLITE', label: 'Satellite Ward Kitchen' },
                { value: 'PANTRY', label: 'ICU / Specialized Care Pantry' },
                { value: 'DIETARY_UNIT', label: 'Therapeutic Formula Dietary Unit' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Physical Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Basement 1, Service Block" required />
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible Kitchen Manager / Executive Chef</label>
            <Input value={responsibleManager} onChange={(e) => setResponsibleManager(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Direct Contact Phone</label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Food Safety & Hygiene Certification</label>
            <Input value={foodSafetyStatus} onChange={(e) => setFoodSafetyStatus(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Kitchen'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
