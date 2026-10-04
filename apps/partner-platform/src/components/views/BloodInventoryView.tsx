import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodComponentDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

interface Props {
  components: BloodComponentDto[];
}

export const BloodInventoryView: React.FC<Props> = ({ components }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [waterfallDispatched, setWaterfallDispatched] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const usable = components.filter((c) => c.status === 'RELEASED_USABLE');
  const quarantined = components.filter((c) => c.status === 'QUARANTINED');
  const reserved = components.filter((c) => c.status === 'RESERVED_FOR_PATIENT');

  // Platelet Expiry Waterfall Analysis (5-day fragile shelf life)
  const plateletUnits = components.filter((c) => c.componentType.includes('PLATELET'));
  const criticalPlatelets = plateletUnits.filter((c) => {
    const hoursLeft = Math.round((new Date(c.expiryDate).getTime() - Date.now()) / (3600 * 1000));
    return hoursLeft > 0 && hoursLeft < 24 && c.status === 'RELEASED_USABLE';
  });
  const nearExpiryPlatelets = plateletUnits.filter((c) => {
    const hoursLeft = Math.round((new Date(c.expiryDate).getTime() - Date.now()) / (3600 * 1000));
    return hoursLeft >= 24 && hoursLeft < 48 && c.status === 'RELEASED_USABLE';
  });

  const handleDispatchWaterfall = (unit: BloodComponentDto, priorityWard: string) => {
    const hoursLeft = Math.max(1, Math.round((new Date(unit.expiryDate).getTime() - Date.now()) / (3600 * 1000)));
    const estimatedValueInr = unit.componentType === 'SINGLE_DONOR_PLATELETS_SDP' ? 14500 : 3500;

    hospitalEventBus.publish(
      'PLATELET_EXPIRY_WATERFALL_DISPATCHED',
      'BLOOD_BANK_INVENTORY',
      {
        componentId: unit.id,
        componentCode: unit.componentCode,
        componentType: unit.componentType,
        bloodGroup: unit.bloodGroup,
        hoursLeft,
        priorityWard,
        financialLossMitigated: `₹${estimatedValueInr.toLocaleString('en-IN')}`,
        timestamp: new Date().toISOString()
      },
      `Platelet Expiry Waterfall Broadcast: Unit ${unit.componentCode} (${unit.bloodGroup.replace('_', ' ')}) has ${hoursLeft}h shelf-life remaining. Priority requisition dispatched to ${priorityWard}.`
    );

    setWaterfallDispatched((prev) => ({ ...prev, [unit.id]: true }));
    setToastMessage(`Platelet Waterfall Alert dispatched! Priority ping sent to ${priorityWard}. Estimated salvage: ₹${estimatedValueInr.toLocaleString('en-IN')}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredComponents = components.filter((c) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'PRBC') return c.componentType.includes('PRBC');
    if (filterType === 'PLATELETS') return c.componentType.includes('PLATELET');
    if (filterType === 'PLASMA') return c.componentType.includes('PLASMA');
    if (filterType === 'CRITICAL_EXPIRY') {
      const hoursLeft = Math.round((new Date(c.expiryDate).getTime() - Date.now()) / (3600 * 1000));
      return hoursLeft > 0 && hoursLeft < 48;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">⚡ WATERFALL DISPATCH ACTIVE:</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-amber-300 hover:text-white text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Blood Bank Master Inventory & Shelf-Life Telemetry</h2>
            <Badge variant="primary">NABH / FDA Standard</Badge>
          </div>
          <p className="text-xs text-gray-500">Live component vault breakdown, continuous cold-chain temperature telemetry & dynamic platelet expiry waterfall engine</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="success">{usable.length} Usable Stock</Badge>
          <Badge variant="warning">{quarantined.length} Quarantined</Badge>
          <Badge variant="primary">{reserved.length} Reserved</Badge>
          {(criticalPlatelets.length > 0 || nearExpiryPlatelets.length > 0) && (
            <Badge variant="danger">
              ⚠️ {criticalPlatelets.length + nearExpiryPlatelets.length} Platelets Near Expiry (&lt;48h)
            </Badge>
          )}
        </div>
      </div>

      {/* PLATELET EXPIRY WATERFALL ALERT PANEL */}
      {(criticalPlatelets.length > 0 || nearExpiryPlatelets.length > 0) && (
        <div className="bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 border border-amber-500/40 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h3 className="text-sm font-black tracking-wide text-amber-200 uppercase">
                Platelet Expiry Waterfall Alert Engine (5-Day Fragile Shelf-Life)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-300/80">
              Zero-Wastage Clinical Requisition Algorithm
            </span>
          </div>
          <p className="text-xs text-amber-100/90 mb-3">
            Platelet units have a perishable 120-hour lifespan on 20°C–24°C agitators. To avert biological and financial discard (₹14,500/SDP unit), this automated waterfall engine broadcasts priority requisitions to high-acuity wards with thrombocytopenic patients before viability expires.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalPlatelets.map((unit) => {
              const hours = Math.max(1, Math.round((new Date(unit.expiryDate).getTime() - Date.now()) / (3600 * 1000)));
              const isDispatched = waterfallDispatched[unit.id];
              return (
                <div key={unit.id} className="p-3 bg-red-950/50 border border-red-500/60 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-red-200">{unit.componentCode}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-800 text-white uppercase">{unit.bloodGroup.replace('_', ' ')}</span>
                      <span className="text-[10px] font-bold text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-700/50">
                        CRITICAL: {hours}h LEFT
                      </span>
                    </div>
                    <p className="text-[11px] text-red-200/80 mt-1">
                      {unit.componentType.replace(/_/g, ' ')} • Vol: {unit.volumeMl}mL • Loc: {unit.storageLocation}
                    </p>
                    <p className="text-[10px] text-amber-300 font-semibold mt-0.5">
                      Target Bay: Medical ICU / Trauma Bay (Active Thrombocytopenia Protocol)
                    </p>
                  </div>
                  <Button
                    variant={isDispatched ? 'outline' : 'danger'}
                    size="sm"
                    disabled={isDispatched}
                    onClick={() => handleDispatchWaterfall(unit, 'Medical ICU & Trauma Bay')}
                  >
                    {isDispatched ? '✓ Requisition Alerted' : '⚡ Dispatch Stat ICU Ping'}
                  </Button>
                </div>
              );
            })}
            {nearExpiryPlatelets.map((unit) => {
              const hours = Math.max(1, Math.round((new Date(unit.expiryDate).getTime() - Date.now()) / (3600 * 1000)));
              const isDispatched = waterfallDispatched[unit.id];
              return (
                <div key={unit.id} className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-200">{unit.componentCode}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-800 text-white uppercase">{unit.bloodGroup.replace('_', ' ')}</span>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-600/40">
                        NEAR EXPIRY: {hours}h LEFT
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 mt-1">
                      {unit.componentType.replace(/_/g, ' ')} • Vol: {unit.volumeMl}mL • Loc: {unit.storageLocation}
                    </p>
                    <p className="text-[10px] text-amber-300 font-semibold mt-0.5">
                      Target Bay: Hemato-Oncology & BMT Unit (Chemo Nadir Prophylaxis)
                    </p>
                  </div>
                  <Button
                    variant={isDispatched ? 'outline' : 'primary'}
                    size="sm"
                    disabled={isDispatched}
                    onClick={() => handleDispatchWaterfall(unit, 'Hemato-Oncology & BMT Unit')}
                  >
                    {isDispatched ? '✓ Requisition Alerted' : '⚡ Dispatch Oncology Ping'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cold-Chain Vault Storage Units Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-900/10 to-red-950/20 border-red-500/20">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">PRBC Cold Vault (2°C – 6°C)</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Live: 3.8°C Normal</span>
          </div>
          <div className="text-2xl font-black text-red-700 mt-2">
            {components.filter((c) => c.componentType.includes('PRBC')).length} Units
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Packed Red Blood Cells • Shelf life 42 days (CPDA-1/SAGM)</p>
          <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] flex justify-between text-gray-600">
            <span>Usable: {components.filter((c) => c.componentType.includes('PRBC') && c.status === 'RELEASED_USABLE').length}</span>
            <span>Reserved: {components.filter((c) => c.componentType.includes('PRBC') && c.status === 'RESERVED_FOR_PATIENT').length}</span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-900/10 to-amber-950/20 border-amber-500/20">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">Platelet Agitator (20°C – 24°C)</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Live: 22.1°C • 60 RPM</span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {components.filter((c) => c.componentType.includes('PLATELET')).length} Units
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Single & Random Donor Platelets • Shelf life 5 days (120 hrs)</p>
          <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] flex justify-between text-gray-600">
            <span>SDP: {components.filter((c) => c.componentType === 'SINGLE_DONOR_PLATELETS_SDP').length}</span>
            <span>RDP: {components.filter((c) => c.componentType === 'RANDOM_DONOR_PLATELETS_RDP').length}</span>
            <span className="text-amber-700 font-bold">Waterfall Alerts: {criticalPlatelets.length + nearExpiryPlatelets.length}</span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-900/10 to-blue-950/20 border-blue-500/20">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">Plasma Deep Freeze (-30°C to -40°C)</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Live: -36.4°C Safe</span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {components.filter((c) => c.componentType.includes('PLASMA') || c.componentType.includes('CRYO')).length} Units
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Fresh Frozen Plasma & Cryoprecipitate • Shelf life 12 months</p>
          <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] flex justify-between text-gray-600">
            <span>FFP: {components.filter((c) => c.componentType === 'FRESH_FROZEN_PLASMA_FFP').length}</span>
            <span>Cryo: {components.filter((c) => c.componentType === 'CRYOPRECIPITATE').length}</span>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          All Units ({components.length})
        </button>
        <button
          onClick={() => setFilterType('PRBC')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filterType === 'PRBC' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
        >
          PRBC Units ({components.filter((c) => c.componentType.includes('PRBC')).length})
        </button>
        <button
          onClick={() => setFilterType('PLATELETS')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filterType === 'PLATELETS' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
        >
          Platelets ({plateletUnits.length})
        </button>
        <button
          onClick={() => setFilterType('PLASMA')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filterType === 'PLASMA' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
        >
          Plasma & Cryo ({components.filter((c) => c.componentType.includes('PLASMA') || c.componentType.includes('CRYO')).length})
        </button>
        <button
          onClick={() => setFilterType('CRITICAL_EXPIRY')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filterType === 'CRITICAL_EXPIRY' ? 'bg-red-900 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'}`}
        >
          Near Expiry (&lt;48h) ({criticalPlatelets.length + nearExpiryPlatelets.length})
        </button>
      </div>

      {/* Master Inventory Table */}
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Unit Barcode (DIN)</th>
              <th className="p-3">Component Type</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Storage Unit & Temp</th>
              <th className="p-3">Volume</th>
              <th className="p-3">Expiry & Shelf-Life Remaining</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredComponents.map((c) => {
              const diffMs = new Date(c.expiryDate).getTime() - Date.now();
              const hoursLeft = Math.round(diffMs / (3600 * 1000));
              const daysLeft = Math.round(diffMs / (86400 * 1000));
              const isPlatelet = c.componentType.includes('PLATELET');

              return (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">{c.componentCode}</td>
                  <td className="p-3">
                    <span className="font-semibold text-gray-900">{c.componentType.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-red-100 text-red-800">
                      {c.bloodGroup.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-600">
                    <div>{c.storageLocation}</div>
                    <div className="text-[10px] text-gray-400 font-mono">Target: {c.storageTemperatureTargetC}</div>
                  </td>
                  <td className="p-3 text-gray-700 font-semibold">{c.volumeMl} mL</td>
                  <td className="p-3 text-xs">
                    <div>{new Date(c.expiryDate).toLocaleDateString()}</div>
                    {isPlatelet && hoursLeft < 24 ? (
                      <span className="text-[10px] font-black text-red-700 animate-pulse">
                        ⚠️ EXPIRES IN {hoursLeft}h (STAT REQUISITION REQUIRED)
                      </span>
                    ) : isPlatelet && hoursLeft < 48 ? (
                      <span className="text-[10px] font-bold text-amber-700">
                        ⚡ {hoursLeft}h remaining (Priority oncology use)
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-medium">
                        {daysLeft > 0 ? `${daysLeft} days remaining` : `${hoursLeft} hours`}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={c.status === 'RELEASED_USABLE' ? 'success' : c.status === 'QUARANTINED' ? 'warning' : c.status === 'ISSUED_TO_DEPARTMENT' ? 'primary' : 'neutral'}>
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {isPlatelet && hoursLeft < 48 && c.status === 'RELEASED_USABLE' ? (
                      <Button
                        size="sm"
                        variant={hoursLeft < 24 ? 'danger' : 'outline'}
                        onClick={() => handleDispatchWaterfall(c, hoursLeft < 24 ? 'Medical ICU' : 'Hemato-Oncology')}
                        disabled={waterfallDispatched[c.id]}
                      >
                        {waterfallDispatched[c.id] ? '✓ Alerted' : '⚡ Waterfall Ping'}
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400 font-mono">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

