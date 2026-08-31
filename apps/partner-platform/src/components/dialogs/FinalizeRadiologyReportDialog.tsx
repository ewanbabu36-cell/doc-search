import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyReportDto, FinalizeRadiologyReportRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: RadiologyReportDto | null;
  onSubmit: (req: FinalizeRadiologyReportRequest) => Promise<void>;
  tenantId: string;
}

export const FinalizeRadiologyReportDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  report,
  onSubmit,
  tenantId
}) => {
  const [verifying, setVerifying] = useState('Dr. Evelyn Vance, MD, FACR');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        reportId: report.id,
        verifyingRadiologistName: verifying
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Finalize & Sign Radiology Report</h2>
        <p className="text-xs text-gray-500 mb-4">{report.reportNumber} — {report.patientName}</p>
        <div className="mb-4 bg-gray-50 p-3 rounded text-xs">
          <p className="font-semibold text-gray-800">Impression:</p>
          <p className="text-gray-600 mt-1">{report.impression}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Verifying Radiologist Signature</label>
            <Input value={verifying} onChange={(e) => setVerifying(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Finalizing...' : 'Finalize & Electronically Sign'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
