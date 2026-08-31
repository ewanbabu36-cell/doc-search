import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OperationTheatreComplexDto, UpdateOperationTheatreComplexRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  complex: OperationTheatreComplexDto | null;
  onSubmit: (req: UpdateOperationTheatreComplexRequest) => Promise<void>;
}

export const EditOperationTheatreDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  complex,
  onSubmit
}) => {
  const [complexName, setComplexName] = useState(complex?.complexName || '');
  const [operatingHours, setOperatingHours] = useState(complex?.operatingHours || '24/7');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !complex) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        complexId: complex.id,
        complexName,
        operatingHours
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit OT Complex: {complex.complexCode}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Complex Name</label>
            <Input value={complexName} onChange={(e) => setComplexName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Operating Hours</label>
            <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
