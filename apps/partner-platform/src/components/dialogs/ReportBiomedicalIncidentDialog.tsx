import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto, CreateBiomedicalIncidentRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  assets: BiomedicalAssetDto[];
  onClose: () => void;
  onSubmit: (data: CreateBiomedicalIncidentRequest) => Promise<void>;
}

export const ReportBiomedicalIncidentDialog: React.FC<Props> = ({ isOpen, assets, onClose, onSubmit }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [departmentName, setDepartmentName] = useState('Operation Theatre Complex');
  const [incidentDateTime] = useState(new Date().toISOString());
  const [severity, setSeverity] = useState<'CRITICAL_ADVERSE_EVENT' | 'NEAR_MISS' | 'EQUIPMENT_MALFUNCTION_NO_HARM'>('NEAR_MISS');
  const [patientInvolved, setPatientInvolved] = useState(true);
  const [patientMrn, setPatientMrn] = useState('MRN-2026-8801');
  const [incidentSummary, setIncidentSummary] = useState('');
  const [initialActionTaken, setInitialActionTaken] = useState('');
  const [investigatingOfficer, setInvestigatingOfficer] = useState('Er. Rajesh Nair (BME Quality Lead)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        assetId: selectedAssetId,
        departmentName,
        incidentDateTime,
        severity,
        patientInvolved,
        patientMrn,
        incidentSummary,
        initialActionTaken,
        investigatingOfficer
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-red-700">🚨 Report Biomedical Adverse Incident / Near-Miss</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Involved Equipment</label>
            <Select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              options={assets.map((a) => ({ value: a.id, label: `${a.assetCode} - ${a.assetName}` }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Severity Category</label>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as 'CRITICAL_ADVERSE_EVENT' | 'NEAR_MISS' | 'EQUIPMENT_MALFUNCTION_NO_HARM')}
                options={[
                  { value: 'CRITICAL_ADVERSE_EVENT', label: 'Critical Adverse Event (Patient Harm)' },
                  { value: 'NEAR_MISS', label: 'Near Miss (Potential Hazard Intercepted)' },
                  { value: 'EQUIPMENT_MALFUNCTION_NO_HARM', label: 'Equipment Malfunction (No Harm)' }
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input type="checkbox" id="pat-chk" checked={patientInvolved} onChange={(e) => setPatientInvolved(e.target.checked)} className="rounded" />
            <label htmlFor="pat-chk" className="text-xs font-semibold text-gray-700">Patient Was Attached / Involved During Incident</label>
          </div>
          {patientInvolved && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. MRN-2026-8801" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Incident Description</label>
            <Input value={incidentSummary} onChange={(e) => setIncidentSummary(e.target.value)} placeholder="Detailed description of failure and clinical impact..." required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Immediate Action Taken</label>
            <Input value={initialActionTaken} onChange={(e) => setInitialActionTaken(e.target.value)} placeholder="Immediate corrective step, switch to backup..." required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Investigating Safety Officer</label>
            <Input value={investigatingOfficer} onChange={(e) => setInvestigatingOfficer(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Reporting...' : 'Log Incident & Initiate RCA'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
