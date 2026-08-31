import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyOrderDto, CancelRadiologyStudyRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderDto | null;
  onSubmit: (req: CancelRadiologyStudyRequest) => Promise<void>;
  tenantId: string;
}

export const CancelRadiologyDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
  tenantId
}) => {
  const [reason, setReason] = useState('Patient clinical condition resolved or alternative diagnostic selected.');
  const [staff, setStaff] = useState('Dr. Meredith Grey, MD');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        orderId: order.id,
        cancellationReason: reason,
        cancelledByStaff: staff
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-red-600 mb-2">Cancel Radiology Order</h2>
        <p className="text-xs text-gray-500 mb-4">{order.orderNumber} — {order.patientName} ({order.procedureName})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cancellation Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Doctor / Staff</label>
            <Input value={staff} onChange={(e) => setStaff(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Close</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Cancelling...' : 'Confirm Cancellation'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
