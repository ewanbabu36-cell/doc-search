import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyCrashCartDto, CheckCrashCartRequest } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

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

  // Consumption Telemetry State for Resuscitation Unsealing
  const [usedAdrenaline, setUsedAdrenaline] = useState(2);
  const [usedAtropine, setUsedAtropine] = useState(1);
  const [usedAmiodarone, setUsedAmiodarone] = useState(1);
  const [newSealNumber] = useState(`SEAL-${Math.floor(2000 + Math.random() * 8000)}-GREEN`);

  if (!isOpen || !cart) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        cartId: cart.id,
        sealNumber: intact ? sealNumber : newSealNumber,
        isSealIntact: intact,
        defibrillatorBatteryPercent: parseInt(battery) || 100,
        oxygenCylinderPressurePsi: parseInt(oxygen) || 2000,
        hasExpiredItems: expired,
        checkedByStaff: staff
      });

      if (!intact) {
        hospitalEventBus.publish(
          'CRASH_CART_REPLENISH_TRIGGERED',
          'CrashCartTelemetryDesk',
          {
            cartCode: cart.cartCode,
            locationZone: cart.locationZone,
            brokenSealNumber: sealNumber,
            newSealAllocated: newSealNumber,
            consumedItems: [
              { item: 'Inj Adrenaline 1mg/1ml', quantity: usedAdrenaline },
              { item: 'Inj Atropine 0.6mg/1ml', quantity: usedAtropine },
              { item: 'Inj Amiodarone 150mg/3ml', quantity: usedAmiodarone }
            ],
            verifiedBy: staff
          },
          `🚨 Emergency Crash Cart Unsealed (${cart.cartCode}): Auto-replenishment indent dispatched to Central Pharmacy`
        );
      }

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

          {!intact && (
            <div className="p-3.5 rounded-lg border border-red-300 bg-red-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-red-900 flex items-center gap-1.5">
                  <span>🚨</span>
                  <span>Resuscitation Consumption Telemetry (Seal Broken)</span>
                </span>
                <span className="text-[10px] bg-red-200 text-red-800 font-bold px-2 py-0.5 rounded">
                  AUTO-REPLENISH INDENT
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Inj Adrenaline (1mg)</label>
                  <Input type="number" min="0" value={usedAdrenaline} onChange={(e) => setUsedAdrenaline(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Inj Atropine (0.6mg)</label>
                  <Input type="number" min="0" value={usedAtropine} onChange={(e) => setUsedAtropine(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Inj Amiodarone (150mg)</label>
                  <Input type="number" min="0" value={usedAmiodarone} onChange={(e) => setUsedAmiodarone(parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-red-200 text-xs">
                <span className="text-gray-600 font-medium">New Replacement Tamper-Seal Allocated:</span>
                <strong className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  {newSealNumber}
                </strong>
              </div>

              <p className="text-[11px] text-red-800 leading-tight">
                ⚡ Submitting will release Central Pharmacy emergency vault lock and dispatch runner with replenishment box.
              </p>
            </div>
          )}

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
