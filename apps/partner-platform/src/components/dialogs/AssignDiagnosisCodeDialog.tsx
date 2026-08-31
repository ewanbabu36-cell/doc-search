import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto, AssignDiagnosisCodeRequest, ICDCodeItemDto, ICDCodeType, POAIndicator } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordIndexDto | null;
  catalog: ICDCodeItemDto[];
  onSubmit: (req: AssignDiagnosisCodeRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const AssignDiagnosisCodeDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  catalog,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [selectedCode, setSelectedCode] = useState(catalog[0]?.code || 'I21.0');
  const [codeType, setCodeType] = useState<ICDCodeType>('PRIMARY_DIAGNOSIS');
  const [poa, setPoa] = useState<POAIndicator>('YES_PRESENT_ON_ADMISSION');
  const [seq, setSeq] = useState('1');
  const [coder, setCoder] = useState('Priya Sundaram, CCS');
  const [notes, setNotes] = useState('Coded from physician discharge narrative and clinical labs.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const item = catalog.find((c) => c.code === selectedCode) || catalog[0];
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        recordId: record.id,
        icdCode: item ? item.code : selectedCode,
        icdDescription: item ? item.fullDescription : 'ICD-10 Diagnosis',
        codeType,
        poaIndicator: poa,
        sequencingOrder: parseInt(seq) || 1,
        assignedByCoder: coder,
        coderNotes: notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Assign ICD-10 Diagnosis Code</h2>
        <p className="text-xs text-gray-500 mb-4">{record.recordNumber} — {record.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ICD-10 Code Selection</label>
            <select value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
              {catalog.map((c) => (
                <option key={c.id} value={c.code}>[{c.code}] {c.shortDescription} ({c.chapter})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnosis Type</label>
              <select value={codeType} onChange={(e) => setCodeType(e.target.value as ICDCodeType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="PRIMARY_DIAGNOSIS">Primary / Principal Diagnosis</option>
                <option value="SECONDARY_DIAGNOSIS">Secondary Diagnosis</option>
                <option value="COMORBIDITY">Comorbidity</option>
                <option value="COMPLICATION">Complication</option>
                <option value="EXTERNAL_CAUSE_OF_INJURY">External Cause of Injury</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">POA Indicator</label>
              <select value={poa} onChange={(e) => setPoa(e.target.value as POAIndicator)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="YES_PRESENT_ON_ADMISSION">Y - Present on Admission</option>
                <option value="NO_NOT_PRESENT_ON_ADMISSION">N - Not Present on Admission</option>
                <option value="EXEMPT_FROM_POA_REPORTING">E - Exempt from POA</option>
                <option value="DOCUMENTATION_INSUFFICIENT">U - Insufficient Documentation</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sequencing Order</label>
              <Input type="number" min="1" value={seq} onChange={(e) => setSeq(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Coding Specialist</label>
              <Input value={coder} onChange={(e) => setCoder(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Coder Clinical Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Assigning...' : 'Assign Code to Chart'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
