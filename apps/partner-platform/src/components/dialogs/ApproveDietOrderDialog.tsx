import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietaryOrderDto, ApproveDietOrderRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  order: DietaryOrderDto;
  onClose: () => void;
  onSubmit: (orderId: string, data: ApproveDietOrderRequest) => Promise<void>;
}

export const ApproveDietOrderDialog: React.FC<Props> = ({ isOpen, order, onClose, onSubmit }) => {
  const [dietitianName, setDietitianName] = useState('Dietitian Suman Rao, RD');
  const [approvalNotes, setApprovalNotes] = useState('Nutritional calculation and allergy check verified');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(order.id, { dietitianName, approvalNotes });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Approve Diet Order ({order.orderNumber})</h2>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs space-y-1">
          <p><strong>Patient:</strong> {order.patientName} ({order.patientMrn})</p>
          <p><strong>Ward / Bed:</strong> {order.wardName} - {order.roomBedNumber}</p>
          <p><strong>Prescribed Diet:</strong> {order.dietTypeName}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reviewing Registered Dietitian</label>
            <Input value={dietitianName} onChange={(e) => setDietitianName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Review & Verification Notes</label>
            <Input value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Approving...' : 'Approve & Release to Kitchen'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
