import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onConfirmClose: (encounterId: string, notes: string) => Promise<void>;
}

export const CloseEmergencyEncounterDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onConfirmClose
}) => {
  const [notes, setNotes] = useState('All orders completed, patient safely handed over.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !encounter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirmClose(encounter.id, notes);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Close Emergency Encounter</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.encounterNumber} — {encounter.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Final Closure Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Closing...' : 'Close & Archive Encounter'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
