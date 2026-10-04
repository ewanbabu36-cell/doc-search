import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyOverviewMetricsDto, EmergencyEncounterDto, EmergencyZoneDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface InboundAmbulance {
  id: string;
  vehicleNumber: string;
  type: string;
  patientSummary: string;
  acuity: string;
  vitals: { hr: number; bp: string; spo2: number; gcs: string; ecg: string };
  etaMinutes: number;
  distanceKm: number;
  isPreActivated: boolean;
}

export interface MlcIntimationCase {
  id: string;
  patientName: string;
  ageGender: string;
  uhid: string;
  timeOfArrival: string;
  natureOfInjury: string;
  broughtBy: string;
  jurisdictionPs: string;
  status: 'PENDING_DISPATCH' | 'DISPATCHED';
  dispatchAckNumber?: string;
  encryptionHash?: string;
}

export interface CrashCartItem {
  id: string;
  name: string;
  parLevel: number;
  usedCount: number;
  unit: string;
}

interface Props {
  metrics: EmergencyOverviewMetricsDto;
  encounters: EmergencyEncounterDto[];
  zones: EmergencyZoneDto[];
  onRegisterArrival: () => void;
  onActivateDisaster: () => void;
}

export const EmergencyCommandCenterView: React.FC<Props> = ({
  metrics,
  encounters,
  zones,
  onRegisterArrival,
  onActivateDisaster
}) => {
  // Pre-Hospital Telemetry State
  const [inboundAmbulances, setInboundAmbulances] = useState<InboundAmbulance[]>([
    {
      id: 'AMB-ALS-04',
      vehicleNumber: 'DL-01-EQ-9921',
      type: 'ALS (Advanced Life Support)',
      patientSummary: '52M, Severe Crushing Chest Pain radiating to left jaw x 45 min',
      acuity: 'CRITICAL_STEMI',
      vitals: { hr: 114, bp: '86/52', spo2: 89, gcs: '15/15', ecg: 'ST-Elevation in II, III, aVF (Inferior Wall MI)' },
      etaMinutes: 6,
      distanceKm: 2.8,
      isPreActivated: false
    },
    {
      id: 'AMB-BLS-09',
      vehicleNumber: 'DL-04-TR-1044',
      type: 'Trauma Resuscitation Unit',
      patientSummary: '28M, High-speed bike collision vs divider. Blunt abdominal injury',
      acuity: 'RED_TRAUMA',
      vitals: { hr: 128, bp: '92/58', spo2: 94, gcs: '11/15', ecg: 'Sinus Tachycardia' },
      etaMinutes: 14,
      distanceKm: 7.4,
      isPreActivated: false
    }
  ]);
  const [selectedEcgAmbulance, setSelectedEcgAmbulance] = useState<InboundAmbulance | null>(null);

  // 1-Click Digital Police Intimation Gateway State
  const [mlcCases, setMlcCases] = useState<MlcIntimationCase[]>([
    {
      id: 'MLC-2026-0894',
      patientName: 'Vikram Singh',
      ageGender: '32M',
      uhid: 'UHID-2026-00912',
      timeOfArrival: '14:45 IST',
      natureOfInjury: 'Alleged RTA • Multiple contusions, compound fracture right tibia, active bleeding',
      broughtBy: 'PCR Van ASI Rajesh Kumar (Belt #4928, South District)',
      jurisdictionPs: 'Police Station Hauz Khas',
      status: 'DISPATCHED',
      dispatchAckNumber: 'POL-HK-4421',
      encryptionHash: 'SHA256:7f9a1c8902b4e81'
    },
    {
      id: 'MLC-2026-0895',
      patientName: 'Amitesh Verma',
      ageGender: '45M',
      uhid: 'UHID-2026-00915',
      timeOfArrival: '15:10 IST',
      natureOfInjury: 'Alleged Physical Assault • Blunt cranial injury, laceration left temporal region',
      broughtBy: 'Bystander Ravi Gupta (Mobile: 98112-XXXXX)',
      jurisdictionPs: 'Police Station Hauz Khas',
      status: 'PENDING_DISPATCH'
    }
  ]);
  const [selectedMlcForSlip, setSelectedMlcForSlip] = useState<MlcIntimationCase | null>(null);
  const [isDispatchingMlc, setIsDispatchingMlc] = useState(false);

  // Crash Cart Auto-Replenishment & Consumption Telemetry State
  const [crashCartStatus, setCrashCartStatus] = useState<'SEALED' | 'UNSEALED_IN_USE' | 'REPLENISHING'>('SEALED');
  const [currentSealNumber, setCurrentSealNumber] = useState('SEAL-9942');
  const [nextSealNumber] = useState('SEAL-9943');
  const [replenishCourierEta] = useState(165); // 2m 45s
  const [crashCartItems, setCrashCartItems] = useState<CrashCartItem[]>([
    { id: 'item-1', name: 'Inj. Adrenaline (Epinephrine) 1mg/1mL', parLevel: 5, usedCount: 2, unit: 'Amps' },
    { id: 'item-2', name: 'Inj. Atropine Sulfate 0.6mg/1mL', parLevel: 5, usedCount: 3, unit: 'Amps' },
    { id: 'item-3', name: 'Inj. Amiodarone Hydrochloride 150mg/3mL', parLevel: 2, usedCount: 1, unit: 'Amps' },
    { id: 'item-4', name: 'Endotracheal Tube (Size 7.5 Cuffed)', parLevel: 2, usedCount: 1, unit: 'Pcs' },
    { id: 'item-5', name: 'Defibrillator Adult Pacing / Shock Pads', parLevel: 2, usedCount: 1, unit: 'Pairs' }
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePreActivateCathLab = (ambId: string, alertType: string) => {
    setInboundAmbulances((prev) =>
      prev.map((a) => (a.id === ambId ? { ...a, isPreActivated: true } : a))
    );
    const amb = inboundAmbulances.find((a) => a.id === ambId);
    if (amb) {
      hospitalEventBus.publish(
        'CATH_LAB_PRE_ACTIVATED',
        'PreHospitalEmergencyCommand',
        {
          ambulanceId: amb.id,
          alertType,
          vitals: amb.vitals,
          etaMinutes: amb.etaMinutes
        },
        `🚨 Inbound Pre-Hospital Alert: ${alertType} pre-activated for incoming ${amb.id} (${amb.etaMinutes}m ETA)`
      );
      showToast(`⚡ Cath-Lab & STEMI Alert Pre-Activated for ${amb.id}!`);
    }
  };

  const handleDispatchPoliceIntimation = (caseId: string) => {
    setIsDispatchingMlc(true);
    setTimeout(() => {
      const ack = `POL-HK-${Math.floor(1000 + Math.random() * 9000)}`;
      const hash = `SHA256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 8)}`;
      setMlcCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? { ...c, status: 'DISPATCHED', dispatchAckNumber: ack, encryptionHash: hash }
            : c
        )
      );
      setIsDispatchingMlc(false);
      hospitalEventBus.publish(
        'POLICE_INTIMATION_DISPATCHED',
        'EmergencyMLCGateway',
        { caseId, jurisdictionPs: 'Police Station Hauz Khas', ackNumber: ack, hash },
        `🚔 1-Click Police Intimation Dispatched for ${caseId} to PS Hauz Khas (Ack: ${ack})`
      );
      showToast(`🚔 1-Click Digital Police Intimation Dispatched to PS Hauz Khas (Ack: ${ack})!`);
    }, 600);
  };

  const handleUnsealCrashCart = () => {
    setCrashCartStatus('UNSEALED_IN_USE');
    hospitalEventBus.publish(
      'SYSTEM_TELEMETRY_PULSE',
      'CrashCartTelemetry',
      { cartId: 'CC-TRAUMA-01', brokenSeal: currentSealNumber, status: 'UNSEALED' },
      `🚨 Crash Cart #CC-TRAUMA-01 unsealed (Broken Seal: ${currentSealNumber}) for acute resuscitation.`
    );
    showToast(`🚨 Crash Cart #CC-TRAUMA-01 Unsealed! Verification & Consumption Tracking Active.`);
  };

  const handleUpdateItemUsage = (itemId: string, delta: number) => {
    setCrashCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, usedCount: Math.max(0, Math.min(item.parLevel, item.usedCount + delta)) }
          : item
      )
    );
  };

  const handleTriggerCrashCartReplenish = () => {
    setCrashCartStatus('REPLENISHING');
    const totalUsed = crashCartItems.reduce((acc, curr) => acc + curr.usedCount, 0);
    hospitalEventBus.publish(
      'CRASH_CART_REPLENISH_TRIGGERED',
      'CrashCartConsumptionEngine',
      {
        cartId: 'CC-TRAUMA-01',
        indentNumber: 'IND-EMERG-881',
        totalItemsReplenished: totalUsed,
        vaultReservationReleased: true,
        dispatchedRunner: 'Ramesh Kumar',
        assignedNewSeal: nextSealNumber
      },
      `⚡ Crash Cart Auto-Replenish: Indent #IND-EMERG-881 generated. Central Vault lock released; Runner dispatched with new seal ${nextSealNumber}.`
    );
    showToast(`⚡ Pharmacy Central Vault Lock Released! Runner dispatched with replacement kit & Seal #${nextSealNumber}!`);
  };

  const handleAcknowledgeReplenishComplete = () => {
    setCrashCartStatus('SEALED');
    setCurrentSealNumber(nextSealNumber);
    setCrashCartItems((prev) => prev.map((item) => ({ ...item, usedCount: 0 })));
    showToast(`✓ Crash Cart #CC-TRAUMA-01 Re-Sealed with #${nextSealNumber}! Daily Readiness Restored.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight">Emergency Department Live Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time acute triage acuity, trauma bays, Code Blue resuscitation telemetry, and ED bed census</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={onRegisterArrival}>+ New Emergency Arrival</Button>
          <Button variant="danger" onClick={onActivateDisaster}>🚨 Disaster / MCI Mode</Button>
        </div>
      </div>

      {/* Pre-Hospital Telemetry Inbound Dashboard */}
      <div className="bg-slate-950 border border-red-900/60 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🚑</span>
            <div>
              <h2 className="text-base font-black text-red-400 uppercase tracking-wider">
                Pre-Hospital Telemetry Inbound Streaming Dashboard
              </h2>
              <p className="text-xs text-slate-400">
                Live 12-lead ECG, continuous SpO2, and GPS casualty ETA streaming from en-route ambulances
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
            ● GPS TELEMETRY LIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {inboundAmbulances.map((amb) => (
            <div
              key={amb.id}
              className={`p-4 rounded-xl border ${
                amb.isPreActivated ? 'border-emerald-600 bg-emerald-950/20' : 'border-red-800/80 bg-slate-900/80'
              } flex flex-col justify-between gap-3`}
            >
              <div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white font-mono">{amb.id}</span>
                    <span className="text-xs text-slate-400">({amb.type})</span>
                  </div>
                  <span className="text-xs font-black font-mono text-amber-300 bg-amber-950/60 border border-amber-800 px-2.5 py-0.5 rounded">
                    ⏱️ ETA: {amb.etaMinutes}m ({amb.distanceKm} km)
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-semibold mt-2">{amb.patientSummary}</p>

                {/* Live Vitals & ECG Stream Strip */}
                <div className="mt-3 bg-black/60 border border-slate-800 rounded-lg p-3 font-mono text-xs">
                  <div className="grid grid-cols-4 gap-2 text-center border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-slate-500 block text-[10px]">HR</span>
                      <strong className="text-red-400">{amb.vitals.hr} bpm</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">BP</span>
                      <strong className="text-amber-400">{amb.vitals.bp}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">SpO2</span>
                      <strong className="text-cyan-400">{amb.vitals.spo2}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">GCS</span>
                      <strong className="text-white">{amb.vitals.gcs}</strong>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-red-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📈</span>
                      <span>12-Lead ECG: <strong>{amb.vitals.ecg}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEcgAmbulance(amb)}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer bg-transparent border-0 p-0"
                    >
                      View Waveform Strip ↗
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400">
                  {amb.isPreActivated ? '✓ Cath-Lab Team On Standby in OT-3' : 'Awaiting Trauma/Cath Pre-Activation'}
                </span>
                <Button
                  size="sm"
                  variant={amb.isPreActivated ? 'outline' : 'danger'}
                  onClick={() => handlePreActivateCathLab(amb.id, amb.acuity)}
                  disabled={amb.isPreActivated}
                >
                  {amb.isPreActivated
                    ? '✓ Team On Standby'
                    : amb.acuity === 'CRITICAL_STEMI'
                    ? '⚡ Pre-Activate Cath-Lab & STEMI Code'
                    : '⚡ Pre-Activate Red Trauma Bay'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1-CLICK POLICE INTIMATION & CRASH CART CONSUMPTION TELEMETRY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: 1-Click Digital Police Intimation Gateway */}
        <Card className="p-5 border-l-4 border-l-indigo-600 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚔</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    1-Click Digital Police Intimation Gateway
                  </h2>
                  <p className="text-xs text-gray-500">
                    Jurisdiction: <strong>Police Station Hauz Khas</strong> • Instant Encrypted MLC Intimation
                  </p>
                </div>
              </div>
              <Badge variant="primary">Standardized Form 1</Badge>
            </div>

            <div className="space-y-3 mt-4">
              {mlcCases.map((mlc) => {
                const isDispatched = mlc.status === 'DISPATCHED';
                return (
                  <div
                    key={mlc.id}
                    className={`p-3.5 rounded-xl border ${
                      isDispatched ? 'bg-indigo-50/40 border-indigo-200' : 'bg-amber-50/40 border-amber-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-indigo-950">{mlc.id}</span>
                          <span className="text-xs font-semibold text-gray-700">
                            {mlc.patientName} ({mlc.ageGender})
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          UHID: {mlc.uhid} • Arrival: {mlc.timeOfArrival}
                        </p>
                      </div>
                      <Badge variant={isDispatched ? 'success' : 'warning'}>
                        {isDispatched ? `✓ Dispatched (${mlc.dispatchAckNumber})` : 'Pending Intimation'}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-800 font-medium mt-2 bg-white/80 p-2 rounded border border-gray-200">
                      <strong>Injuries:</strong> {mlc.natureOfInjury}
                    </p>

                    <div className="mt-2 text-[11px] text-gray-600 flex justify-between items-center">
                      <span>Brought By: <strong>{mlc.broughtBy}</strong></span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-200/80 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedMlcForSlip(mlc)}
                      >
                        📄 View Intimation Memo
                      </Button>
                      {!isDispatched ? (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isDispatchingMlc}
                          onClick={() => handleDispatchPoliceIntimation(mlc.id)}
                          style={{ backgroundColor: '#4F46E5', color: '#FFFFFF' }}
                        >
                          {isDispatchingMlc ? '⏳ Dispatching...' : '⚡ 1-Click Police Dispatch'}
                        </Button>
                      ) : (
                        <span className="text-[11px] font-mono text-indigo-700 font-bold">
                          Token: {mlc.encryptionHash?.substring(0, 18)}...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
            ⚖️ Compliant with Section 39 CrPC & State Medico-Legal Code. Dispatches direct to jurisdictional CCTNS / Police Intimation Portal.
          </div>
        </Card>

        {/* Module 2: Auto-Replenish Crash Cart Trigger & Dynamic Consumption Telemetry */}
        <Card className="p-5 border-l-4 border-l-red-600 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Auto-Replenish Crash Cart & Consumption Telemetry
                  </h2>
                  <p className="text-xs text-gray-500">
                    Bay 1 Emergency Resuscitation Unit • Dynamic Central Vault Replenish
                  </p>
                </div>
              </div>
              <Badge variant={crashCartStatus === 'SEALED' ? 'success' : crashCartStatus === 'REPLENISHING' ? 'info' : 'danger'}>
                {crashCartStatus === 'SEALED' ? `🔒 SEALED (#${currentSealNumber})` : crashCartStatus === 'REPLENISHING' ? '🏃 REPLENISHING' : '⚠️ UNSEALED'}
              </Badge>
            </div>

            {crashCartStatus === 'SEALED' ? (
              <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-200 mt-4 text-center">
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="font-bold text-sm text-emerald-900">Tamper-Evident Seal #{currentSealNumber} Intact</h3>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  Daily morning nursing checklist verified. Defibrillator, airway, and all 5 emergency drug trays are at 100% par levels.
                </p>
                <div className="mt-4">
                  <Button
                    variant="danger"
                    onClick={handleUnsealCrashCart}
                    style={{ backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: 800 }}
                  >
                    🚨 Unseal Crash Cart for Resuscitation
                  </Button>
                </div>
              </div>
            ) : crashCartStatus === 'UNSEALED_IN_USE' ? (
              <div className="mt-4 space-y-3">
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 font-semibold flex items-center justify-between">
                  <span>🚨 Seal #{currentSealNumber} Broken • Code Blue / Acute Resuscitation in Progress</span>
                  <Badge variant="danger">Active Code</Badge>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-700 flex justify-between">
                    <span>Emergency Consumable / Drug</span>
                    <span>Used / Par Level</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {crashCartItems.map((item) => (
                      <div key={item.id} className="px-3 py-2 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-gray-900">{item.name}</strong>
                          <span className="text-gray-500 block text-[10px]">Standard Par: {item.parLevel} {item.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemUsage(item.id, -1)}
                            className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="font-bold font-mono text-sm w-5 text-center text-red-600">{item.usedCount}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemUsage(item.id, 1)}
                            className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={handleTriggerCrashCartReplenish}
                  style={{ width: '100%', padding: '10px', fontWeight: 800, backgroundColor: '#0284C7', color: '#FFFFFF' }}
                >
                  ⚡ Auto-Replenish & Release Pharmacy Central Vault Lock
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
                  <span>⚡</span>
                  <span>Pharmacy Central Vault Emergency Lock Released</span>
                </div>
                <div className="text-xs text-sky-800 space-y-1">
                  <p>• Emergency Indent <strong>#IND-EMERG-881</strong> auto-generated in Pharmacy Outbox.</p>
                  <p>• On-duty runner <strong>Ramesh Kumar</strong> dispatched to Bay 1 with replacement kit.</p>
                  <p>• Assigned Tamper-Evident Replacement Seal: <strong className="font-mono text-sky-950">#{nextSealNumber}</strong></p>
                  <p className="font-bold text-sky-900 pt-1">
                    ⏱️ Courier Delivery ETA: {Math.floor(replenishCourierEta / 60)}m {replenishCourierEta % 60}s remaining
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={handleAcknowledgeReplenishComplete}
                  style={{ width: '100%', backgroundColor: '#10B981', color: '#FFFFFF', fontWeight: 800 }}
                >
                  ✓ Acknowledge Courier Arrival & Apply New Seal #{nextSealNumber}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
            🏥 Closed-Loop Telemetry: Auto-deducts from Central Pharmacy Vault and logs batch/expiry to prevent missing resuscitation drugs.
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-l-4 border-l-red-600">
          <p className="text-xs font-bold text-gray-500 uppercase">ESI 1 Resuscitation</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{metrics.esi1Count}</p>
          <p className="text-xs text-red-700 font-medium mt-1">Immediate</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase">ESI 2 Emergent</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.esi2Count}</p>
          <p className="text-xs text-gray-500 mt-1">High Risk</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <p className="text-xs font-bold text-gray-500 uppercase">ESI 3 Urgent</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{metrics.esi3Count}</p>
          <p className="text-xs text-gray-500 mt-1">Multi-Resource</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Active ED Census</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{metrics.activeEDCensus}</p>
          <p className="text-xs text-gray-500 mt-1">Total in ED</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Trauma Alerts</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.activeTraumaAlerts}</p>
          <p className="text-xs text-purple-700 font-medium mt-1">Level 1/2 Shock</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Avg Door-to-Doc</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.averageDoorToDoctorMinutes}m</p>
          <p className="text-xs text-gray-500 mt-1">Triage: {metrics.averageDoorToTriageMinutes}m</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Zone Capacity & Occupancy</h2>
          <div className="space-y-3">
            {zones.map((z) => (
              <div key={z.id} className="p-3 rounded-lg border bg-gray-50/50 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-gray-900">{z.zoneName}</p>
                  <p className="text-xs text-gray-500">{z.zoneType} • ₹{z.chargePerHour}/hr</p>
                </div>
                <div className="text-right">
                  <Badge variant={z.occupiedCount >= z.capacity ? 'danger' : 'success'}>
                    {z.occupiedCount} / {z.capacity} Beds
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Active High-Acuity Cases</h2>
          <div className="space-y-3">
            {encounters.filter(e => e.triageEsiLevel === 'ESI_1_IMMEDIATE_RESUSCITATION' || e.triageEsiLevel === 'ESI_2_EMERGENT_HIGH_RISK').map((e) => (
              <div key={e.id} className="p-3 rounded-lg border border-red-200 bg-red-50/30">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-red-900">{e.patientName}</span>
                  <Badge variant="danger">{e.triageEsiLevel?.replace('_', ' ')}</Badge>
                </div>
                <p className="text-xs text-gray-700 mt-1">{e.chiefComplaint}</p>
                <p className="text-xs text-gray-500 mt-1">Zone: <strong>{e.currentZoneName || 'Triage'}</strong> • MD: <strong>{e.assignedPhysicianName || 'Unassigned'}</strong></p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 12-LEAD ECG PREVIEW MODAL */}
      {selectedEcgAmbulance && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  <h3 className="font-bold text-base text-red-400">
                    Pre-Hospital Inbound 12-Lead ECG Stream • {selectedEcgAmbulance.id}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Patient: {selectedEcgAmbulance.patientSummary} • ETA: {selectedEcgAmbulance.etaMinutes} mins
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEcgAmbulance(null)}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer bg-transparent border-0"
              >
                ✕
              </button>
            </div>

            {/* Simulated 12-Lead ECG Monitor Canvas */}
            <div className="mt-4 bg-black rounded-xl p-4 border border-emerald-900/60 font-mono text-xs">
              <div className="flex justify-between items-center text-emerald-400 text-[11px] pb-2 border-b border-emerald-950">
                <span>LEAD II (Rhythm Strip) • 25 mm/s • 10 mm/mV</span>
                <span className="text-red-400 font-bold">HR: {selectedEcgAmbulance.vitals.hr} bpm | SpO2: {selectedEcgAmbulance.vitals.spo2}%</span>
              </div>

              {/* Animated/Rendered Waveform Display */}
              <div className="h-28 flex items-center justify-center my-3 relative overflow-hidden bg-emerald-950/20 rounded border border-emerald-900/30">
                <svg className="w-full h-full text-emerald-400" viewBox="0 0 600 100" preserveAspectRatio="none">
                  <path
                    d="M 0 50 L 50 50 L 60 40 L 70 60 L 80 50 L 100 50 L 110 50 L 115 55 L 120 10 L 125 75 L 130 50 L 140 35 L 160 45 L 200 50 L 250 50 L 260 40 L 270 60 L 280 50 L 300 50 L 310 50 L 315 55 L 320 10 L 325 75 L 330 50 L 340 35 L 360 45 L 400 50 L 450 50 L 460 40 L 470 60 L 480 50 L 500 50 L 510 50 L 515 55 L 520 10 L 525 75 L 530 50 L 540 35 L 560 45 L 600 50"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                </svg>
                <div className="absolute top-2 left-3 bg-red-900/80 text-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
                  ⚠️ ST ELEVATION &gt; 2.5mm DETECTED (INFERIOR WALL)
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                <div>QRS Duration: <strong className="text-white">88 ms</strong></div>
                <div>QT / QTc: <strong className="text-white">390 / 422 ms</strong></div>
                <div>PR Interval: <strong className="text-white">142 ms</strong></div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedEcgAmbulance(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handlePreActivateCathLab(selectedEcgAmbulance.id, selectedEcgAmbulance.acuity);
                  setSelectedEcgAmbulance(null);
                }}
              >
                ⚡ Pre-Activate Cath-Lab & STEMI Alert
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARDIZED DIGITAL POLICE INTIMATION SLIP MODAL */}
      {selectedMlcForSlip && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 text-gray-900 shadow-2xl border border-gray-300">
            <div className="flex justify-between items-start pb-3 border-b border-gray-200">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 uppercase">Government / State Police Form 1</span>
                <h3 className="font-bold text-lg text-gray-900">
                  Standardized Medico-Legal Police Intimation Slip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMlcForSlip(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-lg cursor-pointer bg-transparent border-0"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-200">
                <div>MLC Reference No: <strong className="font-mono text-indigo-700">{selectedMlcForSlip.id}</strong></div>
                <div>Patient UHID: <strong className="font-mono">{selectedMlcForSlip.uhid}</strong></div>
                <div>Date & Time of Arrival: <strong>2026-10-04 • {selectedMlcForSlip.timeOfArrival}</strong></div>
                <div>Police Station: <strong>{selectedMlcForSlip.jurisdictionPs}</strong></div>
              </div>

              <div>
                <span className="text-gray-500 block">Patient Name & Demographics:</span>
                <strong className="text-sm">{selectedMlcForSlip.patientName} ({selectedMlcForSlip.ageGender})</strong>
              </div>

              <div>
                <span className="text-gray-500 block">Brought By / Investigating Official:</span>
                <strong>{selectedMlcForSlip.broughtBy}</strong>
              </div>

              <div>
                <span className="text-gray-500 block">Alleged History & Clinical Injury Finding:</span>
                <div className="p-2 bg-white rounded border border-gray-200 text-gray-800 mt-0.5">
                  {selectedMlcForSlip.natureOfInjury}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                <div>Consciousness Status: <strong>Conscious / Oriented (GCS 15)</strong></div>
                <div>Smell of Alcohol: <strong>Negative</strong></div>
              </div>

              {selectedMlcForSlip.status === 'DISPATCHED' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] mt-2">
                  ✓ <strong>Dispatch Acknowledged by Police Station:</strong> Ref: {selectedMlcForSlip.dispatchAckNumber}
                  <div className="font-mono text-[10px] text-emerald-600 mt-0.5">Hash: {selectedMlcForSlip.encryptionHash}</div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-between items-center">
              <span className="text-[11px] text-gray-500">
                Signed by: Dr. Aryan Sharma (Casualty Medical Officer)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedMlcForSlip(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    showToast(`🖨️ Printing Standardized MLC Police Slip for ${selectedMlcForSlip.id}...`);
                    setSelectedMlcForSlip(null);
                  }}
                >
                  🖨️ Print MLC Slip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3">
          <span>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
