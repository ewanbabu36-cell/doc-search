import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyCrashCartDto, CheckCrashCartRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cart: EmergencyCrashCartDto | null;
  onSubmit: (req: CheckCrashCartRequest) => Promise<void>;
  tenantId: string;
}

export const CheckCrashCartDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  cart,
  onSubmit,
  tenantId
}) => {
  const [sealNumber, setSealNumber] = useState(cart?.sealNumber || 'SEAL-2026-09');
  const [intact, setIntact] = useState(true);
  const [battery, setBattery] = useState('100');
  const [oxygen, setOxygen] = useState('2000');
  const [expired, setExpired] = useState(false);
  const [staff, setStaff] = useState('Staff Nurse Jennifer Adams');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !cart) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        cartId: cart.id,
        sealNumber,
        isSealIntact: intact,
        defibrillatorBatteryPercent: parseInt(battery) || 100,
        oxygenCylinderPressurePsi: parseInt(oxygen) || 2000,
        hasExpiredItems: expired,
        checkedByStaff: staff
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Crash Cart Verification Checklist</h2>
        <p className="text-xs text-gray-500 mb-4">{cart.cartCode} — {cart.locationZone}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tamper-Evident Seal #</label>
            <Input value={sealNumber} onChange={(e) => setSealNumber(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Defib Battery (%)</label>
              <Input type="number" min="0" max="100" value={battery} onChange={(e) => setBattery(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">O2 Pressure (PSI)</label>
              <Input type="number" value={oxygen} onChange={(e) => setOxygen(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 rounded bg-gray-50 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
              <input type="checkbox" checked={intact} onChange={(e) => setIntact(e.target.checked)} />
              Seal is Intact
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-red-700">
              <input type="checkbox" checked={expired} onChange={(e) => setExpired(e.target.checked)} />
              Expired Meds / Items Found
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Verifying Staff Nurse</label>
            <Input value={staff} onChange={(e) => setStaff(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Sign Crash Cart Check'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
