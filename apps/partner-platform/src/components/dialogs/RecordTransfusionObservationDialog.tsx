import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { TransfusionRecordDto, RecordTransfusionObservationRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transfusion: TransfusionRecordDto | null;
  onSubmit: (req: RecordTransfusionObservationRequest) => Promise<void>;
  tenantId: string;
}

export const RecordTransfusionObservationDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  transfusion,
  onSubmit,
  tenantId
}) => {
  const [pulse, setPulse] = useState('82');
  const [bp, setBp] = useState('118/76');
  const [temp, setTemp] = useState('98.6');
  const [reaction, setReaction] = useState(false);
  const [notes, setNotes] = useState('Transfusion completed without adverse event. Vital signs stable throughout.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !transfusion) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        transfusionId: transfusion.id,
        endTime: new Date().toISOString(),
        postTransfusionPulse: parseInt(pulse) || 80,
        postTransfusionBp: bp,
        postTransfusionTempF: parseFloat(temp) || 98.6,
        adverseReactionNoted: reaction,
        status: reaction ? 'HALTED_DUE_TO_REACTION' : 'COMPLETED_UNEVENTFUL',
        outcomeNotes: notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Finalize Transfusion Observations</h2>
        <p className="text-xs text-gray-500 mb-4">{transfusion.transfusionCode} — Patient: {transfusion.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Post-Pulse (bpm)</label>
              <Input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Post-BP (mmHg)</label>
              <Input value={bp} onChange={(e) => setBp(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Post-Temp (°F)</label>
              <Input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-red-900">
              <input type="checkbox" checked={reaction} onChange={(e) => setReaction(e.target.checked)} className="rounded" />
              Adverse reaction noted during or post-transfusion
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Outcome Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Finalize Transfusion'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
