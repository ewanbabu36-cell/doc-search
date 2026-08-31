import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { AcknowledgePanicValueRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  panicAlertId: string;
  testName: string;
  measuredValue: string;
  onClose: () => void;
  onSubmit: (data: AcknowledgePanicValueRequest) => Promise<void>;
}

export const AcknowledgePanicValueDialog: React.FC<Props> = ({
  isOpen,
  panicAlertId,
  testName,
  measuredValue,
  onClose,
  onSubmit
}) => {
  const [acknowledgedByDoctor, setAcknowledgedByDoctor] = useState('Dr. Sanjay Gupta');
  const [immediateIntervention, setImmediateIntervention] = useState('STAT 12-lead ECG obtained; loaded with Aspirin 300mg + Ticagrelor 180mg; preparing cath lab for emergency coronary angiography.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        panicAlertId,
        acknowledgedByDoctor,
        immediateIntervention
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-red-700">⚠️ Critical Diagnostic Panic Value Alert</h2>
        <p className="text-xs text-gray-700">Critical Finding: <strong>{testName}</strong> = <span className="font-bold text-red-600">{measuredValue}</span></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Acknowledging Clinician</label>
            <Input value={acknowledgedByDoctor} onChange={(e) => setAcknowledgedByDoctor(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Immediate Clinical Action Taken</label>
            <Input value={immediateIntervention} onChange={(e) => setImmediateIntervention(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Acknowledging...' : 'Acknowledge Critical Panic Alert'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
