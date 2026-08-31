import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { ScheduleTeleconsultationRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleTeleconsultationRequest) => Promise<void>;
}

export const ScheduleTeleconsultationDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [patientName, setPatientName] = useState('Gopal Krishna');
  const [doctorName, setDoctorName] = useState('Dr. Sanjay Gupta');
  const [specialtyName, setSpecialtyName] = useState('Cardiology Tele-Clinic');
  const [scheduledStartTime, setScheduledStartTime] = useState('2026-08-30T10:00:00.000Z');
  const [consultationFeeInr, setConsultationFeeInr] = useState(800);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientMrn,
        patientName,
        doctorName,
        specialtyName,
        scheduledStartTime,
        consultationFeeInr: Number(consultationFeeInr)
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-teal-900">📅 Schedule Encrypted Teleconsultation</h2>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor Name</label>
              <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Specialty</label>
              <Input value={specialtyName} onChange={(e) => setSpecialtyName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Start Time (ISO)</label>
              <Input value={scheduledStartTime} onChange={(e) => setScheduledStartTime(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fee (INR)</label>
              <Input type="number" value={consultationFeeInr} onChange={(e) => setConsultationFeeInr(Number(e.target.value))} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Scheduling...' : 'Confirm Tele-Slot'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
