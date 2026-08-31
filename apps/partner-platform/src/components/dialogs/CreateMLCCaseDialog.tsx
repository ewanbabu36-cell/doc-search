import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, CreateMLCCaseRequest, MLCCaseType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: CreateMLCCaseRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateMLCCaseDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [caseType, setCaseType] = useState<MLCCaseType>('ROAD_TRAFFIC_ACCIDENT');
  const [station, setStation] = useState('City Central Police Station');
  const [officer, setOfficer] = useState('Officer R. Patil');
  const [badge, setBadge] = useState('BADGE-4421');
  const [fir, setFir] = useState('FIR-2026/902');
  const [injury, setInjury] = useState('Lacerations, compound fracture, multiple contusions sustained during accident');
  const [evidence, setEvidence] = useState('Blood alcohol sample, clothing items sealed in custody bag');
  const [custodian, setCustodian] = useState('Staff Nurse Jennifer Adams');
  const [doctor, setDoctor] = useState('Dr. Marcus Webb, MD');
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
        caseType,
        policeStation: station,
        policeOfficerName: officer,
        policeBadgeNumber: badge,
        firNumber: fir,
        injuryDescription: injury,
        evidenceItemsCollected: evidence,
        chainOfCustodyCustodian: custodian,
        registeredByDoctor: doctor
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border-4 border-indigo-500">
        <h2 className="text-xl font-bold text-indigo-700 mb-2">⚖ Medico-Legal Case (MLC) Registration</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} — Police Notification & Chain of Custody</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">MLC Incident Classification</label>
            <select value={caseType} onChange={(e) => setCaseType(e.target.value as MLCCaseType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
              <option value="ROAD_TRAFFIC_ACCIDENT">Road Traffic Accident (RTA)</option>
              <option value="PHYSICAL_ASSAULT">Physical Assault / Battery</option>
              <option value="GUNSHOT_OR_STAB_WOUND">Gunshot / Penetrating Stab Wound</option>
              <option value="SUSPECTED_POISONING">Suspected Poisoning / Chemical Ingestion</option>
              <option value="BURNS_AND_ELECTROCUTION">Burns & Electrocution</option>
              <option value="INDUSTRIAL_ACCIDENT">Industrial / Workplace Accident</option>
              <option value="UNKNOWN_UNCONSCIOUS_TRAUMA">Unknown Unconscious Trauma</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Police Station</label>
              <Input value={station} onChange={(e) => setStation(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Investigating Officer Name</label>
              <Input value={officer} onChange={(e) => setOfficer(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Officer Badge #</label>
              <Input value={badge} onChange={(e) => setBadge(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">FIR / Crime Incident #</label>
              <Input value={fir} onChange={(e) => setFir(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Injury & Clinical Trauma Description</label>
            <Input value={injury} onChange={(e) => setInjury(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Evidence Collected & Chain of Custody</label>
            <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Chain-of-Custody Custodian</label>
              <Input value={custodian} onChange={(e) => setCustodian(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Doctor</label>
              <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Certify & Register MLC'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
