import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { DietaryMealDispatchDto, ConfirmMealDeliveryRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  dispatch: DietaryMealDispatchDto;
  onClose: () => void;
  onSubmit: (dispatchId: string, data: ConfirmMealDeliveryRequest) => Promise<void>;
}

export const ConfirmMealDeliveryDialog: React.FC<Props> = ({ isOpen, dispatch, onClose, onSubmit }) => {
  const [receivedBy, setReceivedBy] = useState('PATIENT_CONFIRMED');
  const [deliveryStaff, setDeliveryStaff] = useState('Ward Attendant Gopal Singh');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(dispatch.id, { receivedBy, deliveryStaff });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Confirm Bedside Meal Delivery</h2>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-xs space-y-1">
          <p><strong>Patient:</strong> {dispatch.patientName} ({dispatch.patientMrn})</p>
          <p><strong>Location:</strong> {dispatch.wardName} - {dispatch.roomBedNumber}</p>
          <p><strong>Meal Slot:</strong> {dispatch.mealSlot} ({dispatch.dietTypeName})</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Handover / Delivery Recipient</label>
            <Select
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              options={[
                { value: 'PATIENT_CONFIRMED', label: 'Direct Patient Handover' },
                { value: 'ATTENDANT_CONFIRMED', label: 'Patient Attendant / Family' },
                { value: 'WARD_NURSE_HANDOVER', label: 'Ward Staff Nurse' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Delivering Staff Name</label>
            <Input value={deliveryStaff} onChange={(e) => setDeliveryStaff(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Confirming...' : 'Confirm Delivery'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
