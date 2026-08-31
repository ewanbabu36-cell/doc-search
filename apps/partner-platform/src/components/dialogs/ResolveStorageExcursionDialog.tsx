import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodStorageTemperatureLogDto, ResolveStorageExcursionRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  log: BloodStorageTemperatureLogDto | null;
  onSubmit: (req: ResolveStorageExcursionRequest) => Promise<void>;
  tenantId: string;
}

export const ResolveStorageExcursionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  log,
  onSubmit,
  tenantId
}) => {
  const [action, setAction] = useState('Compressor reset completed; backup cooling unit activated. Chamber temp normalized within 12 minutes.');
  const [officer, setOfficer] = useState('Samantha Ray, SBB');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !log) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        logId: log.id,
        correctiveActionTaken: action,
        resolvedByOfficer: officer
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-red-900 mb-2">Resolve Temperature Excursion Alert</h2>
        <p className="text-xs text-gray-500 mb-4">{log.unitLocation} — Recorded: {log.recordedTemperatureC}°C</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Corrective Action Taken</label>
            <Input value={action} onChange={(e) => setAction(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Resolving Blood Bank Officer</label>
            <Input value={officer} onChange={(e) => setOfficer(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Resolving...' : 'Sign & Clear Excursion'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
