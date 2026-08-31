import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OverrideDdiWarningRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  interactionId: string;
  drugA: string;
  drugB: string;
  onClose: () => void;
  onSubmit: (data: OverrideDdiWarningRequest) => Promise<void>;
}

export const OverrideDdiWarningDialog: React.FC<Props> = ({
  isOpen,
  interactionId,
  drugA,
  drugB,
  onClose,
  onSubmit
}) => {
  const [prescribingDoctor, setPrescribingDoctor] = useState('Dr. Sanjay Gupta (Cardiologist)');
  const [clinicalJustification, setClinicalJustification] = useState('Clinical benefit outweighs risk: Short 3-day course with daily INR monitoring and PPI co-prescription.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        interactionId,
        prescribingDoctor,
        clinicalJustification,
        riskBenefitRatioAssessed: true
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-amber-700">⚠️ Clinician DDI Safety Override</h2>
        <p className="text-xs text-gray-600">Overriding alert for: <strong>{drugA}</strong> + <strong>{drugB}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Prescribing Doctor</label>
            <Input value={prescribingDoctor} onChange={(e) => setPrescribingDoctor(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Justification for Override</label>
            <Input value={clinicalJustification} onChange={(e) => setClinicalJustification(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging Override...' : 'Confirm Safety Override'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
