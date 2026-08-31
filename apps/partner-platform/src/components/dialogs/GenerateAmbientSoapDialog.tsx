import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { GenerateAmbientSoapRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GenerateAmbientSoapRequest) => Promise<void>;
}

export const GenerateAmbientSoapDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [patientName, setPatientName] = useState('Gopal Krishna');
  const [doctorName, setDoctorName] = useState('Dr. Sanjay Gupta');
  const [specialtyName, setSpecialtyName] = useState('Cardiology OPD');
  const [clinicalDialogueTranscript, setClinicalDialogueTranscript] = useState("Doctor: Good morning Gopal ji. Patient: Doctor I had mild fatigue and cough for 3 days. Doctor: Chest is clear, BP 122/78. Let's start Paracetamol and Cetirizine...");
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
        clinicalDialogueTranscript
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-purple-900">🎙️ Ambient AI Medical Scribe & Voice-to-SOAP</h2>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Clinician</label>
              <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Specialty</label>
              <Input value={specialtyName} onChange={(e) => setSpecialtyName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Recorded Dialogue / Audio Transcript Excerpt</label>
            <Input value={clinicalDialogueTranscript} onChange={(e) => setClinicalDialogueTranscript(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Transcribing & Structuring SOAP...' : 'Generate Structured SOAP Note'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
