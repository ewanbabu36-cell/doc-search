import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DispatchMealRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  trayBarcode: string;
  patientName: string;
  wardName: string;
  onClose: () => void;
  onSubmit: (data: DispatchMealRequest) => Promise<void>;
}

export const DispatchMealDialog: React.FC<Props> = ({ isOpen, trayBarcode, patientName, wardName, onClose, onSubmit }) => {
  const [deliveryPersonName, setDeliveryPersonName] = useState('Ward Attendant Gopal Singh');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ trayBarcode, deliveryPersonName });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Dispatch Tray to Ward Trolley</h2>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs space-y-1">
          <p><strong>Tray Barcode:</strong> {trayBarcode}</p>
          <p><strong>Patient:</strong> {patientName}</p>
          <p><strong>Destination:</strong> {wardName}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Delivery Staff / Porter</label>
            <Input value={deliveryPersonName} onChange={(e) => setDeliveryPersonName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Dispatching...' : 'Confirm Dispatch'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
