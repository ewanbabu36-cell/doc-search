import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodRequestDto, BloodComponentDto, ReserveBloodUnitRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: BloodRequestDto | null;
  component: BloodComponentDto | null;
  onSubmit: (req: ReserveBloodUnitRequest) => Promise<void>;
  tenantId: string;
}

export const ReserveBloodUnitDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  component,
  onSubmit,
  tenantId
}) => {
  const [staff, setStaff] = useState('Samantha Ray, SBB');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request || !component) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        requestId: request.id,
        componentId: component.id,
        reservedByStaff: staff
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Reserve Blood Unit</h2>
        <p className="text-xs text-gray-500 mb-4">Patient: {request.patientName} | Unit: {component.componentCode}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reserving Staff</label>
            <Input value={staff} onChange={(e) => setStaff(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Reserving...' : 'Confirm Unit Reservation'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
