import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RadiologyCriticalFindingDto, AcknowledgeCriticalFindingRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  finding: RadiologyCriticalFindingDto | null;
  onSubmit: (req: AcknowledgeCriticalFindingRequest) => Promise<void>;
  tenantId: string;
}

export const AcknowledgeCriticalFindingDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  finding,
  onSubmit,
  tenantId
}) => {
  const [doctor, setDoctor] = useState('Dr. Gregory House, MD');
  const [notes, setNotes] = useState('Acknowledged via phone. Patient initiated on IV heparin protocol and transferred to ICU bed.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !finding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        alertId: finding.id,
        acknowledgedByDoctor: doctor,
        clinicalActionNotes: notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acknowledge Critical Finding</h2>
        <p className="text-xs text-gray-500 mb-4">{finding.alertCode} — {finding.patientName}</p>
        <div className="mb-4 bg-red-50 p-3 rounded border border-red-200 text-xs">
          <p className="font-bold text-red-800">Critical Finding:</p>
          <p className="text-red-700 mt-1">{finding.findingDescription}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Acknowledging Clinician</label>
            <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Immediate Clinical Action Taken</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Confirm Acknowledgement'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
