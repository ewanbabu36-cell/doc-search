import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { SurgeryRequestDto, RejectSurgeryRequestRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: SurgeryRequestDto | null;
  onSubmit: (req: RejectSurgeryRequestRequest) => Promise<void>;
  tenantId: string;
}

export const RejectSurgeryRequestDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  onSubmit,
  tenantId
}) => {
  const [rejectorName, setRejectorName] = useState('Dr. Arthur Vance');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        requestId: request.id,
        tenantId,
        rejectorName,
        reason
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-red-600 mb-2">Reject Surgery Request</h2>
        <p className="text-xs text-gray-500 mb-4">{request.requestNumber} — {request.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Rejector Name</label>
            <Input value={rejectorName} onChange={(e) => setRejectorName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Rejection</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Clinical or administrative justification" required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Rejecting...' : 'Reject Request'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
