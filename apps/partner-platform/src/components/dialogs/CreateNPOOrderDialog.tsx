import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietaryOrderDto, CreateNPOOrderRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  order: DietaryOrderDto;
  onClose: () => void;
  onSubmit: (data: CreateNPOOrderRequest) => Promise<void>;
}

export const CreateNPOOrderDialog: React.FC<Props> = ({ isOpen, order, onClose, onSubmit }) => {
  const [npoReason, setNpoReason] = useState('Emergency Laparoscopy scheduled for 18:00 - Strict pre-op fast');
  const [orderingDoctor, setOrderingDoctor] = useState('Dr. Vivek Mehra (Surgeon)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        orderId: order.id,
        npoReason,
        orderingDoctor
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border-2 border-red-500">
        <h2 className="text-lg font-bold text-red-700">🚨 Declare Strict Nil Per Os (NPO)</h2>
        <p className="text-xs text-gray-600">Patient: <strong>{order.patientName}</strong> ({order.wardName} - {order.roomBedNumber})</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Indication / Fasting Reason</label>
            <Input value={npoReason} onChange={(e) => setNpoReason(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ordering Doctor</label>
            <Input value={orderingDoctor} onChange={(e) => setOrderingDoctor(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Activating NPO...' : 'Enforce Immediate NPO'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
