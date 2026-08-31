import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RegisterEmergencyPatientRequest, EmergencyArrivalMode } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RegisterEmergencyPatientRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RegisterEmergencyPatientDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [isUnknown, setIsUnknown] = useState(false);
  const [tempId, setTempId] = useState('');
  const [gender, setGender] = useState('M');
  const [age, setAge] = useState('45');
  const [arrivalMode, setArrivalMode] = useState<EmergencyArrivalMode>('WALK_IN');
  const [broughtBy, setBroughtBy] = useState('Self / Relatives');
  const [referralSource, setReferralSource] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientName: isUnknown ? `Unknown Patient (${tempId || 'RED-TAG'})` : patientName,
        patientMrn: isUnknown ? `MRN-UNKWN-${Date.now().toString().slice(-4)}` : patientMrn || `MRN-${Date.now().toString().slice(-6)}`,
        isUnknownPatient: isUnknown,
        temporaryIdentifier: isUnknown ? tempId || `TAG-${Date.now().toString().slice(-4)}` : undefined,
        patientGender: gender,
        patientAge: parseInt(age) || 30,
        arrivalMode,
        broughtBy,
        referralSource,
        chiefComplaint
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">🚨 Emergency Patient Arrival Registration</h2>
        <p className="text-xs text-gray-500 mb-4">Immediate registration with support for unidentified / trauma victims</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-800">
              <input type="checkbox" checked={isUnknown} onChange={(e) => setIsUnknown(e.target.checked)} className="rounded" />
              Unknown / Unidentified Patient Workflow (Brought Unconscious/Trauma)
            </label>
          </div>

          {isUnknown ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Temporary Wristband ID / Trauma Tag</label>
              <Input value={tempId} onChange={(e) => setTempId(e.target.value)} placeholder="e.g. RED-TAG-09" required />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Full Name</label>
                <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">MRN (if existing)</label>
                <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="Auto-generated if blank" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Age</label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="OTHER">Other / Unknown</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Arrival Mode</label>
              <select value={arrivalMode} onChange={(e) => setArrivalMode(e.target.value as EmergencyArrivalMode)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="WALK_IN">Walk-In</option>
                <option value="AMBULANCE_GROUND">Ground Ambulance</option>
                <option value="AMBULANCE_AIR">Air Ambulance</option>
                <option value="POLICE_ESCORT">Police Escort</option>
                <option value="INTER_FACILITY_TRANSFER">Inter-Facility Transfer</option>
                <option value="MASS_CASUALTY_DISASTER">Mass Casualty Incident</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brought By</label>
              <Input value={broughtBy} onChange={(e) => setBroughtBy(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Referral Source / Scene Info</label>
            <Input value={referralSource} onChange={(e) => setReferralSource(e.target.value)} placeholder="e.g. Scene of accident, clinic referral" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Chief Complaint & Acute Symptoms</label>
            <Input value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} placeholder="e.g. Severe chest pain, bleeding wound, loss of consciousness" required />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Log Arrival & Route to Triage'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
