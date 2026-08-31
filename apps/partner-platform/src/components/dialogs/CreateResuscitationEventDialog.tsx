import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, CreateResuscitationEventRequest, ResuscitationRhythm } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: CreateResuscitationEventRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateResuscitationEventDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [bay, setBay] = useState('Resuscitation Bay 1');
  const [leader, setLeader] = useState('Dr. Evelyn Reed, MD');
  const [rhythm, setRhythm] = useState<ResuscitationRhythm>('VENTRICULAR_FIBRILLATION');
  const [airway, setAirway] = useState('Endotracheal Tube 7.5mm cuffed');
  const [notes, setNotes] = useState('Code Blue activated on arrival; CPR commenced immediately.');
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
        locationBay: bay,
        teamLeaderName: leader,
        initialRhythm: rhythm,
        airwaySecuredType: airway,
        notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border-4 border-red-600">
        <h2 className="text-xl font-bold text-red-600 mb-2">⚡ Code Blue / Emergency Resuscitation Event</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} ({encounter.patientMrn})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resuscitation Bay</label>
              <Input value={bay} onChange={(e) => setBay(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Team Leader</label>
              <Input value={leader} onChange={(e) => setLeader(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Cardiac Rhythm</label>
            <select value={rhythm} onChange={(e) => setRhythm(e.target.value as ResuscitationRhythm)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
              <option value="VENTRICULAR_FIBRILLATION">Ventricular Fibrillation (VF - Shockable)</option>
              <option value="PULSELESS_VT">Pulseless VT (Shockable)</option>
              <option value="ASYSTOLE">Asystole (Non-Shockable)</option>
              <option value="PEA">Pulseless Electrical Activity (PEA)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Airway Management Strategy</label>
            <Input value={airway} onChange={(e) => setAirway(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Event Initiation Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Activating...' : 'Log Code Blue Event'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
