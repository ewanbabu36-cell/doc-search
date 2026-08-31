import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EvaluateDdiRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EvaluateDdiRequest) => Promise<void>;
}

export const EvaluateDdiInteractionsDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientMrn, setPatientMrn] = useState('MRN-2026-9021');
  const [activeMedicationsText, setActiveMedicationsText] = useState('Warfarin Sodium 5mg, Ramipril 5mg, Atorvastatin 20mg');
  const [newMedicationToPrescribe, setNewMedicationToPrescribe] = useState('Clarithromycin 500mg');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientMrn,
        activeMedications: activeMedicationsText.split(',').map((s) => s.trim()),
        newMedicationToPrescribe
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-blue-900">💊 Smart Rx Drug-Drug Interaction CDSS Guard</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
            <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Current Active Medications (Comma-separated)</label>
            <Input value={activeMedicationsText} onChange={(e) => setActiveMedicationsText(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Drug Intended to Prescribe</label>
            <Input value={newMedicationToPrescribe} onChange={(e) => setNewMedicationToPrescribe(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Screening Pharmacopoeia...' : 'Evaluate DDI Safety'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
