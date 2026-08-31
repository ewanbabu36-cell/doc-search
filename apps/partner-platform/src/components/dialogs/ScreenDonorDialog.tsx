import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodDonorDto, ScreenDonorRequest, DonorEligibilityStatus } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  donor: BloodDonorDto | null;
  onSubmit: (req: ScreenDonorRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const ScreenDonorDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  donor,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [weight, setWeight] = useState('72.5');
  const [hb, setHb] = useState('14.2');
  const [sys, setSys] = useState('120');
  const [dia, setDia] = useState('80');
  const [pulse, setPulse] = useState('72');
  const [temp, setTemp] = useState('98.4');
  const [medHistory, setMedHistory] = useState(true);
  const [nurse, setNurse] = useState('Nurse Clara Oswald, RN');
  const [decision, setDecision] = useState<DonorEligibilityStatus>('ELIGIBLE_FOR_DONATION');
  const [remarks, setRemarks] = useState('Donor cleared after thorough physical assessment & history check.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !donor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        donorId: donor.id,
        donorName: donor.fullName,
        weightKg: parseFloat(weight) || 70,
        hemoglobinGdl: parseFloat(hb) || 14.0,
        systolicBp: parseInt(sys) || 120,
        diastolicBp: parseInt(dia) || 80,
        pulseBpm: parseInt(pulse) || 72,
        temperatureF: parseFloat(temp) || 98.4,
        medicalHistoryCleared: medHistory,
        screeningNurseName: nurse,
        eligibilityDecision: decision,
        remarks
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Donor Health & Clinical Screening</h2>
        <p className="text-xs text-gray-500 mb-4">{donor.donorCode} — {donor.fullName} ({donor.bloodGroup})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
              <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hemoglobin (g/dL)</label>
              <Input type="number" step="0.1" value={hb} onChange={(e) => setHb(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Temp (°F)</label>
              <Input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Systolic BP</label>
              <Input type="number" value={sys} onChange={(e) => setSys(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diastolic BP</label>
              <Input type="number" value={dia} onChange={(e) => setDia(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pulse (bpm)</label>
              <Input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Screening Nurse</label>
              <Input value={nurse} onChange={(e) => setNurse(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Eligibility Decision</label>
              <select value={decision} onChange={(e) => setDecision(e.target.value as DonorEligibilityStatus)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="ELIGIBLE_FOR_DONATION">Eligible for Donation</option>
                <option value="TEMPORARILY_DEFERRED">Temporarily Deferred</option>
                <option value="PERMANENTLY_DEFERRED">Permanently Deferred</option>
              </select>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={medHistory} onChange={(e) => setMedHistory(e.target.checked)} className="rounded" />
              Medical history questionnaires & high-risk exposure checks cleared
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Remarks</label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Complete Screening'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
