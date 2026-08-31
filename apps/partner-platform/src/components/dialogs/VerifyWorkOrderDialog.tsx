import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BreakdownWorkOrderDto, VerifyWorkOrderRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  workOrder: BreakdownWorkOrderDto;
  onClose: () => void;
  onSubmit: (workOrderId: string, data: VerifyWorkOrderRequest) => Promise<void>;
}

export const VerifyWorkOrderDialog: React.FC<Props> = ({ isOpen, workOrder, onClose, onSubmit }) => {
  const [verifiedByClinicianName, setVerifiedByClinicianName] = useState('Dr. Vivek Mehra (Surgeon)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(workOrder.id, { verifiedByClinicianName });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Clinician Handover & Readiness Verification</h2>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1">
          <p><strong>Equipment:</strong> {workOrder.assetName}</p>
          <p><strong>Action Done:</strong> {workOrder.correctiveActionTaken || 'Repaired'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Verifying Clinician / Nursing In-charge</label>
            <Input value={verifiedByClinicianName} onChange={(e) => setVerifiedByClinicianName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Sign & Return to Service'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
