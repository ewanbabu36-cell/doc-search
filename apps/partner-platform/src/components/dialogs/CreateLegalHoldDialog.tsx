import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, CreateLegalHoldRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordIndexDto | null;
  onSubmit: (req: CreateLegalHoldRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateLegalHoldDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [matter, setMatter] = useState('Pending Litigation / Medico-Legal Arbitration');
  const [reason, setReason] = useState('Record locked against deletion, purging, or unauthorized modification pending court verdict.');
  const [counsel, setCounsel] = useState('Advocate Rajesh Mehta (Chief Legal Counsel)');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        recordId: record.id,
        patientName: record.patientName,
        legalMatterTitle: matter,
        reasonForHold: reason,
        authorizedByLegalCounsel: counsel
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border-4 border-red-700">
        <h2 className="text-xl font-bold text-red-800 mb-2">🔒 Place Mandatory Legal Hold</h2>
        <p className="text-xs text-gray-500 mb-4">{record.recordNumber} — {record.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Legal Matter Title / Court Case #</label>
            <Input value={matter} onChange={(e) => setMatter(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Legal Hold</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorized Legal Counsel</label>
            <Input value={counsel} onChange={(e) => setCounsel(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Applying...' : 'Lock Record with Legal Hold'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
