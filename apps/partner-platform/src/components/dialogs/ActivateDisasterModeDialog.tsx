import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { ActivateDisasterModeRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: ActivateDisasterModeRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const ActivateDisasterModeDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [disasterType, setDisasterType] = useState('Major Industrial Fire & Chemical Spill');
  const [commander, setCommander] = useState('Dr. Evelyn Reed (ED Chief)');
  const [justification, setJustification] = useState('Multiple casualties incoming (>20 victims); surge capacity and rapid tag triage activated.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        disasterType,
        incidentCommanderName: commander,
        justification
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border-4 border-red-600">
        <h2 className="text-xl font-bold text-red-700 mb-2">🚨 ACTIVATE MASS CASUALTY / DISASTER PROTOCOL</h2>
        <p className="text-xs text-gray-500 mb-4">Unlocks emergency mass-casualty tags, surge triage, and multi-bed capacity.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Disaster / MCI Incident Description</label>
            <Input value={disasterType} onChange={(e) => setDisasterType(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Incident Commander</label>
            <Input value={commander} onChange={(e) => setCommander(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Activation Justification & Emergency Authorization</label>
            <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Activating...' : 'BROADCAST DISASTER ACTIVATION'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
