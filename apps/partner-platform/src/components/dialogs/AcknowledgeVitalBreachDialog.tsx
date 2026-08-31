import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { AcknowledgeVitalBreachRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  alertId: string;
  patientName: string;
  vitalParameter: string;
  measuredValue: string;
  onClose: () => void;
  onSubmit: (data: AcknowledgeVitalBreachRequest) => Promise<void>;
}

export const AcknowledgeVitalBreachDialog: React.FC<Props> = ({
  isOpen,
  alertId,
  patientName,
  vitalParameter,
  measuredValue,
  onClose,
  onSubmit
}) => {
  const [acknowledgedBy, setAcknowledgedBy] = useState('Dr. Sanjay Gupta');
  const [clinicalActionTaken, setClinicalActionTaken] = useState('Contacted patient via tele-triage; adjusted morning dosage; scheduled immediate video consult.');
  const [escalateToVideoCall, setEscalateToVideoCall] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        alertId,
        acknowledgedBy,
        clinicalActionTaken,
        escalateToVideoCall
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-red-700">🚨 Acknowledge Out-of-Range Vital Alert</h2>
        <p className="text-xs text-gray-600">Patient: <strong>{patientName}</strong> | Breach: <strong>{vitalParameter}</strong> = <span className="font-bold text-red-600">{measuredValue}</span></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Responding Clinician</label>
            <Input value={acknowledgedBy} onChange={(e) => setAcknowledgedBy(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Intervention Taken</label>
            <Input value={clinicalActionTaken} onChange={(e) => setClinicalActionTaken(e.target.value)} required />
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
            <input
              type="checkbox"
              id="escalateCheck"
              checked={escalateToVideoCall}
              onChange={(e) => setEscalateToVideoCall(e.target.checked)}
            />
            <label htmlFor="escalateCheck" className="text-xs text-red-900 font-semibold cursor-pointer">
              Launch STAT Emergency Video Consultation
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Acknowledging...' : 'Acknowledge & Record Action'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
