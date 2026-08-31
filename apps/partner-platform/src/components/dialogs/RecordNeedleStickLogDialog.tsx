import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { RecordNeedleStickLogRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecordNeedleStickLogRequest) => Promise<void>;
}

export const RecordNeedleStickLogDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [exposedStaffName, setExposedStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('JUNIOR_RESIDENT_DOCTOR');
  const [departmentName, setDepartmentName] = useState('Emergency Department (ED)');
  const [exposureDateTime] = useState(new Date().toISOString());
  const [sourcePatientKnown] = useState(true);
  const [sourcePatientHivStatus, setSourcePatientHivStatus] = useState<'POSITIVE' | 'NEGATIVE' | 'UNKNOWN'>('NEGATIVE');
  const [sourcePatientHbsAgStatus, setSourcePatientHbsAgStatus] = useState<'POSITIVE' | 'NEGATIVE' | 'UNKNOWN'>('NEGATIVE');
  const [sourcePatientHcvStatus, setSourcePatientHcvStatus] = useState<'POSITIVE' | 'NEGATIVE' | 'UNKNOWN'>('NEGATIVE');
  const [pepInitiatedWithinGoldenHour, setPepInitiatedWithinGoldenHour] = useState(true);
  const [pepRegimenDetails, setPepRegimenDetails] = useState('Tenofovir 300mg + Lamivudine 300mg + Dolutegravir 50mg daily x 28 days.');
  const [followUpSerologyDue, setFollowUpSerologyDue] = useState(new Date(Date.now() + 42 * 86400000).toISOString().split('T')[0] || '2026-10-10');
  const [counselorName, setCounselorName] = useState('Dr. Radhika Sharma (Infection Control Officer)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        exposedStaffName,
        staffRole,
        departmentName,
        exposureDateTime,
        sourcePatientKnown,
        sourcePatientHivStatus,
        sourcePatientHbsAgStatus,
        sourcePatientHcvStatus,
        pepInitiatedWithinGoldenHour,
        pepRegimenDetails,
        followUpSerologyDue,
        counselorName
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-red-700">💉 Needle Stick & Occupational Exposure Protocol (PEP)</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Exposed Staff Name</label>
              <Input value={exposedStaffName} onChange={(e) => setExposedStaffName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Designation / Role</label>
              <Input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Department of Exposure</label>
            <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <h3 className="text-xs font-bold text-red-900 uppercase">Source Patient Viral Serology Status</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">HIV Status</label>
                <Select
                  value={sourcePatientHivStatus}
                  onChange={(e) => setSourcePatientHivStatus(e.target.value as 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN')}
                  options={[
                    { value: 'NEGATIVE', label: 'Negative / Non-reactive' },
                    { value: 'POSITIVE', label: 'POSITIVE' },
                    { value: 'UNKNOWN', label: 'Unknown' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">HBsAg</label>
                <Select
                  value={sourcePatientHbsAgStatus}
                  onChange={(e) => setSourcePatientHbsAgStatus(e.target.value as 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN')}
                  options={[
                    { value: 'NEGATIVE', label: 'Negative' },
                    { value: 'POSITIVE', label: 'POSITIVE' },
                    { value: 'UNKNOWN', label: 'Unknown' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">HCV</label>
                <Select
                  value={sourcePatientHcvStatus}
                  onChange={(e) => setSourcePatientHcvStatus(e.target.value as 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN')}
                  options={[
                    { value: 'NEGATIVE', label: 'Negative' },
                    { value: 'POSITIVE', label: 'POSITIVE' },
                    { value: 'UNKNOWN', label: 'Unknown' }
                  ]}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input type="checkbox" id="pep-chk" checked={pepInitiatedWithinGoldenHour} onChange={(e) => setPepInitiatedWithinGoldenHour(e.target.checked)} className="rounded" />
            <label htmlFor="pep-chk" className="text-xs font-semibold text-emerald-800">PEP Initiated Within Golden Hour (&lt; 2 Hours)</label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">PEP Regimen Prescription Details</label>
            <Input value={pepRegimenDetails} onChange={(e) => setPepRegimenDetails(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Serology Due Date</label>
              <Input type="date" value={followUpSerologyDue} onChange={(e) => setFollowUpSerologyDue(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Counselor / ICN Officer</label>
              <Input value={counselorName} onChange={(e) => setCounselorName(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Initiate PEP Protocol'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
