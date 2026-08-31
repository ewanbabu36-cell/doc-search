import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateDietOrderRequest, DietaryDietTypeDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  dietTypes: DietaryDietTypeDto[];
  onClose: () => void;
  onSubmit: (data: CreateDietOrderRequest) => Promise<void>;
}

export const CreateDietOrderDialog: React.FC<Props> = ({ isOpen, dietTypes, onClose, onSubmit }) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [wardName, setWardName] = useState('Male Medical (3W)');
  const [roomBedNumber, setRoomBedNumber] = useState('Bed 301');
  const [selectedDietTypeId, setSelectedDietTypeId] = useState(dietTypes[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY'>('ROUTINE');
  const [isNpo, setIsNpo] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderingDoctor, setOrderingDoctor] = useState('Dr. Alok Verma, MD');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const selectedDt = dietTypes.find((d) => d.id === selectedDietTypeId) || dietTypes[0];
    if (!selectedDt) return;
    try {
      await onSubmit({
        patientId: crypto.randomUUID(),
        patientName,
        patientMrn,
        wardName,
        roomBedNumber,
        dietTypeId: selectedDt.id,
        dietTypeName: selectedDt.dietName,
        dietCategory: selectedDt.category,
        mealFrequency: `${selectedDt.mealFrequencyPerDay} Meals / Day`,
        startDate,
        texture: selectedDt.texture,
        feedingRoute: 'ORAL',
        priority,
        isNpo,
        specialInstructions,
        allergyWarnings: [],
        orderingDoctor
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Prescribe Inpatient Diet Order</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. MRN-2026-8812" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ward</label>
              <Input value={wardName} onChange={(e) => setWardName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bed Number</label>
              <Input value={roomBedNumber} onChange={(e) => setRoomBedNumber(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Prescribed Diet Profile</label>
            <Select
              value={selectedDietTypeId}
              onChange={(e) => setSelectedDietTypeId(e.target.value)}
              options={dietTypes.map((dt) => ({ value: dt.id, label: `${dt.dietName} (${dt.category})` }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Order Priority</label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY')}
                options={[
                  { value: 'ROUTINE', label: 'Routine Order' },
                  { value: 'URGENT', label: 'Urgent Processing' },
                  { value: 'STAT_EMERGENCY', label: 'STAT Immediate Priority' }
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <input type="checkbox" id="npo-chk" checked={isNpo} onChange={(e) => setIsNpo(e.target.checked)} className="rounded text-red-600" />
            <label htmlFor="npo-chk" className="text-xs font-bold text-red-800">Declare Strict Nil Per Os (NPO) — Halt all meals</label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical / Special Instructions</label>
            <Input value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="e.g. No salt added, serve hot soup" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Prescribing Doctor</label>
            <Input value={orderingDoctor} onChange={(e) => setOrderingDoctor(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Prescribing...' : 'Sign & Submit Order'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
