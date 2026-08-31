import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OverrideBedAllocationRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  bedId: string;
  onClose: () => void;
  onSubmit: (data: OverrideBedAllocationRequest) => Promise<void>;
}

export const OverrideBedAllocationDialog: React.FC<Props> = ({ isOpen, bedId, onClose, onSubmit }) => {
  const [targetPatientMrn, setTargetPatientMrn] = useState('');
  const [overrideReason, setOverrideReason] = useState('Executive clinical escalation: STAT ICU transfer required for acute deteriorating cardiac patient.');
  const [authorizedBy, setAuthorizedBy] = useState('Dr. Alok Verma (Medical Director)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        bedId,
        targetPatientMrn,
        overrideReason,
        authorizedBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-amber-700">⚡ Executive Bed Allocation Override</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Patient MRN</label>
            <Input value={targetPatientMrn} onChange={(e) => setTargetPatientMrn(e.target.value)} placeholder="e.g. MRN-2026-9021" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Executive Override Justification</label>
            <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Medical Director</label>
            <Input value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Executing...' : 'Force Bed Allocation'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
