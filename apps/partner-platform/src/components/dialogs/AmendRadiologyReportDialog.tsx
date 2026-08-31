import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyReportDto, AmendRadiologyReportRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: RadiologyReportDto | null;
  onSubmit: (req: AmendRadiologyReportRequest) => Promise<void>;
  tenantId: string;
}

export const AmendRadiologyReportDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  report,
  onSubmit,
  tenantId
}) => {
  const [findings, setFindings] = useState(report?.findings || '');
  const [impression, setImpression] = useState(report?.impression || '');
  const [reason, setReason] = useState('Additional secondary clinical correlation received from attending surgeon.');
  const [radiologist, setRadiologist] = useState('Dr. Evelyn Vance, MD, FACR');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        reportId: report.id,
        amendedFindings: findings,
        amendedImpression: impression,
        amendmentReason: reason,
        reportingRadiologistName: radiologist
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-amber-600 mb-2">Amend Finalized Report (Version {report.version + 1})</h2>
        <p className="text-xs text-gray-500 mb-4">{report.reportNumber} — {report.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Amended Detailed Findings</label>
            <textarea
              rows={4}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-xs font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Amended Diagnostic Impression</label>
            <textarea
              rows={2}
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-xs font-semibold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mandatory Amendment Justification</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Amending Radiologist</label>
            <Input value={radiologist} onChange={(e) => setRadiologist(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="secondary" type="submit" disabled={loading}>{loading ? 'Amending...' : 'Submit Amendment'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
