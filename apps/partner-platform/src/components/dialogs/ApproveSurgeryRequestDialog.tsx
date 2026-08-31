import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { SurgeryRequestDto, ApproveSurgeryRequestRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: SurgeryRequestDto | null;
  onSubmit: (req: ApproveSurgeryRequestRequest) => Promise<void>;
  tenantId: string;
}

export const ApproveSurgeryRequestDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  onSubmit,
  tenantId
}) => {
  const [approverName, setApproverName] = useState('Dr. Arthur Vance');
  const [approverRole, setApproverRole] = useState('CHIEF_MEDICAL_OFFICER');
  const [decisionNotes, setDecisionNotes] = useState('Approved for scheduling in Main OT Complex');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        requestId: request.id,
        tenantId,
        approverName,
        approverRole,
        decisionNotes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Approve Surgery Request</h2>
        <p className="text-xs text-gray-500 mb-4">{request.requestNumber} — {request.patientName} ({request.procedureName})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Approver Name</label>
            <Input value={approverName} onChange={(e) => setApproverName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Approver Role</label>
            <Input value={approverRole} onChange={(e) => setApproverRole(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Decision Notes</label>
            <Input value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Approving...' : 'Approve & Clear for Scheduling'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
