import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, CreateTraumaActivationRequest, TraumaActivationLevel } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: CreateTraumaActivationRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateTraumaActivationDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [level, setLevel] = useState<TraumaActivationLevel>('LEVEL_1_HIGHEST_TRAUMA_ALERT');
  const [mechanism, setMechanism] = useState('Motor vehicle collision with ejection');
  const [leader, setLeader] = useState('Dr. Evelyn Reed, MD');
  const [airway, setAirway] = useState('Intubated with 7.5 ETT');
  const [breathing, setBreathing] = useState('Bilateral breath sounds present');
  const [circulation, setCirculating] = useState('Hypotension responding to fluid bolus');
  const [gcs, setGcs] = useState('10');
  const [exposure, setExposure] = useState('Pelvic instability, right lower extremity deformity');
  const [fastScan, setFastScan] = useState(true);
  const [mtp, setMtp] = useState(true);
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
        patientName: encounter.patientName,
        activationLevel: level,
        mechanismOfInjury: mechanism,
        timeOfInjury: new Date().toISOString(),
        traumaTeamLeader: leader,
        airwayStatus: airway,
        breathingStatus: breathing,
        circulationStatus: circulation,
        disabilityGcs: parseInt(gcs) || 15,
        exposureFindings: exposure,
        fastScanPositive: fastScan,
        pelvicBinderApplied: true,
        massiveTransfusionActivated: mtp,
        specialistConsultsCalled: 'Orthopaedics, General Surgery',
        dispositionPlan: 'Emergency CT Trauma Pan-Scan followed by surgical intervention'
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border-4 border-red-500">
        <h2 className="text-xl font-bold text-red-600 mb-2">⚡ Trauma Team Activation (ABCDE)</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} — {encounter.patientMrn}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Activation Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as TraumaActivationLevel)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
                <option value="LEVEL_1_HIGHEST_TRAUMA_ALERT">Level 1 - Highest Trauma Alert (Full Team)</option>
                <option value="LEVEL_2_INTERMEDIATE_TRAUMA_ALERT">Level 2 - Intermediate Trauma Alert</option>
                <option value="LEVEL_3_CONSULT_TRAUMA">Level 3 - Consult Trauma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Trauma Team Leader</label>
              <Input value={leader} onChange={(e) => setLeader(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mechanism of Injury</label>
            <Input value={mechanism} onChange={(e) => setMechanism(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">A: Airway</label>
              <Input value={airway} onChange={(e) => setAirway(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">B: Breathing</label>
              <Input value={breathing} onChange={(e) => setBreathing(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">C: Circulation</label>
              <Input value={circulation} onChange={(e) => setCirculating(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">D: Disability (GCS 3-15)</label>
              <Input type="number" value={gcs} onChange={(e) => setGcs(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">E: Exposure Findings</label>
              <Input value={exposure} onChange={(e) => setExposure(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 rounded bg-red-50 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-red-900">
              <input type="checkbox" checked={fastScan} onChange={(e) => setFastScan(e.target.checked)} />
              FAST Ultrasound Positive
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-red-900">
              <input type="checkbox" checked={mtp} onChange={(e) => setMtp(e.target.checked)} />
              Massive Transfusion Protocol (MTP)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Activating...' : 'Activate Trauma Team'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
