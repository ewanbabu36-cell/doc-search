import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { LinkCareContextRequest, AbdmCareContextType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LinkCareContextRequest) => Promise<void>;
}

export const LinkCareContextDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [abhaAddress, setAbhaAddress] = useState('gopal.krishna@abdm');
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [patientName, setPatientName] = useState('Gopal Krishna');
  const [careContextType, setCareContextType] = useState<AbdmCareContextType>('OPD_CONSULTATION_VISIT');
  const [careContextReference, setCareContextReference] = useState('VISIT-OPD-2026-9912');
  const [displayTitle, setDisplayTitle] = useState('Cardiology OPD Follow-Up Consultation');
  const [doctorName, setDoctorName] = useState('Dr. Sanjay Gupta');
  const [departmentName, setDepartmentName] = useState('Cardiology');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        abhaAddress,
        patientMrn,
        patientName,
        careContextType,
        careContextReference,
        displayTitle,
        doctorName,
        departmentName
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-indigo-900">🔗 Link Clinical Care Context (Milestone 2)</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Patient ABHA Address</label>
            <Input value={abhaAddress} onChange={(e) => setAbhaAddress(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Care Context Type</label>
              <Select
                value={careContextType}
                onChange={(e) => setCareContextType(e.target.value as AbdmCareContextType)}
                options={[
                  { value: 'OPD_CONSULTATION_VISIT', label: 'OPD Consultation Visit' },
                  { value: 'IPD_DISCHARGE_EPISODE', label: 'IPD Discharge Episode' },
                  { value: 'DIAGNOSTIC_LAB_REPORT', label: 'Diagnostic Lab Report' },
                  { value: 'RADIOLOGY_STUDY_REPORT', label: 'Radiology Study Report' },
                  { value: 'IMMUNIZATION_RECORD', label: 'Immunization Record' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reference ID</label>
              <Input value={careContextReference} onChange={(e) => setCareContextReference(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Display Title (Seen on ABHA App)</label>
            <Input value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor Name</label>
              <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Publishing to ABDM...' : 'Link Care Context'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
