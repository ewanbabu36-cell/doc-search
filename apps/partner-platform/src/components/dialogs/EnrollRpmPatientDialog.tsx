import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { EnrollRpmPatientRequest, RpmCareProgram } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EnrollRpmPatientRequest) => Promise<void>;
}

export const EnrollRpmPatientDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [patientName, setPatientName] = useState('Gopal Krishna');
  const [careProgram, setCareProgram] = useState<RpmCareProgram>('HYPERTENSION_MANAGEMENT');
  const [attendingPhysician, setAttendingPhysician] = useState('Dr. Sanjay Gupta');
  const [systolicMax, setSystolicMax] = useState(160);
  const [diastolicMax, setDiastolicMax] = useState(100);
  const [spO2Min, setSpO2Min] = useState(90);
  const [glucoseMax, setGlucoseMax] = useState(200);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientMrn,
        patientName,
        careProgram,
        attendingPhysician,
        vitalThresholds: {
          systolicMax: Number(systolicMax),
          diastolicMax: Number(diastolicMax),
          spO2Min: Number(spO2Min),
          glucoseMax: Number(glucoseMax)
        }
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-emerald-900">🩺 Enroll in Chronic RPM Care Cohort</h2>
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">RPM Care Program</label>
            <Select
              value={careProgram}
              onChange={(e) => setCareProgram(e.target.value as RpmCareProgram)}
              options={[
                { value: 'HYPERTENSION_MANAGEMENT', label: 'Hypertension Remote Control Program' },
                { value: 'DIABETES_INTENSIVE_CARE', label: 'Type 2 Diabetes Intensive CGM Care' },
                { value: 'HEART_FAILURE_CHF', label: 'Heart Failure (CHF) Weight & Hemodynamics' },
                { value: 'COPD_ASTHMA_CARE', label: 'COPD & Asthma Tele-Respiratory Program' },
                { value: 'HIGH_RISK_MATERNAL', label: 'High-Risk Antenatal Care (Maternal RPM)' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Clinician</label>
            <Input value={attendingPhysician} onChange={(e) => setAttendingPhysician(e.target.value)} required />
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2">
            <span className="font-bold text-emerald-900 block">Vital Breach Threshold Guards:</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-gray-600">Systolic Max (mmHg)</label>
                <Input type="number" value={systolicMax} onChange={(e) => setSystolicMax(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-600">Diastolic Max (mmHg)</label>
                <Input type="number" value={diastolicMax} onChange={(e) => setDiastolicMax(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-600">SpO2 Min (%)</label>
                <Input type="number" value={spO2Min} onChange={(e) => setSpO2Min(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-600">Glucose Max (mg/dL)</label>
                <Input type="number" value={glucoseMax} onChange={(e) => setGlucoseMax(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Enrolling...' : 'Enroll in RPM Program'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
