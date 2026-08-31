import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BiomedicalIncidentDto, ResolveBiomedicalIncidentRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  incident: BiomedicalIncidentDto;
  onClose: () => void;
  onSubmit: (incidentId: string, data: ResolveBiomedicalIncidentRequest) => Promise<void>;
}

export const ResolveBiomedicalIncidentDialog: React.FC<Props> = ({ isOpen, incident, onClose, onSubmit }) => {
  const [rootCause, setRootCause] = useState('Mechanical fatigue in drive mechanism combined with inadequate pre-case check.');
  const [capaActionPlan, setCapaActionPlan] = useState('Institute mandatory pre-case motion torque verification and replace all aging belts.');
  const [resolvedBy, setResolvedBy] = useState('Er. Rajesh Nair (BME Quality Lead)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(incident.id, { rootCause, capaActionPlan, resolvedBy });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Resolve Incident RCA & CAPA ({incident.incidentCode})</h2>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
          <p><strong>Equipment:</strong> {incident.assetName}</p>
          <p><strong>Incident:</strong> {incident.incidentSummary}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Root Cause Analysis (RCA)</label>
            <Input value={rootCause} onChange={(e) => setRootCause(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Corrective & Preventive Action Plan (CAPA)</label>
            <Input value={capaActionPlan} onChange={(e) => setCapaActionPlan(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Resolving Quality Officer</label>
            <Input value={resolvedBy} onChange={(e) => setResolvedBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Resolving...' : 'Sign & Close Incident'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
