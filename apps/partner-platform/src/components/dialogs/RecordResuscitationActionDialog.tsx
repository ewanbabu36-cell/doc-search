import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyResuscitationEventDto, RecordResuscitationActionRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: EmergencyResuscitationEventDto | null;
  onSubmit: (req: RecordResuscitationActionRequest) => Promise<void>;
  tenantId: string;
}

export const RecordResuscitationActionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  event,
  onSubmit,
  tenantId
}) => {
  const [cprMinutes, setCprMinutes] = useState('15');
  const [shocks, setShocks] = useState('2');
  const [meds, setMeds] = useState('Epinephrine 1mg IV x 3, Amiodarone 300mg IV');
  const [rosc, setRosc] = useState(true);
  const [outcome, setOutcome] = useState('ROSC Achieved; Stabilizing in Red Zone');
  const [actionNotes, setActionNotes] = useState('Return of spontaneous pulse @ 110 bpm; BP 100/60');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        eventId: event.id,
        actionTaken: actionNotes,
        cprDurationMinutes: parseInt(cprMinutes) || 0,
        shocksDeliveredCount: parseInt(shocks) || 0,
        medicationsAdministeredSummary: meds,
        roscAchieved: rosc,
        finalOutcome: outcome,
        recordedBy: event.teamLeaderName
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Log Resuscitation Interventions & Outcome</h2>
        <p className="text-xs text-gray-500 mb-4">{event.eventNumber} — {event.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">CPR Duration (Minutes)</label>
              <Input type="number" value={cprMinutes} onChange={(e) => setCprMinutes(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Defibrillation Shocks</label>
              <Input type="number" value={shocks} onChange={(e) => setShocks(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Medications Administered</label>
            <Input value={meds} onChange={(e) => setMeds(e.target.value)} required />
          </div>
          <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-800">
              <input type="checkbox" checked={rosc} onChange={(e) => setRosc(e.target.checked)} />
              ROSC Achieved (Return of Spontaneous Circulation)
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Final Resuscitation Outcome</label>
            <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Intervention Summary</label>
            <Input value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Finalize Resuscitation Log'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
