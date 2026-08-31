import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { AssignPatientIsolationRequest, IsolationPrecautionType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssignPatientIsolationRequest) => Promise<void>;
}

export const AssignPatientIsolationDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientMrn, setPatientMrn] = useState('');
  const [patientName, setPatientName] = useState('');
  const [departmentName, setDepartmentName] = useState('Intensive Care Unit (ICU-A)');
  const [roomBedNumber, setRoomBedNumber] = useState('Isolation Room 01');
  const [precautionType, setPrecautionType] = useState<IsolationPrecautionType>('CONTACT');
  const [indicatedReasonOrPathogen, setIndicatedReasonOrPathogen] = useState('ESBL Klebsiella in Blood');
  const [assignedNurseLead, setAssignedNurseLead] = useState('Sister Preeti Varma');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientMrn,
        patientName,
        departmentName,
        roomBedNumber,
        precautionType,
        indicatedReasonOrPathogen,
        assignedNurseLead
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-amber-700">🛡️ Assign Patient Isolation Precautions</h2>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Isolation Room #</label>
              <Input value={roomBedNumber} onChange={(e) => setRoomBedNumber(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Precaution Category</label>
            <Select
              value={precautionType}
              onChange={(e) => setPrecautionType(e.target.value as IsolationPrecautionType)}
              options={[
                { value: 'CONTACT', label: 'Contact Precautions (Gown + Gloves, Yellow Sign)' },
                { value: 'DROPLET', label: 'Droplet Precautions (Mask + Face Shield, Green Sign)' },
                { value: 'AIRBORNE', label: 'Airborne Precautions (N95 + Negative Pressure, Blue Sign)' },
                { value: 'PROTECTIVE_REVERSE', label: 'Protective / Reverse Isolation (Neutropenia)' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Indication / Pathogen</label>
            <Input value={indicatedReasonOrPathogen} onChange={(e) => setIndicatedReasonOrPathogen(e.target.value)} placeholder="e.g. Sputum GeneXpert +ve TB, MRSA" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Nurse Lead</label>
            <Input value={assignedNurseLead} onChange={(e) => setAssignedNurseLead(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Assigning...' : 'Initiate Isolation'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
