import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RecordTemperatureRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RecordTemperatureRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RecordTemperatureDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [loc, setLoc] = useState('Blood Refrigerator #1 (PRBC)');
  const [type, setType] = useState<'BLOOD_BANK_REFRIGERATOR_4C' | 'DEEP_FREEZER_MINUS_40C' | 'PLATELET_AGITATOR_INCUBATOR_22C'>('BLOOD_BANK_REFRIGERATOR_4C');
  const [temp, setTemp] = useState('4.0');
  const [minT, setMinT] = useState('2.0');
  const [maxT, setMaxT] = useState('6.0');
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
        unitLocation: loc,
        storageUnitType: type,
        recordedTemperatureC: parseFloat(temp) || 4.0,
        targetMinC: parseFloat(minT) || 2.0,
        targetMaxC: parseFloat(maxT) || 6.0
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Record Cold-Chain Temperature</h2>
        <p className="text-xs text-gray-500 mb-4">Manual / Sensor calibrated storage reading</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Storage Unit Location</label>
            <Input value={loc} onChange={(e) => setLoc(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'BLOOD_BANK_REFRIGERATOR_4C' | 'DEEP_FREEZER_MINUS_40C' | 'PLATELET_AGITATOR_INCUBATOR_22C')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="BLOOD_BANK_REFRIGERATOR_4C">Blood Refrigerator (4°C)</option>
              <option value="DEEP_FREEZER_MINUS_40C">Deep Freezer (-40°C)</option>
              <option value="PLATELET_AGITATOR_INCUBATOR_22C">Platelet Incubator (22°C)</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reading (°C)</label>
              <Input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min Target</label>
              <Input type="number" step="0.1" value={minT} onChange={(e) => setMinT(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Max Target</label>
              <Input type="number" step="0.1" value={maxT} onChange={(e) => setMaxT(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Save Temperature Log'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
