import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { HospitalIncidentDto, TriageIncidentRequest, SacScore } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  incident: HospitalIncidentDto;
  onClose: () => void;
  onSubmit: (incidentId: string, data: TriageIncidentRequest) => Promise<void>;
}

export const TriageIncidentDialog: React.FC<Props> = ({ isOpen, incident, onClose, onSubmit }) => {
  const [sacScore, setSacScore] = useState<SacScore>(incident.sacScore);
  const [investigatingQualityOfficer, setInvestigatingQualityOfficer] = useState('Dr. Radhika Sharma (Quality Lead)');
  const [rcaRequired, setRcaRequired] = useState(incident.rcaRequired);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(incident.id, {
        sacScore,
        investigatingQualityOfficer,
        rcaRequired
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Triage Safety Incident ({incident.incidentNumber})</h2>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
          <p><strong>Category:</strong> {incident.category}</p>
          <p><strong>Summary:</strong> {incident.briefSummary}</p>
          <p><strong>Location:</strong> {incident.departmentName} ({incident.locationDetail})</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Final SAC Score</label>
            <Select
              value={sacScore}
              onChange={(e) => {
                const val = e.target.value as SacScore;
                setSacScore(val);
                if (val === 'SAC_1_EXTREME_SENTINEL' || val === 'SAC_2_MAJOR') setRcaRequired(true);
              }}
              options={[
                { value: 'SAC_1_EXTREME_SENTINEL', label: 'SAC 1: Extreme / Sentinel (Mandatory RCA)' },
                { value: 'SAC_2_MAJOR', label: 'SAC 2: Major (Mandatory RCA)' },
                { value: 'SAC_3_MODERATE', label: 'SAC 3: Moderate' },
                { value: 'SAC_4_MINOR_NEAR_MISS', label: 'SAC 4: Minor / Near-Miss' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Quality Officer</label>
            <Input value={investigatingQualityOfficer} onChange={(e) => setInvestigatingQualityOfficer(e.target.value)} required />
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input type="checkbox" id="rca-chk" checked={rcaRequired} onChange={(e) => setRcaRequired(e.target.checked)} className="rounded" />
            <label htmlFor="rca-chk" className="text-xs font-semibold text-gray-700">Commission Full RCA & 5-Whys Investigation</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Triaging...' : 'Complete Triage'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
