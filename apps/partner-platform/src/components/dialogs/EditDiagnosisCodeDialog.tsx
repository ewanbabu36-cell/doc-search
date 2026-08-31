import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalDiagnosisCodeDto, UpdateDiagnosisCodeRequest, ICDCodeType, POAIndicator } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: MedicalDiagnosisCodeDto | null;
  onSubmit: (req: UpdateDiagnosisCodeRequest) => Promise<void>;
  tenantId: string;
}

export const EditDiagnosisCodeDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  diagnosis,
  onSubmit,
  tenantId
}) => {
  const [icdCode, setIcdCode] = useState(diagnosis?.icdCode || '');
  const [icdDesc, setIcdDesc] = useState(diagnosis?.icdDescription || '');
  const [codeType, setCodeType] = useState<ICDCodeType>(diagnosis?.codeType || 'PRIMARY_DIAGNOSIS');
  const [poa, setPoa] = useState<POAIndicator>(diagnosis?.poaIndicator || 'YES_PRESENT_ON_ADMISSION');
  const [coder, setCoder] = useState('Priya Sundaram, CCS');
  const [reason, setReason] = useState('Clinical query response refined final diagnosis specificity');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !diagnosis) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        diagnosisId: diagnosis.id,
        icdCode,
        icdDescription: icdDesc,
        codeType,
        poaIndicator: poa,
        updatedByCoder: coder,
        reasonForRevision: reason
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Edit / Refine Diagnosis Code</h2>
        <p className="text-xs text-gray-500 mb-4">Current Code: {diagnosis.icdCode}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ICD-10 Code</label>
              <Input value={icdCode} onChange={(e) => setIcdCode(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnosis Type</label>
              <select value={codeType} onChange={(e) => setCodeType(e.target.value as ICDCodeType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="PRIMARY_DIAGNOSIS">Primary / Principal</option>
                <option value="SECONDARY_DIAGNOSIS">Secondary</option>
                <option value="COMORBIDITY">Comorbidity</option>
                <option value="COMPLICATION">Complication</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Diagnosis Description</label>
            <Input value={icdDesc} onChange={(e) => setIcdDesc(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">POA Indicator</label>
              <select value={poa} onChange={(e) => setPoa(e.target.value as POAIndicator)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="YES_PRESENT_ON_ADMISSION">Y - Present on Admission</option>
                <option value="NO_NOT_PRESENT_ON_ADMISSION">N - Not Present on Admission</option>
                <option value="EXEMPT_FROM_POA_REPORTING">E - Exempt</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Coding Specialist</label>
              <Input value={coder} onChange={(e) => setCoder(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Revision (Audit Trail)</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Updating...' : 'Save Revisions'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
