import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateOperationTheatreComplexRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateOperationTheatreComplexRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateOperationTheatreDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [complexCode, setComplexCode] = useState('');
  const [complexName, setComplexName] = useState('');
  const [building, setBuilding] = useState('Surgical Block');
  const [floor, setFloor] = useState('Floor 2');
  const [operatingHours, setOperatingHours] = useState('24/7');
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
        complexCode,
        complexName,
        building,
        floor,
        operatingHours,
        hasLaminarAirflow: true,
        hasCentralSterileSupply: true
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Register OT Complex</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Complex Code</label>
            <Input value={complexCode} onChange={(e) => setComplexCode(e.target.value)} placeholder="e.g. OTC-MAIN" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Complex Name</label>
            <Input value={complexName} onChange={(e) => setComplexName(e.target.value)} placeholder="e.g. Main Surgical Pavilion" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Building</label>
              <Input value={building} onChange={(e) => setBuilding(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Floor</label>
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Operating Hours</label>
            <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Complex'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
