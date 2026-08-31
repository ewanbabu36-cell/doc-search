import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CondemnationRecordDto, ApproveCondemnationRequest, CondemnationStatus } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  condemnation: CondemnationRecordDto;
  onClose: () => void;
  onSubmit: (condemnationId: string, data: ApproveCondemnationRequest) => Promise<void>;
}

export const ApproveCondemnationDialog: React.FC<Props> = ({ isOpen, condemnation, onClose, onSubmit }) => {
  const [status, setStatus] = useState<CondemnationStatus>('APPROVED_FOR_SCRAP');
  const [approvedBy, setApprovedBy] = useState('Dr. Alok Verma (Medical Director)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(condemnation.id, { status, approvedBy });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Condemnation Board Decision ({condemnation.condemnationCode})</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Board Decision Status</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as CondemnationStatus)}
              options={[
                { value: 'APPROVED_FOR_SCRAP', label: 'APPROVED — Decommission & Scrap' },
                { value: 'DISPOSED_HAZARDOUS', label: 'APPROVED — Biohazard / E-Waste Disposal' },
                { value: 'DISPOSED_GENERAL', label: 'APPROVED — General Auction / Donation' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Board Signatory</label>
            <Input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Authorizing...' : 'Authorize Decommissioning'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
