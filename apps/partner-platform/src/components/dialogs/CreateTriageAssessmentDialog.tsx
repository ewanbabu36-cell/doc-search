import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, CreateTriageAssessmentRequest, ESILevel } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: CreateTriageAssessmentRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateTriageAssessmentDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [triageNurseName, setTriageNurseName] = useState('Nurse Mark Hopkins, RN');
  const [esiLevel, setEsiLevel] = useState<ESILevel>('ESI_2_EMERGENT_HIGH_RISK');
  const [painScore, setPainScore] = useState('6');
  const [systolicBp, setSystolicBp] = useState('130');
  const [diastolicBp, setDiastolicBp] = useState('85');
  const [pulseRate, setPulseRate] = useState('92');
  const [respiratoryRate, setRespiratoryRate] = useState('20');
  const [temperatureF, setTemperatureF] = useState('98.6');
  const [spo2, setSpo2] = useState('98');
  const [gcsScore, setGcsScore] = useState('15');
  const [allergiesNoted, setAllergiesNoted] = useState('NKDA');
  const [sepsisScreen, setSepsisScreen] = useState(false);
  const [strokeScreen, setStrokeScreen] = useState(false);
  const [stemiScreen, setStemiScreen] = useState(false);
  const [triageNotes, setTriageNotes] = useState('Patient alert; vitals stable; expedited for acute assessment.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !encounter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        patientName: encounter.patientName,
        triageNurseName,
        esiLevel,
        chiefComplaint: encounter.chiefComplaint,
        painScore: parseInt(painScore) || 0,
        systolicBp: parseInt(systolicBp) || 120,
        diastolicBp: parseInt(diastolicBp) || 80,
        pulseRate: parseInt(pulseRate) || 80,
        respiratoryRate: parseInt(respiratoryRate) || 18,
        temperatureF: parseFloat(temperatureF) || 98.6,
        spo2Percentage: parseFloat(spo2) || 98,
        gcsScore: parseInt(gcsScore) || 15,
        allergiesNoted,
        sepsisScreenPositive: sepsisScreen,
        strokeScreenPositive: strokeScreen,
        stemiScreenPositive: stemiScreen,
        triageNotes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Emergency Triage & Acuity Classification</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} ({encounter.patientMrn}) — {encounter.chiefComplaint}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Severity Index (ESI)</label>
              <select value={esiLevel} onChange={(e) => setEsiLevel(e.target.value as ESILevel)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
                <option value="ESI_1_IMMEDIATE_RESUSCITATION">ESI 1 - Immediate Resuscitation (Life-Threatening)</option>
                <option value="ESI_2_EMERGENT_HIGH_RISK">ESI 2 - Emergent / High Risk (Severe Pain / Vitals)</option>
                <option value="ESI_3_URGENT_MULTIPLE_RESOURCES">ESI 3 - Urgent (Multiple Diagnostic Resources)</option>
                <option value="ESI_4_LESS_URGENT_ONE_RESOURCE">ESI 4 - Less Urgent (One Diagnostic Resource)</option>
                <option value="ESI_5_NON_URGENT_NO_RESOURCES">ESI 5 - Non-Urgent (No Resources Needed)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Triage Nurse</label>
              <Input value={triageNurseName} onChange={(e) => setTriageNurseName(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <label className="font-semibold text-gray-700">BP (Sys/Dia)</label>
              <div className="flex gap-1 mt-1">
                <Input value={systolicBp} onChange={(e) => setSystolicBp(e.target.value)} placeholder="Sys" />
                <Input value={diastolicBp} onChange={(e) => setDiastolicBp(e.target.value)} placeholder="Dia" />
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Pulse (BPM)</label>
              <Input value={pulseRate} onChange={(e) => setPulseRate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="font-semibold text-gray-700">Resp Rate</label>
              <Input value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="font-semibold text-gray-700">SpO2 (%)</label>
              <Input value={spo2} onChange={(e) => setSpo2(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Temp (°F)</label>
              <Input value={temperatureF} onChange={(e) => setTemperatureF(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GCS (3-15)</label>
              <Input value={gcsScore} onChange={(e) => setGcsScore(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pain Score (0-10)</label>
              <Input value={painScore} onChange={(e) => setPainScore(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-900">
              <input type="checkbox" checked={stemiScreen} onChange={(e) => setStemiScreen(e.target.checked)} />
              STEMI Alert
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-900">
              <input type="checkbox" checked={strokeScreen} onChange={(e) => setStrokeScreen(e.target.checked)} />
              Stroke Alert
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-900">
              <input type="checkbox" checked={sepsisScreen} onChange={(e) => setSepsisScreen(e.target.checked)} />
              Sepsis Alert
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Allergies</label>
            <Input value={allergiesNoted} onChange={(e) => setAllergiesNoted(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Triage Assessment Notes</label>
            <Input value={triageNotes} onChange={(e) => setTriageNotes(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Triaging...' : 'Complete Triage & Queue'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
