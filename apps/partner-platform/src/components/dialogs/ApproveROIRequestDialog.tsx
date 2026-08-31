import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { ReleaseOfInformationRequestDto, ApproveROIRequestRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: ReleaseOfInformationRequestDto | null;
  onSubmit: (req: ApproveROIRequestRequest) => Promise<void>;
  tenantId: string;
}

export const ApproveROIRequestDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  onSubmit,
  tenantId
}) => {
  const [officer, setOfficer] = useState('Marcus Chen, RHIT (HIM Officer)');
  const [notes, setNotes] = useState('Government ID and patient authorization consent verified; cleared for digital packet assembly.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        requestId: request.id,
        authorizedByOfficer: officer,
        notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Approve ROI Disclosure</h2>
        <p className="text-xs text-gray-500 mb-4">{request.requestNumber} — {request.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing HIM Officer</label>
            <Input value={officer} onChange={(e) => setOfficer(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Approval Verification Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Approving...' : 'Approve ROI Request'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
