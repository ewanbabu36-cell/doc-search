import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { DietarySafetyAlertDto, ResolveDietarySafetyAlertRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  alert: DietarySafetyAlertDto;
  onClose: () => void;
  onSubmit: (alertId: string, data: ResolveDietarySafetyAlertRequest) => Promise<void>;
}

export const ResolveDietarySafetyAlertDialog: React.FC<Props> = ({ isOpen, alert, onClose, onSubmit }) => {
  const [resolvedBy, setResolvedBy] = useState('Dietitian Pooja Joshi');
  const [resolutionNotes, setResolutionNotes] = useState('Tray intercept confirmed with ward nurse. Diet tag replaced.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(alert.id, { resolvedBy, resolutionNotes });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Resolve Dietary Safety Alert ({alert.alertCode})</h2>
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
          <p><strong>Alert:</strong> {alert.description}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Resolving Safety Officer / Dietitian</label>
            <Input value={resolvedBy} onChange={(e) => setResolvedBy(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Corrective Action Taken</label>
            <Input value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Resolving...' : 'Resolve Alert'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
