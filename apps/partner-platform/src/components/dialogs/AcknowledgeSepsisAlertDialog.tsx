import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { AcknowledgeSepsisAlertRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  alertId: string;
  patientName: string;
  news2Score: number;
  onClose: () => void;
  onSubmit: (data: AcknowledgeSepsisAlertRequest) => Promise<void>;
}

export const AcknowledgeSepsisAlertDialog: React.FC<Props> = ({
  isOpen,
  alertId,
  patientName,
  news2Score,
  onClose,
  onSubmit
}) => {
  const [acknowledgedBy, setAcknowledgedBy] = useState('Dr. Vivek Mehra (Intensivist)');
  const [clinicalActionTaken, setClinicalActionTaken] = useState('Rapid Response Team mobilized; initiated 1-Hour Sepsis Bundle (Blood culture sent, IV Piperacillin-Tazobactam 4.5g started, 1000ml Ringer Lactate bolus infusing).');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        alertId,
        acknowledgedBy,
        bundleActionsCompleted: ['BLOOD_CULTURES', 'SERUM_LACTATE', 'IV_ANTIBIOTICS', 'IV_FLUIDS'],
        clinicalActionTaken
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-lg font-bold text-red-700">🚨 Sepsis 1-Hour Bundle Immediate Response</h2>
          <p className="text-xs text-gray-500">Patient: <strong>{patientName}</strong> | NEWS2 Score: <span className="font-bold text-red-600">{news2Score}/20 (High Risk Red Alert)</span></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
            <span className="font-bold text-red-900 block">Surviving Sepsis Campaign 1-Hour Bundle Checklist:</span>
            <p className="text-red-800">✓ Measure serum lactate level</p>
            <p className="text-red-800">✓ Obtain blood cultures prior to antibiotics</p>
            <p className="text-red-800">✓ Administer broad-spectrum IV antimicrobials</p>
            <p className="text-red-800">✓ Rapid administration of 30 mL/kg crystalloid for hypotension/lactate ≥ 4 mmol/L</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Responding Physician / Intensivist</label>
            <Input value={acknowledgedBy} onChange={(e) => setAcknowledgedBy(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Immediate Clinical Interventions Documented</label>
            <Input value={clinicalActionTaken} onChange={(e) => setClinicalActionTaken(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Acknowledging...' : 'Acknowledge & Deploy RRT'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
