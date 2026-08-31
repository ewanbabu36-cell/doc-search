import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateSurgeryRequestRequest, SurgicalProcedureDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  procedures: SurgicalProcedureDto[];
  onSubmit: (req: CreateSurgeryRequestRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateSurgeryRequestDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  procedures,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [patientAge, setPatientAge] = useState('45');
  const [patientGender, setPatientGender] = useState('M');
  const [requestingDoctorName, setRequestingDoctorName] = useState('Dr. Sarah Connor, MD');
  const [primarySurgeonName, setPrimarySurgeonName] = useState('Dr. Gregory House, MS');
  const [selectedProcId, setSelectedProcId] = useState(procedures[0]?.id || '');
  const [preOperativeDiagnosis, setPreOperativeDiagnosis] = useState('');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [proposedDate, setProposedDate] = useState('2026-08-31');
  const [isEmergency, setIsEmergency] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const proc = procedures.find((p) => p.id === selectedProcId) || procedures[0];
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: 'pat-' + Math.random().toString(36).substring(2, 7),
        patientName,
        patientMrn,
        patientAge: parseInt(patientAge) || 45,
        patientGender,
        requestingDoctorName,
        primarySurgeonName,
        specialty: proc?.specialty || 'GENERAL_SURGERY',
        procedureId: proc?.id || 'prc-001',
        procedureName: proc?.procedureName || 'General Procedure',
        preOperativeDiagnosis,
        clinicalIndication,
        category: isEmergency ? 'EMERGENCY' : 'ELECTIVE',
        priority: isEmergency ? 'STAT_EMERGENCY' : 'ROUTINE',
        isEmergency,
        proposedSurgeryDate: new Date(proposedDate).toISOString(),
        estimatedDurationMinutes: proc?.defaultDurationMinutes || 60,
        requiredAnaesthesia: proc?.recommendedAnaesthesia || 'GENERAL_ANAESTHESIA'
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Surgery Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. John Doe" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. MRN-102938" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
              <Input type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Surgical Procedure</label>
            <select
              value={selectedProcId}
              onChange={(e) => setSelectedProcId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>{p.procedureName} ({p.specialty})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Requesting Doctor</label>
              <Input value={requestingDoctorName} onChange={(e) => setRequestingDoctorName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Surgeon</label>
              <Input value={primarySurgeonName} onChange={(e) => setPrimarySurgeonName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-Operative Diagnosis</label>
            <Input value={preOperativeDiagnosis} onChange={(e) => setPreOperativeDiagnosis(e.target.value)} placeholder="Clinical diagnosis" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Indication / Notes</label>
            <Input value={clinicalIndication} onChange={(e) => setClinicalIndication(e.target.value)} placeholder="Rationale for surgery" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Proposed Date</label>
              <Input type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} required />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-red-600">
                <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} className="rounded" />
                Emergency Surgery Case
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Surgery Request'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
