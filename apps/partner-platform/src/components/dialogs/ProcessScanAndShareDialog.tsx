import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { ProcessScanAndShareRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProcessScanAndShareRequest) => Promise<void>;
}

export const ProcessScanAndShareDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientAbhaNumber, setPatientAbhaNumber] = useState('91-7721-1122-3344');
  const [patientAbhaAddress, setPatientAbhaAddress] = useState('rajesh.patil@abdm');
  const [patientName, setPatientName] = useState('Rajesh Patil');
  const [gender, setGender] = useState('M');
  const [dob, setDob] = useState('1982-03-22');
  const [mobile, setMobile] = useState('+91 9811223344');
  const [scannedCounterName, setScannedCounterName] = useState('Counter 01 (Fast-Track OPD)');
  const [assignedOpdDepartment, setAssignedOpdDepartment] = useState('Orthopedics OPD');
  const [assignedDoctorName, setAssignedDoctorName] = useState('Dr. Arvind Saxena');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientAbhaNumber,
        patientAbhaAddress,
        patientName,
        gender,
        dob,
        mobile,
        scannedCounterName,
        assignedOpdDepartment,
        assignedDoctorName
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-teal-900">📲 Scan & Share Fast-Track Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient ABHA Number</label>
              <Input value={patientAbhaNumber} onChange={(e) => setPatientAbhaNumber(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ABHA Handle</label>
              <Input value={patientAbhaAddress} onChange={(e) => setPatientAbhaAddress(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <Input value={gender} onChange={(e) => setGender(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">DOB</label>
              <Input value={dob} onChange={(e) => setDob(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile</label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scanned Counter</label>
              <Input value={scannedCounterName} onChange={(e) => setScannedCounterName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Department</label>
              <Input value={assignedOpdDepartment} onChange={(e) => setAssignedOpdDepartment(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor Name</label>
              <Input value={assignedDoctorName} onChange={(e) => setAssignedDoctorName(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Issuing Token...' : 'Generate OPD Token'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
