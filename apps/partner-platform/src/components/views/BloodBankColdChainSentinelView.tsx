import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

interface StorageTelemetry {
  storageUnitId: string;
  unitType: string;
  currentTemp: number;
  minAllowed: number;
  maxAllowed: number;
  breachDetected: boolean;
}

export const BloodBankColdChainSentinelView: React.FC = () => {
  const [telemetry, setTelemetry] = useState<StorageTelemetry[]>([
    { storageUnitId: 'PRBC-CHILLER-01', unitType: 'PRBC Refrigerator (Red Cells)', currentTemp: 4.2, minAllowed: 2.0, maxAllowed: 6.0, breachDetected: false },
    { storageUnitId: 'PLT-AGITATOR-01', unitType: 'Platelet Incubator & Agitator', currentTemp: 22.1, minAllowed: 20.0, maxAllowed: 24.0, breachDetected: false },
    { storageUnitId: 'FFP-FREEZER-01', unitType: 'Fresh Frozen Plasma Deep Freezer', currentTemp: -36.5, minAllowed: -40.0, maxAllowed: -30.0, breachDetected: false }
  ]);

  const [activeReservationCount, setActiveReservationCount] = useState(3);
  const [unitsAutoReleased, setUnitsAutoReleased] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);

  const handleSimulateColdBreach = async () => {
    setTelemetry((prev) =>
      prev.map((it, idx) => (idx === 0 ? { ...it, currentTemp: 8.8, breachDetected: true } : it))
    );

    try {
      await apiRequest('/api/v1/partner/blood-bank/iot/telemetry-stream', {
        method: 'POST',
        body: JSON.stringify({
          storageUnitId: 'PRBC-CHILLER-01',
          unitType: 'PRBC_REFRIGERATOR',
          currentTemperature: 8.8
        })
      });
    } catch {
      // Handled
    }
  };

  const handleNormalizeColdTemp = async () => {
    setTelemetry((prev) =>
      prev.map((it, idx) => (idx === 0 ? { ...it, currentTemp: 4.2, breachDetected: false } : it))
    );

    try {
      await apiRequest('/api/v1/partner/blood-bank/iot/telemetry-stream', {
        method: 'POST',
        body: JSON.stringify({
          storageUnitId: 'PRBC-CHILLER-01',
          unitType: 'PRBC_REFRIGERATOR',
          currentTemperature: 4.2
        })
      });
    } catch {
      // Handled
    }
  };

  const handleRunAutoExpireSweep = async () => {
    setIsSweeping(true);
    try {
      await apiRequest('/api/v1/partner/blood-bank/crossmatch/auto-expire-sweep', {
        method: 'POST',
        body: JSON.stringify({})
      });
      setUnitsAutoReleased(true);
      setActiveReservationCount((prev) => Math.max(0, prev - 1));
    } finally {
      setIsSweeping(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Cold-Chain Blood Bank IoT Sentinel</h1>
            <Badge variant="success">IoT Temperature Telemetry • 48h Crossmatch Auto-Release</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            NABH / Drugs & Cosmetics Act compliant blood storage monitoring & anti-wastage sweep
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={telemetry.some((t) => t.breachDetected) ? 'danger' : 'success'}>
            {telemetry.some((t) => t.breachDetected) ? '🚨 CRITICAL COLD-CHAIN BREACH' : 'ALL REFRIGERATORS NOMINAL'}
          </Badge>
        </div>
      </div>

      {/* Cold Chain Gauge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {telemetry.map((t, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-5 shadow-sm space-y-3 transition ${
              t.breachDetected ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-semibold text-sm text-gray-900">{t.storageUnitId}</span>
              <Badge variant={t.breachDetected ? 'danger' : 'success'}>
                {t.breachDetected ? 'ALARM ACTIVE' : 'NOMINAL'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">{t.unitType}</p>
            <div className="text-center py-4">
              <div
                className={`text-4xl font-extrabold font-mono ${
                  t.breachDetected ? 'text-red-600 animate-pulse' : 'text-cyan-700'
                }`}
              >
                {t.currentTemp > 0 ? `+${t.currentTemp.toFixed(1)}` : t.currentTemp.toFixed(1)}°C
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Allowed Range: {t.minAllowed}°C to {t.maxAllowed}°C
              </span>
            </div>
            {t.breachDetected && (
              <div className="text-xs text-red-700 font-medium bg-red-100 p-2 rounded text-center">
                Audible alarm sounding. Emergency SMS dispatched to Blood Bank Officer.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Temperature Simulation Controls */}
      <div className="flex gap-3 justify-end">
        <Button variant="danger" onClick={handleSimulateColdBreach}>
          Simulate Cold-Chain Breach (+8.8°C on PRBC)
        </Button>
        <Button variant="secondary" onClick={handleNormalizeColdTemp}>
          Normalize Temperature (+4.2°C)
        </Button>
      </div>

      {/* 48-Hour Cross-Match Reservation Sweep & Stock Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-rose-600">🩸</span> Surgical Cross-Match Reservations (48-Hour Expiry Hold)
            </h2>
            <p className="text-xs text-gray-500">
              Units held for elective surgical cases are automatically released back to emergency stock after 48 hours if unutilized.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info">Active Holds: {activeReservationCount}</Badge>
            <Button
              variant="primary"
              disabled={isSweeping || unitsAutoReleased}
              onClick={handleRunAutoExpireSweep}
            >
              {unitsAutoReleased ? '48h Auto-Release Sweep Completed ✓' : 'Run 48-Hour Auto-Expire Sweep'}
            </Button>
          </div>
        </div>

        {unitsAutoReleased && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center justify-between">
            <div>
              <span className="font-bold block">Anti-Wastage Auto-Release Sweep Executed:</span>
              <span>Unit BLD-PRBC-B-POS-9003 (51.4 hours elapsed, cancelled elective OT) safely restored to unreserved emergency pool.</span>
            </div>
            <Badge variant="success">PREVENTED BLOOD WASTAGE</Badge>
          </div>
        )}

        {/* Group-Wise Blood Inventory Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
          {[
            { group: 'O+', units: 14, status: 'OPTIMAL' },
            { group: 'O-', units: 4, status: 'CRITICAL_LOW' },
            { group: 'A+', units: 11, status: 'OPTIMAL' },
            { group: 'A-', units: 2, status: 'CRITICAL_LOW' },
            { group: 'B+', units: 18, status: 'OPTIMAL' },
            { group: 'B-', units: 3, status: 'LOW' },
            { group: 'AB+', units: 7, status: 'OPTIMAL' },
            { group: 'AB-', units: 1, status: 'CRITICAL_LOW' }
          ].map((item, idx) => (
            <div key={idx} className="bg-gray-50 border rounded-lg p-3">
              <span className="font-black text-gray-900 text-lg block">{item.group}</span>
              <span className="text-xs text-gray-500 block">{item.units} Units</span>
              <span
                className={`text-[10px] font-bold block mt-1 ${
                  item.status === 'OPTIMAL' ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {item.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
