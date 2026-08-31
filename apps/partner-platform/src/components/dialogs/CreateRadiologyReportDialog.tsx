import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyStudyDto, CreateRadiologyReportRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  study: RadiologyStudyDto | null;
  onSubmit: (req: CreateRadiologyReportRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateRadiologyReportDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  study,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [history, setHistory] = useState('Patient presented with acute pleuritic chest pain and dyspnea.');
  const [tech, setTech] = useState('Helical axial CT acquisition with automated bolus tracking.');
  const [comparison, setComparison] = useState('None available on PACS.');
  const [findings, setFindings] = useState('Lungs are clear without focal consolidation. No pleural effusion. Cardiac silhouette is normal.');
  const [impression, setImpression] = useState('No acute cardiopulmonary disease identified.');
  const [recs, setRecs] = useState('Routine clinical follow-up as indicated.');
  const [isCritical, setIsCritical] = useState(false);
  const [radiologist, setRadiologist] = useState('Dr. Evelyn Vance, MD, FACR');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !study) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        studyId: study.id,
        orderId: study.orderId,
        patientName: study.patientName,
        patientMrn: study.patientMrn,
        modalityType: study.modalityType,
        procedureName: study.studyDescription,
        clinicalHistory: history,
        imagingTechnique: tech,
        comparisonStudyReference: comparison,
        findings,
        impression,
        recommendations: recs,
        hasCriticalFinding: isCritical,
        reportingRadiologistName: radiologist
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Radiology Diagnostic Reporting Workspace</h2>
        <p className="text-xs text-gray-500 mb-4">{study.accessionNumber} — {study.patientName} ({study.studyDescription})</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical History</label>
              <Input value={history} onChange={(e) => setHistory(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Imaging Technique</label>
              <Input value={tech} onChange={(e) => setTech(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Comparison Study</label>
            <Input value={comparison} onChange={(e) => setComparison(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Findings</label>
            <textarea
              rows={4}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-xs font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Impression</label>
            <textarea
              rows={2}
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-xs font-semibold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Recommendations</label>
            <Input value={recs} onChange={(e) => setRecs(e.target.value)} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-red-600">
              <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} className="rounded" />
              FLAG AS CRITICAL FINDING (Immediate Doctor Notification Required)
            </label>
            <div className="w-1/2">
              <Input value={radiologist} onChange={(e) => setRadiologist(e.target.value)} required placeholder="Radiologist" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Draft Report'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
