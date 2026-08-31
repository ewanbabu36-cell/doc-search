import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodComponentDto, ReleaseBloodUnitRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unit: BloodComponentDto | null;
  onSubmit: (req: ReleaseBloodUnitRequest) => Promise<void>;
  tenantId: string;
}

export const ReleaseBloodUnitDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  unit,
  onSubmit,
  tenantId
}) => {
  const [pathologist, setPathologist] = useState('Dr. Alistair Vance, MD');
  const [notes, setNotes] = useState('All Serology & NAT tests verified negative; Unit authorized for issue.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !unit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        unitId: unit.id,
        releasedByPathologist: pathologist,
        verificationNotes: notes
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Authorize Quarantine Release</h2>
        <p className="text-xs text-gray-500 mb-4">{unit.componentCode} — {unit.componentType} ({unit.bloodGroup})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Pathologist</label>
            <Input value={pathologist} onChange={(e) => setPathologist(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Release Verification Note</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Releasing...' : 'Release to Available Inventory'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
