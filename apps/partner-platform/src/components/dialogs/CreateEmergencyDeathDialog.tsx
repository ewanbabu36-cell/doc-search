import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, CreateEmergencyDeathRecordRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: CreateEmergencyDeathRecordRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateEmergencyDeathDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [isBroughtDead, setIsBroughtDead] = useState(false);
  const [doctor, setDoctor] = useState('Dr. Evelyn Reed, MD');
  const [cause, setCause] = useState('Refractory cardiopulmonary arrest secondary to acute myocardial infarction');
  const [mortuaryStaff, setMortuaryStaff] = useState('Mortuary Tech S. Patil');
  const [police, setPolice] = useState(false);
  const [notes, setNotes] = useState('Relatives counselled by social services and attending physician.');
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
        isBroughtDead,
        declaringPhysician: doctor,
        primaryCauseOfDeath: cause,
        mortuaryHandoverStaff: mortuaryStaff,
        policeInformed: police,
        notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border-4 border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Emergency Death Declaration & Handover</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} ({encounter.patientMrn})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded bg-slate-100 p-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900">
              <input type="checkbox" checked={isBroughtDead} onChange={(e) => setIsBroughtDead(e.target.checked)} />
              Brought Dead on Arrival (BDOA)
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Declaring Physician</label>
            <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Cause of Death</label>
            <Input value={cause} onChange={(e) => setCause(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mortuary Handover Staff</label>
              <Input value={mortuaryStaff} onChange={(e) => setMortuaryStaff(e.target.value)} required />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={police} onChange={(e) => setPolice(e.target.checked)} />
                Police / Coroner Notified
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Documentation Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Certify & Transfer to Mortuary'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
