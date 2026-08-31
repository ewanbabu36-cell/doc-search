import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, CreateRecordRetrievalRequestRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordIndexDto | null;
  onSubmit: (req: CreateRecordRetrievalRequestRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RetrieveMedicalRecordDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [staff, setStaff] = useState('Marcus Chen, RHIT');
  const [purpose, setPurpose] = useState('Physical chart required for clinical audit and legal review');
  const [returnDate, setReturnDate] = useState('2026-09-05T17:00:00.000Z');
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
        requestedByStaff: staff,
        departmentPurpose: purpose,
        expectedReturnDate: returnDate
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Physical Chart Retrieval</h2>
        <p className="text-xs text-gray-500 mb-4">{record.recordNumber} — Location: {record.physicalShelfNumber || 'Central Vault'}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Requested By Staff</label>
            <Input value={staff} onChange={(e) => setStaff(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Department / Audit Purpose</label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Return Date</label>
            <Input type="datetime-local" value={returnDate.slice(0, 16)} onChange={(e) => setReturnDate(new Date(e.target.value).toISOString())} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Requesting...' : 'Authorize Chart Movement'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
